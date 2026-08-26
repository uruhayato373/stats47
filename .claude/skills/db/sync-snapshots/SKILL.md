---
name: sync-snapshots
description: git TS / R2 観測値から全 R2 snapshot を一括 export する。R2 キーパスは app/ 名前空間に統一。データ変更後に必ず実行。
argument-hint: "[--only <category>] [--dry-run]"
disable-model-invocation: true
primary_agent: snapshot-exporter
co_agents: [article-writer, theme-designer, note-manager]
---

git TS / R2 観測値から R2 上の全 snapshot を一括 export するオーケストレーションスキル。

データ変更 (`/page-data-batch`, `/sync-articles`, AI コンテンツ生成 等) のたびに、対応する snapshot を更新しないと本番で古いデータが配信される。

本スキルは **全 snapshot を順次 export** する。各 export はべき等なので何度実行しても安全。

> **★CI dispatch は main のコードで実行される** (`sync-snapshots.yml` の checkout は `ref: main` 固定 =
> デプロイ済みコードで snapshot を作る設計)。**exporter を変更した場合、develop へ push しただけでは
> dispatch に反映されない** — develop→main のデプロイ後に dispatch すること (2026-07-14 に merge 前
> dispatch で旧コードが黙って走る事故が実発生。`--ref develop` は workflow 定義の選択であり checkout には効かない)。
>
> **★「exporter」だけの話ではない。`packages/data-configs` の config も同じ**
> (2026-08-17 に再発)。婚姻率・離婚率の `seoTitle` を develop で是正した状態で
> `--only ranking-items` を dispatch したところ、**main の古い config で item.json が再生成され**、
> 本番の `<title>` は「離婚率 2024年・東京5.7」のまま変わらなかった (regenerate 自体は成功するので
> 失敗にも見えない)。builder は `METRICS_REGISTRY` を直接読むため、**snapshot に載せたい変更は
> それが config でも exporter でも先に main へ入れる**。順序は必ず
> **develop→main のデプロイ → dispatch → 本番 `<title>` を Googlebot UA で実測**。
>
> **★この順序は機械が守る (2026-08-17 配線)**。`data/workflow-dispatch-requests.json` を
> commit するとき、pre-commit の `check-dispatch-freshness.cjs` が
> ①dispatch 先が `ref: main` を checkout するか ②`origin/main...origin/develop` に
> 生成の入力になりうるパス (`packages/**` / `apps/*/scripts/**` / このスキルの `run.sh`) の
> 差分があるか を見て、両方成立したら **commit を止める**。
> 読まないと確信できる場合だけ request に `"acknowledgedMainLag": "<理由>"` を書いて上書きする
> (理由は 10 文字以上を要求 — チェックを黙らせるだけの記入を防ぐ)。
> 上の文章だけでは 2026-07-14 と 2026-08-17 の 2 回とも防げなかったので、判定を機械へ移した。

## R2 キーパス構造

全 Web アプリデータは `app/` 名前空間に統一されている。詳細は `.claude/rules/r2-storage-design.md` を参照。

| データ | R2 キー |
|---|---|
| 値データ | `app/ranking/{key}/values.json` |
| 市区町村ランキング | `app/municipalities/ranking/{key}/{item,values}.json` |
| AI コンテンツ | `app/ranking/{key}/ai-content.json` |
| ページカード | `app/ranking/{key}/page-cards.json` |
| ホーム注目 | `app/home/featured.json` |
| カテゴリ一覧 | `app/category/{key}/items.json` |
| 調査一覧 | `app/survey/all.json` |

## 実行する snapshot 一覧

URL → R2 パス対応は `.claude/rules/r2-storage-design.md` を参照。

