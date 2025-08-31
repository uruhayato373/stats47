import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 環境変数からCloudflare D1の設定を取得
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

    if (!accountId || !apiToken || !databaseId) {
      return NextResponse.json(
        { error: "Cloudflare D1の設定が不完全です" },
        { status: 500 }
      );
    }

    // estat_metadataテーブルから統計情報を取得（重複を除く）
    const sql = `
      SELECT 
        stats_data_id, 
        stat_name, 
        title,
        COUNT(*) as category_count
      FROM estat_metadata
      WHERE stats_data_id IS NOT NULL
      GROUP BY stats_data_id, stat_name, title
      ORDER BY stats_data_id, stat_name
    `;

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
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare D1 API エラー:", errorText);
      return NextResponse.json(
        { error: `Cloudflare D1 API エラー: ${response.status}` },
        { status: response.status }
      );
    }

    const result = (await response.json()) as any;

    if (!result.success) {
      console.error("Cloudflare D1 クエリエラー:", result);
      return NextResponse.json(
        { error: "データベースクエリに失敗しました" },
        { status: 500 }
      );
    }

    // 結果を整形
    const data = result.result[0]?.results || [];

    return NextResponse.json(data);
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
