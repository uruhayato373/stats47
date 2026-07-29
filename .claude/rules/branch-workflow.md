# ブランチ運用ルール

## フロー

```
feature/* ──(直 merge)──▶ develop ──(PR + CI)──▶ main（デプロイ）
```

PR は **develop → main の 1 段階のみ**。feature/* → develop は直 merge で可 (個人開発、self-review 前提)。

## 実行環境による差分 (web / クラウド) ★

`gh` CLI と GitHub Actions の起動可否が環境で異なる。混同すると「dispatch できるはず」と誤認する (2026-06-02 発生)。

- **ローカル**: `gh` あり・任意ブランチ push 可・`gh workflow run` で dispatch 可。
- **Claude Code on the web / クラウド**: `gh` 無し・push 先制限あり・**連携トークンに `actions:write` が無く workflow dispatch 不可 (403)**。PR 操作は GitHub MCP ツールで行う。**R2 公開 (記事・広告) は workflow_dispatch ではなく push トリガーに委ねる** (`blog-auto-publish.yml` / `publish-affiliate-ads.yml` は develop への該当ファイル push で自動発火)。
- 詳細・判定表・データ公開経路は `.claude/skills/dev/deploy/SKILL.md` の「実行環境の判定」「データ公開」を参照。

> **データ公開は develop 経由**: `blog-auto-publish.yml` / `publish-affiliate-ads.yml` / `publish-blog.yml` は **develop を checkout** する。feature を main へ直接 squash しただけだと記事/広告が develop に乗らず公開されない。記事を含むデプロイは必ず develop を経由させる (feature → develop で公開発火 → develop → main の PR でコードデプロイ)。

## ルール

- **feature/***: 機能ブランチ。develop から分岐し、ローカルで `git merge --no-ff feature/<name>` で develop に取り込む。マージ後は削除。PR は不要 (作っても良い、ただし CI は走らない)
- **develop**: 統合ブランチ。feature/* からの直 merge を受ける。`git push origin develop` で remote に反映。**develop 直接 commit は推奨されないが禁止ではない** (短い chore は許容)
- **main**: 本番デプロイブランチ。**develop → main の PR 経由でのみ更新**。`gh pr create --base main --head develop` で CI (`.github/workflows/pr-quality-check.yml`) を発火 → green を確認してマージ → Cloudflare Pages 自動デプロイ
- main への直接コミット / push / force push は禁止

## hotfix / main 直行を入れたら main → develop を即同期する（★分岐再発防止・2026-06-08）

緊急 hotfix を `hotfix/* → main` の PR で入れる等、**develop を経由せず main に commit が乗った場合**、main が develop より先行して **main/develop が分岐**する。同じ内容を develop でも別 SHA で持っていると、次の `develop → main` PR が **重複コミット込みで巨大化・コンフリクト化**する（2026-06-08 実際に発生: PR が 2955 ファイル diff になり手作業 reconcile が必要だった）。

**規約**: main に develop 非経由の commit が入ったら、**その場で `origin/main` を develop に取り込んで同期する**。

```bash
git fetch origin main develop
git rev-list --count origin/develop..origin/main   # >0 なら main が先行＝要同期
git switch develop && git pull origin develop
git merge origin/main --no-edit                    # コンフリクトは内容同一なら ours/theirs で解決
git push origin develop
```

原則は「main に入るものは必ず develop を先に通す」。hotfix もできる限り `feature → develop → PR develop→main` に乗せ、緊急で main 直行した場合のみ上記で即同期する。`/deploy` は Step 1 で `origin/develop..origin/main` を必ずチェックする。

## なぜ PR を develop → main にだけ置くか

- `pr-quality-check.yml` の trigger は `pull_request: branches: [main]` のため、CI は **main PR でしか発火しない**
- feature/* → develop の PR は self-merge + CI 無し → 価値がない (オーバーヘッドだけ)
- develop → main の PR を「本番デプロイの最終ゲート」に集約することで、CI green + 履歴境界 + ロールバック単位の 3 つを 1 箇所で確保

## デプロイ

- `/deploy` スキルで実行
- フロー: feature/* で作業 → ローカルで develop に merge → `git push origin develop` → `gh pr create --base main --head develop` → CI green → マージ → main 自動デプロイ → 必要なら `/purge-cdn`

### デプロイ頻度の規律 ★毎回デプロイしない（2026-06-20 追加）

**変更のたびに本番デプロイ（develop→main PR → CI → merge → Cloudflare deploy）を回さない。** CI（6-8分）+ Cloudflare ビルド/デプロイ（6-8分）が毎回走り、時間もコストも無駄になる。

- **UI/見た目/ロジックの反復は localhost (`npm run dev:web`) で確認**して完結させる。デプロイしない。
- 複数の変更を**まとまりに溜めて、完成時に 1 回だけ**デプロイ（コミットも micro-commit ごとの PR を避ける）。
- デプロイするのは次のときだけ:
  1. **ユーザーが明示的にデプロイを求めたとき**
  2. **本番でしか再現しない問題の検証時**（例: Cloudflare Workers ランタイム固有の R2 / env 問題。dev では再現しないため本番で観測するしかない）
- 本番反映は outward-facing。明示指示が無ければ、デプロイ前に**「デプロイしてよいか」を確認する**。
- 背景: 2026-06-20 のテーマ UI 改修で 7 回連続デプロイ（#486/490/491/492/493/494/495）してしまい指摘された。本番固有のデータ障害切り分け（#491-493）以外は localhost で十分だった。

## データ反映フロー（完全DBレスが正典 → `docs/01_技術設計/02_データアーキテクチャ.md`）

**本番は R2 スナップショット配信のみ。** SSOT は git TS と R2 の二つだけ。永続/リモート D1 は廃止。
オーサリング SSOT を生成スクリプトで R2 に直接反映する（D1 を経由しない）:

```
Authored/設定 (チャート定義等)        : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信
Authored/関係・運用 (page_components 等) : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信 (横断整合はビルド時に検証)
Reference (metrics/articles)          : git TS / article.md ──再生成──▶ R2 snapshot
Derived (area_profiles/相関)          : R2 観測値をエフェメラル計算 (:memory:/DuckDB) ──▶ R2 snapshot
```

- **クラウド/ローカルとも git TS 編集 + R2 直接反映で作業**（永続 D1 認証は不要 = クラウド完結）
- 設定の R2 反映の実装例: `apps/web/scripts/export-page-components-snapshot.ts`（git TS `data/page-components/` → R2、Phase E 実装済）
- R2 読みは公開 URL 経由で可能: `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`
- ranking-values（~30K files）の更新は `SKIP_VALUES=1` で他のみ更新し、必要な場合のみフル実行
- ロールバックは R2 の旧 snapshot ファイルへの上書き push で対応
- 旧 `db:pull`/`db:push` / リモート D1 seed/export は廃止 (legacy)。手編集 JSON を SSOT にしない（git TS → 生成）
