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
