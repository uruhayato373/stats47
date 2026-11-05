---
name: manage-issue-ledger
domain: site
description: 問いの台帳 (data/content/issues.json・issue-links.json) を回す。検査と棚卸しで状況を見て、検索語と白書から問いを足し、ページへ配線し、答えの無い問いを既存の生産スキルへ渡し、不要な問いを見送る。Use when user says "問いの台帳", "問いを足す", "問いを見送る", "答えの無い問い", "issues:coverage".
primary_agent: blog-seo-strategist
---

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
