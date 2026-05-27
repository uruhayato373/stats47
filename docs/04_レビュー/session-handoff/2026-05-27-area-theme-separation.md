---
type: session-handoff
date: 2026-05-27
status: partially-completed
branch: develop
commit: 86dcd47
tags: [handoff, area-theme-separation, page-components, migration-flow, homepage-previews]
note: "追加タスク (homepage previews) は 2026-05-27 完了。残: area/theme 責務分離 STEP 1-6"
---

# Session Handoff — 2026-05-27 (area / theme 責務分離・page_components 棚卸し基盤 + homepage previews)

## 発端

ユーザー指摘: `/areas/17000` (石川県) に表示されている人口移動フローは、`/themes/population-dynamics` (主題ダッシュボード) に置くべきではないか。

検討の結果、「area / theme の責務分離が曖昧」が根本問題と判明。area = 県軸 (県固有ストーリー)、theme = 指標軸×横断可視化 として責務を明文化し、`page_components` の `pageType` 配置基準を定めることにした。

## このセッションで完了したこと

### 1. 設計ドキュメント新規作成

- **[`docs/01_技術設計/11_area-vs-theme責務分離.md`](../../01_技術設計/11_area-vs-theme責務分離.md)**
  - 4 ページ系統 (`/areas/[code]`, `/themes/[slug]`, `/category/[key]`, `/ranking/[key]`) の責務マトリクス
  - `page_components.pageType` への配置判定基準 (theme / area / area-category / ranking)
  - 設計原則 4 つ:
    1. 重い横断可視化は theme へ (47 ページ複製を避ける)
    2. area は県の自己紹介ハブ
    3. area の thin content 化を避ける (県固有時系列は残す)
    4. page_components の重複は許容、ただし意味的に正しい pageType のみ

### 2. 既存ガイドへの相互参照追記

- **[`.claude/design-system/page-components.md`](../../../.claude/design-system/page-components.md)** に「pageType 配置の責務分離」セクションを追加し、上記責務分離ドキュメントへリンク

### 3. 棚卸しスクリプト新規作成

- **[`.claude/scripts/audit/page-components-audit.cjs`](../../../.claude/scripts/audit/page-components-audit.cjs)**
  - ローカル D1 (`baffe56c...sqlite`) から `pageType` 別の全 component を抽出
  - heuristics (componentType 一致 / title パターン一致) で違反候補を判定
  - 出力先: `docs/04_レビュー/area-theme-audit/YYYY-MM-DD.md`
  - 判定対象 componentType: `choropleth-map`, `migration-flow`, `population-pyramid`, `scatter-plot` 等
  - 判定対象 title pattern: `/47都道府県/`, `/全国比較/`, `/相関/`, `/ピラミッド/`, `/移動フロー/`, `/人口移動/`

## このセッションで完了 **していない** こと (next agent への引き継ぎ)

リモート実行環境では `.local/d1/` が存在しないため、以下はローカルで実行が必要:

### STEP 1: 棚卸し実行 (ローカルで)

```bash
node .claude/scripts/audit/page-components-audit.cjs
```

→ `docs/04_レビュー/area-theme-audit/2026-05-27.md` (実行日) が生成される。

### STEP 2: 棚卸し結果の目視判定

生成 md の以下のテーブルを確認:

- **「違反候補: pageType=area → theme へ移すべき」**: heuristics で機械的に拾った候補
- **「レビュー必要: pageType=theme で疑わしい」**: theme に置かれているが単一県時系列の可能性があるもの
- **「参考: pageType=area の全 unique component」**: heuristics False Negative がないか目視

判定基準は [`docs/01_技術設計/11_area-vs-theme責務分離.md`](../../01_技術設計/11_area-vs-theme責務分離.md) を参照。

False Negative (heuristics で拾えなかった違反) があれば、`page-components-audit.cjs` の `THEME_LEVEL_COMPONENT_TYPES` / `THEME_LEVEL_TITLE_PATTERNS` に追加して再実行。

### STEP 3: page_components の `page_type` 付け替え

