---
type: backlog
category: feature
created: 2026-05-16
status: pending
---

# 機能開発バックログ (Tier-2/3)

未着手の機能開発タスク。優先度は tier で示す。実装着手時は section header に `[in-progress]` を付与、完了時に `[done]` + 完了日を追記。

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
