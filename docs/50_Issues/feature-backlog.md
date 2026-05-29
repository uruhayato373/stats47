---
type: backlog
category: feature
created: 2026-05-16
status: pending
---

# 機能開発バックログ (Tier-2/3)

未着手の機能開発タスク。優先度は tier で示す。実装着手時は section header に `[in-progress]` を付与、完了時に `[done]` + 完了日を追記。

---

## [pending] Phase 8: 既存記事チャートの dark mode 一括対応ツール

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: 2026-05-28 ブログ品質監査で公開記事のチャート SVG 多数が dark mode 未対応と判明
- **概要**: `audit-chart-quality.mjs` が多数の公開記事で `darkModeMissing` / `themeColorInline` を検出。
  しかし `generate-article-charts.mjs` は (a) data ファイル命名が `*-prefecture-rankings.json` 等の
  パターンに一致する記事しか再生成できず、(b) これら公開記事の data は `fetched-*.json` 等の別命名 +
  scatter は未実装、のため再生成不能。既存 SVG に dark-mode CSS を後付け注入する専用ツールが必要
- **対象**: `.local/r2/app/blog/<slug>/data/*.svg` (公開記事の chart)
- **着手判断**: dark mode は CTR 主因でない (blog-quality-standards.md) ため優先度低。chart 品質を
  一斉に底上げしたいタイミングで
- **関連**: `.claude/scripts/blog/generate-article-charts.mjs` (2026-05-28 に `--base` 追加済、ただし命名問題は未解決)

## [pending] Phase 7: recompute-correlations 実装

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: Phase 6 (D1 → R2 移行) 完遂、最終整理 PR にて未実装と確定
- **概要**: `.claude/skills/db/recompute-correlations/SKILL.md` の方針 (R2 stats → D1 temp → Pearson r → R2 snapshot → temp DROP) を `packages/correlation/src/scripts/recompute.ts` として実装
- **入力**: `app/stats/<metric>/values.json` (全 2,207 metric × 47 県)
- **出力**: `app/correlation/top-pairs.json`, `app/correlation/by-ranking-key/<key>.json`
- **着手判断**: 既存の相関 snapshot で運用継続可能なため、新規 metric 追加が増えて相関が陳腐化したタイミング
- **関連**: Phase 6.7 schema cleanup (packages/correlation の reader が `correlations` schema を import している、Phase 7 でまとめて refactor)

## [pending] Phase 7: stats_* schema + correlations schema 削除 + reader refactor

- **tier**: 3
- **status**: pending
- **created**: 2026-05-28
- **trigger**: Phase 6.7 で発覚: packages/ranking + packages/correlation + packages/area-profile の 12 ファイルがまだ `statsPrefecture` / `correlations` を import している
- **概要**:
  - `packages/database/src/schema/{stats-prefecture,stats-city,stats-port,stats-migration-flow,stats,correlations}.ts` 6 ファイル削除
  - schema index.ts の DEPRECATED export 行削除
  - 上記 12 reader を R2 fetch に切替 (参照: `packages/ranking/src/repositories/ranking-value/list-ranking-values.ts`)
  - `packages/database/scripts/{ingest-migration-flow,populate-port-statistics}.ts` + `packages/ranking/src/scripts/seed-city-ranking-items.ts` 削除
- **着手判断**: 現状 D1 にテーブルは無く、production が壊れた reader を呼ぶか確認。壊れている場合は緊急で対応
- **検証**: `npx tsc --noEmit -p apps/web/tsconfig.json` + 全 tsc clean
- **関連**: `~/.claude/plans/drifting-cuddling-blossom.md` の "C (DEFERRED)" セクション

---

## [done] #129 [T2-AI-CONTENT-01] regional_analysis を UI に配線（または insights へ統合）

- **tier**: 2
- **status**: done (実装確認 2026-05-24)
- **related_issue**: #129 (closed)
- **完了**: `apps/web/src/app/ranking/[rankingKey]/page.tsx:388-392` で `regionalAnalysisSection` を `AiContentAccordion` (タイトル「地域別の傾向」) として配線済。DB の `aiContent?.regionalAnalysis` 内容が読者に届いている。

### 背景

ranking_ai_content テーブルの `regional_analysis` フィールドは、v1.0 から運用されているが **`apps/web/src/app/ranking/[rankingKey]/page.tsx` で `regionalAnalysisSection` prop が wired されていない**ため、DB に保存された内容が一切描画されていない。

