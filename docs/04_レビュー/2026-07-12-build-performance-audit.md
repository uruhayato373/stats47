---
type: performance-report
date: 2026-07-12
status: completed
tags: [build, performance, ci, nextjs, turbo]
---

# ビルドパフォーマンス監査

## 結論

ビルド全体は CI 上では安定しているが、ローカル環境では「重複 prebuild」と 2.8 GB の webpack キャッシュが即時に改善できる主因である。CI 全体では、ビルド単体より PR 品質ジョブの重いネットワーク監査と全 workspace 型検査のほうが大きい。

## 実測ベースライン

| 経路 | 実測 | 備考 |
|---|---:|---|
| PR `Build Check` | 1:53〜2:30 | 2026-07-11〜12 の成功 5 実行 |
| main `workers:build` | 2:27〜2:32 | 直近 3 実行。毎回 clean build |
| PR 品質ジョブ全体 | 7:38〜8:28 | 対象期間の成功実行 |
| `npm ci` | 36〜38秒 | npm キャッシュあり、`node_modules` は毎回再構築 |
| Blog Thumbnail Gate | 1:23〜2:32 | 公開 R2 への全件監査 |
| 全 workspace Type Check | 1:11〜1:41 | その後 `next build` で web の型検査を再実行 |
| ローカル `next build` | 11分超で中断 | `Creating an optimized production build` のまま、1 worker が約116% CPU |

注: CI 時刻は GitHub Actions run 29174164610 / 29172071509 / 29152540720 / 29150307017 / 29147112124 および deploy run 29174393747 / 29172313374 / 29152767411 から集計。ローカル計測は現在の dirty working tree を変更せず実施し、長時間コンパイルの診断に十分な時点で中断した。

## 検出事項と優先度

### P0: `prebuild` が毎回 2 回起動する

`apps/web/package.json` に `prebuild` が定義されているため、`npm run build` はこれを自動実行する。しかし `build` 本体も `npm run prebuild && ...` を明示呼び出しており、`generate-search-index.ts` が 2 回実行される。ローカル計測で実際に 2 回のログを確認した。

- 推奨: `build` から明示的な `npm run prebuild` を削除し、npm lifecycle に一本化する。
- 効果: ローカルと PR build の検索インデック生成時間・R2 I/O を半減。
- リスク: 低。`npm run build` 以外から build 本体だけを直接呼ぶ経路がないことを確認する。

### P0: ローカル webpack キャッシュが 2.8 GB に肥大化

`apps/web/.next` は 2.9 GB、うち `.next/cache/webpack` が 2.8 GB。`server-production` に 100〜244 MB の pack と `.pack_` / `.old` が多数残っている。CI clean build が約2分半で完了する一方、この Mac ではキャッシュあり build が11分以上コンパイルし続けた。コード固有の絶対時間ではなく、ローカルキャッシュの劣化または pack マージコストが疑われる。

- 推奨: 一度 `apps/web/.next/cache/webpack` だけを削除し、clean / warm を各2回計測する。`.next` 全削除は不要。
- 推奨: 月齢・サイズ敷居値付きの `build:clean-cache` を手動診断用に用意する。毎回削除は warm cache の利点を失うため不採用。
- 成功条件: clean build が CI の 2〜3分に近づき、warm build が clean より速い。

### P1: CI は Next/Turbo 成果物をキャッシュしていない

`actions/setup-node cache: npm` は npm ダウンロードキャッシュのみであり、`.next/cache` や Turbo remote cache は使っていない。さらに `workers:build` は `workers:clean` で `.next` を毎回削除する。

- 推奨A: PR の `apps/web/.next/cache` を `actions/cache` で OS + lockfile + Next config キーにより保存し、ヒット率と build 時間を計測する。
- 推奨B: Turbo remote cache は、実際に `turbo run build/type-check` を経由する経路を決めてから導入する。現状 PR build は workspace 直接呼び出しのため効かない。
- 注意: deploy build は OpenNext が clean output を要求するため、`.open-next` をそのまま再利用せず、まず Next webpack cache だけを対象とする。

### P1: PR で TypeScript 検査が重複する

PR は `npm run type-check` で全 workspace を 71〜101秒かけて検査した後、`next build` で web の TypeScript 検査を再実行する。

- 推奨: PR で独立 type-check を必須とするなら、CI の Next build だけ `NEXT_DISABLE_TYPECHECK` 相当が使えるか現行 Next 15.1.7 で検証する。公式に安定した抑止手段がなければ、`typescript.ignoreBuildErrors` の環境変数切替は CI 限定かつ type-check 成功後のみとする。
- より安全な先行案: Turbo の input-aware cache で変更のない workspace の type-check をヒットさせる。

