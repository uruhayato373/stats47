# NSM 改善実験パターン カタログ

`/nsm-experiment propose` が候補を生成するときに参照する典型パターン集。**progressive disclosure** で必要時のみ読まれる。

## 使い方

`/nsm-experiment propose` の assistant はこのカタログと現状メトリクス（`metrics-reader.mjs` の出力）を突き合わせ、適用可能なパターンを抽出する。各パターンには「何を見て適用判定するか」「何を計測するか」「期待 delta の目安」を記載。

**迷ったら**: 実装コスト 30 分以内 × 既に impressions が発生している対象、を優先。

---

## カテゴリ 1: 検索クエリ個別改善

### 1-A. 順位 5-15 位のクエリの title/description 改善

**適用条件**:
- GSC で `position` が 5-15 の範囲
- `impressions` が 7 日で 5 以上
- CTR が 5% 未満

**計測指標**: `gsc_position`（目標 3 位以内）、`gsc_ctr`（目標 2 倍）

**アクション**:
1. 該当クエリを含むページ URL を GSC で確認
2. 対象が県別ページ / ランキングページ / ブログ記事 / テーマダッシュボードのどれかを特定
3. `generateMetadata` の `title` と `description` を書き換え（対象キーワードを文頭に寄せる）
4. 具体性を高める（例: 「2024 年最新」「47 都道府県ランキング」）
5. デプロイ → 10-14 日待機

**効果判定の期間**: 10-14 日（GSC 3 日遅延 + 検索再評価の時間）

**期待 delta**: position -3、CTR +100〜200%

**ROI**: 高

### 1-B. 順位 15-50 位のクエリへのコンテンツ拡充

**適用条件**:
- GSC で `position` が 15-50
- クエリが既存ランキング / 記事 / テーマの主題と一致
- 既存ページの該当セクションが薄い（500 字未満、または AI コンテンツ未生成）

**計測指標**: `gsc_position`、`gsc_impressions`

**アクション**:
1. 該当ページのコンテンツ不足を特定
2. ランキング → `/generate-ai-content` で AI サマリを再生成 / 手動で解説追記
3. ブログ記事 → H2 セクション追加（500-1,000 字）+ 内部リンク
4. テーマ → 関連指標カード追加 or FAQ 追加
5. デプロイ → 14-21 日待機

**効果判定の期間**: 14-21 日

**期待 delta**: position -10、impressions +50%

**ROI**: 中

---

## カテゴリ 2: CTR 改善

### 2-A. インプレッション多・CTR 低のクエリへの description 改訂

**適用条件**:
- 上位 10 クエリのうち CTR < 平均 CTR
- 対象ページの meta description が 50 字未満 or 検索クエリとマッチしていない

**計測指標**: `gsc_ctr`

**アクション**:
1. 対象ページの `generateMetadata` 内 `description` を 80-160 字で書き換え
2. 検索意図を具体化（「〜ランキング」「〜都道府県別」「〜の実数」など）
3. デプロイ → 7-10 日待機

**効果判定の期間**: 7-10 日

**期待 delta**: CTR +50〜100%

**ROI**: 高（即効性あり、リスク小）

---

## カテゴリ 3: コンテンツ追加・ランキング拡充

### 3-A. 検索需要のある未登録ランキングの追加

**適用条件**:
- GSC 未対応だが関連キーワードで impressions が出ている
- 既存 `ranking_items` に対応ランキングが存在しない
- e-Stat API で取得可能な統計

**計測指標**: `gsc_impressions`（新規クエリ）、`ga4_engagedSessions`

**アクション**:
1. `/search-estat` で e-Stat 側の統計 ID を特定
2. `/register-ranking` でランキングを登録（ranking_items + ranking_data 投入）
3. `/generate-ai-content` で AI 解説生成
4. `/sync-remote-d1` でリモートへ反映
5. デプロイ → 21-28 日待機（インデックスから評価まで）

**効果判定の期間**: 21-28 日

**期待 delta**: 新規 impressions 20-100/月

**ROI**: 中（時間はかかるが積み上がる）

### 3-B. 新規ブログ記事の公開

**適用条件**:
- トレンドから需要のあるテーマ（`/discover-trends-all` で検出）
- 既存記事と重複しない
- ランキング / テーマへの導線を設計可能

**計測指標**: `gsc_impressions`（新規クエリ）、`ga4_engagedSessions`、ランキング / テーマへの遷移

**アクション**:
1. `/plan-blog-articles` でトピック企画
2. `/panel-review` で方向性チェック
3. 執筆 → `/proofread-article` → `/generate-article-charts`
4. `/publish-article` でデプロイ → 21-28 日待機

**効果判定の期間**: 21-28 日

**期待 delta**: 新規 engagedSessions 10-50 / 月

**ROI**: 中

---

## カテゴリ 4: 技術的 SEO

### 4-A. 構造化データ（JSON-LD）追加・強化

**適用条件**:
- ページ種別（ランキング / ブログ / テーマ）に対応する構造化データが未実装 or 貧弱
- 上位クエリで competitor がリッチスニペット獲得している

**計測指標**: `gsc_ctr`、リッチスニペット獲得率

