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

### [BLOG-SRCLINK-01] 是正前後の比較を取り下げ、新定義の baseline 記録へ切り替え (2026-10-11)

- **デプロイ日**: 2026-07-24 (source-link 配置是正、commit 690b6a08c)
- **想定効果**: 設定なし (guard: insufficient-target)。8.13% (W26–W29) → 7.43% (W31–W38) は上昇が観測されなかった記録として残す
- **検証コマンド**: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-28 --end 2026-10-04 --dims isoYearIsoWeek --metrics eventCount --filter 'eventName==page_view' --filter 'pagePath^=/ranking/' --japan` (分母)。同コマンドに `--filter 'pageReferrer*=stats47.jp/blog/'` を足したものが分子
- **実測 (2026-10-11 取得、Japan、ISO 週)**: W40 (09-28〜10-04) 238/4,519 = 5.27%、W41 (10-05〜10-10 の 6 日分) 202/4,934 = 4.09%。W39 は 09-26 をまたぐため除外
- **判定**: 判定しない。8.13% と 7.43% はどちらも 2026-09-26 の page_view 二重計測是正より前の定義で、`data/releases/2026-09-26-ga4-measurement-v2.json` の `doNotCompareAcross` に「pageReferrer 由来の回遊率」がある。是正前と同じ定義の baseline は取り直せない
- **次**: 2026-10-19 に W40〜W42 の 3 週を同コマンドで取って新 baseline とし、本行を削除する。以後の blog→ranking 導線の変更は `[target:]` 付きの別行で測る


### [RELATED-ARTICLES-EFFECT-01] 関連記事の並び替え後の ranking→blog 遷移を観測 (2026-10-20)

- **デプロイ日**: 2026-10-20 (PR #1162、2026-10-20T04:57Z = JST 13:57)。実装は commit 2fbe2b2f2 (`packages/data-configs/src/content/navigation.ts`)。同点を「一致数 ÷ 記事が使う指標数」で切り、それでも同じなら記事 ID 順にする。経緯と残件は backlog `RELATED-ARTICLES-TIEBREAK-01`。
- **変更の範囲**: 全公開ページ 26,172 件の上位 3 本が変更前後で変わるのは 1,416 件 (ranking→blog 284・blog→blog 294・area-theme→blog 752 ほか)。ランキングで効くのは、指標を共有する公開記事が 4 本以上ある 194 ページ (GSC 2026-W41 の表示 36,671)。
- **本番確認**: 2026-10-20 に `curl -s -A 'Mozilla/5.0 (compatible; Googlebot/2.1)' https://stats47.jp/ranking/total-fertility-rate | grep -oE 'href="/blog/[^"]+"' | sort -u` を実行し、`/blog/abortion-rate-prefecture-gap`・`/blog/cc-estat-07-birthrate-line`・`/blog/total-fertility-rate` を確認。`total-fertility-rate` が新たに入り、目標の `fertility-rate-prefecture-gap` は未達。
- **baseline (GA4 Data API property 463218070・country=Japan・ISO 週・2026-09-26 の二重計測是正後の定義、2026-10-20 取得)**:

  | 週 | ranking を参照元にした blog page_view | ranking page_view | 比率 |
  |---|---|---|---|
  | 2026-W40 (09-28〜10-04) | 142 | 4,519 | 3.14% |
  | 2026-W41 (10-05〜10-11) | 153 | 5,270 | 2.90% |
  | 2026-W42 (10-12〜10-18) | 195 | 5,191 | 3.76% |
  | 3 週合計 | 490 | 14,980 | 3.27% |

  副指標 (このカード「このランキングを読み解く」だけの `nav_click`、`customEvent:nav_surface==ranking_blog`、Japan): 導線名が付いた 10-08 以後だけ存在し、W41 (10-08〜10-11 の 4 日) 21、W42 56、10-19 は 8。KPI は `site-circulation-rate`。
