import type { MetricConfig } from '../types';

export const newCancerIncidenceCount: MetricConfig = {
  key: 'new-cancer-incidence-count',
  title: '新たに診断されたがんの罹患数',
  description:
    '全国がん登録による悪性新生物の罹患数を診断時住所の都道府県別に比較する。',
  note: '2023年の全部位C00-C96（悪性新生物）の罹患数。上皮内新生物は含まない。同じ患者の同じ腫瘍は名寄せされるが、多重原発がんは別腫瘍となるため、単位は例で実人数ではない。診断時住所の県別で、医療施設所在地ではない。全国は47県計993469例、性別不詳4例を含む。外国748例と住所不詳142例は全国値に含まれない。人口・年齢構成を調整したリスクの大小や死亡数とは異なる。',
  unit: '例',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '全国がん登録',
    url: 'https://www.mhlw.go.jp/content/001727987.pdf',
    config: {
      source: {
        name: '全国がん登録',
        url: 'https://www.mhlw.go.jp/content/001727987.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001727987.pdf',
        sourceSha256:
          '19afa920dc56782f66cc017f7b82cf8cb05154f4b4697f456209443a0562ebb2',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/gan/gan_toroku.html',
        table: '表21 A 全部位 C00-C96 都道府県別・性別',
        valueColumn: 'PDF71頁（印刷59頁）罹患数・総数列',
        dataYear: '2023年',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '47県欠測0、男556059＋女437406＋性別不詳4=全国993469。47県の性別別・総数が全国と一致。外国748/住所不詳142は別行として除外。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450173',
        sourceUnit: '例',
        periodStart: '2023-01-01',
        periodEnd: '2023-12-31',
        geography: '診断時住所の都道府県',
        denominator: null,
        pdfPage: 71,
        printedPage: 59,
        definitionPages: [18, 19, 23],
        classification: 'ICD-10 C00-C96、上皮内新生物D00-D09除外',
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
