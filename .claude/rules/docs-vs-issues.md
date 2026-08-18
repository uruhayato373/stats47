# ドキュメント作成・配置・整理ガバナンス

stats47の文書を作成・更新・統合・削除するときの唯一の判断規則。Claude CodeとCodexは
`CLAUDE.md`（`AGENTS.md`は同ファイルへのsymlink）から本規則を参照する。

決定的に検査できる許可パス・固定ファイル・必須field・鮮度上限は
`.claude/config/docs-governance.json`を機械契約とし、本規則と異なる独自ルールを
skill、agent、prompt、READMEへ複製しない。

## 基本方針 (2026-07-30 以降)

> **「現在の判断と未完了タスクは docs/、再生成可能な履歴は skill reference / state、PRで閉じるチケットと自動アラートだけ Issues」**

レビュー全文は保存しない。未完了の対策だけをTODOへ具体化し、恒久判断は既存の戦略・rules・READMEへ直接統合する。

## 新規作成の原則

新規Markdownファイルは例外とし、次の順に統合先を探す。

1. 同じ判断範囲を持つ既存SSOTを更新する。
2. 未完了の行動なら`.claude/todo/`の固定バックログへ追加する。
3. コードに密結合する仕様なら対象コード近傍の`README.md`へ置く。
4. agentの実行規約・手順なら`.claude/rules/`または`.claude/skills/`へ置く。
5. 機械状態・再生成可能値なら`.claude/state/`へ置く。
6. 比較用の定期履歴なら対応skillの`reference/`へ置く。
7. 上記に統合できず、人が継続的に意思決定へ使う独立した責務がある場合だけ新規作成する。

新規作成時は「既存SSOTへ統合できない理由」「owner」「削除または見直し条件」を差分から説明できなければならない。
`00_プロジェクト管理`、`01_技術設計`、`todo`は固定構成のため、新規ファイルを追加しない。

## 文書の責務境界

| 種別 | 保持する内容 | 保持しない内容 |
|---|---|---|
| 戦略・技術設計 | 現在採択している判断、境界、不変条件 | 週次値、完了工程、長い作業ログ |
| 実装計画 | activeな領域実装の契約、受入条件、関連backlog | 完了済みPhase、単発prompt、status台帳の複製 |
| TODO | 未完了の行動、owner、優先度、次、完了条件 | 完了履歴、レビュー全文、恒久知識 |
| rule / skill / README | agent規約、反復手順、コード固有契約 | 現在の優先順位、期限、週次実測 |
| state / reference | 機械状態、再生成値、比較に必要な履歴 | 人が読む戦略の複製 |

同じ事実を複数箇所に書かない。参照先をリンクし、status・期日・件数・実装手順の正典を混在させない。

## 判定軸

### docs/ に置くもの

