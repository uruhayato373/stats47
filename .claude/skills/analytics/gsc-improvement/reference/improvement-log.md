# GSC 改善ログ

GSC（Google Search Console）の継続的追跡と改善施策の記録。

> **2026-04-25**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づく rewrite 後の新しい log。旧版は `archive/improvement-log-until-2026-04-21.md` 参照。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（例: 「URL Inspection 2026-04-25 取得 / `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [PHASE-NN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <データ源 or 過去事例リンク>]
- **検証コマンド**: <curl / wrangler / API 呼び出し>
- **実測 (before)**: <値 + 取得日 + 取得コマンド>
- **実測 (after)**: <値 + 取得日 + 取得コマンド>
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] URL Inspection API daily で coverageState 別件数の前後比較を取った
- [ ] 仕様主張がある場合、Google 公式ドキュメント URL を引用した
- [ ] 比較対象（before / after / baseline）が明確
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」等）を使っていない
- [ ] 効果が想定の 80% 未満なら、未達理由仮説と次の検証コマンドを書いた

未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。

---

## Action Log

### [PHASE-9] middleware + sitemap ゼロベース再構築

- **デプロイ日**: 2026-04-26 / コミット: `b4b7a31c` (P0) + `bb4303e9` (P1) + `4dec30e5` (P2-A) + `0ec26659` (P2-B+C) + `e97b6db7` (smoke-test fix)
- **PR**: #121 (本体 4 commit) + #122/#123/#125 (hotfix)
- **背景**: 9 個の累積 Fix で middleware/sitemap の整合性が破綻、Google から「設計が定まっていないサイト」と判定。批判レビュー (2026-04-26) で 7 致命傷を特定:
  1. `gone()` の `Cache-Control: no-store` がクロール予算を 410 群に吸収
  2. 削除シグナルが 410/200+noindex/200 に分裂
  3. 301→410 リダイレクトチェーン
  4. sitemap 重複 URL 3 件 (manufacturing-net-value-added-private 等)
  5. lastmod が bulk timestamp で全件同一 → Google が無視
  6. INDEXABLE_AREA_CATEGORIES が middleware [population, economy] vs sitemap [population] で乖離
  7. KNOWN_*_KEYS が 28 日古い、自動同期なし

- **施策内容**:
  - **P0**: `gone()` を `public, max-age=86400, s-maxage=604800` + `X-Robots-Tag: noindex` / sitemap 重複排除
  - **P1**: UrlPolicy データ層導入 (`apps/web/src/lib/url-policy.ts`) + middleware 4 セクション再構築 + 301→410 解消 + lastmod 戦略変更（ranking 削除 / blog は published_at 固定 / tag は集計）
  - **P2-A**: KNOWN_*_KEYS 自動同期 workflow (`.github/workflows/sync-known-keys.yml`、毎日 JST 07:00)
  - **P2-B**: middleware で RSC 以外の Vary を `Accept-Encoding` のみに最小化
  - **P2-C**: sitemap index 化、8 segment (static/themes/areas/ranking/blog/categories/surveys/tags) 分割

- **想定効果**: クロール予算 -40%（業界実績、CDN cacheable 410 化）→ 1 ヶ月で「クロール済み未登録」-3,000 〜 -5,000 件
  [根拠: Google 公式 https://developers.google.com/search/docs/crawling-indexing/http-caching + Phase 6 既存施策の URL Inspection API 観測パターン]

- **検証コマンド**:
  ```bash
  # P0: 410 cache control
  curl -sI https://stats47.jp/dashboard/13000 | grep -iE "cache-control|x-robots"

  # P1: 301→410 解消
  curl -s -L -o /dev/null -w "%{http_code} hops:%{num_redirects}\n" \
    https://stats47.jp/ranking/prefecture/non-existent-key

  # P2-B: Vary 最小化
  curl -sI https://stats47.jp/ | grep -i "^vary:"

  # P2-C: sitemap index
  curl -s https://stats47.jp/sitemap.xml | head -15

  # 全体効果: URL Inspection daily の coverageState 別件数推移
  cat .claude/state/metrics/gsc/url-inspection/LATEST.md
  ```

- **実測 (before, 2026-04-25 baseline)**:
  - URL Inspection 301 URL サンプル: PASS 206 / クロール済未登録 27 / 検出未登録 16 / 404 40
    取得: `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`
  - GSC 全体 (W17): Clicks 424 / Impressions 14,373 / CTR 2.95% / Avg Pos 10.50
    取得: `.claude/state/metrics/gsc/LATEST.md`
  - 登録済み 1,860 / 未登録 16,628 / 5xx 2,047 (W17 snapshot)

- **実測 (after, デプロイ直後 2026-04-26)**:
  - **本番動作確認**: 全 5 項目想定通り動作（PR #121 コメント参照）
    - `cache-control: public, max-age=86400, s-maxage=604800`
    - `x-robots-tag: noindex`
    - `vary: Accept-Encoding`
    - sitemap index 8 segment 完備
    - sitemap 重複 0 件
  - **GSC 効果反映**: URL Inspection daily で観測予定（4/27 早期警戒 / 5/02 中間判定 / 5/09 W18 終了判定）

- **判定**: effect/pending [根拠: デプロイ直後、Google 反映観測未完]
  - 早期警戒: 4/27-28 で再クロール件数 / 日 > 5
  - 5/02 cutoff 目標: 登録済 > 2,000 (+140) / 未登録 < 14,500 (-2,128)
  - 5/09 cutoff 目標: 登録済 > 2,300 / 未登録 < 12,000

- **未確定 / 仮説**:
  - **[仮説]** Cache-Control: public 化により Google のクロール頻度が下がり、新コンテンツへ予算が回る
    検証コマンド: `node .claude/scripts/gsc/url-inspection-daily.cjs` で再クロール件数の日次推移
    検証期日: 2026-05-09
    期日後判定: 再クロール件数 > 50/日 なら仮説支持、< 10/日 なら仮説棄却

  - **[仮説]** sitemap index 化により Google が segment ごとに submission を認識し、ranking 338 / blog 121 / areas 141 のうちどこが詰まっているか分離可能
    検証: GSC ダッシュボードの「サイトマップ」セクションで各 sitemap-{n}.xml の登録進捗を観測
    検証期日: 2026-05-02

- **5/9 撤退/継続ライン（2026-04-27 事前固定、判定時に動かさない）**:
  - **継続条件 (PHASE-10 着手)**: W18 (5/2) 時点で Impression > 16,000 OR W19 (5/9) 時点で 登録済 > 2,200 / 未登録 < 14,500
  - **撤退条件 (技術 SEO 注力停止、コンテンツ路線へ切替)**: W19 (5/9) 時点で Impression < 15,000 かつ 登録済 < 2,000
  - **どちらにも該当しない場合 (中間)**: PHASE-9 を effect/partial で確定、その時点で URL Inspection で coverageState 別の差分を再評価
  - **根拠**: W17 baseline は Imp 14,373 / 登録済 1,860 / 未登録 16,628。撤退ラインは「6 週間で改善幅 5% 未満」を不発と判定する一般的な SEO 観測サイクルに基づく
  - **注意資源方針**: 5/9 までは新規 middleware/sitemap 修正を行わない。観測のみ。エンジニアリング工数はコンテンツ生成（ブログ・Instagram・note）に振り替える

- **2026-04-27 中間検証 (実装層)**:
  - **結果**: ✅ middleware/canonical 完全動作
  - **検証文書**: `.claude/state/metrics/gsc/middleware-verification/2026-W17.md`
  - **判定**: 実装層 effect/full（30/30 サンプルで 410 / canonical 設定確認）。Google 反映層は引き続き effect/pending
  - **PHASE-10 候補の取り消し**:
    - D-1 (`/blog/tags/` middleware 拡張): 不要（実測 30/30 が 410）
    - D-2 (/ranking canonical 修正): 不要（`generate-meta-data.ts:121-123` で完全実装済み）
  - **新発見**: SEO レビューで挙がった「middleware カバー外」「canonical 不備」の両仮説とも、**実証で誤りだった**。コードの上っ面パターンマッチングで仮説を立てるのは危険、curl 実証が必須。

- **2026-04-27 観測インフラ修正**:
  - GitHub Actions `gsc-url-inspection-daily.yml` の timeout-minutes を 20 → 30 に引き上げ（直近 run が 20m18s で cancel されていたため）
  - 1,500 URL 処理は約 8 分 + setup overhead を見込んで 30 分に余裕を持たせた

- **2026-04-27 PHASE-10 候補抽出 (A1 / A2 / A3)**:
  - **A1**: GSC last28d query 取得 (期間 2026-03-29 〜 2026-04-25)
    - 全クエリ 535 / 取得 Imp 1,747（GSC 全体 14,373 のうち 12%、残り 88% は匿名化 = GSC API 仕様）
    - Position 11-20 / Imp ≥ 10: **2 件のみ**（page-2 候補）
    - Position 4-10 / CTR 0% / Imp ≥ 10: **14 件**（機会損失候補、より大きなレバー）
    - 出力: `.claude/state/metrics/gsc/page2-queries-2026-W17.csv` / `ctr-zero-page1-queries-2026-W17.csv`

  - **A2**: 各クエリのヒット URL マトリクス取得
    - 16 クエリ → 13 URL（重複あり、1 URL に複数クエリ集約）
    - 出力: `.claude/state/metrics/gsc/page2-targets-2026-W17.csv` / `page2-url-aggregated-2026-W17.csv`

  - **A3 結果: 強化候補トップ 5（集約 Imp 順）**:

    | 順位 | URL | 集約 Imp | クエリ数 | Pos | 現状 SEO | 強化方針 |
    |---|---|---|---|---|---|---|
    | 1 | /blog/health-life-expectancy-structure | 104 | 1 | 12.0 | `seo_title` 設定済だが訴求弱い | リライト: 1 位県名・差分値入り (例: 「【2023】健康寿命ランキング47都道府県｜1位大分県・47位岩手県・差2.33歳」)|
    | 2 | /ranking/starting-salary-highschool | 59 | 3 | 6.9-9.0 | `seo_title` 設定済 | リライト: 1 位県名・金額入り |
    | 3 | /ranking/inpatient-rate-per-100k | 29 | 2 | 4.5-5.3 | **seo_title / seo_description が空** | 新規設定: 1 位県名・具体値入り（最大の機会、コスト最小）|
    | 4 | /blog/birth-rate-fertility-ranking | 19 | 1 | 5.1 | (要確認) | リライト |
    | 5 | /ranking/roadside-station-count | 14 | 1 | 11.2 | **seo_title / seo_description が空** | 新規設定: 1 位県名・駅数入り（最大の機会、コスト最小）|

  - **重要観察**: 全 5 候補で **CTR 0%**。順位 4-12 位なら CTR は通常 1-15% あるべき。**順位の問題ではなく、title/description の差別化問題が支配的**。
    - 候補 3, 5 は seo_title が **DB で空** → 設定するだけで CTR 0% → 5-10% の可能性大
    - 候補 1, 2, 4 は設定済だが訴求が弱い → 1 位県名・具体値リライト

  - **B1 + B3 のマージ**: コンテンツ加筆 (B1) と CTR リライト (B3) を分けるより、**5 件の seo_title / seo_description を一括再設計**するのが最小コスト最大効果。実装は DB UPDATE → `/sync-remote-d1` のみ（middleware / sitemap には触れない = PHASE-9 計測を汚さない）。

  - **次の Todo**: B1+B3 統合 として、5 件の seo_title / seo_description を DB に設定 + 反映。

### [PHASE-10] (B1+B3) トップ 5 SEO リライト本番反映

- **デプロイ日**: 2026-04-27 / Time Travel ブックマーク (sync 直前): `00003fdf-00000000-0000505a-dc965e7c2e8c9f96700d7a4586abce81`

- **対象 4 行** (5 候補のうち #4 fertility-rate-prefecture-gap は既存最適でリライト不要):
  1. ranking_items / starting-salary-highschool (Imp 59, Pos 6.9-9.0): seo_title リライト「【2023年】高卒初任給ランキング47都道府県｜1位 三重 20.8万円・47位 沖縄 16.5万円」
  2. ranking_items / inpatient-rate-per-100k (Imp 29, Pos 4.5-5.3): seo_title 新規設定「【2023年】入院受療率ランキング47都道府県｜1位 高知 1,785人・47位 神奈川 665人 (10万人あたり)」
  3. ranking_items / roadside-station-count (Imp 14, Pos 11.2): seo_title 新規設定「道の駅 数ランキング47都道府県｜1位 北海道 110か所・47位 東京 2か所 (2018年)」
  4. articles / health-life-expectancy-structure (Imp 104, Pos 12.0): seo_title リライト「【2023年】健康寿命ランキング47都道府県｜1位 大分県・47位 岩手県・差2.33歳」

- **共通設計原則**: 1 位県名・47 位県名・年度・具体値（数値+単位）・「47都道府県」キーワードを必ず含める。これにより「健康寿命ランキング 都 道府県 2023」のような具体的検索意図に直接マッチ + SERP 表示時に数値が目を引く

- **想定効果**: 4 件 × 平均 Imp 50 × CTR 改善 0% → 5% = +10 Click/月（短期、Google 再クロール後）。長期的には CTR 5-15% で +30-50 Click/月。
  根拠: 順位 4-12 位の標準 CTR は 1-15% (Advanced Web Ranking 2024 等の業界統計)。現状 0% は title が検索意図と乖離 or 訴求不足のシグナル

- **検証コマンド**:
  ```bash
  # 本番 D1 の現値確認
  cd apps/web && npx wrangler d1 execute stats47_static --remote --env production --json -y \
    --command "SELECT ranking_key, seo_title FROM ranking_items WHERE ranking_key IN ('starting-salary-highschool','inpatient-rate-per-100k','roadside-station-count') AND area_type = 'prefecture';"
  
  # 本番 origin の <title> 確認 (Googlebot UA)
  for url in https://stats47.jp/ranking/inpatient-rate-per-100k \
            https://stats47.jp/ranking/roadside-station-count \
            https://stats47.jp/ranking/starting-salary-highschool \
            https://stats47.jp/blog/health-life-expectancy-structure; do
    echo "=== $url ==="
    curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "$url" | grep -oE '<title>[^<]+</title>' | head -1
  done
  
  # 5/2 (W18) と 5/9 (W19) で当該クエリの CTR 推移を再測定
  /fetch-gsc-data last28d query
  ```

- **実測 (before, 2026-04-27 baseline、UPDATE 直前)**:
  - 本番 D1: ranking_items 2 件で seo_title NULL、1 件で「高卒初任給ランキング 都道府県別【2023年｜47都道府県比較】」(具体値なし)、articles 1 件で「都道府県別 健康寿命ランキング｜寿命は延びたが不健康期間も延びた」(年度・具体値なし)
  - GSC W17: 4 候補すべて CTR 0%、合計 Imp 206
    取得: `.claude/state/metrics/gsc/page2-targets-2026-W17.csv` / `page2-url-aggregated-2026-W17.csv`

- **実測 (after, 2026-04-27 デプロイ直後)**:
  - 本番 D1: 4 行すべて新 seo_title が rows_written=1 で UPDATE 成功
  - 本番 origin: 4 URL すべて新 `<title>` を即時返却（ISR キャッシュをすり抜け、revalidate 発動）
  - 完全な検証ログ: 本ファイルの直前のコマンド出力 + 上記 Time Travel ブックマーク

- **判定**: effect/pending [根拠: デプロイ直後、Google 再クロール待ち]
  - 早期警戒: 5/2 (W18) で当該 4 URL の CTR が依然として 0% なら title が SERP に反映されていない可能性。Google Search Console URL Inspection で再クロールリクエスト
  - 5/2 cutoff 目標: 4 URL 合計 Click +5（1 件あたり 1 click 以上）
  - 5/9 cutoff 目標: 4 URL 合計 Click +10、CTR 平均 5% 以上

- **未確定 / 仮説**:
  - **[仮説]** 1 位県名と具体値を入れた title が CTR を 0% → 5%+ に改善する
    検証: 上記 5/2 / 5/9 GSC スナップショット
    検証期日: 2026-05-09
    期日後判定: 4 URL の CTR 平均 ≥ 3% で仮説支持、< 1% で仮説棄却（その場合は別の要因 — 順位低下や検索意図の不一致）

- **PHASE-9 単一変数効果計測との分離**:
  - 本施策は middleware / sitemap / canonical には触れていない（DB UPDATE のみ）
  - PHASE-9 effect 判定（5/9）における登録ページ数・未登録件数の変化には影響しない
  - title/description リライトは「既存登録済 URL の CTR 改善」が目的のため、PHASE-9 (インデックス覆瀾改善) と独立に評価可能

### [PHASE-10] (B2-1) 新規記事追加: 病床利用率マップ

- **デプロイ日**: 2026-04-27 / Time Travel ブックマーク (sync 直前): `00003fe2-00000000-0000505a-2b5f5eb2f957adf1d3c3be42e22c88ed`
- **slug**: `hospital-bed-utilization-map`
- **公開 URL**: https://stats47.jp/blog/hospital-bed-utilization-map
- **公開フロー**: ローカル draft → publish-article → sync-articles (ローカル D1) → wrangler r2 object put × 6 ファイル → wrangler d1 execute INSERT (本番 D1) → 本番 origin で HTTP 200 確認

- **記事構成**:
  - title: 「病床は埋まっているか? 47都道府県」
  - seo_title: 「47都道府県の病床利用率ランキング2023｜佐賀81.5%・福島64.9%で16.6pt差」
  - チャート 4 個 (タイルマップ / 上位下位 bar / 受療率散布図 / 医師数散布図)
  - 内部リンク: 4 ranking ページ + 2 既存ブログ記事

- **想定効果** (3 ヶ月):
  - GSC 既存クエリ「一般病床の病床利用率が最も高い都道府県」(4 表現で計 Imp 284 / 月) の受け皿として確実な Click 化
  - 期待 Click +30-50/月 (CTR 5-10% 仮定)
  - 関連クエリ拡大による Imp +200-400/月
  - 既存 `/ranking/inpatient-rate-per-100k` (B1+B3 強化済) への内部リンクで相乗効果

- **検証コマンド**:
  ```bash
  curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
    https://stats47.jp/blog/hospital-bed-utilization-map | grep -oE '<title>[^<]+</title>' | head -1
  
  # 5/2 (W18) と 5/9 (W19) で当該記事の Imp / Click を再測定
  /fetch-gsc-data last28d page
  ```

- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]
  - 5/2 cutoff 目標: ページ単位 Imp > 10 (Google が認識)
  - 5/9 cutoff 目標: ページ単位 Click > 5、関連クエリ群 (病床利用率系) 合計 Imp > 350

- **B2 残タスク** (W18 以降に着手検討):
  - B2-2: 食卓マップ (豆腐/焼酎/昆布) 記事
  - B2-3: 県債 × 所得分析記事

### [PHASE-10] (B2-2) 新規記事追加: 食卓マップ (豆腐・焼酎・昆布)

- **デプロイ日**: 2026-04-27
- **slug**: `food-trio-prefecture-map`
- **公開 URL**: https://stats47.jp/blog/food-trio-prefecture-map
- **対象クエリ**: 豆腐 +500% / 焼酎 +400% / 昆布 +160% (前期比、GSC W17)
- **想定効果** (3 ヶ月): 食材消費系クエリのインデックス受け皿として +50-150 Click/月
- **独自切り口**: 3 食材の地域パターン比較 + 「宮城が豆腐 1 位で焼酎 47 位」「北海道は昆布産地なのに消費 46 位」「京都の昆布消費 45 位 = 質的消費」など意外性で訴求
- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]

### [PHASE-10] (B2-3) 新規記事追加: 県債は誰が返す?

- **デプロイ日**: 2026-04-27
- **slug**: `prefectural-debt-future-burden`
- **公開 URL**: https://stats47.jp/blog/prefectural-debt-future-burden
- **対象クエリ**: 県債 +175% / 地方債 +175% / 所得 都道府県 +160% (前期比、GSC W17)
- **想定効果** (3 ヶ月): 地方財政・人口構造クエリで +30-100 Click/月
- **独自切り口**: 既存記事 `local-government-debt-burden` (歳入比ベース) と被らない **「将来負担スコア = 県債歳入比 × 高齢化率 ÷ 現役世代比率」** という独自指標で世代間負担を可視化。秋田 148.3 vs 東京 14.1 で 10 倍超の差
- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]

### [PHASE-10] B2 サマリー (2026-04-27 完了)

新規記事 3 本を 1 日で公開完了。GSC で急上昇している 3 つのクエリ群（医療需給 / 食材消費 / 地方財政）の受け皿を確立した:

| 記事 | 想定 Click 増/月 | 想定 Imp 増/月 |
|---|---|---|
| /blog/hospital-bed-utilization-map | +30-50 | +200-400 |
| /blog/food-trio-prefecture-map | +20-50 | +100-200 |
| /blog/prefectural-debt-future-burden | +15-30 | +50-150 |
| **合計** | **+65-130/月** | **+350-750/月** |

5/2 (W18) と 5/9 (W19) の GSC snapshot で実測予定。あわせて、これらの記事は B1+B3 で強化した既存 ranking ページへの内部リンクハブとして機能し、相乗効果が期待できる。

- **2026-04-27 sitemap audit (B1+B3 並行調査)**:
  - 実装ファイル: `apps/web/src/app/sitemap.ts` + `apps/web/src/app/sitemap.xml/route.ts`
  - 実 sitemap 確認 (curl): 各 segment の URL 件数
    - 0 (static): 8 / 1 (themes): 17 / 2 (areas): 141 / 3 (ranking): 338 / 4 (blog): 121 / 5 (categories): 17 / 6 (surveys): 42 / **7 (tags): 0**
  - **🔴 発見 1: tags segment 0 件**
    - 期待値: ローカル D1 で `count(*) >= 5` のタグが 8 件 (regional-disparity, declining-birthrate 等)
    - 実 sitemap: 0 URL
    - 推定原因: `sitemap.ts:225-227` の `catch {}` が D1 アクセスエラーを握りつぶして空配列で fallback。エラーログなしのため真因不明
    - 修正案 (PHASE-11-1): `catch (e) { console.error('sitemap segment failed', e); return []; }` で観測性向上 → 本番デプロイ後 Cloudflare Pages logs で真因特定
    - 影響: 5+ 記事のタグ 8 件が Google にクロールされない（小規模だが取りこぼし）
  - **🟡 発見 2: lastmod が blog 以外なし**
    - PHASE-9 で「bulk timestamp 同一値で Google が無視」を回避するため意図的削除
    - 副作用: ranking が新年度データに更新されても Google に通知できない
    - 改善案 (PHASE-11-2): `ranking_data.max(updated_at) by ranking_key` を引いて URL ごとに lastmod 設定
  - **🟡 発見 3: INDEXABLE_RANKING_KEYS 338/1,920 = 17% のみ sitemap 入り**
    - 戦略判断による 80% 除外。残り 1,582 件は 410 で意図的に index 除外
    - 5/9 効果判定後に再選定するか継続するかは経営判断 (PHASE-11-3)
  - **5/9 まで sitemap には触らない方針** — PHASE-9 単一変数効果計測の独立性確保のため

### [PHASE-9-FOLLOWUP] Cloudflare token 集約 + Smoke Test cascade fix

- **対応日**: 2026-04-26 / コミット: `e97b6db7`
- **内容**:
  - Cloudflare API token を「stats47」1 個に集約（D1 Edit + R2 Storage Edit + Pages Edit + Account Settings Read）
  - 旧 token 7 個を Cloudflare ダッシュボードから削除
  - GitHub Actions の PR 作成 permission を有効化（`gh api -X PUT /repos/.../actions/permissions/workflow`）
  - Phase 9 デプロイで smoke-test の `/areas/01000/landweather` 200 期待が 410 仕様と矛盾し失敗 → smoke-test を 410 期待に修正 + `population` ケース新設

- **教訓**: middleware 仕様変更時は **post-deploy smoke test を事前更新** すること（→ knowledge 記録: 「Phase 9 deploy が smoke-test を破壊した cascade」）
