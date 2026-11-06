---
name: manage-issue-ledger
domain: content
description: 問いの台帳 (data/content/issues.json・issue-links.json) を回す。検査と棚卸しで状況を見て、検索語と白書から問いを足し、ページへ配線し、答えの無い問いを既存の生産スキルへ渡し、不要な問いを見送る。Use when user says "問いの台帳", "問いを足す", "問いを見送る", "答えの無い問い", "issues:coverage".
primary_agent: blog-seo-strategist
---

**4 型の宣言 (必須)**: 作る前に参照型・教科書型・論文型・ノウハウ型のどれか 1 つを決める。型は `data/content/content-types.json` で決まり、`npm run content-types:check` が通らなければ `assignments` に理由つきで足す。正典 `.claude/rules/content-type-standards.md`。

# manage-issue-ledger

問いの台帳を読み書きするスキル。記事は書かない。記事の生産は既存のスキルへ渡し、ここは問いの追加・配線・見送りと、渡す相手の判断だけを持つ。

正典は `docs/01_技術設計/03_情報設計.md`「問いの台帳」、機械の規則は `.claude/scripts/issues/issue-graph-core.mjs`。ここに規則を写さない。

**禁止**: 問いを分類軸にしない (URL・ナビ・タグを作らない)。台帳の写しを別ファイルに作らない。

## 1. 状況を見る

```bash
npm run issues:check        # 意味の検査 (親子・役割と種別・写し・状態)
npm run issues:coverage     # 公開ページの棚卸し (GSC の直近 4 週)
npm run issues:candidates   # 問いの候補の検索語 (--limit N / --weeks N / --json)
npm run issues:view         # 人が読む一覧の HTML (既定 /tmp/stats47-issue-view.html。Artifact に載せる)
```

問いの一覧は管理画面の論文型 (`/content/types?type=paper`) で見る。問いを押すと分析・記事・図・投稿・商品の配線が見える。事業イシューマップ (`/strategy/issue-map`) とは別物で、片方の台帳をもう片方の画面へ持ち込まない。

形と外部キーは `node .claude/scripts/lib/check-datasets.mjs` が見る。GSC は土曜の週次記録 (`data/gsc/snapshots/`) を読むので、最新週が古ければ棚卸しの結果にそう書く。

## 2. 下から足す (検索語から)

読まれているページと実際の検索語を起点にする。

1. `issues:candidates` の語を、同じことを聞いている語のまとまりに分ける。候補は機械の抽出なので、記事やツールの使い方を聞く語 (例: e-Stat の操作) は問いにしない
2. 既存の小さな問いが受けられるなら、その問いの `queries` に語を足して終わる
3. 受ける問いが無ければ、`issues:coverage` の「紐づかないが読まれている」ページと照らし、大きな問いの下に小さな問いを足す。語は `queries` に検索語の表記のまま残す
4. 親になる大きな問いが無ければ、「問いの書き方」に沿って大きな問いから足す

## 3. 上から足す (白書・論点から)

検索語がまだ無い論点を拾う。

- テーマの `evidenceTopics` (`data/themes/catalogs/<key>.json`) の `question` を読み、台帳に無い問いを大きな問いにする
- 白書を読み直すときは `/research-theme-catalog` (担当 `theme-researcher`) に頼む。NotebookLM はクラウドの環境では呼べない。ローカルで行い、Windows は証明書ストアを使う起動が要る（`.claude/rules/local-environment.md`「Windows の NotebookLM 連携」）。返ってきた統計名は指標の `source` と照合してから `dataNote` に書く
- 記事の着想の一覧は `/plan-article-queue` が持つ。台帳はそこへ渡す問いの出どころで、ネタの採点は写さない

## 問いの書き方

**ID** は不変。見送った問いの番号も使い回さない。

- 大きな問い: `issue:<分野の頭文字><2 桁の番号>` (`issue:K04`)。分野の次の空き番号を使う
- 小さな問い: `issue:<親>-<番号>` (`issue:K01-1`)。親の下の次の空き番号を使う。親は ID から導出するので `parent` 項目は無い
- 新しい分野の頭文字を使うときは `.claude/scripts/issues/render-issue-view.mjs` の `DOMAINS` にも足す

**項目** は `data/content/schema/issues.schema.json` に従う。迷いやすいものだけ書く。

| 項目 | 書き方 |
|---|---|
| `unit` | 答えが出る粒度。`prefecture` か `municipality` (市区町村まで降りて答えが出る) |
| `answerability` | `relation` = 関係を示せる / `caveat` = 言える範囲と言えない範囲を並べる / `myth` = 集計では因果を言えないので誤解を解く型で書く |
| `primaryTheme` | 大きな問いだけが持つ。小さな問いは親から引き継ぐ |
| `dataNote` / `pitfall` | 使う統計と、読み違えやすい点。生産スキルへの入力になるので分かっている範囲で書く |
| `revenue` | 答えがつながる収益。`広告` / `データ` / `ノウハウ` / `実務` (行政や業務で使う人) を 1〜3 個。仮置きなので売上の根拠にしない |
| `products` | 問いから企画した商品の ID (`note:<key>`)。同じ指標を使うだけの商品は書かない。実在は `check-datasets` が見る |
| `sensitive` | 犯罪・自殺・虐待・生活保護など、地域や属性への偏見を招きやすい重い問いを `true` にする |

