---
name: maintain-docs
description: stats47のドキュメントを作成・移動・統合・削除・棚卸しするときに、SSOT配置、TODO具体化、陳腐化、重複、INDEX、リンクを監査する。Use when user says「ドキュメントを作成」「docsを整理」「文書を統合」「不要な設計書を削除」「陳腐化を確認」「/maintain-docs」。
primary_agent: knowledge-curator
---

# maintain-docs

文書の追加を既定にせず、既存SSOTへの統合を先に判定する。判断規則の正典は
`.claude/rules/docs-vs-issues.md`、決定的な許可パス・必須項目は
`.claude/config/docs-governance.json` とする。本文へ規則を複製しない。

## 実行

1. `.claude/rules/docs-vs-issues.md` を最後まで読む。
2. 変更前に `npm run docs:report` を実行し、現状のerror・warningを把握する。
3. 新規作成要求でも、既存SSOT、`.claude/todo/`、コード近傍README、skill/rule、
   state/referenceの順に統合先を探す。
4. レビュー・監査は全文を保存せず、恒久判断を既存SSOT、未完了策をTODOへ反映する。
5. 完了・撤退・superseded文書は参照元を更新して削除する。archiveは作らない。
6. `npm run docs:fix` で生成管理された実装計画INDEXを同期する。
7. `npm run docs:check` を通す。
8. `npm run docs:check:all` のwarningを意味レビューし、誤検知でなければ同じ変更で是正する。

Claude Codeでは`.claude/hooks/check-docs-on-stop.js`が文書差分のあるturnを自動検査する。
Codexを含む他の編集経路は共通`AGENTS.md`、pre-commit、PR gateで同じ契約を通る。

## TODOへ移す場合

- ID、優先度、status、owner、次の行動または実行順を付ける。
- 実行中の項目には完了条件を付ける。
- 外部公開、削除、課金、ASP操作などは停止条件・承認境界を付ける。
- 完了履歴や長い作業プロンプトを残さない。

## 自動修正の境界

`npm run docs:fix` が変更してよいのは生成マーカー内の実装計画INDEXだけ。
内容統合、frontmatterの日付更新、TODO完了判定、文書削除は証拠を確認して人またはagentが行う。
意味判断が必要な候補を自動削除しない。

## 完了条件

- `npm run docs:check` が成功する。
- 新規文書は既存SSOTへ統合できない理由を説明できる。
- 削除・移動後の参照切れが増えていない。
- warningを未確認のまま「整理完了」と報告しない。
