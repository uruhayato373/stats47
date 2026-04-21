# docs ディレクトリ INDEX

## ドキュメント分類

| ディレクトリ | 役割 | 運用 |
|---|---|---|
| `00_プロジェクト管理/` | プロジェクトの基盤文書（概要・要件・統合計画） | **ファイル追加禁止。既存ファイルの内容更新のみ。** |
| `01_技術設計/` | システム構成・DDD 分類・ドメイン設計・フロントエンド設計 | 内容更新が中心。構成変更時のみファイル追加可 |
| `02_実装計画/` | 実装ロードマップ・フェーズ計画 | 内容更新が中心 |
| ~~`03_レビュー/`~~ | **廃止**（2026-04-21 移行）。週次レビュー・Pre-Mortem・パフォーマンス・批判的レビュー等は **GitHub Issues** へ（ラベル `weekly-plan` / `weekly-review` / `pre-mortem` / `performance-report` / `critical-review` 等） | — |
| `youtube_experiments.md` | YouTube Shorts 実験ログ（`/record-youtube-experiment`） | 蓄積 |
| `10_SNS戦略/` | SNS コンテンツ設計（X + YouTube に集中） | 内容更新が中心 |
| `20_ブログ記事企画/` | ブログ記事の企画・テーマ案 | 蓄積 |
| `21_ブログ記事原稿/` | ブログ記事の下書き原稿 | 蓄積 |
| `30_note記事企画/` | note 記事の企画・戦略 | 蓄積 |
| `31_note記事原稿/` | note 記事の下書き原稿 | 公開後 `.local/r2/note/` へ移動し削除 |
| `80_参考資料/` | 白書 PDF 等の外部資料 | 追加のみ |
| ~~`90_課題管理/`~~ | **廃止**（2026-04 移行）。実装計画・課題・アイデアは **GitHub Issues** へ | — |

## 00_プロジェクト管理/ の固定構成

新規ファイル・ディレクトリの追加は行わない。内容は随時更新する。

```
00_プロジェクト管理/
├── 01_プロジェクト定義.md
├── 02_収益化戦略.md
└── 03_マーケティング戦略.md
```

## 配置の判断基準（docs/ vs .claude/）

| 対象 | 置き場所 | 例 |
|---|---|---|
| 人間が意思決定・振り返りに使う文書 | `docs/` | プロジェクト定義、週次レビュー、実装ロードマップ、pre-mortem |
| 人間が編集する原稿・企画 | `docs/` | ブログ企画・note 原稿・参考資料 |
| スキルが生成する機械的ログ・スナップショット | `.claude/skills/<skill>/reference/` | GSC/GA4 週次 snapshot CSV、改善ログ |
| スキルが生成する発見・調査の一時ファイル | `.claude/skills/blog/trends-snapshots/` | トレンド発見系 7 スキルの出力 |
| Claude 実行時ログ（launchd） | `~/Library/Logs/stats47/` | scheduled ジョブの stdout/stderr |

迷ったら「**これは人間が直接読むか？** 読まないなら `.claude/` 配下」。

## ドキュメント運用ルール

### 新しい機能・計画の追加先

**GitHub Issues** に作成する（`gh issue create --label enhancement ...`）。`00_プロジェクト管理/` や `docs/` 配下には追加しない。

粒度の目安:
- ブログ記事 / note 記事 1 本 = 1 issue（ラベル `content/blog` or `content/note`）
- YouTube 通常動画 1 本 = 1 issue（ラベル `content/youtube-regular`）
- YouTube Shorts は候補プール 1 issue を維持し、着手時に個別 issue 化（ラベル `content/youtube-shorts`）
- 技術改修・DX 改善 = 1 issue（ラベル `enhancement`）

### lifecycle

```
新規作成 → GitHub Issue
  ↓ 実装完了
Issue を close（コードと各パッケージの README.md が証跡）
```

### docs 外のドキュメント

コードに密結合するドキュメントは、対象の隣に README.md として配置する。

| ドキュメント | 配置先 |
|---|---|
| DB 操作・スキーマ・シード | `packages/database/README.md` |
| シードスクリプト詳細 | `packages/database/scripts/README.md` |
| R2 ストレージ | `packages/r2-storage/README.md` |
| R2 同期スクリプト | `packages/r2-storage/src/scripts/README.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| Pre-commit フック | `.husky/README.md` |
| 各 feature の設計 | `apps/*/src/features/*/README.md` |

### やってはいけないこと

- `00_プロジェクト管理/` にファイルを追加する
- 実装完了した計画書を残す（陳腐化の原因）
- docs 内にコードの使い方を書く（各パッケージの README.md に書く）
- CLAUDE.md にドキュメントの内容を複製する（CLAUDE.md はリンク集に徹する）
