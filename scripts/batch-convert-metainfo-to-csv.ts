/**
 * eStatメタ情報CSV一括変換スクリプト（市区町村版）
 *
 * estat_metainfoテーブルから市区町村（area_type='city'）のstats_data_idを取得し、
 * 各stats_data_idのメタ情報をe-Stat APIまたはR2から取得して、
 * 全てのデータを一つの`mapping_city.csv`ファイルに統合して出力します。
 */

import * as fs from "fs";
import * as path from "path";

/**
 * ローカルSQLiteデータベースへのアクセス
 */
function getLocalD1Database() {
  const Database = require("better-sqlite3");

  // ローカルD1データベースのパスを検索
  const possiblePaths = [
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
    ".wrangler/state/v3/d1",
  ].filter(Boolean);

  let dbPath: string | null = null;

  for (const basePath of possiblePaths) {
    if (!fs.existsSync(basePath)) continue;

    // ディレクトリ内の.sqliteファイルを検索
    const files = fs.readdirSync(basePath, { recursive: true });
    const sqliteFile = files.find((file: string) =>
      typeof file === "string" && file.endsWith(".sqlite")
    );

    if (sqliteFile) {
      dbPath = path.join(basePath, sqliteFile);
      break;
    }

    // ディレクトリ自体が.sqliteファイルの場合
    if (basePath.endsWith(".sqlite")) {
      dbPath = basePath;
      break;
    }
  }

  if (!dbPath || !fs.existsSync(dbPath)) {
    throw new Error("ローカルSQLiteデータベースが見つかりません");
  }

  return new Database(dbPath, { readonly: true });
}

interface ClassItem {
  "@code": string;
  "@name": string;
  "@unit": string;
  "@level"?: string;
}

interface MetaInfoData {
  statsDataId?: string;
  metaInfo?: {
    GET_META_INFO?: {
      PARAMETER?: {
        STATS_DATA_ID?: string;
      };
      METADATA_INF?: {
        CLASS_INF?: {
          CLASS_OBJ?: Array<{
            "@id": string;
            "@name": string;
            CLASS?: ClassItem | ClassItem[];
          }>;
        };
      };
    };
  };
}

/**
 * 括弧内の日本語を英語に変換（補助関数）
 */
function convertJapaneseToEnglish(text: string): string {
  const mapping: Record<string, string> = {
    男: "male",
    女: "female",
    男性: "male",
    女性: "female",
  };

  const normalized = text.trim();
  return mapping[normalized] || normalized.toLowerCase().replace(/[^\w]/g, "");
}

/**
 * 項目名からitem_codeを生成
 * 既存のmapping.csvのパターンを参考にする
 */
function generateItemCodeFromName(name: string, code: string): string {
  // 1. 分類コードのプレフィックス（例: A1101_）を除去
  let cleaned = name.replace(/^[A-Z0-9]+_/, "");

  // 2. 括弧内の情報を抽出（例: 「（男）」「（女）」）
  const parenthesisMatches = cleaned.match(/[（(]([^）)]+)[）)]/g) || [];
  let parentheses = "";
  for (const match of parenthesisMatches) {
    const content = match.replace(/[（(）)]/g, "");
    // 括弧内の内容を英語に変換
    const englishParenthesis = convertJapaneseToEnglish(content);
    if (englishParenthesis) {
      parentheses += "-" + englishParenthesis;
    }
  }

  // 3. 括弧を除去したメイン部分
  let mainText = cleaned.replace(/[（(].*?[）)]/g, "");

  // 4. 既存のmapping.csvのパターンを参考に、主要な日本語→英語のマッピングを適用
  const japaneseToEnglish: Record<string, string> = {
    総人口: "total-population",
    人口: "population",
    日本人人口: "japanese-population",
    年齢中位数: "median-age",
    世帯: "households",
    世帯数: "number-of-households",
    男: "male",
    女: "female",
    歳: "years-old",
    歳以上: "years-and-over",
    歳未満: "years-under",
    未満: "under",
    "～": "-",
    "－": "-",
    "以上": "and-over",
  };

  // メインテキストを英語に変換
  let english = mainText;
  for (const [japanese, englishWord] of Object.entries(japaneseToEnglish)) {
    english = english.replace(new RegExp(japanese, "g"), englishWord);
  }

  // 日本語が残っている場合は、より詳細な変換を試みる
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(english);
  
  if (hasJapanese) {
    // 日本語文字を除去し、残りの部分を使用
    english = english.replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "");
    // それでも空の場合は分類コードベースにフォールバック
    if (!english.trim()) {
      return code.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }
  }

  // 5. 数値の範囲を適切に処理（例: 15～64歳 → 15-64-years-old）
  english = english
    .replace(/(\d+)～(\d+)/g, "$1-$2")
    .replace(/(\d+)-(\d+)歳/g, "$1-$2-years-old")
    .replace(/(\d+)歳/g, "$1-years-old");

  // 6. 小文字に変換し、スペースや特殊文字をハイフンに変換
  english = english
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // 7. 括弧内の情報を追加
  const result = english + parentheses;

  return result || code.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

