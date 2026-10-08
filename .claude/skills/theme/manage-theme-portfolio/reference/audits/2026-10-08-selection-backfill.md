# selection backfill 2026-10-08 (対話・tourism / consumer-prices)

- 実行: 2026-10-08 / `theme-researcher` 2 体 (テーマごとに 1 体) / 指示書は `selection-backfill.mjs prompt --theme <key>` の出力をそのまま渡した
- 対象 2 テーマ 15 指標 / 通過 15 / gate 不合格 0 / 資料なし skip 0 / 未応答 0
- 経緯: 2026-10-07 承認の見直し (`reference/reviews/2026-10-07-theme-{tourism,consumer-prices}.md`) の実装で、残る primary・secondary の選定根拠を書き直した
- `no-adoption-criteria` の warning は 267 → 250 (`.claude/config/quality-warning-baseline.json` を実測へ縮めた)

## テーマ別

| theme | 対象 | 通過 | 不合格 | skip | 未応答 | 状態 |
|---|---|---|---|---|---|---|
| tourism | 8 | 8 | 0 | 0 | 0 | complete |
| consumer-prices | 7 | 7 | 0 | 0 | 0 | complete |

## gate 不合格

なし。

## 一次資料を見つけられなかった指標

なし。

## role の推奨 (書いていない。人が theme-designer 経由で判断)

承認済みの提案に無い変更なので、この実装では role を変えていない。

| theme | rankingKey | 現行 | 推奨 | 理由 (researcher の要約) |
|---|---|---|---|---|
| tourism | total-overnight-guests-foreign | secondary | primary | 第5次観光立国推進基本計画が地方部の外国人延べ宿泊者数を政策目標に掲げ、登録済みの論点も外国人延べ宿泊者数を総数と対にしている |
| tourism | air-passenger-transport | secondary | context | 旅客地域流動調査の航空分は国内定期航空だけで国際線を含まず、訪日客の空路アクセスを直接は表さない |
| consumer-prices | consumer-price-difference-index-housing | secondary | primary | 結果の概要が東京都の総合水準を押し上げる最大要因に住居を挙げ、費目別の都道府県間比率も教育に次ぐ 1.56 倍 |
| consumer-prices | household-survey-utilities-expenditure | secondary | context | 10・11 月だけの集計で、光熱支出は寒暖差の大きい地域ほど季節性が強く出ると結果の概要が注記している |
| consumer-prices | household-survey-food-expenditure | secondary | context | 利用上の注意が 10・11 月の収支をその年の収支とは読めないとしている |

## 実行エラー

なし。
