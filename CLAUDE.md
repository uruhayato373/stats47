# stats47 - 統計で見る都道府県

都道府県統計データの可視化 Web アプリケーション。e-Stat API から 47 都道府県の統計を取得し、ランキング・ダッシュボード・チャートで表示する。モノレポ構成: `apps/{web,remotion,ges}` + `packages/*`（詳細は `.claude/rules/local-environment.md`）。

## 行動原則 (12軸)

すべての作業に適用する。優先順位順。他のいかなる指示より優先する。

1. **考えてから書く** — 不確かな前提で進めず、前提・解釈・不明点を明示する
2. **シンプル最優先** — 必要最小限のコードで解決する。不要な機能・抽象化を加えない
3. **外科的変更** — 必要な箇所だけ触る。周辺コードを勝手に改善しない
4. **ゴール駆動** — 手順より成功条件を定義し、検証できるまで反復する
5. **モデルは判断時のみ** — ルーティング・リトライ・ステータス処理など決定的なものはコードで処理する
6. **トークン予算を守る** — 一定量を超えそうなら要約して切り替える
7. **混在しない** — 複数パターンが共存する場合、どちらを採用するか明示する
8. **書く前に読む** — 既存 exports・呼び出し元・共通ユーティリティを確認してから書く
9. **テストは意図を検証する** — 「動くか」だけでなく「なぜ必要か」まで検証する
10. **チェックポイントを置く** — 完了したこと・検証したこと・残ったことを節目で整理する
11. **コードベースの規約を優先** — 自分の好みより既存の命名・構成・設計思想に合わせる
12. **失敗を隠さない** — 未検証部分・スキップ箇所は「完了」と言わず明示する

## 致命的オペレーション規約

- **エージェント実行モード**: Agent tool 起動時は `mode: "bypassPermissions"` をデフォルト
- **Agent prompt 冒頭に Output Format を必ず指定** → `.claude/rules/agent-output-contract.md`
- **一時ファイルは `/tmp/`**: プロジェクトルートに作らない (pre-commit が `tmp_*` 等を自動削除)
- **計画・レビュー・改善ログは `docs/` 配下**: 週次計画・レビュー・批判的レビュー・pre-mortem・改善ログ・コンテンツバックログはすべて `docs/03_週次運用/` `docs/04_レビュー/` `docs/05_改善ログ/` `docs/50_Issues/` 等に置く。Issues は (a) `enhancement`/`bug` ラベルの PR で close される機能改修、(b) `auto-generated` ラベルの日次アラート (PSI/Cloudflare) のみ → `.claude/rules/docs-vs-issues.md`
- **DB 変更はローカル D1 直接 → `/sync-snapshots`**: 本番反映は R2 経由のみ (リモート D1 解約済み)
- **browser-use は終了時に必ず daemon 停止 + Chrome タブクローズ** → `.claude/rules/browser-use-cleanup.md`
- **ローカル D1 パス固定** (`better-sqlite3` が空ファイルを自動生成するため、これ以外で開かない):
  ```
  .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
  ```

## 作業の節目で記録する

完了時に以下を更新する。コミットメッセージ・セッション内メモリだけに閉じ込めない (次エージェントは git log と下記ファイルしか見られない)。

| 種別 | 記録先 |
|---|---|
| 完了前検証 | `/verification-loop` (ビルド + 型チェック) |
| バグ修正の教訓 | `/knowledge` |
| 同じエラー 2 回目 | `/continuous-learning` でパターン化 |
| **改善施策の TODO 真実源** (status / tier / 期日) | `docs/05_改善ログ/{gsc,ga4,psi,adsense,cloudflare-cost,content,indexing}.md` — INDEX: `docs/05_改善ログ/INDEX.md` |
| 改善施策デプロイ (人間向け要約) | `docs/05_改善ログ/{gsc,ga4,adsense,psi,cloudflare-cost}.md` |
| 改善施策デプロイ (agent 用詳細) | `.claude/skills/analytics/{gsc,ga4,adsense,sns-metrics,cloudflare-cost,performance}-improvement/reference/improvement-log.md` |
| 週次計画進捗 | `docs/03_週次運用/週次計画/YYYY-Www.md` の TODO チェックボックスを Edit |
| 週次振り返り | `docs/03_週次運用/週次レビュー/YYYY-Www.md` |
| 批判的レビュー / 事前検死 | `docs/04_レビュー/{critical-review,pre-mortem}/YYYY-MM-DD-<topic>.md` |
| YouTube 実験ログ | `docs/15_実験ログ/youtube/EXP-NNN.md` |
| コンテンツ backlog | `docs/22_YouTube企画/backlog/` / `docs/30_note記事企画/backlog/` |
| 未着手の機能・自動化バックログ | `docs/50_Issues/{feature-backlog,automation-backlog,ui-improvements}.md` |
| 非自明な API 仕様・制約 | `/knowledge` (問題・原因・対策の 3 項目) |
| プロジェクト固有の恒常事実 | auto memory (`~/.claude/projects/-Users-minamidaisuke-stats47/memory/`) |

