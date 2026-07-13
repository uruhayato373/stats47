---
type: code-audit
date: 2026-07-12
status: completed
tags: [quality, automation, ci, guardrails, audit]
---

# コードベース全体の機械チェック監査

## 結論

stats47 は一般的な lint / type-check / test / build に加え、R2 route、デザインシステム、metric config、theme catalog、記事数値、公開画像まで専用ガードがあり、既に機械チェック密度は高い。次に効果が大きいのは新しい大型テスト基盤ではなく、以下の3点である。

1. **既存チェッカーを正しいタイミングに配線する**
2. **git TS / Markdown / workflow の SSOT と生成物・運用実体の差分を決定的に検査する**
3. **既存違反を baseline 化し「新規悪化だけブロック」から始める**

すべてのチェックを pre-commit / PR に入れるのは不適切である。ローカルで完結する決定的チェックは PR、R2 / 外部API / 全リポジトリ走査は path-filtered PR または定期監査に分ける。

## 監査範囲

- `.husky/pre-commit` / `apps/web/scripts/pre-commit-checks.sh`
- `.github/workflows/*` / `.github/scripts/*`
- `.claude/hooks/*` / `.claude/scripts/**/*check|audit|validate|verify|lint*`
- root / apps / packages の `package.json`, Turbo, TypeScript, Next.js 構成
- `docs/01_技術設計/06_自動化インベントリ.md`
- git TS / R2 snapshot / generated files の境界
- 過去事故をガード化した memory / rule / checker

## 実測した現状

| 項目 | 結果 |
|---|---:|
| docs ルート相対参照の切れ | **47件** |
| agent / skill consistency | error 0 / orphan warning 20 |
| automation inventory と workflow 実体の片側差分 | 少なくとも17 workflow名 |
| TS/TSX | 約5,070ファイル |
| 既存の check/audit/validate/verify 系スクリプト | 多数。うち複数が PR/pre-commit 未接続 |
| リポジトリ内の疑わしい生成物 | `packages/ranking/type-check-output.txt`, `packages/utils/dist/**` |

注:

- docs リンク47件には、意図的に削除した過去文書への歴史参照も含む。そのため全件を即ブロックにせず、baseline 後に新規 broken を止める。
- automation inventory の差分は Markdown の歴史的な「廃止」行も拾うため、単純文字比較のままゲートにせず、active workflow の機械可読セクションを導入する。

## 既存の主要ガード

以下は既にカバーされており、重複実装しない。

- ESLint / TypeScript / unit test / coverage / Next build
- Design System / Card census
- R2 依存 route への `generateStaticParams` 混入
- prerender された notFound の deploy 前走査
- apps/web の直接・間接 D1 runtime import
- metric years / metric config / theme catalog
- 記事 factual cross-check / structure / quality gate
- OGP / thumbnail 公開漏れ
- agent / skill / script 参照と一部 orphan
- active ranking の R2 公開漏れ
- dependency vulnerability / CodeQL / 簡易secret検出
- SNS / YouTube 投稿数、重複、予算ガード

## 提案一覧

| ID | 優先度 | チェック | 実行場所 | 初期モード |
|---|---|---|---|---|
| MC-01 | P0 | docs 参照切れの新規悪化 | PR path-filter | baseline block |
| MC-02 | P0 | automation inventory ↔ workflow 実体 | PR + 週次 | block |
| MC-03 | P0 | SSOT → generated artifact の鮮度 | PR path-filter | block |
| MC-04 | P0 | PWA/manifest/静的アセット参照 | PR | block |
| MC-05 | P0 | リポジトリ衛生・不要生成物 | pre-commit + PR | block |
| MC-06 | P1 | workflow 構文・permissions・action pin | PR | block/warn |
| MC-07 | P1 | snapshot schema / cross-snapshot 参照整合 | PR path-filter + 週次 | block |
| MC-08 | P1 | route / sitemap / canonical / indexability 整合 | PR path-filter | block |
| MC-09 | P1 | env 変数の定義・workflow・docs ドリフト | PR + 週次 | warn → block |
| MC-10 | P1 | package exports / dependencies / workspace 境界 | PR | block |
| MC-11 | P1 | 外部 R2 と git TS SSOT の配信差分 | publish後 + 定期 | alert |
| MC-12 | P1 | チェッカー自体の配線・テスト | PR + 週次 | block |
| MC-13 | P2 | accessibility 静的ルール + 少数E2E | PR | block |
| MC-14 | P2 | image / SVG / favicon / OGP 仕様 | PR path-filter | block |
| MC-15 | P2 | TODO / deprecated / legacy の新規増加 | PR | baseline warn |
| MC-16 | P2 | 機械チェックの実行時間予算 | CI | alert |

