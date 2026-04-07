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

記事中盤に1つ配置する。

```html
<ad-slot></ad-slot>
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
