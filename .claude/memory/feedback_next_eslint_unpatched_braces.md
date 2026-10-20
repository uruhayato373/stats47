---
name: next_eslint_unpatched_braces
description: Next ESLint経由の未修正bracesを限定overrideで除去し、ページ検出と監査で検証する
type: feedback
---

**問題**: Next.jsの開発用依存でaudit highが5件出た（2026-10-20）。

**原因**: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` の1経路に、bracesの再帰AST処理の脆弱性が波及した。braces 3.0.3までが対象で修正版は未公開。公式最新版のNext ESLint 16.4.2もfast-glob 3.3.1を使う。auditが提案する14.2.35への降格ではESLint 9の互換性が失われる。

**対策**: root package.jsonのoverrideをNext ESLintに限定し、fast-globを `.claude/scripts/lib/next-eslint-glob/` へ接続する。既存採用済みのtinyglobby 0.2.17を使うが、直接aliasにはしない。直接aliasを試すと絶対パスが相対パスに変わり、指定フォルダーの下も展開され、ページ検出のテスト5件が失敗した。互換処理でこの既定差を解消する。16.3.3の実装で使うAPIは `globSync(pattern, { onlyDirectories: true })` のみで、未対応の呼び方は拒否する。互換性は `apps/web/src/__tests__/eslint-dependency-compatibility.test.ts` で実際のページ検出・内部リンク違反の検出・深いパターンを検査する。依存更新時は同テストとlint・auditを通す。公式側で経路が解消されたらoverrideの必要性を再評価する。

単なるpackage-lock-only installではnpm 10.9.2が旧経路を保持した。`npm update fast-glob --package-lock-only --ignore-scripts` で限定再解決し、クリーンな `npm ci` と `npm audit` で実体とlockを検証する。共有node_modulesを使うworktreeでは、rootだけでなく各workspaceのjunctionも確認し、共有先を削除せずリンクだけを外してから専用依存を導入する。

検証用のクリーンinstallでは、既存lockにWindows x64のRolldown optional bindingが欠けていてVitestが起動できなかった。親のrolldown 1.2.5が宣言する同じ版について、npmが生成したresolved/integrity/OS/CPUの記録を復元した。検査のために別バージョンのネイティブ実体を混ぜない。

**証拠**: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)、`npm view braces version`、`npm view @next/eslint-plugin-next@16.4.2 dependencies`、root package.json / package-lock.json。判断規律は `.claude/rules/local-environment.md` の依存更新排他に従う。
