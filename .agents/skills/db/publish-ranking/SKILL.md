---
name: publish-ranking
description: ランキングを isActive:true から本番で 200 を返す公開状態まで一気通貫で届ける。ranking-publisher agent を起動し、observations 投入→ranking-items→KNOWN/SITEMAP 同期→deploy→本番実測(Googlebot UA 200)を管理。Use when user says "ランキング公開", "publish-ranking", "metric を本番公開", "ranking を 200 にする"。
primary_agent: ranking-publisher
---

新規 / 有効化した metric のランキングを **本番で 200 を返す公開状態まで届ける** 起動口スキル。

**本スキルは実コードを書かない。** `ranking-publisher` agent (公開多段パイプラインの単一オーナー) を起動し、
公開すべき key を渡すだけ。ロジック・OUTPUT FORMAT・本番実測は agent 定義 (`.Codex/agents/ranking-publisher.md`) に閉じる。

## なぜ必要か

`MetricConfig.isActive:true` にしただけでは本番公開されない。本番アプリは R2 snapshot + 派生キーリスト
(KNOWN / SITEMAP / INDEXABLE) と整合して初めて 200 を返す。未整合だと 404 / sitemap 未掲載のまま放置される
(memory `project_ranking_publish_pipeline_gap`: 2026-06-03 に 122 metric を有効化したが未反映で全件未達)。
正典: `.Codex/rules/metric-config-standards.md` §isActive:true ≠ 本番公開。

## 引数

```
/publish-ranking <key1> [<key2> ...]        # 指定 key を公開状態まで
/publish-ranking --since <YYYY-MM-DD>       # その日以降に isActive 化した metric をまとめて (agent が差分抽出)
```

## 手順

1. **公開対象 key の確定**: 引数の key、または「今月 config 化した metric」を列挙。実在チェック
   (`ls packages/data-configs/src/metrics/<key>.ts` + `isActive:true`)。
2. **ranking-publisher agent を起動** (`mode: "bypassPermissions"`)。agent が下記を一括管理:
   - 観測値投入が未済なら data-ingester に `/page-data-batch --metric <key>` を委譲
   - `gh workflow run sync-snapshots.yml -f only=ranking-items` で R2 item.json 生成 (完了待ち)
   - sync-snapshots の後段 `sync-ranking-keys` job が KNOWN/SITEMAP を再生成し PR を自動作成
     (この PR のマージ = 本番デプロイ。**まとめて承認**する)
   - GONE 誤登録がないか `ranking-key-consistency.test.ts` を確認
   - deploy 後に **Googlebot UA で本番 200 を実測** (agent の OUTPUT FORMAT で必須)
3. **月次バッチ運用**: 月末に当月 config 化分をまとめて 1 回起動する (毎回デプロイしない・デプロイ規律)。

## 規約

- **コードを書かない** (orchestrator)。公開ロジックは ranking-publisher agent に閉じる。
- **デプロイ規律**: keys PR のマージ = 本番反映。ユーザー承認を得てまとめてマージする (`.Codex/rules/branch-workflow.md`)。
- **実証ベース**: 本番 200 を Googlebot UA で実測してから「公開済み」と言う (`.Codex/rules/evidence-based-judgment.md`)。

## 参照

- agent: `.Codex/agents/ranking-publisher.md` (公開パイプラインの単一オーナー)
- keys 自動同期: `.github/workflows/sync-snapshots.yml` (sync-ranking-keys job)
- 公開判定の正典: `.Codex/rules/metric-config-standards.md` §isActive:true ≠ 本番公開
- SSG 保全: `.Codex/rules/nextjs-ssg-preservation.md` (R2 依存 route に generateStaticParams を付けない)
- 月次 metric 拡充の全体像: `.Codex/agents/ranking-expander.md` (+ ブログSEO戦略は `.Codex/agents/blog-seo-strategist.md` §戦略コンテキスト)
