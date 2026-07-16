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
| OGP: areas | 1200×630 | **県シルエットカード** (topojson+satori、§5.7) → R2 | `app/areas/<code>/ogp/ogp.png` | `generate-ogp-images.ts --type areas` | ranking-ui-manager |
| 素材: 県シルエットカード (SNS) | 5比率 (1200×630 / 1080×1350 / 1080×1080 / 1080×1920 / 1920×1080) × blue/dark | 決定的生成 (topojson+satori、§5.7) → R2 | `sns/pref-silhouette/<code2>/card-<ratio>-<theme>.png` (47県×10枚) | `generate-ogp-images.ts --type pref-silhouette` | image-prompt-curator (規約/監査)・IG 消費は instagram-strategist |
| OGP: tag / survey / cities | — | 親 `/` の静的 `og-image.jpg` に依存 (専用なし) | — | — | (要否は §3) |
| カード: blog (light/dark) | webp (16:9 相当) | `apps/web/scripts/generate-blog-thumbnails-cloud.ts` (Satori、`lib/blog-thumbnail-render.ts`) | R2 `app/blog/<slug>/thumbnail-{light,dark}.webp` | `ThemeAwareImage` (blog-article-grid) | blog-editor |
| カード: ranking (light/dark) | png | **供給不完全 (既知課題)** | R2 `ranking/prefecture/<key>/<year>/thumbnails/thumbnail-{light,dark}.png` | `RankingThumbnail` (baseSrc 解決、無ければ "No Image") | ranking-publisher |
| カード: theme / category | — | **なし (要否は §3 で判断)** | — | (共有 SVG タイルマップ or blog サムネ流用) | — |
| note カバー | 1280×670 (≒1.91:1) | **系統併存 (既知課題)**: (A) Remotion `apps/remotion/src/features/ranking-note/NoteCover.tsx` → R2 `sns/` / (B) `.claude/scripts/note/generate-note-covers.mjs` (SVG→PNG、stats47-note 汎用) / **(C) `.claude/scripts/note/generate-koumuin-covers.cjs`** (koumuin-* 専用の正典。共通背景 `assets/koumuin-cover-bg.png` + カテゴリトーン + 中央ボックス、frontmatter 駆動、sharp で背景 bitmap に前景 SVG を合成し PNG 直出力。無ければダーク背景フォールバック) | docs/31 `images/cover-1280x670.png` → note.com アップロード | note-manager |

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

### 自動化 (トークン消費ゼロ・決定的)
- **週次自動監査+自動修復**: `.github/workflows/ogp-image-audit-weekly.yml` (日曜 03:00 JST)。全種別の欠落分だけ
  Satori 生成→R2 push (self-heal) → 最終監査 → inventory を develop commit → 修復後も残れば `[OGP Alert]` Issue
  (`ogp-alert,auto-generated`)。検知も生成も Node fetch + Satori のみ (LLM 不使用)。
- **新規 ranking 公開時フック**: `sync-snapshots.yml` の `sync-ranking-keys` job が KNOWN keys 再生成直後に
  `generate-ogp-images.ts --type ranking|ranking-cards --source known --max-generate 500` で新キー分を即生成→R2。
  未生成による og:image 404 を公開時に先回りする。
- **blog** は別途 `pr-quality-check.yml` の Blog Thumbnail Gate で PR ゲート済 (`generate-blog-thumbnails-cloud.ts --audit`)。
- 手動監査は `/audit-ogp-images` (下記)。`generate-ogp-images.ts --audit` は欠落>0 で exit 1 (CI ゲート可)。

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
  - **blog の背景合成 (2026-07-07 実装)**: blog の OGP と**リンクカード** (`thumbnail-{light,dark}.webp`) は
    `buildElement(data, dark, { background: true })` で日本地図ブランド背景を合成する。背景アセットはリポジトリ同梱の
    `apps/web/scripts/lib/assets/ogp-bg-brand-{light,dark}.jpg` (元 PNG = `scripts/lib/assets/source/stats-background-{light,dark}.png`)。
    **背景合成は blog 限定** — ranking/areas/note の OGP・ranking カードは `background` オプション未指定でデフォルト背景
    (グラデ+ストライプ) のまま (意図的な非対称。横展開は Phase 2)。blog カードの**表示比率も全画面 1200×630 に統一**
    (旧 PC 正方形 `md:aspect-square` を撤去。1 枚の背景をクロップ無しで OGP/カード兼用)。push が途中失敗で全ロスト
    しないよう generate-blog-thumbnails-cloud.ts は put リトライ+記事単位 try/catch 済。
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
  - **★koumuin-claude-code / koumuin-estat-claude-code は Satori 系の対象外 (二重 SSOT 回避・2026-07-09)**。
    この 2 シリーズは bespoke カバーが正典 = `.claude/scripts/note/generate-koumuin-covers.cjs`
    (共通背景 `assets/koumuin-cover-bg.png` + カテゴリトーン + 中央ボックス、frontmatter 駆動、sharp 合成)
    → `docs/31 images/cover-1280x670.png` → publish-note が note.com へアップロード。
    `generate-ogp-images.ts --type note-covers` はこの 2 vertical を `BESPOKE_COVER_VERTICALS` で除外する
    (Satori で R2 に別デザインを焼かない)。**カバーは派生物**で SSOT 入力は
    「frontmatter (title/is_paid/category) + 背景アセット + 生成器」= すべて git。docs/31・R2 のカバー PNG は再生成可能。
    `koumuin-gis` / `stats47-note` は従来どおり Satori 系対象。
