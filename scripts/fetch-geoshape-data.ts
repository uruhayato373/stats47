/**
 * 歴史的行政区域データセットからTopoJSONを取得するスクリプト
 *
 * 使用方法:
 * npm run fetch:geoshape -- --year 2023 --level prefecture
 *
 * データソース:
 * - 歴史的行政区域データセットβ版（CODH）: https://geoshape.ex.nii.ac.jp/city/
 * - ライセンス: CC BY 4.0
 * - 出典表記: 「歴史的行政区域データセットβ版（CODH作成）」
 */

import fs from "fs/promises";
import path from "path";

import fetch from "node-fetch";

interface FetchOptions {
  year: number; // 取得する年度（例: 2023）
  level: "prefecture" | "municipality"; // 都道府県 or 市区町村
  output: string; // 出力ディレクトリ
}

const GEOSHAPE_API_BASE = "https://geoshape.ex.nii.ac.jp/city/topojson/";

export async function fetchGeoshapeData(options: FetchOptions) {
  console.log(
    `歴史的行政区域データセット取得開始（${options.year}年, ${options.level}）...`
  );

  // 1. APIエンドポイントの構築
  const endpoint =
    options.level === "prefecture"
      ? `${GEOSHAPE_API_BASE}prefectures/${options.year}.topojson`
      : `${GEOSHAPE_API_BASE}municipalities/${options.year}.topojson`;

  // 2. データ取得
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`データ取得失敗: ${response.statusText}`);
  }

  const topojson = await response.json();

  // 3. メタデータの追加
  const enriched = {
    ...topojson,
    metadata: {
      source: "geoshape_codh",
      year: options.year,
      level: options.level,
      fetchedAt: new Date().toISOString(),
      attribution: "歴史的行政区域データセットβ版（CODH作成）",
      license: "CC BY 4.0",
      url: "https://geoshape.ex.nii.ac.jp/city/",
    },
  };

  // 4. 保存
  const filename =
    options.level === "prefecture"
      ? `japan_prefectures_${options.year}.json`
      : `japan_municipalities_${options.year}.json`;
  const outputPath = path.join(options.output, filename);

  await fs.mkdir(options.output, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(enriched, null, 2));

  console.log(`保存完了: ${outputPath}`);
  console.log(`Features数: ${Object.keys(topojson.objects).length}`);
  console.log("出典: 歴史的行政区域データセットβ版（CODH作成）");
  console.log("ライセンス: CC BY 4.0");

  return enriched;
}

/**
 * 市区町村IDと標準地域コードの対応表を作成
 */
export async function createAreaCodeMapping(topojson: any) {
  const mapping: Array<{
    municipalityId: string;
    standardAreaCode: string;
    name: string;
    prefectureName: string;
  }> = [];

  // TopoJSONから市区町村情報を抽出
  for (const [key, value] of Object.entries(topojson.objects)) {
    const properties = (value as any).properties;
    if (properties) {
      mapping.push({
        municipalityId: properties.id,
        standardAreaCode: properties.code,
        name: properties.name,
        prefectureName: properties.prefecture,
      });
    }
  }

  return mapping;
}

/**
 * メイン実行関数
 */
async function main() {
  const args = process.argv.slice(2);

  // コマンドライン引数の解析
  const options: FetchOptions = {
    year: 2023,
    level: "prefecture",
    output: "./data/geo/topojson/geoshape/",
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case "--year":
        options.year = parseInt(value, 10);
        break;
      case "--level":
        if (value === "prefecture" || value === "municipality") {
          options.level = value;
        } else {
          throw new Error('level must be "prefecture" or "municipality"');
        }
        break;
      case "--output":
        options.output = value;
        break;
      default:
        console.warn(`Unknown option: ${key}`);
    }
  }

  try {
    // データ取得
    const topojson = await fetchGeoshapeData(options);

    // 対応表作成（市区町村の場合）
    if (options.level === "municipality") {
      const mapping = await createAreaCodeMapping(topojson);
      const mappingPath = path.join(options.output, "area_code_mapping.json");
      await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
      console.log(`対応表保存完了: ${mappingPath}`);
    }

    console.log("✅ データ取得完了");
  } catch (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}
