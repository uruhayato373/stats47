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

| 種別 (tab)                     | サイズ・比率                                                                 | 生成方式 (正典 = 事前生成 → R2)                                                                                                                                                                                                                                                                                                                                                                                                                                   | 配信 URL / R2 キー                                                 | 生成スクリプト                                  | 担当 agent                                                       |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| OGP: `/` (サイト共通)          | 1200×630 (1.91:1)                                                            | 静的 (既存 `public/og-image.jpg`)                                                                                                                                                                                                                                                                                                                                                                                                                                 | `stats47.jp/og-image.jpg`                                          | (静的アセット)                                  | image-prompt-curator                                             |
| OGP: blog                      | 1200×630                                                                     | Satori(Node) → R2                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `app/blog/<slug>/ogp/ogp.png`                                      | `generate-blog-thumbnails-cloud.ts`             | blog-editor                                                      |
| OGP: ranking                   | 1200×630                                                                     | Satori(Node) → R2                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `app/ranking/<key>/ogp/ogp.png`                                    | `generate-ogp-images.ts --type ranking`         | ranking-ui-manager                                               |
| OGP: theme                     | 1200×630                                                                     | Satori SSG prerender (ビルド時、例外的に稼働)                                                                                                                                                                                                                                                                                                                                                                                                                     | `themes/<slug>/opengraph-image` (route)                            | (ビルド時 prerender)                            | theme-ui-manager                                                 |
| OGP: category                  | 1200×630                                                                     | 静的フォールバック (`og-image.jpg`)                                                                                                                                                                                                                                                                                                                                                                                                                               | `stats47.jp/og-image.jpg`                                          | (静的アセット)                                  | ranking-ui-manager                                               |
| OGP: areas                     | 1200×630                                                                     | **県シルエットカード** (topojson+satori、§5.7) → R2                                                                                                                                                                                                                                                                                                                                                                                                               | `app/areas/<code>/ogp/ogp.png`                                     | `generate-ogp-images.ts --type areas`           | ranking-ui-manager                                               |
| 素材: 県シルエットカード (SNS) | 5比率 (1200×630 / 1080×1350 / 1080×1080 / 1080×1920 / 1920×1080) × blue/dark | 決定的生成 (topojson+satori、§5.7) → R2                                                                                                                                                                                                                                                                                                                                                                                                                           | `sns/pref-silhouette/<code2>/card-<ratio>-<theme>.png` (47県×10枚) | `generate-ogp-images.ts --type pref-silhouette` | image-prompt-curator (規約/監査)・IG 消費は instagram-strategist |
| OGP: tag / survey / cities     | —                                                                            | 親 `/` の静的 `og-image.jpg` に依存 (専用なし)                                                                                                                                                                                                                                                                                                                                                                                                                    | —                                                                  | —                                               | (要否は §3)                                                      |
| カード: blog (light/dark)      | webp (16:9 相当)                                                             | `apps/web/scripts/generate-blog-thumbnails-cloud.ts` (Satori、`lib/blog-thumbnail-render.ts`)                                                                                                                                                                                                                                                                                                                                                                     | R2 `app/blog/<slug>/thumbnail-{light,dark}.webp`                   | `ThemeAwareImage` (blog-article-grid)           | blog-editor                                                      |
| カード: ranking (light/dark)   | 640×360 WebP                                                                 | 共通地理地図 renderer → R2                                                                                                                                                                                                                                                                                                                                                                                                                                        | `app/ranking/<key>/thumbnail-{light,dark}.webp`                    | `generate-ogp-images.ts --type ranking-cards`   | ranking-publisher                                                |
| カード: theme / category       | —                                                                            | **なし (要否は §3 で判断)**                                                                                                                                                                                                                                                                                                                                                                                                                                       | —                                                                  | (共有 SVG タイルマップ or blog サムネ流用)      | —                                                                |
| note カバー                    | 1280×670 (≒1.91:1)                                                           | **系統併存 (既知課題)**: (A) Remotion `apps/remotion/src/features/ranking-note/NoteCover.tsx` → R2 `sns/` / (B) `.claude/scripts/note/generate-note-covers.mjs` (SVG→PNG、stats47-note 汎用) / **(C) `.claude/scripts/note/generate-koumuin-covers.cjs`** (koumuin-\* 専用の正典。共通背景 `assets/koumuin-cover-bg.png` + カテゴリトーン + 中央ボックス、frontmatter 駆動、sharp で背景 bitmap に前景 SVG を合成し PNG 直出力。無ければダーク背景フォールバック) | docs/31 `images/cover-1280x670.png` → note.com アップロード        | note-manager                                    |

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

