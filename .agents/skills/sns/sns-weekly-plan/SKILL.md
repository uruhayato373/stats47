---
name: sns-weekly-plan
description: SNS の週次運用ルーチンを1コマンドで回す (先週計測→題材選定→IG/X生成予約→消化チェック)。Use when user says "SNS週次計画", "今週のSNS", "SNS運用まわす", "sns weekly plan". 6週投稿ゼロの再発防止。
disable-model-invocation: true
argument-hint: "[YYYY-Www] [--dry-run]"
primary_agent: strategy-advisor
---

# /sns-weekly-plan — SNS 週次運用ルーチン

「企画→生成→予約→計測」を毎週 1 コマンドで通し、**投稿が途切れないようにする**。
W19-W25 で 6 週連続投稿ゼロになった (計画外タスク優先で SNS が後回しになった) 再発防止が目的。

> **設計判断**: 個別スキルを都度思い出して叩くと運用が続かない。**週 1 回の決まった入口**にまとめ、
> 各チャネルの既存スキルを順に呼ぶ薄いオーケストレーション。頻度・雛形の正典は
> `.Codex/rules/sns-content-standards.md`。本スキルは投稿を全自動化しない (予約の最終確認は人手)。

## 今週の枠 (rules §0 の頻度)

| チャネル | 今週やること |
|---|---|
| **Instagram (主力)** | カルーセル 2 + リール 1 を生成・予約 |
| **X** | 予約 2-3 本 + トレンドがあれば引用RT |
| **note** | 月 1-2 本ペースで企画 (該当週のみ) |

## 手順

### Step 1: 先週の実績を確認

```bash
/sns-weekly-report [先週 YYYY-Www]
```
未計測なら先に `/update-sns-metrics`。前週比・伸びた投稿・凹んだ投稿を把握する。

### Step 2: 今週の題材を選ぶ (1-2 metric)

- `trend-scout` で GSC ギャップ / トレンド / カテゴリ順番から 1-2 metric を選定
- 隔週程度で `/competitor-scan` を挟み、競合の当たり題材も参考にする (煽り追随はしない)
- 題材は数字の格差でなく**感情トリガー** (財布/地元愛/子育て不安/意外性) から逆算 (rules §0)

### Step 3: Instagram — カルーセル 2 + リール 1 を生成・予約

```bash
/generate-instagram-schedule    # 今週枠のスケジュール生成 (重複防止内蔵)
# 角度量産が要れば /post-ig-6angles、静止画/リール素材は /render-sns-stills
```
生成した schedule は GHA `post-instagram-scheduled.yml` (cron 08:03/12:03/19:03 JST の 3 回) が
自動投稿する。各実行はエントリの `time` (JST、未指定は 08:00 扱い) が現在時刻以前で未投稿の最早 1 件
だけを投稿する (state: `.Codex/state/instagram-*-schedule.json`、二重投稿は ig-posted-log で防止)。

### Step 4: X — 定型ストック量産 (週 14-21 本) + 引用RT

```bash
# ① 量産 (クラウド可): 候補選定→画像→執筆→lint→draft 登録を 1 コマンドで
/post-x-batch --count 14        # 頻度・型・画像は rules §1/§2 が SSOT
# ② 投稿 (ローカル専用): draft キューを予約消化。必ず dry-run 先行
node .Codex/scripts/sns/check-x-post-budget.cjs                                  # 週次残枠を確認
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue --dry-run          # 予約モード確認 (初回必須)
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue                    # 予約 → status=scheduled
node .Codex/scripts/sns/promote-scheduled-x.cjs --apply                          # 予約時刻経過分を posted へ
/find-quote-rt                 # トレンドがあれば引用RT (1日≤3・72h以内・炎上/政治回避)
```

- 頻度上限は rules §1 quota (`X_DAILY_MAX=3` / 週 14-21) が SSOT。ガードは `check-x-post-budget.cjs`。
- 単発だけ作るなら `/post-x --key <rankingKey>` (post-x-batch の N=1 版)。

### Step 5: 月初のみ — note

- note 該当週: 衛星記事 1 本を企画 (note-manager)

### Step 6: 消化チェック

- 投稿台帳 `.Codex/state/sns/posts.json` の `status='scheduled'` 残と、前週 `posted` 漏れを表示
- 予約が枠数に満たなければ Step 3-4 に戻る

## 完了報告

- 今週予約した投稿数 (チャネル別) / 先週比の要点 / 来週への持ち越し
- 現在計画 `.Codex/todo/weekly.md` の SNS 項に反映 (該当があれば)

## やらないこと (意図的)

- **投稿の全自動化はしない** — X 予約は dry-run 確認を残す。IG は GHA cron に委ねるが schedule 生成は人手起点
- **量産しない** — 頻度上限は rules §1 を厳守 (X 週2-3・IG 週3枠)
- **TikTok は扱わない** — 撤退恒久

## 関連

- 正典: `.Codex/rules/sns-content-standards.md` (頻度 §1 / 雛形 §2 / パイプライン §5)
- 計測: `/sns-weekly-report` `/update-sns-metrics`
- 生成・投稿: `/post-x-batch` (X 量産) `/post-x` (X 単発) `/publish-x` `/find-quote-rt` `/generate-instagram-schedule` `/post-ig-6angles` `/render-sns-stills` `/bar-chart-race`
- 競合: `/competitor-scan`
