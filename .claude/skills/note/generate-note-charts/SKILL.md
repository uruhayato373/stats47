---
name: generate-note-charts
description: note 記事用 SVG チャートを生成し PNG に変換する。Use when user says "noteチャート生成", "note画像生成". 散布図・カバー画像・横棒グラフ等に対応. 記事本文完成後に実行.
disable-model-invocation: true
---

note 記事用のチャートを SVG で生成し、PNG に変換して記事に埋め込む。

> **A シリーズ（ランキング記事・量産型）はこのワークフローの対象外。** A シリーズは `/post-note-ranking` で自動生成する。

## フロー

```
/write-note-section → ★/generate-note-charts → /edit-note-draft
```

## 引数

- **slug**: 記事ディレクトリ名（例: `b-fiscal-strength-vs-debt`）
- **チャート一覧**: ユーザーと相談して決定

## 出力先

```
docs/31_note記事原稿/<slug>/images/
├── chart-name.svg   ← レビュー用
├── chart-name.png   ← note.com アップロード用
└── cover.png        ← カバー画像（1280×670）
```

## 手順

### Phase 1: チャート設計

1. `note.md` を読み、どのセクションにどんなチャートが効果的か検討
2. ユーザーとチャート一覧を合意
3. note 読者はスマホ閲覧が多いため **シンプルで一目でわかるチャート** を優先

推奨チャート数・種類は [chart-patterns.md](reference/chart-patterns.md) を参照。

### Phase 2: データ取得

**まず `_data/chart-data.json` を確認。** 存在すれば DB 再クエリ不要。

存在しない場合、ローカル D1 から取得:

```js
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const rows = db.prepare("SELECT area_code, area_name, value, rank FROM ranking_data WHERE category_code = ? AND year_code = ? ORDER BY rank").all(key, year);
```

### Phase 3: SVG 生成

生成方法は 2 通り。記事のチャート内容に応じて使い分ける。

#### 方法 A: 同梱スクリプト（推奨）

散布図・カバー画像は同梱スクリプトで JSON 設定ファイルから生成できる。

**散布図:**

```bash
node "${CLAUDE_SKILL_DIR}/scripts/scatter.js" config.json output.svg
```

設定ファイルの書式は [scatter.js のヘッダコメント](scripts/scatter.js) を参照。

**カバー画像:**

カバー画像は記事ごとにレイアウトが異なるため、[cover-template.js](scripts/cover-template.js) をコピーして `// CUSTOMIZE:` 箇所を編集する。

```bash
cp "${CLAUDE_SKILL_DIR}/scripts/cover-template.js" docs/31_note記事原稿/<slug>/images/generate-cover.js
# CUSTOMIZE 箇所を編集
node docs/31_note記事原稿/<slug>/images/generate-cover.js
```

#### 方法 B: svg-builder パッケージ

横棒グラフ・タイルマップ・折れ線など標準チャートは `@stats47/svg-builder` を使用:

```js
import { generateBarChartSvg, toSplitItems } from "@stats47/svg-builder";
import { generateChoroplethSvg, toChoroplethItems } from "@stats47/svg-builder";
import { generateScatterSvg, joinStats } from "@stats47/svg-builder";
import { generateLineSvg } from "@stats47/svg-builder";
```

詳細は `packages/svg-builder/` を参照。

#### 方法 C: カスタムスクリプト

フレームワーク図・比較表など特殊なチャートは、[design-system.md](reference/design-system.md) の規約に従ってカスタムスクリプトを作成。完成例は [examples/](examples/) を参照。

### Phase 4: SVG → PNG 変換

同梱の変換スクリプトを使用:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/svg-to-png.js" docs/31_note記事原稿/<slug>/images
```

- チャート SVG: `density: 288`（Retina 2x 相当）
- カバー SVG（1280×670）: `density: 72`（等倍出力）

### Phase 5: 記事への埋め込み

`note.md` のチャート挿入位置にプレースホルダーを追加:

```markdown
<!-- 画像: chart-name.png -->
```

### Phase 6: 後処理

- 一時スクリプト（`generate-*.js`）を削除
- SVG は参照用に残すか、不要なら削除

## リファレンス

| 内容 | ファイル |
|------|----------|
| 色・フォント・サイズ規約 | [reference/design-system.md](reference/design-system.md) |
| チャート種別の選び方 | [reference/chart-patterns.md](reference/chart-patterns.md) |
| 散布図スクリプト | [scripts/scatter.js](scripts/scatter.js) |
| カバー画像テンプレート | [scripts/cover-template.js](scripts/cover-template.js) |
| SVG→PNG 変換 | [scripts/svg-to-png.js](scripts/svg-to-png.js) |
| 完成例 SVG | [examples/](examples/) |
| SVG 規約の詳細 | `.claude/skills/blog/generate-article-charts/SKILL.md` |
| svg-builder API | `packages/svg-builder/` |

## 注意

- **1記事あたり 2〜4 枚が目安**
- **PNG ファイルサイズ**: 1枚 200KB 以下
- **一時スクリプトは必ず削除**する
- チャート内の数値と記事本文の数値が矛盾しないよう確認
