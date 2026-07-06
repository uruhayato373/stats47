# OGP・カバー・リンクカード画像標準 (画像資産カタログ SSOT)

stats47.jp の **OGP 画像 / note カバー画像 / サイト内リンクカード画像 (light/dark)** の
種別・サイズ・生成方式・保存先・担当を管理する**単一ソース (SSOT)**。画像資産の棚卸し・
ギャラリー監査・生成パイプライン改善を行う agent (`image-prompt-curator` ほか) / skill
(`/audit-ogp-images`) / 人間はこれに従う。

> 背景 (2026-07-06): OGP は 6 route が Satori で動的生成、リンクカード画像は blog だけ供給済で
> ranking は「No Image」多発、note カバーは 2 系統併存、と種別ごとに生成方式・供給状態がバラバラで、
> 全体を目視確認する手段が無かった。方式は `chart-component-standards.md` /
> `blog-svg-chart-standards.md` と同じ「rules に規約カタログ 1 ファイル、skill/agent は参照のみ」。

---

## 1. 画像資産カタログ (全種別)

| 種別 (tab) | サイズ・比率 | 生成方式 | URL / R2 キー | 表示コンポーネント | 担当 agent |
|---|---|---|---|---|---|
| OGP: `/` (サイト共通) | 1200×630 (1.91:1) | Satori `apps/web/src/app/opengraph-image.tsx` (`DefaultOgp`) | `stats47.jp/opengraph-image` | (メタタグ) | image-prompt-curator |
| OGP: blog | 1200×630 | Satori `blog/[slug]/opengraph-image.tsx` (`BlogOgp`、frontmatter) | `stats47.jp/blog/<slug>/opengraph-image` | (メタタグ) | blog-editor |
| OGP: ranking | 1200×630 | Satori `ranking/[rankingKey]/opengraph-image.tsx` (`RankingOgp`、R2 values から top3/last) | `stats47.jp/ranking/<key>/opengraph-image` | (メタタグ) | ranking-ui-manager |
| OGP: theme | 1200×630 | Satori `themes/[themeSlug]/opengraph-image.tsx` (インライン JSX、`generateStaticParams`) | `stats47.jp/themes/<slug>/opengraph-image` | (メタタグ) | theme-ui-manager |
| OGP: category | 1200×630 | Satori `category/[categoryKey]/opengraph-image.tsx` (`CategoryOgp`) | `stats47.jp/category/<key>/opengraph-image` | (メタタグ) | ranking-ui-manager |
| OGP: areas | 1200×630 | Satori `areas/[areaCode]/opengraph-image.tsx` (`AreaOgp`、strengths/weaknesses 上位2) | `stats47.jp/areas/<code>/opengraph-image` | (メタタグ) | ranking-ui-manager |
| OGP: tag / survey / cities | — | **専用なし (供給ギャップ)** → 親 `/` の `DefaultOgp` に依存 | — | — | (未定・要否は §3) |
| カード: blog (light/dark) | webp (16:9 相当) | `apps/web/scripts/generate-blog-thumbnails-cloud.ts` (Satori、`lib/blog-thumbnail-render.ts`) | R2 `app/blog/<slug>/thumbnail-{light,dark}.webp` | `ThemeAwareImage` (blog-article-grid) | blog-editor |
| カード: ranking (light/dark) | png | **供給不完全 (既知課題)** | R2 `ranking/prefecture/<key>/<year>/thumbnails/thumbnail-{light,dark}.png` | `RankingThumbnail` (baseSrc 解決、無ければ "No Image") | ranking-publisher |
| カード: theme / category | — | **なし (要否は §3 で判断)** | — | (共有 SVG タイルマップ or blog サムネ流用) | — |
| note カバー | 1280×670 (≒1.91:1) | **2 系統併存 (既知課題)**: (A) Remotion `apps/remotion/src/features/ranking-note/NoteCover.tsx` → R2 `sns/` / (B) `.claude/scripts/note/generate-note-covers.mjs` (SVG→PNG) → R2 `note/<vertical>/<slug>/` | R2 `note/<vertical>/<slug>/header.png` 等 | note.com アップロード | note-manager |

