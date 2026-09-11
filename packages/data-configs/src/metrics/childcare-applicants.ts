import type { MetricConfig } from '../types';

export const childcareApplicants: MetricConfig = {
  key: 'childcare-applicants',
  title: '保育所等利用申込者数',
  subtitle: '4月1日時点・利用中の児童を含む',
  description:
    '市区町村が報告した保育所等の利用申込者総数を、報告自治体の所属都道府県へ集約する。',
  note: '2025年4月1日時点の保育所等関連状況取りまとめ。保育所・認定こども園等の2号・3号の保育利用に関する申込総数で、既に保育所等を利用している児童や待機児童の集計から除かれる児童を含む。新規申込数や待機児童数ではない。1,741市区町村の報告を一度ずつ所属県へ集約し、政令指定都市・中核市を再加算しない。異なる年や母集団の定員・在所児指標を差し引いて不足人数を算出しない。',
  unit: '人',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: 'こども家庭庁「保育所等関連状況取りまとめ」',
    url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
    config: {
      source: {
        name: 'こども家庭庁「保育所等関連状況取りまとめ」',
        url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
      },
      provenance: {
        url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
        sourceSha256:
          '5f3e86aa669a9ca66c55549991491a37c059d40110e88eb8b07fbd8a664b9bca',
        publicationIndexUrl:
          'https://www.cfa.go.jp/policies/hoiku/torimatome/r7/',
        table: '（参考）申込者の状況（令和７年４月１日）',
        valueColumn:
          '申込者の状況!E10:E1750（市区町村1,741行の申込者数、合計欄）',
        dataYear: '2025年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'B列連番とC列都道府県・D列市区町村を固定。各市区町村の11利用状況区分計＝申込者、4年齢区分計＝全年齢を検算して47県へ集約。',
        verification:
          '1,741市区町村一意、47県欠測0、全国2765235人。60申込欄＋28定員欄の県計＝全国。別XLSX県47＋独立市82の重複なし集計と利用者・定員・待機数を照合し、PDF15頁の全県4系列と一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-parks-childcare.mjs --write-local',
        sourceUnit: '人',
        geography: '報告市区町村の所属都道府県（市区町村報告の単純積上げ）',
        periodStart: '2025-04-01',
        periodEnd: '2025-04-01',
        asOf: '2025-04-01',
        timeScope: 'point-in-time-2025-04-01',
        population: 'childcare-applicants-including-current-users',
        counting: 'reported-applicants-not-new-applications',
        denominator: 'none',
        definitionUrl: 'https://www.cfa.go.jp/policies/hoiku/torimatome/r7/',
        verificationUrl:
          'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/c853cacb/20250828_policies_hoiku_torimatome_r7_01.pdf',
        verificationSha256:
          '55c7128aa48f487ddf2fb17e79f99531aab71484f85cd1790bd0f5ad98031efe',
        verificationPdfPage: 15,
        municipalityRows: 1741,
        separateCityRowsForCrossCheck: 82,
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