**アクション**:
1. 対象ページ種別の SEO utility（`features/*/utils/generate-structured-data.ts`）を確認
2. FAQ / Dataset / BreadcrumbList / ItemList など目的に応じた schema 追加
3. デプロイ → 14-21 日待機

**効果判定の期間**: 14-21 日

**期待 delta**: CTR +30〜50%

**ROI**: 中

### 4-B. Core Web Vitals (CWV) 改善

**適用条件**:
- `/lighthouse-audit` で主要ページの LCP > 2.5s / INP > 200ms / CLS > 0.1 のいずれかに該当
- 特に LCP が遅いが SSR 成功しているページ

**計測指標**: `psi_lcp_ms`, `psi_inp_ms`, `psi_cls`, `psi_performance_score`

**アクション**:
1. PSI レポートで LCP 遅延の主因を特定（画像 / フォント / JS / SSR データ取得）
2. 対策:
   - 画像: `next/image`、WebP、loading="lazy"
   - JS: dynamic import、bundle 分割
   - データ: R2 キャッシュ確認、D1 クエリ最適化
3. デプロイ → 14-28 日待機（CrUX は 28 日移動平均）

**効果判定の期間**: 28 日以上

**期待 delta**: Performance score +10〜20、LCP -500ms 以上

**ROI**: 中（効果測定は長いが順位の直接シグナル）

### 4-C. インデックス未登録ページの原因特定

**適用条件**:
- 新規追加ページが公開後 14 日経過しても GSC で検索表示されない
- GSC カバレッジレポートで「クロール済み未登録」「発見済み未登録」等

**計測指標**: インデックス済みページ数

**アクション**:
1. GSC URL Inspection でインデックス状態を詳細確認
2. 問題別対応:
   - `CRAWLED_CURRENTLY_NOT_INDEXED` → 内部リンク追加、コンテンツ拡充
   - `DISCOVERED_CURRENTLY_NOT_INDEXED` → サイトマップ優先度、内部リンク強化
   - `PAGE_WITH_REDIRECT` → リダイレクトチェーン解消
   - `BLOCKED_BY_ROBOTS_TXT` → robots.ts 修正
3. 修正後 GSC で「インデックス登録リクエスト」を手動送信
4. 再確認

**効果判定の期間**: 手動リクエスト後 3-10 日

**期待 delta**: 該当ページが indexed に遷移

**ROI**: 高（1 件あたり長期的に impressions 獲得）

---

## カテゴリ 5: UX / 回遊性

### 5-A. 内部リンク・関連コンテンツの強化

**適用条件**:
- `ga4_pages_per_session` < 2.0
- 特定ページ種別で直帰率が平均 +10pt 以上
- ランキング → テーマ / 記事 への導線が弱い

**計測指標**: `ga4_pages_per_session`、`ga4_bounce_rate`、`ga4_engagedSessions`

**アクション**:
1. 対象ページ種別の末尾コンポーネントを確認（RelatedRankings / RelatedArticles 等）
2. DB `correlation_analysis` から関連指標を引き、関連カードの内容を改善
3. ブログ記事 → 関連ランキングへのインライン リンク追加
4. デプロイ → 7-14 日待機

**効果判定の期間**: 7-14 日

**期待 delta**: ページ/セッション +20%、engagedSessions +10-20%

**ROI**: 中

### 5-B. ダッシュボード / ランキング UI の改善

**適用条件**:
- テーマダッシュボード滞在時間が短い（< 30 秒）
- スクロール深度が低い
- `/ui-panel-review` で改善余地が指摘されている

**計測指標**: `ga4_averageSessionDuration`、`ga4_engagementRate`

**アクション**:
1. `/ui-panel-review` で具体的な問題抽出
2. melta-ui 規約準拠でコンポーネント修正
3. 視線誘導・情報階層の整理
4. デプロイ → 7-14 日待機

**効果判定の期間**: 7-14 日

**期待 delta**: エンゲージメント率 +5〜10pt

**ROI**: 中

---

## カテゴリ 6: SNS 流入

### 6-A. X 投稿頻度の定着

**適用条件**:
- 直近 4 週で X 投稿が 5 件未満
- X 経由の GA4 engagedSessions が週 5 未満

**計測指標**: `ga4_organic_social_engaged_sessions`（週次）

**アクション**:
1. `/post-x` で週 3 投稿のリズムを作る
2. `/post-bar-chart-race-captions` / `/post-sns-captions` で一括生成
3. UTM 付きリンクで流入計測
4. 2-4 週継続

**効果判定の期間**: 4 週

**期待 delta**: SNS 経由 engagedSessions 週 20-50

**ROI**: 中

---

## 履歴（学んだこと）

以下は実際の実験から得られた知見の蓄積欄。`/nsm-experiment close` の learnings がここに蓄積される想定。

- _(まだ実験実施なし)_

---

## 新規パターン追加のルール

1. 実際の実験で効果が確認されたら本ファイルに追記
2. カテゴリ 1-6 のどこに属するか、または新カテゴリを立てるか判断
3. 「適用条件」「計測指標」「アクション」「期待 delta」を必ず記載
4. 失敗パターンも追加（「やらない方がいい」の記録）
