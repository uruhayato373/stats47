---
type: implementation-plan
date: 2026-06-02
status: active
tags: [blog, automation, claude-routine, github-actions, dbless]
---

# ブログ記事リライト クラウドルーティン設計 (Phase 2 半自律)

GSC 高インプレ記事を「候補選定 → データ接地 → AI リライト → 品質ゲート → 公開 → 効果計測」まで
クラウドで半自律実行する環境の設計。2026-06-02 に quality-gate を CI enforce 化したことで、
薄い/捏造記事を自動公開する事故を構造的に防げるようになり、自律化が安全に可能になった。

## なぜ「2 基盤分割」がベストか

クラウド実行基盤は能力が異なる。**AI を動かせる基盤と R2 を書ける基盤が別**なので、役割分担する。

| 役割 | 基盤 | 可能 | 不可能 |
|---|---|---|---|
| AI リライト → PR | **Claude Routine** (Anthropic remote) | LLM 推論 / Edit / script 実行 / `gh pr create` / develop push | R2 書き込み / workflow dispatch (403) |
| PR auto-merge | GitHub Actions | ネイティブ権限で merge | — |
| **develop push → R2 公開** | **GitHub Actions** (`blog-publish-on-push.yml`) | R2 secrets 保持 (dispatch 不要 = 403 回避) | LLM 実行 |
| 効果計測 | GitHub Actions or Routine | GSC snapshot 突合 | — |

> リポジトリの確立済み方針: AI ステップは **Claude Routine** で実装する (`ANTHROPIC_API_KEY` 方式は
> `cwv-improvement-pr-weekly.yml` 廃止時に否定済。Anthropic billing 内で完結し API key 不要)。
> 既存の `stats47 daily trend pipeline` routine (discover→draft→PR、月 5-7 本上限、GATE1 人手) が同型の先例。

## 全体フロー (PDCA ループ)

```
[Claude Routine: 週次 cron]
  ① 候補選定(決定的)   select-brushup-candidates.mjs   GSC snapshot + audit + history(cooldown) → 上位 N slug
  ② データ接地(決定的) fetch-ranking-data-r2.mjs       記事内 /ranking/<key> → R2 values.json → data/*.json(rank再計算) + digest
  ③ AI リライト(LLM)   brushup-blog --target article   focus=CTR-reframe 固定 (NotebookLM は headless 不可)
  ④ チャート(決定的)   generate-article-charts.mjs     <slug>-prefecture-rankings.json → SVG + placeholder 置換
  ⑤ ゲート(決定的・必須) quality-gate.mjs               構造 + factual(rank 突合)。落ちた slug は revert+skip
  ⑥ PR 作成            gh pr create --label brushup-auto  develop 宛。pr-quality-check 発火
  ⑦ 履歴更新           auto-brushup-history.json (wave_id) commit
        │
        ▼ (PR が全ゲート green)
[GitHub Actions: PR auto-merge]  ← green なら squash merge (label brushup-auto 限定)
        │
        ▼ (develop に published:true 記事が入る = push)
[GitHub Actions: blog-publish-on-push.yml]  ← ★403 回避の公開ブリッジ
  factual + quality ゲート再検証 → stage → thumbnail → diff-push (app/blog/<slug>) → all.json 再生成 → push
        │
        ▼
[GitHub Actions or Routine: 月次]  measure-gsc-impact.mjs → docs/05_改善ログ/gsc.md に effect ラベル
```

## コンポーネント (再利用 9 割)

| 工程 | 実装 | 状態 |
|---|---|---|
| ① 候補選定 | `.claude/scripts/blog/select-brushup-candidates.mjs` | ✅ 既存・DBレスで動作確認済 (2026-06-02) |
| ② データ接地 | `.claude/scripts/blog/fetch-ranking-data-r2.mjs` | ✅ **新規実装・テスト済** (旧 D1 依存 `fetch-article-data.mjs` の置換) |
| ③ AI リライト | `/brushup-blog --target article <slug> --focus CTR-reframe` | ✅ 既存スキル |
| ④ チャート | `.claude/scripts/blog/generate-article-charts.mjs` | ✅ 既存 |
| ⑤ ゲート | `.claude/scripts/blog/quality-gate.mjs` (+factual) | ✅ 既存・CI enforce 済 (2026-06-02) |
| ⑥ PR | Routine が `gh pr create` | ✅ trend pipeline と同型 |
| ⑦ auto-merge | (要新規 or GitHub 標準 auto-merge) | ⏳ 未実装 |
| ⑧ 公開ブリッジ | `.github/workflows/blog-publish-on-push.yml` | ✅ **新規実装 (既定 disabled)** |
| ⑨ 計測 | `.claude/scripts/blog/measure-gsc-impact.mjs` | ✅ 既存・要 SKILL 化 (blog-data-schema Phase D) |

