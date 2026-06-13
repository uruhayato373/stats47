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
| **develop → R2 公開** | **GitHub Actions** (`blog-auto-publish.yml`) | R2 secrets 保持 (dispatch 不要 = 403 回避) | LLM 実行 |
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
        ▼ (develop に published:true 記事が入る)
[GitHub Actions: blog-auto-publish.yml]  ← ★403 回避の公開ブリッジ
  factual + quality ゲート再検証 → stage → thumbnail → diff-push (app/blog/<slug>) → all.json 再生成 → push
        │
        ▼
[GitHub Actions or Routine: 月次]  measure-gsc-impact.mjs → docs/02_実装計画/improvement-backlog.md に effect ラベル
```

## コンポーネント (再利用 9 割)

| 工程 | 実装 | 状態 |
|---|---|---|
| ① 候補選定 (GSC) | `.claude/scripts/blog/select-brushup-candidates.mjs` | ✅ 既存 (CTR 改善余地ベース・GSC 必須) |
| ①' 候補選定 (catch-up) | `.claude/scripts/blog/select-conformance-candidates.mjs` | ✅ **新規 (2026-06-02)・GSC 非依存・audit blocker ベース** |
| ② データ接地 | `.claude/scripts/blog/fetch-ranking-data-r2.mjs` | ✅ 新規実装・テスト済 (旧 D1 依存の置換) |
| ③ AI リライト | `/brushup-blog --target article <slug>` + 表現正典化 | ✅ 既存スキル (Step B2 に正典化追加済) |
| ④ チャート | `.claude/scripts/blog/generate-article-charts.mjs` | ✅ **2026-06-02 強化: 上位5+下位5 / placeholder タグ+名前不一致フォールバック / dark mode / --extract-inline** |
| ⑤ critic (必須) | `blog-critic` agent → `review.md` (verdict PASS) | ✅ **agent あり・pilot で REVISE→PASS ループ実証** |
| ⑥ ゲート | `.claude/scripts/blog/quality-gate.mjs` (+factual) | ✅ 既存・CI enforce 済 + review.md PASS 必須 (2026-06-02) |
| ⑦ PR | Routine が PR 作成 (`mcp__github__` or `gh`) `--label brushup-auto` | ✅ trend pipeline と同型 |
| ⑧ auto-merge | `.github/workflows/blog-auto-merge.yml` | ✅ **新規 (2026-06-02)・brushup-auto green で squash merge** |
| ⑨ 公開ブリッジ | `.github/workflows/blog-auto-publish.yml` | ✅ **`on: push: [develop]` 有効化済 (2026-06-02・pilot 2 記事で実証)** |
| ⑩ 計測 | `.claude/scripts/blog/measure-gsc-impact.mjs` | ✅ 既存・要 SKILL 化 (blog-data-schema Phase D) |

## 安全設計 (自動公開の肝)

1. **多重ゲート (ブロッキング)**: factual(数値捏造) + quality(構造/薄さ/rank 突合)。PR の CI と公開ブリッジの**両方**で再検証。捏造数値・薄い記事は R2 に到達不能。
2. **データ接地の徹底**: `data/*.json` を R2 観測値から決定的生成。これが唯一の数値ソース。LLM が digest 外の順位/値を書けば factual で落ちる。
3. **キルスイッチ / 段階解禁**: 公開ブリッジは現 `workflow_dispatch` のみ (自動起動しない)。検証後に `on: push` を後続コミットで追加し、その**マージ自体が解禁の意思表示** (git 履歴に残る)。緊急停止は GitHub Actions UI の "Disable workflow" (リポジトリ変数ガードは over-engineering のため不採用)。Routine は `RemoteTrigger({enabled:false})`。
4. **量の上限**: Routine 週 ≤3 本、公開ブリッジ 1 実行 ≤5 本 (`MAX_PUBLISH`)。爆発半径を限定。
5. **クールダウン**: 同一 slug は効果計測まで N 週間 再改修しない (`auto-brushup-history.json`)。チャーン防止。
6. **NotebookLM 禁止**: headless 非対応の `エキスパート視点追加` focus は強制 `CTR-reframe` (brushup-blog SKILL の既存ガード)。
7. **ロールバック**: R2 の旧 `article.md` / `all.json` を上書き push で復旧。
8. **監査証跡**: 全変更が PR + wave 記録 + 改善ログに残る。

## 段階導入 (現在地と次段階)

| Phase | スコープ | 状態 |
|---|---|---|
| 1: 人間ゲート | Routine が PR 作成で停止 → 人が merge → 公開ブリッジを手動 dispatch | 公開ブリッジ実装済 (dispatch のみ)。Routine 未登録 |
| **2: 半自律 (採用)** | Phase1 + green で auto-merge + 公開ブリッジに `on: push` 追加で自動化 | 公開ブリッジ✅(dispatch) / push trigger⏳ / auto-merge⏳ / Routine⏳ |
| 3: 完全自律 | レビューなし公開 + 自動計測ループ | 効果計測の SKILL 化後 |

## 稼働に必要な残作業 (現在地: 2026-06-02)

- [x] `blog-auto-publish.yml` を **`on: push: [develop]` で稼働**化 (pilot 2 記事 yakiniku/fertility が実際に自動公開され、ログ green を確認)
- [x] **auto-merge workflow** 作成 (`.github/workflows/blog-auto-merge.yml`・brushup-auto green で squash merge)
- [x] **catch-up 候補選定** (`select-conformance-candidates.mjs`・GSC 非依存) + 生成器強化 + critic ループ実証
- [ ] **Claude Routine 登録** — ★**connector セッション (Claude Code on the web) には RemoteTrigger / `/schedule` ツールが無く登録不可**。下記「トリガー登録仕様」を **Claude Code web の routines UI** (`https://claude.ai/code/routines`) に貼って登録する (人手 1 回)。雛形: trend pipeline `trig_01RaPLqZrP4i7wAnCzQjifWJ`
- [ ] `measure-gsc-impact.mjs` の SKILL 化 (`/measure-blog-impact`, blog-data-schema Phase D)

## ルーティンプロンプト (確定・登録時に purpose/prompt へ貼る)

> 1 実行で最大 8 記事を「表現正典化」して develop に PR。critic 必須。R2 書き込みはしない (公開は CI)。

```
OUTPUT FORMAT: 最後に 1 テーブルのみ。列: slug | verdict(PASS/REVISE/skip) | PR?。各セル ≤10 語。前置き散文なし。

あなたは stats47 ブログ「表現正典化 catch-up ルーティン」。今回 ≤8 記事を正典化し develop に PR を作る。

手順 (各 slug):
0. develop を pull。作業ブランチ claude/blog-conformance-$(date +%Y%m%d) を切る。
1. 候補選定(決定的):
   node .claude/scripts/blog/audit-published-blog.mjs --json /tmp/published-blog-audit.json
   node .claude/scripts/blog/select-conformance-candidates.mjs --count 8 --cooldown 21
2. 作業コピー: mkdir -p docs/21_ブログ記事原稿/<slug>; R2 から本文取得
   curl -s https://storage.stats47.jp/app/blog/<slug>/article.md -o docs/21_ブログ記事原稿/<slug>/article.md
3. データ接地(決定的・捏造防止の土台):
   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug <slug>
4. チャート(決定的): node .claude/scripts/blog/generate-article-charts.mjs --slug <slug>
   インライン svg があれば: node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --extract-inline
5. 表現正典化(LLM編集・正典 = .claude/rules/blog-quality-standards.md「記事 markdown の正典テンプレート」):
   - <chart-placeholder>/インライン svg → ![](data/*.svg)
   - 記事内『関連ランキング/関連記事』見出しを削除 (ページ側 RelatedRankingsSection 等が正典)
   - source-link を各図直下にインライン配置 (末尾集約しない)
   - truncated 表/上下非対称表を撤去 (全件 or SVG・上下対称)
   - callout ≥2 / 内部リンク ≥3 (不足なら本文に /areas/<code> /category/<key> を curl で実在確認の上 追記)
   - prose が薄ければ読者価値ある分析を加筆 (反復水増し禁止)。数値は data/*.json の digest のみ (捏造厳禁)
6. critic(必須・別 agent): Agent(subagent_type=blog-critic) を起動し review.md を生成。
   verdict REVISE なら指摘を修正して再 review。BLOCK が消えるまで最大 3 周。PASS が得られない slug は skip。
7. gate(決定的): node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/<slug>/article.md
   exit≠0 なら revert して skip (PR に含めない)。
8. frontmatter に published: true があるか確認 (無ければ追加)。
9. 全 slug 完了後: .claude/state/blog/auto-brushup-history.json に {date, wave_id:"$(date +%Y-%m-%d)-auto", slug} を追記し commit。
   ラベル brushup-auto を用意 (未作成なら: gh label create brushup-auto --color FFA500 --description "ブログ表現正典化 自動リライト PR" || true)。
   PR 作成 (gh pr create または mcp__github__create_pull_request, base=develop) + ラベル brushup-auto 付与。
   → blog-auto-merge が green で squash merge → blog-auto-publish が R2 公開。

制約: ≤8 記事/実行。critic PASS なき記事は PR に入れない。R2 直接書き込み禁止。NotebookLM 不可 (headless)。
```

## トリガー登録仕様 (routines UI に貼る・人手 1 回)

| 項目 | 値 |
|---|---|
| name | `stats47 daily blog conformance` |
| cron | `0 16 * * *` (16:00 UTC = 翌 01:00 JST。低トラフィック帯) |
| model | `claude-sonnet-4-6` (大量編集向き・コスト効率) |
| repo | `https://github.com/uruhayato373/stats47` |
| environment | trend pipeline と同一 (`env_01DyBoX8qdC86ZEdncmFwqx6` を雛形に新規可) |
| persist_session | false (毎回新規) |
| purpose / prompt | 上記「ルーティンプロンプト」 |
| 上限 | ≤8 記事/実行 (プロンプト内) + `blog-auto-publish` の `MAX_PUBLISH=10` |
| 想定消化 | 残 ~245 件 (blocker あり) ÷ 8/日 ≈ **約 31 日**で一巡。以後は週次の GSC-CTR brushup に切替 |
| 停止 | routines UI で disable、または `RemoteTrigger({action:'update', body:{enabled:false}})` |

> catch-up 一巡後は `select-brushup-candidates`(GSC) ベースの週次に戻す (チャーン防止・効果計測ループへ)。

## 関連

- 親方針: `docs/02_実装計画/100x-pv-strategy.md` Phase 0 / `seo-todo-unify-phase-1-3.md` (trend pipeline 先例)
- 品質基準 (正典): `.claude/rules/blog-quality-standards.md`
- wave 命名 / 効果計測: `.claude/rules/blog-data-schema.md`
- 完全DBレス: `docs/01_技術設計/12_完全DBレス設計.md`
- 自動化インベントリ: `docs/01_技術設計/06_自動化インベントリ.md`