- **theme のみ例外**: `generateStaticParams` でビルド時 prerender され稼働するため、当面ランタイム route を残す。
  **home/category は既存の静的 `public/og-image.jpg`** を使う。

### 画像生成 AI: ブログ OGP の記事別背景 (実装済・正典)

**blog OGP は記事ごとに Gemini で「文字なしの背景だけ」を生成し、タイトル・ブランドは既存 Satori/Sharp が
合成する** (2026-07-12 実装、高流入 top100 記事は本番 live)。旧 doc `23_ブログOGP生成AIパイプライン仕様.md` (docs/02_実装計画・削除)
の恒久運用スペックを本節に統合 (doc は削除・git 履歴に残る)。

- **コード SSOT (機械的)**: `apps/web/scripts/data/blog-ogp-visual-catalog.ts`
  — 6 系統 (map / people / economy / industry / timeline / comparison) × motif・固定スタイル `OGP_STYLE_PREFIX`
  (light / editorial / flat / 落ち着いた藍・**文字/数字/ロゴ/実顔/精密な地図境界を禁止**・左 1/3 をタイトル安全域として空ける)・
  category(17) / archetype(A-G) / tags → visualType の**決定的**対応表・model / 価格 / promptVersion 定数。
- **決定的分類 (モデルに分類させない)**: frontmatter `ogpVisualType` > `category` > `archetype` > `tags` > 既定
  (`map` / `prefecture-comparison`)。motif は有効な `ogpMotif` > visualType の既定 motif。解決 / hash の実装は
  `apps/web/scripts/lib/blog-ogp-visual.ts` (`resolveOgpVisual` / `computePromptHash` / frontmatter parser)。
- **パイプライン**: Gemini (`gemini-2.5-flash-image`) が背景 1 枚 → `normalizeAiBackground` (`blog-thumbnail-render.ts`)
  で 1200×630 cover + dark 処理 + 左タイトルスクリム (**satori 互換の JPEG**。webp は satori が解析不能で不可) →
  `buildElement(backgroundImage)` で合成 → R2。最終 4 キー (`thumbnail-{light,dark}.webp` / `ogp/ogp.png` /
  `ogp/ogp.json`) は不変、`ogp/background.jpg` (AI 背景) と `ogp.json.background` メタを追加。
  **別ジェネレーターは作らず `generate-blog-thumbnails-cloud.ts` を拡張**する。
- **改善は共通カタログ/スタイルのみ (個別プロンプト禁止)**: 品質不足は `OGP_STYLE_PREFIX` か
  `OGP_VISUAL_CATALOG` を直して同じ `--out-dir` へ再生成する。記事ごとの自由入力プロンプトは持たせない。
- **費用・安全弁**: ~$0.039/枚。`--budget-usd` 上限、`promptHash` 一致で再生成スキップ (キャッシュ)、
  生成失敗 / 予算切れ / キー無しは**ブランド背景へ fallback** (`ogp.json.background.source = "brand-fallback"`)。
- **クライアント**: `apps/web/scripts/lib/gemini-image-client.ts` — `x-goog-api-key`・30s timeout・
  429/5xx/timeout/network のみ指数バックオフ再試行・4xx 非再試行・**API キー/レスポンス本文をログ/エラーに出さない**。
  `GEMINI_API_KEY` は `.env.local` から自己ロード (値非表示、CI では no-op)。