確定した移行対象に対し、ローカル D1 で UPDATE を実行。例:

```sql
-- 主題深掘り可視化を area → theme に移管
UPDATE page_components
   SET page_type = 'theme',
       page_key = 'population-dynamics'  -- 移管先 theme key
 WHERE page_type = 'area'
   AND chart_key = '<対象 component_key>';
```

> **注意**: `page_components` の unique 制約は `(page_type, page_key, chart_key)`。area は 47 県分の row があるため、47 行を 1 行 (theme 用) に集約する必要がある。47 行 DELETE → theme 用 1 行 INSERT が正攻法。

実行スクリプトは棚卸し結果確定後に書く (本ハンドオフ時点では未作成)。

### STEP 4: R2 反映

```bash
bash .claude/skills/db/sync-snapshots/run.sh --only page-components
```

ローカル D1 → R2 への snapshot 再生成。配置先は `app/page-components/{pageType}/{pageKey}.json`。

### STEP 5: コード側のマイグレーション (移動フロー件)

これは page_components の棚卸し結果に関わらず確定している作業:

- **[`apps/web/src/app/areas/[areaCode]/page.tsx:156-160`](../../../apps/web/src/app/areas/[areaCode]/page.tsx)** から `<AreaMigrationFlowSection>` を削除
- **[`apps/web/src/features/theme-dashboard/components/ThemePageLayout.tsx`](../../../apps/web/src/features/theme-dashboard/components/ThemePageLayout.tsx)** で `theme.themeKey === "population-dynamics"` の時に `MigrationFlowPlayer` を埋め込む (または theme config 経由で汎用化)
- 影響範囲:
  - area ページの「全国版を見る」リンク (現状 `/gis-cross/migration-flow`) は維持 or `/themes/population-dynamics` に変更
  - `/gis-cross/migration-flow` (独立ページ) は残す (Google からの直接流入経路)
- `next build` で `/areas/[areaCode]` が `○ Static` のままか確認 ([`nextjs-ssg-preservation.md`](../../../.claude/rules/nextjs-ssg-preservation.md) 準拠)

### STEP 6: 検証

- `apps/web` を `npm run dev` で起動し、`/areas/17000` と `/themes/population-dynamics` を browser で確認
- SSG が崩れていないことを `next build` 出力で確認
- 関連スキル: [`/verify`](../../../.claude/skills/verify/SKILL.md)

## 関連ファイル一覧

| ファイル | 種別 | 役割 |
|---|---|---|
| `docs/01_技術設計/11_area-vs-theme責務分離.md` | 新規 | 責務分離の判定基準 (source of truth) |
| `.claude/design-system/page-components.md` | 修正 | 実装ガイド (責務分離への参照を追記) |
| `.claude/scripts/audit/page-components-audit.cjs` | 新規 | 棚卸しスクリプト |
| `docs/04_レビュー/area-theme-audit/YYYY-MM-DD.md` | 未生成 | 棚卸し結果 (ローカルで生成) |
| `apps/web/src/app/areas/[areaCode]/page.tsx` | 未修正 | STEP 5 で `<AreaMigrationFlowSection>` を削除 |
| `apps/web/src/features/migration-flow/` | 未修正 | STEP 5 で `AreaMigrationFlowSection` を theme 向けに変更 or 削除 |
| `apps/web/src/features/theme-dashboard/components/ThemePageLayout.tsx` | 未修正 | STEP 5 で MigrationFlowPlayer を埋め込み |
| `packages/types/src/indicator-sets/population-dynamics.ts` | 参考 | 既に「移動」タブが存在。移動フローはこのタブに視覚的に紐づける |

## next agent への指示テンプレート

ローカルで pull した後、agent に以下を投げれば再開できる:

```
docs/04_レビュー/session-handoff/2026-05-27-area-theme-separation.md を読み、
STEP 1 から順番に進めて。STEP 1-4 (page_components 棚卸し + DB 反映) と
STEP 5 (コード側マイグレーション) のうち、どちらを先にやるかは
ユーザーに確認すること。
```

