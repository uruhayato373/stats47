---
type: improvement-log
metric: gsc
created: 2026-05-16
updated: 2026-05-17
---

# GSC 改善ログ

施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

## [CTR-AUTO-01] CTR 改善候補の月次自動抽出 (Phase 3 sprint)

- **status**: in-progress
- **tier**: 2
- **target_metric**: blog-ctr / ranking-ctr
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-21 (W25, 初回 fire 後の判定)
- **related_plan**: `docs/02_実装計画/seo-todo-unify-phase-1-3.md` Phase 3

### 進捗 (2026-05-18)

Phase 3 sprint で 2 ファイル追加:
- `.claude/scripts/gsc/extract-low-ctr-queries.mjs` — 業界平均 CTR (Backlinko 2023) と比較し position 5-15 帯の改善候補抽出
- `.github/workflows/ctr-improvement-monthly.yml` — 毎月 5 日 09:00 JST 自動 fire、`[CTR Improvement Candidates] YYYY-MM` Issue 起票

最新 W21 snapshot で動作確認: 8 候補抽出 (小麦粉消費量関連クエリが上位)、期待 +Clicks 計算正常。

### 残作業

- ラベル作成: `gh label create ctr-improvement-candidate --color FFA500 --description "CTR 改善候補 (月次自動抽出)"`
- 6/5 初回 fire 後、`[CTR Improvement Candidates] 2026-06` Issue を確認
- 上位 3 候補に `/brushup-blog-article` で seoTitle 改訂案を作成 (人手)

## [BLOG-CTR-02] SEO タイトル改修 10 件 + 新規記事 6 本 (2026-W19 → 2026-W21)

- **status**: pending (要 2026-W21 以降の継続観測)
- **tier**: 2
- **target_metric**: blog-ctr / ranking-ctr
- **deployed_at**: 2026-05-17
- **before**: 2026-W19 / **after**: 2026-W21

### SEO タイトル改修 10 件 (検索クエリ別集計)

| metric_key | クエリ含むテーマ | impressions | clicks | CTR | position |
|---|---|---|---|---|---|
| `wheat-flour-consumption-quantity` | 小麦粉 | 357→366 (+9) | 2→2 (+0) | 0.6%→0.5% (-0.01pp) | 6.4→6.5 (+0.0) |
| `starting-salary-highschool` | 高卒初任給 | 108→138 (+30) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 7.9→8.0 (+0.1) |
| `post-office-count` | 郵便局数 | 0→0 (+0) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 0.0→0.0 (+0.0) |
| `inpatient-rate-per-100k` | 入院受療率 | 12→8 (-4) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 4.6→3.7 (-0.8) |
| `total-fertility-rate` | 合計特殊出生率 | 64→49 (-15) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 12.3→14.6 (+2.3) |
| `sake-consumption-quantity` | 清酒/日本酒 | 43→47 (+4) | 1→1 (+0) | 2.3%→2.1% (-0.20pp) | 8.8→8.9 (+0.1) |
| `fresh-udon-soba-consumption-quantity` | うどん | 104→288 (+184) | 4→8 (+4) | 3.8%→2.8% (-1.07pp) | 8.6→7.7 (-0.9) |
| `konbu-consumption-quantity` | 昆布 | 120→128 (+8) | 6→4 (-2) | 5.0%→3.1% (-1.88pp) | 7.4→7.3 (-0.2) |
| `outpatient-rate-per-100k` | 外来受療率 | 17→15 (-2) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 9.2→9.3 (+0.0) |
| `chicken-consumption-quantity` | 鶏肉 | 53→97 (+44) | 2→4 (+2) | 3.8%→4.1% (+0.35pp) | 8.4→8.6 (+0.2) |

**SEO 10 件合計**: clicks 15 → 19 (+4)

### 新規記事 6 本 (ページ別集計)

| slug | クエリ含むテーマ | クエリ集計 impressions | ページ集計 impressions/clicks |
|---|---|---|---|
| `healthy-life-expectancy-male-female-gap` | 健康寿命 | 223 (33 クエリ) | 0 / 0 clicks |
| `prefectural-height-male-female-gap` | 平均身長 | 305 (68 クエリ) | 0 / 0 clicks |
| `roadside-station-prefecture-gap` | 道の駅 | 27 (8 クエリ) | 0 / 0 clicks |
| `sugar-consumption-prefecture-gap` | 砂糖消費量 | 26 (1 クエリ) | 0 / 0 clicks |
| `self-financing-ratio-prefecture-gap` | 自主財源 | 14 (3 クエリ) | 0 / 0 clicks |
| `abortion-rate-prefecture-gap` | 中絶/人工妊娠 | 31 (9 クエリ) | 0 / 0 clicks |

