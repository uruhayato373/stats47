# stats47 プロジェクトのスキル規約

## ディレクトリ分類

```
.claude/skills/
├── db/          # データベース・ストレージ操作
├── estat/       # e-Stat API 操作
├── blog/        # ブログ記事
├── note/        # note.com 記事
├── sns/         # SNS 投稿
├── content/     # ランキングページ向けコンテンツ
├── analytics/   # サイト分析
├── ads/         # 広告・アフィリエイト
├── ranking/     # ランキング画像
├── management/  # 経営・計画
├── ui/          # UI/UX レビュー
└── dev/         # 開発・デプロイ
```

新しいスキルは適切なカテゴリに配置する。

## CLAUDE.md への登録

スキル作成後、`CLAUDE.md` のスキル一覧テーブルに追加する:

```markdown
| `/skill-name` | 用途の説明 | `.claude/skills/<category>/<name>/SKILL.md` |
```

## 命名規則

- ケバブケース: `generate-note-charts`, `sync-snapshots`
- 動詞始まり: `generate-`, `fetch-`, `sync-`, `render-`, `publish-`, `validate-`
- 対象を含める: `-note-`, `-blog-`, `-estat-`

## ワークフロー内での位置づけ

多くのスキルはワークフローチェーンの一部。SKILL.md 冒頭にフロー図を記載する:

```markdown
## フロー
/validate-note-idea → /investigate-note-data → /design-note-structure → ★/write-note-section → /edit-note-draft
```

★ で現在のスキルの位置を示す。

## データ読み取りパターン（完全DBレス）

**新規スキルで D1/SQLite を開かない。** 本番アプリと同様、データは R2 公開 URL / git TS から読む（旧 D1/miniflare は廃止。正典 `docs/01_技術設計/02_データアーキテクチャ.md`）:

```js
// R2 公開 URL から fetch（認証不要）。読み取りは常にこの経路。
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const { item } = await (await fetch(`${R2}/app/ranking/<key>/item.json`)).json();     // ランキングメタ (.item)
const values   = await (await fetch(`${R2}/app/stats/<key>/values.json`)).json();      // 観測値 (.rows)
const items    = (await (await fetch(`${R2}/app/ranking-items/all.json`)).json()).items; // 全ランキング一覧
const blog     = (await (await fetch(`${R2}/app/blog/all.json`)).json()).articles;      // 公開記事
```

- Authored/運用エンティティ（page_components / themes / categories 等）の SSOT は **git TS**（例 `apps/web/scripts/data/page-components/<type>/<key>.json`）。skill はこれを直接 Read する。
- R2 スナップショットの生成・更新は `/sync-snapshots`（生成スクリプトが git TS / R2 観測値から派生）。
- e-Stat カタログは git-tracked `.claude/skills/estat/references/*.md` + e-Stat API。

## 一時スクリプトの扱い

- 使い捨てスクリプトは `scripts/temp-*.mjs` の命名
- Phase の最後で必ず削除
- スキルの `scripts/` ディレクトリに置くスクリプトは永続的なもののみ

## SVG/PNG 生成パターン

画像生成スキルの共通パターン:

1. SVG を Node.js スクリプトで生成
2. `sharp` ライブラリで PNG 変換（`density: 288` が標準、カバー画像は `density: 72`）
3. `.gitignore` 対象の `images/` ディレクトリに出力

## 既存スキルの参考例

| パターン | 参考スキル | 特徴 |
|----------|-----------|------|
| scripts/ 同梱 | `/generate-note-charts` | scatter.js (パラメータ駆動), cover-template.js (テンプレート), svg-to-png.js (汎用) |
| reference/ 分離 | `/generate-note-charts` | design-system.md, chart-patterns.md |
| examples/ 同梱 | `/generate-note-charts` | 完成 SVG を保存 |
| ワークフローチェーン | `/write-note-section` | validate → investigate → design → write → edit |
| Phase 構成 | `/page-data-batch` | 4 Phase（事前確認→TS-config 追加→sync-metrics-cache→R2 投入→検証）|
| 決定的な並列収集 | `/weekly-plan` | 同一セッションでsnapshot/scriptを収集→分析 |
| svg-builder 連携 | `/generate-article-charts` | パッケージ API リファレンス付き |
