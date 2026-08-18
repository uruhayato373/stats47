# ブログ品質 是正ループ (運用正典)

公開済みブログ記事の品質を**週次で少しずつ底上げ**するための閉ループの**運用正典**。「SVG はあるが文章が薄い」
「callout が定型で不自然」という品質課題を、新規記事だけでなく**既存記事も順次是正**して解消する。
2026-07-12 に旧実装計画を本ルールへ統合し、運用 SSOT を `.claude/` に一本化した。旧版が必要な場合は Git 履歴を参照する。

> **正典の役割分担**: 品質基準 (アーキタイプ / 図あたり字数 / callout) は `.claude/rules/blog-quality-standards.md`。
> 本ルールは**是正を回す運用ループ**の正典。wave 命名規則は `.claude/rules/blog-data-schema.md`。
> 実行スキルは `/brushup-blog --target queue`、オーナー agent は `article-writer` (是正) / `blog-critic` (審査)。

## クイックスタート (★どのセッション・どの環境からでも)

是正を始めるのに前提知識は要らない。キューは**コミット済みの入力から再構築できる**ので、状態ファイルが
手元になくても (別セッション / クラウド環境でも) この 2 コマンドで始められる:

```bash
# 1. キューを最新化 (audit を公開R2から fresh 取得 → コミット済み GSC snapshot + brushup履歴とマージ)
node .claude/scripts/blog/build-remediation-queue.mjs

# 2. pending 上位 3 件を順に是正 (article-writer → quality-gate → blog-critic PASS → publish)
/brushup-blog --target queue --next 3
```

- **再構築の入力はすべて git tracked or 公開 URL**: brushup 履歴 (`auto-brushup-history.json`)・GSC snapshot
  (`snapshots/<週>/pages.csv`) はコミット済み、品質 audit は公開 R2 (`storage.stats47.jp`、認証不要) から取得。
  → `remediation-queue.json` 自体が未コミットでも `build` で正しい状態に復元できる (done は履歴から再シード)。
- 毎週やるなら weekly-plan が自動でこの top-N を Must に入れる (下記 cadence)。単発で「ブログを直したい」だけなら上記 2 コマンドでよい。
- 各記事の是正方針 (どの blocker をどう直すか) は `/brushup-blog --target queue` の Step 3 を参照。

## 設計背景

「棚卸し → 候補選定 → 状態保持 → 効果計測」の 4 箇所を統合することで「計画的に順次」できる閉ループを実現している。各記事の進捗は状態付きキュー (`remediation-queue.json`) が保持し、wave_id 単位で GSC 効果を自動計測する。

## ループ全体図

```
[1] build-remediation-queue.mjs  (単一の頭脳)
      audit-published-blog (品質 blocker) ─┐
                                            ├─ 統合スコア + must-fix レーン → remediation-queue.json (状態保持)
      GSC pages.csv (expectedLift) ────────┘
        ↓
[2] weekly-plan が --next で top-N pending を「ブログ品質是正 N 本」Must に転載 (cadence)
        ↓
[3] /brushup-blog --target queue --next N
      mark-in-progress → article-writer (archetype + 図あたり字数) → quality-gate → blog-critic PASS → mark-done(wave_id)
        ↓  公開は CI (publish-blog.yml / develop push)、gate を公開前に再 enforce
[4] weekly-review が summary で pending 減を報告 + 是正 wave の effect を wave_id で判定 → gsc.md status 更新
```

①②③ がすべて閉じ、「次に何を直すか」「何本消化したか」「効いたか」が **1 つのキュー**で追える。

## 真実源とファイル

| 役割 | ファイル | 書く / 読む |
|---|---|---|
| 状態付き是正キュー (機械) | `.claude/state/blog/remediation-queue.json` | 書: build-remediation-queue.mjs / 読: brushup-blog・weekly-plan・weekly-review |
| キュー builder | `.claude/scripts/blog/build-remediation-queue.mjs` | — |
| 品質棚卸し (入力) | `audit-published-blog.mjs` → `/tmp/published-blog-audit.json` | builder が fresh 取得 |
| GSC 流入 (入力) | `.claude/skills/analytics/gsc-improvement/reference/snapshots/<週>/pages.csv` | builder が読む |
| brushup 履歴 (wave_id) | `.claude/state/blog/auto-brushup-history.json` | done シード + dedup |
| wave 人間向け (effect) | `.claude/todo/04_改善バックログ.md` の `## [BLOG-WAVE-<wave_id>]` | brushup deploy 時に追記 / weekly-review が判定 |
| 品質基準 (正典) | `.claude/rules/blog-quality-standards.md` | article-writer・blog-critic・quality-gate |
| 内部リンク実在の live 監査 | `.claude/state/blog/internal-link-audit.json` (`internal-link-audit-weekly.yml`) | 日曜 04:00 JST。壊れは `link-alert` Issue + オフライン分は audit-published-blog 経由でキューにも流れる |