**新規 6 本合計**: ページ集計 clicks 0

### 判定

- 想定: SEO 改修 +200 clicks/月、新規記事 6 本で +50-100 clicks/月
- 実測: SEO 4 clicks 差、新規記事 0 clicks
- **[判定] effect/pending** — 2026-W21 は集計 1 週分のみ、最低 2-4 週連続観測してから effect/full または effect/partial を確定する (.claude/rules/evidence-based-judgment.md 準拠)

### 検証コマンド

```
node .claude/scripts/blog/measure-gsc-impact.mjs 2026-W19 <新しい週>
```

## [BLOG-CTR-01] manufacturing-aichi-dominance seoTitle/description 改訂 (W20)

- **status**: pending
- **tier**: 2
- **target_metric**: blog-ctr
- **deployed_at**: 2026-05-16
- **related_plan**: `docs/03_週次運用/週次計画/2026-W21.md` Should「ブログ CTR 改善 30分1本」

### 背景
- W19 GSC: `manufacturing-aichi-dominance` impressions 280 / clicks 0 / CTR 0% / position 7.5
- 上位クエリ (位置 6-12): 「愛知県 製造品出荷額」「愛知県 工業 一位」「愛知県 製造品出荷額 ランキング」など愛知県起点が多数
- 旧 seoTitle「都道府県別・製造品出荷額ランキング｜愛知58兆円一強の製造業地図」は generic キーワード「都道府県別」が先頭で検索意図とミスマッチ

### 施策
- seoTitle: 「製造品出荷額ランキング2023｜愛知58兆円・全国1位、沖縄と115倍差」
  - 検索意図上位の「製造品出荷額ランキング」を先頭配置
  - 「2023」で recency signal 追加
  - 「愛知58兆円」「全国1位」「沖縄と115倍差」で具体性 + 差別化
- description: 「2023年最新版・47都道府県の製造品出荷額ランキング。1位は愛知58兆円、2位静岡17兆円、最下位沖縄0.5兆円で格差は115倍。工業地帯・産業別の集積構造も地図と表で可視化します。」
  - 冒頭に「2023年最新版」+ 具体数字 (58→17→0.5) で SERP プレビュー時の目を引きやすく

### 想定効果
- **想定 CTR**: 1-3% (position 7-10 帯の業界平均 2-5% / 過去 CTR 0% からの引き上げ)
- **根拠**: position 7.5 で同帯クエリの industry CTR (Backlinko 2023 ~3.3%) を参考。0% → 2% 達成すれば clicks +5-6/月。

### 検証
- **検証コマンド**: `NODE_PATH=/Users/minamidaisuke/stats47/node_modules node /tmp/gsc-page-queries.cjs`
  ```
  → manufacturing-aichi-dominance のクエリ別 CTR (last 28d) を取得
  ```
- **追加検証コマンド**: `node .claude/scripts/gsc/url-inspection-daily.cjs --slug manufacturing-aichi-dominance`
- **検証期日**: 2026-06-13 (W24, 4 週後)
- **期日後の判定**:
  - CTR ≥ 2% → effect/full
  - CTR 1-2% → effect/partial
  - CTR < 1% → effect/none。次の検証: 本文 H1 / hero 画像見直し or 別記事へ展開判断

### verification at 2026-05-16 deploy day
- **deploy 確認**: 2026-05-16 commit `63221bae` で seoTitle/description 改訂を D1 反映、R2 push、`/sync-snapshots --only blog` 実行済み
- **Google 反映タイムライン**: 全施策の Google 反映完了見込みは 5/15 (W19-W18 ロードマップ Phase 5 既定)、本施策は 5/16 deploy のため実測値取得は **2026-06-13 (W24, 4 週後)** 期日に従う
- **status**: pending（実測未取得のため effect 判定なし）

### デプロイ手順 (記録)
1. `.local/r2/app/blog/manufacturing-aichi-dominance/article.md` の frontmatter を編集
2. R2 push: `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/blog/manufacturing-aichi-dominance`
3. **重要**: ブログメタデータの source of truth は `app/blog/all.json` snapshot。`.claude/skills/db/sync-snapshots/run.sh --only blog` で D1 → all.json 再生成 + R2 push 必須
4. Cloudflare Pages 再デプロイ (build 時に新 all.json を fetch して prerendered HTML に焼き込む)