2026-04-26 の v3.0 pilot 再生成で発覚（`/ranking/konbu-consumption-quantity` で「## 相関構造：北日本食文化クラスター」セクションが DB には存在するが本番ページに出ない）。

### 現状

- `RankingKeyPageClient` は `regionalAnalysisSection?: ReactNode` を受け取る（既に accordion レイアウトのスロット存在）
- 親 page.tsx は `insightsSection={...}` `faqSection={...}` `correlationSection={...}` のみ渡し、`regionalAnalysisSection` は未配線
- 結果、pilot 8 件すべてで v3.0 の `regional_analysis` 内容（地理特徴 + 相関構造）が読者に届いていない

### 影響範囲

- 8 件すべての pilot 再生成 content の **約 1/3 が不可視**
- v2.0 規模の総 1,922 件についても同様

### 対応案

#### 案 A: regionalAnalysisSection を wire（最小変更）

`page.tsx` に以下を追加。AiContentAccordion の表示位置（insights の前後など）は要 UX 確認:

```tsx
regionalAnalysisSection={
  aiContent?.regional_analysis
    ? <AiContentAccordion title="地域別の特徴"><AiMarkdownContent content={aiContent.regional_analysis} /></AiContentAccordion>
    : null
}
```

#### 案 B: regional_analysis を insights に統合してフィールド削除

- v3.0 プロンプトで生成範囲を insights に集約
- DB マイグレーションで `regional_analysis` カラム廃止
- 利点: 1 セクション分の冗長性除去、AI 生成コスト削減
- 欠点: 既存 1,922 件の content 移行作業が必要

### 推奨

案 A を **先に実装**（既存 v3.0 content をすぐ可視化）→ 効果を見て案 B を検討。

### 完了条件

- `/ranking/konbu-consumption-quantity` で「相関構造：北日本食文化クラスター」が描画される
- pilot 8 件で `regional_analysis` の文字数 / 描画位置を確認
- LCP/CLS への影響を測定（accordion デフォルト閉じならノーリスク）

---

## [done] #131 [T2-CORR-UI-01] CorrelationSection UI 拡張（partial_r 表示 + scatter mini）

- **tier**: 2
- **status**: done (2026-05-25)
- **related_issue**: #131 (closed)
- **実装**:
  - `CorrelationSectionClient.tsx` に `ScatterMini` 内部コンポを追加 (60×36 px SVG、47 県 scatter、相関符号で色分け)
  - 各行に `(人口除外 {formatR(partial_r_population)})` を併記
  - ヘッダ補足文「r = 全体相関、(人口除外) = 人口の影響を控除した偏相関」を追加
- **データ**: R2 snapshot `app/correlation/by-ranking-key/<key>.json` に既存の `partialRPopulation` + `scatterData` (47 点) をそのまま消費
- **動作確認**: `http://localhost:3000/ranking/abortion-rate` で 10 SVG × 47 dots レンダリング確認 (HTTP 200)
- **次のステップ**: 案 ③ partial_r トグル UI / 案 ④ 解釈ラベル は別途検討 (本実装でデータの一部のみ可視化)

### 背景

ローカル D1 に correlation_analysis 1,674,544 行 / リモートに完全 sync 済み（2026-04-26 完了）。`partial_r_population/area/aging/density` と `scatter_data` (47 県座標 JSON) も全行に格納済み。

しかし `apps/web/src/features/ranking/components/CorrelationSection/CorrelationSectionClient.tsx` は **ranking_name + pearson_r のみ表示** で、todo-ran.com 等の競合と比較して情報量が不足している。

### 不足している既存 DB データ

| データ | 用途 |
|---|---|
| `partial_r_population` | 人口の影響を除いた偏相関 |
| `partial_r_area` | 面積の影響を除いた偏相関 |
| `partial_r_aging` | 高齢化率の影響を除いた偏相関 |
| `partial_r_density` | 人口密度の影響を除いた偏相関 |
| `scatter_data` | 47 県プロット用の散布図データ |

### 改善案（優先順）

#### 🥇 即実装（DB 既存データ活用）

**1. partial_r 表示**: 人口除外の偏相関を pearson_r の隣に小さく表示
- 効果: 「人口比例の自明な相関」を一目で見抜ける
- UI: `r=0.98 (人口除外 0.68)` のような併記