## P0: すぐ機械化すべきもの

### MC-01: docs 参照切れの新規悪化

既存: `.claude/scripts/lib/check-docs-links.cjs`

現在実行すると47件で fail するが、pre-commit / PR CI に接続されていない。docs 再編で agent / skill / memory の参照が壊れても検知されない。

実装案:

1. `--json` 出力の broken path + referrer を sort した baseline JSON を管理する。
2. PR で `docs/**`, `.claude/**`, `CLAUDE.md` が変更されたときだけ実行。
3. baseline 内の既存 broken は警告、新規 broken のみ exit 1。
4. 既存47件は歴史参照 / 現行参照に分類し、歴史参照は backtick path ではなく「削除済み」と明示するか allowlist 化する。

成功条件: docs の移動 / 削除を含む fixture test があり、新規参照切れだけをブロックする。

### MC-02: automation inventory と workflow 実体の整合

自動化インベントリは「静的な真実源」を名乗るが、workflow 実体との差分を機械検査していない。実測では active / historical を含め少なくとも17名に片側差分がある。

実装案:

- inventory に YAML frontmatter または fenced JSON の `active_workflows` 一覧を追加する。人間用表の解析に依存しない。
- `.github/workflows/*.{yml,yaml}` と active list を双方向比較。`README.md` は除外。廃止行は active list に含めない。
- workflow が追加 / 削除 / rename された PR で inventory 更新を必須化。
- 週次 consistency workflow でも全件走査し、ドリフトを Issue 化。

追加で workflow の `name`, trigger, schedule, status, output path を JSON 出力し、表の記載と比較できる構造にする。cron の JST 変換は機械計算し、手計算の誤りを防ぐ。

### MC-03: SSOT からの生成物鮮度

既存の良いパターンは `generate:catalog --check`。これを他の git TS → JSON/TS 生成物へ横展開する。

対象:

- categories / themes / metrics registry
- page_components / theme_metrics / ranking page cards
- KNOWN / SITEMAP / INDEXABLE keys
- survey master / provenance dictionary
- affiliate ads snapshot
- search index / metadata
- gallery inventory 等、git TS / Markdown を入力に持つ生成物

標準実装:

```text
generator --check
  = /tmp に再生成
  = tracked output と semantic compare
  = 差分があれば更新コマンドを表示し exit 1
```

生成コマンドで working tree を直接書き換えて `git diff --exit-code` するより、`--check` / `--output /tmp` を標準化する。

### MC-04: manifest / favicon / 静的アセット参照

`manifest.ts` が存在しない `icon-192.png` / `icon-512.png` を長期参照していた事実を今回のアイコン作業で確認した。TypeScriptはこれを検知しない。

検査内容:

- manifest / metadata / robots / sitemap / OGP が参照するローカル `/...` 静的パスの存在
- PNG/JPEG/WebP/ICO/SVG の MIME、寸法、拡張子一致
- PWA icons の宣言 size と実寸一致
- maskable icon の safe zone
- SVG parse、`viewBox`、禁止された外部参照 / embedded script
- Apple icon / favicon の最低必要セット

PR で manifest、metadata、public 配下が変更されたときだけ実行する。

### MC-05: リポジトリ衛生

検査対象:

- `.DS_Store`, `*.log`, `*.tmp`, `*.bak`, `type-check-output.txt`
- 意図しない `coverage/`, `.next/`, `.open-next/`, root直下DB
- package の `dist/**` を tracked にするかどうかの方針違反
- 1MB超の新規ファイル、Git LFS 必要ファイル
- case-insensitive filesystem で衝突するパス
- Unicode NFC/NFD だけが異なる日本語パス

