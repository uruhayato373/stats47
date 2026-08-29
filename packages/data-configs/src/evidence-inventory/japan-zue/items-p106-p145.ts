import type {
  JapanZueEvidenceItem,
  JapanZueEvidenceMapping,
  JapanZuePrimarySource,
} from './types';

const CHECKED_AT = '2026-08-29';
const METI_TERMS = 'https://www.meti.go.jp/main/rules.html';
const MAFF_TERMS = 'https://www.maff.go.jp/j/use/link.html';

function officialSource(
  organization: string,
  publicationOrDataset: string,
  datasetId: string,
  url: string,
  termsUrl: string,
  dataYears: string[]
): JapanZuePrimarySource {
  return {
    organization,
    publicationOrDataset,
    datasetId,
    url,
    termsUrl,
    dataYears,
    checkedAt: CHECKED_AT,
    rights: 'allowed',
  };
}

function mapping(
  categoryKey: string,
  geoScopes: JapanZueEvidenceMapping['geoScopes'],
  surveyIds?: string[]
): JapanZueEvidenceMapping {
  return {
    ...(surveyIds ? { surveyIds } : {}),
    categoryKey,
    geoScopes,
    contentRoles: ['theme', 'japan', 'blog', 'youtube'],
  };
}

const ENERGY_JAPAN = mapping('energy', ['japan']);
const ENERGY_WORLD = mapping('energy', ['world']);
const TOTAL_ENERGY_JAPAN = mapping('energy', ['japan'], ['comprehensive-energy-statistics']);
const TRADE_JAPAN = mapping('international', ['japan'], ['trade-statistics']);
const ELECTRICITY_JAPAN = mapping('energy', ['japan'], ['electric-power-statistics']);
const AGRICULTURE_JAPAN = mapping('agriculture', ['japan']);
const AGRICULTURE_WORLD = mapping('agriculture', ['world']);
const AGRICULTURAL_INCOME_JAPAN = mapping('agriculture', ['japan'], [
  'agricultural-income-statistics',
]);
const FOOD_BALANCE_JAPAN = mapping('agriculture', ['japan'], ['food-balance-sheet']);
const CROP_JAPAN = mapping('agriculture', ['japan'], ['crop-statistics']);
const CENSUS_JAPAN = mapping('agriculture', ['japan'], ['agriculture-forestry-census']);
const LABOUR_JAPAN = mapping('laborwage', ['japan'], ['labour-force-survey']);

