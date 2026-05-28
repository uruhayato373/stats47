---
type: session-handoff
date: 2026-05-28
status: pending-deploy
branch: claude/compassionate-knuth-cp2GU
tags: [url-restructure, blog-quality, svg-darkmode, chart-audit, deploy-pending]
---

# セッションハンドオフ 2026-05-28｜URL 構造整理 + ブログ品質改善 + チャート品質基盤

別 PC で `git pull` した agent がこの続きを把握するための引き継ぎ。
**結論: コードは全て commit + push 済。残るはローカル環境必須の 2 つ — (1) ブログ記事の R2 公開デプロイ、(2) 本番 SVG のチャート品質監査・再生成。**

## ブランチと commit

- ブランチ: `claude/compassionate-knuth-cp2GU` (origin に push 済)
- 関連 commit (新しい順):
  - `65f8f6b` feat(blog-charts): チャート品質の監査スキル + brushup 連携 (a+b 閉ループ)
  - `5548e92` feat(blog-charts): --validate に dark mode / パレット品質チェックを追加
  - `a53bba1` feat(svg-builder): 全チャート種に dark mode 対応を追加
  - `b62c738` content(blog): 残り 3 原稿を補強し全 5 記事を公開状態に
  - `4129a45` content(blog): 3 記事の curiosity gap 強化と内部リンク補強
  - `c474283` docs: URL 構造設計と 3 タクソノミー役割分担を明文化 (Phase 4)
  - `ed77e6a` refactor(routes): /themes を動的ルート化 (Phase 3)
  - `8dfc832` refactor(routes): /compare を /category/[key]/compare に統合 (Phase 2)
  - `8ad7977` refactor(routes): /ranking 一覧ページを廃止し / に 301 統合 (Phase 1)

## 完了済 (DONE)

### 作業 1: URL 構造整理 (Phase 1-4) — コード変更、push 済

Plan: `~/.claude/plans/ok-validated-stroustrup.md`

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | `/ranking` 一覧削除 → `/` に 301 (middleware)。内部リンク 11 箇所を `/themes` に差替 | コード済 |
| 2 | `/compare/*` → `/category/[key]/compare` サブパス統合 + 301 | コード済 |
| 3 | `/themes/<key>` 17 ハードコード → `[themeSlug]/page.tsx` 動的化 (local-finance は static 維持) | コード済 |
| 4 | `docs/01_技術設計/15_URL構造.md` + `16_タクソノミー役割分担.md` 新規、deprecated 警告撤回 | 済 |

**未検証 (ローカルで要実施)**:
- `cd apps/web && npm run build` で SSG 表記確認 (`○ Static`/`● SSG`、`ƒ Dynamic` 化してないか)
  - 特に `/themes/local-finance` (static) と `/themes/[themeSlug]` (dynamic) の共存、`/themes/local-finance/cities` 維持を確認
- 既存 TS エラー 1 件 `apps/web/src/app/ranking/[rankingKey]/page.tsx:52` の `GroupRankingItem` は**本作業と無関係の既存バグ** (本セッション前から存在)。別途対応
- デプロイ: feature → develop → PR develop→main → Cloudflare Pages 自動 deploy → `/purge-cdn`

### 作業 2: ブログ品質改善 — 原稿編集、push 済 / **R2 公開は未実施**

`docs/21_ブログ記事原稿/` の全 5 原稿を品質基準 (curiosity gap / callout 2-4 / 内部リンク 3-5) に補強。

| slug | 公開種別 | 主な改修 |
|---|---|---|
| `manufacturing-aichi-dominance` | 既存R2上書き | title 矛盾型化、callout 0→3、内部リンク 1→6 |
| `depopulation-area-medical-facilities` | 新規公開 | seoTitle 疑問型、県名6→/areas リンク、[!WARNING] |
| `koumuin-claude-code-estat-automation` | 新規公開 | title 数値前面化、[!WARNING] セキュリティ、内部リンク 0→4 |
| `assembly-answer-chatgpt-5steps` | 既存R2上書き | [!WARNING]/[!TIP] callout 化、内部リンク 0→4 |
| `estat-7-techniques-from-unusable-to-usable` | 既存R2上書き | [!NOTE]/[!WARNING] callout 化、内部リンク 0→4 |
| `sunshine-solar-housing-correlation` | 新規公開 | **散布図プレースホルダを slope chart インライン SVG 実装**、内部リンク 0→6 |

