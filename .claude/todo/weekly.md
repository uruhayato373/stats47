---
title: 今週の計画
type: weekly-plan
week: 2026-W34
updated: 2026-08-16
status: active
---

# 2026-W34 今週の計画

期間: 2026-08-17（月）〜 2026-08-23（日）。WIP 上限は 5 件。
status と期限は各バックログを正典とし、ここでは成果だけを確認する。

## 今月の重点（月次計画より）

- **重点1**: 無人生成ループを定着させ、産出量を型配分と整合させる
- **重点2**: 公開中の誤値・欠測を解消する
- 今週この重点で進めること: **止まっていた日次ループの修復を実測で確かめる**（重点1）と
  **露出が伸びているのにクリックが伸びない原因の特定**（重点2 の外側だが影響が最大）。
  詳細は [月間計画](monthly.md)。

## 前週の振り返り (W33)

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| W33 の週次計画そのもの | — | **未作成** | 計画が無い週に未着手が 6 件へ増えた。W32 申し送り 10 件中 完了1/改善2/一部1/**未着手6** |
| `blog-remediation-daily` の連続失敗解消 | Must (W32) | **8/16 に修復・未検証** | 17 日連続失敗。ratchet を queue 単位に分離して commit を通した。**次回 run は 8/17 08:00** |
| 日次生成の run 欠測率 | — | **改善** | blog 56%→83% / ai-content 67%→83% |
| GSC シーソー切り分け | Should (W32) | **未着手** | **4 週連続**。W30/W31/W32/W33 すべて見送り |
| GA4 Unassigned の発生源 | Should (W32) | **未着手** | 2 週連続。9→206 セッション・engagementRate 0.0% |
| AdSense の交絡整理 | Should (W32) | **守られなかった** | 「新規変更を止める」としたのに native 枠変更が 1 件入った |

**パターン分析**: W33 は計画が無く、実装は 95 commits 動いた一方で**計測・調査・是正が 6 件未着手**になった。
W32 の「Must に置けば進み、Should 以下だと進まない」がより強く再現した形。
今週は **4 週連続で流れている GSC 切り分けを Must に上げる**（Should に置く限り着手されない実績が 4 回ある）。

## 前週からの持ち越し

W32→W33 の申し送りのうち未着手 6 件（GSC 切り分け / GA4 Unassigned / search-growth 鮮度 /
`IND-DATA-CORRUPTION-01` の SEO 修正 / `ASP-CONTINUITY-01` / AdSense 判定順）。
うち `ASP-CONTINUITY-01` は **3 週連続未着手**なので今月は見送り（9月へ）、
AdSense 判定順は「新規変更を止める」だけを守る形にして Must から外す。

## 現状サマリー

| 指標 | 現在値 | 備考 |
|---|---|---|
| GSC clicks (finalized 7d) | 930 | +7.4% WoW。**表示は +22.5%・順位 8.12→7.79 と改善したのに CTR -0.42pp** |
| NSM engagedSessions | 1,371 | -20.0% WoW。ただし同一期間の GA4 値が snapshot 間で食い違う問題あり（W33 レビュー参照） |
| AdSense earnings (7d) | ¥130 (W32) | W33 分は日曜 20:00 の cron 待ち |
| 公開ブログ記事 | 445 本 | W33 の新規は 5 本（全て B 型） |
| ranking ai-content done | 249 / 2,173 | **キューが 8/12 生成で stale**。W33 の生成 20 件が未反映 |
| ブログ是正キュー pending | 178（must-fix 32） | **8/11 生成で stale**。2 週連続で是正 0 本 |
| **KDP** | **listed 10 / draft 22** | 下書きは全て作成済み。公開だけが残っている |
| cron 連続失敗 | 5 件 | blog-remediation(修復済・未検証) / migration-flow 12回 / data-refresh / ogp-audit / 他 |
| 改善バックログ Due 超過 | 7 件 | AFF-BRAND-FIT-01 / ASSET-POLICY-BURNDOWN-01 / BLOG-WAVE-2026-07-09-MANUAL / PERF-AREA-DOM-01 / PERF-RANKING-LCP-02 / RANKING-CTR-01 / RANKING-KEYS-SYNC-01 |

## 今週の重要な発見（着手前に共有）

1. **キューが 2 つとも stale なので「次に何をするか」が決まらない状態が続いていた。**
   `blog-remediation-daily` が 17 日止まり、是正キュー（8/11）と ai-content キュー（8/12）が
   更新されていない。8/16 に修復したが**実測はまだ**。これが直らない限り、
   ブログ是正も ai-content の進捗把握も再開できない。

2. **露出は伸びているのにクリックが伸びていない。**
   2 週で順位 8.12→7.79、表示 25,293→30,995（+22.5%）に対し clicks は 866→930（+7.4%）。
   新しく露出した面の CTR が既存面より低い形。切り分けが 4 週連続で未実施のため、
   どの面が増えてどの面の CTR が落ちたかを誰も把握していない。

3. **KDP は下書き 22 冊が作成済みで、公開だけが残っている。**
   KDP は未公開（下書き + 審査中）が約 10 冊で作成数制限に当たるが、**新規作成はしないので影響しない**。
   公開すれば draft 枠は空く。ただし**公開直後は審査中（最大 72h）として枠を食う**ので、
   10 冊を一度に出すより数日に分けた方が安全。

## Must

- [ ] **KDP を今週 10 冊公開する**（重点外・オーナー指示・M）
  - 対象は `kdp-listings.json` の `status: draft` 22 件のうち 10 件（`K-S1-11` から順に）。
  - **cron は使わない**（2026-08-16 に手動のみへ確定。正典 `.claude/rules/coconala-product-standards.md` §8）。
    `/kdp-publish` で 1 冊ずつ verify → `--commit` を回す。
  - **一度に 10 冊を連続実行しない**。公開直後は審査中として作成枠を食うので、
    2〜3 冊ずつ・日を分ける。作成数制限モーダルが出たら中断して翌日へ回す。
  - 成功基準: `status: listed` が 10 → **20 件**になり、各冊に ASIN が入る。
    残り 12 冊は W35 へ。真実源 `.claude/config/kdp-listings.json`。

- [x] **`blog-remediation-daily` の修復を実測で確認する**（重点1・S）— **達成 (2026-08-21 確認)**
  - 8/21 08:17 JST の run は provenance ratchet が赤 (23→26) だが、`remediation-queue.json` の
    `generatedAt` は `2026-08-20T23:18Z` に更新され outbox prune も commit された。
    成功基準「ratchet が赤でも是正キューと outbox prune が commit される」を満たしている。
  - 8/17 08:00 JST の run を見る。**成功しなくてもよい**（provenance ratchet は赤のままでよい）。
    確認するのは「**ratchet が赤でも是正キューと outbox prune が commit される**」こと。
  - 成功基準: `remediation-queue.json` の `generatedAt` が 8/17 に更新される。
    されなければ修正が効いていないので原因を追う。真実源 `.claude/state/blog/remediation-queue.json`。

- [x] **GSC のシーソーを切り分ける**（重点2・M）— **達成 (2026-08-21)。前提が誤りだった**
  - 4 週スパン (W29→W33・実質非重複) では CTR は **3.02%→3.26% (+0.24pp) と改善**。増分だけの CTR は 4.84%。
  - 「-0.42pp」は 21 週の全期間最高値 (7/17-23 の 3.84%) を基準に取ったもの。3.00% は 5 月以降の常用帯の下端で、clicks 930 は期間最高。
  - 実在する問題は最新週 (8/07-13) の増分の質: **+6,380 imp / +101 clicks = 限界 CTR 1.58%**。
    内訳は ranking 63% / areas 21% / category 5%。最も薄いのは areas(市区町村) で 4 週で表示倍増・clicks +1 (CTR 1.39%→0.75%)。
  - 前提として `pages.csv` のアンカー行 (page 次元 imp の 26%・クリックゼロ) を除外する必要があった → `GSC-ANCHOR-ROWS-01` を起票。
  - 全数値と手順: `improvement-log.md#RANKING-CTR-01` / 再実行: `node .claude/scripts/gsc/analyze-ctr-seesaw.mjs`
  - rolling28d の `pages.csv` / `queries.csv` から、表示が増えた面と CTR が落ちた面が同一かを見る。
  - 手掛かり: 「納豆消費量 ランキング」は表示 137 / CTR 5.1%（順位 4.4）で上位クエリ中もっとも低い。
  - 成功基準: 「どの面の表示が増え、どの面の CTR が落ちたか」を数値で言える状態にする。
    施策の実施はここでは求めない（判断材料を作るところまで）。真実源 `improvements.md#RANKING-CTR-01`。

## Should

- [ ] **GA4 Unassigned 206 セッション（engagementRate 0.0%）の発生源を特定する**（2 週連続未着手）。
  source/medium 内訳で切り分ける。自動アクセスなら GA4 フィルタか Cloudflare WAF を検討。
- [ ] **`migration-flow-weekly` の 12 回連続失敗を調べる**。失敗ステップは「📱 Post to Instagram + X」で
  push とは別原因。3 か月近く止まっている。
- [ ] **ブログ品質是正 3 本**（Must 2 でキューが復活したら）。`/brushup-blog --target queue --next 3`。
  2 週連続 0 本なので、キューが動いた時点で消化する。

## Could

- [ ] **改善バックログの Due 超過 7 件を棚卸しする**。実測で再設定するか、今月やらないものは削除する。
- [ ] **`IND-DATA-CORRUPTION-01` の SEO 文字列修正**（2 週連続未着手・S）。
- [ ] **search-growth の source 鮮度を回復する**（2 週 stale。coverage は 6/16 から更新なし）。

## 今週やらないこと

- **AdSense の枠追加・配置変更** — W31 から交絡が 10 件積み上がっている。判定できるまで新規変更を止める
  （W33 で「止める」としながら 1 件入れてしまった。今週は入れない）。
- **KDP cron の再開** — 手動のみへ確定した（`coconala-product-standards.md` §8）。
- **`ASP-CONTINUITY-01`** — 3 週連続未着手なので今月は見送り、9月へ送る。
- **新規記事の手動執筆** — 日次ループが topic-queue から自動で書くため。

## 完了条件

- チェックは成果物、実測値、または再現コマンドがある場合だけ付ける。
- 本番デプロイ、R2 write、**KDP 公開**、ASP 申請、管理画面変更は、実装完了と分けてユーザー承認を得る。
- 未完了は説明をここへ蓄積せず、該当バックログの blocker または次アクションを更新する。

## 参照

- 今月: [月間計画](monthly.md)
- 改善: [改善バックログ](improvements.md)
- 機能: [バックログ](backlog.md)
- 指標: [指標カード (バックログ内)](backlog.md)
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W33.md`
