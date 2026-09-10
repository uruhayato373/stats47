import type { MetricConfig } from '../types';

export const ambulanceTransportedOther: MetricConfig = {
  key: 'ambulance-transported-other',
  title: '救急搬送人員（その他）',
  subtitle: '救急自動車・2024年中',
  description: '救急搬送人員（その他）を都道府県別に比較する。',
  note: '2024年1〜12月の救急自動車による搬送人員。初診時の医師の診断により、死亡、3週間以上の入院加療を必要とする重症、重症・軽症以外の中等症、入院加療を必要としない軽症、診断がない・程度不明・その他場所へ搬送のその他に分類。5区分は同じ搬送総数の内訳。出動件数、搬送後の転帰、熱中症だけの搬送人数とは異なる。軽症にも早期治療や通院が必要な人を含み、救急要請の不要を意味しない。',
  unit: '人',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: 'その他',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
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
  surveyScope: 'not-applicable',
  surveyScopeReason: '消防機関の救急自動車による搬送実績を集計した行政業務報告',
  isActive: true,
};