現在 pre-commit の大容量ファイル検査は警告のみ、一時ファイル検査は root 直下の一部のみで、CIに同等ガードがない。tracked file 対象の決定的な script を作り、pre-commit と PR から共用する。

`packages/utils/dist/**` は package の entrypoint が dist を要求するかを確認し、「正式な tracked build artifact」または「削除対象」を明示する。存在するだけで違反と判定しない。

## P1: 次に実装すべきもの

### MC-06: GitHub Actions 静的検査

- `actionlint` による YAML / expression / shell 構文検査
- 各 job の `permissions` を最小権限化。workflow-level `contents: write` を可能な限り job-level へ移す
- third-party action を tag だけでなく commit SHA pin するポリシーの検討
- `timeout-minutes`, `concurrency`, `cancel-in-progress` の有無
- schedule workflow の `workflow_dispatch`、失敗通知、commit-back 競合対策
- deprecated action version / Node runtime の検出
- heredoc / shell interpolation に untrusted PR input を直接渡していないか

Semgrep / zizmor の導入は、ノイズを計測してから行う。まず `actionlint` と permissions チェックで十分な効果がある。

### MC-07: snapshot schema と横断参照整合

個々の JSON parse ではなく、以下を横断検査する。

- ranking item の `rankingKey` が metric registry に存在
- category / theme / survey / tag / area code がそれぞれの master に存在
- `latestYear` と values の最新年が一致
- prefecture ranking が 47県を基本とし、欠損がある場合は理由を持つ
- rank の重複 / 飛び番 / sort direction / null policy
- unit / precision / normalization basis と metric config が一致
- page_components が参照する metric / chart / component type が実在
- derived snapshot の input revision / generatedAt が追跡可能

これは `zod` 等の schema 検査 + ドメイン整合関数に分ける。R2全件取得は PR ではなく publish 後または週次、変更された git TS の整合性は PR で検査する。

### MC-08: route / SEO contract

Next App Router の新規 `page.tsx` / route 追加時に以下を検査する。

- indexable page に metadata / canonical がある
- noindex page が sitemap に含まれない
- sitemap entry が known keys / middleware 410 と矛盾しない
- OGP image route が robots の方針と整合
- R2 route の dynamic / ISR / revalidate 方針
- 旧URL / redirect / canonical の loop と chain
- route segment の静的生成件数に上限

文字列 grep だけでは誤検知が多い。Next build の route manifest、sitemap 生成結果、metadata の代表 E2E を組み合わせる。

### MC-09: 環境変数レジストリ

`process.env.*`, Wrangler vars/secrets, GitHub workflow env, `validate-env.ts`, `.env.example` / docs の差分を検査する。

分類:

- required at build
- required at runtime
- public (`NEXT_PUBLIC_*`)
- server secret
- workflow-only
- optional / fallback あり

検査:

- コードが参照する required env がレジストリにある
- server secret が `NEXT_PUBLIC_*` でない
- deploy workflow / wrangler binding に必要値がある
- 削除済み D1 / YouTube / legacy env が現行コードに復活していない
- env 名の `CLOUDFLARE_R2_*` vs `R2_*` の alias と使用場所が明示される

### MC-10: package / workspace contract

- `package.json` の `main` / `types` / `exports` のファイル存在
- exports の `server` / `client` 境界、`server-only` の漏れ
- source import に対応する direct dependency が package.json にある
- unused direct dependency / phantom dependency
- internal workspace の循環依存
- Node / TypeScript / React / Next の重複versionと peer range
- package-lock が package.json 変更に追従
- `dist` を参照する package の build 鮮度

`npm ci`, `knip`, dependency-cruiser / madge の役割を分ける。knip は初期はレポートのみとし、新規 unused export / dependency の baseline 悪化から止める。

### MC-11: git TS SSOT と公開 R2 の一致

既存だが未接続の例:

- `apps/web/scripts/verify-page-components-snapshot.ts`
- `apps/web/scripts/verify-affiliate-ads-snapshot.ts`

これらはネットワーク・公開状態に依存するため、通常PRの常時ブロックにしない。

- publish workflow 直後の post-condition
- 週次 consistency audit
- 差分があれば `auto-generated` alert

