# docs ディレクトリ INDEX

> **方針 (2026-05-16 以降)**: 計画・レビュー・改善ログ・コンテンツ backlog は **すべて docs/ 配下に集約** し Obsidian で振り返る運用。GitHub Issues は (a) PR で close される `enhancement`/`bug`、(b) 日次アラート (`cloudflare-alert`/`psi-alert`) のみ残す。詳細: [`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)

## ドキュメント分類

| ディレクトリ | 役割 | 運用 |
|---|---|---|
| `00_プロジェクト管理/` | プロジェクトの基盤文書（定義・収益化・マーケ・ペルソナ） | 内容更新が中心。固定 4 ファイル |
| `01_技術設計/` | システム構成・DDD 分類・ドメイン設計・フロントエンド設計 | 内容更新が中心。構成変更時のみファイル追加可 |
| `02_実装計画/` | 実装ロードマップ・フェーズ計画 | 内容更新が中心。完了した設計書は `archive/` へ |
| `03_週次運用/` | 週次計画・週次レビュー・週次メトリクス | `週次計画/YYYY-Www.md` / `週次レビュー/YYYY-Www.md` / `メトリクス/YYYY-Www.md` を週次 append |
| `04_レビュー/` | 批判的レビュー・事前検死・SEO 監査・SNS 週報・パフォーマンス・コスト月報 | カテゴリ別サブディレクトリで蓄積 |
| `05_改善ログ/` | gsc / ga4 / adsense / psi / cloudflare-cost 改善施策の人間向け要約 | 1 metric = 1 ファイル append-only。frontmatter `status:` で施策の進捗管理 |
| `10_SNS戦略/` | SNS コンテンツ設計 | 内容更新が中心 |
| `15_実験ログ/` | YouTube 実験ファイル群 (1 実験 1 ファイル) | `youtube/EXP-NNN.md` |
| `20_ブログ記事企画/` | ブログ記事の企画・テーマ案 | 蓄積 |
| `21_ブログ記事原稿/` | ブログ記事の下書き原稿 | 蓄積 |
| `22_YouTube企画/` | YouTube 通常動画の企画 | `backlog/<theme>.md` 蓄積 |
| `30_note記事企画/` | note 記事の企画・戦略 (+ backlog) | 蓄積 |
| `31_note記事原稿/` | note 記事の下書き原稿 | 公開後 `.local/r2/note/` へ移動し削除 |
| `40_アフィリエイト管理/` | アフィリエイト商材・配置管理 | 内容更新 |
| `50_Issues/` | 未着手の機能・自動化・UI 改善 backlog | `feature-backlog.md` / `automation-backlog.md` / `ui-improvements.md` |
| `80_参考資料/` | 白書 PDF 等の外部資料 | 追加のみ |

## 00_プロジェクト管理/ の固定構成

```
00_プロジェクト管理/
├── 01_プロジェクト定義.md
├── 02_収益化戦略.md
├── 03_マーケティング戦略.md
└── 04_ターゲットペルソナ.md
```

戦略文書はここに統合管理。日付サフィックス付きファイル (`-YYYY-MM-DD.md`) は禁止。更新は同名ファイルへの上書きで行う。

## 配置の判断基準（docs/ vs .claude/ vs Issues）

| 対象 | 置き場所 | 例 |
|---|---|---|
| 人間が意思決定・振り返りに使う文書 | `docs/` | プロジェクト定義、週次レビュー、批判的レビュー、改善ログ、コンテンツ backlog |
| 人間が編集する原稿・企画 | `docs/` | ブログ企画・note 原稿・参考資料・YouTube 企画 |
| エージェントが深掘りする詳細ログ・スナップショット | `.claude/skills/<skill>/reference/` | GSC/GA4 週次 snapshot CSV、improvement-log.md (agent 用) |
| エージェント実行時の一時データ・state | `.claude/state/` | experiments.json、metrics/*/LATEST.md |
| 自動化系の生 CSV / JSON snapshot | `.claude/state/metrics/<service>/` | psi-batch-*.json、cloudflare/snapshots/ |
| PR で close する機能改修 / バグ | GitHub Issues (`enhancement` / `bug`) | UI バグ、API 追加、リファクタ |
| 日次自動アラート | GitHub Issues (`cloudflare-alert` / `psi-alert` + `auto-generated`) | 閾値違反通知のみ |

迷ったら判定フロー (`../.claude/rules/docs-vs-issues.md#判定フロー`) を参照。

## ドキュメント運用ルール

### 新規記録の追加先

1. **戦略・要件の変更** → `00_プロジェクト管理/` 該当ファイルを Edit (新規ファイル追加禁止)
2. **週次計画・レビュー** → `/weekly-plan` / `/weekly-review` スキルが `03_週次運用/` に自動生成
3. **改善施策の記録** → `/{gsc,ga4,adsense,cloudflare-cost,performance}-improvement action` が `05_改善ログ/` に append
4. **コンテンツ backlog** → 該当 `*企画/backlog/` に Write
5. **未着手の機能・自動化バックログ** → `50_Issues/{feature,automation}-backlog.md` に section 追加
6. **機能改修 / バグ** → `gh issue create --label enhancement` で Issues 起票

### lifecycle

```
新規作成 → docs/<適切なパス> または Issues (enhancement/bug)
  ↓ 実装完了
docs/: status: archived に変更 / Issues: PR で close
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

- `00_プロジェクト管理/` にファイルを追加する (4 ファイル固定)
- 日付サフィックス付きファイル (`*-YYYY-MM-DD.md`) を `00_/` `01_/` `02_/` `05_/` の上書き型ディレクトリに置く (週次・レビュー系の `YYYY-Www.md` / `YYYY-MM-DD.md` は OK)
- 実装完了した計画書を `02_実装計画/` 直下に残す (`archive/` へ移動)
- weekly / review / improvement 系スキルから `gh issue create` する (`docs/` 配下に Write すること)

## frontmatter 規約

自動生成ファイルは frontmatter を付与し、Obsidian Bases で絞り込み可能にする:

```yaml
---
type: weekly-plan | weekly-review | critical-review | pre-mortem | improvement-log | youtube-experiment | ...
week: 2026-Www       # 週次系のみ
date: 2026-MM-DD
status: draft | active | pending | completed | archived | effect/full | effect/partial | ...
tier: 1 | 2 | 3      # 改善施策のみ
target_metric: <metric>  # 改善施策のみ
related_issue: 274   # 元 Issue がある場合のみ
tags: []
---
```

詳細: [`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)
