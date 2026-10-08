import type { MetricConfig } from "../types";

export const financialLiteracyCorrectRate: MetricConfig = {
  "key": "financial-literacy-correct-rate",
  "title": "金融リテラシー調査 正誤問題の正答率",
  "subtitle": "25問・18〜79歳",
  "unit": "％",
  "category": "economy",
  "note": "金融広報中央委員会『金融リテラシー調査(2022年)』の正誤問題25問(金融リテラシー・マップの分野別)の正答率。インターネットモニター調査で、都道府県ごとの調査サンプルは限られる(例: 北海道1,281人)ため、順位の小差は標本誤差の範囲を含む。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "金融広報中央委員会(知るぽると)「金融リテラシー調査(2022年)」統計表の一括ファイル",
        "url": "https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/",
        "license": "[要確認] 知るぽるとの利用条件(https://www.shiruporuto.jp/public/document/container/kiyaku/)は商用目的の転載・複製に事前承諾を求める。承諾確認は未了。一次統計を踏まえ独自コンテンツとして展開する(オーナー判断 2026-10-08)。指摘があれば取り下げる",
      },
      "description": "金融リテラシー調査(2022年)の正誤問題25問(家計管理・生活設計・金融取引の基本・金融経済の基礎・保険・ローンクレジット・資産形成・外部の知見活用)の都道府県別正答率(%)。統計表の一括ファイルのシート『86 都道府県比較表 (1)』。",
      "provenance": {
        "publicationIndexUrl": "https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/",
        "url": "https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/pdf/22lite_toukeir.xlsx",
        "table": "86 都道府県比較表 (1)『正誤問題25問の正答率』(順位表)。検算用に都道府県別シート『39 北海道』〜『85 沖縄県』の『(2)金融知識・判断力に関する特徴』合計(25問)行",
        "valueColumn": "『正誤問題25問の正答率』のデータ列(最左の列グループ)",
        "dataYear": "2022年(令和4年・インターネット調査)",
        "accessedAt": "2026-10-08",
        "extraction": "ランディングページから統計表一括 xlsx の直リンクを解決して取得→比較表(1)の47都道府県の正答率と全国平均を抽出→小数第2位に丸め。抽出スクリプト: .claude/scripts/data/fetch-financial-literacy-correct-rate.mjs",
        "verification": "47の都道府県別シートの『合計(25問)』行の都道府県値が比較表(1)と全県で一致(許容0.001)、全国値55.66%が全シートで比較表の全国平均と一致",
        "restore": "node .claude/scripts/data/fetch-financial-literacy-correct-rate.mjs で xlsx を再取得し同じ抽出・検算を再現できる",
      },
    },
    "displayName": "金融広報中央委員会(知るぽると)",
    "url": "https://www.shiruporuto.jp/public/document/container/literacy_chosa/2022/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "金融リテラシー(正誤問題)の正答率、都道府県で差｜1位島根県58.83% vs 最下位沖縄県51.03%【2022年】",
  "seoDescription": "金融広報中央委員会『金融リテラシー調査(2022年)』の正誤問題25問の正答率を都道府県別に比較。1位島根県58.83%、最下位沖縄県51.03%で7.80ポイント差(全国55.66%)。地図とグラフで47都道府県を比較。",
  "isActive": true,
};
