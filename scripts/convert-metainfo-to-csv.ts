/**
 * eStatメタ情報JSONからCSV変換スクリプト
 *
 * estat-metainfo JSONファイルをmapping.csv形式に変換します
 */

import * as fs from "fs";
import * as path from "path";

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
 * 項目名からitem_codeを生成
 * 既存のmapping.csvのパターンを参考にする
 *
 * 例:
 * - "A1101_総人口" -> "total-population"
 * - "A110101_総人口（男）" -> "total-population-male"
 * - "A110102_総人口（女）" -> "total-population-female"
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
 * JSONファイルからCSVに変換
 */
function convertMetaInfoToCsv(jsonFilePath: string, outputFilePath?: string): void {
  try {
    console.log(`[convertMetaInfoToCsv] JSONファイルを読み込み中: ${jsonFilePath}`);

    // JSONファイルを読み込む
    const fileContent = fs.readFileSync(jsonFilePath, "utf-8");
    const data: MetaInfoData = JSON.parse(fileContent);

    // statsDataIdを取得
    const statsDataId =
      data.statsDataId ||
      data.metaInfo?.GET_META_INFO?.PARAMETER?.STATS_DATA_ID;
    if (!statsDataId) {
      throw new Error("statsDataIdが見つかりません");
    }

    console.log(`[convertMetaInfoToCsv] statsDataId: ${statsDataId}`);

    // cat01の分類情報を取得
    const classInf =
      data.metaInfo?.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    if (!classInf || !Array.isArray(classInf)) {
      throw new Error("CLASS_INFが見つかりません");
    }

    // cat01の分類オブジェクトを探す
    const cat01Obj = classInf.find((obj: any) => obj["@id"] === "cat01");
    if (!cat01Obj || !cat01Obj.CLASS) {
      throw new Error("cat01の分類情報が見つかりません");
    }

    // CLASSが配列か単一オブジェクトかを確認
    const classItems: ClassItem[] = Array.isArray(cat01Obj.CLASS)
      ? cat01Obj.CLASS
      : [cat01Obj.CLASS];

    console.log(
      `[convertMetaInfoToCsv] ${classItems.length}件の分類を検出`
    );

    // CSV行を生成
    const csvLines: string[] = [];
    
    // ヘッダー行
    csvLines.push("stats_data_id,cat01,item_name,item_code,unit");

    // データ行
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

      csvLines.push(row);
    }

    // 出力ファイルパスを決定
    const outputPath =
      outputFilePath ||
      path.join(
        path.dirname(jsonFilePath),
        `mapping-${statsDataId}.csv`
      );

    // CSVファイルに出力
    fs.writeFileSync(outputPath, csvLines.join("\n"), "utf-8");

    console.log(
      `[convertMetaInfoToCsv] ✅ CSVファイルを出力しました: ${outputPath}`
    );
    console.log(
      `[convertMetaInfoToCsv] 出力行数: ${csvLines.length - 1}行（ヘッダー除く）`
    );
  } catch (error) {
    console.error("[convertMetaInfoToCsv] ❌ 変換エラー:", error);
    throw error;
  }
}

/**
 * メイン処理
 */
function main() {
  const jsonFilePath =
    process.argv[2] ||
    "/Users/minamidaisuke/Downloads/estat-metainfo-0000020201-2025-11-01T01-52-57-808Z.json";

  const outputFilePath = process.argv[3]; // オプション

  try {
    convertMetaInfoToCsv(jsonFilePath, outputFilePath);
    process.exit(0);
  } catch (error) {
    console.error("[main] エラー:", error);
    process.exit(1);
  }
}

main();

