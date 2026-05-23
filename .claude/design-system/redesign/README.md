# redesign — Claude Design ハンドオフバンドル

`apps/web` の主要 11 ページのリデザイン案。Claude Design (claude.ai/design) で HTML/CSS/JS プロトタイプとしてモックアップしたものを取り込んだ。

## このフォルダの構成

```
redesign/
  INDEX.md            ← 進捗トラッカー（真実源）。ステータス・採用案・PR を管理
  README.md           ← このファイル
  project/            ← プロトタイプ本体（バンドルそのまま・フラット構造）
    <Page> Redesign.html   各ページの 4 案を並べて表示するプレビュー
    <page>-app.jsx         4 案を artboard に並べる App（各案の label/description 付き）
    components-<page>.jsx   そのページ専用の共有コンポーネント
    <page>-option-{a,b,c,d}.jsx  4 案の本体
    components.jsx / option-*.jsx / app.jsx  ← ranking ページ（接頭辞なし）
    design-canvas.jsx      全ページ共通の DesignCanvas / DCSection / DCArtboard
    styles.css             共有デザイントークン・atom クラス
    styles-blog.css        blog ページ専用追加スタイル
```

ranking ページだけ接頭辞なし（`app.jsx` / `components.jsx` / `option-a..d.jsx`）。他 10 ページは `<page>-` 接頭辞付き。

## プレビューの見方（ユーザー向け）

`project/<Page> Redesign.html` を **ブラウザで直接開く**と、そのページの 4 案（A/B/C/D）が並んで表示される。相対パス参照のため `project/` 構造は変更しないこと。

```bash
open ".claude/design-system/redesign/project/Ranking Page Redesign.html"
```

## 実装ワークフロー（エージェント向け）

ページ単位で **`/apply-redesign <page>`** スキルを使う。スキルは:

1. INDEX.md の現状ステータスを読む
2. 4 案の jsx と現行 `apps/web` 実装を比較し、推奨案を提示
3. ユーザーが採用案を確定 → pixel-perfect で本実装
4. INDEX.md のステータス・採用案・PR を更新

## 実装上の注意（プロトタイプ → 本実装）

プロトタイプは生 HTML/CSS のため、本実装ではプロジェクト規約に合わせて読み替える:

- **`styles.css` の `--shadow-lg` は使わない** → `.claude/design-system/prohibited.md` で `shadow-lg` 禁止。`shadow-sm`/`shadow-md` に読み替え。
- 色・余白・角丸トークンは `prohibited.md` / `quick-reference.md` と突き合わせ、melta-ui トークンへマッピング。
- 暗色ヒーロー・収益枠（D 案系）は cookies()/headers() を layout 経由で呼ばないこと → `.claude/rules/nextjs-ssg-preservation.md`。
- 素の `<table>`/`<select>`/`<button>` ではなく `@stats47/components` を優先 → `.claude/rules/ui-components.md`。

## バンドルの更新

新しい handoff zip を受け取ったら `project/` を丸ごと差し替え、INDEX.md の `source_bundle` を更新する。採用済み・実装済みページの差分には注意（実装済みなら無視、未着手なら最新版を使う）。
