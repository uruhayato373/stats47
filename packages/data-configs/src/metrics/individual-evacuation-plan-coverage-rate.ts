import type { MetricConfig } from '../types';

export const individualEvacuationPlanCoverageRate: MetricConfig = {
  key: 'individual-evacuation-plan-coverage-rate',
  title: '個別避難計画の作成率',
  subtitle: '2026年4月1日現在',
  description: '個別避難計画の作成率を都道府県別に比較する。',
  note: '2026年4月1日現在の全1,741市区町村の行政取組状況を都道府県別に集計。個別避難計画が作成された現在の要支援者を対象とし、施設入所等で対象から外れた人を含む過去累計や直近1年間の作成件数とは異なる。分母は避難行動要支援者名簿の掲載人数で、各自治体の優先作成対象者数ではない。掲載対象の基準は自治体で異なり、作成率を実際の避難成功率や支援の十分さとみなさない。 原表公表の小数1桁の率を保持し、同表分子/分母×100の四捨五入との一致を検証。県の率を単純平均して全国率を作らない。',
  unit: '％',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
    url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
    config: {
      source: {
        name: '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
      },
      provenance: {
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
        sourceSha256:
          '376e669d6034a7b748dd16422e50b11a22320f9b51a1933a3b75e20f241a386c',
        publicationIndexUrl:
          'https://www.bousai.go.jp/taisaku/hisaisyagyousei/r8chosa.html',
        table: '資料1 図6 都道府県ごとの個別避難計画の作成状況',
        valueColumn: '資料1 図6 作成率（計画人数/名簿人数）',
        dataYear: '2026年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの図6（PDF7ページ）の名簿/計画/作成率を47県と全国で抽出。資料2の5-2（PDF16ページ）名簿人数とも照合。',
        verification:
          '全国名簿6696718人・計画1014017人、県合計、48行の分子<=分母と公表率丸め一致、別表名簿一致、47県一意・欠測なしを検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2026-04-01',
        pdfPage: 7,
        releasedAt: '2026-06-29',
        denominator: '名簿に係る避難行動要支援者人数',
        numerator: '調査時点で個別避難計画が作成された避難行動要支援者人数',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2026,
    to: 2026,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  surveyScope: 'not-applicable',
  surveyScopeReason:
    '自治体の名簿及び個別避難計画の整備状況を集計した行政取組報告',
  isActive: true,
};