| Snapshot | スクリプト | R2 キーパス | サイズ目安 |
|---|---|---|---|
| item-metadata-refresh (**master の直前**) | `packages/ranking/src/scripts/refresh-item-metadata.ts --apply` | `app/ranking/{key}/item.json` の title/subtitle/annotation(note)/categoryKey を git TS config から patch。master の category 再グループ化に反映させるため master の前に実行 | — |
| master (per-URL + surveys + categories) | `packages/ranking/src/scripts/export-master-snapshots.ts` | `app/home/featured.json` / `app/category/{key}/items.json` / `app/ranking/{key}/item.json` / `app/survey/{id}/items.json` / `app/survey/all.json` | ~13MB |
| **ranking-items** (metadata / master の直前) | `packages/ranking/src/scripts/generate-ranking-items.ts` | `app/ranking-items/all.json` / `app/ranking/{key}/item.json` — config の全 metric を再生成。生成直後に `app/ranking` を中間pushし、S3直接readで metadata / master へ渡す。新規 metric 公開時に必須 | — |
| **calculated-stats** (ranking-items の後・ranking-values の**前**) | `packages/ranking/src/scripts/generate-calculated-stats.ts` | `app/stats/{metric}/values.json` — `fetcherKey:"calculated"` の metric (家賃控除後可処分所得 / 実質可処分所得 / エンゲル係数) を分子・分母から計算して**正典**を書く producer。ranking-values はこれを配信用に射影するだけなので、逆順だと計算型が 1 年前のまま配信される。**この task の直後だけ `diff-push-r2 --prefix app/stats` を挟む** — reader はローカルミラーを読まない (remote が唯一の真実源) ため、末尾の一括 push では後続が旧値を読む。★2026-08-05 新設 (計算結果を書く工程がどのパイプラインにも無く、月額から年額を引いた誤値が配信されていた事故の恒久対策) | 3 files |
| **ranking-values** (calculated-stats の**後**) | `packages/ranking/src/scripts/generate-ranking-values.ts` | `app/ranking/{key}/values.json` — 正典 `app/stats/{metric}/values.json` から配信用に決定的変換 (rank は正典値を引き継ぐ)。実描画値・OGP・blog がこれを読む。★2026-07-27 に復活 (Phase 6 で writer が 2 ヶ月間不在化していた事故の恒久対策) | ~2,116 files |
| **municipality-ranking** | `packages/ranking/src/scripts/generate-municipality-ranking.ts` | `app/municipalities/ranking/{key}/{item,values}.json` — city 観測値を municipality entity/value policy で絞り、市区町村専用ランキングへ変換。単独実行時は `app/municipalities` prefix だけを push し、公開後 verifier を通す | key ごと2 files |
| **ranking-normalized-values** (ranking-values の後) | `packages/ranking/src/scripts/generate-ranking-normalized-values.ts` | `app/ranking/{key}/values-per-population.json` / `values-per-area.json` / `national-trend.json` — 正規化値と全国時系列。計算は runtime と同じ `services/normalize-core.ts` に委譲。push 前に fixture 値域ゲート (`scripts/lib/normalized-fixtures.ts`) を通し、違反時は exit≠0 で R2 push しない。★2026-07-29 新設 (Phase 6 で writer が消え、per-area が 100 倍過大のまま 2 ヶ月配信された事故の恒久対策) | ~4,800 files |
| migration-flow | `apps/web/scripts/export-migration-flow-r2.ts` | `app/migration-flow/**` — 人口移動フロー (県間 O-D + 市区町村) の per-prefecture 派生。入力は R2 観測値 `app/stats/population-migration-inter-prefecture/migration-flow-{year}.json` | — |
| finance-flow | `apps/web/scripts/generate-finance-flow.ts` | `app/finance-flow/**` — 財政フロー Sankey 用の per-prefecture 派生。R2 観測値 (歳入金額 / 歳出総額 / 目的別歳出比率) から 47 県 × 最新共通年度で生成 | — |
| item-seo-refresh (master の直後) | `packages/ranking/src/scripts/refresh-item-seo.ts --apply` | `app/ranking/{key}/item.json` の seoTitle/seoDescription を git TS config から patch (Q-DESIGN R0)。master が materialize した item.json を上書き | — |
| remotion-static | `apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all` | `apps/remotion/public/<feature>/*.json` (R2 push 対象外) | — |
| area-profile | `packages/area-profile/src/scripts/export-snapshot.ts` | `app/areas/{areaCode}/profile.json` | ~4MB (47 files) |
| city-profile | `packages/area-profile/src/scripts/export-city-snapshot.ts` | `app/areas/{cityCode}/profile.json` | — |
| blog | `apps/web/scripts/export-blog-snapshot.ts` (article.md) | `app/blog/all.json` | ~150KB |
| page-components | `apps/web/scripts/export-page-components-snapshot.ts` (git TS `data/page-components/`) | `app/page-components/{pageType}/{key}.json` (per-page, 98 files) | ~150KB |
| affiliate-ads | `apps/web/scripts/export-affiliate-ads-snapshot.ts` (git TS `affiliate-ads-data.ts`) | `app/affiliate-ads/all.json` | ~15KB |
| ranking-page-cards | `apps/web/scripts/export-ranking-page-cards-snapshot.ts` | `app/ranking/{key}/page-cards.json` | ~16KB |
| station-passengers | `apps/web/scripts/export-station-passengers-snapshot.ts` | `app/station-passengers/{NN}/{stations,lines}.json` ・ `app/station-passengers/index.json` | ~10MB (95 files) |
| correlation (Derived・エフェメラル計算) | `packages/correlation/src/scripts/build-correlation-snapshot.ts` | `app/correlation/top-pairs.json` ・ `stats.json` ・ `by-ranking-key/{key}.json` — R2 観測値を使い捨て `:memory:` SQLite で集計 (Pearson r / 偏相関 / effectiveR)。`/recompute-correlations` の実体 | ~2000+ files |