### P1: PR の「ビルド待ち」は build 単体ではない

直近の成功実行で Blog Thumbnail Gate が 83〜152秒、type-check が 71〜101秒、coverage が約46秒、build が113〜150秒。すべてが1ジョブで直列のためフィードバックは8分前後になる。

- 推奨: 依存インストール後に `static-gates` / `typecheck+lint` / `test` / `build` / `remote-asset-audit` を並列 job 化する。
- 推奨: Blog Thumbnail Gate はコードと無関係な PR でも全 R2 アセットを監査するため、定時全件監査 + PR 変更分監査に分割する。
- 効果見込み: ジョブ待ちなしで PR feedback を約2.5〜3.5分に近づけられる。

### P2: web がモノレポ依存と transpile 対象を広く持つ

web は 18 個の `@stats47/*` workspace を dependencies に持ち、`transpilePackages` は 14 workspace + 外部パッケージを列挙する。repo 全体で TS/TSX は約5,070ファイル。ただし、CI clean build は約2.5分で完了するため、これを最初の大規模リファクタ対象にすべきではない。

- 推奨: `npm ls` / import graph で web runtime から未到達の workspace 直接依存を削除し、`transpilePackages` を1個ずつ減らして clean build 比較する。
- 対象候補: build/batch 専用の `ai-content`, `correlation`, `stats-r2` 等。実 import を確認せず削除しない。

### P2: 検索インデック生成が build の外部 I/O に依存

CI / R2 URL ありの prebuild はランキングとブログ snapshot を R2 から取得する。build の再現性と速度がネットワークに引きずられる。

- 推奨: git TS / R2 snapshot 同期ワークフローで `search-index*.json` を生成し、アプリ build では committed artifact の整合性検査だけにする案を比較する。
- トレードオフ: インデック鮮度のパイプライン責務が増えるため、P0/P1 後に検討する。

## 推奨実行順

1. 重複 `prebuild` を削除する。
2. ローカル webpack cache のみ削除し、clean/warm を各2回計測する。
3. 各ステップを計測する `build:profile` を用意し、基準値をこの文書に追記する。
4. PR jobs を並列化し、thumbnail 全件監査を定時/変更分に分ける。
5. `.next/cache` の CI キャッシュを小さく実験し、時間と cache upload/download の損益で判定する。
6. Turbo type-check cache と web 型検査重複解消を検討する。
7. 依存/transpile 範囲は最後に import graph 実測で縮小する。

## 検証ゲート

- 通常 build / workers build の両方で出力 route 種別が変わない。
- R2 依存 route に `generateStaticParams` を戻さない。
- search index 文書数と hash を変更前後で比較する。
- `.open-next/worker.js` / handler / assets と prerender notFound gate を維持する。
- CI キャッシュは「ヒット時間 - restore/save 時間」がプラスの場合のみ残す。

## 未検証

- webpack profile / bundle analyzer によるモジュール別コンパイル時間は未取得。現状キャッシュの異常を切り分けてから実施する。
- `workers:build` のローカル完走は未実施。本番用出力と R2 認証を伴うため、今回は直近 CI の成功計測を根拠とした。
- ~~キャッシュ削除後の計測は、監査から実装へ進む次フェーズで行う。~~ → 下記「Phase 1 実装後の実測」で完了。

## Phase 1 実装後の実測 (2026-07-12)

feature ブランチ `feature/build-perf-phase1`、macOS ローカル (load avg ~5、uTorrent が別途 CPU を消費)。
`/usr/bin/time -lp npm run build --workspace apps/web` で計測。

### 変更

- `apps/web/package.json` の `build` から重複していた `npm run prebuild &&` を削除。
  `prebuild` は npm lifecycle が `build` の直前に1回だけ自動実行する (スクリプト本体は残置)。

### before / after (ローカル `npm run build`)

| 指標 | before (監査時) | after (Phase 1) |
|---|---|---|
| `prebuild` 起動回数 / build | 2 回 | **1 回** (clean/warm とも実測1) |
| ローカル build 所要 | 11分超で中断 (高負荷 + 肥大 cache) | **clean 76.23s / warm 56.17s** (warm < clean) |
| `.next/cache/webpack` | 2.7 GB (stale pack 蓄積) | 削除 → build 2回後 **993 MB** (健全) |
| peak RSS (clean) | 未計測 | 1.93 GB |

- clean = `.next/cache/webpack` を削除した直後の build。warm = その直後の2回目 (cache 再利用)。
- 11分超は高 CPU 負荷 (並行セッション) + 2.7 GB cache の pack マージ + 二重 prebuild の複合。
  主因はローカル cache 肥大。負荷が下がり cache を初期化した状態では clean でも 76 秒で完走した。

