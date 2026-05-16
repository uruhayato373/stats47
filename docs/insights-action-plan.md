# Claude Code インサイト アクションプラン

> 生成日: 2026-05-15 / 分析期間: 2026-04-26〜2026-05-14 / 90セッション・177時間

---

## 課題（What's Hindering）

### 1. 誤診断のループ
- Claude が誤った原因に固執し、複数回の失敗修正を繰り返す
- 特に UI/レイアウト修正・デプロイ失敗時に顕著
- ユーザーが明示的に指摘するまで方向転換しないケースが多い

### 2. 環境起因の中断（事前チェック不足）
- 期限切れ Cloudflare API トークン
- CDN パージ権限の欠如
- Workers バンドルに credentials が焼き込まれる問題
- DB スキーマのドリフト（テーブル名の変更に追従できない）

### 3. Git 操作ミス
- feature ブランチではなく develop/main に直接コミット（2件確認）
- 生成アセット（PNG 大量）や機密ファイルを誤って staging

### 4. Issue 記録漏れ
- タスク完了後に GitHub Issue へのアウトカム記録を忘れる
- ユーザーが「Issue に記録した？」と確認しないと抜ける

### 5. UI 修正の反復失敗
- スクロールバー・Gantt チャート・サムネイルクロップなど視覚的修正で3回以上失敗
- 仮説を立てず次の修正を試みるサイクルに陥る

---

## やるべきこと（Quick Wins & Action Items）

### 即実施（CLAUDE.md 追記）

```markdown
## Git ワークフロー
- コミット前に必ず現在のブランチを確認。feature/* 以外へは直接コミットしない
- staging 前に `git status` で生成アセット（*.png, *.pdf）が含まれていないか確認
- .gitignore カバレッジを先に確認してからステージング

## データベース操作
- DB クエリ実行前に必ずスキーマ（テーブル名・カラム名）を先にインスペクト
- テーブル名はプロジェクトで頻繁に変更されるため推測禁止

## Issue 追跡
- 作業完了時は関連 GitHub Issue に必ずアウトカムを記録してから終了

## デプロイ前チェックリスト
1. Cloudflare API トークンの有効期限確認
2. CDN パージ権限の確認
3. R2/S3 credentials がランタイム env binding であること（ビルド時焼き込みでないこと）
4. `npm run build` + 型チェック通過確認

## UI 修正ルール
- 修正が一度失敗したら次を試みる前に必ず根本原因を再調査
- 仮説・検証方法・期待結果を明示してから修正コードを書く
```

---

### 短期実施（1〜2週間）

#### Hooks 設定（commit 前自動チェック）
`.claude/settings.json` に追加:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "command": "git branch --show-current | grep -E '^feature/' || (echo 'ERROR: not on feature branch' && exit 1)"
    }]
  }
}
```

#### MCP サーバー追加（DB スキーマ自動認識）
```bash
claude mcp add d1 -- npx -y @cloudflare/mcp-server-d1
```
→ D1 クエリ前にスキーマを自動インスペクトして table 名ミスを排除

#### `safe-commit` スキル作成
`.claude/skills/dev/safe-commit/SKILL.md`:
- 現在ブランチが feature/* であることを確認
- `git status` を表示して生成アセット除外を確認
- commit & push を実行

---

### 中期実施（〜1ヶ月）

#### 自己検証デプロイパイプライン
`safe-deploy` スキルの構築:
1. ビルド + 型チェック
2. デプロイ実行
3. 本番 URL に WebFetch でスモークテスト（5 URL × HTTP 200 確認）
4. 失敗時: 原因自動診断 → 修正再デプロイ or ロールバック

#### discover-trends スキル強化
- フェーズ開始前にスキーマ検証ステップを追加
- 各フェーズの進捗をファイルにチェックポイント保存（中断→再開対応）

---

### 将来構想（On the Horizon）

#### トレンド→公開 全自動コンテンツファクトリー
```
discover-trends → 並列エージェント（記事執筆・校正・SNS素材生成・スケジュール）
→ PR 作成 → ユーザーは最終キューのみレビュー
```

#### スキーマ認識型 DB エージェント
- 常にライブスキーマをインスペクトしてキャッシュ
- クエリ実行前に table/column 名を自動バリデーション・自動修正

---

## 優先度マトリクス

| アクション | 効果 | 工数 | 優先度 |
|---|---|---|---|
| CLAUDE.md に Git/DB/UI ルール追記 | 高 | 低 | ★★★ 今すぐ |
| Hooks でブランチチェック自動化 | 高 | 低 | ★★★ 今すぐ |
| MCP D1 サーバー追加 | 高 | 低 | ★★★ 今すぐ |
| safe-commit スキル作成 | 中 | 低 | ★★ 今週中 |
| safe-deploy スキル作成 | 高 | 中 | ★★ 今週中 |
| discover-trends チェックポイント化 | 中 | 中 | ★ 来週 |
| 全自動コンテンツファクトリー | 高 | 高 | △ 将来 |