- **週次自動監査+自動修復**: `.github/workflows/ogp-image-audit-weekly.yml` (日曜 03:00 JST)。全種別を
  fingerprint + 全asset契約 + R2 SHA metadataで監査し、変更bundleだけ Satori 生成→exact plan push
  (self-heal) → 最終監査 → inventory を develop commit。修復後も陳腐化/欠落が残れば
  `[OGP Alert]` Issueを起票しworkflowも失敗する (`ogp-alert,auto-generated`)。
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
1. **ranking リンクカード供給**: 旧 `ranking/prefecture/<key>/<year>/...png` は廃止。
   `app/ranking/<key>/thumbnail-{light,dark}.webp` + 共通manifestへ移行済み。初回manifest移行だけは
   legacyを安全にcurrent扱いできないため、件数制限付きbatchで再生成する。
2. **note カバー 2 系統併存**: Remotion `NoteCover.tsx` (→ `sns/`) と `generate-note-covers.mjs` (→ `note/`) がドリフト。→ ギャラリーで目視比較し正系統を本 rules に確定、他方は deprecate 記載 (削除しない)。
3. **OGP 専用なし route**: `/tag/<key>` `/survey/<key>` `/areas/<code>/cities/<city>` は親 `/` の `DefaultOgp` を流用 (現状その `DefaultOgp` 自体が 500)。→ 課題 0 の解消後、流入が増えたら専用 opengraph-image を検討 (判定は improvement-triage 経由)。
4. **theme / category カード画像なし**: 一覧での視認性のため要否判断。既定は「作らない」(共有タイルマップ SVG or blog サムネ流用で代替)。

---

## 4. 役割分担

| 工程                                                          | 担当                                               |
| ------------------------------------------------------------- | -------------------------------------------------- |
| 画像資産の棚卸し・ギャラリー監査 (read-only)・本 rules の維持 | `image-prompt-curator` (skill `/audit-ogp-images`) |
| デザイン妥当性の目視評価                                      | `ui-reviewer`                                      |
| 外部 AI / 背景素材用の画像プロンプト生成                      | `image-prompt-curator` (skill `/image-prompt`)     |
| ranking リンクカード供給 (R2 生成)                            | `ranking-publisher` + `snapshot-exporter`          |
| blog OGP / サムネ                                             | `blog-editor`                                      |
| note カバー                                                   | `note-manager`                                     |
| R2 push                                                       | CI / `r2-publisher`                                |
| 改善施策の status 管理                                        | `improvement-triage` (バックログ書き込みは排他)    |

---

## 5. OGP 画像の生成・配信方式 (正典)

**OGP は事前生成した静的画像を R2 に保存し、配信時は静的 URL を参照する。** サイト全体で統一
(note カバーも同思想)。ランタイム next/og ImageResponse は Cloudflare Worker で例外 (1101) を投げるため使わない。

### 5.0 差分生成・manifest・反映の共通契約

R2配信画像の再生成判定は、ファイルの存在・mtime・git diffではなく、entityごとの決定的な
`fingerprint`だけを使う。共通型SSOTは
`packages/types/src/image-generation-manifest.ts`、generator依存SSOTは
`apps/web/scripts/data/image-generator-registry.ts`。

