---
name: generate-ai-content
description: ランキングページ向け AI コンテンツ（FAQ・分析）を Gemini CLI で生成し DB 保存する。Use when user says "AIコンテンツ生成", "FAQ生成", "ランキング分析生成". Claude並列/Gemini逐次選択可.
disable-model-invocation: true
primary_agent: ranking-content-author
---

> ⚠️ **このスキルは現在 dead（実行不可）です。** 完全DBレス移行（commit `7569bd5c` "dbless Part D"）で
> ai-content の **生成 CLI（`generate-parallel.ts` / `save-content.ts` / `build-prompt.ts` / `generate-all.sh` /
> `list-pending.ts`）と D1→R2 exporter がすべて削除**された。下記の手順・スクリプトは**もう存在しない**。
> D1 `ai_content` テーブルも廃止。R2 `app/ranking/<key>/ai-content.json` は移行前に焼かれた**凍結データ**で、
> 現状これを生成・再生成する手段は無い。
>
> **要・再構築**（DBレス版: R2 観測値 `app/stats` + ranking item.json → prompt → AI → 決定的ゲート
> `audit-ai-content.mjs` → R2 `app/ranking/<key>/ai-content.json` 直書き）。担当 `ranking-content-author`。
> backlog: `docs/02_実装計画/04_機能バックログ.md` `[AICONTENT-DBLESS-REBUILD]`。
> **以下は再構築時の参考として残す歴史的記述（そのまま実行しない）。**

ランキングページ向け AI コンテンツ（FAQ、地域分析、インサイト）を生成し、DB に保存する。

Claude（並列・高速）と Gemini（逐次・デフォルト）を選択可能。

## データソース

- ランキングデータ: ローカル D1 に直接アクセス（admin サーバー不要）
- 生成結果の保存先: `ai_content` テーブル（`faq`, `regional_analysis`, `insights` カラム）

## クイックスタート

> **重要**: `generate-parallel.ts` は **Claude Code の外（ユーザーの端末）で実行すること**。
> Claude Code の Bash ツール内では stdin が ~3KB 以上の場合に詰まる制限があるため、
> claude CLI サブプロセスが正常動作しない。

### 推奨: Claude 並列処理（高速） - ユーザーの端末で実行

```bash
cd /Users/minamidaisuke/stats47

# 未生成を全件 Claude で並列生成（concurrency=5）
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-parallel.ts \
  --model claude --concurrency 5 \
  >> /tmp/ai-content-parallel.log 2>&1 &

# 進捗確認
tail -f /tmp/ai-content-parallel.log
```

オプション:
```bash
# 最初の100件のみ（テスト）
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-parallel.ts \
  --model claude --concurrency 5 --limit 100

# 10並列で一括処理
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-parallel.ts \
  --model claude --concurrency 10
```

### Gemini 逐次処理（旧来） - クォータ注意

```bash
# ※ Gemini は無料クォータ制限あり。大量処理時はクォータ枯渇に注意
bash packages/ai-content/src/scripts/generate-all.sh --model gemini --sequential
```

## generate-parallel.ts オプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `--model` | `claude` | `claude` または `gemini` |
| `--concurrency` | `5` | 並列数 |
| `--limit N` | 全件 | 処理件数上限（テスト時に使用） |
| `--force` | false | 既存レコードも再生成 |

## generate-all.sh オプション

| オプション | 説明 |
|---|---|
| `--model claude\|gemini` | AI モデル選択（default: claude） |
| `--concurrency N` | 並列数（default: 5） |
| `--limit N` | 処理件数上限 |
| `--force` | 既存レコードも再生成 |
| `--dry-run` | 対象一覧のみ表示 |
| `--sequential` | 逐次処理（旧来の Gemini 動作） |

## 速度比較

| モード | 1件あたり | 1,250件目安 |
|---|---|---|
| Gemini 逐次（旧来） | ~20s | ~7時間 |
| Claude 並列 concurrency=5 | 実効 ~1.5s | ~30分 |
| Claude 並列 concurrency=10 | 実効 ~0.8s | ~17分 |

## 件数確認

```bash
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/list-pending.ts 2>/dev/null | \
  grep -E '"total"|"pending"'
```

## 手動で1件処理する場合

```bash
# プロンプト確認
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/build-prompt.ts --key <rankingKey>

# Claude で生成
echo "$(cat /tmp/ai-content-prompt-<key>.txt)" | \
  claude -p "" --output-format text > /tmp/ai-content-output-<key>.json

# DB 保存
cat /tmp/ai-content-output-<key>.json | \
  NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/save-content.ts \
  --key <rankingKey> --year <yearCode> --model claude
```

## エラーハンドリング

- CLI エラー: `generate-parallel.ts` は自動スキップして次へ進む
- JSON パースエラー: 同上
- 進捗は 50 件ごとに `--- Progress: N/M ---` で表示

## 参照

- 並列スクリプト: `packages/ai-content/src/scripts/generate-parallel.ts`
- 旧スクリプト: `packages/ai-content/src/scripts/generate-all.sh`
- プロンプトテンプレート: `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`
- 型定義: `packages/ai-content/src/types/index.ts`
