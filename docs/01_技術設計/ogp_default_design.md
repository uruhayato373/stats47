# デフォルトOGP（汎用シェア画像）のデザイン・運用仕様

## 概要
プロジェクト（stats47）のトップページや、固有のOGPを持たないページで共通使用されるデフォルトのOGP画像（`og-image.jpg`）のデザイン仕様および運用方法についてまとめます。

旧来の静止画ファイル運用から、Remotionを用いた動的生成（コンポーネント化）へと移行し、ブランドデザインの一貫性と保守性を高めました。

---

## 3つのデザインバリエーション
`apps/remotion/src/features/ogp/` 配下に、汎用OGP用の3つの洗練されたデザインバリエーションを実装しています。目的に応じて画像を切り替えたり、ページごとに使い分けたりすることが可能です。

### 1. Data Art型（現在のデフォルト）
* **コンポーネント:** `DefaultOgpDataArt.tsx`
* **特徴:** ダークトーン背景に光のノードによる抽象的なアートワーク（サイバー・データビジュアル特化）。1,800以上の統計データを持つプラットフォームの圧倒的な情報量と先進性を表現します。
* **主力用途:** プロジェクトの「顔」となるメインビジュアルとして非常に高い汎用性があります。

### 2. Minimal & Editorial型
* **コンポーネント:** `DefaultOgpMinimal.tsx`
* **特徴:** クリーンなライトトーン（または上質なダーク）を背景に、美しいタイポグラフィと広々とした余白を基調とするデザイン。
* **主力用途:** 官公庁・教育機関向けの資料や、知的な信頼感を強めたい場合（プレスリリースや公式ブログTOPなど）に適しています。

### 3. Dashboard / UI Showcase型
* **コンポーネント:** `DefaultOgpDashboard.tsx`
* **特徴:** 擬似的なランキングカードや統計数値を3D空間に浮かべ、プロダクトの実際の「使用感」を一目で伝えるデザイン。
* **主力用途:** コンバージョン（クリック）を強く促したい広告や、サービスを直接知ってもらうためのシェアに適しています。

---

## Remotionによるプレビューと書き出し手順

### 1. プレビューの確認（Remotion Studio）
各デザインはブラウザ上でリアルタイムに確認・コード調整が可能です。

```bash
cd apps/remotion
npm run dev
```
起動後、ブラウザ（通常 `http://localhost:3002`）の左メニューから `OGP > Default` フォルダを開き、各コンポジション（`DefaultOgp-DataArt` 等）を選択してください。

### 2. 静止画の書き出し（エクスポート）
デザインを確定し、実際の `apps/web/public/` に反映させるには、以下のコマンドを実行します。

**現在のデフォルト（Data Art型）を `og-image.jpg` に上書き書き出しする場合：**
```bash
cd apps/remotion
npx remotion still src/index.ts DefaultOgp-DataArt ../web/public/og-image.jpg
```

**他のバリエーションを個別に書き出す場合（保存済み）：**
```bash
npx remotion still src/index.ts DefaultOgp-Minimal ../web/public/og-image-minimal.jpg
npx remotion still src/index.ts DefaultOgp-Dashboard ../web/public/og-image-dashboard.jpg
```

---

## Next.jsでの設定

全体で使われるデフォルト画像の設定は、Webアプリ側の以下で定義されています。
* `apps/web/src/lib/metadata/root-metadata.ts`
* `apps/web/src/lib/metadata/og-generator.ts`

上記コード内では `/og-image.jpg` を一貫して参照しているため、Remotionから新しく出力して上書き（置き換え）るだけで、サイト全体のデフォルトOGPが即座に切り替わります。
（特定のページでMinimalなどの別画像を使う場合は、ページのmetadata生成時に `imageUrl: '/og-image-minimal.jpg'` のように差し替えます）