```text
inputHash    = SHA-256(canonical semantic render input)
rendererHash = SHA-256(renderer source + font + topology + background + dependency versions)
fingerprint  = SHA-256(inputHash + rendererHash + generator/entity + output contract)
```

- `generatedAt`はfingerprintに含めない。`undefined`、非有限数、循環参照、plain object以外は
  canonical化時に拒否する。
- entity manifestは`inputHash` / `rendererHash` / `fingerprint`と、全assetの
  key・variant・MIME・width・height・bytes・SHA-256を持つ。ranking cardの
  `thumbnail.json`も別形式を持たず共通manifestを使う。
- current判定はmanifestと全asset契約が完全一致した場合だけ。R2 S3資格情報がある実行は
  authenticated HEADのSHA metadataまで検証し、資格情報のないPR監査だけ公開URLへ
  fail-closed fallbackする。404だけをmissingとし、timeout/429/5xxは全件生成へ進まず失敗する。
- stagingは`.local/image-staging/<generator>/`に隔離する。通常snapshot/article用
  `.local/r2`と混在させない。
- generatorは変更bundleだけを生成し、`.local/image-generation-publish-plan-*.json`へ
  最終asset契約/SHA、staged manifest SHA、plan時remote fingerprint/manifest SHAを書く。
  変更0件でも空planを必ず出し、plan欠落を「変更なし」として成功させない。画像automationでprefix走査、
  generatorの直接apply、無条件`--force`は禁止。`--force`は明示key/slug付きだけ。
- publisherはplan外ファイルを読まず、ローカルSHA・画像形式・寸法をdecode検証する。
  planは2時間で失効し、R2上のdistributed lock取得後にremote manifest bytesを再検証する。
  assetはSHA/MIME/size/manifest ownerが同じならrenderer fingerprintだけのために再PUTしない。
  変更assetをPUT+HEAD検証し、最後にmanifestをETag CAS (`If-Match` / `If-None-Match`)で更新する。
  commit失敗時は同lock内で旧asset/manifestへrollbackし、古いplanの再実行もremote SHA差で拒否する。
  stable URLはmutableなので`Cache-Control: max-age=0, must-revalidate`とする。
  **★実態はそうなっていない (2026-08-12 実測)**: `storage.stats47.jp` は
  `cache-control: max-age=14400` / `cf-cache-status: HIT` を返す。push スクリプトはどれも
  `CacheControl` を設定していないので、これは **Cloudflare 側の設定** (custom domain の
  Cache Rule か既定値)。したがって **R2 を更新しても公開 URL には最大 4 時間反映されない**。
  切り分けは公開 URL ではなく **S3 API で実体を読む** (`GetObjectCommand` の `LastModified` と
  中身) — 公開 URL が古くても push 失敗とは限らない (`age` / `cf-cache-status` / `last-modified`
  を見れば判る)。即時反映は `purge-cache.ts --files <keys>` (要 `CLOUDFLARE_API_TOKEN` +
  `CLOUDFLARE_ZONE_ID`。ローカル `.env.local` には無く CI かオーナー環境で実行する)。
  方針どおりにするには Cloudflare 側の設定変更が要る (outward-facing なので単独で変えない)。
- batch上限超過は暗黙clampせず失敗する。明示`--limit`はchanged集合へ適用するため、反映済みが
  次回currentになれば後続batchへ進む。旧manifest/manifest無しの初回移行は安全なhashがないため
  stale扱いし、件数制限付きで一度だけ移行する。
- SHAを持たない旧AI背景は、凍結済みv1 prompt hashとR2 ETag(MD5)が実bytesに一致する場合だけ
  一度限りでSHA付き共通manifestへ移行する。共通manifest移行後はmetadata/asset/HEAD/GETのSHA一致が必須。
