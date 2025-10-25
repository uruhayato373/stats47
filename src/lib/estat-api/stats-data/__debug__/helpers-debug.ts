/**
 * Stats Data Helpers デバッグスクリプト
 * 
 * ヘルパー関数の動作確認と結果出力のための専用スクリプト
 * 実行方法: npm run debug:helpers
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { EstatStatsDataFormatter } from '../formatter';
import {
  filterByArea,
  filterByTime,
  filterByDimension,
  getPrefectures,
  getValidValues,
  getSpecialValues,
  getByAreaLevel,
  groupByArea,
  groupByTime,
  groupByDimension,
  sortByValueDesc,
  sortByValueAsc,
} from '../helpers';

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
const mockData = JSON.parse(mockDataContent);

console.log('🔵 ヘルパー関数デバッグスクリプト開始');
console.log(`📁 モックデータ: ${mockDataPath}`);
console.log(`📁 出力先: ${outputDir}`);

// フォーマッター実行
console.log('\n⚙️ データ整形中...');
const formatted = EstatStatsDataFormatter.formatStatsData(mockData);
const values = formatted.values;

console.log(`✅ データ整形完了 (${values.length}件)`);

// デバッグ実行結果を格納するオブジェクト
const debugResults: Record<string, any> = {
  executedAt: new Date().toISOString(),
  inputData: {
    totalValues: values.length,
    sampleValues: values.slice(0, 3),
  },
  results: {},
};

// 1. フィルタリング関数のテスト
console.log('\n🔍 フィルタリング関数のテスト...');

// filterByArea
const areaCode = values[0].dimensions.area.code;
const areaFiltered = filterByArea(values, areaCode);
debugResults.results.filterByArea = {
  input: { areaCode, totalInput: values.length },
  output: { count: areaFiltered.length, sample: areaFiltered.slice(0, 3) },
};

// filterByTime
const timeCode = values[0].dimensions.time.code;
const timeFiltered = filterByTime(values, timeCode);
debugResults.results.filterByTime = {
  input: { timeCode, totalInput: values.length },
  output: { count: timeFiltered.length, sample: timeFiltered.slice(0, 3) },
};

// filterByDimension (cat01)
const valueWithCat01 = values.find(v => v.dimensions.cat01);
if (valueWithCat01) {
  const cat01Code = valueWithCat01.dimensions.cat01!.code;
  const cat01Filtered = filterByDimension(values, 'cat01', cat01Code);
  debugResults.results.filterByDimension = {
    input: { dimension: 'cat01', code: cat01Code, totalInput: values.length },
    output: { count: cat01Filtered.length, sample: cat01Filtered.slice(0, 3) },
  };
}

// 2. 抽出関数のテスト
console.log('🔍 抽出関数のテスト...');

// getPrefectures
const prefectures = getPrefectures(values);
debugResults.results.getPrefectures = {
  input: { totalInput: values.length },
  output: { count: prefectures.length, sample: prefectures.slice(0, 3) },
};

// getValidValues
const validValues = getValidValues(values);
debugResults.results.getValidValues = {
  input: { totalInput: values.length },
  output: { count: validValues.length, sample: validValues.slice(0, 3) },
};

// getSpecialValues
const specialValues = getSpecialValues(values);
debugResults.results.getSpecialValues = {
  input: { totalInput: values.length },
  output: { count: specialValues.length, sample: specialValues.slice(0, 3) },
};

// getByAreaLevel
const national = getByAreaLevel(values, '1');
const prefectureLevel = getByAreaLevel(values, '2');
debugResults.results.getByAreaLevel = {
  input: { totalInput: values.length },
  output: {
    level1: { count: national.length, sample: national.slice(0, 2) },
    level2: { count: prefectureLevel.length, sample: prefectureLevel.slice(0, 2) },
  },
};

// 3. グループ化関数のテスト
console.log('🔍 グループ化関数のテスト...');

// groupByArea
const areaGrouped = groupByArea(values);
const areaGroupSummary = Array.from(areaGrouped.entries()).map(([code, groupValues]) => ({
  areaCode: code,
  count: groupValues.length,
  sample: groupValues.slice(0, 2),
}));
debugResults.results.groupByArea = {
  input: { totalInput: values.length },
  output: { 
    groupCount: areaGrouped.size,
    groups: areaGroupSummary.slice(0, 5), // 最初の5グループのみ
  },
};

// groupByTime
const timeGrouped = groupByTime(values);
const timeGroupSummary = Array.from(timeGrouped.entries()).map(([code, groupValues]) => ({
  timeCode: code,
  count: groupValues.length,
  sample: groupValues.slice(0, 2),
}));
debugResults.results.groupByTime = {
  input: { totalInput: values.length },
  output: { 
    groupCount: timeGrouped.size,
    groups: timeGroupSummary.slice(0, 5), // 最初の5グループのみ
  },
};

// groupByDimension (cat01)
if (valueWithCat01) {
  const cat01Grouped = groupByDimension(values, 'cat01');
  const cat01GroupSummary = Array.from(cat01Grouped.entries()).map(([code, groupValues]) => ({
    categoryCode: code,
    count: groupValues.length,
    sample: groupValues.slice(0, 2),
  }));
  debugResults.results.groupByDimension = {
    input: { dimension: 'cat01', totalInput: values.length },
    output: { 
      groupCount: cat01Grouped.size,
      groups: cat01GroupSummary.slice(0, 5), // 最初の5グループのみ
    },
  };
}

// 4. ソート関数のテスト
console.log('🔍 ソート関数のテスト...');

// sortByValueDesc
const validSample = validValues.slice(0, 100); // パフォーマンスのため100件のみ
const sortedDesc = sortByValueDesc(validSample);
debugResults.results.sortByValueDesc = {
  input: { count: validSample.length },
  output: { 
    count: sortedDesc.length,
    top5: sortedDesc.slice(0, 5).map(v => ({ value: v.value, area: v.dimensions.area.name })),
    bottom5: sortedDesc.slice(-5).map(v => ({ value: v.value, area: v.dimensions.area.name })),
  },
};

// sortByValueAsc
const sortedAsc = sortByValueAsc(validSample);
debugResults.results.sortByValueAsc = {
  input: { count: validSample.length },
  output: { 
    count: sortedAsc.length,
    top5: sortedAsc.slice(0, 5).map(v => ({ value: v.value, area: v.dimensions.area.name })),
    bottom5: sortedAsc.slice(-5).map(v => ({ value: v.value, area: v.dimensions.area.name })),
  },
};

// 5. 組み合わせテスト
console.log('🔍 組み合わせテスト...');

// 有効な都道府県データのランキング生成
const validPrefectures = getPrefectures(validValues);
const ranking = sortByValueDesc(validPrefectures).slice(0, 10);
debugResults.results.combinationTest = {
  description: '有効な都道府県データのトップ10ランキング',
  steps: [
    'getValidValues()',
    'getPrefectures()',
    'sortByValueDesc()',
    'slice(0, 10)',
  ],
  input: { totalValues: values.length },
  output: { 
    count: ranking.length,
    ranking: ranking.map((v, index) => ({
      rank: index + 1,
      value: v.value,
      area: v.dimensions.area.name,
      time: v.dimensions.time.name,
    })),
  },
};

// 結果をJSONファイルに出力
console.log('\n📄 結果を出力中...');

writeFileSync(
  join(outputDir, 'helpers-debug.json'),
  JSON.stringify(debugResults, null, 2)
);

// コンソール出力
console.log('\n📊 ヘルパー関数テスト結果');
console.log('='.repeat(50));

Object.entries(debugResults.results).forEach(([functionName, result]) => {
  console.log(`\n🔧 ${functionName}:`);
  if ((result as any).input) {
    console.log(`  📥 入力: ${JSON.stringify((result as any).input, null, 2).replace(/\n/g, '\n     ')}`);
  }
  if ((result as any).output) {
    if (typeof (result as any).output === 'object' && (result as any).output.count !== undefined) {
      console.log(`  📤 出力件数: ${(result as any).output.count}`);
    }
    if ((result as any).output.sample) {
      console.log(`  📤 サンプル: ${JSON.stringify((result as any).output.sample, null, 2).replace(/\n/g, '\n     ')}`);
    }
  }
});

console.log('\n✅ ヘルパー関数デバッグ完了');
console.log(`📁 出力先: ${outputDir}/helpers-debug.json`);