### OGP コンポーネントの実体
`apps/web/src/features/ogp/`: `DefaultOgp` / `BlogOgp` / `RankingOgp` / `CategoryOgp` / `AreaOgp` /
`JapanMapSvg` + デザイントークン `brand.ts` + フォント `font-loader.ts` (Noto Sans JP 400/700/900)。
theme のみ専用コンポーネント無し (route 内インライン JSX)。twitter-image は無く、OGP を Twitter が流用。

---

## 2. 目視確認 (ギャラリー) と棚卸し

種別ごとに 1 枚の自己完結 HTML で目視確認する。生成は
`.claude/scripts/ogp/build-image-gallery.mjs` (skill `/audit-ogp-images`)。動的 OGP は本番 URL、
静的資産は R2 公開 URL (`https://storage.stats47.jp`) を `<img loading="lazy">` で直参照し、
画像をローカルへ落とさない (read-only)。ローカルはブラウザで直接開く。クラウドは `SendUserFile`
でユーザーに渡す (`Artifact` は CSP が外部ホスト画像をブロックするため不可)。

```bash
# 特定タブを目視 (クラウドでは生成 HTML を Artifact 化)
node .claude/scripts/ogp/build-image-gallery.mjs --tabs blog-ogp,blog-card --limit 20
# 欠落を HEAD/GET で確定 (stdout に tab: expected/ok/missing 集計)
node .claude/scripts/ogp/build-image-gallery.mjs --tabs ranking-card --check
# 全種別を棚卸し → .claude/state/ogp/inventory.json
node .claude/scripts/ogp/build-image-gallery.mjs --audit
```

- **サンプリング**: ranking 系タブは既定 30 件 (先頭 10 + 等間隔 20)、`--all` で全量。他タブは全量。`--audit` も既定はサンプリング (全量は `--audit --all`)。
- **真実を映す**: OGP タブは各ページの `og:image` meta から**実際に配信されている URL**を解決する。静的フォールバック (home/category の `/og-image.jpg`)・ハッシュ付き URL・ランタイム 500 をそのまま反映する。
- **欠落検出**: 常時 `img onerror` バッジ (目視) + `--check`/`--audit` 時に GET でステータス + content-type を確定 (機械)。
- **棚卸し出力** `.claude/state/ogp/inventory.json`: 種別 × 比率 × 供給状態 (`satori-route` /
  `r2-static` / `none`) × entries / expected / ok / missing。tag/survey/cities の「専用なし」も記録。

---

## 3. 既知課題 (供給ギャップ)

改善は inventory を見てから着手する。実行は種別ごとの既存 agent に委譲 (§4)。

0. **★最重要: ランタイム生成 OGP が本番で 500 (Cloudflare Worker 例外 1101)** — 2026-07-06 監査で確定。
   - **500 を返す**: `blog` / `ranking` / `areas` の OGP (ランタイム `ƒ` レンダリング)。SNS・Twitter・Slack の
     カードが**全ページで表示されない**。R2 非依存の `/opengraph-image` (DefaultOgp) すら 500 のため、
     R2 read ではなく**共通依存の `apps/web/src/features/ogp/font-loader.ts` (Google Fonts をランタイム fetch)**
     が Worker で例外を投げている疑いが濃厚 (要 Worker ログで確定)。
   - **200 を返す**: `theme` OGP (`generateStaticParams` で**ビルド時 prerender** されるため。ビルド時は
     フォント fetch が成功する)。
   - **静的フォールバック**: `home` / `category` は Satori route を使わず `/og-image.jpg` (静的) を参照するため
     実害なし (ただし CategoryOgp は死んでいる)。
   - → 是正はランタイムでのフォント埋め込み (ローカル同梱 TTF を `fs`/import で読む) 等。**別タスク** (本監査の
     スコープ外・read-only)。検証: `curl -s -o /dev/null -w '%{http_code} %{content_type}' https://stats47.jp/ranking/<key>/opengraph-image`。
