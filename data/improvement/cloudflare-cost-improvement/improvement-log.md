# Cloudflare コスト改善ログ (agent 用詳細)

一覧・status の真実源は `.claude/todo/improvements.md`。ここは検証コマンド・仮説・期日の詳細ログ。
記入テンプレ: `.claude/rules/evidence-based-judgment.md` §改善ログ記入テンプレ。

`### 判定` セクションは `.claude/scripts/lib/effect-verdict/` の閾値エンジンが upsert する。
判定・根拠データ・閾値 SSOT・ガード・再現コマンドの 5 項目が必ず出る。ガードが 1 つでも
hit していれば `effect/pending` に留まり、確定ラベルは付かない。

計測データの置き場: 日次 usage は `.claude/state/metrics/cloudflare/`、月次・週次 snapshot は
`reference/{monthly,weekly}-snapshots/`、閾値は `reference/budgets{,-daily}.json`。

### R2-STORAGE-01 R2容量のsiteScope分離と再増加検知

- **観測日**: 2026-08-24
- **比較元**: `.claude/state/metrics/cloudflare/snapshots/{2026-08-19,2026-08-22}.json`
- **bucket差分**: アカウント合計 +6,817,934,632 bytes。内訳は stats47 +211,516,897、
  doboku-note -707,638,925、doboku-note-archive +7,314,056,660、stats47-cache 0。
  アカウント増加の最大siteScopeはdoboku-note-archiveで、stats47単独の増加ではない。
- **stats47直接実測**: S3 ListObjectsV2で11,392,548,695 payload bytes / 53,085 objects。
  2026-08-20T17:56:32.044Z以降に更新された現存objectは634,412,512 bytesで、上位は
  `app/blog` 246,000,331 bytes、`incremental-cache` 360,122,060 bytes、
  `estat-api/stats-data` 17,595,007 bytes。これは上書きを含む更新量で、純増値ではない。
- **保持判定**: `gis/**`、`app/**`、`ges/**`、`note/**`、`video/**`は保持規約対象。
  ISRは3世代 / 2,198 objects / 343.44MBで、保持上限4世代以内。allowlist済み旧prefixは0 objects。
- **削除候補**: 投稿後30日超のMP4 2本 / 22.7MBのみ。削除しても無料枠超過を解消しないため、
  本診断では削除せず、週次`cleanup-r2-sns-videos.yml`の対象として維持する。
- **再増加alert**: アカウント合計18GB超に加え、stats47 bucket 12.5GB超を独立metricとして追加。
  ISRは`audit-incremental-cache.ts --keep 3 --assert-max 4`をデプロイ後・週次に継続する。
- **再現コマンド**:
  `npx tsx packages/r2-storage/src/scripts/r2-du.ts --depth 2` /
  `npx tsx packages/r2-storage/src/scripts/audit-incremental-cache.ts --keep 3 --assert-max 4` /
  `npx tsx packages/r2-storage/src/scripts/r2-retention.ts` /
  `npx tsx packages/r2-storage/src/scripts/cleanup-posted-sns-videos.ts`
- **判定**: stats47の診断工程は完了。無制限ISR蓄積は再現せず、アカウント超過は別siteScopeを含む。
  stats47側の削除可能量は22.7MBで解消に足りない。`R2-STORAGE-01`は、doboku-note-archiveの
  保持方針をオーナーが判断するまでactiveに維持する。

### [R2-STORAGE-01] 容量の再実測 (2026-10-11)

- **実測**: `data/cloudflare/history.csv` の r2_storage_gb は 2026-09-26 33.368、10-02 33.338、10-09 33.635 GB。2 週間の増加は +0.27 GB
- **再現コマンド**: `awk -F, '$1>="2026-09-26"{print $1,$13}' data/cloudflare/history.csv`
- **判定**: 判定しない。doboku-note-archive の保持方針 (許容か削減か) をオーナーが決めるまで想定効果値を置けない。削減なら削除量を根拠に `[target: -N GB]` 付きの別行で起票し、許容なら理由と見直し期日をここに書く

- **2026-10-13**: R2-STORAGE-01 を期限超過のまま上限 10 件を塞いでいたため、オーナー指示で improvements.md の active から外し backlog `R2-STORAGE-01` へ移した。effect ラベルは付けていない (未確定)。

### [CF-CPU-URL-01] 市区町村ランキングのクエリ URL をやめ、Workers CPU 時間の課金を下げる