## 安全設計 (自動公開の肝)

1. **多重ゲート (ブロッキング)**: factual(数値捏造) + quality(構造/薄さ/rank 突合)。PR の CI と公開ブリッジの**両方**で再検証。捏造数値・薄い記事は R2 に到達不能。
2. **データ接地の徹底**: `data/*.json` を R2 観測値から決定的生成。これが唯一の数値ソース。LLM が digest 外の順位/値を書けば factual で落ちる。
3. **キルスイッチ**: 公開ブリッジは `vars.BLOG_AUTO_PUBLISH_ENABLED == 'true'` のときだけ起動。Routine は `RemoteTrigger({enabled:false})`。
4. **量の上限**: Routine 週 ≤3 本、公開ブリッジ 1 push ≤5 本 (`MAX_PUBLISH`)。爆発半径を限定。
5. **クールダウン**: 同一 slug は効果計測まで N 週間 再改修しない (`auto-brushup-history.json`)。チャーン防止。
6. **NotebookLM 禁止**: headless 非対応の `エキスパート視点追加` focus は強制 `CTR-reframe` (brushup-blog SKILL の既存ガード)。
7. **ロールバック**: R2 の旧 `article.md` / `all.json` を上書き push で復旧。
8. **監査証跡**: 全変更が PR + wave 記録 + 改善ログに残る。

## 段階導入 (現在地と次段階)

| Phase | スコープ | 状態 |
|---|---|---|
| 1: 人間ゲート | Routine が PR 作成で停止 → 人が merge → 公開ブリッジ | 公開ブリッジ実装済。Routine 未登録 |
| **2: 半自律 (採用)** | Phase1 + green で auto-merge + 公開ブリッジ自動 | 公開ブリッジ✅ / auto-merge⏳ / Routine⏳ |
| 3: 完全自律 | レビューなし公開 + 自動計測ループ | 効果計測の SKILL 化後 |

## 稼働に必要な残作業 (この環境では実行/検証不可な分)

- [ ] **`vars.BLOG_AUTO_PUBLISH_ENABLED = true`** をリポジトリ変数に設定 (キルスイッチ解除)
- [ ] `blog-publish-on-push.yml` の **初回検証**: develop に published 記事を 1 本 push し、Actions ログで factual/quality ゲート → diff-push → all.json 再生成が通るか確認 (本環境では CI ランタイム不在のため未検証)
- [ ] **Claude Routine 登録** (`/schedule` 経由): `stats47 weekly blog brushup` — cron 週次、model sonnet、purpose=「① select-brushup-candidates → ② fetch-ranking-data-r2 → ③ brushup-blog --target article → ⑤ quality-gate → ⑥ gh pr create --label brushup-auto」、月上限・GATE。trend pipeline (`trig_01RaPLqZrP4i7wAnCzQjifWJ`) の notes を雛形にする
- [ ] **auto-merge**: `brushup-auto` ラベル PR を全 check green で squash merge する仕組み (GitHub 標準 auto-merge を Routine が `gh pr merge --auto --squash` で有効化、or 専用 workflow)。権限確認要
- [ ] `measure-gsc-impact.mjs` の SKILL 化 (`/measure-blog-impact`, blog-data-schema Phase D)

## 関連

- 親方針: `docs/02_実装計画/100x-pv-strategy.md` Phase 0 / `seo-todo-unify-phase-1-3.md` (trend pipeline 先例)
- 品質基準 (正典): `.claude/rules/blog-quality-standards.md`
- wave 命名 / 効果計測: `.claude/rules/blog-data-schema.md`
- 完全DBレス: `docs/01_技術設計/19_完全DBレス設計.md`
- 自動化インベントリ: `docs/01_技術設計/10_自動化インベントリ.md`
