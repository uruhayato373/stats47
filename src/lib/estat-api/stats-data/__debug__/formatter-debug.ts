/**
 * EstatStatsDataFormatter デバッグスクリプト
 * 
 * フォーマッターの変換結果を目視確認するための専用スクリプト
 * 実行方法: npm run debug:formatter
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EstatStatsDataFormatter } from '../formatter';
import type { EstatStatsDataResponse, FormattedEstatData } from '../../types';

// 出力ディレクトリの確保
const outputDir = join(__dirname, 'output');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  // ディレクトリが既に存在する場合は無視
}

// モックデータの読み込み
const mockDataPath = join(process.cwd(), 'data/mock/statsdata/prefecture/0000010101_A1101.json');
const mockDataContent = readFileSync(mockDataPath, 'utf-8');
const mockData = JSON.parse(mockDataContent) as EstatStatsDataResponse;

// フォーマッター実行
const startTime = performance.now();
const result = EstatStatsDataFormatter.formatStatsData(mockData);
const endTime = performance.now();
const processingTime = endTime - startTime;

// 統計情報の計算
const validValues = result.values.filter(v => v.value !== null).length;
const nullValues = result.values.length - validValues;
const completenessScore = result.metadata.quality?.completenessScore || 0;

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
  join(outputDir, 'formatter-full.json'),
  JSON.stringify(fullOutput, null, 2)
);

// 2. 個別JSONファイルの出力
writeFileSync(
  join(outputDir, 'tableInfo.json'),
  JSON.stringify(result.tableInfo, null, 2)
);

writeFileSync(
  join(outputDir, 'areas.json'),
  JSON.stringify(result.areas, null, 2)
);

writeFileSync(
  join(outputDir, 'categories.json'),
  JSON.stringify(result.categories, null, 2)
);

writeFileSync(
  join(outputDir, 'years.json'),
  JSON.stringify(result.years, null, 2)
);

writeFileSync(
  join(outputDir, 'values.json'),
  JSON.stringify(result.values, null, 2)
);

writeFileSync(
  join(outputDir, 'metadata.json'),
  JSON.stringify(result.metadata, null, 2)
);

writeFileSync(
  join(outputDir, 'notes.json'),
  JSON.stringify(result.notes, null, 2)
);