## commit / push 状況

- Branch: `claude/gallant-albattani-wxxhJ`
- Commit: `86dcd47` (area/theme 責務分離 doc + 棚卸し script) + `d0705a5` (このハンドオフ doc) + (homepage previews 関連は次 commit)
- PR: 未作成 (棚卸し + コード側マイグレーション完了後に develop → main で起票予定)

---

## 追加タスク: ホームページ末尾「このサイトの主要ページ」プレビュー画像/動画

ユーザー要望: `https://stats47.jp/` 下部の `NextUpGrid` セクション (6 リンク) にスクリーンショット/動画を入れて訴求力を上げる。

### 決定事項

- 方式: **A+B ハイブリッド** (`/ranking` `/themes` のみ動画 WebM、他 4 ページは静的 AVIF)
- 撮影タイミング: **CI 月次自動再撮影** (GitHub Actions cron, 毎月 1日)
- 保存先: **R2 `app/home/previews/{key}.{avif,webm}`** (公開 URL: `https://storage.stats47.jp/app/home/previews/`)

### このセッションで実装したもの

| ファイル | 種別 | 役割 |
|---|---|---|
| `docs/01_技術設計/12_homepage-previews.md` | 新規 | 設計仕様 (ファイル形式・LCP/CLS 対策・配信・CI) |
| `apps/web/src/features/redesign/components/NextUpGrid.tsx` | 修正 | `previewImageUrl` / `previewVideoUrl` props 追加、16:9 aspect-ratio 固定、`motion-reduce` 対応、媒体未指定時は既存グラデへ自動フォールバック |
| `apps/web/src/app/page.tsx` | 修正 | 6 item に preview URL を設定。`HOME_PREVIEWS_BASE` 定数で R2 公開 URL を組み立て |
| `apps/web/scripts/capture-home-previews.ts` | 新規 | Playwright で 6 ページ撮影 → Sharp で AVIF 化 + ffmpeg で WebM エンコード |
| `.github/workflows/capture-home-previews-monthly.yml` | 新規 | 月次 cron + 手動 dispatch。撮影 → R2 push (wrangler) |
| `apps/web/package.json` | 修正 | `sharp` を devDependencies に追加 |

### 残タスク (ローカル/CI で実行)

#### A. ローカルで動作確認 (推奨先行ステップ)

```bash
# apps/web に sharp を install
npm install --workspace=apps/web

# 撮影 (本番 stats47.jp ターゲット)
npx tsx apps/web/scripts/capture-home-previews.ts \
  --base-url https://stats47.jp \
  --output /tmp/home-previews

# 結果確認
ls -lh /tmp/home-previews/
# ranking.avif, ranking.webm, themes.avif, themes.webm,
# areas.avif, blog.avif, survey.avif, search.avif の 8 ファイルが出るはず
```

ffmpeg が無い場合は `brew install ffmpeg` (mac) / `apt-get install ffmpeg` (linux)。

#### B. ローカル D1/R2 への手動 push (動作確認用)

```bash
# .local/r2/app/home/previews/ にコピー
mkdir -p .local/r2/app/home/previews
cp /tmp/home-previews/* .local/r2/app/home/previews/

# Web 起動して確認
npm run dev --workspace=apps/web
# http://localhost:3000 で末尾セクションをチェック
```

#### C. 本番 R2 への push (workflow 経由 or 手動)

```bash
# 手動の場合
wrangler r2 object put stats47/app/home/previews/ranking.avif \
  --file /tmp/home-previews/ranking.avif \
  --content-type image/avif \
  --remote
# (全 8 ファイル同様に)
```

または `.github/workflows/capture-home-previews-monthly.yml` を一度 `workflow_dispatch` で手動起動。

#### D. CI 統合の確認

- 月次 cron は `0 3 1 * *` (毎月 1日 03:00 UTC = 12:00 JST)
- 必要 secrets: `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_R2_BUCKET_NAME` (既存 deploy workflow と同じ)

#### E. ロールアウト判断