/**
 * CSV形式の行を生成（エスケープ処理付き）
 */
function escapeCsvValue(value: string): string {
  // カンマ、ダブルクォート、改行が含まれる場合はクォートで囲む
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * e-Stat APIからメタ情報を取得
 */
async function fetchMetaInfoFromEstatApi(
  statsDataId: string
): Promise<MetaInfoData> {
  const ESTAT_API_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
  // constants/index.tsから直接取得（環境変数より優先）
  const ESTAT_APP_ID = process.env.ESTAT_APP_ID || "59eb12e8a25751dfc27f2e48fcdfa8600b86655e";

  const url = `${ESTAT_API_BASE_URL}?appId=${ESTAT_APP_ID}&statsDataId=${statsDataId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      statsDataId,
      metaInfo: data,
    };
  } catch (error) {
    throw new Error(
      `メタ情報の取得に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * メタ情報データからCSV行を生成
 */
function convertMetaInfoToCsvRows(
  data: MetaInfoData,
  csvRows: string[]
): number {
  // statsDataIdを取得
  const statsDataId =
    data.statsDataId ||
    data.metaInfo?.GET_META_INFO?.PARAMETER?.STATS_DATA_ID;
  if (!statsDataId) {
    console.warn(`[convertMetaInfoToCsvRows] statsDataIdが見つかりません`);
    return 0;
  }

  // cat01の分類情報を取得
  const classInf =
    data.metaInfo?.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
  if (!classInf || !Array.isArray(classInf)) {
    console.warn(
      `[convertMetaInfoToCsvRows] CLASS_INFが見つかりません: ${statsDataId}`
    );
    return 0;
  }

  // cat01の分類オブジェクトを探す
  const cat01Obj = classInf.find((obj: any) => obj["@id"] === "cat01");
  if (!cat01Obj || !cat01Obj.CLASS) {
    console.warn(
      `[convertMetaInfoToCsvRows] cat01の分類情報が見つかりません: ${statsDataId}`
    );
    return 0;
  }

  // CLASSが配列か単一オブジェクトかを確認
  const classItems: ClassItem[] = Array.isArray(cat01Obj.CLASS)
    ? cat01Obj.CLASS
    : [cat01Obj.CLASS];

  let rowCount = 0;

  // データ行を生成
  for (const classItem of classItems) {
    const code = classItem["@code"] || "";
    const name = classItem["@name"] || "";
    const unit = classItem["@unit"] || "";

    // item_codeを生成
    const itemCode = generateItemCodeFromName(name, code);

    // cat01の値（コードをそのまま使用、#は付けない）
    const cat01Value = code;

    // CSV行を生成
    const row = [
      escapeCsvValue(statsDataId),
      escapeCsvValue(cat01Value),
      escapeCsvValue(name),
      escapeCsvValue(itemCode),
      escapeCsvValue(unit),
    ].join(",");

    csvRows.push(row);
    rowCount++;
  }

  return rowCount;
}

/**
 * estat_metainfoテーブルから市区町村のstats_data_idを取得
 */
function getCityStatsDataIds(): string[] {
  const db = getLocalD1Database();

  try {
    const stmt = db.prepare(
      `SELECT stats_data_id FROM estat_metainfo WHERE area_type = 'city' ORDER BY stats_data_id`
    );
    const rows = stmt.all() as Array<{ stats_data_id: string }>;

    return rows.map((row) => row.stats_data_id);
  } finally {
    db.close();
  }
}

/**
 * メイン処理
 */
async function main() {
  const outputDir =
    process.argv[2] ||
    path.join(process.env.HOME || "", "Downloads");
  const outputPath = path.join(outputDir, "mapping_city.csv");

  try {
    console.log("[batch-convert-metainfo-to-csv] 市区町村メタ情報CSV変換を開始");

    // 1. 市区町村のstats_data_idを取得
    console.log("[batch-convert-metainfo-to-csv] estat_metainfoテーブルから市区町村のstats_data_idを取得中...");
    const statsDataIds = getCityStatsDataIds();
    console.log(
      `[batch-convert-metainfo-to-csv] ${statsDataIds.length}件のstats_data_idを取得しました`
    );

    if (statsDataIds.length === 0) {
      console.warn(
        "[batch-convert-metainfo-to-csv] 市区町村のstats_data_idが見つかりません"
      );
      process.exit(0);
    }

    // 2. CSV行を生成
    const csvRows: string[] = [];
    
    // ヘッダー行
    csvRows.push("stats_data_id,cat01,item_name,item_code,unit");

    let successCount = 0;
    let failureCount = 0;
    const total = statsDataIds.length;

    // 3. 各stats_data_idについて、メタ情報を取得してCSV変換
    for (let i = 0; i < statsDataIds.length; i++) {
      const statsDataId = statsDataIds[i];
      const progress = `[${i + 1}/${total}]`;

      try {
        console.log(
          `${progress} [batch-convert-metainfo-to-csv] メタ情報を取得中: ${statsDataId}`
        );

        // e-Stat APIからメタ情報を取得
        const metaInfoData = await fetchMetaInfoFromEstatApi(statsDataId);

        // CSV行を生成
        const rowCount = convertMetaInfoToCsvRows(metaInfoData, csvRows);
        
        if (rowCount > 0) {
          console.log(
            `${progress} [batch-convert-metainfo-to-csv] ✅ ${rowCount}行を変換: ${statsDataId}`
          );
          successCount++;
        } else {
          console.warn(
            `${progress} [batch-convert-metainfo-to-csv] ⚠️ 変換データがありません: ${statsDataId}`
          );
          failureCount++;
        }

        // APIレート制限対策: 少し待機
        if (i < statsDataIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(
          `${progress} [batch-convert-metainfo-to-csv] ❌ エラー: ${statsDataId}`,
          error
        );
        failureCount++;
      }
    }

    // 4. CSVファイルに出力
    console.log(
      `[batch-convert-metainfo-to-csv] CSVファイルを出力中: ${outputPath}`
    );
    fs.writeFileSync(outputPath, csvRows.join("\n"), "utf-8");

    console.log(
      `[batch-convert-metainfo-to-csv] ✅ CSVファイルを出力しました: ${outputPath}`
    );
    console.log(
      `[batch-convert-metainfo-to-csv] 出力行数: ${csvRows.length - 1}行（ヘッダー除く）`
    );
    console.log(
      `[batch-convert-metainfo-to-csv] 成功: ${successCount}件、失敗: ${failureCount}件`
    );

    process.exit(0);
  } catch (error) {
    console.error("[batch-convert-metainfo-to-csv] ❌ エラー:", error);
    process.exit(1);
  }
}

main();