- 機械ゲートは`npm run type-check:image-pipeline`、`npm run test:image-pipeline`、
  `npm run check:image-pipeline-policy`。workflowのforce/prefix/direct apply/best-effort/shared lock欠落、
  generatorと同jobの後続publisher欠落、plan任意化をPR・pre-commitで拒否する。

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
    (旧 PC 正方形 `md:aspect-square` を撤去。1 枚の背景をクロップ無しで OGP/カード兼用)。
- **配信 URL 解決は `apps/web/src/lib/metadata/ogp-image.ts`** の `ogpImageUrl(ogpImageKeys.<type>(id))`。
  各ページの `generateMetadata` が `openGraph.images` / `twitter.images` にこの静的 R2 URL を設定する。
- **生成スクリプト (クラウド/ローカルから直接実行)**:
  - blog OGP = `generate-blog-thumbnails-cloud.ts` (公開記事) /
    `generate-blog-thumbnails.ts` (公開前staged記事)
  - ranking OGP / areas OGP / ranking カード / note カバー = `generate-ogp-images.ts --type <ranking|areas|ranking-cards|note-covers>`
  - いずれも`.local/image-staging/<type>`へ生成し、`push-generated-image-set.ts --plan <exact-plan>`で反映する。
  - CI fallback = `generate-ogp-images.yml` (手動 dispatch。ただしクラウド連携トークンは actions:write 無しのため、
    R2 creds のあるセッション/ローカルからの直接実行が主経路)。
- **新規 ranking/area/blog/note を公開したら OGP/カバーも生成する**。未生成だと og:image が 404 になる。
- **ranking リンクカード**は `app/ranking/<key>/thumbnail-{light,dark}.webp` (★canonical。旧
  `ranking/prefecture/<key>/<year>/thumbnails/` は年入り・非 `app/` 名前空間で廃止)。
  WebPは外部リンクカード用で、サイト内のhome/category/surveyは共通inline SVG componentを使う。
  生成契約は`packages/ranking/src/types/ranking-thumbnail.ts`。全指標で
  `packages/gis/data/geoshape/prefecture.topojson`と観測値から同じ地理地図を決定的に生成し、
  metricごとの地図方式optionやタイル地図fallbackは設けない。横長カードでは本土を
  時計回り32°へ平面回転して再fitし、沖縄インセットと凡例を省略して本土を大きく見せる
  （描画SSOT: `MINI_PREFECTURE_THUMBNAIL_LAYOUT`）。1位情報を持つ640×360カードにする。各生成時に同ディレクトリの `thumbnail.json` へ
  共通fingerprint/asset契約と、metadataとしてversion / rankingKey / geographicLayout / year /
  入力R2キー / config / topologyを記録する。
  WebPやmanifestを手編集せず、`generate-ogp-images.ts --type ranking-cards` で再生成する。
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

**新規の blog OGP 背景は Codex built-in imagegen で「主役 1 つ・文字なし」を生成し、タイトル・ブランドは
既存 Satori/Sharp が合成する** (2026-08-07)。既存の Gemini 背景・cache は壊さず移行中fallbackとして残す。
旧 doc `23_ブログOGP生成AIパイプライン仕様.md` (docs/02\_実装計画・削除)
の恒久運用スペックを本節に統合 (doc は削除・git 履歴に残る)。

- **新規 Codex 背景のコード SSOT**:
  `apps/web/scripts/data/blog-codex-background-catalog.ts` (slug → 単一 motif / prompt / asset) +
  `apps/web/scripts/lib/assets/blog-codex-backgrounds/*.jpg` (1200×630 JPEG)。共通構図は
  **左 62% をタイトル安全域として完全に空け、右 35% に主役を 1 つだけ置く**。同じ主題
  (例: まぐろ 2 記事) は背景を共有し、Satori のタイトル合成で区別する。自由入力プロンプトを記事本文へ持たせない。
  実行入口は `/generate-blog-images`、決定的request/ingest/checkは
  `apps/web/scripts/manage-blog-codex-backgrounds.ts`。Claude Codeは `.mcp.json` の
  `codex mcp-server` をread-onlyで呼び、Codexの組み込み `$imagegen` (`gpt-image-2`) にだけ生成を担当させる。
  model / promptVersionはasset定義へ固定し、既存v1 assetのprovenanceを新規versionで上書きしない。