| データ | 配置先 |
|---|---|
| 戦略・要件・ペルソナ・ロードマップ | `docs/00_プロジェクト管理/` `docs/02_実装計画/` |
| 技術設計・アーキテクチャ | `docs/01_技術設計/` |
| 現在の月次・週次計画 | `.claude/todo/{monthly,weekly}.md`（上書き。履歴はgit） |
| agent用週次レビュー | `.claude/skills/management/weekly-review/reference/reviews/YYYY-Www.md` |
| 週次メトリクス | `.claude/state/metrics/`（機械状態。人手Markdownを複製しない） |
| 批判的レビュー・事前検死・監査の未完了策 | `.claude/todo/{improvements,backlog}.md`。優先度・実行順・停止条件・完了条件を付ける |
| 定期レポート・比較用履歴 | 対応skillの `reference/`。機械値だけなら `.claude/state/`。人間向け全文をdocsへ複製しない |
| 改善施策の一覧・TODO (gsc / ga4 / adsense / psi / affiliate / cloudflare-cost 等) | `.claude/todo/improvements.md` |
| 未分類の思いつき TODO | `.claude/todo/backlog.md` へカード起票 (タグ無し = 分類待ちとして検査が集計 → `.claude/rules/todo-standards.md`) |
| セッション残タスク | `.claude/todo/backlog.md` へカード起票 (改善施策のみ improvements.md。2026-07-22 に一時ハンドオフ文書を廃止) |
| **テーマ関連のレビュー・監査・運用設計** | `.claude/skills/theme/manage-theme-portfolio/reference/{reviews,audits}/` + `テーマポートフォリオ運用.md`。最新状態はstate、未完了策はTODO |
| **survey 関連のレビュー・監査・運用設計** | `.claude/skills/survey/manage-survey-portfolio/reference/{reviews,audits}/` + `surveyポートフォリオ運用.md`。最新状態は `.claude/state/surveys/portfolio.json`、未完了策はTODO |
| **アフィリエイト運用の台帳・監査・実験仕様 (例外)** | 広告在庫・直接配置 = git TS (`apps/web/scripts/affiliate-{ads,direct-placements}-data.ts`)、規約 = `.claude/rules/affiliate-ads-standards.md`、手順 = `.claude/skills/ads/*/SKILL.md`、機械状態 = `.claude/state/ads/*.json`、詳細履歴 = `.claude/skills/analytics/affiliate-improvement/reference/` — agent (affiliate-manager) 主導のため docs に置かない (2026-07-15 オーナー判断。旧 `docs/40_アフィリエイト管理/` は廃止済み、移行履歴はgitに保持) |
| **商品ポートフォリオの実装・運用詳細 (例外)** | 進捗 = `.claude/todo/backlog.md`、商品生成規約 = `.claude/rules/coconala-product-standards.md`、横断チャネル詳細 = `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md` — Claude Code／商品管理agent向けの実行情報を実装計画へ重複させない (2026-07-29 オーナー判断で実装計画から移設) |
| **SNS競合リサーチ運用 (例外)** | X投稿単位 = `.claude/skills/sns/x-viral-research/SKILL.md`、X/Instagramのアカウント単位 = `.claude/skills/sns/competitor-scan/SKILL.md` — 未採択の専用Playwright collector仕様を実装計画へ保持せず、既存skillを運用SSOTにする。Instagram投稿単位collectorが必要なら同skillの拡張として再提案する (2026-07-29 オーナー判断) |
| **サイト回遊グラフ・レコメンド実装詳細 (例外)** | 進捗 = `.claude/todo/backlog.md`の`KAIYU-HUB-01`、詳細 = `.claude/skills/analytics/seo-audit/reference/site-navigation-graph.md`、監査入口 = `/seo-audit --focus content` — ページ横断の内部リンク監査・実装契約をagent参照へ一本化する (2026-07-29 オーナー判断で実装計画から移設) |
| **検索成長基盤・週次計測契約 (例外)** | 進捗 = `.claude/todo/backlog.md`の`SEARCH-OBSERVABILITY-RELEASE-01`、運用入口 = `.claude/skills/analytics/search-growth/SKILL.md`、基盤契約 = 同`reference/platform-contract.md`、週次契約 = 同`reference/weekly-cycle-contract.md` — CLI/MCP/metrics/週次agentが共有する恒常契約をskill配下へ一本化する (2026-07-29 オーナー判断で実装計画から移設) |
| ブログ / note コンテンツ backlog | `docs/30_note記事企画/backlog/` |
| 機能 / 自動化 / 指標拡充 backlog (未着手) | `.claude/todo/backlog.md` |

### GitHub Issues に置くもの

