# 再取り込みキュー (LATEST)

- 生成: 2026-08-08T19:57:24.593Z
- 対象: 形状 allowlist の `known-broken` 14 件
- 判定: config の最終更新 (git) と 配信データの書き込み日 (R2 Last-Modified) の前後
- ★全 metric には広げない。一括コミットが全 config に触れるため日付では
  「クエリが変わった」と「ただ触った」を区別できない (実測 2,295 件中 2,063 件が該当)。
  全件の乖離は全面再生成後に検査(k) (レシピ整合) が担う

## サマリ

- ★再取り込みで直る (stale-delivery): 14 件
- 配信の方が新しい (config-insufficient): 0 件
- 判定不能 (unknown): 0 件

## 再取り込みが要る metric

- `city-gas-supply-area-household-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:07.000Z
- `convenience-store-count-commercial` **[known-broken]** — config はデータより 34 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-07-05T04:34:05.000Z
- `current-balance-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `day-time-population-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `daytime-population-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `employment-insurance-daily-receipt-rate` **[known-broken]** — config はデータより 34 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-07-05T04:34:37.000Z
- `flush-toilet-population-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `food-self-sufficiency-rate-calorie` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `future-burden-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `local-debt-current-ratio` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:10.000Z
- `nursery-utilization-rate` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:09.000Z
- `psychiatric-hospital-bed-occupancy-rate` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:12.000Z
- `water-supply-population-ratio-2012on` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:11.000Z
- `water-supply-population-ratio-pre2011` **[known-broken]** — config はデータより 6 日新しい — 再取り込みで直る見込み
  - config: 2026-08-08T19:33:39Z / data: 2026-08-02T05:09:11.000Z


## 直し方

- `stale-delivery`: 該当 key を再取り込みする。取り込み時の形状ゲートが通れば配信が更新される
  (`data/data-refresh-requests.json` を push して `data-refresh.yml` を発火するのが本筋。
  個別なら `npx tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>`)
- `config-insufficient` かつ allowlist 掲載: 再取り込みでは直らない。未指定の分類軸を診断する
  (`npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --fetch`)
- `unknown`: 配信データが存在しない (未公開 metric) か R2 が引けなかった