**2. scatter mini プレビュー**: SVG で 47 点を 60×40 px に圧縮表示
- 効果: 一目で相関の形（正/負/U字/外れ値）が分かる
- 既存 `scatter_data` JSON をそのまま使える

#### 🥈 中規模実装

**3. partial_r トグル UI**: 「人口の影響を除く」チェックボックス
**4. 相関の解釈ラベル**: r 値による定性ラベル（「強い正の相関」など）

#### ❌ 後回し

5. 動的 scatter（hover で県名表示等）→ /correlation 詳細ページに任せる
6. 時系列相関（同指標の年次変化）→ 別機能

### 想定効果

- 「自明な相関」と「真の相関」を区別できる ＝ 滞在時間 / engagement 改善
- AI 考察（v3.0）で言及した内容が UI でも検証できるようになり、信頼性向上

### 完了条件

- partial_r が表示される
- scatter mini が描画される（少なくとも上位 5 相関について）
- パフォーマンス影響測定（LCP/CLS）

---

## [done] #292+ [T3-LOCAL-FINANCE-02] /themes/local-finance 市区町村別データ拡張（Japan Dashboard 完全互換）

- **tier**: 3
- **status**: done MVP (2026-05-25, 6 直接指標)
- **related**: PR #292（都道府県別 Phase 1）

### 実装内容 (2026-05-25)

**データ層 (D1 stats_city)**:
- ✅ e-Stat SSDS 市区町村版 `0000020204` (廃置分合処理済) から 4 指標 fetch + stats_city 投入:
  - `real-balance-ratio-city` (D2202): 57,392 行
  - `current-balance-ratio-city` (D2203): 35,447 行
  - `real-public-debt-service-ratio-city` (D2211): 24,333 行
  - `future-burden-ratio-city` (D2212): 12,150 行
- ✅ 既存 city 指標 2 件と統合 (6 指標カバー):
  - `fiscal-strength-index` (57,613 行)
  - `per-taxpayer-taxable-income` (56,913 行)
- ✅ Fetch スクリプト: `.claude/scripts/estat/fetch-city-local-finance.cjs`

**Indicator set**:
- ✅ `LOCAL_FINANCE_CITY_SET` (`packages/types/src/indicator-sets/local-finance-city.ts`) を定義 + registry 登録
- ✅ `LOCAL_FINANCE_CITY_THEME` を `apps/web/src/features/theme-dashboard/server.ts` で export

**R2 export**:
- ✅ `.claude/scripts/db/export-city-local-finance.cjs` で D1 → R2 形式変換 (243,848 行 → 6 metric の `item.json` + `values.json`)
- ⏸ 本番 R2 push は **本番デプロイ時** にユーザが実施 (`/push-r2 --prefix app/ranking/` で部分 sync 可能、または `/sync-snapshots` 全体)

**UI 層**:
- ✅ `load-theme-data.ts` を areaType 対応に拡張 (`options.areaType: "city"`)
  - city モードでは R2 から直接 `readRankingValuesFromR2(key, "city", yearCode)` で取得
  - topology は `fetchAllCitiesTopology` に切替
- ✅ 新規 page `/themes/local-finance/cities/page.tsx` 作成 (`LOCAL_FINANCE_CITY_THEME` を使用)
- ✅ 既存 `/themes/local-finance/page.tsx` に「市区町村」ナビゲーション追加 (相互リンク)
- ✅ 型チェック PASS

**動作確認 (localhost:3000)**:
- ✅ `/themes/local-finance` HTTP 200 (pref 維持、回帰なし)
- ✅ `/themes/local-finance/cities` HTTP 200 (全 6 指標が描画される、市区町村ラベル表示)

### 本番デプロイ手順 (ユーザ作業)

1. R2 push (6 metric の app/ranking/ 配下):
   ```bash
   for key in fiscal-strength-index real-balance-ratio-city current-balance-ratio-city real-public-debt-service-ratio-city future-burden-ratio-city per-taxpayer-taxable-income; do
     npx tsx packages/r2-storage/src/scripts/sync-upload.ts --prefix app/ranking/$key
   done
   ```
2. feature ブランチ → develop → main の PR で deploy
3. 本番 smoke: `curl -I https://stats47.jp/themes/local-finance/cities` で 200 確認

