---
title: 今週の計画
type: weekly-plan
week: 2026-W45
date: 2026-11-01
updated: 2026-11-01
status: active
tags: []
---

# 2026-W45 今週の計画

期間: 2026-11-02（月）〜 2026-11-08（日）。11 月の最初の週。
W44 の計画は書かれなかった (10-24 の W42 レビューのあと `/weekly-plan` が実行されなかった)。入力は W43 のレビュー
(`data/reviews/weekly/2026-W43.md`、11-01) と、10-28 のオーナー決定「11 月の重点」(`.claude/todo/monthly.md` の同名の節)。
11 月の月次計画はまだ無い。10 月の月次レビュー (期限 11-03) のあと `/monthly-plan` で書く。それまでは `monthly.md` の frontmatter が
10 月の重点 (管理・データ) のままなので、サイト・商品の Must には `docs:check` の DG077 (重点外の警告) が出る。

## 週

- **ISO Week**: 2026-W45
- **期間**: 2026-11-02 〜 2026-11-08
- **Sprint**: 2026-11 (月次計画は未作成。10-28 のオーナー決定を先に使う) の Week 1

## 前週の申し送り

W43 のレビューの「来週への申し送り」13 件を照合した。

| 申し送り | 振り分け | W45 での扱い |
|---|---|---|
| 認証付き計測の記録の push が専用 clone で拒否される件を直す | `MEASUREMENT-MAC-DIRECT-01` | **Must 1** (11-07 の土曜より前に直す) |
| KDP の再ログイン | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 |
| `SEO-TITLE-CTR-EFFECT-01` の `[target:]` (2 週目) | `SEO-TITLE-CTR-CLOSE-01` | **Must 2** に含める (improvement-triage への引き渡し) |
| Workers CPU の反映後 7 日の比較と引き渡し | `CF-CPU-SURGE-01` | Should 2 |
| KDP の販売台帳の自動記録 | `KDP-LEDGER-AUTO-01` | Should 3 (KDP の再ログインが済んだ週だけ) |
| 導線名なしの割合を反映後の窓で読み直す | `NAV-CLICK-COVERAGE-01` | Could 1 |
| note の回遊の error 24 件と商品カードの HTTP 403 | `NOTE-CIRCULATION-LINK-FIX-01` | Could 2 |
| W45 の計画を書く | 定常 | この計画 |
| 10 月の月次レビュー (期限 11-03) | 定常 | 定常 (11 月の月次計画も続けて書く) |
| 🔴 15 枚を上限 10 へ下げる | 定常 | 11 月の月次計画で行う。11-01 に完了済みの `MUNI-DATA-LICENSE-CHECK-01` を削除して 14 枚 |
| search-growth の上位 3 件の承認・却下 | 定常 | オーナー作業 |
| 実装計画 4 本に受け皿のカードが無い | 定常 | 見送り (今週の重点外。月次レビューで扱う) |
| X の投稿が 2 週続けて 0 件 | 見送り | 見送り (SNS は 2026-10-23 のオーナー判断で後回し) |

## 今月の重点（10-28 のオーナー決定より）

- **重点領域**: サイト・商品。市区町村 × GIS を軸に、打ち手は並行して試し、判定日の実測で配分を決める (打ち手の台帳 `data/business/experiments.json` の EXP-007〜012。どれもまだ proposed)。
- **サイト**: 県名×市区町村ランキング (10-28 公開済み。観測は `MUNI-PREF-RANKING-OBS-01`) → 子育ての市区町村ランキング `MUNI-KOSODATE-METRICS-01` → `MUNI-KOSODATE-PAGES-01`。
- **商品**: 製造品出荷額の加工済みデータを 1 商品売る。販売条件の確認 (`MUNI-DATA-LICENSE-CHECK-01`) は 10-28 に済み、次は `MUNI-DATA-PRODUCT-BUILD-01` → `MUNI-DATA-PRODUCT-SALE-01`。
- **今週この重点で進めること**: 県名×市区町村ランキングの効果観測を立てる (Must 2)、待機児童率を作る (Must 3)、製造品出荷額の組替の下調べ (Should 1)。

## 前週の振り返り（W43）

