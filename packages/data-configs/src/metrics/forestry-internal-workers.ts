import type { MetricConfig } from '../types';

export const forestryInternalWorkers: MetricConfig = {
  key: 'forestry-internal-workers',
  title: '林業経営体の内部労働者数',
  description: '林業経営体の内部労働者数を都道府県別に比較する。',
  note: '2025年2月1日現在の林業経営体調査・確報。原表の都道府県別経営体集計で、作業場所や労働者の居住県別ではない。保有山林3ha以上で森林経営計画又は過去5年間の継続施業等を満たす者、又は育林・素材生産の受託等（素材生産は過去1年間200m³以上）が対象。すべての森林所有者ではない。過去1年間に従事した世帯員・役員・山林共同保有者の経営体ごとの実人数（経営主を含む）。個人経営では15歳以上の世帯員。雇用労働とは区別し、役員会出席だけの者・1日も従事しない者を含まない。2025年は個人票から男女・従事日数階級別人数へ把握方法を変更。',
  unit: '人',
  category: 'agriculture',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「2025年農林業センサス」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
    config: {
      source: {
        name: '農林水産省「2025年農林業センサス」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
        table: 'Ⅲ8',
        valueColumn: 'Excel column 5; rows31..77',
        dataYear: '2025年2月1日調査',
        accessedAt: '2026-09-10',
        sourceSha256:
          '6b9e32348b4af0970a8d0965d3b664036a529996d9ac91af132eab02848412ba',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040483732&fileKind=2',
        releaseStatus: 'final',
        sheet: 'Ⅲ8',
        prefectureRows: [31, 77],
        nationalRow: 10,
        column: 5,
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