- **既存 Gemini のコード SSOT (既存背景再利用 / 未移行記事 fallback)**:
  `apps/web/scripts/data/blog-ogp-visual-catalog.ts`
  — 6 系統 (map / people / economy / industry / timeline / comparison) × motif・固定スタイル `OGP_STYLE_PREFIX`
  (light / editorial / flat / 落ち着いた藍・**文字/数字/ロゴ/実顔/精密な地図境界を禁止**・左 1/3 をタイトル安全域として空ける)・
  category(17) / archetype(A-G) / tags → visualType の**決定的**対応表・model / 価格 / promptVersion 定数。
- **決定的分類 (モデルに分類させない)**: Codex slug catalog > frontmatter `ogpVisualType` > `category` >
  `archetype` > `tags` > 既定
  (`map` / `prefecture-comparison`)。motif は有効な `ogpMotif` > visualType の既定 motif。解決 / hash の実装は
  `apps/web/scripts/lib/blog-ogp-visual.ts` (`resolveOgpVisual` / `computePromptHash` / frontmatter parser)。
- **パイプライン**: catalog → Codex MCP request JSON → `$imagegen` → prompt hash照合付きingest →
  Codex imagegen の背景を git JPEG として固定 (prompt/model/version + bytes SHA を manifest 入力化) →
  `normalizeAiBackground` と同じ 1200×630 契約を検証 →
  `buildElement(backgroundImage)` で合成 → R2。最終画像は
  `thumbnail-{light,dark}.webp` / `ogp/ogp.png`、source artifact は `ogp/background.jpg`。
  生成 metadata は `ogp/generation.json` の共通 manifest へ統合する。未移行記事だけは従来どおり
  Gemini (`gemini-2.5-flash-image`) が背景 1 枚 →
  `normalizeAiBackground` (`blog-thumbnail-render.ts`)
  で 1200×630 cover + dark 処理 + 左タイトルスクリム (**satori 互換の JPEG**。webp は satori が解析不能で不可) →
  同じ exact plan 経路へ入る。
- **改善は共通カタログ/スタイルのみ**: Codex 背景は `BLOG_CODEX_BACKGROUND_BY_SLUG` の subject/detail と
  共通 prompt builder を直し、imagegen で再生成して同名 JPEG を更新する。1 枚へ複数概念・地図・グラフを
  詰め込まない。既存 Gemini は `OGP_STYLE_PREFIX` / `OGP_VISUAL_CATALOG` を直す。
- **費用・安全弁**: Codex built-in imagegenはAPI key / Gemini課金を使わないがCodex利用枠を消費する。
  1 request = 1画像に固定し、暗黙再試行やprovider fallbackを行わない。既存 Gemini は ~$0.039/枚。
  背景 fingerprint は promptHash + 正規化済み背景SHA、
  最終合成fingerprintは背景SHA + overlay入力 + rendererHash。rendererだけ変わった場合は既存背景を
  再利用しGeminiを呼ばない。必要件数の推定費用が`--budget-usd`を超える場合やキー無しは、
  一部生成/ブランド背景fallbackをせず開始前に失敗する。
