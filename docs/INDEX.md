# docs ディレクトリ INDEX

> **方針**: 計画・レビュー・改善ログ・コンテンツ backlog は **すべて docs/ 配下に集約**し Obsidian で振り返る運用。GitHub Issues は (a) PR で close される `enhancement`/`bug`、(b) 日次アラート (`cloudflare-alert`/`psi-alert` 等) のみ残す。詳細: [`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)
>
> **2026-07-11 再編**: TODO は `todo/`、セッション引き継ぎは `handoffs/` に切り出した (doboku-note 式)。完了・消化済みドキュメントはアーカイブせず削除し、記録は git 履歴に委ねる。

## まずここから

| 知りたいこと | 場所 |
|---|---|
| **次に何をやるか (TODO)** | [`todo/`](todo/README.md) — inbox + 改善/機能/指標バックログの 4 ファイル固定 |
| **前セッションからの引き継ぎ** | [`handoffs/`](handoffs/README.md) — 消化したら抽出→削除 (貯めない) |
| 今月・今週の計画 | `03_週次運用/月次計画/` `03_週次運用/週次計画/` |
| 収益化の正典 | `02_実装計画/01_収益化マスタープラン.md` |

## ドキュメント分類

| ディレクトリ | 役割 | 運用 |
|---|---|---|
| `todo/` | **TODO の単一の入口** (inbox / 改善 / 機能 / 指標) | 4 ファイル固定。完了は行削除 (git 履歴が記録) → `todo/README.md` |
| `handoffs/` | セッション引き継ぎ | `YYYY-MM-DD-<topic>.md`。抽出→削除の一方向 → `handoffs/README.md` |
| `00_プロジェクト管理/` | プロジェクトの基盤文書（定義・収益化・マーケ・ペルソナ） | 固定 4 ファイル。内容更新のみ・新規ファイル追加禁止 |
| `01_技術設計/` | システム構成・DDD 分類・ドメイン設計・フロントエンド設計 | 内容更新が中心。構成変更時のみファイル追加可 |
| `02_実装計画/` | 戦略・領域別実行計画 | 連番ファイルのみのフラット構成。完了・superseded は git 履歴へ |
| `03_週次運用/` | 月次計画・週次計画・週次レビュー・週次メトリクス | `月次計画/YYYY-MM.md` / `週次{計画,レビュー}/YYYY-Www.md` / `メトリクス/YYYY-Www.md`。月次が重点 1-2 テーマを決め、週次が分割消化。**消化済み (概ね 4 週より古い) は削除** |
| `04_レビュー/` | 批判的レビュー・事前検死・監査・SNS 週報・コスト月報 | フラット。`{YYYY-MM-DD,YYYY-Www,YYYY-MM}-<topic-slug>.md`、種別は frontmatter `type:` |
| `10_SNS戦略/` | SNS コンテンツ設計 (実行規約の正典は `.claude/rules/sns-content-standards.md`) | 内容更新が中心 |
| `21_ブログ記事原稿/` | ブログ記事の下書き (R2 が正典・publish 後は CI が自動削除する ephemeral outbox) | 蓄積しない |
| `30_note記事企画/` | note 記事の企画・戦略 (+ backlog)。チャート無しのアイデア段階 | 蓄積 |
| `31_note記事原稿/` | note 記事ソースの**単一管理**（下書き〜公開済み）。公開しても移動しない。状態は frontmatter `status` + `.claude/state/note-published-urls.json` | 蓄積 |
| `40_アフィリエイト管理/` | アフィリエイト商材・配置管理 | 内容更新 |

## 00_プロジェクト管理/ の固定構成

```
00_プロジェクト管理/
├── 01_プロジェクト定義.md
├── 02_収益化戦略.md
├── 03_マーケティング戦略.md
└── 04_ターゲットペルソナ.md
```

戦略文書はこの 4 ファイルに統合管理。日付サフィックス付きファイル (`-YYYY-MM-DD.md`) は禁止。更新は同名ファイルへの上書きで行う。

## 配置の判断基準（docs/ vs .claude/ vs Issues）

| 対象 | 置き場所 | 例 |
|---|---|---|
| やること (未着手タスク・受信箱) | `docs/todo/` | 改善施策、機能、指標拡充、思いつき |
| セッション引き継ぎ | `docs/handoffs/` | 作業途中の文脈・残タスク・注意点 |
| 人間が意思決定・振り返りに使う文書 | `docs/` 各分類 | プロジェクト定義、週次レビュー、批判的レビュー |
| 人間が編集する原稿・企画 | `docs/` | note 原稿・note 企画・ブログ下書き |
| エージェントが深掘りする詳細ログ・スナップショット | `.claude/skills/<skill>/reference/` | GSC/GA4 週次 snapshot CSV、improvement-log.md (agent 用) |
| エージェント実行時の一時データ・state | `.claude/state/` | experiments.json、metrics/*/LATEST.md |
| PR で close する機能改修 / バグ | GitHub Issues (`enhancement` / `bug`) | UI バグ、API 追加、リファクタ |
| 日次自動アラート | GitHub Issues (`*-alert` + `auto-generated`) | 閾値違反通知のみ |

迷ったら判定フロー (`../.claude/rules/docs-vs-issues.md#判定フロー`) を参照。

## ドキュメント運用ルール

### 新規記録の追加先

1. **やることを思いついた** → `todo/inbox.md` に 1 行 append (triage で各バックログへ)
2. **セッションを引き継ぐ** → `handoffs/YYYY-MM-DD-<topic>.md` を新規作成
3. **戦略・要件の変更** → `00_プロジェクト管理/` 該当ファイルを Edit (新規ファイル追加禁止)
4. **月次計画** → `/monthly-plan` スキルが `03_週次運用/月次計画/YYYY-MM.md` に生成（月初）
5. **週次計画・レビュー** → `/weekly-plan` / `/weekly-review` スキルが `03_週次運用/` に自動生成
6. **改善施策の記録** → `todo/01_改善バックログ.md` の該当行の status を更新
7. **機能改修 / バグ** → `gh issue create --label enhancement` で Issues 起票

### lifecycle（アーカイブしない・削除する）

```
新規作成 → docs/<適切なパス> または Issues (enhancement/bug)
  ↓ 実装完了・消化
docs/: git rm で削除（記録は git 履歴。archive/ ディレクトリは作らない）
Issues: PR で close
```

- 復元・振り返りは `git log --diff-filter=D -- docs/<path>` から。
- 例外: `04_レビュー/` は振り返り資産として蓄積を許容。`03_週次運用/` は概ね 4 週で削除。

### docs 外のドキュメント

コードに密結合するドキュメントは、対象の隣に README.md として配置する。

| ドキュメント | 配置先 |
|---|---|
| DB 操作・スキーマ・シード | `packages/database/README.md` |
| R2 ストレージ | `packages/r2-storage/README.md` / `packages/r2-storage/src/scripts/README.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| Pre-commit フック | `.husky/README.md` |
| 各 feature の設計 | `apps/*/src/features/*/README.md` |

### やってはいけないこと

- `00_プロジェクト管理/` に戦略文書を追加する (固定 4 ファイルへの Edit で対応)
- `todo/` に 4 ファイル以外の TODO ファイルを追加する (`todo/README.md`)
- 日付サフィックス付きファイル (`*-YYYY-MM-DD.md`) を `00_/` `01_/` `02_/` の上書き型ディレクトリに置く (週次・レビュー・handoff 系の日付ファイルは OK)
- `archive/` ディレクトリを作る (削除して git 履歴に委ねる)
- weekly / review / improvement 系スキルから `gh issue create` する (`docs/` 配下に Write すること)

## frontmatter 規約

自動生成ファイルは frontmatter を付与し、Obsidian Bases で絞り込み可能にする:

```yaml
---
type: monthly-plan | weekly-plan | weekly-review | critical-review | pre-mortem | improvement-log |
      session-handoff | todo-inbox | youtube-experiment | note-plan | ...
month: 2026-MM       # 月次計画のみ
week: 2026-Www       # 週次系のみ
date: 2026-MM-DD
status: draft | active | pending | completed | archived | effect/full | effect/partial | ...
tier: 1 | 2 | 3      # 改善施策のみ
target_metric: <metric>  # 改善施策のみ
tags: []
---
```

詳細: [`../.claude/rules/docs-vs-issues.md`](../.claude/rules/docs-vs-issues.md)