W44 の計画が無いので、W43 のレビュー (11-01) の結果をそのまま使う。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| データ品質ゲートを 100% に戻す `DATA-QUALITY-LOOP-01` | Must | 完了 | 10-30 の監査で 100.0% (2,459/2,459) |
| 🔴 先頭 2 枚の確認 `RELEASE-1125-MERGE-01` | Must | 完了 | 2 枚とも削除 |
| サイト内クリックの導線名 `NAV-CLICK-COVERAGE-01` | Must | 完了 | 被覆率 23.2% → 29.9% |
| Workers CPU の比較 `CF-CPU-SURGE-01` | Should | 未達 | ③④ が残る |
| KDP の販売台帳 `KDP-LEDGER-AUTO-01` | Should | 未達 | KDP が auth_required |

**パターン分析**: W43 は Must 3/3 だった (W41・W42 は未達)。Must を 1 週で届く大きさに切ったことが効いた。
一方で W44 は計画そのものが無く、10-26〜10-31 の作業 (市区町村 × GIS の企画、テーマページの作り直し) は計画外だった。
土曜の計測の記録が 2 週続けて消えていたことは、11-01 のレビューまで誰も気づかなかった。

## 現状サマリー

数値は W43 の計測 (`data/measurement-cycle/LATEST.md`、11-01 作り直し) による。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks (確定 7 日 10-16〜10-22) | 4,136 | 前 7 日比 +6.0% |
| ★ 検索クリック (GSC rolling28d) | 14,733 | 4 週前 (W39) 9,947、W52 目標 20,000 |
| ページビュー (GA4 Japan 確定 7 日 × 4 週) | 48,338 | W39 42,736、W52 目標 79,000 |
| 週次収益 (NSM) | 判定不能 | AdSense ¥210 (確定 7 日)。KDP (auth_required)・note が欠測 |
| ★ 計測の鮮度 | 10/11 (degraded) | kdp (auth_required)。記録の push 失敗の是正が前提 (Must 1) |
| ★ データ品質ゲート通過率 | 100.0% | 10-30 の監査 |
| 公開記事数 | 3 本 (W43) | sitemap の追随コミットによる |
| SNS 投稿 (W43) | Threads 14 / Instagram 8 / X 0 | SNS は後回し |
| GSC運用サイクル | FAIL (review) | `effect-target-ratchet`: `SEO-TITLE-CTR-EFFECT-01` の想定効果値の欠落。Must 2 で閉じる |
| KDP公開ゲート | measure | 下の節 |
| 県名×市区町村ランキング | 本番 470 URL | 11-01 に curl で確認 (`/municipalities/ranking/manufacturing-shipment-amount/23000` が 200・canonical は自分)。sitemap に 470 件 |

## トレンド機会

今回は Track E (はてな・Google News・Yahoo の RSS) を取得していない。今週の Must は 11 月の重点で埋まっており、時事の記事化は計画しない。

## 前週からの持ち越し

- [ ] **Workers CPU の比較と引き渡し** — 元: W43 Should 1 (`CF-CPU-SURGE-01`)
- [ ] **KDP の販売台帳の自動記録の確認** — 元: W43 Should 3 (`KDP-LEDGER-AUTO-01`)

## 改善ログ pending (今週着手対象)

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 2 | gsc | MUNI-PREF-RANKING-OBS-01 | effect/pending | 2026-11-26 | claude |
| 1 | adsense | ADSENSE-PLACEMENT-01 | pending | 2026-11-14 | claude |

`ADSENSE-PLACEMENT-01` は再開後 4 週のベースライン (W42〜W45) の最後の週で、配置は変えない。判定は 11-13 以降。

## 今週のタスク

### Must（絶対達成、3件）

