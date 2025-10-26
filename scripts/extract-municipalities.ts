/**
 * e-Stat metainfoから市区町村データを抽出するスクリプト
 *
 * Usage: npx tsx scripts/extract-municipalities.ts
 */

import fs from "fs";
import path from "path";

interface EstatClass {
  "@code": string;
  "@name": string;
  "@level": string;
  "@parentCode"?: string;
}

// メタデータを削除し、配列のみを出力

// e-Stat構造をそのまま保持するため、変換関数は削除

async function extractMunicipalities() {
  try {
    // e-Stat metainfoファイルを読み込み
    const metainfoPath = path.join(
      process.cwd(),
      "data/mock/metainfo/municipality/0000020201.json"
    );

    if (!fs.existsSync(metainfoPath)) {
      console.error(`Error: File not found: ${metainfoPath}`);
      process.exit(1);
    }

    console.log(`Reading: ${metainfoPath}`);
    const rawData = fs.readFileSync(metainfoPath, "utf-8");
    const data = JSON.parse(rawData);

    // CLASS_OBJから地域データを抽出
    const classObj =
      data.metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;
    const areaClass = classObj.find((obj: any) => obj["@id"] === "area");

    if (!areaClass) {
      console.error("Error: area CLASS_OBJ not found");
      process.exit(1);
    }

    const classes: EstatClass[] = areaClass.CLASS;
    console.log(`Found ${classes.length} area entries`);

    // 市区町村データを抽出（都道府県を除外）
    const municipalities: EstatClass[] = classes.filter(
      (entry) => !entry["@code"].endsWith("000")
    );

    console.log(`Extracted ${municipalities.length} municipalities`);

    // 都道府県ごとの統計
    const stats = municipalities.reduce((acc, munic) => {
      const prefCode = munic["@code"].substring(0, 2);
      acc[prefCode] = (acc[prefCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\nMunicipalities by prefecture:");
    Object.entries(stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([prefCode, count]) => {
        console.log(`  ${prefCode}: ${count}`);
      });

    // 市区町村データをソートして配列として出力
    const output = municipalities.sort((a, b) =>
      a["@code"].localeCompare(b["@code"])
    );

    const outputPath = path.join(
      process.cwd(),
      "data/mock/area/municipalities.json"
    );

    // ディレクトリが存在しない場合は作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`\nOutput written to: ${outputPath}`);

    // ファイルサイズを表示
    const stats_file = fs.statSync(outputPath);
    const fileSizeKB = (stats_file.size / 1024).toFixed(2);
    console.log(`File size: ${fileSizeKB} KB`);

    console.log("\n✅ Extraction completed successfully");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

extractMunicipalities();
