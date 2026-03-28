変更を main に push してデプロイする。

## 前提

- 変更がすべてコミット済みであること

## ブランチ判定

現在のブランチに応じて手順が異なる:

- **`main` にいる場合** → Step 2 の後、直接 `git push origin main` → develop 同期
- **`develop` にいる場合** → Step 2 の後、main へマージ → push → develop 同期
- **feature ブランチにいる場合** → 従来の feature → develop → main フロー

## 手順

### Step 1: 事前チェック

```bash
git branch --show-current
git status
```

- 未コミットの変更がある場合 → ユーザーに確認して中止
- 現在のブランチ名を `$CURRENT_BRANCH` として記憶する

### Step 2: テスト・型チェック・ビルド

以下を**順番に**実行する。いずれかが失敗した場合はユーザーに報告し、続行するか確認する。

```bash
# 1. 型チェック
npm run type-check

# 2. ユニットテスト
npm run test:run -w apps/web

# 3. ビルド確認
npm run build -w apps/web
```

全パスしたら Step 3 へ進む。

### Step 3: develop へマージ

```bash
git checkout develop
git pull origin develop
git merge $FEATURE_BRANCH
```

- **コンフリクトが発生した場合** → ユーザーに報告し、解決方法を相談する。自動解決しない。
- **マージ成功** → push する。

```bash
git push origin develop
```

### Step 4: main へマージ

```bash
git checkout main
git pull origin main
git merge develop
```

- **コンフリクトが発生した場合** → ユーザーに報告し、解決方法を相談する。
- **マージ成功** → push する。

```bash
git push origin main
```

### Step 5: develop を同期し、元のブランチに戻る

```bash
git checkout develop
git pull origin develop
git merge main
git push origin develop
git checkout $CURRENT_BRANCH
```

### Step 6: 完了報告

以下を報告する:

- マージしたブランチ名
- テスト・型チェック・ビルドの結果サマリ
- develop, main それぞれの push 結果
- エラーがあった場合はその内容

## エラー時の方針

- テスト/型チェック/ビルドの失敗 → ユーザーに確認し、続行 or 中止を判断
- マージコンフリクト → **自動解決しない**。ユーザーに状況を報告し指示を仰ぐ
- push 失敗 → ユーザーに報告し、リトライ or 手動対応を相談
- いかなる場合も `--force` は使用しない
