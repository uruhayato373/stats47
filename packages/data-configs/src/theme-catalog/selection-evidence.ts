import type { MetricSelection } from "./types";

/**
 * 一次資料で裏付けた選定根拠 (selection) の置き場 — `expanded.ts` 由来の指標専用。
 *
 * どこに書くかの規則 (混在させない):
 * - 指標が `packages/data-configs/src/theme-catalog/<theme>.ts` の `metrics[]` に**インラインで**
 *   定義されている → その `selection` を直接書く (このファイルには書かない)
 * - 指標が `expanded.ts` の spec tuple (31 テーマ) / 既存テーマ拡張 tuple (67 章) で定義されている
 *   → tuple に selection の欄が無いので **ここ** に `[themeKey][rankingKey]` で書く。
 *   `makeCatalog` / `extensionMetric` が定型 selection より優先して読む
 *
 * ★このファイルは `.claude/scripts/themes/selection-backfill.mjs apply` が丸ごと再生成する
 *   (JSON 形式の TS)。手で書く場合も同じ形を保つ。規約: `.claude/rules/theme-catalog-standards.md` §4
 */
export const SELECTION_EVIDENCE: Record<string, Record<string, MetricSelection>> = {
  "tsunami-exposure": {
    "tsunami-evacuation-building-count": {
      "proposedBy": "内閣府「津波避難ビル・津波避難タワー等に関する取組調査結果について」(令和5年4月時点調査 参考資料1)",
      "sourceUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/sanko_1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "内閣府の調査は海岸線を有する、または津波の遡上等で被害が想定される全国40都道府県678市区町村を対象に津波避難ビルの指定・整備状況を集計しており、対象外の7県は調査そのものの範囲外であることが示されている。これはテーマ説明にある「40県が調査対象で、対象外7県は0件と扱わない」という取り扱いの直接的な根拠になり、津波避難ビル数を都道府県間で比較する際の前提を裏付ける。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県には津波避難ビルが何棟指定・整備されているか。",
      "targetReaderOrDecision": "沿岸自治体の防災担当者や津波リスクのある地域の住民が避難先の整備状況を把握する際の参考情報。"
    },
    "tsunami-evacuation-tower-count": {
      "proposedBy": "内閣府「津波避難ビル・津波避難タワー等に関する取組調査結果について」(令和5年4月時点調査 参考資料1)",
      "sourceUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/sanko_1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同調査は津波避難タワー等の内訳をやぐら型・建物型・マウンド型・人工地盤・避難シェルターに分類しており、やぐら型が6割以上を占めると明記している。これは津波避難ビルとは異なる構造・立地特性を持つ施設群であることを示しており、ビル数だけでは捉えられない沿岸防災インフラの補完的な整備状況を都道府県別に比較する根拠となる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "津波避難タワー等はどのような型が多く、自分の都道府県にはどの程度整備されているか。",
      "targetReaderOrDecision": "津波避難ビルが少ない地域でタワー等による代替整備状況を確認したい自治体・住民。"
    }
  }
};