### 学び / 次のスキル改善候補
- ブログ記事のメタデータ更新は **article.md 編集 → R2 push だけでは反映されない**。`/sync-snapshots --only blog` + 再デプロイが必須
- `brushup-blog-article` スキルに meta description / seoTitle の編集が含まれていないため、CTR 改善時は別フロー
- TODO: blog metadata 更新を 1 コマンドで完結する skill（仮: `/brushup-blog-meta`）を提案 → automation-backlog に追加候補

## GSC 未登録 1.6 万件打開 — 観測短サイクル化 + sitemap 第 2 段階削減 (W17-W18)

- **status**: in-progress
- **tier**: 1
- **target_metric**: gsc-index-coverage
- **deployed_at**: 2026-04-25
- **related_issue**: #115 (closed)

## 背景・問題

stats47.jp の GSC インデックス状況が悪化し続けている。

- **登録済み**: 1,808 (4/10) → 1,860 (4/13)、ほぼ横ばい
- **未登録**: **16,628 件**、3 ヶ月で登録済み -60% / 未登録 +59% の急落
- ユーザー認識: 「対策しても効果がない、ブログ量産も意味がない」と判断停止寸前

## 真因の再診断（GSC 5 export と過去ログから判明）

1. **GSC export データの 5xx 972/1000 (97%) は `/correlation/` で、4/14 の middleware 410 化で対策済み** — Google の反映待ち（通常 2-4 週間）であり、施策は効いている可能性が高い
2. 404 1000 件、リダイレクト 1000 件、代替 canonical 880 件はほぼ **意図された 410/301 の進行中状態**で、新規対応不要
3. **クロール済み未登録 1000 件のうち /ranking 453 + /dashboard 199** が未解決の本丸。`KNOWN_RANKING_KEYS` middleware 対策（4/17 デプロイ）の効果測定が 5/01 中間判定で出る予定
4. 過去 2 週間の **Clicks +19.8% / CTR +0.20pt / Avg Position -2.46（改善）** は Tier 0/1 施策が効き始めている兆候

### 結論
**「効果ゼロ」感の正体は施策の失敗ではなく観測の遅延**。打ち手は (1) 観測サイクルを 2 週間 → 日次に縮める、(2) sitemap を 2,284 → 600 に第 2 段階削減してクロール予算をさらに絞る、(3) 上位 100 ranking のコンテンツ品質強化を裏で準備、の 3 本立て。

## 採用戦略

**案 A（観測短サイクル化）を土台に、案 B の sitemap 第 2 段階削減のみ即実行、案 C（コンテンツ品質）は準備のみ。**

## 既デプロイ施策の効果測定タイムライン

| 日付 | 中間判定 |
|---|---|
| 2026-04-28 | T1-CRAWL-01（FINAL） |
| 2026-05-01 | T0-RKG-200-01-v3, T0-CITY-500-01 |
| 2026-05-02 | T0-STATS-01, T0-THEME-01, T0-AREA-SUB-01 |
| 2026-05-15 | 全施策の Google 反映完了見込み |

## W17-W18 ロードマップ

### Phase 1: Issue 再構成（W17 月曜まで）
- 既存 26 件棚卸し完了（OPEN 5 / CLOSED 21）。CLOSED 21 件は適切に整理済み、再ラベル不要
- 本 issue で全体戦略を集約

### Phase 2: 観測短サイクル化（W17 内、案 A）
- URL Inspection API 日次測定スクリプト実装（`.claude/scripts/gsc/url-inspection-daily.cjs`）
  - 対象: GSC queries.csv の Impressions 上位 200 + KNOWN_RANKING_KEYS 上位 100 = 約 300 URL
  - 出力: `.claude/state/metrics/gsc/url-inspection/YYYY-MM-DD.csv` + `LATEST.md`
- GitHub Actions で毎朝 JST 06:00 に実行、本 issue へ bot コメントで日次 post
- → 関連 issue: #43

### Phase 3: sitemap 第 2 段階削減（W17 内、案 B 一部）
- `apps/web/src/app/sitemap.ts` を 2,284 → 600 URL に削減:
  - ranking 1,899 → 約 300（GSC Impressions ≥ 1 のキーのみ、新規 `INDEXABLE_RANKING_KEYS.ts`）
  - tag 閾値を 5+ に厳格化
  - INDEXABLE_AREA_CATEGORIES を population のみ 1 つに
- ranking 抽出スクリプト: `.claude/scripts/gsc/build-indexable-ranking-keys.cjs`

