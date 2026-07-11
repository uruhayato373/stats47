# docs/handoffs/ — セッション引き継ぎ（抽出→削除の一方向・貯めない）

大きな作業セッションの終わりに、次のセッション（別エージェント・別 PC・クラウド含む）へ文脈を渡すためのハンドオフを置く。**恒久保存場所ではない**。

## 命名・書式

- ファイル名: `YYYY-MM-DD-<topic>.md`（例 `2026-07-10-note-cover-redesign.md`）
- frontmatter: `type: session-handoff` / `date:` / `status: active | consumed` を付与（Obsidian 絞り込み用）
- 構成の目安: 背景 → やったこと（commit/PR 付き） → 検証状態 → 残タスク → 次セッションへの注意

## ライフサイクル（一方向）

```
セッション終わりに書く
  → 次セッションが読んで作業を継続
  → 消化したら【抽出】:
      残タスク       → docs/todo/inbox.md（または各バックログ）
      恒常的な知見   → .claude/memory/
      手順・規約     → .claude/rules/ または docs/01_技術設計/
  → 本体を git rm（記録は git 履歴が保持）
```

## ルール

- **削除の前に外部実体を検証する**: PR がマージ済みか・デプロイされたか・ファイルが実在するか。未確認のハンドオフは削除しない。
- **貯めない**: 2 週間以上残っているものは週次レビュー時に triage 対象（抽出→削除 or status 更新）。
- アーカイブディレクトリは作らない。復元は git 履歴 (`git log --diff-filter=D -- docs/handoffs/`) から。
