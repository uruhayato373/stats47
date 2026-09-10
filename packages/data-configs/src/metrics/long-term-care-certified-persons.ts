import type { MetricConfig } from '../types';

export const longTermCareCertifiedPersons: MetricConfig = {
  key: 'long-term-care-certified-persons',
  title: '要支援・要介護認定者数',
  description: '年度末の要支援・要介護認定者総数を都道府県別に比較する。',
  note: '2024年度末（2025年3月31日）現在。要支援1・2と要介護1〜5、第1号・第2号被保険者、男女を含む。保険者（市町村等）の報告を県別に集計した数で、サービス施設の所在地や実際のサービス利用人数とは異なる。人口で割った認定率ではない。受給者台帳の提出後、要介護度が遡って変わる場合がある。',
  unit: '人',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '介護保険事業状況報告',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
    config: {
      source: {
        name: '介護保険事業状況報告',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
        sourceSha256:
          '53f7bce6e434d816f7dbd2d522d271c1a02d3bb2b6005b39c787eed2a0b55ceb',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/topics/kaigo/osirase/jigyo/24/index.html',
        table: '第4-1-1表 都道府県別 要介護（要支援）認定者数 男女計 総数',
        valueColumn: '04-1-1T①!I6:I52（全国I53）',
        dataYear: '2024年度末（2025年3月31日）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '全47県・欠測0。7認定区分の合計を144行、総数=第1号+第2号を384セル、全国計24列で確認。全国総数7207487人。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450351',
        sourceUnit: '人',
        asOf: '2025-03-31',
        geography: '保険者報告の都道府県別集計',
        denominator: null,
        definitionUrl:
          'https://www.mhlw.go.jp/topics/kaigo/osirase/jigyo/24/dl/r06_gaiyou.pdf',
        definitionSha256:
          'd51f44155e9b4d5fda2cf487bed03e3f73c49dd34155f5c2d4c6eef482ae8b17',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'fiscal',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