に配線する。git TS 変更中で未 publish の PR は差分が正常なため、PR 時点の cloud equality を要求しない。

### MC-12: チェッカーのチェック

チェッカーを追加してもどこからも呼ばれなければ機能しない。

検査:

- check/audit/validate/verify 命名の script が package script / workflow / hook / skill のどれかに参照される
- blocking checker には positive / negative fixture test がある
- workflow が呼ぶ script / package script が存在
- inventory に owner、trigger、blocking/advisory、timeout がある
- 過去30日の実行回数、fail数、false-positive waive数を集計

現在の agent consistency checker は orphan `.claude/scripts` を warning で検出するが、apps/packages の checker、package scripts、CI wiring 全体までは見ていない。

## P2: 安定後に拡張するもの

### MC-13: accessibility

実装状況（2026-07-13）: 静的AST回帰ガードに加え、`@axe-core/playwright` で home / ranking一覧 / area一覧 / blog一覧 / privacy の代表5 routeをWCAG 2 A/AA・2.1 A/AA対象で検査する独立CI jobを実装。critical/serious違反をblockし、ホーム先頭の「本文へスキップ」キーボード導線も検証する。導入時に検出した広告リンク名、2箇所のcontrast、skip link欠落は修正済み。

静的:

- image alt、form label、button accessible name
- heading hierarchy、interactive element nesting
- `target="_blank"` と `rel`
- click-only `div` / keyboard handler
- dialog / drawer の focus contract

実機:

- 代表 route 数本の axe / Playwright
- keyboard-only navigation
- light/dark の主要contrast

全47県×全rankingのE2Eではなく、テンプレート種別ごと1〜2 routeに限定する。

### MC-14: image / SVG contract

実装状況（2026-07-13）: 第2段階を実装済み。`check-asset-policy.cjs --baseline` を PR Static Gates に接続。**git 管理対象の画像を repo 全体（787枚: raster 440 / svg 347、CI checkout と同一 scope）で棚卸し**し、デコード・pixel寸法・容量・**形式↔拡張子の一致（FORMAT_MISMATCH）**・SVG 安全性（viewBox / script・foreignObject / 外部URL / malformed）・**SHA-256 完全同一の重複（DUPLICATE_IMAGE）**・**MD / HTML / CSS / TS(X) のローカル画像参照解決（存在・case-sensitive・/public 絶対＋相対）**について新規悪化を block する。**未参照画像（423件）は非ブロックの UNREFERENCED_IMAGE warning** として report する。既存 finding 50件は `.claude/config/asset-policy-baseline.json` に固定（baseline 識別子は `CODE:relpath:message` で絶対パス / mtime 非依存）。OGP は 1200×630 preset のみ確定適用し、favicon / PWA は `check-static-assets.cjs` を正典として重複させない。text overlap / font fallback / alpha・color profile の用途別制約は誤検知回避のため既存の専用 lint（svg-lint.mjs 等）を維持する。runtime 788ms / 10000ms（suite 合計 4017 / 30000ms）。単体テスト 7件。

- 画像の pixel 寸法、aspect ratio、ファイル容量、alpha / color profile
- OGP 1200×630、note cover、SNS、favicon / icon 種別の preset
- SVG の text overlap、viewBox、font fallback、external URL / script
- 本文参照画像の存在、case-sensitive path
- public 配下の巨大画像 / 未圧縮ファイル

既存 `svg-lint.mjs`, note cover overlap, OGP audit, golden image test を共通の asset policy から呼び分ける。

### MC-15: TODO / deprecated / legacy budget

実装状況（2026-07-13）: `check-maintenance-debt.cjs --baseline` をPR Static Gatesへ接続済み。apps / packages / .claude / .github の5,100超ファイルを対象に、無根拠TODO/FIXME/HACK、削除条件のないlegacy表現、永続D1 runtime操作候補の新規増加をblockする。

TODO 自体を禁止すると誤検知が多い。以下の新規増加だけを検査する。

- issue / backlog ID のない `TODO`, `FIXME`, `HACK`
- `legacy`, `deprecated`, `temporary`, `remove after` に削除条件がない
- D1 廃止後の runtime D1 言及・コマンドの復活
- dead workflow / skill の active 表記