- **再現コマンド (baseline)**: 分子 `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-28 --end 2026-10-18 --dims isoYearIsoWeek --metrics eventCount --filter 'eventName==page_view' --filter 'pagePath^=/blog/' --filter 'pageReferrer*=stats47.jp/ranking/' --japan`、分母は同コマンドの pagePath を `^=/ranking/` にして pageReferrer の条件を外す。副指標は `--dims date --filter 'eventName==nav_click' --filter 'customEvent:nav_surface==ranking_blog' --japan`。
- **想定効果**: 置かない [根拠が無い]。並び替えの前例が無く、カードのクリック率の倍率を支える過去事例も計算式も無い。週次 snapshot adapter が ranking→blog の page_view を扱わないため、行は「効果判定エンジン対象外」とし、下の手順で判定する。
- **観測期限と判定手順**: 2026-11-17。W44〜W46 (10-26〜11-15) を同コマンドで取り、デプロイ前 W40〜W42 の比率の範囲 2.90〜3.76% と比べる。3 週すべてが 3.76% を超えれば増加として記録、3 週すべてが範囲内なら effect/none 候補、混在なら pending のまま次の 3 週 (期日 2026-12-08) を足す。W43 (10-19〜10-25) はデプロイ日をまたぐので使わない。副指標は 1 週 56 件で標本が薄く count のみ。
- **交絡**: W40→W42 の 142→195 は並び替えより前の上昇で、原因は未確認 (範囲が広い理由)。`SEO-TITLE-CTR-EFFECT-01` の title 変更が分母 (ranking の page_view) の構成を変え得る。`NAV-CLICK-COVERAGE-01` の共通クリック監視が窓内にデプロイされると `nav_click` の数え方が変わり得る ([仮説] `ranking_blog` は導線名付きで影響は小さい。検証: デプロイ日に `ranking_blog` の日次件数を前日と比べる。検証期日: そのデプロイ日)。

### [BLOG-SRCLINK-01] 効果判定は行わず、ブログ→ランキング回遊の新定義 baseline を記録 (2026-10-27)

- **判定**: 判定しない (行の手順どおり新 baseline の記録で閉じる)。07-24 の source-link 配置是正の効果は、2026-09-26 の二重計測是正をまたぐため before/after では判定できない (`data/releases/2026-09-26-ga4-measurement-v2.json` の `doNotCompareAcross`)。
- **根拠データ (取得元 data/ga4/snapshots/<週>/ の rolling28d・Japan、`internal-transitions.csv` の blog→ranking ÷ `pages-clean.csv` の /blog/ page view。`data/measurement-cycle/latest.json` の journey と同じ定義)**: 2026-W40 869/10,651 = 8.16%、W41 893/10,428 = 8.56%、W42 946/10,220 = 9.26%。窓は重なり、W42 (09-20〜10-17) は 09-26 をまたぐ。これは行にあった ISO 週の page_view 参照元定義 (W40 5.27%、W41 4.09%) とは別定義で、両者は比べない。
- **再現コマンド**: `for w in 2026-W40 2026-W41 2026-W42; do node -e "const fs=require('fs');const rd=f=>fs.readFileSync(f,'utf8').trim().split('\n');const t=rd('data/ga4/snapshots/$w/internal-transitions.csv').slice(1).map(l=>l.split(','));const br=t.filter(r=>r[0]=='blog'&&r[1]=='ranking').reduce((a,r)=>a+ +r[2],0);const p=rd('data/ga4/snapshots/$w/pages-clean.csv');const h=p[0].split(',');let b=0;for(const l of p.slice(1)){const c=l.split(',');if((c[h.indexOf('pagePath')]||'').startsWith('/blog/'))b+=+c[h.indexOf('screenPageViews')]||0}console.log('$w',br,b,(br/b*100).toFixed(2))"; done`
- **以後**: blog→ranking の導線を変える施策は `[target:]` 付きの別行で起票し、この rolling28d の値 (W42 時点 9.26%) と比べる。ISO 週の定義 (ga4-query.mjs) は GA4 資格情報がある PC でのみ再取得できる (この PC には無い)。
- **処置**: improvements.md から行を削除。

### [NOTE-KAKEI-REDESIGN-EFFECT-01] note家計シリーズの決定的テンプレ化は PV を動かさず effect/none (2026-10-27)