const ENECHO_TOTAL = officialSource(
  '資源エネルギー庁',
  '総合エネルギー統計',
  'comprehensive-energy-statistics',
  'https://www.enecho.meti.go.jp/statistics/total_energy/results.html',
  METI_TERMS,
  ['1965-2023']
);
const ENECHO_BASIC_PLAN = officialSource(
  '資源エネルギー庁',
  '第7次エネルギー基本計画・2040年度エネルギー需給の見通し',
  'seventh-strategic-energy-plan',
  'https://www.enecho.meti.go.jp/category/others/basic_plan/index.html',
  METI_TERMS,
  ['2023', '2040']
);
const UN_ENERGY_BALANCES = officialSource(
  'United Nations Statistics Division',
  'Energy Balances',
  'unsd-energy-balances',
  'https://unstats.un.org/Unsd/energy/balance/default.htm',
  'https://www.un.org/en/about-us/terms-of-use',
  ['2022']
);
const UN_ENERGY_YEARBOOK = officialSource(
  'United Nations Statistics Division',
  'Energy Statistics Yearbook',
  'unsd-energy-statistics-yearbook',
  'https://unstats.un.org/Unsd/energy/yearbook/default.htm',
  'https://www.un.org/en/about-us/terms-of-use',
  ['2021', '2022']
);
const CUSTOMS_TRADE = officialSource(
  '財務省',
  '貿易統計',
  'customs-trade-statistics',
  'https://www.customs.go.jp/toukei/info/',
  'https://www.customs.go.jp/kiyaku.htm',
  ['1989-2024']
);
const METI_PRODUCTION = officialSource(
  '経済産業省',
  '経済産業省生産動態統計',
  'meti-current-production-statistics',
  'https://www.meti.go.jp/statistics/tyo/seidou/result/ichiran/08_seidou.html',
  METI_TERMS,
  ['1990-2024']
);
const ENECHO_PETROLEUM = officialSource(
  '資源エネルギー庁',
  '資源・エネルギー統計（石油）',
  'petroleum-statistics',
  'https://www.enecho.meti.go.jp/statistics/',
  METI_TERMS,
  ['1990-2024']
);
const ENECHO_ELECTRICITY = officialSource(
  '資源エネルギー庁',
  '電力調査統計',
  'electric-power-statistics',
  'https://www.enecho.meti.go.jp/statistics/electric_power/ep002/',
  METI_TERMS,
  ['1955-2024']
);
const ENECHO_FIT = officialSource(
  '資源エネルギー庁',
  '再生可能エネルギー電気の利用の促進に関する特別措置法 情報公表用ウェブサイト',
  'fit-fip-publication-data',
  'https://www.fit-portal.go.jp/PublicInfoSummary',
  METI_TERMS,
  ['2012-2024']
);
const MAFF_ECONOMIC_ACCOUNTS = officialSource(
  '農林水産省',
  '農業・食料関連産業の経済計算',
  'agriculture-food-industry-economic-accounts',
  'https://www.maff.go.jp/j/tokei/kouhyou/keizai_keisan/',
  MAFF_TERMS,
  ['1960-2023']
);
const MAFF_TRADE = officialSource(
  '農林水産省',
  '農林水産物輸出入概況',
  'maff-agriculture-trade-overview',
  'https://www.maff.go.jp/j/tokei/kouhyou/kokusai/',
  MAFF_TERMS,
  ['1960-2024']
);
const MAFF_AGRICULTURAL_INCOME = officialSource(
  '農林水産省',
  '生産農業所得統計',
  'agricultural-income-statistics',
  'https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/index.html',
  MAFF_TERMS,
  ['1960-2023']
);
const MAFF_FOOD_BALANCE = officialSource(
  '農林水産省',
  '食料需給表',
  'food-balance-sheet',
  'https://www.maff.go.jp/j/tokei/kouhyou/zyukyu/index.html',
  MAFF_TERMS,
  ['1960-2023']
);
const FAOSTAT = officialSource(
  'Food and Agriculture Organization of the United Nations',
  'FAOSTAT',
  'faostat',
  'https://www.fao.org/faostat/en/#home',
  'https://www.fao.org/contact-us/terms/db-terms-of-use/en',
  ['2000-2023']
);
const MAFF_CROP = officialSource(
  '農林水産省',
  '作物統計調査',
  'crop-statistics',
  'https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/',
  MAFF_TERMS,
  ['1960-2024']
);
const MAFF_CENSUS = officialSource(
  '農林水産省',
  '農林業センサス',
  'agriculture-forestry-census',
  'https://www.maff.go.jp/j/tokei/census/afc/2020/index.html',
  MAFF_TERMS,
  ['2000', '2005', '2010', '2015', '2020']
);
const MAFF_STRUCTURE = officialSource(
  '農林水産省',
  '農業構造動態調査',
  'agricultural-structure-dynamics',
  'https://www.maff.go.jp/j/tokei/kouhyou/noukou/',
  MAFF_TERMS,
  ['2000-2024']
);
const LABOUR_FORCE = officialSource(
  '総務省統計局',
  '労働力調査',
  'labour-force-survey',
  'https://www.stat.go.jp/data/roudou/index.html',
  'https://www.stat.go.jp/info/riyou.html',
  ['2000-2024']
);
const MAFF_SIXTH_INDUSTRY = officialSource(
  '農林水産省',
  '6次産業化総合調査',
  'sixth-industry-survey',
  'https://www.maff.go.jp/j/tokei/kouhyou/rokujika/',
  MAFF_TERMS,
  ['2010-2023']
);
const MAFF_ORGANIC = officialSource(
  '農林水産省',
  '有機農業をめぐる事情',
  'organic-agriculture',
  'https://www.maff.go.jp/j/seisan/kankyo/yuuki/',
  MAFF_TERMS,
  ['2009-2023']
);
const MAFF_RICE = officialSource(
  '農林水産省',
  '米をめぐる関係資料',
  'rice-basic-information',
  'https://www.maff.go.jp/j/nousan/kokumotu/kome_data.html',
  MAFF_TERMS,
  ['1960-2024']
);