既存数の上限 baseline で新規増加を警告し、減少は常に許可する。

### MC-16: チェック実行時間予算

実装状況（2026-07-13）: `check-runtime-budget.cjs` と `.claude/config/check-runtime-budgets.json` を追加。主要な決定的checkerを個別予算・合計30秒予算で実測し、p50/p95と各結果をGitHub Step Summaryへ出力する。ローカル初回実測は合計約3.8秒、p95約1.8秒（マシン依存のためCI値を正とする）。

機械チェックを増やし続けるとフィードバックが遅くなり、`--no-verify` と CI 回避を招く。

- pre-commit: 対象変更のみ、目標 p95 30秒以下
- PR static gates: 目標 2分以下
- PR 全体: 並列時の critical path 4分目標
- remote / full inventory: 定期監査へ逃がす

各 checker の所要時間を step summary に出し、p50/p95 悪化と timeout を検知する。

## 実行レイヤーの分け方

| レイヤー | 対象 | 原則 |
|---|---|---|
| editor / pre-commit | staged file 単体で完結 | 30秒以下、ネットワーク禁止 |
| PR static | repo内で決定的 | path-filter、新規悪化をblock |
| PR integration | build/test/代表E2E | 並列job、テンプレート代表 |
| publish post-condition | R2 / CDN / public URL | publish後のみblock/rollback |
| daily/weekly audit | 全件・外部API・重い検査 | Issue / report、PRを不必要に止めない |
| monthly governance | inventory / orphan / cost / trend | baseline 更新は人手review |

## 誤検知を増やさないルール

1. 初期は report-only で実データを集める。
2. 既存違反は baseline 化し、新規悪化のみ止める。
3. allowlist には理由、owner、期限を必須化する。
4. スキップ時は「成功」ではなく `skipped: reason` を出す。
5. 自動修正は format / sort / generated file など決定的・可逆なものだけ。
6. ネットワーク失敗と内容不整合を別の exit code / finding にする。
7. checker は修正コマンドと正典ドキュメントを出力する。
8. baseline 更新は checker の失敗を消す手段にしない。差分reviewを必須にする。

## 推奨実装順

### Phase 1: 既存資産の配線

1. MC-01 docs link baseline gate
2. MC-02 automation inventory drift checker
3. MC-04 manifest/static asset checker
4. MC-05 repository hygiene checker
5. MC-11 既存 R2 verify を publish後/週次へ接続
6. MC-12 checker wiring audit を agent consistency weekly に統合

### Phase 2: SSOT 整合

1. MC-03 generators の `--check` 標準化
2. MC-07 cross-snapshot integrity
3. MC-09 env registry
4. MC-10 package/workspace contract

### Phase 3: 配信・UIの品質

1. MC-06 workflow security/static analysis
2. MC-08 route/SEO contract
3. MC-13 accessibility representative E2E
4. MC-14 asset policy
5. MC-15 legacy/TODO budget
6. MC-16 check runtime budget

## 最初の1 PRに含める範囲

最初から全16項目を実装しない。最初の PR は以下に限定する。

- `check-docs-links.cjs` の baseline compare 追加 + fixture test
- automation inventory の active workflow 機械可読一覧
- `check-automation-inventory.cjs` と fixture test
- PR path filter で上記2 checker を呼び出す
- 自動化インベントリへ checker 自身を追記

この PR の成功条件:

- 既存 broken 47件では fail しない
- 仮の新規 broken docs 参照を fixture で検出する
- workflow の追加 / 削除 / rename に inventory が追従しなければ fail する
- 通常の非 docs / 非 workflow PR ではジョブが数秒で skip する

## 未実行・制約

- 本監査では checker 本体、workflow、hook は変更していない。
- 外部 R2 verify はネットワーク負荷と公開中データのタイミングを考慮し、今回は実行していない。
- `packages/utils/dist/**` の tracked 是非は package exports 調査前のため断定していない。
- route / SEO contract の完全検査には Next build artifact の構造化解析が必要。最初は新規 route の静的チェックから始める。
- 機械チェックで意味的な正しさを100%保証はできない。データの妥当性、デザイン品質、編集判断は人間/レビューの対象に残る。
