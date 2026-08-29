# 再取り込みキュー (LATEST)

- 生成: 2026-08-29T21:57:00.371Z
- 対象: 形状 allowlist の `known-broken` 0 件
- 判定: config の最終更新 (git) と 配信データの書き込み日 (R2 Last-Modified) の前後
- ★全 metric には広げない。一括コミットが全 config に触れるため日付では
  「クエリが変わった」と「ただ触った」を区別できない (実測 2,295 件中 2,063 件が該当)。
  全件の乖離は全面再生成後に検査(k) (レシピ整合) が担う

## サマリ

- ★再取り込みで直る (stale-delivery): 0 件
- 配信の方が新しい (config-insufficient): 0 件
- 判定不能 (unknown): 0 件

## 再取り込みが要る metric



## 直し方

- `stale-delivery`: 該当 key を再取り込みする。取り込み時の形状ゲートが通れば配信が更新される
  (`data/data-refresh-requests.json` を push して `data-refresh.yml` を発火するのが本筋。
  個別なら `npx tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>`)
- `config-insufficient` かつ allowlist 掲載: 再取り込みでは直らない。未指定の分類軸を診断する
  (`npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --fetch`)
- `unknown`: 配信データが存在しない (未公開 metric) か R2 が引けなかった
