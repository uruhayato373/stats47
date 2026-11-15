# note-improvement 詳細ログ (agent 用・append-only)

agent 用詳細ログ。施策一覧 (簡易表) は `.claude/todo/improvements.md`。
記入は `.claude/rules/evidence-based-judgment.md` のテンプレに従う。

---

## NOTE-FISCAL-PEER-SALES-01 財政指標の同規模比較 note 2 本の売上比較

- **デプロイ日**: 2026-10-12 (#12 `12-fiscal-peer-comparison` n527e817995e9・#13 `13-fiscal-peer-no-code` n20299fc77b17、各 ¥300 の有料)
- **想定効果**: なし (`[target:]` を置く根拠が無い。売れた note 3 本は AI × e-Stat の技術記事という前例だけで、2 本の差を予測できない)。閾値エンジンの対象外で手動判定
- **検証コマンド**: `python3 -c "import json;d=json.load(open('data/note/dashboard/latest.json'));print(d['fetchedAt'],d['period']['display']);[print(a['catalogKey'],a['impressions'],a['pageViews'],a['salesJpy'],a['rawCells']['売上']) for a in d['articles'] if 'fiscal-peer' in a['catalogKey']]"`
- **実測 (取得 2026-11-14T03:32:30Z・`data/note/dashboard/latest.json`・集計期間 2026-10-17〜2026-11-13)**:

| 記事 | インプレッション | 閲覧 | salesJpy | 売上セルの生値 |
|---|---|---|---|---|
| #13 no-code | 111 | 11 | 0 | `-` |
| #12 コードあり | 45 | 1 | 0 | `-` |

- **売上の読み方**: `.claude/scripts/note/lib/dashboard-metrics.mjs` の parseCount は、現行ダッシュボードで 0 がハイフン表示のため `-` を 0 と読む (仕様)。売上列が機能することは全期間の記録 `2021-05-01_2026-09-11_*` (totals.salesJpy 900。`11-mcp-sqlite-search`・`01-estat-api-key-setup`・`13-ollama-offline-local-llm` が各 300) で確認した。28 日窓の記録 `2026-10-11_2026-11-07_*` と `2026-10-17_2026-11-13_*` はどちらも totals.salesJpy 0 で、2 本とも 0 であり、2 つで公開日 10-12 から 11-13 までを覆う。認証付き計測の売上 API が 10-22 から止まっている件は別経路の話で、この判定には使わない。
- **判定**: 判定不能 (effect/* は付けない)。購入 0 件は観測したが、閲覧 11 と 1 では 2 本の差を偶然と区別できる標本が無い。経過 28 日
- **[仮説]** 閲覧が少ないのは (a) 導線: 2 本とも `series: null` で、シリーズ内リンクや他記事からの送客が無い。確かめ方 = note の記事別流入元の画面か、本サイト → note のクリックを GA4 `ga4-query.mjs` で測る。(b) 題名: #12 のインプレッション 45 に対し #13 は 111 で、題名・サムネイルの差かもしれない。確かめ方 = インプレッションあたり閲覧 (#13 は 9.9%、#12 は 2.2%) を 12-07 の記録で再計算する。(c) 需要が無い: 確かめ方 = 公務員 × e-Stat の同系統記事の購入有無と、検索側の需要 (GSC の関連クエリ)。いずれも未検証。
- **次の観測期日**: 2026-12-07 (公開 + 56 日)
- **12-07 に動いていなければ**: 上の (a)(b)(c) の順に確かめ、タイトル・無料部分・シリーズ内リンクの見直しを backlog に起票する。価格は引き続き変えない (比較を壊すため)。