## R2 push は CI / クラウド専用 (★重要)

**R2 書き込みはローカルから行わない。** 本 run.sh をローカルで実行すると snapshot は
`.local/r2` に生成されるが、末尾の R2 push は自動でスキップされる (`CI` 外 + `ALLOW_LOCAL_R2_WRITE`
未設定のため。`diff-push-r2.ts` 側も `_assert-ci-write` ガードで停止する)。R2 反映は **GitHub Actions
で実行**する:

```bash
# CI で snapshot 再生成 + R2 push (推奨)。only で 1 task に絞れる
gh workflow run sync-snapshots.yml -f only=page-components          # 1 task
gh workflow run sync-snapshots.yml -f only=municipality-ranking     # 市区町村ランキング
gh workflow run sync-snapshots.yml                                  # 全 task
gh workflow run sync-snapshots.yml -f dry_run=true                  # 生成のみ (確認)
gh run watch                                                        # 進捗確認
```

ローカルは公開 URL 経由の **読み取り専用** (`R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`)。
どうしてもローカルから push する場合のみ `ALLOW_LOCAL_R2_WRITE=1` を付与 (非推奨)。
方針: `.claude/rules/local-environment.md` / `.claude/rules/r2-storage-design.md`。

### 1 task が失敗しても成功分は push する (★2026-08-17 変更)

以前は失敗が 1 件でもあると**末尾の push に到達せず、成功した task の成果物ごと捨てられていた**。
生成物は runner の `.local/r2` にあり runner は破棄されるので復旧手段も無い。

実害: `ranking-values` は **2,244 件を書き切った後**の検証 (観測値 0 件の未登録キー) で exit 1 して
おり、生成は全件成功しているのに 1 バイトも push されず `app/ranking/<key>/values.json` が
**2026-08-11 から 6 日間 site-wide で凍結**していた (`total-population` まで巻き添え)。

現在は **push → 失敗判定** の順。run は赤のまま (`[Data Refresh Alert]` Issue も従来どおり起票)
なので失敗の signal は失われない。方針は `ranking-content-standards.md` §2026-08-07 の
「バッチはオールオアナッシングにしない」と同じ。

**検証ゲート自体は緩めない。** 捨てられていたのは push であって、欠測を見逃してよいという話ではない。
`❌ 失敗した task:` が出たら必ず原因を潰す。

契約は `.claude/scripts/lib/__tests__/sync-snapshots-run-contract.test.mjs` が機械で固定する
(PATH 先頭に fake `npx` を置いて `run.sh` の制御フローだけを走らせる。旧ロジックを注入すると
push が呼ばれないことも assert するので「何も見ていないのに緑」にはならない)。
CI 配線は `npm run test:workflow-commit-back`。

### ranking-items → master の read-after-write 境界

`saveToR2` は remote へ即時保存せず `.local/r2` へ staging する一方、metadata refresh と master は
remote R2 を読む。2026-08-27 の full refresh では、ranking-items が正しく生成した4件の最新年を
master が旧 remote item で上書きした。このため `run.sh` は ranking-items 成功直後に
`diff-push-r2 --prefix app/ranking` を実行し、CI reader は公開CDNよりS3を優先する。
中間pushが1件でも失敗した場合は master を走らせず fail closed とする。順序・dry-run・失敗停止は
`sync-snapshots-run-contract.test.mjs`、read tier は `fetch-priority.test.ts` が固定する。