- **AI成果cache（既存 Gemini の再課金防止）**: APIへ渡すprompt全文 / promptHash / model / promptVersion /
  正規化renderer hash / 1200×630 JPEG出力契約をSHA-256 fingerprint化し、
  `staging/image-cache/blog-ai-background/v1/<fingerprint>.jpg`へ`If-None-Match: *`でimmutable保存する。
  metadataは`stats47-cache-kind=blog-ai-background` / `stats47-cache-fingerprint` /
  `stats47-sha256`を必須とし、再利用時はS3 GETのSHA / MIME / byte sizeを全て照合した上で、
  Sharpで実decodeしてJPEG 1200×630であることも確認する。
  各AI成功は正規化直後・最終カード描画前に保存するため、後続記事や描画が失敗しても再実行では
  cache hitとなりAPIを再度呼ばない。これは再生成可能なstaging派生物で、公開stable key /
  `ogp/generation.json`のcommitには使わず、公開bundleは従来どおりexact plan publisherだけが更新する。
  ローカルmirrorは`.local/image-cache/blog-ai-background/v1/`へatomic作成する。
  保持は当面無期限（prompt/normalizer変更で別keyとなり誤再利用しない）。削除時は参照中実行がないことを
  確認した明示prefixの保守ジョブだけを使い、generator実行中の自動削除はしない。
  同じfingerprintを上書きする`--force-background`は設けない。再生成はprompt / catalog /
  normalizerのSSOT変更で新fingerprintを作る。
- **既存AI背景の再利用確認**: committed共通manifest / `ogp/background.jpg`は公開custom domainの
  HEAD headerを参照せず、R2 S3 `ImageObjectStore.get`が返すbody / metadata / ETagで検証する。
  共通manifestはmanifest SHA、背景はmanifest asset SHA + object SHA + MIME + byte size +
  manifest ownerが一致した場合だけ再利用する。S3資格情報がない実行は公開URLへfallbackせずfail-closedする。
- **既存 Gemini クライアント**: `apps/web/scripts/lib/gemini-image-client.ts` — `x-goog-api-key`・30s timeout・
  429/5xx/timeout/network のみ指数バックオフ再試行・4xx 非再試行・**API キー/レスポンス本文をログ/エラーに出さない**。
  `GEMINI_API_KEY` は `.env.local` から自己ロード (値非表示、CI では no-op)。
- **生成コマンド**:
  ```
  # SSOTからClaude Code → Codex MCP用requestを生成
  npm run blog-images:codex -- request --slug a
  # Codex応答のpath/hashをtracked JPEGへ決定的に取り込む
  npm run blog-images:codex -- ingest \
    --slug a --input <generated_image_path> --prompt-hash <prompt_hash>
  # catalog / JPEG形式・寸法 / orphanを検査
  npm run check:blog-images

  # Codex catalog 登録済み slug のローカル目視 (Gemini/API/R2書込なし)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts \
    --slug a,b --out-dir .local/codex-ogp-pilot
  # Codex catalog 登録済み slug の exact plan 生成 (R2 creds のある CI / セッション)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --slug a,b

  # 既存 Gemini の純粋監査 (API を呼ばない・生成予定/最大費用のみ)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --limit N
  # ローカル目視 (R2 非書込・gallery /assets「ブログ OGP パイロット (local)」タブで確認)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug a,b --out-dir .local/ogp-pilot
  # 本番反映 (R2 push)
  npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug <slugs>
  npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
    --plan .local/image-generation-publish-plan-blog.json
  ```
- **★cloud Claude Code / ローカル env なしの CI 経路 (2026-07-14〜)**: request の slug が Codex catalog
  登録済みなら git JPEG を使い、Gemini API は呼ばない。未移行記事だけ `GEMINI_API_KEY` を使う。
  `GEMINI_API_KEY` は
  **GitHub Secrets 専任** (ローカル .env.local 管理は不要)。cloud セッションは
  `data/gemini-image-requests.json` に `{ "task": "blog-ogp", "slugs": [...], "budgetUsd": 0.5,
"apply": true|false }` を書いて develop へ push すると `gemini-image-run.yml` が生成する
  (apply=false は artifact で目視検証・true は R2 反映。request は CI が commit-back で消費)。
  cloud は workflow_dispatch 不可 (actions:write 無し) のため push トリガー方式。
  ローカルからは dispatch でも可。
