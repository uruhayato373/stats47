import type { MetricConfig } from '../types';

export const inboundTravelConsumptionByDestination: MetricConfig = {
  "key": "inbound-travel-consumption-by-destination",
  "title": "訪日外国人旅行者の県内消費額",
  "subtitle": "全目的・宿泊と日帰り",
  "description": "訪日外国人一般客の旅行について、訪問先の都道府県で生じた旅行消費額をB1地域調査から推計したものです。県内宿泊と日帰り訪問を含む全目的の参考集計です。",
  "note": "標本調査による訪問先都道府県別の推計で、県ごとに標本数が異なります。観光以外の業務・家事・知人訪問等も含みます。都道府県間交通費を除き、パッケージ料金は訪問地収入分を含みます。県内に残る所得・地域への還元率・経済波及効果を示す値ではありません。クルーズ客と日本に居住する外国人は対象外です。訪問地には出入国空海港の所在地も含まれます。都道府県間交通費と訪問地不明の支出等を各県に加算しないため、47県合計は全国総額と一致しません。日本人の国内旅行系列とは調査対象・標本が異なります。",
  "unit": "億円",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "観光庁「インバウンド消費動向調査」都道府県別集計",
    "url": "https://www.mlit.go.jp/kankocho/content/001992606.xlsx",
    "config": {
      "source": {
        "name": "観光庁「インバウンド消費動向調査」都道府県別集計",
        "url": "https://www.mlit.go.jp/kankocho/content/001992606.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mlit.go.jp/kankocho/tokei_hakusyo/gaikokujinshohidoko.html",
        "url": "https://www.mlit.go.jp/kankocho/content/001992606.xlsx",
        "table": "表1-3「都道府県（47区分）別，費目（7区分）別 旅行消費額【全目的】」",
        "valueColumn": "C9:C55（訪問地B列、7費目D:J列。県間交通費の56行を除外）",
        "dataYear": "2025年（暦年）",
        "accessedAt": "2026-09-10",
        "extraction": "SHA固定の公式XLSXをExcelJSで読み、人口区分・全目的・年・単位・訪問県番号と県名を47県照合。C列の公表値を原表精度で保持し、表1-1/1-2の訪問者数・消費単価と7費目を検算。配賦は原典の推計済み値を用い、独自の再配賦はしない。",
        "verification": "全47県、欠測・重複なし。7費目合計は丸め許容内。47県の整数億円への丸め値は概要PDF参考2と全一致。県別合計86,419.07845932億円は三大都市圏・地方部合算に一致。全国94,549億円（一般客94,110億円）とは対象・除外費目が異なり一致を要求しない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-tourism-consumption.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "isActive": true
};