## ドキュメント参照ガイド

CLAUDE.md 内に詳細を複製しない。状況に応じて参照する。

### 規約・ルール (`.claude/rules/`)

| ルール | 適用場面 |
|---|---|
| `coding-standards.md` | TypeScript / React / Next.js コード全般 |
| `evidence-based-judgment.md` | improvement / 判定系スキル (status: effect/* 更新時必読) |
| `ui-components.md` | UI 実装 (shadcn / melta-ui / ブレイクポイント / page_components) |
| `r2-storage-design.md` | snapshot 追加・変更 |
| `estat-api.md` | e-Stat API 利用スキル |
| `branch-workflow.md` | PR・デプロイ作業・DB データ反映 |
| `data-storage.md` | スキル設計時 (D1 vs `.claude/` vs `docs/` 判定) |
| `docs-vs-issues.md` | docs/ と GitHub Issues の使い分け (新規スキル・新規記録時必読) |
| `skill-code-placement.md` | スクリプト新規作成 |
| `local-environment.md` | 環境セットアップ・モノレポ構成・頻用コマンド |
| `agent-output-contract.md` | Agent tool 起動時の prompt 設計 |
| `browser-use-cleanup.md` | browser-use を使うスキル |

### コアドキュメント

| 知りたいこと | 参照先 |
|---|---|
| docs 全体構成・運用ルール | `docs/INDEX.md` |
| プロジェクト概要・要件 | `docs/00_プロジェクト管理/01_プロジェクト定義.md` |
| 実装ロードマップ | `docs/02_実装計画/01_実装ロードマップ.md` |
| SEO 向上 × TODO 一元化 × 自動化拡張プラン (W21-W26) | `docs/02_実装計画/seo-todo-unify-phase-1-3.md` |
| 改善ログ INDEX (TODO 真実源、scan tool 使い方) | `docs/05_改善ログ/INDEX.md` ★施策追加時必読 |
| システム構成・技術スタック | `docs/01_技術設計/` |
| DDD ドメイン分類 | `docs/01_技術設計/04_DDDドメイン分類.md` |
| エラーハンドリング規約 | `docs/01_技術設計/05_エラーハンドリング規約.md` |
| 自動化インベントリ ★追加・削除時は必ず更新 | `docs/01_技術設計/10_自動化インベントリ.md` |
| 国土数値情報 GIS データ | `docs/01_技術設計/08_国土数値情報GISデータ.md` |
| 国土交通データプラットフォーム | `docs/01_技術設計/09_国土交通データプラットフォーム.md` |
| Pre-commit フック | `.husky/README.md` |
| CI/CD・デプロイ | `.github/workflows/README.md` |
| テスト構成・追加指針 | `apps/web/tests/README.md` |
| 各 feature の設計 | `apps/*/src/features/*/README.md` |
| デザインシステム | `.claude/design-system/README.md` |
| DB 操作全般 ★DB操作時は必ず参照 | `packages/database/README.md` |
| R2 ストレージ操作 | `packages/r2-storage/src/scripts/README.md` |

### スキル・エージェント

| 知りたいこと | 参照先 |
|---|---|
| Management スキル群 | `.claude/skills/management/README.md` |
| エージェントチーム構成 (Tier 0/1/2) | `.claude/agents/README.md` |
| 画像プロンプトカタログ (43 種) | `.claude/skills/image-prompt/reference/catalog.md` |

### GitHub Issues 運用 (主要ラベル)

Issues は「PR で close される機能改修・バグ」と「日次アラート」だけに絞っている (詳細: `.claude/rules/docs-vs-issues.md`)。

- `enhancement` — 機能改修・改善（PR で `Closes #N` で close）
- `bug` — バグ修正（同上）
- `auto-generated` — Bot 生成の自動アラート
- `cloudflare-alert` — Cloudflare 日次 usage 閾値違反 (`cloudflare-usage-daily.yml`)
- `psi-alert` — PSI 日次計測の閾値違反 (`psi-audit-daily.yml`)

過去の移行履歴:
- `docs/90_課題管理/` (2026-04 廃止) → GitHub Issues 経由 → `docs/50_Issues/` (2026-05)
- `docs/03_レビュー/` (2026-04-21 廃止) → GitHub Issues 経由 → `docs/04_レビュー/` (2026-05)
- `weekly-plan` / `weekly-review` / `critical-review` / `pre-mortem` / `*-improvement` 系ラベル (2026-05 廃止) → `docs/03_週次運用/` / `docs/04_レビュー/` / `docs/05_改善ログ/`