- **役割分担**: catalog / Codex MCP生成 / git JPEG ingest / 品質監査 = `image-prompt-curator`
  (`/generate-blog-images`)、最終bundle生成・記事公開連動 = `blog-editor`、
  effect 判定 = `improvement-triage`。R2 push は共通exact plan publisher。
- **既存 Gemini fallbackの削除条件**: 公開中の全slugがCodex catalog + git JPEGへ移行し、
  R2の全`ogp/generation.json`でGemini背景が0件になった時点で、Gemini client / cache /
  request workflowを同一リリースで削除する。
- **展開状況**: 既存 Gemini の高流入 top100 = 本番 live (2026-07-12・GSC imp 上位)。
  Codex 単一モチーフは `/blog` 1ページ目の新着24記事 (23背景) をR2公開済み
  (2026-08-07、コードは本リリース対象)。
  残り記事は従来のブランド背景 (`ogp-bg-brand-{light,dark}.jpg`) のまま。効果 (SNS カード・回遊) 観測後に段階展開。
  **ranking / areas / note の AI 背景は未実装 (Phase 2)**。外部 AI (Midjourney 等) 用プロンプトは
  `image-prompt` skill の catalog 43 種。

---

## 5.6 ページ hero 画像 (page hero) — テーマ / カテゴリ

OGP・カード・note カバーとは別の種別で、**ページ本文の先頭に表示する装飾 hero バナー**の画像。
テーマページ (`/themes/*`) とカテゴリページ (`/category/*`) のうち、hero を用意したページだけが
`HeroBanner` (画像 + 実 DOM テキストの見出し・タグライン) を描画する (全ページ既定は `PageHeader`)。

| 項目                           | 内容                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SSOT (設定 + プロベナンス)** | `apps/web/src/components/layout/page-heroes.ts` (`THEME_HEROES` / `CATEGORY_HEROES` = git TS)。型は `PageHeroDef` / 画像は `HeroImageAsset` (1 枚を複数ページで参照共有可)                              |
| 配信画像                       | `apps/web/public/images/<name>.webp` (静的アセット。R2 ではない)                                                                                                                                        |
| 元画像                         | `docs/assets/<name>.png` (外部 AI 生成の PNG。再生成の入力)                                                                                                                                             |
| サイズ・比率                   | 生成 **3:2 (1536×1024)** → `HeroBanner` が左=テキスト / 右=画像の side-by-side で表示 (画像は object-cover)                                                                                             |
| 生成方式                       | 外部 AI 画像生成 (Codex / Imagen 等) で **文字なし背景**を生成 → Sharp で webp 化。見出し・タグラインは**実 DOM テキスト**で重ねる (OGP と同じ家ルール: AI 画像に日本語・数字を焼き込まない)            |
| プロベナンス                   | 各 `HeroImageAsset` に `prompt` / `aspectRatio` / `regenerate` (webp 再生成コマンド) / `sourceImage` を記録。タグラインの数値は `taglineFacts` に出典 (R2 + 年度) を明記 (`evidence-based-judgment.md`) |
| 改善                           | プロンプトは `page-heroes.ts` の `HeroImageAsset.prompt` を直す (記事ごとの自由入力プロンプトは持たせない = OGP と同じ方針)                                                                             |

**監査・ギャラリー・agent 所有は現時点で意図的に未整備** (hero は実質 1 枚のため過剰投資を避ける、`最小SSOT整備` 判断)。
hero が数枚に増えたら: (a) gallery `/assets` に「ページ hero」タブ追加 (`ASSET_TABS` + collector)、
(b) `/audit-ogp-images` に欠落検知を配線、(c) `image-prompt-curator` の守備範囲に page hero を追加、を行う。
それまでは page-heroes.ts の git TS SSOT + プロベナンスで管理する (欠落検知は type-check + 手動確認)。

---

## 5.7 県シルエットカード (areas OGP + SNS 素材) — 決定的生成・AI 不使用

