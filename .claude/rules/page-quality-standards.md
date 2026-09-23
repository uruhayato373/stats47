---
paths:
  - ".claude/scripts/page-quality/**"
  - ".claude/skills/analytics/performance-improvement/page-quality-budgets.json"
  - "apps/admin/app/quality/page-audit/**"
  - "apps/admin/lib/server/page-quality.ts"
  - ".github/workflows/page-quality-audit-weekly.yml"
---

# ページ品質監査 (肥大化・重複・速度) 規約

ページのHTML/RSC肥大化・DOM過剰・リンク重複・広告重複・構造化データ異常・console/pageエラー・
モバイル横スクロールを継続的に検出する仕組み。**既存の日次PSI (`psi-audit-daily.yml`) ・Cloudflare監視とは
別系統で、両者は変更・削除しない** (PSIはLighthouseスコア/CWV専任、本仕組みは静的解析+DOM/リンク/広告/構造化データ専任)。

## 2段階の検査

1. **変更時 (軽量・明示実行)**: `npm run page-quality:check -- --base-url <url> --base <ref>` が git diff から
   影響テンプレートを判定し (`templates.ts` の `affectedTemplates()`)、各テンプレート代表URL 1件だけを検査する。
   共通レイアウト・広告・データ取得層 (`SHARED_PATH_RULES`) を変更した場合は全テンプレートを検査する。
   リリース前は `npm run check:release-local` (production build 1 回を代表 E2E と共有) で実行する。
   **PR CI の必須 gate ではない (2026-09-18 に外した)**: CI 内で `next start` して本番 R2 を読むため結果が
   PR の差分と独立に変わり (本番データの変化、`SITEWIDE-DUPLICATE-LINK-RATIO-01` のようなサイト横断の
   既知違反が代表 URL に乗る)、PR #974 で 5 連続失敗・#977 でも赤になった。PR 必須へ戻すのは、R2 を固定
   fixture に差し替えて決定的にできたときだけ (`CI-SPEED-PAGE-QUALITY-DETERMINISTIC-01`)。
2. **週次 (全件)**: `npm run page-quality:audit-weekly` が `sitemap.xml` から公開対象URLを列挙し
   (独自URL SSOTは持たない)、本番へ直接アクセスして並列数を制限しながら静的解析を行う。
   `page-quality-audit-weekly.yml` が `--concurrency 12 --skip-rsc --browser-representative` で実行し、
   error違反があれば `page-quality-alert,auto-generated` ラベルでIssueを起票する。
   - **全URL (静的)**: 上記の肥大化・重複に加え、画像切れ (`broken_images`) と空の見出し (`empty_headings`)
   - **代表URL 11件だけブラウザ**: 文字の切れ (`clipped_text`)・タップ要素の重なり (`overlapping_tap_targets`)・
     axe-core の WCAG A/AA critical/serious 規則数 (`a11y_violations`)。全URLをブラウザで開くのはコストが見合わない
   - **RSC は全件では測らない** (`--skip-rsc`): RSC はキャッシュされず 1 件ごとにサーバー描画する
     (実測 0.5〜3.7 秒/件)。2026-09-19 の初回は RSC 込み並列 4 で 45 分の制限内に 1,200/6,237 URL しか進まず
     打ち切られた。RSC 抜き並列 8 は手元で 800 URL 122 秒だったが、CI では全件 54.5 分かかった (2026-09-23 実測。
     GitHub のサーバーから本番までが遅い)。並列を 12 に上げ、ジョブの制限時間を 120 分にしている。RSC は代表URL検査で測る

## スクショ保存と週次 agent の確認 (2026-09-23)

代表URL 11 件をスマホ (幅412) と PC (幅1280) で撮影し、R2 `state/page-quality/screenshots/<date>/` と
比較元の `latest/` へ保存する (`lib/screenshots.ts`・400 日で自動失効する `state/` prefix。1 週約 10MB)。
先週の `latest/` と画素比較した変化率 (0〜1、高さの変化も数える) を LATEST.md に出す。

続けて Claude (sonnet・`Read`/`Glob` だけ・ファイル書換なし) が `.claude/prompts/ci/page-ui-review.md` に沿って
スクショを確認し、JSON schema の構造化出力で指摘 (最大 10 件) を返す。縦長の全体像は縮小されて文字が
読めないので、画面 1 枚分ずつ切り出した画像 (`tilePaths`、R2 には上げない) を読ませる。
**記録と通知の判断はスクリプトが行う** (`record-ui-review.ts`): 撮影していない画面を指す指摘や形の崩れた
指摘は捨て、結果を `.claude/state/metrics/page-quality/ui-review-latest.json` に残す。
手元の試行 (2026-09-23) は 73 回のやり取り・2 分半で、`--max-turns 120` はそのための余裕。

