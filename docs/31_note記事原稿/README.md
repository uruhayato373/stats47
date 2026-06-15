# 31_note記事原稿 — note 記事ソースの単一管理ディレクトリ

note.com に投稿する記事の**ソースの真実源（SSOT）**。下書き〜公開済みまで、すべてここで一元管理する。
（2026-06-15 に旧 `32_note公開済み/` を統合。ヴァーティカル単位の物理移動は廃止した。）

## 大原則

- **1 記事 = 1 ディレクトリ**（`<slug>/` または `<vertical>/<slug>/`）。本文 + データ + 画像をまとめる。
- **公開しても物理移動しない。** 状態は frontmatter と JSON で表す（下記）。これにより記事間の相対リンク
  （`../<slug>/...`）が公開後も切れない。
- **SSOT は git（このディレクトリ）。R2 は使わない。** note.com 自身がホスト・配信するため、stats47.jp の
  Web アプリ（R2 配信）とは別系統。R2 は note の保管にも配信にも関与しない。`.local/r2/note/` への移動方式は
  2026-05-21 に廃止済み。docs/ は git 管理なので版管理・差分・ロールバックが自動で効く（公開済みの修正にも最適）。
- **投稿・修正は browser-use**（`/publish-note`）。このディレクトリの md を編集 → そこから note.com に貼り付ける。

## 公開状態の真実源（二重管理しない）

| 何を | どこで |
|---|---|
| 記事の状態（下書き / 公開済み） | 各記事 frontmatter の `status: draft \| published` |
| 公開済み記事の slug → note URL | `.claude/state/note-published-urls.json`（**唯一の真実源**。公開のたび追記） |

ディレクトリ位置では状態を表さない（旧 31/32 の二重管理を解消）。回遊フッタ・本文内部リンクを note URL に
書き換える際は上記 JSON を参照する。

## 本文ファイル

- 本文は記事ディレクトリ直下の `note.md`（または旧 `draft.md`。現状混在。統一は別途タスク）。
- 付随: `data.json` / `tags.txt` / `hashtags.txt` / `images/`。

## 画像 — SVG をソース、PNG は再生成方式

- `*.svg`（1〜5KB）がソース。`*.png`（50〜380KB）は SVG からの派生物で、note.com には投稿時にアップ済み。
- 容量を詰めたい公開済み記事は PNG を削除し SVG のみ残してよい。必要時に再生成する:

  ```bash
  .claude/scripts/note/regenerate-svg-png.sh docs/31_note記事原稿/<vertical or slug>
  ```

- **例外**: SVG ソースを持たない旧記事（例: `a-maximum-temperature` のデータ図表）は PNG が唯一のソースのため
  削除せず追跡する。`docs/31` 配下の images は現状すべて git 追跡（`.gitignore` の 31 行はコメントアウト）。

## 修正フロー（公開済みを直す）

1. 当該記事の `note.md` / `*.svg` を修正する。
2. PNG が要るなら `.claude/scripts/note/regenerate-svg-png.sh docs/31_note記事原稿/<path>` で再生成。
3. `/publish-note --update <slug>` で note.com の既存記事に反映する（R2 への上書き工程は存在しない）。

## 企画との関係

- アイデア・backlog・ヴァーティカル戦略（チャート無しの企画段階）は `docs/30_note記事企画/`。
- 実制作（本文・データ・チャートを持つ記事ソース）になったら、このディレクトリに記事フォルダを作る。

## 関連

- 投稿・更新スキル: `.claude/skills/note/publish-note/SKILL.md`
- 編集スキル: `.claude/skills/note/edit-note-draft/SKILL.md`
- 公開済み URL 対応表: `.claude/state/note-published-urls.json`
