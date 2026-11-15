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

- **売上の信頼性 (判定不能の理由)**:
  - 取得は `.claude/scripts/note/lib/dashboard-metrics.mjs:36` で、セルが `-` のときに 0 へ読み替える (`if (text === "-") return 0;`)。2 本の生セルは `-` で、「売上 0 円」の観測ではなく「表示が無い」の観測である。
  - 同ファイルの記事 438 本すべてで売上セルが `-` で、`dashboardTotals.salesJpy` も 0。売れた実績のある記事を含め、売上列が機能していない疑いがある (台帳の販売実績 2 件 ¥600 と矛盾する)。
  - 売上 API 経路は 2026-10-22 のパスワード再確認の失敗から止まったまま。`data/authenticated/revenue-history.json` の note 行は 09-30 と 10-17 だけで、10-12 公開後の購入を含まない。
  - 集計期間が 10-17 開始で、公開日 10-12〜10-16 の 5 日が含まれない。
- **判定**: 判定不能 (effect/* は付けない)。[根拠: 売上が読めない。仮に 0 件でも閲覧 11 と 1 では購入率の差を偶然と区別できる標本が無い。経過 28 日]
- **[仮説]** 閲覧が少ないのは (a) 導線: 2 本とも `series: null` で、シリーズ内リンクや他記事からの送客が無い。確かめ方 = note の記事別流入元の画面か、本サイト → note のクリックを GA4 `ga4-query.mjs` で測る。(b) 題名: #12 のインプレッション 45 に対し #13 は 111 で、題名・サムネイルの差かもしれない。確かめ方 = インプレッションあたり閲覧 (#13 は 9.9%、#12 は 2.2%) を 12-07 の記録で再計算する。(c) 需要が無い: 確かめ方 = 公務員 × e-Stat の同系統記事の購入有無と、検索側の需要 (GSC の関連クエリ)。いずれも未検証。
- **次の観測期日**: 2026-12-07 (公開 + 56 日)
- **12-07 に動いていなければ**: オーナーが note の売上画面で 2 本の購入数を直接確認する (記録の経路は止まっているため)。購入が 0 件なら、上の (a)(b)(c) の順に確かめ、タイトル・無料部分・シリーズ内リンクの見直しを backlog に起票する。価格は引き続き変えない (比較を壊すため)。
- **売上取得の復旧**: オーナーが `note.autologin-failed` を消して `node .claude/scripts/measurement/refresh-session.mjs note --wait-human` を実行する手順は backlog の追補 (2026-11-14) にある。
