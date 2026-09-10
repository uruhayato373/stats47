import type { MetricConfig } from '../types';

export const inboundVisitSampleByDestination: MetricConfig = {
  key: 'inbound-visit-sample-by-destination',
  title: '訪日外国人の県別訪問回答数',
  subtitle: '2025年・全目的・一般客',
  description:
    '都道府県を訪問したと回答した重み付け前の標本数。推計訪問者数と併せて標本の規模を確認するために掲載。',
  note: '外国人一般客が対象で、クルーズ客と日本居住外国人を含みません。同じ旅行で訪れた複数県にそれぞれ計上し、47県の合計を全国の実人数としません。空港や港の出入国地も訪問先に含みます。訪問者数は重み付けによる推計で、訪問回答数は重み付け前の標本数です。回答数を全国標本101,316人で割っても公表訪問率とは一致しません。標本が少ない県ほど推計精度に留意が必要です。',
  unit: '人',
  category: 'tourism',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '観光庁「インバウンド消費動向調査」都道府県別集計',
    url: 'https://www.mlit.go.jp/kankocho/content/001992606.xlsx',
    config: {
      source: {
        name: '観光庁「インバウンド消費動向調査」都道府県別集計',
        url: 'https://www.mlit.go.jp/kankocho/content/001992606.xlsx',
      },
      provenance: {
        publicationIndexUrl:
          'https://www.mlit.go.jp/kankocho/tokei_hakusyo/gaikokujinshohidoko.html',
        url: 'https://www.mlit.go.jp/kankocho/content/001992606.xlsx',
        table: '表1-1「都道府県（47区分）別 訪問者数および消費単価【全目的】」',
        valueColumn: 'C9:C55（訪問地B列、県番号A列）',
        dataYear: '2025年（暦年）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県をコードと県名で照合。訪問者数E列または訪問回答数C列を保持。F列の消費単価標本と混ぜない。',
        verification:
          '全国の重み付け前訪問標本101316人を年次報告書と照合。47県の回答数は整数かつ全国標本以下、県間重複あり。訪問者数は既存消費額・消費単価との丸め整合を共有する。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-tourism-consumption.mjs --write-local',
        sourceSha256:
          '30fd4a32fad1eeeaaded068bfaa649fb82b0a27459c37b763fd7c555428e5260',
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
