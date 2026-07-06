# OGP・カバー・リンクカード画像標準 (画像資産カタログ SSOT)

stats47.jp の **OGP 画像 / note カバー画像 / サイト内リンクカード画像 (light/dark)** の
種別・サイズ・生成方式・保存先・担当を管理する**単一ソース (SSOT)**。画像資産の棚卸し・
ギャラリー監査・生成パイプライン改善を行う agent (`image-prompt-curator` ほか) / skill
(`/audit-ogp-images`) / 人間はこれに従う。

> 背景 (2026-07-06): OGP は 6 route が Satori で動的生成、リンクカード画像は blog だけ供給済で
> ranking は「No Image」多発、note カバーは 2 系統併存、と種別ごとに生成方式・供給状態がバラバラで、
> 全体を目視確認する手段が無かった。方式は `chart-component-standards.md` /
> `blog-svg-chart-standards.md` と同じ「rules に規約カタログ 1 ファイル、skill/agent は参照のみ」。
>
> **★方針決定 (2026-07-06): OGP は「事前生成した静的画像を R2 配信」に統一する** (§5)。ランタイムの
> next/og ImageResponse は Cloudflare Worker で例外 (error 1101) を投げ 500 になるため使わない。生成は
> Node/CI で Satori レンダリング (ローカル npm フォントを使うため Worker と違い健全) → R2。完全DBレス /
> R2 snapshot 思想に一致し、home/category の静的 og-image.jpg・blog サムネ (Satori→R2) と同じパターン。

---

## 1. 画像資産カタログ (全種別)

> **正典の配信方式**: OGP は下表の「静的 R2 URL」を `openGraph.images` に設定する
> (`apps/web/src/lib/metadata/ogp-image.ts` の `ogpImageUrl` / `ogpImageKeys`)。ランタイム
> `opengraph-image.tsx` route は使わない (Worker 500)。theme のみビルド時 SSG prerender で例外的に稼働可。

| 種別 (tab) | サイズ・比率 | 生成方式 (正典 = 事前生成 → R2) | 配信 URL / R2 キー | 生成スクリプト | 担当 agent |
|---|---|---|---|---|---|
| OGP: `/` (サイト共通) | 1200×630 (1.91:1) | 静的 (既存 `public/og-image.jpg`) | `stats47.jp/og-image.jpg` | (静的アセット) | image-prompt-curator |
| OGP: blog | 1200×630 | Satori(Node) → R2 | `app/blog/<slug>/ogp/ogp.png` | `generate-blog-thumbnails-cloud.ts` | blog-editor |
| OGP: ranking | 1200×630 | Satori(Node) → R2 | `app/ranking/<key>/ogp/ogp.png` | `generate-ogp-images.ts --type ranking` | ranking-ui-manager |
| OGP: theme | 1200×630 | Satori SSG prerender (ビルド時、例外的に稼働) | `themes/<slug>/opengraph-image` (route) | (ビルド時 prerender) | theme-ui-manager |
| OGP: category | 1200×630 | 静的フォールバック (`og-image.jpg`) | `stats47.jp/og-image.jpg` | (静的アセット) | ranking-ui-manager |
| OGP: areas | 1200×630 | Satori(Node) → R2 | `app/areas/<code>/ogp/ogp.png` | `generate-ogp-images.ts --type areas` | ranking-ui-manager |
| OGP: tag / survey / cities | — | 親 `/` の静的 `og-image.jpg` に依存 (専用なし) | — | — | (要否は §3) |
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

0. **ランタイム生成 OGP が本番で 500 (Cloudflare Worker 例外 1101)** — 2026-07-06 監査で確定 → **静的 R2 方式へ移行 (§5)**。
   - **500 を返していた**: `blog` / `ranking` / `areas` の OGP (ランタイム `ƒ` レンダリング)。SNS・Twitter・Slack の
     カードが全ページで表示されなかった。R2 非依存の `/opengraph-image` (DefaultOgp) すら 500 で、next/og
     (Satori + resvg-wasm) のランタイムレンダリング自体が Worker で例外を投げる (font-loader の Google Fonts
     ランタイム fetch も同経路)。
   - **200 を返す**: `theme` OGP (`generateStaticParams` で**ビルド時 prerender**)。
   - **是正 (コード変更実施済・要デプロイ)**: メタデータを静的 R2 URL に切替 (§5、`ogp-image.ts`)。blog は既存
     `app/blog/<slug>/ogp/ogp.png` が R2 にあり即修正。ranking/areas は生成後にデプロイ。
   - **実行順**: (1) `generate-ogp-images.yml` (ranking/areas を `apply=true`) で R2 に ogp.png 生成 →
     (2) develop→main デプロイ → (3) 本番 og:image を実測 (`curl -s <URL> | grep 'og:image'` が R2 URL・200)。
     blog は (1) 不要。ランタイム `opengraph-image.tsx` route は参照されなくなる (dead、削除は後日清掃)。
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

