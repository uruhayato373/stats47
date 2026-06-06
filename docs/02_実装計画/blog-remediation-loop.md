---
type: implementation-plan
date: 2026-06-06
status: active
tags: [blog, quality, remediation, gsc]
---

# ブログ品質 是正ループ (計画的に順次品質向上する仕組み)

公開済みブログ 252 記事の品質を**週次で少しずつ底上げ**するための閉ループ。「SVG はあるが文章が薄い」「callout が
定型で不自然」という品質課題 (2026-06-06 診断) を、新規記事だけでなく**既存記事も順次是正**して解消する。

> **正典の役割分担**: 品質基準 (アーキタイプ / 図あたり字数 / callout) は `.claude/rules/blog-quality-standards.md`。
> 本ファイルは**是正を回す運用ループ**の正典。wave 命名規則は `.claude/rules/blog-data-schema.md`。

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

## なぜこの仕組みが要るか (3 つの断線)

既存 machinery は揃っていたが、ループが 3 箇所で切れていて「計画的に順次」できなかった:

| 断線 | 旧状態 | 是正 |
|---|---|---|
| ① 棚卸し ↔ 候補選定 | `audit-published-blog` の全 blocker 棚卸しを `select-brushup-candidates` が読まず、GSC imp≥100 で除外 → 低流入の品質 blocker 記事が永久に浮上しない | キュー builder が audit + GSC を**統合スコア**化 |
| ② キューの状態喪失 | `brushup-queue.md` を週次 cron で**上書き再生成**、状態列なし → 進捗が消える | 状態付きキュー (`remediation-queue.json`) を **upsert** で保持 |
| ③ 効果計測の手動化 | `measure-gsc-impact.mjs` が BLOG-CTR-02 ハードコード、wave_id 非対応 | キューが wave_id / remediated_at を持ち weekly-review が wave で判定 |

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
| wave 人間向け (effect) | `docs/02_実装計画/improvement-backlog.md` の `## [BLOG-WAVE-<wave_id>]` | brushup deploy 時に追記 / weekly-review が判定 |
| 品質基準 (正典) | `.claude/rules/blog-quality-standards.md` | article-writer・blog-critic・quality-gate |

## キューのスコアリング (統合スコア + must-fix レーン)

```
combinedScore = 0.6 × norm(GSC expectedLift) + 0.4 × norm(blockers×3 + warnings)
lane = blockers>0 ? "must-fix" : expectedLift>0 ? "opportunity" : "clean"(キュー除外)
ソート = lane (must-fix → opportunity) → combinedScore 降順 → expectedLift 降順
```

- **must-fix レーン最上位**: publish-blocker を持つ記事を必ず先に消す。レーン内は高流入×blocker が最優先、低流入 blocker も残り順次消化。
- **opportunity レーン**: blocker は無いが CTR 改善余地 (expectedLift) がある記事 (CTR-reframe 対象)。

## 状態機械 (upsert で進捗を保持)

| 状態 | 意味 | 遷移 |
|---|---|---|
| `pending` | 未着手 | rebuild で再スコアリング (priority 振り直し) |
| `in-progress` | 是正作業中 | rebuild が**触らない** (人が作業中) |
| `done` | 是正済み (wave_id 付き) | **rebuild 時に audit が blocker 0 を確認した場合のみ維持**。blocker が残れば**自動で再 pending** (wave_id は履歴として保持) |

> **「直さず done でごまかす」が不能**: mark-done しても次の audit で blocker が残れば再 pending に戻る。
> done を名乗れるのは決定的 gate を実際に通った記事だけ。

## cadence (週次・人手ゲート)

- **毎週 weekly-plan の定常 Must**: `--next 3` で top-N を「ブログ品質是正 3 本」として計画に入れる。
- **実行**: `/brushup-blog --target queue` (article-writer が archetype + 図あたり字数で是正 → blog-critic PASS 必須)。
- **全自動にしない**: auto-brushup は 13% FAIL + 27% WARN の実績 (memory `project_blog_brushup_risk_2026_05_25`)。人がバッチ単位で確認しながら順次進める。

## 現状 (2026-06-06 初期構築)

- キュー初期化: pending **121** (must-fix 101 / opportunity 20) / done 33 (履歴シード)。
- must-fix の主因: markdown 表 (表禁止違反) / 図あたり字数 <350 / callout・内部リンク不足。
- 週 3 本ペースなら must-fix 101 本は約 8 ヶ月で解消。高流入×blocker から消すので effect は早期に GSC に出る想定。

## 今後 (Phase 2)

- `measure-gsc-impact.mjs` の **wave_id 駆動化** (現状 BLOG-CTR-02 ハードコード)。due 到達 wave を自動で before/after 判定し gsc.md status を更新する。本ループの ④ を半自動化する。
- 週次 cron で `build-remediation-queue.mjs` を回し commit-back (キューを常に最新化)。

## 関連

- 品質基準の正典: `.claude/rules/blog-quality-standards.md` (記事アーキタイプ / 図あたり prose 字数の床 / callout)
- wave 命名規則: `.claude/rules/blog-data-schema.md`
- 実証ベース判定: `.claude/rules/evidence-based-judgment.md`
- スキル: `/brushup-blog --target queue` / weekly-plan / weekly-review
- agent: article-writer (archetype 対応) / blog-critic (型別必須分析視点を審査)
