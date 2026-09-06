---
title: 改善バックログ
type: improvement-backlog
created: 2026-06-06
updated: 2026-09-06
status: active
---

# 改善バックログ

未完了または効果判定待ちだけを置く。検証コマンドと実装履歴は `.claude/skills/analytics/*-improvement/reference/improvement-log.md`、完了履歴は Git を参照する。

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| PERF-RANKING-LCP-02 | デプロイ済 2026-08-05。先頭tileが本番で`fetchpriority=high`かつmedia無しを確認。日次PSIのafterで before LCP 9,347ms (mobile) からの改善を判定する | effect/pending | 2026-08-12 | claude | performance |
| PERF-RANKING-PAYLOAD-01 | sidebarはデプロイ済(4%減)。TopoJSON簡略化は**maxZoom14と両立せず棄却**(150KB案はz14で県境が300px超ずれる)。代わりにtopologyをRSC payloadから外し`/prefecture.topojson`のclient fetchへ変更(精度劣化なし・理論82%減)。デプロイ後にHTML実測で50%達成を判定する | effect/pending | 2026-08-19 | claude | performance |
| PERF-AREA-DOM-01 | デプロイ済 2026-08-05。rail上限12/navを本番で確認。PSI collectorに`dom_size`を追加済(2026-08-06のcronが初回実データ)。**残: 実データでDOM 9,101比70%削減を判定**。beforeはChrome DevTools計測なので収集経路差を明示して読む | effect/pending | 2026-08-12 | claude | performance |
| PERF-WORKERS-CACHE-01 | 2026-08-16デプロイ済。HTMLのMISS→HIT、RSC/認証のno-store分離、home warm TTFB 924ms→15ms、LCP 1,290ms→901msを本番labで確認。**★purge実走で問題を実測 (2026-08-17)**: KSJ是正の公開で`/ranking/nuclear-power-plant-count`のHTMLを更新したが、`purge-cache.ts --urls`(zone purge・API success)を2回、`--files`(R2キー)、CIの`purge-worker-cache.ts --all`(sync-snapshots run 31996468008・成功)をすべて通しても**同一エントリがHITのまま残りageが2090→2740と伸び続けた**。originは`?cb=`で正しい内容を返すのでレンダリングは正常。**purgeが成功を返しながらHTML edgeエントリを落とせていない**。**★実害の再測 (2026-08-17 06:50)**: 同エントリはage 7,395 (約2時間) でHITのままだが、cache-bustした応答とHTMLをbyte比較すると**差分は`?cb=`のecho分のみで内容は同一** (京都府=0・福井県=4の是正後データ)。entryがR2是正**後**に作られたため、このページで「古いHTMLが出た」事実は無い。前段の「最大24h古いHTMLが出る」はeviction不能から導いた推論で、実害としては未実証。**切り分けが1つ進んだ**: 応答headerは`cache-control: public, max-age=0, must-revalidate`なのにedgeが2時間HITで保持している = edge TTLは応答headerではなく**Cloudflare側のCache Rule**が決めている (storage.stats47.jpのmax-age=14400と同構造)。残る切り分けはWorkers CacheとCDN edgeのどちらが保持しているか。**残: 上記の切り分けと、2026-08-23以降に日次PSI 7点で回帰なしを判定**（guard: insufficient-sample / insufficient-target） | effect/pending | 2026-08-24 | claude | performance |
| PERF-WORKER-P99-01 | Workers traces / GraphQLでCPU p99 1.48〜2.02秒・wall p99 3.80〜4.61秒の支配route / R2 bindingを特定してから対象routeだけを修正する | pending | 2026-08-19 | claude | performance |
| AFF-BRAND-FIT-01 | health 軸のブランド不適合広告を停止し、`精力`・`マカ`を blocklist に追加するか判断する。公的統計サイトの信頼を優先する。**2026-09-03: 暫定で精力サプリ 3 件 (banner 2 + text 1) を priority 1 に下げ上位 3 枠から外した (R2 反映済)。停止・blocklist 化は未判断** | pending | 2026-08-05 | uruhayato373 | affiliate |
| AFF-RESOLUTION-EFFECT-01 | 広告の意図軸を「出典調査 → タグ → カテゴリ」に統一 (#913)。**baseline (GA4 28 日 〜2026-08-28)**: 23,771 imp / 11 click / CTR 0.046%、furusato 1,307 imp 0 click、economy 8,329 imp 3 click。試算の行き先: ranking economy 35,613→6,746・furusato 2,904→31,465 imp/週。[target: furusato imp +20,000/28日、全体 CTR ≥ 0.10%]。デプロイ (backlog `AFF-DEPLOY-RESOLUTION-01`) 後 4 週で `fetch-affiliate-ga4.cjs 28` を vertical 別に before/after。同時デプロイの `AFF-IMPRESSION-ROUTING-01` と窓が重なるので position 別に分けて読む (guard: confounded) | pending | 2026-10-08 | claude | affiliate |
| R2-STORAGE-01 | stats47診断とsiteScope別alertは完了。残るaccount 22.20GB超過はdoboku-note-archive 8.98GBの保持方針を決め、許容または削減を選ぶ。stats47の削除候補22.7MBだけでは解消しない | pending | 2026-08-31 | uruhayato373 | cloudflare-cost |
| DATA-ESTAT-FETCH-01 | `DATA_INF` 系で取得失敗している25 metricのconfigを一次統計メタと照合し、修正または一時非公開にする | pending | 2026-08-24 | claude | data-quality |
| DATA-MANUAL-RESTORE-01 | 手動抽出12 metricをprovenance付きで再取得し、values欠損を解消する | pending | 2026-08-24 | claude | data-quality |
| SEARCH-GROWTH-CYCLE-01 | finalized 7日でKPI判定、rolling 28日で候補発見、週1〜2件採択、14/28/56日判定を4週連続で運用する | pending | 2026-08-31 | claude | gsc |
| ADSENSE-PAUSE-01 | 2026-08-16オーナー判断。AdSenseのscript・Auto ads・手動枠・fallback・空枠を全停止するコードは実装済、未デプロイ。デプロイ後28日で減収、CWV、engagement、affiliate CTR、商品導線を比較し、再開可否を人が判断する | in-progress | 2026-09-14 | claude | adsense |
| AFF-IMPRESSION-ROUTING-01 | AdSense停止中のranking/area空き位置へ既存の文脈一致バナーを配線。baselineは4,299 imp / 6,055 PV = 0.710 imp/PV。コード実装済・未デプロイ。デプロイ後14日で重複しない期間のimp/PV、placement別CTR、engagementを比較する | in-progress | 2026-08-31 | claude | affiliate |

## Tier 2 (P2)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| A11Y-AREA-CONTRAST-01 | デプロイ済 2026-08-05。本番HTMLで生hex消滅・`text-blue-700`/`dark:text-blue-400`・男女ラベルを確認、contrast実測6.70/6.04/5.83/5.60。**残: 日次PSIのaccessibilityスコア** (before 97) でcontrast違反0を確認する | effect/pending | 2026-08-19 | claude | accessibility |
| RANKING-REINDEX-01 | 復帰56 rankingが5週連続 GSC imp 0 (RANKING-GONE-RESTORE-01 を effect/none で確定・2026-08-05)。URL Inspection で coverageState を確定し、未収録なら sitemap 再送信で再収録を促す | pending | 2026-08-19 | claude | gsc |
| BLOG-WAVE-2026-07-09-MANUAL | `farmland-crisis-abandoned-land` の4週後GSC効果を判定する | effect/pending | 2026-08-06 | claude | gsc |
| RANKING-CTR-01 | 高表示・低CTR 13件の公開状態と baseline を確定し、2〜4週後に対象群だけを比較する | effect/pending | 2026-08-08 | claude | gsc |
| BLOG-SEO-TYPES-01 | D2/F/Gを含む記事型ポートフォリオの4週効果を既存A型と比較する。**F/G型は公開0件で比較不成立**。07-10コホートは約21日で4週未到達 (A型n=5 median clicks 2 / D2型n=30 median 0.5) | effect/pending | 2026-08-16 | claude | gsc |
| BLOG-SEO-QUEUE-01 | topic queue起点の記事が需要候補を正しく選び、公開後に検索表示を得たか確認する。**queue done は1件のみ (imp 9/clicks 0) で標本過小**。前提として下記 BLOG-QUEUE-TRACK-01 の状態ずれを直す | effect/pending | 2026-08-31 | claude | gsc |
| BLOG-QUEUE-TRACK-01 | topic-queue の status が実態とずれる。2件が in-progress のまま2026-07-06公開済。公開時に done へ遷移させ、BLOG-SEO-QUEUE-01 の判定母集団を正しくする | pending | 2026-08-19 | claude | content |
| BLOG-SEO-PACE-01 | 月15〜20本の上限内で、需要確認済み候補だけを小バッチ公開する | pending | 2026-08-31 | claude | gsc |
| RANKING-KEYS-SYNC-01 | 2026-08-17 の実走で検証機会が到来し、欠陥を2つ検出した。(1) 生成スクリプトの一時障害で生きたキー `bath-soap-consumption-expenditure` を KNOWN/SITEMAP から落とす差分を commit していた → `d938d04cf` で是正済 (2) PR 作成ガードが `gh pr view` を使い CLOSED の #544 を拾い続けて PR が二度と作られず、同期が本番へ一度も届いていなかった → open 限定に是正 + 機械ガード追加。**残件**: 次回実走が是正後スクリプトで正しい差分を出し、PR が実際に作られることを確認する | pending | 2026-08-25 | claude | indexing |
| SURVEY-LINKAGE-02 | 未分類241件から、provenance辞書で確実に回収できる50 statsDataIdを追加する | pending | 2026-08-31 | claude | content |
| TOKEN-CONTENT-01 | コンテンツ制作の品質を落とさずトークン量が減ったか実測する。実測は2026-08-03開始で blog 2 run のみ (cost $12.07 / $25.01)。**標本不足で判定不能** — 日次1runで2週=約14run揃う時点まで延期 | effect/pending | 2026-08-19 | claude | cost |
| TOKEN-AICONTENT-01 | Claude自動生成の実測（5件run $79〜$90、生成0件run $87.31）をbaselineに、課金無効projectのGemini日次へ移行する。[target: API課金 -100%（$0）]。main反映後7 runでPASS率・preflight/quota停止・request/tokenと課金設定を照合し、品質ゲートを弱めず費用0か判定する | pending | 2026-09-07 | ranking-content-author | cost |
| FUNNEL-CTA-01 | ranking末尾CTAのclickと遷移後行動を判定する。**判定不能 (ブロッカー: オーナー作業)** — `cta_id`/`content_id`/`target_type` のGA4カスタムディメンションが未登録 (2026-07-31 API監査で確定)。登録なしでは「遷移後行動」の内訳が取れない。Dueは登録+48h+4週で再設定する | effect/pending | 2026-09-09 | uruhayato373 | ga4 |
| AFF-BLOG-TEXTLINK-01 | 本文内text linkとsidebarのCTRを比較し、furusato在庫欠損を別扱いで確認する | effect/pending | 2026-08-25 | claude | affiliate |
| AFF-A8-REGISTER-01 | 追加18件のうち配信された案件をA8確定成果とCTRで4週判定する | effect/pending | 2026-08-25 | claude | affiliate |
| AFF-SCOUT-PIPE-01 | A8 scoutの週次運用で未解決vertical、重複、cron失敗が再発しないか判定する | effect/pending | 2026-08-24 | claude | affiliate |
| BLOG-SRCLINK-01 | source-link配置是正後のブログ→ranking回遊を判定する | effect/pending | 2026-08-24 | claude | ga4 |
| BLOG-LINKROT-01 | 内部リンク是正後のcoverageとブログ→ranking回遊を判定する | effect/pending | 2026-08-24 | claude | gsc |
| SITE-LINKROT-01 | 横断リンク監査の壊れ0継続と、タグ・410由来coverageの変化を判定する | effect/pending | 2026-08-24 | claude | gsc |
| STP-MESSAGE-ROLLOUT-01 | ポジショニング文言をSNSプロフィール・OGP・サイト説明・note導線へ展開し、例外を明示する | pending | 2026-08-31 | claude | brand |
| THEME-INTERNALNAV-01 | theme→ranking/blog遷移を既存GA4契約で計測できるようにする | pending | 2026-08-31 | claude | ga4 |
| NOTE-CIRCULATION-PILOT-01 | 2026-09-06に高view 3記事へ次記事+マガジンの素URLカードを反映し、続けて公開222記事を全量是正（95タグ以上222/222、サイト184、関連記事180、マガジン157、live監査error/warning 0）。Japan 28日 baselineは対象着地80/86/4 sessions、遷移先note viewは取得対象の2件だけ保存（1件欠測）。2026-10-04以降に同条件で着地session・次記事view増分を比較する（guard: note内clickは直接取得不可、同一landingの複数記事混在） | effect/pending | 2026-10-04 | claude | ga4/note |
| THEME-LOCALFINANCE-01 | local-financeの流入増とengagement低下をsource/mediumで切り分ける。**GSC 56日 clicks0/imp32 で organic起因ではない**と確定 (pv 92→183 / engagementRate 0.615→0.165、同週 site-wide は Direct sessions +55%・bounce 0.81)。ページ別 source/medium は GA4 creds 保有環境での実行が必要 | pending | 2026-08-19 | claude | ga4 |

## Tier 3 (P3)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| ASSET-POLICY-BURNDOWN-01 | baseline 27件は、既存画像の圧縮・重複削除・再エンコードをユーザーが承認した範囲だけ削減する | pending | 2026-08-15 | uruhayato373 | performance |
| RANK-THIN-01 | URL Inspectionの実測が揃った時点で、観測年1年などthin metricのnoindex基準を決める | pending | 2026-08-31 | claude | indexing |
| STP-AI-WATCH-01 | AI Overviewsによる雑学系流入の侵食を四半期で定点観測する | pending | 2026-10-07 | claude | gsc |
| DEPS-RENOVATE-01 | Renovate App が未稼働 (renovate.json はあるが PR/ブランチが 0 件)。npm の version updates が止まり major が滞留、結果として security fix が全て破壊的変更になっている。GitHub App のインストールはオーナー操作 | pending | 2026-08-31 | uruhayato373 | security |
| DEPS-MAJOR-SECURITY-01 | Dependabot 残 76 件は全て major 更新が必要 (critical 19 = vitest 系・全て development スコープ)。会社 PC は proxy が tarball を 407 で拒否し install/検証不能なため、ネットワーク制約のない環境で実施する | pending | 2026-08-31 | claude | security |

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
