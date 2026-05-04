# OGP コンポジション群

stats47 のデフォルト OGP（汎用シェア画像）と、ページ種別ごとの OGP コンポジションを Remotion で実装している。本 README は **Remotion 側で扱う OGP のすべて** をカバーする。

> Satori (`next/og` の `ImageResponse`) で動的生成する OGP は対象外。それらは `apps/web/src/app/**/opengraph-image.tsx` を参照（記事別タイトルを差し込む系の OGP）。
>
> セーフゾーン規約 (1200x630 → 正方形クロップ対策) は `../../../shared/components/layouts/OgpSafeZone.tsx` の JSDoc を参照。

## デフォルト OGP の 3 デザインバリエーション

| バリエーション | コンポーネント | 用途 |
|---|---|---|
| **Data Art 型**（現行デフォルト） | `DefaultOgpDataArt.tsx` | ダーク背景＋光のノードでサイバー・データビジュアル感を表現。プラットフォームの「顔」 |
| **Minimal & Editorial 型** | `DefaultOgpMinimal.tsx` | クリーンなライトトーン + 余白多めのタイポ。官公庁向け / プレスリリースで信頼感を出したい時 |
| **Dashboard / UI Showcase 型** | `DefaultOgpDashboard.tsx` | 擬似ランキングカードを 3D 空間で見せる。広告・サービス周知のクリック誘導 |

## ページ種別ごとの OGP

| 用途 | コンポーネント |
|---|---|
| ランキング詳細ヒーロー（Data Art） | `RankingHeroDataArtOgp.tsx` |
| ランキング詳細ヒーロー（Editorial） | `RankingHeroEditorialOgp.tsx` |
| ランキング詳細ヒーロー（既定） | `RankingHeroOgp.tsx` |
| エリアプロファイル | `AreaProfileOgp.tsx` |
| ブログ（既定 / Editorial / Glass） | `BlogOgp.tsx`, `BlogOgpEditorial.tsx`, `BlogOgpGlass.tsx` |
| 比較ページ | `ComparisonOgp.tsx` |
| 相関分析散布図 | `CorrelationScatterOgp.tsx` |

## プレビュー（Remotion Studio）

```bash
cd apps/remotion
npm run dev
```

ブラウザで `http://localhost:3002` を開き、左メニュー `OGP > Default` から各コンポジション (`DefaultOgp-DataArt` 等) を選択。

セーフゾーンを赤線で可視化したい場合は、対象コンポーネントの `showGuides` prop を `true` で起動する（各コンポーネントの props を参照）。

## 静止画書き出し

```bash
cd apps/remotion

# 現行デフォルトを apps/web/public/og-image.jpg に上書き出力
npx remotion still src/index.ts DefaultOgp-DataArt ../web/public/og-image.jpg

# 他バリエーションを別名で保存しておく場合
npx remotion still src/index.ts DefaultOgp-Minimal   ../web/public/og-image-minimal.jpg
npx remotion still src/index.ts DefaultOgp-Dashboard ../web/public/og-image-dashboard.jpg
```

`apps/web/src/lib/metadata/root-metadata.ts` および `og-generator.ts` は一律 `/og-image.jpg` を参照しているため、上書きするだけでサイト全体のデフォルト OGP が切り替わる。特定ページで Minimal などを使う場合は、各ページの metadata で `imageUrl: '/og-image-minimal.jpg'` のように差し替える。

## 関連

- セーフゾーン規約 (note.com 正方形クロップ対策含む): `../../../shared/components/layouts/OgpSafeZone.tsx` の JSDoc
- 動的 OGP（Satori 経由）: `apps/web/src/app/**/opengraph-image.tsx`
- 画像生成方式の選び方は各 agent / skill 側に直書き（`.claude/agents/*.md` の「画像生成リファレンス」セクション参照）

## 既知の問題

- `RankingHeroOgp.tsx`: `LogoWatermark` が `left: 40` でセーフエリア外。要修正