- **生成コマンド**:
  ```
  # 純粋監査 (API を呼ばない・生成予定/最大費用のみ)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --limit N
  # ローカル目視 (R2 非書込・gallery /assets「ブログ OGP パイロット (local)」タブで確認)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug a,b --out-dir .local/ogp-pilot
  # 本番反映 (R2 push)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug <slugs> --apply
  ```
- **★cloud Claude Code / ローカル env なしの CI 経路 (2026-07-14〜)**: `GEMINI_API_KEY` は
  **GitHub Secrets 専任** (ローカル .env.local 管理は不要)。cloud セッションは
  `data/gemini-image-requests.json` に `{ "task": "blog-ogp", "slugs": [...], "budgetUsd": 0.5,
  "apply": true|false }` を書いて develop へ push すると `gemini-image-run.yml` が生成する
  (apply=false は artifact で目視検証・true は R2 反映。request は CI が commit-back で消費)。
  cloud は workflow_dispatch 不可 (actions:write 無し) のため push トリガー方式。
  ローカルからは dispatch でも可。
- **役割分担**: カタログ/スタイル SSOT の維持・品質監査 = `image-prompt-curator`、生成実行・記事公開連動 = `blog-editor`、
  effect 判定 = `improvement-triage`。R2 push は `--apply` (wrangler)。
- **展開状況**: 高流入 top100 = 本番 live (2026-07-12・GSC imp 上位)。残り記事は従来のブランド背景
  (`ogp-bg-brand-{light,dark}.jpg`) のまま。効果 (SNS カード・回遊) 観測後に段階展開。
  **ranking / areas / note の AI 背景は未実装 (Phase 2)**。外部 AI (Midjourney 等) 用プロンプトは
  `image-prompt` skill の catalog 43 種。

---

## 5.6 ページ hero 画像 (page hero) — テーマ / カテゴリ

OGP・カード・note カバーとは別の種別で、**ページ本文の先頭に表示する装飾 hero バナー**の画像。
テーマページ (`/themes/*`) とカテゴリページ (`/category/*`) のうち、hero を用意したページだけが
`HeroBanner` (画像 + 実 DOM テキストの見出し・タグライン) を描画する (全ページ既定は `PageHeader`)。

| 項目 | 内容 |
|---|---|
| **SSOT (設定 + プロベナンス)** | `apps/web/src/components/layout/page-heroes.ts` (`THEME_HEROES` / `CATEGORY_HEROES` = git TS)。型は `PageHeroDef` / 画像は `HeroImageAsset` (1 枚を複数ページで参照共有可) |
| 配信画像 | `apps/web/public/images/<name>.webp` (静的アセット。R2 ではない) |
| 元画像 | `docs/assets/<name>.png` (外部 AI 生成の PNG。再生成の入力) |
| サイズ・比率 | 生成 **3:2 (1536×1024)** → `HeroBanner` が左=テキスト / 右=画像の side-by-side で表示 (画像は object-cover) |
| 生成方式 | 外部 AI 画像生成 (Codex / Imagen 等) で **文字なし背景**を生成 → Sharp で webp 化。見出し・タグラインは**実 DOM テキスト**で重ねる (OGP と同じ家ルール: AI 画像に日本語・数字を焼き込まない) |
| プロベナンス | 各 `HeroImageAsset` に `prompt` / `aspectRatio` / `regenerate` (webp 再生成コマンド) / `sourceImage` を記録。タグラインの数値は `taglineFacts` に出典 (R2 + 年度) を明記 (`evidence-based-judgment.md`) |
| 改善 | プロンプトは `page-heroes.ts` の `HeroImageAsset.prompt` を直す (記事ごとの自由入力プロンプトは持たせない = OGP と同じ方針) |

**監査・ギャラリー・agent 所有は現時点で意図的に未整備** (hero は実質 1 枚のため過剰投資を避ける、`最小SSOT整備` 判断)。
hero が数枚に増えたら: (a) gallery `/assets` に「ページ hero」タブ追加 (`ASSET_TABS` + collector)、
(b) `/audit-ogp-images` に欠落検知を配線、(c) `image-prompt-curator` の守備範囲に page hero を追加、を行う。
それまでは page-heroes.ts の git TS SSOT + プロベナンスで管理する (欠落検知は type-check + 手動確認)。

---

## 5.7 県シルエットカード (areas OGP + SNS 素材) — 決定的生成・AI 不使用