type ReviewInput = Omit<JapanZueEvidenceItem, 'source'> & { itemNumber?: string };

function reviewedItem(input: ReviewInput): JapanZueEvidenceItem {
  const match = /^japan-zue-2025-26-p(\d{3})-(table|figure|textstat)\d{2}$/.exec(input.id);
  if (!match) throw new Error(`Invalid Japan Zue evidence id: ${input.id}`);

  const [, page, kind] = match;
  const { itemNumber, ...item } = input;
  return {
    ...item,
    source: {
      key: 'japan-zue',
      edition: '2025-26',
      page: Number(page),
      kind: kind === 'textstat' ? 'text-stat' : kind === 'table' ? 'table' : 'figure',
      ...(itemNumber ? { itemNumber } : {}),
    },
  };
}

function production(
  id: string,
  itemNumber: string | undefined,
  topicHint: string,
  sources: JapanZuePrimarySource | readonly JapanZuePrimarySource[],
  evidenceMapping: JapanZueEvidenceMapping,
  resolution: 'combined-analysis' | 'context-only' = 'combined-analysis'
): JapanZueEvidenceItem {
  const sourceFields = Array.isArray(sources)
    ? { primarySources: sources }
    : { primarySource: sources as JapanZuePrimarySource };
  return reviewedItem({
    id,
    ...(itemNumber ? { itemNumber } : {}),
    topicHint,
    resolution,
    ...sourceFields,
    mapping: evidenceMapping,
  });
}

function context(
  id: string,
  topicHint: string,
  source: JapanZuePrimarySource,
  evidenceMapping: JapanZueEvidenceMapping
): JapanZueEvidenceItem {
  return production(id, undefined, topicHint, source, evidenceMapping, 'context-only');
}

function rightsHold(id: string, itemNumber: string | undefined, topicHint: string): JapanZueEvidenceItem {
  return reviewedItem({ id, ...(itemNumber ? { itemNumber } : {}), topicHint, resolution: 'rights-hold' });
}

function notQuantitative(id: string, topicHint: string): JapanZueEvidenceItem {
  return reviewedItem({ id, topicHint, resolution: 'not-quantitative' });
}

