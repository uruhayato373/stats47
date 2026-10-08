import type { MetricConfig } from "../types";

export const bmiFemale40to69AgeAdjusted: MetricConfig = {
  "key": "bmi-female-40to69-age-adjusted",
  "title": "女性のBMI（40〜69歳・年齢調整値）",
  "description": "国民健康・栄養調査による40〜69歳女性のBMI（体重kg÷身長m²）の平均値。",
  "note": "40〜69歳の女性を対象に、年齢区分の平均年齢56歳へ調整した都道府県別の平均値。BMIの平均値であり、肥満者の割合ではない。男性は20〜69歳が対象で、対象年齢が異なるため男女を同じ軸で比べない。2024年10〜11月の国民健康・栄養調査。標本調査のため県別の95%信頼区間は広く、順位差を有意差と解釈しない。通常1道府県10地区、東京都15地区、石川県8地区（能登半島地震の影響）。国民健康・栄養調査の対象世帯・世帯員に限り、全県民の実測平均ではない。",
  "unit": "kg/m²",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sourceSha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "publicationIndexUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
        "table": "第66表 BMIの平均値（20〜69歳男性・40〜69歳女性、都道府県別、年齢調整値）",
        "pdfPage": 2,
        "valueColumn": "女性（40〜69歳）の平均値（人数・95%信頼区間は読み取り検算のみに使用）",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-10-08",
        "extraction": "PDFのSHA-256を固定し、pdftotext -layoutで第66表の47県＋全国行を抽出。女性の人数・平均・95%CI下限上限を読み、平均を小数第1位のまま採用。抽出スクリプト: .claude/scripts/data/fetch-nhns-2024-prefecture.mjs",
        "verification": "47県欠測なし／CI下限<=平均<=上限／県別人数の合計3,435＝表の全国人数／表の全国平均22.3を保持し人数加重平均22.48と0.3以内で整合／年齢調整の平均年齢(女性56歳)を表の注記で確認",
        "restore": "node .claude/scripts/data/fetch-nhns-2024-prefecture.mjs",
        "ageAdjustment": "40〜69歳女性・56歳に調整"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateYlOrRd",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "isActive": true
};
