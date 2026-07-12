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
- キャッシュ削除後の計測は、監査から実装へ進む次フェーズで行う。
