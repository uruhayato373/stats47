---
name: テーマダッシュボード強化完了
description: 全15テーマの panelTabs + チャート + SEO 最適化の実施状況と optimize-themes スキル
type: project
---

テーマダッシュボード強化を完了（2026-03-27）。

**実施内容:**
- 全15テーマに panelTabs を定義済み
- 全テーマにチャートをセクション配置済み（合計46件、全て ThemeDbChartRenderer 対応タイプ）
- 非対応タイプ（ranking-chart 8件, kpi-card 34件）を削除・変換
- デスクトップ pageCharts 渡し漏れバグ修正（ThemeDashboardTabbed.tsx）
- PV 上位3テーマの description を SEO 最適化

**チャート数:**
aging-society:6, occupation-salary:5, population-dynamics:5, safety:4, consumer-prices:3, foreign-residents:3, healthcare:3, labor-wages:3, education-culture:2, labor-mobility:2, living-housing:2, local-economy:3, manufacturing:2, real-income:2, tourism:2

**エージェント・スキル:**
- `.claude/agents/theme-enhancer.md` — 4スキル担当
- `/optimize-themes` — GSC/GA4 + 競合調査 + ギャップ分析で優先度付きアクション出力
- `/audit-theme-components` — page_components vs IndicatorSet のギャップ分析
- `/design-theme-charts` — チャート設計（componentProps JSON 生成）
- `/insert-theme-components` — DB 投入

**Why:** テーマページのチャートが safety 以外ほぼ空だった。ranking-chart/kpi-card がテーマページ非対応だった。

**How to apply:** 定期的に `/optimize-themes --all` でデータ駆動の改善サイクルを回す。新テーマ追加時は theme-designer → theme-enhancer の連携で。


## 2026-09-11 テーマ追加時の導線ゲート

- **問題**: 55テーマを展開した後、テーマ画面110ケースは成功したが、新規の `/areas/<県>/<テーマ>` が410だった。全Webテストで検知し、旧ビルドの農業・土砂災害・保育の3URLでも再現した。
- **原因**: 県別ページとsitemapは全テーマから導出し、middlewareだけ旧21テーマの固定リストを持っていた。リンクlintも定数名からslugを推定し、spread名をテーマと誤認した。
- **対策**: `AREA_THEME_SLUGS` をページ・middleware・sitemapで共有し、全許可テーマのmiddleware応答を検証する。リンクlintはThemeCatalog生成のIndicatorSet JSONから実キーを読む。テーマ追加時は全Webテストと県別URLの応答を確認し、冒頭3指標の検査は全章のカード配列へ拡張しない。

- **プレビュー障害**: 公開R2のヘッダー取得後に本文が途切れると、中継サーバーが200送信後に502を再送して `ERR_HTTP_HEADERS_SENT` で停止した。本文を読み終えてからヘッダーを送る順序に修正し、本文が途中で失敗しても502応答後にstagedデータを返し続けるCLI回帰テストを追加した。失敗した110画面監査は別名で保存して再実行する。

- **全体テストの範囲**: Web単体テストだけでは `packages/data-configs` のカタログ件数・移行契約の検査を含まない。テーマの大規模追加では `npm run test:packages` も実行する。実測baselineは更新しても、生e-Stat参照・生色ゼロと陰性対照を維持し、異なる分母を1図へ戻して旧テストを通さない。
- **メニュー末尾の到達性**: 55テーマのヘッダーメニューは低い画面で一覧リンクが領域外へ出た。Radixの利用可能高を上限に縦スクロールを設け、`header-navigation.spec.ts` で1280×600の一覧遷移を検証する。テーマ追加時のE2E代表図も現在の型と件数へ合わせ、削除されたドーナツ図の検査は現存する地域経済の図へ移す。
- **公開用認証とプレビューの分離**: 2155件公開後のローカルbuildはS3資格情報があると `R2_PUBLIC_FETCH_URL` よりS3を優先し、ブログ索引のタイムアウトで失敗した。プレビューbuild/startでは `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT` を空にし、build/startの両方へ検証済みgatewayを `R2_PUBLIC_FETCH_URL` で明示する。`NEXT_PUBLIC_R2_PUBLIC_URL` だけを残すと検索index生成は取得必須なのにserver readerが無効になるため混在させない。productionのS3優先規則は変更しない。

- **共有画像は別の公開対象**: テーマのexact data manifestだけを公開すると、新規rankingのOGP/card生成hookは走らない。`sync-snapshots.yml`を通らない公開では、対象キーの画像生成→exact image publisher→SHA/寸法readbackを別レイヤーで行い、データmanifestの証拠を上書きしない。PR950の本番コード配信は成功したが、後続smokeは画像404で失敗した。run全体とdeploy stepの成否を分けて記録する。
- **画像の配色も公開itemを使う**: generatorがraw metric configを読むと、極性で決まる赤を既定青で描画した。`resolveRankingImageVisualization`で公開itemの配色を検証し、描画とfingerprintの双方へ同じ値を渡す。配色未指定の実在configからcanonical赤を保つ回帰試験を追加した。

- **Workers Cacheの削除先**: `CachedApp`がHTMLを保存し、default gatewayで`ctx.cache.purge`を呼ぶと、API成功でも保存側のキャッシュは残る。2026-09-11に2rankingのエラー画面が全purge後もHIT/旧Ageのまま、query付きは正常、当該buildのISRエントリは404と実測した。認証済みAPIから`CachedApp.purgeCache` RPCへ渡し、所有entrypointで削除する。別入口へのpurgeを呼ばない陰性対照と、同じbuild内のキャッシュ更新を検証する。初回503の原因とは区別する。根拠: [Cloudflare purge scope](https://developers.cloudflare.com/workers/cache/purge/)（2026-09-11確認）。

- **修正の本番実証**: PR953の18チェックとdeploy `34614448966`が成功。2026-09-12 JST、同じbuild `iXmDExxT9Awfz7bXSyc_Q`の2URLでpurge `34615132746`前のHITから後のMISSを確認し、通常URLでエラーだった2rankingも復旧した。証拠は `.local/verification/themes/2026-09-11-production-iXmDExxT9Awfz7bXSyc_Q/`。
- **監査台帳の容量**: 55テーマの週次qualityが2.17 MBへ増え、CIの1 MiB制限で停止した。定義・今回観測・正常時基準を分割する`theme-quality-state.mjs`を生成側と集計側で共有し、SHA/件数を検証して復元する。v1からの移行は完全一致、413テストPASS。週次run `34614529587`でも55テーマ・1282件・error 0を確認し、全56実験の開始日・baseline・判定は不変だった。閾値緩和や正常時基準の削除で容量を減らさない。
- **途中終了HTMLをキャッシュしない**: PR953後のsmoke `34615558207`で人口動態が再試行してもエラー画面になった。CI traceの通常URLは200/HIT、HTML 782007 bytesに終端タグがなく、ブラウザは`Connection closed`を記録した。ローカルの別queryで再確認が通っても、別拠点の通常URLの成功とは扱わない。`CachedApp`からキャッシュ可能な200を返す前にHTML終端を検査し、1回再取得しても失敗ならno-storeの503にする。バッファは8 MiB上限、RSC・assets・HEADは対象外。途中終了を起こした上流要因は未確定で、今回直接実証できた不完全HTMLの保存を防ぐ。
