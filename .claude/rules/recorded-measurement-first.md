---
paths:
  - ".claude/skills/{ads,analytics,management,product,sns,note}/**"
  - ".claude/agents/{a8-report-collector,affiliate-manager,affiliate-operator,asp-scout,ga4-analyst,gsc-analyst,sns-metrics-sync,strategy-advisor,improvement-triage,note-manager,kdp-operator,coconala-operator,instagram-strategist,x-strategist}.md"
  - ".claude/scripts/measurement/**"
  - "data/{authenticated,affiliate,nsm,measurement-cycle,products}/**"
---
# 計測は週次で記録し、セッションでは記録から判断する

ログインが要る取得元 (A8・楽天・note・KDP・GSC の画面) は、週 1 回の定期実行だけが取得して記録する。
セッション中のエージェントは記録済みのデータから判断し、ブラウザで管理画面を開いて数字を取りに行かない。

## なぜ (2026-10-20 オーナー判断)

- 毎日の取得はログインの維持と入り直しが要り、2 段階認証・セッション切れのたびにオーナーの手が止まっていた
  (KDP は CI でほぼ毎回 `auth_required`、Google は 2 段階認証で自動ログインしない)。
- セッション中のエージェントが、判断のたびにブラウザ (Playwright / browser-use / Claude in Chrome) で
  管理画面を取りに行こうとしていた。記録があるのに取り直すと、ログインの手間とトークンが増え、
  記録と違う時点の数字が混ざる。

## 取得の周期

| 取得 | 周期 | 入口 |
|---|---|---|
| 認証付き計測 (A8・note・GSC 画面の除外理由・KDP・楽天) | 毎週木曜 JST 18:20 | `authenticated-measurement.yml` (Mac の `measurement-session-refresh.sh` が木曜 17:30 にログインを保って起動) |
| 週次の計測→記録→改善サイクル | 毎週金曜 JST 05:00 | `fetch-metrics-weekly.yml` (GSC・GA4 は API。ログイン不要) |

認証付き計測は木曜に取り、金曜朝の週次サイクルがそれを読む。セッションが切れて取得に失敗した週は、
次の木曜までその取得元が「判定不能」になる。それを毎日の取得で埋めない。

## 判断に使う記録

| 知りたいこと | 記録 |
|---|---|
| 認証付き計測の成否・観測日 | `data/authenticated/latest.json` |
| note・KDP の売上 | `data/authenticated/revenue-history.json`・`data/products/sales-ledger.json` |
| A8 の成果 / 楽天の成果 | `data/affiliate/a8-results.json` / `data/affiliate/rakuten-results.json` |
| 提携の状態 (A8 / ASP 横断) | `data/affiliate/a8-catalog.json` / `data/affiliate/affiliate-catalog.json` |
| アフィリエイトの表示・クリック (GA4) | `data/affiliate/ga4-affiliate-history.csv` |
| 週次収益 (NSM)・計測の鮮度 | `data/nsm/weekly-snapshots/`・`data/measurement-cycle/latest.json` |
| 検索の実績 (GSC) / 除外理由 | `data/gsc/snapshots/<週>/`・`data/gsc/LATEST.md` / `data/gsc/coverage-drilldown/` |
| 閲覧 (GA4) | `data/ga4/snapshots/<週>/`・`data/ga4/LATEST.md` |
| SNS の指標 | `data/sns/metric-snapshots/` |
| AdSense | `data/adsense/LATEST.md` |

記録に無い粒度 (ページ × 検索語など) が判断に要るときは、ログインの要らない API の read-only 照会
(`node .claude/scripts/metrics/gsc-query.mjs` / `ga4-query.mjs`) を使ってよい。

## 守ること

1. **ブラウザで取りに行かない。** 管理画面の数字・提携の状態・売上は上の記録から読む。
2. **記録が古い・欠けているときは「判定不能」と書いて進める。** 最終観測日と失敗した取得元
   (`latest.json` の `status`・`code`) を添える。ブラウザで取り直す提案はしない。0 円や成功として扱わない。
3. **例外** (この場合だけブラウザを使ってよい):
   - オーナーが会話で、その取得・確認を明示的に頼んだ
   - 外部への変更そのもの (投稿・提携申請・出品・公開) と、その直後の反映確認
   - 定期実行で失敗した取得元の復旧 (ログインの入り直し) をオーナーが頼んだ
4. 定期実行の失敗に気づいたら、復旧が必要なことを 1 行でオーナーに伝える。自分で入り直さない。

## 既知の制約

- KDP の書籍別の注文は画面の「昨日」タブを読むので、週次では週のうち 1 日分しか残らない。売上
  (週次収益の商品実売) は月次ロイヤリティの月初からの累計で取るので欠けない。「過去 7 日間」への切り替えは
  ログインした画面での確認が要るので別作業 (`MEASUREMENT-MAC-DIRECT-01`)。
- GSC の除外理由の内訳はその時点の書き出しなので、取得に失敗した週の分は後から取り直せない。
