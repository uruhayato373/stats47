---
type: session-handoff
date: 2026-07-12
status: active
tags: [build, performance, claude-code]
---

# Claude Code 実装ハンドオフ: ビルド最適化

## 目的

ローカルの開発フィードバックと GitHub Actions の待ち時間を短縮する。機能、route 種別、R2 snapshot、OpenNext 出力は変えない。

根拠と実測値は [`docs/04_レビュー/2026-07-12-build-performance-audit.md`](../04_レビュー/2026-07-12-build-performance-audit.md) を参照する。

## 着手前の必須事項

1. `git fetch origin main develop` を実行し、ローカル HEAD と `origin/develop` の差分を確認する。
2. 現在の working tree には他セッションの変更が多数ある。同じ working tree で並行編集せず、専用 worktree / feature branch を使う。
3. 本番デプロイは実行しない。必要ならまとめて最後にユーザーの確認を取る。
4. 各フェーズは別 commit にし、効果がないまたは逆効果の変更を次フェーズに混ぜない。

## 成功条件

- `prebuild` は `npm run build --workspace apps/web` 1回につき1回だけ起動する。
- webpack cache 初期化後の clean build がローカルで完走し、warm build が clean build より速い。
- PR CI のクリティカルパスを8分前後から短縮する。目標はジョブ待ちを除き3〜4分。
- `search-index.json` / `search-index-meta.json` の文書数・内容が意図せず変わない。
- normal Next build と OpenNext Workers build の両方が成功する。
- prerender notFound gate、type-check、tests の検出力を弱めない。

## Phase 1: 低リスクの確定改善

### 1-1. 重複 `prebuild` の解消

対象: `apps/web/package.json`

現状:

```json
"build": "npm run prebuild && npx tsx scripts/validate-env.ts && ... next build"
```

`prebuild` は npm lifecycle が `build` の直前に自動実行する。`build` 内の `npm run prebuild &&` だけを削除する。`prebuild` スクリプト自体は残す。

確認:

```bash
rg -n 'npm run (prebuild|build)|run-script.*build' . --glob '!node_modules/**' --glob '!.next/**'
npm run build --workspace apps/web 2>&1 | tee /tmp/stats47-build-phase1.log
rg -c '^> web@.* prebuild$' /tmp/stats47-build-phase1.log
```

期待値は `1`。既存の search index の hash を実行前後で比較する。ローカルで R2 を読まない早期 return でも、起動回数が1回であることを検証する。

### 1-2. 肥大化 webpack cache の切り分け

これは tracked file の変更ではない。`apps/web/.next/cache/webpack` のみ削除し、`.next` 全体は削除しない。作業中の dev server / build process がないことを先に確認する。

```bash
du -sh apps/web/.next/cache/webpack
rm -rf apps/web/.next/cache/webpack
/usr/bin/time -lp npm run build --workspace apps/web 2>&1 | tee /tmp/stats47-build-clean-1.log
/usr/bin/time -lp npm run build --workspace apps/web 2>&1 | tee /tmp/stats47-build-warm-1.log
```

注: この `rm` は実装セッション内でユーザーが明示した最適化作業の一環として行う。他の `.next` 領域やユーザー変更は削除しない。

記録項目:

- wall clock / user / sys / peak RSS
- `Creating an optimized production build`、type-check、page generation の各所要時間
- 完了後の `.next/cache/webpack` サイズ
- clean と warm の差

測定結果を監査レポートの実測ベースラインに追記する。

### 1-3. 手動診断コマンド

Phase 1-2 でキャッシュ肥大化が再現した場合にのみ、手動用の `build:clean-cache` を追加する。毎回の build / prebuild から自動実行しない。コマンド名と実装は既存の `rimraf` に合わせる。

## Phase 2: PR CI のクリティカルパス短縮

対象: `.github/workflows/pr-quality-check.yml`

### 方針

現在の単一 `quality-check` job を、少なくとも以下の独立 job へ分割する。

1. `static-gates`: lint、design-system、card census、R2 route SSG、D1 import、metric/config/catalog gate
2. `type-check`: 全 workspace type-check
3. `test`: web unit tests + coverage artifact/comment
4. `build`: web build
5. `remote-asset-audit`: Blog Thumbnail Gate

各 job は checkout / setup-node / `npm ci` が必要になる。壁時間と引き換えに runner-minutes と install 重複が増えるため、最初は下記の3分割でもよい。

