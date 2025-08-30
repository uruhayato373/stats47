import { NextRequest, NextResponse } from "next/server";
import { estatAPI } from "@/services/estat-api";
import {
  EstatDataTransformer,
  EstatTransformedData,
} from "@/lib/estat/data-transformer";

// Cloudflare D1に保存する関数（開発・本番環境共通）
async function saveToCloudflareD1(data: EstatTransformedData[]) {
  try {
    console.log("Cloudflare D1に保存するデータ:", data);

    // Cloudflare D1のREST APIを使用してデータを保存
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !databaseId || !apiToken) {
      throw new Error(
        "Cloudflare D1設定が不完全です。環境変数を確認してください。"
      );
    }

    // データを小さなチャンクに分割（API制限対策）
    const CHUNK_SIZE = 50; // Cloudflare D1の制限に合わせて調整
    const chunks = [];

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      chunks.push(data.slice(i, i + CHUNK_SIZE));
    }

    console.log(
      `データを${chunks.length}個のチャンクに分割（各${CHUNK_SIZE}件）`
    );

    const allResults = [];
    let processedCount = 0;
    let errorCount = 0;
    const MAX_ERRORS = parseInt(process.env.MAX_ERRORS || "3"); // 環境変数で設定可能、デフォルト3

    // チャンクごとに順次処理（API制限対策）
    for (const [chunkIndex, chunk] of chunks.entries()) {
      // エラー数が上限に達した場合は処理停止
      if (errorCount >= MAX_ERRORS) {
        console.error(
          `❌ エラー数が上限(${MAX_ERRORS})に達しました。処理を停止します。`
        );
        break;
      }

      console.log(
        `チャンク ${chunkIndex + 1}/${chunks.length} を処理中... (${
          chunk.length
        }件)`
      );

      // 各チャンク内で並列処理（適度な並列性を維持）
      const chunkPromises = chunk.map(async (item) => {
        try {
          // パラメータ化クエリを使用してSQLインジェクションを防ぐ
          const sql = `
            INSERT INTO estat_metadata 
            (stats_data_id, stat_name, title, cat01, item_name, unit, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;

          const params = [
            item.stats_data_id,
            item.stat_name,
            item.title,
            item.cat01 || "",
            item.item_name || "",
            item.unit || "",
          ];

          // 進捗表示
          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(`進捗: ${processedCount}/${data.length} 件処理完了`);
          }

          // Cloudflare D1 REST APIを呼び出し
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sql: sql,
                params: params,
              }),
            }
          );

          if (!response.ok) {
            const errorData = (await response.json()) as {
              errors?: Array<{ message: string }>;
            };
            const errorMessage = `Cloudflare D1 API エラー: ${
              response.status
            } ${errorData.errors?.[0]?.message || "不明なエラー"}`;

            console.error(`❌ データ保存エラー:`, errorMessage);
            errorCount++;

            // エラー数が上限に達した場合は処理停止
            if (errorCount >= MAX_ERRORS) {
              throw new Error(
                `処理停止: エラー数が上限(${MAX_ERRORS})に達しました`
              );
            }

            throw new Error(errorMessage);
          }

          const result = await response.json();
          console.log("✅ Cloudflare D1挿入成功:", result);

          return {
            ...item,
            saved: true,
            timestamp: new Date().toISOString(),
            sql: sql,
            params: params,
            result: result,
            environment: "cloudflare",
            chunkIndex: chunkIndex,
          };
        } catch (insertError) {
          console.error(`❌ データ項目の挿入エラー:`, item, insertError);
          errorCount++;

          return {
            ...item,
            saved: false,
            timestamp: new Date().toISOString(),
            error:
              insertError instanceof Error
                ? insertError.message
                : "不明なエラー",
            environment: "cloudflare",
            chunkIndex: chunkIndex,
          };
        }
      });

      // チャンク内の処理を待機
      const chunkResults = await Promise.all(chunkPromises);
      allResults.push(...chunkResults);

      // エラー数が上限に達した場合は処理停止
      if (errorCount >= MAX_ERRORS) {
        console.error(
          `❌ チャンク ${
            chunkIndex + 1
          } でエラー数が上限に達しました。処理を停止します。`
        );
        break;
      }

      // チャンク間で少し待機（API制限対策）
      if (chunkIndex < chunks.length - 1) {
        console.log("次のチャンク処理まで少し待機中...");
        await new Promise((resolve) => setTimeout(resolve, 200)); // API制限対策で200ms
      }
    }

    // 保存結果のサマリー
    const successCount = allResults.filter((r) => r.saved).length;
    const failureCount = allResults.filter((r) => !r.saved).length;

    console.log(`
Cloudflare D1保存完了
- 成功: ${successCount}件
- 失敗: ${failureCount}件
- 合計: ${allResults.length}件
- 環境: Cloudflare D1
- チャンク数: ${chunks.length}
- チャンクサイズ: ${CHUNK_SIZE}件
- エラー数: ${errorCount}件
- 処理停止: ${errorCount >= MAX_ERRORS ? "はい" : "いいえ"}
    `);

    return allResults;
  } catch (error) {
    console.error("Cloudflare D1保存処理エラー:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statsDataId } = body as { statsDataId: string };

    if (!statsDataId) {
      return NextResponse.json(
        { success: false, error: "統計表IDが必要です" },
        { status: 400 }
      );
    }

    console.log("統計表ID:", statsDataId);

    // e-Stat APIからメタ情報を取得
    const metaInfo = await estatAPI.getMetaInfo({ statsDataId });
    console.log("取得したメタ情報:", metaInfo);

    // 取得したデータをD1用の形式に変換
    const transformedData = EstatDataTransformer.transformToCSVFormat(metaInfo);
    console.log("変換されたデータ:", transformedData);

    // 開発・本番環境共通でCloudflare D1に保存
    console.log("Cloudflare D1に保存中...");
    const result = await saveToCloudflareD1(transformedData);
    const environment = "Cloudflare D1";

    console.log(`${environment}に保存完了`, result);

    return NextResponse.json({
      success: true,
      message: `${statsDataId}のメタ情報を${environment}に保存しました`,
      data: transformedData,
      savedCount: result.filter((r) => r.saved).length,
      totalCount: result.length,
      environment: environment,
      result: result,
    });
  } catch (error) {
    console.error("メタ情報保存エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
