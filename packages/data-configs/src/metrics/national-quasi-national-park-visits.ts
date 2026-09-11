import type { MetricConfig } from '../types';

export const nationalQuasiNationalParkVisits: MetricConfig = {
  key: 'national-quasi-national-park-visits',
  title: '国立・国定公園利用者数',
  subtitle: '都道府県報告の年間延べ利用・県立公園を除く',
  description:
    '国立公園と国定公園の年間利用者数を、原表の県別利用者数に基づいて合計する。',
  note: '2024年暦年。都道府県からの報告を集計した延べ利用者数で、重複を除いた実人数ではない。県境をまたぐ公園は公園全体の人数を各県へ割り当てず、原表の県別値を一度ずつ合計する。都道府県立自然公園、ビジターセンター入館者、自然歩道利用者を含まない。県立公園を含む自然公園面積で割って利用密度を計算しない。日高山脈襟裳十勝は2024年6月25日に国定から国立へ移行した原表区分を使用する。',
  unit: '千人',
  category: 'tourism',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '環境省「自然公園等利用者数調」',
    url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
    config: {
      source: {
        name: '環境省「自然公園等利用者数調」',
        url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
      },
      provenance: {
        url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
        sourceSha256:
          '1cf6dfc31087f48b84a53677207e32da30a75fce7614c6ac64ab919b75f7524c',
        publicationIndexUrl: 'https://www.env.go.jp/park/doc/data.html',
        table:
          '表Ⅱ-５ 都道府県別利用者数（国立、国定公園別）／表Ⅱ-３・表Ⅱ-４の県別欄',
        valueColumn:
          '表Ⅱ-５の47県ブロック総計G/N/U列、国立D/K/R列、国定F/M/T列',
        dataYear: '2024年（暦年）',
        accessedAt: '2026-09-10',
        extraction:
          '県ラベルB/I/P列のブロック境界と総計結合セルのmasterを解決。国立・国定の各県セル177件を元表D/I列へ逆参照し、県名・公園名・数値を照合。県境公園全体E/J列の重複配賦を禁止。',
        verification:
          '47県欠測0・県別合計保存・原表県別177セルを各1回使用。全国国立336140千人＋国定256623千人＝592763千人。概要PDFの万人単位公表値へ丸め一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-parks-childcare.mjs --write-local',
        sourceUnit: '千人',
        geography: '原表の都道府県別公園利用者数',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        timeScope: 'calendar-year-2024',
        population: 'national-and-quasi-national-parks-only',
        counting: 'reported-annual-visits-not-distinct-persons',
        denominator: 'none',
        definitionUrl:
          'https://www.env.go.jp/park/doc/data/natural/naturalpark_gaiyo.pdf',
        definitionSha256:
          '2c45d577facac8fde29cf9b4e4de08bfb0eaba1baa94df66c5598271691e7a2c',
        classificationChange:
          '2024-06-25 Hidaka national designation; no annual change series generated',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
