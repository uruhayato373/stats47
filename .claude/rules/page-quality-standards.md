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
   (独自URL SSOTは持たない)、本番へ直接アクセスして並列数を制限しながら静的解析だけを行う
   (ブラウザ計測はコストが見合わないため対象外)。`page-quality-audit-weekly.yml` が実行し、
   error違反があれば `page-quality-alert,auto-generated` ラベルでIssueを起票する。

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