### Phase 4: コンテンツ品質強化の準備（W18 着手、案 C 準備）
- 上位 100 ranking キー抽出 → `.claude/skills/analytics/gsc-improvement/reference/priority-100-ranking-keys.csv`
- 校正テンプレ雛形: 「47 都道府県の一言コメント + 内部リンク 5 本 + FAQ 3 問 + Dataset 構造化データ」
- 着手判断: W18 中間判定で登録済み 2,300 以上なら C 着手 OK、横ばいなら B フル発動（GSC URL 削除リクエスト）に切替
- → 関連 issue: #76, #26

### Phase 5: 検証

| 指標 | Baseline (4/13) | W17 終 (5/02) 目標 | W18 終 (5/09) 目標 |
|---|---|---|---|
| 登録済み | 1,860 | 2,000 | 2,300 |
| 未登録 | 16,628 | 14,500 | 12,000 |
| 5xx | 2,047 | < 500 | < 200 |
| クロール済み未登録 | 2,339 | < 1,500 | < 1,000 |
| Clicks（週次） | 424 | 500 | 600 |

### ロールバック条件
- sitemap 削減後、登録済みが 1 週間で 1,500 以下に凹んだら sitemap を元に戻す
- URL Inspection API が API quota 超過したら対象 URL を 100 に縮小

## やってはいけないこと（落とし穴）

1. **5/01 までは新規 SEO 施策を投入しない** — 既存 Tier 0/1 と効果が混ざる
2. **Indexing API を URL deletion に転用しない** — 公式は job posting / livestream 用途のみ
3. **sitemap を 100 以下まで絞らない** — 登録済みも壊滅。300-600 が安全圏
4. **C 案を全 1,901 ranking キーに展開しない** — 上位 100 のみ
5. **ブログ量産と C 案の同時並行禁止**
6. **GSC URL 削除ツールは 6 ヶ月で復活する一時施策** — middleware 410 が前提

## 関連 OPEN issue

- #77 [T1-CANONICAL-01] 重複 user canonical 無し 534 URL の根本対策 — Tier 2 領域、本 issue で再評価
- #76 [T3-EEAT-02] 構造化データ拡充 — Phase 4 で扱う
- #43 [T0-DECAY-01] 404/5xx/soft-404 収束観測 — Phase 2 の URL Inspection API でこの観測を自動化
- #26 [T2-RANK-EDIT-01] ranking_ai_content schema 拡張 — Phase 4 の人間校正で実利用
- #24 [T3-SNS-01] SNS 投稿再開 — 独立軸、維持のみ

## 参照ドキュメント

- 計画ファイル: `/Users/minamidaisuke/.claude/plans/issue-gsc-1-6-modular-goblet.md`
- 過去施策ログ: `.claude/skills/analytics/gsc-improvement/archive/improvement-log-until-2026-04-21.md`
- GSC export 5 件分析（2026-04-25）: `/Users/minamidaisuke/Downloads/stats47.jp-Coverage-Drilldown-2026-04-25*.zip`

---

## Phase 6: 推測ベース判定の根絶（追加・2026-04-25 完了）

### 経緯
本 issue 本文に当初書いていた「Google の反映待ち（通常 2-4 週間）」「効き始めている兆候」などは、URL Inspection API で実証したところ **Google が 2026-03-09 以降ほぼ再クロールしていない**（lastCrawlTime 確認）ことが判明し、推測判定だったと撤回。詳細は本 issue 直前のコメント参照。

### 実装内容（完了）
1. **共通ルール `.claude/rules/evidence-based-judgment.md`** 新設（212 行、5 状況・NG ワード・検証コマンド集）
2. **CLAUDE.md 参照ガイド** に 1 行追加
3. **8 SKILL.md に「実証チェックリスト」追記**: `gsc-improvement` / `ga4-improvement` / `adsense-improvement` / `cloudflare-cost-improvement` / `seo-audit` / `weekly-review` / `critical-review` / `nsm-experiment`
4. **improvement-log 4 ファイル更新**: performance / sns-metrics に新規エントリテンプレ追加、gsc / ga4 archive に廃止注記
5. **計画ファイル + 親 issue 本文の推測表現訂正**

### 5/01 中間判定の指標を更新
| 指標 | Baseline (4/13) | W17 終 (5/02) 目標 | 取得方法 |
|---|---|---|---|
| 登録済み | 1,860 | 2,000 | URL Inspection API LATEST.md |
| 未登録 | 16,628 | 14,500 | GSC snapshot |
| 5xx | 2,047 | < 500 | GSC snapshot |
| **再クロール件数 / 日** (新規) | 不明（要計測開始） | > 50 / 日 | URL Inspection API lastCrawlTime の前日比 |
| 5xx URL の coverageState 移行率 (新規) | 0% | > 30% | URL Inspection API |

