---
title: 今週の計画
type: weekly-plan
week: 2026-W35
updated: 2026-08-24
status: active
---

# 2026-W35 今週の計画

期間: 2026-08-24（月）〜 2026-08-30（日）。WIP 上限は5件。
status と期限は各バックログを正典とし、ここでは週内に確認できる成果だけを置く。

## 今月の重点（月次計画より）

- **重点1**: 生成を無人ループから外し、月次目標 → 週次割当で回す
- **重点2**: 公開中の誤値・欠測を解消する
- 今週は、月次配分どおり **手動12 metricの再取得**、**R2増加源の特定**、
  **ブログ月間下限に必要な2本だけを手動生成**する。

## 前週の振り返り（W34）

検索は大きく伸びた。GSC clicks +77.3%、impressions +44.3%、CTR +0.69pp、
GA4 Japan-only engagedSessions +61.5%。一方、8/21に置いた手動割当は ai-content 0/3、blog 0/2。
KDPは2/10、ブログ品質是正は0/3だった。

検索運用は8/24に回復した。W34 snapshot、effect verdict、URL Inspection、search-growthを接続し、
登録済みURLやcoverage remediation作業中URLを重複候補化する欠陥も修正した。
GSC operations audit は既知の過去欠落target 7件のWARNだけで、必須工程はPASSしている。

## 前週からの持ち越し方針

| W34項目 | W35での扱い | 理由 |
|---|---|---|
| ai-content 3件 | **積み増さない** | 月次上限20件に対し8月のdone増分は既に20件超。月次規約どおり0件 |
| blog 2本 | **Mustへ再割当** | 8月公開15本。月間下限17本まであと2本 |
| KDP残り8冊 | **今週は実施しない** | 外部公開かつ月次の「商品チャネル新規展開をしない」に従う。再開は明示承認時だけ |
| GA4 Unassigned | **条件付き監視** | 206→8 sessionsへ収束。原因調査は再発閾値を超えたときだけ |
| migration-flow | **backlogで再実装待ち** | clean checkoutで成立する投稿経路が未実装。月次重点外 |
| ブログ品質是正3本 | **Shouldへ縮小** | workflowが12回連続失敗。まず入口を一本化して1本だけ実証する |
| Due超過棚卸し | **重点2の3件をMust/Shouldへ** | DATA-MANUAL / DATA-ESTAT / R2を実作業へ変換 |

## 現状サマリー

| 指標 | 現在値 | 判断 |
|---|---:|---|
| GSC clicks finalized7d | 1,651 | +77.3% WoW。単週なので継続判定は保留 |
| NSM engagedSessions | 2,610 | +61.5% WoW、Japan-only |
| ブログ8月公開 | 15本 | 月間下限17本まで2本 |
| ranking ai-content done | 270 / 2,164 | 8月増分が月次上限を超えたため今週0件 |
| ブログ是正 queue | pending 222 / in-progress 1 | workflow 12回連続失敗 |
| KDP | listed 12 / draft 20 | 今週は外部公開しない |
| search-growth | 880候補 / approved 1 / WIP 1 | WIP上限5以内 |
| URL Inspection | PASS 353 / NEUTRAL 147 | 8/20比 PASS +5 |
| R2 account storage | 22.20GB | stats47 11.59GB / doboku-note-archive 8.98GB。siteScope分離必須 |

## Must

- [ ] **`DATA-MANUAL-RESTORE-01` の12 metricを再取得可能な状態まで進める**（重点2・L）
  - 12件それぞれの provenance 9点セット、一次ファイルURL、hash、年、単位を確認する。
  - 一次ファイルを再取得し、代表3県を git TS / R2候補と照合する。
  - 欠けたprovenanceや取得不能は推測で埋めず、metric単位で blocker を残す。
  - 成功基準: 12件すべてに `ready / blocked` と根拠が付き、ready分の候補生成と
    provenance audit が通る。**R2 write・公開は別途承認まで行わない。**

- [ ] **`R2-STORAGE-01` の増加源を siteScope 付きで特定する**（重点2・M）
  - account合計22.20GBをそのままstats47の増加と扱わず、bucket / prefix / build世代で分解する。
  - stats47 11.59GBについて、8/19比の増分、保持中build、cache、生成物prefixを計測する。
  - doboku-note / archiveは別siteScopeとして隔離し、stats47の削除候補に混ぜない。
  - 成功基準: 増加上位prefix、保持理由、削除可否、再増加alert条件が記録される。
    削除は対象を明示して別工程にし、今週の診断では実行しない。