## キューのスコアリング (統合スコア + must-fix レーン)

```
combinedScore = 0.6 × norm(GSC expectedLift) + 0.4 × norm(blockers×3 + warnings)
lane = blockers>0 ? "must-fix" : expectedLift>0 ? "opportunity" : "clean"(キュー除外)
ソート = lane (must-fix → opportunity) → combinedScore 降順 → expectedLift 降順 → conformance 昇順
```

- **must-fix レーン最上位**: publish-blocker を持つ記事を必ず先に消す。レーン内は高流入×blocker が最優先、低流入 blocker も残り順次消化。
- **opportunity レーン**: blocker は無いが CTR 改善余地 (expectedLift) がある記事 (CTR-reframe 対象)。
- **conformance tiebreaker (天井ループ連携)**: `.claude/state/blog/winning-patterns.json` (`analyze-winning-patterns.mjs` の出力) があれば各記事に勝ちパターン適合度 (`conformance`) を付与し、同スコア時は **適合度が低い (=改善余地が大きい) 記事を先に**取り出す。天井ループ: `.claude/rules/blog-quality-standards.md` §継続品質ループ。

## 状態機械 (upsert で進捗を保持)

| 状態 | 意味 | 遷移 |
|---|---|---|
| `pending` | 未着手 | rebuild で再スコアリング (priority 振り直し) |
| `in-progress` | 是正作業中 | rebuild が**触らない** (人が作業中) |
| `done` | 是正済み (wave_id 付き) | **rebuild 時に audit が blocker 0 を確認した場合のみ維持**。blocker が残れば**自動で再 pending** (wave_id は履歴として保持) |

> **「直さず done でごまかす」が不能**: mark-done しても次の audit で blocker が残れば再 pending に戻る。
> done を名乗れるのは決定的 gate を実際に通った記事だけ。

## cadence (日次運用 / 週次)

### 日次運用 (推奨・2026-06-09〜): Workflow Summary の上位10件を Pro セッションでリライト

CI で Claude を動かさず (APIコストゼロ)、リライト本体は人間が **Claude Pro セッション**で agent に回させる運用。

- **毎朝 JST08:00**: `blog-remediation-daily.yml` (cron) が ① キューを最新化 (公開R2 audit + 最新GSC) して
  develop へ commit-back ② **docs/21 (ephemeral outbox) を自動掃除** (`prune-published-outbox.mjs --apply`:
  「published:true かつ R2 の article.md と内容完全一致」の公開済みドラフトを git rm。広い `git add` で出戻りした残骸も翌日自動消去。
  published:false の作業中ドラフトは保持。内容一致を要求=brushup 改稿中 (R2 旧版と差分) を誤削除しない安全装置) ③ pending 上位 10 件を GitHub Actions の **Workflow Summary** に出す。
- **人間の作業 (1 セッション/日)**: Workflow Summary を見て Claude セッションで `/brushup-blog --target queue --next 10`
  を回す → article-writer が archetype + 図あたり字数で是正 → **quality-gate (決定的) + blog-critic PASS** →
  PASS のみ公開・REVISE はドラフト保留 → mark-done(wave_id)。
- **品質の担保**: CI を通さず人間がセッションで見届けるため、無人公開の drift を避けつつ throughput を上げられる。
  `measure-gsc-impact.mjs` が翌週次で効果を自動計測。
- **なぜ CI 全自動 (claude-code-action) にしないか**: auto-brushup は 13% FAIL + 27% WARN の実績
  (memory `project_blog_brushup_risk_2026_05_25`)。API トークンコストも発生する。Workflow Summary + Pro セッションなら
  コストゼロで critic ゲートと人間の見届けを両立できる。

### 週次 (補助)

- **weekly-plan の定常 Must**: `--next 3` で top-N を「ブログ品質是正 3 本」として計画に入れる (日次運用しない週の保険)。

## 自動化の現行仕様 (2026-06-08〜 稼働中)

①〜④ の自動化が `fetch-metrics-weekly.yml` (日曜 JST20:00 cron) に配線済みで稼働中。

- **週次 cron でキュー再構築 + commit-back**: GSC snapshot fetch 直後、develop の最新 history + fresh GSC +
  公開 R2 audit を入力に `build-remediation-queue.mjs` を回し `remediation-queue.json` を develop へ commit-back。
  「次に何を直すか」が毎週自動で最新化される (race 無し・単一コミット)。R2 audit 失敗時も `continue-on-error`
  で週次計測本体は止めない。
