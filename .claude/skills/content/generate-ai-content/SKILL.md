ランキングページ向け AI コンテンツ（FAQ、地域分析、インサイト）を Gemini CLI で生成し、DB に保存する。

## データソース

- ランキングデータ: ローカル D1 に直接アクセス（admin サーバー不要）
- 生成結果の保存先: `ranking_ai_content` テーブル（`faq`, `regional_analysis`, `insights` カラム）

## 手順

### 1. 対象一覧を取得

```bash
NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/list-pending.ts
```

出力例:
```json
{
  "total": 42,
  "pending": 5,
  "items": [
    { "rankingKey": "A1101", "rankingName": "人口総数", "unit": "人", "yearCode": "2023" }
  ]
}
```

`pending` が 0 の場合はすべて生成済みなので終了。

### 2. 対象件数をユーザーに報告し、実行確認を取る

### 3. 各ランキングに対してループ

**a. プロンプトを取得する**

```bash
NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/build-prompt.ts --key <rankingKey>
```

出力の `prompt` フィールドにプロンプト全文が入っている。

**b. Gemini CLI でコンテンツを生成する**

1. `build-prompt.ts` 出力の `prompt` フィールドを `/tmp` ファイルに保存（シェルエスケープ回避のため Write ツールを使用）:

```bash
# Write ツールで /tmp/ai-content-prompt-<rankingKey>.txt に保存
```

2. Gemini CLI で生成:

```bash
cat /tmp/ai-content-prompt-<rankingKey>.txt | gemini -p "" -o text \
  > /tmp/ai-content-output-<rankingKey>.json
```

注意:
- `-o text` を指定する（デフォルトの StreamJSON ではなくプレーンテキストで出力するため）
- コードフェンス（` ```json ... ``` `）で囲まれる場合があるが、`save-content.ts` 側で自動除去する
- Gemini CLI は stdin からプロンプトを受け取り、`-p` で非対話モードで実行する

**c. DB に保存する**

```bash
cat /tmp/ai-content-output-<rankingKey>.json | \
  NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/save-content.ts \
  --key <rankingKey> --year <yearCode>
```

`yearCode` は手順 a の `build-prompt.ts` の出力から取得する。

`--model` オプション（default: `gemini`）で AI モデル名を変更可能:
```bash
cat ... | npx tsx ... save-content.ts --key <key> --year <year> --model gemini
```

### 4. 全件の結果を報告

- 生成成功: N 件
- スキップ: N 件（対象なし）
- 失敗: N 件（JSON パースエラー等）

## オプション

**特定のランキングのみ処理する**

手順 3 で対象キーを指定する（`list-pending.ts` の出力から選択）。

**全件強制再生成（既存レコードがあっても再生成）**

```bash
NODE_ENV=development NODE_OPTIONS='--conditions react-server' npx tsx packages/ai-content/src/scripts/list-pending.ts --force
```

## エラーハンドリング

- Gemini CLI がエラーを返した場合: stderr を確認し、リトライする
- JSON パースエラー（`save-content.ts` が失敗）: `/tmp/ai-content-output-<rankingKey>.json` の中身を確認し、Gemini CLI を再実行する
- Gemini CLI がコードフェンスで囲んだ JSON を返した場合: `save-content.ts` が自動的にコードフェンスを除去するため、そのまま渡してよい

## 注意

- プロンプトが長い（約 2,000 字）ため、`build-prompt.ts` の `prompt` フィールドをそのまま使うこと
- プロンプトは必ずファイル経由で渡し、stdin 経由で Gemini CLI に渡す（シェルエスケープの問題を避けるため）
- 生成 JSON は `/tmp/ai-content-output-<rankingKey>.json` に保存してから `save-content.ts` に渡す

## 参照

- スクリプト: `packages/ai-content/src/scripts/`
- プロンプトテンプレート: `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`
- 型定義: `packages/ai-content/src/types/index.ts`