全 6 原稿とも `published: true` / `publishedAt` 設定済。

### 作業 3: チャート品質基盤 (svg-builder dark mode + 監査スキル) — コード push 済 / **本番 SVG 監査・再生成は未実施**

ブログのチャート品質を「コードで一律統一」する基盤を整備 (エージェント増設ではなく lint + 決定的描画で統一する方針)。

**設計判断の経緯** (議論結果):
- チャート描画は決定的問題 → `svg-builder` (コード) が正解。種類ごとの agent 分割は分散を増やすため不採用 (CLAUDE.md 原則 5)
- 品質バラつきの主因は brushup が**インライン SVG を手書き**していること → dark mode 非対応 + 13% 数値捏造の原因
- 公開済記事の元データ `data/*.json` は publish 後削除され R2 に残らない → **決定的な一括再生成は不可**。検出 (スキル) と再生成 (brushup の data 再取得) を分離

**実装済**:

| commit | 内容 |
|---|---|
| `a53bba1` | `svg-builder` 全 5 チャート種 (scatter/line/bar/stacked/choropleth) に dark mode 対応。`shared/theme.ts` の `svgThemeStyle()` が `@media (prefers-color-scheme:dark)` 付き `<style>` を出力。theme 依存色を svg-* class 化、データ色は維持。テスト 5 件 + vitest workspace 登録 |
| `5548e92` | `/generate-article-charts --validate` に dark mode/パレット品質チェック追加。data/*.svg + article.md インライン SVG 両方を検査。ERROR (構造) のみ CI fail、WARN (dark mode/theme 色) は可視化のみ |
| `65f8f6b` | 監査スキル `/audit-chart-quality` 新規 + brushup 連携。lint を `lib/svg-lint.mjs` に共有化。`select-brushup-candidates.mjs` が `chart-audit.json` を読み chartIssues を付与 (GSC 主軸 + 同点 tiebreaker) |

**dark mode の技術的制約 (既知)**: 外部 SVG は `<img>` 描画でサンドボックス化され `.dark` クラス (手動トグル) を参照不可。`prefers-color-scheme` で **OS レベル dark に追従**する方式 (大多数のユーザーをカバー)。完全追従にはインライン SVG 化が必要だが markdown 肥大化とのトレードオフで非採用。

## 残作業 (PENDING) — ★ ローカル環境 (R2 認証あり) で実施

リモートコンテナでは R2 push 不可 (認証情報・`.local/r2`・ローカル D1 なし) のため未実施。
ブログ記事は git 管理外 (R2 配信) なので、以下はローカルでのみ可能。

### 手順 (順序厳守)

```bash
# 0. このブランチを取り込む
git pull origin claude/compassionate-knuth-cp2GU

# 1. 各記事を publish (factual-check gate を必ず確認)
#    /publish-article <slug> を 6 件実行 (skill 経由)
#    対象: manufacturing-aichi-dominance / depopulation-area-medical-facilities /
#          koumuin-claude-code-estat-automation / sunshine-solar-housing-correlation /
#          assembly-answer-chatgpt-5steps / estat-7-techniques-from-unusable-to-usable

# 2. D1 articles 更新
/sync-articles

# 3. R2 push (blog のみ)
/sync-snapshots --only blog

# 4. Cloudflare cache 消去
/purge-cdn
```

### 注意点

- **factual-check gate**: `/publish-article` は publish 前に `article-factual-check.mjs` を実行。
  - `sunshine` のインライン SVG は本文記載の実値 (高知/佐賀/長野/神奈川/大阪のランク) のみ使用、data/ 非依存なので通過するはず。FAIL したら出力の RANK_MISMATCH を確認
  - 他記事は数値を本文から引用済
- **上書き vs 新規**: manufacturing-aichi / assembly / estat-7 は既存 R2 記事の上書き、残り 3 件は新規
- **publish-article は draft を `.local/r2/blog/<slug>/` にコピー後 `docs/21_ブログ記事原稿/<slug>` を削除する** 仕様 (skill step 6)。削除して良いか確認プロンプトが出る

### 手順 (作業 3: 本番チャートの監査・再生成)

```bash
# 1. R2 から全ブログを pull
npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix blog

# 2. 全 SVG を監査 → 優先度レポート + .claude/state/blog/chart-audit.json
/audit-chart-quality
#   または: node .claude/scripts/blog/audit-chart-quality.mjs

# 3. 以降の /auto-brushup-batch が chart-audit.json を読み、
#    dark mode 非対応の記事を (GSC 改善余地と合わせて) 優先選定。
#    brushup 時に data 再取得 + svg-builder でチャート再生成 → dark mode + 捏造を同時解消
/auto-brushup-batch --count 5

# 4. 再生成後の品質を確認
node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --validate
```

注意:
- **一括自動再生成はしない** (元 data/*.json が R2 に残らないため決定的不可)。brushup サイクルで data を再取得しながら段階的に解消するのが設計
- dark mode は UX ポリッシュで緊急度は低い。アクセスアップが優先なら作業 3 は後回しで可

## デプロイ後の検証 (両作業共通)

- URL: `curl -I https://stats47.jp/ranking` → 301 / `/compare/population` → 301 `/category/population/compare`
- blog: 公開した 6 記事が `https://stats47.jp/blog/<slug>` で 200、内部リンク・SVG が表示されるか
- GSC: 効果計測は W25 (2026-06-22) snapshot で
  - 既改修 3 記事 (child-height / temperature-extremes / habitable-area) の BLOG-WAVE-2026-05-25-auto 効果も同時期に確定

## 次の改善候補 (未着手、優先度順)

GSC 分析で特定済 (W21 snapshot ベース):

1. ~~**scatter chart の汎用実装**~~ → **完了** (`a53bba1`): svg-builder の `generateScatterSvg` は実装済かつ dark mode 対応。今後の相関記事は svg-builder 経由で生成すること (sunshine のインライン SVG も将来 svg-builder に載せ替え推奨)
2. **data schema 統一** (Phase B): `migrate-data-schema.mjs` 実装 → factual-check の value detector (Phase C) 解禁
3. **curiosity gap CI 検知**: `.claude/scripts/blog/check-quality.mjs` 実装 (タイトルに `なぜ|意外|唯一|真因|vs|逆転|?|倍|→` 含有チェック)
4. ~~**SVG dark mode 一括対応**~~ → **基盤完了** (`a53bba1`/`5548e92`/`65f8f6b`): svg-builder dark mode 対応 + 監査スキル + brushup 連携まで実装済。残るは本番 SVG の監査・再生成 (上記「残作業 作業 3」、ローカル実行)
5. **改善ログ記録**: 効果確定後 `docs/05_改善ログ/gsc.md` に BLOG-WAVE-2026-W22 section 追加 (manufacturing-aichi 想定 +49 clicks/月)
6. **sunshine のインライン SVG を svg-builder 化**: 現状手書き (dark mode 非対応)。`*-scatter.json` を作り svg-builder の scatter で再生成すると dark mode 対応になる (監査スキルが既に検出済)

## 参照

- URL 整理 plan: `~/.claude/plans/ok-validated-stroustrup.md`
- ブログ品質基準: `.claude/rules/blog-quality-standards.md`
- data schema / wave 命名: `.claude/rules/blog-data-schema.md`
- GSC 改善ログ: `docs/05_改善ログ/gsc.md`
- 公開 skill: `.claude/skills/blog/publish-article/SKILL.md`
- チャート監査 skill: `.claude/skills/blog/audit-chart-quality/SKILL.md`
- SVG lint 共有ライブラリ: `.claude/scripts/lib/svg-lint.mjs`
- チャート描画 (dark mode 対応): `packages/svg-builder/src/shared/theme.ts` + `charts/*.ts`
- チャート設計判断 (SVG vs React, agent vs code): 本セッション内で議論 (静的 SVG 既定 / svg-builder 単一描画経路 / 種類別 agent は不採用)