- [ ] **土曜の認証付き計測の記録が develop に届くように直す** [S] — `MEASUREMENT-MAC-DIRECT-01`（🔴・管理領域・KPI `measurement-freshness`）。
  ガードレール KPI (計測の鮮度) を重点より先に直す。10-22・10-31 の 2 回、専用 clone の `git pull --rebase` が未コミットの変更で拒否され、
  次の段の `reset --hard` で記録が消えた (カードの 2026-11-01 観測)。
  ① 拒否の原因になった追跡ファイルを特定する (clone で収集の一部を手で回し、`git status` を取る。推測で直さない)
  ② `scripts/scheduled/measurement-collect-local.sh` の pull を失敗しない形にし、失敗したら次の段の `reset --hard` の前に止めてログに残す
  ③ 単体の確認 (bash の構文検査と、未コミットの変更がある clone での手動実行) を 11-06（金）までに済ませる。
  11-07（土）の朝に develop に「(Mac)」の記録コミットが入り、`npm run measurement:status` で stale が出なければ完了。
  **途中経過 (2026-11-01)**: ①② 済み。原因は 2 つ (収集の段は A8・楽天・note の取得が clone の追跡ファイルを書き換えて pull が拒否、週次監査の段はキーチェーンの古いトークンで push が拒否)。共通の `push_clone_records` (`scripts/scheduled/_common.sh`) で直し、手元の bare リポジトリで成功と失敗の経路を確かめた (`ef186fe02`)。残りは 11-07 の本番の確認。
- [x] **県名×市区町村ランキングの効果観測と、title の効果観測の目標値を improvement-triage へ渡す** [S] — `MUNI-PREF-RANKING-OBS-01` / `SEO-TITLE-CTR-CLOSE-01`（サイト領域）。
  県別ページは 10-28 の PR #1193 で本番に入り、470 URL が sitemap にある (11-01 確認)。残りは公開後 4 週の観測なので、backlog から improvements の別 ID へ引き渡す。
  **結果 (2026-11-01)**: improvement-triage が `MUNI-PREF-RANKING-OBS-01` (`[kpi: search-clicks]`・期日 11-26) を起こし、基準値 (公開前 28 日の県別 URL 0 件、公開直後 10-28〜29 の県別 190 URL で 45 click / 1,223 imp。`gsc-query.mjs`) を詳細ログに書いて、元のカードを削除した。
  `SEO-TITLE-CTR-EFFECT-01` は根拠のある `[target:]` を置けない (過去の title 差し替え 2 件は effect/none) ため、判定不能として improvements から外した。
  GSC 運用サイクルの `effect-target-ratchet` は確定済みの W43 の判定記録を読むので FAIL が残る。閉じた施策の台帳への登録はオーナー判断なので `SEO-TITLE-CTR-CLOSE-01` (🟣) へ渡した。
- [ ] **待機児童率の市区町村指標を作り、R2 反映の承認依頼を出す** [M] — `MUNI-KOSODATE-METRICS-01`（🔴 2 番目・データ領域）。
  こども家庭庁「保育所等関連状況取りまとめ（令和7年4月1日）」の参考 Excel (カードに URL・シート・列を記録済み) から、
  待機児童率 (待機児童 ÷ 申込者、0 を除いて順位) の metric を `fetcherKey: "manual"` と provenance 9 点セットで作り、取り込みスクリプトを書く。
  県名＋市区町村名の結合で 1,741 行がそろい、待機児童のいる自治体 211・合計 2,254 人が公表値と一致すること。
  型と単体テストが通り、dryRun の結果を添えて R2 反映の承認依頼をオーナーへ出していれば完了。R2 への反映はオーナーの承認後で、完了条件に含めない。
  使用: data-ingester、`.claude/rules/data-provenance-standards.md`

### Should（できればやる、3件）

- [x] **製造品出荷額の組替の下調べ (①②)** [M] — `MUNI-DATA-PRODUCT-BUILD-01`（商品領域）。
  ① `cities.json` と `manufacturing-shipment-amount` の値が今の境域にそろっているか、合併前の値をどう扱っているかを確かめ、似た指標 `manufacturing-shipment` との違いを書く
  ② 境域の基準日と、合併した市町村の過去の値を合算する組替表の出典 (総務省の合併の記録) を決める。CSV と GeoJSON の作成 (③以降) は W46。
  ①② の結果がカードにあれば完了。成果物は repo に置かない。
  **結果 (2026-11-01)**: 元データ (SSDS) が既に合併後の境域へ組み替え済みで、組替表は要らない。2 指標 (`-amount` と `manufacturing-shipment`) は R2 で値が全く同じだった (`MUNI-DATA-DEDUP-01` を起票)。詳細はカード。