- **デプロイ日**: 2026-09-15 (全 47 本本番反映)
- **想定効果**: PV 中央値 baseline 比 +50% 以上、または 47 本合計 PV +100 以上 [根拠: 行に記載した目標。過去事例・計算式は無く、目標感の値]
- **検証コマンド**: `node -e "const j=require('./data/note/dashboard/latest.json');const a=j.articles.filter(x=>/^a-kakei-/.test(x.catalogKey||''));console.log(a.length,a.reduce((s,x)=>s+x.pageViews,0))"` (期間別は `data/note/dashboard/<期間>_*.json` の同じ集計)
- **実測 (取得元 data/note/dashboard、a-kakei-* 47 本)**: baseline 2026-08-17〜09-13 は合計 108 PV・中央値 2 (この記録の status は incomplete だが 47 本は揃う)。after は 2026-09-21〜10-18 が合計 115・中央値 2、2026-09-28〜10-25 (fetchedAt 2026-10-26、status pass) が合計 100・中央値 2、売上 0 円。
- **判定**: effect/none [根拠: 合計は +7 / -8 で目標 +100 の達成率 0% 以下、中央値は 2 のままで +50% (3) に届かない。デプロイ後 12〜40 日、全窓がデプロイ後]。標本は小さい (47 本で 100 PV 前後) が、目標が小さな増分で、実測はその水準に達していない。
- **未確定 / 仮説**: [仮説] PV が動かないのは、note 内の検索・おすすめ経由の露出が少なく、記事本体の改善では閲覧数が増えないため。表示 (インプレッション) は 28 日で 1,412。検証: 同コマンドで impressions を baseline と比べ、期日 2026-11-24 に impressions が baseline 比 +50% 未満なら導線 (タイトル・タグ) 側の問題として扱う。
- **処置**: improvements.md から行を削除。

### [NOTE-CIRCULATION-PILOT-01] 着地 session を取り直せず判定不能。降格 (2026-10-27)

- **判定**: 判定不能 (effect/* は付けない)。不足データ: ① 対象 3 パスの note.com 経由の着地 session (`ga4-query.mjs` に GA4 サービスアカウント鍵が要るが、この PC には無い (`Service account key not found` を 2026-10-27 に確認)。週次 snapshot の `landing-context.csv` は参照元で絞っていない)、② 遷移先 note の view を dashboard 経路 28 日で置き直した baseline、③ `[target:]` (根拠付きの想定値が無い)。
- **根拠データ**: 週次 snapshot 2026-W42 (2026-09-20〜10-17、Japan) の note.com 参照は 369 sessions (`data/ga4/snapshots/2026-W42/referral-sources.csv`)。10-05 計測の 397 (28日)、baseline の 505 から低下が続くが、これは note.com 全体で、対象 3 記事の効果とは分けられない。
- **再現コマンド**: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-21 --end 2026-10-18 --dims landingPagePlusQueryString --metrics sessions --filter 'sessionSource==note.com' --filter 'landingPagePlusQueryString==/ranking/annual-sunshine-duration' --japan` (3 パスそれぞれ。鍵のある PC で実行)
- **処置**: improvements.md から行を削除し、backlog に `NOTE-CIRCULATION-RECHECK-01` を起票。

### [THEME-EXPANSION-EFFECT-01] d28 の公開後窓でも標本不足で判定不能。降格 (2026-10-27)

- **判定**: 判定不能 (effect/* は付けない)。想定効果値 `[target:]` が無く、標本も不足 (guard: insufficient-sample / insufficient-target)。
- **根拠データ (data/themes/experiments.json の `result.rechecks.d28`、observedAt 2026-10-19、公開後だけの窓 GA4 09-13〜10-10・GSC 09-11〜10-08)**: 44 件の実験で、status は launch-provisional 30・insufficient-data 14。GA4 pageViews の合計 410 (measured-low 41 件・insufficient-data 3 件)、GSC impressions の合計 1,574。ほかの 21 件は d28 の再観測が無い。
- **再現コマンド**: `node -e "const j=require('./data/themes/experiments.json');const a=j.experiments||Object.values(j);let n=0,pv=0,imp=0;for(const y of a){const rc=y.result?.rechecks?.d28||[];const l=rc[rc.length-1];if(!l||l.observedAt.slice(0,10)!='2026-10-19')continue;n++;pv+=l.values['ga4.pageViews']?.value||0;imp+=l.values['gsc.impressions']?.value||0}console.log(n,pv,imp)"`
- **次**: d56 基本観測 2026-11-06 (週次 snapshot で公開後 56 日の窓が揃う日) に `evaluate-theme-experiments` で記録する。標本が不足のままなら count のみ記録して効果を主張しない。カード `THEME-EXPANSION-D56-01` で追う。
- **処置**: improvements.md から行を削除し、backlog へ起票。
