---
name: r2-du
description: リモート R2 のディレクトリ別容量を調査する（du 相当）。Use when user says "R2容量", "R2サイズ", "r2-du". プレフィックス・集計レベル指定可能.
disable-model-invocation: true
---

リモート R2 のディレクトリ別容量を調査する（du 相当）。

## 概要

`listFromR2WithSize` で全オブジェクトのサイズを取得し、ディレクトリ別に集計・表示する。
容量が多いディレクトリの特定や、不要データの整理判断に使う。

## 手順

1. ユーザーの要件を確認:
   - 全体調査 or 特定プレフィックスに絞るか
   - 集計レベル（トップのみ / 2階層 / ファイル個別）
2. 以下のコマンドを実行:

```bash
# トップレベルディレクトリ別（デフォルト）
npx tsx packages/r2-storage/src/scripts/r2-du.ts

# 特定プレフィックスに絞る
npx tsx packages/r2-storage/src/scripts/r2-du.ts --prefix blog

# 2階層まで集計
npx tsx packages/r2-storage/src/scripts/r2-du.ts --depth 2

# ファイル個別をサイズ降順で表示
npx tsx packages/r2-storage/src/scripts/r2-du.ts --files

# 組み合わせ例: blog/ 配下をファイル個別表示
npx tsx packages/r2-storage/src/scripts/r2-du.ts --prefix blog --files
```

3. 結果をユーザーに報告し、必要なら削除（`/push-r2` や `delete-r2-prefix.ts`）を案内する

## オプション一覧

| オプション | 説明 |
|---|---|
| `--prefix <prefix>` | 指定プレフィックス配下のみ集計 |
| `--depth <n>` | ディレクトリ集計の階層数（デフォルト: 1） |
| `--files` | ディレクトリ集計ではなくファイル個別をサイズ降順で表示 |

## 参照

- `packages/r2-storage/src/scripts/r2-du.ts` — スクリプト本体
- `packages/r2-storage/src/scripts/delete-r2-prefix.ts` — 不要ディレクトリの一括削除
- `packages/r2-storage/src/scripts/README.md` — R2 スクリプト全般