- **`measure-gsc-impact.mjs` の wave_id 駆動**: `auto-brushup-history.json` の wave_id を真実源に
  **due (是正から `--min-weeks` 以上経過) に達した各 wave** の before/after を週次 GSC で自動 diff。
  `.claude/todo/04_改善バックログ.md` の `## [BLOG-WAVE-<wave_id>]` を upsert (冪等)。delta を提示するだけで
  status は `effect/pending` 据え置き — **effect/full|partial の確定は weekly-review (人間) が 2-4 週連続観測で**
  行う (evidence-based-judgment.md 準拠)。
  - before 週 = wave 週直前の利用可能 snapshot 週、after 週 = 最新週。ISO 週は `isoWeekOf` で算出。
  - 手動再計測: `node .claude/scripts/blog/measure-gsc-impact.mjs [--wave <id>] [--min-weeks N] [--dry-run]`

> **自動化の境界**: 選定 → 是正案 → 決定的 gate → 公開 → 効果計測 (delta) はすべて自動。
> **blog-critic の PASS (読者価値の意味判断) のみ意図的に人手ゲート**として残す
> (「書いた本人が自己採点して公開」を構造的に不能にする設計)。

現在の pending/done 件数は `.claude/state/blog/remediation-queue.json` が真実源。

## Workflow による順次バッチリライト (2026-06-21 確立)

`/brushup-blog --target queue` の単記事ループに加え、**Workflow で複数記事を並列リライト**できる
(`.claude/workflows/blog-mass-rewrite.js`)。ただし**一括は不可** — 112 本一括は **24.3M tok・session limit 到達**
(1 記事 ~217K tok、rewrite は完走したが critic ~50 本が枠切れで失敗)。**1 バッチ 15-20 本**に分割し、
SSOT (remediation-queue) で進捗記録しながら順次回す。**リライト済みは status + 日付で再リライトしない**。

定型ループ (1 セッション 1 バッチ):

```bash
# ① pending 上位 N の slug を取得 (must-fix 優先)
node .claude/scripts/blog/build-remediation-queue.mjs --next 15
# ② Workflow で rewrite→quality-gate→critic (args は slug 配列のみ)
#    Workflow({scriptPath:".claude/workflows/blog-mass-rewrite.js", args:["slug1",...]})
# ③ 進捗を SSOT に記録 (docs/21 走査 → queue upsert)
node .claude/scripts/blog/sync-rewrite-progress.mjs --wave-id 2026-06-21-N
#    review.md verdict:PASS=done(remediated_at) / rewrite済未PASS=in-progress / article.md無=pending据置
# ④ 次セッションで ① に戻る (--next は pending のみ返す = done/in-progress は再リライトされない)
```

- **再リライト防止**: queue の status は upsert で保持され、`--next` は `pending` のみ返す。done / in-progress は二度と対象にならない。
- **critic が session limit で失敗した分**は rewrite 済 = `in-progress` で記録 → 枠リセット後に **critic のみ追走** (安価) で done に昇格 (rewrite はやり直さない)。
- **args は slug 配列のみ** (blocker は各 agent が quality-gate で自己検出。エントリ JSON の inline は転記ミスの元。workflow 側は文字列 args の JSON.parse フォールバックを持つ)。
- 単記事を丁寧に直すなら従来どおり `/brushup-blog --target queue --next N` (こちらも mark-done で同じ SSOT を更新)。

### critic 追走 (rewrite 済・critic 未実施の記事を仕上げる)

一括 rewrite で **rewrite は完走したが critic が session limit で失敗**した記事 (review.md 無し = status `in-progress`) は、
**rewrite をやり直さず critic だけ追走**して仕上げる。

```bash
# review.md 無し (critic 未実施) の rewrite 済み記事を 15-18 件ずつ
#   Workflow({scriptPath:".claude/workflows/blog-critic-followup.js", args:["slug1",...]})
#     → blog-critic が docs/21 の記事を read-only レビュー → review.md (PASS/REVISE) 生成
node .claude/scripts/blog/sync-rewrite-progress.mjs --wave-id <date>-criticN  # PASS=done 昇格
```

- **rewrite は走らせない** (article.md は read-only)。critic のみ = ~120K tok/件と rewrite より安価。
- PASS → done 昇格 → 公開対象。REVISE → article-writer で個別修正 (critic 追走では直らない)。
- 公開は **既 live 改稿なので `blog-auto-publish.yml -f slugs="<10件>"` を直列 dispatch** (reconcile は live 未掲載のみ拾うため明示 slugs 必須)。review.md を develop に push してから dispatch する (publish の quality-gate が review.md PASS を要求)。
- 実装: `.claude/workflows/blog-critic-followup.js`。

## 関連

- 品質基準の正典: `.claude/rules/blog-quality-standards.md` (記事アーキタイプ / 図あたり prose 字数の床 / callout)
- wave 命名規則: `.claude/rules/blog-data-schema.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`
- スキル: `/brushup-blog --target queue` / weekly-plan / weekly-review
- agent: article-writer (archetype 対応) / blog-critic (型別必須分析視点を審査)
- 同型ループ: GSC カバレッジ是正 = `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