- [ ] **Workers CPU の反映後 7 日を比べ、効果観測を引き渡してカードを閉じる** [S] — `CF-CPU-SURGE-01`（🔴・管理領域・不具合・KPI `operating-cost`）。
  W43 から持ち越し。③ 反映後 7 日 (10-17〜10-23) の 1 件あたりの CPU と `_rsc` の割合を反映前と並べる ④ `[kpi: operating-cost]` と根拠つきの `[target:]` を付けた別 ID で improvement-triage へ渡し、カードを閉じる。
  **途中経過 (2026-11-01)**: ③ の 1 件あたりの CPU は反映前 2 日 555 ms → 反映後 7 日 681 ms で下がっていない。反映前の窓が 2 日しか無く、効果は判定できない。`_rsc` の割合は Observability で取り直す (検証期日 11-14)。④ は根拠のある目標値が置けず行っていない。
- [ ] **KDP の月次売上が販売台帳へ自動で入ることを確かめて閉じる** [S] — `KDP-LEDGER-AUTO-01`（管理領域）。
  KDP の再ログイン (オーナー作業) が 11-07 より前に済んだときだけ行う。11-07 の計測のあと `npm run products:sales --workspace=@stats47/product-factory -- validate` が PASS し、
  KPI ツリーの `paid-purchases` の KDP 分が判定不能でなくなっていればカードを閉じる。再ログインが無ければ W46 へ送る。

### Could（余力があれば、2件）

- [x] **導線名なしの割合を 10-19 の反映後だけの窓で読み直し、次の部品を選ぶ** [S] — `NAV-CLICK-COVERAGE-01`（管理領域）。
  W43 の 60.5% は rolling 28 日で、反映前の日を含む。`gsc-query.mjs` / `ga4-query.mjs` の read-only 照会で 10-20 以降の 7 日を取り、上位の行き先 (ranking・geo・municipalities) の部品を 1 つ選ぶ。
  **結果 (2026-11-01)**: 10-20〜10-31 の `nav_click` 8,794 件のうち導線名なし 51.5% (W41 53.9%)。行き先の上位は ranking 1,247・geo 1,085・municipalities 730。次は geo への導線 (部品は未特定)。
- [x] **note の回遊の error 24 件の置換案を作る** [S] — `NOTE-CIRCULATION-LINK-FIX-01`（SNS 領域・不具合）。
  公開済み記事の本文を変えるのは note への外部変更なので、置換案をオーナーに見せるところまで。商品カードの HTTP 403 6 件は、次の土曜の監査で再発したら原因を調べる。
  **結果 (2026-11-01)**: リンク切れ 13 件の置換案をカードの表にした (置換先は本番で 200 を確認)。意味が変わるおそれのある 4 件とホテルの記事 1 件はオーナーの確認が要る。

### 定常

- 11-03（火）までに 10 月の月次レビューを書き、続けて 11 月の月次計画 (`/monthly-plan`) を書く。🔴 14 枚を上限 10 へ下げ、起票 30 日超の未着手 4 枚 (`DATA-QUALITY-LOOP-01`・`AUTH-CREDENTIAL-REGISTER-01`・`NAV-CLICK-COVERAGE-01`・`CF-CPU-SURGE-01`) の扱いを決める。10 月の重点 (管理・データ) の残りの扱いもここで決める (10-28 のオーナー決定)。
- 11-07（土）: 土曜ランナー (02:00 の計測・07:00 の Mac の認証付き計測と週次監査) のあとに `/weekly-review 2026-W45` を書き、続けて `/weekly-plan 2026-W46` を書く。
  W44 のレビューは計画が無い週なので書かない (W45 のレビューで 10-26〜11-01 の作業をまとめて扱う)。
- ブログの是正キューと新規キューは今週の Must にしない (重点は市区町村 × GIS)。是正キューの上位は `konbu-consumption-prefecture-gap`・`semiconductor-electronics-regional-map`・`outpatient-rate-prefecture-gap` (11-01 に再生成)。

## オーナー作業

