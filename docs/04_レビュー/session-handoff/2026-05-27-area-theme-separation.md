---
type: session-handoff
date: 2026-05-27
status: in-progress
branch: develop
commit: 86dcd47
tags: [handoff, area-theme-separation, page-components, migration-flow]
---

# Session Handoff — 2026-05-27 (area / theme 責務分離・page_components 棚卸し基盤)

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

## Homepage previews follow-ups (Task B 完了 2026-05-27, commit 406d0584)

- **`/survey` networkidle timeout**: `capture-home-previews.ts` で `/survey` だけ networkidle 到達に >4 分かかる。CI でも再現の可能性 → survey 限定で `waitUntil: "load"` に切替 + `output_dir/{key}.avif` 部分失敗を許容する retry 機構を追加するのが望ましい
- **homepage LCP 7.8s**: preview と無関係だが、別件として hero h1 系の LCP 改善は performance-improvement で別途追跡 (本ハンドオフのスコープ外)
