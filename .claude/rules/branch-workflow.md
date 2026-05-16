# ブランチ運用ルール

## フロー

```
feature/* ──(直 merge)──▶ develop ──(PR + CI)──▶ main（デプロイ）
```

PR は **develop → main の 1 段階のみ**。feature/* → develop は直 merge で可 (個人開発、self-review 前提)。

## ルール

- **feature/***: 機能ブランチ。develop から分岐し、ローカルで `git merge --no-ff feature/<name>` で develop に取り込む。マージ後は削除。PR は不要 (作っても良い、ただし CI は走らない)
- **develop**: 統合ブランチ。feature/* からの直 merge を受ける。`git push origin develop` で remote に反映。**develop 直接 commit は推奨されないが禁止ではない** (短い chore は許容)
- **main**: 本番デプロイブランチ。**develop → main の PR 経由でのみ更新**。`gh pr create --base main --head develop` で CI (`.github/workflows/pr-quality-check.yml`) を発火 → green を確認してマージ → Cloudflare Pages 自動デプロイ
- main への直接コミット / push / force push は禁止

## なぜ PR を develop → main にだけ置くか

- `pr-quality-check.yml` の trigger は `pull_request: branches: [main]` のため、CI は **main PR でしか発火しない**
- feature/* → develop の PR は self-merge + CI 無し → 価値がない (オーバーヘッドだけ)
- develop → main の PR を「本番デプロイの最終ゲート」に集約することで、CI green + 履歴境界 + ロールバック単位の 3 つを 1 箇所で確保

## デプロイ

- `/deploy` スキルで実行
- フロー: feature/* で作業 → ローカルで develop に merge → `git push origin develop` → `gh pr create --base main --head develop` → CI green → マージ → main 自動デプロイ → 必要なら `/purge-cdn`

## DB データ反映フロー

**リモート D1 は 2026-04-29 に解約済み（D1 残数 = 0）。** 本番は R2 スナップショット配信のみ。

```
ローカル D1（source of truth）──/sync-snapshots──▶ R2 snapshot──▶ 本番配信
```

- データ変更後は `/sync-snapshots` で R2 スナップショットを再生成・push する
- ranking-values（~30K files）の更新は時間がかかるため `SKIP_VALUES=1` で他のみ更新し、必要な場合のみフル実行
- ロールバックは R2 の旧 snapshot ファイルへの上書き push で対応