- **`AUTH-CREDENTIAL-REGISTER-01`**: KDP の再ログイン (10-22・10-31 とも auth_required)。11-07 の土曜の計測より前に済ませてほしい。
- **`MUNI-RANKING-EXPANSION-01`**: 子育ての 2 指標 (保育所まで 500m 未満の子育て世帯の割合・小学校まで 1km 未満の世帯の割合) の R2 取り込みの承認。Must 3 の待機児童率と合わせて 1 回にしてもよい。
- **search-growth の上位 3 件** (`/ranking/food-self-sufficiency-rate-calorie`・`/blog/roadside-station-count-prefecture-gap`・`/survey/care-service-facility-survey`) の承認か却下。
- **`ADSENSE-FIXED-UNITS-01`**: AdSense の管理画面で 300×250 固定の表示広告ユニットを 2 つ作る。
- **アラート Issue 4 件** (#1015・#1014・#1145・#1144) への振り分けのコメント (GitHub への書き込みなので、内容を決めてもらってから行う)。
- **push**: 作業ブランチ `feature/stat-tile-ledger` のテーマのコミット 3 件と、W43 のレビュー・取り戻した計測の記録。push は指示を待つ。

## KDP公開ゲート

- **判定**: `measure`（`data/products/kdp-weekly-publication.json`、2026-W45 で再生成）
- **候補**: なし
- **需要証拠**: 販売数/KENP は K-S1-01〜12 すべて未計測。0 需要ではない
- **停止条件**: KDP の販売数/KENP を台帳へ記録できるまで新規公開しない (`KDP-LEDGER-AUTO-01`)
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- active は EXP-006 1 件。EXP-007〜012 (市区町村 × GIS の打ち手) は proposed のまま。今週の Must 2・3 と Should 1 が EXP-008 と EXP-007 の前提を進める。
- `/nsm-experiment propose` は実行していない。10-28 のオーナー決定で打ち手の台帳が既にあり、新しい候補を足さない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1 は計測の記録が 2 週続けて消えた不具合の是正で、直さないと 11-07 の計測も消える。Must 2 は公開済みのページの観測を立てる作業で、
> 新しいコードは書かない。Must 3 は子育ての市区町村ランキング (EXP-008) に足りない唯一の指標で、11 月の重点のサイトの道筋に乗る。
> 商品 (EXP-007) は Should に置いた。組替の下調べは 1 週で終わる大きさに切ったが、組替表の出典次第で M を超えうる。

> **先週と同じ失敗を繰り返していないか？** W44 は計画が書かれず、作業は計画外で進んだ。今週はレビューと計画を同じ日 (11-01) に書いた。
> Must は 3 件で、W43 と同じく 1 週で届く完了条件に切った。持ち越しは 2 件 (どちらも Should) で、KDP の方は再ログインが無ければ W46 へ送ると決めてある。

> **今週でなければ意味がないことは？** Must 1 は 11-07 の土曜の計測より前に直す必要がある。10 月の月次レビューの期限は 11-03。
> `ADSENSE-PLACEMENT-01` のベースラインは W45 で 4 週がそろい、判定は 11-13 以降。

## 関連ドキュメント・施策

- 前週レビュー: `data/reviews/weekly/2026-W43.md` (W44 のレビューは無い)
- 11 月の重点: `.claude/todo/monthly.md`「11 月の重点（2026-10-28 オーナー決定）」
- 週次 snapshot: `data/nsm/weekly-snapshots/2026-W43.json`、計測サイクル `data/measurement-cycle/LATEST.md` (W43)
- backlog: `MEASUREMENT-MAC-DIRECT-01` / `MUNI-KOSODATE-METRICS-01` / `MUNI-DATA-PRODUCT-BUILD-01` / `CF-CPU-SURGE-01` / `KDP-LEDGER-AUTO-01` / `NAV-CLICK-COVERAGE-01` / `NOTE-CIRCULATION-LINK-FIX-01`
- 改善施策: `MUNI-PREF-RANKING-OBS-01` / `ADSENSE-PLACEMENT-01` (`SEO-TITLE-CTR-EFFECT-01` は 11-01 に外した。判断待ちは `SEO-TITLE-CTR-CLOSE-01`)
- 打ち手の台帳: `data/business/experiments.json` (EXP-007・EXP-008)

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