- NextUpGrid 拡張は **R2 ファイルが無くてもクラッシュしない** (img の src 404 時はグラデが透過して見える)
- main deploy → R2 push → CDN 浸透 で順次見え始める
- LCP 影響を PSI で確認 (homepage の LCP が +0ms のはず)

### 既知の懸念

1. **`<img>` 404 時のアイコン表示**: ブラウザによっては broken-image アイコンが出る可能性 (Chromium は通常 alt のみ)。気になる場合は client component 化して `onError` でフォールバック
2. **video autoplay**: モバイル Safari は `muted playsinline` 必須 → 既に対応済み
3. **sharp install 失敗**: Cloudflare Pages build には sharp 不要 (script 側のみ使用)。`.npmrc` で `optional=false` してない限り問題ない
4. **動画サイズ超過**: ffmpeg の `-b:v 300k -crf 35` は目安。実測で 150KB を超える場合は CRF を上げる

---

## ✅ 完了 (2026-05-27) — homepage previews

実行 plan: `~/.claude/plans/b-goal-inherited-locket.md`

### 実施内容

1. **ローカル撮影** — `npx tsx apps/web/scripts/capture-home-previews.ts --base-url https://stats47.jp --output /tmp/home-previews`
   - 1 ファイルだけ `/survey` で networkidle timeout (30 秒超過) → ad-hoc に `domcontentloaded` + 4s wait で再撮影 (19.2 KB)
   - その他 7 ファイルは元スクリプトのまま一発成功
2. **R2 push** — `npx wrangler r2 object put stats47/app/home/previews/{file} --remote` (×8)
3. **検証** — 8 アセット全部 `https://storage.stats47.jp/app/home/previews/*` で HTTP 200、トップページ HTML に 8 URL すべて出現

### 生成ファイルサイズ (全 budget 内)

| ファイル | サイズ | budget | OK |
|---|---|---|---|
| ranking.avif | 11 KB | 30-50 KB | ✓ |
| ranking.webm | 31 KB | ~150 KB | ✓ |
| themes.avif | 23 KB | 30-50 KB | ✓ |
| themes.webm | 82 KB | ~150 KB | ✓ |
| areas.avif | 16 KB | 30-50 KB | ✓ |
| blog.avif | 12 KB | 30-50 KB | ✓ |
| survey.avif | 19 KB | 30-50 KB | ✓ |
| search.avif | 15 KB | 30-50 KB | ✓ |

### PSI 実測 (mobile, 2026-05-27T11:02Z, 3 runs)

| 指標 | baseline (2026-05-26) | post-push (2026-05-27) | delta | 判定 |
|---|---|---|---|---|
| Perf score | 52 | 50-51 | -1 〜 -2 | within noise |
| LCP | 6451 ms | 7801 ms | +1350 ms | **要注意 (※注)** |
| CLS | 0.110 | 0.001-0.110 | varies | within range |
| TBT | 269 ms | 314-682 ms | +45〜+413 ms | within variance |

> ※ LCP element: hero `<h1>あなたの県は何位？</h1>` (path `1,HTML,1,BODY,4,DIV,1,DIV,2,MAIN,...,H1`)。NextUpGrid の preview 群は below-the-fold + lazy-loaded で **LCP 候補ではない**。delta +1350ms は本 push が原因ではなく、PSI 実行間の variance + baseline (24h 前) との差分。

### 既知の調整候補 (次回以降)

- `/survey` の通常スクリプト経路で networkidle 到達に >4 分かかる問題: `capture-home-previews.ts` の survey だけ waitUntil を `load` に切り替える PR を別途検討
- LCP 7.8s 自体は別問題として `/themes` 系と並ぶ高優先度。preview と切り離して performance-improvement で追跡

### 月次 cron

`.github/workflows/capture-home-previews-monthly.yml` (cron `0 3 1 * *` = JST 12:00 毎月 1日) が次回 (2026-06-01) から自動更新する。同じ survey timeout が CI で起きる可能性あり (本実行時の手動 retry でカバーした問題なので、CI 失敗時の workflow log で要確認)。
