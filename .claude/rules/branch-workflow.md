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

## データ反映フロー（完全DBレスが正典 → `docs/01_技術設計/19_完全DBレス設計.md`）

**本番は R2 スナップショット配信のみ。** SSOT は git TS と R2 の二つだけ。永続/リモート D1 は廃止。
オーサリング SSOT を生成スクリプトで R2 に直接反映する（D1 を経由しない）:

```
Authored/設定 (チャート定義等)        : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信
Authored/関係・運用 (page_components 等) : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信 (横断整合はビルド時に検証)
Reference (metrics/articles)          : git TS / article.md ──再生成──▶ R2 snapshot
Derived (area_profiles/相関)          : R2 観測値をエフェメラル計算 (:memory:/DuckDB) ──▶ R2 snapshot
```

- **クラウド/ローカルとも git TS 編集 + R2 直接反映で作業**（永続 D1 認証は不要 = クラウド完結）
- 設定の R2 反映の雛形: `apps/web/scripts/sync-theme-additions-to-r2.ts`（read-modify-write、冪等）
- R2 読みは公開 URL 経由で SSD/認証なしに可能: `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`
- ranking-values（~30K files）の更新は `SKIP_VALUES=1` で他のみ更新し、必要な場合のみフル実行
- ロールバックは R2 の旧 snapshot ファイルへの上書き push で対応
- 旧 `db:pull`/`db:push` / リモート D1 seed/export は廃止 (legacy)。手編集 JSON を SSOT にしない（git TS → 生成）
