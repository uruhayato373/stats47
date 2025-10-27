/**
 * formatStatsData デバッグスクリプト
 *
 * フォーマッターの変換結果を目視確認するための専用スクリプト
 * 実行方法: npm run debug:formatter
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { mockStatsDataMap } from "../../../../../data/mock/estat-api/stats-data";
import { formatStatsData } from "../services/formatter";

import type { EstatStatsDataResponse } from "../types";

// 出力ディレクトリの確保
const outputDir = join(__dirname, "output");
try {
  mkdirSync(outputDir, { recursive: true });
} catch {
  // ディレクトリが既に存在する場合は無視
}

// モックデータの読み込み
const mockData = mockStatsDataMap[
  "0000010101_A1101"
] as unknown as EstatStatsDataResponse;
const mockDataPath =
  "data/mock/estat-api/stats-data/prefecture/0000010101_A1101.json";

// フォーマッター実行
const startTime = performance.now();
const result = formatStatsData(mockData);
const endTime = performance.now();
const processingTime = endTime - startTime;

// 統計情報の計算
const validValues = result.values.filter((v) => v.value !== null).length;
const totalRecords = result.values.length;
console.log(`✅ 処理完了: ${validValues}/${totalRecords} 件の有効値`);

// 1. 完全版JSONの出力
const fullOutput = {
  executedAt: new Date().toISOString(),
  processingTime: `${processingTime.toFixed(2)}ms`,
  inputData: {
    source: mockDataPath,
    tableId: result.tableInfo.id,
    title: result.tableInfo.title,
  },
  result: result,
};

writeFileSync(
  join(outputDir, "formatter-full.json"),
  JSON.stringify(fullOutput, null, 2)
);

// 2. 個別JSONファイルの出力
writeFileSync(
  join(outputDir, "tableInfo.json"),
  JSON.stringify(result.tableInfo, null, 2)
);

// 旧形式の areas, categories, years は削除されたためスキップ

writeFileSync(
  join(outputDir, "values.json"),
  JSON.stringify(result.values, null, 2)
);

writeFileSync(
  join(outputDir, "metadata.json"),
  JSON.stringify(result.metadata, null, 2)
);

writeFileSync(
  join(outputDir, "notes.json"),
  JSON.stringify(result.notes, null, 2)
);