| データ | ラベル | 起票方法 |
|---|---|---|
| 機能改修・実装タスク (PR で close される) | `enhancement` | 人間が `gh issue create` |
| バグ修正 | `bug` | 人間が `gh issue create` |
| Cloudflare 日次 usage 閾値違反 | `cloudflare-alert,auto-generated` | `.github/workflows/cloudflare-usage-daily.yml` |
| PSI 日次計測の閾値違反 | `psi-alert,auto-generated` | `.github/workflows/psi-audit-daily.yml` |
| OGP/カード/note 画像の生成漏れ (自動修復後も残存) | `ogp-alert,auto-generated` | `.github/workflows/ogp-image-audit-weekly.yml` |
| サイト内リンクのリンク切れ (soft 404 / 410 含む。ブログ本文 + ページ側コンポーネント生成リンク) | `link-alert,auto-generated` | `.github/workflows/internal-link-audit-weekly.yml` |
| 文書の鮮度超過・構造ドリフト | `auto-generated` | `.github/workflows/agent-consistency-weekly.yml` |
| **連続失敗している cron + 配信データの陳腐化 (横断)** | `ci-health-alert,auto-generated` | `.github/workflows/workflow-health-daily.yml` |
| 楽天カタログ同期の失敗 | `rakuten-alert,auto-generated` | `.github/workflows/sync-rakuten-catalog.yml` |
| ランキングデータ整合性の異常 | `ranking-alert,auto-generated` | `.github/workflows/ranking-integrity-audit-weekly.yml` |
| 出典・再現性 lint の error | `provenance-alert,auto-generated` | `.github/workflows/provenance-audit-weekly.yml` |
| テーマチャートの e-Stat 取得失敗 | `theme-alert,auto-generated` | `.github/workflows/theme-chart-audit-weekly.yml` |
| e-Stat → R2 更新の失敗 | `data-refresh-alert,auto-generated` | `.github/workflows/data-refresh.yml` |
| GSC カバレッジ是正キューの異常 | `coverage-alert,auto-generated` | `.github/workflows/fetch-metrics-weekly.yml` |
| 国土数値情報カタログの更新検知 | `ksj-catalog,auto-generated` | `.github/workflows/ksj-catalog-monthly.yml` |

**アラート workflow は自分のラベルを同じ step で ensure する** (`gh label create <name> --force 2>/dev/null || true` → `gh issue create`)。ラベルが未登録だと `gh issue create` が `could not add label` で落ち、**通知が 1 度も飛ばない**。2026-08-12 に `rakuten-alert` 未登録でこれが起き、楽天同期が 9 日間死んでいたことを誰も知らなかった (ログの最終行も真因ではなくラベルエラーになり原因を隠す)。機械検査は `.claude/scripts/lib/__tests__/alert-issue-lifecycle.test.cjs` が workflow を glob で走査して行う。

### 判定フロー

```
新規記録を保存したい
  ↓
未完了の行動か？
  ├─ YES → .claude/todo/ の該当バックログ
  └─ NO
      ↓
PR で close される単発タスクか？
  ├─ YES → Issues (enhancement / bug)
  └─ NO → 自動 cron で生成される閾値違反アラートか？
          ├─ YES → Issues (auto-generated + *-alert)
          └─ NO → 恒久判断は既存SSOT、定期履歴はskill reference、機械値はstate
```

## 改善施策の記録構造 (active 一覧 + 詳細履歴)

improvement 系スキル (gsc / ga4 / adsense / affiliate / cloudflare-cost / psi / sns-metrics) は以下の責務で記録する:

| 場所 | 内容 |
|---|---|
| `.claude/todo/improvements.md` | active 施策の一覧 (6列の簡易表)。pending / in-progress / effect-pending と Tier + 期日を管理し、効果判定後は行を削除する。**TODO 真実源** |
| `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` | agent 用詳細ログ。検証コマンド・仮説・期日・URL inspection 結果など、agent が深掘り参照する詳細 |

人間は `.claude/todo/improvements.md` を読み、agent (*-improvement / weekly-review) は両方を読む。

## frontmatter規約

`docs/00_プロジェクト管理/`、`docs/01_技術設計/`、`docs/02_実装計画/`、
`.claude/todo/`のMarkdownには、少なくとも次の4項目を付ける。

```yaml
---
title: 文書名
type: strategy | technical-design | implementation-spec | monthly-plan | ...
status: active
updated: 2026-MM-DD
---
```

許可statusは`active`、`adopted`、`draft`、`in-progress`。
`completed`、`archived`、`deprecated`、`obsolete`、`retired`、`superseded`になった文書は
残置せず削除する。月次は`month`、週次は`week`、activeな実装計画は`related_backlog`も必須。

`updated`は内容を実際に確認・変更した日だけ更新する。検査を通す目的の機械的な日付更新は禁止する。

## TODOの作成契約 (カード構文の正典は `.claude/rules/todo-standards.md`)