- [ ] **ブログを2本だけ手動生成・公開経路へ載せる**（重点1・M）
  - topic queueの `must-write` から需要確認済み候補を2件選ぶ。
  - `/write-prepared-article` → quality gate → blog-critic PASS → `published: true` の順を守る。
  - 成功基準: 8月公開が15→17本となり、topic queueが2件done、公開workflowがpush発火する。
  - **3本目は作らない。ai-contentは今週0件。未達分を翌週へ積み増さない。**

## Should

- [ ] **`DATA-ESTAT-FETCH-01` 25 metricを失敗型で分類する**（重点2・L）
  - statsDataId / cdCat / API失敗メッセージでまとめ、同じ入力の無意味な再実行を止める。
  - 各metricを `config修正 / 代替統計 / 一時非公開 / blocker` のいずれかへ決定する。
  - 成功基準: 25件すべてに処置が付き、代表3県照合が必要な次バッチが明確になる。

- [ ] **ブログ品質是正の入口を一本化し、1本だけ実証する**（重点1・M）
  - `blog-remediation-daily` の12回連続失敗が、廃止済み無人ループの残骸か現行必須workflowかを確定する。
  - 無人生成を再開せず、`/brushup-blog --target queue --next 1` の手動経路で1本をゲート通過させる。
  - 成功基準: 1本の是正成果とqueue更新が対応し、不要workflowならschedule/監視のdriftを解消する。

- [ ] **`RANKING-KEYS-SYNC-01` の次回実走を確認する**（indexing・S）
  - 是正後スクリプトが生きたkeyを落とさず、open PRだけを判定し、必要ならPRを作れることを確認する。
  - 成功基準: check結果とworkflow runが揃い、item / KNOWN / sitemap の不整合0。

## Could

- [ ] **GA4 Unassignedを閾値付きで監視する**（計測・S）
  - 次回snapshotで `sessions >= 100` または engagementRate 0%が2週連続なら source/medium調査を再開する。
  - 閾値未満なら「収束」とだけ記録し、原因を推測しない。

- [ ] **CTR候補1件のquery別根拠だけを確認する**（検索・S）
  - `/blog/avg-height-high-school-2nd-male` は impressions 4,253 / CTR 0.52% / position 8.49。
  - page×queryと現行titleを確認し、過去title rewriteの effect/none を踏まえて approve / dismiss を判断する。
  - 一括title書換えはしない。

## GSC運用サイクル

- W35 search-growth: 必須source fresh、候補880件、approved 1件、WIP 1/5。
- 承認候補 `soft-404-risk::/ranking/barber-beautician-annual-income` は既存のデータ補強を観測するだけ。
  14日判定は 2026-09-07、28日は 09-21、56日は 10-19。今週は追加改修・送信をしない。
- effect verdict の既知の過去欠落target 7件は推測で補完せず、個別の終了/再計測判断までWARNを維持する。

## 今週やらないこと

- ai-content生成 — 8月の月次上限超過のため0件。
- KDP残り8冊の公開 — 外部公開かつ月次重点外。明示承認なしに続行しない。
- AdSenseの枠追加・配置変更 — 交絡を増やさず計測のみ。
- migration-flow schedule再開 — clean checkoutで成立する公開R2経路ができるまで戻さない。
- search-growth候補の大量承認 — 週2件上限。現時点のapproved 1件を先に観測する。
- 本番デプロイ、R2 write、CDN purge、外部投稿 — 必要になった時点で別途承認を得る。

## 完了条件

- チェックは成果物・実測値・再現コマンドが揃った場合だけ付ける。
- WIPは Must 3件 + 着手中Should最大2件まで。新規着手時は1件閉じる。
- `node .claude/scripts/gsc/audit-operations-cycle.mjs --stage plan --week 2026-W34 --strict`
  が FAIL 0 であること。
- 未達は翌週へ自動加算せず、月次目標または優先順位を根拠付きで更新する。

## 参照

- 今月: [月間計画](monthly.md)
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W34.md`
- 改善: [改善バックログ](improvements.md)
- 機能: [バックログ](backlog.md)
- search-growth: `.claude/state/search-growth/{health,candidates}.json`
- GSC cycle audit: `.claude/state/metrics/gsc/operations-cycle-LATEST.md`
