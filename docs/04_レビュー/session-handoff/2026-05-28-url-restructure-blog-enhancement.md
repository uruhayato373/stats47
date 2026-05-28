---
type: session-handoff
date: 2026-05-28
status: pending-deploy
branch: claude/compassionate-knuth-cp2GU
tags: [url-restructure, blog-quality, deploy-pending]
---

# セッションハンドオフ 2026-05-28｜URL 構造整理 + ブログ品質改善

別 PC で `git pull` した agent がこの続きを把握するための引き継ぎ。
**結論: コードは全て commit + push 済。残るは「ブログ記事の R2 公開デプロイ」のみ (ローカル環境必須)。**

## ブランチと commit

- ブランチ: `claude/compassionate-knuth-cp2GU` (origin に push 済)
- 関連 commit (新しい順):
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

## デプロイ後の検証 (両作業共通)

- URL: `curl -I https://stats47.jp/ranking` → 301 / `/compare/population` → 301 `/category/population/compare`
- blog: 公開した 6 記事が `https://stats47.jp/blog/<slug>` で 200、内部リンク・SVG が表示されるか
- GSC: 効果計測は W25 (2026-06-22) snapshot で
  - 既改修 3 記事 (child-height / temperature-extremes / habitable-area) の BLOG-WAVE-2026-05-25-auto 効果も同時期に確定

## 次の改善候補 (未着手、優先度順)

GSC 分析で特定済 (W21 snapshot ベース):

1. **scatter chart の汎用実装**: `.claude/scripts/blog/generate-article-charts.mjs` に `*-scatter.json → scatter` を追加 (今回 sunshine はインライン SVG で代替。汎用化すれば他の相関系記事に展開可)
2. **data schema 統一** (Phase B): `migrate-data-schema.mjs` 実装 → factual-check の value detector (Phase C) 解禁
3. **curiosity gap CI 検知**: `.claude/scripts/blog/check-quality.mjs` 実装 (タイトルに `なぜ|意外|唯一|真因|vs|逆転|?|倍|→` 含有チェック)
4. **SVG dark mode 一括対応**: 既存 SVG の `fill="#333"` 固定を `currentColor`/CSS var に
5. **改善ログ記録**: 効果確定後 `docs/05_改善ログ/gsc.md` に BLOG-WAVE-2026-W22 section 追加 (manufacturing-aichi 想定 +49 clicks/月)

## 参照

- URL 整理 plan: `~/.claude/plans/ok-validated-stroustrup.md`
- ブログ品質基準: `.claude/rules/blog-quality-standards.md`
- data schema / wave 命名: `.claude/rules/blog-data-schema.md`
- GSC 改善ログ: `docs/05_改善ログ/gsc.md`
- 公開 skill: `.claude/skills/blog/publish-article/SKILL.md`