新聞系ニュースサイトの県カード風「県シルエット地図カード」。**areas OGP の正典デザイン**
(2026-07-16 に旧 AreaOgp satori 描画から置き換え) であり、同デザインの 5 比率 × blue/dark を
**SNS 素材ライブラリ** (`sns/pref-silhouette/`) として持つ。

| 項目 | 内容 |
|---|---|
| デザイン | 淡青の海+ドットテクスチャ / 周辺県=ハーフトーン / 対象県=ソリッド+フチ+シャドウ / 県名ピル (**陸地と重ならない位置へ自動配置**: 候補8アンカーを陸地重なり面積でスコアリング) / 左下ブランド行 |
| **トークン SSOT** | `apps/web/scripts/data/pref-silhouette-tokens.ts` (git TS)。テーマ blue/dark/warm × 11 トークン + 5 比率レイアウト。**色・比率の変更はこのファイルだけ** → `--force` 再生成で全量反映 |
| レンダラー | `apps/web/scripts/lib/pref-silhouette-render.ts` — `apps/remotion/public/prefecture.topojson` (N03_007/N03_001) → d3-geo Mercator で地図 SVG (テキストなし) → sharp PNG → data URI → satori で県名ピル+ブランド行合成 (Noto Sans JP TTF がグリフをパス化 = CI に日本語フォント不要・環境非依存で決定的)。フレーミングは対象県の最大ポリゴン bbox (東京の離島・鹿児島の南西諸島を枠外に) |
| テーマ運用 | **areas OGP = blue 固定** (`PREF_CARD_OGP_THEME`)。R2 素材 push は blue+dark (`PREF_CARD_PUSH_THEMES`)。warm 等は生成能力のみ (色=シリーズの顔、`buzz-map-standards.md` と同思想) |
| 比率キー | `ogp` 1200×630 / `45` 1080×1350 / `11` 1080×1080 / `916` 1080×1920 / `169` 1920×1080 (buzz-map の命名に整合) |
| 生成・push | `generate-ogp-images.ts --type areas` (OGP 47枚) / `--type pref-silhouette` (素材 470枚)。週次 self-heal (`ogp-image-audit-weekly.yml`) とギャラリー `pref-silhouette` タブに配線済 |
| 旧 AreaOgp | `apps/web/src/features/ogp/AreaOgp.tsx` は **generator から deprecated** (コンポーネントは残置、参照ゼロ)。復活させる場合は本節の置き換え判断を先に見直すこと |

## 6. 関連

- ギャラリー生成: `.claude/scripts/ogp/build-image-gallery.mjs`
- 監査スキル: `.claude/skills/ui/audit-ogp-images/SKILL.md`
- 棚卸し state: `.claude/state/ogp/inventory.json`
- **県シルエットカード (§5.7)**: トークン SSOT `apps/web/scripts/data/pref-silhouette-tokens.ts` /
  レンダラー `apps/web/scripts/lib/pref-silhouette-render.ts` / 生成 `generate-ogp-images.ts --type areas|pref-silhouette`
- **ブログ OGP AI 背景 (§5)**: カタログ SSOT `apps/web/scripts/data/blog-ogp-visual-catalog.ts` / 解決・hash
  `apps/web/scripts/lib/blog-ogp-visual.ts` / Gemini クライアント `apps/web/scripts/lib/gemini-image-client.ts` /
  合成 `apps/web/scripts/lib/blog-thumbnail-render.ts` (`normalizeAiBackground`) / 生成 `apps/web/scripts/generate-blog-thumbnails-cloud.ts`
  (`--ai-background`) / 目視 `npm run gallery` → /assets「ブログ OGP パイロット (local)」タブ
- **ページ hero (§5.6)**: SSOT `apps/web/src/components/layout/page-heroes.ts` (`THEME_HEROES` / `CATEGORY_HEROES` + プロベナンス) /
  描画 `apps/web/src/components/layout/HeroBanner.tsx` / テーマ差し替え `features/theme-dashboard/components/ThemeHero.tsx`
- 画像プロンプト: `.claude/skills/image-prompt/SKILL.md` / `reference/catalog.md`
- OGP コンポーネント: `apps/web/src/features/ogp/`
- R2 キー設計: `.claude/rules/r2-storage-design.md`
- リンクカード表示: `apps/web/src/components/atoms/ThemeAwareImage.tsx`
- agent: `.claude/agents/image-prompt-curator.md`