1. **ranking リンクカード供給不完全**: `RankingThumbnail` は `ranking/prefecture/<key>/<year>/thumbnails/thumbnail-{light,dark}.png` を期待するが大半 404 で「No Image」表示。→ `generate-blog-thumbnails-cloud.ts` パターンの Satori 一括生成で R2 供給し解消 (担当: ranking-publisher + snapshot-exporter)。
2. **note カバー 2 系統併存**: Remotion `NoteCover.tsx` (→ `sns/`) と `generate-note-covers.mjs` (→ `note/`) がドリフト。→ ギャラリーで目視比較し正系統を本 rules に確定、他方は deprecate 記載 (削除しない)。
3. **OGP 専用なし route**: `/tag/<key>` `/survey/<key>` `/areas/<code>/cities/<city>` は親 `/` の `DefaultOgp` を流用 (現状その `DefaultOgp` 自体が 500)。→ 課題 0 の解消後、流入が増えたら専用 opengraph-image を検討 (判定は improvement-triage 経由)。
4. **theme / category カード画像なし**: 一覧での視認性のため要否判断。既定は「作らない」(共有タイルマップ SVG or blog サムネ流用で代替)。

---

## 4. 役割分担

| 工程 | 担当 |
|---|---|
| 画像資産の棚卸し・ギャラリー監査 (read-only)・本 rules の維持 | `image-prompt-curator` (skill `/audit-ogp-images`) |
| デザイン妥当性の目視評価 | `ui-reviewer` |
| 外部 AI / 背景素材用の画像プロンプト生成 | `image-prompt-curator` (skill `/image-prompt`) |
| ranking リンクカード供給 (R2 生成) | `ranking-publisher` + `snapshot-exporter` |
| blog OGP / サムネ | `blog-editor` |
| note カバー | `note-manager` |
| R2 push | CI / `r2-publisher` |
| 改善施策の status 管理 | `improvement-triage` (バックログ書き込みは排他) |

---

## 5. 画像生成 AI の方針

- **テキスト・数値の重畳は Satori** (`next/og` ImageResponse) が担う。動的タイトル差し込みが要る OGP を静的画像化しない (記事数分の再生成コストが破綻)。
- **背景素材の AI 生成** (Phase 2 予定): Cloudflare Workers AI SDXL (`apps/remotion/src/lib/ai-image.ts`、日次クォータ + sha256 キャッシュ) を手本に Gemini API (`gemini-2.5-flash-image` 系) を導入予定。背景は R2 `brand/ogp-backgrounds/<use>/<name>-{light,dark}.png`、Satori 側は `brand.ts` の `OGP_BACKGROUNDS` レジストリで参照 (ビルド時 fetch → data URI)。
- 外部 AI (Midjourney 等) 用プロンプトは `image-prompt` skill の catalog 43 種 (`.claude/skills/image-prompt/reference/catalog.md`)。

---

## 6. 関連

- ギャラリー生成: `.claude/scripts/ogp/build-image-gallery.mjs`
- 監査スキル: `.claude/skills/ui/audit-ogp-images/SKILL.md`
- 棚卸し state: `.claude/state/ogp/inventory.json`
- 画像プロンプト: `.claude/skills/image-prompt/SKILL.md` / `reference/catalog.md`
- OGP コンポーネント: `apps/web/src/features/ogp/`
- R2 キー設計: `.claude/rules/r2-storage-design.md`
- リンクカード表示: `apps/web/src/components/atoms/ThemeAwareImage.tsx`
- agent: `.claude/agents/image-prompt-curator.md`
