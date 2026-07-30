---
name: project_blog_brushup_dbless_scaffold
description: 公開済み記事の品質是正(brushup)を DBレス cloud-first で回すときの非自明な落とし穴。fetch-article-data.mjs は陳腐化、R2 rank=0 で再計算必須、NG_PATTERN が旧 title を遡及 blocker、publish-blog は直列 dispatch。
metadata: 
  node_type: memory
  type: project
  originSessionId: 1925cdc8-e1bf-4c9d-9408-f6daa22de2da
---

公開済みブログ記事を `/brushup-blog --target queue` で是正したとき (2026-06-07 wave、consumer-price/curry/doctor 3記事) に判明した、DBレス cloud-first 環境固有の落とし穴。次回 brushup で同じところで躓くため記録。

## 0. ★公開後の docs/21 削除は「自分の記事を slug 指定」で消す (`git rm -r docs/21/` は禁止)
2026-06-07 事故: 公開済み 3 記事の docs/21 を消すつもりで `git rm -rq docs/21_ブログ記事原稿/` を実行し、
直前の `git pull --rebase` で取り込んだ **週次cron `feat(blog): 週次自動生成 N本` の未公開ドラフト10本を
巻き込み削除 → push** してしまった (commit ae34ca4b)。全10本が R2 404(未公開)を確認し 7734164e から
`git checkout <commit> -- docs/21_…/<slug>` で復元 (commit 67395d42)。教訓:
- **docs/21 には週次cronが未公開ドラフトを継続追加する**。`rebase`/`pull` で他者の未公開ドラフトが working tree に入る。
- 公開後の掃除は **自分が公開した slug を名指しで `git rm -r docs/21_…/<slug>`** する。ディレクトリ丸ごと消さない。
- 削除前に必ず **`find docs/21 -maxdepth 1 -type d` で中身を確認**し、自分が作っていない dir があれば触らない
  (CLAUDE.md「削除/上書き前に対象を見る・自分が作っていないものは surface する」)。各 slug の R2 公開状況
  (`curl storage.stats47.jp/app/blog/<slug>/article.md` が 200 か 404 か) で公開済み(消してよい)/未公開(残す)を判定。

## 0b. ★週次cron自動生成ドラフト (`feat(blog): 週次自動生成 N本`) は順位・数値を捏造する
2026-06-08 に未公開ドラフト10本を公開した際、**10本すべてが順位・数値を hallucination** していた
(green-tea「奈良2位」/paved-road「東京46位の逆説」/sushi「北陸3県独占」等が全て虚偽)。チャート svg も未生成。
→ 公開前に必ず **R2 `app/ranking/<key>/values.json` を ground truth に全数値・rank を突合し、食い違いは
data を正として全面修正**する (article-writer に「data json と突合、捏造があれば書き直し」を指示)。
charts も R2 データから再生成が要る。cron ドラフトを**無検証で公開しない**。`quality-gate.mjs` の
RANK_MISMATCH と factual-check がこれを捕捉する。

## 0c. ★文体は ですます調 に統一 (2026-06-08 gate+ルール化)
本文の地の文は ですます調。である調 copula 文末 (である。/だ。/だった。/ではない。/だろう。/のだ。) は
`quality-gate.mjs` が **blocker** で検出 (callout/引用/見出し/表は除外)。動詞終止形の常体は gate では
捕まえず blog-critic が審査。正典は `blog-quality-standards.md`「文体」、article-writer.md Phase 3 にも明記。
brushup での変換は article-writer に「文体だけ変える」と指示すれば確実。

## 0d. frontmatter 一括編集で `perl -i -pe 's/...$/.../'` は改行を巻き込む
`s/^published:\s*false\s*$/published: true/` の `\s*$` が行末の改行を消し `published: trueogImage:` に
連結破損した (2026-06-08、10本)。frontmatter の値だけ変えるなら **`\s*$` を使わず** `s/^published: false$/published: true/`
(アンカーは `$` のみ) か、次行を保持する置換にする。一括編集後は必ず frontmatter 末尾を目視確認。