### timeout は 120 分 (★2026-08-17 変更・45 分では完走しない)

同じ「成果を落とす」型がもう 1 つあった。sync job は `timeout-minutes: 45` だったが、
フル run はそれより長くかかるので**構造的に完走できなかった**。
run 32006827498 では push が `Progress: 9,416 / 14,033 (errors: 0)` で cancel され、
**書けた snapshot の 1/3 が届かないまま** runner ごと破棄されている
(検証・purge step と `sync-ranking-keys` job も丸ごと skip)。
**この打ち切られ方は上の run.sh 修正では救えない** — push 自体が殺されるため。

**所要時間 (完走した run 32020891418 の実測・2026-08-17)**:

| 区間 | 実測 |
|---|---|
| 生成 (全 task) | **33m07s** |
| 末尾 push | **24m44s** (14,033 件 = 9.45 files/s) |
| sync job 全体 | **58m01s** |

打ち切られた run から外挿していた旧値 (生成 30 分 + push 21 分 = 52 分 / 11.2 files/s) より
実際は遅い。**見積りは完走 run のこの値を使う。**

**「差分 push」という名前だが CI ではフル push になる。** manifest (`.local/r2-manifest/`) は
runner ローカルなので毎回空 (`マニフェスト記録済み: 0`) で、アップロード対象は常に全件になる。
manifest を持ち越して push 件数を減らす案は未着手 (`SYNC-SNAPSHOTS-MANIFEST-CARRY-01`)。

## 使い方 (ローカル = 生成のみ / push は CI)

### 通常実行 (全 snapshot を順次生成。push は CI 環境でのみ自動実行)

```bash
bash .claude/skills/db/sync-snapshots/run.sh
```

ranking-values は旧 30K files から 2,116 files に削減済み。`SKIP_VALUES` は不要。

### 単独カテゴリのみ

```bash
bash .claude/skills/db/sync-snapshots/run.sh --only blog
bash .claude/skills/db/sync-snapshots/run.sh --only ranking-values
bash .claude/skills/db/sync-snapshots/run.sh --only municipality-ranking
bash .claude/skills/db/sync-snapshots/run.sh --only station-passengers
```

### dry-run (実行しない、走るスクリプトをリスト表示)

```bash
bash .claude/skills/db/sync-snapshots/run.sh --dry-run
```

## いつ実行するか

| トリガー | 必要 snapshot |
|---|---|
| `/page-data-batch` 完了 | master + ai-content + ranking-values |
| **計算型 metric の分子・分母を更新** (例 `disposable-income-worker-households`) | **calculated-stats → ranking-values** (この順)。分子だけ更新しても計算型の正典 `app/stats/{計算型key}` は追従しないため。`data-refresh.yml` は run.sh をフル実行するので自動で入る |
| `/sync-metrics-cache` 完了 (新規 metric 追加後) | master + ranking-values |
| 市区町村観測値 / catalog 更新 | municipality-ranking |
| `/sync-articles` 完了 | blog |
| AI コンテンツ生成完了 | ai-content |
| ダッシュボード設定変更 | page-components |
| area_profile バッチ完了 | area-profile |
| 全部入れ替え (大規模リカバリ) | 全部 |

## 注意

- **R2 キーパスは `app/` 名前空間に統一すること**: 新規 snapshot 追加時は `.claude/rules/r2-storage-design.md` の URL → R2 対応表に従う。`app/` プレフィックスなし・`all.json` モノリスは禁止。
- **ローカル D1 が編集済みであること**: snapshot は ローカル SQLite を読むため、まず DB を更新してから本スキルを実行する。
- **CF REST API rate limit (429/504)**: export スクリプトは CF REST API で PUT する。大量ファイルを初回一括登録する場合は `aws s3 sync .local/r2/app/<dir> s3://stats47/app/<dir> --endpoint-url $R2_S3_ENDPOINT` の S3-compatible API を使うと rate limit を回避できる。
- **NEXT_PHASE skip パターン**: 本番 worker build 時は各 reader が空配列/null を返し ISR で初回 fetch する。snapshot 更新後の最初のリクエストで反映される (24h ISR 後にキャッシュ満了)。

## 関連スキル

- `/page-data-batch` — e-Stat → R2 へ観測値投入（本スキルの前処理。Phase 6 で旧 `/populate-all-rankings` を置換）
- `/push-r2` — R2 への手動アップロード（個別ファイル）