新聞系ニュースサイトの県カード風「県シルエット地図カード」。**areas OGP の正典デザイン**
(2026-07-16 に旧 AreaOgp satori 描画から置き換え) であり、同デザインの 5 比率 × blue/dark を
**SNS 素材ライブラリ** (`sns/pref-silhouette/`) として持つ。

| 項目              | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| デザイン          | 淡青の海+ドットテクスチャ / 周辺県=ハーフトーン / 対象県=ソリッド+フチ+シャドウ / 県名ピル (**陸地と重ならない位置へ自動配置**: 候補8アンカーを陸地重なり面積でスコアリング) / 左下ブランド行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **トークン SSOT** | `apps/web/scripts/data/pref-silhouette-tokens.ts` (git TS)。テーマ blue/dark/warm × 11 トークン + 5 比率レイアウト。**色・比率の変更はこのファイルだけ** → fingerprint 差分として対象 bundle のみ再生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| レンダラー        | `apps/web/scripts/lib/pref-silhouette-render.ts` — `apps/remotion/public/prefecture.topojson` (N03_007/N03_001) → d3-geo Mercator で地図 SVG (テキストなし) → sharp PNG → data URI → satori で県名ピル+ブランド行合成 (Noto Sans JP TTF がグリフをパス化 = CI に日本語フォント不要・環境非依存で決定的)。フレーミングは対象県の最大ポリゴン bbox (東京の離島・鹿児島の南西諸島を枠外に)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| テーマ運用        | **areas OGP = blue 固定** (`PREF_CARD_OGP_THEME`)。R2 素材 push は blue+dark (`PREF_CARD_PUSH_THEMES`)。warm 等は生成能力のみ (色=シリーズの顔、`buzz-map-standards.md` と同思想)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 比率キー          | `ogp` 1200×630 / `45` 1080×1350 / `11` 1080×1080 / `916` 1080×1920 / `169` 1920×1080 (buzz-map の命名に整合)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 生成・push        | `generate-ogp-images.ts --type areas` (OGP 47枚) / `--type pref-silhouette` (素材 470枚)。週次 self-heal (`ogp-image-audit-weekly.yml`) とギャラリー `pref-silhouette` タブに配線済                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 旧 AreaOgp        | `apps/web/src/features/ogp/AreaOgp.tsx` は **generator から deprecated** (generate-ogp-images.ts は参照しない)。route `app/areas/[areaCode]/opengraph-image.tsx` は **ランタイムで 500 する** — `loadOgpFonts()` が `fetch('https://fonts.googleapis.com/...')` でランタイム日本語フォントを取得し、Worker (外部 fetch 不可) でも Node dev でも render が落ちる (themes/[themeSlug]/opengraph-image は `fontFamily:"sans-serif"` で fetch せず 200)。**ただし配信への実害はほぼ無い**: area 詳細も city (`/areas/*/cities/*`) も og:image は **`generate-area-metadata.ts` / city metadata の静的 R2** (`storage.stats47.jp/app/areas/<code>/ogp/ogp.png`) を使い **200** (2026-07-20 横断実測で city 14000/01000/27000/東京13201 等が R2・200 を確認)。この 500 route を og:image に出すのは **修正デプロイ前の stale ISR キャッシュを持つ一部 city のみ** (revalidate 86400 で ≤24h 自然回復 or purge)。**★`generateStaticParams` を単純追加して prerender 化してはならない** — ビルド時に Google Fonts fetch が失敗すると prerender エラーで**ビルド全体が落ち全デプロイがブロックされる** (2026-07-20 に試行し revert 済)。将来 §3 課題0 の本筋清掃でこの route を静的化/削除する場合は、先に `font-loader.ts` を `@expo-google-fonts/noto-sans-jp` のローカル同梱フォントに変え (generate-ogp-images.ts §5 と同方式) ランタイム fetch を排すこと |

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