- IDは英大文字・数字・ハイフンで一意にする（`### [ID] タイトル`）。
- improvements (改善バックログ) は6列（ID、タイトル、Status、Due、Owner、Metric）を維持する。
- backlog のカードは tier セクション（🔴🟡🟢🟣）の中に置き、`タグ:` 行（カテゴリ/種類/実行/検証/起票/期日）を付ける。タグ無しは分類待ちとして検査が集計する。
- 実行中のカードには完了条件を本文に付ける。外部変更や破壊的操作には停止条件・禁止・承認境界も付ける。作業中は `[進行中]` を立てる。
- 月次・週次計画はカードのIDを参照し、タグや詳細を複製しない。
- 完了・撤退・supersededはカードまたは行を削除し、Git履歴へ委ねる。

## 整理・削除契約

1. ファイルのconsumerと参照元を`rg`とリンクチェッカーで確認する。
2. 未完了策をTODOへ具体化する。
3. 恒久判断を既存の戦略・rule・READMEへ統合する。
4. 定期履歴が再利用される場合だけ対応skillの`reference/`へ移す。
5. 生成スクリプト・workflow・skillの旧出力先を同時に変更する。
6. 対象を削除し、INDEXを`npm run docs:fix`で再生成する。
7. `npm run docs:check`を通す。

`archive/`、レビュー保存ディレクトリ、一時handoff文書は作らない。復元は
`git log --diff-filter=D -- <path>`を使う。意味判断なしの自動削除は禁止する。

## 自動化と実行コマンド

| 層 | コマンド・入口 | 責務 |
|---|---|---|
| 自動修正 | `npm run docs:fix` | 生成マーカー内の実装計画INDEXだけを実ファイルから再生成 |
| ローカル検査 | `npm run docs:check` | 構造、frontmatter、固定構成、TODO、INDEX、リンク悪化 |
| 完全棚卸し | `npm run docs:check:all` | テスト、構造、鮮度、リンク、orphan候補 |
| agent運用 | `/maintain-docs` | 重複、統合先、削除可否を意味レビュー |
| Claude Stop hook | `.claude/hooks/check-docs-on-stop.js` | 文書差分があるturnの終了前に構造・リンクerrorを差し戻す |
| pre-commit | `apps/web/scripts/pre-commit-checks.sh` | 文書関連差分があるcommitを事前検査 |
| PR | `pr-quality-check.yml` | 決定的な構造回帰を拒否 |
| 週次 | `agent-consistency-weekly.yml` | 鮮度warningを含めて検査し、異常時だけalert |

機械契約の変更は`.claude/config/docs-governance.json`、checker、テスト、本規則を同じ差分で更新する。
CIのwarningはPRを止めないが、週次検査では`--fail-on-warn`により通知対象とする。

## PR と docs/ の連携

PR で機能改修を行う場合、関連する docs/ ファイル (改善ログ等) を同 PR で更新する規約:

- PR 本文に「対応: `.claude/todo/improvements.md` の `T1-PSI-LCP-02`」のようにファイルとIDを書く
- improvement-log の section の `deployed_at` / `verification_command` を PR 内で更新
- Issue ベースの `Closes #N` フローは `enhancement` ラベルの Issue でのみ使用

## 過去の移行履歴

- 2026-04: `docs/90_課題管理/` 廃止 → GitHub Issues (`enhancement` ラベル)
- 2026-04-21: `docs/03_レビュー/` 廃止 → GitHub Issues (`critical-review` 等ラベル)
- 2026-05-16: GitHub Issues の週次・レビュー系ラベルをファイル運用へ移行。2026-07-15 に現在計画=`.claude/todo/`、agent週次レビュー=skill reference、メトリクス=`.claude/state/metrics/`へ再整理。
- 2026-06-06: `docs/05_改善ログ/` 廃止 → `.claude/todo/improvements.md` に統合 (1 層構造化)
- 2026-06-07: `docs/50_Issues/` 廃止 → 機能・指標バックログ (現 `.claude/todo/backlog.md`) に統合。ui-improvements は対応済みで削除
- 2026-07-30: レビュー保存ディレクトリを廃止。未完了策は `.claude/todo/`、恒久判断は既存SSOT、定期履歴はskill referenceへ統合
- 2026-07-30: 文書ガバナンスを機械契約・checker・pre-commit・PR・週次監査へ配線
