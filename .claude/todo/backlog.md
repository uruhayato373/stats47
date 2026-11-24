---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-11-01
---

# バックログ (タスクマスタ)

> **役割**: 優先度・時期を問わず「未完了タスクの全量」を保持するマスタ。カード構文・タグ語彙の
> 正典は `.claude/rules/todo-standards.md` (doboku-note と統一の v3-unified スキーマ)。
> **完了したカードはセクションごと削除する** (記録は git 履歴。完了サマリを本ファイルに書かない)。
> stats47 では backlog-loop (CI 日次) が処理するため **ID (`### [ID] タイトル`) を必ず付ける**。
> 行削除は gate 証拠が ledger に要る (`.claude/rules/backlog-loop.md`)。

各カードは `### [ID] タスク名` の直下に `タグ:` 行を置く (機械読取り):

```
タグ: [カテゴリ] [種類:X] [実行:X] [検証:cmd] [起票:YYYY-MM-DD] [期日:YYYY-MM-DD] [進行中]
```

## 🔴 高 — 今月中に着手したい

並び順が着手順。上限 10 枚 (DG081)。2026-11-01 の月次計画で 13 枚 → 8 枚に整理した後、同日のオーナー判断で Gemini 無料枠の復旧を追加し、子育ての2枚を 🟡 へ移し、家計調査の1枚を 🔴 に上げて 8 枚。サイト重点は家計調査へ変更、商品重点は製造品出荷額を維持。10 月の重点の残り・30 日超の未着手・維持領域のカードは 🟡 へ送った。

## 🟡 中 — 2〜3ヶ月以内

### [KAKEI-PRODUCTION-REMAINS-01] 家計調査の展開の制作の残り (貯蓄・負債のテーマ・県ページの品目・note のカード・楽天の枠)
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **起点**: CONTENT-KAKEI-EXPANSION-01 を反映だけに絞ったときの残り (2026-11-22)。
- **次**: ① 貯蓄・負債のテーマが 2019 年の全国家計構造調査だけ ② 県ページの食の品目が 47 県共通の 6 品目 (area-databook-designer の判断) ③ `KAKEI-MULTIAXIS-01` の残り 1 件 (貯蓄・負債の都市比較) ④ `b-kakei-expense-*` 10 本の note に有料 note のカードとマガジンへのリンクを足すか (#1064。note の編集はオーナー承認) ⑤ 楽天の枠の「納豆」の詰め込み出品の扱い。サービスと家賃の 7 指標の改名はオーナーの保留のまま。
- **停止条件**: 年次値と 3 年平均、県庁所在市と県全体、支出額と購入数量を混同する候補は公開しない。薄い記事を作らない。
- **完了条件**: ①〜⑤ がそれぞれ実装されたか、見送りの理由が書かれている。

### [KINDLE-K-S1-01-REPUBLISH-01] K-S1-01 を「9つ」の表紙で出し直す前に、撤去した第 9 章の扱いを決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-22] [領域:商品] [待ち:判断]

- **済み (2026-11-22)**: 14 冊の紹介文とキーワードの KDP への反映を読み直しで確かめた (KDP-LISTING-COPY-01 を閉じ、効果の比較は `improvements.md` の KDP-LISTING-COPY-OBS-01)。K-S1-01 の表紙を「47都道府県 × 9つの家計データ」に描き直し、表紙だけを差し替えた v11-20261122-cover9 を保全した (R2 `media/kindle-cover-assets/K-S1-01/67ed707e0422/`・archive revision `cd6911d727141fd2`)。
- **止まっている理由**: 受領記録 (`write-review-receipt.mts`) が「metadata.authoredSha256 が現行原稿と一致しない」で止まる。v10 の後に書籍の定義が変わったため、今の原稿から作り直す必要がある。作り直すと、第 9 章の素材のブログ `black-tea-income-gap` が 11-13 に公開 R2 から撤去されている (`5324d040ef`) ので章が消え、ブログ由来の章が 8 本になって「9つ」と合わなくなる。
- **決めること**: (a) 紅茶の章を別の家計の指標の章に差し替えて 9 章を保つ (b) 8 章にして表紙を「8つ」で描き直す (c) 撤去したブログを戻す。決めたら作り直し → blog-critic → 受領記録 → 保全 → `kdp-publish --update` で表紙と原稿を差し替える (オーナー承認済み・2026-11-22「9つに描き直して出し直す」)。
- **完了条件**: K-S1-01 の表紙の数と章の数が合う版が KDP で販売中になっている。

### [DATA-PACK-BUNDLE-01] 作り直したデータ集のパック 13 本を note の有料記事へ差し替える (数日に分ける)
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-05] [領域:商品] [待ち:承認] [待ち:ログイン]

- **済み (2026-11-22)**: 地図の境界を国土数値情報 N03 系から e-Stat「令和2年国勢調査 町丁・字等別境界データ」を都道府県で結合したものへ替えた (`scripts/build-prefecture-boundary.mts`。47 県・人口が国勢調査の総人口と一致)。時系列 (縦持ち CSV・指標ごとの Excel)・全指標の PowerPoint と SVG の地図の生成器を足した (`generate --id <ID> --version <V> --bundle`)。P-03 で生成して図形の数 2,350 (50 指標 × 47 県) を確かめた。オーナー決定 (11-22): 公開中の 13 本も e-Stat の境界の版へ差し替える。
- **次 (実行順)**: ① P-01〜P-11 を 1 本 1 ZIP で生成する (どれも 50MiB 未満。実測 6.3〜24.2MB) ② P-12 (161MB)・P-14 (58MB) は分野ごとにまとめて 50MiB に収める (オーナー決定 11-22「大きい分野ごとにまとめて数日で」) ③ note の添付は 1 日 10 回までなので 2〜3 日に分けて差し替える ④ 添付と無料部分の説明 (`data/note/paid-landing/`) とカタログ `data/note/articles.json` を同じ差分で直し、差し替えた日を `data/products/price-history.json` に記録する。価格は変えない。
- **注意**: 今の snapshot は納品済みの版と指標の数が違う (P-01 は 134 → 155)。固定 SHA の納品版ではなく、新しい版の生成として扱う。PowerPoint・Excel の実機での確認はしていない。境界のファイルは `.local/data-packs/_boundary/` (30 日の掃除の対象。消えたら `build-prefecture-boundary.mts` で作り直す)。Kindle の `build-cover-background.mts` も同じ境界を読むようになった。
- **完了条件**: 13 本の添付が新しい中身に替わり、カタログ・無料部分の説明・`price-history.json` が同じ差分で直っている。

### [PRODUCT-REFERRAL-MEASURE-01] note の本文リンクに計測用の UTM を付け、商品への送客を販売まで測れるようにする
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run products:sales --workspace=@stats47/product-factory -- validate] [起票:2026-11-03] [領域:商品] [待ち:ログイン]

- **済み (2026-11-14)**: 計測コード (GA4 の `product_click`・販売台帳の `coverage`・UTM 規約 `config/inbound-utm.mjs`) は本番反映 #1272 で main に入り、実験 EXP-013 を running にした。6 週の観測は `improvements.md` の `PRODUCT-REFERRAL-OBS-01` (判定日 2026-12-26) へ引き渡した (2026-11-22)。
- **残り**: EXP-013 の対象記事だけ、note の本文リンクに UTM を付ける (`node .claude/scripts/note/update-published-navigation.mjs --slug <key>`。note の 403 が解けてから、ログインは人手。全記事を一括で変えない)。Kindle の出典ページのリンクは次の再アップロード (`KDP-K-S1-08-REUPLOAD-01`) で入る。
- **禁止**: アトリビューション分析はしない。欠測を 0 にしない。note の編集はオーナー承認の後。
- **完了条件**: EXP-013 の対象記事の本文リンクに UTM が付き、公開 API の本文で確かめた。

### [AFF-GA4-WEEKLY-GATE-01] 週次のアフィリエイト計測 (affiliate-ga4-weekly) が計測ゲートで 6 回続けて落ち、アフィリエイトの観測が 11-14 で止まっている
タグ: [収益化] [種類:不具合] [実行:対話] [検証:gh run list --workflow affiliate-ga4-weekly.yml --limit 1] [起票:2026-11-21] [領域:アフィリエイト]

- **観測 (2026-11-21・週次レビュー W46)**: `affiliate-ga4-weekly.yml` は 6 回連続失敗・最終成功から 25 日 (`.local/weekly-audits/2026-11-21/ci-health.log`)。 (参照: run 43973234812・#1207)
- **次**: ① 在庫 snapshot (Refresh Affiliate Inventory & Compliance) が 10 日を超えて古い理由を run 履歴で確かめる ② A8 の照合不足と当月の成果欠落が、土曜の認証付き計測 (a8 は 2026-11-20 に pass) の記録と workflow の読む場所の食い違いかを確かめる。
- **完了条件**: `affiliate-ga4-weekly` の最新 run が success で、#1207 が閉じている。
- **禁止**: ゲートの閾値を緩めて通さない (`.claude/config/` の基準はオーナー判断)。

### [PROVENANCE-LINK-CHECK-01] 出典のリンク検査 2 本 (都道府県統計・オープンデータ) の error を、リンク切れか検査の故障かに分けて直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run weekly:audits] [起票:2026-11-21] [領域:データ]

- **観測 (2026-11-21・週次レビュー W46)**: 週次監査 provenance が ❌。`check:prefecture-statistics-links` と `check:open-data-links` が error (`.local/weekly-audits/2026-11-21/provenance.log`)。gsi の出典ページは fetch failed のあと再確認で HTTP 200。
- **次**: ログから失敗した URL を読み、出典の移転・削除 (台帳を直す) か、検査側の取得失敗 (再試行・タイムアウト) かに分ける。
- **完了条件**: 週次監査の provenance が ✅。

### [SCRIPTS-TO-PACKAGES-01] パッケージのスクリプトが .claude/scripts の道具を呼ぶ 12 ファイルを片付ける
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-claude-boundary.mjs] [起票:2026-11-19] [領域:サイト]

- **済み**: アプリと packages が読む `.claude/scripts` の部品 69 を packages へ移した (2026-11-19 リリース・PR #1288)。
- **次**: 基準 `.claude/config/claude-boundary-baseline.json` の理由が「減らす対象」の 11 ファイル (`packages/ai-content/src/scripts/{generate-blog-article,generate-parallel,write-blog-batch,write-blog-headless}.ts`・`packages/data-configs/scripts/{build-estat-availability,validate-business-plan}.ts`・`evidence/japan-zue.ts`・`packages/r2-storage/src/scripts/r2-key-classes.ts`・`packages/r2-storage/vitest.config.mts`・`packages/ranking/src/scripts/audit-survey-taxonomy.ts`・`apps/web/scripts/export-yoy-timeseries.ts`)。呼ぶ側を `.claude/scripts` へ移すか、呼ばれる道具を packages へ移す。記事の lint・e-Stat の API 層・Google 接続は SCRIPTS-TO-PACKAGES-02 で packages/ops へ移したので、それを呼んでいた行は import を書き換えるだけで消せるものがある。
- **次 (2) テーマの取り込みの残り 23 本 (2026-11-22 実測)**: `.claude/scripts/themes/` に `ingest-*.mjs` 23 本と `stage-theme-expansion.mjs` (合計 1.88 万行。最大は `ingest-energy-gender.mjs` 2,657 行) が残り、同じ種類の 26 本は `packages/ops/src/themes/` にある。2026-11-19 の移動 (`df05bfbd2c`) は「テストが読む本体」を基準にしたので、テストの無い取り込みの CLI が残った。テストを書く回に `npm run claude:scripts:move` (`keepEntry: true`) で移す。指標の定義 (`data/metrics/*.ts`) と出典台帳 (`data/themes/sources/*.json`) が旧パスを名指ししているので、旧パスに入口を残し、定義のファイルは書き換えない。
- **停止条件**: 移した部品を使う週次の workflow を、移すたびに動かして確かめる。
- **完了条件**: 基準に残る行が恒久の例外 (品質のゲートの基準・パスを入力として持つだけ) だけになる。テーマの取り込みは `packages/ops/src/themes/` に 1 か所にまとまり、`.claude/scripts/themes/` には入口だけが残る。

### [PACKAGES-DEPS-FOLLOWUP-01] packages の依存の整理で残した 2 点 (data-configs と ops の循環・turbo の inputs の重複) と、main への反映期限
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run knip:deps] [起票:2026-11-21] [期日:2026-11-30] [領域:サイト] [待ち:承認]

- **済み (2026-11-21・develop)**: packages の宣言を import に合わせた (未宣言の内部・外部依存を宣言し、使われていない leaflet 一式・gis の d3・product-factory の gis などを削除)。
- **① 済み (2026-11-21・オーナー指示)**: `packages/database` とローカル SQLite 層 (それを開くスクリプト 11 本・skill 3 本・agent `db-schema-manager`・hook `check-local-db.js`) を削除した。KSJ の候補台帳は `data/geo/ksj/catalog.json` (台帳 `geo.ksj-catalog`) へ移し、`ksj-catalog-monthly.yml` の書き戻し先も変えた。**次回の月次 (2026-12-01 JST 03:00) より前に develop→main のマージが要る** (main の workflow 定義は旧パス `packages/database/seed/` へ書こうとして失敗する)。ブログのスナップショット生成の fallback は古い seed から記事台帳 `blog.articles` に替えた。
- **② `data-configs/scripts` → `@stats47/ops` を宣言していない**: `ops/src/data/lib/print-metric-*.ts` が `@stats47/data-configs` を読むので、逆向きも宣言すると turbo が循環で止まる。読まれているのは `@stats47/ops/datasets/dataset-shape.mjs` (形の検査) だけなので、これを data-configs か下の層へ移せば循環が消える。product-factory も同じファイルの `NOTE_URL_PATTERN` を読む。
- **③ `turbo.json` の `data/**` の inputs 30 行**: build・lint・type-check・test に同じ内容が 4 回書かれ、同期を確かめる検査が無い。turbo は inputs の共有 (変数) を持たないので、`config/datasets.mjs` から生成して `--check` で一致を見る形が候補。
- **完了条件**: ①の変更が 2026-12-01 より前に main へ入り、その月次の run が `data/geo/ksj/catalog.json` を書き戻す (または増減なしで success)。②の循環が消えて `data-configs` に `@stats47/ops` を宣言でき、③の inputs が 1 か所の正本から作られる。`npm run knip:deps` と `npm run type-check` が通る。

### [DATA-SCHEMA-FOLLOWUP-01] data/ の型と Schema の二重管理・Schema の無い作業状態・寿命の残り
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-22] [領域:サイト] [待ち:判断]

- **済み (2026-11-22・develop・未 push)**: 外部キー 54 本を `config/datasets.mjs` に宣言 (231 → 285 本。)
- **① 型と Schema の二重管理 (オーナー判断)**: `data/` の JSON を読む 168 の読み込み口のうち 131 が手書きの型へ `as` でキャストし、Schema から型を作る仕組みが無い。案 (a) Schema から型を生成して手書きの型を置き換える (json-schema-to-typescript などの依存が 1 つ増える)、案 (b) 手書きの型は残し、型と Schema の項目の一致をテストで固定する (`packages/data-configs/scripts/generate-metric-schema.ts` と同じ考え方)。
- **② Schema の無い作業状態の残り**: コードが読むのに Schema の無い state・series が約 40 行。うち `affiliate.audits` (`data/affiliate/{name}-latest.json` の 9 ファイルが別々の形) と `search-growth.state` (3 ファイル・14MB が別々の形) は 1 つの Schema にできないので、行をファイルごとに分けるか `oneOf` にするかを決める。`affiliate.catalog` は書き手が 2 本 (`affiliate-status.mjs --write`・`affiliate-apply.mjs --commit`) で、afb の項目の識別子が書き手によって `pid` と `promotionId` に分かれる (afb 118 件のうち 19 件が両方を持つ)。識別子を 1 つにそろえてから書き手に形の検査を入れる。
- **③ 書き手と実データの食い違い (2026-11-22 の Schema の引き締めで見つけた分)**: `data/seo/improvement-log.json` の 2026-11-14 の `lastReview`・`reviews[]` は `note`・`reason` を持ち `period`・`snapshotHash` が無い手書きの行で、書き手 (`packages/ops/src/search-growth/lib/keyword-cycle.mjs`) はこの形を書かない。`data/affiliate/affiliate-catalog.json` の moshimo の履歴 16 行 (2026-07-28) は `status` が無く、今の書き手はこの形を書かない。どちらも Schema は任意の項目として受けている。
- **④ `note.dashboard` の寿命**: ファイル名が集計期間の開始日で始まる (`2021-05-01_2026-09-11_<取得時刻>.json`) ので、名前で並べて古いものを消す今の寿命の仕組み (`prune-state-snapshots.mjs`) では、取得の新しい全期間のファイルから消えてしまう。取得時刻で並べる形を寿命の仕組みに足すか、ファイル名を取得時刻から始める形に変えてから寿命を付ける (21 ファイル・8.1MB)。
- **完了条件**: ①の方針が決まり、型と Schema のずれが機械で検出される。②の 2 行が Schema を持つ (または行が分かれる)。`npm run check-datasets` と `npm run type-check` が通る。
- **追補 (2026-11-22)**: 11-22 に足した参照 `sns.buzz-map-specs` の `spec.data.values.$keys` → `areas.cities` が、`no-station-muni.json`・`towns-villages.json` の cityCode 01695〜01700 (北海道の北方領土の 6 村) で警告になる。areas.cities に無いのが正しいなら、spec から外すか参照の `where` で除く。

### [MAP-RULES-DEDUP-01] 地図の画像の作り方に残る重複 (配色の解決・使われていない地図) をまとめる
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-19] [領域:サイト]

- **起点 (2026-11-19 オーナー指摘「サムネイルを生成するルールも冗長になっていないか」)**: 注目のランキングのカードの地図を直したとき、地図の画像の経路 12 本を棚卸しした。
- **次**: ① 配色の解決が 3 通りある。サムネイル (`packages/visualization/src/server/generate-mini-prefecture-svg.ts`) は順位で塗る。台帳の型 (`apps/remotion/src/features/data-cards/tile-scale.ts` の `resolveTileScale`) は値で塗る (`packages/types/src/color-policy.ts`)。Remotion のコロプレス (`apps/remotion/src/shared/utils/choropleth.ts` の `getInterpolator`) は配色の名前をカタログ (`d3KeyOfColorScheme`) と照らさず、知らない名前で黙って青に落ちる。どれに寄せるかを決めて 1 つにする (サムネイルを値で塗ると、外れ値の多い指標で色がつぶれるかを先に確かめる)。② `apps/web/src/features/ogp/JapanMapSvg.tsx` (手書きの多角形)・`RankingOgp`・`AreaOgp` の使い手を確かめ、無ければ消す。③ 地域コードの写しを止める検査 `packages/area/scripts/check-area-year-entrypoint.mjs` は決まった関数名と 47 県名の配列しか見ず、地図の部品が `"47"` を直書きしたり TopoJSON の `N03_007` を自前で正規化したりしても通る。止める形を足す (縮小専用の baseline で)。
- **停止条件**: 配色を変えると全媒体の画像が変わる。① は見本の画像 (管理画面の型の見本) で前後を比べ、オーナーの確認を取ってから入れる。
- **完了条件**: 配色の解決が 1 つの関数を通り、使われていない地図の部品が消える。

### [GIT-PUSH-SSH-TIMEOUT-01] 会社の Windows PC で、push の前の検査が通った後に git が exit 141 で止まり push が届かない
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [起票:2026-11-16] [領域:管理]

- **起点 (2026-11-16 観測)**: `git push origin <branch>` が、push の前の検査 (`pre-push-tests.mjs`、約 10 分) がすべて通った直後に exit 141 で止まり、リモートは更新されなかった。
- **[仮説]** git は検査を走らせる前に GitHub との SSH 接続を開き、約 10 分の検査の間に社内ネットワークか GitHub がその接続を切る。**検証**: ① 検査が短く済む push で 141 が出ないか ② `~/.ssh/config` の github.com に `ServerAliveInterval 30` を入れて (オーナーの了解の上) 検査ありの push が通るか。
- **次**: 仮説が支持されたら ② の設定を入れるか、検査を先に別で走らせてから push する手順を決める。支持されなければ git の trace (`GIT_TRACE=1 GIT_SSH_COMMAND="ssh -v"`) で止まる位置を見る。
- **禁止**: 検査を毎回 `--no-verify` で飛ばす運用にしない (飛ばすのはオーナーの許可のあるときだけ)。
- **完了条件**: この PC で検査ありの push が 3 回続けて届く。

### [BACKLOG-LEDGER-PARALLEL-FLAKE-01] 台帳の並行記録のテストが Windows で 3 回に 1 回落ち、push を止める
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [検証:node --test .claude/scripts/backlog-loop/__tests__/record-backlog-outcome.test.cjs] [起票:2026-11-16] [領域:管理]

- **起点 (2026-11-16 観測)**: この会社の Windows PC で、`record-backlog-outcome.test.cjs` の「並行して記録しても 1 件も欠けない」が単独で 3 回中 1 回落ち、push の前の検査 (`pre-push-tests.mjs`) では 2 回続けて落ちて push が止まった。
- **観測 (2026-11-24)**: 同じ PC の push の前の検査で再び落ちた (記録の 1 件が欠けた)。単独では 3 回中 1 回落ちた。同じ検査で `data-refresh-scoped-workflow.test.mjs` も Windows で必ず落ちる (`WINDOWS-LOCAL-GATES-01`) ので、この PC からは検査を飛ばさないと develop へ push できない。
- **[仮説]** 同時に 24 本がロックを取り合い、待ちの上限で諦めたプロセスが 1 で終わる。負荷の高い push 前の検査で落ちやすい。**検証**: 失敗したプロセスの stderr を残すよう `stdio` を変えて再現し、理由を読む。
- **次**: 理由を確かめてから、ロックの待ち方 (record-backlog-outcome.mjs) かテストの並列数のどちらを直すかを決める。テストを消したり並列数を 1 にしたりして通すのは禁止 (同時書き込みで欠けないことを守るテストのため)。
- **完了条件**: 単独で 20 回続けて通り、push の前の検査でも落ちない。

### [NSM-REVENUE-INPUTS-01] 収益を日 × 商品の明細で持ち、土曜の週次レビューをスケジュール済みタスクで自動実行する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test packages/ops/src/metrics/__tests__/revenue-rollup.test.mjs] [起票:2026-11-14] [領域:管理] [進行中]

- **方針 (2026-11-14 オーナー決定)**: 売上は販売元のレポートの粒度のまま、日 × 商品 × 種類の明細を `data/revenue/daily/<チャネル>-<年月>.json` (台帳 `revenue.daily`・Schema 付き) に持ち、週・月・年は `revenue-rollup.mjs` の集計で作る。明細も git に置く。週次レビューはこの Mac のスケジュール済みタスク (X 返信の承認リストと同じ方式) にし、最後まで自動で進める。計画の全文は `~/.claude/plans/gentle-strolling-tide.md`。
- **済み**: 明細の Schema・カタログの行・集計の関数。
- **次**:
  1. **Kindle の取得期間を「昨日」から直近 35 日に替える。** パーサ (`parseKdpReport`) は日付の範囲に対応済み。レポート画面でどのタブ・期間指定を選ぶと日別・書籍別の xlsx が落ちるかは、ログインした画面で確かめる (`collectKdpReport`)。それまでは週 1 回の取得で 1 日分しか明細に入らず、有料購入は判定不能のまま。
  2. **note の明細を実取得で確かめる。** 販売履歴 (`/dashboard/sales?datespan=YYYYMM`。購入 1 件ごとに記事の URL・日時・金額) を当月と前月の 2 か月分読み、日 × 記事の行にする実装は入れた (`note-sales.mjs`・`parseNoteSalesHistory`)。購入者名はブラウザの外へ出さない。売上は閲覧数の取得より先に読む順へ替えた (再確認が約 30 分で切れるため)。画面の構造は 2026-07 の 1 件でしか確かめていないので、次の土曜の取得で `data/authenticated/latest.json` の note の `dailyRows` と `dailyCode` を読み、行が入ることを確かめる。購入が多い月の続きの表示 (ページ送り) は未確認で、検出したら不完全として書かない作り。
  3. AdSense の日別 (API)、A8・楽天の日別を明細に入れる。入れば「月累計なので合計に入れない」の但し書きが外れる。
  4. 集計の生成物 `data/revenue/rollup/{weekly,monthly,yearly}.json` を書くスクリプトと、管理画面 `/revenue` の週・月・年・商品別の表。`summarizePaidPurchases` を明細の集計に替え、`revenue-history.json` への依存を外す。
  5. スケジュール済みタスク `stats47-weekly-review` を作り、1 回通す。本体は sonnet・medium、判断は `strategy-advisor` へ 1 回、収集用の agent は起動しない。`weekly-review`・`weekly-plan` の SKILL.md を無人で進める形に直す。初回のトークンを `model-usage` で記録する。
- **停止条件**: パスワード・2 段階認証・CAPTCHA を自動で通さない。欠測を 0 円で埋めない。main へのマージと本番デプロイをタスクから行わない。
- **完了条件**: 管理画面のホームで週次収益と有料購入が金額と件数で出る週があり、土曜のタスクがレビューと計画の保存まで 1 回通った。
- **`revenueDaily` が空の理由 (2026-11-24)**: `summarize.mjs` は取得元が `quality.daily` を渡したときだけ明細を書く。11-21 の Mac の取得 (`8512b1f34`・`data/authenticated/latest.json`) では、note の販売履歴が `revenueStatus: verification_required` (再確認を求められた) で `daily` が null、kdp は failed、a8・rakuten・gsc は `daily` を出す実装がまだ無い (次の 3)。コードの不具合ではなく認証待ち。note の再確認と kdp の再認証の後、11-28 の取得で次の 2 (note の `dailyRows`) を読む。

### [THEME-PAGE-REVIEW-01] テーマページを、全ルート込みの実績で採点し、共通の UI と指標を見直す
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run theme:portfolio:audit] [起票:2026-11-14] [領域:サイト] [進行中]

- **ゴール (2026-11-14 オーナー決定)**: 成果は 4 つで測る。G1 検索からのクリック (表示 800 以上でクリック率が中央値 2.33% 未満の 13 テーマを中央値へ)・G2 読みやすさの品質基準 (下の 6 項目の違反 0)・G3 サイト内の回遊 (テーマ → ランキングの移動 21% を悪化させない)・G4 データの信頼性 (品質の監査が 7 日以内・実験が全ルート込みで判定済み・全 56 テーマの指標が見直し済み)。ページの長さはゴールにしない。畳み・開閉の UI は使わない。本番への反映は段ごとにオーナーが確認してから。計画の全文は `~/.claude/plans/gentle-strolling-tide.md`。
- **品質基準 6 項目** (`measure-theme-weight.mjs` の violations): 最初の画面に数値のタイルが 2 個以上・数字の途中で折り返さない・値の無いタイルが無い・横にはみ出さない・表の 1 列目が 1 行 4 文字未満で折り返さない・ページが 200 を返す (港湾・鉄道・道路は県別に出さない設定なので測らない)。
- **基準 (本番・2026-11-14・`data/themes/ui-weight/2026-11-14.json`)**: 218 ページ中 135 ページに違反。表の 1 列目が読めない 56 テーマ (スマホ幅)・最初の画面に数値が少ない 16 テーマ (主に全国版)・値の無いタイル 3 テーマ。採点表は管理画面 `/quality/theme-viewpoints`。
- **済み (段 1)**: 全ルート込みの集計、品質基準の計測、品質の監査の復旧 (記録が 1 MiB を超えて書けなくなっていたのを分割して書く形に直した)、実験の判定の整理 (判定待ち 55 → 10。)
- **次**:
  1. 段 2 共通の UI の残り: 市区町村のテーマと地域分析のページの表示確認、骨組みの契約テスト。**本番の測り直し (2026-11-15・`data/themes/ui-weight/2026-11-15.json`)**: 違反のあるページは 218 中 135 → 34。表の 1 列目が読めない 114 → 2 (土砂災害の県別)・値の無いタイル 6 → 0・200 以外 0 (計測中に 1 ページが一時的に 503、測り直して 200 の値に差し替えた)。残るのは、出せる数値が無い全国版 11 テーマ 22 ページ (気候・物価・地震・環境・健診・地価・土砂災害・自治体のデジタル化・職業別の賃金・エネルギー・津波) と、最初の画面の数値が 1 つの全国版 5 テーマ 10 ページ (高齢化・貨物と物流・地理的アクセス・地方財政・スポーツ)。ページの高さはスマホ幅で全国版 −4.5%・県別 −4.6%。値の単位・値の無いタイル・読めない表・県間移動の表は済み。手元の全 56 テーマの計測 (2026-11-14) で、違反のあるページは 218 中 135 → 50 (うち 22 は出せる数値が無い全国版 = データの穴)。その後に数字の折り返しと検算の表を直し、該当テーマの測り直しで数字の折り返し・横のはみ出し・値の無いタイルは 0。残るのは「最初の画面に数値が少ない」6 テーマ (高齢化・地震・地理的アクセス・地方財政・スポーツ・津波の全国版か県別。段 4 で数値タイルのある章を先頭にする) と、土砂災害の県別の集計表で県名のボタンが 2 行になる 1〜2 行。**見出しの直下に主指標の値を並べる「要点のタイル」は入れない (2026-11-14 オーナー決定)**。同じ値が本文に 2 回出るため (2026-10-30 に「主なデータ」の節を外したのと同じ理由)。最初の画面に数値が入らないテーマは、段 4 の指標の見直しで数値タイルのある章を先頭にする。`THEME-DASHBOARD-TEXT-TRIM-01`・`THEME-SINGLE-CARD-BUNDLE-01` をこの中で進める。
  2. 段 3 検索の題と説明文: **題はいま変えない**。題・説明文は 2026-11-12 21:54 の本番デプロイで全テーマ共通の仕組みに統一済み (`THEME-SEO-UNIFY-01`) で、同カードが 4 週の測定中は題を変えないと決めている。対象 13 テーマの低いクリック率は変更前 (〜11-05) の数字。この変更を 13 テーマぶん、全ルート込みの実験 `THEME-COPY-20261112-<テーマ>` として登録した (d28 = 12-10、d56 = 2027-01-07)。12-10 に暫定の結果を見て、中央値に届かないテーマだけ題の語を直す。
     - 検索語の所見 (GSC 2026-10-09〜11-05・`gsc-query.mjs --dims query --filter 'page*=/<テーマ>'`): 県別ページに来るのは「県名 + 具体的な語」(「新潟県 気候」「北海道 物価」「高知県 gdp」「鳥取県 高齢化率」「財政力指数 新潟県」「広島県 土砂災害警戒区域」「長野県 森林面積」)。8〜10 位に出て押されていない。題のテーマ名が検索語と違うテーマがある (地域経済 → 検索語は「gdp」、物価・消費 → 「物価」、自然環境 → 「森林面積」)。題を直すときは、テーマ名でなく検索語に出る語を先頭に置く。
  3. 段 4 指標の見直し: Workflow で 1 回 5 テーマ (調査 `theme-researcher` → 設計 `theme-designer`。agent はファイルを書かない)。案は機械で検査し (実在しない指標・重複・別のテーマの主指標・出典の URL・調査の紐付け・`validate:catalog`・カタログのテスト)、通ったものを `apply-design.ts --approved` で適用して、提案文書 (`data/themes/reviews/2026-11-14-theme-<key>.md`・`implemented-pending-release`) を残す (2026-11-14 オーナー指示: 提案は基本的に承認、出し直しは設計し直して自動で承認)。**済み (38 テーマ)**: 測定中の実験が無いテーマを組み直し、登録済みの指標 87 件を副指標として載せた。手元の計測で違反のあるページは 146 中 87 → 22 (16 は全国の値が無い全国版、6 は全国版で最初の画面の数値が 1 つ: 貨物と物流・地理的アクセス・スポーツ)。県別・スマホ幅の最初の画面の数値は 24 テーマで増えた。**残り**: 実験のある 17 テーマは提案文書だけを作り、カタログは変えていない。実装は実験の判定の後で、年間の予定の `THEME-PAGE-REVIEW-HELD-01` (期日 12-10) が持つ。「食卓と家計の支出」は 189 指標を表と数値タイルで手作りしたテーマなので、機械の組み直しの対象から外した。公開日に、組み直したテーマの実験を `metricScope: all-routes` で登録する。費用の実績は 1 回 (agent 10 体) で約 107〜120 万トークン。
  4. 段 5: 反映 28 日後と 56 日後に G1・G3 を全ルート込みで記録し、未達は原因と次の手を残す。
- **完了条件**: G2 と G4 の目標を満たし、G1 と G3 は反映 56 日後の実測と判定が記録されている。

### [THEME-URBAN-PARKS-HISTORY-LOSS-01] 都市公園の観測値から 1976・1977 年が消えている
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run theme:portfolio:audit] [起票:2026-11-14] [領域:データ]

- **事実**: 2026-11-14 の品質監査で `history-loss` の error が 1 件。
- **次**: 2026-10-05 以降に `urban-parks` を再投入した記録を探し、年が減ったのが意図 (定義の変更) か取りこぼしかを確かめる。取りこぼしなら再投入、意図なら監査の基準を更新する。
- **完了条件**: `npm run theme:portfolio:audit` の品質の error が 0。

### [BLOG-ISR-STALE-ON-REVISE-01] 改稿版を公開しても、公開前に開かれたページは旧版のまま残る
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **起点**: 2026-11-13 に家計調査の改稿 96 本を `blog-auto-publish.yml` で公開した。
- **対象 18 本**: aichi-food-culture banana-consumption-quantity bonito-vs-oyster-fish-map earthquake-insurance-prefecture-gap garden-plants-expenditure-ranking ishikawa-food-culture iwate-food-culture kagoshima-food-culture kumamoto-food-culture mayonnaise-consumption-expenditure mie-food-culture nagano-food-culture nara-food-culture natto-production-vs-consumption sea-bream-expenditure-ranking strawberry-consumption-prefecture-gap tottori-food-culture yokan-expenditure-ranking
- **次**: 公開 CI の CDN 消去の前に `packages/r2-storage/src/scripts/purge-isr-routes.ts --routes /blog/<slug> --apply` を足すか、OpenNext に再生成の queue を設定する。足した後は改稿 1 本で、公開前に開いたページがデプロイなしで新版になるかを確かめる。
- **完了条件**: 改稿版の公開後、デプロイなしで本番ページの h1 と本文が新版になる。18 本は次の本番デプロイで新版になったことを確かめる。

### [BLOG-GATE-RANK-CONTEXT-01] quality-gate の題の検査の抜けと、順位の照合の取り違え
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **起点 (2026-11-13・家計調査 96 本の審査)**: ① 題の「N位」の検査 (`quality-gate.mjs` の `NG_PATTERNS`) は `title: "…"` の形だけに掛かり、引用符なしの題は素通りする (`title: もやし消費量1位山形、沖縄の2.8倍差` など 3 本が通った)。
- **次**: 題の検査は引用符の有無に依らない形にし、公開済みの題で該当数を測ってから blocker にするかを決める。順位の照合は「N位以内」「N位を引き離し」「前年」「AのN位からBのM位へ」を対象から外し、非検出のテストで固定する。
- **完了条件**: 上の 4 文が blocker にならず、引用符なしの題も検査に掛かる。

### [OPENDATA-ARCHIVE-01] e-Stat 外の原本を非公開 R2 に一度だけ固定し、共通スキーマ経由で展開する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-14] [領域:データ]

- **背景**: e-Stat 外の取り込み (`.claude/scripts/themes/ingest-*.mjs` 約 50 本) がそれぞれ原典を取りに行くため、同じサイトを何度も取得・確認している。
- **済み (2026-11-14・`99bd3ce5b` ブランチ `claude/open-data-archive`)**: 段 1 の基盤 (台帳 `open-data.fetch-recipes`・`open-data.snapshots`・`open-data.expansion`、取得の型 5 種の `.claude/scripts/open-data/fetch-source.mjs`、正規化 `normalize-source.mjs`、非公開 R2 の 2 区分、workflow `open-data-source-archive.yml`)。
- **済み (2026-11-14・段 2)**: 136 件すべてに recipe があり、`--all --dry-run` で 33 件・約 4.3GB が取得可能 (失敗 0、商用可 23・不明 10)。
- **済み (2026-11-15・段 3〜4)**: 本番反映 (PR #1274) の後、`open-data-source-archive.yml` を提供元・データセット単位で 1 本ずつ起動し、31 件・1,231 ファイル・4,287MB を非公開 R2 の `open-data/raw/` へ保存した。
- **済み (2026-11-15・段 5 の宣言)**: 12 件の正規化の宣言を `recipes.json` に書いた (Codex)。
- **済み (2026-11-15・段 6)**: 正規化表 12 件から展開候補 87 件を `data/open-data/expansion.json` に記録した (Codex。)
- **済み (2026-11-15・段 6 の再判定)**: blocked 47 件を再判定し、planned 28・rejected 37・blocked 22 にした (Codex。)
- **済み (2026-11-15・段 7 の準備)**: 県ランキング 5 本の指標を isActive: false で登録した (Codex): 中学生の数学平均正答率・小学生の算数平均正答率・熱中症救急搬送人員 (人口 10 万人当たり)・自分によいところがあると思う中学生の割合・第 1 当事者が 75 歳以上の交通事故 (人口 10 万人当たり)。
- **済み (2026-11-16・段 7 の取り込みと公開の準備)**: 本番反映 (PR #1277) の後、`external-metric-ingest.yml` (ingest=open-data-rankings) で 5 本の観測値を公開 R2 の `app/stats/<key>/values.json` へ上げた (run 43772088322。)
- **残り**: (段 2 の続き) 国交 DPF の 34 件は GraphQL API で鍵 `MLIT_API_KEY` が要る。取得の型に `graphql` を足すか、ファイル URL を解決して http-file にするかを決め、オーナーが GitHub secret に鍵を登録する。法人番号・大学ポートレート・CiNii など鍵の要る API も同じく secret の登録待ち。J-FLEC は CI から 403 なので、Mac から取るか `skip` (no-machine-access) にするかを決める。(段 5 の続き) `mode=normalize` は main のコードで動くので、次の本番反映の後に `gh workflow run open-data-source-archive.yml --ref main -f mode=normalize -f target=dataset:<id> -f dry_run=false` を 12 件それぞれ起動し、正規化表を非公開 R2 へ上げる (r2-write の待機枠は 1 本だけなので、ほかの r2-write の run が無いときに 1 本ずつ)。農業集落カード (1.1GB) は正規化の上限 256MB を超えるので見送った。ほかの商用可の残りは、地点・メッシュ・面だけで県・市区町村の粒度が無い。自治体単独のデータセットは対象にしない。(段 6 の続き) 残る blocked 22 件: 交通事故の既存 SSDS 系列の差し替え (公開中のページに効くのでオーナー判断)、日曜休診・日曜営業のフラグの定義確認、NDB の割合の分母キー (同じ母集団の受診者数) の登録。(段 7 の続き・2026-11-16 オーナー決定: 2026-11-17 の反映にまとめる) isActive: true を本番へ出す反映の後に `sync-snapshots` (ranking-items・ranking-values) を回し、`sync-ranking-keys` が開く KNOWN・sitemap の PR を反映し、`purge-cdn.yml` で消してから、5 本の `/ranking/<key>` が本番で 200 を返し値が公開 R2 と一致することを確かめる。OGP も確認する。4 週後に GSC の表示・クリックを測る。残りの planned (学力の国語 2・質問紙 7・道路 3・雪の日の事故 1) は試行の結果を見て広げる。
- **停止条件**: main への反映はオーナーの指示があるまで行わない。新しい recipe の実取得は、1 件 5GB 超か合計 6GB 超ならオーナーに確認する。API 鍵の secret 登録はオーナーが行う。
- **完了条件**: 取得できる全 recipe の原本が非公開 R2 にあり、`snapshots/` の SHA と読み戻しが一致する。展開の試行 5 本が本番で 200。
- **計画**: `/Users/minamidaisuke/.claude/plans/virtual-gathering-hopper.md`
- **OPENDATA-RANKING-PILOT-01 から移した残り (2026-11-24)**: 台帳で商用可否が不明な 31 件の規約確定 / 値の無い公開中の external 指標を止める検査 / R2 push の 3 文書と `open-data-curator.md`・`ranking-publisher.md:64`・`data-provenance-standards.md:117` の記述ずれ。次の候補は管理画面 `/data/open-data`。

### [MUNI-PREF-RANKING-EXPAND-01] 県×指標の市区町村ランキングを (指標, 県) の組単位で広げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **背景 (2026-11-13 オーナー方針)**: 市区町村のページは SEO を踏まえてできるだけ検索に出す。
- **費用の見立て**: 1 描画 約 1.5 秒 = $0.00003 (Workers CPU $0.02/100 万 ms)。8,037 ページ (171 × 47) が毎日 1 回描画されても月 約 $7。根拠の実測は `data/improvement/cloudflare-cost-improvement/improvement-log.md` の CF-CPU-URL-01。
- **次**: (1) 採否を (指標, 県) の組単位に変える。値のある自治体が `MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING` 以上の組だけを、R2 の values から生成スクリプトで git 定数にし、ページ・sitemap・内部リンク・`url-policy.ts` が同じ集合を読む。(2) 第 1 波は GSC で表示のある市区町村ランキングの指標を全県へ。以降は 1 波 約 2,000 ページ。(3) 県別ページの HTML の edge 保持を 7 日にする (`CF-EDGE-TTL-01`)。波ごとの検査は同じ形の繰り返しなので Workflow を使う。
- **停止条件**: 各波の 14 日後に、日次の `workers_cpu_ms` と請求サイクルの累計ペース検査が warning のまま増えている、または GSC の県別ページで「クロール済み - インデックス未登録」が登録数を上回るなら次の波へ進まず、本文テンプレートを見直す。第 1 波は `MUNI-PREF-RANKING-OBS-01` (既存 470 ページの 4 週観測) の結果を読んでから始める。
- **あわせて確かめる (2026-11-13 レビュー)**: 全国版は HTML に上位 50 件だけを出すので、51 位以下の市区町村ページ (`/areas/<県>/cities/<市>`) への静的なリンクが全国版から無くなった (以前は `?page=N` から辿れた)。sitemap には全件が載っているが、内部リンクの他の経路 (県のページの市区町村一覧・県別ランキング) で全市区町村に届くかは数えていない。県別ランキングを広げると各県の全自治体へのリンクが戻る。
- **完了条件**: 成立する (指標, 県) の組がすべて県別パスで表示され、sitemap に載り、波ごとの CPU と登録数が改善ログに記録された。

### [CF-CPU-FOLLOWUP-01] Workers CPU 課金の削減の残り (ISR の本番確認・自前クローラー・課金の通知)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-21] [領域:サイト] [待ち:承認]

- **背景**: Cloudflare の請求は 09-15 $11.40 → 10-15 $29.02 → 11-15 $43.71 (全額が Worker `stats47` の CPU)。主因の対策はブランチ `fix/cf-cpu-isr` (`CF-CPU-ISR-01`)。目標は品質を落とさずに月 $5〜10。
- **次 (実行順)**:
  1. **済み (2026-11-21)**: #1292・#1294 で本番反映。2 回目以降が HIT になり、裏の描き直しが止まったことを本番で確かめ、smoke の ISR 検査を strict にした。効果の判定は改善ログ CF-CPU-ISR-01 (期日 11-24)。判定はオーナーの Mac の予定タスク `stats47-cpu-isr-judge` が 2026-11-24 09:00 JST に 1 回走らせる。 **2026-11-24 の実行は保留**: 反映後の snapshot (11-22・11-23) が未着で、手元の `.env.local` に Cloudflare のトークンが無い。反映前の基準は 41,062 秒/日・0.40 秒/件・CPU 約 $24/月 (改善ログに記録)。snapshot が揃ったら再判定する。
  2. 自前の品質監査クローラー: 11-20 (UTC) のフル描画 CPU の UA 1 位は `stats47-page-quality-audit/1.0` (9,564 秒・その日の 21%)。ISR 反映後の週次で同じ値を取り直し、まだ上位なら巡回の対象を「変更のあったテンプレートの代表 URL + 全 URL を週替わりで分割」に絞る案を出す (`.claude/rules/page-quality-standards.md` の担当範囲)。
  3. 送客の無いクローラー: 11-20 の `/ranking/*`・`/areas/*` で ExaSearchBot 約 1,220 秒・SirdataBot 約 510 秒・Amzn-SearchBot 約 90 秒。`robots.ts` で止めるかはオーナー判断 (Googlebot・bingbot は止めない)。
  4. **済み (2026-11-22 確認)**: 課金の通知。予算アラートは $10・$20・$30 の 3 段 (`billing_budget_alert`・メール) が既にあり、「$3 の 1 件だけ」は古い情報だった。変更なし。利用額の上限 (超えたら止める設定) はサイトが止まるので入れない。
  5. R2 (`storage.stats47.jp`) への UA `node` の GET (1 日 約 19 万件): 11-20 のパスは `app/stats/*/values.json`・`app/blog/all.json`、送信元 IP の大半は Azure・AWS の範囲 (ASN はこのプランの GraphQL で引けず未確定)。最多は IPv6 の 1 アドレス `2001:ce8:143:6d31:…` (55,560 件) は **照合済み (2026-11-22)**: オーナーの自宅回線 (eo光・`2001:ce8:143:6d31::/64`) だった。外部ではないので WAF は不要。どのローカル処理が 1 日 5.5 万回読んでいるかは未特定 (R2 の請求は $0 なので急がない)。Azure・AWS 側の残りは外部で、止めるかは R2 が課金対象になったときに決める。
  6. **オーナー作業**: CI の `CLOUDFLARE_API_TOKEN` (ダッシュボードの名前は `stats47` と見られる・未確認) に Workers Observability の読み取り権限を足す。足すまで `fetch-usage.mjs` の route 別 CPU は「取得不能」のまま (CPU 合計は取れる)。トークンの値は変わらないので GitHub Secrets の更新は不要。権限の追加はセキュリティ設定なのでエージェントは行わない。
- **停止条件**: robots の変更・WAF・予算アラートの設定はオーナー承認の後。計測なしに対策を足さない。
- **完了条件**: 2〜6 がそれぞれ「済み」か「やらない (理由)」になり、`CF-CPU-ISR-01` の判定期日 (2026-11-24) の実測が改善ログにある。
- **CF-CPU-ROUTE-WEEKLY-01 を統合 (2026-11-24)**: 6 のトークンへの Observability 読み取り権限の追加で、日次 snapshot の `routeCpu.status` が `ok` になり、週次の Cloudflare の行に route 上位が出ることも確かめる (集計は `packages/ops/src/cloudflare/route-cpu.mjs` で実装済み)。

### [CF-EDGE-TTL-01] HTML の edge 保持を 1 日から 7 日に延ばし、パージの呼び出しを配線する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト] [待ち:判断]

- **観測 (2026-11-13)**: `apps/web/src/lib/cache-policy.ts` の `PAGE_EDGE_CACHE_CONTROL` は `max-age=86400`。
- **次**: デプロイとデータ更新のときに `/api/internal/worker-cache/purge` (Cache-Tag) が呼ばれているかを確かめる (`.github` の grep では呼び出しが見つからなかった。見つからなかっただけで、無いとは確かめていない)。呼ばれていなければ `deploy-workers.yml` に足し、そのうえで保持を 7 日にする。
- **停止条件**: パージの配線を確かめる前に保持だけを延ばさない (更新が 7 日出なくなる)。
- **あわせて確かめる (2026-11-13 レビュー・未実測)**: 全国版の市区町村ランキングを `revalidate = 86400` にしたので、Workers Cache を tag で消しても OpenNext の incremental cache (R2) に前の HTML が残りうる (`/ranking/[rankingKey]` と同じ形。コードに revalidatePath / revalidateTag の呼び出しは見つからなかった)。R2 が一時的に読めないときの「配信用データを準備しています」(200) が保存される可能性もある。本番でデータ更新後の応答を読んで確かめる。
- **同じ形の疑い (未実測)**: `apps/web/src/app/api/flow/[feature]/[code]/route.ts` は `revalidate = 86400` のまま no-store の 404 を返す。route handler が 404 も保存するなら、R2 の一時失敗が 1 日残る (市区町村の全行 JSON の route は同じ理由で force-dynamic にした)。
- **前提の変化 (2026-11-21)**: 拠点ごとの描き直しの主因は、`/ranking/*` が ISR になっていなかったこと (`CF-CPU-ISR-01`)。ISR が効けば Workers Cache の miss は数 ms の ISR 応答になり、保持を延ばす効果は小さい。`CF-CPU-ISR-01` の反映後に、日次 snapshot の `routeCpu` で 1 URL あたりの描画回数が版の数を超えるかを見てから、このカードを続けるか閉じるかを決める。
- **完了条件**: 保持 7 日とパージの配線が本番に入り、`/ranking/*` の 1 URL あたりの 1 日の描画回数を前後で比べた値が改善ログに記録された。
- **統合 (2026-11-13)**: `CF-HTML-EDGE-TTL-01` をこのカードへ統合した。

### [CF-RENDER-CPU-01] 1 描画あたりの CPU (約 1.5 秒) を、重複読みの解消で下げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト] [待ち:ログイン] [待ち:判断]

- **済み (2026-11-14・a135113ec)**: 同じリクエストの中の重複読みを React の `cache()` で 2 か所まとめた。
- **残り (計測)**: この変更を本番へ出した後、Workers Observability で代表 3 route (`/ranking/*`・`/themes/*`・`/areas/*`) と `_rsc=` 付きの画面遷移の 1 リクエスト平均 CPU を、2026-11-13 の観測 (1.4〜1.8 秒) と同じ方法で取り、前後の値を改善ログに記録する。下がらなかった箇所 (blog の索引・テーマの読み取りのどちらか) は元に戻す。ログインが要る画面なので、土曜の週次の記録かオーナーの依頼で取る。
- **残り (ランキングの図)**: `components/stat-charts/.../RankingChart.tsx` は指標の定義を自分で読んだ後、`lib/metric-axis-policy.ts` の `resolveMetricAxisPolicy` が同じ指標の定義を最大 2 回読み直す。`RadarChartDashboard.tsx` も軸ごとに定義を直接読む。`RankingSidebarContainer` はランキングのページから `categoryKey` を受け取るので、そのページでは定義を読まない (対象から外してよい)。
- **残り (判断)**: ランキングの図の重複読みをまとめるには、`features/ranking/lib/cached-ranking-item.ts` の `cachedFindRankingItem` を `components/` と `lib/` から使える場所 (`apps/web/src/lib/`) へ移す必要がある。選択肢は「上の計測で `/ranking/*` の CPU が下がらなかったときだけ行う」か「計測を待たずに行う」。推奨は前者で、根拠はカードの停止条件 (計測なしに最適化しない) と、この図が代表 3 route の描画に入る割合を測っていないこと。
- **残り (統合元のカード)**: (1) CF-CPU-SURGE-01 の反映後 7 日で Observability の url.path 別 CPU 合計の上位 20 を取り直す。(2) 上位 route が読む R2 オブジェクトの数とサイズを数え、CPU が JSON の解析か描画かを分ける。(3) 必要な年・項目だけの派生 snapshot (R2) を 1 route で試し、localhost の本番ビルドで比べる。
- **実測 (2026-11-21)**: フル描画 (CPU 200 ms 超) の平均は `/ranking/*` 1,674 ms、`/areas/<県>/household-food-spending` は 4.4〜4.9 秒。
- **完了条件**: 3 route の平均 CPU の前後の値が改善ログに記録され、下がらなかった箇所は元に戻した。停止条件は、計測なしに最適化しない・永続 DB に戻さない・表示内容と SEO 構造化データを変えない。効果の観測は改善台帳の別 ID へ引き渡す。

### [URL-QUERY-INVENTORY-01] `searchParams` を読むページを棚卸しし、パスへ移すか URL から外す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **背景**: URL の原則 (2026-11-13 オーナー決定) は「サーバーが描き分ける違いはパス。`?` はサイト内検索だけ」。契約テストが `searchParams` を読むページを許可リストで固定した。許可リストは縮小専用。
- **対象**: 許可リスト (`apps/web/src/__tests__/search-params-contract.test.ts`) の 9 ページのうち移行判断待ちの 7 ページ — `/blog` (?page=)・`/themes/[themeSlug]` (県別ページを持たないテーマの ?pref=)・`/category/[categoryKey]/compare` (?areas=)・`/geo/compare`・`/geo/layers/[layerSlug]`・`/geo/[analysisSlug]`・`/geo/[analysisSlug]/[prefCode]/[stage]` と、検索に出している `/ranking/<指標>?norm=` (robots.ts が明示的に許可している。パスへ移すなら 301 と評価の引き継ぎを伴う)。
- **次**: ページごとに、クエリ違いの URL が Workers Observability で何秒の CPU を使っているかと、GSC で表示があるかを読み、パスへ移す・ブラウザ側の状態にする・そのまま残すを決める。
- **検査の穴 (2026-11-13 レビュー)**: 契約テストは `page.tsx` だけを見る。route handler が `request.nextUrl.searchParams` を読む場合と、クライアントの `useSearchParams` は対象外。棚卸しのときに `app/**/route.ts` も数える。
- **完了条件**: 許可リストの各行に、残す理由か移行先が書かれている。

### [STRATEGY-LEDGER-JSON-01] 戦略文書の表・値・決定を `data/` の JSON 台帳へ移し、管理画面が台帳を描く形にする (8 段)
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-13] [領域:戦略]

- **済み (2026-11-14・414b30d4e)**: 段 3 として、事業計画の見出しを data/business-plan/plan/catalog.json の台帳 business-plan.catalog へ移しました。
- **残り (段 2 の続き)**: .claude/todo/todo-standards.md の [領域:X] の行は、まだ「§5 の領域表」を指しています。doboku-note と同じ文の規約なので、両方のリポジトリへ同じ差分を当てて台帳 business.domain-stances を指すように直します。.claude/todo/monthly.md の参照は、次の /monthly-plan の上書きで直します。
- **残り (段 4)**: 文書の台帳を data/business-plan/plan/documents.json の 1 本にまとめ、02 §9 と各文書の「関連ドキュメント」を寄せます。/strategy/doc/[id] は /docs/[...path] へ寄せます。/docs と /strategy/policy をナビに載せます。domains.ts の readDocument の基点を引数にして、改善ログ 7 本と週次・月次レビューの全文を管理画面で開けるようにします。
- **残り (段 5)**: data/business/monetization.json (収益モデル・ページ種別の責務・ゲート・チャネル配分) と data/business/decisions.json (02 §3.1 の日付つきオーナー決定) を足します。ゲートと行政検証の段階は、STRATEGY-GATE-TABLE-01 と STRATEGY-GATE-ADMIN-PILOT-01 の禁止に従い、聞き取り台帳から導ける値を手で写しません。
- **残り (段 6)**: data/business/{project,audiences,competitors}.json を足し、01・03・04 と 02 §2.1・§2.2・§3.6 にある重複した表を消します。競合は 03 の版を元にします。
- **残り (段 7)**: data/business/traffic-roadmap.json を足し、閾値を KPI の id に refs で結びます。
- **残り (段 8)**: data/sns/{platform-specs,profiles,content-plans}.json を足し、docs/10_SNS戦略/ の 02・04・05 を廃止して、update-x-profile.cjs を台帳読みに替えます。data/note/series.json に編集シリーズ A〜D の定義を足します。
- **禁止**: docs/00 の 4 本を廃止せず、見出しと番号も変えません (「収益化戦略 §5」の形の参照が 60 か所以上あるため)。data/ の既存フォルダを改名しません。管理画面に編集機能と専用の部品を作りません。
- **完了条件**: 戦略の文書に機械が読む表が残っていないこと。npm run docs:check の DG073〜083 が台帳読みで同じ判定を返すこと。管理画面の戦略区分からすべての台帳を開けること。各段は 1 PR とし、台帳・Schema・カタログの行・管理画面の表示・Markdown の表の削除を 1 組にします。

### [DOCS-GOVERNANCE-GAPS-01] 検査の外に溜まった文書 (skill の監査全文・散った設計文書・memory の戦略重複・古い実装計画) を片づけ、検査の範囲に入れる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-11-13] [領域:管理]

- **済み (2026-11-14・`72eb83f94`)**: 監査とレビューの全文 41 件を data/{themes,surveys,seo}/ へ移し、カタログ 5 行と GOVERNED を足した。
- **済み (2026-11-14・`de05d4afa`)**: 文書と現物のずれ 7 点のうち 6 点半を直した。
- **済み (2026-11-14・`483847b0a`)**: `CLAUDE.md` の定期レビューの置き場の 1 行を `data/<取得元>/` に合わせた。
- **済み (2026-11-14・`550309b88`)**: `setup-memory-symlink.mjs` を `.claude/scripts/lib/` へ移し、DG088 の許可リストを型検査の設定 2 件だけにした。
- **残り 1**: 移した 41 件 (`data/{themes,surveys,seo}/` の監査・レビュー全文) の保持期間が未決である。未完了の対策をカードへ拾い、全文を減らす。portfolio・実験台帳・管理画面が個々のファイルを読んでいるので、読み手を先に確かめる。
- **残り 2**: `.claude/design-system/` の 4 文書を `docs/01_技術設計/04_デザインシステム.md` へ統合する (agent 3 件・skill 2 件・rule 2 件・検査 1 件が参照している)。
- **残り 3 (判断)**: 実装計画 43・44・45・47 を統合するか削除するかを決め、実装計画の INDEX に入れる。4 件とも related_backlog が null で、docs:check が DG042 の warning を出している。
- **残り 4**: 「docs/ の Markdown が文書の台帳に無い」検査を足す。文書の台帳を 1 本にする `STRATEGY-LEDGER-JSON-01` の段 4 の後に行う。
- **残り 5 (main 反映後の確認)**: `550309b88` が main に入ったら `sns-weekly-report.yml` を手動で起動し、レポートが `data/sns/weekly-reports/` に書き戻されることを確かめる。日曜 21:00 (JST) の定期実行は main の workflow 定義で develop のスクリプトを動かすので、develop だけ先に進んだ状態で日曜を挟むと、main の定義が旧置き場を `git add` して「変更なし」で抜け、その週のレポートが残らない。挟んだ場合は、反映後に対象の週を指定して手動で起動して補う。
- **残り 6 (判断)**: `data/blog/winning-pattern-reports/` と `data/sns/` の定期レポートの保持期間が未決である。今は prune-state-snapshots のテストに「消さない置き場」として宣言してある。選択肢は、消さずに残す (今のまま) か、RETENTION_POLICIES に件数の上限を足すかの 2 つ。推奨は今のままで、根拠は、週次レポートが 1 件 2 KB 前後で年 52 件にとどまり、週次レビューが前回との比較に過去分を読むことである。
- **完了条件**: 残り 1・2・4・5 が済み、残り 3 と残り 6 の判断が入っていて、`npm run docs:check` と `npm run check-datasets` が通る。

### [DOCS-DRIFT-FOLLOWUP-01] 規約・文書・設定が現物とずれている箇所 (第 4 波の実行で見つけた分)
タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [起票:2026-11-14]

- **済み (2026-11-14・f911a9ae9)**: 人の移動の動画の workflow 3 本の削除と参照の修正、Cloudflare の権限の出典、afb・もしもの分岐の削除、計測・収益化・その他の文書のずれの修正は終わった。
- **残り**: `browser-session.mjs` と `rakuten-report.mjs` は、refreshed.json と `.verified` の印を書くが、`collect.mjs` はどちらも読まない。この書き込みを消し、`markMeasurementAuthenticated` の呼び出し元 (note-sales・marketplace-status・fetch-note-metrics・update-note-covers) とそのテスト (`kdp-monthly.test.mjs` 123 行) を合わせて直す。
- **残り**: 常に null の `relogin` と `recovery` の欄を消す。対象は `config/schema/revenue.authenticated.schema.json`、`data/authenticated/latest.json`、`summarize.mjs` 46〜50 行、`health.mjs` の `awaitingReauthentication`、`packages/ops/src/metrics/nsm-revenue-lines.mjs` 39 行とそのテストの fixture である。`sources.mjs` 38 行の api 系の失敗コードも、api の取得元が無いので一緒に消す。
- **追補 (2026-11-14)**: `.claude/skills/sns/find-quote-rt/SKILL.md` (31・199〜209・253 行) と `publish-x/SKILL.md` (101〜105 行) が、撤去した駅の乗降・人の移動の動画を `--with-media` で添える手順を残していて、sns-content-standards.md §2-4 と食い違う。backlog に無い ADSENSE-RESTART-01 を参照する箇所が、このカードの 3 か所のほかに 8 か所ある。
- **追補 (2026-11-22・全体の洗い出し)**: 整合性検査の W1 が `.claude/scripts/note/reference/render-reference-figures.ts` を orphan と出している (SKILL.md から参照するか消す)。`.codex/hooks.json` の欠けは `CODEX-MIRROR-SLIM-01`。
- **完了条件**: `MEASUREMENT_BROWSER_OUTPUT_STATE_PATH` と `relogin`・`recovery` を git grep しても、生きたコードと schema に当たらない。`node --test .claude/scripts/measurement/__tests__/*.test.mjs packages/ops/src/metrics/__tests__/nsm-revenue-lines.test.mjs`、`npm run check-datasets` と、両方の `.claude/scripts` の tsc が通る。

### [DIR-PLACEMENT-CLEANUP-01] 置き場の規則から外れたスクリプト・データ・設定を正しい置き場へ移す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-13] [領域:管理]

- **済み (2026-11-14・dc64c4830)**: scripts/ui-theme の 5 件を .claude/scripts/ui/ へ移しました。
- **残り (データ)**: data/ai-content-staging/ を contents/ai-content/ へ、data/ads/placements.json を data/affiliate/ledger/placements.json へ、.claude/config/auth-credentials.json を config/ へ移します。手順は data-storage.md の「置き場を移す手順」に従い、RETIRED に宣言します。ai-content.staging の行は planned を transient に替えます。先に .claude/todo/backlog.md で旧パスを書いた行 (data/ads/placements.json と .claude/config/auth-credentials.json を書いたカード) を新しいパスに直すか、「旧パス」の印を付けます。直さないと RETIRED の検査が commit を止めます。ai-content-gemini-daily.yml は旧置き場を git add します。このため develop への push から main のマージまでを数十分に収めます。
- **残り (スクリプト)**: 1 件だけのドメインを、使い道の近いドメインへまとめます。対象は adsense の oauth-setup・content-operations・db・municipalities・ranking・site・web です。instagram/ と threads/ は .claude/scripts/sns/ の下へ移します。呼び出し元の package.json・workflow・SKILL.md は同じ差分で直します。投稿の workflow は cron で動くので、push から main のマージまでを数十分に収めます。
- **残り (本番の確認)**: main のマージの後、移した workflow (publish-ai-content・ai-content-gemini-daily・Threads と Instagram の投稿) を手動起動し、新しい置き場へ読み書きすることを確かめます。
- **追補 (2026-11-14)**: `config/datasets.mjs` の `ai-content.staging` の行は planned:true のままだが、置き場は outbox である。check-datasets は planned の行に追跡ファイルが当たると error にするので、ランキング解説の公開待ち JSON を push する commit が止まる。transient に替える。
- **完了条件**: 上の置き場が無くなり、npm run check-datasets と npm run preflight:pr が通り、移した workflow が新しい置き場へ書くことを手動起動で確かめています。
- **DATA-LAYOUT-MOVE-01 から移した未決 (2026-11-24)**: SEO の日次系列 (`data/seo/rank-history/`・`selections/`) の保持期間 (`prune-state-snapshots.test.mjs` に「保持期間は未決」で宣言)。 2026-11-22 に 182 件の寿命を付けて外した: 索引 `seo.rank-history-summary` が全件のハッシュをつなぎ過去分の削除を禁じるので、寿命を付けるなら索引を縮める処理と一緒に入れる。

### [GOAL-PSI-LCP-STALE-01] 性能目標 `psi-mobile-lcp-2500` の記録が ACTIVE のまま 2026-05-15 から止まっている
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:管理] [待ち:判断]

- **観測 (2026-11-13)**: `data/goals/psi-mobile-lcp-2500/meta.json` は status が ACTIVE、cycle 1 が proposed、`updated_at` が 2026-05-15。
- **次**: 目標を続けるか閉じるかをオーナーが決める。続けるなら baseline を `data/psi/` の現在の計測で取り直し、閉じるなら `close_reason` を書く。
- **完了条件**: status と実態が一致し、存在しないパスへの参照が無い。

### [PRODUCT-ANALYSIS-WIRING-01] 商品分析の調査候補を一次資料と実データで検証し、改訂案へ追加する
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-12] [領域:商品]

- **担当**: data-pack-manager。統計定義・原典の確認は estat-researcher、既存配信の取得・投入は data-ingester。
- **展開順と分担**: 既存原票があるP-04/05/06/08の分析例追加を先行し、原典照合が必要な商品は読取り調査を並行する。商品固有の用途・分析レシピは商品別JSON単位で担当を分け、並行編集は別worktreeで最大3体まで。共通resolver・原典別定義・Schema・生成物・検査の統合は親担当だけが変更する。モデルとeffortは実行時に明示し、通常編集はmedium、統計定義の判断はhighを初期値として、手戻りと所要時間を見て調整する。数値計算・画像描画・整合検査は既存CLIで行う。
- **テーマ改訂との共同検査**: テーマの章の追加・改名・削除時は `products.landings` の作成例・改訂分析の `themeRefs` を照合し、LP・テーマ・note初稿を同じ作業で生成・確認する。関係と見出しを別台帳やUIへ複製しない。実装契約は `data-pack-standards.md`、販売版の確定は PRODUCT-LP-SHOWCASE-01。
- **対象の正本**: products.landings.analysisPlan.inputs の decision=investigate と、axes の decision=deferred・採否理由。指標・地域・原典別定義・分析・図・再利用商品は同台帳のID参照から辿る。商品別の候補一覧や完了履歴をこのカードに複製しない。
- **分析軸の残作業**: 医療・教育・商業の推移は複数年の原典と比較条件を確認して採否を決める。家計の品目構成は同年・同世帯区分の内訳/総額を揃えてから採用する。観光の県間比較は取得済み原票で作成例を追加する。順序は既存原票で追加可能な例→不足する年・分母の取得→共通生成と媒体間照合。各商品の詳細と他の保留は `axes` を参照し、単年比較だけで全分析を完成扱いにしない。
- **次・実行順**: ① 調査中の候補について原典の統計対象・区域版・暦年／年度・分母・欠測を確認する ② 用途に適合するものだけanalysisRevisionへ採用し、不適合は理由を残してexcludeにする ③ 共有のproducts:analysis:catalog / products:analysis:build / products:analysis:checkでCSV・Excel・図・LP・note初稿を生成・照合する。再利用先に子商品の値を複製せず、商品参照を維持する。
- **停止条件**: 原典の対象・年・区域・分母を同定できない候補を、利用可能または販売版に収録済みと案内しない。P-03の宿泊者数に市区町村値を推測で補わず、P-14の県庁所在市・対象世帯を県全体と混同しない。
- **完了条件**: 調査対象のdecisionと根拠が確定し、追加採用した分析の原票からの再計算・共通型の図・媒体間の照合が通る。
- **関連**: 生成済み改訂案の目視・販売内容の確定・外部公開は PRODUCT-LP-SHOWCASE-01。既存配信の欠落と古い原典メタの再生成は POPULATION-MUNICIPAL-COVERAGE-01。

### [POPULATION-MUNICIPAL-COVERAGE-01] 既存配信の一般世帯人員の市区町村欠落と取得表の記録を是正する
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-11-12] [領域:サイト]

- **証拠**: P-01改訂用に原典0000020201から取得したA710201は2000・2015年とも1,741自治体ある。
- **次・順序**: data-ingesterが既存指標の取得条件と原典メタを照合→修正済みの共通city取得経路で欠落年度・古いmetaを再生成→地域マスタによる全件性と実際の表ID・cat01を検査→既存のR2反映手順へ渡す。別途、recipeの既存configHash互換性を保ったままcitySource単独の変更を検出できる契約を設計・検証する。P-01の入力は再取得済みなのでこの不具合の値で補完しない。
- **停止条件**: 一般世帯/総世帯や日本人/総数の定義が一致しない場合は投入しない。
- **完了条件**: 対象年度の自治体数が原典と一致し、配信メタから正しい表・条件を追跡できる。転出者の欠年は取得または原典欠測の理由を記録する。

### [THEME-SEO-UNIFY-01] テーマの題・説明文・FAQ を地域の単位に関係なく 1 か所で作り、検索の表示回数を測る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-12] [領域:サイト] [待ち:判断]

- **オーナー決定 (2026-11-12)**: テーマは 1 つのページの種類で、日本・都道府県・県別・市区町村は横串の分類。専用ページの特例は認めず、題・説明文・FAQ は共通の仕組みで入れる。URL は変えない (GSC W44 でテーマの検索表示の 92% が `/areas/<県>/<テーマ>` で、揃えると全件に 301 が要るため)。
- **済み (2026-11-12)**: `features/theme-dashboard/lib/theme-seo.ts` が 4 種類のページの題・説明文・FAQ を作り、地方財政の専用ページを共通の章へ載せ替え、日本全体のテーマ 42 件と 8 件を全国のテーマへ 301 した (`theme-redirects.json`)。
- **計測の注意**: この変更の後の週から、ページの種類ごとの記録の「テーマ」と「地域」は前の週と比べない (分類が変わり、W44 の閲覧で数え直すとテーマは 1,833 → 5,023)。
- **測り方**: デプロイ日を境に 4 週、GSC のテーマの 1 ページあたりの表示回数とクリック率を前後で比べる (`data/gsc/snapshots/<週>/pages.csv` の `/themes/`・`/japan/`・`/municipalities/themes/`・`/areas/<県>/<テーマ>`)。基準は W44 の 61 ページ・週 2,817 表示 (1 ページあたり 46。ランキングは 120)。[target: テーマの 1 ページあたりの週の表示 46 → 70 (+50%)。根拠: 題に検索語を入れたランキングが 120 で、その半分まで寄せる見込み] 届かなければ、ページ別の検索語 (GSC の page×query) を取って題の語を直す。転送は前後 4 週で転送先の `/themes/<テーマ>` の表示とクリックを比べる (転送元の 864 表示が移るか)。
- **未決 (11-13 観測)**: 全国のページは公式の全国の値がある指標 (962 指標のうち 371) だけを出すので、28 テーマで題に入る主な指標 (`themeLeadLabels`) がページに出ない。エネルギー消費・職業別年収・自治体 DX の 3 テーマは全国のページに章が 1 つも描かれない。全国の題を全国の値がある指標から作るか、章の無い全国のページをどう扱うか (県の選択へ促す・noindex など) をオーナーが決める。4 週の測定中は題を変えない。
- **完了条件**: 地方財政の載せ替えと台帳・管理画面の統一が済み、4 週の比較を記録している。

### [THEME-SINGLE-CARD-BUNDLE-01] テーマの指標 1 つだけのカードの縦の並びを、数値タイルの格子か表に束ねる
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-11-13] [領域:サイト]

- **観測 (2026-11-12)**: 56 テーマの指標カード 467 枚のうち 342 枚が指標 1 つだけのカード (`metricGroups` の `rankingKeys` が 1 件)。
- **次**: カードの多いテーマ (地方財政・林業・医療・地方の生活サービス) の 1 つで、同じ章の 1 指標カードを 1 グループの `tiles` にまとめる案を作り、オーナーと localhost で見比べる。良ければ同じ規則 (同じ章・単位 2 種まで・5 件以上は table) で他のテーマへ広げる。`tiles` の章には答えの文 (`section-answer.ts`) が出るので、その文面も見る。
- **完了条件**: 合意したテーマで束ね、`validate:catalog` が error 0、テーマ画面の vitest が通り、localhost の画面で確かめたスクリーンショットをオーナーが見ている。
- **禁止**: 合意前に全テーマを一括で書き換えない。

### [RANKING-RAIL-CIRCULATION-01] PC のランキングの右レールの下の空きに、回遊の導線を足すかを決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-11-12] [領域:サイト] [待ち:判断]

- **起点 (2026-11-12 オーナー)**: PC でランキングを開くと、右レールの中身が本文より短く下が空いている (総人口のランキング・1440px で約 840px。)
- **案 (未決定)**: 分野のランキング一覧の後、追従する広告の上に「この県が 1 位の指標」「同じ調査のランキング」のような導線を足す。右レールは本文の横にあるときだけ出るので PC だけの話。既存の部品 (`RelatedContentNavigation`・`RankingItemsSidebar`) と台帳 `data/content/` の関係で作れるかを先に見る (専用の部品を作らない)。
- **判断の材料**: 回遊は PV の主なレバー (KPI `site-circulation-rate`)。サイト内の遷移は週次の `internal-transitions.csv` (referrer) で読む。追従広告の 2 週の結果 (ユニット `stats47-ranking-table-side` の視認率・収益) を見てから、広告と導線の並び順を決める。
- **停止条件・禁止**: 追従する広告と導線が重ならない・隣り合わないようにする (広告の枠の台帳の共通のルール)。右レールに独立したスクロールを作らない (`ui-components.md`)。
- **完了条件**: 足すか足さないか、足すなら何をどこに置くかをオーナーが決め、足す場合は実装の別カードに渡している。

### [SUBSIDY-EVIDENCE-STRATEGY-01] 補助金・創業計画を書く事業者と支援者を「仕事の読者」として採るかを決め、収益化戦略とペルソナに反映する
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:戦略] [待ち:判断]

- **起点**: 2026-11-11 のオーナーとの検討と Web 調査。
- **問い**: `ISSUE-PAYING-NEED-01` の「別の仕事の読者を先に確かめるか」に対し、行政職員とは別の読者 (自分で申請書を書く創業予定者・小規模事業者／診断士・行政書士・認定支援機関などの支援者／統計局の無料講座を受けた社会人) を先に確かめるか。
- **読者の課題 / HARM**: 計画書の「市場の動向」「売上の根拠」に、どの統計をどの年の値で置けば客観的なデータになるか分からない (M: 資金の調達、A: 事業の達成)。提供価値は、公庫の式「世帯数 × 1 世帯あたり消費額 × シェア」の単価の項と、使う年・出典の判断。支払う理由は、締切の前に探して揃える時間を買えること。
- **需要の証拠 (2026-11-11 観測)**: 持続化補助金は一般型 第 20 回から「客観的なデータを用いた市場や顧客ニーズの分析」が補助対象事業の要件になった (公募要領 第 9 版)。ココナラの商圏分析は 30,000 円の出品に評価 57 件。補助金向けの地域統計データ集は市場に見当たらない。stats47 で売れたのは「e-Stat × Claude Code」の作り方だけ (note 累計 600 円)。**未検証**: 検索ボリューム、この読者が stats47 の記事に払うか、申請件数の規模。聞き取りはしていない。
- **決めること**:
  1. この読者を `02_収益化戦略.md` §2.1 の対象と `04_ターゲットペルソナ.md` §6 の表に足すか (足すなら仮説の段階と明記する)。
  2. 試す順番と判定の数値 (仕様 §9 の提案値: ① 有料記事と無料の入口記事を 4 週 → ② サイトの推計ページと制度の対応表を 8 週 → ③ 受注)。データ集の価格の実験 (判定 2026-12-30) の条件は変えない。
  3. `ISSUE-PAYING-NEED-01` の禁止 (答えが出る前に行政向け商品の制作を増やさない) との関係。こちらは行政向けではない別の読者だが、同時に走らせる数を決める。
  4. 月の重点 (`monthly.md` の `focus_domains`) に入れる月。
- **守ること**: 渡すのは値・出典・年次・計算表・調べ方まで。申請書に貼れる文例やひな形は作らない (改正行政書士法 2026-01-01 施行。仕様 §6)。「採択される」を売り文句にしない。
- **関係**: 制作は `KNOWHOW-SUBSIDY-EVIDENCE-01`・`KNOWHOW-FREE-COURSE-ENTRY-01`・`KAKEI-MARKET-SIZE-PILOT-01`・`SUBSIDY-FIELD-MAP-01`、受注の判断は `TRADE-AREA-REPORT-DECISION-01`、保留は `WAGE-RULE-PAGE-01`。オーナーは行政書士を 2027-11 に受験する予定で、登録後は同じ入口が申請業務の相談につながる (別の事業。stats47 の商品には含めない)。
- **完了条件**: 採否と順番をオーナーが決め、`02_収益化戦略.md` と `04_ターゲットペルソナ.md` に反映し、仕様の status を更新している。採らない場合は、関係する 6 枚のカードを削除している。

### [KNOWHOW-SUBSIDY-EVIDENCE-01] 有料記事「創業計画書・持続化補助金の売上の根拠を、家計調査 × e-Stat × Claude Code で作る」を 1 本出し、4 週の実売を確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:商品] [待ち:判断]

- **位置づけ**: `KNOWHOW-PRODUCT-PILOT-01` のテーマ候補 (E)。売れた唯一の系統 (e-Stat × Claude Code) を、使い道 (計画書の根拠) で切り直す。採否と順番は `SUBSIDY-EVIDENCE-STRATEGY-01`。根拠は `docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §5・§8。
- **読者**: 自分で申請書を書く創業予定者・小規模事業者 (仕様 §3 の A)。支援者 (B) は反応を見てから別の記事で。
- **中身**: 公庫の創業の手引の式「○km 圏内の世帯数 × 1 世帯あたり消費額 × シェア」のうち、単価の項を家計調査から出す手順。品目の選び方、使う年、52 市に無い地域の扱い (推計と明記)、出典の書き方。同梱はスクリプトと計算シート。世帯数は jSTAT MAP で出す方法を案内する (無料の公式ツール)。芯は操作の手順ではなく「どの統計のどの表を、何年の値で、どう組み合わせるか」。
- **価格**: 500〜980 円の買い切り (note)。データ集の価格の実験とは別の商品として記録する。
- **次 (実行順)**: ① 家計調査の品目別の値の世帯区分 (二人以上の世帯か総世帯か) を統計局の公式で確かめ、掛ける世帯数とそろえる ② 総務省の回答 (2025-10-10 付。参考資料の提供は書類の作成に当たらないとする趣旨) の原文を探して確かめる。見つからなければ、文例・ひな形を載せない設計のまま、商品の説明に「申請書の作成は申請者本人か行政書士」と書く ③ 原稿とスクリプトを作る ④ オーナーの承認後に公開し、4 週の閲覧・購入を販売台帳に記録する。
- **判定 (提案値)**: 続ける = 購入 3 件以上。やめる = 閲覧 300 以上で購入 0。閲覧 300 未満なら導線を足して 1 回だけ 4 週延ばす。
- **停止条件・禁止**: 「採択される」「通る」と書かない。欄にそのまま貼れる文例・埋めるだけのひな形を載せない。制度の回・締切は要領の版と確認日つきで書く (持続化 一般型 第 20 回は 2026-12-15 締切)。note への公開・価格の変更はオーナーの承認と人手のログインを経てから。
- **完了条件**: 4 週の実売 (0 件なら 0 件と、考えられる理由) が台帳にあり、続ける・直す・やめるをオーナーが決めた。

### [KNOWHOW-FREE-COURSE-ENTRY-01] 無料の入口記事「統計局の講座で Excel でやった集計を、Claude Code で 5 分にする」を出し、有料記事へ流れる数を 4 週測る
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:商品] [待ち:判断]

- **起点**: 統計局の「社会人のためのデータサイエンス入門」は累計 23.1 万人で、e-Stat と Excel の手作業を教えている。
- **未検証**: 既存の有料マガジン「公務員の e-Stat × Claude Code 実務ガイド」(1,480 円) は売れたのが 2 件で、この母集団に届いていない可能性がある。庁内で外部の生成 AI を使えない職員が多いなら、読者は講座を受けた個人・診断士・コンサル・研究者・記者の側に寄る。
- **中身**: 講座と同じ題材 (e-Stat の表を落として集計しグラフにする) を、手作業と Claude Code で並べて見せる。所要時間は自分で測った値だけを書く。講座の教材そのものは写さない (題材の種類を合わせるだけ)。末尾で `KNOWHOW-SUBSIDY-EVIDENCE-01` の有料記事と既存のマガジンへ 1 行ずつ案内する。
- **集客**: note の中の検索・推薦が主。stats47 の Claude Code 連載は 28 日 25 PV なので、サイトからの送客は当てにしない (収益化戦略 §3.5)。
- **判定 (提案値)**: 4 週の閲覧と、有料記事へ流れた数 (note のダッシュボードの記事別の閲覧で見る)。閲覧 100 未満なら入口として成立していないので、題名と検索語を 1 回だけ変える。
- **停止条件・禁止**: 「稼げる」「誰でも」と書かない。公開はオーナーの承認後。
- **完了条件**: 4 週の閲覧と有料記事への流れが記録され、入口を続けるか・題材を変えるかを決めた。

### [KAKEI-MARKET-SIZE-PILOT-01] 品目 × 地域の「1 世帯あたり支出と推計市場規模」のページを 10 品目ほど試し、検索と記事への送客を 8 週測る
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:サイト] [待ち:判断]

- **起点**: 公庫の創業の手引は「世帯数 × 1 世帯あたり消費額 × シェア」で売上を見積もる例を示し、材料に e-Stat の家計調査を挙げている。
- **前提**: `KNOWHOW-SUBSIDY-EVIDENCE-01` の判定の後に始める (1 つずつ試す)。採否は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **ページの形**: 主役は品目別の 1 世帯あたり支出 (出典・年次・対象の世帯区分つき)。市区町村の世帯数を掛けた推計は「上限の目安」として並べる。利用者が自分の商圏の世帯数とシェアを入れる計算欄を付ける。「市区町村の市場規模」を主役にしない。
- **弱点と対処**: 家計調査の品目別の値は 52 市 (県庁所在市と政令市) だけ。ほかの市区町村は県庁所在市の値で代えるか按分する推計になるので、「推計」と方法を値のそばに書く。世帯区分をそろえる。市区町村は商圏より粗いので、これだけで売上の予測は作れないと書く。
- **次 (実行順)**: ① 品目を選ぶ (創業の多い業種に当たるもの: パン・外食・理美容・菓子・コーヒーなど。既存の家計調査ページの検索語と重ねて決める) ② 世帯区分と推計の方法を決めて `packages/` の既存の家計調査の指標に乗せる (新しい取得は増やさない) ③ 雑学の読者向けの既存ページとは別の入口として出す (収益化戦略 §3.5: 雑学の流入を商品へ流す前提を置かない) ④ `nav_click` で記事への送客を数える。
- **判定 (提案値)**: 続ける = パイロットのクリックの合計が既存の家計調査ページ 1 本あたりの中央値以上で、有料記事への送客が月 10 クリック以上。やめる = 中央値の半分未満。広告の収入では評価しない。
- **完了条件**: 8 週のクリック・検索語・送客が記録され、品目を広げるか・やめるかを決めた。

### [SUBSIDY-FIELD-MAP-01] 「どの制度のどの欄に、どの統計を、どの粒度で」の対応表を無料で出し、推計ページと記事の入口にする
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:コンテンツ] [待ち:判断]

- **起点**: 公式の資料は統計の名前をほとんど挙げていない (名指しは統合補助金の RESAS だけ。)
- **材料**: `docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §7 の表 (持続化 第 20 回、新事業進出・ものづくり統合補助金、経営革新計画、公庫の創業計画書、賃上げの要件、事業承継・M&A、統計が要らない制度)。要領の原文で確認済みの範囲と、未確認の範囲 (統合補助金の第 2 回の日程、持続化の記入例) が分かれている。
- **形**: ブログのハブ記事 1 本。制度ごとに、欄の名前・求められる中身・使える統計 (e-Stat のどの調査・どの粒度)・stats47 のどのページで見られるか・見られないものは jSTAT MAP など公式の無料ツール。要領の版と確認日を必ず書く。欄に書く文章の例は載せない。
- **前提**: `KAKEI-MARKET-SIZE-PILOT-01` と同じ時期に出す (表から送る先が要る)。制度の事実は公開の前に公募要領で確かめ直す (回が変わると欄も変わる)。
- **維持**: 公募の回が変わったら更新する。更新できないなら古い回の記述を残さず、確認日を見出しの近くに置く。
- **完了条件**: 記事が公開され、表から推計ページ・有料記事への遷移が計測できる状態になっている。

### [LEDGER-DB-UNIFY-01] マスタと台帳を `data/` の 1 つの DB にまとめる (13 段)
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-10] [領域:データ]

2026-11-10 にオーナーが承認した計画 (13 段) は 2026-11-12 に全段を終え、計画のファイルは消した。`packages/`・`apps/`・`config/` のマスタと台帳は `data/` の JSON + Schema に移り、`npm run check-datasets -- --er` の「data/ の外に残るマスタ・台帳」と統合の候補はどちらも 0 件。
- **残り**: 段 0〜13 は 2026-11-12 に develop へ入った (`1ca0cff25`。push で起動した Develop Quality Gate・広告の R2 への反映・広告の在庫の更新は 3 つとも成功し、R2 の広告の snapshot は台帳と同じ 328 件)。残りは main へ入れること (オーナーの指示で行う) と、下の「main へ入れるときの注意」を確かめること
- **開発サーバーでの確認 (2026-11-12)**: ブランチの作業ツリーで `npm run dev:web` を起動し、Geo (トップ・分析 3・層・データの一覧・交通網の変遷)・県 2・全国 3・市区町村 3・調査 2・カテゴリ・テーマ 3・ランキング・ブログ・商品の 23 ページが 200 でエラーなしだった。転送 (ランキング・ブログ・テーマの旧 URL の 301) と 410 (ブログ・ランキング) も台帳どおりに返った。ランキングのページに広告が出て、県のページの HTML にシンボルと特産品が本番と同じく入っていた。`next build` と Remotion のバンドルは未確認
- **別の機会に回した判断**: 列挙が読み込み口の TS と Schema の `enum` の 2 か所に書かれている (`geo.layers` の `sourceAnalysis`、`open-data-catalog/types.ts` の `OPEN_DATA_SOURCE_KINDS` など)。型を Schema から導くかを決める。2 桁の県コード (港湾の `prefectureCode`・`open-data.prefecture-statistics` の `resources[].prefectureCode`) を県のマスタ (5 桁の `prefCode`) へ結ぶ手段が無い (`refs` の `parse` は `list` だけ)。検査に桁を直す指定を足すか、台帳の側を 5 桁にするかを決める。県の本文 47 ファイルを 1 ファイルにするか
- **main へ入れるときの注意**: (1) 段 1 は `sync-snapshots.yml` の書き戻しのパスを変えたので、main へ入るまで `sync-snapshots` を起動しない。(2) 段 2 でブログの公開前検査 (`blog-publication-guard.ts`) の契約のパスが変わったので、保管してあるブログ索引の候補は作り直す。(5) 段 5 の読み込み口は middleware (Edge) が JSON を静的 import する。テストは通っているが、`next build` と本番での転送・410 は未確認なので、main へ入れた後にルートのスモークテスト (`.github/scripts/smoke-test-routes.sh`) で確かめる。(6) `apps/web/src/config/unpublished-blog-slugs.ts` (生成物) の見出しが、410 の一覧の正本を旧い TS と書いたままなので、`generate-unpublished-blog-slugs.ts` の文言を直して作り直す。(4) `data/products/catalog-status.json` の証跡の文字列に、移す前の KDP の出品台帳のパスが 33 件残る (`products:report` で作り直すと新しいパスになる)。(7) 段 6 で `packages/gis` と `packages/data-configs` の読み込み口が `data/geo/`・`data/open-data/` の JSON を静的 import する形になった。型検査と vitest は通っているが、`next build` と Remotion のバンドル、`/geo` 系ページの表示は未確認なので、main へ入れる前に `npm run dev:web` で `/geo` と `/geo/layers/<slug>` を開いて確かめる。(8) 段 10 で広告の台帳を足し `publish-affiliate-ads.yml` の起動条件を変えた。develop への push で広告の R2 への反映が走り、成功した (2026-11-12)。main へ入っても workflow は develop の push で起動するので、main では走らない
- **完了条件**: ブランチ `ledger-db-unify` が develop と main に入り、上の注意 (1)〜(8) を確かめた

### [SKILL-AGENT-RULES-TO-CHECKS-01] skill と agent の定義を、短い規則と機械の検査へ作り替える
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-10] [領域:管理]

2026-11-10 のオーナーの方針: 文書が古くなったり書きすぎたりして agent の判断が増えるなら、短い規則とテスト・機械の検査で守る。データの置き場は `LEDGER-DB-UNIFY-01` でこの形にした (規則 3 行 + `check-datasets`)。skill (`.claude/skills/**/SKILL.md`) と agent (`.claude/agents/*.md`) の定義は範囲が別なので、ここで扱う。
- **次**: 置き場・形・手順を文章で説明している定義を数え (`LEDGER-DB-UNIFY-01` の移行で `RETIRED` が指した文書が最初の材料)、検査へ移せる規則と、消せる説明を分ける
- **禁止**: 検査を作らずに文章だけを消さない (規則が消える)
- **完了条件**: 対象にした定義ごとに、規則が検査かテストに移り、説明の節が消えている

### [WINDOWS-LOCAL-GATES-01] 会社の Windows PC でだけ落ちる検査を直す (パス区切り・改行)
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-10] [領域:管理]

- **証拠 (2026-11-10)**: `apps/web/scripts/lib/__tests__/blog-fullbleed-cli.test.ts` の 2 件が、パス区切り (`\`) を `/` の正規表現で照合して落ちる
- **証拠 (2026-11-10)**: `packages/data-configs/mirror/unit-semantics.mjs` は `eol=lf` の属性が無く、作業ツリーで CRLF になって `preflight:pr` の Unit Semantics Mirror が落ちる (`git ls-files --eol` が `i/lf w/crlf`)
- **証拠 (2026-11-10)**: `apps/admin/tests/unit/agent-models.test.ts` が、期待値 `.claude/agents/broken.md` に対して区切りが逆のパスを返されて落ちる。
- **証拠 (2026-11-11)**: テーマの `evaluate-theme-experiments` の CLI テスト 7 件が、`--import` に Windows の絶対パスを渡して `ERR_UNSUPPORTED_ESM_URL_SCHEME` で落ちる (file URL にする必要がある)。`npm run theme:quality:test` は 551 件中 8 件が失敗し、残り 1 件は preview ゲートウェイの 502 のテスト
- **証拠 (2026-11-11)**: `.claude/scripts/lib/__tests__/data-refresh-scoped-workflow.test.mjs` が、`spawnSync` で `node_modules/.bin/tsx` を起動できず `status: null` で落ちる
- **観測 (2026-11-20)**: `preflight:pr` で 68 中 6 ゲートが落ちた。Year Code Mirror・Unit Semantics Mirror と、pre-commit の `r2-keys:mirror:check` は作業ツリーの CRLF で落ちる (作り直すと中身の差は 0 で通る)。Sitemap / Tag Keys・seo-meta-facts は R2 の公開 URL の取得が `TypeError: fetch failed` (会社のプロキシ)。data-refresh-scoped-workflow のテストも同日まだ `status: null`
- **観測 (2026-11-24)**: マージのコミットの pre-commit で `apps/web/scripts/lib/__tests__/blog-image-render.test.ts` が一時ファイルの削除で `EBUSY: resource busy or locked` (Windows のファイルロック) で 1 回落ち、同じ内容の再実行で通った。同日の pre-commit は 1 回 38 分かかった
- **証拠 (2026-11-12)**: `.claude/scripts/note/__tests__/attachment-dom.test.cjs` の「無料説明文の同名言及を無視し、折り返し段落のDOM先頭を選ぶ」が、生成した式に `keys Home|index($0,h)|startsWith` が無いことの検査で落ちる (読むファイルは作業ツリーで CRLF。差分の無い作業ツリーでも落ちることを段 13 の検証で確認)。Mac (改行は LF) の作業ツリーでも同じ検査で落ちる (2026-11-13 確認)。`.claude/scripts/note/editor-helpers.sh` の `ins_file` に `index($0,h)` が残っているためで、改行コードは原因ではない。Windows の件と分けて、`ins_file` を `attachment-dom.cjs` の式へ寄せるかテストを現状に合わせるかを決める
- **証拠 (2026-11-13)**: `apps/web/src/config/__tests__/gone-blog-publication.test.ts` の 3 件 (「…はslug指定でも旧原稿path指定でも再公開を拒否する」) が、変更の無い本体ツリーでも落ちる (原因は読んでいない)
- **証拠 (2026-11-13)**: `apps/web/src/__tests__/region-page-no-comparison.test.ts` の 3 件が、列挙したパス (`appareaspage.tsx`) を `/` 区切りの期待値と比べて落ちる (CF-CPU-URL-01 の作業中の vitest で観測。触っていないファイル)
- **完了条件**: この PC で `npm run preflight:pr` の該当の 2 ゲートと、`apps/web/scripts`・`apps/admin` の vitest、`npm run theme:quality:test` が通る
- **統合 (2026-11-13)**: `ADMIN-AGENT-MODELS-WIN-PATH-01` をこのカードへ統合した。 (参照: #1258)
- **確認の追加 (2026-11-13・消した `ADMIN-VITEST-TIMEOUT-01` から)**: `apps/admin/vitest.config.mts` の testTimeout と hookTimeout を 120 秒にした (`ce725a765`)。この PC で tsc や dev サーバーと並行して `npm run test --workspace apps/admin` を流し、タイムアウトが 0 件かを確かめる。
- **確認の追加 (2026-11-13・消した `ROOT-TSX-NODE-PIN-01` から)**: この PC の Node は 22.14.0 で、`.mjs` が `.ts` を直接 import すると `ERR_UNKNOWN_FILE_EXTENSION` で落ちる (型の除去が既定で有効なのは 22.18 から)。`.claude/scripts` に約 10 本ある (`ads/build-placement-map.mjs`・`estat/gen-ssds-configs.mjs`・`lib/internal-link-lint.mjs` など)。22.14 を支えるなら tsx 経由にし、支えないなら Node を上げる (オーナーが決める)。ルートの devDependencies への tsx の追加は `7f6f18db0` で済み。
- **観測 (2026-11-14・Mac)**: `attachment-dom.test.cjs` の 1 件は Mac でも落ちるので、Windows 固有ではない。
- **再観測 (2026-11-15・R2 Stage 3 batch B)**: `node --import tsx --test .claude/scripts/note/__tests__/attachment-dom.test.cjs` の同じ 1 件が `ERR_ASSERTION` (`/keys Home|index\(\$0,h\)|startsWith/` に一致) で失敗。
- **再観測 (2026-11-20・Mac)**: 同じ 1 件が同じ assert で失敗 (note のテストを packages へ移す作業中に確認。) (参照: d3ce3bac09)

### [AFFILIATE-PUBLISH-PROFILE-TRIGGER-01] 案件の台帳だけを変えた push で、広告の R2 への反映が走らない
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-11-11] [領域:アフィリエイト] [待ち:判断]

`publish-affiliate-ads.yml` は広告の台帳 (`affiliate.ads`) と読み込み口の変更でだけ起動する。案件の台帳 (`affiliate.offer-profiles`) の変更は、配信する `AFFILIATE_ADS` の `isActive` (配信の保留) と `offerProfile` を変えるのに、案件だけを変えた push では R2 の `app/affiliate-ads/all.json` が作り直されない (2026-11-11 に workflow の paths と読み込み口の結合の式を読んで確認。台帳を `data/` へ移す前の TS のころから同じ)。
- **次**: paths に案件の台帳と、配信の保留を決める `apps/web/src/features/ads/constants/affiliate-delivery-policy.ts` を足すか、オーナーと決める (起動のたびに R2 への書き込みと全ゾーンのパージが走るため)
- **完了条件**: 案件の台帳だけを変えた push で、R2 の広告の snapshot が作り直される

### [GEO-ANALYSIS-CONTENT-ID-DANGLING-01] Geo 分析 3 件の contentId が、事業計画のコンテンツの機会に無い
タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-11] [領域:データ] [待ち:判断]

台帳 `geo.analyses` の土砂・低標高・公共施設の 3 分析は、contentId に geo-107・geo-129・geo-128 を持つが、台帳 `business-plan.content-opportunities` の機会は geo-001〜geo-100 しか無い (2026-11-11 に段 11 で参照を宣言して判明)。いまは `config/datasets.mjs` の `geo.analyses` の参照を `severity: "warn"` で通している。
- **次**: 事業計画の担当が、機会を足すか contentId を直すかを決める
- **完了条件**: 3 件が実在する機会を指し、`geo.analyses` の `contentId` の参照から `severity: "warn"` を外しても `npm run check-datasets` が error 0

### [PRODUCT-LP-SHOWCASE-01] 商品の LP (サイトの商品ページと note の記事) を、1 つの画像指定から全商品へ作れる仕組みとゲートにする
タグ: [収益化] [種類:改善] [実行:対話] [検証:npx tsx apps/web/scripts/generate-product-storefront.ts --check] [起票:2026-11-10] [領域:商品]

- **済み**: 全14商品の固定販売版LPを本番に出し (PR #1252・#1258、main `0e07839fb`)、本番14LPと画像59枚のSHA256を台帳と照合した。
- **オーナー決定 (2026-11-12)**: PRICE-DATA-PACK-2026-11 による表示変更の保留を解除した。実験のstatusと価格は変えず、公開時に表示変更日を記録して価格効果の比較と混同しない。
- **残り (実行順)**:
  1. note更新: Windowsでは通信フィルターがHTTP 503を返し、別環境は今は無い (11-13 オーナー回答)。許可された環境で、既存添付を保持して分析ZIPを追加し、価格不変・有料本文保全・添付の非露出を確かめて共通release CLIへverification JSONを渡す。無料部分14本の初稿反映と、公開中の添付と固定納品版の照合も行う。添付は1日10回までで、制限が出たら翌日に回す。
  2. 保存原稿の古い価格 (P-01〜P-12) を現公開価格に同期し、private R2へ再保存する。
  3. P-01改訂案 (`products.landings` の `analysisRevision`、`products:analysis:build` / `check`) は、Excel実機確認、現行134指標版との同梱か差替えと価格の決定、改訂ZIPと原稿の非公開保全、オーナー承認後の販売版公開の順に進める。5商品の改訂案も実機と目視で確かめる。
  4. 仕組み: `figure-specs.json` に `section`・`alt`・節の `lead` を持たせてSchemaで固定し、公開してよい部分のgit写しから `generate-product-storefront.ts` が `showcase` を導出して `STANDALONE_NOTE_PRODUCTS` の手書きを消す。画像は `push-exact-r2-assets.ts --manifest` でsha256一致分だけ置き、showcase全URLのGET検査 (200・image/png・sha256) とLPの無い商品の縮小専用上限を足す。
  5. CDNの404記憶を避けるため、置く前に公開URLを読まず、不一致なら `gh workflow run purge-cdn.yml -f prefix=app/products/<slug>/showcase` で消す。この手順を `/build-data-pack` のE2と `note-image-assets.md` に書く。
  6. 許可された環境で `C:/tmp/stats47-population-research` と、Temp配下の `stats47-theme-product-check-20261113`・`stats47-product-release-20261113` だけを削除する。`.local/data-packs/P-01/analysis-20261112` は保持する。
- **停止条件・禁止**: 納品実物と説明が合わない商品は PRODUCT-PACK-CONTENT-MISMATCH-01 で解消するまで公開しない。R2書き込み・CDN消去・note更新・本番デプロイはそれぞれオーナー承認を取る。型の台帳に無い図を載せない。改訂案を販売版へ自動昇格せず、既存固定版を上書きしない。Office実機未確認を合格扱いしない。制限や削除拒否を別経路で回避しない。Kindle 13件は対象外。
- **完了条件**: 全14件のnote確認とpublished台帳・公開LPの作成例が一致し、本番画像が表示される。サイトとnoteの見本が同じspecから作られ、手書き `showcase` が0件、見本全URLのGET検査が通り、LPの無い商品の上限が0、`maxUntypedProductArticles` が下がっている (PRODUCT-SAMPLE-TYPED-01 を統合)。関連: PRODUCTS-PAGE-CONTENT-01。

### [MEDIA-WORKSPACE-ORPHAN-01] 画像のワークスペース検査が「Orphan image」で止まる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-10] [領域:SNS]

- **証拠 (2026-11-10・Mac)**: `node .claude/scripts/media/check-workspace.mjs` が `Orphan image: IMG-94a0f89d6b63cc51fcd8f506` で止まる。型の台帳を変更前の版へ戻しても同じ所で止まるので、型の台帳の変更とは関係が無い。
- **次**: 在庫索引が古いだけか (`npm run media:state:pull` で取り直して再実行)、品質記録に在庫から消えた画像が残っているかを切り分ける。
- **完了条件**: 原因を記録し、検査が通るか、残す理由を記録した。

### [BLOG-KAKEI-PUBLISHED-FACT-FIX-01] 公開済みのビール系の記事 2 本に、出典と合わない記述がある
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-09] [領域:サイト]

- **事象 (2026-11-09、下書き `beer-happoshu-liquor-tax-steps-household-response` の書き手が照合で発見)**: ① `blog:beer-vs-happoshu-shift` は「新ジャンルは家計調査で別区分」と書くが、統計局の品目分類では発泡酒の品目 (3X7) に新ジャンルを含む。
- **次**: ① 統計局の家計調査の品目分類 (用語の解説・収支項目分類) と国税庁の酒税の資料を取得して、2 本の該当箇所と照らす ② 誤りなら `/blog-revise-fix` で直し、critic を通す。
- **完了条件**: 2 本の該当箇所が公式資料と一致するか、記事の値の根拠が本文に書かれている。
- **進み (2026-11-09)**: 2 本とも誤りと確かめ、直した改稿を `contents/blog/<slug>/` に用意した (新ジャンルは品目 3X7 に入る。酒税は 350ml 換算 54.25 円・財務省 d08 と国税庁の手引き。2026 年 10 月の一本化は実施済みの時制へ)。同時に `blog:household-spending-before-after-inflation` (`BLOG-ENGEL-VALUE-MISMATCH-01`) も直した。3 本とも gate blocker 0・factual exit 0・critic PASS。公開 (published のまま develop へ push) で反映する。
- **残り (審査は通ったが残る指摘)**: ① (2026-11-09 済み・オーナー判断で題を本文の結論に合わせた。critic PASS・develop へ push 済み) ② household のコーヒー豆相場「約2倍」に出典が無い ③ household のビール値 (2019=10,720 / 2024=12,934) が beer-peak (0003343671 の月次合計 10,721 / 12,933) と 1 円ずれる (表の違いか丸めか未確認) ④ beer-vs-happoshu の焼酎との比較が一本化後も成り立つか未確認。
- **移した残り (2026-11-24・旧 PRODUCT-SALES-READINESS-01)**: K-S1-01 のレビューで見つかった誤りが公開ブログ 9 本に残る (real-disposable-income-reversal / heating-cost-vs-disposable-income / per-capita-income-gap / savings-balance-gap / engel-coefficient-prefecture-ranking / household-spending-prefecture-gap / communication-cost-burden / expenditure-structure-comparison / black-tea-income-gap)。`.local/kindle-books/K-S1-01/v3-20260919-r3/review-r1-findings.md` の before/after を must-fix として `/blog-revise-fix` で直す (図: savings-ranking を 2019 年 financial-assets-balance に、income-summary-findings の見出し「約200万円」→「約20万円」)。
- **移した残り (2026-11-24・旧 BLOG-ENGEL-VALUE-MISMATCH-01)**: エンゲル係数の系の記事 (用途分類) と食料の構成比 (品目分類) で、同じ年の値が 3 通りある。どの記事がどちらの分類を使うかを並べ、本文に分類を書く。

### [MUNI-THEME-INDEX-STAGING-01] 市区町村×テーマのページを、人口の多い市から段階的に検索に出す
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-09] [領域:サイト] [待ち:判断]

- **決めてあること (2026-10-31 オーナー決定)**: 市区町村×テーマのページ (`/areas/県/cities/市/テーマ`、約 45,900) は最初 noindex・サイトマップ外で、人口の多い市から段階的に検索に出す。
- **次**: ① 最初に出す市の範囲 (人口の閾値) と 1 回の件数を決める ② その範囲だけ index・サイトマップへ入れる ③ 4 週の登録数と表示を記録してから次の範囲へ広げる。
- **停止条件**: 本番反映はオーナー承認の後。中身の薄いページ (値が少ない市) を検索に出さない。
- **完了条件**: 最初の範囲が検索に出て、4 週の登録数と表示が記録されている。

### [PAGE-UI-REVIEW-COVERAGE-01] ページ UI の週次確認で読むべき画面の 9 割が読まれず、新しい指摘の行き先が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-11-08] [領域:サイト]

- **観測 (2026-11-08・W44 週次レビュー)**: `data/page-quality/metrics/ui-review-latest.json` (監査 2026-10-30) は `reviewStatus: reviewed` だが、読んだ切り出しは 196 枚中 22 枚で、読み残し 63 画面・全部読めたページ 0。 (参照: #1015)
- **次**: 読み残しの原因 (エージェントの読む上限か、切り出しの枚数か) を `quality-suite-weekly.yml` の page-quality job のログで確かめ、全ページを読める形にする。指摘 10 件のうち直すものはテンプレートごとの `UI-FIX-*` カードへ分ける。
- **完了条件**: 次の週次確認で `readCoverage.unreadScreens` が 0 で、Issue #1015 の指摘がすべてカードか見送り理由に振り分けられている。

### [PAGE-QUALITY-ERRORS-01] ページ品質の週次監査の error 164 件を種類ごとに減らす
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-11-08] [領域:サイト]

- **観測 (2026-11-06 の監査・Issue #1014)**: 対象 9,400 URL で error 164・warning 4,303 (HTML/RSC 肥大化・DOM 過剰・リンク重複・広告重複・構造化データ・画像切れ)。前の受け皿カード `PAGE-QUALITY-ERROR-BACKLOG-01` は既に無い。
- **次**: 管理画面 `/quality/page-audit` で error を種類別に数え、件数の多い 1 種類から原因を直す。
- **完了条件**: error が 0 になり、Issue #1014 が自動で閉じる。

### [BLOG-PHOTO-ROLLOUT-01] ブログの写真風の絵の残りとテーマの画像を片付ける
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run test:image-pipeline] [起票:2026-11-07] [領域:サイト] [待ち:判断]

- **状態 (2026-11-07)**: 公開 848 本のうち 845 本を写真風 (`blog-photo-v2`) で main と R2 へ反映した。
- **残す 3 本**: `abortion-rate-prefecture-gap`・`early-neonatal-deaths-prefecture-gap`・`international-cooperation-volunteer-map` は旧来の絵のまま。題材に合う絵を決めてから差し替える。
- **未確認**: 人が全件を見ていない。Codex の一次判定だけの絵が大半で、主題と遠い絵が約 15 本ある。週次修復 (2026-11-14) の後も写真のまま残るかを確かめる。
- **テーマ 56 件**: 経路の登録と一覧カードの実装が先。規約の既定「カード画像は作らない」の変更が要る。
- **別件**: `.claude/scripts/themes/__tests__/tsunami-evacuation.test.mjs` が `data/metrics/*` を拡張子なしで読めず失敗し、push 前の検査を止める。
- **完了条件**: 3 本とテーマの扱いが決まり、週次修復の後も 845 本が変わらない。

### [RANKING-CARD-WEBP-UNUSED-01] ランキングカードの WebP 4,918 枚の読み手を確かめ、不要なら生成と週次修復を止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:grep -rn "rankingThumbnailKeys" apps packages] [起票:2026-11-06] [領域:サイト] [待ち:判断]

- **済み (2026-11-14・990e1d6b9)**: 読み手を確定した。 (参照: 15248a33e1)
- **残り (判断)**: (a) R2 の `app/ranking/<key>/thumbnail-{light,dark}.webp` と `thumbnail.json` 約 4,900 枚を削除するか。推奨は、R2 のアクセスログで 2 週間ほど外部からの取得が無いことを確かめてから削除する (根拠: コード上の読み手は無いが、外部サイトの直リンクはリポジトリからは見えない。保管費用は小さいので急がない)。(b) 経路 `ranking-card-motif` を続けるか取り下げるか。推奨は取り下げ (根拠: 絵を載せるカード画像の表示面が無く、反映の前提になる計装の対象も無い)。続ける場合は、表示面を先に決める。(c) `OGP-RANKING-CARD-BLOG-REPAIR-01` の ranking 分は、生成を止めたので閉じる。
- **完了条件**: オーナーが (a) と (b) の方針を決め、(a) で削除と決めた場合は R2 の該当キーが 404 になり、(b) で取り下げた場合は `config/image-generation-routes.json` の `ranking-card-motif` と `data/ogp/ranking-card-motif-trial.json` と ogp-image-standards.md の該当節が外れている。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a) R2 アクセスログで 2 週間外部取得が無いのを確かめてから削除、(b) 経路 ranking-card-motif を取り下げ を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: R2 のアクセスログで外部取得の有無を 2 週間見る。実行 (R2 の削除) はオーナーの承認の後

### [MUNI-SIZE-RANKING-01] 1事業所あたり出荷額の市区町村ランキングを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-06] [領域:データ] [待ち:判断] [待ち:承認]

- **起点**: M01 の結論の中心の指標なのに、市区町村ランキングが無い。
- **やること**: ① 出荷額 (2023 年) と事業所数 (2024 年) の年のずれを許すかを決める ② 市区町村の値の作り方を `.claude/rules/metric-config-standards.md` の多段依存に沿って決める ③ R2 へ生成して公開する (本番の反映はオーナーの指示で) ④ 記事の案内を足す。1 人あたり出荷額の市区町村ランキングも同じ手順で判断する。
- **完了条件**: 問いの詳細の市区町村の欄にリンクが出て、本番で開ける。

### [CONTENT-TYPE-FIT-01] 型に合っていない記事の処置を決めて反映する
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run content-types:check] [起票:2026-11-06] [領域:コンテンツ] [待ち:判断]

- **起点**: 2026-11-06 に全コンテンツを 4 型へ振り分け、機械の止めとルールを入れた (`.claude/rules/content-type-standards.md`)。
- **決定済み (撤去 3 本・実行待ち)**: `annual-sunshine-duration-vs-auto-liability-insurance-amount`・`shumai-consumption-expenditure-vs-jr-freight-shipment`・`road-length-per-km2-vs-residential-building-starts`。残す決定は 3 本。
- **やること**: ① 撤去 3 本の実行をオーナーに確認し、`GONE_BLOG_SLUGS` の手順で反映する (本文は `archive-blog-articles.mjs` で退避してから) ② 統合 9 本・書き直し 23 本の処置を決め、`decisions` に書く ③ note の用途別商品とサービスの型 (題名から仮置き) を確定する ④ URL の規則で参照型にした 420 本のうち、題名に「なぜ」を含む 187 本を参照型のままにしてよいかを確認する ⑤ 2026-10-28 以降に公開した相関の記事は、計測が 28 日を超えた週の `content-types:fit` で改めて判定する。
- **完了条件**: `/content/fit`が 0 件で、決定が台帳にあり、note の仮置きが確定している。
- **追補 (2026-11-22)**: `check-content-types` が「個別の指定の宛先が無い」6 件を出す (blog: general-hospital-bed-occupancy-rate・inpatient-rate-aging-burden・software-engineer-income-gap・telework-gap-tokyo-6x・total-fertility-rate・wheat-flour-consumption-food-culture-gap)。pre-commit は通る (warning)。指定を消すか宛先を足す。

### [ISSUE-PRODUCT-LINK-01] 既存の商品に、起点の問いを指す項目を足す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-06] [領域:商品]

- **起点**: 問いの台帳に `products` を足し、M01 から製造品出荷額の商品を直接指した (`/content/questions` の「企画した商品」)。実在は `check-datasets` が見る。Kindle は外部台帳の ID が無いので対象外のまま。
- **境界**: 指すのは社会の問いだけで、事業イシューマップと混ぜない。同じ指標を使うだけの商品は書かない。
- **やること**: 新しい商品は企画の時点で書く (note の商品は `products`、Kindle の本は `books`。`books` はカタログの本の ID を外部キーで指す。2026-11-14 に足した)。既存の note の商品は根拠があるものだけ足す。
- **完了条件**: 問いから企画した商品がすべて `products` (note) か `books` (Kindle) で辿れる。

### [ANALYSIS-CYCLE-01] 問いの分析・図・記事・審査・公開後の評価を、視点の層で自動に回す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run issues:check] [起票:2026-11-06] [領域:サイト]

- **設計**: `analyses.json` に工程の状態と視点の台帳を持ち、視点の層 (問いの固定・データの定義・分解・頑健性・基準比較・反例と地理・言えないこと・図の読み方) ごとに「結果」か「対象外の理由」を必須にする。結論を見ない点検役が先に確かめる項目を出し、機械で止められる項目は検査へ移し、公開後の計測を問いの台帳へ戻す。
- **済み**: `analysis-viewpoints.json`・`npm run analysis:check`・`analysis-critic`・実行役 `npm run analysis:run` (`/run-analysis`) を入れ、M01・H01 を最終審査の手前まで通した。
- **次 (順に)**:
  1. 図の割り当てを「主張 1 件に 1 枚」から「読者が 1 枚で読む比較ごとに 1 枚」へ変え、値が 1 つだけの図・同じ行を分けた図を機械で止める。頑健性の確認は 1 枚にまとめる (試行で数字 1 つの棒が 18 枚並んだ)。
  2. M01 の分析スクリプトを付加価値まで広げ直す (付加価値を主にする方針はオーナー決定)。再現すべき値: 人口 3 万人以上 754 町、付加価値の段差の人の厚み 88.8/68.0/75.1、一番上の段差の 95% の幅 67〜82、全体の分散 70.5/12.1/17.3、付加価値率の中央値 0.21、全規模センサスと 2024 年の比 1.74/1.10、1980→2020 の順位相関 0.70 と上位残留 116/182、2000→2023 の事業所 0.67 倍と出荷額 1.12 倍、3 万人未満 850 町の 70.3/68.4/65.0。町ごとの行も出力に持たせる。1980・2000 の出荷額は合併前の行で県の合計の検算が 1.9〜3.1% ずれるので別名で読む。
  3. `npm run analysis:run -- --analysis analysis:M01-factory-size --plan-figures --rewrite --direction "主な物差しは付加価値..."` で改稿の小包を作り article-writer へ渡す。
  4. 公開済みの M01・H01 の台帳の工程を `published` にする (11-07 に本番 200 を確認済み)。
- **残りの穴**:
  - `regenerate-blog-svgs.yml` を `dry_run=false` で流すと、`chartType` を持つ分析の図 (`-lines.json`・`-scatter.json`) の 4:5 の図が旧形式で上書きされうる (コードの読み取りで確認・未実行)。生成器が `data-image-template` 付きの図を飛ばすようにする。
  - 賃貸用など空き家の種類別の率の分母を指標定義に宣言する (賃貸用とその他の合計が空き家率を超える町が 10 ある)。
  - 散布図に、曲線の関係を示す区分ごとの中央値の線を足せるようにする (H01 の賃貸用以外の図)。
  - 新しい問いから台帳の行と spec を作る工程が無い。分析スクリプトを Codex が新規に書く経路は未検証。NotebookLM の経路 (`--notebooks`) は未実行。1 次審査の Codex は 1 回 30〜40 万トークン (キャッシュ込み) で、読むファイルを絞れば減らせる。反証の必須試験を複数の問いで測る (fixture `__tests__/fixtures/m01-before.json`)。
- **止まる場面**: 設計の確認・公開の判断。
- **完了の判定**: 新しい問いが、人の指示なしで下書きと審査まで進み、`published: false` で止まる。M01 の失敗を再現した入力で、書く前に止まる。

### [H01-VACANT-ARTICLE-PUBLISH-01] H01 と M01 の記事を公開し、図の台帳と X の下書きを進める
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run issues:figures] [起票:2026-11-06] [領域:サイト]

- **起点**: 記事 `vacant-houses-population-decline` と `manufacturing-strength-factory-size` は `contents/blog` に `published: false` で入っている。
- **済み (2026-11-15)**: 2 本は本番で公開済み (HTTP 200)。
- **次**: X の下書き 1195・1196 はオーナー承認済み (2026-11-15) だが、画像が未作成で管理画面の段階は「画像準備待ち」。図 `M01-gap-steps-bars`・`H01-vacancy-rate-trend` から X 用の画像を作り、`assets` に記録してから予約へ回す。`H01-vacancy-rate-trend` の行き先 `municipality-ranking:vacant-housing-ratio` (planned) は、ページに図を置くかを決める。
- **完了条件**: 2 本が本番で公開され、`issues:figures` の記事の行が消え、X の投稿の状態が台帳と一致している。

### [NOTE-PLAYWRIGHT-DIALOG-CRASH-01] note 公開中の Playwright 起動スクリプトがダイアログ処理の競合でブラウザごと落ちる
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-11-05] [領域:商品] [待ち:ログイン]

- **済み (2026-11-14・0905a8308)**: 専用プロファイルを CDP 付きで起動する `.claude/scripts/note/launch-note-cdp.mjs` を足し、`Page.handleJavaScriptDialog: No dialog is showing` だけを無視してほかの例外では終了するようにした。
- **残り**: ① オーナーが note の題名なしの下書き `n0ae79d01a60b` と `nbb8ef52bd1ff` を削除する。② 次に note を公開するとき、`node .claude/scripts/note/launch-note-cdp.mjs` で起動して `NOTE_BU_CDP` を付けて公開し、起動スクリプトが最後まで終了しないことを確かめる (実際の専用プロファイルでの起動はログインが要るので未確認)。
- **止まっている理由**: どちらも note へのログインが要り、下書きの削除はオーナーの操作である。
- **残り (追補・2026-11-14)**: `.claude/scripts/note/note-publish-lib.sh` の 8 行目の `NBU()` は Profile 5 を固定で開き `NOTE_BU_CDP` を読まないので、`publish-kakei-one.sh` が使う `np_install_publish_guard` と `np_update_published_hashtags` は、CDP で起動した専用プロファイルではなく Profile 5 を操作する。
- **完了条件**: 2 本の下書きが note の下書き一覧に無く、launch-note-cdp.mjs 経由の公開が 1 回、ブラウザの終了なしで終わり、その公開の報告に `PUBLISH_RECORD: pushed <sha>` の行がある。
- **進捗 (2026-11-24・2ee65602e)**: NBU() が NOTE_BU_CDP を読むようにした (偽の browser-use で両方の分岐を確認)。残りは専用プロファイルでの公開 1 回と下書き 2 本の削除で、どちらもオーナーと note へのログインが要る。

### [ISSUE-LEDGER-TOP10-01] 問いの台帳から、最初に記事にする10本を選ぶ
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run issues:check] [起票:2026-11-05] [領域:商品] [待ち:判断]

- **起点**: `data/content/issues.json`（大きな問い 169・小さな問い 9。）
- **次**: ① 需要・答えが出る・意外性・更新性の4基準で上位10本に絞る（候補: H05 H11 A01 A10 D01 D12 D13 D03 B01 B02 B03 A12 C02 F10 F08 I09-1 H13 H14 I14 I08 J04 J09 J10 H01 M10） ② 選んだ問いの `dataNote` の統計が実在し、市区町村まで取れるかを1本ずつ当てる（台帳作成時は未確認） ③ `STRATEGY-DATA-PRODUCT-FIRST-01` と整合させる（問い記事＝入口、作り方・加工データ＝出口）

### [ISSUE-COVERAGE-GROW-01] 棚卸しで「紐づかないが読まれている」ページに問いを足し、「読まれていない」ページの扱いを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run issues:coverage] [起票:2026-11-05] [領域:商品]

- **起点**: `npm run issues:coverage`（2026-W40〜W43 の GSC と突き合わせ）。公開 4,372 ページのうち、紐づかないが読まれている 1,550
- **進み具合 (2026-11-05)**: 検索語と読まれているページから 20 本、白書 (NotebookLM の引用つき) から 6 本を足し、重なる 4 本は `C12`・`D13`・`F17`・`B12` へ検索語と根拠を移した。問いは 204 本、読まれているのに紐づかないページは 1,502。検索語の残りは `npm run issues:candidates` で見る。
- **次**: ① 読まれているのに紐づかないページの上位から、GSC の検索語を `queries` に持つ小さな問いを足す（最大のまとまりは家計調査の品目で、大きな問い K01〜K03 の下に入る） ② 上からの大きな問いを NotebookLM で白書から拾う（クラウドの環境は gh の認証が無く呼べないので Mac で） ③ 読まれていない 1,808 ページ（ranking 890・municipality-ranking 643・blog 226 ほか）を、統合・転送・検索除外・そのままのどれにするか本人が決める。自動では消さない

### [CONTENT-PUBLIC-WORKS-FISCAL-01] 「公共事業は無駄か」を、都道府県の土木費・普通建設事業費と財政指標の関係で確かめて記事にする
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-07] [領域:サイト]

- **起点**: issue [#1245](https://github.com/uruhayato373/stats47/issues/1245)（切り口・一次資料）。
- **確かめる関係（どれも未検証の仮説）**: ① 1人あたり普通建設事業費 × 財政力指数（財政力が弱い県ほど高い） ② 1990年代の普通建設事業費 × 今の実質公債費比率・将来負担比率（時間差のある正の相関） ③ 経常収支比率 × 土木費の構成比（負の相関） ④ 地方交付税への依存 × 普通建設事業費（正の相関）。面積あたりの値も並べ、面積・地形という共通の原因と見分ける
- **次**: ① 財政指標（財政力指数・実質公債費比率・将来負担比率・経常収支比率）と目的別歳出の土木費が都道府県別・年次で取れるかを、e-Stat の社会・人口統計体系と総務省「地方財政状況調査」で当てる ② 1990年代まで遡れる系列を確かめる ③ 取れた分で散布図を作り、記事の軸を1本に絞る（第一候補: 1990年代の1人あたり普通建設事業費 × 今の実質公債費比率）
- **注意**: 災害の年（東日本大震災後の岩手・宮城・福島など）は外れ値になるので複数年の平均で見る。都道府県の決算だけでは市町村の道路・下水道が抜ける。相関を因果として書かない
- **完了条件**: 仮説①〜④の判定（支持・棄却・データ不足）を根拠のデータと一緒に issue #1245 に残し、記事を1本公開する

### [STRATEGY-DATA-PRODUCT-FIRST-01] 記事の量より、独自の加工データの販売へ時間を移す
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-04] [領域:商品] [待ち:判断]

- **起点**: 2026-11-04 の3面方針で、stats47 の役割はデータ商品になった（vault `memos/20261104_decision_kazu-noteは軸を1つにして商品を広げる.md`）。
- **次**: ① 🔴 高のカードをデータ商品に効くものとそれ以外に分ける ② 記事の量産のカードを止めるか下げるかを本人が決める ③ 製造品出荷額の商品 (EXP-007) の次に出すデータ商品の候補を挙げる
- **完了条件**: 配分の判断を backlog の並びに反映した。
- **禁止**: 判断の前にカードを消さない。

### [STRATEGY-SSOT-ALIGN-4X3-01] 事業イシューマップと食い違う stats47 の SSOT・agent・スキル・台帳を直す（85 件）
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-11-05] [領域:戦略]

- **済み (2026-11-14・9709cca3b)**: 群 J のうち、`01_プロジェクト定義.md` (2 か所) と `03_マーケティング戦略.md` の AdSense の状態を「2026-10-11 に再開済み」に改め、`02_収益化戦略.md` §6 の表の旧 ID を `NOTE-FISCAL-PEER-SALES-01` に直した。 (参照: `c5e9ee3a1`)
- **依存**: 次の 2 点はオーナーが vault で決める。決まるまで群 D には触らない。(a) 境界の案「統計が無くても成り立つ記事は kazu-note。サイト運営・開発のノウハウは売らない」。(b) kazu-note を収益の面にするか、物語の入口に戻すか (公務員ノートの判定日 12-10)。
- **済み (2026-11-14・退避した作業 rescue/kdp-product-wip-20261114)**: 群 A のうち、本線 (行政実務向け商品) をやめた決定に合わせて `02_収益化戦略.md`・`project_monetization_contract.md`・`MEMORY.md`・`04_ターゲットペルソナ.md` の参照を直した。
- **残り (判断不要・todo の編集)**: 群 J の残りとして、backlog の `MUNI-DATA-PRODUCT-PILOT-01` の「note の売上 2 件」を販売実績の台帳の件数に合わせ、`.claude/todo/improvements.md` の `NOTE-FISCAL-PEER-SALES-01` の比較の設計がイシューマップの見方 (ノウハウ型に近く、教科書型の販売の検証にはならない) と矛盾しない書き方にする。
- **残り (判断)**: ① `02_収益化戦略.md` §3.5 の表の「AdSenseは§3.1の再開手続き（`ADSENSE-RESTART-01`）」と `data/business/domain-stances.json` 57 行の aim「AdSense は再開手続きだけを進める」は、AdSense が 2026-10-11 に再開済みで `ADSENSE-RESTART-01` のカードも backlog に無いため古い。選択肢は (a) 状態だけを「再開済み・`ad-yield` を週次で追う」に書き換える、(b) 群 H の §3.5 の改訂と同時に直す。推奨は (a) で、根拠は方針を変えずに事実だけを合わせられること。② 群 I の残りとして、`02_収益化戦略.md` の受注チャネル (統計の地図・グラフを資料用に作る受注) を再開するかを決め、backlog の `NOTE-PRODUCT-LADDER-01` 段 5 をその決定に合わせる。
- **残り (承認後に実装)**: 群 A・B・C・F・G は `02_収益化戦略.md` の改訂案 (§2.1・§2.3・§3.3〜§3.6・§5 の領域表・§6) をオーナーに出し、承認後に反映する。続けて `MEMORY.md`・`project_monetization_contract.md`・01・03・04 を合わせる。群 H は `catalog.ts` の `revenueLayers` と `pilot-board.json` の `route` を 3 収益源に寄せるかをオーナーと決め、schema・テスト・管理画面を同じ差分で直す。群 E は KDP の本ごとの売上を確かめてから扱う。群 D は境界の決定後に扱う。群 K は次の `/monthly-plan` で扱う。各群の対象ファイルと行は 2026-11-05 時点の一覧 (git 履歴のこのカードの旧版) を使う。
- **完了条件**: 各群の記述がイシューマップの見方と矛盾しない。`npm run docs:check`・`npm run check-datasets`・`npm run type-check`・`npm run business-plan:check` が通る。収益化戦略の方針の段落の変更はオーナーの承認を得ている。
- **禁止**: vault の決定記録 (`memos/*decision*`) を書き換えない。オーナーの承認なしに収益化戦略の方針の段落を変えない。境界が決まる前に公務員 AI 関連の商品・マガジンを消さない。

### [METRIC-DEFINITION-GAPS-BOOK-01] 書籍の執筆で見つかった指標の定義の欠けと公開データの抜けを埋める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-04] [領域:データ]

- **済み (2026-11-14・15461ce7f)**: 雪日数・年平均気温の観測地点、老人ホーム定員の 4 種の施設と算式、民営家賃が県庁所在都市の値であること、雪日数が 2020 年に 20 都道府県だけの理由を、e-Stat の項目定義から description / note に書いた。
- **残り**: 民営家賃 (private-rental-housing-rent-per-3-3m2) で東京都の値が東京都区部か都全域かを、総務省統計局の小売物価統計調査の調査市町村の資料で確かめ、確かめられたら note の「未確認」を事実に書き換える。
- **残り (2026-11-14 追加、地域データブックの執筆で判明)**: `consumer-price-difference-index-overall`・`consumer-price-difference-index-housing` (小売物価統計調査) の調べた地点の範囲 (県全域か県庁所在市か) が metric の定義に無く、書籍の本文で「ほかの指標は県の値」と書けなかった。e-Stat の定義から description / note に書く。
- **完了条件**: private-rental-housing-rent-per-3-3m2 の note が、東京都の対象範囲を一次資料の出典 URL と確認日つきで書いている。

### [MUNI-MANUFACTURING-VALUE-CHECK-01] 製造品出荷額の市区町村データの疑わしい値と年の表記を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-04] [領域:データ]

- **起点 (2026-11-04)**: データ商品 (`MUNI-DATA-PRODUCT-PILOT-01`) の検算で見つかった。値は e-Stat の API と全行で差 0 件で、取り込みの誤りではない。
- **川崎市 1986 年 (原因がほぼ確定)**: 社人統の川崎区 5,840,455 は誤り。川崎市公表の工業統計 (`https://www.city.kawasaki.jp/170/cmsfiles/contents/0000025/25684/1986-3hyou.xls` の第 3 表、取得 2026-11-04) は川崎区 3,066,860・全市 5,842,937 百万円。社人統の値は全市の値とほぼ同じで、県計の超過 2,773,565 が他の 6 区の合計 2,773,564 と 1 だけ違う。[推定] 川崎区の欄に市全体の値が入り、社人統の川崎市 8,614,018 は区の合計なので全市の値が二重になった。e-Stat への問い合わせは未実施。
- **川崎市 1983 年**: 市の値 6,471,684 が低い。公表値 6,528,504、区の合計 6,530,113 で、誤りは市の欄。区の値は公表値と合う。県計も区の合計の側と合う。
- **全年の照合**: 川崎市の統計 (`contents/0000053/53475/kogyo.xls`) と市・7 区を 1980〜2019 年で比べ、差が 0.5% と 300 百万円の両方を超えたのは 13 件。大きいのは上の 2 年と 1980 年の川崎区 +60,137・全市 +62,183 (1.0%)。1980 年は県計と矛盾しないので、公表の時点や範囲の違いの可能性があり、原因は未確定。
- **空欄**: 1998〜99 年の豊田市は e-Stat の記号が「-」(データが得られないもの)。1987 年の札幌市・特別区部・那覇市、1994 年の芦屋市は R2 に行が無く、記号の控えにも無い。e-Stat の API に行があるかは未確認 (照合は R2 の行だけを見た。appId は CI にあり手元に無い)。1987 年の区の合計は特別区 12,058,521 (23 区)、札幌は 6 区で 1 区足りない。
- **年の表記**: 本番の市区町村ランキングは `【2023年度】` と出ていて誤り。metric は `yearFormat: "calendar"` と宣言済みで、県のランキングの題は `2023年`。R2 の `cities.json` の yearName が全行「YYYY年度」で、ページがそれをそのまま使う。県のランキングの FAQ にも「2023年度の1位」が残る。
- **済み (2026-11-04)**: オーナー決定で 1986・1983 年の川崎市を川崎市の公表値へ置き換えた。
- **済み (2026-11-04)**: 再取り込みで R2・本番の市区町村ランキング (全国・神奈川県) に補正値と「2023年」が出た。
- **note (2026-11-04)**: 公開中の記事の ZIP を `muni-manufacturing-shipment-data-v2.zip` へ差し替え、無料部分の川崎市の説明を直した。有料ラインも見出し「ダウンロード」の直前へ直した。所有者画面の添付は 1 件で、非ログインに ZIP 名は無い。見出しと添付の間に空行が数行残っている。
- **年の表記の棚卸し (2026-11-04)**: 有効な指標の R2 3,201 ファイルと yearFormat を照合した。暦年なのに「年度」は 369 指標 (412 ファイル。cities.json 47・values.json 365)、公開中の市区町村ランキングは 44 指標。原因は 2026-10-21 の yearFormat の修正 (`a21c4586a`・`5e72aa59a`) のあと再取り込みが無いこと。年度の指標の不一致 21 件は「年度末」など説明つきの年名で誤りではない。
- **次**: ① 2026-11-05 12:00 JST の月次の全取り込みの成否を見て、e-Stat の 312 ファイルが 0 件になったか同じ照合で確かめる。残れば 50 件以下ずつ取り込み直す。external の 100 ファイルは月次の `relabelPublishedYearNames` が直す。main へ入ってから動く ② 1987 年の行を CI の e-Stat 照会で確かめる ③ 必要なら e-Stat へ問い合わせる ④ develop の変更を main へ入れる。
- **補足**: この Mac の gdal は `libjxl.0.11.dylib` が無く ogrinfo が起動しない (brew の再リンクが要る)。
- **停止条件・禁止**: 補正の定義の外で値を手で直さない。購入者がいる ZIP の差し替えは note への外部変更なので事前に確認する。
- **完了条件**: 川崎市と空欄の原因が記録され、年の表記と注記がサイトと商品で一致している。

### [AD-LAYOUT-WEEKLY-CAPTURE-01] 広告の配置の撮影を土曜ランナーへ組み込み、本番の配置を週 1 回記録する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:アフィリエイト]

- **済み (2026-11-14・3390b94f2)**: 撮影 (`.claude/scripts/ads/capture-ad-layout.ts`) は、手元の開発サーバー以外を `--base-url` に指定すると、AdSense・GA4・アフィリエイトの host への要求を `context.route` でブラウザから出る前に必ず中断する (`.claude/scripts/ads/lib/ad-traffic-block.mjs`。)
- **残り (判断)**: 撮影を毎晩ではなく週 1 回、土曜ランナー (`scripts/scheduled/weekly-saturday.sh`) の段として本番 (`https://stats47.jp`) を撮る方向でよいかをオーナーが確定する。選択肢は (a) 土曜ランナーで本番を撮る、(b) Mac で開発サーバーを立てて撮る、の 2 つ。推奨は (a)。配置が変わるのはコードを変えたときだけで土曜の週次レビューで見れば間に合い、開発サーバーが要らず、デプロイ後の実際の姿を確かめられるため。通信を止めると本番の枠の高さが潰れて枠を検出できないと分かった場合は (b) へ戻す。
- **残り**:
  1. 本番で 1 ページ・1 幅だけ撮る (`npx tsx .claude/scripts/ads/capture-ad-layout.ts --base-url https://stats47.jp --pages ranking --widths 390`)。最後の 1 行が「通った 0 件」であること、「一覧に無い外部の host」に広告・計測の host が無いこと (あれば `ad-traffic-block.mjs` の `AD_TRAFFIC_HOST_RULES` に足す)、`ins.adsbygoogle` の枠とユニットが開発サーバーの撮影と同じように取れることを確かめる。
  2. 全 63 枚を本番で 1 回撮り、管理画面 `/affiliate/layout` の警告を読む。開発サーバーとの差が出たら原因を分ける。
  3. `weekly-saturday.sh` に段を足す (冒頭のコメントの段の説明も直す)。撮影は専用 clone ではなく作業フォルダの `.local/ad-layout/` へ書く。古い撮影は直近 8 回だけ残して消す。落ちた回は既存の `failed` の仕組みで週次レビューの Phase 0b に出す。
  4. 週次レビュー (`.claude/skills/management/weekly-review/SKILL.md`) の確認の表に「広告の配置」を足し、警告の件数と `adTraffic` の通った件数を読むようにする。`docs/01_技術設計/06_自動化インベントリ.md` を更新する。
- **停止条件・禁止**: 撮影のために本番へデプロイしない。launchd の plist は変えない (既存の土曜の 1 本の段として足す)。本番の撮影で「通った」が 1 件でも出たら本番の撮影をやめ、Mac で開発サーバーを立てて撮る案へ戻してオーナーに聞く。
- **完了条件**: 土曜ランナーが 1 回本番を撮り切り、管理画面に新しい日付の 63 枚が出て、撮影のログと manifest の `adTraffic` で広告・計測の通信が通った件数 0 を示せ、週次レビューの手順に確認が入っている。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a) 土曜ランナーで本番を撮る を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: 残りの 1 (本番で 1 ページ・1 幅だけ撮って通信が通らないことを確かめる) から始める

### [BLOG-FIGURE-REDRAW-REGRESSION-01] ブログの図の一括の描き直しで出た型の不具合 (出典欄が空・題の右端が切れる・年度が「年」) をサイト側で直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:データ]

- **済み (2026-11-14・7c7f8d7a8)**: 描き直しの型 (棒・タイル地図・実際の形の地図) が、出典名を data JSON、source.json の調査名、指標の定義の source.displayName の順で入れ、どこにも無ければ出典の行を出さない。
- **残り**: (1) `gh workflow run regenerate-blog-svgs.yml` を dry_run=true で回してギャラリーを確かめ、dry_run=false で公開中の全記事の図を描き直す (R2 への書き込みなのでオーナーの指示が要る)。(2) 描き直すと副題が「年度」に変わり、`data/products/kindle/figure-corrections.json` の置換元が消えて本の生成が止まるので、同じ PR で年度と題の校訂の行と `fixFigureTemplate` を外す。(3) git の `contents/blog` に残る古い図 (54 記事 216 枚で題が枠を越える) を `generate-article-charts.ts --slug <slug>` で描き直すか、公開済みの送り箱として片付ける。(4) manufacturing-aichi-dominance の shipment-per-employee-ranking は data JSON の題を「従業者1人当たり製造品出荷額等」に直す (R2 の記事データ)。(5) 0 件を確かめた後、`lintImageTypeSvg` の 2 つの warning を error に上げる。
- **残り (追補・2026-11-14)**: 同じ描き直しで、公開 R2 にある旧版 (目盛りで読む形) のグループ棒の図 14 記事 66 枚 (`0e4a5a8a9` で型を変えた) と、県名の置き方を変えた散布図 (`8b3b3363d`。git 管理下の 16 記事 17 枚のうち 13 枚で県名の出方が変わり、目で確かめたのは 4 枚) も描き直す。暦年の指標で data JSON の副題が「年度」の図は、描き直すと「年」に変わるので、yearFormat が疑わしい指標 (Kindle の台帳が挙げる警察庁の犯罪統計など) は描き直しの前に定義を確かめる。
- **完了条件**: `node .claude/scripts/blog/audit-chart-quality.mjs` (R2 を取り込んだ `.local/r2/app/blog` と `--base contents/blog` の両方) で「出典の行に出典名が無い」0 件・「題が枠の右端を越える」0 件。年度の指標 (per-capita-income-gap の income-map と income-ranking、fiscal-health-50years-trend の fiscal-map) の公開中の図の副題が「年度」。Kindle の対応する校訂が台帳から消え、本の生成が通る。

### [NOTE-TO-KINDLE-GUIDE-01] note の記事から同じテーマの Kindle 本へ 1 行の案内を置き、UTM と販売台帳で 6 週測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:商品] [待ち:ログイン]

- **起点 (2026-11-03 オーナー)**: KDP を書くことでブログを磨き、note へ展開し、note の閲覧から KDP へ送る循環を作りたい。S1 12 冊の改訂版は 2026-11-03 に申請済み (KDP の審査中)。
- **現状 (2026-11-04 確認)**: `data/note` に Amazon への導線は 0 件。note の本文リンクは有料 note とサイトへ向いている。サイトの `/products` のカードは旧商品カード扱いで、ここを経由させない。note の閲覧の多い記事は財政 (`s47-fiscal`) と KML 記事。
- **やること**: ① note 記事と S1 の本をテーマで対応付ける表を作る (例: エンゲル係数・家計調査の記事 → K-S1-02 食卓、財政の記事 → K-S1-06 自治体財政)。閲覧の多い順に 5 本以内に絞る ② 本文の末尾に 1 行の案内 (書名と Amazon の URL。誇張なし・価格は書かない) を置く。URL は `config/inbound-utm.mjs` の規約に寄せ、Amazon 側で UTM が取れないことを前提に「note の記事 × ASIN」を note の外部リンクのクリック数 (note のダッシュボード) と KDP の販売台帳の月次で並べる ③ 対象記事と開始日を実験台帳に記録し、対象外の本を対照にする。
- **依存**: note の編集はログインが要るので人手 (`update-published-navigation.mjs --slug <key>`、全記事の一括変更はしない)。`PRODUCT-REFERRAL-MEASURE-01` の手順 3 (EXP-013 の UTM 反映) と同じ回に済ませる。KDP の改訂版が審査を通って販売中になってから始める。
- **停止条件・禁止**: アソシエイトリンクは `AMAZON-ASSOCIATE-PILOT-01` の判定まで使わない。6 週で販売が 0 なら「判定不能」と書き、案内を増やさない。
- **完了条件**: 対象記事 5 本以内に案内が入り、6 週の数字 (note の外部リンクのクリック・対象の本の販売と KENP、または判定不能とその理由) が実験台帳に記録された。

### [KINDLE-K-S1-02-RESEARCH-CYCLE-01] K-S1-02 (食卓) で、NotebookLM のディープリサーチの事実を一次資料で確かめ、ブログ→note→本の改訂を一巡させる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:商品]

- **起点 (2026-11-03 オーナー)**: ブログの書き直しだけでなく、ディープリサーチ・参考文献・データで本を厚くし、その過程でブログと note も磨く。最初の 1 冊は販売実績のある K-S1-02。
- **済み (2026-11-03)**: NotebookLM の notebook「stats47 research K-S1-02 食卓の地域差」(`.local/kindle-research/K-S1-02/nb.json`) にディープリサーチで 20 件を取り込み、品目ごとの地域差と要因を聞いた (`ask1.json`)。
- **注意**: 回答の主な出典「家計調査における品目別消費動向と地域差：食文化・社会構造・地理的要因に関する総合研究」は著者・掲載誌が不明で、AI 生成の記事の可能性がある。出典の残りも転載サイト・報道が中心。**回答をそのまま本・ブログに使わない**。
- **やること**: ① 回答から数値と要因の主張を 1 行ずつ抜き出す ② 数値は家計調査 (e-Stat の品目別・県庁所在市別の表、年と 2 人以上世帯を明記) で確かめ、要因の主張は自治体・業界団体・学術論文 (著者と掲載誌が分かるもの) が出典に付くものだけ残す。出典の取れない主張は捨てる ③ 残った事実で、対応するブログ記事に「なぜその地域で多いか」の段を足す (図の年と数値の年をそろえる) ④ 同じ内容を note の記事 1 本に展開する ⑤ 本は `build-book` で作り直し、差分レビュー・`verify-publishable` を通し、`kdp-publish --update` は再度オーナー承認を得てから。
- **完了条件**: 確かめた主張の一覧 (主張・一次資料・確かめた日・採否) が残り、ブログ・note・本の 3 か所に同じ事実が同じ出典で入った。改訂版の差分レビューが PASS。
- **移した残り (2026-11-24・旧 PRODUCT-SALES-READINESS-01)**: S1-02 は食品の支出・購入数量と調査対象都市を元記事の本文・図まで照合する。次の冊で直す箇所: 03 高齢単身の分母・通勤流入と移住、04 介護必要数と不足数・化学工業と医薬品・相談窓口の時間、05 大学収容力と入学定員・保育利用率と希望充足率、06 財政指標の控除/平均期間・目的別と性質別、07 宿泊施設範囲/人泊と人数・国籍から嗜好の断定、08 供給契約と世帯普及率、09 産業出荷/利益/用水効率、10 火災地震合算/強度率の労働時間分母、11 行動者率/稼働率、12 有業者/雇用者。部分校訂だけで章全体を合格にしない。

### [UNIT-VOCAB-LARGE-UNPARSED-01] 単位の正典が読めない単位で 6 桁以上の 13 指標を、語彙に足すか単位を直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-03] [領域:データ] [待ち:判断]

- **済み (2026-11-14・`5b9598319`)**: 台帳の summary.unparsedLarge は 13 件から 7 件に減り、TJ・万MJ・総トンの 6 指標が rescaled (万TJ・億MJ・万総トン) になった。
- **残り (判断)**: 分母つきの 7 指標 (kg/日 の cod-pollution-load・ss-pollution-load、m³/日 の industrial-water-usage・water-supply-capacity、円/m² の住宅地 2 指標、人/日 の railway-passengers) は `unparsedLarge` に残した。分子だけ寄せるには、規約 2.6 の「分母つきは寄せない」(2026-11-03 オーナー指示) を「日あたり・面積あたりは分子を寄せる」に変え、`parseUnit` に「量/量」の形を足す必要がある。
- **実行役の見立て**: 人口を分母にした率と違い、日あたり・m² あたりは分子に万を付けても意味が変わらない (3,638万人/日、42.0万円/m²) ので寄せてよい。kg/日 は「20.6万kg/日」になり読みにくいので、寄せるならトン/日へ直す。
- **完了条件**: 判断が規約 2.6 に入り、`unparsedLarge` が 0 件か、残す理由が台帳にある。

### [THEME-R2-FETCH-FANOUT-01] 指標の多いテーマの読み込みで R2 の取得がときどき落ちる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:サイト]

- **済み (2026-11-14・ef33165c6)**: `loadThemeData` の R2 への取得を、定義・値・全国の系列を通して同時に 24 本までに絞り、失敗した定義と値を 1 回だけ取り直すようにした。
- **残り**: 本番 (Workers の R2 バインディング) のテーマページのログで、`readRankingItemFromR2: failed` と `readAllYearsRankingValuesFromR2: failed` が出ているかを確かめ、結果を記録する。Cloudflare のログを見るにはログインが要るので、週次の計測の記録か、オーナーが開いたログから読む。2026-11-03 の `fetch failed` は直す前のコードでも 2026-11-14 のローカルでは再現しなかった (単独 5 回、5 ページ同時 2 回とも 189 指標がそろった) ので、ローカルで再び起きたら、そのときの開発ログの失敗件数と、同時に開いていたページの数を記録する。
- **残り (性能の切り分け)**: 同じページの描画 1 回ごとに `app/japan/<metric>/series.json` 不在の警告が 131 件出る。5 ページを同時に開くと 1 ページあたり 42〜47 秒かかり、これは同時数の上限を入れた後も変わらなかった。R2 に無い全国の系列を取りに行かない方法 (全国の系列がある指標の一覧を先に引く、など) を決める。
- **残り (追補・2026-11-14)**: テーマ household-food-spending は描画 1 回ごとに `app/japan/<metric>/series.json` 不在の警告が 131 件出る (189 指標のうち 131 指標が R2 に無い全国の系列を毎回取りに行く)。5 ページを同時に開くと同時数の上限に関係なく 1 ページ 42〜47 秒かかるので、開発サーバーの遅さの主因は取得の同時数ではない。`loadThemeData` の説明コメントに「TopoJSON を並列取得」が残っていて、同じ関数の中のコメントと食い違う。
- **完了条件**: 本番のログで上の 2 種類の失敗の有無を確かめた結果を、このカードか improvement-log に日付つきで記録した。

### [R2-WRITE-PENDING-DISPLACE-01] R2 書き込みの待ち枠を後続の実行が奪い、新規ランキングの OGP 生成が始まる前に取り消される
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-02] [領域:データ]

- **証拠 (2026-11-02)**: develop への push で起動した `ranking-ogp-new-keys.yml` (run 41401652806) が、ジョブを 1 つも始めずに 15 秒で `cancelled` になった。 (参照: run 41406310986)
- **なぜ構造で直すか**: 取り消しは無言で、気づくのはデプロイ後スモークか本番の 404 になってから。手で再実行する運用では毎回同じ順に踏む。
- **次 (案)**: ① `r2-write` の workflow のうち、取りこぼすと困るもの (OGP の新規キー・ブログ公開) を、取り消されても後で拾う形にする。例: sync-snapshots の最後で「新規キーの OGP 欠落」を検査して足りない分を作る、または取り消し済みでジョブ未開始の r2-write run を一定間隔で再実行する見張りを置く ② main へのマージ前に、増えた既知キーの og:image が R2 にあるかを確かめる。
- **完了条件**: 待ち枠を奪われた OGP 生成が人手を介さず作り直され、デプロイ後スモークが新規キーの og:image で落ちない。

### [METRIC-DISPLAY-UNIT-WIRING-01] 指標の定義の表示単位 (display) を全画面で効かせる前に、71 指標の換算を監査する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-02] [領域:サイト]

- **済み (2026-11-14・2f232a070)**: 表示単位を決める入口を単位の正典に 1 つ置き (`resolveMetricDisplayScale`: 指標の定義が displayUnit を書いていれば定義、無ければ図の規則で、どちらか 1 つだけを掛ける)、ランキングのページ (都道府県・元の計算方法) の上位と下位・推移・地図のホバー・表・県の詳細と、ブログ本文のランキングカード (`/api/ranking-card`) が同じ単位・倍率・小数桁で出るようにした。
- **残り (R2 の作り直しが要る)**: 定義を直した 22 指標の item.json を作り直す (作り直すまで、入港船舶総トン数は小数 1 桁、年金総額は万円 9 桁で出る)。値を整形済みの文字で R2 に焼いている面 (ホームの注目カード、サイドバー、関連ランキング、カテゴリと調査の一覧の「1 位」) は、`generate-ranking-items.ts` の `deriveFeaturedTop` に `applyRankingValueDisplay` を通して値を表示単位で焼き、読む側 (`rankingTop1Label`・`RankingSidebarClient`・`RelatedRankingsGrid`・`FeaturedRankings`) の単位を同じリリースで表示単位へ切り替える。片方だけ先に出すと「637,958 万円」のように値と単位が食い違うので、R2 の作り直しと画面の切り替えを同時に行う。
- **残り (実装)**: テーマのページの地図と表の節 (`RankingVisualizationSection` に `valueDisplay` を渡す) と指標のタイル、title・seoTitle・seoDescription・FAQ・構造化データを表示単位で書く。seoTitle と seoDescription は指標の定義に実数を書いた文字列なので、`seo-meta-facts` の照合と合わせて作り直す。
- **残り (判断)**: ① CSV の値を表示単位へ直すか。推奨は元の単位のまま (ダウンロードは再利用が目的で、丸めると桁が落ちる。単位の列が元の単位を名乗るので値と単位は食い違わない)。② 型の画像 (`chartValueLabels`) が定義の表示単位を読むか。定義が図の規則と違う単位を選んだ 7 指標 (再エネ設備容量 4 指標の MW と 万kW、水道年間給水量の 百万m³ と 億m³、水道の施設能力と工業用水量の 万m³/日 と m³/日) で、ページと画像の単位が違う。推奨は型の画像も `resolveMetricDisplayScale` を読む (入口が 1 つになり、ブログの図の前後の画像で確かめる)。③ 市区町村の表示を換算するか。推奨は換算しない (都道府県向けの表示単位では小さい町村が 0 に丸まる)。④ 指標の定義の unit の文字列「ｍ3」14 件と「m3」6 件を 1 つに直すか。推奨は直さない (表示は `formatUnitForDisplay` で m³ にそろっており、文字列を直すと再取り込みが要る)。
- **完了条件**: 監査済みの表示単位が、ランキングの表・カード (注目・サイドバー・関連・一覧の 1 位)・title・テーマで同じ値と単位で出て、型の画像とも単位と小数桁が一致し、`check:display-units` と `validate:config` が誤った換算を止める。CSV と市区町村は上の判断の結果に従う。

### [NOTE-KAKEI-GYOZA-DRAFT-01] 家計調査の「餃子日本一は数え方で変わる」の note 原稿を台帳に登録し、カバーと本文の保存をそろえる
タグ: [SNS・マーケ] [種類:制作] [実行:別環境] [起票:2026-11-02] [領域:SNS]

- **状態 (2026-11-02)**: 切り口「定義を読む」「都市の間で比べる」から作った無料記事の原稿が作業場 `docs/31_note記事原稿/b-kakei-gyoza-52cities/` (draft.md・chart-data.json。gitignore) にある (Mac の作業場。会社の Windows PC には無いことを 2026-11-13 に確認)。agent が記事台帳 `data/note/articles.json` に下書きとして登録したが、カバーの台帳 (`note:assets:validate` の cover catalog coverage) と本文の R2 保存が無く検査が落ちたため、登録は取り消した。同じ題材の記事は 2026-09-06 に公開済みなので、別稿としての差 (52 市・3 年平均・冷凍とテイクアウトの範囲) を確かめてから進める。
- **次**: ① 既存の公開記事との重複を確かめる ② `npm run note:article` の手順で台帳登録・本文保存・カバー作成をそろえる ③ note-critic の審査。
- **完了条件**: 台帳・カバー・本文の保存がそろい、`npm run note:assets:validate` が通る。公開はオーナーの承認後。

### [KINDLE-K-S1-02-STATUS-DRIFT-01] Kindle の K-S1-02 で、カタログの元定義と状態ファイルの状態・章数が食い違う
タグ: [収益化] [種類:不具合] [実行:sweep] [検証:npm run products:kindle:validate --workspace packages/product-factory] [起票:2026-11-02] [領域:商品]

- **証拠 (2026-11-02、kindle の agent の報告)**: `data/products/kindle-status.json` は K-S1-02 を generated・8 章としているが、`packages/product-factory/src/channels/kindle/book-catalog.ts` の元定義は planned・5 章。
- **次**: 元定義の状態と章を実際に合わせるか、上書きの仕組みを元定義に寄せる。`BookChapter` に切り口 ID の欄を足し、切り口台帳と検査でつなぐ。
- **完了条件**: 元定義と状態ファイルが一致し、章ごとの切り口 ID が型付きで検査される。

### [BLOG-DATA-PRIOR-YEAR-KEEP-01] ブログの data JSON に前年までの値を残し、年の推移を書き直しのたびに失わないようにする
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:サイト]

- **症状 (2026-11-02)**: `refresh-article-data-years.mjs --apply` は図の data JSON を最新年の値で上書きし、前年の値を残さない。家計調査の記事を 2025 年へ書き直したとき、「2024 年は何位だったか」を本文に書くには、e-Stat から別の接地器 (`fetch-kakei-city-average.mjs` の byYear や、小麦粉の順位推移の JSON) を個別に作る必要があった。
- **次**: 取り直しのとき旧年の値を同じ basename の `*-history.json` (or data JSON の `previousYears`) に移す案と、R2 の metric 値 (全年を持つ) から推移を作る接地器を共通化する案を比べ、後者で済むなら前者は作らない。
- **完了条件**: 書き直しで年を進めた記事が、追加の手作業なしに前年との比較の図か値を持てる。

### [BUZZ-MAP-CONTENT-ROLLOUT-01] バズ地図の候補160件がブログ・note・SNSにほとんど展開されていない
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:SNS] [待ち:判断]

- **実測 (2026-11-02)**: `data/sns/buzz-map-catalog.json` の curated 160 件のうち、着地先が実在するのは15件（ブログ7・ランキング2・テーマ4ほか）。
- **① 台帳の作り直し (2026-11-02 済)**: `generatedAt` 2026-11-02。curated 160件の着地先は live 15件のままで、変化は気候4件 (blocked→needs-content) だけ。型 A〜F・flow は型台帳の「地図（実際の形）」に統合済み (`buzz-map-standards.md` §1)。
- **② 候補 (2026-11-02 選定・オーナー判断待ち)**: P0・`feasibility=now`・ライセンス allowed・記事なしから2本。
  - ブログ: `children-more-than-elderly-muni`「15歳未満が65歳以上より多い街」。R2 `cities.json` で実測すると該当自治体は 1980年1,776 → 2000年375 → 2010年45 → 2015年14 → 2020年6（長久手市・新宮町・粕屋町・南風原町・御蔵島村・小笠原村）→ 2025年0。二値1枚ではなく年ごとの地図（型B=塗りの時系列）で「消えるまで」を見せる構成にする。**2025年値は別表 `0004065933` の補完なので、定義の連続性を確かめるまで「0になった」と書かない。**
  - note: 食の東西境界（`natto-east-west-boundary`・`udon-soba-territory`・`mayonnaise-vs-sauce`・`meat-preference-map`）の4枚を1記事に。家計調査は県庁所在市の値（都道府県単位の `values.json` のみ、市区町村データなし）。
- **次・実行順**: ③オーナーが2本の採否を決める → ブログは2025年値の定義確認 → 地図生成 → 記事、note は4枚の地図 → 記事 ④下書き11件の投稿可否を決める（予約・投稿は承認後）。
- **停止条件**: ライセンス `review-required` の候補（26件）は確認前に公開しない。投稿・公開・R2 反映はオーナー承認後。
- **完了条件**: 候補台帳が最新の公開物で判定し直され、P0 候補のうち少なくとも1件がブログまたは note の記事として公開され、その地図画像が SNS に投稿されている。

### [IMAGE-PUBLISHER-REMOVAL-01] 統計画像の生成経路から発行元表記（stats47・stats47.jp）を外し、地図をタイル・実形状の2型へ寄せる
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:SNS]

- **済み (2026-11-02・2026-11-10)**: ランキングカード (`all47-svg.ts`)、増減タイル、タイル地図の共通化、バズマップの描画器と spec 生成から発行元を外し、`all47-svg.test.ts` と `tile-change.test.ts` が `assertMinimalChartCopy` を掛けている。
- **済み (2026-11-14・a6334be28)**: X の編集カード (`.claude/scripts/sns/lib/ranking-story-card.ts` の 3 レイアウト) と IG シリーズ共通のフッター (`ig-series/IgSeriesFooter.tsx`。)
- **残り (実装)**: `apps/remotion/src/features/data-cards/DataCard.tsx` の 4 か所 (ヘッダーの「stats47」と、家計レシート・県の図鑑・IG スライドのフッターの「stats47.jp」) を外し、`render-data-card.ts` が作る household-receipt・area-atlas・rank-routes の出力に `assertMinimalChartCopy` 相当の検査を掛ける。変更の前後の画像を保存して目で確かめる。
- **残り (実装・カードの一覧に無かった経路)**: `ranking-instagram/CoverSlide.tsx`、`shared/components/maps/{ChoroplethMapStill,TileGridMapScene}.tsx`、`shared/components/tables/{RankingTable,RankingTableSlide}.tsx`、`area-profile-instagram`、`compare-instagram`、`geo-x/GeoInsightCard.tsx`、`ranking-youtube/ThumbHookMap.tsx` に `SITE.domain` の描画が残る。今も使う経路 (X の tile-map・Geo の画像・IG のランキングカルーセル) から順に外し、過去画像の再現だけに使う旧コンポジションは対象外と決めて記録する。`BarChartRaceScene.tsx` と `NormalOutro.tsx` は描画結果を見て発行元の有無を確かめる。
- **残り (判断)**: (1) 予約中の IG カルーセル素材を再レンダーして R2 を差し替えるか。推奨は差し替える。根拠は、予約の本文・日時・ID を変えずに画像だけを替えられ、決定後に出る投稿へ発行元入りの画像が出続けるのを止められること。(2) 旧画像で予約済みの X 12 件を差し替えるか。X の予約操作が要るのでオーナーの判断を待つ。(3) YouTube のアウトロ (`NormalOutro.tsx`) は統計画像ではないので発行元を残すか。推奨は残す。(4) 地図カルーセルで塗り分けと上位・下位の 2 枚がタイル地図で重なる点を統合するか。
- **停止条件**: 予約中投稿の差し替えで本文・日時・ID が変わる場合と、公開済み投稿の素材を上書きする場合は止める。
- **完了条件**: 今も使う生成経路の可視テキストに発行元が無く、各経路の出力に `assertMinimalChartCopy` 相当の検査が掛かり、予約中の素材の扱いが決まって記録されている。

### [REMOTION-RSPACK-WIN-01] Windows で Remotion の描画が rspack のネイティブ部品欠落で起動しない
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [起票:2026-11-02] [領域:SNS]

- **証拠 (2026-11-02)**: `npx remotion still` が `@rspack/binding` の `requireNative` で `MODULE_NOT_FOUND`。
- **次**: 親と同版の lock metadata（resolved・integrity・cpu/os）を足して `npm install` し、`npx remotion still src/index.ts RankingInstagram-Cover` が通ることを確かめる。依存の変更は他の作業と排他（`local-environment.md`「検証コマンドの粒度」）。
- **完了条件**: この PC で Remotion の静止画が描け、Mac の lock 再生成で項目が消えないことを確認した。

### [XLSX-FURIGANA-INGEST-01] ingest-nier-achievement.ts の xlsx 読み取りが、共有文字列のふりがなを本文に混ぜる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-01] [領域:データ]

- **済み (2026-11-13・`2c28508cd`)**: `ingest-nier-achievement.ts` の独自の xlsx 読み取りを消し、`lib/read-xlsx-sheet.ts` の `readXlsxSheet` に差し替えた。
- **残り (NIER の xlsx 94 個の取得が要る)**: `npx tsx packages/data-configs/scripts/ingest-nier-achievement.ts --year 25 --dry-run` の出力を、差し替え前のコミットと比べる。コード上、この取り込みが読むのは「全体」の見出しと数値セルだけで市区町村名は読まないが、実データでの差は未実測。
- **完了条件**: 新旧の出力の差が 0 件か、差の理由が記録されている。

### [DATA-QUALITY-LOOP-01] 全指標のデータ品質を機械チェックし、「誤り・古さ・終了・薄さ」の 4 基準で継続的に直すループを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ]

- **判断基準 (上から最初に当てはまる処置)**:
  1. 値・単位・年表記が誤っている → すぐ直す
  2. 公式にもっと新しい年が公表されている → 更新する。GSC 表示の多い順
  3. 調査が終了し新しい年が無い → 公開を続け、ページに「○年で調査終了」を明示する。後継統計があれば差し替える
  4. 観測 1〜2 年かつ需要ほぼ 0 → noindex 候補
  - 「古い」の目安は「最新年が公式の最新公表から公表周期 1 回分以上遅れている」。需要は順番を決めるためだけに使う (4 を除く)。
- **仕組み**: 週次の監査がキュー `data/data-quality/checks/queue.json` (要約 `LATEST.md`) を作る。周期は配信年からの推定なので、「更新」には推定周期による誤検出が混ざる (患者調査 3 年・漁業センサス 5 年など)。処置の前に公式の最新公表 (各省の公表ページか SSDS の掲載年次一覧 `kiso_ken.xlsx`) で確かめる。年カバレッジ監査の要拡張候補は `YEAR-COV-*` カードとして自動起票される (`CYCLE-HEALTH-01` ②)。`ESTAT-CATALOG-REVIEW-01` (取り込めていない・更新が止まっている統計の確認) は 2026-10-26 にこのカードへ統合した。
- **処置済み・切り出し済み (2026-10-27 まで)**: 需要順に約 15 指標を処置した (years の拡張・表の切り替えは data-refresh で R2 反映済み)。今の取得の仕組みで足せないものは `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01`・`DATA-MEDICAL-FACILITY-SOURCE-01`・`DATA-FLOOD-STATS-FILES-01`・`FISHERY-2024-DB-01`・`DATA-ROAD-LENGTH-SOURCE-01` へ切り出した。手動投入の書き手 (`.claude/scripts/data/lib/stats-values-writer.mjs`) は recipe を焼くように直し、`recipe.unbaked` 21 件は 2026-10-19 に再投入済み。
- **次**:
  ① 週 5 指標ずつ、キューの「2 更新」を需要の多い順に処置する (処置済みの指標を除く)。R2 反映はオーナー承認後に data-refresh (dryRun で合格してから dryRun: false)。
  ② 週次の `ranking-integrity-audit` でデータ品質ゲート 100% (`recipe.unbaked` 0) を確かめる。
  ③ `low-elevation-population-ratio-5m` の書き手 `packages/gis/src/geo-analysis/low-elevation-population-overlay.py` が `meta.recipe` を書かない (作り直すと未焼きに戻る)。書き手を変えると manifest の `definitionSha256` が合わず `npm run geo:audit-low-elevation` が止まる (`audit-geo-analysis-artifacts.ts:470`) ので、単独では直さず、次に低標高の Geo を再生成するとき (G04-a の ZIP 176 件と 1km メッシュ人口が要る) に同じ作業で直す。直し方は `node --import tsx .claude/scripts/data/lib/print-metric-recipe.ts low-elevation-population-ratio-5m` の出力を `meta.recipe` に入れ、`audit` で recipe の有無も検査する。
- **完了条件**: 週次の監査が全指標の古さ・表記を検出してキューへ積み、キューの処置状況が管理画面か週次レビューで見え、4 週続けて「新規検出 ≤ 処置件数」で残件が減っている。
- **統合 (2026-11-22 棚卸し): `RANKING-AI-CONTENT-REWRITE-01`** ランキングの AI 解説を読み直し、薄い・古い・誤りのあるものから書き直す。対象の選び方はこのカードの 4 基準に合わせる。
- **棚卸し (2026-11-22)**: `LATEST.md` は 11-14 のまま。11-21 の土曜の監査は最後まで走ったが、`data/ranking/integrity-audit.json` が 1,095,155 バイトで 1 MiB の上限を超え、記録のコミットごと止まった (W47 の監査記録は 1 件も残っていない)。書き出しを詰める修正を入れた (develop。11-14 の版で 913KB から 619KB)。11-28 の土曜で記録が残ることを確かめてから、4 週分の件数の推移を並べる。

### [AUTH-CREDENTIAL-REGISTER-01] 残りの資格情報 (Mac 全サービス) を登録する
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-10-01] [領域:管理] [待ち:ログイン]

- **残り (オーナーのみ・パスワードは対話入力)**:
  1. **再認証**: `auth_required` で止まっている取得元 (2026-W42 時点で gsc・kdp、10-19 にもしも) を `node .claude/scripts/measurement/refresh-session.mjs <source> --headed` で入れ直す。検証は `npm run measurement:status -- --check` と次の `data/measurement-cycle/latest.json` の kdp・gsc の freshness が pass であること。
  2. **パスワード経路の実証**: A8・もしも・楽天のパスワードでの自動ログインは未実証。セッション切れ時に `refresh-session.mjs <source> --headed` で確かめる。KDP は本棚が有効でも Reports 認証で止まることがあり、`latest.json` の `relogin` が `human_required` / `login_failed` なら人の再認証か Mac 側収集を検討する。
- **完了条件**: Mac と Windows の両方で `/ops/auth` の「この PC」が全行「済」、CI 欄が「済」か「保管」。その後の authenticated-measurement で note・KDP の状態ファイルの `relogin` が `session_valid` か `relogged` になる (CI での再ログインは未実証)。
- **追補 (2026-11-14・セッションの事前確認の初回の結果)**: Google の専用プロファイルに認証 cookie (SID / __Secure-1PSID) が無く「切れている」と出た (11-08 の GSC の取得は成功しているので、ログアウトかプロファイルの構造の違いかを次の週次の取得の前に確かめる)。`note.autologin-failed` の失敗印が残っている (訂正 2026-11-15: これは古い印ではない。11-08 に成功したのは閲覧数だけで、売上は 10-22 17:31 のパスワード再確認の失敗から止まっている。`data/authenticated/revenue-history.json` の note 行は 09-30 と 10-17 の 2 件だけで、11-07・11-08・11-14 の取得は `revenueStatus: "verification_required"`。印がある間は `refresh-session.mjs` が再確認を飛ばすので、売上 API が答えない。オーナーの手順: ① `.local/authenticated-measurement/note-login-login_failed.png` で止まった画面を確かめる ② `.local/authenticated-measurement/note.autologin-failed` を消す ③ `node .claude/scripts/measurement/refresh-session.mjs note --wait-human` でパスワードを入れ直す。画面の文言が変わっていたら同スクリプトのセレクタを直す。止まっているのは認証付き計測の売上 API の経路だけで、note ダッシュボードの記事別の売上列 (`data/note/dashboard/latest.json` の `salesJpy`) は別経路で取れている (2026-09-11 取得の全期間の記録が 3 記事 ¥900 を出しているので列は機能しており、10-11〜11-07 と 10-17〜11-13 の 28 日の記録はどちらも合計 ¥0)。記事別の販売の判定はダッシュボードの記録で読める。週次収益 (NSM) の note 分はこの経路が戻るまで判定不能のまま)。楽天は SSO の認証 cookie を実機で確かめるまで期限を判定できない。日次の確認は launchd の登録がまだで、登録はオーナーが `cp scripts/scheduled/com.stats47.session-preflight.plist ~/Library/LaunchAgents/` と `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.stats47.session-preflight.plist` を打つ。
- **仕組みの是正 (2026-11-16)**:
  - **note**: 10-22 の失敗は、パスワードの誤りではなく読み込み中の画面を判定したもの、と見ている (失敗時のスクショは読み込み中の点 3 つだけで、`pageSignals` は画面を読めないと `hasPassword: true` に倒していた)。`refresh-session.mjs` を、パスワード欄か本文が出るまで最大 30 秒待ってから判定するように直した。読めないときは `undetermined` として印を書かず、2 回続いたときだけ印を書く (パスワードの送信は 1 回の実行で 1 回のまま)。画面が通って見えても、売上 API が `user_verification_needed` を返せば `login_failed` にする。テストは `refresh-session.test.mjs` に 5 件足し、直す前に落ちることを確かめた。
  - **GSC**: Google のログインは自動化しない (2 段階認証は残す)。土曜の `weekly:collect` の最初に `cli.mjs login --if-expired --wait` を足した。認証 cookie が切れていれば、専用プロファイルの Chrome を開いて通知し、人がログインして閉じるのを最大 10 分待つ。cookie は名前と期限だけを読む。
  - **事前通知**: `com.stats47.session-preflight` を launchd に登録した (毎日 9 時。切れている・期限が近い・失敗印ありを通知する)。11-16 19:57 の初回の実行で、GSC が「切れている」と出た。
  - **オーナーの操作 (残り)**: ① GSC: 11-16 19:56 に開いた専用プロファイルの Chrome でログインして閉じる (開いていなければ `cd ~/stats47 && node .claude/scripts/google-admin/cli.mjs login --wait`) ② note: `cd ~/stats47 && node .claude/scripts/measurement/refresh-session.mjs note --wait-human` を 1 回 (印が消え、次からはキーチェーンで自動)。
  - **[仮説]** GSC が 11-11 11:56 以降ログアウト状態なのは、同じ日のカバレッジの取り出しの操作か、Google 側の失効による。検証: 入り直したあと、`.local/session-preflight/latest.json` の gsc が「切れている」に変わる日を特定する。期日 2026-11-28。特定の操作と重なればその操作を直し、重ならなければ金曜に入り直す運用にする。
  - 11-21 の `weekly:collect` で、note の `revenueStatus` が `verification_required` でないこと、GSC が pass になることを確かめる (未確認)。
- **棚卸し (2026-11-22)**: 11-21 の土曜の計測でも、KDP は「Reports の再ログインが通らなかった」、note は `login_failed` (売上管理の画面) で止まった。A8 と楽天は通った。

### [NAV-CLICK-COVERAGE-01] サイト内リンクのクリックを既定で全件計測し、名前の無い導線を週次で減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [期日:2026-11-28] [領域:管理]

- **済み**: Geo の導線名 (a95fbbdbd) は 11-22 のリリース (#1296) で本番に出た (本番の `/geo` に `geo_analysis_list` 8 本を確認)。11-23 に本番 10 ページへ合成クリックを送って実際の `unlabeled` を数え、多い 6 部品に名前を付けた (develop・未デプロイ。値と実測は `analytics-event-standards.md` の 2026-11-23 の節)。localhost で東京都のページの名前の無いリンクは 80 → 11 本。
- **残り (観測・期日 2026-12-05)**: 11-22 のデプロイから 2 週後の土曜の週次計測で、`nav-click-surfaces.csv` の `unlabeled` × `geo` (2026-W44 は 1,959 件) を読む。拡大・縮小の見立ては仮説で、検証コマンドと判定基準は `analytics-event-standards.md` にある。11-23 の 6 部品は次のリリースから効くので、`unlabeled` × `ranking`・`areas` の比較はそのデプロイ日を境に読む。
- **残り (実装)**: ① 1 ページに 1〜6 本残る `unlabeled` (カードの見出しの「すべて見る」・`/municipalities` のテーマのカード・ブログの体験記と運営者のカード)。測り方は本番で全リンクに合成クリックを送り、送られた `nav_surface` を数える (DOM を数えるだけでは手動計測の部品を `unlabeled` と誤って数える)。② **P3**: `page-quality` の全 URL 静的解析に「名前の無いサイト内リンク数」「計測担当の無い広告リンク数」を足し、テンプレート別に縮小専用の基準線を置いて、違反を `UI-FIX-*` の起票に流す。描画後に出るリンクは代表 URL のブラウザ検査で数える。**衝突注意**: `UI-CHART-TEXT-LOOP-01` (ブランチ `wip/ui-chart-text-loop-01`) と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も同じファイル群 (`.claude/scripts/page-quality/lib/ui-report.ts` の `UI_METRIC_KEYS`・`types.ts`・`page-quality-budgets.json`・`measure-static.ts`) に指標を足すので、並行して実装せず、後から入る側が先行分を取り込んでから足す。
- **停止条件・禁止**: クリックを止める処理 (`preventDefault` / `stopPropagation`) を入れない。見た目・マークアップ構造・クラスを変えない。タブ切替・スクロール等の画面内操作とアフィリエイトの表示回数計測は対象外。
- **完了条件**: ② 本番デプロイ後の週次 page-quality に新指標が出て、違反を 1 件注入すると検知されることを確認済み。③ 週次の計測サイクル出力に被覆率と `unlabeled` 上位が出ていることを確認済み。④ デプロイ後 2 週の計測で `unlabeled` の割合を読み、次に名前を付ける部品を決めている。

### [AFF-AFB-REJECTED-STATUS-01] afb の「提携却下」を台帳に取り込み、もしも・afb の提携済み 115 件を条件確認から在庫まで進める
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-31] [領域:アフィリエイト] [待ち:ログイン]

- **起点 (2026-10-31 オーナー指示「提携できるものは全て提携　利用できるものは全て利用」)**: afb の未提携 32 件は申請ボタンが無く、確かめた 14108・16418 は「提携却下」(画面上部の件数は 却下 41)。`affiliate-status.mjs` は提携中 (`rel=rel`)・申請中 (`rel=1`) しか読まないので台帳 `affiliate-catalog.json` では `none` のまま残り、`affiliate-apply.mjs` の afb 経路も誤った理由を出す。
- **次**: ① afb の却下の一覧 (画面上部の「却下」のリンク先) を `affiliate-status.mjs` で読み、台帳の語彙に `rejected` を足して取り込む。申請スクリプトの理由文を「申請ボタン無し (却下・解除・申請済みのいずれか)」に直す ② もしも 3 件 (6548・5905・6970) はサイト ID の読み戻しで止まった。詳細ページを見て終了か確かめる ③ もしも・afb の提携済み 119 件のうち在庫に載るのは 4 件だけ。`moshimo-inspect-offer.mjs` で成果条件を確かめ、掲載適格性 (10-31 に書いた `terms-unverified` を外す) → `moshimo-harvest.mjs` / `afb-harvest.mjs` → 台帳 `affiliate.ads` へ登録する。
- **停止条件**: 保険の見積もり・相談を出さない判断 (2026-10-27 オーナー判断。収益化戦略 §3.2) を優先する。10-31 に A8 で申請した保険の 4 件 (保険クリニック・保険見直しラボ・保険コンパス・マネカフェ) は承認されても在庫に登録しない。afb のログインは毎回オーナーが要る。
- **完了条件**: 台帳の afb の `none` が実機の未提携だけになり (却下は `rejected`)、もしも・afb の提携済みのうち規約に合う案件が 台帳 `affiliate.ads` に登録されている。

### [AFF-SCOUT-OFFER-PROFILE-01] ASP の週次巡回が、案件の条件の記録が無い 5 件で 4 週続けて止まっている
タグ: [収益化] [種類:不具合] [実行:対話] [検証:bash scripts/scheduled/scout-asp-weekly.sh] [起票:2026-11-22] [領域:アフィリエイト]

- **事象**: 週次の `scout-asp-weekly` の `append-dry-run` が、登録前の確認で「案件の台帳 `affiliate.offer-profiles` に条件の記録が無い」案件 5 件 (a8:s00000012115011・s00000017743001・s00000027749001・s00000026856001・s00000019508001) で失敗する。最後に通ったのは 2026-10-24 (`~/Library/Logs/stats47/scout-asp-weekly.log`)。
- **次**: 5 件の成果条件・負担・lane を A8 の案件の画面 (記録済みの収集物) で確かめて `affiliate.offer-profiles` に書くか、登録しない案件なら `selectedForRegister` から外す。担当は affiliate-manager。
- **完了条件**: 次の土曜の `scout-asp-weekly` が `append-dry-run=ok` で通る。

### [AFF-PLACEMENT-MAP-SIZE-01] 配置マップ (placement-map-latest.json) を 1MB 以下に分け、週次の更新を戻す
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-31] [領域:アフィリエイト] [待ち:判断]

- **済み (2026-11-13・`0add28e1b`)**: 肥大の原因はページ別明細 `pages` (6,000 ページ超 × 適格広告の一覧で約 6.7MB) だった。
- **分かったこと**: 週次 workflow `affiliate-dashboard-refresh.yml` は `contents: read` で、生成物を artifact に上げるだけで git へ書き戻さない。git の記録は、もともと週次では更新されない。
- **決めること (オーナー)**: git の `placement-map-latest.json` を週次で自動更新するか (workflow に書き戻しを許す)、手元で生成してコミットする運用にするか、読み手を artifact か R2 に向けるか。
- **完了条件**: 決めた方法で `placement-map-latest.json` が 1MB 以下のまま更新され、`generatedAt` が 8 日以内。

### [MUNI-DATA-DEDUP-01] 製造品出荷額の 2 指標 (manufacturing-shipment と -amount) が R2 で同じ値になっている件を正す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-01] [領域:データ] [待ち:判断]

- **済み (2026-11-14・調査のみ・コミット無し)**: 原因は、`manufacturing-shipment` (表 0000020203、entities は city のみ) と `manufacturing-shipment-amount` (表 0000010103、entities は prefecture と city) の市区町村値が、`prefToCityStatsDataId` により同じ市区町村表 0000020203 の C3401 から取られていたことである。 (参照: 67dee6384)
- **残り**: ① オーナーが重複の解消方針を決める。案は、市区町村だけの重複指標を止めて amount 側へ寄せる (今回の manufacturing-shipment を含む。同じ形の組が他に 8 組あり、`.claude/scripts` の重複検出を `pref→city` 変換後の取得元で回すと出る: crime-rate-per-1k、foreign-population-per-100k、general-hospital-per-100k、per-taxpayer-income、population-density-habitable、retail-store-count-alt、retail-stores-per、traffic-accident-per-100k)。② 市区町村 ranking の旧 key を現行 key へ 301 で送る仕組みを作る。/municipalities/ranking/ の分岐は未登録の key を 410 にするだけで、RANKING_SLUG_REDIRECTS は /ranking/ 側でしか使われない。③ 止める指標の isActive を false にし、known-ranking-keys・sitemap・content pages・linkage などの生成物を再生成して、制約の下限を縮める。④ オーナーの承認後に R2 の cities.json を再生成し、旧 key のオブジェクトを片付ける。
- **残り (追補・2026-11-14)**: 重複を理由に市区町村の台帳 `data/municipalities/catalog/metric-availability.json` で unsupported にした 7 指標は `isActive: true` のままで、R2 に `app/stats/<key>/cities.json` (約 2.3MB) が残っている。`/ranking/population-density-habitable` は 410 を返すが、公開中の `/ranking/population-density-per-km2-inhabitable-area` への 301 が `data/site/url-history/ranking-redirects.json` に無い (2026 年 6〜9 月の GA4 週次で毎週 2〜23 回表示されていた)。台帳 `data/sns/buzz-map-curated-ideas.json` の habitable-population-density-muni は primaryUrl がその 410 の URL のままである。①の方針に、この 7 指標の無効化と 301 を含める。
- **完了条件**: 2 指標のうち一方が止まって旧 URL が現行 URL へ 301 で着地し、残る指標の設定の年の範囲と表記が R2 の配信値と一致する。重複が増えないことを確かめる検査がある。
- **済み (2026-11-16・オーナー判断「全部寄せる」・未デプロイ)**: 公開中の市区町村ランキング 730 件を、市区町村の取得元 (表 ID・項目) が同じ組で洗い出し、本番 R2 の `cities.json` の値で突き合わせた。
- **残り**: ① 本番デプロイで 301 が効いたことを `curl -sI https://stats47.jp/municipalities/ranking/manufacturing-shipment` で確かめる ② R2 に残る止めた指標の `app/stats/<key>/cities.json` を消すかは、R2 の正本の削除なのでオーナー判断 (害は無い)。

### [UI-FIX-OTHER-20261031] UI 是正: other の週次 UI 検査の指摘 10 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-OTHER-20261031.txt] [起票:2026-10-31] [領域:サイト]

- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-desktop-1440.png)。
- **対象**:
  - `machine|https://stats47.jp/japan|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/junior-high-school-count|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/manufacturing-shipment-amount/23000|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/per-taxpayer-income/13000|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/themes/aging-society|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/products/data-p-01|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/products|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/tag/population|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|other|title_changed` — title_changed: 60 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/municipalities/ranking/annual-sales-amount / https://stats47.jp/municipalities/ranking/annual-sales-amount-per-employee / https://stats47.jp/municipalities/ranking/annual-sales-amount-per-establishment
    - 経緯: 再発 (2026-10-31 の週次で再検出)
- **表示の意味 (定義単位で直す)**: 箇所は週次 `latest.json` の `ui_findings`、全 URL は `violations`。直し方は `.claude/rules/page-quality-standards.md`「表示の意味の検査」の「直し方」。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-OTHER-20261031.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [INCOME-SOURCES-LEDGER-01] stats47 の AdSense と KDP の月次受取を vault の収入台帳に載せ、給与以外の収入源の比率に入れる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-30] [領域:管理] [待ち:ログイン]

- **起点 (2026-10-30 オーナー)**: 「複数の収入源を持ちたい」。
- **読者の課題／HARM**: 本カードは収益の計測 (M: Money は運営者自身の判断材料)。新しい打ち手ではない。KDP を増やすかの判断は既存の `KDP-EXPANSION-01`、doboku-note 分は doboku-note の DN-0920 が持つ。
- **次 (実行順)**:
  ① AdSense の月次の確定収益 (支払いレポート) を取得する経路を決める (管理画面の手動 export か、既存の計測の段に足すか)。
  ② KDP の月次レポートを ASIN で stats47 分と doboku-note 分に分ける (`products:sales` の台帳と突き合わせる)。
  ③ 月 1 回、①②の確定額を vault の収入台帳へ渡す (種別 `AdSense入金` を足すかは vault の家計SSOT の規約に従う。台帳の編集は vault 側の `kakei-curator` / `/log-kakei` の経路で行う)。
- **停止条件・禁止**: 見込み額・未確定額を確定として渡さない。欠測の月を 0 円にしない。
- **完了条件**: 直近 3 か月の AdSense と stats47 分の KDP の確定受取が vault の収入台帳にあり、給与以外の収入に占める stats47 の比率を月次で出せる。

### [INFRA-TIMELINE-01] 交通網の変遷 (高速道路・鉄道の時系列 GIS) を公開できる状態にし、見せ方を画像・動画・SNS へ展開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-29] [領域:データ]

- **現状 (2026-10-29)**: `/geo/history/<expressway|railway|airport>[/<regionCode|NN>]` をローカルで実装済み。台帳 `packages/gis/src/infra-history/networks.ts`、生成 `build-infra-history.ts`、成果物は `.local/r2/app/geo/history/` のみ (R2 未反映)。N06・N05 の時系列は非商用だが、2026-10-29 にオーナーが事務局から電話で了承を得た (`PHONE_PERMISSION_2026_10_29`: 広告なしページでの地図表示 (加工データの配信を含む)・SNS)。電話も証跡として認める決まりに変えた (gis-data.md)。台帳は `public-approved` で `isInfraNetworkPublishable` が true (noindex 解除・R2 ガード通過)。ページは広告・アフィリエイトなしのまま (広告のあるページ `ad-page` は了承の範囲外)。
- **次 (実行順)**:
  ① (済み) 事務局の了承を台帳に記録した。
  ② R2 反映 (CI の `r2-publisher` 経由。承認のうえ)・サイトマップ追加・`/geo` からの導線を同じまとまりで行い、デプロイはオーナーの指示で 1 回。
  ③ 見せ方の展開: 全国・地方の年別静止画 (参考書籍『統計から読み解く色分け日本地図』の見開き型: 地図 + 凡例 + 総延長 + 順位表) と Remotion の時系列動画を同じ summary / topojson から作る。SNS 投稿は了承の範囲 (`sns`) に入っている。
  ④ 鉄道の開業年の 1950 年以前 (原典で 1950 に丸め) と、高速道路の延長が公表値 (供用延長) と一致しない点を、画面の注記以上に扱うか決める。
- **停止条件・禁止**: 了承の証跡 (日付・相手・範囲) を台帳に書く前に R2 へ置かない、検索に出さない。了承の範囲に `ad-page` が無ければ広告・アフィリエイト枠を足さない。年不明 (999) を推測で埋めない。
- **完了条件**: 本番の `/geo/history/expressway` と `/geo/history/railway` が 200・広告なし・地図表示で確認でき、R2 の manifest と summary の SHA がローカル生成と一致する。

### [INFRA-HISTORY-R2-PUBLISH-01] 交通網の変遷の R2 反映の残り (問いのページの計算結果・旧高速道路データの削除・再現手順の書き換え)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-29] [領域:データ]

- **済み (2026-11-03)**: 3 網 (高速道路・鉄道・空港) と高速道路の接合部の 172 件を、新しい CI `.github/workflows/infra-history-publish.yml` で公式 ZIP から作り直して R2 `app/geo/history/{expressway,railway,airport}/` へ反映した (dry-run run 41576647868 をオーナーが承認 → 反映 run 41577740326。)
- **残り 1 — 問いのページの計算結果** (`app/geo/questions/<問い>.json`、`build-geo-questions.ts`): N05・N06 の原典 ZIP から計算するので、問いのページが広告なしか・了承の範囲 (`packages/gis/src/infra-history/networks.ts` の電話の記録) に入るかを決めてから、同じ workflow に足す。`.claude/rules/r2-storage-design.md` の対応表にも `app/geo/questions/` を足す。
- **残り 2 — 旧高速道路データの削除**: テーマの節が独自の地図をやめたので、R2 `app/highway-history/` (stats.json・highway-sections.topojson) は読み手が 0。削除は `r2-maintenance.yml` の `RETENTION_TARGETS` に exact key で足し、dry-run → 承認 → 削除の順で行う。
- **残り 3 — 再現手順**: `GEO-QUESTION-DESIGN-01` と `INFRA-TIMELINE-01` の「別の PC で再現する手順」から「`.local` を作り直す」を外し、R2 から読む形に書き換える。
- **停止条件・禁止**: 原典 ZIP を公開バケットに置かない。`app/geo/` の広い prefix を同期しない。承認の前に反映・削除しない。
- **完了条件**: 問いの計算結果を反映する (または反映しないと決めて理由を残す)、`app/highway-history/` が R2 に残らない、2 枚のカードの手順が R2 前提になる。
- **前提の誤り (2026-11-24)**: 「`app/highway-history/` は読み手 0」は誤りで、buzz-map が N06 の元データとして読んでいる (`.claude/scripts/sns/build-buzz-map-catalog.ts:371`・`.claude/skills/sns/buzz-map/SKILL.md:102`)。RETENTION_TARGETS へ足す前に、この 2 か所の参照を付け替える。

### [GIS-ATTRIBUTE-LEDGER-01] GIS の属性 (各データが持つ項目と意味) と区分を data/geo/ の JSON 台帳 + Schema に集約し、地図・凡例・吹き出し・集計がそこから引く形にする
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-10-29] [領域:データ]

- **済み (2026-11-14・cb5cff3e9)**: 属性の原典台帳 geo.ksj-attributes を作りました (data/geo/attributes/<dataId>.json と config/schema/geo.ksj-attributes.schema.json。)
- **残り**: 取り込み (run-pipeline.ts と acquire-public-ksj.ts) が、観測した属性名を生成物 data/geo/attribute-inventory.json に書き出すようにします。合わせて Schema 付きでカタログに登録します。公開済み 50 件の分は、R2 の配布ファイルを読むだけで一度埋めます (R2 の認証がある端末か CI で行います)。
- **残り**: R2 を使わないテストで観測と台帳を突き合わせます。観測にあって台帳に無い属性は縮小専用の一覧で固定し、台帳にあって観測に無い属性はエラーにします。このテストを pre-commit と test:packages に載せ、未整理の件数 (データ数と属性数) をカードに書きます。
- **残り**: 単体 GIS ページで項目説明を持つデータ (pages.json の 50 件) の属性の台帳を、公式のデータ詳細ページから埋めます。確かめていない意味は「未確認」と書きます。そのうえで GeoSourceField の key・label を台帳から引き、data-configs には読み物の文章だけを残します。
- **残り**: registry.ts の prefectureSource (W09・W01) を属性の台帳の役割 prefecture に移します。property-map.ts (N02・S12・P04) も台帳の distributedName から組み立てます。classifications.json の field は、属性の台帳の codeTable を持つ属性と一致することを attributes.test.ts が固定しているので、どちらか一方に寄せます。
- **残り (判断)**: 手順 7 について判断が要ります。datasets.ts と networks.ts は、すでに JSON 台帳の読み込み口になっています。TS に記録が残っているのは registry.ts の技術設定 (downloadUrlPattern・geojsonDirInZip・simplifyOptions・shapefileEncoding) と prefectureSource・propertyMap だけです。推奨は、prefectureSource と propertyMap を属性の台帳へ移し、パイプラインの技術設定は registry.ts に残して data-storage.md に例外と理由を書くことです。理由は、技術設定は原典の事実ではなく取り込み処理の設定で、ほかの台帳から ID で指されないためです。もう一つの選択肢は、全部を data/geo/ksj/pipeline.json + Schema へ移し、KsjDataId の型の弱まりを読み込み時の検証で補うことです。
- **完了条件**: npm run check-datasets が data/geo/attributes/*.json と data/geo/attribute-inventory.json を Schema と refs で検査して通ることが条件です。突き合わせの検査が CI に載り、未整理の件数が数字で分かることも必要です。さらに、単体 GIS ページの項目・県の帰属・属性名の付け替えが、すべて属性の台帳から引かれていることが条件です。

### [UI-COMPONENT-CONSOLIDATE-01] 同じ役割の UI 部品を 1 つにまとめ、名前を「対象 + 役割」に揃える (推移・数値タイル・凡例・高速道路の時系列地図)
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-10-29] [領域:サイト]

- **なぜ (2026-10-29 の交通網の変遷の作業で見つけたこと)**: 「数値 + 推移」という同じ役割に組み方が 4 つあり (地方財政 `LocalFinanceDashboard`・ランキング `RankingNationalAverageStat`・交通網 `InfraHistoryExplorer`・テーマの `KpiCard`)、ページごとに見た目と操作が違う。名前が作り方・大きさ (`Mini`・`Numeric`・`D3`) を表していて役割が分からず、似た部品が増える。カタログ `.claude/rules/chart-component-standards.md` も実物から古く、§2-D の `TrendSparklineCard` はリテラル検索で定義も呼び出しも見つからず、`stats-card` (KpiCard) も定義データからのリテラル参照が見つからなかった (動的な組み立ては未確認)。
- **使用箇所の実測 (2026-10-29、apps/web/src と packages の tsx。テストを除く)**:

  | 役割 | 今ある部品 | 呼び出し | 違い |
  |---|---|---|---|
  | 推移の線 | `MiniLineChart` (`@/components/charts/MiniCharts`) | `LocalFinanceDashboard` 2 か所 | 軸なし・比較の破線・useD3Tooltip・最後の点を強調 |
  | 推移の線 | `NumericTrendChart` (`@/components/charts/NumericTrendChart`) | `RankingNationalAverageStat`・`InfraHistoryExplorer` | 数値軸・暦年軸・選択年の印・`NumericDomainPolicy` |
  | 数値タイル | `StatTile` (`@/components/surface`) | 地方財政・地域データブック・テーマの指標カード・ランキングの詳細パネル・交通網 | バッジ・補足・子にチャート |
  | 数値タイル | `KpiCard` / `KpiCardClient` (`@/components/stat-charts`) | `DashboardComponentRenderer` 1 か所 | バッジ・増減。`StatTile` と役割が重なる |
  | 区分の凡例 | `ChartLegend` (`@/components/charts/ChartLegend`) | 地方財政・交通網・単体 GIS 地図 | inline / list・切り替え (`aria-pressed`) |
  | 区分の凡例 | `D3ChartLegend` (`packages/visualization/src/d3/components/shared`) | D3 の Bar・Line・Mixed・StackedArea の 4 チャート | 四角 / 線の印。切り替えなし |
  | 連続値の凡例 | `ChoroplethLegend` (visualization) | 都道府県地図・市区町村地図 | 色の濃淡で値の大小。**役割が違うので残す** |
  | 高速道路の時系列地図 | `HighwayTimelineMap` + `ThemeHighwayTimelineSection` (`@/features/highway-history`) | 道路テーマ (`theme-section-registry.tsx`) | R2 `app/highway-history/` を読む旧系統 |
  | 高速道路の時系列地図 | `InfraHistoryExplorer` の地図 (`@/features/infra-history`) | `/geo/history/expressway` ほか | 交通網の変遷。鉄道・空港も同じ部品 |

- **方針**:
  - まとめる基準は「役割と受け取るデータの形が同じ」こと。見た目が似ていても役割が違うもの (`ChartPanel` と `StatTile`、区分の凡例と連続値の凡例) はまとめない (カタログ §2-C「カードフレームの役割分担」の 2026-06-23 の誤判定の記録)。
  - 名前は「対象 + 役割」にする。作り方 (`D3`)・大きさ (`Mini`)・軸の種類 (`Numeric`) は名前に入れず、引数で表す。候補: 推移 = `TrendChart` (`axis`・`selectedYear`・`comparison` を引数に)、区分の凡例 = `CategoryLegend`、連続値の凡例 = `ScaleLegend`、数値タイル = `StatTile` (据え置き)。最終の名前は手順 1 の棚卸しのあとに決める。
  - 「数値 + 推移」の組み方は 1 つにする: `StatTile` の子に推移を置く形を正とし、パネルの中で数字を手で組む書き方をやめる。
- **手順 (この順で。各段で `npm run design-system:check -w apps/web` と、触った workspace の vitest related を通してから次へ)**:
  1. **棚卸し**: カタログ §2 の全部品の役割・受け取るデータの形・呼び出し箇所・まとめ先を表にしてこのカードへ追記し、カタログと実物のずれを洗い出す。`KpiCard` は `stats-card` を組み立てる経路を実行時の出力まで確かめ、使われているかを決める。
  2. **推移の線をまとめる**: `MiniLineChart` と `NumericTrendChart` を 1 つにし、軸・選択年の印・比較の破線・ツールチップを引数で切り替える (`useD3Tooltip` と `NumericDomainPolicy` を保つ)。呼び出し 4 か所を移し、旧名は再 export で残さず消す。
  3. **数値 + 推移の組み方を 1 つにする**: `RankingNationalAverageStat` の手組みを `StatTile` + 推移の部品に置き換える (隣の「上位3件」と高さを揃える要件は保つ)。`KpiCard` は使われていれば `StatTile` へ寄せ、使われていなければ消す。
  4. **区分の凡例をまとめる**: `ChartLegend` と `D3ChartLegend` を 1 つにする。置き場は依存の向きを確かめて `packages/components` か `packages/visualization` にする。
  5. **高速道路の時系列地図を 1 系統にする**: 道路テーマの `ThemeHighwayTimelineSection` を `/geo/history/expressway` への導線か同じ部品に置き換え、`features/highway-history` を消す (N06 の問題は `ROADS-THEME-N06-LICENSE-01` と同じ差分)。R2 の `app/highway-history/` の削除は、読み手が無いことを確かめ承認を得て `r2-maintenance.yml` で行う。
  6. **名前を揃え、戻らないようにする**: 決めた名前に変え、`check-design-system.mjs` に旧名の import を拒否する規則を足し、カタログ (§2-A〜2-D) と `.claude/rules/ui-components.md` を書き直す。
- **停止条件・禁止**: 役割が違う部品をまとめない。名前の変更だけを先に行わない (まとめる前に名前を変えると二度手間になる)。旧名を再 export で残さない。手順 5 の R2 削除は承認の前に行わない。見た目の変化 (余白・文字の大きさ) は右ペインで変更前と比べ、テンプレートの見本 (demos.shadcndashboard.dev) から外れていないか確かめる。
- **完了条件**: 推移・数値タイル・区分の凡例・高速道路の時系列地図が、それぞれ 1 つの部品になっている。カタログに載る部品と実物が一致する (無いものが載っていない)。旧名の import を `design-system:check` が止める。web の vitest 全件が通る。

### [GEO-OVERLAY-URL-01] 交通網と人口などを重ねる画面の URL と、問いの分析の置き場 (geo・ブログ・テーマ) を決めて url-policy に載せる
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-29] [領域:サイト] [待ち:判断]

- **なぜ**: 重ね合わせは「主題 × 年 × 範囲」の組み合わせで URL が増えやすく、広告の判定 (`apps/web/src/lib/google-adsense/ad-free-paths.ts` のパス接頭辞) と公開の判定 (網ごとの `publication.status`) に関わるが、URL の正本 `apps/web/src/lib/url-policy.ts` は `/geo` 配下を管理していない。今の `/geo` の URL は `/geo/<分析>`・`/geo/layers/<レイヤー>`・`/geo/datasets/<dataId>`・`/geo/history/<網>/<範囲>`・`/geo/compare`。
- **決定 1 (2026-10-29 オーナー)**: 「見る重ね合わせ」は geo の仕事 (重ねて見せ、検算できる形まで)、因果の解釈はブログ・テーマ。重ねる単位は「主題」(`subject`、台帳 `data/geo/subjects/subjects.json`。描いてよい範囲 `scopes` もここ)。塗り分け (area) は同時に 1 つまでを URL の正規化で守る。
- **決定 2**: URL は `/geo/map?base=<背景>&subjects=<重ねるもの,…>&scope=<範囲>`。背景 (塗り分け) は `base=` の 1 つ、重ねるもの (線・点) は `subjects=`。背景を選んだらスライダーは全主題に値がある期間に絞り、塗り分けの色の基準は全国の全年で固定 (人口の 1980 年比増減率を既定の背景として実装済み)。
- **決定 3**: 公開するのは問いのページ (`/geo/<問い>`)。`/geo/map` は検索対象外の道具に下げる。問いのページの設計は `GEO-QUESTION-DESIGN-01`。
- **これまで (2026-10-29)**: `/geo/map` を `apps/web/src/features/geo-map/` に実装 (正規化・noindex・広告なし)。鉄道の現況 (N02) と地価の地点は「準備中」表示で外している。
- **未確定の方針 (オーナーの合意が要る)**: ① 単一網の時系列は `/geo/history/<網>/<範囲>` を正本として残し、重ね合わせ画面からリンクする。② 問いの分析は人が選んだ組み合わせだけを `/geo/<名前>` に 1 つずつ作る。③ 重ね合わせ画面は常に広告なし (クエリで非商用レイヤー N05・N06・C02 を足せるため、パスの判定では止められない)。④ 公開: 含まれるレイヤーのうち最も厳しい利用条件・公開状態でサーバーが表示可否を決める。⑤ 時間の軸: 人口 (国勢調査 5 年ごと・人口メッシュ 2020/2050 のみ) に該当年が無いときの扱いを決める。
- **問いの分析の置き場 (`docs/01_技術設計/03_情報設計.md` に従う)**: 正本 = `/geo/<分析>` (途中の地図・空間演算・検算・限界)。ブログ = 背景と読み方 (表を複製せず分析の段階へリンク)。テーマ = 結論が県別の値に収まるときだけ着地 (前例 `/themes/earthquake-exposure`)。`/geo` の分析は実分析 3 本以上・一次資料・方法・GA4・薄さの監査が揃うまでナビと検索に出さない。非商用の N05・N06 の時系列の地図・画像は事務局の回答 (`INFRA-TIMELINE-01` ①) までブログ・テーマに載せず、最初の分析は制約のない組み合わせ (N08・N02・e-Stat) で作る。
- **手順**:
  1. 上の未確定の方針をオーナーと確定し、このカードに決定として書き込む。
  2. `url-policy.ts` に `/geo` 配下 (分析・layers・datasets・history・map) の既知の URL・canonical・noindex の判定を足し、`src/__tests__/middleware.test.ts` と `.github/scripts/smoke-test-routes.sh` に代表 URL を足す。
  3. 重ね合わせ画面のクエリの型と正規化関数で、不正な値は 404 ではなく素の画面へ寄せる (canonical を保つ)。広告なし・公開判定をサーバーで行う。
  4. 地価の範囲別データ、問いの定義の台帳化、R2 への反映とデプロイ。最初の問いの分析を `/build-geo-analysis` で正本にし、ブログ 1 本とテーマからの導線を揃える。
- **停止条件・禁止**: 組み合わせごとに index 対象のページを作らない。非商用レイヤーを広告のあるページ (ブログ・テーマ・問いの分析) に載せない (了承の範囲に `ad-page` が記録されるまで)。年の合わない人口を黙って近い年で埋めない。
- **完了条件**: 方針がカードに決定として書かれ、`url-policy.ts` が `/geo` を管理し、middleware のテストと smoke に `/geo/map` と `/geo/history` の代表 URL が入っている。

### [GEO-QUESTION-DESIGN-01] 地域分析の「問いのページ」を、分析の型・問いの台帳・回遊・ナビまで設計し、試作 4 本を作り直す
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run content:check] [起票:2026-10-29] [領域:サイト] [待ち:判断]

- **なぜ (2026-10-29 のオーナーとの議論)**: 「表示できるものを全部選べる画面」を 2 回作り込んでしまったので、公開する組み合わせページは問い → 分析 → 見せ方から設計する。試作 4 本で、① ページどうしのつながり、② サイト全体の中での位置 (左サイドメニューは「地域分析」1 項目だけ)、③ 分析の方法 (4 本とも「組に分けて推移を並べる」1 種類だけ) が未設計と分かった。
- **これまでの決定 (詳細は `GEO-OVERLAY-URL-01` の決定 1〜3)**: geo は重ねて見せ、検算できる形まで (因果の解釈はブログ・テーマ)。公開するのは問いのページ `/geo/<問い>` で、`/geo/map` は検索対象外。ページの順は 問い → 組の推移のグラフ (主役) → 地図 (補助) → 組の決め方 → 読み方の注意 → 言わないこと → あわせて見る → 出典の 1 行。重ねる単位は「主題」(subject)、台帳 `data/geo/subjects/subjects.json` + Schema。
- **試作 4 本 (すべて noindex)**: `/geo/ic-population` (IC の供用開始年で市区町村を 4 組 → 人口指数)、`/geo/ic-manufacturing` (IC までの距離帯 4 組 → 出荷額の割合)、`/geo/shinkansen-population` (駅の開業年 4 組。駅のある市区町村は 102 だけで 1 都市が組を左右する)、`/geo/airport-tourism` (空港の種別で県を 3 組 → 宿泊者数指数。統計が 2009〜2024 年しかなく開港の前後は比べられない)。計算は `packages/gis/src/geo-questions/scripts/build-geo-questions.ts` → `.local/r2/app/geo/questions/<問い>.json`、問いの定義は試作のため `apps/web/src/features/geo-questions/lib/questions.ts`、画面は `apps/web/src/features/geo-questions/`。
- **再現手順**: `node --import tsx packages/gis/src/infra-history/scripts/build-infra-history.ts --network all` → `build-expressway-joints.ts` → `build-geo-questions.ts` → `npm run dev:web`。会社の Windows PC では memory `proxy-preload-for-fetch-scripts` の preload を先に読ませ、R2 の中継 (`apps/web/scripts/r2-dev-gateway.ps1`) は許可を変えたら dev を起動し直す。
- **決めること (この順で。各段の決定をこのカードに書いてから次へ)**:
  1. **分析の型を決め、4 つの問いに割り当てる**。候補: 開通を起点に揃える (イベントスタディ)、似た地域と比べる (差の差)、相関 (距離と増減率)、時系列の連動 (ラグ)、位置関係 (バッファ・到達時間・空間的自己相関)。型の一覧と名前、型ごとの検算 (途中の結果と保存則)、図の種類を決める。市区町村・距離との相関は新しく作る (都道府県は既存の `app/correlation/`)。どの型でも示すのは計算と並べた結果まで。
  2. **問いの台帳の形を決める**: 問い・系統・分析の型・入力・組の決め方・読み方・言わないこと・関係を `data/geo/` の JSON + Schema に置き (memory `feedback_authored_ledgers_in_data`)、`questions.ts` をここへ移す。
  3. **回遊を既存の台帳に載せる**: `data/content/` (`npm run content:sync` / `content:check`) に問いのページを登録し、`uses`・`explains`・`themeContext`・`geo` の関係を張る。表示は既存の右レール・回遊の部品を使う。
  4. **ナビを決める**: 左サイドメニューの「地域分析」を開閉できるグループにし、`/geo` のハブで系統別に問いを並べ、問いのページでは同じ系統の問いを右レール (狭い画面は本文の下) に出す。
  5. 1〜4 に合わせて試作 4 本を作り直し、右ペインで見ながら調整する。
- **関連カード**: `GEO-OVERLAY-URL-01`、`GIS-ATTRIBUTE-LEDGER-01`、`UI-COMPONENT-CONSOLIDATE-01`、`INFRA-TIMELINE-01`。
- **停止条件・禁止**: 表示できるものを並べるだけの組み合わせページを公開しない (問いが先)。因果を断定する文言をページに書かない。問いの定義を feature の中に置いたまま公開しない (台帳へ移してから)。組の計算の途中結果 (どの市区町村をどの組にしたか) を捨てない。
- **完了条件**: 分析の型と問いの台帳が決まって `data/geo/` にあり、4 つの問いのページが台帳から作られ、`data/content/` の関係で関連ブログ・ランキング・テーマとつながり (`npm run content:check` が通る)、サイドメニューと `/geo` のハブから辿れる。

### [ROADS-THEME-N06-LICENSE-01] 道路テーマの高速道路タイムライン地図 (N06 の時系列) を、広告のあるページから外すか条件を確かめる
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-29] [領域:データ] [待ち:判断]

- **見つけた経緯 (2026-10-29)**: `/themes/roads` の「高速道路ネットワークの広がり（1962→2020）」(`apps/web/src/features/highway-history/`) は N06 高速道路時系列の開通年 (`N06_002`) で年別の区間数・延長 (`app/highway-history/stats.json`) を出している。N06 の公式ページは「時系列データとして使用する場合：非商用」で、テーマページは広告・アフィリエイトを載せる。生成スクリプトは git に見つからず (`stats.json` は 2026-05-24 生成)、原典は 2020 年版。
- **次**: INFRA-TIMELINE-01 ①の問い合わせに含めて条件を確かめる。回答まで、テーマのセクションを `/geo/history/expressway` への導線に置き換えるか、最新年の現況表示 (CC BY 4.0 の範囲) だけに縮めるかをオーナーが選ぶ。
- **停止条件**: R2 の `app/highway-history/` の削除は、読み手を外したあと承認を得て `r2-maintenance.yml` で行う。
- **完了条件**: 広告のあるページで N06 を時系列として使う箇所が無いか、使ってよい根拠 (了承の範囲に `ad-page`) が台帳にある。

### [CI-LIVE-R2-TEST-FLAKE-01] 単体テストと PR のビルドが公開 R2 の一時的な不調で落ちる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-29] [領域:サイト] [待ち:判断]

- **判断待ち (2026-11-14)**: 公開 R2 が不調のとき、固定データを読む 2 テスト (`license-exclusion`・`delivery-integrity`) をどう扱うかをオーナーが決める。(a) skip を許す (品質の例外台帳に test-skip 2 件を足す。定期監査は `PACK_SNAPSHOTS_STRICT=1` で従来どおり止める) / (b) skip を許さず、CI の固定データを `actions/cache` で持ち越す / (c) 2 テストを別ジョブへ分けて必須チェックから外す。
- **なぜ手元で決められないか**: (a) は `quality-exceptions` の検査が例外の追加を禁じており、「固定データが取れなければ止まる」という現在の方針 (`0f754efda`) を緩める判断になる。固定データを fixture にする案は、テストが実データの件数 (P-12 は 2,491 指標など) を固定していて、13 パックで数千指標になるので採れない。
- **観測 (2026-11-14)**: `R2_PUBLIC_FETCH_URL=http://127.0.0.1:9` で、Unit Tests の前処理が `packages/product-factory` の全 55 テストファイルを巻き込んで落ちることを再現した。
- **再観測 (2026-11-15・別の原因)**: 公開 R2 の中身が変わっても同じ 2 テストが落ちる。 (参照: run 43685432330・ff44de49e)
- **次**: 判断の後、前処理に取得失敗の許容を足し、2 テストに固定データの有無の判定を入れる (約 1 時間)。Build Check の R2 読み取り件数と所要の測定は未着手。
- **完了条件**: 公開 R2 が不調でも、関係の無い PR の必須チェックが落ちない。

### [QUALITY-SUITE-WEEKLY-RED-01] 週次フル品質検査 (main) が 3 週続けて失敗している
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-14] [領域:サイト]

- **観測 (2026-11-14)**: `quality-suite-weekly.yml` の main の run が 10-30 (`41122877579`)・11-06 (`42295351706`)・11-13 (`43513853562`) の 3 回とも failure (Issue #1202)。
- **再現**: `gh run view 43513853562 --log-failed`。手元では `npm run test --workspace apps/web -- population-profile-ui bridge-inspection-age-ui`。
- **次**: ① 3 回の run の失敗 job とテスト名を並べ、毎回落ちるものと 1 回だけのものを分ける ② 毎回落ちるものから、job ごとに原因を実証して直す (公開 R2 の取得失敗が絡むものは `CI-LIVE-R2-TEST-FLAKE-01` と重なるかを先に確かめる) ③ 落ちた E2E の artifact でサーバーの例外が読めるかを確かめる (`E2E-FAILURE-EVIDENCE-01` の残り)。
- **完了条件**: main の `quality-suite-weekly` が 1 回 success になり、Issue #1202 が自動で閉じる。
- **① 済み (2026-11-16)**: 3 回の run (41122877579・42295351706・43513853562) を比べた。**毎回落ちるもの**: E2E の blog-detail.spec.ts (:24・:29・:40・:56。`toBeVisible` が要素を見つけられない)、blog-list.spec.ts (:21・:29・:98。h2 を持つ `main a[href^='/blog/']` が見つからない)、comparison.spec.ts :45 (`toHaveURL`)、header-navigation.spec.ts :41・:95、Theme quality audit (10-30・11-06 は `AssertionError [ERR_ASSERTION]`。どの assert かは未特定)、OGP image audit (原因は毎週違う。11-06 は data-muni-manufacturing の short-title の生成失敗、11-13 は gloves-… の article.md の R2 fetch 失敗)。**3 回中 2 回**: unit の bridge-inspection-age-ui と population-profile-ui の 10 秒タイムアウト。**1 回だけ**: header-navigation :34、public-route-contract :36 (10-30)、Page quality audit (11-06)。unit のログに「R2クライアントを取得できませんでした / getCloudflareContext」が繰り返し出ており、blog E2E と同じ原因か (`CI-LIVE-R2-TEST-FLAKE-01`) は未確認。`affiliate-ga4-weekly` (#1207) は計測ゲート (inventory-snapshot-stale・A8 の照合不足) で落ちており、別の原因。**次**: ② blog E2E から、失敗時のスクショ artifact で R2 の取得失敗かテストデータかを分ける。
- **追記 (2026-11-16)**: ② に入るときは、Theme quality audit の assert が 3 回とも落ちている件 (どの assert かは未特定) と、OGP 監査で data-muni-manufacturing の short-title の生成が 11-06 に失敗した件も、このカードで扱う。
- **4 回目 (2026-11-20・run 44829320471)**: 失敗した job は Full web build and E2E (10 件)・OGP image audit (r2-static の欠落 2 件)・Theme quality audit (14 件のチャート依存が実データの契約を満たさない)・Update weekly quality alert。E2E は blog-list の記事カード・comparison のカテゴリタブ・header-navigation のサイドバーの現在地とテーマ一覧のリンクなどで、① の「毎回落ちるもの」と重なる。

### [BLOG-QUESTION-ANSWER-01] 「〜が最も少ない県はどこ」の質問形の検索に、答えを冒頭に置いた記事で応える
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:承認]

- **証拠 (GSC 2026-W42 のクエリ・`data/gsc/snapshots/2026-W42/queries.csv`)**: 「病院数が最も少ない都道府県はどこ」1,869 表示をはじめ、病院が少ない県を問う言い回しが 12 通りで計約 7,800 表示ある。
- **案**: 答え (県名・値・順位) を冒頭 1 文に置き、人口あたりで並べ替えると順位が逆転するか、を本文の主題にする型を作る。AI の概要表示で答えだけ取られても、人口あたりの逆転と図は記事に来ないと分からない構成にする。headless の型ガイド (`ARCHETYPE_GUIDE`) に足し、トピックは GSC の質問形クエリから決定的に拾う。
- **次**: ① 一般病院数と人口 10 万人あたりの一般病院数で 1 本書き、4 週の表示とクリックを記録する ② 質問形クエリを抽出するスクリプトを topic-queue の入力に足すかを、その結果で決める。
- **完了条件**: 1 本が公開され、4 週の GSC 実測が記録され、型を広げるか決まっている。

### [BLOG-WHITEPAPER-METRIC-GAP-01] 白書が地域差を論じているのに記事が無い指標で書き、データの無い論点は取り込み元を決める
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **済み (2026-11-14・d8fad9579)**: 救急搬送の病院収容時間の型A の下書き `contents/blog/ambulance-hospital-arrival-time-prefecture-gap/` を published: false で作り、quality-gate と factual gate を blocker 0 で通した。
- **残り**: 救急の下書きを別プロセスの critic で審査し、REVISE なら直して review.md を PASS にする。headless の critic を使うか blog-critic agent を使うかは実行者が決める。
- **残り (判断・新記事か是正か)**: 交通事故死傷者 (`traffic-accident-casualties-per-population`) は公開済みの `traffic-accident-deaths-regional-risk` が事故件数と死者数で同じ主題を扱い、保育の待機 (`nursery-waiting-children-count`) は `waiting-children-progress`「16県がゼロ達成、残る待機児童」が同じ主題を扱っている。選択肢は (a) 新記事を 2 本書く、(b) 新記事は書かず、既存 2 記事の brushup で該当ランキングへのリンクと図を足す、の 2 つである。推奨は (b) で、根拠は同じ問いに答える記事が 2 本になると検索で食い合い、既存記事には既に表示の実績があることである。
- **残り (取り込み・放課後児童クラブの待機児童は取り込む)**: こども家庭庁「放課後児童健全育成事業 (放課後児童クラブ) の実施状況」の令和7年版 PDF (2025-12-23 公表・5月1日現在・毎年 12 月公表) の p32「利用できなかった児童数 (待機児童数) (対前年入り)」に 47 都道府県の人数と前年値がある。p29・p31 には登録児童数もあり、率にできる。ambulance-hospital-arrival-time と同じく `fetcherKey: 'manual'` と provenance (PDF の URL・ページ・列) で指標を作り、令和5〜6年版の PDF で過去年を足す。
- **残り (取り込み・特殊詐欺は見送る)**: 警察庁「令和6年における特殊詐欺及びSNS型投資・ロマンス詐欺の認知・検挙状況等について (確定値版)」(2025-05-23) では、都道府県別の件数は東京など上位の県の文中の記述だけで、47 都道府県の表は確認できなかった。都道府県警察は自県の件数と全国順位を個別に出している (兵庫県警の令和6年確定値など) が、47 本を集める取り込みは出典の形がそろわないため見送る。警察庁か警察白書の統計資料に 47 都道府県の表が見つかれば再検討する。
- **完了条件**: 救急の下書きが審査 PASS で outbox にあり、交通事故死傷者と保育の待機の扱いが決まって実行され、放課後児童クラブの待機児童の指標が取り込まれているか、取り込みのカードが起票されている。
- **オーナー決定 (2026-11-24)**: 推奨どおり (b) 新記事は書かず既存 2 記事の brushup でランキングへのリンクと図を足す を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: traffic-accident-deaths-regional-risk と waiting-children-progress の brushup を起こす

### [BLOG-RELEASE-CALENDAR-FOLLOWUP-01] 公表暦で見つかった年次更新待ちの取り込みと、国勢調査の集計ごとの公表
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-14] [領域:サイト]

- **1**: 公表暦 (`74137ea77`) の releaseDue に、公表済みなのに年次を更新していない指標が 94 件出ている (賃金構造基本統計 37・学校基本調査 18・人口動態 18 など)。調査ごとに e-Stat から取り込み、R2 の観測値を新しい年へ上げる (R2 の書き込みはオーナーの承認後)。
- **2**: 国勢調査は通勤・就業の指標の早すぎる検出を避けるため、最後の基本集計 (2020 年調査では 2022 年 7 月) で数えている。人口と世帯だけの指標は、人口等基本集計の公表 (2025 年調査は 2026-09-29) から約 1 年検出が遅れる。調査の公表を集計ごとに分け、指標がどの集計から来るかを持たせる。
- **完了条件**: 1 は releaseDue の件数が 0 か、残す理由が調査ごとに書いてある。2 は人口と世帯の指標が人口等基本集計の公表日で検出され、テストで固定してある。

### [BLOG-LIVABILITY-PURPOSE-SERIES-01] 「住みやすい県ランキング」を目的別 (子育て・老後・一人暮らし・移住) に分けたシリーズを作るか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:判断]

- **証拠 (GSC 2026-W42)**: 「住みやすい県ランキング」2,229・「住みやすさランキング 都道府県」451・「住みやすい都道府県ランキング」418 など、計約 3,700 表示。
- **案**: 目的ごとに指標と重みを明示した 4 本 (子育て・老後・単身・移住)。重みと指標は記事内に書き、読者が組み替えられることを示す。市区町村の子育て (`MUNI-KOSODATE-RANKING-01`) と指標を揃える。
- **決めること**: 総合の 1 本の 4 週の実績を見てから作るか、今作るか。合成指標は恣意的に見えるので、重みの根拠を書けない目的は作らない。

### [BLOG-REGION-PUBLISHED-FIX-01] 公開済み 10 本の地方のくくりと題の約束の誤りを直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-11-04] [領域:サイト]

- **背景 (2026-11-04)**: `region-claim-lint.mjs` と `title-promise-lint.mjs` を公開済み 767 本に掛けると、blocker の形が 10 本で見つかった。
- **対象**: `assembly-answer-chatgpt-5steps` `croquette-consumption-expenditure-prefecture-gap` `hospital-bed-utilization-map` `nagano-food-culture` `pork-consumption-quantity` `school-nonattendance-pattern` `sugar-consumption-prefecture-gap` `tochigi-food-culture` `tuna-consumption-quantity-vs-annual-new-inpatients-general` `yamagata-food-culture`
- **完了条件**: 各記事の quality-gate で `地方のくくり` と `題の約束` の blocker が 0。`/brushup-blog --target article` で本文を直す。

### [BLOG-HEADLESS-AUTHOR-01] ブログ執筆を headless `claude -p` のバッチに移し、本数を増やしながら 1 本あたりの費用と通過率を記録する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --dry-run] [起票:2026-10-28] [領域:サイト] [進行中]

- **背景 (2026-10-28 オーナー指示)**: 「Claude のトークン消費を節約してブログをもっと展開したい」。
- **実装 (branch `claude/determined-newton-2d077c`)**: `packages/ai-content/src/scripts/write-blog-headless.ts` + `src/services/claude-cli-runner.ts`。準備 (`generate-blog-article.ts`) が作った prompt を sonnet・effort low の `claude -p` で書き、`quality-gate.mjs` + `ci-factual-gate.mjs` → 別プロセスの critic (`buildBlogCriticPrompt`・本文だけ) → REVISE なら指摘と原稿を author に返して 1 回書き直す。記録は `data/blog/headless-runs.csv`。公開はしない (`published:false` のまま)。手順は `/write-prepared-article` の「headless 経路」。
- **量産の入口 (2026-11-04)**: `npm run blog:batch` に一本化した (対象選定〜`--ingest`・一覧。`blog-quality-standards.md`「量産バッチ」)。書く前の材料・書く価値の判定・地方と題の検査も入れた。
- **実測 (2026-10-28 の要約、明細は `data/blog/headless-runs.csv`)**: 5 本・15 run で、1 本あたり (書き直し 1 周込み) 1.8〜4.9 万トークン・$0.10〜0.27。
- **次 (実行順)**: ⓪ author prompt (`blog-article-prompt.ts`) に「題で『なぜ』を約束したら本文で答える。答えられないなら題を変える」と、地方区分・隣接の言及は prompt に渡した区分だけを使う指示を足す (残る blocker の多数) ① 型B 以外 (A / D2 / F) で 3〜5 本ずつ回し、型ごとの通過率と費用を CSV に貯める ② 通過率が低い型は critic の指摘を読んで author prompt (`blog-article-prompt.ts`) 側を直す (critic は緩めない) ③ PASS 分を `--ingest` で確定して develop へ push する (公開は週次計画の本数で人が決める)。
- **完了条件**: 型ごとに 5 本以上の実測が CSV にあり、既定の運転設定 (型・本数・rounds) を skill に書いている。

### [MUNI-WARD-MODE-READERS-01] 自前の統合版の地図 (`_city_dc`) を読む残り 2 か所を、データの単位を確かめてから WardMode の地図へ移す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ]

- **背景**: `<県>_city_dc.topojson` は 23 区を特別区部 13100 の 1 つにまとめる。
- **未検証**: Remotion の人口コロプレスは値のファイル (`blog/population-choropleth/data/population-ratio-tokyo.json`) が R2 に無いため描画を確かめていない。移動フローの地図は localhost で見ていない (データの結び付きはスクリプトで確認済み)。
- **次**: ① 本番反映後、`/api/mf-topo/13` が 23 区を返し、移動フローの東京の地図で区ごとに色が付くかを確かめる ② 読み手が 0 になったので `_city_dc` の R2 からの削除を承認制で行う (`.claude/rules/r2-storage-design.md`「市区町村の境界」)。
- **完了条件**: `_city_dc` を読むコードが 0 件で、2 か所の地図で地域と形が対応している。
- **確認が要る (11-03 の棚卸し)**: 「`_city_dc` を読むコードは 0 件」とあるが、`git grep -l _city_dc` で `apps/web/src/app/api/mf-topo/[code]/route.ts` と `apps/remotion/src/features/population-choropleth/usePopulationData.ts` が出る。コメントだけか実際に読むかを確かめる
- **削除の前に直す案内 (2026-11-24 の棚卸し)**: `packages/gis/src/geoshape/README.md` (32・44・47・74 行目) とジオシェイプの URL ビルダーのテストが、今も `_city_dc` の統合版を正規の形として案内している。R2 から消す前にこの案内を分割版 (`_city`) へ直す

### [METRIC-HOUSEHOLD-ASSET-SUBTITLE-01] 家計の金融資産と農家総所得の指標に「1世帯当たり」の印が無く、総額と判定される
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ]

- **済み (2026-11-14・`a785b750a`、`047c52d21`)**: 金融負債残高・預貯金・有価証券保有額の換算の選択肢を空にし、農業所得割合・農外所得割合の分母が農家総所得 (e-Stat 指標計算式 https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/L、2026-11-14 取得) であることを確かめた。
- **残り (一次資料の確認)**: 農家総所得の「1 戸当たり」を農林水産省の 2003 年当時の資料 (農業経営統計調査報告) で確かめる。1994 年以前が年度であることを農林水産省の資料で確かめる。農業所得割合と農外所得割合の和が 100 未満になる県の値を、農家総所得と農業所得・農外所得の実数から突合する。note の「未確認」は確認が済むまで残す。
- **完了条件**: 上の 3 点を一次資料 (URL と取得日つき) で確かめ、note の「未確認」を事実に置き換えている。

### [BLOG-STACKED-MOBILE-WEB-01] 積み上げ棒のスマホ用 SVG がサイトで使われない
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-28] [領域:サイト] [待ち:承認]

- **済 (2026-10-28)**: svg-builder の積み上げ棒に `layout: "mobile"` を足し、`apps/web/src/features/blog/lib/responsive-chart.ts` が `-stacked`・`-breakdown`・`-composition` も 639px 以下で `-mobile.svg` に切り替える (読み込めなければ横長に戻す。テストで固定)。
- **残り**: ② 公開済みの積み上げ棒 (約 4 枚) を作り直して前後を比べ、R2 へ上げる (承認が要る)。実機・localhost での見た目は未確認。
- **完了条件**: 積み上げ棒の `-mobile.svg` がある記事で、639px 以下の表示がスマホ用に切り替わる。

### [CHART-TYPE-ROLLOUT-01] 統計の図を種類ごとに 1 つの型から作り、サイト・note・SNS で同じ型を使う
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:サイト]

- **ゴール (2026-11-05 オーナー決定)**: 統計の図は種類ごとに 1 つの型から作り、サイト・note・SNS で同じ型を使い、型から外れた図は機械が止める。公開中の記事の差し替え (`NOTE-FIGURE-ROLLOUT-01`) と記事の修正 (`NOTE-FIGURE-FIX-01`) は含めない。
- **オーナー決定**: レーダー・サンキー・ウォーターフォールも型として持つ (2026-11-06。台帳は `image-templates.json` の `fit`)。動画はランキングのショートとバーチャートレースだけ残す (2026-11-06、`sns-content-standards.md` §2-4)。棒は上位と下位のカード 1 つ、タイル地図は都道府県だけ、地図は都道府県版と市区町村版、組み合わせはコード図、月別はグループ棒の型を使い、市区町村の図は `AreaScope` を必ず持つ (2026-11-05)。
- **済み**: 全 15 種の見本がオーナー確認を通り、`generate-article-charts.ts` は全て型で描き `--validate` が型外を止める。
- **残り**:
  - `generate-kakei-charts` を型へ移す。見せ方が変わるのでオーナーの判断が要る。
  - Instagram の `CorrelationScatterSlide`・`RankingTableSlide`、`render-article-pilot.ts`・`quick-still --layout` の試作の経路、Kindle の `ranking-databook.ts` を型へ移す。
  - 箱ひげの見本を管理画面の型の見本へ登録する (PNG は非公開 R2 へ置くので Mac で行う)。
  - 使われなくなった svg-builder の関数と `blog-svg-chart-standards.md` の説明を削除する。
  - 型から外れた図を止める検査を全媒体へ広げる。散布図の `audit-chart-axes.ts` は名前に scatter を含む図しか見ていない。
  - 残りの動画を静止画と同じ土台へ載せる (未着手)。
  - 地図の色の解決 (`choropleth.ts`・`choropleth-diverging.ts`・動画ごとの配色) の重複を別に扱う。配色の台帳を通すと公開画像が変わる。
  - 旧い棒・タイル地図・散布図の残りを同じ段階で扱うかは、オーナーの判断を待つ。
  - 配色の台帳がサイトの地図へ届くのは、main マージ後に `item.json` を作り直してから (main マージは未実施)。
- **未確認**: 変更後の動画と SNS 画像の見た目。Mac で `RankingInstagram-Table`・`MigrationFlow-Reel` を描いて確かめ、動画のコマを確認ページの見本に足す (`npm run review-videos --workspace remotion`)。バーチャートレースの値は 5 桁まで出るので、桁数の上限はオーナーの見た目の確認で決める。
- **棚卸し (2026-11-05)**: 公開中のブログの図 2,127 枚のうち型の印が無いのは 492 枚 (旧い棒 175・要点カードと工程図 124・折れ線 86・五分位の棒 59 ほか)。公開中の図の差し替えは `regenerate-blog-svgs.yml` を動かすまで起きない。負の値を含む棒 (`isSignedBar`) は型が未対応。
- **止まる場面**: 型の見本の確認と main へのデプロイ。
- **完了条件**: ① 図の種類ごとに型が 1 つあり、管理画面で見本を確かめられる ② 各媒体の生成処理がその型を使い、旧い描画処理が残っていない ③ 新しく作る図が型から外れると検査で止まる。

### [NOTE-OWNER-ACTIONS-01] note の画面でオーナーだけができる操作と判断をまとめて済ませる
タグ: [コンテンツ品質] [種類:改善] [実行:ユーザー] [起票:2026-11-13] [領域:商品]

- **起点 (2026-11-13)**: note の下書きの削除・マガジンの作成と記事の追加・下書きを捨てるか公開するかの判断が 5 枚のカードに散っていたので 1 枚に集めた。
- **1. 残った下書きを削除する**:
  - 題名なしの `n0ae79d01a60b`・`nbb8ef52bd1ff` (2026-11-05 の公開中にブラウザが落ちて残った)。
  - 空・途中の `n6c6e1708a2a1`・`n7f3aa1bb55b8`・`nb2b302a56c8c`・`n706d8699fcd7` ほか (教材の note 92 本の公開で失敗した回の残り。下書き一覧で公開済みの記事と照合してから消す)。
  - 公開済みの `c-kita-kanto-fiscal` (https://note.com/stats47/n/n56eb35145c32) に付いた未公開の下書き (2026-11-13 夜、`http://` → `https://` の更新の送信が終わらずに残った。公開版は変わっていない)。編集画面で下書きを破棄する。記事は消さない。
- **2. 下書きを捨てるか公開するかを決める**:
  - `recovered-n144d350fc14e` (沖縄の出生率): 以前から未公開の下書きがあり、目次の設定が公開版と違うので更新の道具が止まる。旧文言のカードが 4 枚残っている。
  - ハッシュタグの置き換えで止まっている 6 件 (詳細は `NOTE-HASHTAG-ROLLOUT-20261003`): 有料 `paid-n92b846280d1a`・`paid-nfe2c65e669a8` は以前からの下書きなので内容を確かめる。無料 `recovered-n03e45e40d3a7`・`n144d350fc14e`・`n3908e5981967`・`n48dff1df249f` は編集画面で下書きを破棄する。あわせて、エディタがリンクカードの行き先を旧ブログ URL の転送先へ書き換えるのを許すかを決める。
- **3. マガジンを作り、記事を追加する**:
  - 「都道府県ランキング｜情報通信」(`s47-ict`) を作り、URL を `data/note/magazines.json` の `noteUrl` に記録する (Claude へ URL を伝えれば台帳は直す)。`b-ref-prc-a20`・`b-ref-prc-a24` を追加する。API での作成は 201 が返っても一覧に現れなかった (カバー画像が必須の可能性。未検証)。「国際・外国人」(`s47-international`) も作るかを決める。
  - `a-annual-paid-leave-11-days-or-more-ratio`・`a-manufacturing-industry-annual-income` を、台帳が期待するマガジン `m4709a61adf77` へ追加する (11-07 の回遊監査の `missing_magazine_membership` 2 件)。
- **4. 指標を足すかを決める**: `b-ref-dev-a05`・`a09`・`a15`・`a40` は、問いが求める指標 (子育て世帯の貧困率・通学時間と進学率・最新年の貯蓄・自家用車で通う人の割合) が無く、答えの一部を「このデータでは判断できない」としたまま公開した。
- **別のカードで決めるもの**: 同じ記事が別 URL に複数回公開されている 8 組は `NOTE-PUBLISHED-DUPLICATES-DECISION-01`。
- **完了条件**: 1〜3 の操作が済み、`npm run weekly:audits -- --only note-circulation` で `missing_magazine_membership` が 0 件、ハッシュタグの `--audit-only` で `draft_blocked` が 0 件。4 は決めた内容を、足すなら指標のカードに、足さないならこの行の削除で記録する。
- **4. 指標を足すか決める (2026-11-24・旧 REFERENCE-EXPANSION-NOTE-01 の ③)**: `b-ref-dev-a05`・`a09`・`a15`・`a40` は問いが求める指標 (子育て世帯の貧困率・通学時間と進学率・最新年の貯蓄・自家用車で通う人の割合) が無く、答えの一部を「このデータでは判断できない」としたまま公開した。

### [NOTE-FIGURE-ROLLOUT-01] 公開中の note 記事の図を共通の型へ差し替える
タグ: [コンテンツ品質] [種類:改善] [実行:別環境] [起票:2026-11-05] [領域:商品]

- **起点**: `CHART-TYPE-ROLLOUT-01` から切り離した反映の作業。型が新しくなっても公開中の note の画像は旧いままである。
- **道具**: `update-note-body-figures.mjs` が公開版の本文の画像だけを替える (文章・カード・タグ・カバーは変えない)。有料記事は止める。
- **制約**: 会社の PC では Node からの note API が i-FILTER で止まる (503「ブロックされました」)。ブラウザの経路へ付け替えるかは未決なので Mac で実行する。2026-11-13 の切り分け (実測): 503 の出どころは Playwright の直接リクエスト (`ctx.request`) だった。同じ公開 API の GET が、プロキシ指定なしの `ctx.request` では 503「ブロックされました」、`proxy: { server: HTTPS_PROXY }` を付けると 200、ブラウザのページ内 `fetch` は元から 200。`lib/note-session.mjs` の `launchContext` が `HTTPS_PROXY` のある環境でだけ context にプロキシを渡すように直し、会社の PC から本文のリンク置換 4 本を公開できた (`NOTE-CIRCULATION-LINK-FIX-01`)。同じ夜の続きの 3 本は、編集画面が開かない・更新の送信が終わらない失敗で止まった (読み戻しでも接続タイムアウトが出ており、通信が不安定だった。原因がプロキシ経由のブラウザの遅さか一時的な不調かは未確認)。素の Node `fetch` で読む箇所は、memory `proxy-preload-for-fetch-scripts` の preload と `NODE_EXTRA_CA_CERTS` を付けて流す。
- **[仮説] 画像のアップロードも会社の PC から通る**: 画像の presigned POST と S3 への POST も `ctx.request` から送る (`patch-note-paid-landing.mjs` の `uploadImage`) ので、11-13 の 503 は同じ原因の可能性がある。S3 の宛先がフィルターで別に止められている可能性は残る。**検証コマンド**: 上の preload と証明書を付けて `node .claude/scripts/note/update-note-body-figures.mjs --key a-maximum-temperature` (dry-run) → 差分が画像 3 枚だけなら `--commit`。**検証期日**: 2026-11-20。**判定**: `UPDATED` と 4 項目の検査が通れば仮説を支持し、このカードと `PRODUCT-LP-SHOWCASE-01` の「Mac で実行」を外す。アップロードで 503 が出れば棄却し、`[実行:別環境]` のままにする。R2 の書き込みも Mac で行う。有料記事の添付は 1 日 10 回まで。実際の更新はまだ一度も動かしていない。
- **次 (Mac で実行。更新はオーナー承認済み)**: `git pull` のあと、次の順に行う。
  1. `npm run note:session:check` で口座が stats47 と確かめる。
  2. `node .claude/scripts/note/update-note-body-figures.mjs --key a-maximum-temperature` で dry-run し、画像 3 枚だけが変わると確かめる。
  3. 同じコマンドに `--commit` を付けて更新する。`UPDATED` と 4 項目の検査の成功を確かめる。
  4. https://note.com/stats47/n/n91e96edf3950 をスマホ幅で開き、3 枚の表示と文字の読みやすさを確かめる。
  5. 正本を入れ替える: `npm run note:article -- checkout a-maximum-temperature` → `node .claude/scripts/note/render-ranking-images.mjs a-maximum-temperature` → `npm run note:article -- save a-maximum-temperature`。
  6. 問題があれば旧画像へ戻す。旧 URL は本文の 3 枚 `1785758058-E56siOjDtpzWauISgHe3knN0.png`・`1785758073-0DMrteVW2nJZR4AIU3d87aBO.png`・`1785758089-gziOwk519uFJ7KEAvBspbjh0.png` (`https://assets.st-note.com/img/` の下)。
  7. 見え方が良ければ、残りのランキング記事へ広げる前にオーナーへ確認する。
- **完了条件**: 型にできるランキング記事の公開版の図が新しい型になり、更新後のページを確かめた。対象と本数は最高気温の結果を見てオーナーと決める。
- **2026-11-11 実測 (`npm run note:published:audit`・公開 439 本を公開 API から全件取得・取得失敗 0)**: 無料のランキング記事 103 本のうち、公開版の本文画像が型 (1080×1350) の記事は 0 本。実物は 1080×1080 + 1200×630 が 101 本。103 本のうち 72 本は回収した旧記事 (`recovered-*`) で `chart-data.json` が無く、今の `render-ranking-images.mjs` では作れない (R2 の値と記事の年から固定コピーを作る手順が要る)。旧記事は上位 5 県・下位 5 県の同じ図を 2 か所に貼っており、同じ画像の重複は全体で 111 本。進捗は `data/note/published-audit-latest.json` の `ranking_image_not_type` の本数で追う。

### [NOTE-PUBLISHED-AUDIT-01] note 公開記事の採点を、意味の確認と修正までつなぐ
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:商品]

- **済み**: 採点 `npm run note:published:audit` (週次の上限 `.claude/config/note-published-baseline.json`)・手順書 `/remediate-note-published` を作り、旧文言のカードを 4 本反映した (`72bb33359`・`56bf179db`。)
- **オーナー決定 (2026-11-11)**: 「元データ」カードは行き先を変えず、文言を「関連するデータを手元で使う」に変える。商品が収録する指標を台帳に持たせる案は見送り、必要になれば足す。
- **今の数字 (2026-11-11)**: 公開 439 本・違反なし 222 本・59 点以下 20 本。旧文言のカード 102 本、型で作り直せる画像 8 本、`chart-data.json` が無く作り直せない画像 95 本、意味の確認 23 本。
- **次 (この順)**:
  1. `OGP-RANKING-CARD-BLOG-REPAIR-01` の②で、リンクカードの台帳 (`data/ogp/link-card-rollout.json`) を今の配信物で検証し直す。台帳が古く OGP 画像 1,606 種の SHA が違うので、記事の更新が公開後の検証で `FAIL` と出る。検証を緩めない。
  2. 測り直してから `/remediate-note-published dataset-card-wording 10` を流す (1 日 10 本まで・毎回 dry-run の差分を見る)。進み具合は採点の `source_card_unverifiable` の本数で追う。
  3. 道具が `FAIL` と出した記事は、公開 API (`https://note.com/api/v3/notes/<noteId>`) の `body` に新しい文言があり `has_draft` が false かを必ず確かめる。
  4. 画像は、先に `NOTE-FIGURE-ROLLOUT-01` の試行 1 本 (`a-maximum-temperature`) でスマホ幅の見え方をオーナーが見る。次に `ranking-image-type` の 8 本。95 本は R2 の値 (`app/stats/<key>/values.json`) と記事の年から `chart-data.json` を作る手順を先に足す (`.claude/rules/note-image-assets.md` の契約 3。年を読めない記事と 47 県がそろわない指標は対象外として一覧に残す)。値の誤りは `NOTE-FIGURE-FIX-01` の道具で直す。
  5. 意味の確認 23 本は、点数が低く閲覧の多い記事から週の上限を決め、`note-critic` に該当段落と 47 県の値だけを渡す。
- **オーナーが決める**:
  - `recovered-n144d350fc14e` (沖縄の出生率) は未公開の下書きがあり道具が止まる。下書きを捨てるか公開するかを note の画面で決める。
  - 県民所得の記事 (n80e58a01f660) の本文: 「中部 9 県のうち 7 県が全国平均を上回る」は 6 県が正しい。「全国平均 2,833 千円」は単純平均。「2023 年の TSMC 進出」は年の根拠が未確認。記事は 2020 年度で、サイトは 2021 年度を出している。
  - `s47-economy` の「このテーマのデータ」カードが P-01 を指している。P-02 へ替えるかを決める (`data/note/magazines.json` の `paidProductId`)。
  - タグは中央値 99 個 (上限 100)。意図した運用かを決め、違うなら採点の項目に足す。有料記事 98 本は本文が API に出ず型の寸法を測っていない。
- **道具の癖**: `update-published-navigation.mjs` は途中で止まると下書きが残り、次の実行が止まる。文言の置き換えは dry-run の `wouldRewriteDatasetWording` で見る。
- **完了条件**: 採点が週次で更新され、59 点以下の記事が 0 本になり、「元データ」カードの扱いが決まって台帳で確かめられる。

### [BLOG-CHART-FILES-MISSING-01] 公開中のブログ本文が指す図が R2 に無い
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **証拠 (2026-11-05)**: R2 の `app/blog/all.json` の全記事を数えた。
- **未確認**: 公開ページの表示はまだ見ていない。
- **次**: 2 記事と 6 記事を本番のページで開き、図の欠けと 404 を確かめる。原因を調べ、図の再生成か一覧からの除外を決める。
- **完了条件**: 一覧の全記事に `article.md` があり、本文が指す図がすべて R2 にある。
- **追補 (2026-11-14)**: konbu-consumption-prefecture-gap は `b855b6122` で書き直した (2026-11-16 に公開した。是正キューでは clean になりキューから外れた)。公開した後に、このカードの対象からこの記事を外す。
- **統合 (2026-11-24・旧 BLOG-ALLJSON-MISSING-BODY-01)**: 2026-10-28 の本文の初回退避で、`app/blog/all.json` の 619 記事のうち 6 記事に `article.md` が無かった。完了条件「全記事に article.md がある」は同じなので、ここで 6 記事の slug を出して本番の応答と掲載理由を確かめる。

### [BLOG-PUBLISH-AUDIT-KAKEI-01] 公開後の検査が家計調査の 9 指標で落ち、送り箱の掃除が止まる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **証拠 (2026-11-05)**: `blog-auto-publish.yml` の公開後の検査が、`*-budget-share-kakei` の 9 指標で `values.json` が 404 になり失敗する。
- **次**: 9 指標を有効にした `863c80cd6` の後に値が投入されたかを確かめ、投入するか有効化を外す。`contents/blog` の公開済みの原稿が消えることを確かめる。
- **完了条件**: 公開の run が成功し、送り箱の掃除が動く。

### [BLOG-SCATTER-LABEL-SIDE-01] 散布図の県名が、点と重なる側しか試さず消える
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-05] [領域:サイト] [待ち:承認]

- **済み (2026-11-14・8b3b3363d)**: `apps/admin/lib/template-relationship-scatter.ts` が県名を、図の中央を向く側の横、反対側の横、上、下の順に試し、他の点・他の県名と重ならず枠に収まる最初の位置へ置くようになった。
- **残り**: 公開中のブログの散布図を新しい型で作り直し、R2 へ反映する。型の変更で県名の出方が変わる図が多い (git 管理下の 17 枚のうち 13 枚) ので、作り直した図のうち県名が変わったものを一覧にして目で確かめてから反映する。R2 への書き込みは CI の経路で行う。
- **止まっている理由**: R2 への書き込みは、バックログ処理の作業ツリーからは許可されていない。
- **完了条件**: 公開中の `university-advancement-capacity` の `capacity-vs-advancement-scatter.svg` に京都府・奈良県・香川県の名前が出ていて、作り直した散布図に県名どうし・県名と点の重なりが無い。

### [BLOG-SCATTER-SOURCE-YEAR-01] 散布図の source.json の年が、図の点と見出しの年と食い違う
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-28] [領域:サイト] [待ち:判断]

- **証拠 (2026-10-28)**: `safe-driving-5-features/aging-fatality-scatter` は source.json の `year` が 2023 だが、点と見出しは 2024 年の値 (図の年の取り直しの照合で発見)。
- **次**: 散布図の点を R2 と照合して年を決める関数 (`lib/refresh-chart-year.mjs`) で公開済みの散布図を一括で調べ、source.json の年と食い違う図を一覧にして直す。
- **完了条件**: 公開済みの散布図で source.json の年と点の年の食い違いが 0 件。
- **調査結果 (2026-10-28・公開 609 記事を読み取り)**: 散布図 196 枚のうち両軸の点が R2 と 95% 以上一致したのは 140 枚。うち source.json の年と一致 66・**食い違い 4**・year 無し 70 (59 は kind `correlation`)。照合できない 56 枚 (点なし 28・どの key/年とも一致しない 16・key なし 9・同じ指標の 2 年 3)。食い違いの 4 枚: `safe-driving-5-features/aging-fatality-scatter` (year 2023 → 点は両軸 2024)、`vacant-house-crisis/vacant-aging-scatter` (2023 → x 2024 / y 2023)、`fertility-fiscal-nexus/fiscal-fertility-scatter` (2022 → x 2022 / y 2023)、`housing-cost-livability-trend/rent-floorarea-scatter` (2024 → x 2024 / y 2023)。両軸の年が違う 3 枚は year 1 つでは表せない。照合関数が略した「京都」を「京」にして外していた不具合は直した (`refresh-chart-year.mjs` の `prefKey`・テストで固定)。
- **次**: ① 両軸の年が違う図の source.json の書き方 (`xYear`/`yYear` を足すか) を `blog-data-schema.md` §1.5 で決める ② 4 枚の source.json を直して R2 へ上げる (承認が要る) ③ kind `correlation` の 59 枚は `scatterAxisKeys` が `base`/`pair` を読まず、`SCATTER_SOURCE_KINDS` にも無いので年の照合と取り直しの外にある。対象に足すかを決める。

### [MUNI-FUTURE-BURDEN-DASH-01] 将来負担比率の「―」(将来負担が無い) の団体を理由つきで示し、23 区の注記も直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ] [進行中] [待ち:承認]

- **証拠 (2026-10-28)**: 健全化判断比率の「―」は「将来負担が無い (基金などが将来負担を上回る)」の意味 (東京都 別紙2 の備考 https://www.metro.tokyo.lg.jp/documents/d/tosei/13_02_223)。
- **済み (`f9d38ed036`、main に入っている)**: metric config に `absentValueReason` を足して `future-burden-ratio-city` に設定し、純粋関数 `municipalityAbsenceNote` (`packages/ranking`) が全国版と県別ページに「全国の816自治体は、将来負担が無く…このランキングに含まれていません。」
- **見送り**: 「―」の団体を 0 として順位に入れる案は、「比率 0%」と誤読されるので採らない。居ない団体の一覧表示は作っていない。
- **次**: 本番で `/municipalities/ranking/future-burden-ratio-city` と `/municipalities/ranking/future-burden-ratio-city/13000` の注記を確かめる。
- **完了条件**: 将来負担比率のランキングで「―」の団体が理由つきで表示され、23 区の注記が実際の理由と一致し、テストで固定されている。→ コードとテストは満たした。本番での表示確認だけが残る。

### [MUNI-STATIC-MAP-PILOT-01] 検索に出すページの地図を静的な画像にし、操作できる地図は noindex の別ページへ分ける試験
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **決定 (2026-10-28 オーナー合意)**: `docs/01_技術設計/03_情報設計.md`「静的な地図と操作できる地図」。検索に出すページは `packages/svg-builder` の choropleth で静的に描き、D3 の地図は「地図を操作する」で移る別ページ (noindex・sitemap 外) に置く。
- **未確認**: 表示速度が良くなるか。過去に「LCP 要素を特定せずに直して効かなかった」例がある (memory `feedback_lcp_optimization`)。
- **次 (実行順)**: ① 代表 3 URL (`/ranking/total-population`・`/municipalities/ranking/manufacturing-shipment-amount`・`/municipalities/ranking/manufacturing-shipment-amount/23000`) の PSI と LCP 要素を記録する ② 市区町村の全国地図 (1,741 区画) を静的 SVG にしたときの大きさを測る (ページの重さの予算 900KB) ③ 1 ページ種別で切り替え、前後の PSI を比べてから広げるか決める。
- **停止条件**: LCP が地図でなく、静的化で LCP・TBT とも変わらないなら広げない。
- **完了条件**: 試験した 1 ページ種別の前後の PSI と判断 (広げる・止める) がこのカードか improvement log に書かれている。

### [MUNI-DESIGNATED-CITY-WARDS-01] 政令指定都市の統合 / 分割のフラグと地図の修正を本番に出し、東京 23 区と行政区の内訳を本番で確かめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ] [進行中] [待ち:承認]

- **決定**: `docs/01_技術設計/03_情報設計.md`「政令指定都市の表示 (統合 / 分割のフラグ 1 つ)」。
- **済み (2026-10-28・develop)**: ① 地域の分類にフラグ (`resolveWardModeAreas`・`listSpecialWardCodes`。)
- **次 (承認が要る)**: ① develop→main のマージ (データブックはデプロイ時に作り直されるので、内訳はデプロイで本番に出る) ② 本番で東京都の地図 (`/municipalities/ranking/per-taxpayer-income/13000`) と横浜市のページ (`/areas/14000/cities/14100`) を確かめる。
- **完了条件**: 本番で東京都の地図の 23 区に色が付き、政令指定都市のページに行政区の内訳が出ている。

### [MUNI-KOSODATE-RANKING-01] 子育て世帯の住む市選びに向けて、子育て系の市区町村ランキングを5〜10ページ足し、8週で検索の反応を見る
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **読者の課題 / HARM**: 引っ越し・家の購入を考える子育て世帯が、近隣2〜4市のどこが子育てしやすいか決められない (M: 住居費・支援、R: 家族、H: 小児医療)。個人は払わない前提で、AdSense と無料系の導線で回収する (保険・不動産の案件は出さない)。
- **需要の証拠**: Yahoo!知恵袋に約1,737件、サジェストに「子育てしやすい市町村ランキング」。県版の子育てランキングは平均1.27位・CTR 40%。**市区町村版で同じ順位が取れるかは未検証**。
- **子カード (実行順)**: 🔴 `MUNI-PREF-RANKING-ROUTE-01` (県名×市区町村のページ・先に作る) と 🔴 `MUNI-KOSODATE-METRICS-01` (指標) → 🟡 `MUNI-KOSODATE-RANKING-01` (公開と内部リンク)。続きは `MUNI-ROUGO-CARFREE-01` (EXP-009) → `MUNI-IJU-COMPARE-01` (EXP-010)。
- **指標**: 子育て向けの 9 指標を決め、待機児童率と住環境 2 指標は 2026-11-01 に公開済み (PR #1204)。こども医療費助成は 9 割が同じ対象年齢のためランキングにしない。
- **次 (実行順)**: ② cron 生成でランキングを5〜10ページ足す ③ 県版の子育て記事・ランキングから市区町村版へ内部リンクを張る (`MUNI-KOSODATE-RANKING-01`) ④ 8週後に判定する。
- **判定 (8週)**: 該当ページの GSC 28日表示 3,000 以上、かつ1ページあたり PV が市区町村ページ平均 (44.7) 以上なら、近隣市比較ページを自動生成で広げる。下回れば止める (手作業の記事量産には移らない)。
- **ページの形**: 市単位の検索は細い (推定 月56「子育てしやすい市」) ので、「県名×市区町村ランキング」の形にする (推定 月2,320「子育てしやすい街ランキング」。調査 §8)。
- **続き**: 型ができたら、同じ型で老後 (EXP-009、車なしで暮らせる町を3ページ) と移住 (EXP-010) を同じ基準で試す。
- **関係**: 市区町村ランキングの拡充は `MUNI-RANKING-EXPANSION-01`、市区町村ページの本文は `MUNI-CITY-PAGE-SNIPPET-01`。
- **完了条件**: 8週の表示・PV が記録され、拡大・停止のどちらかをオーナーが決めた。
- **統合 (2026-11-13)**: `MUNI-KOSODATE-PAGES-01` をこのカードへ統合した。

### [MUNI-ROUGO-CARFREE-01] 老後に車なしで暮らせる町を、子育てと同じ型で 3 ページだけ試す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **打ち手台帳**: EXP-009。前提は `MUNI-PREF-RANKING-ROUTE-01` (型ができていること)。追加の能動時間は使わない範囲でやる。
- **読者の課題 / HARM**: 本人・親の老後の住まいで、車がなくても買い物・病院に行けるか (H・M)。推定検索数「老後 住みやすい街」月 384 で需要は小さい (調査 §8)。
- **指標の候補 (既存)**: `elderly-population-ratio`・`retail-store-count-per-1000`・`general-clinic-count-per-100k`・`general-hospital-count-per-100k`・`single-person-household-old-population-ratio`。公共交通は既存指標に無いので、最初は入れない。
- **次**: ① 3 ページ分の指標を決めて公開する ② 台帳 EXP-009 を running にして 8 週後に子育てと同じ基準で判定する。
- **完了条件**: 3 ページが公開され、8 週の判定が台帳にある。

### [MUNI-IJU-COMPARE-01] 移住先選び (雪・車・仕事) の市区町村比較を、子育てと同じ型で試す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **打ち手台帳**: EXP-010。前提は `MUNI-PREF-RANKING-ROUTE-01`。老後の 3 ページの後に出す。
- **読者の課題 / HARM**: 地方移住を考える人が、雪・車・仕事の条件で候補を絞れない (A・M)。推定検索数「移住 おすすめ」月 4,320、移住相談 73,003 件 (2025 年・過去最多)。JOIN・自治体広報など競合が強い (調査 §8)。
- **次**: ① 雪 (降雪日数・積雪)・車の必要度・求人の市区町村指標が取れるかを確かめる (既存の `movers-in` / `movers-out` は使える) ② 取れる指標で 3 ページ公開し、台帳 EXP-010 を running にして 8 週後に判定する。
- **完了条件**: 指標が足りずに見送るか、3 ページが公開されて 8 週の判定が台帳にある。

### [COMPARE-ADD-REMNANT-01] 送信関数を消した compare-add が、GeoAI の M1 実装仕様と計測の予定にまだ残っている
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:管理] [待ち:判断]

- **次**: M1 の計測にこのイベントが要るかを仕様の持ち主 (strategy-advisor) と決め、要らないなら catalog・m1 の eventIds・テスト・仕様の記述をまとめて外す。要るなら送信口を戻す。
- **完了条件**: M1 の計測の予定 (仕様・m1 の eventIds) と catalog が一致し、`npx vitest run --root apps/admin` が通る。

### [PPTX-RANK-ORDER-01] 商品パックの PowerPoint で「上位 10」の棒グラフの 1 位が一番下に並ぶ
タグ: [収益化] [種類:不具合] [実行:対話] [検証:npm run test:run --workspace=@stats47/product-factory] [起票:2026-10-28] [領域:商品] [待ち:承認]

- **済み (2026-11-14・b7cbbab2c)**: addBarChartSlide にカテゴリ軸の反転 (maxMin) と値軸を下に固定する指定を足し、単一指標とデータブックの出力でテストを固定した。
- **残り**: 13 パック (P-01〜P-12・P-14) の product.pptx を再生成し、Microsoft 365 PowerPoint で 1 位が一番上に並び、値軸が下に残ることを目視で確かめる。その後、note の有料記事の添付 ZIP を新しい版に差し替える (添付は 1 日 10 回まで。`project_note_attachment_upload_limits`)。
- **停止条件**: 添付の差し替えは有料商品の納品物を変えるのでオーナー承認の後。
- **完了条件**: 13 パックの PowerPoint で 1 位が一番上に並び、note の添付が新しい版に替わっている。

### [MEDIA-CODE-IMAGE-REFERENCE-01] 画像台帳でコード例の画像記法を配信画像として数えない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-27] [領域:サイト] [待ち:ログイン]

- **済み (2026-11-14・`687ec20e9`)**: inlineSvgReferences がフェンス付き・インラインのコード内の svg を数えなくなり、実際の埋込 SVG の start/end/sha256/bytes/line は元の本文基準のまま保たれる。
- **残り (R2 の認証が要る)**: `/blog/cc-estat-03-population-bar` の画像の台帳を `sync-web-image-inventory.mjs` で再生成し、本番 HTML の img の集合と照合する。
- **完了条件**: 対象記事の台帳が本番 HTML の img の集合と一致する。

### [NOTE-CIRCULATION-RECHECK-01] note→ランキング回遊の着地 session を note.com 経由で取り直す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:管理] [待ち:ログイン]

- **次**: GA4 サービスアカウント鍵のある PC で、その節の再現コマンドを /ranking/real-public-debt-service-ratio・/ranking/annual-sunshine-duration・/ranking/per-capita-prefectural-income-h27 に実行し、着地 session の合計を baseline (86/81/4 = 171、28日) と比べる。遷移先 note の view は dashboard 経路 28 日で置き直す。
- **完了条件**: `[target:]` に根拠付きの想定値を置いて improvements.md に戻すか、置けないなら本カードを削除して観測を打ち切る。起点記事 n04d95ae14bc1 の view 低下 (616 → 107) との対応も記録する。

### [STRATEGY-GATE-UNIT-ECONOMICS-01] 商品 pilot の限界利益と工数込み採算を、記録から計算して管理画面に出す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:戦略] [待ち:判断]

- **背景 (2026-10-27 の棚卸し)**: 収益化戦略 §3.4「価格と採算」は限界利益と工数込み採算の式を定めているが、計算している場所が無い。運営者の時間単価と pilot の工数上限も未決で、式に入れる値が揃っていない。
- **次**: ① オーナーが時間単価と工数上限を決め、§3.4 に書く (対話) ② `data/products/sales-ledger.json` の実売・返金・手数料と工数の記録から、商品ごとの限界利益と工数込み採算を計算して `/revenue` に出す。工数の記録先が無ければ、先に台帳 (`config/datasets.mjs` に1行) を決める。
- **禁止**: 時間単価が未決の間は工数込み採算を0や推定値で出さない (「単価未決」と表示)。
- **完了条件**: 単価と工数上限が §3.4 にあり、画面の採算が台帳の値から再計算できるテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の最後。実売が計2件・¥413 (販売台帳、〜2026-09-30) で、採算を計算しても判断が変わらないため。単価と工数上限の対話は、商品の実売が増えたときか有料 pilot を始めるときに行う。

### [STRATEGY-GATE-TABLE-01] 収益化戦略 §5 のゲート表6行の通過・未達を管理画面に並べる
タグ: [収益化] [種類:改善] [実行:sweep] [検証:npm run test -w apps/admin] [起票:2026-10-27] [領域:戦略] [待ち:判断]

- **済み (2026-11-14・43aba4052)**: `/dashboard` の「今週の判断」に収益化戦略 §5 のゲート表6行を「通過・未達・判定元なし」で並べた。
- **残り (判断)**: トラフィック拡大の行は、何をもって通過とするかが未決なので「判定元なし」のままである。選択肢は、(a) マーケティング戦略の T1〜T4 の表の閾値と KPI `site-pageviews` (`data/measurement-cycle/latest.json`) を比べて現在の段階を出す判定関数を `.claude/scripts/metrics/lib/` に作り、画面はその結果を読む、(b) この行は手順の規則であって通過・未達を持たないと決め、「判定元なし」を恒久の表示にする、の2つ。推奨は (a) で、根拠は、閾値 (月3万・10万・30万・100万 PV) と 28日 PV の実測がどちらも既に記録されており、判定関数を画面の外に置けばカードの禁止事項 (画面側で判定を作らない) を守れるからである。ただし「通過」をどの段階の達成とするかはオーナーが決める。
- **残り (判断)**: pilot ボードに合格・撤退の基準の列を出す (追記③)。基準がどの pilot カードにも収益化戦略にも書かれていないので、オーナーが pilot ごとの合格・撤退の基準を決め、`data/business/pilot-board.json` に項目を足すか収益化戦略に書く。画面はそれを読むだけにする。
- **残り**: 商品横展開と B2B基盤の行は `STRATEGY-GATE-ADMIN-PILOT-01` が判定元を作ったら、`apps/admin/lib/strategy-gates.ts` の `SOURCES` の2行をその判定につなぐ。
- **完了条件**: トラフィック拡大・商品横展開・B2B基盤の3行が判定元を持つか、持たないことがオーナーの決定として記録されている。pilot ボードの各行に合格・撤退の基準が出て、基準が台帳に無い pilot は「基準なし」と表示されるテストがある。

### [STRATEGY-GATE-ADSENSE-UNITS-01] AdSense の枠を外す基準を決め、ユニット別の数字と並べて管理画面に出す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:戦略] [待ち:判断]

- **背景 (2026-10-27 の棚卸し)**: 収益化戦略 §3.1 は「ユニット別の収益・視認率を週次で比べ、効かない枠を外す・動かす」と決めているが、外す基準 (何週続けて何を下回ったら外すか) が書かれていない。`/revenue` はユニット別 CSV (`history-units.csv`) を表示するが、判断の基準が無いので数字を見ても決められない。モバイルの手動枠の扱いも「再開後の実測で決め直す」のまま期日が無い。
- **次**: ① オーナーと基準 (例: 視認率・1,000表示あたり収益の下限と連続週数) と見直しの期日を決め、§3.1 か `manual-ad-policy.ts` に書く (対話) ② `/revenue` のユニット別表に基準を下回ったユニットの印を出す。
- **禁止**: 基準を画面側に直書きしない。基準の置き場を1か所にする。
- **完了条件**: 基準が SSOT に書かれ、画面がそれを読んで下回ったユニットに印を付けるテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の 1 番目 (AdSense 基準 → `STRATEGY-GATE-TABLE-01` → `STRATEGY-GATE-ADMIN-PILOT-01` → `STRATEGY-GATE-UNIT-ECONOMICS-01`)。`ADSENSE-PLACEMENT-01` の4週判定 (Due 2026-11-14) より前に基準を決める。
- **前提 (2026-10-27 `/revenue` で観測)**: W42 のユニット別表で 10 ユニット中 5 つが `match_status=unmanaged` (blog-inarticle・ranking-incontent-mobile・ranking-footer-multiplex・hub-incontent・content-footer-multiplex)。収益上位 2 つを含むので、コードの枠 (`code_slot`) との対応を先に埋めないとユニット別の基準を配置の判断に使えない。また W42 の前週比は停止中の W34 と比べた値 (+1712%) なので、再開前の週と比べない表示にする。

### [ADSENSE-OVERLAY-AB-01] 自動広告のオーバーレイ形式 (アンカー → 全画面) だけを、広告インテントをオフのまま 1 つずつ A/B テストし、1,000 PV あたりの収益を上げる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-28] [期日:2026-11-25] [領域:アフィリエイト] [待ち:ログイン]

- **済み**: アンカーのみのテスト (id 7866855473613169、10-28〜11-04) はパターンが優位 (可能性99.5%・収益 オリジナル64円 / パターン232円・表示8,875・月+1,427円推定) で適用済み。 (参照: PR #1251)
- **基準値**: 停止前の1,000 PVあたり収益は自動広告込み¥22・手動枠だけ¥6.7 (収益化戦略 §3.1)。スマホのランキングのCLSは0.224 (11-11・1回の測定)。
- **オーナー決定 (2026-11-11)**: 現在の設定 (アンカー・全画面・ページ内バナー・インテント オン、全画面の頻度10分) を続ける。body の `google-anno-skip` は外さず、サイドレールとMultiplexの自動広告はテストなしでオンにしない。出典書き換えのsmokeは毎週土曜05:30 JSTにも本番で回る (`post-deploy-smoke.yml`)。
- **次 (実行順)**:
  1. `data/adsense/history-formats.csv` (11-14以降) で形式別の収益を読み、全画面・ページ内バナー・広告インテントの寄与を分ける。
  2. スマホのランキングのCLSを、上部アンカーが出た回と出ない回で比べる。
  3. 1セッションあたりページ数をGA4の記録で確かめる。
  4. Cookie同意の帯をインテントのアンカーの上へ避ける修正 (`use-ad-intent-anchor-inset.ts`) を本番反映し、実物のアンカーで重なり0を確かめる。ブログ以外でアンカーが出ていないことも確かめる。
  5. 2026-11-25 に途中結果とGA4のページ数・CWVを記録する。
  6. 同じ型で全画面 (ビネット) を試す。自動適用は作成時にオフにし、`.claude/scripts/google-admin/README.md` の安全契約に従う。
- **オーナー判断待ち**: 11-04以降にサイト設定がパターンと違う形に広がった経緯の確認。インテントの文言の関連の弱さと、スマホ上部アンカーが画面の約半分を占める件を踏まえて続けるか。
- **判定**: パターンの1,000 PVあたり収益 (`ad-yield`・GA4 PVが分母) がオリジナルを上回り、1セッションあたりページ数とエンゲージメント率が-5%以内、ランキング詳細のCLS・LCPが悪化しないこと。勝っていても条件を外れれば「オリジナルを選択」で終える。
- **停止条件**: 出典の書き換えが1件でも出たら即オリジナルに戻す。ページ数が-5%を超えて落ちたら止める。管理画面でリンクが再びオンなら即 `isAdIntentAllowedPath` を常にfalseへ戻す。週次レビューで管理画面の3つの形を読む。
- **別件**: ブログ記事で `<div>` が `<p>` の子になるhydration警告 (広告枠が段落内に入る) が出る。本番で同じかは未確認。
- **完了条件**: アンカーと全画面の2テストの結果 (1,000 PVあたり収益・ページ数・CWV) が記録され、適用するかの判断が収益化戦略 §3.1 に書かれている。
- **観測 (2026-11-23・PC で自動広告がほぼ出ない件)**: 原因はサイトのレイアウトや実装ではなく、Google が stats47 の PC に自動広告の設定を配っていないこと。`adsbygoogle.js?client=ca-pub-9055416085403520` を PC の UA と stats47 の Referer で取ると、末尾の埋め込み設定が `["ca-pub-…",null,1,null,[null,null,null,1],…]` (配置・形式・広告量が空) になり、スマホと iPad の UA では配置と形式 `[1,3,2]`・広告量 `[0.5,null,2,8,480,1]` が入る。4 回とも同じ。doboku-note (`ca-pub-8504035087322664`) は PC でも設定が入る。curl は DOM を読まないので、ページの作りでは変わらない。本番を同じブラウザの 1440px で開くと、stats47 は全画面 (`data-vignette-loaded`) だけが読み込まれ、アンカーの `ins[data-anchor-status]` と本文の自動挿入は 0、アンカーの広告要求も出ない。doboku-note は同条件でアンカー `displayed` と本文 1 枠。html/body の overflow は visible、スクロールはウィンドウ (`scrollingElement` の高さ 3,371px)。
  - **再現**: `curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36" -e https://stats47.jp/ranking/total-population "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9055416085403520" | tail -c 300` (UA を Android にすると設定が入る)
  - **次 (オーナー・管理画面を読むだけ)**: [仮説] 10-28〜11-04 のアンカーのテストの適用か、その後の設定の広がりが PC に効いていない。自動広告 > stats47.jp の編集画面のプレビューを PC 表示にしてアンカーと本文の広告が出るか、URL グループに stats47.jp の全体や PC を外す設定が無いか、「テスト」に進行中・適用済みのパターンが残っていないかを見る。期日 2026-11-25 の途中判定で、上の curl が PC でも設定を返すかを再観測する。設定を保存し直すかは収益の判断としてオーナーが決める。
  - **補足 (2026-11-23 再調査)**: 5 ページ × 3 回と Windows の UA でも PC は全部空。旧アカウントの W31〜W33 も PC のアンカーは週 10〜30 表示で、10-28 のテストより前から PC だけ少ない。設定は Google がページを解析して作る (スマホの設定には `SECTION#theme-indicators` などの配置が入る) ので、PC のページの作りが Google の判断に効いている可能性は消えていない。見込み: スマホの 1 PV あたりの自動広告 (W46 アンカー 0.82・本文 1.30 表示) を PC の 7,840 PV と PC の実測単価 (アンカー ¥44・本文 ¥17〜28 / 1,000 表示) に当てると週 +¥460〜570、PC の 1,000 PV あたり ¥35 → ¥93〜107。
  - **管理画面の確認 (2026-11-23・オーナー承認で読み取り)**: stats47.jp の設定は自動広告・自動最適化ともオン、除外ページ 0 件、アンカー・全画面・PC のアンカー・PC の全画面・ダイナミックアンカーがオン。Desktop のプレビューでは下部にアンカーが出る。テストは 2 件とも終了 (アンカーのテストはパターン適用済みでパターンも PC のアンカーがオン、広告インテントはオリジナル選択済み)。値を変えずに「サイトに適用」は「何も変更されていません」で保存されない。同日の curl も PC は空のまま。管理画面の設定と配信が食い違うので、Google 側の判断として扱う。
  - **次**: AdSense のヘルプへ curl の結果を添えて問い合わせる (オーナー)。並行して、支払い保留の原因の住所確認 (11-13 に PIN を郵送済み・2〜4 週間で届く) の PIN を入力する。
- **オーナー判断 (2026-11-16)**: 上部アンカーが画面上部を覆う UI 指摘 (`UI-FIX-GEO-ANALYSIS-LAYER-20261114`。/geo/layers/population-mesh の tablet-768) は、今は管理画面のアンカーも `/geo/layers` の広告も変えない。2026-11-25 の途中判定 (次の 2・3・5: アンカーが出た回と出ない回のスマホのランキングの CLS、1 セッションあたりページ数) で判定条件を外れたら、管理画面で上部アンカーを切る。`/geo/layers` だけを広告なしにする案は採らない (閲覧は W45 で週 約 100 PV・全体の 0.15% で効果が小さく、`ad-free-paths.ts` は GIS 台帳の利用条件から決める仕組みで、見た目の理由の手書きを入れないため)。

### [TRACKED-SECRET-FILE-CHECK-01] 秘密情報らしい名前の追跡ファイル 2 本に、本物の秘密が入っていないかを確かめる
タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [起票:2026-10-26] [領域:管理] [待ち:判断]

- **事象 (2026-10-26・GITIGNORE-AUDIT-01 の点検)**: `.claude/config/auth-credentials.json` と `apps/web/.env.development` が git で追跡されている。
- **次 (オーナー)**: 2 本を開き、パスワード・API キー・トークンの値そのものが入っていないかを確かめる。名前・置き場所・期限だけなら問題なし。値が入っていたら、その鍵を失効・再発行し、ファイルから値を抜いて追跡を続けるか ignore するかを決める。
- **完了条件**: 2 本に秘密の値が無いことを確かめた、または入っていた鍵を失効させて値を取り除いた。

### [OGP-RANKING-CARD-BLOG-REPAIR-01] ranking カード画像の残り 1,459 件の作り直しと、ブログ OGP の週次自動修復を止めている 1 記事の背景記録を直す
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-26] [領域:サイト]

- **済み**: ランキングカードWebPは読み手が無かったので生成・週次修復・監査を止め (`990e1d6b9`、2026-11-14)、ranking分の作り直しは不要になった。
- **残り1 (ブログOGP)**: `app/blog/aging-rate-akita-vs-okinawa/ogp/generation.json` に `stats47-sha256` が無く、「R2 AI背景画像契約がmanifestと一致しません」でブログ全体の週次自動修復が止まる。この1記事の背景の記録を正す。
- **残り2 (リンクカード台帳のずれ)**: 2026-11-11 の実測で、台帳 (`data/ogp/link-card-rollout.json`・`link-card-sites-NNN.json`) の site-ogp 3,197種のうち1,606種が配信物のSHAと違い、1,591種が同じ。`record-site` はどのworkflowからも呼ばれず、週次の作り直しで台帳が置き去りになる。このためnote更新の道具が `Verified source image bytes changed` で失敗を表示する。
  - 先に `gh run view 42295351706 --log-failed` で週次OGP image audit の失敗 (10-30 run 41122877579・11-06) の中身を読む。
  - `link-card-production.ts` に `resync-site [--dry-run] [--limit N]` を足す。git台帳だけを書き、配信中のmanifestを `manifestKey` ごとに1回取り、`kind`・`schemaVersion`・`variant: "ogp"` の `key` が `imageKey` と同じかを確かめる。違うentryだけ `?v=<sha256>` で画像を取り、SHAと1200×630を確かめてから `sitePublication` を書き換え、1件でも合わなければ一覧を出してexit 1にする。
  - runを確かめられない記録に `runUrl` を書かない。`runUrl` を任意にし `source: "live-manifest"` と `generatedAt` を持たせる案で、`Entry`・`link-card-ledger.mjs`・`.d.mts`・`runUrl` の読み手を同じ差分で直す。テストは `.claude/scripts/ogp/__tests__/` に足す。
  - `quality-suite-weekly.yml` の作り直しの後に同じサブコマンドを流し、台帳の差分をdevelopへ書き戻す。
  - そのあとnoteの残り102本を流す。台帳のSHAが変わると `s47_ogp` の版も変わり、本文のカードURLが書き換わる前提で差分を見る。
- **保留 (2026-11-11 オーナー判断)**: 別セッションの台帳整理が済んでから②を始める。再開時は `data/ogp/` と `.claude/scripts/ogp/lib/link-card-ledger.mjs` の形が変わっていないか先に確かめる。
- **確かめ方**: `--dry-run` の件数が11-11の実測 (違う1,606・同じ1,591) と大きく違わない。書いた後に `node .claude/scripts/note/update-published-navigation.mjs --slug recovered-n581a1409b2c9` (dry-run) を流し、トップ・`/ranking/final-education-university-graduate-school-ratio`・`/blog/university-advancement-capacity` のカードで公開後の検証が落ちない。
- **完了条件**: ブログのサムネイル工程が週次で成功し、リンクカード台帳が配信物と一致している (ranking分の条件は `990e1d6b9` で不要になった)。

### [BLOG-AUTOMOTIVE-BIRTHDEATH-FOLLOWUP-01] 自動車産業の記事の題名と中身のずれ、出生と死亡の記事に残る critic の MAJOR 6 件を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-26] [領域:サイト]

- **automotive-industry-transformation-map**: 輸送用機械の県別の図 4 枚を e-Stat から取り直せず外し、全業種合計の製造品出荷額で書き直したため、本文に自動車の数値が無く、題名「自動車産業の県別勢力図」とずれる。CI の app id で輸送用機械の県別出荷額を取り直すか、題名と背景画像を作り直すかを決める。
- **birth-death-gap-decline**: critic の MAJOR が 6 件残る。うち 2 件は全国値 1.20・50 歳時未婚割合・婚外子 2% 台の出典が R2 に無く未確認。
- **完了条件**: 2 記事で上の点が解消し、`quality-gate.mjs` が blocker 0・critic PASS。

### [KDP-COVER-47PREF-DECISION-01] Kindle の表紙で「47都道府県」を読める大きさに上げ、2 冊で試してから全冊へ広げるか決める
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-09] [領域:商品]

- **観測 (2026-11-13、Kindle ストアの検索結果)**: 自社 S1 12 冊は最大の文字が「地図」で、「47都道府県」は最も小さい帯。
- **決定 (2026-11-13 オーナー承認)**: 「47都道府県」を最大にはしない (12 冊の区別がつかなくなるため)。主題の語を最大にし、上部の共通の帯「47都道府県のデータで比べる」を 2 番目に上げる。見本はセレクト登録の K-S1-05 と K-S1-13。
- **次**: ① `cover-design.ts` の 2 冊に新しい序列の文字を定義する ② Codex で候補を作り Drive へ置き (`stash-cover-candidate.mts`)、文字を 1 字ずつ照合する ③ `kdp-cover-thumbnail.mjs render` で 120px / 220px に縮めて記録する ④ オーナー承認後に R2 へ反映し、新しい版を保全して `kdp-publish --update` ⑤ 4 週後に検索順位と既読ページで残り 11 冊へ広げるか決める。
- **判定の限界**: KDP の販売は台帳に 2 冊だけで、販売数では表紙の効果を判定できない。K-S1-13 の表紙を変えると EXP-011 と変更が重なる。
- **K-S1-13 の縮小確認 (2026-11-14)**: 120px で副題が読めず `unreadable` と記録 (`kdp-cover-thumbnail-checks.json`)。このままでは次の更新が `kdp-publish --commit` で止まるので、作り直しで取り直す。
- **停止条件**: 表紙の差し替えは KDP への外部変更で、オーナー承認の後。差し替えたら縮小確認を取り直す。題名は公開後に変えられないので (`KDP-LISTING-COPY-01` の停止条件)、題名・副題に「47都道府県」を足す変更はしない。
- **完了条件**: 見本 2 冊の縮小確認の記録があり、KDP へ反映するかをオーナーが決めた。反映した場合は 4 週後の検索順位と既読ページを記録し、残り 11 冊へ広げるかを決めた。

### [NOTE-INS-IMG-HEADING-PLACEMENT-01] ins_img が見出し直前の段落をアンカーにすると画像が見出し直後へずれる
タグ: [種類:不具合] [実行:対話] [起票:2026-09-16] [領域:商品] [待ち:ログイン]

- **owner**: 未定
- **問題**: `.claude/scripts/note/editor-helpers.sh` の `ins_img` は、アンカー段落の「次の `<p id=>`/`<li>`」を挿入位置にするため、アンカー段落の直後が見出しだと画像が見出しの直後 (1 ブロック先) にずれる。2026-09-16 に b-kakei-* 8 本で `audit-note-figure-split.mjs` の misplaced 14 枚として発覚 (正しい画像なので公開は維持)。
- **試して失敗した案**: アンカー段落自身をクリックして段落末尾で Enter する変更は `b-kakei-necktie-decline` で misplaced が 1→2 に悪化して撤回した (原因未特定)。
- **次**: `BU state` の生ダンプ (`/tmp/ns.txt`) を見出し前後の段落で目視してから awk の抽出条件を組み直す。ライブの note エディタで最低3パターン (見出し直前 / 見出し無し / リスト直前) を実地検証してから全 note 記事へ展開する。
- **禁止**: ライブ DOM の実物を見ずに正規表現だけを推測で直さない (今回の失敗の再発)。
- **完了条件**: 見出し直前アンカーを含む記事で `audit-note-figure-split.mjs` の misplaced が 0。

### [KABEUCHI-AGENT-01] サイトと収益化をエージェント相手に「公開壁打ち」できる型を作り、1回目をやる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:戦略] [待ち:判断]

- **やりたいこと**: 運営者が相談者になり、エージェントを壁打ち相手（発想を広げる役）にして、stats47 のサイトと収益化の悩みに1時間で「その手があったか」を出してもらう。参考は GO 三浦崇宏×SHOGUN BURGER の公開壁打ち（The Solutions・2026-10-20 配信 https://pody.jp/player/IYyZ3oo32EztDR6WbOCS/YHBVBosHdRX59xygXsiM）
- **型（案）**: ① 悩みを2つまで聞く → ② 前提を読む（GA4・GSC・販売実績・共通事業方針・既存の戦略文書）→ ③ 第一印象を先に言う → ④ 質問で3〜4往復掘る → ⑤ 勝ち筋を4〜6個、すぐ試せる順に出す（各案に「読者の課題／HARM／支払う理由／需要の証拠か未検証／次の検証」）→ ⑥ 記録し、やると決めた案をカード起票
- **相手役（案）**: 発想を広げる役のほかに、収益の一手を断定する役・「それにお金払う？」と突っ込む読者役を並べるパネル形式も試す
- **完了条件**: 1回目を実施して記録が残り、型をスキル化するか（毎回呼べる形にするか）を決めている
- doboku-note にも同じカードを起票済み（同時に回す）

### [MODEL-USAGE-COVERAGE-01] エージェントの利用記録を Windows と CI の無人実行まで広げ、4 週分たまったら統合候補を決める
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **背景 (2026-10-20 実測)**: エージェントの定義は 61 体ある。
- **次**: ① Windows で `.claude/scripts/model-usage/collect-local-usage.mjs` の記録が空になる原因を直す ② CI の無人 Claude (improvement-cycle など) の起動も同じ形で記録する ③ 4 週分たまったら、起動 0 回の体を統合候補として一覧にし、オーナーが決める。
- **停止条件**: 記録が 4 週分そろうまで、エージェントの定義を消さない。系統は残し、系統の中の重複だけを減らす (2026-10-11 オーナー判断)。
- **完了条件**: 3 環境の 4 週分の記録があり、統合候補の一覧とオーナーの判断が出ている。
- **追記 (2026-10-27)**: 管理画面 `/ops/agents` は週ごとの推移を TrendChart で出せない。`apps/admin/lib/server/agent-models.ts` の `UsageReport` が週別の値を持たないため。記録が 4 週分そろったら週別の配列を足し、`/ops/agents` にチャートを置く (`.claude/rules/admin-ui.md` の規約: 3 点以上の時系列はチャート)。
- **追補 (2026-11-22)**: `config/model-pricing.json` に `claude-fable-5-2` と `claude-haiku-5-5` の単価が無い (このセッションで Fable 5.2 を使った)。料金ページの読み取りでは Haiku 5.5 が 10 万トークンを境に単価が変わる段階料金で、`costOf` は段階に対応していない。Sonnet 5.5 の cache read もページ 0.10・表 0.2 と食い違って見えた (要約経由の読み取りなので、表を開き直して確かめてから直す)。`latestModels` は 11-22 に fable-5-2・haiku-5-5 へ直した。
- **棚卸し (2026-11-22)**: `config/model-pricing.json` に Fable 5.2 と Haiku 5.5 の単価を公式ページ (platform.claude.com の pricing、11-22 取得) から足し、Sonnet 5.5 のキャッシュ読みの単価を 0.1 に直した。Haiku 5.5 は 10 万トークン超の応答で単価が上がるが、`costOf` は合計で換算するので段階に対応できず、超過分を安く見積もる。応答ごとに換算する改修と、①〜③ (Windows・CI の記録、4 週後の統合候補) が残る。

### [X-METRICS-WEEKLY-RECORD-01] X の指標を週次で記録する定期実行を作り、管理画面を読みに行く操作を止める hook の対象に X を加える
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:SNS]

- **背景 (2026-10-20)**: Instagram の指標は週次の CI (`sns-metrics-weekly.yml`) が記録するが、X の指標は `/update-sns-metrics --platform x` が browser-use でその都度取るしかない。
- **次**: X の指標を週 1 回 (認証付き計測と同じ土曜の Mac) で `data/sns/metric-snapshots/` に記録し、`.claude/scripts/measurement/sources.mjs` の `readUrls` に X の分析画面を足す。
- **完了条件**: X の指標が週次で記録され、セッションがブラウザで取りに行く必要が無くなっている。

### [MONETIZE-BROAD-ROLLOUT-01] 収益の打ち手 12 本を先に広く並走させ、4 週の配置別 CTR・成約・ad-yield で絞る (2026-10-19 オーナー指示「まず広く展開してから絞る」)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2026-12-31] [領域:アフィリエイト] [待ち:判断]

- **方針 (10-19 オーナー指示)**: 母数の無い打ち手を先に落とさず、12 本を「案件 × 位置 × 4 週」の表で並走させ、絞る規則を先に決める。本番反映 (B1・B5・C1・C2) は 1 回のデプロイにまとめる。
- **保留 (10-19 オーナー判断)**: アフィリエイトの追加 (B1〜B5・C3) は PV が伸びるまで保留する。申請済みの A8 21 件と三井住友カード NL は承認待ち。先に `PV-100K-LEVERS-01` #1 (`SEO-CTR-CANDIDATES-01`) を進め、再開は 11 月の `/monthly-plan` で W41 比の 28 日 PV を見て決める。
- **打ち手 (判定指標 / 実行カード)**:
  - A1 AdSense 手動枠を全面 (11 ユニット) へ戻す: ad-yield (円/1,000 GA4 PV) 4 週 / `ADSENSE-PLACEMENT-01`。
  - A2 自動広告の再開 (出典の書き換えの遮断を `third-party-dom-injection` smoke で確認してから): 同上と書き換え再発 0 件 / `ADSENSE-OVERLAY-AB-01`。
  - A3 表示率の改善 (遅延読込の位置・first-view の 1 枠): imp/GA4 PV・視認率 4 週 / 新規。
  - B1 消費量上位 40 品目に楽天・Amazon の商品カード: 28 日でクリック 50 以上・成約 1 以上 / `AMAZON-ASSOCIATE-PILOT-01`。
  - B2 特産のランキングにふるさと納税の返礼品リンク: 配置別 CTR 4 週 / vertical `furusato`。
  - B3 引越し・旅行・移住を住みやすさ・子育てのランキングに限定: 配置別 CTR 4 週 / `AFF-INTENT-FALLBACK-STOP-01`。
  - B4 金融を家計・所得面に限定: 同上 / `AFF-SMBC-NL-01`・`AFF-A8-EXPANSION-2026-10`。
  - B5 サイドバー・ネイティブ枠を本文中・市区町村面へ移す: 位置別 CTR 4 週 / `AFF-SLOT-REDUCTION-01`。
  - C1 ランキング末尾の「作り方」から note 有料へ (済): `nav_surface=ranking_making_of` のクリックと商品ページ到達率 / `RANKING-MAKING-OF-LINK-01`。
  - C2 データ DL 後の商品導線: 商品ページ遷移率 / `PRODUCT-FUNNEL-DEPLOY-01`・`NOTE-KML-FUNNEL-01`。
  - C3 Kindle 既刊 12 冊への導線: KDP 販売数 4 週 (計測の再認証が前提) / `KDP-LEDGER-AUTO-01`・`AMAZON-ASSOCIATE-PILOT-01`。
  - D1 県別データの引用・埋め込みページと問い合わせ口: 問い合わせ件数 8 週 / 新規。
- **絞る規則**: ① 全件を `data/affiliate/ga4-affiliate-history.csv` に位置別・vertical 別で 4 週記録する。② 表示 2,000 以上で CTR 0.2% 未満かつ成約 0 の組は止め、0.2% 以上は `AFF-OFFER-ROTATION-01` の 2 週ローテで続ける。③ AdSense は `ADSENSE-PLACEMENT-01` の基準値の後、ad-yield ¥15/1,000 PV を境に A2 を入れるか A1 だけかを決める。④ 商品導線 (C) は商品ページ到達率で判定し、1% 未満の面は外す。⑤ 表示 2,000 未満は `insufficient-sample` で次の 4 週へ持ち越す。
- **停止条件**: 出典の文言の広告リンクへの書き換えが 1 件でも再現したら A2 を即停止する。広告・導線を全ページに一括で出さない。PR 表記は `affiliate-ads-standards.md` に従う。年収などテーマ名から購入意図を推定しない。
- **完了条件**: 12 本それぞれに開始日・面・位置・4 週の表示/クリック/成約 (または到達率)・続行/停止が記録され、絞った構成が `02_収益化戦略.md` §3 と `improvements.md` へ渡っている。12-31 の `PV-PLAN-REVIEW-2026Q4-01` で見直す。

### [NOTE-CIRCULATION-LINK-FIX-01] note 公開記事のリンク切れ 5 件と導線の欠けを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-18] [領域:SNS] [待ち:ログイン]

- **事象**: note 回遊の週次監査 (`npm run weekly:audits -- --only note-circulation`) でリンク切れ (`broken_site_link`)・http リンク・リダイレクト・無料部分のマガジン導線の欠け (`missing_magazine_link_in_free_body`)・カード前後の余分な空段落 (47記事・175件、`data/note/card-visibility-latest.json`) が出ている。
- **済み (2026-11-15・オーナー承認)**: 置換表の切れたリンクは公開本文ですべて置換済み (11-15 の監査で broken_site_link 0 件、10-30 は 4 件)。
- **残り (note の 403 が解けてから)**: 次の 7 件を `node .claude/scripts/note/update-published-navigation.mjs --slug <key> --repair-redirects --repairs-only --commit` で直す: `d-kakei-spending-personality` (中華麺を外食のラーメン `ramen-dining-consumption-expenditure` へ。記事台帳に積み済み)・`13-fiscal-peer-no-code` (http)・`c-engel-food-gap`・`c-kita-kanto-fiscal`・`c-tokyo-vs-osaka-fiscal`・`d-education-income-gap`・`recovered-n03844512d58a`。後ろの 5 件はカード画像の検証ガード (`Verified source image bytes changed`) で PUT 前に止まった。[仮説] `ogp.inventory` の `link-card-rollout.json` の画像ハッシュが古い。検証: 同じコマンドをもう一度実行し、ガードの出力にある期待と実際の SHA を比べる。
- **判断**: `d-kakei-spending-personality` の `frozen-gyoza` は置換先の `gyoza-frozen-consumption-expenditure` の定義が「冷凍品を除く」で意味が逆。冷凍ぎょうざの指標は無いので、リンクを外すか文を直すかを決める (リンクを外す機能はスクリプトに無い)。
- **済み (2026-11-13〜15)**: 置換表のリンク切れ 4 記事 (`d-engel-coefficient-income`・`d-kakei-spending-personality`・`koumuin-shigoto-kouritsuka-ai`・`b-hotel-rooms-nara`) を公開本文で置換し、`replace-url` の前方一致の誤置換を `includesExactUrl` で直した。道具は `node .claude/scripts/note/update-published-navigation.mjs --slug <key>` (既定 dry-run・`--commit`・http と転送は `--repair-redirects`)。会社の Windows PC では memory `proxy-preload-for-fetch-scripts` の preload を付ける。表示の `FAIL Verified source image bytes changed` はリンクカード台帳の古さで、公開は済んでいる (`NOTE-PUBLISHED-AUDIT-01`)。
- **R2 の原稿は未追従**: 4 本の公開 R2 の `draft.md` は旧リンクのまま (この道具は R2 を書かない)。R2 に書ける環境で `npm run note:article -- checkout <key>` → リンクを同じ置換で直す → `save <key>` で合わせる。
- **失敗して止めた 3 本 (2026-11-13 夜)**: `c-engel-food-gap`・`c-tokyo-vs-osaka-fiscal` は「記事編集画面を確認できません: editor=0」、`c-kita-kanto-fiscal` は「更新APIが発火しません (status: sending)」。同じ時間帯に公開 API の読み戻しでも接続タイムアウトが出ており、通信が不安定だった。3 本とも公開版は変わっていない (`http://stats47.jp` が 1 か所のまま)。`c-kita-kanto-fiscal` には未公開の下書きが残った (`has_draft: true`。破棄は `NOTE-OWNER-ACTIONS-01`)。変更は `http://` → `https://` の 1 か所だけで、台帳の登録は要らない (`--slug <key>` で流せば正規化される)。
- **見送った 2 本**: `d-education-income-gap` は転送リンクがテキストでなくリンクカード 2 枚の `data-src` で、URL を替えると note 側のカードの登録のやり直しが要る。今のリンクは 301 で正常に開けるので、カードを扱う修復 (`replace-card` か `regenerate-card`) にするかを決めてから行う。`recovered-n03844512d58a` (`/blog/food-expenditure-ranking` → `/blog/food-spending-pattern`) は家計・所得のマガジンの記事で、流すとフッターと旧文言の置き換え・データ商品のカード (11-13 に P-02 へ変更) も同時に入るので、`NOTE-PUBLISHED-AUDIT-01` の旧文言の束と一緒に流す。有料の `12-fiscal-peer-comparison`・`13-fiscal-peer-no-code` にも `http://stats47.jp` が 1 か所ずつある (11-07 の監査。承認済みの置換案に入っていないので未着手)。
- **次**: 通信が安定している時間に、`c-engel-food-gap`・`c-tokyo-vs-osaka-fiscal` を 1 本ずつ流す。`c-kita-kanto-fiscal` は下書きの破棄の後。1 日 10 本以内。2 本続けて止まったらその日は止める。判定は道具の表示ではなく、公開 API の本文と `has_draft` で行う。
- **`recovered-nf5b4ced7a736` は台帳でなく本文が違う (2026-11-13 に公開本文で確認)**: 題名は「10歳以上」で台帳の行き先も `…-10plus` だが、本文のリンクとカードは `/ranking/volunteer-activity-annual-participation-rate-15plus` を指している。両方のランキングは本番で HTTP 200。台帳は直さない。本文のリンクを `-10plus` へ替えるかはオーナーの確認待ち (11-13 に承認された置換案には入っていない)。
- **完了条件**: 週次監査の note-circulation で `broken_site_link`・`non_https_site_link`・`redirected_site_link`・`missing_catalog_site_target` が 0 件 (Issue #1149 は手で閉じる)。マガジンへのリンクが無料部分に無い警告 109 件と、有料記事の無料部分の不足 16 件 (`d-geo-*` 5 本。画像が要る) はこのカードの対象外。

### [SSDS-YEARFORMAT-SOURCE-01] SSDS の指標生成器が年の区切りを一律「年度」で書くのをやめ、出典の期間から決めて検査で止める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-21] [領域:データ]

- **済み (2026-11-14・`e21739f37`)**: 年度で呼ぶ 4 調査 (学校基本調査・学校保健統計調査・児童生徒の問題行動・不登校等生徒指導上の諸課題に関する調査・建設工事施工統計調査) と、年で呼ぶ都道府県地価調査を surveyNaming に足した。
- **残り 1**: 判定できない 136 指標 (`data/estat/ssds-year-format/decisions.json` の undetermined)。件数の多い調査は、市町村税課税状況等の調 (7月1日) 16 件、全国家計構造調査と全国消費実態調査 計 32 件、地方公共団体定員管理調査 (4月1日) 8 件、完全生命表・都道府県別生命表 8 件、選挙結果調 8 件。調査の表題での年の呼び方を一次資料で確かめて surveyNaming に足す。呼び方が暦年だと、いま fiscal の指標 (地方公共団体定員管理調査の 8 件など) は calendar に変わるので、その指標を読む取り込みスクリプトのテストも回す。
- **残り 2**: 市区町村の指標 total-area-prefecture-ratio (#B01101) は、市区町村の表の項目名が「総面積（都道府県面積に占める割合）」で、都道府県の指標「面積割合（全国面積に占める割合）」と分母が違う。市区町村の指標の計算式は公開ページに無いので、yearFormat は fiscal のまま判定していない。基礎項目を確かめられる一次資料が見つかれば決める。
- **残り 3**: 統合元の完了条件「S1-01 の 9 slug で定義シートの期間の型が本文と一致する」は、1 slug (real-disposable-income-reversal) でしか確かめていない。残りの 8 slug を確かめる。
- **完了条件**: undetermined がさらに減り (上限の定数も同じ数に下げる)、`npm run estat:ssds-year-format:check` と `node --test .claude/scripts/lib/__tests__/ssds-year-format.test.mjs` が通り、S1-01 の 9 slug すべてで定義シートの期間の型が本文と一致する。

### [YEARFORMAT-REFLECT-01] 年表記を直した 410 指標を R2 と記事・AI 解説・書籍へ反映する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ] [待ち:承認]

- **背景**: 2026-10-21 に 410 指標の `yearFormat` を fiscal → calendar に直した (develop のコミット `06316dc21`・`a21c4586a`・`5e72aa59a`。)
- **次**: ① main へマージした後、変わった指標の `ranking-values` を作り直す (`gh workflow run sync-snapshots.yml --ref main -f only=ranking-values -f ranking_keys=<最大50件>` を分けて実行するか、月次の data-refresh を待つ)。数件を curl で読み、`yearName` が「年」で終わることを確かめる。② 公開済みのブログ・ランキングの AI 解説 (`app/ranking/<key>/ai-content.json`)・note・Kindle の本文で、これらの指標に「◯年度」と書いた箇所を洗い出し、出典の期間に合わせて直す (ブログは公開記事の差し替えになるのでまとめて 1 回)。
- **観測 (2026-11-14)**: 公開 R2 の values.json で、暦年の `annual-income-per-household`・`consumption-expenditure-multi-person-households-per-month`・`penal-code-offenses-recognized-per-1000`・`certified-childcare-center-count-per-100k-0-5` の yearName がまだ「YYYY年度」だった。
- **完了条件**: 410 指標の R2 の `yearName` が「年」で終わり、本文の「年度」表記の食い違いが 0 件か、直さない理由が記録されている。
- **統合 (2026-10-26 オーナー判断): `BLOG-FISCAL-YEAR-LABEL-REGEN-01`** 年度の指標なのに図の見出しが「YYYY年」になっている公開済み 193 記事を作り直す
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 5 行のうち 3 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[BLOG-FISCAL-YEAR-LABEL-REGEN-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: ② 296 件の data JSON と図を作り直し、ブログの公開経路 (contents/blog → CI → R2) で出す。
  - **完了条件**: 年度の指標を使う公開記事で、図の見出しが「YYYY年度」になっている (件数を再集計して 0 件)。
- **範囲の追加 (2026-11-14)**: `d8db2df63` で calendar に直した 12 指標も対象に足す。表示 (「◯年度」から「◯年」) は R2 の再生成後に変わる。これらを「◯年度」と書いているブログ・note・商品の本文があるかは調べていない。

### [THEME-DETAIL-CLIENT-PRELOAD-01] テーマ詳細が全テーマの client 部品を先読みしている (約 2,267KB) のを、route 別に分ける
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-14]

- **観測 (2026-11-14・ANALYZE 付きの本番ビルド)**: `/themes/[themeSlug]` が tsunami-exposure 108KB など全テーマの client 部品を先読みしている。 (参照: d610a337d)
- **次**: テーマごとの部品を dynamic import で分ける案の効果を route 別に数えてから着手する。
- **完了条件**: テーマ詳細の先読み JS が減り、前後の内訳が改善ログにある。増えた route が無い。

### [NOTE-KML-FUNNEL-01] note の KML 記事の末尾を、stats47 の地図用ダウンロードへの案内に替える
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **済 (2026-10-18)**: 本文に stats47 の KML ダウンロードの節を足し、有料カード 3 枚と GIS 入門のカードを外して H-02 のカードにした (PUT `free_body` の差し替えのみ、添付・画像は再アップロードなし)。R2 の原稿 (draft.md) も同じ差分で保存した。
- **次**: ① 反映日 (2026-10-18) から 4 週の note → stats47 の送客 (`utm_source=note`) を測る ② 本文で配っている `総人口_2023.kml` の出典表記 (境界の国土数値情報) を確かめる ③ H-01 が公開されたら次に読む記事を H-01 にするか決める。
- **再発の注意**: `update-published-navigation.mjs` を `--all-free` やこの記事の `--slug` で回すと、同じ無料マガジン (koumuin-gis) の有料記事カードを `chooseDatasetArticles` が付け直す。この記事を除外する仕組みは無いので、回す前に対象から外す。記事台帳の `nextBestArticle` もあわせて設定する。
- **停止条件・禁止**: note の編集はオーナー承認の後 (操作は保存済みセッションで agent が行う)。有料記事への導線は外すだけで、記事自体は消さない。
- **完了条件**: 末尾の案内が替わり、4 週の note → stats47 の送客 (`utm_source=note`) を記録した。
- **棚卸し (2026-11-22)**: GA4 の snapshot の note.com からの流入は W42 369・W43 389・W44 369・W45 342・W46 323 セッションと単調に減っている。ただし snapshot に `utm_source` の列が無く、KML 記事の分を切り分けられない。次は GA4 API で `sessionSource`・`sessionCampaignName` 付きの 4 週分を取り、R2 の原稿で KML の出典表記を確かめる。

### [NOTE-HOWTO-SERIES-01] 操作手順の連載 (H シリーズ) の 1・2 本目を書いて公開する
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-17] [領域:商品] [待ち:承認]

- **企画**: `docs/30_note記事企画/backlog/H-howto-maps-data.md` (8 本)。
- **済み (〜2026-10-28)**: H-02 (CSV 文字化け) は公開済み (https://note.com/stats47/n/nc884a0a01b71)。
- **#3 QGIS (`h-howto-qgis-choropleth`) 原稿完成・未公開 (台帳 status draft)**: 画面 10 枚と原稿を R2 に保存済み。**残り**: ① カバーを Codex imagegen で作る (`.claude/rules/note-image-assets.md` の制作 ID 経路) ② note-critic ③ 新規公開 (`publish-new-note.sh` は Mac の Chrome Profile 5 前提)。公開後は H シリーズの基準 (28 日で閲覧 190 以上) で有料の続き (港湾・人口増減・財政の地図) を作るか決める。
- **完了条件**: 2 本が公開され (済み)、28 日の閲覧・note 内の表示・stats47 への送客を記録した。0 件なら 0 件と書く。QGIS の記事は note-critic が PASS してから、公開をオーナーが判断する。

### [GSC-SITEMAP-LASTMOD-01] サイトマップ掲載条件と実更新日時の整合を検査する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-12-12] [領域:サイト]

- **済み**: `/geo/history/*` 166 件をサイトマップへ載せた (PR #1249、本番 `/sitemap/0.xml` で確認)。
- **残り (GSC 案 17・18)**:
  1. ランキングの `lastmod` の出所を決める。今は 2,596 件すべてが `SITEMAP_BASELINE` (2026-05-25) になる (ビルド時の `readActiveKeysForSitemapFromR2` が `updatedAt: null` を返すため)。候補は R2 `app/stats/<key>/values.json` の Last-Modified。**[仮説]** 差分 push で中身が変わったキーだけ日付が動くなら実更新日に近い。**検証**: `packages/r2-storage/src/scripts/diff-push-r2.ts` の skip 条件を読み、`sync-snapshots.yml` の直近 run のログで values.json の送信件数を確かめる。**期日** 2026-11-25。送信が変更分だけなら採用、全件なら不採用。決まるまで根拠の無い一律の日付を出し続けるか、`lastmod` を出さないかも決める。採用時は `sitemap-ranking-keys.ts` を key → 日付に変え、`url-policy.ts`・`ranking-key-consistency.test.ts`・`legacy-ksj-retirement.test.ts`・sitemap のテスト 2 本・`sync-snapshots.yml` の KEY_FILES の差分判定への影響を確かめる。
  2. `lastmod` の無い 8 本 (県×テーマ・市区町村・市区町村ランキングなど) に出せる根拠があるかを決める。
  3. 11-25 以降に GSC の検証結果の通知と送信済みビューの 3 件数 (404・5xx・リダイレクトエラー) を読む。市区町村ページの 2 件の検証は `GSC-MESSAGE-TRIAGE-01`。
  4. **[仮説]** ブログ 12 件の 404 は、サイトマップに載った直後のクロールで ISR の 404 キャッシュを返した。**検証**: 次にブログを公開した直後、新しい記事 URL を Googlebot UA で取得して 200 か 404 かを記録する。404 なら公開手順にキャッシュの解消を足す。
  5. サイトマップ掲載 URL と HTTP・noindex・canonical の矛盾を、既存の check-sitemap-index・route smoke・page-quality で拾えるかを確かめ、不足だけ既存 gate と週次全 URL 検査へ足す。
  6. 別件 (未確認): 実行時に R2 から 0 件が返るとランキングのサイトマップが空になる経路がありうる (`sitemap.ts` 478-480 行のコメントと実装の食い違い)。再現を確かめてから別カードにする。
- **owner / 入力**: ranking-publisher・site-ux-manager。`apps/web/src/app/sitemap.ts`、sitemap shard、公開 URL 方針。Geo 固有の公開 gate は既存 route smoke (全 7 分析) と定義 SHA 回帰テストを参照する。
- **停止条件**: 全 URL の lastmod を毎日更新しない。更新日が不明なとき捏造しない。priority / changefreq の変更を Google 向け改善策にしない。公開反映は別途指示で行う。
- **完了条件**: 意図しない 404・転送・noindex・別 canonical の掲載を検出でき、lastmod が実更新に一致するか未設定の理由を説明できる。既存検査との二重運用を残さない。
- **棚卸し (2026-11-22)**: 残り 1 は「差分 push は変更分だけを送る」で支持された (sync-snapshots run 45005473194 は NEW 0・CHANGED 0・一致 2,759、11-18 の run 44215694484 は変更のあったキーだけ NEW=1)。次は残り 2〜6 と `sitemap-ranking-keys.ts` をキーごとの日付にする実装。

### [ADSENSE-FORMAT-BY-PAGE-01] 広告の形式 (記事内・インフィード・表示) をページの作りに合わせて見直し、広告の側から UI を直す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-13] [待ち:判断]

- **起点 (2026-11-13 オーナー)**: 「UI を改善したらインフィード広告・記事内広告・Multiplex も活用できる。」
- **材料 (2026-W44・`data/adsense/history-units.csv`)**: 1,000 表示あたり、記事内広告 ¥29〜38 (ハブ・一覧 ¥38、ブログ ¥36、ランキングの解説の後 ¥29)、Multiplex ¥13〜19 (埋まる割合 17〜22%・視認率 29〜38%)、右レールの表示広告 ¥6〜14。11-12 に本文の段を幅いっぱいの表示広告 (レスポンシブ) で作り直したユニットと、都道府県のページのインフィード (`stats47-area-infeed`) はまだ実績が無い。
- **次 (実行順)**: ① 11-12〜13 に作り替えた段のユニットの 2 週の実績 (`history-units.csv`) を、同じ位置の記事内広告と比べる。② 一覧の形のページ (関連記事・検索結果・ブログ一覧・タグ) で、カードの見た目をそろえてインフィード広告を入れる案を、ページごとに閲覧数と一緒に出す (検索結果のカードには画像が無い)。③ 長い表が続くページ (都道府県・市区町村のデータブック・調査) は、章立てと章の頭の 1 文で記事内広告の置き場を作る。④ Multiplex は回遊 (関連記事) と取り合うので、使うなら関連記事の後のページの最後に限り、回遊の内訳 (`internal-transitions.csv`) と一緒に判定する。
- **停止条件・禁止**: スマホの広告の高さは本文の 30% まで (広告の枠の台帳の共通のルール)。広告のためだけに中身の薄い文を足さない (章の 1 文は値から導いた中身のある文にする)。1 ページで同じユニットを重ねない。最初の画面に置かない。
- **完了条件**: ページの種類ごとの形式 (記事内・インフィード・表示・置かない) と、そのための UI の変更をオーナーが決め、実装のカードに分けている。
- **追補 (2026-11-21・週次レビュー W46)**: 本文に「11-14 判定の後にデプロイ」と読める記述が残っているが、2026-W46 の AdSense のユニットは 47 (W45 は 12。`data/adsense/history-units.csv`) で、配置の再構成が判定前に本番に出ていた可能性がある。デプロイ日を確かめ、`ADSENSE-PLACEMENT-01` (期日を 2026-12-05 に引き直し済み) の比較窓と矛盾しないかを書く。
- **反映日 (2026-11-24・`gh run list --workflow deploy-workers.yml --branch main` とデプロイの SHA の `apps/web/src/lib/google-adsense/constants.ts`)**: ユニットの定義は 11-11 08:49Z のデプロイまで約 10 で変わらず、11-12 12:54Z (`e3ac001a7`・定義 28)、11-12 22:37Z (`78400b8ad`・37)、11-13 03:48Z の手動起動 (run 43361405284・`bd6f1bb35` #1257・49) の 3 回で増えた。`ADSENSE-PLACEMENT-01` のベースライン窓 (W42〜W45 = 10-11〜11-07) の後なので窓とは矛盾しない。W46 (11-09〜15) は週の途中で配置が変わった週なので、配置の後の比較は W47 (11-16〜) から始める。
- **移した残り (2026-11-24・旧 ADSENSE-FIXED-UNITS-01)**: ページ末の 2 枠 (RANKING_PAGE_FOOTER・CONTENT_FOOTER) は 2026-11-03 の `50258e1d4` で専用ユニットに替えた。固定サイズの変更 (`e7eefcafa`・11-01 本番) が W42〜W45 の途中に入ったので、stats47-hub-rail・themes-content とページ末の枠は W43 以前と比べない。

### [ADSENSE-FORMAT-EXPERIMENT-01] 広告の形式を枠ごとに試す (固定 300×250 と、大きさに上限を付けたレスポンシブ・記事内・関連コンテンツ型)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-11]

- **済み**: 10-31 に表示広告を固定 300×250 にした。 (参照: 5469a28b8)
- **オーナー決定**: 自動広告は今の設定を続ける (11-11)。アフィリエイトは戦略を練り直すまで止め、枠は消さずに AdSense のレスポンシブへ 1 つずつ替える (11-12)。ランキング専用の案件の例外を戻すときは commit 955444898 の版の `ranking-affiliate-policy.ts` から戻す。
- **観測 (2026-11-15・AdSense 管理画面「最適化案」を閲覧)**: 届いている最適化案は 1 件で、固定サイズの 5 ユニット (stats47-content-footer-rect・stats47-ranking-rail-top・stats47-ranking-table-side・stats47-themes-content・stats47-ranking-footer-rect) をレスポンシブのコードへ替える提案。
- **済み (2026-11-15・未コミット・未デプロイ)**: 最適化案の 1 枠目として、市区町村のページ末 (`CityPageFooter`・ユニット stats47-content-footer-rect) を固定 300×250 から本文の幅いっぱい (上限 580px。)
- **基準値 (before)**: W44 (10-25〜10-31・`data/adsense/history-units.csv`) の手動ユニット計は 223 円、1,000 PV あたり 19.0 円、表示 1,000 回あたり 19 円。11-04〜11-10 (AdSense のレポート画面・11-11 取得) は 247 円・20.2 円・16 円。ランキングの解説の後の記事内広告ユニットは W42〜W44 で表示 1,000 回あたり ¥29〜31・視認率 37〜42%・埋まった割合 90%。ランキング右レール末尾 `stats47-ranking-table-side` (300×600 化前) は W42〜W44 で ¥8〜10・視認率 32〜33%。
- **次 (実行順)**:
  1. 11-14 の `ADSENSE-PLACEMENT-01` のベースライン判定の後にデプロイする。
  2. デプロイ直後に本番で各枠の描画サイズと CLS を測り、台帳の `height` の仮の値 (ランキングの記事内広告 280px・インフィード 120px) を実測へ直す。ランキングの記事内広告が 600px を超えて伸びるか CLS が 0.1 を超えるなら、上限の幅を狭めるか元の 300×250 の横並びへ戻す。スマホのランキングの CLS 0.224 (11-11・1 回の測定) の原因は `ADSENSE-OVERLAY-AB-01` で見る。
  3. 同じ測定で、スマホ (390px) の広告密度 (本文の高さに対する広告の高さの合計) を自動広告・アンカー込みで測る。Better Ads Standards の上限 30% を超えるページは手置きを減らす (手置きだけで市区町村のランキング 10.3%、県 約 7%)。ブログの段を増やすかもこの実測で決める (11-12 オーナー合意)。ブログのスマホで 300px 固定の広告が箱から 12〜39px はみ出していた件が解消したかも確かめる。
  4. デプロイ日を境に 2 週、ユニット別の表示 1,000 回あたり収益・視認率・埋まった割合と、ページ種別の 1,000 PV あたり収益・CLS を前後で比べ、`data/improvement/adsense-improvement/improvement-log.md` に記録する。
  5. 台帳とコードの食い違いを直す: `adsense-body` の devices が desktop だけなのにスマホ枠に使っている、右レールの fallback の記述が standards と台帳で逆、`FooterAdSlot.tsx` などの古いコメント、320×100 が standards では canonical で台帳では undecided、`constants.ts` と収益化戦略 3.1 の「自動広告はオフ」が実際の設定と食い違う。
- **停止条件・禁止**: `data-ad-format="auto"` と `data-full-width-responsive="true"` を上限なしで戻さない (10-31 の実測で最大 1200×600・右レールで 928×280)。複数の枠を同時に変えない。1 週対 1 週の比較で確定と書かない。
- **完了条件**: デプロイ後 2 週の前後比較がユニット別・ページ種別で `data/improvement/adsense-improvement/improvement-log.md` に残り、枠ごとの形式が決まる。
- **統合 (2026-11-24・旧 AFFILIATE-COMMON-PRODUCTS-01)**: 共通の案件の試験は 2026-11-12 のオーナー決定で打ち切り、残りの枠はここで AdSense へ替える。アフィリエイトの戦略の練り直しは受け皿のカードがまだ無い (次の月次計画で起票を判断する)。打ち切り時点の実測: A8 は 8〜10 月で 690 クリック・成約 0、楽天は 9〜11 月で 43 クリック・注文 0、サイトの PR のクリック率は直近 6 週で 0.04〜0.22%。

### [CI-CONTRACT-TESTS-DEVELOP-GAP-01] main への PR でしか回らない契約テストが、develop で壊れても気づけない
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-11]

2026-11-11 の PR #1251 で、契約テスト (`pr-quality-check.yml` の Contract Tests) の 1 件が落ちてマージが止まった。原因は 11-10 の台帳の整理 (指標の定義の kind を config から master に変更) で、`prune-state-snapshots.test.mjs` が指標 3 件を日付名の記録と誤検出したこと。このテストは develop への push の検査 (`develop-quality-gate.yml`) では回らないので、整理が入ってから約 1 日、誰も気づけなかった。Contract Tests は最初の失敗で止まるので、後ろの約 15 段は 1 回目の PR では実行されていなかった。

- **次 (実行順)**: ① Contract Tests の各段の所要時間を run のログで測る ② 短い段 (node --test だけのもの) を develop の検査へ足すか、Contract Tests を「失敗しても後ろの段を続ける」形にするかを決める ③ 決めた方を入れ、わざと 1 件壊して develop で赤になることを確かめる。
- **停止条件・禁止**: develop の検査の待ち時間を大きく延ばさない (CI の速さは人の待ち時間で測る。memory `feedback_ci_speed_wait_time`)。
- **完了条件**: 契約テストを壊す変更が、main への PR より前に develop で赤になる。

### [RANKING-INTEGRITY-VIOLATIONS-1124-01] ランキング整合の監査が落とす 2 件 (national-trend の鮮度 24 件・nurse-salary のレシピのずれ) を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx tsx packages/ranking/src/scripts/audit-ranking-data-integrity.ts] [起票:2026-11-24] [領域:データ] [待ち:承認]

- **観測 (2026-11-24・本番 R2 に対する実走、取得の失敗 0 件)**: 総合判定が「違反あり」で、落ちた検査は 2 つ。(h) 鮮度: 職業別年収の 24 指標 (accountant-annual-income ほか) の `national-trend.json` が values.json より 9 日古い (相対 8 日の上限超え)。(k) レシピ: `nurse-salary` の R2 の値の隣のレシピが `ops: null` で、config は `sampleCount` (cdTab 13,45・factor 10・minimum 10) を持つ。
- **次**: ① national-trend は作り直せる派生物なので、sync-snapshots の該当 task で再生成する (承認不要) ② nurse-salary は config に合わせて `app/stats` を作り直す (`page-data-batch --metric nurse-salary` → `diff-push-r2 --prefix app/stats`)。`app/stats` は正本なので書き込みはオーナーの承認の後。
- **完了条件**: 監査の実走で (h)(k) が 0 件、総合判定が OK。

### [GSC-USER-ACTIONS-01] GSC の記録と Googlebot の集計に要る、オーナーだけの 2 つの作業
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-11-11] [期日:2026-12-05] [領域:サイト] [待ち:ログイン]

2026-11-11 のデプロイ後作業で、Claude には実行できず止まっているものが 2 つある。どちらも 11-14 (土) の週次取得より前に済ませたい。

- **① Google へのログイン**: 済み (2026-11-21 の Mac の取得で gsc が pass し、`data/gsc/coverage-submitted-history.csv` に 2026-W47 の `captured` の行が入った。`8512b1f34`)。
- **② Cloudflare トークンの権限**: CI の API トークン「stats47」に、ゾーン 4caf2866… の Analytics 読み取り (`zone.analytics.read`) を足す。足すまで日次 snapshot の `googlebot` は「取得不能」になる (11-11 の run 42958312727 で確認)。Cloudflare の API トークン画面で権限を足し、翌日の `data/cloudflare/snapshots/<日付>.json` の `googlebot.status` が `unavailable` でなくなることを確かめる。
- **停止条件・禁止**: 認証情報を Claude に渡さない。権限付与は Claude が代行しない。
- **完了条件**: ① は 11-14 の取得で `coverage-submitted-history.csv` に `captured` の行が入る。② は翌日の snapshot で `googlebot` の件数が入る。
- **期日の引き直し (2026-11-24)**: ① は済み。② の Cloudflare トークンの権限はオーナー作業で未着手 (2026-11-24 確認)。週次レビューの承認待ちの一覧に載せる

### [GSC-CRAWL-WASTE-01] Google のクロールがページ本体以外に使われている分を確かめて止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:サイト] [待ち:ログイン]

- **済み**: 「その他のファイル形式」の正体を Server Action の POST と確定し、テーマの POST を初回描画で渡す形にし (PR #1249)、Geo の分析ページを GET (`/api/geo/analysis/`・robots で Allow) に替え、`storage.stats47.jp/robots.txt` を置いた (PR #1250・run 42958691869)。
- **基準値 (デプロイ前)**: Cloudflare GraphQL で UA に Googlebot を含む 2026-11-10T00:41Z〜11-11T00:41Z の 24 時間の POST は 285 件で、比べるのは県×テーマ 254 件とテーマ 8 件の計 262 件 (Geo の 23 件は除く)。GSC のクロール統計 (直近 90 日・11-09 更新) は 34 万リクエスト中 HTML 36%・その他のファイル形式 30%・平均応答 1,500ms。
- **次 (この順)**:
  1. (期限 2026-11-18) デプロイ後 24 時間の Googlebot の POST を同じクエリで数え、262 件と比べる。再現: ダッシュボードにログインしたブラウザで `/api/v4/graphql` に `userAgent_like: "%Googlebot%"`・dimensions `clientRequestHTTPMethodName, clientRequestPath` を投げる (CI なら `.claude/scripts/cloudflare/fetch-usage.mjs` の `gql` と同じ形)。CI のトークンに Zone の Analytics 読み取りを足すのはオーナー (`[実行:ユーザー]`)。足すまでは手元のトークンで数える。
  2. (期限 2026-11-18) `/ranking/abandoned-cultivated-land-area` で KML・GeoJSON ボタンを押し、ファイルが保存されるかを確かめる。
  3. (期限 2026-11-18) storage の robots.txt の反映後も OGP 画像・ブログの図が 200 のままで、市区町村ランキングの Dataset (contentUrl の values.json) がリッチリザルトテストで読めるかを確かめる。Allow が効かなければ robots.txt を直し `publish-storage-robots.yml` を流し直す。
  4. 反映から 4 週後に、GSC のクロール統計「その他のファイル形式」の例に反映日以後の県×テーマ・テーマの URL が出なくなったかを読み、効果観測 (送信済み「検出 - 未登録」1,134 件・HTML 比率) を `improvements.md` の別 ID へ引き渡す。
  5. ダウンロード API を Disallow に戻すかを、`GSC-ROBOTS-INDEXED-01` の 23 件が 0 になった後に決める。
  6. キャッシュに無いときの応答 (TTFB 2.4〜3.1 秒) と HTML の大きさ (0.5〜1.0MB) を減らす案を、テンプレート別の実測から 1 つ選ぶ。Tiered Cache が Workers の cache で効くかは公式文書で確かめる (設定の変更はオーナーの承認後)。共通のサイドバーとヘッダー (約 116.5KB) と HTML 900KB 超のページは、やるなら `ui-consistency-reviewer` に案を出させる。
- **見送り**: `GeoLayerExplorer` で県を切り替えたときの `fetchGeoLayerAction` の POST は、利用者の操作時だけなので変えない。
- **根拠の扱い**: Google「大規模サイトのクロール予算管理」(developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget) は着手時に読み直してアクセス日を書く。
- **停止条件・禁止**: 画像のクロールを止めない。Dataset 構造化データの検証を壊さない。R2・本番への反映は別途指示で行う。
- **完了条件**: 止めると決めたものが robots / 実装に入り、11-18 期限の 3 点の確認を記録し、効果観測が `improvements.md` の別 ID へ引き渡されている。

### [R2-VALUES-REUPLOAD-01] ランキングの values.json が生成のたびに全件送り直されるのを止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:データ] [待ち:承認]

- **観測 (2026-11-15・sync-snapshots run 43671404197・オーナー承認)**: `[values] 時刻を引き継いだ=2728 中身が変わった・初回=0`、`[normalized] 時刻を引き継いだ=1823`。 (参照: run 43671486374)
- **次**: ①送った 2,703 件が何か (前回の run が失敗して R2 が旧い時刻のままだった values.json か) を、もう 1 回の sync-snapshots のログで確かめる。2 回目でも同程度なら差分の出どころを 1 件の diff で特定する。②Correlation Refresh が values.json を毎回送り直しているかを run のログと `curl -sI` の Last-Modified で確かめ、送っているなら同じ引き継ぎを入れる。
- **済み (2026-11-14・3b10a0410)**: `generate-ranking-values.ts` は前回配信した values.json を読み、中身が同じなら `generatedAt` を引き継いで同じバイト列にする。
- **残り**: この変更を main へ反映した後、sync-snapshots (全 task) を連続 2 回実行する。1 回目は values.json の `generatedAt` が前回配信と同じ値に固定されるが、R2 側は旧い時刻のままなので values.json の全件が再送される。2 回目のログで `[values] 時刻を引き継いだ=` の件数、`R2 と中身が同じ（送らない）:` と `送信する:` の件数を読み、`curl -sI https://storage.stats47.jp/app/ranking/<key>/values.json` の Last-Modified を 2 回目の前後で比べる。
- **止まっている理由**: sync-snapshots の本番実行は R2 への書き込みなので、オーナーの承認が要る。develop から main への反映もオーナーの指示が要る。
- **完了条件**: 2 回目の run で `送信する:` の件数が全件 (約 14,300 件) でなく、観測値が変わらなかった指標の values.json の Last-Modified が 1 回目の run の時刻から動かない。確認できたら `.claude/skills/db/sync-snapshots/SKILL.md` の push 時間の実測値を新しい値へ書き換える。

### [DEPS-PICOMATCH-REDOS-01] picomatch の ReDoS (GHSA-fc5q-39xc-vjpf) で Security Scan が全 PR で赤になっている
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-18] [領域:管理] [待ち:判断]

- **観測 (2026-11-18)**: PR #1284 の Security Scan が `check-dependency-audit.mjs` の high で失敗した (run 44205673797)。
- **再現**: `node .claude/scripts/lib/check-dependency-audit.mjs` / `npm audit --json`
- **選択肢**: (a) `.claude/config/dependency-audit-exceptions.json` に dev 依存の例外として理由と期限 (例 2026-12-18) 付きで載せる (2026-10-10 のオーナー判断の仕組み。Claude が足そうとしたら自動の安全判定が止めたので、オーナーの判断で入れる) (b) picomatch の修正版を待つ (その間 Security Scan は赤)。
- **済み (2026-11-18・オーナー判断)**: picomatch (GHSA-fc5q-39xc-vjpf) を `dependency-audit-exceptions.json` に dev 依存の例外として期限 2026-12-18 で載せた。
- **残り (例外では通らない・修正版あり)**: 同じ依存の行に混ざる 2 件で、ゲートは「元の advisory がすべて例外のときだけ通す」ので picomatch の例外だけでは緑にならない。① @vitest/mocker の GHSA-qxg6-89mg-rqv8・GHSA-xp26-3454-mjgp は vitest 4.1.12 で修正 (全ワークスペースの指定は `^4.1.11` で範囲内)。`npm update vitest ... --workspaces` は package.json の overrides の `$vite` を解決できず失敗し、ルートの `npm update` では lock が 4.1.11 のまま動かなかった (2026-11-18)。各ワークスペースで `npm install -D vitest@4.1.12` 等を当てて lock を更新し、vitest 全件を回す。② minimatch の GHSA-g3hv-75wg-m249 は 11.0.1 で修正だが、@ts-morph/common・@typescript-eslint/typescript-estree・shadcn が 9・10 系を指定していてメジャー版を上げないと直らない。上流の対応を確かめ、無ければ例外に足すかをオーナーに判断してもらう。
- **完了条件**: Security Scan が develop→main の PR で緑。例外は期限の日に上流の修正版を確かめる。

### [DEPS-RENOVATE-01] Renovate GitHub App をインストールし、最初の月曜の翌日に PR が出ることを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:gh pr list --state all --search "author:app/renovate"] [起票:2026-10-13] [待ち:承認]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、改善台帳の上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。
- **実測**: renovate.json はあるが未稼働。
- **次 (オーナー)**: GitHub App のインストール。DEPS-MAJOR-SECURITY-01 は Dependabot security alerts で解消済みなので緊急度は低い。
- **完了条件**: インストール後の最初の月曜 (renovate.json の schedule は月曜 6 時前) の翌日に、上の検証コマンドで 1 件以上。無ければオーナーへ再依頼する。

### [R2-STORAGE-01] doboku-note-archive (8.98GB) の保持方針を決め、R2 容量の無料枠 (10GB) 超過に対処する
タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。保持方針が決まるまで想定効果値を置けない。
- **実測**: `data/cloudflare/history.csv` の r2_storage_gb は 09-07 23.007 → 09-26 33.368 → 10-02 33.338 → 10-09 33.635 GB (直近 2 週は +0.27GB)。再現: `awk -F, '$1>="2026-09-26"{print $1,$13}' data/cloudflare/history.csv`。
- **次 (オーナー)**: doboku-note-archive の保持方針 (許容か削減か) を決める。
- **完了条件**: 削減なら削除量を根拠に `[target: -N GB]` と `[kpi: operating-cost]` 付きの別行で improvements.md に起票する。許容なら理由と見直し期日を cloudflare-cost-improvement の詳細ログに書く。
- **決定 (2026-10-26 オーナー)**: 削減する。次: `r2-maintenance.yml` の `mode: du` (dry-run) で doboku-note-archive の内訳を取り、削減範囲の案と削減量を出してオーナーが範囲を承認する。承認後に `[target: -N GB]` 付きの行を improvements.md へ起票する (このカードはそのとき削除)。

### [REFERENCE-EXPANSION-BLOG-01] 教材の分析企画のうちブログが展開先の 215 件を、記事にする・結ぶ・見送るに振り分ける
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status --channel blog] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: 採択済みでブログを展開先に含む企画が 215 件、記録は 0 件。
- **担当**: blog-seo-strategist。`/plan-article-queue` の Step 0 で未着手を読み、topic-queue の候補に入れるか、公開中の記事 (`blog:<slug>`) と結ぶか、見送るかを決める。
  記事の制作は article-writer、公開前は blog-critic の PASS が要る (`blog-quality-standards.md`)。
  `REFERENCE-CONTENT-DRAFTS-01` の下書き 4 本は、公開した時点で該当企画を done で記録する。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` で未着手と結ぶ候補を出し、`record` で記録する (済みは公開中のページ ID だけ、見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `reference:expansion -- status --channel blog` の未着手が 0。
- **統合 (2026-10-26 オーナー判断): `REFERENCE-CONTENT-DRAFTS-01`** 参考文献由来のテーマ企画と横断ブログ下書きを制作する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 11 行のうち 8 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[REFERENCE-CONTENT-DRAFTS-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: blocked 3件はactiveな公開metricが出た時点で再判定する。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
  - **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
  - **完了条件**: blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。
- **headless 執筆への接続案 (2026-10-28)**: 企画の「問い」を topic-queue の lane として流し、`write-blog-headless.ts` の prompt に渡せば、型B の機械的な指標の組 (`BLOG-TOPIC-PAIR-PER-CAPITA-01`) より題材の質を上げられる。内訳は kakei-marketing 74・capital-city-guide 47 (県ごとの名物を統計で確かめる 47 本)・prefecture-ranking-consumption 42・prefecture-deviation 24 ほか。

### [REFERENCE-EXPANSION-SNS-01] 教材の分析企画のうち X (153 件)・Instagram (130 件) が展開先のものを、投稿にする・結ぶ・見送るに振り分ける
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status --channel x] [起票:2026-10-13] [領域:SNS]

- **事実 (2026-10-13)**: 採択済みで X を展開先に含む企画が 153 件、Instagram が 130 件。記録は 0 件。
- **担当**: X / Threads は x-strategist (`/post-x-batch` の候補追加)、Instagram は instagram-strategist (`/generate-instagram-schedule`)。
  投稿は投稿台帳 `data/sns/posts.json` の投稿 ID で `sns:<ID>` として結ぶ。済みは posted の投稿だけで、予約・下書きは planned。
  頻度上限・承認は `sns-content-standards.md` §1・§3-1 に従い、同じ指標を型違いで量産しない。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` が未着手の企画と、同じ指標を使う公開中のページ (結ぶ候補) を出す。
  決めたら `npm run reference:expansion -- record --analysis <企画ID> --channel <展開先> --status done|planned|declined [--target <ページID>] [--reason 理由] --by <担当>`
  で記録する (済みは公開中のページ ID だけ通る。見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `status --channel x` と `status --channel instagram` の未着手が 0。

### [ACADEMIC-TEST-YEARS-01] 全国学力テストの都道府県別平均正答率が 2025 年の 1 年分しか無い
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: `academic-achievement-test-average-rate` の R2 values は 2025 年の 47 行だけ。
- **次**: 国立教育政策研究所の公表 (https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html) から過去の年の都道府県別正答率を取り込む (`data-provenance-standards.md` の 9 点セット)。
  取り込んだら記事の答えを複数年で書き直す。
- **完了条件**: 3 年以上の 47 都道府県の値が R2 にあり、記事が複数年で答えている。
- **調べたこと (2026-11-23)**: 都道府県別 (公立) の平均正答率は、2022・2023・2024 年度は国立教育政策研究所の「実施概況」の全国の PDF (例 https://www.nier.go.jp/24chousakekkahoukoku/factsheet/24P_101.pdf と 24m_101.pdf) の中の表にある。県別の xlsx は国会図書館のアーカイブに移っていて取れない。2025 年度は全国の PDF に県別の表が無く、県ごとの xlsx (今の取り込みと同じ) にある。2021 年度はアーカイブ経由で 403 になり確かめられなかった (2020 年度は中止)。国語と算数・数学は 2022〜2025 年度で同じ「平均正答率」だが、2025 年度の中学校の理科は IRT スコアで、平均正答率の系列とは別物。年ごとに問題が違うので、水準を年をまたいで比べてよいかの公式の注記はまだ確かめていない。
- **次の手順**: ① 年をまたいだ比較について公式の注記を確かめる (比べられないなら、複数年は「その年の全国平均との差」で並べる)。② 2022〜2024 年度の全国の PDF から県別の表を抜く取り込みを作る (`national-assessment-*` の 4 教科と、4 教科を平均した `academic-achievement-test-average-rate`)。
- **引き継ぎ (2026-11-23・旧 REFERENCE-EXPANSION-SITE-01 の追補)**: 家計調査の本 (kakei-marketing/2015) の台帳 `inventory.json` で、企画 a01-01 (学力テスト) のページ p0011〜p0014 が `new-metric` のまま指標に結ばれていない。指標 `academic-achievement-test-average-rate` ができたので、authored mapping に結んで `npm run source-vault:inventory -- build --profile <profile>` で作り直す (`analyses.json` との指標のずれはこの 1 件だけ。11-14 の 80 件から減った)。

### [NOTE-LEDGER-FOLLOWUP-01] note 記事台帳への移行の後片付けと、private R2 を含む照合の定期実行
タグ: [エージェント・SSOT] [種類:改善] [実行:別環境] [検証:npm run note:article -- verify --deep] [起票:2026-10-13] [領域:商品]

- **済み (2026-11-14・11128deff)**: 週次台本 `note-circulation.sh` に `run ledger-r2-verify npm run --silent note:article -- verify` を足した (`--deep` と `--record` は付けない)。
- **残り**: (1) 次の土曜の `npm run weekly:audits` で ledger-r2-verify が Mac の S3 認証で実際に通ることを確かめる。(2) どのマニフェストにも載らない `note/` 配下の R2 オブジェクトを数える。既知は公開 R2 の `note/a-maximum-temperature/` (7 件) と、有料記事の公開 R2 に残る旧 `public.json` (75 件・読み手なし) である。削除するなら `r2-storage-design.md` の手順 (`r2-maintenance.yml` の allowlist) に従い、旧 `manifest.json` は `NOTE-PROVENANCE-BACKFILL-MANIFEST-01` が済むまで消さない。(3) Mac で `npm run note:article -- verify --deep` を 2 回続けて合格させたら `.local/note-migration-backup-20261013.tar.gz` を削除する。(4) `backfill-note-data-provenance.mjs` が書く source (`r2:app/ranking/<key>/values.json`) と `image-assets-audit.mjs` の `validateRankingProvenance` が要求する `app/stats/<key>/values.json` を、どちらに揃えるか決めて直す (backfill した a- 記事の保存のたびに RANKING_PROVENANCE_INVALID の警告が出ている)。(5) `data/note/cover-records/` は約 1,560 記事で 1MB に届く見込みなので、分割か保持方針を決める。
- **追補 (2026-11-14・`5b254f9a8`)**: 旧雛形 2 本 (A-laborwage-paid-leave-utilization-prefecture・A-laborwage-wages-by-industry-prefecture) を台帳から外したので、R2 の `note/stats47-note/` の 2 つの置き場 (各 5 ファイル・約 100KB、原稿に実データ未記入の差し込み枠が 10 箇所) が台帳から辿れなくなった。R2 で実在を確かめて消す (R2 の書き込みなのでオーナーの承認後)。
- **完了条件**: 週次の weekly:audits で ledger-r2-verify が合格として記録され、R2 の取り残しの件数と扱いが決まり、verify --deep の 2 回合格の後に控えが消えていて、provenance の source の食い違いが解消している。

### [UI-FOLLOWUP-02] 画面と図に残る表示の不具合 (第 4 波の実行で見つけた分)
タグ: [UI・UX] [種類:不具合] [実行:sweep] [起票:2026-11-14]

- **済み (2026-11-14・22076b73a)**: Items 1, 2, 3 and 6 are fixed with tests. These are the admin table cell nowrap and the freshness badge's Japan-time date, the Geo check values (populations as whole people, and 対象外 with the reason as a note), the 44px link height on touch devices, and the ranking map's decimal places now matching the table.
- **残り (判断)**: Item 4. On the national page of `/themes/aging-society`, the chapter 「出生と高齢化の現在地」 drops total-fertility-rate because it has no official national value (`hasOfficialNational` in ThemeMetricsDashboard). Only one tile shows, and the three blank cells are the fillers required by the 2026-10-29 owner decision. Option A is to add the official national TFR series to the R2 snapshot, which needs an R2 write. Option B is to keep the current layout. A is recommended because the chapter is meant to compare ageing rate with fertility.
- **残り (判断)**: Item 5. On `/areas/13000/population-dynamics`, the chart 「合計特殊出生率と出生数の推移」 puts both lines on the left axis because `data/metrics/total-fertility-rate.ts` sets the unit to 「人」, the same as births, and `assignAxes` in MetricSwitcherPanel splits axes only by unit. Option A is to change the TFR unit to a rate-type value; the Kindle rules already treat 「（人）」 on TFR as an error. That change then needs metrics:regen-derived, the R2 snapshot republished, and the effect on ranking-page wording checked. Option B is to split axes when two same-unit series differ in size by 100 times or more. A is recommended because B adds a guessing rule.
- **残り (計測)**: Item 7. Measure mobile CLS with PSI for the Sankey chart and the histogram, which change height after their width is measured (at 375px the Sankey goes from 116px to 359px). Record the result in `data/improvement/performance-improvement/improvement-log.md`.
- **完了条件**: Items 4 and 5 are fixed according to the owner's decision and checked with before/after images at 375px and 1280px, and the PSI result for item 7 is recorded.
- **追補 (2026-11-22・THEME-DASHBOARD-TEXT-TRIM-01 を閉じたときの残り)**: テーマの埋め込み章の説明は出典の Sheet へ寄せ終えた (24 章)。地図が主役で形の違う `apps/web/src/features/geo-analysis/components/` の土砂災害・公共施設・駅アクセスの章に、注記の段落と箇条書きが図の周りに残る。同じ形 (`ChartFooter placement="header"`) に寄せられるかを確かめる。
- **追補 (2026-11-24・UI-FIX-SURVEY-POLICE-20261121 の処理から)**: 出典の Sheet を開くボタン (`SourcesSheet`) は、読むときの注意があると右上の点だけで示し、見える文言は「出典・指標の定義」のまま。週次の UI 確認が点を「意図の分からない黒い丸」と再び指摘する恐れがある。文言に「・読むときの注意」を足すかは見た目の判断 (今回は by-design で記録した)。
- **オーナー決定 (2026-11-24)**: 推奨どおり Item 4 は (A) 全国の合計特殊出生率の公式系列を R2 snapshot へ足す、Item 5 は (A) 合計特殊出生率の単位を率の型へ直す を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: Item 4・5 の変更の設計と before/after 画像の用意から。実行 (R2 への書き込み・metrics:regen-derived・snapshot 再公開) はオーナーの承認の後

### [BLOG-FIGURE-FOLLOWUP-01] ブログの図の型に残る不具合 (第 3 波の実行で見つけた分)
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-11-14]

- **済み (2026-11-14・a7fe5fa1a)**: 1〜4 を型の側で直し、それぞれに直す前に落ちて直した後に通るテストを足した。
- **残り (確認)**: 4 を「系列を減らす・図を分ける」でなく型の 2 段で直した。公開 R2 の household-spending-seasons-and-tax-hike-swings の 3 枚は、この型で 48 本すべてに値が付くことを画像で確かめた。1〜6 月と 7〜12 月が上下に分かれる見た目でよいかをオーナーが確かめる。よくなければ、記事のデータを 2 系列ずつの図に分ける作業をこのカードに足す。
- **残り (判断)**: 5 のタイトルの NG パターン (`quality-gate.mjs` の「N位」で終わる題) を、引用符なしの題へ広げるかを決める。2026-11-14 の記事台帳 889 本のうち、広げると止まる題は公開中の 3 本である (cereals-group-consumption-expenditure-prefecture-gap「穀類への支出、愛知県が1位で鳥取県が47位」、campsite-public-vs-road-expressway-length「キャンプ場と高速道路、北海道が両方1位」、swimming-pool-public-vs-total-general-project-investment「公共プール数と投資額、北海道が両方1位」)。3 本とも公開 R2 の article.md の title は引用符なしである。選択肢は 3 つある。(a) パターンを広げ、同じ変更で 3 本の title を書き直して再公開する。(b) パターンを広げるが、公開済みの記事は blocker でなく warning に留める。(c) 広げない。推奨は (a) である。引用符の有無は題の中身と関係がなく、同じ題が書き方だけで通ったり止まったりする状態は検査の意図 (事実の羅列だけの題を止める) とずれている。3 本とも検索向けの seoTitle を別に持つので、title の書き直しは見出しとカードの文言だけに効く。(a) は公開中の記事の題の変更と R2 への再公開を含むので、オーナーの承認が要る。
- **完了条件**: 5 の判断の結果が `quality-gate.mjs` と `quality-gate.title-ng.test.mjs` に入っているか、広げない理由がこのカードに書かれている。4 の 2 段の見た目の確認が済んでいる。公開中の図の描き直しは `BLOG-FIGURE-REDRAW-REGRESSION-01` で行う。
- **オーナー決定 (2026-11-24)**: 推奨どおり 5 は (a) パターンを広げ、同じ変更で 3 本の title を書き直して再公開する を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: quality-gate.mjs のパターン拡張とテストを書く。3 本の title 書き直しと R2 への再公開の実行はオーナーの承認の後

### [BLOG-MOBILE-READABILITY-01] 長い分析記事をスマホで読める長さと形にし、目次・広告の間隔を記事の長さに合わせる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-18] [領域:サイト] [待ち:承認]

- **背景 (2026-11-18 オーナーがスマホで読んだ感想)**: `/blog/capital-city-buying-patterns-47` (2026-11-09 公開) の箇条書きと段落が長く読みにくい、画像が出ていない気がする、文字数が多い、広告をもう少し置ける、目次を開閉できる UI にできないか。
- **実測 (2026-11-18・幅 375px の内蔵ブラウザ)**: ページの高さ 21,868px (画面 27 枚分)。本文の地の文 約 8,900 字 (型 Q の目安 2,400〜3,200 字の約 3 倍)、見出し 10 本。段落 39 個は中央値 207 字・上位 1 割 262 字・最大 377 字で、本文の幅 293px・16px では 1 段落が中央値で約 12 行、最大で約 21 行。箇条書き 15 項目は中央値 86 字・最大 178 字。目次は 10 項目で高さ 330px。広告の段は 4 つ (y = 5,283 / 9,663 / 14,592 / 19,760、各 332px) で、間隔は 4,400〜5,100px (画面 5〜6 枚)。図 5 枚は R2 で 200 を返し中身も正しい (スマホの UA と Referer の curl で確認) が、内蔵ブラウザでは別の記事の図も読み込めず、実機で表示されるかは未確認。図のうち 3 枚は表示の高さが 183px で、スマホでは小さい。保存された PDF に図が無いのは、遅延読み込みの画像を表示前に保存した可能性もある。
- **済み (2026-11-18)**: 図はオーナーのスマホで表示された (内蔵ブラウザで読めなかったのはブラウザ側の制限)。
- **次 (実行順)**: ② 記事を 2 本に分ける。核の答え (差の約 8 割は量) を 3,000 字前後に縮め、似た買い方の市のまとまりの分析を別記事にする。手法の検証は「データについて」へ寄せる。公開済み記事の改稿 = R2 の本文の上書きなのでオーナーの承認を取ってから。③ 段落 200 字超・箇条書き 1 項目 80 字超を `quality-gate.mjs` の警告にする案は、先に公開済み記事での該当件数を数えて境界を決める (`blog-quality-standards.md`「ゲートを足す前にコーパスで該当率を測る」)。④ 目次は見出し 6 本以上の記事だけ、先頭の数項目を見せて「すべて表示」で開く形にする (`ArticleTableOfContents.tsx`。記事カードの中に枠を作らない規則は守る)。⑤ 広告の段の数を見出しの数 (最大 3) ではなく本文の長さで決める案 (`ad-row-positions.ts` の `adRowTargets`) は、② で記事を縮めた後に、ほかの長い記事の間隔を測ってから判断する。
- **停止条件・禁止**: 記事の改稿と分割はオーナーの承認なしに R2 へ出さない。広告を増やす変更は収益化戦略 (`docs/00_プロジェクト管理/02_収益化戦略.md`) の配置の方針と照らす。
- **完了条件**: 記事が 2 本に分かれて公開され、核の記事の地の文が 3,500 字以下。目次の開閉が見出し 6 本以上の記事で動く (localhost で確認)。

### [CONTENT-FOLLOWUP-01] 記事・図・計測に残る不具合 (第 4 波の実行で見つけた分)
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-11-14]

- **済み (2026-11-14・4d4b0436c)**: 1 (図の型)・4 (表記)・5 (計測と設定) は直し、テストで固定した。
- **残り (ブログの是正)**: population-decline-land-price-divergence の本文は、review.md (PASS・2026-09-05) が記録した SHA-256 と一致しない。blog-critic で審査し直し、review.md を更新する。是正キューの telework-gap-tokyo-6x は 2026-06-21 から in-progress のまま、contents/blog に原稿が無い。是正キューから外すか、原稿を書いて進めるかを決める。source.json が kind: derived で year を持たない図だけの記事は、図の年の古さの検出から漏れる。図の年を記録させるか、検出側で記事データの year を読むようにする。
- **残り (背景)**: 送り箱の 5 記事 (adult-sandals・avg-salary-police・bedding-group・dried-udon-soba・elderly-welfare-expenditure の各 prefecture-gap 系) には、git に記事固有の背景が無い。公開フラグを立てる前に、Codex で背景を作って git に置く。
- **残り (判断)**: data/products/competitor-scan.csv の category 列は作業者が分類した。境界の出品 (商圏分析を受注に、BOOTH の営業先リストと政党データの本を統計データに、ココナラの財務テンプレートをその他に) を、オーナーがこの分類のままでよいか確かめる。推奨は「分類の基準を 1 行ずつ台帳に書いてから確定する」。根拠は、基準が無いと次の観測で同じ出品の分類が揺れるため。商品の台帳の「商品群に入らない商品 9 件」は、2026-11-15 のオーナー承認で「Kindle 取り下げ・保留」(kdp-stopped) に入れて決着した (`829adf03f`。未分類 0)。
- **残り (観測)**: 次の本番反映の後、週次 GA4 の nav-click-surfaces.csv から unlabeled × api の行が消えることを確かめる。正規化 snapshot の生成ログに「時刻を引き継いだ=」の行が出て、変わっていない分が送られていないことを確かめる。
- **追補 (2026-11-14)**: 直した後もタイル地図の 4 文字の市名 (宇都宮市・名古屋市) は、短縮した「さいたま」より小さく描かれ、字の大きさが揃わない。`build-topic-queue.mjs` は自動の候補に無い pending の企画を作り直しで消すので、手で足す正規の入口が無い。quality-gate の factual 照合は「東京・千葉・埼玉・神奈川の4都県がそろって上位10位」の順位を最初の県の順位として読み、正しい文を RANK_MISMATCH にする。
- **完了条件**: 2・3 の対象記事を是正キューか該当カードで扱っている。6 のオーナー確認の結果が台帳に反映されている。観測の 2 点が実測で確かめられている。
- **追補 (2026-11-14・古い年の記事の取り直しで見つけた分)**: 是正キュー (22:53 生成) が古い年の一覧 (23:59 生成) より先に作られ、data-refresh レーンの 126 件が今の一覧に無い古い判定のまま残る (キューを一覧の後に作る順に直す)。`bonito-catch-prefecture` は一覧に古いと載るのに、`refresh-article-data-years.mjs` は取り直す図を見つけない。`article-factual-check` は「2024年の1位は兵庫」「前年は20位」のような過去年の順位も最新年の data と照らして RANK_MISMATCH にする (今回 5 本で言い回しを避けた)。本文に書く過去年の順位や回数を R2 の全年値と照らす検査が無い (critic が 3 本で数え間違いを見つけた)。R2 の values.json の rank は同じ値の県で順位が割れる年がある。`fresh-udon-soba-consumption-prefecture-gap` の本文に内部ラベル「[仮説B]」が残る。
- **追補 (2026-11-14・品質検査の誤検知の修正で見つけた分)**: `article-factual-check` の `mentionsForeignMetric` は指標名を拾う正規表現に県名と助詞まで入り、「埼玉県の出荷額は42.4兆円」のように指標名を書いた誤った値を検出しない。公開記事 254 本に VALUE_MISMATCH が 118 件 (47 本) 残り、うち 48 件は単位「人（人口10万対）」の「万」を桁の接頭辞として読んだ 10000 倍の誤検知 (`unit-semantics-standards.md` §5 の「誤検出 0」と食い違う)。CORRELATION_MISMATCH は、一部の県を除いて計算し直した相関係数を散布図全体の値と比べて警告する (fertility-rate-prefecture-gap の −0.44)。
- **追補 (2026-11-17・学力×生活習慣の記事を書いて見つけた分)**: `npm run content-types:check` が「個別の指定の宛先が無い」を 6 件出す (blog:general-hospital-bed-occupancy-rate・inpatient-rate-aging-burden・software-engineer-income-gap・telework-gap-tokyo-6x・total-fertility-rate・wheat-flour-consumption-food-culture-gap)。6 本とも公開 R2 の article.md は 200 で、非公開の一覧にも無いので、検査が宛先を引く一覧 (記事台帳か all.json) に入っていない理由を調べ、台帳側を直すか指定を消す。ブログの散布図の型は、指標名が長いと題が枠の右端を超える (`academic-achievement-lifestyle-habits` の tutoring-math-scatter.svg で推定 1054 > 1016)。題を型の側で折り返すか短縮する。散布図の SVG の題は、data の JSON の `title` ではなく指標のラベルから組まれている。軸名も定義名のままなので、合算の指標 (朝食の「している」+「どちらかといえば、している」) に「毎日食べている」が残る。生成側に題の短縮と表示名の上書き口を足す。同じ記事の残り: critic の再審査で PASS (MINOR 2 件。冒頭の「東京都や上位 5 都府県を外すと」の掛かり方、中 3 の節の「2 学年で同じ向き」の主語を通塾率に限る) は本文を直すと審査の SHA が変わるので未対応。公開後、既存記事 `academic-achievement-test-prefecture-ranking` の学習塾の [仮説] の箇所からこの記事へリンクを足す (公開済み記事の改稿なので審査を通して再公開する。R2 の記事本文の上書きなのでオーナーの承認待ち。関連記事の欄からの相互リンクは 2026-11-17 に本番で両方向とも確認済み)。
品質ゲートの VALUE_MISMATCH は、図の無い指標の本文の値 (自己肯定感の 89.3 / 89.0 / 88.2) を、近くにある別の指標 (朝食) の図の値と照らして誤検知する。
- **移した残り (2026-11-24・旧 PRODUCT-SALES-READINESS-01)**: Kindle S2-01 旧版のレビューで、ランキングの公開本文に誤りが見つかったまま残る (DID 可住地分母、死亡率と件数、従属人口指数と就労者、都道府県率の合算、単純平均と全国値、相関からの因果・算術の誤り)。原典で計算し直し、ランキングの解説の担当 (ranking-content-author) へ直しを渡す。

### [METRIC-GATE-FOLLOWUP-02] 指標の定義と単位に残る小さい不具合 (第 3 波の実行で見つけた分)
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-11-14]

- **済み (2026-11-14・64f91ead9)**: 1 発電電力量の単位を MWh に統一。
- **残り (5)**: タイトルに「推移」を含まない line-chart のうち観測年が 5 点未満の 6 図 (labor-wages の labor-wages-gender-gap と、occupation-salary の theme-occ-medical-trend・theme-occ-it-trend・theme-occ-edu-trend・theme-occ-transport-trend・theme-occ-service-trend。指標の宣言年は gender-wage-gap が 2021〜2022 年、職業別年収 14 指標が 2020 年と 2023 年) を、数値タイル (metricGroups の view: tiles) か 2 点の比較に向く表示に替える。図を替えたあとで `packages/data-configs/scripts/validate-theme-catalog.ts` の validateChartTemporalFit の閾値を `count <= 1` から `count < MIN_TREND_YEARS` (display-semantics から import) に広げ、タイトルに「推移」が無い 2〜4 年の図が拾われるテストを足す (広げた直後は 15 件の新しい warning が出て quality-warning-ratchet が落ちるので、図の置き換えと同じコミットにする)。`.claude/rules/theme-catalog-standards.md` の chart-temporal-fit の行も書き換える。
- **完了条件**: 6 図が 5 点以上の推移か数値タイルになり、validateChartTemporalFit が `MIN_TREND_YEARS` 未満を warn し、`npm run preflight:pr` と `npm run validate:catalog --workspace=@stats47/data-configs` が通る。

### [CI-TOOLING-FOLLOWUP-02] CI と検査の道具に残る穴 (第 3 波の実行で見つけた分)
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-11-14] [待ち:承認]

- **済み (2026-11-14・4d4f27027)**: 1 (check-runtime-budget.test.cjs を PR の CI に配線)、2 (check-*.cjs 28 本と preflight-commit.mjs が CLAUDE_PROJECT_DIR をルートにしない。)
- **済み (2026-11-15・オーナー承認)**: `pre-bash-safety.js` の rm -rf の止めを案 (a) で直した。
- **残り (判断)**: Scoped Workflow Contract Gate (`npm run test:scoped-workflow-contracts`) は 2026-09-18 の 1 ファイル 69 test・76 秒から、3 ファイル 141 test・194 秒 (run 43368836421) に増えた。手元で 1 ファイルずつ測ると ranking-scoped-workflow 106 秒 (86 test)・data-refresh-scoped-workflow 64 秒 (49 test)・r2-overlay-server 1 秒未満で、増加は対象のテストが増えた分と対応する。選択肢は 3 つある。(a) 差分連動の step (workflow とテスト自身が変わった PR だけ走る) なので現状を受け入れる。(b) `.claude/config/check-runtime-budgets.json` の ciSteps に予算を登録して、これ以上の増加を止める。ただし ciSteps は「常に走る 4 step の合計 100 秒以下」をテストが固定しているので、差分連動の step を別枠にする変更が要る。(c) ranking-scoped-workflow.test.mjs を 2 ファイルに分け、node --test のファイル並列で壁時計を縮める。推奨は (b) で、根拠は、所要時間が 2.5 倍になるまで誰も気づかなかった原因が、この step に予算の検査が無いことにあるため。
- **完了条件**: 6 は、scratchpad 配下の rm -rf が通り、ルートとホームの削除は止まることを固定するテストがある。4 は、選んだ案がこのカードに書いてあり、(b) か (c) を選んだ場合は、直す前に落ちて直した後に通る検査がある。
- **追補 (2026-11-15)**: `npm run test:packages` の全件で `packages/product-factory/tests/free-sample.test.ts` の「generates a complete-font PDF…」が 1 回だけ落ち、単独と再実行では通った (負荷のかかったときの時間切れとみられる)。再現: `npm run test:packages` を 2〜3 回。
- **オーナー決定 (2026-11-24)**: 推奨どおり (b) ciSteps に予算を登録して増加を止める を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: 差分連動の step を別枠にする check-runtime-budgets.json の変更案とテストを作る。設定 (.claude/config/) の反映の実行はオーナーの承認の後
- **進捗 (2026-11-24・39f5fc903)**: 差分連動の step を別枠 (scoped) にする checker とテスト (16 件。追加 5 件のうち 4 件は変更前の checker で落ちることを確認) を入れた。残りは設定の反映 (`scopedSuiteBudgetMs` 200000 と scoped-workflow-contracts の step の登録) と pr-quality-check.yml へ経過秒を渡す行の追加で、変更案はコミット本文にある。反映はオーナーの承認の後。

### [CI-TOOLING-FOLLOWUP-03] CI と開発の道具に残る穴 (第 4 波の実行で見つけた分)
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-11-14]

- **packages/ops の themes の型 (2026-11-21・SCRIPTS-TO-PACKAGES-02 から)**: `packages/ops/tsconfig.checkjs.json` に `src/themes/**/*.mjs` を足すと型エラー 76 件。JSDoc で直して範囲に入れる。`ingest-bridge-inspection-age.mjs:33`・`ingest-shelter-applicability.mjs:38` の ROOT を `process.cwd()` からファイルの位置へ直す。
- **移動の道具の穴 (2026-11-21)**: `npm run claude:scripts:move` は、テストの中の fixture の文字列 (`'../../../../packages/x'` のように、移した先で実在するパスに偶然当たるもの) を相対 import と取り違えて書き換え、一覧にも出さない。テストの中の文字列リテラルを対象から外すか、書き換えた行を一覧に出す。
- **済み (2026-11-14・fe3988b31)**: 項目 1〜7 は修正し、直す前に落ちて直した後に通るテストで固定した。 (参照: 64f91ead9)
- **残り (判断)**: geo.analyses の contentId 3 件 (geo-107・geo-128・geo-129) は、business-plan.content-opportunities (geo-001〜geo-100) に無いため、check-datasets が warning を出し続けている。選択肢は 2 つある。(a) 事業計画にこの 3 件の機会を足す。(b) 3 分析の contentId を既存の機会の ID に直す。この 3 分析が事業計画の外で始めた分析なら (a) を推奨する。根拠は、datasets.mjs が事業計画の担当に判断を任せると宣言していることである。
- **残り (計測)**: 最大の負荷は middleware ではなく Worker 全体なので、Worker 全体のサイズを測る。手順は、OpenNext で build してから `wrangler deploy --outdir bundled/ --dry-run` の Total Upload を読み、64 MiB と起動時間の上限 1 秒と比べる。
- **完了条件**: geo の 3 件の warning が消えるか、残す理由が台帳に書いてある。Worker 全体の Total Upload の実測値と上限の比較が、このカードに書いてある。
- **追補 (2026-11-14)**: `.claude/scripts/page-quality/__tests__/ui-findings.test.mjs` は `node --test` だけでは `lib/ui-report` を解決できずに落ち、`node --import tsx --test` なら通る。どの入口で回す前提かをファイルの冒頭に書くか、tsx 無しで動く import に直す。`push-r2-wrangler.ts` には diff-push-r2 の止め (一覧失敗・正本の上書き・読み戻し) が無いのに、`.claude/scripts/blog/` の 4 スクリプト (backfill-source・resolve-scatter-axes・rerender-ranking-columns・restore-findings-from-svg) と `push-article-md-r2.ts` の冒頭がローカルからの反映の経路として案内している。案内を workflow に直すか、同じ止めを通す。
- **追補 (2026-11-14)**: `apps/web` の `ranking-header-density-contract.test.ts` は `process.cwd()` に頼っていて、リポジトリのルートから vitest を走らせると ENOENT で落ちる (apps/web からなら 5 件通る)。
- **追補 (2026-11-19)**: `.claude/scripts/lib/__tests__/lib-tests-wiring.test.cjs` は `.ts` の lib テストを配線の検査の対象にしていない (`dataset-registries.test.ts`・`r2-key-classes-run-sh.test.ts` は手で `test:claude-lib-contracts` に入れた)。`.ts` も対象に足す。
- **追補 (2026-11-19)**: 地域コードの直書きの検査 (`packages/area/scripts/check-area-year-entrypoint.mjs`) の基準に、`.claude/scripts` の既存の直書きが載っている (apps と packages は 2026-11-19 に正本へ置き換え済み)。スクリプトを触ったときに `@stats47/area` か鏡 `lib/prefectures.cjs` の関数へ替え、基準を減らす。 ほかに 2 つの写しが残っている。`packages/area-profile/src/highlights/select-area-highlights.ts` の `PREFECTURE_COUNT = 47` は、SNS のスクリプトが相対パスで直接読む「パッケージの外を import しない」契約のため残した (契約を見直すか、`@stats47/area/area-code` だけは読んでよいことにする)。`packages/data-configs/src/open-data-catalog/normalized-table.ts` と `src/area-axis.ts` は `@stats47/area` ではなく `../../../area/src/constants/prefecture-codes` を相対パスで読んでいる (出口 `@stats47/area/area-code` に替えられるか確かめる)。
- **追補 (2026-11-19)**: `npm run preflight:pr` は workspace の CI 契約 (`.claude/scripts/lib/__tests__/workspace-ci-matrix-contract.test.cjs`) を回さない。PR #1288 で `ops`・`ui-theme` にテストを移したのに `testPolicy` が `none` のままで、手元の preflight は通り CI の Static Gates で初めて落ちた。再現: `node --test .claude/scripts/lib/__tests__/workspace-ci-matrix-contract.test.cjs`。preflight の一覧に足すかを決める。
- **追補 (2026-11-15)**: Codex のセッション (`OPENDATA-ARCHIVE-01`) は `agent:session` に cwd を本体 (`/Users/minamidaisuke/stats47`) として登録していたが、実際の編集は別 worktree `/Users/minamidaisuke/stats47-opendata` で行っていた。このため本体で登録する別セッションに毎回「重複の可能性」の警告が出て、実際に重なる場所は検知されない。登録時に `git rev-parse --show-toplevel` の値を cwd に使っているか (`.claude/hooks/session-guard.js`) を確かめる。
- **追補 (2026-11-21・週次レビュー W46)**: `npm run reference:expansion -- status --json` などの `--json` 出力は npm のバナー行 (`> ...`) が先頭に混ざり、そのまま JSON.parse できない (`npm run -s` で回避できるかを確かめ、手順書の例を直す)。`.claude/todo/weekly.md` が土曜のレビュー前に次週分へ上書きされ、前週の Must の checkbox の実績が git 履歴にしか残らない (W46 のレビューは 719098a3db の版から読んだ)。週次計画の上書きの時点をレビューの後に揃えるかを決める。
- **追補 (2026-11-21・週次レビュー W46)**: `audit-operations-cycle.mjs --stage plan --week 2026-W48` を週の途中に実行すると、まだ終わっていない週の snapshot・verdict・review を FAIL と出す。weekly-plan の SKILL.md の手順は `--week` を省いている。計画の段で渡す対象週 (レビューした週か計画する週か) を SKILL.md に書く。

### [HOOK-STOP-AUDIT-SCOPE-01] Stop hook の整合性監査が、他セッションの変更まで数えて同じ会話を何度も差し戻す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理]

- **事実**: 会話記録 44 本で Stop の差し戻し 222 回のうち約 130 回 (58%) が `check-consistency-on-stop.js`。作業ツリー全体の変更を数えるので、並行セッションの変更で「18→26→34 件」と再発火する (hook のコメントに記載)。
- **次**: 数える範囲を、この会話の transcript で Edit/Write したファイルに絞る (`check-findings-on-stop.js` と同じ読み方)。
- **完了条件**: 他セッションだけが変えた状態で Stop しても差し戻さないことをテストで固定した。

### [HOOK-BASH-ADVISORY-NOISE-01] pre-bash-safety の注意書きが、実行でないコマンドにも出て毎回再注入される
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理]

- **事実**: 注入 632 回・15.7 万字。177 回 (28%) はパスや文字列への一致 (sns は 133 回中 127、r2 は 53 回中 37)。branch-workflow は push のたびに 446 回。
- **次**: advisory の一致を `DANGEROUS_PATTERNS` と同じくコマンド先頭に限り、同じ advisory は 1 会話 1 回にする。
- **完了条件**: 文字列にだけ `git push`・R2・SNS の語を含むコマンドで注入されないことと、実際の push では出ることをテストで固定した。

### [CI-NPM-CACHE-01] workflow 49 本のうち 46 本が npm ci をキャッシュ無しで実行している
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **事実 (11-08〜11-21 の 1,000 run)**: npm ci は 42〜83 秒、キャッシュの復元は 9〜14 秒 (develop gate・PR で実測)。deploy は 83 秒、fetch-metrics は 3 job とも約 80 秒。
- **次**: 人が待つ deploy-workers・blog-auto-publish・data-refresh・sync-snapshots から復元を入れ、残りへ広げる。
- **完了条件**: 4 本の run で npm ci の step が 20 秒未満になった実測を、このカードに書いた。
- **進捗 (2026-11-24・fd7a9f7af)**: 人が待つ 4 本の workflow の 6 job に node_modules の復元だけのキャッシュを足した (key は develop gate と同じ)。残り: 4 本の実 run で npm ci の step が 20 秒未満になったかを実測する。キャッシュの key の名前が node20 のままで、全 workflow は Node 22 で動く (動作への影響は無いが名前と実体が合わない)。

### [CI-PR-WAIT-01] PR の検査は中央値 12.9 分で、安い検査で落ちても赤と分かるまで約 13 分かかる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **事実**: `pr-quality-check.yml` の Unit Tests は web 250 秒 + packages 334 秒 + admin 83 秒を 1 job で直列 (12.1 分)。
- **次**: ①Unit Tests を develop gate と同じ並列の job に分ける ②metadata の生成を build と並べる ③Static Gates が落ちたら残りを止める ④preflight に Web unit と Catalog Gates を足すかを決める (`CI-TOOLING-FOLLOWUP-03` の preflight の追補と合わせる)。
- **完了条件**: PR の run の中央値と、Static Gates の失敗が赤になるまでの時間を、前後の実測で比べて書いた。

### [CI-CRON-TIMING-01] 定期実行が R2 の鍵と時刻で人の作業・互いの計測とぶつかる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **事実**: ①11-14 23:29 の手動 deploy が、`r2-isr-gc` (最大 25.6 分) と `cleanup-r2-sns-videos` の直後で開始まで 21.8 分待った ②schedule の起動は cron より 3.3〜7.5 時間遅い (fetch-metrics は 01:00 JST の予定が 06:53・07:35) ③`fetch-metrics-weekly` と `quality-suite-weekly` が同じ cron `0 16 * * 5` で、13 job と本番への巡回が重なる。
- **次**: ①GC と cleanup を実際に動く時刻で人の作業時間から外す (鍵を prefix で分ける案は、書き込み先の照合が先) ②後段 (note-figure・ledgers・seo-keyword・smoke) を時刻ずらしでなく workflow_run でつなぐ ③品質系を計測の後へつなぐ。
- **完了条件**: 2 週の run で、後段が計測の完了の後に起動し、手動 deploy の鍵待ちが 5 分未満だった記録がある。

### [ALWAYS-LOADED-TRIM-01] 毎会話に読み込む指示 (概算 3.1 万 token) を減らす
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-11-22] [領域:管理]

- **事実**: CLAUDE.md 187 行・常時 rules 2 本 366 行 (553/600 行・DG070)、MEMORY.md 200 行。
- **次**: ①rules の表を docs-vs-issues.md へ移し、DG072 の検査を同じ差分で直す ②MEMORY.md の索引を領域ごとにまとめ直して 170 行以下にする。
- **禁止**: 常時 rules の追加・削除はオーナー判断。
- **完了条件**: CLAUDE.md + 常時 rules が 500 行以下、MEMORY.md が 170 行以下で `npm run docs:check` が通る。

### [AGENT-DORMANT-CONSOLIDATE-01] 起動の記録が無い agent 40 本を、統合するか休眠にするかを決める
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理] [待ち:判断]

- **事実**: agent 59 本のうち起動の記録があるのは 19 本 (model-usage W29〜W47 と会話記録 132 本)。残り 40 本の description 6,012 字が毎回の一覧に載る。40 本とも名前で 3〜40 ファイルから参照されている。
- **選択肢**: (a) 系統ごとに統合する (theme 5 本・ranking 5 本・A8/ASP 5 本・UI レビュー 3 本)。(b) 定義を残し、一覧に載らない置き場へ移す (IG 停止中の instagram-strategist など)。(c) 変えない。推奨は UI レビュー 3 本と A8/ASP 5 本から (a)。
- **完了条件**: 系統ごとの扱いを決め、決めた分の定義と参照 (`check-agent-skill-consistency.cjs`) が一致している。`SKILL-AGENT-RULES-TO-CHECKS-01` とは別の範囲 (あちらは定義の中身)。

### [SKILL-INVENTORY-TRIM-01] skill 161 本の登録の前提を決め、使われていない 8 本と重なる組を整理する
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理]

- **事実**: `<群>/<名前>/` の入れ子なので Skill ツールに 1 本も登録されていない (09-14 に `Skill("weekly-plan")` が Unknown skill)。
- **判断**: 「Read する文書」の前提を明文化する (起動時 0 token) か、平坦にして登録する ([概算] +約 2 万 token/会話)。推奨は前者。
- **完了条件**: 前提が `skill-code-placement.md` か skills の README に 1 段落で書かれ、8 本と重なる組の残す・統合・削除が決まって反映された。
- **オーナー決定 (2026-11-24)**: 推奨どおり 「Read する文書」の前提を明文化する (平坦にして登録しない) を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: skill-code-placement.md か skills の README に前提を 1 段落書き、8 本と重なる組の残す・統合・削除を洗う

### [CODEX-MIRROR-SLIM-01] Codex 向けの写し (.agents/skills・.codex) の複製と手保守をやめる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理]

- **事実**: `.agents/skills` は SKILL.md の複製 161 本 (1.43MB) + symlink 153 本。
- **次**: ①SKILL.md も symlink にするか写しをやめる ②hooks.json を `sync-codex-mirror.cjs` で settings.json から生成する。
- **完了条件**: 写しの複製が 0 本で、hooks.json が生成物になり、`sync-codex-mirror.cjs --check` が差分を止める。

### [WEB-PUBLIC-UNUSED-ASSETS-01] apps/web/public に、参照の無い土木の画像 19 枚 (36.3MB) がデプロイのたびに送られている
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **事実**: `apps/web/public/images` の civil-engineering-*・brand-civil/concrete/pe-* 19 枚は、検査の基準 2 ファイルからしか参照されていない。
- **次**: ①19 枚を消し、基準の行を外す ②135 本は本番のアクセスログか URL の組み立て元で使用を確かめてから分ける。
- **完了条件**: 19 枚が消えて `npm run check-datasets` が通り、135 本の使用・不使用の一覧がこのカードにある。

### [APPS-KNIP-UNUSED-01] apps の未使用ファイルと export を knip の結果から消す
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:npm run type-check] [起票:2026-11-22] [領域:サイト]

- **事実 (2026-11-22 の knip)**: web は未使用ファイル 11 (ads/server.ts・slots.ts・ogp/AreaOgp・BlogOgp など)・export 153・型 118。admin は export 66・型 124。remotion は Remotion 用の入口の設定が無く参考値。
- **次**: web の 11 ファイルを呼び出し元の検索 (動的 import・文字列での参照を含む) で確かめて消す。remotion の入口を `knip.config.ts` に足す。export と型は触ったファイルから減らす。
- **完了条件**: web の未使用ファイルが 0 で、type-check と web・admin の vitest 全件が通る。

### [CI-TOOLING-FOLLOWUP-04] CI の run の無駄と名前のずれ (2026-11-22 の全体の洗い出しで見つけた分)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト]

- **索引の作り直し**: `blog-auto-publish.yml` は 1 run で 515 秒 (18.9 分の 27%)。11-09 は 7 時間で 8 run。差分だけ更新できるかを索引の作り方で確かめ、できなければ同時期の push を 1 回にまとめる。
- **CodeQL の二重**: 既定の設定の "codeql" (105 run・中央値 4.3 分) と `security-scan.yml` の CodeQL step (243 秒・80 run) が両方動く。片方にまとめる。
- **起動しない workflow**: 13 日で 0 run の dispatch 専用が 10 本 (backlog-routing-policy-weekly・post-threads-scheduled・threads-token-refresh・commute-flow-ingest・google-admin-settings・infra-history-publish・kakei-axis-charts・ksj-aggregate-ingest・regenerate-blog-svgs・generate-ogp-images)。estat-ssds-enum は名前が weekly で schedule が無い。30 日の run 数で確かめ、名前と起動条件を合わせるか消す。
- **完了条件**: 3 項目それぞれに、直した結果か残す理由が書いてある。

### [NOTE-PRODUCT-ZIP-ARCHIVE-01] note 有料記事の添付 ZIP (商品ファイル) を private R2 に保全する経路を作る
タグ: [収益化] [種類:改善] [実行:別環境] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: `note:article save` は記事ディレクトリ (docs/31 の作業コピー) だけを保存するので、`.local/note-product-archives/P-NN-*.zip` や `.local/geo-products/` の添付 ZIP はこの Mac にしか無い (廃止した `publish-paid-note-private-r2.ts` は private R2 に `product/<name>.zip` として写していた)。
- **次**: ZIP を記事の作業コピー (`product/<name>.zip`) に置いて `save` する (R2 の 1 オブジェクト上限 16MB を超えるものは分ける) か、
  Kindle と同じ暗号化 archive (`kindle-archives.json` の方式) を note 商品にも広げるかを決めて実装する。product-factory の `_noteDelivery` の SHA と照合できるようにする。
- **完了条件**: 公開済み・公開予定の有料記事の添付 ZIP が private R2 にあり、別の端末から SHA 照合付きで取り出せる。

### [PRODUCT-PACK-CONTENT-MISMATCH-01] データパックの目的文・出品文・見本画像が中身と食い違っている
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-12] [領域:商品] [待ち:承認]

- **済み (2026-11-14・`b76197bfe`)**: SOURCES.csv の調査名欄は調査マスタの名前で書き、指標名と表名を入れない。
- **残り (承認)**: 今の販売 ZIP (v4、P-14 は v5) は旧 LICENSE (P-06 は教育機関、P-07 は本人のみ) と旧 SOURCES のまま。新しい版を生成して private R2 に保全し、note の添付を差し替えるか (note への外部変更・添付の upload は 1 日 10 回まで) をオーナーが決める。
- **残り**: 公開 note の有料本文の許諾範囲と P-11 の画像の説明が、実物 (1 法人ライセンス・地図の独立画像は各 1 枚) と合うかを読んで確かめる。Mac 版と Windows 版の Office での実機確認 (この Mac には Office が無い。P-14 v5 は owner-pending)。算出指標の行の URL は最初の親指標の URL のままで、親が 2 つある行は URL 欄に 1 つしか出ない。
- **完了条件**: 販売中の添付の SOURCES・LICENSE が今の生成と一致し、note の本文の許諾範囲が 1 法人と書かれ、全パックの Office 実機確認 (Windows と Mac) が記録されている。

### [SNS-SOURCE-METADATA-01] SNS素材の仕上げで確認した期間・分母・単位の差異を指標定義と配信snapshotへ反映する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-12] [領域:管理] [待ち:判断]

- **済み (2026-11-15)**: sync-snapshots (run 43671404197) の後、R2 の item.json で郵便局数・街区/近隣/運動/都市公園数の副題が「可住地面積100km²当たり」、クリーニングの題名が「クリーニング業数」になったことを確認した。
- **済み (2026-11-14・381b947cc)**: 郵便局数と公園 4 指標の副題を「可住地面積100km²当たり」に、クリーニングの題名と seoTitle と県データブックの短い名前を原表どおり「業数」に直し、原表の項目名との照合を packages/data-configs の検査にした。 (参照: 3d5c87fd9)
- **残り**: main へ入った後に、CI の sync-snapshots で配信 item と派生 snapshot を再生成し、配信中のランキング 6 件の題名・副題が新しい定義と一致することを確かめる。cleaning-shop-count-per-100k の単位を原表の「施設」へ変えるかは、他の SSDS 指標の「所」と揃えるかどうかを含めてオーナーが決める。
- **完了条件**: 配信中の 6 ランキングの題名と副題が原表の項目名と一致し、apps/web/public/search-index.json に旧題名が残らない。

### [NOTE-READINESS-20261024] note記事台帳の未公開レコード60件を整理する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-24] [領域:商品]

- **現在地**: 10/25、427公開・62未公開。元100下書きから25件公開・13件統合済み。証拠は `data/note/evidence/note-draft-publication-audit-20261024.json`。
- **方針 (10/24 の指示)**: 全件の公開を優先し、詳細な品質確認は後追い。実機未確認の記事は未確認と明示して公開する。P-01〜P-12 と P-14 の有料パックと Geo 検査キットは、ZIP・採用カバーを private R2 で照合して公開済み。QGIS 実機検証は後追い。
- **残件**: 販売54件（納品物未作成）、本文未作成6件、統計値未入力2件。現行パック証拠は `data/products/note-pack-regeneration-2026-10-24.json`。地図資料サービスは受付休止中。
- **カバー配信照合の残り**: P-03/P-04/P-08/P-09はnote上で公開済みだが画素差ゲートを僅かに超過しており、管理画面では反映待ちとして残す。値と理由は記事別監査の `publishedEvidence.coverPixelVerification`。公開画像と採用画像の目視差を確認し、必要ならカバーのみ再適用して再照合する。
- **公開後の図**: 人口密度の既存記事は本文一致で統合。未掲載の地図・上位図、欠けた箱ひげ図は既存記事に追補する。
- **停止条件**: 投稿先がstats47でない、本文・価格・有料境界・約束した添付物が存在しない、同題の公開記事がある場合は投稿しない。未確認操作は記事に明示する。
- **完了条件**: 残件を公開・配信照合するか、同題の既存公開記事へ統合し、未公開台帳を0件にする。作業コピーはR2照合後に削除する。

### [UI-FIX-RANKING-20261011] UI 是正: ranking の週次 UI 検査の指摘 4 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-desktop-1440.png)。
- **対象**:
  - `agent|ranking` (Claude の確認)
    - [desktop-1440/high] デスクトップ 1 枚目下部、地図の右隣の順位表。右端の「偏差値」列: 順位表の右端の列が切れています。見出し「偏差値」が半分しか見えず、各行の値も「9」「7」「6」のように先頭の 1 文字だけが見えます。読者は偏差値を読めません。 → 表を横スクロール可能なコンテナに入れるか、列幅を詰めて偏差値列が枠内に収まるようにする。
    - [mobile-390/medium] スマホ 2 枚目、地図左下の「淡色地図 / 標準地図」切替ボタン (デスクトップ 2 枚目の地図左下でも同様): 地図の凡例カード (分位区分) が、地図の切替ボタンの上に重なっています。ボタンの文字が一部隠れて読みにくく、押しにくそうです。 → 凡例を切替ボタンと重ならない位置 (地図の外、または右下) に移す。
    - [desktop-1440/medium] デスクトップ 1 枚目、「上位3件と最下位」カードの横軸ラベル (スマホ 1 枚目でも同様): 総人口の軸の下端が「-162,605」と負の値で表示されています。人口は負にならないので、読者が意味を取り違えたり、軸が誤っていると感じたりします。 → 件数や人口のように負にならない指標では、軸の下端を 0 以上にする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|ranking|same_shop_ad_duplicates` — same_shop_ad_duplicates: 99 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/ranking/agricultural-land-conversion-area / https://stats47.jp/ranking/apartment-ratio / https://stats47.jp/ranking/architect-annual-income
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: 楽天商品カードの選定で同じ店を 1 枚 1 件までにした (selectQualityItems + rakutenShopKey、test 追加)。別カード間の重複は次の週次で残れば再起票)
  - `machine|ranking|title_changed` — title_changed: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/ranking/production-age-population-ratio
  - `machine|ranking|unit_symbol_mixing` — unit_symbol_mixing: 425 URL (最大 13、閾値 <= 0)。例: https://stats47.jp/ranking/academic-achievement-test-average-rate / https://stats47.jp/ranking/agricultural-income-ratio / https://stats47.jp/ranking/agriculture-forestry-fisheries-expenditure-ratio-pref-finance
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: 関連ランキング・カテゴリ一覧表・KPI 部品の単位を formatUnitForDisplay、AI 解説本文の数字直後の ％ を normalizePercentInText で表示時に % へ揃えた。localhost /ranking/abandoned-cultivated-land-area で ％ 0 件)
- **表示の意味 (定義単位で直す)**: 箇所は週次 `latest.json` の `ui_findings`、全 URL は `violations`。直し方は `.claude/rules/page-quality-standards.md`「表示の意味の検査」の「直し方」。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-PREFECTURE-DETAIL-20261011] UI 是正: prefecture-detail の週次 UI 検査の指摘 5 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-desktop-1440.png)。
- **対象**:
  - `agent|prefecture-detail` (Claude の確認)
    - [mobile-390/medium] スマホ 3 枚目、指標一覧の「合計特殊出生率」行 (東京都): 合計特殊出生率が「1 人」と表示されています。同じページ上部の特徴欄では「0.99人」なので、値の丸めが食い違っています。単位「人」も紛らわしく、小数が失われて 47 位との差が分かりません。 → 小数 2 桁で表示し、単位表記を他の欄と揃える。
    - [mobile-390/medium] スマホ 3 枚目、「年齢3区分人口の推移」の積み上げ面グラフ: グラフの縦軸・横軸の目盛り文字が極端に小さく、スマホではほぼ判読できません。 → スマホでは目盛りの数を減らしてフォントサイズを大きくする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|https://stats47.jp/areas/01000|small_text_count` — small_text_count = 78 (閾値 <= 56)
  - `machine|https://stats47.jp/areas/13000|small_text_count` — small_text_count = 78 (閾値 <= 56)
  - `machine|https://stats47.jp/areas/47000|small_text_count` — small_text_count = 76 (閾値 <= 56)
  - `machine|prefecture-detail|unit_symbol_mixing` — unit_symbol_mixing: 47 URL (最大 2、閾値 <= 0)。例: https://stats47.jp/areas/01000/tourism / https://stats47.jp/areas/02000/tourism / https://stats47.jp/areas/03000/tourism
- **表示の意味 (定義単位で直す)**: 箇所は週次 `latest.json` の `ui_findings`、全 URL は `violations`。直し方は `.claude/rules/page-quality-standards.md`「表示の意味の検査」の「直し方」。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。
- **棚卸し (2026-11-24)**: 残る指摘は 3 点。① 「平均初婚年齢（妻）（妻の年齢）」の括弧の重複は、県データブックの snapshot を作る `packages/area-profile/src/exporters/area-databook-snapshot.ts:211` が title と subtitle「妻の年齢」をつないでいるのが原因 (直したら databook.json を再生成する。作り直せる派生物) ② 「教養娯楽費割合」の分母の明記は `data/metrics/culture-recreation-expenditure-ratio-multi-person-households.ts` の定義の変更が要る ③ 年と年度の混在は出典の年の表記 (警察官数は年度の統計) なので、変えるかを決める。

### [UI-FIX-MUNICIPALITY-20261011] UI 是正: municipality の週次 UI 検査の指摘 2 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-desktop-1440.png)。
- **対象**:
  - `agent|municipality` (Claude の確認)
    - [tablet-768/medium] タブレット 1 枚目、「千代田区の特徴」カード: 千代田区の上位指標がすべて「2006年度」のデータです。読者は最新の特徴だと受け取りかねません。年が古いことを知らせる注記がありません。 → 古い年度の指標には「古い年度のデータ」の注記を付けるか、新しい年度の指標を優先して出す。
    - [tablet-768/low] タブレット 1 枚目下部、「東京都の市区町村」一覧: 一覧の最終行 (日の出町・檜原村など) が枠の下端で文字の途中で切れています。スクロール領域だと分かりません。 → 枠の下端にフェードやスクロールの手がかりを付けるか、全件を表示する。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|municipality|title_changed` — title_changed: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/areas/29000/cities/29204
- **表示の意味 (定義単位で直す)**: 箇所は週次 `latest.json` の `ui_findings`、全 URL は `violations`。直し方は `.claude/rules/page-quality-standards.md`「表示の意味の検査」の「直し方」。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。
- **棚卸し (2026-11-24)**: 残る指摘は「65歳以上人口割合 2020年度」の 1 点。市区町村データブックに焼き込まれた年の表記 (yearName) で、国勢調査由来の指標を「年」で書く直しは指標の定義か生成側で行い、データブックを再生成する (作り直せる派生物)。

### [UI-FIX-BLOG-ARTICLE-20261011] UI 是正: blog-article の週次 UI 検査の指摘 10 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-desktop-1440.png)。
- **対象**:
  - `machine|blog-article|abnormal_value_strings` — abnormal_value_strings: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/cc-estat-12-housing-treemap
  - `machine|blog-article|internal_jargon_terms` — internal_jargon_terms: 3 URL (最大 8、閾値 <= 0)。例: https://stats47.jp/blog/2050-population-flood-exposure / https://stats47.jp/blog/2050-population-map-reading / https://stats47.jp/blog/2050-station-access-population
  - `machine|blog-article|same_shop_ad_duplicates` — same_shop_ad_duplicates: 6 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/dual-income-house-size / https://stats47.jp/blog/homeownership-vacancy-four-types / https://stats47.jp/blog/household-growth-population-decline-census-2025
  - `machine|blog-article|title_changed` — title_changed: 24 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/ai-claude-code-pref-analysis / https://stats47.jp/blog/area-ratio-prefecture-gap / https://stats47.jp/blog/bonito-catch-zero-prefectures-gap
  - `machine|blog-article|unit_symbol_mixing` — unit_symbol_mixing: 14 URL (最大 4、閾値 <= 0)。例: https://stats47.jp/blog/beef-consumption-quantity-vs-municipal-road-paving-rate / https://stats47.jp/blog/beef-consumption-quantity-vs-unmarried-ratio-male-45-49 / https://stats47.jp/blog/chicken-consumption-prefecture-gap
  - `machine|https://stats47.jp/blog/cc-estat-04-aging-heatmap|blog_svg_text_issues` — blog_svg_text_issues = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/cc-estat-17-edu-slope-graph|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/child-height-regional-gap|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/commercial-land-price-trend|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/communication-cost-burden|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
- **記事チャート SVG (振り分けてから直す)**: まず `npx tsx .claude/scripts/blog/plan-svg-text-fix.ts @data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt` を実行する。`regen-fixes` は生成器が既に正しく、R2 の SVG を作り直すだけで直る (コード変更なし)。R2 への反映はオーナー承認が要るので、出力された `gh workflow run regenerate-blog-svgs.yml …` を書いた `[実行:ユーザー]` カードを起票し、対象を `--mark-owner` で紐付ける。`generator-fix` は `packages/svg-builder` の該当チャートを直し、長いラベルの fixture テストを足してから再実行して `regen-fixes` になることを確かめる (以降は同じ手順)。`no-data` は data JSON が無く作り直せないので、手作業の brushup を依頼するカードを起票して `--mark-owner`。`clean` は既に直っているので `--mark-fixed`。
- **表示の意味 (定義単位で直す)**: 箇所は週次 `latest.json` の `ui_findings`、全 URL は `violations`。直し方は `.claude/rules/page-quality-standards.md`「表示の意味の検査」の「直し方」。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [BLOG-LINK-410-REMAP-01] ブログ本文の 410 になったランキングへのリンク 5 件を置き換える
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [検証:node .claude/scripts/blog/fix-broken-internal-links.mjs] [起票:2026-10-10] [領域:サイト]

- **状態**: 残っていた 3 記事の 410 リンク (`elderly-population-ratio`・`foreign-population-per-100k`・`population-density-habitable`) は、2026-10-28 にオーナー承認で article.md を R2 へ上げて置き換えた (置換表 `.claude/scripts/blog/data/broken-link-remap.json`)。`fix-broken-internal-links.mjs` は毎回 R2 を読むように直した (`.local/blog-linkfix/out` には 7 月の修正版が約 50 本残っているので、丸ごと `--src` に渡さない)。`data/blog/internal-link-audit.json` (2026-10-30) は `broken: 0`。
- **残り**: 410 の置き換えとリンク監査 #752 の close は済み (2026-11-24 に `gh issue view 752` で CLOSED、`internal-link-audit.json` は broken 0)。残るのは統合した BLOG-LINKROT-01 の判定だけ。
- **完了条件**: 週次監査の internal-links で 410 が 0 件 (2026-10-26 から Issue は作らないので #752 は手で閉じる)。
- **統合 (2026-10-26 オーナー判断): `BLOG-LINKROT-01`** 内部リンク是正後の coverage とブログ→ranking 回遊を判定する (SITE-LINKROT-01 統合済み)
  - 再開条件: 是正デプロイ後に `internal-link-audit-weekly.yml` 最新 run で壊れ 0 を確認できた時。手順: soft 404 タイトル込みで壊れ 0 を検証 → STRICT smoke 200 → GSC coverage を前後比較 → 壊れは本文・生成設定・live 描画の三層に分類 (`[kpi: search-clicks, site-circulation-rate]`)。

### [NOTE-COVER-DELIVERY-VERIFY-01] 文字込み生成カバーの配信検証をnote側の減色に対応させる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-14] [領域:商品]

- **証拠**: 文字込みimagegen画像はnoteの公開PNGがpalette化され、画素平均差 (MAE) が旧閾値を超えて停止する。
- **担当・順序**: image-prompt-curator / note-manager。① この6件の元画像・公開配信画像で減色の再現条件を確認 ② 文字欠落・別画像・色反転・切り抜きの負例を揃える ③ 自動判定と配信SHA単位の目視確認を共通手順にする。
- **停止条件**: 差の原因を説明できない画像や負例が通る判定は採用しない。応答済みPOSTを再送しない。一律の閾値引き上げだけで解決しない。
- **完了条件**: 正常な減色は判別でき、負例は止まり、目視確認は採用元SHA・配信SHA・公開URLに束縛される。関連テストと既存の本文保全・アカウント照合テストが通る。
- **2026-11-04 追加の実例**: 旧形式126本の差し替えで `18-pr-magazine-rewrite` が MAE 5.11 (大差 0.23%) で停止した。公開画像と採用版を並べて同じ画像と確認し、POST は再送せず journal を手で `verified` に閉じた (`note-cover-refresh-ledger-34fc2c90884b49dc.json` の `inspection`)。99本の総当たり (9,702通り) では、同型カバーの `b-ref-prc-a48`/`a50` の取り違えが判定を通った。負例に同型の別記事を入れる。

### [SNS-TRACE-YT-LEGACY-01] YouTube の URL の無い投稿 42 行と content_key 不明の 2 本を Studio で確定する
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npm run sns:trace:check] [起票:2026-10-09] [領域:SNS] [待ち:ログイン]

- **事象**: 投稿台帳を「1 id から全部たどれる」形へ補完した (2026-10-09・`backfill-post-trace.mjs`) が、YouTube の posted 行 42 件 (id 83〜429、2026-03 投稿) は URL も本文も無く、外部 ID をたどれない。指標の時系列に残る未知の動画 ID 94 本のうち公開中は 7 本だけで、残り 87 本は削除済みか非公開 (oEmbed が返らない)。追加した公開動画 7 本のうち `bi2UqZu_vOQ`・`z0cfD_rCgEI` は説明欄にランキング URL が無く content_key が空。
- **次**: オーナーが YouTube Studio の動画一覧 (非公開・削除済みを含む) と照合し、42 行に `post_url` を入れるか、存在しない投稿なら `deleted_at` を記録する。2 本の content_key をタイトルから決める。書き込みは store 経由 (`sns-posts-store.cjs`)。
- **完了条件**: `npm run sns:trace:check` の「外部 ID をたどれない posted 行」から YouTube が消える。

### [DATA-WAGE-TEACHER-COVERAGE-01] 賃金構造基本統計の教員年収ランキングが教員全体の約 5% しか映していないことをページに示すか、公開をやめるかを決める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト] [待ち:承認]

- **済み (2026-11-14・`a7be3eaaa`)**: オーナー決定 (2026-11-14: 公開は続け、推計の人数と注記を出す。)
- **観測 (2026-11-14)**: CI の作り直し (run 43583339428) は成功したが、手動起動の data-refresh は **main** の定義で動く (`ref: ... || 'main'`) ため、推計の人数の無い旧い定義で作り直されただけだった (値は不変)。 (参照: 0003445758)
- **残り (承認済み・2026-11-14 オーナー「賃金の再取得は進めて」)**: CI でこの 40 指標を取り直し (page-data-batch)、ranking-values・ranking-items を作り直して、人数を取る経路を実データで初めて動かす。観測値 `app/stats` の上書きなので R2 の正本の更新にあたる (`todo-standards.md` §7)。宣言が configHash に効くので、40 指標は再取得の対象になっている。
- **残り**: 再取得した sampleCount から職種別の推計人数を集計し、国勢調査の職業別就業者数 (年と出典をそろえる) との比を表にする。比を見て、職種ごとの扱いをオーナーが決める。本番のランキングページの注記は、R2 の item.json が古いので旧文のまま (再生成の後に新しい注記と人数が出る)。
- **停止条件**: 推計人数が小さいことだけを理由に、他の職種の指標を一括で非公開にしない (職種ごとに比を見てから決める)。
- **完了条件**: 40 指標の比の表がそろい、本番のランキングページに推計の人数と参考値が出ている。

### [SEO-CTR-CANDIDATES-01] 取りこぼしクリックの大きい 7 ページを search-growth に渡し、食い合いの 2 組を先に確かめる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-12-05] [領域:サイト] [待ち:承認]

- **GSC案07 / P2（次に着手）**: implementation-neededの8提案と既存7ページを照合し、担当・対象・完了gateを確定する。未実装を公開待ち・承認済みと扱わない。
- **GSC案26 / P2（次に着手・CTR内優先1）**: 道の駅など表示実績のあるページのtitleをpage×queryと実SERPで検討し、1〜2ページから検証する。
- **GSC案27 / P2（次に着手）**: 選んだページの冒頭に答え・対象年・単位を示し、必要な順位表をHTMLで読めるようにする。既存図表との重複は増やさない。
- **GSC案28 / P2（次に着手）**: 公衆電話のrankingを総数・一覧・推移、blogを理由・地域差へ分け、相互リンクする。検索語の重複だけで悪影響を断定しない。
- **GSC案29 / P2（次に着手）**: 国勢調査ハブから40代未婚割合など答えのあるrankingへ案内し、リンク先・表示文言・到達を検証する。
- **GSC案37 / P2（次に着手）**: 実期間・検索語・端末を固定して比較し、類似未変更ページ・順位・季節性・同時変更を併記する。少標本で因果や効果を確定しない。
- **入力**: `GSC-CTR-DECOMPOSE-01` の 2026-10-07 の表と PV 計画 (`PV-PLAN-REVIEW-2026Q4-01`) の CTR 打ち手。
- **済み (〜2026-10-20)**: 食い合いの確認 (公衆電話は食い合いあり・出生率は無し、10-08 の GSC page × query)、公衆電話・出生率の ranking の seoTitle 変更、ブログ 4 本 (公衆電話・道の駅・高校2年男子身長・健康寿命) と第 2 弾 4 本・第 3 弾 4 本の seoTitle 変更は本番反映済み。
- **7 ページの状態 (2026-11-23 確認)**: 公衆電話の ranking は seoTitle を変え、search-growth で承認済み (`ctr-opportunity::/ranking/public-phone-count`、10-19)。出生率の ranking は seoTitle を変えたが、CTR の候補は未承認 (`ctr-opportunity::/ranking/total-fertility-rate`)。ブログの公衆電話・道の駅・高校2年男子身長は seoTitle を変えたが、CTR の候補は 3 件とも未承認 (`ctr-opportunity::/blog/{public-phone-count,roadside-station-count-prefecture-gap,avg-height-high-school-2nd-male}`)。健康寿命のブログは seoTitle を変え、候補の確認はまだ。`/survey/census` は title を変えなかった。代わりに、ハブの読者向けの問いを 40〜44 歳男性の未婚率へ差し替えた (search-growth の台帳 `data/seo/improvement-log.json`・09-13 にデプロイ)。女性の区分は案内の上限 5 件を超えるので足していない。
- **残り (承認)**: ① 未承認の CTR 候補 4 件を、週 2 件・WIP 5 件までの枠で人が承認する (`npm run search-growth:approve -- --candidate <id>`)。11-23 の WIP は 4 件なので、空きは 1 件。承認すると変更日が台帳に入り、完了条件を満たす。③ 出生率の ranking から blog へのリンクは `RELATED-ARTICLES-TIEBREAK-01` で扱う。④ 効果の観測は `SEO-TITLE-CTR-EFFECT-01` (improvement-triage の排他)。⑤ `data/seo/latest-report.json` の pendingPublication は 11-23 時点で 13 件 (すべて `implementation-needed`)。そのうち 4 件 (公衆電話の ranking と blog・道の駅・高校2年身長) は上の 7 ページと同じ URL なので、承認するときに同じ候補として扱い、二重に実装しない。⑥ 7 ページの承認が済んだら、GSC 2026-W41 で順位 4〜15 位・表示 500 以上の 197 本 (`data/gsc/snapshots/2026-W41/pages.csv` を impressions ≥ 500 かつ 4 ≤ position ≤ 15 で抽出) を、表示の多い順に `/search-growth` へ渡す (一括変更はしない)。
- **停止条件**: title の一括置換をしない。食料自給率はデータの年を直す (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01`) まで title を変えない。
- **完了条件**: 7 ページそれぞれに「変えた / 見送った」と理由が記録され、変えたページの変更日が search-growth の台帳にある。

### [LIVABLE-COMPOSITE-CHART-DATA-01] 住みやすい県ランキングの総合スコアの図に、1 人当たり県民所得のデータが紐づいている
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト] [待ち:判断]

- **済み (2026-11-15)**: 本番反映 (#1275) の後、本番の記事で 1〜3 位 (福井 79.9・富山 77.4・島根 72.0) を Googlebot UA で確認した。
- **事象 (2026-10-20 実測)**: `/blog/livable-prefecture-composite-ranking` の図 `data/composite-ranking` は本文では 8 指標の総合スコアを示すのに、R2 の `composite-ranking.json` と `.source.json` は `per-capita-kenmin-shotoku-h27` (1 人当たり県民所得) を指していた。
- **済 (2026-10-23)**: 図を 8 指標の総合スコア (R2 values から再計算・`kind: calculated`) に作り直し、図・data・source.json・本文の 1〜3 位 (福井 79.9・富山 77.4・島根 72.0) を一致させた。quality-gate pass・critic PASS で R2 へ公開済み (記事固有の背景も作成)。
- **残り**: ① 本番への反映はデプロイ待ち (改稿は prerender なので R2 だけでは出ない)。反映後に本番で 1〜3 位を確かめる ② 旧 `radar-comparison.*` は `top3-radar.*` に改名したので R2 に古い 2 ファイルが残る (削除は承認を得て) ③ **決めること**: 「治安」軸の `violent-crime-per-100k` は名前と違って値が粗暴犯の実数 (人口で割っていない)。軸名を「粗暴犯の少なさ」に直し感度分析 (上位 3 県は不変) を本文に足したが、人口当たりに替えるかは未決 (替えると title・seoTitle の 79.9 点が変わる)。指標の名前と値の食い違い自体も直す必要がある。
- **完了条件**: 図・data json・source.json・本文の 1 位〜3 位が一致し、`quality-gate.mjs` が pass。title 変更 (`SEO-CTR-CANDIDATES-01` の候補) とは別に直す。

### [MANUFACTURING-ZONE-CHART-LINEAGE-01] 製造業の記事の工業地帯の図に元データが無く、京浜工業地帯の 57.7 兆円が公開値から再現できない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **済み (2026-11-14・`c06ffefdd`)**: オーナー決定どおり、副題を「総額王者・愛知58兆円 vs 1人あたり王者・大分」にし、要約図の「効率」を「1人あたり」に直した。 (参照: `fc9ad2b3e`)
- **残り (オーナー決定: CI で取り直して戻す)**: 産業構成比の積み上げ図。元の表 0003448099 (2020 年・工業統計・従業者 4 人以上) は軸が「産業中分類 × 都道府県と年をまとめた軸」の形で、既存の `estat-muni-industry.yml` では取れない。代わりに同じ workflow で 2023 年の表 0004035178 (経済構造実態調査・全事業所・万円。2026-11-10 の run 42777511989 で取得実績あり) から上位 10 県を取れる (記事の年 2023 とも合う)。起動前に、この workflow が R2 に書くか (書くなら区分表で作り直せる生成物か) を確かめる。起動: `gh workflow run estat-muni-industry.yml --ref develop -f stats_data_ids=0004035178 -f areas=23000,22000,27000,14000,28000,11000,12000,08000,24000,40000`。都道府県の行がこの表に入っていることは未確認。取得後: (1) `gh run download <run> -n estat-muni-industry` で取り込む (2) 業種を 7 つと「その他」にまとめて `industry-composition-stacked.json` を作る変換スクリプトを repo に置く (3) source.json に `kind: estat`・statsDataId・年・単位・全事業所を書く (4) 積み上げの型で描く (5) 節を戻し、ほかの図は従業者 4 人以上なのにこの図は全事業所だと「データについて」に書く (6) quality-gate と critic。R2 に残っている参照されない `industry-composition-stacked.svg`・`.source.json` (generatedBy が /tmp) は、この作業で置き換えるか消す。
- **完了条件**: 積み上げ図の data json・source.json・SVG と本文の値が e-Stat の公開値と一致し、quality-gate が pass し、critic が PASS。

### [CONTENT-FOOD-TRIVIA-01] 検索クリックの 31% を占める食の消費量の雑学で、需要がありまだ無い品目のランキング・ブログを足す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **前提 (W40 実測)**: クエリが分かるクリックの 31% が食べ物の消費量・特産。2026-10-07 の突き合わせで需要上位 40 品目すべてに公開中のランキングがあり、足りないのはページではなく、**同じ品目の複数ページに表示が割れていること**と分かった。
- **方針**: ② 品目ごとに「入口にするページ」を 1 つ決め、他のページからリンクを集め、title の切り口を分ける ③ 綴り違い・旧 URL のブログ (`/blog/bonito-catch-perfecture`・ranking key と同名の `/blog/fresh-udon-soba-consumption-quantity` など) が表示を受けていれば 301 か canonical で入口へまとめる (`apps/web/src/config/blog-redirects.ts`) ④ 需要上位品目のランキングの title・description を定義を崩さない範囲で検索語に寄せる (例: 清酒に「日本酒」を併記) ⑥ 2025 年報の取り込みは `KAKEI-EXPANSION-02`。新しい品目のページは、需要があってページが無い品目が見つかったときだけ作る。
- **② の入口と足りないリンク (2026-10-08・GSC 28 日)**:
  | 品目 | 入口 | 足りないリンク |
  |---|---|---|
  | うどん | `/ranking/soba-udon-dining-consumption-expenditure` | 入口 → 生うどん数量・干しうどん数量のランキング / 生うどん数量のランキング → 入口と blog / 食文化地図 → 入口 |
  | カツオ | `/blog/bonito-catch-prefecture` | 入口 → かつお購入数量のランキング (本文中の「食べる側」の一文とリンクでつなぐ。図に入れて rankingRefs にしない) / 購入数量のランキング → 入口 |
  | かつお節 | `/ranking/katsuobushi-consumption-quantity` | ランキング → blog `katsuobushi-expenditure-ranking` |
  | ぎょうざ | `/blog/frozen-gyoza-spending-prefecture-gap` | 双方向にある。足さない |
  - ranking の「関連記事」は blog snapshot の `rankingRefs` と相関記事から自動で出る (`RelatedArticlesCard.tsx`)ので、どちらも**記事の書き換えと公開** (contents/blog の送り箱 → publish-blog。オーナー承認) で足す。
- **⑤ ぎょうざの品目**: `gyoza-frozen-consumption-expenditure` (`cdCat01: 010920070`) は「371 ぎょうざ」で、総務省「家計調査 収支項目分類及びその内容例示」2020年改定版により冷凍品は 370 冷凍調理食品へ除外される。metric の subtitle・note は直した (`62a5fe9e1`)。**残り**: blog 本文の「冷凍餃子・持ち帰りの支出を数える」7 か所を「持ち帰りの生・焼きぎょうざ (冷凍品は別品目の冷凍調理食品)」に直して公開し (承認)、ランキングの AI 解説の冷凍の記述も直す。key と slug は URL なので変えない (変えるなら 301 を同時に入れる)。
- **停止条件**: 需要の証拠 (検索表示) が無い品目は作らない。47 都道府県分の薄い記事を一括で作らない。家計調査は県庁所在市の世帯の値であり県全体ではないことを表題と本文で崩さない。
- **完了条件**: 品目の突き合わせ表が残り、追加したページそれぞれの 4 週後の検索表示とクリックが記録されている。

### [BLOG-DUPLICATE-AUDIT-01] 同じ主題・同じ数値のブログが 2 本ずつ公開されている組を洗い出し、1 本にまとめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **済み (2026-11-14・`644802821`)**: 食文化マップ (`udon-soba-food-culture-prefecture-map`) をオーナー決定どおり差別化した (題「近畿は家、関東は外食｜生うどん・そばの地図」、家庭の購入量と外食の支出の 2 枚の地図)。
- **オーナー決定 (2026-11-14)**: 推奨の統合 9 組を進めてよい。
- **次 (統合 9 組。残す ← まとめる)**: 出生率 `fertility-rate-prefecture-gap` ← `total-fertility-rate` (移す: 東京0.99 の節・期間合計特殊出生率の注記・九州の上位の内訳。出典の無い因果の断定は移さない) / 牛肉 `beef-consumption-quantity` ← `beef-consumption-prefecture-gap` (地図) / テレワーク `telework-rate-tokyo-gap` ← `telework-gap-tokyo-6x` / 病床利用率 `hospital-bed-utilization-map` ← `general-hospital-bed-occupancy-rate` (「経営難」の節は出典を確かめてから) / 入院率 `inpatient-rate-prefecture-gap` ← `inpatient-rate-aging-burden` (高齢化の節) / 納豆 `natto-consumption-east-west-divide` ← `natto-consumption-expenditure` (時系列) / ソフトウェア技術者 `software-engineer-salary-prefecture-gap` ← `software-engineer-income-gap` (全国推移) / 空き家と地価 `vacant-housing-vs-land-price` ← `vacant-housing-rate-vs-standard-price-change-rate-commercial` / 小麦粉 `wheat-flour-consumption-prefecture` ← `wheat-flour-consumption-food-culture-gap` (香川と下位の節)。
- **手順 (1 組ずつ・この順を入れ替えない)**: ① 残す記事へ、まとめる側にしか無い節を移し、quality-gate と critic を通して送り箱から公開する ② 公開を確かめてから `apps/web/src/config/blog-redirects.ts` に `"<まとめる側>": "<残す>"` を足す ③ 本番で `curl -sI https://stats47.jp/blog/<まとめる側>` が 301 と残す URL を返すことを確かめる。
- **差別化 4 組 (記事を直す)**: 紅茶 `black-tea-expenditure-ranking` / `black-tea-income-gap` (順位の節を短くして切り口に寄せる)、`engineer-telework-prefecture` (エンジニア向けの切り口に寄せる)、最低賃金 2 本 (2024 年度のままなので最新年度へ取り直す)。残す 6 組は判断表のとおり。
- **停止条件**: 主題が同じでも切り口が違う記事 (相関・地域別・県別シリーズ) はまとめない。301 は 1 組ずつ本番で確かめる。
- **完了条件**: 統合 9 組がすべて 301 で本番に効き、差別化 4 組が直って公開され、残す組の理由がこのカードに記録されている。
- **済み (2026-11-14)**: 統合 9 組の手順 ① (まとめる側にしか無い節を残す記事へ移す) を終え、9 本とも critic PASS・quality-gate の blocker 0 で送り箱に置いた (`83d1094e0` 出生率〜`592cd9812` 小麦粉)。
- **確認 (2026-11-23)**: 統合 9 組はすべて本番で効いている。まとめる側の 9 URL は 301 で残す記事へ転送し (Location が残す記事と一致)、残す記事は 200。残りは差別化 4 組 (紅茶 `black-tea-expenditure-ranking`・`black-tea-income-gap`、`engineer-telework-prefecture`、最低賃金の 2 本) の書き直しと審査で、どれも 11-14 以降に手が入っていない。

### [NOTE-FREE-DEFAULT-01] note の雑学・ランキングの有料記事を無料に戻し、送客の変化を前後で測る
タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-10-07] [領域:商品]

- **決定 (2026-10-07 オーナー)**: note は無料が基本で、有料はノウハウ商品だけにする (収益化戦略 §3.3・§3.5、`docs/30_note記事企画/note戦略.md`)。メンバーシップは作らない。ランキング型 (A シリーズ) の有料記事 47 本は通算 (〜2026-09-11) 売上 ¥0。
- **基準値 (無料化の前)**: 対象 47 本の閲覧は 28 日 (09-07〜10-04) で計 804 (`data/note/dashboard/latest.json`)。`sessionSource = note.com` は 28 日 (09-10〜10-07) で 380 セッション・1,140 PV・エンゲージ 284、着地ページの上位は `/ranking/annual-sunshine-duration` 82 など 85 種。再現: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-10 --end 2026-10-07 --dims landingPage --metrics sessions,engagedSessions --filter 'sessionSource==note.com' --limit 100`。
- **第 1 陣 (2026-10-08 に note.com で無料に切り替え済み)**: `n2ed31d721531` 財政健全化法の4指標・`nba8bf272cc2b` 初婚年齢・`n67de9d45c426` 趣味・娯楽時間 (3 本で 47 本の閲覧の 74%)。カタログ `stats47-note.ts` と `data/note/note-published-urls.json` も `is_paid: false`。`r2_access` は `private` のまま (本文が非公開 R2 にしか無く、`public` にすると OGP 生成とギャラリー監査が欠落扱いにする)。本文を公開 R2 へ移すのは R2 への書き込みなので、オーナーの承認を取ってから行い、そのとき一覧も `public` にする。
- **次 (実行順)**: ① 4 週後 (2026-11-05 以降) に同じ指標を取り、無料にした 3 本の閲覧と送客を、まだ有料の残り 44 本・上の着地ページと比べる ② 結果を見て、閲覧の多い順に少数ずつ無料に戻す (note へのログインは人手。カタログ `.claude/scripts/note/catalog/` の有料・無料も同じ差分で直す) ③ D シリーズの有料データセット記事 5 本 (通算売上 ¥0) は、§3.4 の行政資料 pilot の販売面として残すか無料にするかを、同じ観測のあとに決める。ノウハウ記事は対象外。
- **停止条件**: 全記事を一括で変えない。ノウハウの有料記事・マガジン (Claude Code の実務) は有料のまま。note への反映はオーナーのログインを経てから。
- **完了条件**: 47 本の有料・無料が決定どおりになり、カタログと note.com が一致し、無料化の前後 4 週の閲覧と送客が記録されている。

### [KDP-LEDGER-AUTO-01] 認証付き計測で取った KDP の月次レポートを、CI が販売台帳へ自動で記録する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run products:sales --workspace=@stats47/product-factory -- validate] [起票:2026-10-07] [領域:管理] [待ち:ログイン]

- **済み**: 台帳の証拠に保管庫キー `vault:kdp/monthly/month-<n>` と復号したレポートの stats47 行の内容ハッシュを認め、`collect.mjs` が書籍別の集計を載せ、record job の `summarize.mjs` が同じ書籍・月の行が無いときだけ足す (値の食い違いは上書きせず action_required、明細の無い本を 0 で埋めない。) (参照: `fb6c2b288`)
- **残り**:
  ① KDP の再ログイン (10-31 の取得は `auth_required`)。そのあと CI の KDP 月次取得で台帳に行が自動で増えることを確かめる。
  ② 既読ページ (2026-10-27 オーナー決定): 2026-08〜10 の分を KDP の月次レポートから一度だけ埋め、以降は自動記録に乗せる。`data/business/pilot-board.json` の KDP の「既読ページ」指標 (今は `unrecorded`) を台帳から読む形に変える (`KDP-EXPANSION-01` の pilot 判定がこれで判定不能になっている)。
  ③ 月次の対象月が進まない (2026-11-15 観測): 11-08 と 11-14 の取得はどちらも `monthlyPeriod: "2026-09"` で、保管庫キー `kdp/monthly/month-8`・sha256 も同じだった (`data/authenticated/latest.json` の `sources[kdp].quality.salesLedger`)。10 月の月次が KDP 側にまだ無いのか、`.claude/scripts/measurement/kdp-monthly-reports.mjs` が古い月を選んでいるのかは確かめていない。次の土曜の取得の後に `monthlyPeriod` を読み、2026-10 になっていなければ月の選び方をコードで確かめる。
  ④ conflict の原因は直した (2026-11-15・develop): 11-08 と 11-14 の取得が `action_required` になったのは、2026-09 の範囲 (22 冊) に 11-04 発売の `K-S1-13` が混ざって書籍の集合が食い違ったため。`kdp-monthly-reports.mjs` が期間末より後に発売した本を範囲から外すようにし、実台帳の 8 月・9 月の範囲 (各 22 冊) と一致することを確かめた。2026-11-21 の取得で `salesLedger` が conflict でなくなることを読む。`packages/product-factory/src/sales/cli.ts` の `recordKdpCoverage` (古いレポートの補完) は同じ絞り込みを持たないので、補完を使うときは新刊が過去の月に入らないかを確かめる。
- **停止条件**: 生のレポート (全アカウントの行を含む) と個人情報を公開リポジトリに置かない。stats47 の ASIN 以外の行を台帳に入れない (`kdp-reports.mjs` の `kdpAsinMap` と同じ照合を使う)。
- **完了条件**: マージ後の CI の KDP 月次取得のあとに、明細のある本の行が台帳へ自動で増え (明細の無い本は行を作らない)、`products:sales -- validate` が PASS し、週次の KPI ツリーで `paid-purchases` の KDP 分が判定不能でなくなる。
- **観測 (2026-11-16)**: `npm run products:sales --workspace=@stats47/product-factory -- validate` は PASS (2 observations, 2 coverage)。conflict は validate ではなく、11-08・11-14 の CI の KDP 記録段の `action_required` から来ていた (④ の K-S1-13 を 2026-09 の coverage に数えていた件。修正は develop にある)。残りは ③ (月次の対象月が 2026-09 から進まない) と ① の再ログイン。11-21 の取得の `salesLedger` で確かめる。
- **期日の理由 (2026-11-16)**: 実験 EXP-011 (KDP セレクト) はオーナー判断で観測を続け、判定日は 2026-12-05。③ (月次の対象月が 2026-09 から進まない) をそれまでに直さないと、3 冊の 2026-11 の既読ページと販売を読めない。

### [KNOWHOW-PRODUCT-PILOT-01] AI×公的統計の実務ノウハウ商品を1つ選び、note の販売面で4週の実売を確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:商品] [待ち:判断]

- **前提 (実測)**: 支払いの実績は note の通算売上 ¥900 だけで、3 件とも Claude Code を使う実務記事 (¥300×3)。有料マガジンは 公務員×Claude Code (¥1,980) / e-Stat×Claude Code (¥1,480) / D3.js 配色 (¥500)。stats47 の Claude Code 連載は 28 日 25 PV で、集客は note の検索・推薦と外部チャネルに置く。回収経路 3 つの位置づけは収益化戦略 §3.5。
- **読者の課題 / HARM**: AI と公的統計を仕事や個人開発に使いたい (A: 技能・仕事の達成)。支払う理由は、調べて試す時間を短くできること。
- **次 (実行順)**: ① note ダッシュボードの全期間で、有料マガジン 3 つと有料の実務記事の閲覧・購入を棚卸しし、売れた 3 件がどこから読まれたかを確かめる ② 1 テーマを選ぶ (第一候補は売れた系統の「e-Stat × Claude Code の初期設定・DB 連携・ローカル実行」) ③ 既存マガジンの改訂か単品かを決め、価格と制作工数の上限を固定する ④ オーナー承認後に公開し、4 週の閲覧・購入数・売上を販売台帳 (`npm run products:sales --workspace=@stats47/product-factory`) に記録する。
- **関係 (2026-10-19 追加)**: ② のテーマ選定の入力として、`KNOWHOW-QA-BOARD-01` が公開の質問掲示板から 4 週集めた質問のテーマ別集計 (同じテーマ 3 件以上) を使う。集計が出るまでは売れた系統 (e-Stat × Claude Code) を第一候補のまま保つ。既存の商品を読者ごとの階段 (自治体の財政比較・地図づくり) に並べ、段ごとの導線を測る作業は `NOTE-PRODUCT-LADDER-01` が持つ。
- **関係**: 行政職員向けなら `ADMIN-STAT-PILOT-01` (2026-11-14 廃止) と読者が重なる。聞き取りの場では支払い意思を仮定の質問で聞かず、聞き取り票の Q8（仕事のための自腹購入・組織の購入経路）と Q9（庁内の生成 AI 利用環境）で事実を確かめる。
- **自治体ペルソナ向けの候補（2026-10-17 オーナーと壁打ち）**: (A) 生成 AI × e-Stat で類似団体比較表を作る手順（庁内で許される範囲の AI 利用。売れた唯一の系統と、元自治体職員という信頼を重ねる。既存マガジン「公務員 × Claude Code」¥1,980 の改訂でも出せる）を第一候補とする。(B) 議会答弁・計画の現状分析に使う統計の探し方と出典の書き方（AI を使わない。「e-Stat 7 つの技」の記事は職場からの読者が多く、Teams 経由の共有もある）は、Q9 で庁内の AI 利用ができない人が多い場合の切り替え先にする。(C) 介護保険事業支援計画（第 10 期）の現状分析のデータ集めは、`ADMIN-STAT-PILOT-01` (2026-11-14 廃止) のデータ商品検証へ回し、ノウハウとしては後回しにする。開発者向けの第一候補（e-Stat × Claude Code の初期設定）と並行して出してよい（2026-10-28 に「複数商品を同時に出さない」を廃止。収益化戦略 §7）。
- **雑学の読者から拾う導線 (2026-10-07 検討)**: 「サイト管理者が独立して年収1000万円」を入口にする案は採らない (事実でない収益の主張は収益化戦略 §8 に当たる)。代わりに計測付きで 1 つずつ試す: (a) 雑学ランキングの末尾に「このランキングの作り方 (Claude Code × e-Stat)」の 1 行 (`nav_click` 4 週) (b) 年収・所得の統計そのものを雑学として出す (c) 運営の収支を実数で公開する連載。
- **停止条件・禁止**: 「稼げる」「収益化できる」を売り文句にしない (stats47 自体の収益実績がまだ無く、証拠のない収益の主張は収益化戦略 §8 が広告でも扱わない情報商材と同じになる)。成果として書くのは取得日と取得方法を示せる計測値だけ。note への公開・価格変更はオーナー承認と人手ログインを経てから。
- **テーマ候補 (D) (2026-10-24 オーナーと壁打ち)**: note の有料記事運用の自動化 (Claude Code × Playwright)。e-Stat × Claude Code と並行して出してよい。有料にするのは「公開後も壊さず回す」検査と事故の事例 (投稿の自動化そのものは無料で出回っている)。出せる実数は doboku-note の運用 (原稿 959 本・マガジン 109、配布 PDF 72/72 の貼り直し、2026-10-23 取得) で、売上の多寡を成果として書かない。規約上、高頻度の操作を避ける手順を必ず含め、他人のアカウントで代行する形は採らず買った人が自分の PC で動かす形に限る。入口は kazu-note の無料記事で反応を測ってから有料にするか決める (kazu-note リポ `memos/kazu-note_公務員ノート展開計画.md`)。
- **テーマ候補 (E) (2026-11-11 オーナーと検討)**: 計画書の根拠づくり (創業計画書・持続化補助金の売上の根拠を、家計調査 × e-Stat × Claude Code で作る)。売れた系統を使い道で切り直す。カードは `KNOWHOW-SUBSIDY-EVIDENCE-01`、入口は `KNOWHOW-FREE-COURSE-ENTRY-01`、採否は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **完了条件**: 1 商品の 4 週の実売 (0 件なら 0 件と、考えられる理由) が台帳にあり、継続・改訂・撤退のどれかをオーナーが決めた。

### [KNOWHOW-QA-BOARD-01] 公開の質問掲示板で統計・地図・e-Stat の困りごとを集めて無料で答え、3 回以上繰り返す質問だけをノウハウ商品にする
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-19] [期日:2026-12-14] [領域:商品] [待ち:判断]

- **位置づけ**: `KNOWHOW-PRODUCT-PILOT-01` の前段で、何を商品にするかを質問の実測で決める。本カードは収集・回答・集計まで、商品化の判断・価格・公開はあちらが持つ。メンバーシップと会員限定の掲示板は作らない (2026-10-07 オーナー判断)。
- **前提 (2026-10-19 実測)**: ノウハウ系30本の通算閲覧5,216・売上¥600で、売れたのはOllamaオフラインとe-Stat API連携の環境構築手順。需要は地図・e-Stat取得の操作の困りごとにあると見るが、質問の実数は未確認 (`ADMIN-STAT-PILOT-01` の聞き取り0件)。
- **次 (実行順)**:
  1. 質問台帳 `data/products/knowhow-questions.json` をJSON Schema付きで作る。項目は `collectedAt`・`source`・`url`・`questionText` (個人を特定する語を入れない要約)・`theme` (kml-map / estat-fetch / excel-stats / claude-code / other)・`answered`・`reaction`・`productCandidate`。先に `config/datasets.mjs` に1行足し、`npm run check-datasets` を通す。検索語は5テーマ×3語を `queries` に固定する。
  2. 週1回・1時間、直近7日の質問を手作業で台帳に追記する (4週)。4週で合計10件未満なら計器不成立として、`KNOWHOW-PRODUCT-PILOT-01` の売れた系統単独で進める。
  3. 答えは各掲示板の中で完結させ、回答は週2件までにする。長い手順が要るときだけnoteの無料記事へ案内し、先に規約を読んで `source` ごとにリンク可否を記録する。
  4. 自前の受付をGitHub DiscussionsかGoogleフォームの1つだけ置き、noteの無料記事末尾と `/blog/cc-estat-*` に1行を足す。クリックは `nav_click` の `nav_surface` に値を足して数え、`analytics-event-standards.md` の台帳に登録する。
  5. 4週後に `theme` 別に集計し、同じテーマが3件以上のものについて質問例3件・既存記事・必要な成果物・工数見積りの表を `KNOWHOW-PRODUCT-PILOT-01` へ渡し、オーナーが第一候補を選ぶ。無ければ1回だけ4週延長するか打ち切るかを決める。
- **判定の数値**: 収集は4週で10件以上、回答経由のnote無料記事の閲覧は4週で100以上 (`data/note/dashboard/`)、受付は4週で5件以上、商品化はテーマ3件以上。どれも観測の下限で、売れる証拠ではない。
- **禁止**: 掲示板の自動巡回・自動投稿、会員制コミュニティ、複数の受付の同時設置、売り込みや「稼げる」訴求、回答中のstats47の宣伝 (出典としてのリンクは可) をしない。回答の正確さは出典を示せる範囲に限る。
- **工数の上限**: 週2時間 (収集1時間+回答2件)。超えそうなら回答を減らし収集だけ続ける。
- **完了条件**: 4週の質問台帳 (出所・テーマ・回答・反応) があり、テーマ別の集計と商品候補の表 (または候補なしとその理由) が `KNOWHOW-PRODUCT-PILOT-01` に渡されている。回答経由の閲覧と受付の件数が判定の数値と並べて記録されている。
- **棚卸し (2026-11-22)**: 手順 1 の台帳 `data/products/knowhow-questions.json` (Schema・カタログ登録済み) を作った。検索語 15 語 (5 テーマ × 3 語) は仮の値なので、オーナーが見直してから 4 週の収集 (手順 2) を始める。

### [NOTE-PRODUCT-LADDER-01] note の既存商品を「自治体の財政比較」「地図づくり」の 2 本の階段に並べ直し、段ごとの閲覧 → 次の段 → 購入を 4 週測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2026-12-21] [領域:商品] [待ち:承認]

- **位置づけ**: 既存の在庫を 2 本の階段に並べ、記事末尾の案内 1 行を揃え、どの段で読者が落ちるかを 4 週測る。note の 10-05 以降と KDP の 10-01 以降の売上は未計測。
- **階段 1 (自治体の財政比較)**: 段 0 = `s47-fiscal` の無料 7 本と `/blog/local-government-debt-burden`。段 1 = `13-fiscal-peer-no-code` (¥300)。段 2 = `12-fiscal-peer-comparison` (¥300)。段 3 = 類似団体比較 Excel (¥980 仮・未作成)。段 4 = マガジン `koumuin-estat-claude-code` ¥1,480・`koumuin-claude-code` ¥1,980。段 5 = ココナラ財政データ集 ¥5,000。¥200 有料 3 本は `NOTE-FREE-DEFAULT-01` で無料にして段 0 に加える。
- **階段 2 (地図づくり)**: 段 0 = KML 記事 `recovered-n03e45e40d3a7`。段 1 = `h-howto-mymaps-kml` (下書き・実機確認待ち)。段 2 = 都道府県パック ¥980 / ¥2,980 (`DATA-PACK-BUNDLE-01`。地図単品は出さない、11-05 オーナー決定)。段 3 = `koumuin-gis` ¥2,980 (変えない)。
- **済み**: 階段 1 の段 0 → 段 1 の導線 (基準日 2026-10-28)。
- **次 (この順)**:
  1. `NOTE-DASHBOARD-COLLECT-01` で note の取得が戻ったら (戻らなければ判定不能) 各記事の 28 日の閲覧と売上、マガジンの購入、GA4 の着地 (`node .claude/scripts/metrics/ga4-query.mjs --dims landingPage --metrics sessions --filter 'sessionSource==note.com'`) を 1 表で書く。
  2. 階段 1 段 0 の末尾に残るデータ集・元データのカードを外し、案内を 1 つにする (`data/note/articles.json` も直す)。
  3. `NOTE-FISCAL-PEER-PUBLISH-01` が 11-09 の売上比較を記録したら、`13-fiscal-peer-no-code` を無料にし (カタログの `isPaid` も false)、末尾に段 2 への案内を置く。
  4. `h-howto-mymaps-kml` の公開後、KML 記事 → H-01 → 段 2 の順に末尾をつなぐ。
  5. 段 3 は、(a) 段 1 の無料化から 4 週で段 1 の閲覧 100 以上かつ段 2 か段 4 の購入 1 件以上、または (b) `ADMIN-STAT-PILOT-01` (2026-11-14 廃止) で類似団体との財政比較が担当者 2 人以上の繰り返し業務と確かめられた場合だけ作る (着手は `/monthly-plan` で判断)。財政力指数は 2021 年度までなので、最新年度と 2 年以上離れるなら年度を題名に明記するか作らない。
  6. 4 週後に段ごとの閲覧・次の段の閲覧・購入を 1 表にして判定する。
- **判定の数値**: 階段ごとに 4 週で段 2 以上の購入 3 件。段 1 の閲覧が 100 未満なら入口の問題、100 以上で購入 0 件なら商品か価格の問題 (`KNOWHOW-QA-BOARD-01` で見直す)。段 0 の閲覧が変更前の 28 日より 2 割以上減ったら (無料化記事を除く) 末尾の変更を戻す。
- **禁止**: 雑学記事への有料の案内、1 記事に案内を 2 つ置く、段 3 以外の新規商品、下書き 72 本の一括公開、ココナラと note の相互リンク、値下げで売上を作る。公開・価格変更はオーナー承認と人手のログインを経る。工数は手順 2〜4 が各 30 分・手順 5 が 1 日まで。
- **完了条件**: 各段に変更日・4 週の閲覧・次の段の閲覧・購入 (または判定不能の理由) が記録され、続ける・差し替える・やめるをオーナーが決め、結果を `KNOWHOW-PRODUCT-PILOT-01` と `02_収益化戦略.md` §3.5 へ引き渡した。

### [AMAZON-ASSOCIATE-PILOT-01] Amazon アソシエイトと Kindle 自社本への導線の効果を測り、続けるか広げるかを決める
タグ: [収益化] [種類:改善] [実行:対話] [待ち:ログイン] [起票:2026-10-07] [期日:2026-12-05] [領域:アフィリエイト]

- **配線 (2026-10-07 本番反映、PR #1099)**: (1) 商品詳細から Amazon への Kindle リンクにタグ `stats47-22` と `rel=sponsored` (2) ランキング右レールに記事を収録した Kindle 本の行 (`nav_surface=ranking_product`) (3) Kindle 本の無いブログ記事末に `CATEGORY_BOOKS` (`apps/web/src/features/ads/constants/related-books.ts`) の一般書籍 1 冊 (`link_position=related-books`)。開始日・判定日・現在値は `data/business/pilot-board.json` と管理画面 `/strategy/pilots`。
- **交絡**: デプロイ日 (10-07) と AdSense 再開 (10-11) を境界にし、それ以前の窓とは比べない。
- **次**:
  1. 判定日 2026-11-04 に、オーナーが Amazon アソシエイトのレポートの値を販売台帳 (`data/products/sales-ledger.json`) へ証拠付きで 1 回だけ記録する (自動収集は作らない。2026-10-27 オーナー決定)。記録したら `pilot-board.json` の「Amazon の売上」指標を台帳から読む形に変える。口座 `stats47-22` が有効かもこのとき確かめる。
  2. 28 日の GA4 の `nav_click` (`ranking_product` / `blog_product`)・`affiliate_click` / `affiliate_impression` (`related-books`)・`cta_click` (`product_kindle`) を取り、物販クリックは食の雑学ページとそれ以外に分けて出す。KDP の売上と照合する。
  3. `CATEGORY_BOOKS` を他の vertical へ広げるなら、Amazon で実在 ASIN と書名を確かめてから足す (推測の ASIN を書かない)。
  4. 続けると決めたときだけ、置き場所ごとのトラッキング ID を 2 つ作り、ID 別レポートに ASIN が出るかを 1 回確かめてから配線する (規約上は可。2026-11-03 確認)。
- **完了条件**: 28 日分のクリック数と、Amazon / KDP の売上 (取れなければ取れない理由) を記録し、継続・拡大・撤退のどれかをオーナーが決めた。
- **確認 (2026-11-23)**: 判定日 (11-04) を過ぎたが、販売台帳 `data/products/sales-ledger.json` に Amazon アソシエイトの記録が無い (`pilot-board.json` の「Amazon の売上」は unrecorded)。オーナーが Amazon アソシエイトのレポートから 1 回記録するのを待つ。週次の GA4 の記録 (`data/ga4/snapshots/<週>/nav-click-surfaces.csv`) では ranking_product のクリックが W43〜W46 で 0・0・3・11 と小さい。
- **期日の引き直し (2026-11-24)**: オーナー作業で未着手 (2026-11-24 確認)。Amazon アソシエイトのレポートの値の記録はオーナー。週次レビューの承認待ちの一覧に載せる

### [BLOG-BG-PIPELINE-CONSOLIDATE-01] ブログ背景の経路を Codex の記事固有背景 1 本にまとめ、背景の不足を push 前に止める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト] [待ち:承認]

- **済み (2026-11-14・646428e92)**: 背景を選ぶ処理 (git の全面構図背景 > 記事固有背景 > 旧 Codex カタログ > 公開済み AI 背景の再利用) と、背景が無いときの案内文を `apps/web/scripts/lib/blog-background-status.ts` の 1 か所にまとめ、`generate-blog-thumbnails.ts`・`generate-blog-thumbnails-cloud.ts`・`check-blog-background.ts`・`manage-blog-codex-backgrounds.ts`・`lib/blog-ai-background-cache.ts` から呼ぶ形にした。
- **残り**: 未移行の記事を `npm run blog-images:codex -- queue` (Mode B) で git の記事固有背景へ移す。R2 の Gemini 背景が 0 件になったら、Gemini の client (`lib/gemini-image-client.ts`)・cache (`lib/blog-ai-background-cache.ts` の生成経路)・ビジュアルカタログ (`data/blog-ogp-visual-catalog.ts`)・`gemini-image-run.yml` の blog 部分・`config/image-generation-routes.json` の該当 2 行・規約の Gemini の記述を同じ差分で消す。旧 Codex カタログの記事も記事固有背景へ寄せる。
- **止まっている理由**: 画像生成は Codex が要り、クラウド環境では codex MCP が接続できないので、オーナーのローカルで回す必要がある。
- **残り (判断)**: 左側の文字用の余白不足やチャートの描き込みを機械で測る検査を足すかを決める。選択肢は (a) 画像の左 55% の輝度分散や輪郭量を測る検査を `check:blog-images` に足す、(b) 目視のまま据え置く、の 2 つ。現行の全面構図背景 (blog-photo-v2) は画像内に文字を載せないので、推奨は (b) で、旧構図の背景が残る間だけ目視で補う。2026-08-31 に上げた背景に R2 の HEAD メタデータ (`stats47-sha256`) の欠落が他にも無いかは未調査で、R2 の読み取りが要る。
- **完了条件**: `blog-images:codex queue` の targets が 0 で、リポジトリに Gemini の画像生成コードが無い。
- **棚卸し (2026-11-22)**: 公開記事 856 本の背景を R2 の `generation.json` で全件読んだ。Gemini で作った背景は `international-cooperation-volunteer-map` の 1 本だけ (`gemini-2.5-flash-image`・10-30 生成) で、0 件ではないので Gemini の経路は消していない。次は `npm run blog-images:codex -- request-article --slug international-cooperation-volunteer-map` で Codex の背景を作り、再公開して 0 件を確かめてから削除する。

### [BLOG-REFRESH-DERIVED-SCATTER-01] 図の年の取り直しスクリプトが、計算で作った散布図を取り直せない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/blog/lib/__tests__/refresh-chart-year.test.mjs] [起票:2026-10-07] [領域:サイト] [待ち:判断]

- **済み (2026-10-28)**: `refresh-article-data-years.mjs` が scatter / derived-scatter / calculated / ranking-join / composite の散布図を、点と R2 の値の一致で軸の指標と年を決め、点・見出しの年・pearsonR・除外県を作り直すようにした (`lib/refresh-chart-year.mjs`・テスト 25 件)。
- **残り**: 同じ指標の 2 年比較 (school-teacher-annual-income-prefecture-gap の手作りの `kind: calculated`) と、点が R2 と一致しない calculated (manufacturing) は手作業のまま。formula の文章に残る古い年は手作業の一覧に出る。最新年が指標ごとに違う組 (空き家率 2023 年 × 65 歳以上人口割合 2025 年。R2 の `app/correlation/by-ranking-key` に vacant-housing-rate と ratio-65-plus の組が無い) を相関 snapshot に持たせるか、記事ごとにランキングの値から作り直す運用を規約にするかは未決。
- **完了条件**: 散布図を含む記事で取り直しが手作業なしに終わることを、テストで固定している。

### [GEO-QGIS-DEMAND-01] QGIS の使い方ブログ 3 本で需要を測り、note「国土数値情報をQGISで扱う」を作るか決める
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-03] [領域:サイト] [待ち:承認]

- **需要の実測 (2026-10-03 の要約)**: 関心はある (Trends で ArcGIS の約 1.6 倍、サジェストの悩みは初級操作に集中) が、支払意欲は小さく (Udemy 専門講座 1 本 373 人、ココナラの教える系は最大 3 件)、無料の公式ドキュメント・MIERUNE・国交省マニュアルが強い。QGIS は 4.x への移行期。主な利用者は自治体職員・研究者・データ分析系。
- **切り口**: 汎用の基本操作は書かず、stats47 の Geo 分析を QGIS で再現する手順に絞る。スクショは PyQGIS で自動撮影し、QGIS の更新時に一括で撮り直せるようにする。
- **次 (実行順)**:
  1. 判定基準を公開前に決めて記録する (例: 公開 8〜12 週後の GSC 表示回数・クリックを、同時期に公開した stats47 ブログの中央値と比べる)。
  2. QGIS をインストールし (`brew install --cask qgis`・約 1GB。実行前にオーナー確認)、試し撮り 1 本で PyQGIS 撮影の手順を固める。
  3. 無料ブログ 3 本を作る: ① 国土数値情報を QGIS で読み込む (CRS・文字化け・属性の確認) ② 都道府県の統計 CSV を QGIS で色分け地図にする (コードでの結合) ③ 洪水区域×人口メッシュを QGIS で再現する (`/geo` の分析へ着地)。
  4. 判定日に基準と比べ、note の制作へ進むか止めるかを決める。
- **禁止・停止条件**: 入力データと背景地図は `geo-analysis-standards.md` の商用公開 Gate と `license-policy.ts` で商用可を確かめたものだけ使う (Google マップ等は使わない)。公開はサイト領域の月 15〜20 本の上限内で行う。基準を下回ったら note は作らず、このカードを削除する。
- **完了条件**: 3 本が公開され、判定日に基準との比較結果と note 制作の Go / Stop がこのカードか月次レビューに記録されている。

### [ADMIN-MCP-STATUS-01] 管理画面で、この PC が使う MCP の一覧と接続状況を見られるようにする
タグ: [インフラ・計測] [種類:改善] [実行:windows] [起票:2026-09-28] [領域:管理]

- **済み (2026-11-14・3d25207d3)**: 管理画面 `/ops/mcp` (メニュー「管理」→「MCP の接続状況」) が、`.mcp.json` と `~/.claude.json` の MCP を名前ごとに 1 行にし、用途と使う場所 (正本 `.claude/config/mcp-servers.json`)・有効か (`/mcp` と同じ 有効・承認待ち・拒否・無効 と根拠の key)・認証方式・ヘッダーや環境変数のトークンの有無・有効な HTTP サーバーへの `initialize` の応答コードを表示する。
- **残り**: Mac と Windows で `npm run admin` を起動して `/ops/mcp` を開き、各行の「有効か」と「接続確認」を同じ PC の Claude Code の `/mcp` の表示と見比べる。Windows では `~/.claude.json` の `projects` のキーがリポジトリのパスと一致して local の定義 (`codex`) と `disabledMcpServers` が読めているかも確かめ、食い違いがあれば `apps/admin/lib/server/mcp-status.ts` の `samePath` を直す。
- **残り (判断)**: OAuth で入る HTTP サーバーの「認証済みか」を画面に出すかをオーナーが決める。今は資格情報を送らずに確かめるので、認証済みでも未認証でも HTTP 401 と表示され、`/mcp` の Connected と Needs authentication を区別できない。選択肢は (a) 今のまま 401 を「認証が要る」と表示し、認証済みかは `/mcp` で確かめる、(b) Claude Code の資格情報 (Mac はキーチェーンの項目、ほかは `~/.claude/.credentials.json`) を読んでサーバーごとのトークンの有無を出す、の 2 つ。推奨は (a)。根拠は、(b) は Claude 本体のログイン情報と同じ場所を読むことになり、管理画面の「パスワードを読まない・子プロセスを起動しない」契約 (`apps/admin/tests/unit/read-only-contract.test.ts`) を変える必要があること、および現在この PC の `.mcp.json` と user の定義に OAuth のサーバーが 1 台も無いこと。
- **完了条件**: Windows と Mac で画面を開き、各 MCP の行が実際の `/mcp` の表示と同じ状態を示す。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a) 401 を「認証が要る」と表示し、認証済みかは /mcp で確かめる を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: Mac と Windows で /ops/mcp を開き /mcp の表示と見比べる

### [NOTE-HASHTAG-ROLLOUT-20261003] note公開記事のハッシュタグを承認済みの99個へ置き換える
タグ: [コンテンツ品質] [種類:改善] [実行:別環境] [起票:2026-10-03] [領域:商品]

- **実行できる環境 (2026-11-13 にソースで確認)**: `update-published-hashtags.mjs` は macOS 固定 (`/Users/minamidaisuke` のパス・`/bin/zsh`・`osascript`・Chrome の Profile 5) で、Windows では後片付けとロックが動かない。Mac で実行する。残り 6 件は下書きの扱い (`NOTE-OWNER-ACTIONS-01`) が済んでから流し直す。11-07 の回遊監査では `b-hottest-prefecture` のタグが 62 個 (`hashtags_below_95`) で、これも同じ回に直す。

- **正典**: 記事ごとの承認済みタグは台帳 `note.hashtags` (`data/note/hashtags.json`。全286件)。作成は `propose-note-hashtags.mjs`、反映は `update-published-hashtags.mjs`、検査は `lib/note-hashtags.mjs`。反映済みかどうかは台帳に持たず、毎回 `--audit-only` で note から取り直す。
- **現状 (2026-10-12)**: 承認済みと一致 280/286。残り 6 件はすべて下書きが残って停止 (`draft_blocked`): 有料 `paid-n92b846280d1a`・`paid-nfe2c65e669a8` (以前からの下書き。内容を確認してから扱いを決める) と、無料 4 件 `recovered-n03e45e40d3a7`・`n144d350fc14e`・`n3908e5981967`・`n48dff1df249f`。無料 4 件はエディタがリンクカードの href を旧ブログURLの転送先に書き換えるため本文一致の安全装置で止まる。**リンク先の書き換えを許すかはオーナー判断** (許すなら比較で href の転送先を正規化する)。下書きは note の編集画面で破棄すれば解消する。`a-late-elderly-medical-expense-per-insured` は `--slugs a-late-elderly-medical-expense-per-insured --allow-free-draft` で片付く。
- **実行**: `node .claude/scripts/note/update-published-hashtags.mjs --all --include-paid` (一致する記事は飛ばすので再実行でよい。1 件 約40秒)。Claude デスクトップアプリからは Chrome Profile 5 が macOS のプライバシー保護で読めないので、ログイン済み Playwright プロファイルの Chrome へ `NOTE_BU_CDP` で接続するか、Terminal.app からオーナーが実行する。有料で下書きが残った記事は自動では触らない。
- **停止条件**: 3 件連続の失敗、本文・価格・有料/試し読み境界の変化、更新後のタグ集合が承認済みと一致しない場合はその記事で止まる。note は大文字小文字を既存タグに合わせて書き換え、ギリシャ文字などは黙って落とす (検査で除外済み)。
- **完了条件**: `--audit-only` で 286 件すべてが compliant。

### [KDP-K-S1-08-REUPLOAD-01] 公開中のKindle S1全12冊へ承認済みポップ表紙を反映する
タグ: [収益化] [種類:制作] [実行:ユーザー] [起票:2026-09-28] [領域:商品]

- **次（実行順）**: ①K-S1-01〜K-S1-12を承認済みR2背景でそれぞれ新しいversionとして再生成する ②旧確定版との章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を冊ごとに確認する ③入稿提案を新versionへ更新し、暗号化R2 archiveをpush・deep audit・recordする ④オーナーがKindle Previewerで各EPUBと表紙を確認する ⑤`kdp-publish --update --id K-S1-NN`をdraft確認し、対象12冊と版SHAを提示してオーナーの明示承認後にだけ`--commit`する ⑥KDP本棚のread-backと商品ページで新表紙を確認する。
- **停止条件**: KDPへの`--commit`を事前承認なしで実行しない。出版停止済みのS2/S3/S4を対象に含めない。既存versionを上書きしない。本文差分、検証blocker、archive不一致、Previewer未確認が1冊でもあれば、その冊の反映を止める。
- **完了条件**: K-S1-01〜K-S1-12の販売中版が承認済み表紙へ更新され、KDP本棚read-backと商品ページで12冊すべて確認できる。各冊の入稿版SHA・R2 archive・review receiptが一致し、K-S1-08の該当図が「年」表記になっている。
- **統合 (2026-10-26 オーナー判断): `KDP-COVER-CODEX-APP-01`** S1 12 冊の表紙帯絵を Codex アプリで作り直して差し替える
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 6 行のうち 4 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[KDP-COVER-CODEX-APP-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (差し替え手順・kindle-publisher が実行)**: ①1冊だけ生成して目視承認 ②`ingest-cover-background.mts --book K-S1-NN --input <png> --pop-band`でR2 staging ③完成PNG/JPEGとmanifestを同revisionへ置き、exact keyをR2 push ④`cover-design.ts`へkey/SHA/byte/寸法を登録 ⑤`products:kindle:generate -- --id K-S1-NN --version <次の版>` ⑥章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を確認 ⑦入稿提案を最新版へ更新。
  - **完了条件**: 12 冊ぶんの帯絵がオーナー選定の絵に置き換わり、各冊の最終版が本文差分 0・`verify-publishable --content-only` blocker 0 で、入稿提案が最新版を指している。差し替えない冊は現行の帯絵のままでよい (その旨をこのカードから消して閉じる)。
- **確認が要る (11-03 の棚卸し)**: 4ed3ea4e9 (S1 12 冊の修正下書きの作成と読み戻しの検証 PASS) で手順が進んでいるが、この記述は古い。持ち主が進み具合を書き直す

### [AI-CONTENT-NATIONAL-AVERAGE-WORDING-01] 公開済みの AI 解説の「全国平均」を「47都道府県の単純平均」に直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-28] [領域:データ]

- **次**: 「全国平均」を機械置換できる文脈 (値の直前) だけを置換し、`audit-ai-content.mjs` を通して outbox から 35 件ずつ公開する
  (2026-09-27 の年表記是正と同じ手順)。言い換えで文が崩れる文脈は再生成キューに回す。
- **完了条件**: 公開中の ai-content の本文に「全国平均」が 0 件 (公表の全国値を使う指標を除く)。
- **実測 (2026-11-23)**: R2 の `app/ranking/<key>/ai-content.json` を全件読んだ。公開中の 2,167 件のうち 2,163 件に「全国平均」があり、合計 103,089 回 (多いものは 1 件に 100 回超。県別解説の文に出る)。生成の側は 2026-09-27 から、公表の全国値があれば「全国値」、無ければ「47都道府県の単純平均」と呼ぶ (`ranking-content-prompt.ts` の `averageLabel`・`build-input.ts` の `resolveNationalFigure`)。残っているのはそれより前の公開分。
- **進行中 (2026-11-23・オーナー判断「機械置換で出し直す」)**: 10-10 より前の生成は常に都道府県の単純平均を「全国平均」と呼んでいたので、置き換え先は県別解説の件数から「N都道府県の単純平均」(47 県は 2,103 件、ほかは値のある県の数) にした。10-10 以降の生成 2 件は同じファイルの呼び名に合わせた。古い生成の「全国値」は分布や合計の意味で出るので呼び名に流用しない。置換は 103,089 か所で、置換後の「全国平均」は 0。ゲート (`audit-ai-content.mjs --file`) は 2,145 件が通り、18 件は置換の前から止まっていた (下) ので外した。2,145 件を送り箱に置いて push し (`3b26e2f3d`)、publish-ai-content を 1 本ずつ起動して 40 件ずつ公開している。
- **置換の前から止まっている 18 件 (作り直しが要る)**: `freelance-count`・`non-regular-employment-rate`・`convenience-store-sales`・`gini-coefficient-disposable-income`・`treatment-rate-mental-disorder-inpatient`・`treatment-rate-asthma-outpatient`・`vacant-housing-rate`・`telework-rate`・`convenience-store-count-commercial`・`municipal-general-administration-staff`・`designated-difficult-disease`・`fiscal-strength-index-prefecture`・`actual-income-worker-households-per-month`・`treatment-rate-schizophrenia-inpatient`・`physical-therapist-annual-income`・`dairy-cattle-count`・`wooden-housing-ratio`・`doctor-annual-income`。多くは観測値の更新で県別解説の順位・値が合わない (`pref-data-mismatch`)。
- **完了条件の確認**: 送り箱が空になった後、R2 の ai-content を全件読み、「全国平均」が 18 件の分だけになっていることを確かめる。
- **済み (2026-11-23)**: 2,145 件を publish-ai-content で 54 回に分けて公開し終えた。R2 の 2,167 件を読み直すと、「全国平均」が残るのは置換の前から止まっていた 18 件だけ。残りはこの 18 件を作り直すこと (観測値の更新で県別解説が合わないので、置換ではなく作り直しの経路で直す)。

### [SITEWIDE-DUPLICATE-LINK-RATIO-01] サイト横断でリンク重複率が閾値超過 (本番全6,237URL実測)

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run page-quality:audit-weekly -- --base-url https://stats47.jp] [起票:2026-09-15] [領域:サイト] [待ち:判断]

- **owner**: ranking-ui-manager (ranking) / theme-ui-manager (theme) / site-ux-manager (共通部品・横断)
- **状況**: 2026-09-15 の本番全件監査で duplicate_link_ratio (閾値 0.3) がほぼ全テンプレートの支配的違反だった (municipality だけ異常なし)。page-quality は 2026-09-18 に PR 必須 gate から外し、検知は週次 `quality-suite-weekly.yml` の page-quality job と `check:release-local`。生データ: `data/page-quality/metrics/{latest.json,LATEST.md}`、管理画面 `/quality/page-audit`。
- **2026-10-23 原因の切り分け** (指標は `measure-static.ts` の「全 a[href] − 一意の href」÷ 全 a[href]): header・footer・aside を除くと、ブログ 0.44 → 0.21・調査 0.22 → 0.06 (共通ナビの重複が主因)、ランキング 0.38 → 0.43・テーマ 0.48 → 0.54 (本文側に重複)。本文側の出どころは、テーマの狭幅用の代替 UI (`ThemePageLayout.tsx` の `LEFT_RAIL_NARROW_ONLY_CLASS`。`ui-components.md` が求めるもの) とチャートごとの出典 (ChartFooter)、ランキングの出典調査リンクの複数箇所 (`RANKING-SOURCE-TRIPLE-01` の判断待ち) と関連ランキングの nav / section の重なりで、多くは設計どおりの重複。
- **次 (オーナーの判断が要る)**: 指標が捉えたい「意図しない大量重複」と、設計どおりの重複 (共通ナビ・狭幅の代替 UI・チャートごとの出典) を分けるかを決める。分けるなら指標を「header・footer・aside と狭幅専用のブロックを数えない」に変え、閾値の意味をそのまま保つ。分けないなら設計 (出典の繰り返し・`RANKING-SOURCE-TRIPLE-01`) の側を変える。指標の範囲を変えると検査を緩めることになるので勝手に変えない。修正後は `page-quality:check` (代表URL) で個別確認し、全件は次回の週次 job で確認する (毎回全件を手動実行しない)。
- **完了条件**: 週次監査の error 件数が縮小傾向 (ラチェット化は別途検討)。

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-07-22] [進行中] [領域:データ]

- **経過記録の整理 (2026-10-25)**: 2026-09 以前の経過と完了済みの記録を削除した。削除前の全文は `git log -p -- .claude/todo/backlog.md` で辿れる。

- **owner**: Claude Code
- **現況**: 全`article.md`参照から期待asset集合を作る公開契約監査へ拡張済み。公開434記事・本文参照
  1,091 assetで `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` だけが404。SVGは既存JSON/sourceから
  ローカル再生成済みで、公開gateもdata refresh / blog publish / 週次へ配線済み。R2全量pullのdry-runは
  `app/blog` 8,913 files（local差分8,526）を確認したが、read-only取得の承認前なので実pullしていない。
- **次**: 構造error 98記事を優先し、小バッチで処理する。R2由来、算式、年、metric keyを復元できない図は
  推測で再生成しない。公開参照asset契約と内容品質gateを各バッチ後に再実行する。
- **完了条件**: 全公開記事の参照assetが200、must-fix 0、公開gate greenとなり、source lineage不明の図は削除または明示的に保留される。
- **正典**: `.claude/rules/blog-data-schema.md`
- **観測 (2026-11-14・develop の CI が落ちる)**: Develop Quality Gate の Catalog Gates (preflight:pr) で「Survey Taxonomy」が `✗ blog coverage 95.73% < 100%` で落ちる (run 43558460412 の a043f19d0 ほか、今日の 8a7e58804・0c08944be でも同じ)。

### [STATE-R2-MIGRATION-01] 日次観測 state の残り 4 domain を R2 `state/` へ移す (psi → cloudflare → url-inspection → search-growth)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:git log --since=4.weeks --name-only -- .claude/state/metrics | sort -u | wc -l が 230 未満、かつ curl -sI https://storage.stats47.jp/state/psi/index.json が 200] [起票:2026-09-14] [期日:2026-12-12] [領域:管理]

- **済み (2026-11-14・eba441a8c)**: psi の生 JSON を R2 state/psi/ へ出す実装を入れた。
- **残り (確認)**: develop から main へ反映した後に、fetch-metrics-weekly.yml の psi job (土曜 01:00 JST、または workflow_dispatch の only=psi) を 1 回動かす。そのうえで curl -sI https://storage.stats47.jp/state/psi/index.json が 200 を返し、npm run state:pull -- psi --latest で data/psi/live/latest.json が取れることを確かめる。反映は金曜の夜を避ける。develop だけが先に新しくなると、main の古い定義が prune --scope psi を呼んで step が落ちるためである。
- **残り (cloudflare)**: cloudflare-usage-daily.yml は今も毎日 data/cloudflare を commit-back しており、日次の commit-back が残る唯一の domain である。snapshots/<date>.json は state-publish.mjs で state/cloudflare/snapshots/ へ出す。history.csv と LATEST.md の再生成は週次の fetch-metrics-weekly.yml へ移し、state:pull -- cloudflare/snapshots の後で digest する形にする。読み手は update-digest・monthly-snapshot・search-growth sources で、閾値アラートは CI 内の生 JSON を読む経路のまま保つ。移行後に RETENTION_POLICIES の cloudflare を消す。
- **残り (url-inspection)**: fetch-metrics-weekly.yml の url-inspection job (現在は週次) の data/gsc/url-inspection/<date>.csv を state/gsc/url-inspection/ へ出す。読み手は build-coverage-queue.mjs --sync-inspection・audit-operations-cycle・auto-resubmit・submit-cities-indexing・search-growth sources で、移行後に RETENTION_POLICIES の gsc を消す。
- **残り (search-growth)**: search-growth-weekly.yml の latest.json と live/ を state/search-growth/ へ出す。
- **残り (判断)**: カードの検証コマンドは .claude/state/metrics を数えているが、日次の記録は data/ へ移ったため今は常に通る。推奨は、検証を `git log --since=4.weeks --oneline -- data/cloudflare/snapshots data/gsc/url-inspection data/psi | grep -c 'daily'` が 0 になることに置き換える案である。根拠は、psi と url-inspection は 2026-10-26 から週次になり、日次の commit-back を出しているのは今は cloudflare-usage-daily.yml だけだからである。
- **追補 (2026-11-14)**: `fetch-metrics-weekly.yml` の psi job は「📤 Publish to develop branch」が失敗すると後続の [PSI Alert] の起票 step が飛ばされる並びになっていて、commit-back の失敗が閾値アラートを止めうる。psi-alert ラベルの説明文が「PSI 日次計測の閾値違反」のままで、2026-10-26 からの週次化と食い違う。
- **完了条件**: 4 domain とも生 snapshot の commit-back が消え、`npm run state:pull -- <domain>` が 4 domain で動き、各 domain の index.json が公開 URL で 200 を返す。
- **追記 (2026-11-16)**: psi の週次 snapshot は `PSI_API_KEY` が未設定で取れていない (W45 のレビューの申し送りで、受け皿のカードが無かった)。psi の domain を閉じる前に、キーの登録先 (CI の secret) と取得が通ることを確かめる。

### [STATE-R2-LIFECYCLE-01] R2 `state/` prefix の object lifecycle rule (400 日) をオーナーが設定する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Cloudflare ダッシュボード R2 → stats47 → Settings → Object lifecycle rules に prefix state/ の 400 日ルールがある] [起票:2026-09-14] [期日:2026-12-05] [領域:管理] [待ち:ログイン]

- **owner**: オーナー
- **何を**: Cloudflare ダッシュボード → R2 → `stats47` → Settings → Object lifecycle rules → Add rule:
  prefix `state/`、Delete uploaded objects after 400 days。コード変更なし。
- **なぜ**: `state/` は CI が日次・週次で書き続ける生 snapshot の置き場で、他の prefix と違い GC を
  `r2-retention.ts` の allowlist で運用しない (正典 `r2-storage-design.md` 「削除ポリシー」)。
  ルールが無いと 32GB (2026-09-12) の R2 に上乗せで増え続ける。
- **停止条件**: prefix を `state/` 以外に広げない (`app/` `gis/` は PROTECTED)。
- **期日の引き直し (2026-11-24)**: オーナー作業で未着手 (2026-11-24 確認)。週次レビューの承認待ちの一覧に載せる

### [CONFIG-SECRET-CLAUDE-JSON-01] `~/.claude.json` の github MCP に残る平文 PAT を退避する (gh CLI のプロキシ認証が前提)

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:node -e "const j=require(require('os').homedir()+'/.claude.json');console.log(Object.keys(j.mcpServers.github?.env||{}))" が [] を返す] [起票:2026-09-14] [期日:2026-12-05] [領域:管理] [待ち:ログイン]

- **owner**: オーナー
- **現状 (2026-09-14)**: Codex 側 (`~/.codex/config.toml`) の PAT は削除・github MCP を無効化済み。Claude 側
  (`~/.claude.json` user スコープ) の github MCP は `GITHUB_PERSONAL_ACCESS_TOKEN` を平文で持つが、会社 PC では
  `gh` CLI が「Proxy Authentication Required」で使えないため、この MCP が唯一の GitHub API 経路として残している。
- **次**: ① 会社 PC で `gh auth login` を通す (プロキシ設定 `HTTPS_PROXY` + `gh config set http_unix_socket` 等を
  試す)。② 通ったら `claude mcp remove -s user github` し、`~/dotfiles/bin/mcp-user.{ps1,zsh}` の集合と一致させる。
  ③ 平文で置かれていた PAT は GitHub 側で revoke して発行し直す。
- **停止条件**: gh が通る前に MCP を消さない (GitHub Issues / PR 操作が会社 PC で不能になる)。
- **2026-10-09 確認**: この Mac では検証コマンドが `[]` を返し、平文 PAT は残っていない。残りは会社 PC での同じ確認と、GitHub 側での古い PAT の revoke。
- **期日の引き直し (2026-11-24)**: オーナー作業で未着手 (2026-11-24 確認)。週次レビューの承認待ちの一覧に載せる

### [MAC-FIRST-RUN-01] 自宅 Mac で二拠点セットアップを初回実行し、Mac 固有の罠を local-environment.md に記録する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Mac で node .claude/scripts/setup-memory-symlink.mjs --check と node .claude/scripts/lib/sync-codex-mirror.cjs --check が exit 0] [起票:2026-09-14] [期日:2026-12-05] [領域:管理]

- **owner**: オーナー (Mac 操作) / Claude Code (罠の記録)
- **手順**: `local-environment.md` 「2 台で同じ形にする手順」の Mac 列を上から実行する
  (dotfiles clone → `link.mjs --host mac` → `git clone --filter=blob:none` → memory link → `core.hooksPath` →
  `~/tmp` → `local-resources.sh install` → `gh auth login; codex login` → mirror check)。
- **要確認 (未実測)**: `codex/host.mac.toml` の filesystem / notebooklm パスは仮置き (`/Users/kazu/...`)。
  `local-resources.mjs` の darwin `ps` 分岐と `assertNoLinks` の `/private/tmp` realpath は実機未検証。
  `.claude/settings.local.json` の seed (`stats47.local.mac.json`) の許可リストも初回で調整する。
- **現在地 (2026-10-05 Mac 実測)**: 検証コマンド 2 本は exit 0、memory / hooksPath / `~/tmp` / gh 認証は済み。
  2026-10-06 に dotfiles を適用済み (symlink・env・user MCP filesystem・認証。host.mac.toml のパスは dotfiles PR #1 で修正)。
  残り: ① Codex のモデルを Mac の `gpt-6.1-sol` / xhigh と dotfiles の `gpt-6-astra` / medium のどちらに揃えるか決め、`codex/base.toml` を直す
  (今は Mac の `~/.codex/config.toml` を手で Mac の値に戻してあるが、`link.mjs` を再実行すると戻る)。② `local-resources.sh install`。
  ③ Windows 側との `claude mcp list` / `codex mcp list` の名前の突合。④ dotfiles に取り込んだ Mac 設定 (dark・swift-lsp 等) が Windows で不要なら外す。
  実測は `local-environment.md`「2 台で同じ形にする手順」に追記済み。
- **完了条件**: Mac 側の `claude mcp list` / `codex mcp list` の名前集合が Windows と一致し、
  `local-environment.md` に Mac 節の実測が 1 つ以上追記されている。
- **期日の引き直し (2026-11-24)**: オーナー作業で未着手 (2026-11-24 確認)。週次レビューの承認待ちの一覧に載せる

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [種類:改善] [実行:対話] [起票:2026-08-13] [領域:管理]

- **trigger**: `CROSS-PAGE-DATA-SSOT-01`のcore契約を壊さず、このIDを指定してQG0から順に実装する。
  QG0、QG2、QG4、QG7はデータ移行と独立して先行できる。QG1、QG3、QG6の最終受入は同項目のWP6後に行う。
- **目的**: 公開値を壊す欠陥を意図的に混入したとき対応するPR gateが確実に失敗し、修復後にgreenへ戻る状態を作る。
- **既知の穴 (2026-08-13 再現)**: e-Stat境界checkは`import()`/re-export/`require()`を検出しない。
  chart props validatorは`statsDataId`欠落や`color:"rainbow"`を通す。`classifyUnitComparability`は`kg→g`等の倍率違い・
  片側periodを`same / factor 1`と誤判定し、公開exportされていない。色の逆写像testは空集合をloopして空振りgreen。
  theme live監査は`--limit 0`でも`coverageOk:true`・exit 0になり、scheduled runも非0を返さない。
- **依存と責務境界**: 実装本体 (R2一本化・`StatSeriesRef`・単位変換・semantic color role) は`CROSS-PAGE-DATA-SSOT-01`、
  金額の実データ是正は`MONEY-UNIT-SCALE-01`、shape / configHashは`RANKING-VALUES-PARTITION-INTEGRITY-01`、
  live期待集合とalertは`PUBLIC-DATA-CONTRACT-AUDIT-01`、baselineの個別finding返済は`MAINTENANCE-DEBT-PAYDOWN-01`が所有する。
  本項目はそれらを迂回できないtest / CI / mutationだけを所有し、分類表・allowlist・live scannerを複製しない。
- **実装規律**:
  - 各QGで最小の欠陥fixtureを入れてgateがredになることを確認し、直してgreenへ戻す。greenの確認だけで完了にしない。
  - deterministicな検査はPR blocking、secret・network・pixel差の影響を受ける検査はscheduled / manualに分ける。
  - baselineは縮小ratchetだけに使い、merge-baseと比較して引上げ・allowlist追加・skip追加を通常差分で通せないようにする。
- **実行順**:
  1. **QG0 — 品質ゲートregistryのSSOT化**: workspace・source数・各scriptとPR / scheduled / pre-commit / manualの実行箇所を
     pure collectorで列挙し、`.claude/config/`のregistry (`id`/`command`/`scope`/`owner`/`trigger`/`blocking`/
     `network/secrets`/`timeout`/`reason`/`expiresAt`) に分類、未分類をerrorにする。`check-checker-wiring.cjs`を
     `declared`/`invoked`/`blocking`/`scheduled`分類へ拡張し、criticalな`declared-only`を0にする。
  2. **QG1 — e-Stat・単位境界の迂回防止**: production `apps/web`からのimport graphでstatic/dynamic/re-export/wrapper/aliasを
     検出し、type-onlyだけ除外 (6 fixture)。chart propsをshared schemaへ寄せ`componentProps`をdiscriminated unionにする。
     money unit監査をblockingへ配線する。unit modelに倍率と分母を持たせ、SI倍率・分母・計数語・片側periodを正しく判定し、
     `./unit`公開entryから少なくとも1つのproduction判定で使う。
  3. **QG2 — R2 reader契約をruntimeで閉じる**: readerを棚卸しし、`JSON.parse(...) as T`をschema付きreaderへ置換。
     producer→reader round-trip test、正常/404/malformed/schema-invalid/旧schema/stale/5xx/timeoutのtest、
     返り値`ok`/`no-data`/`source-unavailable`/`schema-invalid`/`stale`の識別を入れる。
  4. **QG3 — 公開ページの値・単位・欠測の縦断検証**: 同じfixtureをranking・theme・blog adapterが同じ値で表示するcontract testと
     mutation (10倍・年ずれ・unit・area欠落)。Playwright route matrixでknown routeの`200 | 410`や条件付きskipを許さず、
     theme代表9 chart typeのchart数・data state・unit・yearを検査する。
  5. **QG4 — workspace別CI matrix**: `apps/admin`の単体testをPR CIへ必ず含め、remotion / gesはactiveなら最小gate、
     inactiveならowner・理由・期限付き例外にする。critical packageのtest 0やmatrix未登録をcheckerで拒否する。
  6. **QG5 — coverageを重要契約の回帰防止へ**: module別の実測値をfloorにし、merge-baseから低下したら失敗。
     新規のpure validator等は全分岐をfixtureで通し、都合のよいcoverage除外を足さない。
  7. **QG6 — semantic colorとrender結果**: git TSはrole、生成時に`resolveChartColorHex`でhex化へ統一し未使用CSS resolverを削除。
     全role (現行20) の全域性、移行前14色の非空golden、未知値のfail-closed拒否、Playwrightでの実描画色検査、
     render test 9件の専用job配線を行う。
  8. **QG7 — fail-open・warning・skip・baselineの縮小管理**: `provenance-audit-weekly.yml`等のvalidator失敗を最終job statusへ伝播。
     warning / skip / `continue-on-error`をowner・理由・期限付きshrink-only baselineへ移す。`theme-chart-live-audit.mjs`を
     pure core化し、partial実行を`coverageOk:false`、wrong-filter rowsを失敗にする。
  9. **QG8 — 最終mutation・文書・preflight**: 上記の欠陥を1つずつseedし該当gateだけがredになる表を記録する。
     type-check / test:packages / admin test / web coverage / Playwright / 必要buildを実行し、恒久契約だけを下の正典の文書へ反映して
     `npm run docs:fix` / `docs:check` / `docs:check:all`を通す。
- **停止条件**:
  - merge-base差分を取れずbaselineを縮小専用にできない、またはmutationを入れても想定gateがgreenのまま。
  - CI追加がcache込みp95で5分超の増加、またはrate limit・secret不足・pixel差でPRを安定再現できない (fixtureはPRに残し、live / visualだけscheduledへ分ける)。
  - runtime schema導入で既存R2 payloadを後方互換に読めず、R2 write・公開値変更が必要になる。
  - inactive workspaceの削除、branch protection、GitHub secret、remote workflow、deploy、R2への変更が必要になる。
  - 検査母集団の理由なき減少や、allowlist / baseline / skipの拡大が要るなら、証拠と選択肢を示してowner判断を待つ。
- **完了条件**:
  - 全workspaceと全critical checkerがregistryで分類され、criticalな`declared-only`・ownerなし・期限切れ例外が0。adminの単体testがPRで実行される。
  - production webからe-Stat providerへの推移的到達0。dynamic import / re-export / wrapperの陰性対照が境界gateで落ちる。
  - chart propsのshared schemaをcatalog / validator / app parserが共有し、`StatSeriesRef`が実catalog / readerで使われる。
  - unit classifierが金額・SI倍率・分母量・計数語・periodを理由付きで判定し、公開entryからproduction判定と監査が同じAPIを使う。
  - critical R2 snapshotがruntime schemaとround-trip testを持ち、malformed / old / stale / 5xxを空データと区別する。同じfixtureの値がranking・theme・blogで一致する。
  - known routeを`200 | 410`やskipで逃がさず、代表9 chart typeの非空・unit・year・data stateをE2Eが検証する。
  - 全color roleが単一の解決方式で一致し未知roleを拒否、移行前14色のgoldenとrender test 9件が実行される。
  - validator失敗が最終job statusへ伝播し、warning / skip / baselineはcode別縮小ratchetで新規増加0。
  - QG7 の theme live監査の条件 (0件・partial・wrong-filterを成功にしない) を満たす。
  - QG8のmutationがすべて意図したgateをredにし、復元後に全gateがgreen。CI時間は停止条件内で、例外は0またはowner・期限付き。
- **正典**: `.github/workflows/pr-quality-check.yml` / `.github/workflows/README.md` /
  `docs/01_技術設計/06_自動化インベントリ.md` / `apps/web/tests/README.md` /
  `.claude/scripts/lib/check-checker-wiring.cjs` / `apps/web/coverage-thresholds.json` /
  `packages/r2-storage/src/lib/operations/` / `packages/stats-r2/` (関連カードは「依存と責務境界」)

### [RANKING-FIRST-VIEW-RELEASE-01] ランキングページを「最初の画面で答えを出す」形に改修し、既存 3 件とまとめて 1 回のリリースで測る
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **済み (2026-10-10)**: 指標SSOT・表示契約と最初の画面の要約UI (上位3件/最下位・単純平均線・推移) は本番確認済み ([PR #1116](https://github.com/uruhayato373/stats47/pull/1116)・[PR #1118](https://github.com/uruhayato373/stats47/pull/1118)、390/768/1440px の 17 ケースで 200・JSエラー0・横overflow0)。
- **本カードで残る範囲**: 以下の地図/表統合・出典整理等と公開後の回遊/アクセス計測。SSOT・要約UI反映だけで完了扱いにしない。アクセス改善の効果は未計測。
- **結論 (2026-09-25 オーナー合意)**: UI はランキングページを最優先にする (PV・検索クリックの最大の面)。
- **範囲 (1 回のリリースにまとめる)**: ① 最初の画面に「1 位・最下位・値・年・単位」の要約 (済) ② `RANKING-MAP-TABLE-CARD-01` (地図と表を 1 枚に) ③ `RANKING-PAGE-STRUCTURE-01` (補足文・出典・関連一覧の整理) ④ `RANKING-SOURCE-TRIPLE-01` (出典 3 か所。推奨: 見出し直下の 1 行とページ末尾の詳細の 2 か所にし、サイドバーから外す)。同じページに変更を小分けに重ねると効果を分離できない (収益化戦略 §7) ので 1 回で出す。データのページの最大幅 (`LAYOUT-MAX-WIDTH-DECISION-01`) はデスクトップ幅を見てこの中で判断する。
- **守ること**: スマホの LCP を悪化させない (`PERF-RANKING-LCP-03`)。データの年は `DATA-QUALITY-LOOP-01` の基準 3 (調査終了の明示) と整合させる。
- **測り方**: 基準値はランキングの 1 人あたり PV 2.00・ランキング→他ページの遷移 (`internal-transitions.csv`)。目標値は `NAV-CLICK-COVERAGE-01` で部品別のクリックが取れてから決める。
- **完了条件**: 4 項目が 1 回のリリースで本番に出て、390 / 768 / 1440px の撮影で最初の画面に要約が見え、LCP が悪化していない。
- **全面点検で追加した範囲 (2026-09-25 `UI-FULL-SWEEP-01`)**:
  - 高: 1 年だけの `/ranking/junior-high-club-per100-swimming` の見出しに種目 (水泳部) が無い。
  - 高: `/ranking/natto-consumption-expenditure` (世帯あたり) に人口・面積あたりの計算方法の切替が出る。県庁所在市の値なのに表・上位 3 県で県名で出る。
  - 中: 「全国平均」が 47 都道府県の単純平均で、公式の全国値と誤解させる (`DATA-VALUE-ERRORS-01` でも扱う)。
  - 中: 東京だけが濃く他県がほぼ同じ色になる線形の配色 (`/ranking/total-population`)。推移の無い指標で「推移データなし」だけの大きな枠。
  - 中: 1440px の右レールで指標名が括弧の途中で切れ、同名に見える行を区別できない。
  - 低: 出典の下に単独の「総数」ラベル / 同率で 47 位が無い理由が出ない / 長い指標名がパンくずで 2 行になる。
- **相乗りした修正の本番確認 (2026-09-25 時点の記録)**: `/themes/population-dynamics?pref=13000` で `performance.getEntriesByType('resource')` の POST が 2〜3 件・グラフが 3 秒以内に描かれること (`THEME-CHART-LOAD-LATENCY-01`)。県データブックはデプロイ後に `sync-snapshots` で `app/areas/<code>/databook.json` を作り直す (`AREA-DATABOOK-LABEL-INTEGRITY-01`)。
- **統合 (2026-10-26 オーナー判断): `RANKING-MAP-TABLE-CARD-01`** ランキングの地図と表を 1 枚のカードにし (1280px 以上は横並び・それ未満はタブ)、年と計算方法の切り替えをカードの見出しに集約する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 35 行のうち 30 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[RANKING-MAP-TABLE-CARD-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (実行順)**:
  - **停止条件・禁止**: `forceMount` を外さない (表が HTML から消えると検索に影響する)。h1 を DOM の先頭から動かさない。
  - **完了条件**: localhost の 390/768/1024/1280/1440/1920px で、地図と表が 1 枚のカードに入り、1280px 以上は横並びで表の 4 列が
- **統合 (2026-10-26 オーナー判断): `RANKING-PAGE-STRUCTURE-01`** ランキングページの補足文・出典・関連リストの置き方を整理し、重複と冗長を減らす
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 59 行のうち 53 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[RANKING-PAGE-STRUCTURE-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次の画面検討 (未採択・2026-10-08)**: ランキング・ブログ・テーマ・エリア・Geo のページ ID・タグ等のマスタ・ID 間の関係を `data/` で一元把握できる設計を先に具体化する。既存の関連付け SSOT と照合し、二重 SSOT を作らないことを検討する。その設計を踏まえ、関連記事を PC は右レール先頭・スマホは地図/順位表直後へ置く案を画面で比較し、採否を決める。
  - **次 (実行順)**:
  - **停止条件**: 関連リストや出典調査のカードを消す前に、クリックの計測値 (`rail_click` / `nav_click`、出典調査のカードは
  - **完了条件**: 補足文・注記・出典がカードに入り、補足と注記が 1 か所にまとまっている / 関連リストが 2 つ以下 / `DataUsageCard` が

### [CHART-AXIS-READABILITY-01] グラフの軸・凡例・ラベルがスマホで読めない、欠ける、単位が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **済み (2026-11-14・`db9c7ae94`)**: オーナー決定 (2026-11-14、画像は 1 つの型を 4 媒体で共通に使い、その共通化を保つ) に従い、型の文字の下限を 30 にした (正本 `chart-theme.ts` の `TEMPLATE_MIN_FONT_SIZE`、検査 `svg-lint.mjs` の `findTemplateFontFloorDefects`、規約 `chart-image-copy.md`)。
- **オーナー決定 (2026-11-14)**: ブログの図は、スマホでは指で広げて拡大して読む前提にする (サイトは拡大を禁止していない: viewport は `width=device-width, initial-scale=1` だけ)。型の文字の下限は 30 のままにし、本番のブログの図の幅 (375px の画面で 325px・390px で 340px) で画面上 9.0〜9.4px になることは許容する。
- **残り**: chord (23)・treemap (18〜22)・ファイル見本 (22・26)・構成比のヒートマップ (24〜28) の型を下限まで上げる。ほかの記事の図を新しい型で描き直して再公開する。R2 private の型の見本画像の作り直し (R2 への書き込み)。`BarChart`・`ColumnChart`・`DivergingBarChart`・`PyramidChart`・`RadarChart`・`BoxplotChart` を使うページを特定し、375px で 10px 以上・縦軸に単位があるかを測る (測った 6 ページには無かった)。描き直しの後に R2 の SVG の `svg-title` が指標名になっているかを確かめる (Kindle の `figure-corrections.ts` のエントリを消す合図)。図を型で描き直しても、data の `chartType` (月別のビールの図は "line" のまま) と source.json の `unit` が書き戻されず、台帳と図が食い違う。
- **完了条件**: 上の 4 つの型の文字が下限 (30) 以上。D3 の残りの部品を使うページが 375px で 10px 以上・縦軸に単位がある。

### [UNIT-NOTATION-FORMAT-01] 単位と数値の表記がページごとに不揃い
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **済み (2026-11-14・ea02c74f4)**: 文章の中の単位 (FAQ・ランキングの注記・市区町村ランキングの解説・記事カードの題と説明・ブログ記事の題と本文) を、表示時に `normalizeUnitsInText` で表と同じ半角にそろえた。
- **残り (観測)**: 本番へ反映した後の最初の週次 page-quality で `unit_symbol_mixing` が 0 ページかを確かめる。残っていれば `ui_findings` の場所から描画元を特定して `normalizeUnitsInText` か `formatUnitForDisplay` に通す。
- **残り (実装)**: テーマのページ (`/themes/*` と `/areas/<県>/<テーマ>`) の数値タイル・表・章の答え・Q&A が「113,685,917百万円」「36,624,970人泊」と書く。`MetricKpi` (`apps/web/src/features/theme-dashboard/components/metric-kpi.ts`) に `resolveRankingValueDisplay` の結果を 1 回だけ持たせ、`MetricStatTile`・`metric-table-rows.tsx`・`section-answer.ts`・`area-theme-highlights.ts`・`theme-seo.ts` の 5 か所が同じ単位・倍率・小数桁で書く。同じ指標の推移の図の軸 (県のページで「千円」のまま) も同じ単位にそろえる。
- **残り (承認)**: AI 解説と FAQ を生成し直して R2 へ反映する。生成処理は半角で書くように直してあるので、対象の指標を決めて `generate-deterministic-backfill.ts` などの既存の経路で作り直す。R2 への書き込みはオーナーの承認後に行う。
- **残り (判断)**: 指標の定義の `seoTitle`・`seoDescription` は 322 指標が「1位北海道（46％）」と全角で書いていて、検索結果とタブの題に出る。選択肢は、(a) そのままにする、(b) `generate-meta-data.ts` で表示時に半角へそろえる (1 行。322 ページの題が 1 回変わり、週次の `title_changed` が出る)、(c) 定義を書き換えて R2 の item.json を更新する。推奨は (b) で、根拠は原稿と R2 を書き換えないこれまでの方針と同じ形で済み、画面の表記と題がそろうこと。検索結果に出る文字が変わるので、題の効果を測っている施策があればその判定の後にする。
- **残り (判断)**: 指標の題「可住地面積１km2当たり人口密度」「総面積1km2当たり」は全角の数字と上付きでない指数のまま、関連ランキング・相関の表・一覧に出る。題は検索の入口でもあるので、定義 (`data/metrics/*.ts` の title) を「1km²当たり」に直すか、表示時だけ直すかを決める。推奨は定義を直すことで、根拠は題を描く場所が多く表示時の整形では漏れが出ること。
- **完了条件**: 週次 page-quality の %/％ 混在が 0 ページ。テーマのページの代表 (`/themes/local-economy`・`/areas/13000/economy`・`/areas/01000/tourism`) で 7 桁以上の値が画面に出ない。値の換算は表示だけで、配信値は変えない。
- **観測 (2026-11-14)**: 県のページの「1人当たり県民所得の推移」で、縦軸の頭が「千円」なのに目盛りも「5.8千」と書き、単位が二重になっている (`/areas/13000`)。

### [SURVEY-PAGES-01] 統計調査のページで、調査と関係のない指標が並び、最新年が誤って見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:データ] [待ち:判断]

- **済み (2026-11-14・7d417cfbc)**: 調査のページへ並べる指標を、指標計算式の分子の原典の調査だけにした (分母の人口・面積の調査へは紐付けない。)
- **残り 1 (オーナー判断)**: 分子の原典が調査マスタに無い公開中の 17 指標は、全原典での紐付けを残している (一覧は `packages/ranking/src/builders/__tests__/build-ranking-item-from-metric.test.ts` の `ALL_SOURCES_FALLBACK_KEYS`)。このうち 12 指標 (消防年報 5・救急・救助の現況 2・都道府県別の認定こども園の数の推移 1・事業年報 1・公害苦情調査結果報告書 1・通信量からみた我が国の音声通信利用状況 1・旅券統計 1) が `/survey/census` に並んだままである。原典を調査マスタ (`surveys.master`) と対応表 (`surveys.source-names`) へ登録して新しい調査ページを作るか、未分類にして `.claude/config/survey-taxonomy-ratchet.json` の公開中の解決件数 2508 と網羅率 100% を対象キー付きで訂正するかを決める。残り 5 指標 (公立学校のプール・体育館設置率) は原典「公共施設状況調」を既存の `public-facilities-status-survey` へ結ぶ対応表の追記で解ける見込みで、同じ調査であることを e-Stat で確かめてから足す。
- **残り 2 (本番の確認)**: このコミットをデプロイした後、本番の `/survey/census` で件数と一覧を確かめる (デプロイが指標の metadata と `app/survey/<id>/items.json` を生成し直して送る)。
- **残り (追補・2026-11-14)**: 国勢調査以外の毎年でない調査 (住宅・土地統計調査・経済センサス活動調査など) の編集情報に `surveyCycle` が無く、見出しの最新年が掲載データの最新年のままである。`apps/web/src/app/survey/[surveyKey]/page.tsx` の `parseLatestYear` は年が読めないとき固定値 '2024' を返し、その年で観測値を読みにいく。調査ページの関連テーマは全原典で解くので、分母の調査だけで結ばれたテーマが残りうる。`.github/scripts/metric-release-paths.mjs` の survey の種類が `overlay: false` で、手元で生成した `app/survey/<id>/items.json` を `r2-overlay-server.mjs` で重ねられない。`data/metrics/road-length-per-km2.ts` の unit が km のままである。
- **完了条件**: 本番の `/survey/census` の一覧に、分子の原典が国勢調査でない指標 (消防ポンプ自動車等現有数・携帯電話契約数・一般旅券発行件数など) が 1 件も無く、`ALL_SOURCES_FALLBACK_KEYS` が空になっている。見出しの最新年は取り込み済みの国勢調査の最新回 (現在は 2025 年) を表示している。

### [PRODUCTS-PAGE-CONTENT-01] 商品ページで中身が分からず、購入の判断ができない
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:商品] [待ち:承認]

- **済み (2026-11-14・32d3cddd9)**: The 13 Kindle product pages now show each book's own contents, readers, data notes and table of contents, all taken from the live listing text and the submitted chapters. The placeholder text for an old edition is gone. A test fails if two products share the same description or included list.
- **残り**: Add cover images and image samples (figures from the book) to the Kindle product pages. Both need uploads to public R2 at app/products/<slug>/showcase/, so do this only after the owner allows R2 writes. Release the site change with the owner's next merge to main.
- **完了条件**: Every Kindle product page shows a cover and at least one image sample, and production /products and /products/kindle-* show content unique to each book.

### [GA4-FULL-MEASUREMENT-01] GA4 を全ページで使い切る (計測の是正 → 文脈・操作・成果 → API 登録 → 週次集計・BigQuery)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-26] [領域:管理]

- **済み (2026-09-26)**: Phase 0〜5 は完了 (計測の是正、文脈・操作・成果のイベント、Admin API での登録、週次 GA4 snapshot の追加ファイル、効果判定エンジンの `ga4-improvement` adapter)。
- **見送り (2026-09-26 判断)**: Geo の pathname 書き換え (2026-09-05 に意図して入れた共有 URL 形式のため)、survey / affiliate 集計への Japan フィルタ追加 (実験の観測期間中で比較基準がずれるため)、NSM snapshot の旧定義の改名。
- **残り**:
  - **Phase 6**: `fetch-ga4-bigquery.mjs` で週次集計 (journeys / search-terms / unregistered-params / session-depth)。`analytics_463218070.events_*` が出来ていることを確かめてから作る。課金の有無を確認し、クエリに `maximumBytesBilled`。
  - 別件 (オーナー判断): `kakkom@stats47` がプロジェクトのオーナー権限と鍵を持つ (未使用なら鍵を削除するか)。
- **完了条件**: `npm run google-admin:audit-api` で Phase 4 の全件が confirmed-registered、key events 4 件、BigQuery link 1 件、拡張計測の二重 page_view 警告なし。次の日曜 snapshot に Phase 5・6 の新ファイルが出る。

### [AREA-PAGE-LAYOUT-01] 県ページの長さと節構成を整理し、内部用語と表記揺れを除く

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 390px でページ高 13,174px。
- **次**: ① スマホでも数値カードを 2 列にする。② 数値の少ない節を統合し、「暮らし」と「安全・くらし」の区分を決め直す
  (`area-databook-designer`)。③ 「保存則」を読者向けの表現に直す。④ 単位記号・小数桁を共通の書式に揃える。
  ⑤ 交通事故の年の型を出典で確かめる。
- **完了条件**: 390px のページ高が現状比で大きく減り (目標値は ① の実装後に実測で決める)、1 指標だけの節が無く、
  内部用語と表記揺れが 0 件。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 640 / 768px で「他県と比較」ボタンが 2 行に折れる / 「47位」が「47/位」と折れる /
  県×テーマページ (`/areas/*/<theme>`) の「〇〇県の視点」帯が 390px で細かく折り返す、ページ内ナビの末尾が途中で切れる、プロフィールへのリンクが 2 回続く、
  見出しと 1 文だけの中身の無い節、カード名に節の名前が繰り返される、人口移動フローの県選択が空欄、5 枚目のカードが単独で残る。
  `/areas/02000/landslide-exposure` で「0 区域」が 2 位 (順位の向きが不明)、「単年データのため推移グラフはありません」のカードが 8 枚続く。

### [UI-CHART-TEXT-LOOP-01] チャートの文字のはみ出し・重なりを座標で検出し、起票から修正・本番確認までのループに乗せる

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 実測)**: `/areas/13000` の `StackedAreaChart` で縦軸の目盛りが左に 4〜12px 切れ (`computeMarginsByRatio` の固定幅比)、note のビール月別折れ線 SVG (`b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg`、`svg-builder` の `line.ts`) で凡例と斜めの月ラベルが重なる。
- **方針 (検出 → 起票 → 修正 → 本番確認)**:
  1. **検出**: ①`chart_text_issues` — 週次ページ品質監査のブラウザ検査で、SVG の `<text>` の外接矩形が描画範囲から 2px 超出るもの (overflow: visible は除外) と、文字どうしが小さい方の 25% 以上かつ 3px 四方以上重なるもの (スクロールで描かせてから測る。スクロール処理は `ui-probe.ts` の共通関数)。②`blog_svg_text_issues` — 記事 SVG を `svg-lint.mjs` の `findChartTextIssues(svg)` で静的に検査 (`checkImages` が画像 URL を消す前に呼ぶ)。
  2. **起票**: 2 指標を `UI_METRIC_KEYS` と `page-quality-budgets.json` (warning・閾値 0) に足し、既存の `ui-findings.ts --sync` で `UI-FIX-<種類>` カードにする。
  3. **修正の振り分け** (`chartFixGuide`): D3 は軸つき部品すべてに `fitSvgViewBox` を適用。記事 SVG は `.claude/scripts/blog/plan-svg-text-fix.ts @<batch>` で `regen-fixes` / `generator-fix` / `no-data` / `clean` に振り分け、`generator-fix` は `svg-builder` を直す。R2 反映はオーナー承認なので `[実行:ユーザー]` カードを起票して `--mark-owner` で紐付ける。
  4. **本番確認**: 次の週次で消えたら done、残れば pending に戻る。
- **途中成果**: ブランチ `wip/ui-chart-text-loop-01` (commit `f8344bf3c`、2026-09-25 時点の develop の上。develop へは未取り込み)。検出は本番の代表URL 12 件で `/areas/13000` の縦軸切れを検出済み。D3 14 部品への `fitSvgViewBox` 適用・`check-svg-text.ts` と `plan-svg-text-fix.ts` のテストは未完・未検証。
- **次 (実行順)**: ①WIP ブランチを develop へ追従させて型チェック ②生成器の通常テスト (`packages/svg-builder/src/charts/__tests__/text-layout.gate.test.ts`) を維持したまま旧WIPとの差分を整理 ③公開済み記事 SVG の該当件数を実測し、`quality-gate.mjs` を error にするか件数固定の baseline にするか決める ④修正済みの `line.ts` でビール SVG を作り直し差分を確認 ⑤D3 の共通処理を型チェック・テストし、localhost の `/areas/13000` で `chart_text_issues` が 0 になることを確かめる ⑥残りのテスト ⑦週次監査を 1 回手動で流し、カードに手順が載ることを確かめる。
- **関係するカード**: `AREA-DATABOOK-CHART-FIX-01` ② は同じ D3 部品を触るので WIP を先に取り込ませる。`NAV-CLICK-COVERAGE-01` P3 と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も週次監査の同じファイル群に指標を足すので並行実装しない。
- **停止条件・禁止**: R2 反映・ワークフローの dispatch・本番デプロイはオーナー承認。公開済み SVG の該当が多い場合、gate を error にして無関係なコミットを止めない (新規・再生成分だけ止める)。
- **完了条件**: 週次監査が 2 指標を計測して UI-FIX カードに振り分け手順が載り、`/areas/13000` の縦軸切れとビール SVG の重なりが本番で 0 件になっている。
- **確認が要る (11-03 の棚卸し)**: 途中成果のブランチ `wip/ui-chart-text-loop-01` が手元の remote-tracking に無い (`git branch -r --list '*ui-chart-text*'` が空)。リモートに残っているか確かめる
- **棚卸し (2026-11-22)**: 検出器 (`check-svg-text.ts`・`findChartTextIssues`) と予算 (`chart_text_issues`) は入っているが、`data/page-quality` に実測値が無く、ビールの SVG はリポジトリに無い。次は週次ページ品質監査を 1 回流して `chart_text_issues` を記録し、`/areas/13000` の縦軸とビールの SVG (note の R2 原稿) を検出器に通す。
- **確認 (2026-11-23)**: 途中成果のブランチ `wip/ui-chart-text-loop-01` はリモートにも無い (`git ls-remote --heads origin 'wip/ui-chart-text*'` が空)。commit `f8344bf3c` の作業は失われたものとして、次は ① の検出から作り直す。

### [KINDLE-SOURCE-REVIEW-9-01] 本文が書き直されて Kindle の校訂が当たらない 9 本を、新しい本文に合わせて校閲し直す
タグ: [収益化] [種類:不具合] [実行:対話] [検証:npm run products:kindle:validate --workspace packages/product-factory] [起票:2026-11-24] [領域:商品]

- **起点**: KINDLE-DATA-SOURCE-01 のオーナー決定 (2026-11-24・推奨 (a)) で、一括移行と切り離した。
- **対象**: black-tea-income-gap、crab-expenditure-ranking、earthquake-insurance-prefecture-gap、mackerel-expenditure-ranking、miso-consumption-quantity-prefecture-gap、movie-theater-expenditure-ranking、personal-computer-expenditure-ranking、sugar-consumption-prefecture-gap、university-advancement-capacity。R2 の本文が書き直されたため、台帳 `products.kindle-editorial-corrections` の校訂が当たらない。black-tea-income-gap は公開 R2 から撤去済みで、KINDLE-K-S1-01-REPUBLISH-01 の判断と関係する。
- **次**: 1 本ずつ R2 の今の本文を読み、校訂の差分を新しい本文に合わせて書き直す。書けない校訂は理由を台帳に残して外す。
- **停止条件**: 本の章の本文を勝手に変えない (校訂は台帳だけを直す)。KDP への反映はオーナーの承認の後。
- **完了条件**: 9 本すべてで校訂が当たり、書籍の生成と検証が通る。

### [KINDLE-DATA-SOURCE-01] Kindle の章の出典をブログ本文の手書き節から切り離し、据え置き 61 本の本文も移行する
タグ: [収益化] [種類:改善] [実行:対話] [検証:npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check] [起票:2026-09-25] [領域:商品] [待ち:承認]

- **済み (2026-11-14・3c808f65a)**: Kindle の 46 章の旧「データ出典」節を、台帳 `products.kindle-editorial-corrections` の `sourceSections` に逐語で写しました。
- **残り (判断)**: 次の 9 記事は R2 の本文が書き直されたため、移行とは関係なく校訂が当たりません: black-tea-income-gap、crab-expenditure-ranking、earthquake-insurance-prefecture-gap、mackerel-expenditure-ranking、miso-consumption-quantity-prefecture-gap、movie-theater-expenditure-ranking、personal-computer-expenditure-ranking、sugar-consumption-prefecture-gap、university-advancement-capacity。この 9 本には旧節が無く、一括移行の対象にもなりません。選択肢は (a) 9 本を別カードで新しい本文に合わせて校閲し直し、一括移行は先に進める、(b) 9 本が直るまで一括移行を止める、の 2 つです。推奨は (a) です。移行しても 9 本の生成は良くも悪くもならず、移行する 46 本の章の本文は変わらないことを確かめてあるためです。
- **残り (実行)**: オーナーが (a) を選んだら、`blog-data-source-migration.yml` を mode=migrate-bodies で実行し、46 本の本文から手書き節を消します。その後の週次監査の実測で、`survey-taxonomy-ratchet.json` の `maxLegacyDataSourceSectionArticles` を 58 から実測値まで下げます。移行後に残る見込みは 12 本で、目標の 6 本にするには出典が未解決の 4 本などを別に片付ける必要があります。
- **完了条件**: 46 本の本文から手書き節が消え、Kindle の 64 章すべてで校訂が当たって書籍を生成でき、ratchet の上限が 6 で `npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check` が exit 0 になること。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a)。9 本の校閲は KINDLE-SOURCE-REVIEW-9-01 へ分けた。`blog-data-source-migration.yml` の mode=migrate-bodies は dry-run を起動済み (run 45374576671)。残りは dry-run の結果を確かめたうえでの実行 (dry_run=false で R2 の本文を書き換える) で、オーナーの承認を待つ

### [AREA-SPECIALTY-IMAGES-01] 都道府県ページの特産品画像が未生成で頭文字タイルのまま

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:週次 page-quality の degraded_images が prefecture-detail で 0] [起票:2026-09-23] [領域:サイト]

- **owner**: area-curator (対象の確定) / image-prompt-curator (画像)
- **実測 (2026-09-23)**: 600 URL の試運転で 12 県・21 枚の `app/areas/<code>/specialty/*.webp` が R2 で 404 (例: 07000 nameko / 10000 brix-nine・aka-imo / 12000 tomisato-suika・shiro-takenoko / 22000 midori-mai・kajiki / 24000 ise-hijiki・ao-sanori)。
- **次**: 週次結果から欠落の全リストを出し、台帳 `areas.editorial` の特産品と照合して画像を用意するか、画像を持たない表示に統一する。
- **完了条件**: 週次監査の `degraded_images` が 0、または画像を出さない設計に決めて代替表示を正式化している。
- **決定 (2026-10-26 オーナー)**: 頭文字タイルの正式化はせず、欠けている画像を用意する。次は週次監査の `degraded_images` から欠落の全リストを出し、image-prompt-curator で生成する。

### [CI-SPEED-PRECOMMIT-TRIM-01] pre-commit を「秒単位のもの」だけに削り、metric config 時の `npx tsx` 直列 6 本と image pipeline 検査を preflight:pr / CI へ寄せる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/preflight-commit.test.mjs .claude/scripts/lib/__tests__/pre-commit-guard-paths.test.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理]

- **済み (2026-11-14・9f041b983)**: pre-commit は終了時に全段の所要時間を重い順で出す (`apps/web/scripts/pre-commit-stage-timer.sh` の `stage "名前"` で段を切る。)
- **実測 (Mac・2026-11-14・metric config 1 件 + workflow 1 件を staged)**: 合計 49.9 秒。
- **残り (判断)**: どの段を pre-commit から外すかをオーナーが決める。選択肢は、(a) Mac と Windows の両方で、上位の段 (画像 pipeline の 2 本、check-checker-wiring、metric 契約の 3 本、GIS 台帳の vitest、note の 4 本) を `preflight:pr` と CI に任せる、(b) 同じ段を Windows だけで外す、(c) 外さずに trigger を狭める (note の 4 本を note 関係のパスが staged のときだけ走らせる、など)。推奨は (a) と (c) の組み合わせである。根拠は、上記の段の合計が約 43 秒で、外すと残りが約 7 秒になり完了条件に届くことと、2 台で検査の内容を変えると片方だけ通る commit が生まれることである。
- **残り (実装)**: 判断の後、外す段ごとに CI 側 (develop-quality-gate または Static Gates) で同じ検査が走ることを workflow の記述で確かめてから外す。2026-11-14 のリテラル検索では、test:image-pipeline・type-check:image-pipeline・check-checker-wiring・metrics:check・content:check・build:category-keys は `pr-quality-check.yml` に見つかり、cover-production と dataset-references は `develop-quality-gate.yml`・`pr-quality-check.yml`・`quality-gates.json`・`preflight-commit.mjs` に見つからなかった。見つからなかった 2 本は、CI へ配線するか trigger を狭めるまで外さない。Windows PC でも同じ commit の内訳を 1 回取り、Mac と上位の段が違うかを確かめる。
- **停止条件**: 外した検査が CI 側に無いものは外さない (`CI-DEVELOP-GATE-COVERAGE-01` の症状を再発させない)。
- **完了条件**: metric config 1 件 + workflow 1 件を staged した commit の pre-commit が Mac で 10 秒以内であることを、commit の出力に出る段ごとの内訳の合計で確かめる。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a) と (c) の組み合わせ (上位の段を preflight:pr と CI へ寄せ、note の 4 本は trigger を狭める) を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: CI 側に同じ検査があるかを workflow で確かめ、見つからなかった 2 本の配線か trigger の絞り込みから始める

### [MEDIA-AFFILIATE-RELEASE-01] 媒体別画像と記事別アフィリエイト監査を公開まで完了する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --check] [起票:2026-09-17] [領域:アフィリエイト] [待ち:承認]

- **owner**: chart-author（ブログ・note画像）/ affiliate-manager（関連性判断）/ devops-runner（検証・公開段取り）
- **次（実行順）**: ①develop→main反映後、`regenerate-blog-svgs` workflowをdry-runし、全ブログのmobile画像生成結果とギャラリーを目視する。②承認後、対象を限定してR2へexact publishし、PC/mobileの切替を代表記事で確認する。③`data/affiliate/relevance-latest.json`の270候補を意味レビューし、必要な記事だけ理由付きで`BLOG_AFFILIATE_POLICY`へ追加する。④既存note画像をmobile方針で再生成・差替えし、note本文の視認性を監査する。⑤web全テストを再実行し、survey timeout 1件・product OGP 2件・right-rail contract 1件が再現する場合は今回の変更と分離して起票する。
- **禁止**: 候補270件を機械判定だけで一括変更しない。テスト契約を弱めない。ユーザー承認なしにdeploy・R2 write・note公開を実行しない。
- **完了条件**: ブログのPC/mobile画像が全対象で生成・目視・公開確認済み、note既存画像の差替えと監査が完了、関連性候補が全件レビュー済み、今回変更に属するwebテストがgreenである。

### [THEME-SELECTION-BACKFILL-01] ThemeCatalogの選定根拠(selection)未記入540件を夜間の無人バッチで白書・公式統計から裏付ける

タグ: [エージェント・SSOT] [種類:改善] [実行:windows] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-16] [領域:データ]

- **owner**: theme-designer (catalog の書き手) / theme-researcher (調査) / validator は data-configs scripts
- **背景**: `validate:catalog` の `no-adoption-criteria` warn (2026-09-16 に 539 件) を夜間バッチで裏付ける。agent は統計指標コードを誤記することがあり (7 件中 2 件)、呼び元の受け入れ検証で捕捉する。`expanded.ts` の tuple で定義されるテーマの置き場は `selection-evidence.ts`。経過の全文は `git log -p -- .claude/todo/backlog.md`。
- **次 (実行順)**:
  1. `nohup setsid bash .claude/scripts/themes/run-selection-backfill.sh --push-develop > .local/selection-backfill/<日付>.log 2>&1 &` (worktree は自動で origin/develop にリセットされ、残件は catalog から都度再導出される。stop 条件到達の exit 3 も commit + develop へ rebase push まで進む)
  2. 翌朝: report の「gate 不合格」「資料なし」を人が処理する。「role の推奨」の処理は `THEME-ROLE-REVIEW-01`
  3. session limit のリセット時刻 (前回 12:40am JST) をまたいで回すと最も長く継続できる。1 晩で終わらなければ翌晩も繰り返す
  4. Windows PC で回すなら pdftotext (poppler) を入れる。無ければ PDF 出典は到達性のみで通る (`skipped-pdf`)
- **完了条件**: `no-adoption-criteria` = 0、role 推奨リストの人間処理完了 (ratchet 配線は完了)
- **停止条件**: 1 晩の gate 不合格率 > 30% (prompt か gate の問題なので続行しない)、枠エラー 3 連続
- **禁止**: 夜間バッチによる role 変更・rejectedCandidates への追加・`git commit --no-verify`・gate 未通過の selection の書き込み

### [LOCAL-RESOURCE-BUDGET-01] 資料の復元経路と再起動後のメモリ削減効果を確認する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-10] [領域:管理] [待ち:承認]

- **owner**: devops-runner（計測・保持確認）／オーナー（Codex再起動）
- **次（実行順）**: ①次回Codex再起動後に local:health を実行し、重複MCP設定変更の適用とNode数・専用メモリを同じ代表作業で比較する。②日本国勢図会のprivate Drive保管6分割bundleをWindowsへ復元し、既存source-vaultのSHA-256検証と再展開検証を通してから books/ を回収する。③残る一時GISの原本ZIP・固有スクリプトは取得URL・成果保存先・復元手順がそろうものから回収する。
- **再開材料**: 端末内 .local/resource-health/ の計測・掃除・GIS復元台帳、既存 source-inventory/japan-zue/2025-26/source-bundle-manifest.json。Driveの日本国勢図会/2025・2026年版にmanifestと6分割ファイルの存在・非共有・容量を確認し、ローカル1746ファイルのhash一致と全profileのcoverage 100%は検証済み。Drive connectorのバイナリ返却先はsediment URIで、このWindows端末への復元経路は未確立。
- **停止条件**: 未検証のDrive原本・GIS・WIP・認証profileを削除しない。既存セッションの一括終了やGit履歴リセットで軽量化しない。Node数・メモリはツール稼働を含む瞬間値であり、条件を合わせず削減効果と断定しない。
- **完了条件**: 再起動後の同条件計測を保存し、参考文献のDrive復元検証と source-vault:check が通る。GISは回収した各対象から保全先と再生成手順が辿れ、保全できないものには保持理由を残す。導入済み予算・定期点検方式は local-environment.md と自動化インベントリを参照する。

### [AFF-A8-NOTE-PILOT-01] A8 の note 用広告リンクを意図一致の無料 note 1 本で試し、stats47 分として計測できるか確かめる

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:アフィリエイト] [待ち:ログイン]

- **owner**: affiliate-operator (A8 の確認・口座 assert) / note-manager (記事更新) / オーナー (公開承認)
- **背景**: A8 は 2026-09-01 に X・Threads・note 専用の広告リンク発行を始め (新メディア管理画面のみ)、
- **次 (実行順)**: ① A8 新管理画面で、note 用リンクの発行にメディアサイト登録が要るか、成果レポートで
  note 経由の成果を stats47 分として取り出せるかを確認する (A8 は doboku-note と口座共用でサイト切替が無い)。
  ② 取り出せる場合だけ、ふるさと納税・移住など意図が明確な既存の無料 note 記事 1 本と提携済み案件 1 件を選び、
  必要な click 数と最大期間を開始前に計算する。③ PR 表記付きでリンクを追加し、観測は improvements.md の別 ID へ引き渡す。
- **停止条件・禁止**: 成果を stats47 分として分離できなければ導入しない。新規提携申請、X・Threads への展開、
  ブロックリスト該当案件、クリックを促す表現は禁止。note 記事の更新は outward-facing なので実行前にオーナー承認を得る。
- **完了条件**: ①の結果を証拠付きで記録する。分離できる場合はパイロット 1 本が公開済みで観測 ID が起票されていること、
  分離できない場合は不採用の判断を `docs/00_プロジェクト管理/02_収益化戦略.md` へ 1 行で反映していること。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [領域:管理] [待ち:承認]

- **owner**: Claude Code
- **症状 (2026-08-17 実測)**: `sync-snapshots --only ranking-items` 完走後も `/ranking/marriages-per-total-population` の `<title>` が旧値のままだった。R2 と Worker は正しく (`?cb=<random>` で迂回すると新 title・MISS)、Cloudflare エッジだけが stale (`cf-cache-status: HIT`)。origin は `max-age=0, must-revalidate` を返すのにエッジが HIT を返すので、Cache Rule が Edge TTL を上書きしている。エッジにエントリが無い URL は新値が出るので、「1 ページ直ったから反映済み」と判断すると取りこぼす。
- **構造**: ページ経路のエッジコピーを消す手段がリポジトリ内に無い。`purge-worker-cache.ts --all` (sync-snapshots の後段) は Workers Cache のみ、`purge-cache.ts` (`purge-cdn.yml`) は `storage.stats47.jp` のみで、`purge_everything` でもページの `age` はリセットされなかった。デプロイすれば buildId が変わって消える (2026-08-17 に実測) ので、「snapshot 同期だけして数日デプロイしない」期間が stale の危険窓になる。
- **次**: (1) Cloudflare ダッシュボードで stats47.jp のゾーン ID と Cache Rule の Edge TTL を確認する (オーナー領域。`CLOUDFLARE_ZONE_ID` が storage 用の別ゾーンを指している可能性を含む)。(2) ページ経路に届く purge 手段を決める (正しいゾーン ID での purge / Cache-Tag / `--files` のホスト対応のいずれか)。(3) 決まったら `sync-snapshots` に配線する。
- **完了条件**: snapshot 同期の次のデプロイ後に本番 `<title>` を Googlebot UA で実測して新値になっている (代表 2 URL 以上)。判断できるまでは同期後の実測手順を SKILL に残す。
- **停止条件 / 承認境界**: ゾーン全体 purge は本番のキャッシュを一斉に落とすので、恒久配線はオーナー承認を経てから。Cloudflare の設定変更も outward-facing。
- 関連: `.claude/skills/db/sync-snapshots/SKILL.md` / `packages/r2-storage/src/scripts/{purge-worker-cache,purge-cache}.ts`

### [THEME-EXPANSION-IMPLEMENT-01] 地震曝露の住宅部分に使える全国空間原典を確保する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-09] [領域:データ]

- **済み (2026-11-14・8aab22c53)**: 令和2年国勢調査 地域メッシュ統計(全国・250mまで・世帯単位・建築時期なし・小メッシュは秘匿)、住宅・土地統計調査(メッシュ集計は確認範囲で見つからず)、J-SHIS API一覧(住宅項目なし)を確認し、候補105の decision と全体実装記録 `data/themes/evidence/2026-09-10-all-expansion.json` の housingSourceInvestigation に記録した。
- **残り (原典探索)**: ①e-Stat 統計GIS の画面で住宅・土地統計調査にメッシュ区画の選択肢があるかを確認する。②J-SHIS の個別API詳細とダウンロード提供物に住宅・建物の項目があるかを確認する。③見つからなければ総務省統計局または防災科学技術研究所へ提供有無を照会する(外部連絡はオーナーの許可が要る)。
- **残り (判断)**: 推奨は、住宅戸数の原典が見つかるまで候補105の住宅部分を未充足のままにすること。根拠は、国勢調査の住宅項目が世帯単位で、停止条件(一般世帯を住宅戸数の代用にしない)に当たるため。代案は、theme-designer が「住宅に住む世帯の震度帯別」を世帯と明示した別指標として採用し、J-SHIS との空間対応・県別途中artifact・保存則を実装すること。この場合も住宅の耐震性の結論にはしない。
- **停止条件**: 全国住宅の原典が確保できない間は未充足を維持する。人口・一般世帯・建物棟数を住宅戸数の代用にしない。PLATEAU等の部分カバレッジを全国値にしない。原典未発見を全国に存在しないという断定にしない。
- **完了条件**: 住宅部分を原典から再現でき、定義・時点・空間集計・配信値の整合を検証し、候補105のdecisionと全体実装記録へ証拠を反映する。公開後の計測と品質観測は `THEME-EXPANSION-EFFECT-01` へ接続する。
- **オーナー決定 (2026-11-24)**: 推奨どおり 住宅戸数の原典が見つかるまで候補 105 の住宅部分を未充足のままにする を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: 残りの原典探索の ① (e-Stat 統計GIS のメッシュ区画の確認) から始める

### [NOTE-BODY-QUALITY-PILOT-01] スマホで読める本文画像・配置・導入・出典・導線を6記事で試作する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:商品] [待ち:承認]

- **旧ID**: `NOTE-ARTICLE-QUALITY-PILOT-01` (2026-10-18 改名。調査記録 `data/note/evidence/note-article-quality-audit-20261016.json` は旧IDのまま)
- **owner**: note-manager（本文・導線と公開段取り）/ chart-author（決定的な統計図）
- **調査と方針**: 上記 evidence、`docs/30_note記事企画/note戦略.md`「本文品質の改善方針」。既存note画像是正の実行単位として `MEDIA-AFFILIATE-RELEASE-01` ④へ接続する。カバーの残計画は `NOTE-COVER-IMAGEGEN-ROLLOUT-01`。
- **済み (〜2026-11-02)**: 管理画面 `/ops/image-templates`・`/ops/image-library`・`/product/content-quality` と R2 保存・照合・復元の基盤は実装済み (契約は `apps/admin/README.md`)。
- **画像型の再開地点**: `/ops/image-library?q=MOBILE-PILOT-01` の6候補（ランキング・地理形状地図・散布図を各2枚）を採択・修正し、型の方針を確定する。家計は固定した検討見本の表示と候補採用を分け、`candidateMatches=false` で隠さず4媒体に表示できるようにする。note2記事の色の説明・順位・30℃未満の記述の矛盾、散布図2記事の過去入力復元の確証を解決してから公開する。その後に全件を標準適合・再生成・個別判断・入力不足へ分類する。青の統一・旧候補再確認・未登録媒体の試作も継続。
- **分類の再開地点**: `/ops/image-library?queue=classification` と `/ops/image-templates?template=table&medium=compare&purpose=ranking`。SNSの未分類347枚 (旧Drive原本の取得・照合待ち215・保存原本の記録なし129・現行型に確定できない3) を継続する。分類履歴・個別方針は `data/content-operations/quality.json` の画像レコード、noteカバーは既存専用台帳。分類の確定と品質合格・公開採用を混同しない。
- **保全の残作業**: `data/content-operations/live/image-migration.json` (正本は private R2、`npm run media:state:pull`) の未取得をDrive接続端末で `media:migrate -- --all --verify-existing --apply` により再開する。不一致は元ハッシュの画像を回収するまで停止。note-only本文回収は `NOTE-BODY-RECOVERY-01`。元データ未保全の図は値を推定せず入力を回収する。台帳上の保存記録は全記事の固定数値・図版入力が揃う保証ではない (根拠は evidence の `imageReproducibility`)。
- **対象候補（3記事ずつ・試作の上限）**: ①`recovered-n80e58a01f660`・`recovered-nf962c6702b93`・`recovered-n023501038bd5`。②`a-kakei-aichi`・`recovered-n03e45e40d3a7`・`d-geo-ipss-prefecture-map`。
- **次・実行順**: ①stats47の最新完全な期間集計を取得し、対象・維持記事・既存下書き・最近のカバー変更時刻を固定する (取得失敗を古い正常値で隠さない)。②前半3記事の旧図と候補を390px/320pxで比較する。③見出しと図の対応、短い導入、記事末の出典、主CTA1つ＋副最大2つを本文差分として提示する。④後半3記事へ型を適用し、マガジンの実所属と読む順を確認する。⑤承認された記事だけ保存・公開し、同じURLで図とカードの表示・クリック先を読み戻す。
- **再発防止の実装候補**: 既存render-spec/入力SHA/単位・年/版の検査を再利用し、重複画像・CTA件数・指標と商品の対応・公開カードの空欄を検査する。意味の一致・縮小後の読みやすさは目視。未実装gateを実装済みと扱わない。
- **画像基盤の完了条件案**: 元データ/生成条件/完成画像の不足を区別し、当時の固定値でのデザイン更新と最新データ更新を別操作にする。代表図を別端末で復元・再生成し、対象利用先と旧新比較を辿れること。カバーのAI生成は別契約を維持し、統計図に流用しない。
- **関連タスク**: 空欄カードの復旧結果 `data/note/evidence/note-card-repair-result-2026-10-26.json`、導線 (元データカードの文言と行き先) は `NOTE-PUBLISHED-AUDIT-01`。先に全件のカード修復やマガジン作成を再実行しない。
- **停止条件・公開境界**: 管理画面・台帳・R2画像保存の実装と旧画像の検証付き移行は承認済み。数値・原典・集計単位が不一致、既存下書きがある、カードの公開表示が確認不能、本文の別変更を巻き込む場合は当該記事を止める。note公開・R2正本更新は差分レビューと当該反映指示後。統計図をimagegenで描かない。SNS下書きの承認・予約・公開は変更しない。
- **完了条件**: 最大6記事で修正前後・採用図版・本文差分が確認され、承認対象だけ公開実測を通る。対象外本文・価格・公開状態を保持。共通生成・検査・保存手順を次記事でも再利用できる。効果観測を行う場合は最新baseline・対象・交絡・指標・期限を揃えて既存改善台帳へ引き渡す。記事内クリック・読了が未取得なら判定不能と明記する。画像制作だけで公開・効果検証を完了扱いにしない。
- **統合 (2026-11-22 棚卸し): `NOTE-CIRCULATION-CTA-01`** note の回遊と CTA を catalog から決める。このカードの対象記事で、案内する商品と記事の指標・年・粒度が一致するかを確かめ、重複 CTA と空欄カードも同じ公開面で直す。マガジン再編 (残り draft 36 本) の元の全文は `git show 47aa651d1^:.claude/todo/backlog.md` の `[NOTE-MAGAZINE-REORG-01]`。

### [ISSUE-AXES-01] 問いの台帳の分析の軸を全件に付け、テーマ・県・ブログへ展開する

タグ: [種類:改善] [実行:対話] [起票:2026-11-10] [領域:コンテンツ]

- **owner**: Claude Code (`/manage-issue-ledger`)
- **正典**: 軸の書き方は `docs/01_技術設計/03_情報設計.md`「問いの台帳」、規則は `packages/ops/src/issues/issue-graph-core.mjs` の `resolveAxesFigure`。確認は `npm run issues:check -- --axes`
- **済み (2026-11-10)**: active な問い 291 件すべてに軸を付けた (headless `label-issue-axes.ts` の下書き、API 換算 計 $0.57)。
- **済み (2026-11-10 追記)**: 軸のデータを参照の形 (`data`: `{metric, grain?}` / `{series}`) にし、実在を `check-datasets` の refs、粒度を `issues:check` が見るようにした。
- **残り**: ⓪ 「別粒度」33 件。市区町村の問い 27 件は、同じ意味の市区町村の指標が無い (率と件数の違い・年齢と性別の絞り込みの違いを含む。A12・C04 だけ置き換えた)。全国の問い 6 件 (K03-1・K03-2・K04-1・K05・K05-2・K08-1) は、使う品目の全国の時系列が家計の分析単位 (`kakei-analysis-catalog.ts`) に無い。どちらも指標か分析単位を足すまで「別粒度」のまま残す (e-Stat の値の確認が要る) ① 「未検証」133 件は `npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --fill` を端末で実行して下書きし、見てから `--apply` する (2026-11-10 の空実行で候補のある問い 118 件・候補 0 件 15 件。データの無い側にだけ足す)
- **完了条件**: 未検証が 0 か、残りに指標が無い理由が書かれている。②③④ の検査が PR CI で走る

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [種類:制作] [実行:ユーザー] [起票:2026-07-10] [領域:データ]

- **owner**: Claude Code
- **正典**: 切り口台帳 `data/surveys/lenses/kakei-chousa.json` (品目の採否は `data/estat/kakei-ledger/decisions.json`)。2025年次の都市表ID・コードの詳細は `.claude/skills/estat/references/household-expenditure-survey.md`。
- **到達 (〜2026-11-02)**: 2025年年報の公表を確認し (trigger 充足)、上位5品目と安全に接続できる指標を2025年表 (支出額 `0004023605`・数量 `0004023606`) へ更新して R2 に反映、PR #1205 を main へ統合した。旧表に残っていた 6 指標も新表へ移し、エンゲル係数・情報通信係数も 2025 年へ伸ばした。ネクタイ・ストッキングは 2025 年改定で統合されたので 2024 年が最終と注記。3 年平均は指標にせず、記事の接地器 `.claude/scripts/blog/fetch-kakei-city-average.mjs` (52 市・N 年平均) で扱う。流入上位の記事 (餃子・豆腐・カレールウ・もち・小麦粉) を書き直し、パンの 52 市 3 年平均の新記事を足した。
- **進み (2026-11-09)**: ① の流入上位 6 本 (チョコレート・すし・緑茶・即席麺・清酒・牛肉) は公開済み。続けて直近 4 週の GSC 表示順の上位 15 本 (京都の食卓・こんにゃく・給食費・豚肉・こんぶ・さつまいも・みそ・小麦粉・ミネラルウォーター・生うどんそば・鶏肉・アイス・福島の食卓・もも・チーズ) を書き直し中。残りは約 109 本で、同じ順で 15 本ずつ進める。書き直しで分かったこと: 本文が他の指標の順位 (外食・乾麺・醤油など) を引いている記事は、`refresh-article-data-years.mjs` が図の指標しか取り直さないので、他指標の順位も 2025 年で数え直す必要がある (福岡の家庭と外食の逆転が成り立たなくなり、醤油は g と ml を取り違えていた)。リンク先の `blog:udon-soba-food-culture-prefecture-map` は 2024 年の値のままで、リンク元の生うどんそばの記事と数値が食い違う。
審査と公開 (2026-11-13 完了): 11-10 に headless で書き直した 109 本は全部公開した (13 本は 11-10 の `63e744a78`、96 本は 11-13 に blog-critic の審査 PASS で公開 run `43422536777`・`43428818197`・`43434762670`)。退避ブランチ `wip/kakei-stale-rewrite-2026-11-09` は削除した。96 本の blog-critic の初回審査は PASS 20・REVISE 76 で、指摘の修正と再審査 (`blog-revise-fix`) の後に全本 PASS。headless の critic が PASS にした 30 本も初回 PASS は 9 本だけだった (差し戻しは題や結論が順位データと矛盾・題の約束に本文が答えていない、が主)。headless の PASS を公開の根拠にしない。費用の実測は full 審査 1 本約 16 万トークン、修正と再審査 1 本約 34 万、合計約 4,300 万。R2 の本文は 96 本とも新しい版だが、本番ページは 18 本が旧版のまま (`BLOG-ISR-STALE-ON-REVISE-01`)。
書き直しの道具の不足 (2026-11-09 の 15 本で実測): ① `refresh-article-data-years.mjs --apply` は `-dark.svg` を作らず gate が落ちる (`generate-article-charts.ts --slug` を続けて実行して補う) ② ランキング以外の図と派生図 (時系列・数量×価格) は「手作業」に回る ③ `build-kakei-quantity-price.mjs --base-dir` に絶対パスを渡すとリポジトリ直下の `var/` に書く ④ 本文に書く前年の値を data に置く場所が無く、quality-gate の `VALUE_MISMATCH` 警告になる。家計調査の市別の値は単年のぶれが大きい (前年比 50% 超が 846 件中 69 件) ので、単年の順位から構造を断定しない書き方を書き手に渡す。
- **次**: ① 題に旧年の値が残る記事の書き直しは完了した (11-13)。次の本番デプロイの後、旧版のままだった 18 本が新版になったかを確かめる。② 合算6件を個別照合し、分類変更5件は新定義に合わせて採否を決める。③ 記事URLの公開判定 (PR #1206) とデプロイ後の全体スモークの失敗 10 件 (変更前と同じ) は別途是正。
- **停止条件**: 未投入の2025値を公開ページへ書かない。3年平均を年次値の指標として代用しない。既存記事の年・図の更新はランキングの値が確認できてから行う。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 11 件

タグ: [種類:不具合] [実行:ユーザー] [起票:2026-07-30] [領域:管理]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない**: 対象が `.github/` だけで、ループの verify はそこを禁止パスにしている (workflow を書き換えられるとループが自分の制限を緩められるため)。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所。
- **済 (2026-10-06 第 1 弾・未発火)**: `fetch-metrics-weekly` / `migration-flow-weekly` / `sns-weekly-report` / `blog-remediation-daily` を step の `env:` 経由に書き換えた (actionlint exit 0)。各 workflow を 1 回発火させる確認は未実施。
- **次**: 残りの `blog-auto-publish` / `publish-ai-content` / `sync-snapshots` を `env:` ブロック経由に書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと残件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する
- **進捗 (2026-11-24・ff887e273)**: publish-ai-content と sync-snapshots の inputs を env 経由にした (blog-auto-publish は既に env 経由)。残り: ① 変えた 2 本が次の実行で通ることを確かめる ② 同じ形がカードの 3 本の外にも自由文字列の inputs で残る (purge-cdn の prefix、publish-blog の slug・published_at、regenerate-blog-svgs の slugs、generate-ogp-images の slugs、sns-port-bubble-daily の metric など。走査で計 66 箇所) ③ actionlint はこの Mac に無く未実行。

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失図表の手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-12] [領域:データ]

- **owner**: Claude Code
- **対象の正典**: `data/blog/svg-lineage-queue.json` の `residualCard === "CHART-LINEAGE-RESIDUAL-01"` (2026-08-27 時点で非タイルマップの手動判断残件 93 枚)。現行のranking自動復元器が確証できる残件は0。
- **散布図の残り 5 枚と律速**: `international-cooperation-volunteer-map/{travel,foreign-pop}-vs-volunteer-scatter` (「国際協力ボランティア率」の metric が SSOT に無い)、`per-capita-income-gap/income-vs-industry-scatter` と `purchasing-power-adjusted/income-vs-price-scatter` (1人当たり県民所得の現行基準が `isActive:false` / 値未投入。`data/data-refresh-requests.json` で 2021 年度取り込みを要求済)、`foreign-residents-diversity-map/manufacturing-vs-foreign-scatter` (X 軸の算出式と年次を特定できない)。
- **タイルマップの残り 6 枚**: `per-capita-income-gap/income-map`・`purchasing-power-adjusted/income-map` (県民所得)、`international-cooperation-volunteer-map/volunteer-rate-map` (ボランティア率)、`alcohol-prefecture-map/alcohol-consumption-map`・`food-consumption-prefecture-battle/ramen-gyoza-tilemap`・`waiting-children-progress/waiting-children-map` (指標・年次の同定が要る)。上の 3 記事は両方の図が同じ SSOT 欠落で止まっているので、指標を投入して先に片付ける。
- **次**: ① 県民所得の取り込み結果を確認し復元 ② 国際協力ボランティア率の e-Stat 表を `estat-researcher` で特定 ③ 製造業の算出式は記事本文の記述から再構成できるか確認する
- **統合 (2026-10-26 オーナー判断): `TILEMAP-LINEAGE-01`** タイルマップの手動系譜残件
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 10 行のうち 7 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[TILEMAP-LINEAGE-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
  - **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。
- **完了条件**: `chartType === "scatter" && status !== "both"` の非正準が 0 枚 (測定: S3 実体を読む。公開 URL は `max-age=14400` で最大 4 時間古い)
- **禁止**: SVG のピクセル座標から値を逆算して data json にしない (`blog-data-schema.md` §1.7)。一致率が足りないまま「だいたい合っている」で復元しない。復元できないなら記事から図を外す

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [期日:2026-12-05] [領域:データ]

- **済み (2026-11-14・148517aa4)**: 4 件固定バッチを上限 4 の worker pool に変え、失敗の後は新しい投入を止めて実行中の全件の完了を待つことをテストで固定した。
- **残り (計測)**: Geo 原典の次の CI run (同じ scope と bytes) で metrics-prepare / metrics-publish-dry-run / metrics-publish-apply を取り、run 34726806521 (準備 42分29秒・dry-run 37分07秒・apply/readback 2時間41分53秒) と並べて記録する。lock 待ちは `gh run view <id> --json createdAt,jobs` で、run の作成時刻とジョブの開始時刻の差から求める。短縮が実測で確かめられるまでは高速化を完了としない。
- **残り (実装)**: 計測で HEAD と解凍の寄与を見てから、候補の重複解凍と HEAD の整理を選ぶ。buildExactPlan・preflight・共有 writer の前後で、1 件あたり HEAD が 4 回以上発生している。原典 SHA と生成コードと schema に結び付けて、検証済み生成物を再利用・再開する仕組みを設計し、失効条件と失効時の再生成をテストで拒否・固定する。
- **残り (判断)**: コード push を検証だけにし、公開は明示 scope の CI に分けるかを決める。推奨は分けることで、理由は現状の develop push が全件の再生成・公開を起動するからである。準備を書き込み lock の外に出すかは、巨大 artifact の保存・転送・復元にかかる時間と費用を実測してから採否を決める。
- **完了条件**: 対象テストが、並行上限 4・失敗後の停止・ETag の変更・gzip と decoded の不一致・scope 漏れ・生成物の失効・catalog の順序の異常を拒否すること。同じ scope と bytes の CI で、全フェーズと待ち時間・API 数・転送量の変更前後が残っていること。変更なし・一部変更・再開・全件監査のどの経路でも、公開対象と同じ強度の検証を取り落とさないこと。採用しなかった案には実測の理由を残すこと。
- **追補 (2026-11-22・全体の洗い出し)**: 11-14 の run は r2-write の鍵を 109 分持った (準備 41 分・dry-run 39 分・publish 27 分)。同時刻の blog-auto-publish は 119.8 分 (中央値 15.1 分)。準備と dry-run を鍵の無い job に分け、鍵を publish の job だけにすれば約 27 分になる。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ]

- **済み (2026-11-14・コミットなし)**: 入口台帳 `open-data.prefecture-statistics` は47県・47件・確認日2026-07-18で検証を通ることを確かめた。
- **残り**: (1) 指標候補の記録先を決める。README にも台帳にも指標候補の表が無いため、新しい台帳として `config/datasets.mjs` と Schema を足すか、既存の `INDICATOR-CANDIDATES-01` の表へ入れるかを、最初に決める。(2) 入口ではなく、各県のダッシュボード・見える化・統計年鑑・オープンデータの実ページを対象に巡回する。トップや主要画面に出る指標の原文名・定義・単位・粒度・年次・一次出典を記録する。(3) ダッシュボードや年鑑を持つ県(東京・大阪・長野・静岡・福岡・宮崎など、入口台帳の URL から先に辿れる県)から着手し、10県前後ずつ別コミットで進める。(4) 複数県で反復する指標だけを残し、既存 metric と ThemeCatalog に対する非重複と、47県の全国比較可能性を一次データで確かめる。
- **完了条件**: 47県の確認が揃い、反復する指標が記録先に定義・単位・粒度・年次・一次出典付きで載っている。各候補について既存 metric との非重複と47県データの有無が判定済みで、`npm run validate:prefecture-statistics --workspace packages/data-configs` が通る。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [種類:制作] [実行:対話] [起票:2026-05-19] [領域:データ]

一次統計の実在、都道府県粒度、既存 metric との非重複を確認した候補だけを残す。
需要未確認の大量候補、取得失敗、重複は削除済みで、再調査は Git 履歴から行う。
`parse-backlog.cjs` が次の表を読む。`high` は既存テーマの欠測または需要が明確、`medium` は鮮度・特殊軸・導入先の追加判断が必要。

| priority | candidate_slug | category | suggested_theme | estat_stats_data_id | rationale | status |
| --- | --- | --- | --- | --- | --- | --- |
| high | outpatient-consultation-rate-total | socialsecurity | healthcare | 0004026105 | 患者調査2023 cat01=1,cat03=4。既存テーマに全傷病の外来受療率がない | pending |
| high | inpatient-consultation-rate-total | socialsecurity | healthcare | 0004026105 | 患者調査2023 cat01=1,cat03=1。外来と対で医療アクセスを比較できる | pending |
| high | ambulance-dispatch-count | safetyenvironment | healthcare | 0000010111 | SSDS K1210、47県。救急搬送の基礎指標 | pending |
| high | infant-mortality-rate | socialsecurity | healthcare | 0003411730 | 人口動態統計2024、47県。既存healthcareの結果指標を補う | pending |
| high | average-household-members | population | population-dynamics | 0003414255 | 国勢調査2020 cdTab=1390、47県。人口動態テーマの世帯構造を補う | pending |
| high | working-age-population-ratio | population | population-dynamics | 0000010201 | SSDS #A03502、2024。年齢構造の基礎比率 | pending |
| high | juvenile-offenders-count | safetyenvironment | safety | 0000010111 | SSDS K4204、2023、47県。千人比は別calculated metricで扱う | pending |
| high | average-job-tenure | laborwage | labor-wages | 0003426933 | 賃金構造基本統計 cat04=01,cat03=01、47県 | pending |
| high | equivalized-disposable-income-gini | economy | real-income | 0003440743 | 全国家計構造調査2019表7-6、cat01=1（OECD新基準準拠）、47県・小数値 | pending |
| high | nursing-home-count | socialsecurity | aging-society | 0000010210 | SSDS #J022011、2023、既存4指標と非重複 | pending |
| high | life-time-use-series | laborwage | living-housing | 0000010113 | SSDS生活時間。sleep/housework/mealsのcdCat01確定後に個別keyへ分割する | pending |
| medium | household-head-average-age | economy | consumer-prices | 0003348239 | 家計調査2024、県庁所在市52件。都道府県値と誤認しない表示設計が必要 | pending |
| medium | fishery-species-catch-salmon | agriculture | fishery-marine | 0003425253 | さけ・ます類、2019、cat01=100-150。鮮度を明示する | pending |
| medium | fishery-species-harvest-nori | agriculture | fishery-marine | 0003425258 | のり類養殖収獲量、2019。既存魚種テーマの欠測 | pending |
| medium | fishery-species-harvest-oyster | agriculture | fishery-marine | 0003425257 | かき類養殖収獲量、2019。既存魚種テーマの欠測 | pending |
| medium | housing-seismic-retrofit-count | construction | safety | 0004025509 | 住宅土地統計2023 cat03=15。「耐震化率」ではなく改修実施戸数として扱う | pending |

**投入手順** (完了した行は削除する):

1. `parse-backlog.cjs` で候補を選ぶ。
2. e-Statメタと代表値を再確認し、`metric-config-standards.md` と `data-provenance-standards.md` に従ってconfigを作る。
3. config validation、R2 snapshot生成、ranking item、KNOWN/sitemapの順で整合を取る。
4. 本番反映はユーザー承認後にまとめて1回行い、HTTP 200、年、単位、代表値を実測する。
5. 完了した行は削除する。

### [METRIC-SUBTITLE-KAKEI-NOTE-01] 家計調査系 706 metric の subtitle が調査方法の定型文で、一覧・h1 直下に冗長表示される
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-09-16] [領域:サイト] [待ち:承認]

- **済み (2026-11-15)**: 本番反映 (#1275) の後に sync-snapshots (run 43662183177) が `ranking-items` を作り直し、R2 の納豆の item.json から subtitle が消えて note が annotation に入った。
- **済み (2026-11-14・58df1b88d)**: 家計調査の 825 指標の subtitle から調査方法の定型文を外し、note に「値は都道府県庁所在市（二人以上世帯）の年間値で、県全体の値ではない。」
- **残り**: ①main へのデプロイの後、オーナーの承認を得て `sync-snapshots` の `ranking-items` で R2 の item.json を作り直す (config の note が item.json の annotation になる)。②本番で `/category/economy`・家計調査の survey ハブ・`/ranking/natto-consumption-expenditure` を開き、一覧のタイトルに定型文の括弧書きが無いこと、詳細のチャート下に note が出ることを確かめる。③R2 が揃った後、`select-sidebar-items.ts` の `getSidebarDetail` の包含判定と `classifyRankingSubtitle` を縮めるかを決める。
- **止まっている理由**: R2 への書き込みと本番デプロイはオーナーの承認が要る。
- **残り (追補・2026-11-14)**: 家計調査の残り 25 指標は subtitle が「都道府県庁所在市の二人以上世帯の1世帯当たり年間…」や「…消費支出に占める…の割合（用途分類の年平均1か月）」の形で調査方法を持ったままで、今回の lint は書き出しが違うため拾わない。P-14 が使う beef-consumption-expenditure と beef-consumption-quantity には、検査記録のハッシュを保つために旧 subtitle と同じ句を description に置いてあり、P-14 の次の改訂で文の形の定義に書き直す。apps/remotion の 4 部品 (ChoroplethMapStill・TileGridMapScene・RankingTable・ThumbnailPreview) は `meta.subtitle` だけを属性行に足すので、R2 の item.json を作り直した後は家計調査の動画・サムネイルから県庁所在市の表記が消える。`apps/web/public/search-index.json` は `metrics:regen-derived` でも `preflight:pr` でも作り直されない。
- **完了条件**: 本番の category / survey 一覧のタイトルに「都道府県庁所在市の二人以上世帯の年間…」の括弧書きが出ず、家計調査の ranking 詳細でチャート下に note が表示される。

### [GEO-UIUX-SPEED-01] Geo ページの UI/UX と表示速度を見直す
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:サイト]

操作のしやすさと表示速度の両方を実測してから直す。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）
- **統合 (2026-10-26 オーナー判断): `GEO-UI-READABILITY-01`** 地域分析 (Geo) のページで表・数値・用語が読者に読めない箇所を直す
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 16 行のうち 13 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[GEO-UI-READABILITY-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **完了条件**: 上の高・中の項目が直り、`/geo` 系の代表 5 ページを 390 / 768 / 1440px で撮影して確認する。
  - **残り**: ① 小数 4 桁の人口 (「1,203,780.9571人」) は、`GeoLandslideAudit` の保存則の検証表と地図ポップアップにある。検証表は

### [ESTAT-TABLE-SNAPSHOTS-01] e-Stat の表の写しを全表へ広げ、旧経路と直書きの許可を消す
タグ: [データ] [種類:改善] [実行:対話] [起票:2026-11-15] [領域:データ] [進行中]

- **観測 (2026-11-15・別セッションの週次作業から)**: Develop Quality Gate が c85207fb8 (03:50) と da5ca7bf7 (04:00) で連続して落ちた。c243935dc (01:43) までは成功。落ちたのは `packages/data-configs/src/__tests__/agricultural-output-entity-source.test.ts` の 2 件で、1 件目は `ok: true, rows: 1` を期待して `ok: false, message: "R2 authentication unavailable (S3 or wrangler login required)"` を受け取り、2 件目は `result.rows` が undefined だった。間の差分には `224e1ae48` (写しの 18 表を verified に) が入る。[仮説] 農業産出額の表が verified になり、`processOne` が e-Stat の mock でなく R2 の写しを読みに行くようになった。再現 (CI のログで観測。ローカルでは未確認): `npx vitest run packages/data-configs/src/__tests__/agricultural-output-entity-source.test.ts`。次: テストで写しの読み込みを mock するか、写しの経路をテストの環境で切る。
- **再観測 (2026-11-24)**: 同じテストは手元 (R2 の認証あり) で 5 件とも通り、Develop Quality Gate も 4a0324486 で success。認証の無い CI で再び落ちるかは未確認なので、上の「次」の mock は残す。
- **済み (2026-11-15・`596cd0ed1`)**: 表の写し 118 表 (verified 106・pushed 12) を非公開 R2 `estat-tables/` に置き、台帳 `data/estat/table-snapshots.json` で管理。
- **残り**: ① 家計調査と市区町村の表を取り込み、一致を確かめて verified にする ② pushed の表を ⑧ のとおり解く ③ カタログに目録の無い 32 表を `meta_stat_codes` に足して取る ④ 全表が verified になったら旧経路 (指標ごとに絞った要求) を消し、`values.json` の `meta.source` を必須にする ⑤ 入口の外の直書き: 2026-11-15 に e-Stat は 69 → 43 ファイル、R2 のキー・接続は 902 → 223 ファイル (記録だけのファイルを対象から外した後は 355 → 223)、地域・年は理由つきの例外 12 件まで縮めた。残りはすべて理由つきの例外 (workflow の shell・テストの期待値・説明文・画像の生成器の指紋・next.config など)。新しい直書きは 3 つの検査 (`check-estat-entrypoint`・`check-r2-entrypoint`・`check-area-year-entrypoint`) が止める ⑥ 指標の自動選択を月次のカタログ更新の後に起動する配線 (いまは手動起動で指標を空にしたときだけ)。 ⑦ **済み (2026-11-15)**: 市区町村の社会・人口統計体系の表 11 件は、オーナー決定で地域でも要求を分けて取った (都道府県を割らない `cdAreaFrom`/`cdAreaTo` の範囲、キー `area=<from>-<to>`。計画は `planTablePartitions` の `areaRanges`)。取得中に e-Stat が STATUS 200・203 (「データベースにアクセス中にエラー…時間をおいてやり直して」) を何度か返し、数分おいて取り直すと通った。取得の共通部品 `ingest-client.ts` はこの STATUS を再試行しないので、まとめて取るときは失敗した表だけを数分後に再実行する。 ⑧ **pushed は 1 表 (2026-11-15)**: 公開中の値が古かった 640 指標を `data-refresh.yml` (run 43667554910、オーナー了承) で作り直し、13 表が一致して verified。補助の表 5 件も目録を取って写し、verified (台帳 167 表: verified 165)。残り: (c) 0000010206 の `employment-insurance-daily-receipt-rate`: 写しから作ると 1975〜1989 年が増え、石川県 1978 年 1,571.4% (=110÷7×100)・1979 年 5,025% (=201÷4×100) が出る。被保険者が数人の年の整数比で、福島県 1994 年 (170÷11) と同じ形の公表値と確かめ、2026-11-15 に形状検査の例外の観測値を 5,025 へ上げた。残り: 次の本番反映の後に `gh workflow run data-refresh.yml --ref main -f metric=employment-insurance-daily-receipt-rate -f dry_run=false` で作り直し (data-refresh は main のコードで動くので、例外の更新が main に入るまで同じ検査で止まる)、`verify-table-snapshot-equivalence.ts --table 0000010206 --mark-verified` で verified にする。 (e) 0003445758 (賃金・verified) は 2026-11-15 の照合で 8 指標の順位だけが公開中の値と違う (値は一致。写しから作ると参考値の県を順位から外し、公開中は 11-14 に main のコードで作った順位)。段 4・5 の変更の前のコードでも同じ結果なので、今日の載せ替えが原因ではない。次の本番反映の後に `data-refresh.yml` で 8 指標を作り直して `--table 0003445758` で再確認する (d) 0004006330 (有効な指標から参照されない) はオーナー承認で削除 (2026-11-15)。台帳から外し、R2 は `r2-maintenance.yml` の `retired-estat-table-0004006330` で消す。
- **完了条件**: 指標の値がすべて写しから作られ、e-Stat を叩くのが表の更新のときだけになり、許可リストが空になっている。

### [ESTAT-CATALOG-SSDS-DERIVE-01] `ssds-candidates.json` を e-Stat カタログから導出し、find-metrics に未登録候補の索引を足す

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --import tsx .claude/scripts/estat/catalog.mjs search 人口] [起票:2026-10-05] [領域:データ]

- **次**: git 内の `data/estat/ssds-candidates.json` を catalog の `index/tables/` から再生成する形に置き換え、
  find-metrics に「未登録の候補」を引ける索引を足す。読み手を `git grep ssds-candidates` で洗い出してから進める。
- **完了条件**: `ssds-candidates.json` が catalog 派生の生成物になり (手編集の入口が無い)、find-metrics で未登録候補が 1 件以上引ける。

### [FUNNEL-CTA-01] 非表示にした ranking 末尾の商品案内を、商品・導線・計測を整えて再評価する

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト] [待ち:判断]

- **判断 (2026-11-12 オーナー指示)**: 「e-Stat × Claude Code 完全ガイド」の案内をランキング共通レイアウトから外す。商品展開と導線を整えてから再評価し、自動では再表示しない。
- **根拠と限界**: 保存済み GA4 `data/ga4/snapshots/2026-W44/` (2026-10-04〜10-31) は `cta_click` 全体 11 件、ランキングページ 3 件。ただし、この商品案内へのクリックとは特定できない。`product-referrals` は 0 行だが商品計測追加 (11-03) より前の期間で、クリック率 0 と判断しない。旧カードのカスタムディメンション未登録は 09-24 時点の記録であり、再開時に最新の保存済み計測で確認する。
- **再開条件**: 想定購入者・解決する業務・無料情報との差・販売内容を説明でき、関連するランキング面からの導線を定義できること。計測が有効な期間と判定基準をそろえ、オーナーが限定的な再表示を判断する。
- **実行順**: ① 商品と対象読者、案内するページ、購入先を整理する ② `data/note/magazines.json` の `koumuin-estat-claude-code` と ID で結び、表示可否・対象面・リンクを既存の商品台帳へ統合する (専用 TS の URL やカテゴリ列挙に戻さない) ③ `PRODUCT-REFERRAL-MEASURE-01` と連携し、商品 ID・配置別の表示→クリックと販売実績を確認する。遷移先の購入まで追跡できない場合は限界を明記する ④ 期間・継続/停止条件を先に決め、関連性の高い面だけで試す。
- **停止条件**: 購入理由・対象面が未確定、表示数の分母や商品別クリックが取れない、または試行の停止条件に該当した場合は非表示を維持する。
- **完了条件**: 台帳からの配線と計測を確認し、限定試行の結果から継続・修正・撤去を判断して記録する。全ランキングへの一律再表示を完了扱いにしない。

### [DATA-FOOD-SELF-SUFFICIENCY-MAFF-01] 都道府県別食料自給率 (カロリーベース) を農水省の公表値から取り込み、2022 年度以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:データ]

- **次**: 取得元を農水省の xlsx に切り替える (`fetcherKey: "manual"` か新しい取得経路)。`.claude/rules/data-provenance-standards.md` の provenance 9 点セットを先に書き、概算値と確定値の区別を年ごとに保持する。SSDS 由来の 2008〜2021 年度と重なる年は値の一致を検査してから置き換える。
- **完了条件**: 2022 年度以降が 47 県そろって R2 に入り、provenance が監査 (`/audit-provenance`) を通り、ランキングページの最新年が更新されている。
- **調べたこと (2026-11-23)**: 農水省の xlsx「平成10年度以降の都道府県別自給率の推移」(https://www.maff.go.jp/j/zyukyu/zikyu_ritu/attach/xls/zikyu_10-7.xlsx) に、カロリーベースと生産額ベースのシートがあり、1998〜2024 年度の全国と 47 県の値が載っている。概算値の印は 2024 年度の見出しだけに付き、それより前は確定値。生産額ベースのシートだけに「令和2・3・4年度は算出に不備があったため修正 (令和7年10月)」の注記がある (カロリーベースが修正の対象かは未確認)。この取得元はオープンデータの台帳 `data/open-data/catalog/datasets.json` に登録されていない。
- **次の手順**: ① オープンデータの台帳にデータセットを登録する (`open-data-curator`)。② 原本を非公開 R2 の写しに保存して取り込み (`packages/ops/src/open-data/ingest-metric.mjs` の `METRIC_KEYS`、`external-metric-ingest.yml`) に載せる (R2 への書き込みは承認)。③ 指標を `source.kind: "external"` に替える前に、SSDS の 2008〜2021 年度と xlsx の値を全県で照らす。

### [DATA-MEDICAL-FACILITY-SOURCE-01] 医療施設調査の 6 指標を原典の e-Stat の表から取り、2024 年以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [待ち:承認] [起票:2026-10-21] [領域:データ]

- **済み (2026-11-23)**: 6 指標 (`psychiatric-bed-count`・`psychiatric-hospital-count`・`general-hospital-count`・`general-hospital-bed-count`・`general-clinic-count`・`dental-clinic-count`) に、医療施設調査の 2024 年の表 (第9表 `0004048408`・第13表 `0004048412`・第16表 `0004048415`・第21表 `0004048420`・第27表 `0004048426`、2026-03-11 公開) を `supplementalSources` で足した。都道府県が分類軸にある表なので `areaAxis` (`name`) で県に写す。e-Stat の公開 app id で調べられた (資格情報は要らなかった)。
  - 2023 年版の同じ表 (`0004024808`・`0004024812`・`0004024815`・`0004024820`・`0004024826`) の 47 都道府県の値は、6 指標とも SSDS の 2023 年の値とすべて一致した。
  - `page-data-batch.ts --metric <6 指標> --dry-run` は 6 件とも形状の検査を通り、県は 1975〜2024 年の 2,350 行。市区町村の行数は公開中と同じで、県の値は混ざらない。
  - 2025 年 (令和7年) の表は e-Stat の一覧にまだ無い (2026-11-23 時点)。
- **残り (承認)**: main に入ったあとで、6 指標を `data/data-refresh-requests.json` で取り込み、R2 の `app/stats/<key>/values.json` の最新年が 2024 になり、ランキングページの最新年が変わることを確かめる。
- **停止条件**: 項目の定義や時点が SSDS と合わない年は足さない。R2 への反映はオーナー承認後。
- **完了条件**: 6 指標が公式の最新年まで 47 県そろって R2 に入り、ランキングページの最新年が更新されている。

### [DATA-FLOOD-STATS-FILES-01] 水害統計の 9 指標に 2015 年以降を足すかを決める (e-Stat のデータベースは 2014 年まで)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- 年カバレッジ監査が要拡張候補とする 4 年 (2007・2009・2010・2013) は 44〜46 県しか値の無い年で、値の無い県を 0 として扱ってよいかは確かめていない。
- **次**: ① 2015〜2023 年の都道府県別の値が、どこに (e-Stat のファイル・国交省のページ) どの形で出ているかを確かめる ② 取り込むなら、取得元の切り替え (`fetcherKey: "manual"` か新しい取得経路) と provenance を先に設計する (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方) ③ 公表の「-」が被害なし (0) を意味するかを調査の注記で確かめ、47 県そろわない年の扱いを決める。
- **停止条件**: 「-」の意味を確かめずに 0 で埋めない。R2 への反映はオーナー承認後。
- **完了条件**: 取り込むか見送るかを決め、取り込む場合は 9 指標が公式の最新年まで R2 に入っている。
- **調べたこと (2026-11-23)**: e-Stat の水害統計 (統計コード 00600590) はファイルで年ごとに公表されている (令和5年は 78 ファイル、Excel が主)。令和6年の確報は公表日が未定で、2023 年が最新。国交省の資料に 2014〜2023 年の 47 都道府県別の水害被害額 (平成27年価格・百万円) の PDF 表があり、被害のない県は「0」と書かれ「-」は使われていない (https://www.mlit.go.jp/river/toukei_chousa/kasen_db/pdf/2026/2-4-5.pdf)。ただし e-Stat の Excel の表の名前と「-」の注記は、一覧が動的表示のため取得できず未確認。次は、9 指標それぞれの項目が e-Stat の年ごとの Excel のどの表にあるかを、ブラウザか e-Stat API (getDataCatalog) で確かめる。

### [DATA-ROAD-LENGTH-SOURCE-01] 道路統計年報の 10 指標を最新の年報まで取り、年の表記を時点に合わせる

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ] [待ち:判断]

- **年の表記**: 配信は「2023 年度」と表示し、`road-total-length-with-expressway` は「3月31日現在」と注記している。この 2 つを合わせて読むと 2024 年 3 月 31 日の値に見えるが、実際は 2023 年 3 月 31 日の値である。
- **次**: ① 道路統計年報 2025 年版 (表 2 道路現況総括表・表 3 道路実延長内訳の総括表など。国交省のページは xlsx だけ) から 2024 年 3 月 31 日時点の都道府県別の値を取り込むか、SSDS の次の更新を待つかを決める。取り込むなら取得元の切り替えと provenance を先に設計し (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方)、SSDS と重なる年は値の一致を検査する ② 年の表記を時点に合わせるか (例: 「2023 年 3 月 31 日現在」)、注記を直すかをオーナーが決める。10 指標と SEO タイトルに効くので一括で行う。
- **停止条件**: 年の表記は、オーナーが決めるまで変えない。R2 への反映はオーナー承認後。
- **完了条件**: 10 指標が最新の年報の時点まで R2 に入るか、待つと決めて理由が書かれている。年の表記が時点と食い違わない。

### [ESTAT-YEAR-AVAILABILITY-01] e-Stat の実在年を data/ の台帳で管理し、設定の years を「除外だけ」にする
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [待ち:承認] [起票:2026-10-07] [領域:データ]

- **済み (2026-11-23)**: 台帳 `data/estat/availability/LATEST.md` の 4 分類 (取り込み忘れ・新しい年・e-Stat に無い年・範囲より前) と未判断の除外が 0 件になった。客室稼働率は本番の R2 で 2009〜2024 年の 16 年分を配信している。
  - 「e-Stat に無い年」13 件 (漁業の魚種別 12 件の 2019〜2022 年・ネット利用率の 2002〜2005 年) は、1 県も値の無い年を `sync-estat-years.ts --remove-missing` で設定から外した。
  - 民間生命保険の契約件数は R2 に 1975〜2024 年の 50 年分が入っていた。
  - 旧監査 (北海道 1 県のサンプル・`audit-estat-year-coverage.ts`・`YEAR-COV-*` の自動起票) は廃止した。台帳では旧監査の要拡張候補 29 件はどれも足す年が 0 件で、旧監査の不具合のカード `YEAR-COV-AREA-AXIS-01` も対象が無くなった。データ品質のキューとサイクルの健全性の検出器は台帳 `diff.json` を読む形に付け替えた。
  - 市区町村の値は、台帳の差分を報告だけに留めると決めた。`years` は県の値で決める設計 (合併でコードが変わる) で、県の系列より古い市区町村だけの年 (8 指標。高齢化率の 1980〜2000 年など) を足すには市区町村専用の年の仕組みが要る。需要を確かめてから起票する。
- **残り (承認)**: 日雇の受給率 `employment-insurance-daily-receipt-rate` の 1975〜1989 年 (611 行) を R2 へ取り込み直す。設定の years は 1975 年からで、R2 は 1990 年からのまま。5,025% (石川県 1979 年) は 11-15 に算式 (201÷4×100) を確かめて形状の例外に記録済み。`node --import tsx packages/data-configs/scripts/verify-table-snapshot-equivalence.ts --table 0000010206` は 73/74 が一致し、差はこの 611 行だけ。承認後に `data/data-refresh-requests.json` で依頼し、取り込み後に同じコマンドへ `--mark-verified` を付けて表台帳を `verified` にする。
- **残り (11-28 の週次で確認)**: 新しい指標 `actual-income-worker-households-per-month` (表 0000010112) の台帳が無い (no-ledger)。週次の取り直しで台帳ができ、`LATEST.md` の「台帳なし・取得失敗」が 0 件になることを確かめる。
- **禁止**: 確かめていない年を設定に書かない。外す年を `years` から手で消さない (`yearExclusions` に理由付きで書く)。R2 の再取り込みを承認なしに行わない。
- **完了条件**: 上の 611 行が R2 に入って表台帳が `verified` になり、`LATEST.md` の 4 分類と台帳なしが 0 件のまま週次で保たれる。

### [YEARS-DOWNSTREAM-FOLLOW-01] 指標の年が増えたあと、AI 解説・ブログ・計算型 metric・年固定の比較カードが古い年のまま残るのを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **済み (2026-11-14・`c110c707a`・`d0f6a692b`・`23309bd7a`)**: 古い年のままの記事 8 本 (米の消費量・製造品出荷額・ペットフード・エアコン・ティッシュ・消費支出・パンと米・かき) を最新年へ取り直し、critic PASS で送り箱に置いた。
- **残り**: (a) `chicken-consumption-quantity` は「宮崎は最多になった年が無い」に期間を足して再審査する (実際は 2011 年に 1 位)。(b) `food-trio-prefecture-map` は 2025 年に前提が崩れた (豆腐の 1 位は富山、宮城の焼酎は 40 位) ので結論から書き直す。(c) `automotive-industry-transformation-map` (表示 14,289) の推移図を 2024 年まで手で延ばす。(d) refresh の対象外の図 (derived・estat・authored) を持つ記事約 7 本 (manufacturing-aichi-dominance・manufacturing-productivity・pharma-medical-device-production-map・welfare-expenses-squeeze・prefectural-debt-future-burden・library-museum-cultural-capital・local-tax-regional-gap) は図を手で取り直す。(e) 一覧の残り約 150 本を 15〜20 本ずつ処理する (1 本あたり critic 2 回)。(f) 例外 5 種 (healthy-life-expectancy-male-female-gap・physical-therapist-annual-income-prefecture-gap・dairy-cattle-count・it-industry-concentration・手順解説)。(g) `per-capita-income-gap` は 2020 年のデータで、quality-gate が止める「## データ出典」節を持ったまま公開されている。最低賃金の 2 本は 2024 年度のまま (BLOG-DUPLICATE-AUDIT-01 の差別化と同時に直す)。③ の年が 1 年だけのカードは `THEME-SINGLE-YEAR-CARDS-01` で扱う。
- **完了条件**: 新しい年が R2 に入った翌週に、AI 解説が作り直しの対象になり、古い年の記事が一覧とキューに出て、計算型のランキングとテーマの比較カードが新しい年を描く。加えて、一覧の件数が週次で減っていく。

### [SEO-META-FROM-VALUES-01] 値から作るランキングの題の、単位の書き方の粗さを直すか決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-07] [領域:サイト] [待ち:判断]

- **済み (2026-11-23・#1298)**: 題と説明文を最新年の観測値から作る形を本番に出し、一般病院数・歯科診療所数・合計特殊出生率・動物園数の `<title>` と description が R2 の最新年の値と一致することを確かめた。
- **残り (判断)**: 一部の題の単位の書き方が粗い (酒類の「21.65l」、物価地域差指数の「104.2(全国=100)」、「0.66人口千対」など)。単位の表記の規則 (`formatUnitForDisplay`) で直すか、指標ごとの `display.displayUnit` で直すか、今のままにするかを決める。
- **完了条件**: 決めた方針で直すか、今のままにすると決めてカードを消す。

### [GEO-LOW-ELEV-MANIFEST-SHA-01] 標高の低い土地の Geo 分析の manifest が SHA 照合の対象外になっている
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run -s geo:audit-low-elevation] [起票:2026-10-08] [領域:データ] [待ち:承認]

- **済み (2026-11-14・`1a11afa5f`)**: 原因は、生成器 js_canonical が整数風キー ('10000' 以降) を Python の sorted 順 ('01000' 先頭) のまま書き、manifest の populationByArea が JSON.stringify と違うバイト列になることでした。
- **残り (原典の取得と R2)**: 生成器を変えたので `definitionSha256` が変わった。再生成 (原典のダウンロードが要る) と R2 への反映が済むまで、`npm run geo:audit-low-elevation` は「生成スクリプトが変更されている」で止まる (この監査は CI に配線されておらず、公開前に手で回す)。
- **完了条件**: 再生成した実物で監査が通り、R2 に反映されている。

### [PERF-THEME-HTML-SIZE-01] テーマページの HTML を目安 900KB に収める (新テーマ household-food-spending は 2.9MB)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **観測 (2026-10-08、Googlebot UA)**: `/themes/household-food-spending` と `/areas/<県>/household-food-spending` (47 ページ) の HTML が約 2.9MB、`/themes/healthcare` が 1.6MB。
- **[仮説]** 指標 136 件と、`comparisonYear` を持つ 30 グループの値をサーバー描画で HTML に埋め込んでいる。検証: HTML 内の RSC payload を指標キーごとに数え、グループ数を減らした版をローカルで測る。
- **関連**: Workers CPU の増加調査 `CF-CPU-SURGE-01` の候補「テーマ拡充で 1 ページが重くなった」と同じ現象。
- **完了条件**: 新テーマと healthcare の HTML が 900KB 以下、または目安を超える理由と新しい基準を page-quality-budgets.json に記録する。
- **実測 (2026-11-23・本番・Googlebot UA)**: 悪化していた。`/themes/household-food-spending` 4,735KB・`/areas/13000/household-food-spending` 5,604KB・`/themes/healthcare` 1,596KB・`/themes/local-economy` 833KB。`household-food-spending` の 4.4MB のうち 3.7MB がブラウザへ渡すデータ (RSC) で、その 2.5MB は `ThemeDashboardClient` の `indicatorDataMap` (189 指標)。内訳は値の行 `rankingValues` 1,572KB・`rankingItem` 465KB・`nationalSeries` 173KB・`availableYears` 168KB (`rankingItem.availableYears` と同じ中身が 2 回)。値の行は 189 指標 × 47 行で、行ごとに `metricKey`・`areaType`・`yearCode`・`yearName`・`unit` をくり返していた。
- **済み (2026-11-23・未デプロイ)**: 指標ごとに全行で同じ項目を 1 回にまとめて渡し、`ThemeDashboardClient` で元の行の形に戻すようにした (`features/theme-dashboard/lib/indicator-transport.ts`。読み手の部品は変えない)。localhost の同じページで RSC は 4,058KB → 2,843KB (値の行 1,572KB → 555KB)。テーマの部品のテスト 387 件と表示 (東京都の食卓と家計のページの数値タイル・順位) を確かめた。
- **残り**: 900KB の目安には遠い。次の候補は ① `availableYears` の二重 (168KB) ② `rankingItem` をブラウザが使う項目だけにする (465KB) ③ 189 指標の値を全部先に渡すのをやめ、表示する章の分だけにする (設計の変更)。本番の大きさはリリース後に同じ curl で測る。

### [CI-SKIPCI-HEAD-BLOCKS-PR-01] 自動コミットが develop の先頭に積まれるたびに develop→main の PR の必須検査が外れる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:管理] [待ち:判断]

- **事象 (2026-10-09)**: PR #1113 で、検査中に blog-auto-publish の outbox 掃除と、cloudflare・psi の日次計測の commit-back (いずれも skip-ci 指定) が
- **次**: ① commit-back が先頭になったら同じ head で必須検査を起動し直す workflow ② 必須検査を直前の非 skip-ci コミットの結果で満たす判定
  ③ commit-back を別ブランチへ集める、のどれを採るかを決める。
- **観測 (2026-11-18・PR #1285)**: 実コミット ac934b6b9 の PR 検査は全件 pass したが、AI 解説の日次出力 236540d33 (github-actions[bot] が GITHUB_TOKEN で push、skip-ci 指定) が先頭を取って BLOCKED。 (参照: #1282)
- **完了条件**: commit-back が先頭に積まれても、手で push し直さずに develop→main の PR をマージできる。

### [JAPAN-METRIC-UNIT-AND-RATIO-01] /japan で意味を持たない昼夜間人口比率と、合計特殊出生率の単位「人」を直す

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ] [待ち:判断]

- **済み (2026-10-21)**: 昼夜間人口比率は全国値が常に 100 なので `japan-catalog.ts` から外し、`placement-decisions.json` に rejected で記録した (市区町村のカタログには残す)。
- **残り**: 合計特殊出生率 (`data/metrics/total-fertility-rate.ts`) の unit が「人」だが e-Stat の単位は「‐」(単位なし) で、全国時系列の生成器 (`build-japan-series.ts`) がプレースホルダの単位を安全側で拒否する。表示単位を決める必要がある (「人」のまま生成器に単位なしとの対応を宣言するか、単位を表示しない形にするか)。**オーナーの判断待ち**。決まったら /japan に載せ直す (placement-decisions の blocked 行を消す)。R2 に残る `app/japan/day-time-population-ratio/series.json` の削除は R2 の保持ポリシーの手順で別に行う。
- **完了条件**: 上の 2 件が直り、/japan に意味のない系列が残っていない。

### [BLOG-DATA-EXEC-CODE-RULE-01] ブログの data/ に再現用の実行コードを置いてよいかを決めて規約に書く

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-09] [領域:サイト] [待ち:判断]

- **観測 (2026-10-09)**: `household-structure-daytime-population-gap/data/sensitivity-calc.mjs` が、本文の追加計算 (除外ごとの相関・偏相関・乱数の種) を再現するために置かれた。
- **判断すること**: data/ に置くのは JSON の中間結果だけにするか、実行コードも許すか。許すなら置き方 (名前・R2 へ上げるか) を決める。
- **完了条件**: `blog-data-schema.md` に置き方が書かれている。

### [DATA-DV-CONSULTATIONS-01] 配偶者暴力相談支援センターの相談件数を都道府県の指標にする (人口 10 万人当たり)
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-23] [領域:データ]

- **経緯**: 新聞記事から拾った統計ネタ 3 件 (`DATA-SOURCE-NEWS-TOPICS-01`、2026-10-10 起票) を 2026-11-23 に仕分けた。国勢調査の確定値は X に投稿済み。日銀短観の業況判断 DI は見送った (支店ごとに対象地域が 1 県・複数県・地域ブロックとまちまちで 47 県がそろう公式の値が無く、日銀自身が支店間の水準の比較は適当でないと書いている。https://www.boj.or.jp/statistics/outline/exp/tk/faqtk06.htm)。残った DV 相談をこのカードにした。
- **事実 (2026-11-23)**: 内閣府男女共同参画局の「配偶者暴力相談支援センターにおける相談件数等」に、全国と 47 都道府県の相談件数・センター数の表がある (令和6年度: 全国 317 か所・127,796 件。https://www.gender.go.jp/policy/no_violence/e-vaw/data/pdf/2024soudan.pdf)。年度ごとの PDF で、2011・2020・2022〜2024 年度の URL を確かめた。県の行が県内の全センター (県と市町村の設置) の合計かは PDF に明記が無い。`/ranking/domestic-violence-consultations` は無い (404)。
- **次**: ① 年度ごとの PDF の県別の表の列がそろうかを確かめる。② 県の行の定義 (設置主体の合計か) を確かめる。③ オープンデータの台帳に登録し、人口 10 万人当たりの計算型の指標と合わせて作る (`data-provenance-standards.md` の 9 点セット)。
- **停止条件**: 相談件数は相談窓口の数と周知に左右される。県の比較で「DV が多い県」と書かない (指標の note に書く)。
- **完了条件**: 3 年度以上の 47 県の値が R2 に入り、ランキングページが公開されている。

### [SNS-LEDGER-ID-RACE-01] 投稿台帳の id を CI とローカルが同時に採番して衝突する経路を塞ぐ
タグ: [SNS・マーケ] [種類:不具合] [実行:対話] [検証:npm run sns:trace:check] [起票:2026-10-10] [領域:SNS] [待ち:判断]

- **trigger**: 台帳の id 衝突がもう一度起きたとき。
- **事象**: 2026-10-10 のリリースで、IG cron (CI) が `data/sns/posts.json` に新しい行を id 1076 で足した。
- **緩和済み**: Instagram は予約表の登録時に id を決める形にした (`register-ig-schedule.cjs`)。CI が新しい行を作るのは、予約表に無い投稿を記録するときだけになった。
- **手順 (案)**: CI が書く行は採番せず、ローカルで登録済みの id だけを更新する。登録の無い投稿は CI では記録を保留し、検査で知らせる。どうしても足す場合は、id の範囲を CI とローカルで分ける。
- **完了条件**: CI の workflow が新しい id を採番する経路が 0 本になり、`sns:trace:check` に検査が入っている。
- **確認 (2026-11-23)**: 投稿台帳に新しい ID を振る CI の経路は `post-instagram-scheduled.yml` の 1 本だけ (`record-posted.cjs` が予約表に行の無い投稿のときだけ `store.insert` する)。この workflow は停止中 (`disabled_manually`) で、Instagram の自動投稿の再開はオーナー判断。再開するときに、CI では insert せず保留して `sns:trace:check` で知らせる形へ直す。
- **棚卸し (2026-11-24)**: 直す対象は `.claude/scripts/instagram/record-posted.cjs` と `packages/ops/src/sns`。本文のとおり IG の自動投稿を再開するときに直すので、再開の判断を待つ。

### [SSOT-CONSOLIDATION-REST-01] 2026-10-06 の定数集約で見送った重複を、挙動の差を解消してから寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-06] [領域:管理] [待ち:判断]

- **背景**: 2026-10-06 (`77ba6e36a`・`eef2a0a1a`・`0098430a1`) にサイト識別子・都道府県コード・e-Stat URL などの直書き約 470 ファイルを正本参照へ置き換えた。
- **候補 (上ほど優先)**:
  1. Windows で別の Playwright profile を読む可能性がある絶対パス直書き: `.claude/skills/sns/publish-x/check-x-scheduled.ts`・`.claude/skills/sns/update-x-profile/update-x-profile.cjs` (publish-x と profile を共有するため見送った)。
  2. 県名の短縮処理: `@stats47/area` の `prefectureShortName` へ寄せた (北海道は落とさない)。残りは単一実装の検査 `packages/area/src/utils/__tests__/prefecture-short-name-single-impl.test.ts` の許可リスト 6 件 (縮小のみ。`packages/svg-builder/src/charts/bar-chart.ts:192` は北海道を「北海」にする) と、TS の正本を import できない `.claude/scripts` の .mjs 18 ファイル。
  3. スクリプトの小さな重複ヘルパー: JST 変換 27、getArg 52、fetchText 20、dotenv 読み込み 27、ブラウザ起動引数 16 (ISO 週は `SCRIPT-ISO-WEEK-UNIFY-01`、Google API の認証は `SCRIPT-GOOGLE-CLIENT-UNIFY-01`)。挙動の差を一覧にしてから共通化するか決める。
  4. データ表の重複: 県庁所在地の座標 3 か所 (精度差)、8・10 区分の地方区分。databook のカテゴリ名と migration-flow の FocusFile 変換は寄せ、港湾は 2026-11-11 に ges の写しを消して台帳 `areas.ports` を読む形にした (配布済みの xlsx は再生成していない)。
  5. remotion の一部・ges・migration-flow は `@stats47/area` などを依存に持たず県リスト等を再定義している (svg-builder と product-factory は宣言済み)。依存を足すか (package-lock の更新を伴う) を決める。
- **2026-10-26 の変更で未確認のもの**: 調査名は解決時にマスタ (`surveys.master`) で上書きしているが、`build-estat-provenance.ts` の出力に旧表記が残る。Kindle の単位検査 (`content-invariants.ts`) を `parseUnit` に変えたあと、既存の版の `verify-epub` は再実行していない。remotion の `shared/utils/choropleth.ts` と `features/geo-x/GeoInsightCard.tsx` は 5 桁の市区町村コードを県コードに寄せるようになったので、次にこの 2 つで画像を作るときに前の版と目視で比べる。
- **trigger**: 上のどれかを触る改修が入るとき、または同じ値の不一致で不具合が出たとき。
- **停止条件**: 寄せると出力 (表示文言・ファイル名・URL・画像ハッシュ) が変わるものは、変えてよいとオーナーが決めるまで寄せない。
- **完了条件**: 候補ごとに「正本へ寄せた」か「寄せない理由を正本の近くに書いた」かが決まっている。

### [CHART-SOURCE-DERIVE-01] 図ごとの出典 (ブログの `<data-source>` タグ・機能別 ChartFooter の固定値) をデータから導出する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ]

- **背景**: 2026-09-25 にページ末尾の出典は `DataSourceList` でデータ由来に統一したが、図ごとの出典は手書き・固定値が残る。
- **次**: ① `<data-source>` タグの label/url を、同じ図の source.json から導出した出典と突き合わせ、食い違い・リンク切れを一覧化する。
  ② 図の直下の出典を source.json から自動表示する (タグを使わない) か、タグを残すなら監査に載せるかを決めて実装する。
  ③ 機能別の固定値を metric config / attribution 由来に置き換える。④ 系譜 URL の到達性を定期監査に入れるか検討する。
- **trigger**: 出典リンク切れ・誤表記の指摘、または図の出典の書式を変えるとき。
- **完了条件**: 図ごとの出典がデータから導出され、手書きの出典 URL が監査対象になっている。

### [BLOG-MUNI-SOURCE-LINK-01] ブログの図の直下カードから市区町村ランキングへ張れない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-23] [領域:サイト]

- **済 (2026-10-28)**: 構造検査 (`article-structure-lint.mjs`) が `/municipalities/ranking/<key>` と `/<県コード>` を図のカードとして数え、`RankingLinkCard` は市区町村の href でリンクだけを出す (テストで固定)。
- **残り**: `municipality-population-change-census-2025` の図のカード (今は `/ranking/<key>` と「あわせて見る」のテキストリンクで代用) を市区町村版へ差し替えて公開し、本番で確かめる (公開は承認が要る)。存在しないキーの検出は `BLOG-MUNI-LINK-LINT-01`。
- **完了条件**: 市区町村の図の直下に市区町村ランキングのカードを置いた記事が quality-gate を通り、本番でカードが市区町村ランキングへ移る。

### [MUNI-AI-CONTENT-EXPAND-01] 市区町村ランキングの解説を需要のある指標へ広げ、監査の穴を 2 つ塞ぐ
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-22] [領域:データ]

- **前提**: 試験 1 指標 (`census-population-change-rate-5y`) で、本文 → 配信値での監査 → critic → ページ描画の経路ができた (`MUNI-AI-CONTENT-01`)。
- **次**: ① GSC で表示回数の多い市区町村ランキング (W41 で 65 URL) から上位 10 指標を選んで書く。1 指標ごとに `generate-municipality-ranking.ts --key <key>` で `"aiContent": "written"` を確かめ、critic を通す。② 監査に足す: 増減率・割合の指標で FAQ の質問が「最も増えた/減った」のように率を言わない形を止める (2026-10-22 の critic が試験版で指摘した型。率の指標の全件に出うる)。③ 原発事故・地震など配信値に無い外部の事実は監査が検証できない。書いてよい事実を出典付きで限るか、critic の確認項目として固定する。
- **停止条件**: 表示を受けているのに解説を足した指標の CTR・掲載順位が `[MUNI-SSDS-EXPANSION-01]` の基準 (2026-11-22 判定) より悪化したら、広げるのを止めて原因を確かめる。
- **完了条件**: 10 指標の解説が本番に表示され、②の検査がテストで固定されている。

### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [種類:改善] [実行:対話] [起票:2026-07-12] [領域:管理]

- **owner**: Claude Code
- **状態**: 未完了範囲はCIのbuild成果物再利用・変更種別ごとの検査分岐・短縮効果の実測。型検査の必須性を維持し、同一入力で合格したローカル検査は変更理由がなければ繰り返さない。
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **実測根拠（2026-09-13）**: PR964のCIはStatic Gates 533秒・Full E2E 522秒・Build Check 309秒の並行実行で、テストmatrixだけの修正でも全体build・型・unit・E2Eが再実行された。
- **次（実行順）**: ①jobごとの依存導入・build・検査・cache復元/保存の壁時間を測る。②コード・lockfile・生成設定・データmanifestの組を固定し、同じ入力の検証済みbuildを後続jobで再利用できるか試す。③アプリ変更、テスト変更、運用記録だけの変更に応じたrequired checksを設計し、無関係な全体buildの繰り返しを減らす。④同じscopeの前後時間と費用を比較する。公開R2を候補コードへ組み合わせるE2Eでは、カタログ変更の公開前後で期待値がずれるケースを別途検出する。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。
- **完了条件**: 変更種別ごとに必要な検査が必ず実行され、入力変更時のcache失効と失敗伝播を確認する。復元/保存込みの同条件比較で短縮が実測されるまで高速化完了とはしない。今回のリリースへCI構成変更を追加しない。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ]

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。

### [GEO-DEV-LOCAL-R2-01] Mac の dev-server で公開前の Geo 生成物 (.local/r2) をローカル確認できるようにする

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:管理]

- **事象**: `scripts/dev-server.ts` は R2 を `.local/r2` で上書きする仕組みが Windows の gateway にしか無く、Mac では公開前の Geo bundle を dev server で確認できない。
- **trigger**: 次に新しい Geo 分析を公開前に確認するとき。
- **完了条件**: Mac でも `.local/r2` を優先して読む dev server の起動方法が手順書にあり、公開前の Geo ページを表示できる。
- **棚卸し (2026-11-22)**: 手順を `.claude/rules/local-environment.md` に書き、中継 (`.github/scripts/r2-overlay-server.mjs`) が公開前の Geo の JSON (`app/geo/<slug>/**.json`) を `.local/r2` から返すようにした (テスト 7 件)。残りは localhost で公開前の `/geo/<slug>` を開いて表示を確かめること。画像 (webp) は中継しないので 404 になる。

### [REFERENCE-METRIC-FOLLOWUP-01] 参考文献由来の指標の追補 (熱中症の人口当たり・男女比の 2025 年国勢調査)

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [待ち:承認] [起票:2026-10-08] [領域:データ]

- **内容**: ① `heatstroke-deaths` は実数のみ。人口 10 万人当たりの計算型 metric (`fetcherKey: calculated`) を足すと県の比較に使える。② `sex-ratio-age-20-39` は 2015・2020 年のみ。2025 年国勢調査の 5 歳階級別人口が公表されたら年を足す (`.claude/scripts/data/fetch-census-sex-ratio-20-39.mjs`)。
- **trigger**: ①は熱中症を扱う記事やテーマを作るとき。②は 2025 年国勢調査の年齢別確定値の公表時。
- **完了条件**: それぞれ指標が R2 に反映され、ランキングページで確認できる。
- **棚卸し (2026-11-22)**: ① の `heatstroke-deaths-per-100k` (人口 10 万人当たり。calculated・`isActive:false`) を足した (`metrics:check` 通過、dry-run で 12 年 564 行)。残りは main に入ったあと calculated-stats で値を R2 に上げてから `isActive:true` にすること。② の 2025 年国勢調査の男女比は公表待ち。

### [METRIC-DEF-ELECTRICITY-DEMAND-01] 電力需要量 (electricity-demand) の config に定義・調査が無く、単位が全角の「Ｍｗｈ」
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --keys electricity-demand] [起票:2026-10-08] [領域:データ] [待ち:承認]

- **済み (2026-11-14・316df9603)**: 指標定義 data/metrics/electricity-demand.ts の単位・補正の単位・seoTitle・seoDescription を半角の MWh にそろえ、e-Stat の項目定義 H (H5105) の定義を description に書いた。
- **残り**: 公開 R2 の app/stats/electricity-demand/values.json と app/ranking/electricity-demand/item.json は unit が「Ｍｗｈ」のままなので、electricity-demand を取り込み直す (data/data-refresh-requests.json を develop へ push するか data-refresh.yml を手動で起動し、続けて sync-snapshots の ranking-items と ranking-values を回す)。R2 への書き込みが要るため、このカードの作業では行っていない。取り込み直した後に、ランキングページ /ranking/electricity-demand とブログ cc-estat-14 の単位の表記を確かめる。表示単位の台帳 data/metrics/display-units/ledger.json は週次の作り直し (npm run weekly:audits の display-units) で「MWh」になることを確かめる。
- **完了条件**: 公開 R2 の values.json と item.json の unit が「MWh」になり、ランキングページの単位が半角の MWh で表示され、npm run check:display-units --workspace=@stats47/data-configs が electricity-demand の unit-changed の警告を出さない。

### [BLOG-CC14-STACKED-AREA-FIGURE-01] cc-estat-14 (積み上げ面の記事) に、実データの積み上げ面の図を載せる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs contents/blog/cc-estat-14-energy-area-chart/article.md] [起票:2026-10-08] [領域:サイト]

- **済み (2026-11-14・4bed48943)**: 積み上げ棒の型に積み上げ面の形 (data-form="area"、renderStackedAreaChart) を足しました。
- **残り**: 公開中の記事 cc-estat-14-energy-area-chart の article.md と data を R2 から取り出し、outbox に置いてください。e-Stat の表 0003409159 の電力量 (tab 160) から、2013 年 4 月〜2016 年 3 月の電灯需要計 (cat01 120)・電力需要計 (200)・特定規模需要計 (310) を取得します。取得した値は energy-demand-stacked.json ("form": "area"、series 3 本、単位は GWh などの読みやすい桁にそろえる) と source.json (kind estat、statsDataId 0003409159) にしてください。generate-article-charts で図を描き、本文の「仮の値」のサンプルの節に図と解釈の段落を足します。そのあと quality-gate と blog-critic を通し、オーナーの指示で再公開します。
- **残り (判断)**: e-Stat の値は MWh 単位で月 2,000 万を超えます。そのため図の単位を、GWh に割る (推奨。目盛りと右端の値が 5 桁に収まる) か、MWh のまま描くかを決めてください。GWh に割る場合は、source.json の transform に換算を書きます。
- **追補 (2026-11-14)**: 型の台帳 `data/content-operations/image-templates.json` は、積み上げ棒と折れ線の renderer を `packages/svg-builder/src/` としているが、描画は `apps/admin/lib/template-composition-stacked.ts` と `template-trend-line.ts` が行っている。台帳を実装に合わせる。
- **完了条件**: 記事に実データの積み上げ面の図 (明暗 2 枚) があり、quality-gate.mjs が通り、blog-critic が PASS を返していること。
- **オーナー決定 (2026-11-24)**: 推奨どおり 図の単位を GWh に割る を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: e-Stat 表 0003409159 から値を取得し、source.json の transform に GWh への換算を書く。再公開の実行はオーナーの指示の後

### [SITE-RENEWAL-01] サイトをリニューアルする（Claude Design で検討した案を形にする）
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト] [待ち:判断]

Claude Design で検討済みの案がある。着手時に案の所在と範囲（トップ・一覧・詳細のどこまで変えるか）を決める。（出典: obsidian の TODO マスタ ^t-0004 から移管・2026-10-19）
- **統合 (2026-10-26 オーナー判断)**: `BRAND-IMAGE-01` (色・トーン・見た目の約束を決める。)
- **2026-10-26 追記 (配線監査・旧 BRAND-IMAGE-01 の論点)**: ブランドの主色が媒体で 2 つある。サイトの OGP は `apps/web/src/features/ogp/brand.ts` の `#304BC6`、動画は `apps/remotion/src/shared/themes/brand.ts` の `#1E40AF`。
  色を決めたら、片方を packages に移してもう片方が import する (どちらを正にするかはこのカードで決める)。

### [AUTHOR-PROFILE-UPDATE-01] 著者プロフィールを「土木系公務員退職者」に更新する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト] [待ち:判断]

サイト・note・SNS の著者紹介の文言を揃える。経歴の書き方は本人に確認してから変える。（出典: obsidian の TODO マスタ ^t-0006 から移管・2026-10-19）

### [LOCAL-DATA-CLEANUP-01] 手元データの期限切れ（.local）を片付ける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [待ち:判断] [検証:npm run check-local-data] [起票:2026-10-19] [領域:管理]

方針は `.claude/shared-policy/LOCAL-DATA.md`。

- **済み (2026-11-23)**: 申告 `.claude/shared-policy/local-data.json` に区分を足した。ビルドとテストの生成物・キャッシュ (`.wrangler`・`coverage`・`.husky/_`・テストの比較画像・`.local/muni-data-products/_cache` 1.1GB・`.local/r2-manifest`・`data/` の追跡外の写し) は再生成できるもの、エディタの設定は端末固有、`.env.local` と直下の `stats47-*.json` (GCP のサービスアカウントの鍵。git の追跡外) は秘密の値、各アプリの `.local/` は作業中の置き場にした。申告外は 89 件 → 11 件、上限超えは 583 件 → 241 件。
- **残り (オーナー判断)**:
  ① 済み (2026-11-23・オーナー承認): リポジトリ直下の `private/tmp/claude-501/...` (過去のセッションの試作の JSON・268KB) を消し、申告外は 0 件になった。
  ② 上限 60 日を過ぎた 241 件の内訳: `.local/authenticated-measurement` 123 件 (ログイン計測の生の記録。記録は週次で `data/` に残る)・`.local/image-staging` 72 件 (商品画像の下書き)・`.local/kindle-listing-revisions` 24 件・`.local/selection-backfill` 10 件・`.local/blog-imagegen` 6 件・`.local/authenticated-ci-public` 5 件・`.local/geo-content-pipeline` 1 件。採用した画像があれば Google Drive (`drive-archive.mjs`) へ移してから消す。
- **完了条件**: `npm run check-local-data` の申告外と上限超えが 0 件。

### [BLOG-MUNI-SERIES-01] 市区町村データの解説記事を連載にする (国勢調査 2025 の人口増減から)
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-21] [領域:データ]

- **根拠**: GSC 2026-W41 (rolling28d) で市区町村ランキングは 448 clicks / 4,686 imp・CTR 9.56% だが、市区町村ランキング ↔ ブログの
  サイト内移動は週 3 件 / 1 件しかない。「◯◯市 人口」の検索語は 1,840 imp・CTR 0.11% (`MUNI-PAGE-SEO-01`)。
  記事が市区町村の指標を使えば、記事のデータ欄・市区町村ランキング・市区町村ページの関連記事に自動で載る (回遊は `sameMetric` / `explains`)。
- **題材の候補 (データは公開済み)**: ① 2020→2025 年に人口が最も減った・増えた市区町村 (珠洲市 -34.6%・輪島市 -28.3%・大熊町 +81.0%。
  `census-population-change-rate-5y`) ② 東京 23 区の比較 (課税所得・転入超過・高齢化。23 区の公開は 2026-10-21) ③ 市区町村の財政力と
  地方債 (`fiscal-strength-index` ほか地方財政テーマの 19 指標)。
- **次**: 型は `blog-quality-standards.md` のアーキタイプから選び、article-writer → blog-critic (PASS 必須) で 1 本目を作る。
  記事の `rankingRefs` に市区町村ランキングと同じ key を入れる (回遊の結線はこれだけで足りる)。
- **禁止・承認境界**: `contents/blog/` を develop へ push すると自動公開が走るので、原稿は別ブランチに置き、公開はオーナーの承認後。
- **完了条件**: 1 本目が公開され、市区町村ランキングの「同じ指標のランキング・記事・テーマ」に出ることを本番で確かめる。

### [CITY-UNIT-DENOMINATOR-01] 市区町村ページ・ランキングで、分母が subtitle にしか無い指標が件数のように見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-23] [領域:データ]

- **証拠**: 市区町村の表示名 (`municipalityRankingDisplayTitle`) は、同名の指標と衝突するときだけ subtitle を付ける。
- **次**: 分母の持たせ方を 1 つに決める。(a) subtitle が分母を持つときは表示名に必ず付ける、(b) unit に分母を入れる (`packages/data-configs/src/unit/` の
  正典で「人/km²」などを解釈できる形)。全件の洗い出しは語の一致ではなく `parseUnit` の `hasDenominator` と subtitle の組で行う
  (`.claude/rules/unit-semantics-standards.md`・`feedback_ssds_denominator_evidence`)。「指数」のような無次元の unit を値の後ろに付けるかも同じ規則で決める。
- **完了条件**: 上の 7 件を含め、分母を持つ指標が市区町村ページ・市区町村ランキングの title で分母付きに表示され、検査がその規則を固定している。

### [KINDLE-S1-BLOG-REWRITE-RECONCILE-01] ブログの書き直しで本の校訂が当たらなくなった 4 冊 (K-S1-01・04・06・09) を、作り直せる状態に戻す
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:商品]

- **事象 (2026-11-03)**: 本の章の元のブログ記事 6 本が 2026-10-02 前後に大きく書き直され、本のための本文の校訂 (`editorial-corrections.ts`) の置換元がほとんど見つからない。
- **決定 (オーナー・2026-11-03)**: (b) 書き直した今のブログ本文で作り直す。
- **済み**: 当たらない校訂を外し、今の本文を critic に読ませた指摘を校訂に足した。
- **残り**: ① 当たらなかった MINOR 2 件 (manufacturing の注意書きの重複、「効率」の言い方) ② 置換元の無い構造の指摘 (K-S1-06 の散布図の解説・ふるさと納税の節、K-S1-09 の一般論の節) は本文を書き足す判断が要るので未着手 ③ 正式の版 (承認済みの表紙)・保全・`kdp-publish --update` はオーナー承認 (`KDP-K-S1-08-REUPLOAD-01` と同じ便)。
- **停止条件**: 「準備中」の章が入った版を入稿しない。校訂を当たる形に機械的に書き換えない (レビュー済みの判断が消える)。
- **完了条件**: 4 冊とも章の欠けなしで生成でき、`verify-epub` の warn が前の版より増えず、改ページの取り残しが 0。

### [KINDLE-QUALITY-LOOP-01] 既刊 Kindle の中身を、機械の検査 → 図のスクショ評価 → NotebookLM の通読の 3 段で安く直し続ける仕組みを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-03] [領域:商品]

- **起点 (2026-11-03 オーナー)**: 本文にもっと図を入れる・全データの表を見せる、を売れている内容を踏まえて拡充し、機械の検査・スクショのエージェント評価・NotebookLM の通読をトークンを節約して回したい。
- **図の配線 (2026-11-03 確認)**: ブログ由来の章の図は本を作るたびに R2 の `app/blog/<slug>/data/<name>.svg` を読む (`fetch-content.ts`) ので、ブログの図を共通の型 (`apps/admin/lib/template-ranking-bars.ts`・`template-ranking-tile-map.ts`) で描き直せば次の作り直しで入る。書籍版の図の校訂 (`figure-corrections.ts`) は元の文字が変わると生成を止める (止まったらエントリを消すか直す)。ランキング章の図 (`ranking-databook.ts` が `generateBarChartSvg` を直接呼ぶ) は共通の型を通っていないが、販売中の S1 12 冊には無く、効くのは公開を止めている S2〜S4 だけ。共通の型を `packages/product-factory` から使うには共有の場所へ移すか相対 import するかを決める (図の共通化の作業の持ち主と相談)。
- **仕組み (トークンを使う段ほど対象を絞る)**: ① 機械の検査 `npm run kindle:quality [-- --write]` (`quality-cli.ts`・集計は `epub-inspect.ts` を管理画面と共有・記録 `data/products/kindle-quality.json`・EPUB は Mac の `.local` のみで CI 不可) ② 図のスクショ評価 (`capture-figures.mjs` 600px → Haiku/Sonnet、PNG の sha256 で `data/products/kindle-figure-reviews.json` に記録。1 枚約 7 千トークンなので印の付いた図か図の型ごとに 1 枚に絞る) ③ NotebookLM の通読 (`notebooklm-review.ts`、1 冊 1 notebook・`clear` で会話を切る。答えは `.local/kindle-quality/<id>/notebooklm.md`) ④ 直す [オーナー承認]: `editorial-corrections.ts` → `build-book` → `verify-publishable` → Previewer → `kdp-publish --update` で 1 冊ずつ ⑤ 効果を見る: 改訂した冊としていない冊で販売台帳の月次と GA4 `product_click` (`PRODUCT-REFERRAL-MEASURE-01`) を並べる。規模的に統計判定はできず「判定不能」も結果として書く。
- **済み (2026-11-03 まで)**: ①を実装して 12 冊を計測した (印: 図の無い長い章 37・全県表の無い図の章 63・説明の無い図のある章 15・サイトへのリンクなし 12 冊)。
- **紹介文の照合で見つかった本文の表記の不具合 (2026-11-13、入稿版 EPUB と照合。次の版で直す)**: 見出しと本文の年度表記の違い (K-S1-11 行動者率 3 表・K-S1-09 工業地帯の図・K-S1-10 労災の図 5 点)。見出しの指標名が本文と違う (K-S1-12 放送メディア利用時間・K-S1-02 中華そば)。単位 (K-S1-08「Mwh」「KL」)。県名の省略 (K-S1-07 台湾人宿泊者・K-S1-04 化学工業 2 表)。家計調査の注記の欠け (K-S1-01 は灯油・紅茶の 3 表だけ)。代替テキストと本文の矛盾 (K-S1-11 博物館数の類似施設)。家計調査の対象の書き方が 2 通り (K-S1-05)。紹介文は見出しを写すので、見出しを直すまで紹介文にも出る。
- **残り (オーナー)**: ① Kindle アプリの「ドキュメント」に届いている K-S1-02-v5-tables・K-S1-07-v5-tables を 1 回開く (任意) ② 承認済みのポップ表紙で正式の版を作り直す (`KDP-K-S1-08-REUPLOAD-01` と同じ便) ③ critic の差分レビュー・保全・`kdp-publish --update` の承認 ④ K-S1-07 の通読の指摘 (同じ注意書きの 6〜7 か所の繰り返し・第 5 章が 2001 年の海外旅行でテーマと年がずれる) は本文の編集判断が要るので未着手 ⑤ Haiku の「本文と図の食い違い」候補 5 件 (K-S1-07「濃く塗られた 6 県」「3 つの断層」、K-S1-02 ラーメンの「鏡のように逆転」・かにの県と市の基準・「鳥取・福井に続いて新潟」) は候補で未確認。直す前に人が図と本文で確かめる。
- **次 (実行順)**: ① 週次レビューで `kindle:quality -- --write` を回すかを決める ② ランキング章の図を共通の型へ寄せる方法を、図の共通化の作業と決める ③ 2 冊の試行のトークンと指摘の質を踏まえ、残り 10 冊へ ②③ を広げるかを決める。
- **不具合 (2026-11-14 観測)**: EPUB の無い PC (Windows) で `kindle:quality -- --write` を回すと、販売中の S1 13 冊が `epub-missing` で上書きされ、前回の実測が消えた (git から戻して K-S3-08 だけを足し直した)。直し方: EPUB が無い本は前回の記録を残し、`epub-missing` で上書きしない (今は書き込み前に止める仕組みが無い)。
- **停止条件・禁止**: 新しい本・シリーズを作らない。販売中の版の差し替えはオーナー承認と `KDP-K-S1-08-REUPLOAD-01` の手順を通す。評価済みの図・章をもう一度評価しない (sha256 で記録)。NotebookLM に入れるのは自分の本だけ (他人の本や参考文献の全文を入れない)。
- **完了条件**: 機械の検査が全冊を毎週記録し、2 冊で 3 段の試行の結果 (指摘・トークン・直した箇所) が残り、残りの冊へ広げるかをオーナーが決めた。
- **追補 (2026-11-22)**: K-S1-01 の第 9 章の素材のブログ `black-tea-income-gap` は 2026-11-13 に公開 R2 から撤去された (`5324d040ef`)。v11 は表紙だけを差し替えて本文を v10 のまま保ったが、次に `products:kindle:generate --id K-S1-01` で作り直すと紅茶の章が消え、章ごとに「データ出典」の節も増える。作り直す前に、章を差し替えるか残すかを決める。
- **追補 (2026-11-24・KDP-PROMOTE-STALE-PROPOSAL-01 の修正から)**: promote が提案を写す前に今の書籍の `authoredBookSha256` を EPUB と提案の両方と照合するようにした。この修正より前に書き出した `.local/kindle-listing-revisions/*.json` は `authoredSha256ByBook` を持たないので promote が stale で止まる (意図した止め)。次に出品を更新するときは `export-kdp-listings.ts` で提案を作り直す。`export-kdp-listings.ts` は import すると `main()` が走るので、CLI の経路を通すテストが書けない (main を関数に分ければ書ける)。

### [KDP-REGION-BOOKS-MAC-01] 地域データブック 7 冊 (K-S3-02〜08) を KDP で公開する
タグ: [収益化] [種類:制作] [実行:対話] [検証:node .claude/scripts/kdp/kdp-listing-copy.mjs check] [起票:2026-11-14] [領域:商品] [待ち:承認]

- **済み (2026-11-14・Windows)**: 原稿・意味レビュー・紹介文 (オーナー承認・出品台帳へ apply)、6 冊の表紙の県境の地図化と縮小確認 (readable)、EPUB の作り直し (K-S3-02〜07 は `v2-20261114-map`、K-S3-08 は `v7-20261114-first`)、epubcheck 5.1.0 で 7 冊とも 0 error / 0 warning。
- **済み (2026-11-18・Mac)**: Drive で受け取った入稿版 42 ファイルの SHA が照合の一覧と一致し、EPUB・表紙・背景の SHA も git の記録 (`kindle-quality.json`・`kdp-cover-thumbnail-checks.json`・`cover-design.ts`) と一致。
- **済み (2026-11-18・⓪)**: 出品台帳の 7 行に `publicationStage` を戻したうえで `npm run kindle:quality -- --write` を実行し (実測の対象は `publicationStage` のある下書きなので、戻す前に測ると 7 冊が漏れる)、`kindle-quality.json` は 7 冊の行だけを差し替えた。 (参照: b13e9a284)
- **済み (2026-11-18・②)**: 表紙の背景 7 枚を `push-exact-r2-assets.ts` で公開 R2 へ反映し (K-S3-02〜07 はオーナー承認 2026-11-18)、読み戻しの SHA が 7 枚とも記録と一致。
- **済み (2026-11-18・⑤の機械側)**: `capture-pages.mjs --all` で 7 冊の全ページを撮り、はみ出す表 0。
- **済み (2026-11-18・③)**: 7 冊の入稿版を `kindle:archive --push` で暗号化保全し、`--audit --deep --record` が 7 冊とも PASS (`data/products/kindle-archives.json` の latestRevision を更新、旧版の記録は保持)。
- **済み (2026-11-18・作り直し)**: 全章レビュー (REVISE: 暦年の医師数・地価を「年度」と書く等) を受けて生成側と原稿を直し、7 冊を新しい版で作り直した (K-S3-02〜06 `v3-20261118-review`・K-S3-07 `v4-20261118-tie`・K-S3-08 `v9-20261118-tie`。)
- **次に版を作るときに直すこと (MINOR)**: 第 2 章の全体像の表と全県表 (消費支出・認定こども園数・災害被害額) の注記、同順位の県を図と全体像の表で併記、扉と content.opf の説明文の常体、表紙の帯「5つ」と安全・地図の凡例、「約26867.0倍」と単位「m2」の表記、`cover-design.ts` の背景の status を published にする (照合値に入るので版を作るときだけ)。指摘の全文は各版の `.local/kindle-books/<ID>/<版>/review.md`。
- **検査に足すこと**: `verify-fresh.mts` が、本文に挙げた同順位の県の集合が全県表と一致するかと、指数 (全国=100) を全県表と同じ桁で書いているかを見ていない (K-S3-07・08 の BLOCK はこの 2 つ)。
- **済み (2026-11-18・紹介文)**: 7 冊の 2 つ目の要点を「<地域>の県ごとの章で、その県の数字を全国順位とあわせて読める」に直した (オーナー承認 2026-11-18。)
- **済み (2026-11-18・指標の一覧)**: 実測 (`epub-inspect.ts`) がランキング章の全県表 (「全県の収録値」と「単位: …。)」
- **次 (実行順)**:
  ⓪ 既刊 K-S1-01 の `scopeNote` の物価地域差指数の誤り (県庁所在市の値と書いている) を直すかはオーナーの判断。
  ⑤ KDP の下書き: K-S3-02・03 は 2026-11-18 に作成・読み戻し検証済み (verified)。K-S3-04〜08 の 5 冊は KDP の週間タイトル作成数の上限 (「本の作成数上限に達しました」、リセットは日曜 00:00 UTC) で作れなかったので、2026-11-22 (日) 9:00 JST 以降に `kdp-publish --id <ID>` で作る (失敗の回は下書きを残していない。表紙・価格が 1 回目で入らないことがあるので、verified にならなければ 1 回だけ再実行する)。
  ⑥ K-S3-02・03 は 2026-11-18 にオーナーの指示「全部公開」で `kdp-weekly-publish --week 2026-W47 --id <ID> --owner-approved <ID> --commit` を実行し、審査に提出した (本棚 status レビュー中・ASIN 割当待ち)。KDP の審査後に本棚の状態を取り直し (`kdp-batch --phase status`)、販売中と ASIN を台帳に記録する。K-S3-04〜08 は ⑤ の下書きのあと、1 冊ずつオーナーの公開承認を得て出す (11-18 の「全部公開」はその時点で下書きのあった 2 冊への承認として扱った) (`kdp-weekly-publish -- --week <週> --id <ID> --owner-approved <ID> --commit`)。KDP の未公開は約 10 冊までなので、7 冊を一度に下書きにしない。
- **完了条件**: 7 冊が KDP で販売中になり、出品台帳の `kdpStatus` が live。
### [KINDLE-FRESH-CAUTION-CHECK-01] 書き下ろし原稿の検査で、指標の注記 (⚠) を書いたかを機械で確かめる
タグ: [コンテンツ品質] [種類:改善] [実行:sweep] [検証:npx tsx packages/product-factory/scripts/verify-fresh.mts --book K-S3-08] [起票:2026-11-14] [領域:商品]

- **起点 (2026-11-14)**: K-S3-08 の意味レビュー (blog-critic) で、持ち家比率・住居の物価・医師数の注記が章によって抜けていた (should 6 件)。
- **次**: 1県1章の本 (`isPrefectureGuide`) で、指標名が出てくる章に、その指標の注記の要点 (県庁所在市・帰属家賃) があるかを決定的に数える。注記を第1章へまとめる書き方を許すなら、本 1 冊のどこかに 1 回あればよい形にする。
- **同じ検査に足す (2026-11-14 の書き直しで判明)**: 本文の「2022年」と「2022年度」の書き分けも見ていない。指標定義の `yearFormat` (fiscal なら「年度」、ほかは「年」。全県表 `full-tables.ts` と執筆ブリーフも同じ決め方) と、本文で指標名の近くに書かれた年が食い違えば error にする。R2 の yearName は暦年の指標でも「年度」のことがあるので照らし先にしない (`YEARFORMAT-REFLECT-01`)。
- **比較の文と定型の型 (2026-11-14 近畿・中国のレビューで判明)**: 「最も上位にあるのは○○」「5県で最も高い」のような比較の文を実データと照らしていない (中国の本で、最も上位でない指標を最も上位と書いた原稿が通った)。県の章の冒頭 3 文と結びが同じ型になっていても検出しない。
- **同じ本の中の同じ文 (2026-11-14 関東のレビューで判明)**: ブリーフの「⚠ の注意を本文にも書く」は、県の章ごとに同じ注記の文 (物価の指数の説明など) を生む。`dup-sentences` は本どうししか見ないので、本の中の重複も数え、第1章にまとめた注記は県の章で省略してよいとブリーフに書く。
- **完了条件**: 注記を 1 つ消した原稿と、年度を年に書き換えた原稿で検査が error になり、今の K-S3-08 では error 0 のまま。

## 🟢 低 — 再開条件を満たしたら着手する

### [HARNESS-SMALL-COSTS-01] Stop hook 6 本の起動と、増え続ける運用の記録 (効果が小さいので、次に触るときにまとめて直す)
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:管理]

- **事実**: Stop 1 回で node が 6 回起動する (起動だけで各 59ms。)
- **再開条件**: Stop hook か backlog-loop の台帳を次に変更するとき、または ledger.json が 1MB を超えたとき。
- **次**: Stop hook を 1 プロセスにまとめる。findings は前回の位置から読む。ledger の完了分を月ごとに分ける。旧置き場も 7 日で prune する。
- **完了条件**: 変更なしの Stop が 0.5 秒未満で、ledger.json が 200KB 未満。

### [WAGE-RULE-PAGE-01] 補助金の賃上げの要件に使う「都道府県別の最低賃金と物価」のページを作るかを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:サイト] [待ち:判断]

- **起点**: 統合補助金・省力化・デジタル化 AI・持続化の賃上げの要件は、都道府県の地域別最低賃金 (+30〜50 円) と物価上昇率を基準にする。
- **保留の理由**: 値は公的に無料で出ている。どの物価指標を使うかは要領に定義が無い (未確認)。
- **再開条件**: `KAKEI-MARKET-SIZE-PILOT-01` が続くと決まったとき。
- **完了条件**: 作る・作らないを決めた。

### [DATA-REFRESH-SCHEDULE-RESUME-01] 月次の全範囲更新を止めたので、main への反映と再開の条件を管理する
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:データ] [待ち:判断]

- **判断**: 2026-11-05 にオーナーが「指標の台帳とカタログが整理できていない間は全範囲の更新は不要」と判断し、`data-refresh.yml` の毎月 5 日の定期起動を外した。手動起動と develop の依頼ファイルからの起動は残した。
- **証拠**: run 42010655216 を最終同期 3,416 / 17,474 件で取り消した。24 指標の年の食い違いは run 42022242257 で修復し、公開データ監査は 0 件。ほかの約 14,000 件は 11-04 までの内容で、同じ年の値の改訂が未反映の可能性がある。
- **済み (2026-11-15)**: 本番反映 (#1274・#1275) で main の `data-refresh.yml` から毎月 5 日の定期起動が消えたことを、`git show origin/main:.github/workflows/data-refresh.yml` の `on:` で確認した (残るのは develop の依頼ファイルの push と手動起動)。
- **次**: ① 台帳とカタログの整理が終わる時期をオーナーが決める ② その後に全範囲を手動で 1 回実行し、中断しない ③ 定期起動を戻すかを決める。
- **追記 (2026-11-15)**: 定期の全範囲更新の代わりの仕組みを develop に入れた (`596cd0ed1`): 指標を空にして起動すると、更新された表を参照する指標と configHash の違う指標だけを選ぶ (全件は `--all`)。再開するなら全範囲ではなくこの選択で動かす → ESTAT-TABLE-SNAPSHOTS-01。
- **完了条件**: main から定期起動が消えていることを確認し、再開か廃止かの判断が記録されている。

### [SNS-KAKEI-EXPANSION-01] 家計調査のnote・サイト内容をX・Instagramへ展開する（再開指示待ち）
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-19] [領域:SNS] [待ち:判断]

- **判断・再開条件**: 2026-10-19のユーザー指示でSNS展開は後回し。note・サイトの既存公開分は維持し、SNSはユーザーが再開を指示するまで保留する。note・サイトの拡充は `CONTENT-KAKEI-EXPANSION-01`。
- **次・担当**: 再開時にx-strategist / instagram-strategistが既存note・サイトから家計支出の10分類・個別品目比較・都市ごとの特徴品目の候補を選び、共通4:5・1枚型で管理画面のnote・X・Instagramを比較して確認する。既存の試作素材を維持する。
- **停止条件・完了条件**: 今は制作・レンダリング・投稿を行わない。候補の3媒体比較・確認ができれば制作準備完了とし、投稿・予約は別途ユーザーの明示指示を得る。

### [WINDOWS-LOCAL-TEST-FAILURES-01] Windows の手元でだけ落ちるテスト 3 種を、CI と同じく通るようにする
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [起票:2026-10-27] [領域:管理]

- **事象 (2026-10-27、会社の Windows PC で実測。CI の Linux では通る)**: 
- **次**: 1 は所要時間の実測に合わせて制限を延ばす。2 は一時ディレクトリを短いパスに作るか、パス長に依存しない入力にする。3 は空・壊れた snapshot を globalSetup が作り直すか、明確な理由で落とす。
- **追記 (2026-10-27)**: 4 種目。`apps/admin` の `agent-models.test.ts`「frontmatter の無いファイルは画面を落とさず errors に載せる」が、errors の `file` を `.claude\agents\broken.md` (Windows の区切り) で返し、期待の `/` 区切りと食い違って落ちる。変更を退避した develop でも再現。台帳のパスは `/` に揃える (memory `feedback_windows_script_portability`)。
- **完了条件**: Windows で 4 種とも通り、CI の結果は変わらない。

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [BUSINESS-PLAN-TARGETS-CONFLICT-01] KPI の台帳に残る M3・M6・M12 の目標値を消すか、仮説として残すかを決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-13] [領域:戦略]

- **観測 (2026-11-13)**: `data/business-plan/plan/metrics.json` は `targetM3`・`targetM6`・`targetM12` (週次収益は 30,000・187,000・1,030,000) を持つ。
- **次**: 目標値を消すか、仮説の印を付けて残すかをオーナーが決める。`STRATEGY-LEDGER-JSON-01` の段 5 で KPI の階層を足す前に決める。
- **完了条件**: 台帳と戦略の記述が一致している。

### [TRADE-AREA-REPORT-DECISION-01] 補助金・創業融資の根拠に使える「商圏の参考資料」を受注するかを決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:商品]

- **起点**: ココナラの「商圏分析」は 118 件で、30,000 円の出品に評価 57 件、5,000 円に 25 件。
- **決めること**:
  1. 販売面。ココナラからは 2026-10-19 に撤退している (収益化戦略 §3.6)。戻すのか、note の案内から直接受けるのか、やらないのか。`PRODUCT-LINEUP-2026-11` (統計の地図・グラフを資料用に作る受注) と一緒に決める。
  2. 「法人向けの小地域データ・GIS は作らない」の例外にするか。受注ごとに jSTAT MAP で集計するだけで、データは持たない。
  3. 地図を納品物に入れるか。入れるなら jSTAT MAP の地図出力の利用条件を確かめる (未確認)。入れないなら表だけにする。
  4. 範囲と価格 (案: 市区町村の比較＋家計調査の単価＋到達圏の集計＋出典の表。文章は書かない。10,000 円の固定範囲。1 件 3 時間以内)。作業時間は実測が無いので、自分の地域で 1 回試して測る。
- **守ること**: 納めるのは参考資料 (値・出典・計算表) まで。計画書の文章は書かない。商品の説明に「申請書の作成は申請者本人か行政書士」と書く (改正行政書士法)。
- **前提**: `KAKEI-MARKET-SIZE-PILOT-01` の判定の後。
- **完了条件**: 受ける・受けないと、受ける場合の販売面・範囲・価格・工数の上限をオーナーが決めた。

### [IMAGE-BOUNDARY-CONSOLIDATE-01] 画像まわりの依存の向きと重複を直す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-06]

2026-11-06 の監査で出た指摘 4・9・10 に対応する。手順は vault の `memos/stats47画像まわり_次セッションの指示.md`、指摘の全文は `memos/stats47画像まわり監査_2026-11.md`。

- **範囲**: `GONE_BLOG_SLUGS` と `BRAND` を共有パッケージへ移す。`OgpVisualType` を `as const` の配列から導出する。`generate-blog-thumbnails.ts` と `generate-blog-thumbnails-cloud.ts` の重複を lib へ移す
- **判断待ち**: `BRAND` を移すと `rendererHash` が変わり、全画像の fingerprint が変わる。週次の自動修復は種別ごとに500件までなので、既定のままでは ranking で5週ほど [OGP Alert] が続く。手動で上限を上げるか、`BRAND` だけ後回しにするかをオーナーが決める
- **完了条件**: 別ブランチの PR が作られ、型検査と関連テストが通っていること。本番デプロイと R2 への書き込みはしない

### [PRODUCT-LINEUP-2026-11] 残りの判断: 統計の地図・グラフを資料用に作る受注をココナラで始めるか
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:商品]

- **問い**: ココナラで「統計の地図・グラフを資料用に作る」受注を始めるか。10-19 の撤退はデータ販売の撤退で、受注は別物。
- **材料 (2026-11-05 観測)**: ココナラの地図作成 ¥3,000 は評価 3,663・1,259・1,139 件、Excel 作業の代行は 594 件。統計の値で塗り分けた地図の出品は「塗り分け 地図」7 件の中に無い。評価数は関心の目安で、販売数ではない。
- **始めるなら先に決めること**: 時間単価と 1 件の工数上限 (§3.4「価格と採算」)、受ける範囲 (都道府県・市区町村のどこまで、手元のデータを使うか stats47 の指標だけか)、境界の出どころ (N03・Geoshape は使わない。`MUNI-DATA-LICENSE-CHECK-01`)。
- **判定 (始めた場合)**: 出品から 4 週で受注 2 件以上、かつ 1 件の実工数が上限以内なら続ける。
- **禁止**: 決まる前に出品しない。出品は人手のログインとオーナー承認を経る (`config/coconala-account.json` のアカウントだけ)。
- **完了条件**: 始める・始めないの決定が `02_収益化戦略.md` §3.4 と `product-strategy.json` にあり、始める場合は出品のカードがある。

### [ISSUE-PAYING-NEED-01] イシュー: 雑学の読者で広告を伸ばすのか、統計を仕事に使う人から売上を得るのか
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:商品]

- **問い**: stats47 が解く問題は、好奇心ではなく、むしろ仕事の問題なのか。統計を仕事に使う人は、お金を払うほど困っているのか。
- **仮説**: 今解いているのは「地元や話題の数字が気になる」という好奇心。仕事で払う人はまだ確かめられていない。
- **実測 (2026-11-05 観測)**: 検索 14,733 クリック/28日、食べ物の消費量が約 31%。
- **位置づけ**: どの顧客を選ぶかの上位の問い。2026-11-14 にオーナーが、聞き取りで先に確かめる進め方 (行政資料の pilot。聞き取り 0/3 件で停止していた) をやめ、商品を出して実売で確かめると決めた (収益化戦略 §3.4)。
- **問いの台帳との配線**: `data/content/issues.json` の `revenue` が `実務`・`データ` の問いを、聞き取りで「仕事で使うか」を尋ねる材料にする。
- **次**: 仕事の読者に向けた商品 (データパック・市区町村データ・ノウハウ) と KDP の実売の判定 (`MUNI-DATA-PRODUCT-PILOT-01`・`KNOWHOW-PRODUCT-PILOT-01`・`KDP-EXPANSION-01`) を待ち、どちらの読者で売上が立つかを月次計画で決める。
- **別の仕事の読者の候補 (2026-11-11)**: 補助金・創業計画を書く事業者とその支援者。根拠と試す順番は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **完了条件**: 上の判定の実売から、どちらの読者へ進むかをオーナーが決めて `02_収益化戦略.md` へ反映している。

### [PUBLIC-REPO-CONTENT-DECISION-01] 公開リポジトリに残る有料原稿・秘密の扱いを 1 回で決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-24] [領域:商品]

- **起点 (2026-11-24)**: 同じ判断 (公開リポジトリの中身と git の履歴をどうするか) を問うカード 3 枚 (`KDP-MANUSCRIPT-PUBLIC-REPO-01`・`NOTE-PAID-HISTORY-EXPOSURE-01`・`GIT-HISTORY-SECRET-PURGE-01`) を 1 枚にまとめた。
- **事実**: `uruhayato373/stats47` は PUBLIC。Kindle の書き下ろし原稿 178 ファイルが追跡されていて販売中の本の本文の一部が GitHub で読める (2026-11-04)。有料 note の原稿 `docs/31_note記事原稿/` が git の履歴に残る (2026-10-13・8ce8358c41)。履歴に API キーが残る (2026-07-11 起票。失効・rotation 済みかは未確認)。KDP Select の独占の条件にも関わる (`KDP-ROYALTY-RATE-CHECK-01`)。
- **決めること**: (a) 履歴はそのまま (既に公開済みと割り切る) / (b) 原稿を repo の外 (R2 の非公開領域) へ移し、`git filter-repo` で履歴から消して force push (全クローン・フォーク・CI キャッシュに影響し取り消せない。GitHub のキャッシュ削除依頼も要る) / (c) リポジトリを private にする (GitHub Actions の無料枠と Cloudflare 連携への影響を先に調べる)。
- **同じ確認**: 対象の API キーが失効・rotation 済みかと、今の tree に秘密が残っていないか (秘密検査)。`packages/product-factory/src/data/pack-snapshots/` など有料商品の中身が repo にないかの棚卸し。
- **禁止**: オーナーの決定なしに履歴を書き換えない・force push しない・branch を消さない・公開設定を変えない。
- **完了条件**: 方針が決まって実行され、(b)(c) なら GitHub 上で有料の本文と秘密が読めないことを確かめた。(a) なら理由を収益化戦略へ記録した。

### [AFF-MOBILE-PR-GAP-01] モバイルで PR が 1 つも出ない 12 種類のページと、案件の出方を決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-04] [領域:アフィリエイト]

- **起点 (2026-11-04 オーナー)**: 「アフィリエイトは全て完璧に配置できたの」への確認で、配置が方針どおりか断言できない点が残った。
- **分かっていること (2026-11-04 の撮影。開発サーバー・63 枚・撮れなかったページ 0)**:
  - 390px 幅で PR が 0 のページは 12 種類 (カテゴリの比較・タグ・ランキング一覧・テーマ一覧・都道府県一覧・調査一覧・ブログのタグ一覧・検索・日本全体のテーマ・市区町村ランキング・市区町村のテーマ・市区町村のハブ)。原因は、段の先頭の枠が AdSense で、モバイルには先頭の 1 枠しか出ないこと。
  - 検索ページは 390・768・1440px のどの幅でも PR が 0。
  - 390px で AdSense が 0 のページは無い (全ページ 1 枠以上)。
  - 共通の案件は延べ 楽天カード 34 枚・TOSSY 24 枚で出ている。TOSSY は台帳の題が「NISA・証券 バナー 1」(`af_economy_banner_001`) なので、管理画面でも画像の代替文字でもこの名前で出る。
  - 共通の案件ではない AI Agent Camp (`af_agent_camp_economy_001`) が、日本全体のテーマと市区町村ランキングの計 4 枚に出ている。文脈の解決から来たものか、意図どおりかは未確認。
- **まだ分かっていないこと**: 本番で AdSense が実際に埋まっているか (本番の HTML に段があることは `/`・`/themes/labor-wages`・`/ranking/total-population` で確認した。埋まり方は未確認)。PR を増やして AdSense を減らしたときの収益差 (本文の AdSense の 1,000 表示あたり ¥29〜45 に対し、PR は直近 4 週で 33,188 表示・42 クリック。成約の実績が足りず PR の表示単価を比べられない)。
- **決めること**: ① モバイルの先頭の枠を今のまま AdSense にするか、一部のページで PR にするか ② 検索ページに PR を出すか ③ AI Agent Camp を今の場所に残すか ④ TOSSY のバナーの題を案件名へ直すか (③・④ は判断だけで済む)。
- **次**: `AFFILIATE-COMMON-PRODUCTS-01` の前後比較 (PR は表示約 24,000 回、AdSense は 4 週平均) の結果を見てから ① を決める。先に動かすと比較が混ざるので、① は比較が終わるまで変えない。
- **完了条件**: ①〜④ の結論が収益化戦略 §3.1 か台帳 `data/ads/placements.json` に書かれ、変える分は別カードか実装で閉じている。

### [SEO-TITLE-CTR-CLOSE-01] title を変えた 10 ページの効果観測を「判定不能で終了」として GSC 運用サイクルに登録するか決める
タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-11-01] [領域:サイト]

- **選択肢**: (a) `data/improvement/gsc-improvement/closed-waves.json` に `decidedBy: owner` で終了を記録する (BLOG-WAVE 7 件と同じ扱い。エンジンの対象から外れる) (b) `.claude/config/gsc-operations-cycle.json` の `legacyMissingTargetSubjectIds` に足して FAIL を警告に下げる (c) 根拠を探して `[target:]` を付け、行を戻す。
- **付随**: 10 ページを変えていない近傍ページと比べる観測 (11-21 以降・差の差) を続けるかも同時に決める。続けるなら別 ID で起票する。
- **停止条件**: 「オーナー判断」の欄をエージェントが埋めない。
- **完了条件**: 選択肢が決まり、`node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week 2026-W44` の `effect-target-ratchet` が FAIL でない。

### [GIS-SURVEY-LAW-SITE-MAPS-01] サイトの地図の境界を、国土地理院の測量成果に由来しない e-Stat 国勢調査境界へ移すかを決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **オーナー方針 (2026-10-28)**: 複製承認は申請しない。国土地理院の地図に由来しない境界を使えばよい。
- **代わりの境界**: e-Stat「令和2年国勢調査 町丁・字等境界データ」 (説明 https://www.e-stat.go.jp/help/data-definition-information/download 、作成方法は「地方公共団体が設定した調査区の境界を基に作成」、利用条件は e-Stat 利用規約で商用可)。Geoshape も同じデータを加工した「国勢調査町丁・字等別境界データセット」 https://geoshape.ex.nii.ac.jp/ka/ (CC BY 4.0) を出している。どちらにも国土地理院の承認番号の記載は見つからなかった。商品 (`MUNI-DATA-PRODUCT-BUILD-01`) はこちらで作ると決めた。
- **論点**: ランキングの地図は「サイトへの地図の挿入」に当たりうるので急ぐ根拠は弱い。一方、市区町村の地図ページや Geo 分析ページは「地図コンテンツを主とするサイト」に当たりうる。移すと、①境域が 2020-10-01 時点に固定される (以後の変更は自分で直す) ②町丁を結合する前処理と、政令市の区・23 区の統合/分割 (`fetchMunicipalityTopologyForWardMode`) の作り直しが要る ③都道府県の境界は県境の接合処理がされていない (同じ説明ページ) ので、都道府県地図は別に考える。
- **次**: ① 商品で作る結合済み GeoJSON (`MUNI-DATA-PRODUCT-PILOT-01` のデータ完成の記録 ④) の生成スクリプトを、サイトの TopoJSON 生成にも使える形にする ② その出来 (形の数・飛び地・県境のずれ・ファイルの大きさ) を見て、サイトの市区町村地図を移すかをオーナーが決める ③ 移すなら `.claude/rules/gis-data.md` と `r2-storage-design.md`「市区町村の境界」に元データと出典表示を書き換える。
- **禁止**: 結論が出るまで今の地図を消さない (止める根拠はまだ無い)。R2 の境界の差し替えは承認制。
- **完了条件**: サイトの地図の境界を移すか据え置くかが決まり、据え置くなら理由 (地図の挿入に当たる等) が、移すなら移行のカードがある。

### [BLOG-GEMINI-AUTHOR-01] Gemini 無料枠でブログ下書き3本を小試験し、型別の通過率を比べる
タグ: [コンテンツ品質] [種類:制作] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **2026-11-01 オーナー判断**: Gemini を量産手段として再採用する。新しい無料枠キーを登録する。ブログは当面 author=Gemini、critic=Claude headless で3本を小試験し、型別の PASS 率・事実誤り・費用を既存の Claude author と比べる。品質ゲートは緩めない。
- **用意済み (branch `claude/determined-newton-2d077c`)**: `write-blog-headless.ts --author gemini-api` で既存の `gemini-text-client.ts` を使って下書きを書き、決定的ゲートと Claude の critic に通す。run の最初に極小の実生成で鍵を確かめ、HTTP 402 / クレジット枯渇は billing として止まる (以前は 402 を bad-request に分類していたので直し、単体テストを足した)。手元の `.env.local` に `GEMINI_API_KEY` は無い (GitHub Secrets 専任) ので、実際の生成は試していない。
- **根拠**: 公式料金表 (https://ai.google.dev/gemini-api/docs/pricing・2026-10-28 確認) では 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite / 3.x Flash / 3.5 Flash-Lite に無料枠があり、3.1 Pro Preview と画像系には無い。無料枠の入出力は Google の製品改善に使われうるので、公開データ (R2 の観測値と記事) だけを渡す。今の鍵は課金 project の前払いクレジット枯渇で 402 (ランキング解説の日次 run で 48 run 中 44)。2026-10-26 にオーナー判断で Gemini の経路は中止した。
- **次**: キーを `.env.local` に置くか、コマンド実行時の環境変数として渡す。`--author gemini-api --critic claude-sonnet` で3本試し、`headless-runs.csv` で Claude author と通過率を比べる。GitHub Secret だけでは手元の blog CLI は鍵を読めない。

### [BLOG-MONTHLY-CAP-01] ブログの月の本数上限 (月 15〜20 本) を、headless 化で 1 本の費用が下がった後も据え置くか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **今の上限**: `data/blog/seo-strategy.json` の `typeMix` (B 5 / D2 4 / A 3-4 / F 3 / G 1-2 / H 2 / C_E 1-2 = 月 17〜19 本)。
- **費用の根拠**: headless の実測は BLOG-HEADLESS-AUTHOR-01 を参照 (PASS 1 本 $0.32・書き直し込み 1 本 $0.10〜0.27・API 換算)。Agent tool 経路の約 10 万トークン/本・$8.2/本から大きく下がった。topic-queue の pending は 140 本 (must-write 60)。
- **据え置く理由の候補**: 費用ではなく、公開後の検索の評価 (薄い記事の量産と見なされないか) と、同じ主題の重複 (`BLOG-DUPLICATE-AUDIT-01`) が制約になっている。上げるなら GSC で新規記事の表示が付くかを 4 週見てから。
- **案**: 11 月は据え置き (月 17〜19 本) で headless に移し、通過率と GSC の表示を見て 12 月の月次計画で 25〜30 本に上げるかを決める。
- **決めてほしいこと**: 上限を据え置くか・上げるか、上げるなら何本か。

### [BLOG-OUTBOX-PASS-PUBLISH-01] `contents/blog/` で審査 PASS のまま止まっている下書きを公開するか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **状態 (2026-10-28)**: review.md が PASS の下書きは 7 本で、事実照合は 7 本とも通る。品質ゲートを今も通るのは `population-decline-land-price-divergence` だけ。5 本 (`elderly-welfare-expenditure-prefecture-gap`・`evacuation-plan-coverage-urban-prefecture-gap`・`intellectual-crime-tokyo-kagawa-gap`・`sme-business-sentiment-regional-gap`・`vacant-housing-rate-inherited-home-risk`) は未登録のタグ (UNREGISTERED_TAG)、`nursery-shortage-urban-prefecture` はスマホ用 SVG の欠落で落ちる。
- **次**: ① 5 本のタグを登録済みのものに替えるか台帳に足す ② nursery は `generate-article-charts.ts --slug nursery-shortage-urban-prefecture` でスマホ用 SVG を作る ③ 通ったものを `generate-blog-article.ts --ingest <slug>` で確定し、オーナー承認後に develop へ push する (公開は `blog-auto-publish.yml`)。
- **追加 (2026-10-28)**: headless の実測で審査 PASS した 3 本 (`dried-udon-soba-consumption-quantity-prefecture-gap`・`general-hospital-count-vs-elderly-single-person-households`・`avg-salary-police-prefecture-vs-national-assessment`) を `published: false` のまま branch `claude/determined-newton-2d077c` に置いた。後の 2 本は題材の弱さ (BLOG-TOPIC-PAIR-PER-CAPITA-01) があるので、公開するかは題材ごと判断する。
- **注意**: 2026-10-28 に headless の審査 (基準を blog-critic に揃えた版) を `vacant-housing-rate-inherited-home-risk` に掛けたところ、blog-critic (Agent) の PASS 後も「山梨を西日本に含める」「人口移動を因果として断定」の blocker が残っていた。公開前に各本を審査し直す。
- **決めてほしいこと**: 7 本を公開するか (月の上限 BLOG-MONTHLY-CAP-01 の枠に入れるか)。

### [BLOG-NOTEBOOKLM-RESEARCH-01] NotebookLM の調査材料を記事に入れる段を試し、公式 API (企業版) を使うか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **用意済み**: `/notebooklm-research` に「新規記事の調査段」を書いた。非公式 CLI (`~/bin/notebooklm`) の回答をそのまま `contents/blog/<slug>/research.md` に保存し、`write-blog-headless.ts` が author prompt に足す (白書の数値は書かせない)。Claude は回答を読まないのでこの段の Claude トークンは 0。ログイン (`notebooklm login`) は人がブラウザで行い、期限切れになると止まる。CI では使えない。
- **次**: 型B 以外の記事 3 本で research.md あり・なしを書き分け、critic の指摘 (背景の根拠不足) が減るかを headless-runs.csv と review.md で比べる。
- **決めてほしいこと**: 効果があれば、企業版 (Gemini Notebook Enterprise・Google Cloud のライセンスが要る) の公式 API に移すか。移さない場合は対話セッションで人がログインして回す運用のまま。

### [ADMIN-UI-DOBOKU-ALIGN-01] doboku-note の管理画面 (tools/admin-app) を stats47 と同じ Base UI (base-nova) の構成へ揃えるか決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-27] [領域:管理]

- **次**: doboku-note 側で Base UI へ移すか、Radix のまま見た目 (neutral・Geist・直角のカード) だけ合わせるかをオーナーが決める。移す場合は stats47 の `.claude/scripts/admin-ui/sync-shadcn-reference.mjs` (base-nova の取得と IconPlaceholder の変換) を流用し、作業は doboku-note のリポジトリで行う。
- **完了条件**: 方針が決まり、移す場合は doboku-note の backlog へ実装カードを移した時点でこのカードを削除する。

### [AFF-RANKING-SLOT-DECISION-01] ランキング面の広告枠 (ranking-incontent ほか) を続けるか決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-10-27] [領域:管理]

- **決めること**: ① `ranking-incontent` が 10-17 週から出ていない原因 (未確認。`git log -S"ranking-incontent" -- apps packages` と本番描画で確認する) を直すか、枠ごと外すか ② 残りの枠を、click が極小のまま続けるか。
- **完了条件**: 方針を決め、枠を直す・外す実装は別カードにする。

### [NOTE-PUBLISHED-DUPLICATES-DECISION-01] note 上で同じ記事が別 URL に複数回公開されている 8 組をどうするか決める
タグ: [SNS・マーケ] [種類:意思決定] [実行:ユーザー] [起票:2026-10-21] [領域:商品]

- **事実 (2026-10-21、`data/note/articles.json` の照合)**: 題名が同じで別の noteUrl を持つ公開済み記事が 8 組ある。
- **決めること**: 重複をそのまま残すか、片方を非公開にして残す方へ導線をまとめるか。有料の 3 組は購入者がいる可能性があるので、非公開にする前に購入の有無を記録 (`data/authenticated/revenue-history.json`) で確かめる。
- **停止条件**: note 上の記事の削除・非公開化はオーナーの判断と操作だけで行う (Claude はしない)。
- **完了条件**: 8 組の扱いが決まり、決めた操作の後に台帳の status が実際の公開状態と一致している。
- **統合 (2026-10-26)**: `NOTE-RECOVERED-DUPLICATE-CONSOLIDATION-01` をこのカードへ統合した。

### [GSC-MOBILE-PERF-PLAN-01] 実ユーザー性能とモバイルの検索意図から必要な改善を選ぶ
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-12-01] [領域:サイト]

- **GSC案34 / P2（次に着手）**: CrUX・GSC CWV・既存PSIの取得状況を確認し、実ユーザー計測とラボ計測、URL単位とorigin単位を区別する。
- **GSC案31 / P3（条件確認後）**: モバイルで結論・表に到達しにくいことを実測した場合、検索意図に沿って配置変更を採用する。
- **GSC案35 / P3（条件確認後）**: 重い地図・チャート・画像、表示ずれの原因を特定できた場合、本文の早期表示・画面外の遅延読み込み・寸法確保から必要な対策を選ぶ。
- **owner / 順序**: performance-auditor・site-ux-manager。GSC優先ページの端末別流入と性能を確認→同テンプレ代表をモバイルで実測→原因と影響範囲を特定→既存実装カードへ統合する。GeoはGEO-UIUX-SPEED-01、県目次はAREA-TOC-MOBILE-01、既存品質errorはPAGE-QUALITY-ERROR-BACKLOG-01が実装を所有する。
- **停止条件**: CrUX欠測を良好/不良と扱わない。スコア満点だけを目指さない。主要本文を遅延させない。標本や権限不足は未確認とし、取得可能な代替と限界を記録する。
- **完了条件**: 計測範囲・対象端末・問題の有無・3案の採否が決まり、採る場合は根拠・対象・検証指標を既存カードへ引き渡す。判断だけで改善効果ありとしない。
- **期日の引き直し (2026-11-24)**: 判断のカードで 11 月の重点外。12 月の月次計画で採否を決める

### [GSC-PRODUCT-SCHEMA-POLICY-01] 外部販売先へ案内する商品ページの構造化データ目標を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-12-01] [領域:サイト]

- **GSC案40 / P2（次に着手）**: 有効な商品スニペットを維持する目標を確認し、画像など事実に基づく追加の採否を決める。
- **owner / 入力**: site-ux-manager・gsc-analyst。10-16監査は商品スニペット有効24/無効0、販売者リスティング無効24。確認した商品は外部Amazon/Coconalaへ案内する。公式適用条件は監査JSONのofficialSourcesを参照する。
- **次 / 順序**: ①各テンプレの購入場所と表示内容を照合 ②商品スニペットの必須条件と画像等の追加余地を確認 ③「維持/追加/対象外」を決め、必要な実装はPRODUCTS-PAGE-CONTENT-01等へ統合する。
- **停止条件**: 販売者リスティングの警告ゼロを目的にしない。画像・レビュー・返品/送料・在庫を捏造しない。本文にない商品情報を構造化データだけへ追加しない。
- **完了条件**: 適用する検索機能と通知の扱いが明確で、追加する項目には実在する根拠・実装先・検証方法がある。不要な追加は理由付きで見送る。
- **期日の引き直し (2026-11-24)**: 判断のカードで 11 月の重点外。12 月の月次計画で採否を決める

### [GSC-PARAM-URL-POLICY-01] パラメーター別の検索対象と同一状態URLの整理方針を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-12-01] [領域:サイト]

- **GSC案22 / P3（条件確認後）**: UTM・並び替え・県選択・年度選択の内容差を確認し、独立して検索対象にするか、正規URLへまとめるかを決める。
- **GSC案23 / P3（条件確認後）**: 同じ表示状態のパラメーター順序違い・不要な既定値等が増殖している場合、リンク生成側で正規化する案を採用する。
- **owner / 入力**: site-ux-manager・ranking-ui-manager。10-16監査の代替canonical833例、現行UrlPolicy、実HTMLとリンク生成元。現状が適切なcanonicalである例を欠陥扱いしない。
- **次 / 順序**: パラメーターごとに内容差・読者用途・検索需要・canonical・内部リンクを表にする→同じ状態を表す組だけ特定→最小の正規化案を選ぶ。信号整合の実装はGSC-CANONICAL-REDIRECT-01へ接続する。
- **停止条件**: 年度/地域の違いを一律に消さない。共有URLや絞り込み操作を壊さない。問題が見つからなければ変更しない。
- **完了条件**: 対象パラメーターの維持/統合と根拠が決まり、採用案には対象生成元・保持する機能・回帰条件がある。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 未送信で登録済みの 764 件 (先頭 500 件) に `/municipalities/ranking/<key>?page=`・`?pref=` 137 件、`/ranking/<key>?s47_ogp=<hash>` 23 件、`/blog?page=` 17 件、`/themes/<slug>?pref=` 3 件 (こちらは 301)。`?page=`・`?pref=`・`?s47_ogp=` の 3 例は 200 で canonical が本体を指す。`?s47_ogp=` 付きのページ URL がどこから張られているかは未確認。**次**: `s47_ogp` をページ URL に付けている生成元を探し、付けない形にできるかを決める。
- **期日の引き直し (2026-11-24)**: 判断のカードで 11 月の重点外。12 月の月次計画で採否を決める

### [KDP-EXPANSION-01] KDP を型ごとに作り直して出し、8 週の実売で需要を確かめる

タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-09-19] [領域:商品]

- **owner**: kindle-publisher (設計・生成) / article-writer + blog-critic (書き下ろし・意味レビュー) / kdp-operator (出品) / オーナー (Previewer の目視・1 冊ずつの公開承認)
- **方針 (2026-11-14 オーナー決定)**: 需要は出して確かめる。既刊の売上を待つ・10 冊以上を同時に出さない、という旧条件はやめた。正典は収益化戦略 §3.4「需要の確かめ方」。品質の決まり (編集設計・書き下ろし 30%・意味レビュー・Previewer・1 冊ずつの公開承認) は `kindle-publishing-standards.md` のまま。
- **前提**: 参考文献 vault の Kindle 競合 5 冊は 4 型に分かれる。①単一論点の読み物 (S1 と同じ) ②1 県 1 章のガイド ③見出し駆動の県民性ストーリー (1 テーマ 1 見開き) ④単一表の超薄型。販売実績は S1 の K-S1-02 (2026-08) と、出版停止前の K-S2-03 観光・宿泊 (2026-09) の各 1 冊 (`data/products/sales-ledger.json`)。
- **次 (実行順)**:
  ① 型②「1 県 1 章のガイド」で地域データブックを設計し直す (旧 S3 の 8 冊。編集設計 `KindleBook.design` を先に書く)。 **1 冊目 K-S3-08 (九州・沖縄、移住・転勤で県を比べる人向け) は 2026-11-14 に設計済み** (`data/products/kindle/books.json`・指標 14 個は `book-ranking-keys.json`、status `planned`)。**同日、書き下ろし 12 本 (約 31,000 字) を書き、blog-critic の再レビューで PASS (must 0)、`verify-fresh` error 0、生成 (`.local/kindle-books/K-S3-08/v4-20261114-guide/`。32 章・図 14・書き下ろし比率 63.5%・本文 49,965 字)、`verify-epub` error 0 まで済み。status は `manuscript`。** 同日、表紙 (実際の県境データで九州・沖縄を強調した地図。オーナー承認・縮小確認 readable を記録) と紹介文・キーワード (照合 PASS・オーナー承認・出品台帳へ apply 済み) も済み。出品台帳の行は `promote --mode first` で作成 (EPUB は `v7-20261114-first`、AI 使用の申告は画像なし)。残りの Mac での作業 (R2 反映・暗号化保全・epubcheck・Previewer・公開承認) は `KDP-REGION-BOOKS-MAC-01`。ブリーフと原稿検査は 1県1章の型に対応済み (`prefecture-guide.ts`)。
  ①b **地域の残り 6 冊 (K-S3-02 東北・03 関東・04 中部・05 近畿・06 中国・07 四国) も 2026-11-14 に同じ型で作成済み** (オーナー指示「表紙以外」)。設計 → 実データのブリーフ → 執筆 → 本どうしの同じ文 0 件 → 意味レビュー PASS → 生成 (`v1-20261114-guide`) → `verify-epub` error 0 → 出品台帳の行 (`promote --mode first`) → 紹介文の照合 PASS まで。紹介文は同日オーナー承認・出品台帳へ apply 済み。残り (表紙・R2 保全・epubcheck・Previewer・公開承認) は `KDP-REGION-BOOKS-MAC-01`。北海道 (K-S3-01) は 1 道で型に合わないため作っていない。
  ② 型③「意外な 1 位の県民性ストーリー」でランキング大全を設計し直す (旧 S4)。
  ③ 分野別の読み物 (旧 S2 の 11 冊。売れた K-S2-03 観光・宿泊の分野を先に) の型を決める。
  ④ 型ごとに数冊ずつ生成・レビュー・Previewer・保全を通し、1 冊ずつ公開承認を得て出す。
  ⑤ 各冊の公開日から 8 週の販売数と既読ページを台帳に記録し、型ごとに続ける・増やす・止めるを決める (`data/business/pilot-board.json` の `kdp`)。
- **記録**: 2026-11-14 に、出版停止・出品前停止の 19 冊の行を出品台帳 `data/products/kdp/listings.json` から消した (販売記録のある K-S2-03 は残す)。
- **K-S1-14 (2026-11-14 に出版済み・develop 側の記録)**: ① 審査後に本棚の「販売中」と ASIN を確かめる (`node .claude/scripts/kdp/kdp-batch.mjs --phase status`) ② セレクト登録の 3 冊 (K-S1-13・K-S1-05・K-S1-14) の既読ページと販売を 2026-12 の土曜の記録で読む (実験 EXP-011)。8 週の計測窓は上の ⑤ に従う。
- **既知の欠け (2026-11-14)**: 紹介文の監査 (`kdp-listing-copy.mjs check`) は、キーワードが本文で答えのある語か、注記にしか出ない語かを見分けない。地域の 3 冊で「家賃」(本文は帰属家賃の注記だけ) が通り、照合の担当が見つけて「地価」に替えた。
- **停止条件・禁止**: 型④ (単一表の薄冊) は作らない (自社サイトの無料ページと同じ内容になる)。競合本の本文・図案・章立てを複製しない (論点と型のみ)。公開承認をまとめて取らない。未計測のものを「需要あり」と書かない。
- **完了条件**: 型②・型③・分野別の読み物の各型で 1 冊以上が公開され、各冊の 8 週の販売数と既読ページが台帳にあり、型ごとの判定が収益化戦略 §3.4 に従って記録されている。

### [TAG-FEATURE-NEED-01] タグ機能は本当に必要か決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-27] [領域:サイト]

利用実績と保守コストを見て、残すか畳むかを決める。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）