## 5. OGP 画像の生成・配信方式 (正典)

**OGP は事前生成した静的画像を R2 に保存し、配信時は静的 URL を参照する。** サイト全体で統一
(note カバーも同思想)。ランタイム next/og ImageResponse は Cloudflare Worker で例外 (1101) を投げるため使わない。

- **レンダリングは Node/CI (またはクラウドセッション) で** Satori。ローカル npm フォント
  `@expo-google-fonts/noto-sans-jp` を使うため Worker と違い健全。tsx は `--tsconfig apps/web/scripts/tsconfig.ogp.json`
  (jsx: react-jsx) で起動する (既存 OGP コンポーネント JSX を automatic runtime で描画するため)。
  - **ranking / areas OGP**: 既存 `RankingOgp` / `AreaOgp` コンポーネント (データ入り: TOP3/BOTTOM・強弱・地図) を
    satori 描画。satori 非互換なら共有 render lib のタイトルカードにフォールバック。
    ※ 両コンポーネントは satori-strict 対応済 (mixed text+式 → template literal 化、`dotted`→`dashed`、
    複数子 span に `display:flex`)。この修正が無いと全件フォールバックする。
  - **blog OGP / ranking カード / note カバー**: 共有 render lib `apps/web/scripts/lib/blog-thumbnail-render.ts`
    の `buildElement({title, subtitle, category, domainPath})` (共通デザイン・drift 防止)。note は `size` 引数で 1280×670。
- **配信 URL 解決は `apps/web/src/lib/metadata/ogp-image.ts`** の `ogpImageUrl(ogpImageKeys.<type>(id))`。
  各ページの `generateMetadata` が `openGraph.images` / `twitter.images` にこの静的 R2 URL を設定する。
- **生成スクリプト (クラウド/ローカルから直接実行)**:
  - blog OGP = `generate-blog-thumbnails-cloud.ts` (既存、`app/blog/<slug>/ogp/ogp.png`)
  - ranking OGP / areas OGP / ranking カード / note カバー = `generate-ogp-images.ts --type <ranking|areas|ranking-cards|note-covers>`
    → `.local/r2/<key>` staging に書き出し → `diff-push-r2.ts --prefix <app/ranking|app/areas|note>` で S3 push。
  - CI fallback = `generate-ogp-images.yml` (手動 dispatch。ただしクラウド連携トークンは actions:write 無しのため、
    R2 creds のあるセッション/ローカルからの直接実行が主経路)。
- **新規 ranking/area/blog/note を公開したら OGP/カバーも生成する**。未生成だと og:image が 404 になる。
- **ranking リンクカード**は `app/ranking/<key>/thumbnail-{light,dark}.webp` (★新 canonical。旧
  `ranking/prefecture/<key>/<year>/thumbnails/` は年入り・非 `app/` 名前空間で廃止)。`RankingThumbnail` / survey ページが参照。
- **note カバー**: `note/<vertical>/<slug>/images/cover-1280x670.png` に事前生成 archive (Satori 統一デザイン)。
  既存 SVG 系統 (`generate-note-covers.mjs` + `svg-to-png.js`) と Remotion `NoteCover` は **deprecate (削除しない)**。
  ※ note.com 公開済みカバーの差し替えではなく R2 archive + 今後の正系統。
- **theme のみ例外**: `generateStaticParams` でビルド時 prerender され稼働するため、当面ランタイム route を残す。
  **home/category は既存の静的 `public/og-image.jpg`** を使う。

### 画像生成 AI (背景素材・Phase 2 予定)
- テキスト・数値の重畳は上記 Satori が担う。動的タイトル差し込みは静的 PNG を事前生成することで実現する。
- 背景素材の AI 生成: Cloudflare Workers AI SDXL (`apps/remotion/src/lib/ai-image.ts`、日次クォータ + sha256
  キャッシュ) を手本に Gemini API (`gemini-2.5-flash-image` 系) を導入予定。背景は R2
  `brand/ogp-backgrounds/<use>/<name>-{light,dark}.png`。
- 外部 AI (Midjourney 等) 用プロンプトは `image-prompt` skill の catalog 43 種。

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
