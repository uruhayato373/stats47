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

console.log('🔵 デバッグスクリプト開始');
console.log(`📁 モックデータ: ${mockDataPath}`);
console.log(`📁 出力先: ${outputDir}`);

// フォーマッター実行
console.log('\n⚙️ フォーマッター実行中...');
const startTime = performance.now();
const result = EstatStatsDataFormatter.formatStatsData(mockData);
const endTime = performance.now();
const processingTime = endTime - startTime;

console.log(`✅ フォーマッター完了 (${processingTime.toFixed(2)}ms)`);

// 統計情報の計算
const validValues = result.values.filter(v => v.value !== null).length;
const nullValues = result.values.length - validValues;
const completenessScore = result.metadata.quality?.completenessScore || 0;

// 1. 完全版JSONの出力
console.log('\n📄 完全版JSONを出力中...');
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

// 2. サマリー版JSONの出力
console.log('📄 サマリー版JSONを出力中...');
const summaryOutput = {
  executedAt: new Date().toISOString(),
  processingTime: `${processingTime.toFixed(2)}ms`,
  tableInfo: {
    id: result.tableInfo.id,
    title: result.tableInfo.title,
    statName: result.tableInfo.statName,
    govOrg: result.tableInfo.govOrg,
    statCode: result.tableInfo.statCode,
    govOrgCode: result.tableInfo.govOrgCode,
    dates: result.tableInfo.dates,
    characteristics: result.tableInfo.characteristics,
  },
  metadata: {
    stats: result.metadata.stats,
    range: result.metadata.range,
    quality: result.metadata.quality,
  },
  sampleValues: result.values.slice(0, 5).map(v => ({
    value: v.value,
    unit: v.unit,
    area: v.dimensions.area,
    time: v.dimensions.time,
    cat01: v.dimensions.cat01,
  })),
  statistics: {
    totalValues: result.values.length,
    validValues,
    nullValues,
    completenessScore,
    processingSpeed: `${Math.round((result.values.length / processingTime) * 1000).toLocaleString()}件/秒`,
  },
  notes: result.notes,
};

writeFileSync(
  join(outputDir, 'formatter-summary.json'),
  JSON.stringify(summaryOutput, null, 2)
);

// 3. 統計情報の詳細出力
console.log('📄 統計情報を出力中...');
const statsOutput = {
  executedAt: new Date().toISOString(),
  performance: {
    processingTime: `${processingTime.toFixed(2)}ms`,
    recordsPerSecond: Math.round((result.values.length / processingTime) * 1000),
    memoryUsage: process.memoryUsage(),
  },
  dataQuality: {
    totalRecords: result.values.length,
    validValues,
    nullValues,
    nullPercentage: ((nullValues / result.values.length) * 100).toFixed(2) + '%',
    completenessScore: completenessScore + '%',
  },
  dimensions: {
    areas: {
      total: result.areas.length,
      levels: result.areas.reduce((acc, area) => {
        const level = area.level || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    categories: {
      total: result.categories.length,
      byClassId: result.categories.reduce((acc, cat) => {
        const classId = cat.classId;
        acc[classId] = (acc[classId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    years: {
      total: result.years.length,
      range: result.metadata.range?.years,
    },
  },
  tableInfo: {
    basic: {
      id: result.tableInfo.id,
      title: result.tableInfo.title,
      statName: result.tableInfo.statName,
      govOrg: result.tableInfo.govOrg,
    },
    codes: {
      statCode: result.tableInfo.statCode,
      govOrgCode: result.tableInfo.govOrgCode,
    },
    dates: result.tableInfo.dates,
    characteristics: result.tableInfo.characteristics,
    classification: result.tableInfo.classification,
  },
};

writeFileSync(
  join(outputDir, 'formatter-stats.json'),
  JSON.stringify(statsOutput, null, 2)
);

// 4. コンソール出力
console.log('\n📊 変換結果サマリー');
console.log('='.repeat(50));
console.log(`📋 統計表ID: ${result.tableInfo.id}`);
console.log(`📋 統計表名: ${result.tableInfo.title}`);
console.log(`📋 政府統計名: ${result.tableInfo.statName}`);
console.log(`📋 作成機関: ${result.tableInfo.govOrg}`);
console.log(`📋 統計コード: ${result.tableInfo.statCode}`);
console.log(`📋 機関コード: ${result.tableInfo.govOrgCode}`);
console.log('');
console.log(`⏱️  処理時間: ${processingTime.toFixed(2)}ms`);
console.log(`🚀 処理速度: ${Math.round((result.values.length / processingTime) * 1000).toLocaleString()}件/秒`);
console.log('');
console.log(`📊 データ統計:`);
console.log(`  - 総レコード数: ${result.values.length.toLocaleString()}`);
console.log(`  - 有効値: ${validValues.toLocaleString()}`);
console.log(`  - NULL値: ${nullValues.toLocaleString()}`);
console.log(`  - 完全性スコア: ${completenessScore}%`);
console.log('');
console.log(`🌍 地域情報:`);
console.log(`  - 総地域数: ${result.areas.length}`);
console.log(`  - 都道府県数: ${result.areas.filter(a => a.level === '2').length}`);
console.log(`  - 全国データ: ${result.areas.some(a => a.areaCode === '00000') ? 'あり' : 'なし'}`);
console.log('');
console.log(`📅 年度情報:`);
console.log(`  - 総年度数: ${result.years.length}`);
if (result.metadata.range?.years) {
  console.log(`  - 年度範囲: ${result.metadata.range.years.min} - ${result.metadata.range.years.max}`);
}
console.log('');
console.log(`📝 注記:`);
console.log(`  - 注記数: ${result.notes.length}`);
if (result.notes.length > 0) {
  result.notes.forEach((note, index) => {
    console.log(`    ${index + 1}. ${note.char}: ${note.description}`);
  });
}

console.log('\n✅ デバッグファイル出力完了');
console.log(`📁 出力先: ${outputDir}`);
console.log('  - formatter-full.json (完全版)');
console.log('  - formatter-summary.json (サマリー版)');
console.log('  - formatter-stats.json (統計情報)');
