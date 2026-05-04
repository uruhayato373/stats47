---
name: review-feature
description: コード品質を専門家パネルで多角的にレビューする。--scope で対象を選ぶ（feature / app / packages / types / ui-consistency）。Use when user says "feature レビュー", "ドメインレビュー", "App Router レビュー", "ルーティングレビュー", "パッケージレビュー", "型レビュー", "tsc エラー直して", "UI一貫性レビュー", "見た目がバラバラ", "ads レビュー", "広告レビュー" 等. dev-review Issue に出力.
disable-model-invocation: true
argument-hint: "--scope <feature|app|packages|types|ui-consistency> [scope-specific args]"
---

コード品質を専門家パネルで多角的にレビューする。`--scope` で対象を選ぶことで、対象固有のパネリスト・メソドロジー・出力フォーマットを使い分ける。

## 引数

```
$ARGUMENTS — --scope <name> [scope-specific args]
             --scope: 対象。省略時は feature
                      feature          : apps/web/src/features/* レビュー（ドメイン固有パネリスト追加）
                      app              : Next.js App Router 層レビュー（SEO / メタデータ / キャッシュ）
                      packages         : packages/ レビュー（パッケージ境界・依存・テスト）
                      types            : 型安全性レビュー（any / as キャスト・型推論）
                      ui-consistency   : UI 一貫性レビュー（ページ横断の見た目統一）
             scope-specific args: scope ごとの追加引数（feature 名・route 名・パッケージ名・"all" 等）
```

ショートカット例:
- `/review-feature --scope feature ads` — feature ads ドメインのレビュー
- `/review-feature --scope app ranking` — App Router の /ranking ルートレビュー
- `/review-feature --scope packages all` — 全パッケージ横断レビュー
- `/review-feature --scope types` — 型安全性のグローバルレビュー
- `/review-feature --scope ui-consistency` — UI 一貫性レビュー

## scope 別ガイドの参照

`--scope` 値に応じて `.claude/skills/dev/review-feature/scopes/<name>.md` を読み、その手順に従ってレビューを実行する:

| --scope 値 | 参照ファイル | 主なパネリスト数 | 対象 |
|---|---|---|---|
| `feature` | `scopes/feature.md` | 6 + ドメイン固有 | apps/web/src/features/* |
| `app` | `scopes/app.md` | 7 | apps/web/src/app/* |
| `packages` | `scopes/packages.md` | 8 | packages/* |
| `types` | `scopes/types.md` | — (静的解析中心) | プロジェクト全体 |
| `ui-consistency` | `scopes/ui-consistency.md` | 7 | ページ横断 |

各 scope 別ガイドにはパネリストのキャラクター定義・関心領域・出力フォーマット・横断レビュー時の追加分析が含まれている。**dispatcher（本 SKILL.md）はメソドロジーを定義しない**。各 scope ファイルの内容に従うこと。

## 共通ルール（全 scope で守る）

### パネルレビューの原則

- 全員が同じ結論を出してはならない。意見の対立・矛盾を恐れない
- 褒めるだけのパネリストを作ってはならない。**全員が最低 1 つ批判する**
- パネリストのキャラクターを維持する（SEO 専門家がアクセシビリティを語る等は NG）
- **コードを実際に読んでからレビューする**。推測でレビューしない

### 出力先（GitHub Issue）

すべてのレビューは GitHub Issue に出力する。`dev-review` ラベルを付与する。

```bash
# 本文を /tmp/review-body.md に書き出し後:
gh issue create \
  --title "[Dev Review] {scope}:{target} / YYYY-MM-DD" \
  --label "dev-review" \
  --body-file /tmp/review-body.md
```

タイトル例:
- `[Dev Review] feature:ads / 2026-05-04`
- `[Dev Review] app:ranking / 2026-05-04`
- `[Dev Review] packages:all / 2026-05-04`
- `[Dev Review] types / 2026-05-04`
- `[Dev Review] ui-consistency / 2026-05-04`

過去のレビューは `gh issue list --label dev-review --state all` で参照できる。

### 出力フォーマット（共通骨格）

各 scope ガイドが指定する詳細フォーマットに従いつつ、最低限以下のセクションを含める:

```
## {Scope名} レビュー: {対象}

対象: {パス・規模}

---

### {パネリスト1}
（2〜4文。語り口に沿って）

### {パネリスト2}
（2〜4文）

... （scope に応じた人数分）

---

## パネル総括

### 致命的な問題（すぐ直すべき）
- ...

### 改善提案（優先度順）
1. ...（想定工数: S/M/L）
2. ...

### 良い点（維持すべき）
- ...

### 次のアクション
- [ ] ...
```

横断レビュー（all 指定）の場合、scope ファイルが指示するクロスカット分析セクションを追加する。

## 関連スキル

- `/review-tests` — テスト網羅性の確認・追加（独立スキル。本スキルとは別系統で使う）
- `/run-tests` — テスト実行
- `/security-review` — セキュリティ専門レビュー

## 注意

- **review-tests は本スキルから独立**。テスト確認は `/review-tests` を使う
- 過去には scope ごとに別スキル（review-app, review-packages, review-types, review-ui-consistency, review-ads）が存在したが、`--scope` 引数化で本スキルに統合済み