### 残作業 (Phase 2 で別途)

ratio 系 12 指標 (歳出割合 / 1人当たり等) は分子・分母から計算が必要。Phase 2 で計算 metric として実装:

| 指標 | 算出 | 必要なデータ |
|---|---|---|
| local-tax-ratio | D320101 / D3201 | 地方税 / 歳入総額 |
| local-allocation-tax-ratio | D320108 / D3201 | 地方交付税 / 歳入総額 |
| national-treasury-disbursement-ratio | D320113 / D3201 | 国庫支出金 / 歳入総額 |
| self-financing-ratio | D3202 / D3201 | 自主財源額 / 歳入総額 |
| personnel-expenditure-ratio | D320401 / D3203 | 人件費 / 歳出総額 |
| welfare-expenditure-ratio | D320303 / D3203 | 民生費 / 歳出総額 |
| education-expenditure-ratio | D320310 / D3203 | 教育費 / 歳出総額 |
| public-works-expenditure-ratio | D320308 / D3203 | 土木費 / 歳出総額 |
| per-capita-total-expenditure | D3203 / 人口 | 歳出総額 / 人口 |
| per-capita-inhabitant-tax | (住民税) / 人口 | - |
| taxpayer-ratio | 納税義務者数 / 人口 | - |
| laspeyres-index | local-public-employee-salary | 別ソース |


### 背景

