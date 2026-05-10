---
name: md-syntax
description: ブログ記事で使えるマークダウン記法一覧を表示する。Use when user says "記法一覧", "マークダウン記法", "md記法", "書き方". コールアウト・チャート埋め込み等の独自記法を含む.
---

ブログ記事（`.md` / `.mdx`）で使用できるマークダウン記法の一覧を示す。

## 基本記法（remark-gfm / remark-breaks）

```markdown
## 見出し2
### 見出し3

**太字**　*斜体*　~~打消し線~~　`インラインコード`

- 箇条書き
- 箇条書き

1. 番号付きリスト
2. 番号付きリスト

- [x] チェックボックス（完了）
- [ ] チェックボックス（未完）

[リンクテキスト](URL)

![alt テキスト](画像パス)

---（水平線）
```

## テーブル

> **⚠ 記事内でのマークダウンテーブル使用は原則禁止。** モバイルで読みにくく、本文との情報重複が発生しやすい。データの提示には SVG チャート（`/generate-article-charts`）を使い、少量の数値は本文の太字で表現すること。例外: 採点方法・多次元スコア・相関係数など、本文やチャートでは表現困難な構造化データのみ許可。`<ranking-table>` コンポーネントも使用禁止（専用ランキングページへの `<source-link>` で導線を確保する）。

```markdown
| 列A | 列B | 列C |
|---|---|---|
| 値1 | 値2 | 値3 |
```

## コードブロック

````markdown
```python
print("hello")
```
````

## 画像（ローカルデータ）

記事スラッグ配下の `data/` フォルダに置いたファイルは `data/` 相対パスで参照できる。

```markdown
![グラフの説明](data/chart.svg)
![画像の説明](data/image.png)
```

## コールアウト（Obsidian / GitHub 互換）

```markdown
> [!NOTE]
> 補足情報・メモ（青）

> [!TIP]
> ヒント・コツ（緑）

> [!WARNING]
> 注意事項（黄/アンバー）

> [!IMPORTANT]
> 重要事項（紫）

> [!CAUTION]
> 警告・危険（赤）
```

## 通常 blockquote

コールアウト記法でない引用はグレーの斜体で表示される。

```markdown
> 引用文
```

## 生 HTML（rehype-raw）

HTML タグをそのまま埋め込める（Tailwind クラスは静的に宣言されているもののみ有効）。

```html
<div class="...">...</div>
<br>
<sup>上付き</sup>
```

## カスタムコンポーネント（rehype-raw で処理）

MDX 不要。HTML カスタムタグとして `react-markdown` の `components` で処理される。

### 広告スロット

記事の**セクション末尾**（次の `##` の直前）に配置する。H2 直下への配置は禁止。

**配置ルール（H2セクション数による）:**

| H2 数 | ad-slot 数 | 推奨配置位置 |
|---|---|---|
| 3 以下 | 1 箇所 | セクション 2 の末尾 |
| 4〜5 | 2 箇所 | セクション 2・4 の末尾 |
| 6 以上 | 3 箇所 | セクション 2・4・6 の末尾 |

「セクション末尾」= そのセクションの最後の非空行と次の `## ` の間。`<data-source>` や `<source-link>` がある場合はその後に配置。まとめ（`## まとめ` 等）セクションには置かない。

```html
<!-- ✅ 正しい配置（セクション末尾） -->
（セクション2の本文...）

<ad-slot></ad-slot>

## 次のセクション見出し
```

```html
<!-- ❌ 禁止パターン（H2直下） -->
## 見出し

<ad-slot></ad-slot>

（本文...）
```

### アフィリエイトバナー（記事内）

記事のテーマと最も関連するセクションの末尾に 1 箇所配置する。`<ad-slot>` と同じセクション末尾には置かず、隣接セクションに配置する。

**category ベース（推奨）:** カテゴリを指定するとコードが適切なバナーを自動解決する。

```html
<affiliate-banner category="labor">
<affiliate-banner category="housing">
<affiliate-banner category="economy">
```

利用可能カテゴリ: `labor` / `housing` / `population` / `economy` / `health` / `energy` / `tourism` / `furusato`

**URL 直書き（後方互換・特殊バナー用）:**

```html
<affiliate-banner
  src="https://storage.stats47.jp/app/ads/XXX.png"
  href="https://..."
  tracking="https://..."
  width="300"
  height="250"
  label="バナー説明文">
```

### データ出典

チャート画像の直下に配置し、データの出典を右寄せで表示する。

```html
<data-source url="https://www.e-stat.go.jp/..." label="e-Stat 社会生活統計指標"></data-source>
<data-source url="https://..." label="厚生労働省" year="2023年"></data-source>
<data-source label="e-Stat" note="社会生活統計指標および人口動態統計を使用"></data-source>
```

| 属性 | 必須 | 説明 |
|---|---|---|
| `url` | △ | 出典 URL（リンクにする場合） |
| `label` | ○ | 出典名（URL がない場合はテキスト表示） |
| `year` | × | 年度（「（2023年）」の形で表示） |
| `note` | × | 補足テキスト |

### サイト内リンク（カード型）

ランキングページ・相関ページへの誘導リンク。横幅いっぱいのカード形式で右矢印付き。

```html
<source-link href="/ranking/unmarried-ratio-male-30-34">47都道府県の未婚率ランキングをもっと見る</source-link>
<source-link href="/correlation?x=unmarried-ratio-male-30-34&y=total-fertility-rate">未婚率 × 出生率の相関を都道府県別に見る</source-link>
```

| 属性 | 必須 | 説明 |
|---|---|---|
| `href` | ○ | リンク先パス |
| children | ○ | リンクテキスト |

## 非対応記法

- 脚注（`[^1]`）
- 数式（`$...$`、`$$...$$`）
- Mermaid ダイアグラム
- Obsidian 独自リンク（`[[wikilink]]`）