## 1. docs/21 は毎回 R2 から復元する (削除済みが正常)
公開済み記事の docs/21 ドラフトは公開後に削除される lifecycle (`check-published-drafts.cjs` が exit 1 でブロック)。是正対象は **公開 R2 `storage.stats47.jp/app/blog/<slug>/article.md` から docs/21 に復元 → 編集 → publish-blog.yml で再公開 → docs/21 を再削除**。これが正規フロー。[[project_blog_publish_cloud_first]]

## 2. fetch-article-data.mjs は使えない (ローカル D1 + docs/20 backlog 依存で陳腐化)
チャート用 data/*.json を作る公式スクリプト `fetch-article-data.mjs` は `docs/20_ブログ記事企画/backlog/<slug>` の ranking_key 表 + ローカル D1 を読む前提で、DBレス cloud-first では機能しない。代替: **R2 `app/ranking/<key>/values.json` を直接 fetch** し `{title, unit, year, data:[{pref,value,rank}]}` 形式で書く (chart generator が読む形式)。汎用 scaffold は `/tmp/scaffold-brushup.mjs` に実装した (R2→docs/21 復元 + data 生成)。

## 3. R2 values.json の rank は 0 (未計算) → value 降順で再計算必須
`app/ranking/<key>/values.json` の各 item の `rank` フィールドは **0 のまま** (snapshot 時に未付与)。これをそのまま data/*.json に入れると `article-factual-check.mjs` が全件 RANK_MISMATCH (data=0位) で blocker。対策: data 生成時に **value 降順で 1-based rank を自前計算**して埋める (3記事とも記事の rank と完全一致した)。

## 4. quality-gate の chart 生成 (`generate-article-charts.mjs`)
- `data/<name>-prefecture-rankings.json` → `<name>-prefecture-rankings.svg` (上位5+下位5 bar)。
- 入力形式は `{title, unit, data:[{pref, value}]}` (pref/value。area_name は読まない)。
- `<chart-placeholder data="X">` は単一チャートなら fallback で自動置換。markdown表/インライン svg は手で `![](data/X.svg)` 参照に書き換える。
- 手書きインライン svg は `--extract-inline` で `data/inline-chart-1.svg` に切り出すと blocker 解消 + viz 保持 (dark mode は WARN 止まりで pass)。
- 食料/光熱など「チャートにしない費目」でも、本文が rank を語るなら **その費目の json は残す** (factual-check が rank を別費目の値と誤照合してしまうため)。未参照の svg だけ消す。

## 5. NG_PATTERN が旧 title を遡及 blocker (2026-06-06 追加)
quality-gate の NG_PATTERN は **title 内 `\d+位`** と **content 内 `\d{2,}倍差` 単独** を blocker 化。旧公開記事の「1位…」「N位…」title や「2.05倍差」seoTitle/description が**遡及的に弾かれる**。brushup 時に title/seoTitle/description を語句修正する (例: 「1位沖縄」→「沖縄」、「1.98倍差」→「1.98倍の差」「約2倍の開き」)。curiosity gap は「なぜ…?」等で担保。

## 6. publish-blog.yml は直列 dispatch (concurrency group が先行キューをキャンセル)
`gh workflow run publish-blog.yml --ref develop -f slug=<slug> -f dry_run=false`。concurrency group `publish-blog` (cancel-in-progress:false) でも、**複数を連続 dispatch すると先行 pending がキャンセルされる**。1件 dispatch → 完了待ち → 次、を厳守 (local は gh 可、cloud は actions:write 無しで dispatch 不可)。[[project_r2_writes_ci_only]]

## 関連
- 是正ループ正典: `.claude/rules/blog-remediation-loop.md` / [[project_blog_remediation_loop]]
- 品質基準: `.claude/rules/blog-quality-standards.md` (記事アーキタイプ A-E / 図あたり字数 / 表禁止)
- factual リスク: [[project_blog_brushup_risk_2026_05_25]]