PR #292 でデジタル庁 Japan Dashboard 自治体財政ページ
(https://www.digital.go.jp/resources/japandashboard/municipal-finance) を
**都道府県別データ**で `/themes/local-finance` に復元済み。本家は市区町村別
（約 1,700 自治体）が主軸のため、完全互換にはこちらを追加取得する必要がある。

### 現状

- D1 `metrics` テーブル: 財政関連 18 指標すべて `areaType='prefecture'` のみ登録
- 市区町村レベル（`stats_city`）には財政指標未登録
- area_profile では一部大規模自治体（東京都・大阪府等 ~27 件）にスポットで財政データが含まれるのみ

### 必要な作業

1. **e-Stat 「地方財政状況調査」探索**
   - 統計コード: 総務省 `00200251` 系
   - `inspect-estat-meta` / `search-estat` スキルで市区町村別 statsDataId を抽出
   - 候補: 03xxxxxx 系（市町村別の小規模・大規模区分テーブル）

2. **metrics 追加登録**
   - 都道府県側 18 指標と同じ key に対応する `areaType='city'` 行を追加
   - `source_config_json` で市区町村版 statsDataId / cdCat01 を指定
   - city-level の最新値取得 → `stats_city` 投入

3. **市町村合併・廃置分合への対応**
   - area_code の historical mapping（旧 → 現在）
   - stats47 area マスターとマッチング

4. **UI 拡張**
   - `/themes/local-finance` 既存ページに areaType トグル追加
     （現状の `ThemeDashboardTabbed` は都道府県固定）
   - 市区町村選択時は ThemeLeafletMap → CityMapChart に切替
   - `/areas/[areaCode]/cities/[cityCode]` の財政タブとの整合

5. **page_components 追加**
   - `(page_type='theme-city', page_key='local-finance')` or 同 theme 内で areaType 分岐
   - 12 件の city 版コンポーネント（PR #292 と同構成）

### コスト目安

- データ取得・登録: 2-3 日（e-Stat API レート + 約 1,700 自治体 × 18 指標 × 数年）
- UI 拡張: 2-3 日（areaType トグル、CityMapChart 配線、page_components 設計）
- 検証: 1 日（型チェック、本番 R2 push、目視確認）
- 合計: **約 1 週間**

### 完了条件

- `/themes/local-finance` で areaType トグル（都道府県/市区町村）が動作
- 市区町村選択時、約 1,700 自治体のコロプレス地図 + KPI/チャートが表示
- Japan Dashboard と同等の粒度（自治体クリック → 詳細ドリルダウン）
- 既存の都道府県表示は退行なし

### 関連

- PR #292: feature/local-finance-page-components（都道府県別 Phase 1）
- `packages/types/src/indicator-sets/local-finance.ts`: 18 指標定義
- `.claude/rules/estat-api.md`: e-Stat 取得規約

---

## [done] [T2-SNS-STATION-01] 駅別乗降客数バブルマップ動画（国土数値情報 S12）

- **tier**: 2
- **status**: done (Phase 1-5 全完了 2026-05-22、PR #328 マージ済、47連結 YouTube 動画 `wjLQCiuEeNI` public 公開済)
- **target**: SNS（X / YouTube 投稿用 16:9 / 縦長動画）

### 背景

国土数値情報「駅別乗降客数」(S12) を国土交通データプラットフォーム経由で取得し、
都道府県別に「鉄道駅を地図上にバブル表示 + 乗降客数の年次推移アニメ」を
Remotion で動画化、X 投稿素材にする。migration-flow / population-choropleth の
地図系 Remotion 資産を流用できることを確認済み。

### PoC 完了分（2026-05-22）

| 成果物 | パス |
|---|---|
| データ取得スクリプト | `apps/remotion/scripts/fetch-station-passengers.ts` |
| 駅データ JSON | `apps/remotion/public/station-passengers/{22,13,26}.json` |
| Remotion コンポーネント | `apps/remotion/src/features/station-passengers/` |
| Composition | Root.tsx `StationPassengers-Reel`（1920×1080 / 720f / prefCode prop） |
| 検証レンダー | 静岡県（22）720 frame MP4 レンダー成功 |

確認できたこと: S12 は全 47 県・2011〜2023 年取得可能。県境投影 + 駅ポイント投影 +
バブルサイズ補間 + 年送りアニメが動作。`prefCode` prop 差し替えで全県展開可能。

### 路線図レイヤー追加（2026-05-22）

N02 鉄道路線を路線図レイヤーとして追加。新幹線（`lineName` に「新幹線」を含む）は
青太線で色分け。`apps/remotion/scripts/fetch-railway-lines.ts` が全国 N02 TopoJSON
を県別に切り出し。

### production 化フェーズ（2026-05-22 着手、全 5 フェーズ）

ユーザー方針: 県別集計を D1 ランキング化 → Web ページ → SNS 動画展開。

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | 駅乗降客数を D1 ランキング登録（`railway-passengers`） | ✅ 完了 2026-05-22 |
| 2 | 駅別データ・路線を R2 snapshot 化（`app/station-passengers/`） | ✅ 完了 2026-05-22 |
| 3 | `packages/station-passengers/` 共有パッケージ化 | ✅ 完了 2026-05-22 |
| 4 | Web ページ 2 種（ランキング + アニメ地図）+ 相互リンク | ✅ 完了 2026-05-22 |
| 5 | 動画 SNS 展開（Remotion 9:16・1:1 + 47県バッチ） | ✅ 完了 2026-05-22 |

**Phase 1 完了分**:
- `packages/gis/src/station-passengers/register-ranking.ts` — S12 を県別合計に集計し
  `metrics` + `stats_prefecture` に登録。metric_key=`railway-passengers`、
  単位=人/日、category=infrastructure、対象 2019〜2023年度（235 行）。
- ランキング: 1位 東京都 36,378,900 人/日 〜 47位 島根県 35,157 人/日。
- 2018年以前は JR 欠損のため県間比較に不適 → 2019〜2023 に限定（JR pop-in も同時に解消）。
- ※ `gis_datasets` の S12 `ranking_config` は使わず専用スクリプトで登録
  （KSJ の register-ksj-rankings.ts は feature 数カウント方式 + `stats` テーブル
  スキマドリフトのため不適）。

**Phase 2 完了分**:
- `apps/web/scripts/export-station-passengers-snapshot.ts` — 駅別 JSON + 路線 GeoJSON を
  R2 `app/station-passengers/{NN}/{stations,lines}.json` + `index.json` へ export（95 files）。
- `/sync-snapshots` の TASKS + SKILL.md に `station-passengers` 登録済み。
- ※ raw データの正本は `apps/remotion/public/station-passengers/`（videos の staticFile
  兼用）。D1 登録スクリプトと R2 exporter が共にここを読む。

**Phase 3 完了分**:
- `packages/station-passengers/` 新設（`StationPassengersReel` + types を移動、
  migration-flow と同型の package.json/tsconfig/index）。
- `apps/remotion` の Remotion ラッパー・data loader・preview は feature 配下に残し
  `@stats47/station-passengers` を import。web/remotion 両用。

**Phase 4 完了分**:
- ランキングページ `/ranking/railway-passengers` — HTTP 200 確認（既存 ranking 基盤）。
  master + ranking-values exporter をローカル実行し snapshot 生成、
  `generate-known-ranking-keys.ts` 再実行で middleware の 410 を解消。
- アニメ地図ページ `/station-passengers`（一覧）+ `/station-passengers/[prefCode]`（47県 SSG）
  — HTTP 200 確認。API プロキシ `/api/station-passengers/[...slug]`（R2 CORS 回避）、
  `StationPassengersPlayer`（rAF 駆動、`@stats47/station-passengers` 使用）。
- sitemap.ts に station-passengers ページ追加。
- 相互リンク: アニメ地図 → ランキング（実装済み）。ランキング → アニメ地図方向は
  ranking テンプレが自動生成のため未配線（page_components 経由の follow-up）。

**Phase 5 完了分**:
- `StationPassengersReel` を layout 可変化（`format`: landscape 16:9 / portrait 9:16 /
  square 1:1）。`LAYOUTS` 設定で地図矩形・パネル配置を切替、portrait/square は
  地図上＋パネル下の 2 列構成。
- Root.tsx に 3 コンポジション（`StationPassengers-Reel` /
  `-Portrait` / `-Square`）。schema に `format` enum 追加。
- `apps/remotion/scripts/pipeline/render-station-passengers.ts` — 47県 × 3
  フォーマットの一括レンダー（フォーマット・県を引数で絞り込み可）。
  出力 `out/station-passengers/{format}/{NN}.mp4`。検証レンダー 3 形式とも成功。

### 残タスク（運用・改善）

- 47県 × 3 フォーマットのフルバッチレンダー実行（~70分）→ `/post-youtube`
  `/post-instagram` `/post-x` で投稿（運用ステップ。/post-* は MP4 対応済み）。
- ランキング → アニメ地図ページの相互リンク（page_components で関連リンク追加）。
- AI コンテンツ生成（`/generate-ai-content` で `railway-passengers` の faq /
  regional_analysis / insights を生成）。
- ラベル重なり解消（migration-flow の `deOverlapLabels` 移植）。
- 本番反映: `/sync-snapshots` フル実行（D1→R2 push）+ デプロイ。

### 関連

- `docs/01_技術設計/09_国土交通データプラットフォーム.md`: S12 取得元（MCP `mlit-dpf-mcp`）
- `.claude/rules/r2-storage-design.md`: R2 配信化する場合の名前空間規約
- 流用元: `apps/remotion/src/features/migration-flow/` / `population-choropleth/`

---

## [T2-RANKING-NORM-SSG-01] ranking 正規化派生 (人口10万人あたり等) の SSG 化 + SEO 対応

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25
- **target_metric**: GSC clicks / impressions (normalization 派生 URL の indexing)

### 背景

`/ranking/[rankingKey]` ページには 2 系統の「表示基準切替」UI が並存している:

| 系統 | UI | 計算ソース | URL | SSG | SEO |
|---|---|---|---|---|---|
| pill (RankingHeroCard) | rounded-full ボタン | stats47 計算 (per_population / per_area / per_household) | `?norm=per_population` などの query param | ✗ (CSR 限定) | ✗ indexable 不可 |
| group toggle (RankingKeyPageClient) | テキストタブ | 別 metric (e-Stat 提供の「従業員1人あたり」「事業所1ヶ所あたり」等) | `/ranking/{別 rankingKey}` | ✓ | ✓ 別 page として indexed |

### 問題

1. **SEO 損失**: pill 切替の派生 (例: 「人口10万人あたり製造品出荷額」) は SSG 対象外で、検索エンジンに認識されない。同じ意味の e-Stat 由来派生 (「従業員1人あたり」) は別 rankingKey として SSG されており、indexing 状況が非対称。
2. **UI 混乱**: pill と group で「表示基準を変える」操作が縦に並ぶ。pill は CSR 限定、group は別 URL 遷移という挙動の違いがユーザーに見えない。
3. **データ重複**: pill 限定派生も group 由来派生も、本質的には「分子 / 分母 * scaleFactor」の同型計算。同じ概念が「どこから来たデータか」で UI / URL 設計が分かれている。
4. **意味バグ**: `total-population` (denominator key 自身) に per_population オプションが付いており「人口あたりの人口」という無意味な選択肢が pill に並ぶ。`isBaseMetric()` ガード追加前のデータが残存している (T3-RANKING-NORM-DATA-CLEAN-01 で対応)。

### 対応案

#### 案 A (推奨): pill 選択肢を SSG 化する route 拡張

- `app/ranking/[rankingKey]/page.tsx` の `generateStaticParams` に norm 種別を加え、`/ranking/{key}/{norm?}` のような route を生成
- canonical: 各 norm 毎に独自 URL、`<link rel="alternate">` で他 norm を関連付け
- sitemap.ts: 全 norm URL を含める (件数増、容量検討要)
- 内部リンク: ranking-items-by-category 等、関連 ranking 列挙ロジックで norm 派生を含めるか検討

工数: 中 (page.tsx の generateStaticParams / metadata / sitemap / 内部リンク全般)

#### 案 B: pill 派生を別 rankingKey に昇格 (group に一本化)

- `auto-attach-normalization.ts` の派生を、`metrics` テーブルの別 row として登録 (例: `manufacturing-shipment-amount-per-population` という新 key)
- 既存の group toggle 機構をそのまま使うため、UI 統合が容易
- 欠点: metric 数が 2-3 倍に膨らむ。snapshot 容量 / ビルド時間 / D1 行数の試算が必要

工数: 大 (DB 設計変更 + 既存 R2 スナップショット移行 + 旧 `?norm=` URL の 301)

#### 案 C: pill を維持しつつ canonical で吸収

- 現状の `?norm=` URL を canonical で元 URL に統合し、pill は CSR 限定の便利機能と割り切る
- 「人口10万人あたり製造品出荷額」のような検索クエリは諦める

工数: 小 (canonical タグの整備のみ)

### 関連

- 短期対応 (モバイル UI Select 化): claude/admiring-noether-HeeLC (2026-05-25)
- 派生計算ロジック: `packages/ranking/src/services/compute-normalization.ts`
- snapshot: `packages/ranking/src/exporters/ranking-normalized-values-snapshot.ts`
- denominator マップ: `WELL_KNOWN_DENOMINATORS` in compute-normalization.ts

---

## [T3-RANKING-NORM-DATA-CLEAN-01] denominator 系 metric から不適切な normalizationOptions を削除

- **tier**: 3
- **status**: pending
- **created**: 2026-05-25

### 背景

`total-population`, `total-area-*`, `households` 等の denominator として使われる metric に、自分自身の denominator を使う norm option が混入している。`isBaseMetric()` ガード追加 (`packages/ranking/src/utils/is-base-metric.ts`) 以前のデータが DB に残存。

### 例

- `total-population` の `calculation.normalizationOptions` に `per_population` (label: 「人口10万人あたり」) が含まれる → 「人口あたりの人口」で意味なし

### 対応

- `packages/ranking/src/scripts/` に cleanup CLI を追加 (`drop-invalid-norm-options.ts`)
- ロジック: `DENOMINATOR_KEYS` に該当する metric の `normalizationOptions` から、対応する `type` を除外
- 実行: `--dry-run` で対象確認 → `--apply` で DB 更新 → `/sync-snapshots` で R2 再生成

工数: 小

### 関連

- `packages/ranking/src/utils/is-base-metric.ts` DENOMINATOR_KEYS
- `packages/ranking/src/scripts/auto-attach-normalization.ts` (既存の自動付与スクリプト)

---

## [T2-REDESIGN-PHASE2] D-System Phase 2 — KPI Tile クリック化 + 本文中 NativeAffiliateRow

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25
- **related**: PR #353 / #354 で Phase 1 完了済 (本前提)
- **master_plan**: `docs/02_実装計画/d-redesign-master-plan.md`
- **真実源**: `.claude/design-system/redesign/INDEX.md`

### 背景

D-System Phase 1 (PR #349-#354) で以下が完了:

- ✅ 共通プリミティブ作成 (`WidePageShell` / `RightRailWidgets` / `NextUpGrid`)
- ✅ Tailwind container 1700px 拡張 (全 50+ ページ自動適用)
- ✅ 5 ページに右サイドバー追加 (area / category / themes-index / tag + blog 3 カラム)
- ✅ home に NextUpGrid 追加
- ✅ ブログ機能改善 (α 3 カラム / コードブロック配色 / ふるさと納税 3 段ロジック / CSV ダウンロード R2 事前生成)

### Phase 2 で残っている改良

#### A. KPI Tile クリック可能化

各ページの暗色 hero 内 KpiTile を「クリック → 関連ランキング遷移」可能にする。

- 対象: `apps/web/src/features/redesign/components/KpiTile.tsx`
- 実装: `href?: string` prop を追加し、指定時は `<Link>` 内包
- 効果: 内部リンク密度 ↑ → GSC indexation 改善 + 回遊性 ↑
- 工数: 30 分 (primitive 変更 + 数ヶ所の call site 更新)

#### B. ブログ本文中 NativeAffiliateRow 周期挿入

公式 D 案 (`blog-option-d.jsx`) で実装されている「本文中ネイティブ広告 3 種」をブログ記事の H2 セクション毎に挿入。

- 候補:
  - ランキング CTA (記事に登場した rankingKey を抽出 → 関連 ranking へのリンクカード)
  - 書籍 3 冊横並びストリップ
  - AdSense in-feed
- 実装: `apps/web/src/features/blog/components/md-content.tsx` の `injectAdSlots()` 拡張、または `ArticleRenderer` 内で `h2` 検出して節間に挿入
- 工数: 2-3 時間

#### C. 関連書籍 `prose-pre` の CSS 微調整

PR #353 で `prose-pre:bg-slate-900` を導入したが、`dark:prose-invert` で dark mode に行ったときの再調整が未確認。

### 対応の判断基準

- A: 単独で完結。SEO 内部リンク密度の改善目的で先行実装が良い
- B: 工数中。記事の読み込み深度向上に効くが、広告密度が AdSense ポリシーに当たらないか検証必要
- C: dark mode 利用者が少なければ後回し可

---

## [T2-REDESIGN-PHASE3] D-System Phase 3 — A8.net 統合 + compare/search 実装

- **tier**: 2
- **status**: pending
- **created**: 2026-05-25

### 背景

Phase 1/2 完了後の最終フェーズ。外部サービスの契約や noindex ページの実装。

### 残作業

#### A. A8.net ふるさと納税アフィリエイト直契約

現状はある楽天 affiliate ID 経由。A8.net で「ふるさとチョイス」「さとふる」等を直契約する方が利益率高。

- マスタープラン § 9 参照
- 必要作業:
  - A8.net アカウント開設・該当プログラム加入申請
  - `apps/web/src/features/ads/components/FurusatoNozeiCard.tsx` を A8 直リンクに切替
  - 環境変数 (NEXT_PUBLIC_A8_FURUSATO_PROGRAM_ID 等) を Cloudflare Pages に設定
- 工数: 1-2 時間 (契約後の作業)

#### B. compare/search ページを D 案で実装

INDEX.md で `deferred` 扱いだが、サイト内利用ユーザー向け体験向上のため将来実装。
noindex のため SEO 流入は無いが、ブックマーク・直接アクセス・サイト内検索利用者向け。

- `/compare/[categoryKey]`: D 案 = Story Editorial + ふるさと納税 (2 県分)
- `/search`: D 案 = Discovery + ネイティブ収益
- プロトタイプ: `.claude/design-system/redesign/project/compare-option-d.jsx` / `search-option-d.jsx` を参照
- 工数: 各 2-3 時間

#### C. CSV ダウンロード R2 事前生成の運用反映

PR #352 で実装した「事前生成ファイル」を本番に反映:

```bash
bash .claude/skills/db/sync-snapshots/run.sh --only ranking-download
```

初回生成は ~2,151 metrics × 最大 8 ファイル ≈ 17K files で 15-30 分かかる。
その後通常の `/sync-snapshots` フルランで差分更新される。

#### D. 環境変数の本番設定

Cloudflare Pages env vars に以下を追加 (現状は未設定で内部 fallback 動作):

- `NEXT_PUBLIC_TECH_SCHOOL_AFFILIATE_URL`: Claude Code 副業講座 ASP URL
- `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`: 楽天アフィリエイト ID
- `NEXT_PUBLIC_RAKUTEN_APP_ID`: 楽天 API アプリ ID (ふるさと納税商品取得用)

### 関連

- マスタープラン: `docs/02_実装計画/d-redesign-master-plan.md`
- INDEX: `.claude/design-system/redesign/INDEX.md`