- `checks`: static gates + type-check
- `test`: coverage
- `build-and-assets`: build と remote asset audit を並列化できないなら別 job

実装原則:

- すべての job が required check として fail できること。`continue-on-error` を追加しない。
- coverage comment は `test` job 内に残す。
- concurrency / cancel-in-progress を維持する。
- R2 シークレットと build env は必要 job だけに渡す。
- Blog Thumbnail Gate の「全件→変更分」への仕様変更は、並列化と同じ commit に混ぜない。まず並列化だけで効果を測る。

検証:

- YAML parse / actionlint。`actionlint` がなければ未実行と明示する。
- PR を1回だけ起動し、全 job の結果と壁時間を記録する。
- 直近基準: PR 全体 7:38〜8:28、build 1:53〜2:30、thumbnail 1:23〜2:32、type-check 1:11〜1:41。

## Phase 3: CI cache 実験

Phase 2 完了後に別 commit / 別計測で行う。

### `.next/cache` の候補

PR `build` job のみ `actions/cache` で `apps/web/.next/cache` を restore/save する小規模実験を行う。キーには少なくとも runner OS、`package-lock.json`、`apps/web/next.config.ts`、Next.js バージョンを反映する。

残す判定:

- cache hit の build 短縮時間が restore + save 時間を上回る。
- cache サイズが過大化しない。ローカルで2.8 GBまで肥大化したため、サイズを必ずログ出力する。
- miss / partial hit でも build の正しさが変わらない。

deploy `workers:build` は `.next` / `.open-next` を clean にする現行仕様を維持する。まず PR build で効果を証明し、deploy への適用は別判定とする。

### Turbo cache

現状 PR build は workspace の `npm run build -w apps/web` を直接呼び出すため、Turbo remote cache を入れるだけでは効果がない。導入前に以下を決める。

- build / type-check のどちらを `turbo run` 経由にするか
- cache の認証・保存先・コスト
- env と R2 外部 I/O を Turbo inputs でどう扱うか

これらが未決定のまま remote cache を実装しない。

## Phase 4: 重複型検査と依存縮小

このフェーズは P0/P1 完了後のみ実施する。

### Next build の型検査

全 workspace type-check 後に Next build が web を再検査している。ただし、不明な非公式 env で型検査を無効化しない。現行 Next 15.1.7 の実装と公式手段を確認する。

`typescript.ignoreBuildErrors` を CI 条件で切り替える場合は、同一 workflow の必須 `type-check` job が成功しないと build/deploy できない依存関係を機械的に保証する。本番 deploy の型検査は、別の必須検査がない限り無効化しない。

### dependencies / `transpilePackages`

web runtime の import graph を取得し、未使用と証明できた workspace だけを1個ずつ削除する。候補名だけで削除しない。各削除で clean build、type-check、対象 test を実行する。

## 最終検証

```bash
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
npm run build --workspace apps/web
```

CI / OpenNext に関わるまとまった変更の節目でのみ:

```bash
npm run workers:build --workspace apps/web
bash .github/scripts/check-prerender-notfound.sh apps/web
```

Workers build は環境変数や R2 認証の制約で実行できない場合がある。スキップした場合は完了と言わず、理由と CI で必要な検証を明記する。

追加で以下を確認する。

- `public/search-index.json` / `search-index-meta.json` の hash、文書数
- `.open-next/worker.js`、default handler、assets の存在
- route 一覧の `●` / `ƒ` が意図せず変化していない
- `git diff --check`
- ユーザーの既存 dirty changes が commit に混入していない

## 完了時の記録

1. 監査レポートに before / after の実測値を追記する。
2. 実装した項目、見送った項目、未検証項目を最終報告に分ける。
3. 未実施の Phase を `docs/todo/02_機能バックログ.md` または inbox へ抽出する。
4. ハンドオフを消化したら、必要な知見を抽出した後にこのファイルを `git rm` する。

## 禁止事項

- 高速化のために type-check / tests / prerender gate を単純に無効化しない。
- R2 依存 route に `generateStaticParams` を追加しない。
- `.open-next` 成果物を条件なしで再利用しない。
- webpack cache を毎回自動削除しない。
- 複数の最適化を1 commit に混ぜ、効果の原因を不明にしない。
- 明示依頼なしに develop → main デプロイを実行しない。
