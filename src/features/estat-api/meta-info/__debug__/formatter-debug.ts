/**
 * EstatMetaInfoFormatter デバッグスクリプト
 *
 * フォーマッターの変換結果を目視確認するための専用スクリプト
 * 実行方法: npm run debug:meta-info
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { parseCompleteMetaInfo } from "../services/formatter";

import type { EstatMetaInfoResponse } from "../types";

// 出力ディレクトリの確保（このファイルと同じ階層）
const outputDir = join(__dirname, "output");
try {
  mkdirSync(outputDir, { recursive: true });
} catch {
  // ディレクトリが既に存在する場合は無視
}

// モックデータの読み込み
const mockDataPath = join(
  process.cwd(),
  "data/mock/estat-api/meta-info/prefecture/0000010101.json"
);
const mockDataContent = readFileSync(mockDataPath, "utf-8");
const metaInfoResponse = JSON.parse(mockDataContent) as EstatMetaInfoResponse;

// フォーマッター実行
const startTime = performance.now();
const result = parseCompleteMetaInfo(metaInfoResponse);
const endTime = performance.now();
const processingTime = endTime - startTime;

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

writeFileSync(
  join(outputDir, "categories.json"),
  JSON.stringify(result.dimensions.categories, null, 2)
);

writeFileSync(
  join(outputDir, "areas.json"),
  JSON.stringify(result.dimensions.areas, null, 2)
);

writeFileSync(
  join(outputDir, "timeAxis.json"),
  JSON.stringify(result.dimensions.timeAxis, null, 2)
);