### URL Inspection API Baseline (2026-04-25 取得)
- 対象 URL 数: 301
- PASS（送信して登録されました）: **206 (68%)**
- クロール済み - インデックス未登録: 27
- 検出 - インデックス未登録: 16
- 見つかりませんでした (404): 40
- ページにリダイレクトがあります: 4
- URL が Google に認識されていません: 5
- 重複（user canonical 無し）: 3

### 関連
- ルール: `.claude/rules/evidence-based-judgment.md`
- 検証スクリプト: `.claude/scripts/gsc/url-inspection-daily.cjs`
- 日次バッチ: `.github/workflows/gsc-url-inspection-daily.yml`
- 関連 issue: #43 (T0-DECAY-01)

---

## T3-SNS-01: SNS 投稿再開 (Sprint 1)

- **status**: pending
- **tier**: 3
- **target_metric**: gsc-clicks
- **deployed_at**: 2026-04-18
- **related_issue**: #24 (closed)

### 施策 ID
- **Tier**: T3 (外部シグナル)
- **Category**: SNS
- **連番**: 01

### ターゲット指標
- [x] Clicks
- [x] Impressions

### 対象ページ / クエリ
- `/blog/health-life-expectancy-structure` 他 5 記事（Day 1-5）

### 想定効果値
- Sprint 1 終了時 Social 流入 +30%
- Day 1 単体の目標: 48h で X impressions 1,000+、RT 3+

### デプロイ情報
- **デプロイ日**: 2026-04-18 18:28 JST（Day 1）
- **PR**: -
- **コミット**: -（Playwright `publish-x.ts` 経由投稿）/ 対策 commit: `4b55c2d3`
- **本番反映**: [x] デプロイ済

### Day 1 投稿内容
**コマンド**: `npx tsx .claude/skills/sns/publish-x/publish-x.ts --domain blog --immediate health-life-expectancy-structure`
**投稿本文**:
```
日本の医師は47年で2.6倍に増えた。でも男性の"不健康な期間"は8.7年のまま縮まっていない。
健康寿命1位は大分（73.72歳）、47位は岩手（71.39歳）──その差2.33歳。医師数と健康寿命の
相関は意外にも弱い。データで見る日本の寿命の構造
[URL] #健康寿命 #統計
```
**画像**: 既存 OGP (`ogp.png` 62KB)
**UTM**: `utm_source=x&utm_medium=social&utm_campaign=sprint1_day1&utm_content=paradox`

### Day 2-5 即時投稿事故（2026-04-18 20:40 JST）
予約投稿の意図だったが `publish-x.ts` の予約モード検出セレクタが X UI 変更で壊れており、4 件全て即時投稿されてしまった。ユーザー判断で残置。Sprint 1 の UTM 日別分析は崩れたが、UTM `content` 別（paradox/shock/question）の A/B 比較は可能。

| Day | 意図 | 実投稿日時 | rankingKey | UTM content |
|---|---|---|---|---|
| Day 2 | 2026-04-20 21:00 | **2026-04-18 20:36 頃** | sports-spectating-consumption-expenditure | shock |
| Day 3 | 2026-04-21 12:30 | **2026-04-18 20:37 頃** | general-hospital-bed-occupancy-rate | question |
| Day 4 | 2026-04-22 12:00 | **2026-04-18 20:38 頃** | price-index-high-low-prefecture | question |
| Day 5 | 2026-04-23 19:30 | **2026-04-18 20:39 頃** | konbu-consumption-quantity | paradox |

### 対策（commit `4b55c2d3`）
- `publish-x.ts` を fail-safe 化（予約モード未確認なら Escape で投稿中止）
- `--dry-run` モード追加（初回 / セレクタ更新後の事前検証必須化）
- 失敗時 `.local/playwright-x-debug/` に screenshot 保存
- `knowledge/SKILL.md` に事故記録 + 汎用原則「ブラウザ自動化は fail-safe デフォルト」
- `x-strategist.md` に安全プロトコル追記

### 観測予定日
- **MID** (デプロイ + 14 日): 2026-05-02
- **FINAL** (デプロイ + 28 日): 2026-05-16

### 実測効果
| 観測日 | X impressions | X RT | Social 流入 (GA4) | 判定 |
|---|---|---|---|---|
| 2026-04-20 (+48h) | — | — | — | 観測予定 |

### マイグレーション元
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` (git commit `5cbcadd3`, 2026-04-21 時点)
