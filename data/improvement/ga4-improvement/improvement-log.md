# GA4 改善ログ (agent 用詳細)

一覧・status の真実源は `.claude/todo/improvements.md`。ここは検証コマンド・仮説・期日の詳細ログ。
記入テンプレ: `.claude/rules/evidence-based-judgment.md` §改善ログ記入テンプレ。

`### 判定` セクションは `.claude/scripts/lib/effect-verdict/` の閾値エンジンが upsert する。
判定・根拠データ・閾値 SSOT・ガード・再現コマンドの 5 項目が必ず出る。ガードが 1 つでも
hit していれば `effect/pending` に留まり、確定ラベルは付かない。

2026-04-21 以前の記録は `archive/improvement-log-until-2026-04-21.md` にある
(推測ベース判定が混在しているため統合しない。参照のみ)。

---

## THEME-LOCALFINANCE-01 local-finance 流入増と engagement 低下の切り分け (improvement-triage)

- **確認日**: 2026-09-24
- **検証コマンド**: GA4 Data API v1beta (property 463218070)。`/themes/local-finance` の週次
  (Japan) PV / sessions / engagementRate、および該当週の流入元 source/medium crosstab。
- **実測**:
  - 週次 (PV / sessions / engagementRate): W33 24/7/0.857、W34 204/28/0.750、W35 31/12/0.750、
    W36 20/4/1.000、W37 5/2/1.000、W38 15/5/0.800。
  - W34 の急増: Japan PV 204 のうち **189 が bing / organic**（Japan 外の bing / organic も 13 含めると
    202）。GSC (Google Search Console) に表れないのは Google 以外の検索エンジン (Bing) 経由の
    organic 流入だったため。
- **判定**: 対応不要。**この行を削除する**。
- **訂正 (`.claude/rules/evidence-based-judgment.md` 状況 3-b に該当)**: 旧行の記述
  「GSC 56日 clicks0/imp32 で organic起因ではない」は誤りだった。実際は Google 検索 (GSC の計測対象)
  ではなく Bing 検索エンジン経由の organic 流入であり、正しくは「Google 検索起因ではないが、
  Bing 経由の organic 流入」である。GSC の imp/clicks が 0 に近いことは Google 検索での不在を示すに
  過ぎず、他の検索エンジンからの流入の有無を判定する根拠にはならない (検索 0 件を「存在しない」の
  根拠にしない、状況 3-b)。
- **engagement 低下について**: 旧行が記録した「engagementRate 0.615→0.165」という値は、
  session 単位の `engagementRate` では再現しない (全週 0.750〜1.000 の範囲)。W34 の急増は一時的で、
  W35 に元の水準へ戻っている。追加の切り分けが必要な所見はない。

---

## THEME-INTERNALNAV-01 theme→ranking/blog 遷移の計測可否確認 (improvement-triage)

- **確認日**: 2026-09-24
- **想定効果**: なし (計測を可能にすることが目的で、遷移量の目標値は設定していない)
- **検証コマンド**:
  - コード確認: `nav_surface` の値 `theme_ranking` / `theme_blog` の実装箇所。
  - GA4 Data API v1beta、`nav_click` を `nav_surface` 別に集計 (2026-08-27〜09-23、Japan)。
  - 週次 snapshot `internal-transitions.csv` (コミット `3ea0fece3`) の referrer ベース集計。
- **実測**:
  - `nav_surface` は `theme_ranking` / `theme_blog` を含め登録済み (既存 custom dimension の値追加で、
    新規 dimension 登録は不要)。
  - `nav_click` 実測 (28日): theme_region 82、theme_kpi_switcher 25、desktop-header 22、
    theme_switcher 6、theme_ranking 3、theme_section 2、theme_evidence 1、mobile-drawer 1、
    **theme_blog 0**。
  - referrer ベースの page_view (同期間): referrer が `/themes/` のもののうち ranking 遷移 44、
    blog 遷移 1 (テーマ PV 702)。`nav_click` の `theme_ranking` (3件) は実際の遷移 44件のうち
    3件しか捕捉していない。
  - 週次 `internal-transitions.csv` (W38、2026-08-23〜09-19) は themes→ranking 66、
    themes→blog 1 を記録しており、referrer ベースで継続計測できる状態にある。
- **判定**: 行の目的「theme→ranking/blog 遷移を既存 GA4 契約で計測できるようにする」は、
  `nav_surface` の値登録 + 週次 `internal-transitions.csv` の referrer ベース計測の 2 経路で
  満たされた。**完了**。
- **留保 (本行の完了条件の範囲外・次の検討材料)**: `nav_click` の `theme_ranking` / `theme_blog` は
  実遷移に対する捕捉率が低い (theme_blog は 0 件、theme_ranking も 44 件中 3 件)。回遊の実測は
  `internal-transitions.csv` の referrer ベース集計を正とし、`nav_click` の捕捉率改善自体は
  別途の計装課題として扱う (本行の完了条件には含めない)。
