---
type: session-handoff
date: 2026-06-21
topic: blog SVG データ系譜復元 + アスペクト比統一 + 再発防止ゲート
status: completed
tags: [blog, svg, lineage, size-unify, quality-gate]
---

# セッションハンドオフ: blog SVG 系譜復元 + サイズ統一 + 再発防止

## このセッションで完了したこと

### 1. データ系譜の復元（38% → 62.3%、both 232→381/612）
「絵だけ」(json/source.json 消失) の neither SVG を SSOT から再生成。捏造防止のため旧SVG値↔SSOT照合（≥0.95）を必須化。
- **ranking 52**: `restore-ranking-from-svg.mjs`（旧SVG表示値→SSOT key確定→3点セット）
- **scatter 27**: `restore-scatter-from-svg.mjs`（記事リンク key を **値域で x/y 軸割当**。name検索の語順差脆弱性を回避）
- **findings 55**: `restore-findings-from-svg.mjs`（authored テキスト=旧SVG本文を json+source 化、SVGは richer 形式保持で再生成せず）
- source-backfill 15（`backfill-source.mjs` 強化 + `resolve-scatter-axes.mjs`）

### 2. アスペクト比統一（全6カタログ）
svg-builder 生成器は固定サイズ（bar columns 960×404 / scatter 960×624 / line 680×420 / tile 600×700 / findings 960 / stacked 680）だが、**旧SVGの非正規サイズが残存**していた。既存検証済み json から再描画（値不変・サイズのみ正規化）:
- **ranking 99枚 → 960×404**（`rerender-ranking-columns.mts`）。both 222/222 を **S3 API で正規幅実証**
- **scatter 8枚 → 960×624**（`rerender-scatter-canonical.mts` + 独自スキーマ2枚は正規points化）。both 33/33 実証

### 3. 再発防止ゲート（★新規/校正で全カタログ blocker）
- `svg-lint.mjs` に `lintSvgSize` + `classifyChartTypeFromName` 追加
- 配線: **`quality-gate.mjs`（pre-commit + publish-blog.yml = 新規作成・校正の両方）** + `audit-chart-quality.mjs`
- 全6カタログ blocker（`SIZE_ENFORCED`）。統合テスト: 760×532 ranking → blocker 確認済
- あわせて「1画像=1設定ファイル（source.json）」の系譜 blocker も既存（§1.7）

## ⚠️ 未対応 / 引き継ぎ事項

### A. `generate-article-charts.ts --validate` にサイズ検査が無い（要追加）
`validateSvg()`（line ~334）が `lintSvgContent` のみ呼び `lintSvgSize` を呼んでいない。**PR時CI（generate-article-charts.yml）でサイズ検査が抜ける**。
- **影響は限定的**: 公開の本ゲートは quality-gate（pre-commit + publish-blog.yml）で、そこはサイズ検査済。--validate は defense-in-depth の重複check。
- **未対応の理由**: このファイルは**並行セッションが未コミット編集中**（git レース回避のため触れなかった）。
- **対応方法**（並行作業 commit 後 or 次セッション）: `validateSvg` を
  ```js
  const a = lintSvgContent(content); const b = lintSvgSize(path.basename(svgPath), content);
  return { errors:[...a.errors,...b.errors], warnings:[...a.warnings,...b.warnings] };
  ```
  に変更 + import に `lintSvgSize` 追加。

### B. 非漏れと確認したもの（参考）
- `blog-critic` / `blog-editor`: サイズ参照0 だが、**サイズ/系譜は quality-gate が決定的強制**するので critic は意味品質に集中で正しい（漏れではない）。
- `article-writer`: 960×404 を認識済。`chart-author` / `audit-blog-svg-charts` SKILL は更新済。

## ★重要な教訓（標準・memory に記録済）
- **`push-r2-wrangler`（wrangler put）は flaky**: 「Upload complete」表示でも**実際に永続化しないことがある**（本セッションで scatter 8枚中5枚が黙って未永続化）。**R2 反映は S3 API（`diff-push-r2` / `PutObjectCommand`）で行い、`GetObjectCommand` で検証する**。公開URL（storage.stats47.jp）と `wrangler r2 object get` は**キャッシュ越し**なので検証に使えない（cache-bust query も Cloudflare が無視する場合あり）。

## 残作業（neither 209・legacy 掃除・非ブロッキング）
真実源: `.claude/state/blog/svg-lineage-LATEST.md` / 手法: `neither-restore-method.md` / 残22 backfill: `source-backfill-residue.md`
- manual 76（無意味名 inline-chart-N・個別判断）
- scatter 43（記事リンク値域不適合 = 未取込metric or 別指標。一部は **e-Stat 取り込み**が先）
- ranking flagged 31（複数系列比較・派生<95%・held）/ line 31 / tilemap 15 / stacked 13
- 副産物バグ: **marriages/divorces の SSOT値が誤り**（離婚キーに婚姻率の値）→ `docs/02_実装計画/05_指標バックログ.md §D`（estat-researcher→data-ingester で再取り込み）

## 関連 commit（develop）
`3dd2807a`〜`9e0f7cba`（backfill/resolver/restorer/rerender/size-gate/memory）。整合性監査は各節目で実施済（agent生成コードの捏造バグを3回捕捉・修正）。
