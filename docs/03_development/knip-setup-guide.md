# Knip導入ガイド

作成日: 2025-10-28

---

## 目次

1. [Knipとは](#knipとは)
2. [導入の目的とメリット](#導入の目的とメリット)
3. [インストール手順](#インストール手順)
4. [設定ファイルの作成](#設定ファイルの作成)
5. [実行方法](#実行方法)
6. [結果の分析と対処](#結果の分析と対処)
7. [CI/CDへの統合](#cicdへの統合)
8. [よくある問題と対処法](#よくある問題と対処法)
9. [定期的なメンテナンス](#定期的なメンテナンス)

---

## Knipとは

**Knip** (ナイフ) は、JavaScriptとTypeScriptプロジェクトから不要なコードを検出・削除するための強力なプロジェクトリンターです。

### 検出できるもの

- **未使用のファイル**: プロジェクト内で参照されていないファイル
- **未使用のエクスポート**: exportされているが、どこからもインポートされていない関数・変数・型
- **未使用の依存関係**: package.jsonに記載されているが使用されていないパッケージ
- **未使用のdevDependencies**: 開発用パッケージの不要なもの
- **循環依存**: モジュール間の循環参照
- **型エラー**: TypeScriptの型に関する問題

### 公式サイト

- ドキュメント: https://knip.dev/
- GitHub: https://github.com/webpro/knip
- npm: https://www.npmjs.com/package/knip

---

## 導入の目的とメリット

### このプロジェクトでの期待効果

1. **コードベースのクリーンアップ**
   - 356個のソースファイルから未使用コードを検出
   - features/配下の8つのドメインの整理

2. **依存関係の最適化**
   - 83個のdependencies/devDependenciesを精査
   - バンドルサイズの削減

3. **保守性の向上**
   - デッドコードの除去
   - コードレビューの効率化

4. **開発体験の改善**
   - ビルド時間の短縮
   - IDE のパフォーマンス向上

---

## インストール手順

### 1. Knipのインストール

```bash
npm install --save-dev knip
```

### 2. インストールの確認

```bash
npx knip --version
```

最新バージョン（2025年現在: v5.x系）が表示されればOKです。

---

## 設定ファイルの作成

### 1. 基本設定ファイルの作成

プロジェクトルートに `knip.json` を作成します。

```bash
touch knip.json
```

### 2. このプロジェクト用の推奨設定

以下の内容を `knip.json` に記述してください：

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/app/**/{error,layout,loading,not-found,page,template,route}.{js,jsx,ts,tsx}!",
    "src/middleware.ts",
    "src/instrumentation.ts",
    "scripts/**/*.{js,ts}",
    ".storybook/**/*.{ts,tsx}"
  ],
  "project": [
    "src/**/*.{js,jsx,ts,tsx}",
    "scripts/**/*.{js,ts}",
    ".storybook/**/*.{ts,tsx}"
  ],
  "ignore": [
    "**/__tests__/**",
    "**/__debug__/**",
    "**/*.test.{ts,tsx}",
    "**/*.stories.{ts,tsx}",
    "database/**",
    "data/**",
    ".next/**",
    ".wrangler/**",
    "storybook-static/**",
    "coverage/**"
  ],
  "ignoreDependencies": [
    "@types/*"
  ],
  "ignoreExportsUsedInFile": true,
  "ignoreWorkspaces": [],
  "ignoreBinaries": [
    "wrangler",
    "tsx"
  ],
  "next": {
    "entry": [
      "next.config.ts"
    ]
  },
  "vitest": {
    "entry": [
      "vitest.config.ts",
      "src/**/*.test.{ts,tsx}",
      ".storybook/vitest.setup.ts"
    ]
  },
  "storybook": {
    "entry": [
      ".storybook/main.ts",
      ".storybook/preview.tsx",
      "src/**/*.stories.{ts,tsx}"
    ]
  },
  "eslint": {
    "entry": [
      "eslint.config.mjs"
    ]
  },
  "tailwind": {
    "entry": [
      "tailwind.config.ts"
    ]
  }
}
```

### 3. 設定の説明

#### entry

プロジェクトのエントリーポイントを定義します。これらのファイルから依存関係を追跡します。

- **Next.js App Router**: `src/app/**/*.tsx`
- **Middleware**: `src/middleware.ts`
- **Scripts**: `scripts/**/*.ts`
- **Storybook**: `.storybook/**/*.ts`

#### project

Knipが分析対象とするファイルのパターンです。

#### ignore

分析から除外するファイル・ディレクトリ：

- **テストファイル**: `**/*.test.{ts,tsx}`
- **デバッグファイル**: `**/__debug__/**`
- **Storybookファイル**: `**/*.stories.{ts,tsx}`
- **ビルド成果物**: `.next/`, `.wrangler/`
- **データファイル**: `database/`, `data/`

#### ignoreDependencies

チェックから除外する依存関係：

- **型定義パッケージ**: `@types/*` （TypeScriptの型定義は実行時に不要だが保持する）

#### ignoreExportsUsedInFile

同じファイル内でのみ使用されるエクスポートを警告しないようにします。

#### ignoreBinaries

CLIツールとして使用するパッケージを除外：

- `wrangler`: Cloudflare Workers CLI
- `tsx`: TypeScript実行ツール

#### プラグイン固有設定

- **next**: Next.js設定ファイル
- **vitest**: テスト設定とテストファイル
- **storybook**: Storybook設定とストーリーファイル
- **eslint**: ESLint設定
- **tailwind**: Tailwind CSS設定

---

## 実行方法

### 1. 初回実行（ドライラン）

まず、変更を加えずに検出のみを行います：

```bash
npx knip
```

### 2. レポート形式での実行

より詳細な出力を得るには：

```bash
npx knip --reporter json > knip-report.json
```

### 3. 特定のタイプのみをチェック

```bash
# 未使用のファイルのみ
npx knip --include files

# 未使用のエクスポートのみ
npx knip --include exports

# 未使用の依存関係のみ
npx knip --include dependencies
```

### 4. package.jsonにスクリプトを追加

便利なスクリプトを追加します：

```json
{
  "scripts": {
    "knip": "knip",
    "knip:report": "knip --reporter json > knip-report.json",
    "knip:files": "knip --include files",
    "knip:exports": "knip --include exports",
    "knip:deps": "knip --include dependencies",
    "knip:production": "knip --production"
  }
}
```

追加後、以下のように実行できます：

```bash
npm run knip
npm run knip:report
```

---

## 結果の分析と対処

### 1. 結果の見方

Knipの出力例：

```
Unused files (3)
  src/lib/old-utils.ts
  src/components/atoms/OldButton.tsx
  src/features/deprecated/index.ts

Unused exports (12)
  calculateTotal  src/lib/math.ts:42
  formatDate      src/lib/date.ts:18
  UserIcon        src/components/atoms/Icons.tsx:25

Unused dependencies (5)
  lodash
  moment
  @testing-library/react

Unlisted dependencies (2)
  zod (used in src/lib/validators.ts)
  uuid (used in src/lib/id-generator.ts)
```

### 2. 対処方法

#### A. 未使用ファイル（Unused files）

**確認事項：**
1. 本当に不要か？
2. 将来使う予定はあるか？
3. ドキュメントやサンプルコードとして保持すべきか？

**対処：**
```bash
# 不要なファイルを削除
git rm src/lib/old-utils.ts

# または、保持したい場合は knip.json に追加
"ignore": [
  "src/lib/old-utils.ts"
]
```

#### B. 未使用エクスポート（Unused exports）

**確認事項：**
1. パブリックAPIとして提供する必要があるか？
2. テストでのみ使用されているか？
3. 外部パッケージから参照される可能性はあるか？

**対処：**
```typescript
// 1. エクスポートを削除
// Before
export function calculateTotal(items: Item[]) { ... }

// After（内部関数化）
function calculateTotal(items: Item[]) { ... }

// 2. または、意図的にエクスポートする場合はコメントで明示
/**
 * Public API - do not remove
 * @public
 */
export function calculateTotal(items: Item[]) { ... }
```

#### C. 未使用依存関係（Unused dependencies）

**確認事項：**
1. 本当に使用されていないか？
2. 型定義のみで使用されているか？
3. CLIツールとして使用されているか？

**対処：**
```bash
# 完全に不要な場合は削除
npm uninstall lodash moment

# 型定義のみの場合は devDependencies に移動
npm uninstall @types/react
npm install --save-dev @types/react

# CLIツールの場合は ignoreBinaries に追加
# knip.json
"ignoreBinaries": ["wrangler", "tsx"]
```

#### D. 未登録の依存関係（Unlisted dependencies）

**対処：**
```bash
# package.json に追加
npm install zod uuid
```

### 3. 段階的なクリーンアップ計画

#### フェーズ 1: 明らかな不要物の削除（1週間）

```bash
# 1. 未使用の依存関係を削除
npm run knip:deps

# 2. 明らかに不要なファイルを削除
npm run knip:files
```

#### フェーズ 2: エクスポートの整理（2週間）

```bash
# 1. 未使用エクスポートをチェック
npm run knip:exports

# 2. 各ファイルを確認し、不要なものを削除
```

#### フェーズ 3: 継続的なメンテナンス

```bash
# 定期的に実行（週1回）
npm run knip
```

---

## CI/CDへの統合

### GitHub Actions ワークフロー

`.github/workflows/knip.yml` を作成：

```yaml
name: Knip Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  knip:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Knip
        run: npm run knip
        continue-on-error: true

      - name: Generate Knip report
        run: npm run knip:report

      - name: Upload Knip report
        uses: actions/upload-artifact@v4
        with:
          name: knip-report
          path: knip-report.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('knip-report.json', 'utf8'));

            const body = `
            ## 🔪 Knip Analysis Results

            - Unused files: ${report.files?.length || 0}
            - Unused exports: ${report.exports?.length || 0}
            - Unused dependencies: ${report.dependencies?.length || 0}

            <details>
            <summary>View full report</summary>

            \`\`\`json
            ${JSON.stringify(report, null, 2)}
            \`\`\`

            </details>
            `;

            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body
            });
```

### Pre-commit フック

`.husky/pre-commit` に追加：

```bash
#!/bin/sh

# Knip check (warning only)
npm run knip || echo "⚠️  Knip found unused code. Please review."
```

---

## よくある問題と対処法

### 1. 大量の未使用エクスポートが検出される

**原因：**
- Atomic Designなどでコンポーネントを細かく分割している
- 型定義を共有している

**対処：**
```json
// knip.json
{
  "ignoreExportsUsedInFile": true,
  "ignore": [
    "src/components/atoms/**",
    "src/types/**"
  ]
}
```

### 2. Next.js App Routerのファイルが未使用と判定される

**原因：**
- Next.jsの規約ベースルーティングが認識されていない

**対処：**
```json
// knip.json
{
  "entry": [
    "src/app/**/{page,layout,loading,error,not-found,route}.{ts,tsx}!"
  ]
}
```

末尾の `!` はネゲーションパターンです。

### 3. Dynamic Importが未使用と判定される

**原因：**
- 動的インポート（`import()`）が検出されない

**対処：**
```json
// knip.json
{
  "entry": [
    "src/components/**/index.ts"
  ]
}
```

または、該当ファイルを `ignore` に追加します。

### 4. Cloudflare Workersのバインディング型が未使用と判定される

**原因：**
- 環境変数の型定義が使用されていないと判定される

**対処：**
```json
// knip.json
{
  "ignore": [
    "src/types/env.d.ts"
  ]
}
```

### 5. テストファイルの依存関係が未使用と判定される

**原因：**
- テストファイルがエントリーポイントとして認識されていない

**対処：**
```json
// knip.json
{
  "vitest": {
    "entry": [
      "vitest.config.ts",
      "src/**/*.test.{ts,tsx}",
      ".storybook/vitest.setup.ts"
    ]
  }
}
```

### 6. Storybookの依存関係が未使用と判定される

**原因：**
- Storyファイルが認識されていない

**対処：**
```json
// knip.json
{
  "storybook": {
    "entry": [
      ".storybook/main.ts",
      ".storybook/preview.tsx",
      "src/**/*.stories.{ts,tsx}"
    ]
  }
}
```

---

## 定期的なメンテナンス

### 週次チェック（推奨）

```bash
# 毎週月曜日に実行
npm run knip
```

### 月次レポート（推奨）

```bash
# 月初に詳細レポートを生成
npm run knip:report

# レポートをチームで確認
cat knip-report.json | jq
```

### プルリクエスト前のチェック

```bash
# PRを作成する前に必ず実行
npm run knip

# 問題があれば修正してからコミット
```

---

## 参考リソース

### 公式ドキュメント

- **公式サイト**: https://knip.dev/
- **Next.jsプラグイン**: https://knip.dev/reference/plugins/next
- **設定リファレンス**: https://knip.dev/overview/configuration
- **プラグイン一覧**: https://knip.dev/explanations/plugins

### 関連記事

- Knip 公式ブログ: https://knip.dev/blog/state-of-knip
- Socket.dev: "Knip Hits 500 Releases" https://socket.dev/blog/knip-hits-500-releases

---

## まとめ

### Knip導入のメリット

1. **コードベースの健全性**: 未使用コードを定期的に検出・削除
2. **依存関係の最適化**: バンドルサイズの削減
3. **開発効率の向上**: メンテナンス負荷の軽減
4. **チーム開発の円滑化**: コードレビューの品質向上

### 導入ステップのまとめ

1. ✅ Knipのインストール: `npm install --save-dev knip`
2. ✅ 設定ファイルの作成: `knip.json`
3. ✅ 初回実行: `npx knip`
4. ✅ 結果の分析と対処
5. ✅ CI/CDへの統合
6. ✅ 定期的なメンテナンス

### 次のアクション

- [ ] Knipをインストール
- [ ] knip.jsonを作成
- [ ] 初回実行して結果を確認
- [ ] package.jsonにスクリプトを追加
- [ ] GitHub Actionsワークフローを作成
- [ ] 週次チェックのスケジュール設定

---

作成日: 2025-10-28
最終更新日: 2025-10-28