/** p106〜145 の原本・一次資料確認済み判断（既存 pilot の p138-textstat02 を除く）。 */
export const JAPAN_ZUE_EVIDENCE_ITEMS_P106_P145: readonly JapanZueEvidenceItem[] = [
  notQuantitative('japan-zue-2025-26-p106-textstat01', '国際情勢の転換点を示す年次中心の導入文'),
  production('japan-zue-2025-26-p106-figure01', '9-2', '部門別の最終エネルギー消費構成の推移', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),
  production('japan-zue-2025-26-p106-table01', undefined, '最終エネルギー消費の構成比を読み解く図表内訳', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),
  production('japan-zue-2025-26-p106-table02', '9-2', 'エネルギー源別の最終消費量の長期推移', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),
  production('japan-zue-2025-26-p106-table03', '9-3', '産業・家庭・運輸別の最終エネルギー消費', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),

  context('japan-zue-2025-26-p107-textstat01', '2040年度の電源構成目標を示す政策文脈', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p107-table01', '9-4', '各国の燃料別エネルギー自給率比較', UN_ENERGY_BALANCES, ENERGY_WORLD),
  rightsHold('japan-zue-2025-26-p108-table01', '9-5', '各国のエネルギー源別国内消費量比較'),

  rightsHold('japan-zue-2025-26-p109-textstat01', undefined, '国内石炭自給率と輸入構造の概況'),
  rightsHold('japan-zue-2025-26-p109-table01', '9-6', '国内石炭生産と輸入の長期推移'),
  rightsHold('japan-zue-2025-26-p109-table02', '9-7', '世界の石炭生産量の国別比較'),

  context('japan-zue-2025-26-p110-textstat01', '石炭輸入先の変化と段階的削減方針', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p110-figure01', '9-3', '世界の石炭生産量と埋蔵量の構成比較'),
  rightsHold('japan-zue-2025-26-p110-table01', undefined, '石炭生産量の国別構成を示す図表内訳'),
  rightsHold('japan-zue-2025-26-p110-table02', undefined, '石炭埋蔵量の国別構成を示す図表内訳'),
  production('japan-zue-2025-26-p110-table03', '9-8', '主要国の石炭輸出入量比較', UN_ENERGY_YEARBOOK, ENERGY_WORLD),
  rightsHold('japan-zue-2025-26-p110-table04', '9-9', '世界の石炭埋蔵量と可採年数'),

  context('japan-zue-2025-26-p111-textstat01', '日本の石油依存と輸入先多角化の経緯', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p111-figure01', '9-4', '原油とLNGの輸入量・金額の長期推移', CUSTOMS_TRADE, TRADE_JAPAN),
  production('japan-zue-2025-26-p111-table01', '9-10', '国内原油生産・輸入・自給率の推移', [METI_PRODUCTION, CUSTOMS_TRADE], ENERGY_JAPAN),

  context('japan-zue-2025-26-p112-textstat01', '原油輸入の中東依存度と供給安定化の課題', CUSTOMS_TRADE, TRADE_JAPAN),
  context('japan-zue-2025-26-p112-textstat02', '原油価格変動と国内価格対策の政策文脈', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p112-figure01', '9-5', '石油・天然ガスの自主開発比率の推移と目標', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p112-table01', '9-11', '原油輸入先と中東依存度の推移', CUSTOMS_TRADE, TRADE_JAPAN),

  production('japan-zue-2025-26-p113-table01', '9-12', '石油製品別の国内生産量推移', METI_PRODUCTION, ENERGY_JAPAN),
  production('japan-zue-2025-26-p113-table02', '9-13', '主要石油製品の輸出入量推移', CUSTOMS_TRADE, TRADE_JAPAN),
  production('japan-zue-2025-26-p113-table03', '9-14', '石油製品別の国内販売量推移', ENECHO_PETROLEUM, ENERGY_JAPAN),

  notQuantitative('japan-zue-2025-26-p114-textstat01', '欧州の天然ガス供給不安を示す出来事中心の説明'),
  rightsHold('japan-zue-2025-26-p114-table01', '9-15', '世界の原油生産量の国別推移'),
  rightsHold('japan-zue-2025-26-p114-table02', '9-16', '世界の原油埋蔵量と可採年数'),

  context('japan-zue-2025-26-p115-textstat01', '日本のLNG輸入先構成と資源権益の文脈', CUSTOMS_TRADE, TRADE_JAPAN),
  rightsHold('japan-zue-2025-26-p115-figure01', '9-6', '世界の原油生産量と埋蔵量の構成比較'),
  rightsHold('japan-zue-2025-26-p115-table01', undefined, '原油生産量の国別構成を示す図表内訳'),
  rightsHold('japan-zue-2025-26-p115-table02', undefined, '原油埋蔵量の国別構成を示す図表内訳'),
  production('japan-zue-2025-26-p115-table03', '9-17', '主要国の原油生産・貿易・国内供給比較', UN_ENERGY_YEARBOOK, ENERGY_WORLD),
  production('japan-zue-2025-26-p115-table04', '9-18', '主要国の原油輸出入量比較', UN_ENERGY_YEARBOOK, ENERGY_WORLD),

  notQuantitative('japan-zue-2025-26-p116-textstat01', 'LNG資源権益と二国間合意を示す出来事中心の説明'),
  rightsHold('japan-zue-2025-26-p116-figure01', '9-7', '世界の天然ガス生産量と埋蔵量の構成比較'),
  rightsHold('japan-zue-2025-26-p116-table01', undefined, '天然ガス生産量の国別構成を示す図表内訳'),
  rightsHold('japan-zue-2025-26-p116-table02', undefined, '天然ガス埋蔵量の国別構成を示す図表内訳'),
  production('japan-zue-2025-26-p116-table03', '9-19', '天然ガスの国内生産量と自給率の推移', [METI_PRODUCTION, ENECHO_TOTAL], ENERGY_JAPAN),
  production('japan-zue-2025-26-p116-table04', '9-20', 'LNG輸入先と中東依存度の推移', CUSTOMS_TRADE, TRADE_JAPAN),

  rightsHold('japan-zue-2025-26-p117-table01', '9-21', '世界の天然ガス生産量の国別推移'),
  rightsHold('japan-zue-2025-26-p117-table02', '9-22', '世界の天然ガス埋蔵量と可採年数'),
  rightsHold('japan-zue-2025-26-p117-table03', '9-23', '各国の天然ガス消費量と自給率'),
  rightsHold('japan-zue-2025-26-p118-table01', '9-24', '各国のLNG輸出入量比較'),
  rightsHold('japan-zue-2025-26-p118-table02', '9-25', 'LNGの輸出国・輸入国間の貿易構造'),
  rightsHold('japan-zue-2025-26-p118-table03', '9-26', 'パイプライン天然ガスの国際貿易構造'),

  context('japan-zue-2025-26-p119-textstat01', '原子力発電比率と震災後の停止経緯', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  context('japan-zue-2025-26-p119-textstat02', '原子力再稼働と活用方針の転換', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p119-figure01', '9-8', '国内原子力発電所の所在地と稼働状況'),

  context('japan-zue-2025-26-p120-textstat01', '原子力発電の将来構成目標と運転期間制度', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p120-table01', '9-27', '各国の原子力発電設備容量と発電量'),
  rightsHold('japan-zue-2025-26-p120-table02', '9-28', '世界のウラン生産量と資源量'),

  context('japan-zue-2025-26-p121-textstat01', 'FIT・FIP制度の導入経緯', ENECHO_FIT, ENERGY_JAPAN),
  context('japan-zue-2025-26-p121-textstat02', '再生可能エネルギーの2040年度目標', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p121-table01', '9-29', '再生可能エネルギーの認定・買取設備量', ENECHO_FIT, ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p121-table02', '9-30', '各国の太陽光・風力発電設備容量'),

  context('japan-zue-2025-26-p122-textstat01', '発電設備構成の長期変化を補足する説明', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p122-figure01', '10-1', '発電設備容量の電源別構成推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p122-table01', '10-1', '発電設備容量の電源別長期推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),

  context('japan-zue-2025-26-p123-textstat01', '発電電力量の電源構成を補足する説明', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p123-figure01', '10-2', '発電電力量の電源別構成推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p123-table01', '10-2', '発電電力量の電源別長期推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),

  context('japan-zue-2025-26-p124-textstat01', '自家用発電を含む統計範囲の変化', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  context('japan-zue-2025-26-p124-textstat02', 'コージェネレーション等の区分説明', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p124-table01', '10-3', '電源別の発電設備容量内訳', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p124-table02', '10-4', '火力発電電力量の燃料別推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),

  context('japan-zue-2025-26-p125-textstat01', '電気料金支援と再エネ賦課金の政策文脈', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p125-table01', '10-5', '電力販売量と契約区分の長期推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  rightsHold('japan-zue-2025-26-p125-table02', '10-6', '電力需給の地域間連系実績'),

  context('japan-zue-2025-26-p126-textstat01', '世界と日本の電源構成比較を補う説明', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  context('japan-zue-2025-26-p126-textstat02', '2040年度の発電電力量見通し', ENECHO_BASIC_PLAN, ENERGY_JAPAN),
  production('japan-zue-2025-26-p126-figure01', '10-3', '日本の電源別発電割合の推移', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p126-table01', undefined, '日本の電源構成を示す図表内訳', ENECHO_ELECTRICITY, ELECTRICITY_JAPAN),
  production('japan-zue-2025-26-p126-table02', '10-7', '各国の電源別発電電力量比較', UN_ENERGY_YEARBOOK, ENERGY_WORLD),

  context('japan-zue-2025-26-p127-textstat01', '家庭部門と都市ガス利用の変化を補う説明', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),
  production('japan-zue-2025-26-p127-table01', '10-8', '家庭部門の用途別エネルギー消費', ENECHO_TOTAL, TOTAL_ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p127-table02', '10-9', '都市ガス販売量と普及状況の長期推移'),

  context('japan-zue-2025-26-p128-textstat01', 'LPG需給と用途構成を補う説明', ENECHO_TOTAL, ENERGY_JAPAN),
  rightsHold('japan-zue-2025-26-p128-table01', '10-10', 'LPG供給量と国内需要の長期推移'),
  production('japan-zue-2025-26-p128-table02', '10-11', 'LPG輸入先の長期推移', CUSTOMS_TRADE, TRADE_JAPAN),

  context('japan-zue-2025-26-p129-textstat01', '農業・食料関連産業の国内経済上の位置づけ', MAFF_ECONOMIC_ACCOUNTS, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p129-table01', '11-1', '農業・食料関連産業の国内生産額推移', MAFF_ECONOMIC_ACCOUNTS, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p129-table02', '11-2', '農林水産物の輸出入額推移', MAFF_TRADE, AGRICULTURE_JAPAN),

  context('japan-zue-2025-26-p130-textstat01', '農業産出額の品目構成変化', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),
  context('japan-zue-2025-26-p130-textstat02', '生産農業所得と中間投入の関係', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),
  production('japan-zue-2025-26-p130-table01', '11-3', '農業総産出額と生産農業所得の推移', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),

  notQuantitative('japan-zue-2025-26-p131-textstat01', '農業制度の施行時期を示す年次中心の説明'),
  production('japan-zue-2025-26-p131-figure01', '11-1', '農業産出額の部門別構成推移', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),
  production('japan-zue-2025-26-p131-figure02', '11-2', '都道府県別の農業産出額構成', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),
  production('japan-zue-2025-26-p131-table01', undefined, '農業産出額の地域別構成を示す図表内訳', MAFF_AGRICULTURAL_INCOME, AGRICULTURAL_INCOME_JAPAN),

  production('japan-zue-2025-26-p132-table01', '11-4', '品目別の食料自給率推移', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),
  production('japan-zue-2025-26-p132-table02', '11-5', '主要国の農産物貿易額比較', FAOSTAT, AGRICULTURE_WORLD),

  production('japan-zue-2025-26-p133-figure01', '11-3', '供給熱量ベースの食料自給率推移', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),
  production('japan-zue-2025-26-p133-table01', '11-6', '国民1人1日当たり供給熱量の食品別内訳', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),
  production('japan-zue-2025-26-p134-table01', '11-7', '食品群別の国内消費仕向量と自給率', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),

  context('japan-zue-2025-26-p135-textstat01', '耕地面積減少と土地利用転換の文脈', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p135-figure01', '11-4', '田畑別の耕地面積推移', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p135-table01', '11-8', '耕地面積と拡張・かい廃面積の推移', MAFF_CROP, CROP_JAPAN),

  context('japan-zue-2025-26-p136-textstat01', '農業経営体数の減少と法人化の動向', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  context('japan-zue-2025-26-p136-textstat02', '農地集積と経営規模拡大の動向', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p136-table01', '11-9', '農業経営体数と経営耕地規模の推移', [MAFF_CENSUS, MAFF_STRUCTURE], CENSUS_JAPAN),

  context('japan-zue-2025-26-p137-textstat01', '個人・団体経営体の構成変化', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  context('japan-zue-2025-26-p137-textstat02', '主副業別農家構成の変化', MAFF_CENSUS, CENSUS_JAPAN),
  production('japan-zue-2025-26-p137-table01', '11-10', '組織形態別の農業経営体数', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p137-table02', '11-11', '主副業別の販売農家数推移', MAFF_CENSUS, CENSUS_JAPAN),

  production('japan-zue-2025-26-p138-figure01', '11-5', '基幹的農業従事者数と年齢構成の推移', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p138-table01', undefined, '基幹的農業従事者の年齢構成を示す図表内訳', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p138-table02', '11-12', '農業就業者と基幹的農業従事者の推移', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  context('japan-zue-2025-26-p138-textstat01', '農業従事者の高齢化と担い手減少', MAFF_STRUCTURE, AGRICULTURE_JAPAN),

  production('japan-zue-2025-26-p139-figure01', '11-6', '農業従事者と全就業者の年齢構成比較', MAFF_STRUCTURE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p139-table01', '11-13', '産業別就業者数に占める農林業の位置', LABOUR_FORCE, LABOUR_JAPAN),
  production('japan-zue-2025-26-p139-table02', '11-14', '農業生産関連事業の売上高と従事者数', MAFF_SIXTH_INDUSTRY, AGRICULTURE_JAPAN),
  rightsHold('japan-zue-2025-26-p139-table03', '11-15', '農業関連分野の国際特許出願比較'),

  production('japan-zue-2025-26-p140-figure01', '11-7', '世界の肥料消費量の地域構成', FAOSTAT, AGRICULTURE_WORLD),
  production('japan-zue-2025-26-p140-figure02', '11-8', '世界の農薬使用量の地域構成', FAOSTAT, AGRICULTURE_WORLD),
  production('japan-zue-2025-26-p140-table01', undefined, '肥料・農薬使用量の地域構成を示す図表内訳', FAOSTAT, AGRICULTURE_WORLD),
  production('japan-zue-2025-26-p140-table02', '11-16', '国内の有機農業取組面積の推移', MAFF_ORGANIC, AGRICULTURE_JAPAN),

  context('japan-zue-2025-26-p141-textstat01', '米の作付面積と収穫量の長期減少', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p141-figure01', '11-9', '水稲の作付面積・収穫量・単収の推移', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p141-table01', '11-17', '水稲の作付面積と収穫量の長期推移', MAFF_CROP, CROP_JAPAN),

  context('japan-zue-2025-26-p142-textstat01', '主食用米の生産調整と需要変化', MAFF_RICE, AGRICULTURE_JAPAN),
  production('japan-zue-2025-26-p142-table01', '11-18', '用途別の水稲作付面積', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p142-table02', '11-19', '都道府県別の水稲作付面積・収穫量・単収', MAFF_CROP, CROP_JAPAN),

  context('japan-zue-2025-26-p143-textstat01', '米需要量と1人当たり消費量の長期変化', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),
  context('japan-zue-2025-26-p143-textstat02', '政府備蓄米と需給調整の仕組み', MAFF_RICE, AGRICULTURE_JAPAN),
  context('japan-zue-2025-26-p143-textstat03', '米の輸入制度と国際需給の文脈', CUSTOMS_TRADE, TRADE_JAPAN),
  production('japan-zue-2025-26-p143-table01', '11-20', '米の国内供給・需要・在庫の推移', MAFF_FOOD_BALANCE, FOOD_BALANCE_JAPAN),
  production('japan-zue-2025-26-p143-table02', '11-21', '米の輸入量と輸入先の推移', CUSTOMS_TRADE, TRADE_JAPAN),

  context('japan-zue-2025-26-p144-textstat01', '世界の米需給と主要生産国の位置づけ', FAOSTAT, AGRICULTURE_WORLD),
  production('japan-zue-2025-26-p144-table01', '11-22', '世界の米生産量の国別推移', FAOSTAT, AGRICULTURE_WORLD),
  production('japan-zue-2025-26-p144-table02', '11-23', '主要国の米輸出入量比較', FAOSTAT, AGRICULTURE_WORLD),

  context('japan-zue-2025-26-p145-textstat01', '国内小麦生産と輸入依存の長期変化', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p145-table01', '11-24', '国内小麦の作付面積・収穫量・単収', MAFF_CROP, CROP_JAPAN),
  production('japan-zue-2025-26-p145-table02', '11-25', '都道府県別の小麦作付面積・収穫量・単収', MAFF_CROP, CROP_JAPAN),
];
