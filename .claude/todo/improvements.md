---
title: 改善バックログ
type: improvement-backlog
created: 2026-06-06
updated: 2026-10-05
status: active
---

# 改善バックログ

未完了または効果判定待ちだけを置く。検証コマンドと実装履歴は `.claude/skills/analytics/*-improvement/reference/improvement-log.md`、完了履歴は Git を参照する。

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| PERF-WORKER-P99-01 | Workers traces / GraphQLでCPU p99 1.48〜2.02秒・wall p99 3.80〜4.61秒の支配route / R2 bindingを特定してから対象routeだけを修正する。route 別の内訳は Cloudflare Dashboard の Workers Observability でオーナーが確認する [kpi: site-health] | pending | 2026-10-12 | uruhayato373 | performance |
| AFF-RESOLUTION-EFFECT-01 | 広告の意図軸を「出典調査 → タグ → カテゴリ」に統一 (#913)。**baseline (GA4 28 日 〜2026-08-28)**: 23,771 imp / 11 click / CTR 0.046%、furusato 1,307 imp 0 click、economy 8,329 imp 3 click。試算の行き先: ranking economy 35,613→6,746・furusato 2,904→31,465 imp/週。[target: furusato imp +20,000/28日、全体 CTR ≥ 0.10%]。**デプロイ済 2026-09-03 10:51 JST** (PR #915、main `ddcfb8b3a`。backlog `AFF-DEPLOY-RESOLUTION-01` は 09-18 に本番実測で回収: natto ranking に金融/economy A8 なし、身長 ranking に意図軸広告なし、地方債 blog 本文が furusato)。4 週後 = 10-01 以降に `fetch-affiliate-ga4.cjs 28` を vertical 別に before/after。同時デプロイの `AFF-IMPRESSION-ROUTING-01` と窓が重なるので position 別に分けて読む (guard: confounded) [kpi: affiliate-yield] | pending | 2026-10-08 | claude | affiliate |
| R2-STORAGE-01 | **2026-09-27実測**: `.claude/state/metrics/cloudflare/history.csv` の r2_storage_gb は09-07 23.007GB→09-26 33.368GBまで増加が続き、無料枠 (10GB) 超過が悪化している。doboku-note-archive 8.98GBの保持方針 (許容 or 削減) がオーナー判断待ちで未決のまま [kpi: operating-cost] | pending | 2026-10-12 | uruhayato373 | cloudflare-cost |
| AFF-IMPRESSION-ROUTING-01 | AdSense停止中のranking/area空き位置へ既存の文脈一致バナーを配線。baselineは4,299 imp / 6,055 PV = 0.710 imp/PV。**2026-09-13 14:02:32 JSTにPR963を本番反映**（main `f09ac2ca978e501b29b9f8c9d1c81b9872601d98`、[Deploy 34739098468](https://github.com/uruhayato373/stats47/actions/runs/34739098468) success）。Rakuten 34726845212は373有品・137正常空・0失敗、510 canonical全一致。追加GA4実測はbaseline扱いとし、効果は未確定。T48hの2026-09-15に計装・発火重複を確認し、T14dの2026-09-27に確定済みで重複しない期間を明示して、同一cohort/placementのimp/PV・CTR・engagementを比較する。`node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28` は当日を含む29日間のため、そのまま正確なafter窓としない。期間・標本不足なら判定を保留し、計装・流入構成・重複を再検証する。PR963の同時変更はguard: confoundedとして扱う。詳細根拠: `.claude/skills/analytics/affiliate-improvement/reference/improvement-log.md`、`.claude/state/metrics/releases/2026-09-13-all-sessions.json`。 [kpi: affiliate-yield] | in-progress | 2026-09-27 | claude | affiliate |

## Tier 2 (P2)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| NOTE-KAKEI-REDESIGN-EFFECT-01 | note家計シリーズ47本の決定的テンプレ化(図5枚・根拠指標・商品カード)後のPV変化を判定する。**2026-09-15実装完了・全数本番反映済み**: baseline PV中央値2 (2026-08-17〜09-13、47本合計108PV、note dashboard latest.json)。[target: PV中央値 baseline比+50%以上 または 47本合計PV +100以上]。検証コマンド: `npm run note:metrics:fetch` で2026-09-15以降4週分を取得し、series A (a-kakei-*) のPV中央値・合計をbaselineと比較する [kpi: paid-purchases] | pending | 2026-10-13 | claude | content |
| BLOG-SRCLINK-01 | source-link配置是正(2026-07-24、commit 690b6a08c、main反映済)後のブログ→ranking回遊を判定する。**2026-09-24実測(GA4 Data API、Japan、週次)**: /ranking/へのpage_viewのうちpageReferrerが`stats47.jp/blog/`を含む比率は、是正前W26–W29平均8.13%(382/4,699)→是正後W31–W38平均7.43%(1,134/15,268)で上昇は観測されない。想定値[target]は未設定(guard: insufficient-target)。同W35に85本の一括公開がありguard: confoundedのため単独効果は確定しない。effect/full・effect/partialは付けない。継続観測は週次snapshotに新設した`internal-transitions.csv`(コミット3ea0fece3)を使う。W38(2026-08-23〜09-19)はblog→ranking 730 page_view。検証コマンド: `npm run fetch-ga4-snapshot -- <YYYY-Www>`。次回は一括公開の影響が薄いW39以降を4週分蓄積してから判定する [kpi: site-circulation-rate] | effect/pending | 2026-10-19 | claude | ga4 |
| THEME-EXPANSION-EFFECT-01 | 2026-09-11公開の全55テーマで、構成拡充が国内PV・GSC表示・回遊に寄与するか品質と併せて観測する。新規34はbaselineなしのlaunch、既存構成21は2026-07-12〜09-05の同一56日窓baseline（外国人PV11・表示15を含む）を使う。d7品質=2026-09-18、d28暫定=2026-10-09、d56基本観測=2026-11-06。2026-09-13にPR963を本番反映（[Deploy 34739098468](https://github.com/uruhayato373/stats47/actions/runs/34739098468) success）。今回の同時変更はguard: confoundedとして記録し、初回公開日・55件のbaseline・観測日程は更新しない。Issue #957の503発生原因は未確定で再観測中。2026-09-13の[テーマ監査 34739779902](https://github.com/uruhayato373/stats47/actions/runs/34739779902)は55テーマ110件の初回107PASS/3FAIL。railway（390px）のrailway-freight-trend、tourism（390px）のtheme-tourism-hotel-supply-trend、real-income（1440px）のreal-income-cpi-breakdownでchart取得503を観測した。初回HTML・応答・cf-ray・画像を同runのtheme-followup-evidence artifactに保持。原因切り分けと必要な修正・本番再確認は未完了で、review stepも記録時点では実行中のためworkflow全体successとはしていない。確認: `npm run theme:portfolio:audit`。PR954の不完全HTML対策（8MiB上限・再取得1回）を反映した当時の本番build `DPaW5i_gnBuIKcU6veJqI` では初回109/110PASS、全110件でHTML complete・JSエラー0。real-incomeのPC表示で1図の503を観測し、PC・mobile各3回の再確認は6/6PASS。初回失敗原本を保持し、503の発生原因・HTMLストリームの上流終了要因は未確定。通常URLのHTML確認10/10、出典・県別画面43/43、HTTP147/147PASS。次回およびd7の9/18にpopulation-dynamics・regional-energy（各1440px）、railway・tourism（各390px）、real-income（PC・mobile）を再観測し、503・React #418・Connection closed・章欠落の再発時は失敗URL・応答status/headers・cf-ray・配信HTMLを保存して原因を切り分け、担当へ修正を引き渡す。詳細証拠は下記全体実装記録を参照する。低標本はcountのみ、未計装の回遊はnot-instrumentedとし、期間不足・同時変更・季節性・想定効果値未設定では効果を確定しない。d56で標本・期間が不足する場合は欠測・観測窓・導線を検証し、次期日と再検証を記録する。新規の継続・改善・保留はlaunch-reviewへ記録する。**2026-09-24実測**: d7品質チェックポイント(2026-09-18)を`.claude/state/themes/ci-review.json`で確認した。前回503が散発したpopulation-dynamics・regional-energy・railway・tourism・real-incomeを含む全55テーマ110件のチャート取得が110/110 PASSしproblems:[]で再現せず、原因は未確定の散発事象のままd28再評価まで解消と断定しない。`.claude/state/themes/experiments.json`は全34件のexperimentでd7がquality-only(quality.status=ok・missingKeys 0)のみを記録しており、GA4 pageViews・GSC impressionsの実測は設計どおりまだ行っていない。次はd28暫定判定(2026-10-09)でbaselineとの差分・insufficient-target/insufficient-sampleガードの該当有無を確認し、標本・期間が不足すれば欠測・観測窓・導線を検証して次期日を更新する。根拠: `.claude/state/themes/experiments.json`、`.claude/state/metrics/themes/2026-09-11-baseline-aligned.json`、`.claude/state/metrics/themes/2026-09-10-all-expansion.json`。**効果判定エンジン対象外**: 55テーマ横断の独自baseline・d7/d28/d56体制で判定するため、既存のd7品質→d28暫定→d56基本観測のチェックポイントで判定を継続する [kpi: search-clicks] | effect/pending | 2026-10-09 | theme-portfolio-manager | ga4/gsc/theme-quality |
| NOTE-CIRCULATION-PILOT-01 | 2026-09-06に高view 3記事へ次記事+マガジンの素URLカードを反映し、続けて公開222記事を全量是正（95タグ以上222/222、サイト184、関連記事180、マガジン157、live監査error/warning 0）。Japan 28日 baselineは対象着地80/86/4 sessions、遷移先note viewは取得対象の2件だけ保存（1件欠測）。2026-10-04以降に同条件で着地session・次記事view増分を比較する（guard: note内clickは直接取得不可、同一landingの複数記事混在） [kpi: paid-purchases] | effect/pending | 2026-10-04 | claude | ga4/note |

## Tier 3 (P3)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| DEPS-RENOVATE-01 | Renovate App が未稼働 (renovate.json はあるが PR/ブランチが 0 件)。GitHub App のインストールはオーナー操作。**2026-09-07実測**: `gh pr list --search "author:app/renovate"` = 0件で未稼働。**本run (improvement-triage) はgh操作が権限外のため再実測なし**、次回に再確認する。DEPS-MAJOR-SECURITY-01は別経路 (Dependabot security alerts) で解消済のため緊急度は当初より低い [kpi: site-health] | pending | 2026-10-12 | uruhayato373 | security |

## 実行手順（レビュー文書から移行）

### `RANKING-GONE-RESTORE-01`

1. `audit-ranking-data-integrity.ts` と既知キー・sitemap生成のcheck modeを実行し、item・values・KNOWN・sitemapの欠落0を確認する。
2. 誤410から復帰した56 URLのGSC impressions、coverage、代表URLのGooglebot statusを確認する。
3. values欠損は `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01` と分離し、キー同期成功だけでデータ復旧と判定しない。
4. 週次integrity gateが継続成功し、56 URLの判定が揃ったらGSC improvement logへ記録してこの行を削除する。
