---
title: 改善バックログ
type: improvement-backlog
created: 2026-06-06
updated: 2026-09-07
status: active
---

# 改善バックログ

未完了または効果判定待ちだけを置く。検証コマンドと実装履歴は `.claude/skills/analytics/*-improvement/reference/improvement-log.md`、完了履歴は Git を参照する。

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| PERF-WORKER-P99-01 | Workers traces / GraphQLでCPU p99 1.48〜2.02秒・wall p99 3.80〜4.61秒の支配route / R2 bindingを特定してから対象routeだけを修正する。**2026-09-07: cloudflare-graphql/observability MCPが未認証で調査継続不能 (システムから利用不可と明示された)**。オーナーが `claude mcp` または `/mcp` で認証後に再開する | pending | 2026-09-21 | uruhayato373 | performance |
| AFF-BRAND-FIT-01 | health 軸のブランド不適合広告を停止し、`精力`・`マカ`を blocklist に追加するか判断する。公的統計サイトの信頼を優先する。2026-09-03に精力サプリ3件を priority 1 に暫定降格済み。**2026-09-07: 停止・blocklist化の最終判断が未了のままDue超過。オーナー判断待ち** | pending | 2026-09-21 | uruhayato373 | affiliate |
| AFF-RESOLUTION-EFFECT-01 | 広告の意図軸を「出典調査 → タグ → カテゴリ」に統一 (#913)。**baseline (GA4 28 日 〜2026-08-28)**: 23,771 imp / 11 click / CTR 0.046%、furusato 1,307 imp 0 click、economy 8,329 imp 3 click。試算の行き先: ranking economy 35,613→6,746・furusato 2,904→31,465 imp/週。[target: furusato imp +20,000/28日、全体 CTR ≥ 0.10%]。デプロイ (backlog `AFF-DEPLOY-RESOLUTION-01`) 後 4 週で `fetch-affiliate-ga4.cjs 28` を vertical 別に before/after。同時デプロイの `AFF-IMPRESSION-ROUTING-01` と窓が重なるので position 別に分けて読む (guard: confounded) | pending | 2026-10-08 | claude | affiliate |
| R2-STORAGE-01 | **2026-09-07実測**: `.claude/state/metrics/cloudflare/history.csv` の r2_storage_gb は 08-22 22.2GB → 09-04 31.8GB (スパイク) → 09-05 23.1GB と乱高下しながら無料枠 (10GB) を超過継続。doboku-note-archive 8.98GBの保持方針 (許容 or 削減) がオーナー判断待ちで未決のまま | pending | 2026-09-21 | uruhayato373 | cloudflare-cost |
| DATA-ESTAT-FETCH-01 | `DATA_INF` 系で取得失敗している25 metricのconfigを一次統計メタと照合し、修正または一時非公開にする。**2026-09-07: weekly-review 2026-W35 で「25件の処置決定なし」と確認 (未着手のまま2週目)**。W37 Mustへ再掲し実行する | pending | 2026-09-21 | claude | data-quality |
| DATA-MANUAL-RESTORE-01 | 手動抽出12 metricをprovenance付きで再取得し、values欠損を解消する。**2026-09-07: weekly-review 2026-W34/W35 で2週連続「未着手・ready/blocked判定0件」と確認**。W37 Mustへ再掲し実行する | pending | 2026-09-21 | claude | data-quality |
| SEARCH-GROWTH-CYCLE-01 | finalized 7日でKPI判定、rolling 28日で候補発見、週1〜2件採択、14/28/56日判定を4週連続で運用する。**2026-09-07実測**: 基盤は稼働 (manifests W30-W37・candidates 1,060件・sources全fresh) だが採択が `approved 1件 / dismissed 1件` のみで週1〜2件の採択サイクルが開始できていない (monthly.md 09-06記載の「候補3件が承認待ち」から進捗なし)。オーナー承認 → 週次採択の運用開始が次アクション | pending | 2026-09-21 | claude | gsc |
| COVERAGE-LOOP-01 | 2026-09-07にPR #939でデプロイ済み。W36（2026-09-04）の最新UI exportは404 12,367 / soft404 450 / 5xx 18 / crawled-not-indexed 2,697。全3,147 URLを実測し、旧市区町村カテゴリsoft404 5件は本番で全件301、親プロフィール200、未知カテゴリ410、sitemap掲載0件を確認した。次回exportで市区町村5→0と全体差分を判定する | effect/pending | 2026-09-14 | claude | gsc |
| ADSENSE-PAUSE-01 | 2026-08-16オーナー判断。AdSenseのscript・Auto ads・手動枠・fallback・空枠を全停止するコードは実装済、未デプロイ。デプロイ後28日で減収、CWV、engagement、affiliate CTR、商品導線を比較し、再開可否を人が判断する | in-progress | 2026-09-14 | claude | adsense |
| AFF-IMPRESSION-ROUTING-01 | AdSense停止中のranking/area空き位置へ既存の文脈一致バナーを配線。baselineは4,299 imp / 6,055 PV = 0.710 imp/PV。**2026-09-07確認: 依然未デプロイ** (`.claude/state/ads/ga4-affiliate-*.json` の最新は08-28のまま10日間更新なし = ADSENSE-PAUSE-01同様デプロイ承認待ち)。デプロイ後14日で重複しない期間のimp/PV、placement別CTR、engagementを比較する | in-progress | 2026-09-21 | claude | affiliate |

## Tier 2 (P2)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| RANKING-REINDEX-01 | 復帰56 rankingが5週連続 GSC imp 0 (RANKING-GONE-RESTORE-01 を effect/none で確定・2026-08-05)。URL Inspection で coverageState を確定し、未収録なら sitemap 再送信で再収録を促す。**2026-09-07実測**: 日次URL Inspection履歴 (2026-08-05〜09-07の全CSV、251件のユニークrankingキーを検査済) を突合したが、復帰56キーは**1件もこれまでの日次サンプルに含まれていない** (ランダム抽出500件/日ローテーションが偶然当たっていない)。次: 56キーを明示指定した一回限りのURL Inspection実行が必要 | pending | 2026-09-21 | claude | gsc |
| BLOG-SEO-TYPES-01 | D2/F/Gを含む記事型ポートフォリオの4週効果を既存A型と比較する。**2026-09-07実測**: topic-queue done は81件 (A:29/B:12/D2:23/F:7/G:10) に増加し、当初の「F/G公開0件で比較不成立」は解消。まだ4週齢に満たない記事が大半のため比較は次回に延期 | effect/pending | 2026-09-28 | claude | gsc |
| BLOG-SEO-QUEUE-01 | topic queue起点の記事が需要候補を正しく選び、公開後に検索表示を得たか確認する。**2026-09-07実測**: 前提だった BLOG-QUEUE-TRACK-01 の状態ずれは解消 (in-progress 0件)。queue doneが1件→81件に増え標本は確保できたので、次回は81件のうち公開4週以上経過した分でGSC実測を行う | effect/pending | 2026-09-28 | claude | gsc |
| BLOG-SEO-PACE-01 | 月15〜20本の上限内で、需要確認済み候補だけを小バッチ公開する。**2026-09-07: weekly-review 2026-W35 で「超過達成 (規律違反): 公開85本」を確認** (8/28に6本・8/29に29本・8/30に50本、計画本文は「3本目は作らない」と明記)。上限運用が守られていない状態が継続しているため、strategy-advisor による月次配分の再設計と実行統制が必要 | pending | 2026-09-21 | claude | gsc |
| SURVEY-LINKAGE-02 | 未分類241件から、provenance辞書で確実に回収できる50 statsDataIdを追加する。**2026-09-07実測**: `.claude/state/surveys/portfolio.json` (audit 2026-09-06) で unresolved 214件 (external 23 / estat-uncovered 78 / ssds-synthetic-only 113) = 241から-27件回収済 (目標50の54%)。残り23件を継続する | pending | 2026-09-21 | claude | content |
| TOKEN-AICONTENT-01 | Claude自動生成の実測（5件run $79〜$90、生成0件run $87.31）をbaselineに、課金無効projectのGemini日次へ移行する。[target: API課金 -100%（$0）]。main反映後7 runでPASS率・preflight/quota停止・request/tokenと課金設定を照合し、品質ゲートを弱めず費用0か判定する | pending | 2026-09-07 | ranking-content-author | cost |
| FUNNEL-CTA-01 | ranking末尾CTAのclickと遷移後行動を判定する。**判定不能 (ブロッカー: オーナー作業)** — `cta_id`/`content_id`/`target_type` のGA4カスタムディメンションが未登録 (2026-07-31 API監査で確定)。登録なしでは「遷移後行動」の内訳が取れない。Dueは登録+48h+4週で再設定する | effect/pending | 2026-09-09 | uruhayato373 | ga4 |
| AFF-BLOG-TEXTLINK-01 | 本文内text linkとsidebarのCTRを比較し、furusato在庫欠損を別扱いで確認する。**2026-09-07: `.claude/state/ads/ga4-affiliate-*.json` の最新が08-28のまま10日間更新なし**で position別実測が取れない。週次cron (`affiliate-ga4-weekly.yml`) の実行状況を確認し再取得する | effect/pending | 2026-09-21 | claude | affiliate |
| AFF-A8-REGISTER-01 | 追加18件のうち配信された案件をA8確定成果とCTRで4週判定する。**2026-09-07: affiliate-improvement log に本件の実測記録なし、GA4 snapshotも10日stale**。A8確定成果レポート (`/a8-report`) と最新GA4取得後に判定する | effect/pending | 2026-09-21 | claude | affiliate |
| AFF-SCOUT-PIPE-01 | A8 scoutの週次運用で未解決vertical、重複、cron失敗が再発しないか判定する。**2026-09-07: `a8-catalog.json` の走査・監査記録が確認できず**、週次cronの稼働状況の裏取りが必要 | effect/pending | 2026-09-21 | claude | affiliate |
| BLOG-SRCLINK-01 | source-link配置是正後のブログ→ranking回遊を判定する。**2026-09-07: GA4 nav_click (rail_widget/rail_slot) の該当ページ別内訳を取得できるMCP/ローカル手段が今回無く未実測**。GA4 creds保有環境で再試行する | effect/pending | 2026-09-21 | claude | ga4 |
| BLOG-LINKROT-01 | 内部リンク是正後のcoverageとブログ→ranking回遊を判定する。**2026-09-07実測**: `.claude/state/site/link-audit.json` (2026-09-05生成) で壊れリンク6件 (410、旧key `academic-achievement-test-average-rate`等) が現存し「壊れ0」未達。`broken-link-remap.json` へ置換先を追記して是正後に再判定する | effect/pending | 2026-09-21 | claude | gsc |
| SITE-LINKROT-01 | 横断リンク監査の壊れ0継続と、タグ・410由来coverageの変化を判定する。**2026-09-07実測**: 同上 site-wide audit で壊れ6件 (blog→ranking 410参照) を検出、「壊れ0の継続」未達。是正後に再判定する | effect/pending | 2026-09-21 | claude | gsc |
| STP-MESSAGE-ROLLOUT-01 | ポジショニング文言をSNSプロフィール・OGP・サイト説明・note導線へ展開し、例外を明示する。**2026-09-07: 実行記録なし (backlog/weekly/monthlyのいずれにも着手痕跡なし)**。§実行手順の4ステップを次サイクルで実施する | pending | 2026-09-21 | claude | brand |
| THEME-EXPANSION-EFFECT-01 | 2026-09-11公開の全55テーマで、構成拡充が国内PV・GSC表示・回遊に寄与するか品質と併せて観測する。新規34はbaselineなしのlaunch、既存構成21は2026-07-12〜09-05の同一56日窓baseline（外国人PV11・表示15を含む）を使う。d7品質=2026-09-18、d28暫定=2026-10-09、d56基本観測=2026-11-06。確認: `npm run theme:portfolio:audit`。本番初回107/110PASSに対し、同一build・同一manifestで失敗3ケースを各3回再確認して9/9PASS（証拠: `.local/verification/themes/2026-09-11-production-iXmDExxT9Awfz7bXSyc_Q/` の `all-result.json` と `recovery/all-result.json`）。初回原因は未確定。9/18までpopulation-dynamics・regional-energy（各1440px）とrailway（390px）を再観測し、503・React #418・Connection closed・章欠落の再発時は失敗URL・応答・cf-ray・配信HTMLを保存して原因を切り分け、担当へ修正を引き渡す。低標本はcountのみ、未計装の回遊はnot-instrumentedとし、期間不足・同時変更・季節性・想定効果値未設定では効果を確定しない。d56で標本・期間が不足する場合は欠測・観測窓・導線を検証し、次期日と再検証を記録する。新規の継続・改善・保留はlaunch-reviewへ記録する。根拠: `.claude/state/themes/experiments.json`、`.claude/state/metrics/themes/2026-09-11-baseline-aligned.json`、`.claude/state/metrics/themes/2026-09-10-all-expansion.json`。 | effect/pending | 2026-09-18 | theme-portfolio-manager | ga4/gsc/theme-quality |
| THEME-INTERNALNAV-01 | theme→ranking/blog遷移を既存GA4契約で計測できるようにする。**2026-09-07: analytics-event-standards.md にtheme→ranking/blog専用のnav_surface登録が未確認**。既存nav_click基盤の上に必要なsurface値を明示登録できているか確認する | pending | 2026-09-21 | claude | ga4 |
| NOTE-CIRCULATION-PILOT-01 | 2026-09-06に高view 3記事へ次記事+マガジンの素URLカードを反映し、続けて公開222記事を全量是正（95タグ以上222/222、サイト184、関連記事180、マガジン157、live監査error/warning 0）。Japan 28日 baselineは対象着地80/86/4 sessions、遷移先note viewは取得対象の2件だけ保存（1件欠測）。2026-10-04以降に同条件で着地session・次記事view増分を比較する（guard: note内clickは直接取得不可、同一landingの複数記事混在） | effect/pending | 2026-10-04 | claude | ga4/note |
| THEME-LOCALFINANCE-01 | local-financeの流入増とengagement低下をsource/mediumで切り分ける。**GSC 56日 clicks0/imp32 で organic起因ではない**と確定 (pv 92→183 / engagementRate 0.615→0.165、同週 site-wide は Direct sessions +55%・bounce 0.81)。**2026-09-07: ページ別source/medium crosstabを取得できる読み取り専用手段 (seo-observability MCP の `ga4_organic_quality` はlanding engagementのみでsource/medium breakdown非対応) が今回無く未実測**。GA4 creds保有環境での実行が必要 | pending | 2026-09-21 | claude | ga4 |

## Tier 3 (P3)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| ASSET-POLICY-BURNDOWN-01 | baseline 27件は、既存画像の圧縮・重複削除・再エンコードをユーザーが承認した範囲だけ削減する。**2026-09-07: ユーザー承認の記録なし**。承認待ちのまま進捗0件 | pending | 2026-09-21 | uruhayato373 | performance |
| RANK-THIN-01 | URL Inspectionの実測が揃った時点で、観測年1年などthin metricのnoindex基準を決める。**2026-09-07: 日次URL Inspection (500件/日ローテーション) は継続稼働中だが、thin metric抽出とnoindex基準の検討は未着手** | pending | 2026-09-21 | claude | indexing |
| STP-AI-WATCH-01 | AI Overviewsによる雑学系流入の侵食を四半期で定点観測する | pending | 2026-10-07 | claude | gsc |
| DEPS-RENOVATE-01 | Renovate App が未稼働 (renovate.json はあるが PR/ブランチが 0 件)。GitHub App のインストールはオーナー操作。**2026-09-07実測**: `gh pr list --search "author:app/renovate"` = 0件で未稼働のまま継続。ただし DEPS-MAJOR-SECURITY-01 は別経路 (Dependabot security alerts) で解消済のため緊急度は当初より低い | pending | 2026-09-21 | uruhayato373 | security |

## 実行手順（レビュー文書から移行）

### `STP-MESSAGE-ROLLOUT-01`

1. サイトmetadata、OGP既定文、X・Instagramプロフィール、note導線の現在文言と更新方法を一覧化する。
2. `docs/00_プロジェクト管理/03_マーケティング戦略.md` のポジショニングと照合し、対象ごとに「変更・維持・対象外」を決める。検索意図を損なう一括置換はしない。
3. git管理文言は差分を提示し、UIのDOM・配置・色・余白を変更しない。外部プロフィール変更と本番反映はユーザー承認まで実行しない。
4. 全対象に判断が付き、変更対象のコピー・検証URL・rollbackが揃ったら完了とする。

### `STP-AI-WATCH-01`

1. S1の代表クエリ群をGSC finalized期間から固定し、同じquery集合・国・device条件で比較する。
2. 重複しない期間のclicks、impressions、CTR、positionを取得し、順位変動とCTR変動を分ける。
3. AI Overviews表示の有無を取得できない場合は推測せず、「S1 CTR低下の観測」までに限定する。
4. S2・S3の対照群と比較し、S1だけの持続的低下が確認できた場合のみ次の改善候補を最大3件に絞る。結果はGSC improvement logへ記録し、この行を削除する。

### `SITE-LINKROT-01`

1. `internal-link-audit-weekly.yml` の最新runと `.claude/scripts/site/audit-site-links.mjs` を確認し、HTTP statusだけでなくsoft 404タイトルを含めて壊れ0を検証する。
2. `/tag/家計調査`、`/survey/census`、代表ranking・area・blog・themeをSTRICT smoke対象として200を確認する。
3. GSCでタグ・誤410復旧URLのcoverageとimpressionsを、修正前後の重複しない期間で比較する。
4. 壊れがあれば、記事本文、生成設定、live描画の三層に分類して修正先を決める。壊れ0の継続とcoverage判定が揃ったらimprovement logへ結果を記録し、この行を削除する。

### `RANKING-GONE-RESTORE-01`

1. `audit-ranking-data-integrity.ts` と既知キー・sitemap生成のcheck modeを実行し、item・values・KNOWN・sitemapの欠落0を確認する。
2. 誤410から復帰した56 URLのGSC impressions、coverage、代表URLのGooglebot statusを確認する。
3. values欠損は `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01` と分離し、キー同期成功だけでデータ復旧と判定しない。
4. 週次integrity gateが継続成功し、56 URLの判定が揃ったらGSC improvement logへ記録してこの行を削除する。

### `DATA-ESTAT-FETCH-01`

1. 25 metricをstatsDataId、cdCat、失敗メッセージで分類し、同じ入力の無意味な再実行を止める。
2. e-Stat metadataと代表3県を照合し、config修正、代替統計への置換、一時非公開のいずれかをmetricごとに決める。
3. config validation後にstats→ranking valuesを再生成し、integrity auditでitemだけ存在する空ページがないことを確認する。
4. R2 write・公開は別途承認を得る。25件すべてに処置と検証結果が付いたら完了とする。

### `DATA-MANUAL-RESTORE-01`

1. 12 metricのprovenance 9点セットと復旧コマンドを確認し、不足するものは推測で再取得しない。
2. 一次ファイルを再取得してhash・年・単位・代表3県を照合し、git TS正典とR2候補を生成する。
3. rankは正典値を優先し、欠落年だけ既定の同値同順位規則で導出する。
4. provenance audit、ranking integrity audit、代表URL確認を通し、承認後のR2反映が完了した項目から対象外にする。12件が解消したらこの行を削除する。