- **観測日**: 2026-11-13 (オーナーの依頼で Cloudflare の請求画面と Workers Observability を内部ブラウザで読んだ)
- **請求の実測**: 請求書は 08-15 $9.61 (IN-75314451)、09-15 $11.40 (IN-79313194)、10-15 $29.02 (IN-83898043)。今サイクル 10-15〜11-13 (30/31 日) は使用料 $30.00 で、全額が Workers CPU ms (合計 1.53B、込み分 30M)。Workers Standard Requests は 3.26M で $0。請求画面の「支払い請求可能な使用量」に R2 の行は無かった。
- **日次記録との一致**: `data/cloudflare/snapshots/` の `workers.totalCpuTimeUs` を 10-15〜11-11 で合計すると 1,453,236,022 ms (CPU が null の日 1 日)。請求画面の 1.53B (11-13 まで) と同じ桁で、日次合計を請求の先行指標に使える。
- **内訳 (直近 24 時間。Workers Observability の `$workers.cpuTimeMs` 合計。2026-11-13 15:20 JST 頃取得)**: 合計 68,479 秒 / 58,392 リクエスト。`/municipalities/ranking/` を含む URL 22,369 秒 (32.7%)、そのうち `pref=` 付き 15,697 秒 (22.9%)・`page=` 付き 3,804 秒 (5.6%)・`q=` 付き 65 秒。`_rsc=` 付き 7,289 秒 (10.6%)。UA 別は PerplexityBot 12,757 秒、bingbot 6,601 秒、YandexBot 5,769 秒、MJ12bot 1,216 秒、SemrushBot 1,166 秒。entrypoint 別は CachedApp 60,996 秒。`/municipalities/ranking/*` と `/ranking/*` の 1 リクエスト平均は約 1.5 秒。
- **構造**: 全国版 `app/municipalities/ranking/[rankingKey]/page.tsx` が force-dynamic で `searchParams` (q・pref・page) を読み、`pageHref()` と `<form method="get">` がクエリ付きの URL を出していた。HTML キャッシュ (Workers Cache) のキーはクエリを含む。171 指標 × 47 県 × ページ送りの URL がクローラーから辿れた。
- **競合する説明と絞った理由**: (a) R2 の読み取り増 — 請求が $0 なので課金の原因ではない。(b) リクエスト総数の増加 — 3.26M で込み分 10M の内側。(c) 人間の閲覧増 — UA 別でクローラーが上位を占める。ただし 1 描画が 1.5 秒かかること自体 (R2 JSON の展開と parse、1 描画内の重複読み) は別の要因として残っており、今回は触っていない。
- **対応**: 原則「サーバーが描き分ける違いはパス。`?` はサイト内検索だけ。ページ送りと自治体名検索は URL に載せない」(2026-11-13 オーナー決定)。全国版から searchParams を外して 1 指標 1 URL にし、旧 `?pref=` `?page=` `?q=` は middleware で 301。送客のない MJ12bot・SemrushBot・DotBot・AhrefsBot・YandexBot を robots.txt で止める。
- **デプロイ日**: 未デプロイ (develop→main はオーナーの指示待ち)
- **想定効果**: [target: -3,800,000 ms/日] 根拠: `page=` 付き 3,804 秒/日が描画なしの 301 に変わる分。`pref=` 付き 15,697 秒/日の削減は、県別パスへ移った後の拠点ごとのキャッシュの効き方で決まるので想定値を置かない。
- **検証コマンド**: 内部ブラウザで dash.cloudflare.com を開いた状態で、Workers → stats47 → Observability のクエリを `$workers.scriptName = stats47`、`$workers.event.request.url includes "pref="` (同様に `page=`)、計算 `sum($workers.cpuTimeMs)`、期間 24 時間で実行する。日次の合計は `node -e "const s=require('./data/cloudflare/snapshots/<日付>.json');console.log(s.workers.totalCpuTimeUs/1000)"`。
- **判定**: effect/pending。**[仮説]** クエリ URL が消えれば `pref=`・`page=` 付きの CPU は 301 の分 (1 件あたり数 ms) まで下がる。**検証期日**: 本番反映の 3 日後。**期日後の判定**: `page=` 付きが 400 秒/日未満なら仮説支持。1,900 秒/日以上残るなら、robots と 301 を守らない UA を UA 別集計で特定し、Cloudflare の WAF カスタムルールを次の手にする。
- **再発防止**: 日次の閾値検査に `workers_cpu_ms` (warning 4,500 万 ms/日・critical 8,000 万 ms/日) と請求サイクルの累計ペース検査を追加。R2 容量の 2 ルールは請求 $0 の実態に合わせて info に下げた。Cloudflare 側の予算アラートは $3.00 の 1 件だけ (今サイクル 1000%) で、段階化はオーナーの許可待ち。