**通知**: 「先週の週次結果に無かった UI 違反」と agent の指摘を `ui-review-alert` Issue 1 件へまとめ、
両方無くなったら閉じる。warning の UI 違反も新しく出た週には通知される (前週から続く同じ違反は再通知しない)。
直すと決めたものは人がバックログへカードにする (Issue は PR で閉じる改修と機械アラートだけの運用のため)。

## UI 検査の判定 (誤検知を出さないための除外)

実装は `lib/measure-static.ts` (静的) / `lib/check-images.ts` (画像) / `lib/ui-probe.ts` (ブラウザ)。
除外条件はいずれも 2026-09-23 に本番で誤検知として実測したもので、各条件を外すとテストが落ちる
(`__tests__/ui-checks.test.mjs`)。

- **画像切れの対象は自サイトと R2 の `<img>` だけ**。ASP の計測ピクセルを取得すると広告の表示回数を水増しするので
  外部ホストは叩かない。`<picture><source>` はブログ図のスマホ版で、未移行の旧記事は 404 だが
  `ResponsiveArticleImage` が PC 版へ戻すので対象外 (規約で許容済み)。
- **代替表示がある画像の欠落は `degraded_images` (warning)**。特産品画像は `SpecialtyImage` が頭文字タイルへ
  切り替える。代替の実装を変えたら `check-images.ts` の `FALLBACK_IMAGE_PATTERNS` も直す。
- 空の見出しから読み込み中の仮枠 (`animate-pulse`) を除く (後から中身が差し込まれる)。
- 文字の切れは、枠の外へ**文字**が出ている場合だけ数える (地図タイルのはみ出しを除く)。ellipsis / line-clamp は意図した省略。
- タップ要素の重なりから、固定表示 (fixed/sticky。同意バナー等)、親に切り取られて見えない部分、
  閉じた `<details>` の中身を除く。折り返したインラインリンクは行ごとの矩形で比べる。
- ブラウザ検査は読み込み完了とフォント適用を待ってから測る (CSS 適用前は PC 用サイドバーが見えている扱いになる)。
- 関数を `page.evaluate` へそのまま渡すと tsx が差し込む `__name` で落ちるので、`evaluateLayoutIssues` が文字列化して評価する。

## 判定

閾値SSOTは `.claude/skills/analytics/performance-improvement/page-quality-budgets.json`
(既存のPSI用`budgets.json`とは別ファイル・別スキーマ)。`comparison: absolute`は単発閾値、
`delta_pct`は直近履歴 (`.claude/state/metrics/page-quality/history.csv`) からの増加率(%)を見る
(初回計測はdelta判定をskipし、退行扱いにしない)。取得不能な指標 (Playwright timeout等) は
`{value: null, reason}` で保存し、推測値で埋めない。閾値を変えるときは
`npm run page-quality:aggregate`で保存済みスナップショットを再クロールせず再評価できる。

## 記録

`.claude/state/metrics/page-quality/{history.csv,LATEST.md,latest.json,snapshots/<date>.json}`。
snapshotsは週次のみ生成し、保持数は `.claude/scripts/lib/prune-state-snapshots.mjs` の
`RETENTION_POLICIES["page-quality"]` (keep 8) で管理する。

## 管理画面

`apps/admin/app/quality/page-audit/` で読み取り専用のドリルダウン表示 (テンプレート別集計・
悪化ランキング・全URL現在値・トレンド)。既存の `/quality` ページにも1行のキューサマリを追加している
(`apps/admin/lib/server/quality.ts` の `qualityQueues()`)。書き換え機能は追加しない。

## 広告・リンク重複の検出方法 (マークアップ変更なし)

広告リンクは `<a rel="sponsored">` (`TrackedAffiliateLink`の既存規約) とAdSenseの`ins.adsbygoogle`を
検出に使う。新しいdata属性は追加していない。重複は正規化した`href`の一致で数える
(`.claude/scripts/page-quality/lib/measure-static.ts`)。

## 会社ネットワークからの手動実行

`fetch()`は`.claude/scripts/page-quality/lib/http-dispatcher.ts`の`resolveDispatcher()`で
`HTTPS_PROXY`環境変数があればundici `ProxyAgent`を自動で使う(`local-environment.md`の
`resolveDispatcher`パターンと同一)。CIには`HTTPS_PROXY`が無いため通常のfetchのまま動く。
これが無いと会社Windows PCから本番へ直接fetchすると`SELF_SIGNED_CERT_IN_CHAIN`で全滅する
(curlはWindows証明書ストアを信頼するため気づきにくい)。

## 関連

- 既存のPSI/Lighthouse: `.claude/skills/analytics/performance-improvement/SKILL.md` (別系統・変更しない)
- URL/テンプレートSSOT: `apps/web/src/lib/url-policy.ts` / `apps/web/src/config/sitemap-segments.ts` (直接importせず、sitemap.xml経由で参照する)
- テスト: `npm run page-quality:test`
