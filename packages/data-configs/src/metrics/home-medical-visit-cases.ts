import type { MetricConfig } from '../types';

export const homeMedicalVisitCases: MetricConfig = {
  key: 'home-medical-visit-cases',
  title: '訪問診療の実施件数',
  subtitle: '病院・一般診療所、2023年9月',
  description:
    '病院と一般診療所による在宅患者訪問診療の実施件数を所在地の県別に比較する。',
  note: '2023年9月の1か月間、病院と一般診療所の「医療保険等による在宅患者訪問診療」の実施件数を合計。実人数・年間件数ではない。医療施設の所在地別で、患者の居住県別ではない。訪問看護ステーション、精神科在宅患者訪問看護・指導の別項目、介護保険による訪問看護、訪問介護は含まない。両サービス間は重複し得るため、構成比や合計利用者数を作らない。',
  unit: '件',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '医療施設調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
    config: {
      source: {
        name: '医療施設調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
        sourceSha256:
          'f64ac3aac5b75a64f0c396738072ff6b2d62abbce0aadb2e120ba9be719de132',
        publicationIndexUrl: 'https://www.mhlw.go.jp/toukei/list/79-1.html',
        table: '都道府県編第68表（病院）＋第107表（一般診療所）',
        valueColumn:
          '両CSV総数ブロック・在宅患者訪問診療の実施件数列（0起算列6）',
        dataYear: '2023年9月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '両原表の施設数/実施件数各2サービスを47県・全国8列照合。病院と一般診療所は別種の医療施設。実施件数の月次注記を固定。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450021',
        sourceUnit: '件',
        periodStart: '2023-09-01',
        periodEnd: '2023-09-30',
        timeScope: 'one-month',
        surveyAsOf: '2023-10-01',
        geography: '医療施設所在地の都道府県',
        denominator: null,
        secondSourceUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222878&fileKind=1',
        secondSourceSha256:
          '4c7805c90d635f0dd579db8b9e5a54ba46fdadb8cbc295748140d9062bad0d70',
        providerAggregation:
          '病院＋一般診療所。総数ブロックのみ、再掲地域・病院種別・病床別を重複加算しない。',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2023,
    to: 2023,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