### [CF-CPU-ISR-01] R2 を読む動的 route を実行時 ISR にし、同じ URL の描き直しをやめる

- **観測日**: 2026-11-21 (内部ブラウザで Workers Observability の telemetry query を直接呼んだ。期間は直近 24 時間)
- **請求の実測**: 09-15 $11.40、10-15 $29.02、11-15 $43.71 (11 月分の内訳は Workers CPU 1,736,181,623 ms で $34.74。リクエスト課金は $0)。親セッションが請求書と GraphQL から取った値。
- **内訳 (24 時間・`sum($workers.cpuTimeMs)`)**: 全体 45,821 秒 / 60,421 件。`/ranking/*` 17,273 秒 (37.7%・1 件平均 1.19 秒)、`/areas/*` 15,869 秒 (34.6%)、`/municipalities*` 4,975 秒 (10.9%)、`_rsc=` 付き 1,539 秒 (3.4%)。
- **フル描画 (1 件の CPU が 200 ms 超) の数え方**: `/ranking/*` は 9,710 回・3,100 URL (1 URL あたり 3.1 回/日)・平均 1,674 ms。拠点 (colo) は 116 か所に分かれ、(URL, 拠点) の組 9,163 ≒ 描画回数。版 (デプロイ) ごとに分けると、同じ版の中でも 7,702 回の描画に対して URL は 2,972 で、同じ URL を拠点ごとに描き直していた。`/areas/*` も同じ形 (8,551 回 / 4,315 URL)。
- **原因**: 9 route (`/ranking/[rankingKey]`・`/areas/**` 5 本・`/municipalities/ranking/[rankingKey]`・`/category/[categoryKey]`・`/survey/[surveyKey]`) が `revalidate = 86400` を持つのに `generateStaticParams` が無く、Next.js では `ƒ` (毎リクエスト描画) だった。Workers Cache (拠点ごと・1 日・デプロイで全消し) だけが効いていた。Next.js 公式は、実行時の ISR に空配列か force-static が要ると書いている (https://nextjs.org/docs/app/api-reference/functions/generate-static-params 、2026-11-21 確認)。2026-06-22 の notFound 固着の修正 (#504) で関数を外し、規約に「ƒ でも ISR キャッシュされる」と書いたのが始まり。
- **競合する説明と絞った理由**: (a) クローラーの増加 — リクエスト数は 9 月下旬から 1 日 8〜10 万件で横ばい (親セッションの GraphQL)。(b) 1 描画の重さの増加 — 10 月の段の上がり方の一部はこれで説明できるが、Observability の保持が 7 日で当時の route 別の値は取り直せない ([仮説] のまま。下の「未確定」)。(c) 毎回描画 — 本番で同じパスを Workers Cache を避けて 2 回取ると 2 回とも 2.4〜2.8 秒で `x-nextjs-cache` が付かない。ブログ (`generateStaticParams` あり) は `x-nextjs-cache` が付く。手元の `next start` では空配列にすると 2 回目が `HIT` で 5〜10 ms。
- **対応 (ブランチ `fix/cf-cpu-isr`)**: 9 route に空配列の `generateStaticParams`。主データの読み取り失敗は例外を投げる (ISR に「見つかりません」を保存しない)。`open-next.config.ts` に memory queue (期限切れの描画の作り直し)。再発防止に契約テスト・ガードの直し・route 別 CPU の日次記録と閾値・smoke の ISR 検査。
- **デプロイ日**: 2026-11-21 (#1292 のマージ 13:0x UTC・Deploy to Cloudflare Workers の run 44907074313 success。オーナーの指示「今日のリリースに含める」)
- **反映直後の観測 (2026-11-21 13:23 UTC)**: Workers Cache を避けたクエリ付きで 8 route を 3 回ずつ取った。1 回目 MISS・2 回目以降 HIT または STALE で、title はすべて正常。ただし同じページを続けて取ると毎回 `x-nextjs-cache: STALE` になり、Observability ではデプロイ後の数分で `x-isr: 1` 付きの HEAD (memory queue の描き直し) が 31 件・合計 49 秒あった。Next.js 16.4 はエントリの寿命を incremental cache の `get()` が返す `cacheControl` から読むが、`@opennextjs/aws` 4.1.12 はそれを返さず、描いた isolate 以外では寿命 1 秒とみなされる (`node_modules/next/dist/server/lib/incremental-cache/index.js` の `calculateRevalidate` と、`@opennextjs/aws` 4.2.0 の `adapters/cache.js` の `recordCacheControl` を読んで確認)。上流の 4.1.14 の修正「pages rendered on demand being reported as stale one second after they were written」に当たる。`@opennextjs/cloudflare` を 1.20.18 へ上げる PR #1293。それまでは応答は軽いが裏の描き直しで CPU の削減が出ない (以前より悪くはない)。判定期日は #1293 の反映から数える。
- **#1293 の反映 (2026-11-21 14:24 UTC・#1294・Deploy の run 44912177082 success・オーナーの指示「今日もう一度出す」)**: `@opennextjs/cloudflare` 1.20.18 (`@opennextjs/aws` 4.2.0)。Workers Cache を避けて 3 route を 4 回ずつ取ると、1 回目 MISS・2〜4 回目はすべて HIT (STALE は出なくなった)。Observability (14:25〜14:26 UTC) では `x-isr` 付きの HEAD が 0 件、`/ranking/*` の HIT の要求は 4 件で CPU 合計 5 ms、フル描画は 7 回・7 URL (デプロイ後の最初の 1 回だけ)。HIT の応答に 1〜2 秒かかるのは R2 から ISR のエントリを読む待ち時間で、CPU ではない。smoke の ISR 検査を `ISR_CHECK_STRICT=1` にした。
- **判定期日 (改)**: 2026-11-24 (#1294 の反映の 3 日後)。日次 snapshot の `workers.totalCpuTimeUs` (11-22〜11-24) と、Observability の `/ranking/*`・`/areas/*` の 1 URL あたりのフル描画回数を、上の [target:] と比べる。
- **想定効果**: [target: -15,000,000 ms/日] 根拠: 直近 24 時間の `/ranking/*` と `/areas/*` のフル描画は 19,323 回・30,532 秒。ISR が効けば描画は「版ごとに URL 1 回」になり、この 24 時間 (版 2 つ) では 9,567 回。1 回の CPU が変わらなければ 30,532 × (1 − 9,567 / 19,323) ≒ 15,100 秒/日の削減。月額は約 $27 → 約 $18。デプロイが多い日は効果が減る (1 版増えるごとに約 7,000 URL × 1.7 秒)。
- **検証コマンド**: 日次 snapshot の `routeCpu` (`node -e "const s=require('./data/cloudflare/snapshots/<日付>.json');console.log(JSON.stringify(s.routeCpu.routes.slice(0,3)))"`)。CI の token が Observability を読めない間は、内部ブラウザで dash.cloudflare.com を開き `POST /api/v4/accounts/<id>/workers/observability/telemetry/query` に `packages/ops/src/cloudflare/route-cpu.mjs` の `planQueries` の本文を投げる。日次の合計は `totalCpuTimeUs`。
- **判定**: effect/pending。**[仮説]** 反映後は `/ranking/*` と `/areas/*` の 1 URL あたりのフル描画が「版の数 + 1」以下になる。**検証期日**: 本番反映の 3 日後。**期日後の判定**: 1 URL あたりの描画回数が版の数以下なら支持。3 を超えたまま残るなら、(1) 応答に `x-nextjs-cache` が付くか (smoke の ISR 検査) (2) memory queue の作り直しが Workers Cache に阻まれていないか (3) R2 の incremental cache への書き込みが失敗していないか (Worker のログ `Failed to set to cache`) の順に調べる。
- **未確定**: memory queue の再描画は手元の workerd で動かせていない (worktree では OpenNext のバンドルが sharp の解決で止まった)。反映後に `x-nextjs-cache: STALE` の次の要求が新しい描画になるかを確かめる。10 月の段の上がり方 (10/8・10/13・10/19) のうち、1 描画の重さの増加の分は未計測 (`CF-RENDER-CPU-01`)。
- **同時に分かったこと**: 11-20 (UTC) のフル描画 CPU の UA 1 位は自前の `stats47-page-quality-audit/1.0` (9,564 秒・その日の 21%)。週次の全 URL 巡回が毎回描画を引き起こしていた。ISR 反映後は 1 回目以外は数 ms になるので、反映後の週次で取り直す。