## 4. 配線する

`data/content/issue-links.json` に 1 組 1 役割で書く。

- `answers` = 問いに本文で答える読み物 (blog / geo / japan-theme)
- `evidence` = 根拠のデータ (ranking / theme / survey など)

**導出できる関係は書かない**。問いの `primaryTheme`、小さな問いが親から継ぐテーマ、答えの記事が使う指標のランキングは台帳から毎回求める。書くと `issues:check` が止める。非公開のページも指せない。

## 5. 記事に展開する

答えの無い問い (`answers` の関係が無い問い) を生産スキルへ渡す。ここでは書かない。

| 答えの形 | 渡す先 |
|---|---|
| 指標の比較・相関で答える記事 | `/draft-from-trend` に問いの文を自然文テーマとして渡す (担当 `article-writer`) |
| 空間演算で答える分析 | `/build-geo-analysis` |

渡すものは `question`・`queries`・`dataNote`・`pitfall`・`answerability`・`sensitive`。`myth` と `sensitive` の問いは誤解を解く型で書き、関係を断定する見出しを付けないことも伝える。指標の実在は渡す先が確かめる。

公開のあとで `answers` を足す。順序を逆にすると、ページがまだ索引に無いので `check-datasets` の外部キー検査か `issues:check` の非公開検査で止まる。

```bash
npm run content:sync -- --from-r2   # R2 の記事一覧からページ索引を作り直す。引数なしだと新しい記事が載らない
npm run issues:check
```

市区町村のデータで問いを確かめるときは、計算の前に表を組み立てて検査を通す。指標と年を書いた spec を渡す（例: `.claude/scripts/analysis/examples/`）。

```bash
npm run analysis:frame -- --spec .claude/scripts/analysis/examples/h01-vacancy.json --out /tmp/frame.json
```

公開の自治体だけの表を作り、県の合計との検算・指標の年・抜けた町の偏り・変化の信頼性を報告する。合計が合わなければ止まる。問いの選択と、定義が循環していないかの判断は人が行う。市ごとの変化の信頼性が低いと出たら順位にしない。素の `fetch` が通らない環境では `--data-dir` に `<key>.cities.json` を置く。

分析の結論は `data/content/analyses.json`、図は `data/content/figures.json` に残す。図は `data/content-operations/image-templates.json` の型を指し、配信先はページの ID か `data/sns/posts.json` の投稿 ID で指す。公開の状態の正本は配信先の台帳にある。実例は `.claude/scripts/analysis/m01-factory-size.ts`（型は `scatter`、県へ足し上げ）と `h01-vacancy-population.ts`（型は `grouped-bar`、市区町村のまま区分）。散布図を市区町村の点で描くときは `renderRelationshipScatterChart` に `level: "municipality"` を渡す。端の町の名前は揺れが大きいので自動では出ず、`labelNames` で指定した町だけが出る。

ページへの掲載は人が行い、自動では公開しない。残りは次の一覧で見る。配信先の台帳と食い違うと `!` が付き、exit 1 になる。

```bash
npm run issues:figures
```

分析の結論から記事の下書きを作るときは、次の 1 コマンドで図・データ・出典・指示文を作り、headless の書き手・品質ゲート・審査まで通す。`analyses.json` の `article` と `figures.json` の `chart` が入力で、値は分析の結果の JSON からだけ読む。今の対応は `grouped-bar` の型だけで、未対応の型は止まる。

```bash
npm run analysis:draft -- --analysis analysis:H01-vacancy-population --result .local/analysis/h01/result.json
npm run blog:preview -- --slug vacant-houses-population-decline
```

`blog:preview` は開発サーバーの R2 の手前に下書きを重ね、本番と同じ記事ページで見せる。worktree では Turbopack が `next` を見つけられないので `WEB_DEV_BUNDLER=webpack` を付ける。

下書きは `published: false` で止まり、自動公開も掃除もされない。背景画像は別の工程で、`issues:figures` の「背景待ち」で分かる。公開は人が `published: true` にして develop へ push する。公開したら `figures.json` の `slug` を `page` に置き換える。

審査の PASS は機械の床で、分析の記事は別の審査で読み直してから公開する。H01 では headless が PASS を出した版にも因果に寄った語が残り、agent の審査は自己矛盾を見つけた。

## 6. 見送る

問いを消さず、`status: "dropped"` と `dropReason` を書く。見送った問いの `queries` は `issues:candidates` に再び出なくなる。

- 大きな問いを見送るときは、下の小さな問いも見送る
- 見送る問いへの `issue-links.json` の関係は外す

読まれていないページの統合・転送・検索除外はこのスキルでは決めない。オーナーの判断で、自動では消さない。

## 終わるとき

```bash
npm run issues:check
node .claude/scripts/lib/check-datasets.mjs
npm run test:issue-graph
```

台帳を変えたら `npm run issues:view` で一覧を作り直す。
