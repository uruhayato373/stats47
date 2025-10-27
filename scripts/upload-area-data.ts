#!/usr/bin/env tsx

/**
 * Area Data Upload Script
 * MockデータをR2ストレージにアップロードするスクリプト
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ============================================================================
// 設定
// ============================================================================

const MOCK_DATA_DIR = join(process.cwd(), "data", "mock");
const OUTPUT_DIR = join(process.cwd(), "scripts", "output");

// R2バケット設定（環境変数から取得）
const R2_BUCKET_NAME = process.env.R2_AREA_BUCKET_NAME || "stats47-area-data";
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// ============================================================================
// メイン処理
// ============================================================================

async function main() {
  console.log("🚀 Area Data Upload Script Started");
  console.log("=====================================");

  try {
    // 1. 環境変数チェック
    await validateEnvironment();

    // 2. Mockデータの読み込みと検証
    const prefecturesData = await loadAndValidatePrefectures();
    const municipalitiesData = await loadAndValidateMunicipalities();

    // 3. データ変換と最適化
    const optimizedData = await optimizeData(
      prefecturesData,
      municipalitiesData
    );

    // 4. R2ストレージにアップロード
    await uploadToR2(optimizedData);

    // 5. アップロード結果の検証
    await verifyUpload();

    console.log("✅ Area Data Upload Completed Successfully!");
  } catch (error) {
    console.error("❌ Area Data Upload Failed:", error);
    process.exit(1);
  }
}

// ============================================================================
// 環境変数検証
// ============================================================================

async function validateEnvironment(): Promise<void> {
  console.log("🔍 Validating environment variables...");

  if (!R2_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
  }

  if (!R2_API_TOKEN) {
    throw new Error("CLOUDFLARE_API_TOKEN is not set");
  }

  console.log("✅ Environment variables validated");
}

// ============================================================================
// データ読み込みと検証
// ============================================================================

async function loadAndValidatePrefectures(): Promise<any> {
  console.log("📖 Loading prefectures data...");

  const filePath = join(MOCK_DATA_DIR, "prefectures.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  // データ検証
  if (!data.prefectures || !Array.isArray(data.prefectures)) {
    throw new Error("Invalid prefectures data format");
  }

  if (!data.regions || typeof data.regions !== "object") {
    throw new Error("Invalid regions data format");
  }

  console.log(`✅ Loaded ${data.prefectures.length} prefectures`);
  console.log(`✅ Loaded ${Object.keys(data.regions).length} regions`);

  return data;
}

async function loadAndValidateMunicipalities(): Promise<any> {
  console.log("📖 Loading cities data...");

  const filePath = join(MOCK_DATA_DIR, "cities.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  // データ検証（cities.jsonは直接配列形式）
  if (!Array.isArray(data)) {
    throw new Error("Invalid cities data format");
  }

  console.log(`✅ Loaded ${data.length} cities`);

  // 既存の形式に合わせて変換
  return { municipalities: data };
}

// ============================================================================
// データ最適化
// ============================================================================

async function optimizeData(
  prefecturesData: any,
  municipalitiesData: any
): Promise<any> {
  console.log("⚡ Optimizing data...");

  // 都道府県データの最適化
  const optimizedPrefectures = prefecturesData.prefectures.map((pref: any) => ({
    prefCode: pref.prefCode,
    prefName: pref.prefName,
    regionKey: getRegionKeyFromPrefectureCode(pref.prefCode),
  }));

  // 市区町村データの最適化（cities.jsonは既に簡潔な形式）
  const optimizedMunicipalities = municipalitiesData.municipalities.map(
    (city: any) => ({
      cityCode: city.cityCode,
      cityName: city.cityName,
      prefCode: city.prefCode,
      level: city.level,
    })
  );

  // メタデータの追加
  const metadata = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    totalPrefectures: optimizedPrefectures.length,
    totalMunicipalities: optimizedMunicipalities.length,
    totalRegions: Object.keys(prefecturesData.regions).length,
  };

  const optimizedData = {
    metadata,
    prefectures: optimizedPrefectures,
    municipalities: optimizedMunicipalities,
    regions: prefecturesData.regions,
  };

  // ローカルにバックアップ保存
  const outputPath = join(OUTPUT_DIR, "area-data-optimized.json");
  writeFileSync(outputPath, JSON.stringify(optimizedData, null, 2));

  console.log("✅ Data optimization completed");
  console.log(`📁 Optimized data saved to: ${outputPath}`);

  return optimizedData;
}

// ============================================================================
// R2アップロード
// ============================================================================

async function uploadToR2(data: any): Promise<void> {
  console.log("☁️ Uploading to R2 storage...");

  // 個別ファイルとしてアップロード
  const files = [
    {
      key: "area/prefectures.json",
      data: JSON.stringify(
        {
          prefectures: data.prefectures,
          regions: data.regions,
        },
        null,
        2
      ),
    },
    {
      key: "area/cities.json",
      data: JSON.stringify(
        {
          cities: data.municipalities,
        },
        null,
        2
      ),
    },
    {
      key: "area/metadata.json",
      data: JSON.stringify(data.metadata, null, 2),
    },
  ];

  for (const file of files) {
    await uploadFileToR2(file.key, file.data);
    console.log(`✅ Uploaded: ${file.key}`);
  }
}

async function uploadFileToR2(key: string, data: string): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${key}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${R2_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: data,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload ${key}: ${response.status} ${errorText}`);
  }
}

// ============================================================================
// アップロード検証
// ============================================================================

async function verifyUpload(): Promise<void> {
  console.log("🔍 Verifying upload...");

  const files = [
    "area/prefectures.json",
    "area/cities.json",
    "area/metadata.json",
  ];

  for (const file of files) {
    const url = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${file}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Verified: ${file}`);
      } else {
        throw new Error(`Verification failed for ${file}: ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Verification warning for ${file}:`, error);
    }
  }
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const regionMap: Record<string, string> = {
    "01": "hokkaido",
    "02": "tohoku",
    "03": "tohoku",
    "04": "tohoku",
    "05": "tohoku",
    "06": "tohoku",
    "07": "tohoku",
    "08": "kanto",
    "09": "kanto",
    "10": "kanto",
    "11": "kanto",
    "12": "kanto",
    "13": "kanto",
    "14": "kanto",
    "15": "chubu",
    "16": "chubu",
    "17": "chubu",
    "18": "chubu",
    "19": "chubu",
    "20": "chubu",
    "21": "chubu",
    "22": "chubu",
    "23": "chubu",
    "24": "kinki",
    "25": "kinki",
    "26": "kinki",
    "27": "kinki",
    "28": "kinki",
    "29": "kinki",
    "30": "kinki",
    "31": "chugoku",
    "32": "chugoku",
    "33": "chugoku",
    "34": "chugoku",
    "35": "chugoku",
    "36": "shikoku",
    "37": "shikoku",
    "38": "shikoku",
    "39": "shikoku",
    "40": "kyushu",
    "41": "kyushu",
    "42": "kyushu",
    "43": "kyushu",
    "44": "kyushu",
    "45": "kyushu",
    "46": "kyushu",
    "47": "kyushu",
  };

  return regionMap[prefCode] || "unknown";
}


// ============================================================================
// 実行
// ============================================================================

if (require.main === module) {
  main().catch(console.error);
}