### 不変性・検証ゲート

- `public/search-index.json` / `search-index-meta.json` の sha256 は前後で完全一致
  (`889b5b1b…` / `0722d0c9…`)。ローカル prebuild は R2 不在時に既存 index を保持する no-op のため。
- type-check (apps/web) 0 error / web unit tests 67 files・372 tests 全通過。
- `git status` の変更は `apps/web/package.json` の1行のみ (他セッションの変更・生成物の混入なし)。
- route 種別 (`○`/`●`/`ƒ`) は build 出力で従来どおり。prebuild 回数の変更は route 生成に影響しない。

### 見送り・未実施 (理由付き)

- **`build:clean-cache` コマンド (Phase 1-3) は追加しない。** 追加条件は「1-2 でキャッシュ肥大が再現した場合」
  だが、build 2回後の cache は 993 MB で 2.7 GB の再現には至らず (肥大は多数回 build の stale pack 蓄積)。
  効果を確認できない変更は残さない方針に従い、肥大が再発したときの follow-up とする。
- **`workers:build` はローカル未実行。** 本 Phase の変更は `build` スクリプトのみで、`workers:build`
  (`workers:prebuild` = `rimraf .next .open-next` → `opennextjs-cloudflare build`) は別経路であり
  `npm run prebuild` を元々呼ばないため影響を受けない。ローカル実行は R2/env 制約で失敗しうる上に
  `.next` を rimraf して本計測を破棄するため見送り、CI の `workers:build` ゲートを権威とする。

## Phase 2 実装後 (2026-07-12): PR CI ジョブ並列化

`.github/workflows/pr-quality-check.yml` の単一 `quality-check` job (18 step 直列) を
**5 並列 job + 集約 job** に分割。検査内容 (各 step の run/env/continue-on-error:false) は不変。

### 変更

| 新 job (name) | 内容 | secret |
|---|---|---|
| `static-gates` | lint / design-system / card census / R2 route SSG / D1 import / metric years・config・catalog | なし |
| `type-check` | 全 workspace 型検査 | なし |
| `test` | web unit tests + coverage artifact + PR coverage comment | なし |
| `build` | web build | **NEXT_PUBLIC_ESTAT_APP_ID (この job のみ)** |
| `remote-asset-audit` | Blog Thumbnail Gate (全件監査のまま) | なし |
| `quality-check` (name: **Code Quality Check**) | 上記5 job を needs + if:always() で集約。failure/cancelled/skipped があれば明示 fail | — |

- 集約 job 名を旧 job 名 "Code Quality Check" に維持 → branch protection の必須チェック名がそのまま満たされ再設定不要。
- concurrency / cancel-in-progress・トリガー (PR→main) は不変。Blog Thumbnail の全件→変更分・CI cache は本 Phase に含めない。

### 想定クリティカルパス (推定・実測は PR 起動が必要)

監査の per-gate 実測 + 各 job の固定オーバーヘッド (checkout + setup-node + `npm ci` ≈ 55–65s) で試算:

| job | 固定 + 作業 (監査値) | job 合計 |
|---|---|---|
| build | 60 + 113–150s | **~170–215s** ← 最長 |
| remote-asset-audit | 60 + 83–152s | ~140–215s |
| type-check | 60 + 71–101s | ~130–165s |
| static-gates | 60 + 約60–100s | ~120–165s |
| test | 60 + ~46s | ~105s |
| quality-check (集約) | 全 job 完了後 ~10–20s | +~15s |

**想定クリティカルパス ≈ 3.0〜3.9 分** (= build か thumbnail の長い方 + 集約)。現状の単一 job **約 7:38〜8:28** から概ね半減。
トレードオフ: `npm ci` が 5 並列で走るため runner-minutes は増加 (壁時間は短縮)。

### 検証

- 検査コマンドを旧 HEAD と突合し完全一致 (弱体化なし)。continue-on-error は全 step `false` のまま。
- **actionlint 1.7.12: 問題なし** (YAML 構造 + Actions 式 `contains(needs.*.result,…)` + action 参照 + bash shellcheck)。
- js-yaml パース成功・secret は build job のみ・全 work job に `npm ci`・集約 job が 5 job を needs。
- **実測 (壁時間) は未取得** — 確定には PR を 1 回起動して全 job を計測する必要があるが、PR 作成は禁止指示のため未実施。

### 残 Phase

- Phase 3 (CI cache 実験)・Phase 4 (Next build 型検査重複解消・依存/transpile 縮小) は
  `docs/todo/02_機能バックログ.md` の `[BUILD-PERF-PHASE34]` に抽出。根拠は本レポートの P1/P2 検出事項。
