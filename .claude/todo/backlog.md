---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-09-21
---

# バックログ (タスクマスタ)

> **役割**: 優先度・時期を問わず「未完了タスクの全量」を保持するマスタ。カード構文・タグ語彙の
> 正典は `.claude/rules/todo-standards.md` (doboku-note と統一の v3-unified スキーマ)。
> **完了したカードはセクションごと削除する** (記録は git 履歴。完了サマリを本ファイルに書かない)。
> stats47 では backlog-loop (CI 日次) が処理するため **ID (`### [ID] タイトル`) を必ず付ける**。
> 行削除は gate 証拠が ledger に要る (`.claude/rules/backlog-loop.md`)。

各カードは `### [ID] タスク名` の直下に `タグ:` 行を置く (機械読取り):

```
タグ: [カテゴリ] [種類:X] [実行:X] [検証:cmd] [起票:YYYY-MM-DD] [期日:YYYY-MM-DD] [進行中]
```

## 🔴 高 — 今月中に着手したい

### [DATA-VALUE-ERRORS-01] 公開中の誤った値・誤った表記を全指標で洗い出し、早急に直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **オーナー判断 (2026-09-25 壁打ち)**: 誤った値は**非公開にせず、すべて早急に直す**。対象は全指標 (2,603 metric)。
  見つける手段は `DATA-QUALITY-LOOP-01` の機械チェックで、このカードは「見つかった誤りを直す」側を持つ。
- **既知の誤り**: `elderly-single-person-households` (国勢調査由来・10 月 1 日時点の「年」) が `yearFormat: "fiscal"` のため
  本番で「2005年度」と表示されている (`curl -s https://storage.stats47.jp/app/ranking/elderly-single-person-households/values.json | grep -o '"yearName":"[^"]*"' | sort -u`)。
  同じ SSDS (社会・人口統計体系) の時点統計で同じ設定の metric が他にもある可能性が高い (未確認)。
- **誤りの定義**: 一次資料と値が合わない / 単位の誤り (`.claude/rules/unit-semantics-standards.md`) / 年・年度の表記の誤り /
  47 都道府県の欠け / 順位の不整合。「古いだけ」は誤りではなく `DATA-QUALITY-LOOP-01` の基準 2〜4 で扱う。
- **次**: ① `DATA-QUALITY-LOOP-01` の年表記チェックで対象を列挙する。② 需要 (GSC 表示) の多い順に config を直し、
  values を再生成して R2 へ反映する (R2 反映は承認後)。③ 代表 URL で表示を確認する。
- **完了条件**: 機械チェックが検出した誤りが 0 件になり、直した metric の本番ページで値・単位・年表記が一次資料と一致する。
- **全面点検で見つかった表示上の誤り (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 単位の誤り: 県データブックの人口密度が「人」/ 合計特殊出生率に「(人)」/ 「外国人 (10万人比)」の単位が「人」、`/category/population` で「東京都 1,393.4人」/
    道路実延長 (1km² 当たり) の単位が「km」(`/category/landweather`・`/survey/census`) / `/japan/education-culture` の「図書館数 27 館」「小学校数 15.31 校」に分母 (人口当たり) の表示が無い。
  - 年の表記: 総人口 (10 月 1 日時点) が「2024年度」、人口推移の横軸が「1975年度」(国勢調査は時点の「年」)。
  - 値の食い違い: 東京都の人口が県ページで 13,463,000 人 (年の表示なし)、人口動態ページで 14,178,000 人 (2024 年)。
  - 定義の不足: 「平均余命 25.44 年」が何歳時点か書かれていない (沖縄県ページ)。市区町村ランキングの説明が「都道府県内に所在する中学校の総数」。
  - 「全国平均」が 47 都道府県の単純平均 (ランキング全般)。`/survey/census` の「最新 2024 年」(国勢調査の最新回は 2020 年)。

### [CYCLE-HEALTH-01] 「検出 → 起票 → 計画 → 実行 → 完了 → 振り返り」のサイクルを各段の停滞信号つきで確実に回す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:計測]

- **オーナー指示 (2026-09-25)**: バックログの改善・週次レビューで新しいカードが増え、配線し、改善を繰り返す。このサイクルを確実に回す。
- **現状 (2026-09-25 実測)**: 部品はある (週次監査・`/weekly-review`・`/weekly-plan`・`/monthly-plan`・日曜計測→月曜無人 triage→週次メトリクス Issue・
  戦略レーン検査 DG073〜078)。起票も活発 (backlog.md の変更コミットは直近 1 か月で 251 件)。止まっているのは段と段のつなぎ目:
  1. **検出 → 起票が切れている検出器がある**: 年カバレッジ監査の要拡張候補 87 件はカードにならないまま残る。
     一方、週次 UI 検査は起票まで自動で回っている (2026-09-24 の指摘 6 件は同日に `UI-FIX-*` 3 枚として自動起票され、
     9/24〜25 に全件 fixed。`.claude/state/page-quality/ui-findings-queue.json`)。検出器ごとに差がある。
  2. **計画 → 実行が切れている**: 週次 Must は 5 週連続未達 (W38 は 0/3)。W35 は計画 2 本に対して 85 本公開。
  3. **完了の判定が閉じない**: `improvements.md` の Due 超過 15 件 (docs:check DG054)、効果判定エンジンは GSC 施策 10 件中 0 件しか判定できない。
  4. **カードが現実とずれる**: 実装済みなのに「未コミット」のカード、前提が解消済みの `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01`、
     完了済み ID (`AFF-MEASURE-RECOVER-01`) を参照し続ける週次計画。backlog の Due 超過 5 件・起票 60 日超 11 件。
- **設計 (各段に「止まったら見える信号」を 1 つ置き、新しい仕組みは作らず既存の週次メトリクス Issue と管理画面 `/strategy/lanes` に出す)**:
  | 段 | 信号 (機械で数える) | 既存の置き場 |
  |---|---|---|
  | 検出 → 起票 | 検出から 7 日たってもカードに結ばれていない指摘の件数 (年カバレッジ・GSC coverage・効果判定。UI 確認は自動起票済みの基準例) | 自動起票は `coverage-backlog.mjs` / `ui-findings.ts` の形にそろえる |
  | 起票 → 分類 | レーン・tier・種類が無いカード (DG058/059/075) | docs:check |
  | 分類 → 計画 | 重点レーン外の Must・凍結レーンの作業 (DG076〜078) | docs:check・`/strategy/lanes` |
  | 計画 → 実行 | 週次 Must の達成率と連続未達週数。2 週連続未達のタスクは分割か降格を必須にする | `/weekly-review` |
  | 実行 → 完了 | Due 超過 (DG054)・判定できない効果測定・完了済み ID を参照する計画 | docs:check・効果判定エンジン |
  | 振り返り → 起票 | 週次レビューの「次週への申し送り」がカード ID に結ばれているか | `/weekly-review` |
- **関連カード (個別の段の実例。ここで重複実装しない)**: `UI-REVIEW-LOOP-VERIFY-01` (UI 確認→起票)、`DATA-QUALITY-LOOP-01` (データ監査→起票)、
  `EFFECT-TARGET-MARKERS-01` (完了の判定)、`STRATEGY-FOCUS-2026-10-01` (計画の枠)。
- **①③ 済 (2026-09-26・未コミット)**: `.claude/scripts/metrics/lib/cycle-health.mjs` が分類漏れ・期日超過・Must の連続未達・完了済み ID を参照する計画を数え、
  週次メトリクス Issue の「🩺 サイクルの健全性」表に出す (テスト `cycle-health.test.mjs`)。検出 → 起票と振り返り → 起票は「未計測」と明示。
  `/weekly-plan` に「連続未達 2 週以上は分割か降格・完了済み ID を残さない」、`/weekly-review` に「Must N/M の書式・申し送りに ID」を追記。
  初回実測 (W39): 分類漏れ 1/118、期日超過 5、W38 まで連続未達 2 週、完了済み参照 0 (`AFF-MEASURE-RECOVER-01` は ledger に完了記録が無いため数えない)。
- **② 済 (2026-09-26・未コミット・オーナー判断「自動起票を既定」)**: 年カバレッジ監査の要拡張候補を GSC カバレッジと同じ形で自動起票する
  (`.claude/scripts/data/sync-year-coverage-backlog.mjs`。1 枚 10 件・開いているカードは 1 枚・gate `assert-year-coverage-batch.ts`・
  週次 workflow `estat-year-coverage-audit-weekly.yml` に配線)。初回カード `YEAR-COV-20260926` を起票済み。
  健全性表の「検出 → 起票」行は検出器ごとの残件とカードの有無を出す (残件ありでカードなし = 起票が止まっている)。
- **次 (残り)**: 「振り返り → 起票」の行を実数にする (週次レビューの申し送りに ID が付いているかを数える)。
  他の検出器 (ranking-integrity・provenance・`/audit-units`) の自動起票は `DATA-QUALITY-LOOP-01` ①② で同じ形に寄せる。
- **旧・次**: ① 週次メトリクス Issue (`generate-weekly-metrics-issue.mjs`) に「サイクルの健全性」節を足し、上表の 6 信号を毎週出す。
  ② 検出器ごとに「指摘 → カード」の結び方を決める (自動起票か、週次レビューでの手動起票か)。③ `/weekly-review` と `/weekly-plan` に
  「2 週連続未達は分割か降格」「完了済み ID を計画に残さない」を入れる。
- **完了条件**: 週次メトリクス Issue に 6 信号が 4 週続けて出て、検出 → 起票の未結び件数と Due 超過が減り、Must の連続未達が 2 週以内に解消されている。

### [THREADS-TOPUP-01] Threads の予約を 10/31 分まで補充する (同時 25 件の上限)

タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue --limit 1 --dry-run] [起票:2026-09-23] [期日:2026-10-20] [レーン:SNS]

- **owner**: x-strategist
- **現状 (2026-09-23)**: Threads は Playwright で Threads Web の予約機能を使う (`/publish-threads`)。9/24〜10/31 の 76 件を posts.json に platform=threads の下書きとして作り、9/24〜10/6 の 25 件を予約済み。Threads の予約は同時 25 件までで、残り 51 件 (10/6 夕方〜10/31) は draft のまま。
- **次**: ①オーナーが launchd に補充ジョブを登録する (`cp scripts/scheduled/com.stats47.threads-topup.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.stats47.threads-topup.plist`)。以後は 09:30 / 21:30 とログイン時に空き枠だけ自動で入る (スリープ中の回は起床時)。②公開済みの確認は `sns-verify-threads-posted.yml` (CI・毎晩) が台帳を posted + permalink にする。schedule は main にある workflow しか動かないため、次の develop→main で有効になる (それまでは `node .claude/scripts/sns/verify-threads-posted.cjs --apply` を手で実行)。
- **完了条件**: 10/31 分まで Threads 側で予約済みになり、posts.json の threads draft が 0 件。

### [AUTHENTICATED-MEASUREMENT-ACTIVATION-01] 認証付きCIの日次継続運用を実証する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:npm run measurement:status -- --check] [起票:2026-09-21] [レーン:計測]

- **owner**: オーナー（初期/期限切れ認証）/ devops-runner（CI検証・release・鮮度監視）
- **配信後検証**: 独立post-deploy smoke `35602527517`（main `f199eb2e0`）もhealth / Playwright / cache warmingを含め成功。本番 `/`・`/geo`・`/ranking`・`/themes/population-dynamics` のHTTP 200を別途確認。これは配信の検証であり、下記の認証付き収集・定期起動の未完了を解消しない。
- **保護機構の本番反映（2026-09-21）**: PR #1005は24 checks PASSで21:45 JSTにmain `f199eb2e0`へmerge。Deploy `35601436791`は本番配信・route smoke・sitemap検査まで成功し、main→developを同期済み。手動のhealth `35601845511`では認証待ち3sourceとnote欠測を正しく表示し、Issue #763を更新。補完判定は6時間猶予前のため`dispatch:false / schedule_not_overdue`（実POSTは未検証）。実scheduleは引き続き0件で、手動healthやpushの成功を定期起動実績に数えない。別系統のcron異常5件（Gemini HTTP402、backlog削除ledger gate、OGP原稿404/metadata、出典URL timeout、note回遊不整合）は横断監視Issue #763に残存し、監視自身を含む6件の異常を無視して全体正常とはしない。
- **最新の継続運用検証（2026-09-21 21:34 JST）**: run `35599663715`（push、実装`0a0a20f53`）はafb/GSC/ココナラPASS、A8/もしもは新たに`auth_required`、KDPは`collectionAttempted:false`で同じ拒否済み世代への再接続をせず待機。noteは285/286件・合計/終端一致・`inventoryAvailable:true`だが全件は`report_incomplete`のまま。record stepとgit書戻しは成功（`a303fb0a8`）、警告stepは意図どおり失敗しIssue #1000をOPENで更新。全7sourceのgit/private R2成否・時刻・新フラグ・証跡SHAが一致。note棚卸し復元は286行/欠測1/null/全行baseline不可/mode0600を確認し、通常復元はexit1を維持した。関連106 Node+6 Pythonテスト、全25workspace+8script型検査、19プリフライトとdevelop品質CI `35599663735`はPASS。
- **継続運用の保護契約**: schedule予定+6時間の未発火検知、既存healthから予定枠のSHA比較予約を伴う最大1回の補完起動、拒否済み本人認証世代の再接続停止、note棚卸し専用復元を実装。保護機構はmainへ反映済みだが、A8/もしも/KDPの継続認証、実schedule/補完起動の翌日継続、全collector成功は未完了。GitHub基盤全体の停止は同基盤の監視では検知保証できない。本人再認証を例外として許容する運用目標は2026-09-21にオーナー承認済み（恒久契約は[Playwright認証プロファイル](../../docs/01_技術設計/07_Playwright認証プロファイル.md)）。承認はA8/もしも/KDPの認証復旧を意味せず、本人再認証の実施・継続取得の検証は未完了。有料常駐基盤・外部問い合わせは別途承認を要する。
- **先行検証（同日夕方まで）**: 成否の正典は`.claude/state/metrics/authenticated/latest.json`。KDPは無人継続が未成立。run `35561887453` attempt 8は追加本人ログイン無しで出版状態・日次・月次取得とprivate R2保存/認証更新に成功したが、その後ローカルbrowser/probeを挟まないattempt 9はReportsで`auth_required`。通常Chrome 152.0.7977.82で比較したattempt 10（`2026-09-21T07:45:15.078Z`、evidence SHA `adab37db6ff59ed66717b5cc5bda72f7dbf82127be24af2078ab088143688ab8`）も同じ失敗だった。両方とも30秒待機後の実画面は`www.amazon.co.jp/ap/signin`・password欄表示あり。待機不足やChromium/Chromeの違いだけでは説明できず、比較用のbrowser変更は戻した。Cookie24件の欠落・期限切れは無く、同一stateはローカルheaded環境で成功したが、提供元が再認証を要求する条件は未確定。固定環境が必要/十分とも断定しない。最新restoreの拒否・Issue #1000の自動更新と、8月の月次原本SHA再検査/再解析/履歴restoreは確認済み。当時main反映は継続認証の検証まで保留した。noteは285/286件・全ページ/合計一致・`report_incomplete`。独立監視Issue #763も継続し、全cron正常とはしない。
- **初回schedule未確認（2026-09-21 19:02 JST）**: 18:20予定の実行はAPI `actions/workflows/authenticated-measurement.yml/runs?event=schedule`で`total_count:0`。workflow `362957799`はactive、default branchはmain、mainのcronは`20 9 * * *`で、main反映は同日14:46 JSTに済んでいる。最新runは引き続き`35561887453`・event=`push`・attempt 10であり、定期実行の成功証拠に流用しない。record job `106253312558`は記録step成功・警告step失敗。developの最新記録（generatedAt=`07:46:36.641Z`）とprivate R2は全7sourceのrun ID/attempt/observedAt/status/code/quality/evidence SHAが一致した。取得済み5sourceはpass、KDPとnoteは上記失敗のまま。未観測の理由は未確定で、遅延/起動停止のどちらとも断定しない。予約した単発確認は実施済みとして停止し、実schedule起動の受入条件は未完了で保持する。
- **未解決の証拠（2026-09-21）**: noteは同じ13:55 JST集計でも、2026-01-20〜09-20では286/286件・全合計一致・カバー結合PASS、08-24〜09-20では285/286件・全合計一致となる。欠落記事は公開中で、長期窓では表示される。Chrome実画面でインプレッション順に変更して全15ページを表示しても285件・同じ記事が欠落し、末尾に「もっとみる」は無い。期間依存の非表示まで確認できたが、非表示を0とする公式仕様は確認できず、短期窓の値はnullのまま保持する。再現入力は既存`note:metrics:fetch`の`--start`/`--end`、私有証跡は`.local/authenticated-measurement/note-{wide,current}-period/`。問い合わせ先: [note公式窓口](https://www.help-note.com/hc/ja/requests/new)。質問は「公開記事n99561600d4feが同一集計時刻の短期窓だけ一覧に無い。指標が全て0の期間に行を非表示にする仕様か、取得不具合か」。問い合わせ送信はオーナーの承認後。
- **次（実行順）**: ①KDPは本人ログイン→初回成功の反復やCookie加工で回避しない。提供元への無人取得可否/再認証条件の確認、または専用クラウド環境で本人認証から連続取得まで行う比較検証のどちらに進むかをオーナーと決める。問い合わせ送信・環境新設・常駐費用は承認後。専用環境は解決保証ではなく検証案であり、このPUBLIC repoに個人Macをself-hosted runner登録しない（[GitHub公式の安全要件](https://docs.github.com/en/actions/reference/security/secure-use)）。保護機構のmain反映と全取得元の無人継続運用完了を分け、後者は更新sessionの連続再利用と定期起動を実測して判定する。②noteの上記非表示仕様を提供元へ確認し、回答を根拠に収集契約を更新する（無断の問い合わせ送信・0埋めはしない）。③実schedule runが現れた時点で各source・record・develop/private R2の整合を再確認する。未観測の間はActions履歴・設定・公式障害情報で原因を調査し、手動dispatchを定期起動の代用にしない。48時間鮮度監視も別に確認する。KDP月次収益を週次へ按分せず、入金・手数料・税の帰属が未確認ならsales-ledgerへ入れない。afbは承認済み`AFB_API_KEY` Secretを使用し、Cookie移送の再ログインを反復しない。
- **アフィリエイト週次への波及（2026-09-24 確認）**: `affiliate-ga4-weekly.yml`のscheduled run `35639065973`（2026-09-21T18:32Z）はfailureだった。GA4取得・R2 read-back・履歴commit-backはsuccessしたが、operations state stepの`restore.mjs moshimo --if-activated`が`unavailable`を返し、measurement gateもfailureとなってIssue #1007がOPENのまま残っている。つまりA8・もしもの再認証が完了するまで、アフィリエイト週次は毎回failureになり、週次収益（NSM）のアフィリエイト確定額は判定不能のまま続く。GA4側の計測経路自体は復旧している。
- **完了条件**: 全collectorの実データ取得・private R2 read-back・git記録の整合・認証付き計測Issueの復旧closeが成立し、本人の再認証を挟まない別日付のmain scheduleで連続2回以上確認する（恒久的な無人保証とはしない）。noteの欠落は不完全のまま原因を区別し、カタログ削除/0埋めで通さない。サイト全体の放置運用判定は、このカードだけでなく横断監視Issue #763の別系統異常の解消も必要。
- **停止条件**: 2FA/CAPTCHA/規約同意を自動化しない。Cookie/APIキーをgit/ログ/artifactへ出さない。KDPの速報売上/KENPを確定ロイヤリティや週次純収益へ代入しない。afbの発生日/確定日系列を合算せず、API報酬を純収益・入金へ代入しない。出版/提携状態の成功を全計測完了と言わない。自動投稿/申請/振込/商品変更は範囲外。

### [AFF-INTENT-FALLBACK-STOP-01] 意図が解決しない面への配信を止め、priority を期待収益順にする

タグ: [収益化] [種類:改善] [実行:対話] [検証:node .claude/scripts/metrics/check-revenue-guards.mjs が exit 0] [起票:2026-09-20] [期日:2026-10-04] [レーン:収益導線]

- **owner**: affiliate-manager
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §3.2 / `.claude/rules/affiliate-ads-standards.md` §6.1
- **背景（2026-08-10〜09-06 実測）**: `resolveContentVerticalChain`（`affiliate-category.ts:415`）は
  tags が 0 件のとき `CATEGORY_AFFILIATE_MAP` の 17 軸写像へ落ちる。この粗い写像が economy への
  集中（約 7,400 imp / 2 clicks）を作っている。一方で意図が解決した vertical は housing 0.299%
  (334 imp)・mobility 0.340% (294 imp) と全体 0.049% の 6〜7 倍だが、標本がクリック 1 件ずつなので
  **[仮説]** の域を出ない。これを検証する。
- **やること**: ①`affiliate-category.ts:415` の `push("category", …)` と `:443` の `byCategory` 分岐を
  削除し、鎖を explicit → survey → tags のみにする。②`AffiliateAdSlot.tsx:79` の暗黙フォールバックを
  塞ぎ `vertical` を必須 prop にする。③priority を期待収益順（`epcYen × confirmRatePct / 100`、
  出典 `.claude/state/ads/a8-catalog.json` の登録済み 118 件）で vertical ごとに振り直す。
  `AFFILIATE_DELIVERY_HOLDS` と blocklist を先に確認し、health 軸の不適合案件を上位へ出さない。
- **[target: CTR +0.10pt 以上（0.049% → 0.15%）]** 根拠: 意図解決済み vertical の観測 CTR 0.30% と
  現状 0.049% の中間。`epcYen` は A8 のプログラム平均で自サイト実績ではないため、priority の初期値
  としてのみ使い、自サイトの確定収益が溜まったら置き換える。
- **境界**: 枠数は変えない（それは `AFF-SLOT-REDUCTION-01`）。同じデプロイに混ぜると
  「どの広告を出すか」と「いくつ出すか」のどちらが効いたか分離できない（収益化戦略 §7）。
- **停止条件**: フォールバックを止めると広告が消えるランキングが出る（`MetricConfig.tags` 未記入の
  ページ）。消えた面の件数を計測し、tags の補完で戻せるかは別カードにする。14 日後に CTR が 0.10% に
  届かなければ仮説を棄却し、広告レーンへの追加投資を止めて商品レーンへ寄せる。
- **観測例 (2026-09-25 localhost)**: `/ranking/natto-consumption-expenditure` の本文に「1位 福島県の人気返礼品」(桃・ふるさと納税) が出る。
  納豆の支出のページで、1 位の県の返礼品を出す地域軸の配信が、読者の意図 (納豆・食品) と合っているかを本カードの判断に含める
  (右レールには納豆の楽天商品が別に出ている)。

### [AFF-SLOT-REDUCTION-01] 表示量を減らして視認される位置へ寄せる

タグ: [収益化] [種類:改善] [実行:対話] [検証:GA4 の affiliate impression / pageview が 0.5 未満] [起票:2026-09-20] [期日:2026-10-18] [レーン:収益導線]

- **owner**: affiliate-manager
- **背景（2026-08-10〜09-06 実測）**: 表示 / PV は全体 0.76、デスクトップ 0.84、blog は 1.24。
  にもかかわらずデスクトップ CTR は 0.0197%（20,325 imp で 4 clicks）でモバイル 0.137% の 7 分の 1。
  面別では article-end 0.195%（512 imp）・home-left-rail 0.654%（153 imp）に対し、
  ranking-native 0.030%・blog-sidebar 0.038%・ranking-sidebar 0.043%。**本文内が効き、レールが効かない。**
- **やること**: `BLOG_IN_BODY_BANNER_COUNT` 4 → 2、blog サイドバー 2 枚 → 1 枚、
  `RankingPageNativeAffiliateSection` を ranking から外して本文枠を ranking-incontent 1 件に統一、
  `RankingPageSidebarSection` の `bannerLimit` 2 → 1、`load-ranking-page-model.ts` の解決件数 8 → 2。
  デバイス分岐は新設しない（削減対象は既に `hidden lg:block` 等でデスクトップ偏重のため）。
  同じデプロイで `injectAdSlots`（`md-content.tsx`）も撤去する。AdSense 恒久停止で何も描画しないが、
  除去は本文の挿入位置に影響するので枠数変更とまとめて 1 回で測る。
- **[target: 表示/PV 0.76 → 0.5 未満]** 根拠: blog の 1.24 は 1 PV に 1 枚以上で過剰。
- **前提**: `AFF-INTENT-FALLBACK-STOP-01` のデプロイから 7 日以上空けて出す（交絡回避）。
- **停止条件**: 表示を減らすと短期的には表示も収益も下がる。「減らしたら減った」を効果なしと
  誤判定しないよう、判定指標は CTR と確定収益 / 1,000 viewable impression に固定する。

### [CONTENT-PAINPOINT-PUBLISH-01] 悩み起点ブログ5本の公開とSNS展開を完了させる

タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:curl -sI https://stats47.jp/blog/nursery-shortage-urban-prefecture が200を返す] [起票:2026-09-16] [期日:2026-09-30] [レーン:SEO・ブログ]

- **背景**: 統計そのものより「悩み・不安」起点の記事がSEOに効くという仮説で、白書(NotebookLM)調査+note/X調査の両方で裏付けが取れた5テーマを記事化した。5本とも `quality-gate.mjs` / `article-factual-check.mjs` / blog-critic すべて PASS 済み (`docs/21_ブログ記事原稿/{nursery-shortage-urban-prefecture, vacant-housing-rate-inherited-home-risk, elderly-welfare-expenditure-prefecture-gap, evacuation-plan-coverage-urban-prefecture-gap, intellectual-crime-tokyo-kagawa-gap}/`)。
- **公開の現在地 (2026-09-23 再確認)**: 5本とも本番は 410 (未公開)。以前 Phase 2 で作った staging (`.local/r2/app/blog/<slug>/`) と画像リクエスト (`.local/blog-imagegen/requests/<slug>.json`) は消えていたので、画像生成から作り直す。原稿は `docs/21_ブログ記事原稿/<slug>/` に残っている。
- **止まっている理由**: Codex の利用上限。`codex exec` から組み込み `$imagegen` を呼ぶと「usage limit、再開は 2026-09-26 22:28」で失敗した (Codex MCP もこのセッションでは `CONNECTION_CLOSED`)。Codex CLI の直接実行は `codex-mcp.md` の経路③で許可されている。リクエストは `npm run blog-images:codex -- request-article --slug <slug> --article docs/21_ブログ記事原稿/<slug>/article.md` で決定的に再生成できる。
- **SNS下書き**: X投稿文5本・Instagramキャプション5本は作成済み、`.claude/state/sns/pain-point-series-drafts.md` に保存済み。**投稿・予約は記事が本番公開されてから、ユーザーの明示許可を得て実施する**(まだ実行していない)。X下書き作成agentの申し送り: 各投稿に添付する画像とチャートSVGの形式一致は未確認、投稿前に要突合。
- **次**: 2026-09-26 22:28 以降に 5 本分の request-article → `$imagegen` (1本1回) → `ingest-article` → `generate-blog-thumbnails.ts --slug <5slugs>` → `/publish-bulk-articles` の Phase 4 (R2 push・all.json・purge) → Phase 5 (HTTP 検証)。公開後に X・IG の下書き (`.claude/state/sns/pain-point-series-drafts.md`) を予約枠 (X は週 2-3 本) へ入れる。
- **停止条件**: 画像なし(共有背景fallback)でR2にpushしない(OGP/カードが404で公開される事故を防ぐ設計)。
- **完了条件**: 5記事すべてが本番で200 + OGP/thumbnail画像が正しく出る + SNS投稿(X/IG)まで実施されている。

### [UI-CARD-TYPOGRAPHY-UNIFY-01] カードの見出し・本文・余白を役割契約に統一する (A 済 / B 実装済・検証途中 / C 未着手)

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-16] [期日:2026-09-30] [レーン:UI・回遊]

- **owner**: site-ux-manager (横断契約・機械ゲート) / ranking-ui-manager (ranking 面) / theme-ui-manager (themes 面)
- **背景 (2026-09-16 実測・5 ページ・デスクトップ幅)**: 同じ役割のカードが feature ごとに見出しサイズ/太さ/余白を上書き・再実装し、
  ranking 詳細で本文カード見出しが 14/600・14/500・16/600・14/700 の 4 系統、FAQ 本文 14px / 考察 15px に対し他カード 12px、
  `/areas/04000` 右レールで 14/500 と 16/600 が混在、`/themes/real-income` でチャート見出しが同一ページ内 16/600 (9 枚) と
  14/600 (6 枚)、category の分類カードが 13/700・余白 8/12。規約 (`04_デザインシステム.md`) はカード見出し/本文/余白の数値を
  持たず、旧資料 `.claude/design-system/{prohibited,principles,quick-reference}.md` は余白を `p-5以上`/`p-6`/`p-0禁止` と 3 値で
  並立させコード正典 `SurfaceCard p-4` と食い違う。計測方法: DOM で `border`+`bg-card` を持つ最外郭要素ごとに最初の見出し
  (h2-h4 / font-weight≥600) の font-size/weight、本文の最頻 font-size、padding を集計。
- **契約 (確定。数値はコードが正典・文書へ二重管理しない)**:
  - ※ 見出しの色・太さ・下線と本文の下余白は `UI-CARD-HEADER-SIMPLIFY-01` (2026-09-25 決定) で改訂する。以下の数値はそれまでの現行値
  - レール/リンク一覧カード = `RailCard` 既定 (h3 `text-sm font-medium text-muted-foreground`・ヘッダ `px-4 py-3`・本文 `px-4 pb-4 pt-3`)、
    リンク行 = `RailLinkItem` (`py-1.5 text-sm`、2026-09-16 に text-xs から統一)、2 行目 `text-xs`
  - 見出し付き本文カード = `SectionCard` (`components/surface/SurfaceCard.tsx`、RailCard と同じ HeaderedSurfaceCard の variant。
    h3 `text-sm font-semibold text-foreground`・ヘッダ `px-4 py-3`・本文 `p-4`)。`ChartPanel` と同じ見た目。非チャート用
  - メタ文字 = `text-xs`。`text-[10px]`/`text-[11px]`/`text-[13px]` の任意値は使わない
  - `titleClassName` のサイズ/太さ上書き禁止 (色だけ可: AreaProfileSidebar の emerald/amber)
  - ページ節見出し: h2 `text-xl font-bold`、節内の小見出し h3 `text-base font-semibold`。h1 だけ `text-2xl font-bold`。`text-lg` 見出し禁止
  - カード内カード禁止は維持 (SectionCard の内側は枠なしのリンク行にする)
- **済 (A) — commit `3ca99124c`**: SectionCard 新設 + card census 登録 / RailLinkItem text-sm / RailCard 再実装 7 件
  (RelatedAreas・AreaProfileSidebar・CitiesNavCard・CorrelationSection+Skeleton・PortStatisticsMapCard・RankingSidebarSkeleton・RailAdSlot)
  を共通部品化 / blog 関連ランキング・目次と CityRankingSection の titleClassName 上書き削除 (ArticleTableOfContents の compact prop 削除) /
  楽天・返礼品・運営者カードを semibold + text-xs へ / PortalCategoryGrid sidebar・RailLinksCard の任意 px を scale へ。
  `/areas/04000` 右レール 4 枚が 14/500・リンク 14px に揃ったことをブラウザ実測済み
- **B — 実装済み・検証途中 (この PC で 2026-09-16 に Sonnet が編集、型/design-system/card census/eslint は緑、対象 vitest は実行途中で中断)**:
  対象 14 ファイル = RankingSourceCard / RelatedRankingsGrid (SectionCard 化。内側 9 枚は枠付き SurfaceLinkCard から枠なしリンク行へ =
  カード内カード禁止のため。**見た目の確認が未了**) / DataUsageCard (SurfaceCard + tint) / RankingPageCardsSkeleton / AreaRelatedRankingsCard /
  AreaRelatedBlogArticles (h2 text-2xl→text-xl) / AreaDatabookSection (節内 h3 text-lg→text-base semibold) / ThemeRelatedArticles /
  ThemeEvidenceTopicsSection / ThemeIndicatorCatalogSection (h2 text-lg→text-xl) / MetricFocusCharts・MetricSwitcherPanel
  (`titleClassName="text-base"` 削除 = themes のチャート見出し 16→14px) / ChartState (h3 text-lg→text-sm) / SurveyTaxonomyCard section 変種
  (h2 text-lg→text-xl、p-5 撤去)。**次の PC ではまず** `cd apps/web && npx vitest run src/features/ranking src/features/area-profile
  src/features/area-databook src/features/theme-dashboard src/features/survey src/components` を通し、`git diff` で
  ThemeEvidenceTopicsSection の見出し扱い (h2 を節見出しとして残したか SectionCard title にしたか) を確認する
- **C — 未着手 (機械ゲート + 文書)**:
  1. `apps/web/scripts/check-design-system.mjs` に規則を追加 (既存の `rules` 配列と同形式・`allow` で例外):
     `no-card-title-scale-override` (`titleClassName=` に `text-(xs|sm|base|lg|xl|2xl)|font-\w+` を含む。features/app 対象) /
     `no-manual-card-header` (`border-b` と `px-N` と `py-N` を同一 class 文字列に持つ手書きヘッダ。features/app 対象、`src/components/**` は許可) /
     `no-arbitrary-text-size` (`text-\[(10|11|13)px\]`。A 実施前は 87 箇所/40 ファイル。残存ファイルを**縮小専用 allowlist** に列挙し新規を止める。
     `src/features/ogp/**` と Remotion 系は対象外) / `no-text-lg-heading` (`<h[23]` と `text-lg` の同居。`MarkdownSectionRenderer` は allowlist) /
     `no-h2-text-2xl` (hero・PageHeader 以外)。checker のテストがあれば規則ごとに 1 ケース足す
  2. 文書: `docs/01_技術設計/04_デザインシステム.md` に「カードの役割契約」節 (部品名で書く。数値は書かない) / `.claude/rules/ui-components.md` に
     「RailCard/SectionCard の titleClassName でサイズを上書きしない」「feature 内で SurfaceCard p-0 + 手書きヘッダを作らない」を追記 /
     `.claude/design-system/{prohibited,principles,quick-reference}.md` の余白数値 (`p-5以上`/`p-6`/`p-0禁止`) を削除し「コード正典 = SurfaceCard p-4」へ
  3. ブラウザ再計測 (上記の計測方法) を `/ranking/natto-consumption-expenditure` `/areas/04000` `/themes/real-income` `/category/economy`
     `/blog/local-government-debt-burden` で行い、役割ごとに 1 系統に収束したことを確認。RelatedRankingsGrid の枠なし化と
     ranking 右レールのリンク 14px 化の見た目を目視
- **未決 (オーナー判断)**: ① FAQ/定義/考察 (開閉 UI) の本文 14px は規約どおりだが他カードの 12px と並ぶと大きく見える —
  他カードを 14px へ上げるか開閉 UI を 13px へ寄せるか ② category の分類カード (13/700・8/12、`CategoryTopicGroups`) を契約へ寄せるか
  ③ `MarkdownSectionRenderer` の h2 16px (テーマ本文内) の扱い
- **環境メモ**: この Windows PC で node_modules が lock とずれ `@babel/core` 不在 → pre-commit の `next lint` が落ちる。`npm install` で復元済み。
  共有ツリーで作業するときは `git commit -- <paths>` で staged を残さない (別セッションの commit に巻き込まれた実例あり)
- **停止条件**: 契約テスト (`right-rail-banner-contract` / `page-shell-rail-contract` / `left-rail-layout-contract` / chart contract audit) を弱めない。
  デプロイはオーナー指示で 1 回
- **完了条件**: 5 ページ計測で役割ごとに 1 系統 / `check-design-system` の新規則が緑で既存違反 0 (allowlist は縮小専用) / 文書 3 点更新 /
  `npm run type-check --workspace=apps/web` と対象 vitest が緑

### [SITEWIDE-DUPLICATE-LINK-RATIO-01] サイト横断でリンク重複率が閾値超過 (本番全6,237URL実測)

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run page-quality:audit-weekly -- --base-url https://stats47.jp] [起票:2026-09-15] [レーン:UI・回遊]

- **owner**: ranking-ui-manager (ranking) / theme-ui-manager (theme) / site-ux-manager (共通部品・横断)
- **実測 (2026-09-18)**: develop→main PR #977 の `page-quality` (representative) が同じ違反で赤 (merge blocker)。
  `/themes/population-dynamics` 0.5081 / `/blog` 0.3235 / `/ranking/total-population` 0.3151 (閾値 0.3)。
  rail/surface 統一 (1006e1e21) 後の値。CI 側では 2026-09-18 に PR 必須 gate から外し、週次監査だけが検出する。
  2026-09-18 に page-quality を PR 必須から外したので PR は止まらなくなったが、違反自体は未解消。
  検知は週次 `page-quality-audit-weekly.yml` の alert Issue と、リリース前の `check:release-local` に移った。
- 2026-09-15、`page-quality:audit-weekly` を本番全 6,237 URL に実行 (初の全件試行)。
  error 2,698 / warning 5,106。**duplicate_link_ratio がほぼ全テンプレートの支配的違反**で、
  個別ページの内容問題ではなく共通コンポーネント由来の疑いが強い:

  | テンプレート | 対象URL数 | error | warning | duplicate_link_ratio 内訳 |
  |---|---:|---:|---:|---|
  | prefecture-detail (`/areas/[code]`) | 2,491 | 1,691 | 1,612 | error 1,691 + warning 752 = 対象の 98% |
  | blog (`/blog/[slug]`) | 606 | 606 | 112 | error 605 = 対象の **99.8%** |
  | ranking (`/ranking/[key]`) | 2,170 | 227 | 3,197 | error 227 + warning 1,941 (ad_duplicate_count warning も1,256件) |
  | geo-analysis | 71 | 55 | 10 | error 55 = 対象の 77% |
  | theme | 56 | 38 | 34 | error 38 = 対象の 68% |
  | survey | 148 | 64 | 83 | error 56 + warning 83 |
  | category | 17 | 11 | 8 | error 11 |
  | municipality | 360 | 0 | 0 | **異常なし** (比較対象として健全) |

- **注意 (実証ベース)**: prefecture-detail は並行 Codex セッション (`area-density-optimization` /
  `area-all-optimization`、2026-09-15実施)が「ranking リンク重複排除」を含む最適化を
  ローカル dev server で検証済みだが**本番未デプロイ**。本監査は現行本番 (デプロイ前) を
  見ているため、そのセッションの変更が本番反映されれば prefecture-detail 分は改善している
  可能性が高い。**デプロイ後に再実測してから母数を再評価すること** (未検証のまま「直った」
  と判断しない)。
- **次 (実行順)**: ①上記デプロイ待ちの分を除いた ranking/blog/theme/survey/category の
  duplicate_link_ratio 原因(共通ナビ・関連記事ウィジェット・広告リンクの重複生成箇所)を
  各 owner が最小1テンプレートで特定 ②修正 ③`page-quality:check`(代表URL)で個別確認
  ④全件は次回週次 `page-quality-audit-weekly.yml` で確認 (毎回全件を手動実行しない)。
- **完了条件**: 週次監査の error 件数が縮小傾向 (ラチェット化は別途検討)。
- 生データ: `.claude/state/metrics/page-quality/{latest.json,LATEST.md,snapshots/2026-09-15.json}`、
  管理画面 `/quality/page-audit`。

### [STATE-R2-MIGRATION-01] 日次観測 state の残り 4 domain を R2 `state/` へ移す (psi → cloudflare → url-inspection → search-growth)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:git log --since=4.weeks --name-only -- .claude/state/metrics | sort -u | wc -l が 230 未満、かつ curl -sI https://storage.stats47.jp/state/psi/index.json が 200] [起票:2026-09-14] [期日:2026-10-12] [レーン:基盤]

- **owner**: Claude Code (実装) / オーナー (PR 承認・Cloudflare lifecycle)
- **前提**: PR `feat/ga4-affiliate-state-r2` で 1 domain 目 (`state/ads/ga4-affiliate/`) の型が出来ている。
  `state-pull.mjs` (公開 URL → gitignored `live/`)、`index.json` 維持、週次集約だけ commit-back、
  `prune-state-snapshots.mjs` の policy 削除、という 4 手順を domain ごとに繰り返す。
- **背景 (2026-09-14 実測)**: `.claude/state/metrics` は 4 週で 230 commit。大半が psi / cloudflare /
  url-inspection の日次 `[skip ci]` commit-back。git を肥大化させず agent の Grep 対象にも入れない置き場は
  R2 `state/` (400 日 lifecycle・`r2-storage-design.md`)。
- **次 (実行順)**: ① `psi-audit-daily.yml`: `psi-batch-*.json` を `state/psi/` へ、`history.csv` は git のまま。
  読み手 `psi-threshold-check.mjs` / `fetch-psi-audit.mjs` / `search-growth/lib/sources.mjs` に「local 無ければ
  `live/`」を足す。② `cloudflare-usage-daily.yml` (`cloudflare/snapshots/`)。③ `url-inspection-daily.cjs`
  (`gsc/url-inspection/`)。③の読み手には `build-coverage-queue.mjs --sync-inspection` (直近14日の日次CSVで
  是正キューを done 化) も含める。④ `search-growth-weekly.yml` の `latest.json` / `live/`。domain ごとに 1 PR、
  移行後に `RETENTION_POLICIES` の該当 scope を消す。
- **停止条件**: 日次アラート (`[PSI Alert]` / `[Cloudflare Alert]`) の起票経路を壊さない (読み手が CI 内で
  直前に書いた raw を読む経路は維持する)。R2 へ書けなかった日は raw を捨てず artifact に残す。
- **完了条件**: 4 domain とも日次 commit-back が消え、`fetch-metrics-weekly.yml` の週次 1 commit だけが
  `.claude/state/metrics` を触る。`npm run state:pull -- <domain>` が 4 domain で動く。

### [STATE-R2-LIFECYCLE-01] R2 `state/` prefix の object lifecycle rule (400 日) をオーナーが設定する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Cloudflare ダッシュボード R2 → stats47 → Settings → Object lifecycle rules に prefix state/ の 400 日ルールがある] [起票:2026-09-14] [期日:2026-09-28] [レーン:基盤]

- **owner**: オーナー
- **何を**: Cloudflare ダッシュボード → R2 → `stats47` → Settings → Object lifecycle rules → Add rule:
  prefix `state/`、Delete uploaded objects after 400 days。コード変更なし。
- **なぜ**: `state/` は CI が日次・週次で書き続ける生 snapshot の置き場で、他の prefix と違い GC を
  `r2-retention.ts` の allowlist で運用しない (正典 `r2-storage-design.md` 「削除ポリシー」)。
  ルールが無いと 32GB (2026-09-12) の R2 に上乗せで増え続ける。
- **停止条件**: prefix を `state/` 以外に広げない (`app/` `gis/` は PROTECTED)。

### [CONFIG-SECRET-CLAUDE-JSON-01] `~/.claude.json` の github MCP に残る平文 PAT を退避する (gh CLI のプロキシ認証が前提)

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:node -e "const j=require(require('os').homedir()+'/.claude.json');console.log(Object.keys(j.mcpServers.github?.env||{}))" が [] を返す] [起票:2026-09-14] [期日:2026-10-12] [レーン:基盤]

- **owner**: オーナー
- **現状 (2026-09-14)**: Codex 側 (`~/.codex/config.toml`) の PAT は削除・github MCP を無効化済み。Claude 側
  (`~/.claude.json` user スコープ) の github MCP は `GITHUB_PERSONAL_ACCESS_TOKEN` を平文で持つが、会社 PC では
  `gh` CLI が「Proxy Authentication Required」で使えないため、この MCP が唯一の GitHub API 経路として残している。
- **次**: ① 会社 PC で `gh auth login` を通す (プロキシ設定 `HTTPS_PROXY` + `gh config set http_unix_socket` 等を
  試す)。② 通ったら `claude mcp remove -s user github` し、`~/dotfiles/bin/mcp-user.{ps1,zsh}` の集合と一致させる。
  ③ 平文で置かれていた PAT は GitHub 側で revoke して発行し直す。
- **停止条件**: gh が通る前に MCP を消さない (GitHub Issues / PR 操作が会社 PC で不能になる)。

### [MAC-FIRST-RUN-01] 自宅 Mac で二拠点セットアップを初回実行し、Mac 固有の罠を local-environment.md に記録する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Mac で node .claude/scripts/setup-memory-symlink.mjs --check と node .claude/scripts/lib/sync-codex-mirror.cjs --check が exit 0] [起票:2026-09-14] [期日:2026-09-28] [レーン:基盤]

- **owner**: オーナー (Mac 操作) / Claude Code (罠の記録)
- **手順**: `local-environment.md` 「2 台で同じ形にする手順」の Mac 列を上から実行する
  (dotfiles clone → `link.mjs --host mac` → `git clone --filter=blob:none` → memory link → `core.hooksPath` →
  `~/tmp` → `local-resources.sh install` → `gh auth login; codex login` → mirror check)。
- **要確認 (未実測)**: `codex/host.mac.toml` の filesystem / notebooklm パスは仮置き (`/Users/kazu/...`)。
  `local-resources.mjs` の darwin `ps` 分岐と `assertNoLinks` の `/private/tmp` realpath は実機未検証。
  `.claude/settings.local.json` の seed (`stats47.local.mac.json`) の許可リストも初回で調整する。
- **完了条件**: Mac 側の `claude mcp list` / `codex mcp list` の名前集合が Windows と一致し、
  `local-environment.md` に Mac 節の実測が 1 つ以上追記されている。

### [PERF-RANKING-LCP-03] ランキングページの LCP がベースラインより悪化したまま

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/psi/... の history.csv で ranking/total-population,mobile の LCP < 9,347ms] [起票:2026-09-07] [期日:2026-10-05] [レーン:基盤]

- **owner**: Claude Code (調査・実装) / オーナー (デプロイ承認)
- **症状 (実測)**: `.claude/state/metrics/psi/history.csv` の `ranking/total-population,mobile` 直近 3 週 (2026-08-23〜09-06) の LCP は 10,936〜13,841ms (平均約 12,300ms) で、ベースライン 9,347ms (2026-08-04) より約 32% 悪化している。
- **デプロイ後の実測 (2026-09-18 時点)**: PR #940 (`4ee6b5641` を含む) は 09-07 に main へ。以降の LCP は 09-07 9,230 / 09-10 9,735 / 09-11 8,548 / 09-12 5,738 / 09-15 7,709 / 09-16 7,964 / 09-17 7,538ms。
  09-10 の 1 日を除きベースライン未満だが、完了条件の「3 週連続」には 09-28 まで観測が要る。期日をそこへ動かした (判定は週次レビューで)。
- **一次診断**: 最新 batch (2026-09-06) の `lcp_element` 実測で LCP 要素は依然 Leaflet タイル。topology をクライアント `useEffect` fetch へ変更したことがハイドレーション後の直列処理を増やした疑い。
- **なぜカードが要るか**: 旧 `PERF-RANKING-LCP-02` は 2026-09-07 の improvement-triage (`b27c62cab`) で「完了条件未達」として改善バックログから削除されたが、後継の追跡先が作られず**どの台帳にも存在しない状態**になっていた。`monthly.md` の言及は計画ビューであり TODO の実体ではない。
- **比較の断絶 (2026-09-25)**: LCP 要素である背景タイルを CARTO (同一 origin の /tiles プロキシ・30 日エッジキャッシュ) から地理院タイル (cyberjapandata.gsi.go.jp を直接取得) へ切り替えた (commit 871096e46、main 95a9971)。9/25 以降の PSI はタイル配信元が別物なので、ベースライン 9,347ms との比較は 9/25 以降の 3 週で改めて判定し、それ以前の推移とつなげない。
- **次**: タイル描画を TopoJSON 取得から分離する修正は `4ee6b5641` に実装済み。PR #940 の本番反映後に LCP 要素を再確認し、PSI の 3 週以上の推移で効果を判定する。調査・実装を最初から繰り返さない。
- **停止条件**: 単発の PSI 値で改善と判定しない (日次計測はばらつくため 3 週以上の推移で見る)。デプロイはオーナーの明示承認まで行わない。ベースライン 9,347ms は 2026-08-04 の実測値で、これを更新して達成扱いにしない。
- **完了条件**: `ranking/total-population,mobile` の LCP が 3 週連続でベースライン 9,347ms を下回る。悪化要因が topology fetch でなかった場合は、実測で特定した真因と対策を本カードへ記録してから閉じる。

### [GSC-COVERAGE-AUTOMATION-VERIFY-01] 是正キューの自動観測と登録済み件数の記録が本番 CI で動くことを確認する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node -e "const q=require('./.claude/state/gsc/coverage-remediation-queue.json');process.exit(q.queue.some(e=>e.inspection)?0:1)"] [起票:2026-09-24] [期日:2026-10-05] [レーン:SEO・ブログ]

- **背景 (2026-09-23 実測)**: CI の URL Inspection (`--limit 500`) は検索実績上位 500 件だけで枠が埋まり、是正キュー
  pending 1,133 件を 7 日間 1 件も検査していなかった。キューは毎週 export から作り直すため登録された URL は記録なく消え、
  `done` は 0 件。登録済み件数は export の概要グラフにしか無いのに ingest が読まず、`coverage-totals-history.csv` の
  `indexed-submitted` 列は 4 週とも空。search-growth は最新ファイルを mtime で選び、CI checkout で 09-15 の古い CSV を掴んで
  月曜の GSC 運用サイクル監査を FAIL にしていた。4 点を修正した (枠の割合配分・`--sync-inspection`・概要グラフ取込・名前順選択)。
- **次**: ① workflow 変更は main 反映後の schedule から効く。反映後の日次 CSV で是正キュー URL が約 250 件/日含まれること。
  ② 次の週次 (日曜) 後に `coverage-totals-history.csv` の `indexed-submitted` が埋まること。空なら ingest の警告
  「概要グラフに登録済み件数が無い」をログで確認し、実 export の概要 ZIP の列名を `INDEXED_HEADERS` に足す。
  ③ 月曜の `gsc-operations-cycle-weekly` で `search-growth-sources` が PASS になること。
  ④ 判断が要る pending が `GSC-COV-*` カードとして自動起票され、`backlog-loop-daily` が gate
  (`build-coverage-queue.mjs --assert-handled`) を通して閉じ、是正キューの該当 URL が pending でなくなること。
  main 反映前はワークフローの変更が効かないので、このカードはループに拾わせない (`[実行:対話]`)。
- **停止条件**: 検査枠を増やすために API quota (2,000/日) の 75% を超えない。Indexing API は使わない。
- **完了条件**: 上の検証コマンドが exit 0、`indexed-submitted` が 1 週以上記録され、運用サイクル監査の `search-growth-sources` が PASS。

### [UI-REVIEW-LOOP-VERIFY-01] 週次 UI 検査のループが修正と本番確認まで CI で一巡することを確かめる

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node -e "const q=require('./.claude/state/page-quality/ui-findings-queue.json');process.exit(q.findings.some(f=>f.status==='fixed'||f.resolved_by==='weekly-audit')?0:1)"] [起票:2026-09-24] [期日:2026-10-12] [レーン:UI・回遊]

- **背景**: 2026-09-24 に検査 → 起票 → 修正 → 本番確認のループを入れた (`.claude/rules/page-quality-standards.md`「UI 指摘のループ」)。
  同日の週次 (run 35966300757) で `UI-FIX-THEME` / `UI-FIX-PREFECTURE-DETAIL` / `UI-FIX-OTHER` の 3 枚が起票され、
  キューと backlog が develop に commit された (`03a02d016`)。起票までは CI で確認済み。
- **次**: ① `backlog-loop-daily` が UI-FIX カードを処理し、`ui-findings-queue.json` への `--mark-*` が develop に commit
  されること (1 run 2 件・先行する sweep カードがあるため数日かかる)。② 直した指摘がリリース後の週次で done
  (`resolved_by: weekly-audit`) になるか、残れば pending に戻って再起票されること。
- **停止条件**: 本番 deploy はオーナー承認まで行わない。
- **注意 (2026-09-24)**: 対話セッションで `CAROUSEL-ARROW-OVERLAP-01` / `THEME-MAP-ATTRIBUTION-CLIP-01` / `A11Y-SERIOUS-01` 担当の machine 指摘を `--mark-fixed` にした。検証コマンドの `status==='fixed'` はこれでも真になるので、2026-09-24 分の `UI-FIX-*` 3 枚も、ループが 9/23・9/24 の 2 晩とも verify で落ちて処理できなかったため対話で直して閉じた (原因は verify が過去の completed を見て「削除し忘れ」と誤判定していたこと。2026-09-25 に最新 attempt だけを見るよう修正)。ループの実証は次の週次 UI 検査が起票する `UI-FIX-*` で行う。
- **完了条件**: 検証コマンドが exit 0 (fixed か週次で確認済みの指摘が 1 件以上)、かつループの commit に `.claude/state/page-quality` が含まれている。
- **2026-09-27 の週次から対象を拡大 (2026-09-25)**: ブラウザ検査・撮影が代表URL 12 件 + データの型の違い 32 件の 44 ページになり、
  Claude の目視は約 20 ページ (variants は 4 週で 1 巡)。初回 run で確認すること: ① 44 ページ × 7 幅の撮影が制限時間 (120 分) 内に終わる
  ② review step が 30 分・200 ターン内で終わり、`ui-review-latest.json` に `reviewedPages` が入る ③ variants の指摘が
  `UI-FIX-<種類>-<違い>-<日付>` で起票される。


### [CF-CPU-SURGE-01] 2026-09-11 以降の Workers CPU 時間の増加原因を特定し、差分 purge とブログ広告変更の効果を測る

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-09-24] [期日:2026-10-16] [レーン:基盤]

- **背景 (2026-09-24 実測)**: 請求書 6 通 (`cloudflare-cost-improvement/reference/weekly-snapshots/2026-W20〜W38.json`) で、
  5 月以降の従量課金は毎月 Workers CPU ms の 1 行だけ (9/15 請求は超過 267M ms で $5.36)。9/15〜の請求期間は予算アラート
  $3.06 に 5 日目で到達 (前 2 期間は 24〜26 日目)。日次 snapshot の CPU p50 は約 8→15〜22ms、p99 は約 1.4→2.8 秒で、
  9/11〜12 のデプロイ後から増えている。候補は ① purge が HTML キャッシュへ実際に効くようになった (`f3a04de2b`)
  ② テーマ拡充で 1 ページが重くなった ③ アクセス増。デプロイのたびに HTML キャッシュが消えることも実測した (30 日で 84 回)。
- **済**: 楽天同期の全体 purge を差分 purge に変更 (`c15ea5708` / `db8c6acf8`、PR #1021 で本番反映済み)。
  ブログの A8 バナー抑止 (`c9e2b6a93`) は develop のみで未リリース。
- **次**: ① 9/25 JST 04:00 の `sync-rakuten-catalog` で purge が `--urls` (約 1,900 件) になり `--all` でないことをログで確かめる。
  ② Cloudflare Observability で route 別の CPU 時間を見て主因を絞る (MCP 認証かダッシュボードのログインが要る)。
     2026-09-25 のセッションでも `cloudflare-observability` / `cloudflare-graphql` MCP は未認証だった。
     再認証は対話セッションの `/mcp` でユーザーが行う。
  ③ 日次 snapshot の cpu_p50/p99 と 10/15 の請求書の CPU 行で効果を見る (請求書は invoice モードで記録)。
- **停止条件**: 本番 deploy はオーナー承認まで行わない。原因を実測で絞らないまま対策を足さない。
- **完了条件**: CPU 増加の主因を route か仕組みで特定して対策を決め、10/15 の請求書の CPU 行を記録している。
- **観測の追記 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 本番の撮影 308 回のうち 3 回で一時的な HTTP 503 (`/areas/29000/cities/29363` の 390・640px、`/category/landweather` の 390px)。
  同じ URL は直後の再取得で 3 回とも 200。
  GSC 是正キューでも `/blog/gasoline-consumption-quantity-vs-densely-inhabited-district` (9/7・9/20) と
  `/blog/white-bread-consumption-quantity-prefecture-gap` (9/20) が 503 と記録された。9/25 はキャッシュ迂回を含む 5 回すべて 200
  (1 回目の描画は 2〜3 秒)。`GSC-COV-5XX-20260925` はこのカードへ原因調査を寄せて閉じた。
- **関連する変更 (2026-09-25 夜・未リリース)**: `THEME-CHART-LOAD-LATENCY-01` で、テーマページの時系列取得を 1 回のサーバーアクションに
  束ね、同じ指標の「選択県」と「全国」を R2 の 1 回の読み込みから作るようにした (リクエスト 48 → 2、R2 読み込みは指標数分)。
  [仮説] テーマページ 1 表示あたりの Workers CPU 時間が減る。検証: リリース後の日次 snapshot の cpu_p50 / p99 を前週と比べる。

### [GSC-COVERAGE-DEPLOY-01] カバレッジ是正と入力鮮度ガードを本番反映する

タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [検証:node .claude/scripts/gsc/build-coverage-queue.mjs --no-probe] [起票:2026-09-07] [期日:2026-09-28] [進行中] [レーン:SEO・ブログ]

- **owner**: オーナー（GSC UI export）／Claude Code（取込・効果判定）
- **現状**: 2026-09-07にPR #939（main `5d05cd6e1`）で本番反映済み。PR CI、Cloudflare deploy、post-deploy smoke、R2 ISR GC、CDN全体パージはすべて成功した。Googlebot UA実測で旧市区町村カテゴリsoft404 5件は全件301、親プロフィール200、未知カテゴリ410 + noindex。sitemapは旧カテゴリ0件 / 市区町村プロフィール360件、自治体Datasetは`description` / `license` / `distribution.contentUrl`を本番HTMLで確認した。
- **①は確認済 (2026-09-18)**: `fetch-metrics-weekly.yml` は 2026-09-13 run が success、`coverage-alert` Issue は 0 件。
- **残り (オーナー)**: ②デプロイ (09-07) 後の GSC UI export がまだ無い (最新の coverage-drilldown は `2026-W36`、export 日 2026-09-04・soft-404 450)。次回 export で市区町村カテゴリ soft404 5→0 と全体件数差を測定し、`COVERAGE-LOOP-01` へ効果観測を引き渡す。
- **停止条件**: 古いW32入力を当週データとして再生成しない。通常ページへGoogle Indexing APIを送らない。デプロイ前のURLを同一観測窓へ混ぜず、Google再クロール前の件数不変だけでeffect/noneにしない。
- **完了条件**: develop→mainのCIがgreenで、上記の本番HTTP・構造化データ・sitemap検証がすべて合格する。失敗時の`coverage-alert`起票と、回復時の自動closeを少なくとも一方はGitHub Actionsで実測し、デプロイ後exportで市区町村カテゴリsoft404が0になる。

### [PRODUCT-SALES-READINESS-01] 横断カタログの全商品を販売準備ゲートまで仕上げる

タグ: [収益化] [種類:制作] [実行:sweep] [起票:2026-09-06] [期日:2026-09-13] [レーン:note・商品販売]

- **status**: in-progress（期日は次回棚卸し期限）
- **owner**: coconala-product-manager / kindle-publisher / note記事担当 / オーナー
- **対象の正典**: `.claude/state/products/catalog-status.json` の `offers`。既存商品と未制作候補、同一商品の販売先variantを分け、個別statusを本文に複製しない。人間向け一覧は `products:report` が生成する `.local/product-portfolio/catalog.html`。
- **再開点（2026-09-06）**: 現行候補は`CURRENT_SALES_REVISIONS`で固定。最終EPUB検査は`kindle-v3-20260906-r4-verification.json`で実本文全章SHAを保持。S2-01だけは当該版の独立review.jsonがあり、他巻へ流用しない。最初の公開前に、固定bytes送信・旧draft再投入・公開直前再照合を認証済み下書きで実測する（コード/モック検査のみでは実UI動作を合格にしない）。新規公開は実機・権利/申告・保全・オーナー承認がそろってから。
- **次（実行順）**: ①Kindle改訂版を全章で独立意味レビューする。書き下ろしだけでなくブログ/ランキング由来の本文・図を含め、未根拠因果・対象年/地域/分母の違いを是正し、内部比率を再計測する。②確定版のEPUB検査・Previewer・全章SHAに結び付いたreview.json・入稿bundle照合後、明示版指定のarchiveで旧版を保持して暗号化保全する。③note14パックの準備原稿に固有の使い方・図例を追加し、独立レビュー・価格/添付/利用条件確認へ進める。無料P13を含めた固定入力はfree-sample-delivery.jsonと納品manifestで照合する。未制作Geo11企画は原典・再現テスト・読者成果を満たすものから制作する。④商品別の残ゲートが解消してから、承認された対象だけを専用公開フローへ渡す。入稿提案JSONを公開済み記録と扱わない。
- **Kindle再接地の具体対象**: S1-01のブログ9章は全章の再編集が必要。`per-capita-income-gap`の本文と図の採用年・数値不一致、`heating-cost-vs-disposable-income`の名目支出/実質所得・世帯範囲の不一致、`communication-cost-burden`の交通通信費/通信費混同、`expenditure-structure-comparison`の性質別/目的別混在と因果主張、`black-tea-income-gap`の購入量/飲用量・相関/説明割合混同を残さない。S1-02も食品の支出・購入数量と調査対象都市を元記事の本文・図まで照合する。`editorial-corrections.ts`の部分校訂だけで当該章全体を合格にしない。他冊にも同種の旧断定があるため全章レビューを省略しない。
- **関連の別owner工程**: Office・本人確認は `COCONALA-PROFILE-OWNER-01`、歴史2指標は 2026-09-24 に原典 (社会生活統計指標2023 表7) と 47 県すべて一致を確認済み (`coconala-packs-2026-09-06.json` の `officialDefinitions.historicalSourceReconciliation`。`historicalNotReverified` の解除と納品 SOURCES の注記更新は商品担当の判断で未実施)。公開済みGeo noteの本文・添付再確認は認証済み画面が必要。売上/需要の不明を0扱いしない。
- **再利用本文の追加是正対象**: S1-03高齢単身の分母・通勤流入と移住、04介護必要数と不足数・化学工業と医薬品・相談窓口の時間、05大学収容力と入学定員・保育利用率と希望充足率、06財政指標の控除/平均期間・目的別と性質別、07宿泊施設範囲/人泊と人数・国籍から嗜好の断定、08供給契約と世帯普及率、09産業出荷/利益/用水効率、10火災地震合算/強度率の労働時間分母、11行動者率/稼働率、12有業者/雇用者を元ブログ・図まで直す。fresh訂正だけでは完了しない。
- **販売中v1の機械監査 (2026-09-19・全32冊EPUB展開)**: 販売中22冊はarchive `v1` (2026-08-30) と一致し、ランキング章はサイトAI解説の転載のまま。S2/S3/S4のランキング章481件のうち177件 (37%・71指標) が他冊にも載る同一指標で、60字以上の同一段落が2冊以上に532件ある (S3-01↔S4-01で21段落)。S2-01「人口・世帯」に高血圧性疾患/肝疾患/し尿処理/水洗化が入り、S3-01「北海道」の章は祭具・墓石/マフラー/うなぎ等 (地域の極端順位で機械選定)。S1のブログ章に「この記事/本記事」が11〜38件/冊残る。合計特殊出生率に単位「（人）」、同一章で「2023年」と「2023年度」が混在 (S2/S3で9〜19章/冊)。S3-01は「北海道の内訳を見ると、北海道が全国47位」型の定型文が24章。現行コードで再生成した v3 は解説を外して全県表になるが、31章すべてに同じ免責文が付き主題外キー・重複指標 (昼夜間人口比率×2) は残る。監査スクリプトは `verify-epub.mts` に (a)冊間の指標/段落重複 (b)ブログ残語 (c)年/年度混在 (d)率系の単位 の決定的ゲートとして移す。
- **S1-01 の是正 (2026-09-19 実施)**: v3-20260919-r1 を blog-critic (opus) が全 15 章で独立レビュー → REVISE (BLOCK 8 / MAJOR 19 / MINOR 13。大半が本文と図の年次不一致・名目/実質・世帯範囲・相関→因果)。40 件 + 追加 6 件 (2014 年の別指標図の除外・要約図の見出し誤りの除外・重複節の置換・年度→年) を `editorial-corrections.ts` (ブログ由来章・書籍版のみ) と `manuscripts/K-S1-01/` (書き下ろし) に反映し、`v3-20260919-r3` を生成 (15 章・図 35・書き下ろし 32.7%・verify-epub 3 層 error 0 / warn 0)。findings の記録は `.local/kindle-books/K-S1-01/v3-20260919-r3/review-r1-findings.md`、delta 再審査は同 dir の `review.md`。**同じ誤りは公開ブログ 9 本 (real-disposable-income-reversal / heating-cost-vs-disposable-income / per-capita-income-gap / savings-balance-gap / engel-coefficient-prefecture-ranking / household-spending-prefecture-gap / communication-cost-burden / expenditure-structure-comparison / black-tea-income-gap) に残っている** → blog remediation (`/blog-revise-fix`) で review-r1-findings.md の before/after を must-fix として直す (図の再生成: savings-ranking を 2019 年 financial-assets-balance に、income-summary-findings の heading「約200万円」→「約20万円」)。残り: R2 暗号化保全 (鍵のある環境でオーナー) → `kdp-publish --update` (書名変更 + 本文差替) → オーナー承認で `--commit`。
- **S1 12 冊の是正完了 (2026-09-19)**: 全冊を blog-critic (opus) の全章 full 審査 → delta 再審査で PASS にした。その後、critic が「据え置き」にしていた生成器側の項目を直して最終版を作った (章番号「第1章〜」の統一 / 扉の紹介文をですます調に / 図の読み方から未使用の「偏相関」を除去 / 推計章の無い冊から「推計を扱う章では…」を除去 / 出典節が無い 4 章にサイトの出典カードから「データ出典」を起こす / **図の中の文字を `figure-corrections.ts` で校訂** = K-S1-06 の 11 図・08 の 6 図・10 の 12 図の 年→年度、K-S1-10 保険散布図の図題・縦軸、K-S1-06 折れ線の「全国推移」→「47都道府県単純平均の推移」)。最終版 = 01 r9 / 02 r10 / 03 r11 / 04 r8 / 05 r11 / 06 r10 / 07 r9 / 08 r12 / 09 r10 / 10 r8 / 11 r8 / 12 r7 (表紙を Codex imagegen の帯絵に差し替えた版。本文は前版と byte 同一・全冊 `verify-publishable --content-only` blocker 0、`review.json` 受領証と `kindle-<版>-verification.json` あり) (`v3-20260919-*`、verify-epub 3 層 error 0。据え置き解消後の版は全 12 冊が delta 審査 PASS、最後の出典一覧の番号付けだけは diff 確認で引き継ぎ)。判定は各 `.local/kindle-books/K-S1-NN/<版>/review.md`。入稿提案 12 本 = `.local/kindle-listing-revisions/<版>.<id>.json`。校訂 `editorial-corrections.ts` ~1,460 件 / 60 slug (書籍版のみ。**公開ブログ 55+ 本に同じ誤りが残る** → `/blog-revise-fix` の must-fix に各冊 r1 の `review.md` と `KINDLE_EDITORIAL_CORRECTIONS[slug]` の before/after を入力する。「この章」等の書籍向け言い換えは除く)。
- **書籍側では直せず残るもの (ブログ側 chart-author 工程)**: ①K-S1-06 財政力指数ランキング図の小数 1 桁表示 (F-003-17: 島根 0.25 と徳島 0.31 が図で同じ「0.3」。`resolveValuePrecision` で再生成) ②図データの年・指標の差し替え (K-S1-01 savings-ranking は 2014 年の別指標のため書籍から除外済み。ブログ側は 2019 年 financial-assets-balance で再生成) ③**data-configs の `yearFormat` が 家計調査・国勢調査・社会生活基本調査まで一律 fiscal** (2026-09-19 実測: S1 12 冊の図 120 枚のうち calendar は 家計調査の一部と将来推計だけ)。書籍は critic が本文で確定した型に図を合わせたが、根は config 側 → `METRIC-YEARFORMAT-KAKEI-01` を家計調査以外にも広げる。図の校訂は config が直ったら不要になる (before が消えて生成が止まるので、そのとき外す)。
- **出典一覧は章題を出す仕様 (K-S1-10 N36 / K-S1-12 N02)**: ブログ題は撤回済みの旧主張を含みうる (K-S1-04 m08) ため意図的。据え置きではなく決定。
- **S2/S3/S4 の販売中 10 冊は 2026-09-19 に KDP で出版停止を実行済み** (オーナー指示 → `kdp-unpublish.mjs --all-withdrawn --commit`。本棚 read-back 10/10 が「下書き」、listing は `status: "withdrawn"` + `withdrawal.unpublishedAt/readBack/evidence`)。ストアの商品ページ消滅は数時間〜72 時間後に `curl` か本棚で確認する。
- **残るオーナー工程 (2026-09-19 時点の `verify-publishable` 全冊の blocker と同じ)**: ①R2 暗号化保全 `npm run kindle:archive --workspace=@stats47/r2-storage -- --push --id <id> --version <版>` → `--audit --deep --record` (鍵のある環境。これが無いと `kdp-publish --update` の archive gate で止まる) ②Kindle Previewer で対象 EPUB (SHA) の表示確認 ③`kdp-publish --update --id K-S1-NN` ×12 (S1-01 は書名変更を含む・入稿提案 `.local/kindle-listing-revisions/`) → 承認後 `--commit` ④kdpreports.amazon.co.jp の冊別 export → `products:sales` ⑤ブログ側の同一誤り是正 (上記) と図データ再生成。
- **ランキング再利用の境界**: S2-01旧版全章レビューでDID可住地分母、死亡率/件数、従属人口指数/就労者、都道府県率の合算、単純平均/全国値、相関からの因果・算術誤りを検出。商品版のランキング章は未レビューAI解説を外して同順位の全県表・決定的集計へ再構成した。公開サイト本文は未変更のため、原典再計算とサイトownerへの是正引渡しが必要。旧版レビューを新版PASSへ流用しない。
- **停止条件**: 生成/形式検査だけで販売準備完了にしない。内部30%をAmazonの合法性・受理保証と説明しない。字数水増し・収録指標の黙った削減をしない。税務・銀行・本人認証・規約同意を代行せず、KDP Select独占を他チャネル展開と両立済みと扱わない。旧公開版・原稿を上書きしない。公開stateを機械品質の結果で書き換えない。
- **完了条件**: 全offerが対象版の実検証・独立レビュー・必要な人間確認を満たすか、採用見送り理由と再開条件が明記される。販売を選んだofferは価格・納品物・権利・公開証跡が一致する。未完了が1件でもあれば「全商品販売可能」と報告しない。

### [KDP-EXPANSION-01] 参考文献の売れ筋型に合わせてKindleラインを組み直し、実測付きで拡張する

タグ: [収益化] [種類:意思決定] [実行:対話] [検証:npm run products:kindle:report] [起票:2026-09-19] [期日:2026-10-17] [レーン:note・商品販売]

- **owner**: kindle-publisher (設計・生成) / article-writer + blog-critic (書き下ろし・意味レビュー) / kdp-operator (出品) / オーナー (KDPレポート・承認)
- **前提 (実測)**: 参考文献vaultのKindle競合5冊は形式が4型に分かれる。①単一論点の読み物 (『都道府県別平均年収ランキング』110p・本文約5.1万字・図混在。S1-01と同じ論点で直接競合) ②1県1章のガイド (『47都道府県県庁所在地ガイド』150p・約11.5万字・文字のみ) ③見出し駆動の県民性ストーリー (『おカネと健康』60p・約5.6万字・1テーマ1見開き) ④単一表の超薄型 (『遊技営業店密度』15p・約4.5千字・シリーズ刊)。出版社系3冊 (偏差値/統計から読み解く/DataBook) は指標横断の合成スコアと1県1ページ型。競合の販売数・順位は未計測 (Amazon商品ページは本セッションの許可外で読めない)。**自社22冊の売上・KENPは `sales-ledger.json` が空で未計測**。
- **順序**: ①オーナーがKDPレポート (2026-08-13〜) をexportし `products:sales` へ記録。4週窓 (08-30起点) は 2026-09-27。②S1 12冊を `PRODUCT-SALES-READINESS-01` の是正でv3化して差し替える (市場の型①に一致する主力)。③S2/S3/S4 の未公開10冊は現行設計 (主題外キー・全県表の羅列) のまま出さない。S3は型②「1県1章」へ、S4は型③「意外な1位の県民性ストーリー」へ設計変更してから再生成。④新規パイロット3冊: (a) 47県庁所在市の食卓・家計ガイド (型②。原資=県別食卓47本+a-kakei 47本、十大費目検算済) (b) 意外な1位ストーリー集 (型③。S4を置換) (c) 47都道府県 総合スコアブック (出版社型。指標横断の合成スコアはサイト未掲載で書き下ろし価値が高い。`prefecture-deviation/analyses.json` 53論点を型の参照に使い文言・構成は複製しない)。各冊は書き下ろし30%・critic PASS・Previewer確認後に公開し、4週実測で横展開を判断する。
- **設計契約 (2026-09-19 実装済み)**: `KindleBook.design` (読者の悩み / HARM / 支払う理由 / 需要の証拠 / タイトル案 2 型 / 本文の型) を新設し、`generate` は design 無しを拒否、`validate` は 31 冊を `design-missing` で warn。S1-01 は設計済み (問い型「年収が高い県は、暮らしも豊かなのか」を採用、検索・選択型を対案として保持)。残り 31 冊は本カードの順序で設計する (S1 → S3 型② → S4 型③ → 新規 3 冊)。正典: `coconala-product-standards.md` §8「編集設計」。
- **停止条件**: 売上未計測のまま10冊以上を同時公開しない。型④ (単一表の薄冊) は模倣しない (自社サイトの無料ページと同内容になり、KDPの品質判定とブランドの両方で不利)。競合本の本文・図案・章立てを複製しない (論点と型のみ)。月次計画の「KDP新規展開はやらない」はオーナー指示 (2026-09-19) で解除されたが、週次Mustの記事公開・SEOを圧迫する場合は本カードを後回しにする。
- **完了条件**: 自社22冊の4週売上が台帳にあり、S1 12冊がv3で差し替え済み、パイロット3冊が公開され各冊の初回4週KENP/販売数が記録されている。未計測のものを「需要あり」と書かない。

### [KDP-COVER-CODEX-APP-01] S1 12 冊の表紙帯絵を Codex アプリで作り直して差し替える

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node --import tsx packages/product-factory/scripts/verify-publishable.mts --version <版> --book <id> --content-only] [起票:2026-09-19] [期日:2026-10-17] [レーン:note・商品販売]

- **owner**: オーナー (画像生成) / kindle-publisher (取り込み・再生成・検証)
- **現状**: 2026-09-19 に `codex exec` + `$imagegen` で 12 枚を生成し、`assets/cover-backgrounds/K-S1-NN.jpg` (git 管理) に取り込み済み。最終版 (01 r9 / 02 r10 / 03 r11 / 04 r8 / 05 r11 / 06 r10 / 07 r9 / 08 r12 / 09 r10 / 10 r8 / 11 r8 / 12 r7) はこの帯絵で生成されている。オーナーは Codex アプリ (standalone) で自分の目で選んだ絵に差し替えたい。
- **作り方 (Codex アプリ)**: 貼るプロンプトは `.local/kindle-cover-imagegen/CODEX-APP-PROMPT.md` (12 冊を 1 メッセージで。1 冊だけなら表を 1 行に)。1 冊ずつの英文は同 dir の `prompt-K-S1-NN.txt` (12 本。型は同 dir の `build-prompts.mjs`: 紺地 #0f2540 + 琥珀のペーパーカット風・大きなモチーフ 2〜3 個・**横長 1536×1024**・文字/数字/通貨記号/ロゴ/地図/顔なし)。帯絵は表紙の**下 42% だけ**に出る (上は文字面) ので、縦長で描かない。生成した PNG を `.local/kindle-cover-imagegen/K-S1-NN.png` に置く。
- **次 (差し替え手順・kindle-publisher が実行)**: ①`npx tsx packages/product-factory/scripts/ingest-cover-background.mts --book K-S1-NN --input <png> --band` ②`products:kindle:generate -- --id K-S1-NN --version <次の版>` ③章テキストの差分 0 を確認 (`.local/kindle-audit/extract-one.mjs` で展開して前版と diff) ④`verify-epub.mts --report` → `write-review-receipt.mts` → `verify-publishable --content-only` blocker 0 ⑤入稿提案を作り直す (`export-kdp-listings.ts --version <版> --id K-S1-NN`) ⑥表紙 12 枚を 150px 幅に縮めて並べ、文字なし・主題が読めることを目視。
- **禁止**: 画像に文字・数字を焼き込まない (書名・著者は satori が実テキストで重ねる)。生成 AI の描く日本列島を使わない (2026-08-12 の指摘)。差し替え版は必ず新しい version で作り、既存版を上書きしない。KDP への表紙アップロードは `kdp-publish --update` の工程で行い、ここでは触らない。
- **完了条件**: 12 冊ぶんの帯絵がオーナー選定の絵に置き換わり、各冊の最終版が本文差分 0・`verify-publishable --content-only` blocker 0 で、入稿提案が最新版を指している。差し替えない冊は現行の帯絵のままでよい (その旨をこのカードから消して閉じる)。

### [COCONALA-PROFILE-OWNER-01] 本人手続き・実経験年数と13パックのOffice実機確認

タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-09-06] [期日:2026-09-13] [レーン:note・商品販売]

- **status**: pending（期日は次回確認期限）
- **owner**: オーナー
- **次**: ココナラ本人確認を本人が実施し、NDAは内容を確認して本人が同意する。HTML・TypeScript・Next.js・Node.jsの実際の経験年数を確認できた場合のみ技術欄へ登録する。既存13パックの修正版はWindows/Mac Office 365で表示・県図形編集・チャート編集・Excel順位再計算を実機確認する。未確認の資格・職歴年月・稼働時間は増やさない。
- **完了条件**: 本人確認・NDAの公開ステータスと、本人が申告した年数の一致を確認する。修正版13パックのOffice実機検証結果（OS・バージョン・表示・編集・再計算）を記録する。実施しない項目は本人の判断を記録し、未確認表示を維持する。
- **停止条件**: 2FA・本人確認書類・規約同意はエージェントが代行しない。経験年数・資格は推測しない。Windows/MacのOffice環境が不足する場合は未検証表示を維持する。インボイス登録を売上改善のために自動実施しない。
- **整備済み範囲の証跡**: `.claude/state/products/coconala-profile-2026-09-06.json`。プロフィール文面・画像・見本の公開更新を再実行しない。

### [AFF-FURUSATO-INVENTORY-01] ふるさと納税ポータルの提携を 2〜3 件足す (furusato 在庫 2 本 / 週 5.4 万 imp)

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node .claude/scripts/ads/audit-affiliate-inventory.ts の furusato 横長 banner ≥ 7] [起票:2026-09-03] [期日:2026-09-30] [レーン:収益導線]

- **owner**: uruhayato373 (ASP 提携) / affiliate-manager (登録)
- **追加申請の前提**: 最新の提携状態・観測範囲・証拠は `.claude/state/ads/affiliate-stocktake-latest.json` を参照。
  チョイス `s00000019332001` とさとふる `s00000014771001` は実機で明示未提携を確認したため、
  承認待ちとして扱わない。過去の申請履歴がある両案件は再申請せず、掲載判断は状態の証拠に基づく。
  もしもは2026-09-08にSID638943一致を確認済み。既存返礼品3830・3172は提携中なので再申請不要。
- **現在地 (2026-09-08)**: もしもの新規3件は申請済み。3831ポケットマルシェは審査待ち、
  1863食べチョク・55楽天トラベルは承認済み（状態の正典は `affiliate-catalog.json`）。
  承認済み2件の300×250原稿は `.local/affiliate-harvest/moshimo/2026-09-08/` に取得済み・在庫SSOT未登録。
  これらは通常商品／旅行の案件であり、ふるさと納税ポータル在庫の完了件数には含めない。
- **追加6件の次工程**: オーナー承認後にstats47から各1回申請済み（2026-09-08、重複送信なし）。
  A8の羽田産直 `s00000021701002`・九州お取り寄せ本舗 `s00000020875001` は承認済みなので、
  掲載適合性を確定して素材取得・ローカル登録へ進む。WESTERモール `s00000027147001`・
  北海道ぎょれん `s00000021814001`、afbのふるさとプレミアム `9156`・日本の旅 鉄道の旅 `16537` は
  審査待ちにつき状態照合のみ行い、再申請しない。状態の正典は `.claude/state/ads/{a8,affiliate}-catalog.json`。
  6件とも広告在庫未登録・未掲載。送信/再照合の証拠は `.local/affiliate-ops/` に保持。
- **次**: 返礼品3830・3172の原稿取得と掲載条件確認、上記承認済み素材のローカル登録。
  食品は産地に一致する食文化/特産品ページ、鉄道旅行は国内観光の文脈に限定し、返礼品在庫と混同しない。
  承認後も案件別eligibility・重複・成果条件・申請対象サイトを再照合する。浜名湖産直 `12522` は
  対象商品の紹介文が掲載条件のため保留。条件原文はこのPCの `C:/tmp/stats47-{a8,afb}-offer-details-20260908.json`。
  楽天トラベルは既存の直接提携広告と比較して採用先を決め、二重配信しない。
  もしも発行原稿の独立ピクセル・referrerpolicy・attributionsrc・PR条件を落とさない。
  別セッションを含む専用ブランチ `codex/workspace-updates-20260908` へのcommit・pushは承認済み。develop/main反映・R2更新・デプロイは別途公開承認を得てから行う。
- **なぜ**: #913 で家計調査 (ランキング 28,867 + ブログ 12,366 imp/週) と農業・地方財政が furusato に
  集まる。一方、全国対応の横長バナーは **2 本** (ふるさと本舗・au PAY) だけである。イオン九州3枠は
  地域・購買意図の不一致と成果0円の実績から2026-09-15に全配信を停止した。需要と在庫が最も逆転している軸。
- **候補**: さとふる / ふるなび / 楽天ふるさと納税 / ANA のふるさと納税 (A8・もしも・afb のどこで
  提携できるかは `/affiliate-operate` の走査で確認。ブランド適合は人の判断)。
- **手順**: ユーザーが ASP で提携申請 → 承認後 `/register-affiliate-banner register` で 300x250
  を 1 案件 1 エントリ登録 (vertical=furusato、priority は確定 EPC バンド) → develop push で R2 反映。
- **完了条件**: furusato の横長 300x250 が 7 本以上、かつ priority 上位 3 が全国対応ポータル。
- **禁止**: 楽天ふるさと納税の代わりに楽天市場の商品カードで代用しない (別チャネル)。

### [AFF-STOCKTAKE-RECONCILE-01] 提携棚卸しの不明案件と既存在庫の不一致を再照合する

タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-09-08] [期日:2026-09-15] [レーン:収益導線]

- **owner**: affiliate-operator（状態照合）/ affiliate-manager（在庫判断・ローカル修正）/ オーナー（手動ログイン）
- **証拠・対象の正典**: `.claude/state/ads/affiliate-stocktake-latest.json`。詳細な件数・状態・素材一覧は本カードへ複製しない。
- **次（実行順）**: ①帰属ガードを確認してからA8 `26822001`、afb `15671`・`14033`・`16511`・`15831` の不明状態を再照合する。②楽天は正しい広告リンク作成用IDかをオーナーに確認し、stats47の登録と既存リンクの口座一致を確認する。登録変更は別承認とする。未提携が確定した3案件は `affiliate-delivery-policy.ts` の共通停止へ反映済み、重複はprogramRef/クリック先で除外済み。これらの公開前確認は `AFF-PLACEMENT-RELEASE-01` へ分離する。
- **停止条件**: サイト・口座帰属を確定できなければ停止し、不在を未提携や終了と推測しない。新規・重複申請、認証回避、成果リンクへの確認クリック、本番変更・deploy・R2 pushは禁止。既存在庫を未確認のまま削除しない。
- **完了条件**: 各対象の状態・在庫判断を実機証拠へ結び付け、必要なローカル修正と対象の検証が完了する。不明が残る間はカードを維持し、人間作業またはガード復旧による再開条件を明記する。

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [種類:改善] [実行:対話] [起票:2026-08-13] [レーン:基盤]

- **owner**: Claude Code
- **trigger**: `CROSS-PAGE-DATA-SSOT-01`のcore契約を壊さず、Claude CodeへこのIDを指定してQG0から順に実装する。
  QG0、QG2、QG4、QG7はデータ移行と独立して先行できる。QG1、QG3、QG6の最終受入は同項目のWP6後に行う。
- **目的**: 「checkerやtestファイルが存在する」ではなく、公開値を壊す欠陥を意図的に混入したときに
  対応するPR gateが確実に失敗し、修復後にgreenへ戻る状態を作る。production workspace、R2境界、主要route、
  単位・配色・欠測の意味まで同じ契約で検証し、未実行・fail-open・過度なskipを機械的に検出する。
- **QG0 完了 (2026-08-26)**: `quality-gates.json` に26 workspaceとcritical checker 43件を登録し、
  checkerの実行文脈を `declared / invoked / blocking / scheduled` へ分類した。blocking 41件・scheduled 22件に対する
  未宣言criticalは0。未配線、docs-only、`continue-on-error`、期限切れ例外、重複ID、不存在command、
  未宣言criticalのfixture 11件と実repo監査がgreen。次はQG1から再開する。
- **QG1 checkpoint (2026-08-26)**: production webからe-Stat providerへの推移import graphをAST化し、
  static/dynamic/re-export/require/wrapper/aliasを検出、type-onlyだけを許可する18 testを固定した。
  ThemeCatalogとWeb runtimeのchart propsを共有parserへ統合し、欠落`statsDataId`、空配列、非string filter、
  未知field/chart/metricKeyを両側で拒否する。unit classifierはSI倍率、分母の母集団・量、異なる計数単位、
  片側period不明を理由付きで判定し、公開`./unit` APIを実際のテーマ軸判定へ接続した。残りはmoney unit監査の
  blocking配線とsource/stored/display/recipe変異で、QG1カード全体は未完了。
- **QG2 完了 (2026-08-26)**: `createSnapshotReader`をruntime parser必須にし、正常 / 404 / malformed /
  schema-invalid / 旧新schema / stale / 5xx / timeoutの9状態をfixtureで固定した。categoriesはproducer→reader
  round-tripとpage adapterの状態写像を検証し、stats-r2、page-components、area profile/databook、correlation、
  ranking itemなど公開routeへ届く優先readerをparser境界へ移行。reader契約inventoryも機械化した。
  対象69 test、packages 1,930 test、web 1,081 test、全workspace + scripts type-checkがgreen。次はQG3。
- **QG3 checkpoint (2026-08-26)**: 同一fixtureのmetric / year / area / value / unit / provenanceを
  ranking・theme・blog adapterで縦断照合し、10倍変異をRED、復元後25 test GREENで固定した。
  known routeをstatus / canonical / heading / data要素で検証する公開route matrixと、375 / 768 / 1280pxの
  responsive smokeを追加。初回実走でCPIの空unitとbespoke地方財政の機械属性欠落を検出・是正し、
  公開8導線 + 5テーマ全9 chart type + 4幅の25 E2E、型検査、pre-commitはgreen。
  no-data / source errorの専用表示など残りのQG3受入は継続する。
- **QG4 admin slice (2026-08-27)**: PR CIのpackages testが`@stats47/*`だけを対象にし、activeな
  `apps/admin` 16 files / 150 testsを一度も実行していなかった欠落を是正した。`test` jobでadmin unitを
  blocking実行し、command削除・`continue-on-error`化・required集約からの切断を各mutationで検知する
  workspace契約を追加。契約17件、admin 150件、型検査はgreen。
- **QG4 build / media slice (2026-08-27)**: admin production buildとdesktop smoke 15件を独立required jobへ
  接続し、build欠落・E2E soft-fail・required切断をmutationで固定した。Remotionは166 sourceの
  critical bundlerとしてbundle buildをrequired並列jobへ追加し、GESは3 sourceのtooling-only generatorとして
  PRではtype-check、外部実機生成はdeferredとregistryへ明記。親側実測はadmin build 10.72秒、E2E 15/15・19.1秒、
  Remotion bundle 9.39秒、admin/media契約10/10、workspace契約25、workflow policy 64/0、checker wiring 96・new 0。
  残りQG4は全source-bearing workspaceのrisk分類、test 0 / lint / build enforcement、CI p95集計。
- **QG4 workspace matrix (2026-08-27)**: source-bearing 25 workspaceをactive 22 / tooling-only 3へ分類し、
  type-check必須25、test必須19・none 6、build必須3・none 22、lint必須1・none 24をmanifestから自動突合する
  0.10秒のblocking契約を追加した。親側で全量/mutation契約18/18、workspace契約25、workflow policy 64/0、
  checker wiring 96・new 0を再確認。QG4の分類・配線残件は0、実CI p95は統合後のrun履歴で計測する。
- **QG5 first slice (2026-08-27)**: shape gate、unit classifier、dependency collector、chart props validator、
  R2 runtime parserの5モジュールについて、実測したlines / branches / functionsの個別floorを単一inventoryへ固定し、
  PRのrequired `test` jobへ134 testのcoverage判定をblocking接続した。inventory欠落、推測floor、Vitest配線欠落、
  soft-fail、required集約切断を8 mutation契約で検知する。追加CI時間は実測4.29秒、関連65 files / 751 tests、
  契約43件、type-checkはgreen。残りQG5はcritical module拡張、web routeロジックのpure抽出、
  `src/app`一括除外縮小、意味あるfixtureによるbranch coverage改善。
- **QG5 recipe / value slice (2026-08-27)**: metric recipeとvalue verificationを同じinventoryへ追加し、
  実測floorをrecipe 100 / 93.47 / 100、value 100 / 97.91 / 100（lines / branches / functions）に固定した。
  7領域200 testsをPR blockingへ接続し、未分類IDとrecipe branch低下のRED、復元後GREENを確認。
  data-configs全64 files / 718 tests、契約8件、type-check、pre-commitはgreen。CI増分は初回QG5比約1.1秒。
- **QG6 semantic color slice (2026-08-27)**: semantic role 20件をすべて有効なhexへ解決し、移行前14色の
  goldenを固定した。`rainbow` / `red` / `var(...)` / `oklch(...)` / `series-99`をcatalog・runtime双方で拒否し、
  consumer 0だったCSS resolverを削除。対象67 test、data-configs全727 test、type-check、catalog監査はgreen。
- **QG6 render deterministic contract (2026-08-27)**: opt-in render 9件のinventory、TZ・locale・viewport・DPR・
  font SHA・artifact出力先・RAF待機を決定的契約へ固定し、通常suite 28 files / 172 testsはgreen。opt-in実走は
  37 files / 185 testsのうちpixel差7件が残ったため、停止条件どおりPR必須化・scheduled配線は保留した。
  次は固定raster engineでgoldenを再検証し、7件を解消後にworkflowへ接続する。
- **監査ベースライン (2026-08-13、ローカル実測)**:
  - rootの`test:packages`は`vitest run --project '@stats47/*'`で、`apps/admin`のunit test
    **14 file / 136 test**はPR CI対象外。galleryにはPlaywright 6 specもあるがworkflowから呼ばれていない。
    PRのbuildは`apps/web`だけで、gallery / remotion / gesのbuild・smokeは明示されていない。
  - `apps/remotion`は約166 source file、`apps/ges`は3 source fileだがテスト0。testのない小packageもある。
    すべてへ一律にtestを足すのではなく、active / inactive / tooling-onlyとownerを先に確定する必要がある。
  - web coverage floorはlines/statements/functions 22%、branches 46%。`src/app/**`、middleware、provider、store等が除外され、
    packages側はcoverage thresholdを持たない。重要な境界が増えても全体率だけでは回帰を検出できない。
  - web E2Eは14 specあるが、known rankingを`200`または`410`で許し、`410`ならskipするケースがある。
    テーマchartの値・単位・非空状態、category / survey / tag / city-categoryの主要導線、PR前responsive smokeが不足する。
  - `fetchFromR2AsJson<T>`は`JSON.parse(...) as T`で、runtime schemaを検証しない。`packages/stats-r2`のreaderと
    `createSnapshotReader`の直接testがなく、22以上のtyped R2 read sourceに検証有無のばらつきがある。
  - e-Stat境界checkは導入途中だが、静的import中心の検出ではdynamic import、re-export、ローカルwrapper経由を
    取りこぼせる。production providerへの推移的な到達を検査し、最終allowlist 0を受入条件にする必要がある。
  - 金額単位監査は347 metric中consistent 5 / mismatch 42 / unknown 300だが、通常実行は
    `--fail-on-error`なしでexit 0。checker wiringは84 checker / new unwired 0と報告する一方、package script、docs、skillからの
    テキスト参照も「配線済み」に数えるため、PRで実行されるblocking gateかを保証しない。
  - semantic color roleは現行20個で、採用済みruntimeは生成時hex解決。一方で未定義CSS tokenを返す
    `resolveChartColorCssVar`だけが未使用で残り、resolver parity testが実consumer不在を隠す。
    visualizationのrender test 9件は`RUN_RENDER_TESTS=1` opt-inでworkflow実行がない。
  - `provenance-audit-weekly.yml`はcatalog / area databook / open-data validatorを`|| true`で継続し、全exit codeを
    集約していない。prefecture statistics / open-dataの決定的validatorやlink checkにも定期実行の空白がある。
  - theme actionには取得失敗を`[]` / `null` / 空timeseriesへ変換する経路があり、HTTP 200だけのE2Eでは
    `no-data`、`source-unavailable`、`schema-invalid`を区別できない。
  - config warningは少なくともunit語彙45 use、polarity未割当2,241、catalog warning 194が残る。
    一括strict化ではなく、warning class別の縮小ratchet・owner・期限が必要。
- **進行中実装の再監査残件 (2026-08-13、欠陥fixtureで再現)**:
  - e-Stat境界checkはstatic value importの12 testがgreenだが、`import()`、re-export、`require()`を各1件入れると
    すべて未検出 (`false`)。直接import一覧10 fileに対しproductionの`fetchEstatData(` callerは少なくとも15 file、
    `fetch-db-chart-data.ts`だけでdynamic value importが3箇所あり、現在のgreenはruntime到達0を意味しない。
  - `validateChartProps("line-chart", {estatParams:[{cdCat01:"A"}]})`とdonutの`color:"rainbow"`が
    どちらもerror 0。`componentProps`は依然`Record<string, unknown>`でapp側parserと形を二重定義し、
    `StatSeriesRef`はrepresentative fixture以外のconsumerがまだない。
  - `classifyUnitComparability`は`kg→g`、`km→m`、`l→ml`、`人口10万対→人口千対`、`件→校`を
    すべて`same / factor 1`と判定する。片側だけperiodがある場合も`same`になる。さらにpackageの`./unit` exportは
    `unit-semantics.ts`だけを指し、このclassifierはtest以外から公開・利用されていない。
  - catalogの生色は179→0まで移行した一方、roleは現行20個、CSS tokenは0、CSS resolverのconsumerも0。
    runtimeは`transform`でroleをhexへ戻す方式。移行前14 distinct色を確認する逆写像testは、移行後の
    `baseline.distinctColors=[]`をloopするため空振りgreenになり、未知roleもresolverが文字列のまま通す。
  - live監査はpure core testがなく、`--limit 0`で0/192件でも`coverageOk:true`・exit 0を実測した。
    返却行が要求filterを満たすかは照合せず、scheduled workflowも監査exit codeをIssue条件へ使うだけで
    最後に非0を返さないため、GitHub上のrunは成功表示になりうる。
- **依存と責務境界**:
  - データ取得のR2一本化、`StatSeriesRef`、単位変換一回、theme dependency、semantic color roleの実装本体は
    `CROSS-PAGE-DATA-SSOT-01`が所有する。本項目は、その契約を迂回できないtest / CI / mutationを所有する。
  - `sourceUnit` / `valueScale`と金額42件の実データ是正は`MONEY-UNIT-SCALE-01`、shape / configHashは
    `RANKING-VALUES-PARTITION-INTEGRITY-01`を再利用する。同じ分類表・allowlist・監査母集団を複製しない。
  - 公開blog / ranking / themeのlive期待集合、欠落asset / R2 payloadの是正、alertのopen / closeは
    `PUBLIC-DATA-CONTRACT-AUDIT-01`が所有する。本項目のQG2 / QG3は、その監査が使うruntime schema、fixture、
    page adapter、E2Eを所有し、別のlive scannerを作らない。
  - baselineに残る個別findingの返済は`MAINTENANCE-DEBT-PAYDOWN-01`が所有する。QG7はbaselineを増やせない
    機械契約と期限管理だけを実装し、既存findingを本項目へ複製しない。
  - 完全DBレスを維持する。廃止済みD1用のintegration testを増やさず、実態がunit testの`test:integration`は
    内容に合う名称へ変更または削除する。
- **実装規律**:
  - Claude Code単独を既定とし、同じworking treeでwriterを並行起動しない。開始時にdirty fileを列挙し、
    このIDと無関係な差分を編集・stageしない。`git add -A`、commit、PR、deploy、workflow dispatch、R2 writeは禁止。
  - 各QGで、まず最小の欠陥fixtureを入れて対象gateがredになることを確認し、その欠陥だけを直してgreenへ戻す。
    greenの確認だけで完了にしない。fixtureの欠陥は作業中に戻し、repositoryへ壊れた状態を残さない。
  - deterministicな検査はPR blocking、secret・network・pixel差の影響を受ける検査はscheduled / manualに分離する。
    不安定だから検査自体を消すのではなく、同じ契約をfixtureでPR、live dataでscheduleの二層にする。
  - baselineは現行欠陥を一時許可する縮小ratchetだけに使う。current branchの定数だけと比較せず、merge-baseの結果と比較し、
    baseline値の引上げ・allowlist追加・skip追加を通常の機能差分で同時に通せないようにする。
- **実行順**:
  1. **QG0 — 実行される品質ゲートのインベントリをSSOT化**
     - root workspace一覧、各workspaceのsource数、`type-check` / `test` / `coverage` / `lint` / `build`、
       PR / scheduled / pre-commit / manualの実行箇所をpure collectorで列挙する。active、tooling-only、inactiveを
       owner・根拠・再確認日付きで分類し、未分類をerrorにする。
     - 既存の機械configがなければ`.claude/config/`に品質ゲートregistryを置く。最低fieldは`id`、`command`、
       `scope`、`owner`、`trigger`、`blocking`、`network/secrets`、`timeout`、例外時の`reason` / `expiresAt`。
       `.github/workflows/README.md`と`docs/01_技術設計/06_自動化インベントリ.md`はこのregistryの説明・参照だけを持つ。
     - `check-checker-wiring.cjs`を、単なる文字列参照ではなく`declared` / `invoked` / `blocking` / `scheduled`へ分類する。
       package.jsonまたはdocsだけから参照されるcritical checker、存在しないcommand、期限切れ例外、重複IDをerrorにする。
     - fixtureへ「未配線checker」「docsからだけ参照」「workflow内`continue-on-error`」「期限切れ除外」を各1件seedし、
       すべて検知するtestを追加する。現行84件を新分類へ移した後、criticalな`declared-only`を0にする。
  2. **QG1 — e-Stat・単位境界の迂回防止**
     - TypeScript ASTまたは既存parserで、production `apps/web`から禁止providerまでのimport graphを作る。
       static value importだけでなく`export ... from`、`require()`、valueの`import()`、alias、ローカルwrapper経由を検査し、
       `import type`だけを除外する。endpoint文字列の直書きも別ruleで検出する。
     - static import、dynamic import、re-export、wrapper、alias、type-onlyの6 fixtureを置く。最初の5つがred、type-onlyだけがgreen。
       移行中allowlistはfileと理由・期限を持つ縮小専用とし、`CROSS-PAGE-DATA-SSOT-01`完了時に0へする。
     - catalog validatorとapp側`theme-chart-props.ts`が別々に形を解釈しないよう、chart種別のshared schemaまたは
       単一parserへ寄せる。`CatalogChart.componentProps`の`Record<string, unknown>`をdiscriminated unionへ置換し、
       現行移行中schemaでも`estatParams`内の`statsDataId`必須、空配列、非文字列filter、未知field / 未知chartを両方向testする。
       `StatSeriesRef`はfixtureを作るだけで完了にせず、実catalogとreaderのconsumerになり、metricKeyをregistry照合する。
     - money unit監査をPRまたはsnapshot生成前のblocking commandへ配線する。mismatchは常にerror、unknownは
       `meta-missing` / `no-tab-pinned`等のreason別baselineにし、新規unknownとbaseline増加をerrorにする。
       `sourceUnit`、stored/display unit、scale、period、recipeHashを1つずつ変異させ、取り込みgateとR2監査の両方が落ちることを確認する。
     - unit modelに基底単位への倍率と分母の量・母集団を持たせ、`kg↔g`、`km↔m`、`l↔ml`、`kWh↔MWh`、
       `人口10万対↔人口千対`を正しい倍率または比較不能へする。`件↔校`のような異なる計数単位を自動でsameにしない。
       periodが片側だけ不明な場合もsameと断定せず、理由付きunknown / incomparableへする。
     - 金額だけでなく上記SI・分母・計数・片側periodを両方向mutationへ追加し、`./unit`の公開entryからclassifierを
       importできるようにする。少なくとも実際のchart軸判定または監査1箇所をこの公開APIへ移し、test専用の死んだSSOTにしない。
  3. **QG2 — R2 producer / schema / reader契約をruntimeで閉じる**
     - R2 readerをconsumer別に棚卸しし、criticality、runtime parser、missing時の挙動、fallback、ownerを表にする。
       genericの`JSON.parse(...) as T`をproduction境界で直接使わず、既存schema libraryまたはpure type guardをreaderへ渡す。
     - `packages/stats-r2`、ranking item / values、page-components、categories、area profile/databook、correlations等の
       公開routeに届くsnapshotから優先してschemaを定義する。producerが出力したfixtureを同じreaderで読む
       round-trip testを置き、producerとconsumerが別の型を複製しない。
     - `createSnapshotReader`へ、正常、404、malformed JSON、schema-invalid、旧schema、新schema、stale、5xx、timeoutのtestを置く。
       fallback可能な旧schemaは明示migrateし、壊れたpayloadを空配列へ変換しない。
     - 返り値を少なくとも`ok` / `no-data` / `source-unavailable` / `schema-invalid` / `stale`で識別し、
       page adapterが各状態を意図した表示・ログへ写像するtestを追加する。retryやstatus分類にモデルを使わない。
  4. **QG3 — 公開ページの値・単位・欠測を縦断検証**
     - 固定fixtureに、同じmetric / year / areaの期待value・unit・label・provenanceを置き、ranking、theme、blog chart adapterが
       同じreader結果を表示するcontract testを作る。値の10倍、yearずれ、unitだけ変更、area欠落を別mutationとして落とす。
     - Playwrightのroute matrixへhome、known ranking、theme代表9 chart type、category detail、survey list/detail、tag、
       prefecture、city-categoryを登録する。公開が契約済みのknown routeで`200 | 410`や条件付きskipを許さず、
       期待status、canonical、主要heading、chart/data要素をassertする。
     - theme代表routeはHTTP 200だけでなく「期待chart数」「各chartのdata state」「unit」「year」「空でない系列」を検査する。
       意図したno-data fixtureは専用表示をassertし、source errorで空表示へ化けるケースを分離する。
     - 375 / 768 / 1024 / 1280pxのうち主要3導線をPR smokeへ入れ、全routeのresponsive監査はscheduledに残す。
       テストコメントとfixtureから旧D1前提を除き、R2 snapshot契約へ合わせる。
  5. **QG4 — workspace別CI matrixを明示化**
     - rootの`test:packages`を「packagesだけ」と明示したまま、active appを含む`test:all`相当の入口を追加するか、
       workflowでworkspace matrixを生成する。`apps/admin`の14 file / 136 unit testをPR CIへ必ず含める。
     - galleryはtype-check・unit・buildをblockingにし、6 Playwright specは変更pathでPR、全件をscheduledにする。
       remotionはactiveならtype-check/buildと代表compositionの決定的render smoke、gesはactiveならtype-checkと最小unit testを追加する。
       inactiveなら「testなし」を黙認せず、owner・理由・再確認期限付き例外にする。
     - sourceを持つpackageについて、純関数・変換・公開export・外部I/O境界の有無でrisk分類する。criticalなのにtest 0、
       `lint` scriptなし、build成果物を公開するのにbuild未実行、workspace追加後にmatrix未登録の状態をcheckerで拒否する。
     - CI時間をjob summaryへ記録し、cache込みPR p95が既存上限を5分超えて増える場合は、非決定的E2E/renderをscheduledへ分ける。
       type-check、unit、schema、境界guard等の決定的gateは時間理由で外さない。
  6. **QG5 — coverageを全体率から重要契約の回帰防止へ変更**
     - webとcritical packageのcoverage JSONを保存せず集計し、module / folder別の現行値を再計測する。
       初期floorは実測値を超えて推測せず、merge-baseからlines / branches / functionsのいずれも低下したら失敗させる。
     - 新規・変更したpure validator、unit classifier、shape gate、dependency collector、R2 parserは、全分岐をfixtureまたは
       mutationで通す。生成file、型だけのfile、framework boilerplate以外を都合よくcoverage除外へ追加しない。
     - `src/app/**`を一括除外したままにせず、route固有ロジックをpure moduleへ抽出してunit対象にし、page wiringはE2Eで検査する。
       package coverageをPR matrixへ足し、低い全体率を埋めるだけの無意味なtestは追加しない。
  7. **QG6 — semantic colorとrender結果を実ブラウザまで検証**
     - 採用済みの最終形を「git TSはrole、page-components / R2 / renderer入力は生成時に
       `resolveChartColorHex`でhex化」へ統一し、現行rendererを変えず未使用CSS resolverを削除する。
       CSS-var追従は今回へ混ぜず、必要ならdark modeの挙動変更として別途判断する。
     - 現行`CHART_COLOR_ROLES`全件（現在20）について、role→hexの全域性とcatalog→生成物の解決を確認する。
       移行前14 distinct hexはcatalogの
       空集合から導出せず固定fixtureまたはmerge-base生成物から取り、全色が同じ出力へ写る非空testにする。
     - 色キー値は「raw colorの正規表現に一致しない」ではなく「既知roleである」を条件にする。`rainbow`、named color、
       `var()`、`oklch()`、不明roleをvalidatorで拒否し、移行完了後のresolverは未知値を素通しせずfail-closedにする。
     - Playwrightで代表chartの実描画色を読み、未解決値、正負色反転、seriesと凡例の色不一致、light/darkのcontrast不足を検査する。
       新しいliteral colorは既存例外以外でPRを失敗させる。
     - opt-inのrender test 9件を、font・locale・timezone・viewportを固定して実行する専用jobへ配線する。
       変更pathではPR、全件はscheduledで実行し、差分artifactを保存する。pixel更新は欠陥を説明せず一括acceptしない。
  8. **QG7 — fail-open、warning、skip、baselineの縮小管理**
     - `provenance-audit-weekly.yml`で各validatorのexit codeを個別に保持し、最後に集約してjob statusとIssue本文へ反映する。
       出力収集目的の`|| true`は許しても、最終stepが1件でもerrorなら非0で終了するtestを置く。
     - prefecture statistics / open-dataの決定的validatorをPRまたはscheduledへ配線し、network link checkはtimeout、retry、
       stale判定、alert ownerを持つscheduled jobにする。secret不足は成功扱いせず`not-run`としてsummaryとalertに出す。
     - catalog、polarity、unit語彙、maintenance debt等のwarningをcode別に数え、`count`、`owner`、`reason`、`expiresAt`を持つ
       shrink-only baselineへ移す。新code、新warning、期限切れ、件数増加、baseline引上げを失敗させる。
     - `test.skip`、環境変数opt-in、除外glob、`continue-on-error`を機械列挙し、owner・理由・期限のないcritical除外を拒否する。
       product factoryの凍結test、GIS/e-Stat live test、render test等を同じregistryで追跡する。
     - `theme-chart-live-audit.mjs`のargument / mirror schema / inspect / coverage判定をpure coreへ分け、0・負数・NaNのlimit、
       空mirror、重複key、件数不一致、API status、malformed JSON、wrong-filter rowsをfixtureで検査する。partial実行は
       `coverageOk:false` / `status:partial`とし、smoke成功と全件成功を同じexit / stateで表現しない。
     - e-Stat返却行の`@tab` / `@cat01`等を要求した`cdTab` / `cdCat01`等と照合し、APIがfilterを無視して別系列を返しても
       greenにしない。scheduled jobはstate保存とIssue更新を終えた後、監査失敗なら最終stepで非0を返す。
  9. **QG8 — 最終mutation、文書、preflight**
     - e-Stat dynamic / wrapper、金額scale、SI倍率、分母量、R2 schema、theme dependency、未知色role、色逆写像の空集合、
       live監査0件 / wrong-filter、known route、workspace未登録、validator exit code、warning baselineの欠陥を一つずつseedし、
       該当PR gateだけがred、復元後に全gateがgreenになる結果を表で記録する。
     - `npm run type-check`、`npm run test:packages`、`npm run test --workspace=apps/admin`、
       `npm run test:coverage --workspace=apps/web`、web Playwright、active appのtype-check/build、追加したquality registry testを実行する。
       R2 schema / SSG / routeに触れたまとまりの節目で`npm run build --workspace=apps/web`も実行する。
     - 恒久契約だけを`apps/web/tests/README.md`、`.github/workflows/README.md`、
       `docs/01_技術設計/06_自動化インベントリ.md`とコード近傍READMEへ反映する。文書変更後は
       `npm run docs:fix`、`npm run docs:check`、`npm run docs:check:all`を実行し、開始時の既存warningから増えていないことを確認する。
     - 変更file、追加job、CI時間before/after、未実行live監査、例外残数、rollbackをpreflightとして提示する。
       commit / PR / deploy / workflow dispatch / branch protection変更はownerの明示承認まで実行しない。
- **停止条件**:
  - merge-baseとの差分を取れずbaselineを縮小専用にできない、またはmutationを入れても想定gateがgreenのまま。
  - CI追加がcache込みp95で5分超の増加、外部API rate limit、secret不足、pixel差の非決定性によりPRを安定して再現できない。
    この場合はdeterministic fixtureをPRに残し、live / visualだけをscheduledへ分離して再計測する。
  - runtime schema導入で既存R2 payloadを後方互換に読めず、remote再生成・R2 write・公開値変更が必要になる。
  - inactive workspaceの削除、branch protection、GitHub secret、remote workflow、deploy、R2への変更が必要になる。
  - ユーザー差分との競合、検査母集団の理由なき減少、allowlist / baseline / skipの拡大が必要になった場合は、
    対象、証拠、影響、最小の選択肢を提示してowner判断を待つ。
- **完了条件**:
  - 全workspaceと全critical checkerがregistryで分類され、criticalな`declared-only`、ownerなし、期限切れ例外が0。
    galleryの136 unit testがPRで実行され、active appはtype-check / test / buildの必要範囲が明示される。
  - production webからe-Stat providerへの推移的到達0。dynamic import / re-export / wrapperを含む陰性対照が境界gateで落ちる。
  - chart propsのshared schemaをcatalog / validator / app parserが共有し、`Record<string, unknown>`の二重解釈がない。
    `StatSeriesRef`が実catalog / readerで使われ、欠落`statsDataId`、未知field、未知metricKeyを拒否する。
  - unit classifierが金額、SI倍率、分母量、計数語、両側/片側periodを理由付きで判定し、誤ったfactor 1を返さない。
    公開package entryから利用でき、少なくとも1つのproduction判定と監査が同じAPIを使う。
  - 公開routeへ届くcritical R2 snapshotはruntime schemaとproducer-reader round-trip testを持ち、malformed / old / stale / 5xxを
    空データと区別する。同じfixtureのmetric / year / value / unitがranking、theme、blogで一致する。
  - known routeを`200 | 410`やskipで逃がさず、代表9 chart typeの非空・unit・year・data stateをE2Eが検証する。
  - 全color role（現行20）が選択した単一の解決方式、catalog、生成物、rendererで一致し、未知roleを拒否する。
    移行前14色の非空goldenとrender test 9件がPR変更pathまたはscheduledで実行される。
  - provenance等のvalidator失敗が最終job statusへ伝播し、warning / skip / baselineはcode別縮小ratchetで新規増加0。
  - theme live監査は0件・partial・wrong-filterを全件成功と扱わず、collectorが返す期待集合（現行移行中192件）の
    全件照合時だけcoverage成功になる。
    監査失敗はstate / Issue更新後もscheduled runの最終statusへ非0で伝播する。
  - QG8のmutationがすべて意図したgateをredにし、復元後に対象test、全type-check、必要build、docs checkがgreen。
    CI時間は停止条件内で、未実行のlive検査・外部反映・例外は0またはowner・期限付きで明示される。
- **正典**: `.github/workflows/pr-quality-check.yml` / `.github/workflows/README.md` /
  `docs/01_技術設計/06_自動化インベントリ.md` / `apps/web/tests/README.md` /
  `.claude/scripts/lib/check-checker-wiring.cjs` / `apps/web/coverage-thresholds.json` /
  `packages/r2-storage/src/lib/operations/` / `packages/stats-r2/` /
  `CROSS-PAGE-DATA-SSOT-01` / `MONEY-UNIT-SCALE-01` / `RANKING-VALUES-PARTITION-INTEGRITY-01` /
  `PUBLIC-DATA-CONTRACT-AUDIT-01` / `MAINTENANCE-DEBT-PAYDOWN-01`

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [進行中] [起票:2026-07-22] [レーン:データ品質]

- **owner**: Claude Code
- **現況**: 全`article.md`参照から期待asset集合を作る公開契約監査へ拡張済み。公開434記事・本文参照
  1,091 assetで `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` だけが404。SVGは既存JSON/sourceから
  ローカル再生成済みで、公開gateもdata refresh / blog publish / 週次へ配線済み。R2全量pullのdry-runは
  `app/blog` 8,913 files（local差分8,526）を確認したが、read-only取得の承認前なので実pullしていない。
- **2026-08-27 生成物監査**: R2 `app/blog` 8,944 filesをローカルへ同期し、432記事・2,443 SVGを同一lintで
  再走査した。構造error 98記事、dark mode非対応135記事を機械stateへ記録した。旧stateの98記事・141 SVG・error 0は母集団が
  生成物全量を覆っておらず、完了証拠には使えない。公開参照asset契約とSVG内容品質は別gateとして維持する。
- **次**: 構造error 98記事を優先し、小バッチで処理する。R2由来、算式、年、metric keyを復元できない図は
  推測で再生成しない。公開参照asset契約と内容品質gateを各バッチ後に再実行する。
- **完了条件**: 全公開記事の参照assetが200、must-fix 0、公開gate greenとなり、source lineage不明の図は削除または明示的に保留される。
- **正典**: `.claude/rules/blog-data-schema.md`

### [BLOG-CARD-CALLOUT-RELEASE-01] 実装・検証済みで未コミットの「ブログのランキングカード」と「callout 改修・本文部品の角丸トークン」をコミットして本番へ出す

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-25] [レーン:UI・回遊]

- **現在地 (2026-09-25 確認)**: 下記の実装は `e6eb6a044` で develop にコミット済み・main には未反映 (本番 `/api/ranking-card/<key>` は 404)。
  残りは本番デプロイ (オーナー承認が必要) と、デプロイ後のブログ→ランキング遷移の計測だけ。
- **背景 (2026-09-25 セッション 84b4ab41 で実装)**:
  ① ブログ本文の `<source-link>` を地図 + 上位 3 県のカード (`RankingLinkCard`) にし、`/api/ranking-card/[rankingKey]` (CDN 1 日キャッシュ)
  から後読みする。クリックは `nav_click` (`nav_surface=blog_ranking_card`、`nav_label`=rankingKey) で送る。
  ② callout をアイコン + 日本語ラベルの `Callout.tsx` にし (高さ 183→129px、左の色バー廃止)、種類の定義を `callout-config.ts` に集約。
  ③ 本文の中の部品用の角丸トークン `--content-radius` (6px・`rounded-content`) を新設し、ランキングカード・callout・コードブロックに適用。
  デザイン検査に 3 規則 (`content-radius-only-in-article-body` / `article-body-parts-use-content-radius` /
  `content-radius-single-definition`) を追加し、callout の左バー例外を撤去。
  検証済み: ブログ機能テスト 95 件・`@stats47/ranking` の home-featured テスト 9 件・型チェック (web / ranking / components)・lint・
  デザイン検査・文書検査が通過。新規 3 規則は違反の注入で検知を確認。localhost で 390px / 1440px 表示とクリック計測を確認。
- **対象ファイル**: 新規 `apps/web/src/app/api/ranking-card/[rankingKey]/route.ts`、`apps/web/src/features/blog/components/`
  の `RankingLinkCard.tsx` / `Callout.tsx` / `callout-config.ts` / `__tests__/RankingLinkCard.test.tsx` / `__tests__/Callout.test.tsx`。
  変更 `md-content.tsx` / `md-preprocessor.ts` / `__tests__/md-preprocessor.test.ts` / `features/blog/index.ts`、
  `apps/web/src/lib/analytics/events.ts`、`apps/web/src/app/globals.css`、`apps/web/tailwind.config.ts`、
  `packages/components/src/lib/cn.ts`、`packages/ranking/src/exporters/home-featured.ts` (+ test・`index.ts`、`deriveFeaturedTopList`)、
  `docs/01_技術設計/04_デザインシステム.md`、`.claude/design-system/prohibited.md`、`.claude/rules/analytics-event-standards.md`、
  および下記の混在ファイル。
- **注意 (混在ファイル)**: `.claude/rules/ui-components.md` と `apps/web/scripts/check-design-system.mjs` には並行セッション
  (順位チップの `RankBadge` 共通化など) の変更も入っている。`git add -A` せず、このカードの差分だけをハンク単位で選んでコミットする。
- **次**: ① 並行セッションの状況を `npm run agent:session -- --status` で確認し、上記ファイルだけをコミット (develop)。
  ② `NAV-CLICK-COVERAGE-01` の P1 と同時に出すなら、`RankingLinkCard` の `trackNavClick` を属性方式に揃えてから出す。
  ③ 本番反映はブログが事前生成のためデプロイが必要。オーナー承認を得て、他の変更とまとめて 1 回で出す。
- **完了条件**: 上記がコミット済みで本番デプロイされ、本番のブログ記事でランキングカード (地図 + 上位 3 県) と新しい callout が表示され、
  GA4 に `nav_surface=blog_ranking_card` の `nav_click` が届いている。

### [SITE-DISPLAY-SEMANTICS-AUDIT-01] 表示の「意味」(ラベルと指標・年・単位・用語) を定義・全 URL・代表 URL の 3 層で検査し、週次の UI 指摘キューにつなぐ

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **背景 (2026-09-25 `/areas/13000` の全面確認)**: 見つかった不具合の大半は URL 単位ではなく定義 (テンプレート・カタログ) 単位で、
  47 ページ等に一斉に出ていた。既存の週次ページ品質監査はレイアウトの崩れを見るが、ラベルと数値の意味は見ていない。
  試作の判定規則 (「比・率・割合」ラベル × 総数指標 / 「年間」の節 × 月額指標 / 「10万人当たり」の節 × 総数) を
  県データブックのテンプレート 47 指標に当てると 4 件を検出し、目視で見つけた 3 件 (医師数・一般病院数・消費支出) と一致した。
- **次 (層ごと)**:
  1. **定義の検査** (コミット前・CI): 県データブックのテンプレート、ThemeCatalog、page-components の定義を対象に、
     ラベルと指標の意味の整合 (単位の正典 `packages/data-configs/src/unit/` で判定し、指標キーの名前推定に頼らない)、
     数値カードの年表示の必須化、「推移」グラフの最低点数を検査する。
  2. **全 URL の静的検査** (既存の週次 page-quality): 内部用語の混入 (辞書。例「保存則」)、単位記号の揺れ (%/％)、
     `<title>` の週次変化、同じ店の広告の重複、`NaN`/`undefined` 等の異常文字を指標に加える。
  3. **代表 URL のブラウザ検査**: 小さすぎる文字の数、スマホでのページ高さをテンプレート別の予算で見る
     (2026-09-25 実測の参考値: `/ranking/natto-consumption-expenditure` は 11px 未満の文字が全 8 幅で 8 か所、スマホのページ高さ 5,284px)
     (グラフ文字の切れは `UI-CHART-TEXT-LOOP-01` が担当)。
  4. 違反は既存の UI 指摘キュー (`ui-findings.ts`) に流し、`UI-FIX-*` の自動起票とループに乗せる。週次 UI 確認エージェントの
     プロンプトに「データの意味」の観点を足すのは指摘止まり (関門にしない)。
- **停止条件**: 誤検知の出る規則を blocker にしない。まず全コーパスで該当率を測り、確実なものだけ blocker、残りは warning。
  数値そのものの一次統計との照合は既存のランキング整合性監査の担当で、ここでは扱わない。
- **完了条件**: 3 層の検査が配線され、それぞれ違反を 1 件注入すると検知される。初回実行の検出結果を修正カードへ振り分け済み。
- **検知すべき実例 (2026-09-25 に `AREA-DATABOOK-LABEL-INTEGRITY-01` で直した 4 件。定義の検査の回帰テストに使う)**:
  ① 総数の指標に「10万人比」のラベル (医師数) ② 月額の指標を「年間支出」と説明 (消費支出) ③「人口当たり」と説明した節に
  総数の指標 (一般病院数) ④ 数値カードに年が無い。

### [AREA-HIGHLIGHTS-SSOT-01] 県の「特徴」の候補・値・選び方・表示を 1 系統にまとめ、Web と SNS で共用する

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **背景 (2026-09-25 実測)**: 県の特徴データが 3 系統ある。A `app/areas/<code>/profile.json` (公開中の全約 2,000 指標から
  5位以内/43位以下を抽出、`packages/area-profile/src/exporters/area-profile-snapshot.ts`) を Web のカード
  (`AreaRelatedRankingsCard`)・`<title>`/description・OGP 画像 (`AreaOgp`)・関連ブログ記事 (`AreaRelatedBlogArticles`) が
  それぞれ先頭から切り出す。東京都は上位 893 件 (1位 588 件) で、表示は R2 の読み出し順で決まり、title もこれで決まる。
  古い値 (上位 85 件・下位 20 件が 2014 年以前、「耕地放棄面積 2014年度」を表示中)、規模効果 (下位表示 4 件が農業の総数)、
  「下位=赤の下向き矢印」による良否の誤解 (耕作放棄地 47 位 = 最少) を含む。B `databook.json` (人手選定の
  `AREA_DATABOOK_TEMPLATE` の値・全国順位・年・単位・全国平均) と、C SNS `.claude/scripts/sns/lib/ig-area-props.ts`
  (同じテンプレートの値・順位を values.json から自前で再計算) が並存する。SNS は 2026-09-23 に A を「品質が悪い」として捨て、
  中立表現 (強み/弱みと書かない)・サブタイトル込みラベル・家計調査の県庁所在市注記を実装済み。しきい値 5/43/47 は
  抽出関数・県ページ・市区町村ページに直書き。市区町村は Web が型 (`CityProfileData`) と R2 パスを独自定義
  (パッケージに `cityProfileKeyPath` がある)。A の `percentile` は未使用。A の生成は sync-snapshots の約 15 分。
  生成物の検査・週次監視は無い (しきい値関数の単体テストのみ)。
- **次 (実行順)**:
  1. 候補を `AREA_DATABOOK_TEMPLATE` の指標に限定し、値・順位に加えて表示ラベル (readerLabel + subtitle)・分野・
     家計調査判定・決定力 (隣接順位との差) を `databook.json` に焼き込む。SNS の再計算は廃止して `databook.json` を読む。
  2. SNS の選定純粋関数を `packages/area-profile` へ移し、既存の掲載価値スコア (`packages/data-configs/src/prominence/`、
     GSC 需要を含み週次再生成) と新しさを加える。Web の 5 か所 (カード・title/description・OGP・関連ブログ記事・
     市区町村ページ) と SNS が共用し、件数は引数で渡す。1 カード内の分野重複は禁止。
  3. 「順位 + 指標 + 値」の一覧表示部品を 1 つにし、県カードと市区町村ページで共用する。表現は SNS の中立規約に合わせ、
     良否の色は `METRIC_POLARITY` で確定した指標だけに付ける。**順位チップは既存の `RankBadge`
     (`apps/web/src/components/atoms/RankBadge.tsx`、2026-09-25 `52e582d98`) を使い、新しい部品を作らない。** 現在
     `AreaRelatedRankingsCard` は上位=`tone="positive"`・下位=`tone="negative"` 固定なので、`tone` を極性から決める形に変える
     (高いほど良い→上位 positive / 下位 negative、高いほど悪い→逆、未確定→`neutral`)。見出しの上向き・下向き矢印の色も同じ規則にする。
  4. 市区町村の型・R2 パスをパッケージに一本化し、しきい値は選定関数の中だけに置く。
  5. 契約テストで固定する: 選定関数以外での `strengths` / `weaknesses` / databook 指標の直接切り出し 0・しきい値の直書き 0・
     同じ値の二重計算 0。生成直後に 47 県を検査し (古い年・分野偏り・非公開指標)、違反で R2 反映を止める。
     カードのクリックは `NAV-CLICK-COVERAGE-01` の導線名で計測する。
- **決めること**: 県の `profile.json` を廃止するか (移行後は利用者 0) / 総数指標を人口当たり指標に置き換えるか /
  掲載価値スコアと順位の極端さの組み合わせ方。
- **停止条件**: OGP 画像の再生成と R2 反映はオーナー承認まで行わない。候補を絞った結果カードが埋まらない県が出たら、
  テンプレートの拡充 (`area-databook-designer`) を先に行い、全指標プールへは戻さない。
- **完了条件**: Web と SNS が同じ選定関数と `databook.json` を使う。47 県すべてでカードが埋まる候補数がある (実測)。
  古い年 0・分野重複 0・良否の誤表示 0。契約テストと生成時検査が違反の注入で落ちる。title は選定入力が変わるとき以外に変わらない。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 県の「特徴」カードで、2003・2007・2014 年度の古い値が新しい値と同じ見た目で並ぶ / 北海道で大人用サンダルの
  支出額と消費量という重複した指標が下位に 2 つ並ぶ / 老年化指数・年平均気温など良し悪しの向きの無い指標が赤い「下位」扱い / 失業率・交通事故件数の
  1 位が青い強調バッジで良い順位に見える / 順位バッジの見た目が 3 種類混在。選び方と表示を 1 系統にまとめる際にこれらを基準に入れる。

### [NAV-CLICK-COVERAGE-01] サイト内リンクのクリックを既定で全件計測し、名前の無い導線を週次で減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [期日:2026-10-23] [レーン:計測]

- **背景 (2026-09-25 実測)**: 2026-08-23〜09-19 の 28 日 (国内) で、サイト内のページ移動は 11,319 件
  (`internal-transitions.csv`) なのに、部品単位で記録されたクリックは最大 2,124 件 (`nav_click` 1,770 / `rail_click` 310 /
  `home_featured_click` 41 / `cta_click` 3、`event-volume.csv`) で約 2 割にとどまる。計測は部品ごとの手動追加で、
  `next/link` を使う 52 ファイルのうち計測呼び出しを持つのは 15 ファイルしかない。ブログ本文の `<source-link>` は
  2026-09-25 まで無計測だった。外部リンク (GA4 拡張計測の `click` 234 件) とアフィリエイト (`affiliate_click` /
  `affiliate_impression`) は記録済みなので、欠けているのは「サイト内のどの部品から移動したか」だけ。
- **方針**: 計測の既定を「全部送る」に反転する。ルートレイアウトに共通のクリック監視を 1 つ置き (capture 登録。
  Next.js の Link が既定動作を止めるため)、サイト内リンクのクリックを既存の `nav_click` で送る。導線名は外側の
  `data-nav-surface`、ラベルは `data-nav-label` (無ければページ種別名。URL は `nav_href` が持つ) から取り、
  導線名が無ければ `unlabeled` で送る。GA4 側の登録作業は不要 (登録済み dimension の値追加)。
- **次 (実行順)**:
  1. **P1**: 共通監視、型付き属性関数 (`NavSurface` で縛る)、既存 `trackNavClick` のうちリンクを送る箇所の属性化
     (導線名・ラベルの値は変えない)。`rail_click` / `cta_click` / `home_featured_click` / `affiliate_click` は専用処理を残し、
     領域に `data-click-owner` を付けて共通監視から除外する。リンク以外の操作 (チェックボックス・セレクト) は現状維持。
     未コミットのブログカード (`RankingLinkCard` / `/api/ranking-card`) も属性方式にそろえる。
     `UI-CARD-HEADER-SIMPLIFY-01` が同じレール部品 (`SurfaceCard.tsx` の `RailCard` 等) のクラスを変えるので、同じコミットに混ぜない
     (P1 は属性の追加だけ、見出しの見た目は同カードで変える)。
  2. **P2**: 全ページに出る共通領域 (ヘッダー・フッター・パンくず・ページ送り・タグ・ブログ本文リンク) に導線名を付ける。
     目標の名前なし割合は代表 URL で実測してから決める。
  3. **P3**: `page-quality` の全 URL 静的解析に「名前の無いサイト内リンク数」「計測担当の無い広告リンク数」を追加し、
     テンプレート別に縮小専用の基準線を置いて、違反を既存の UI 指摘キュー (`UI-FIX-*` 起票) に流す。
     描画後に出るリンクは代表 URL のブラウザ検査で数える。
     **衝突注意**: `UI-CHART-TEXT-LOOP-01` (途中成果はブランチ `wip/ui-chart-text-loop-01`) と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も同じファイル群
     (`.claude/scripts/page-quality/lib/ui-report.ts` の `UI_METRIC_KEYS`・`types.ts`・`page-quality-budgets.json`・`measure-static.ts`) に
     指標を足す。並行して実装せず、後から入る側が先行分を取り込んでから足す。
  4. **P4**: `fetch-ga4-snapshot.mjs` の `nav_click` 集計から「テンプレート別の `unlabeled` クリック上位」と
     「導線名付きクリック ÷ サイト内ページ移動」を計測サイクルと週次レビューに出す。台帳
     (`.claude/rules/analytics-event-standards.md`) に値追加とデプロイ日の件数不連続を書く。
- **停止条件・禁止**: クリックを止める処理 (`preventDefault` / `stopPropagation`) を入れない。見た目・マークアップ構造・
  クラスを変えない。タブ切替・スクロール等の画面内操作とアフィリエイトの表示回数計測は対象外。本番デプロイは P1 と P2 を
  まとめて 1 回、オーナー承認の上で行う。デプロイ後に `nav_click` が 2 倍近く跳ねたら二重送信を疑い、先に原因を特定する。
- **完了条件**: ① 単体テストが「1 クリック 1 件」「広告・`data-click-owner` 付きは送らない」「送信時に遷移を止めない」を
  固定し、localhost の代表 7 種ページで実クリック 1 回につき送信 1 件を確認済み。② 本番デプロイ後の週次 page-quality に
  新指標が出て、違反を 1 件注入すると検知されることを確認済み。③ 週次の計測サイクル出力に被覆率と `unlabeled` 上位が
  出ている。
- **P1 済 (2026-09-26・未コミット・未デプロイ)**: `apps/web/src/lib/analytics/components/NavClickTracker.tsx` をルートレイアウトに置いた。
  既存の `trackNavClick` 32 か所は書き換えず、同じクリックで部品側が送ったら共通の監視は送らない方式にした (値を変えない・二重送信しない)。
  `rail_click` / `cta_click` / `home_featured_click` の 4 部品に `data-click-owner`。ブログの目次は `blog_toc` + 見出しのラベル。
  単体テスト 6 件 (1 クリック 1 件・専用領域と外部は送らない・部品側と重ならない・遷移を止めない)。二重送信防止を外すと red。
  localhost で実クリック: トップ (ヘッダー=部品の 1 件 / フッター・本文=unlabeled 1 件 / 注目ランキング=0 件)、ランキング
  (右レール=rail_click のみ / パンくず 1 件)、ブログ目次 (blog_toc 1 件)。代表 7 種のうち、カテゴリ・県・テーマ・調査は開発サーバーの
  メモリ不足で未確認。台帳 (`analytics-event-standards.md`) に値追加とデプロイ前後の不連続を記録済み。
- **P2 済 (2026-09-26・未コミット)**: フッター `footer`・パンくず `breadcrumb` (共通部品とブログ)・タグ `tag` (ラベル=tagKey)・
  ブログ本文のサイト内リンク `blog_body` に導線名。localhost のブログで各 1 クリック 1 件・導線名付きを確認。ページ送りの共通部品は無かった。
- **P4 済 (2026-09-26・未コミット)**: `fetch-ga4-snapshot.mjs` が `nav-click-surfaces.csv` (nav_click を導線名×ラベル別・Japan-only・28日) を取り、
  計測サイクル (`summarizeNavCoverage`) が「導線名付きクリック ÷ サイト内の移動」の被覆率と導線名なしの上位を LATEST.md に出す。
  CSV が無い週 (デプロイ前) は節を出さない。metrics:test 127 件 PASS。**実データでの確認はデプロイ後の最初の日曜計測**。
- **次**: デプロイ後の週次で被覆率を読み、導線名なし上位から名前を付ける。P3 (page-quality の静的解析に名前の無いリンク数) は `UI-CHART-TEXT-LOOP-01` と
  同じファイル群を触るので、あちらの取り込み後。

## 🟡 中 — 2〜3ヶ月以内

### [CSV-DL-INTENT-SURVEY-01] CSV ダウンロード後に用途 1 問と任意の連絡口を置き、実務利用者を見つける

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-26] [レーン:行政資料]

- **オーナー判断 (2026-09-26 壁打ち)**: CSV のサブスク化・登録制はしない。DL は無料・登録なしのまま、「誰が何に使っているか」を知る導線だけを置く。
- **根拠**: ランキング CSV の DL は 28 日で 193 件・120 ページ (`ADMIN-STAT-PILOT-01` の GA4 実測)。支払意思の証拠は 0 件で、聞き取り記録 `.claude/state/products/admin-stat-interviews.json` は目標 3 件に対して 0 件。
- **やること**: ①DL 直後に任意の 1 問 (用途: 業務資料 / 学習・研究 / 報道・執筆 / 個人の関心 / その他) を出し、回答を GA4 イベントで送る (analytics-event-standards の台帳に先に登録)。②「業務でお使いの方は話を聞かせてください」の任意の連絡口を置く。
- **禁止**: DL の必須登録、メールアドレス等の個人情報の保存 (DB レス方針・プライバシーポリシーの改訂が先)。回答を購入意思の代用にしない。
- **完了条件**: localhost で DL 後に 1 問が出て、回答が GA4 DebugView で観測でき、未回答でも DL が妨げられない。4 週後に用途別件数を `ADMIN-STAT-PILOT-01` へ転記する。
- **進捗 (2026-09-26)**: 実装済み・未デプロイ。`DataUsageCard.tsx` に DL 後の用途 1 問 (業務の資料 / 学習・研究 / 報道・執筆 / 個人の関心 / その他 / 答えない) と、「業務の資料」回答者にだけ既存のお問い合わせフォームへの案内を出す。イベントは `csv_download_purpose` (`trackCsvDownloadPurpose`)。**残り**: ①GA4 で `download_purpose` をカスタムディメンション登録 (オーナー、台帳 ⏳要登録) ②次回まとめデプロイ ③デプロイ後 DebugView で観測 ④4 週後に件数を転記。

### [AFF-OFFER-ROTATION-01] 高単価案件と無料登録型案件を、1 枠ずつ順番に試して確定収益で比べる

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-26] [レーン:収益導線]

- **オーナー判断 (2026-09-26 壁打ち)**: 広告の数は増やさないが、出す案件の種類は色々試す。対象は (a) 高単価案件 (b) 無料登録・資料請求だけで成果になるハードルの低い案件。
- **制約 (実測)**: 2026-08-10〜09-06 の 28 日でクリック 13 件。同時に複数案件を入れ替えると、どれが効いたか分離できない (収益化戦略 §7)。
- **やり方**: CTR が出ている面 (article-end 0.195%・home-left-rail 0.654%) の 1 枠だけで、案件を 2 週間ずつ入れ替える。候補は `.claude/state/ads/a8-catalog.json` の `epcYen × confirmRatePct` と、成果条件が「無料登録」の案件から、各面の主題に合うものを選ぶ。評価は確定収益 / 1,000 viewable impression (クリック数ではない)。
- **前提**: A8・もしもの再ログインで確定成果の計測が戻っていること (現在 `auth_required`)。計測できない期間の入れ替えは結果が残らないので始めない。`AFF-INTENT-FALLBACK-STOP-01` / `AFF-SLOT-REDUCTION-01` のデプロイと同じ週に重ねない。
- **完了条件**: 3 案件以上を各 2 週間回し、案件ごとの imp・click・確定収益を表にして、残す案件と外す案件を決める。

### [YEAR-COV-20260926] 年カバレッジ: 最新 1 年だけに絞っている e-Stat 指標 10 件の years を広げる

タグ: [コンテンツ品質] [種類:改善] [実行:sweep] [検証:npx tsx .claude/scripts/data/assert-year-coverage-batch.ts .claude/state/data/estat-year-coverage/backlog-batches/YEAR-COV-20260926.txt] [起票:2026-09-26] [レーン:データ品質]

- **自動起票**: `sync-year-coverage-backlog.mjs` が週次の年カバレッジ監査 (`.claude/state/data/estat-year-coverage/queue.json`) の要拡張候補から作った。対象 key の一覧は `.claude/state/data/estat-year-coverage/backlog-batches/YEAR-COV-20260926.txt`。規約の正典は `.claude/rules/metric-config-standards.md`「`years` は最新年だけに絞らない」。
- **対象** (config の年数 → e-Stat に値がある年):
  - `actual-income-worker-households-per-month` (statsDataId 0000010212): 1 年 → 1975〜2024 の 50 年
  - `annual-precipitation` (statsDataId 0000010102): 1 年 → 1975〜2024 の 50 年
  - `annual-precipitation-days` (statsDataId 0000010102): 1 年 → 1975〜2024 の 50 年
  - `annual-sunshine-duration` (statsDataId 0000010102): 1 年 → 1975〜2024 の 50 年
  - `area-ratio-of-total` (statsDataId 0000010202): 1 年 → 1975〜2024 の 50 年
  - `average-relative-humidity` (statsDataId 0000010102): 1 年 → 1975〜2024 の 50 年
  - `average-temperature` (statsDataId 0000010102): 1 年 → 1975〜2024 の 50 年
  - `avg-propensity-to-consume-worker-households` (statsDataId 0000010212): 1 年 → 1975〜2024 の 50 年
  - `avg-savings-rate-worker-households` (statsDataId 0000010212): 1 年 → 1975〜2024 の 50 年
  - `bank-deposit-balance-per-person` (statsDataId 0000010203): 1 年 → 1975〜2024 の 50 年
- **次**: 各 key の metric config の `years` を上の「e-Stat に値がある年」の範囲へ広げる (監査が `getStatsData` で実測した年。北海道 1 件の判定なので、他県で欠ける年は再投入後の `audit-reingest-queue.ts` と ranking-integrity 監査が拾う)。同じ statsDataId の中で系列の定義や単位が年ごとに変わる key は広げず by-design に記録する。
- **記録**: 広げない key は `node .claude/scripts/data/sync-year-coverage-backlog.mjs --mark-by-design <key> --note "<理由>"` で記録する (以後の起票から外れる)。
- **停止条件**: R2 への再投入・本番 deploy をしない (config を直した後の再投入は `audit-reingest-queue.ts` が検出し、data-ingester が行う)。判断できない key はそのまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全 key が config で複数年になったか、理由付きで by-design に記録された)。

### [NOTE-PLAN-DBLESS-01] note 企画 (docs/30) に残る「D1 にデータがある」前提を現行の R2 に直し、F-3 記事の扱いを決める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:note・商品販売]

- **背景 (2026-09-25 の docs 監査)**: 完全 DB レス (永続 D1 なし) へ移った後も、note 企画が D1 を現行の置き場として書いている。
  agent が企画を読んで制作に入ると、存在しない D1 を探すか、廃止した構成を記事にする。
  - `membership-articles/series-A-half-century.md` (7 箇所)・`series-C-practical.md`・`series-D-cross-analysis.md`: 「データは D1 にあり」
  - `membership-articles/series-F-behind-the-scenes.md` の F-3「D1 + R2 で大量統計データを月¥5 で運用する」と `INDEX.md`・`membership-strategy.md` の同記事行: 記事の主題そのものが廃止した構成
  - `backlog/A-localfinance-theme.md` の更新手順: 「ローカル D1 へ INSERT」
- **次**: ① A/C/D は各指標の R2 `app/stats/<key>/values.json` と年数を確かめてから置き場の記述を直す (年数は検証せずに書き写さない)。
  ② F-3 は「DB レスへ移った経緯」の記事に作り替えるか、企画から外すかをオーナーが決める。③ 手順書は git TS → R2 の現行経路に直す。
- **完了条件**: `grep -rnE "(^|[^A-Za-z0-9])D1([^0-9A-Za-z]|$)" docs/30_note記事企画` の結果が、経緯として「旧」「廃止」を明記した行だけになる。

### [STRATEGY-FOCUS-2026-10-01] 10月の重点を「計測・データ品質・UI・回遊」の3レーンにし、週次 Must を各レーン1件に絞る
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-25] [期日:2026-10-01] [レーン:計測]

- **結論 (2026-09-25 壁打ち・オーナー合意)**: 最優先は計測 (測る → 記録 → 改善のサイクル)。データ品質と UI も 10 月に進める。行政資料 pilot は重点から外し、`ADMIN-STAT-PILOT-01` の聞き取りはオーナー主導で期日管理だけ続ける。
- **根拠**: 週次収益 (NSM) をまだ数字で言えない (A8 確定成果は 2026-09-21 から `auth_required`、GA4 カスタムディメンション 4 項目は未登録)。計測の残作業は A8 再ログインと GA4 登録というオーナー作業が中心で、Claude の作業枠は UI とデータ品質へ回せる。データ品質の `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01` は 2 か月未着手。
- **リスクと歯止め**: `weekly.md` (W39) で Must は 5 週連続未達。重点を 3 つに増やして各レーンから複数件入れると同じ形になるため、**週次 Must は各レーン 1 件 (合計 3 件)** に制限し、総量を増やさない。
- **やること**:
  1. 収益化戦略 §5 のレーン表で「UI・回遊」を「攻める」へ変える。狙いは「計測で効果を判定できる UI 改善に限る」とする。
  2. 10 月の `monthly.md` の `focus_lanes` を 3 レーンにする。
  3. 重点の上限 (1〜2 レーン) を 3 へ緩める代わりに「週次 Must は各重点レーン 1 件まで」の規則を `strategy-lanes.cjs`・`/monthly-plan`・`/weekly-plan` に入れる。
- **UI の順番**: `NAV-CLICK-COVERAGE-01` (回遊を測る土台) → 不具合 (`SITEWIDE-DUPLICATE-LINK-RATIO-01` / `RANKING-MAP-TABLE-CARD-01` / `AREA-DATABOOK-CHART-FIX-01`) → `UI-CARD-TYPOGRAPHY-UNIFY-01` の検証完了 → 判断待ち 3 件 (`LAYOUT-MAX-WIDTH-DECISION-01` / `AREA-TOC-MOBILE-01` / `RANKING-SOURCE-TRIPLE-01`)。検索集客の主面であるランキングページを優先する。
- **データ品質の範囲 (2026-09-25 更新)**: 25 + 12 指標の欠損は実測で解消済みだったため、全指標の機械チェックと 4 基準の継続ループ
  (`DATA-QUALITY-LOOP-01`) と、誤りの早急な修正 (`DATA-VALUE-ERRORS-01`) に置き換える。週 5 指標ずつ進める。
- **未検証**: UI の改善が回遊・収益に効くか。これは UI・回遊レーンの「構えを変える条件」そのもので、`NAV-CLICK-COVERAGE-01` 完了後に計測で判定する。
- **完了条件**: レーン表の更新、10 月 `monthly.md` への `focus_lanes` 反映、`npm run docs:check` で DG076 が出ず、週次 Must が各レーン 1 件以下であることを検査が確かめる。

### [RANKING-FIRST-VIEW-RELEASE-01] ランキングページを「最初の画面で答えを出す」形に改修し、既存 3 件とまとめて 1 回のリリースで測る
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **結論 (2026-09-25 壁打ち・オーナー合意)**: UI はランキングページを最優先にする。ランキングは PV 19,040 (国内 28 日、全体の約半分)・
  検索クリック 3,861 (GSC W38) の最大の面で、1 人あたり PV は 2.00。
- **問題 (2026-09-25 localhost 778px で確認)**: `/ranking/national-pension-full-exemption-rate` の最初の画面はタイトルと地図だけで、
  1 位・最下位・値という検索者の答えが無い。データの年は年の選択の中の「2006年度」にしか出ず、20 年前のデータだと気づけない。
- **範囲 (1 回のリリースにまとめる)**: ① 最初の画面に「1 位・最下位・値・年・単位」の要約を出す (新規) ② `RANKING-MAP-TABLE-CARD-01`
  (地図と表を 1 枚に) ③ `RANKING-PAGE-STRUCTURE-01` (補足文・出典・関連一覧の整理) ④ `RANKING-SOURCE-TRIPLE-01` (出典 3 か所。
  推奨: 見出し直下の 1 行とページ末尾の詳細の 2 か所にし、サイドバーから外す)。同じページに変更を小分けに重ねると効果を分離できない
  (収益化戦略 §7) ので 1 回で出す。データのページの最大幅 (`LAYOUT-MAX-WIDTH-DECISION-01`) はデスクトップ幅を見てこの中で判断する。
- **守ること**: スマホの LCP を悪化させない (`PERF-RANKING-LCP-03`・PSI モバイル最低点は ranking の 46 点)。データの年は
  `DATA-QUALITY-LOOP-01` の基準 3 (調査終了の明示) と整合させる。
- **測り方**: 基準値はランキングの 1 人あたり PV 2.00・ランキング→他ページの遷移 (`internal-transitions.csv`)。目標値は根拠が無いので
  今は置かず、`NAV-CLICK-COVERAGE-01` で部品別のクリックが取れてから決める。
- **完了条件**: 4 項目が 1 回のリリースで本番に出て、390 / 768 / 1440px の撮影で最初の画面に要約が見え、LCP が悪化していない。
- **全面点検で追加した範囲 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: 1 年だけの `/ranking/junior-high-club-per100-swimming` の見出しに種目 (水泳部) が無く、地図の下の小さな文字にだけ出る。
  - 高: `/ranking/natto-consumption-expenditure` (世帯あたり) に「人口 10 万人あたり」「面積あたり」の計算方法の切替が出る。県庁所在市の値なのに表・上位 3 県で「福島県」と県名で出る。
  - 中: 「全国平均」が 47 都道府県の単純平均で、公式の全国値と誤解させる (データの意味としては `DATA-VALUE-ERRORS-01` でも扱う)。
  - 中: 東京だけが濃く他県がほぼ同じ色になる線形の配色 (`/ranking/total-population`)。推移の無い指標で「推移データなし」だけの大きな枠。
  - 中: 1440px の右レールで指標名が括弧の途中で切れ、同名に見える行を区別できない。
  - 低: 出典の下に単独の「総数」ラベル / 「46 神奈川県」で 47 位が無い理由 (同率) が出ない / 長い指標名がパンくずで 2 行になる。
  - 凡例の向きと負の値の棒は別カード `RANKING-LEGEND-DIRECTION-01` (🔴) で先に直す。
- **このリリースに相乗りする未反映の修正 (2026-09-25 夜、localhost で確認済み・未コミット)**:
  `RANKING-LEGEND-DIRECTION-01` (凡例の向き・0 基準の棒) / `CHART-YAXIS-LABEL-CLIP-01` (縦軸の省略表記と左余白) /
  `AREA-DATABOOK-LABEL-INTEGRITY-01` (県データブックの指標差し替え・年の表示) /
  `THEME-CHART-LOAD-LATENCY-01` (テーマのサーバーアクションを束ねる。localhost で 48 件直列 → 2 件・約 1.5 秒)。
  **デプロイ後に本番で測り直す**: `/themes/population-dynamics?pref=13000` を開いて最後までスクロールし、
  `performance.getEntriesByType('resource')` の POST が 2〜3 件、画面に入ったグラフが 3 秒以内に描かれること
  (修正前の本番実測は POST 48 件・重なり 0 件・約 19 秒)。
  **県データブックはデプロイ後に `sync-snapshots` を回して `app/areas/<code>/databook.json` を作り直す**。
  差し替えた 2 指標 (医師数・一般病院数の人口 10 万人当たり) は作り直すまで値が無く、カードごと表示されない。

### [DATA-QUALITY-LOOP-01] 全指標のデータ品質を機械チェックし、「誤り・古さ・終了・薄さ」の 4 基準で継続的に直すループを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **経緯 (2026-09-25 実測)**: `improvements.md` の `DATA-ESTAT-FETCH-01` (25) / `DATA-MANUAL-RESTORE-01` (12) の 37 metric は、
  今日時点で全件 R2 に 47 都道府県分の値があり欠損 0・本番 200 (R2 は 2026-09-05 再生成)。「取得失敗で空ページ」という前提は解消済み。
  残る問題は古さと表記の誤りで、例: `national-pension-full-exemption-rate` は最新 2006 年 (2 年分) なのに GSC 28 日 172 表示 / 17 クリック、
  `elderly-single-person-households` は最新 2005 年。→ improvement-triage が上記 2 行を理由付きで終了し、このカードへ引き継ぐ。
- **判断基準 (上から最初に当てはまる処置)**:
  1. 値・単位・年表記が誤っている → すぐ直す (`DATA-VALUE-ERRORS-01`)
  2. 公式にもっと新しい年が公表されている → 更新する。GSC 表示の多い順
  3. 調査が終了し新しい年が無い → 公開を続け、ページに「○年で調査終了」を明示する。後継統計があれば差し替える
  4. 観測 1〜2 年かつ需要ほぼ 0 → noindex 候補 (`RANK-THIN-01` と同じ基準で判断)
  - 「古い」の目安は「最新年が公式の最新公表から公表周期 1 回分以上遅れている」。需要は順番を決めるためだけに使う (4 を除く)。
- **既存の仕組みと穴**: 週次の `ranking-integrity-audit-weekly` / `provenance-audit-weekly` / `estat-year-coverage-audit-weekly` と
  `/audit-units` がある。穴は 3 つ。(a) 年カバレッジ監査は**単年設定の 582 件だけ**が対象で、`years: "all"` なのに元の統計が
  古い年で止まっている metric を見ない。(b) 年・年度の表記の誤りを見る検査が無い。(c) 年カバレッジ監査の要拡張候補
  (2026-09-19 時点 87 件、`.claude/state/data/estat-year-coverage/queue.json`) を処理するカードが無く、見つけても直されていない。
- **次**: ① 既存の週次監査に「最新年と今日の差」「時点統計の年度表記」を足す (新しい監査を作らず既存に統合する)。
  ② 検出結果を 1 つのキューにまとめ、基準 1〜4 の処置を付ける。③ 週 5 指標ずつ、需要の多い順に処置する (`STRATEGY-FOCUS-2026-10-01` の
  「週次 Must は各レーン 1 件」の枠で回す)。④ 年カバレッジ監査の要拡張候補 87 件は 2026-09-26 から `YEAR-COV-*` カードとして 10 件ずつ自動起票される (`CYCLE-HEALTH-01` ②)。
- **完了条件**: 週次の監査が全指標の古さ・表記を検出してキューへ積み、キューの処置状況が管理画面か週次レビューで見え、
  4 週続けて「新規検出 ≤ 処置件数」で残件が減っている。

### [GEO-UI-READABILITY-01] 地域分析 (Geo) のページで表・数値・用語が読者に読めない箇所を直す
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: `/geo/population-land-price`・`/geo/population-flood-risk/15/overlap` の「47 都道府県の全データ表」が 390 / 640 / 768px で押しつぶされ、県名が 1 文字ずつ縦に並ぶ。
  - 高: `/areas/02000/landslide-exposure` の「数値の確かめ方」で人口が「1,203,780.9571人」と小数 4 桁。1440px で地図が「読み込んでいます…」のまま、768px で凡例の区域が地図に見えない。
  - 中: 読者向けの本文に内部用語が並ぶ (「coverage 47/47」「GEOAI 横断比較」「SHICODE」「A33-25」「46/46照合」、`/geo/datasets/A03` の「CHUBU-tky/A03-03_…topojson」というファイル名)。
  - 中: `/geo` の地図プレビューで駅名が重なり読めない。地域名ラベルが地図を覆う。390px で問い文が途中で省略される。
  - 中: 凡例が文章だけで色見本が無い (`/geo/population-land-price`)。`/geo/layers/population-mesh` の「灰色は 0 人」と「空白は 0 と断定できない」が矛盾する。
  - 中: `/geo/datasets/A03` は「三大都市圏」なのに初期表示が中部圏だけ。
- **確認済み (2026-09-24 の週次指摘)**: `/geo` の「地図プレビューを取得できませんでした」は今回再現しない。
- **完了条件**: 上の高・中の項目が直り、`/geo` 系の代表 5 ページを 390 / 768 / 1440px で撮影して確認する。
- **済 (2026-09-26・未コミット)**: 47 都道府県を並べる Geo の表 5 つを折り返さず横スクロールにした (`whitespace-nowrap`・`scrollRegion`)。
  localhost `/geo/population-land-price` 390px で県名セルが 1 行 (36px)、表 1,490px を幅 324px の枠でスクロール、ページのはみ出しなし。
- **残り**: ① 小数 4 桁の人口 (「1,203,780.9571人」) は、`GeoLandslideAudit` の保存則の検証表と地図ポップアップにある。検証表は
  丸める前の値で合計を示すための精度なので、読者向けの表示を丸めるかは `geo-analysis-standards.md` と合わせて決める。
  ② 内部用語 (coverage・SHICODE・ファイル名) の言い換え。③ 凡例の色見本・「灰色は 0 人」と「空白は 0 と断定できない」の矛盾。
  ④ `/geo/datasets/A03` の初期表示が中部圏だけ。⑤ `/geo` の地図プレビューの駅名の重なり。⑥ 1440px で地図が読み込み中のまま。

### [CHART-AXIS-READABILITY-01] グラフの軸・凡例・ラベルがスマホで読めない、欠ける、単位が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: ブログ記事 (`/blog/local-government-debt-burden`・`/blog/beer-peak-month-july-to-december`) の図表が 390px で軸・県名・数値が極小になり読めない。
  - 高: `/areas/13000/population-dynamics` の人口移動フロー (サンキー図) の県名・人数が 390px で約 5px。
  - 中: 県ページ・県×テーマ・`/japan/education-culture`・市区町村ランキングのヒストグラムで軸の文字が 5〜6px。縦軸に単位が無い。
  - 中: 右端の年ラベルが「2020年)」「2021年」のように切れる。横軸の目盛が不等間隔 (1975/1990/2005/2015)。
  - 中: ブログのビール記事で凡例が横軸ラベルに重なる。縦軸ラベルがタイトルの長文の繰り返し。散布図の点に県名が無い。タイル地図の淡い色に白文字。
  - 中: `/themes/real-income` の物価地域差指数の縦軸が 0 始まりで 100 前後の変化が平らに見える。
- **関連**: 検出と修正を回す仕組みは `UI-CHART-TEXT-LOOP-01`、県データブックのグラフは `AREA-DATABOOK-CHART-FIX-01`、縦軸の桁欠けは `CHART-YAXIS-LABEL-CLIP-01`。
- **完了条件**: 軸の文字が 390px で 10px 以上、全グラフの縦軸に単位があり、上記ページで切れ・重なりが無い。
- **済 (2026-09-25 夜・未コミット)**: 縦軸ラベルの左端の切れ。`leftMarginForTickLabels` (`packages/visualization/src/shared/layout.ts`) で
  積み上げ面・折れ線・複合グラフの左余白を目盛りの文字列から決めるようにした。localhost `/areas/13000` 390px で 6 グラフとも最左ラベルが左端から 2px 以上内側。
  縦軸の省略表記も「1400.0万」→「1,400万」に短くした (`compactAxisFormat`)。
- **残りの本丸 (設計が要る)**: D3 のグラフは幅 800 の viewBox で描いて縮小表示するため、390px では文字が約 4 割 (実測 5px) になる。
  文字を 10px 以上にするには、表示幅を ResizeObserver で測り viewBox 単位の文字サイズを逆算する必要がある。ただし文字を大きくすると
  横軸の年ラベル (今はデータ数で 5 年ごとに間引き) が重なるので、**間引きもラベル幅と表示幅から決め直す**必要がある。
  チャート部品の設計なので `chart-component-builder` の範囲で、積み上げ面・折れ線・複合・ヒストグラムを同じ仕組みで直す。
- **別経路のもの**: ブログの図は静的 SVG なので、直すには図の再生成と R2 反映 (承認が要る) が要る。サンキー図・物価指数の縦軸 (0 始まり) は部品ごとの修正。

### [MUNI-PAGE-QUALITY-01] 市区町村のページが薄く、強みの選び方・一覧・ナビに誤りがある
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:ランキング]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: 強みのカードに値 0 の指標が「県内 3 位 (0 人)」と並ぶ (`/areas/29000/cities/29363`)。「86.65店」のように分母の無い小数が出る (`/areas/13000/cities/13101`)。
  - 中: 実数で比べるため人口規模で決まる指標ばかりが強みになる (札幌市)。値に年度が無い。人口などの基本データが無く、強み数件と一覧だけ。
  - 中: 東京都の一覧に 23 区が「特別区部」1 件しかなく、千代田区から他の区へ移れない。一覧が固定の高さで切れ、スクロールできると分からない。
  - 中: `/municipalities/ranking/junior-high-school-count` で八王子市・福山市・川口市だけリンクが無い。同名の自治体 (府中市など) を区別する県名が無い。
  - 低: 補足行が「東京都 東京都 千代田区」と県名を重ねる。ヘッダーの現在地が「都道府県」になる。
  - 撮影時に `/areas/29000/cities/29363` が 390 / 640px で一時的な HTTP 503 (再取得では 200。`CF-CPU-SURGE-01` の観測に追記)。
- **完了条件**: 強みの選定から値 0・分母なしを除き、人口当たりの指標で選ぶ。23 区を個別に並べる。代表 3 市区町村の撮影で上記が解消している。

### [UNIT-NOTATION-FORMAT-01] 単位と数値の表記がページごとに不揃い
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 「k g」「h a」「m2」「1 km2」「74.2指数」「41 %」と「27%」の混在 / 「8,552,651百万円」「656,171,677千円」のような桁の多い表記 /
  「5,761千円」と「2,995.9千円」で小数の桁数が不揃い / `/themes/real-income` で「545.8千円」と「450,485円」が単位違いで並ぶ / 値と単位が改行で割れる (「545.8 千/円」)。
- **次**: 表示用の単位整形を 1 か所 (`packages/data-configs/src/unit/` の正典) に寄せ、kg・ha・m²・km² と半角の空白規則をそろえる。大きな金額は億円・兆円に換算する。
- **完了条件**: 県ページ・カテゴリ・テーマ・survey の代表ページで表記がそろう。
- **済 (2026-09-26・未コミット)**: 表示用の `formatUnitForDisplay` (`packages/data-configs/src/unit/unit-display.ts`・NFKC + m²/m³) を作り、
  ランキング (表・上位3県・全国平均・地図凡例・関連ランキング)、県データブック、テーマの指標カード・比較・ヒストグラム、県の関連ランキングの
  12 部品に当てた。localhost `/ranking/artificial-forest-area` で UI 部品の「ｈａ」は 0 件。共有の読み込み関数では正規化しない
  (product-factory が全角「％」の単位で突き合わせるため)。
- **残り**: ① AI 解説と FAQ の本文 (R2 に保存済みの生成文) の全角単位は、生成処理 (`packages/ai-content`) で正規化してから生成し直す (R2 反映は承認後)。
  ② 残りの約 60 ファイルの単位表示 (`grep -rnE "\{[a-zA-Z.?]*\.unit\}" apps/web/src`)。③ 百万円・千円の大きな金額を億円・兆円に換算する
  (単位の換算は `unit-semantics.ts` の正典で決め、自前のスケール表を書かない)。④ 小数の桁の不揃い (5,761千円と 2,995.9千円)。

### [HUB-LIST-FINDABILITY-01] 一覧ページで目的のものを探しにくい (分類・検索・並び順・日付)
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: `/survey` は約 100 の調査が分類・検索・並び順の規則なしで並ぶ / `/themes` は 55 テーマが分類なしの同形カード /
  `/blog` は 390〜992px で新着記事が約 2 画面下まで出ない / `/tag/population` の記事カードに日付が無く並び順が分からない /
  `/municipalities` で自分の市町村を探す入口が最下部 / `/areas` は県名だけで数値が無い / カードの題名・説明が「…」で切れる
  (ホーム・カテゴリの新着ブログ・`/themes`・`/survey`。カードの型の統一は `UI-CARD-TYPOGRAPHY-UNIFY-01`)。
- **完了条件**: 各一覧に分類か絞り込みがあり、並び順の基準が画面に出ている。

### [SURVEY-PAGES-01] 統計調査のページで、調査と関係のない指標が並び、最新年が誤って見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/survey/census` (国勢調査) の代表ランキングと全 307 件の一覧に、道路実延長・粗出生率・消防ポンプ・警察費など
  他の調査の指標が並ぶ。中: 「最新 2024 年」と出るが国勢調査の最新回は 2020 年。中: 道路実延長 (1km² 当たり) の単位が「km」。
  中: 1024px の代表ランキング 4 列で 1 位の数値に地図が重なって見える (解像度が低いため要実機確認)。
- **次**: 調査との紐付けを出典ベースで見直す (`.claude/rules/survey-linkage-standards.md`・`/audit-survey-linkage`)。最新年は調査の実施年から出す。
- **完了条件**: `/survey/census` に国勢調査由来の指標だけが並び、最新年が 2020 年と表示される。

### [PRODUCTS-PAGE-CONTENT-01] 商品ページで中身が分からず、購入の判断ができない
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:note・商品販売]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/products` の Kindle 書籍カードの多くが「販売中の旧版です。新版は審査中…」の定型文で、内容が分からない。
  中: `/products/data-p-01` の「含まれるもの」がファイル形式の列挙だけで、収録指標・年次・見本が無い。低: 表紙画像が無い。
  「14 点の編集可能データ」に「個別分析サービス」が混ざる。
- **注意**: note・商品販売レーンは「維持」。新作や新チャネルは足さず、既存商品の説明の是正だけを行う。
- **完了条件**: 各商品に固有の内容紹介と収録内容・見本があり、定型文だけのカードが 0 件。

### [GA4-FULL-MEASUREMENT-01] GA4 を全ページで使い切る (計測の是正 → 文脈・操作・成果 → API 登録 → 週次集計・BigQuery)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-26] [レーン:計測]

- **オーナー判断 (2026-09-26)**: API 登録は 1 承認で最大 10 件 / クエリだけの変更も page_view として数え続け、`pv_trigger` で区別する / BigQuery (daily・無料枠) を今回含める。
  設計の全文は計画 `~/.claude/plans/stats47-ga4-sparkling-blum.md` (セッション計画。恒久判断は下記 SSOT へ反映済みまたは反映予定)。
- **Phase 0 (オーナー)**: ①設定変更用 SA を作り GA4 プロパティの編集者にする (GCP ロールは付けない) → `gh secret set GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON --env google-admin-production` → 手元の鍵を削除 ②GA4 →「BigQuery のリンク」で daily のみ有効 (ストリーミングは有料なので付けない) ③読み取り SA に BigQuery ジョブユーザー (プロジェクト) + データ閲覧者 (`analytics_463218070`) を付ける。登録も BigQuery も遡及しないので早いほど得。
- **Phase 1 (済・2026-09-26、未コミット)**: identity から AdSense を除外 / 対象外 blocker で止めない / 1 承認 最大 10 件 / key event 作成 action (`AUTHORED_KEY_EVENTS`) / 監査に key events・custom metrics・保持期間・Google signals・拡張計測・BigQuery link・audiences を追加し、週次 `measurement-cycle` の `ga4Settings` に要約。google-admin テスト 43 件 pass。
  **実測 (2026-09-26 audit-api)**: CD 16 件 (EVENT) / key events は `purchase` のみ / 保持 14 か月 / Google signals 有効 / audiences 2 / BigQuery link 0 / **拡張計測の履歴変更 page_view が ON** (アプリの手動 page_view と二重計測の疑い。Phase 2 で送信を実測して確定する)。
- **本番反映・登録 (2026-09-26)**: PR #1029 を main へマージ (Deploy run 36224274042 success)。拡張計測の履歴変更 page_view を Admin API で OFF にし、本番でサイト内遷移 1 回 = page_view 1 件 (参照元 = 移動元) を観測。Admin API でカスタムディメンション 18 件 (EVENT 17 + USER 1) と key event 4 件を作成し、`audit-api` で台帳突合 confirmed-registered 49・拡張計測 warnings なし。GA4 権限は 2026-09-26 に `ststs47-mac` / `stats47-windows` を編集者へ変更 (オーナーが APIs Explorer で実行)。計測の不連続は `.claude/state/metrics/releases/2026-09-26-ga4-measurement-v2.json`。**Phase 0〜4 完了。残り = Phase 5 (週次 snapshot の新 CSV・GA4 adapter) と Phase 6 (BigQuery。オーナーが GA4 画面で daily 連携を作成し、読み取り SA に BigQuery の 2 ロールを付ける)。**
- **Phase 2 実測 (2026-09-26、本番 stats47.jp)**: サイト内リンクで 1 回移動すると page_view が **2 回**送られる (1 回目 = アプリの手動送信で参照元が空、2 回目 = 拡張計測の履歴変更で参照元が正しい)。着地の 1 回目は 1 件。→ アプリ側は参照元を直前のサイト内 URL にし `pv_trigger` を付けた (未デプロイ)。**残り: オーナーが GA4 管理画面 → データストリーム → 拡張計測 →「ブラウザの履歴イベントに基づくページの変更」を OFF にする** (OFF にするまで二重計測が続く。OFF の日を計測の不連続点として release 記録に残す)。
- **Phase 2・3 の進捗 (2026-09-26、未コミット・未デプロイ)**: 済 = 参照元の引き継ぎ・`pv_trigger`・gtag 未ロード時の再試行・`history.csv` new_users=0 の是正・search-growth の GA4 欠損誤判定の是正 (回帰テストは修正前コードで落ちることを確認)・`content_group` とページ文脈・`ui_interaction` (ランキングの地図/表タブ・年度・基準・地域区分、テーマの指標/表示タブ)・`read_progress`・`search_result_click`・`contact_click`・`declared_purpose`・台帳と `AUTHORED_DIMENSIONS` の更新 (EVENT 17 件 + USER 1 件、`content_id`/`target_key`/`analysis_id`/`data_version`/`comparison_size` は登録しない)。検証 = `npm run type-check` exit 0、vitest 73 files / 552 tests、localhost で ui_interaction・read_progress・search_result_click を観測。**見送り**: Geo の pathname 書き換え (2026-09-05 に意図して入れた共有 URL 形式のため)、survey / affiliate 集計への Japan フィルタ追加 (実験の観測期間中で比較基準がずれるため)、NSM snapshot の旧定義の改名。
- **Phase 2 (当初計画)**: 計測の是正 — referrer の引き継ぎ、`pv_trigger`、Geo の pathname 書き換え、gtag 未ロード時の再試行、events.ts 外からの送信の集約、拡張計測の二重 page_view の実測と対処。取得側 — `history.csv` new_users=0、search-growth の `ga4:sessions` 欠測、`ga4_organic_quality` の organic 絞り込み、survey / affiliate の Japan フィルタ、NSM snapshot の旧定義。
- **Phase 3**: `content_group` と page 文脈 (`ranking_key`/`category_key`/`theme_slug`/`area_code`)、`ui_interaction` (`ui_action`/`ui_target`)、`read_progress`、`search_result_click`、`contact_click`、user property `declared_purpose`。台帳と `AUTHORED_DIMENSIONS` を同時に更新。Phase 2+3 は 1 回でデプロイする (要承認)。
- **Phase 4**: デプロイ直後に `google-admin-settings.yml` plan → apply (承認 2〜3 回)。対象: `card_variant`/`slot`/`experiment_variant`/`download_purpose`/`theme_slug`/`area_code`/`ui_action`/`ui_target`/`pv_trigger`/`progress`/`result_type`/`result_position`/`analysis_slug`/`interaction_type`/`geography`/`cta_id`/`target_type` + USER `declared_purpose` + key events 4 件。
- **Phase 5**: 週次 snapshot に content-group / key-events / interactions / read-progress / download-purpose、効果判定エンジンに GA4 adapter。
- **Phase 6**: `fetch-ga4-bigquery.mjs` で週次集計 (journeys / search-terms / unregistered-params / session-depth)。課金の有無を確認し、クエリに `maximumBytesBilled`。
- **旧カード統合**: `GA4-DIMENSION-PRIORITY-01` (home_featured 3 項目の登録) は Phase 4 に吸収した。
- **完了条件**: `npm run google-admin:audit-api` で Phase 4 の全件が confirmed-registered、key events 4 件、BigQuery link 1 件、拡張計測の二重 page_view 警告なし。次の日曜 snapshot に Phase 5・6 の新ファイルが出る。

### [EFFECT-TARGET-MARKERS-01] 効果判定エンジンが GSC 施策 10 件を 1 件も判定できない状態を解消する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:計測]

- **根拠 (2026-W38 の計測サイクル)**: `improvements.md` の GSC 施策 10 件 (`SEARCH-GROWTH-CYCLE-01` / `COVERAGE-LOOP-01` /
  `RANKING-REINDEX-01` / `BLOG-SEO-TYPES-01` / `BLOG-SEO-QUEUE-01` / `BLOG-SEO-PACE-01` / `BLOG-LINKROT-01` / `SITE-LINKROT-01` /
  `THEME-EXPANSION-EFFECT-01` / `STP-AI-WATCH-01`) は、機械判定の目印 (`[gsc-page: /path]`・デプロイ済日・`[target: …]`) が欠けていて
  機械判定 0 件。測っても判定まで閉じないので、改善サイクルの「記録 → 改善」が回っていない。
- **次**: improvement-triage (improvements.md の排他 writer) が 1 行ずつ、根拠のある目印を足すか、目標値を後付けせず終了または
  事前 target 付きの新規計測へ移すかを決める (`evidence-based-judgment.md` 状況 4: 根拠のない想定値を書かない)。
- **一次処理 済 (2026-09-26・未コミット・improvement-triage)**: 10 行のうち 4 行を理由付きで終了した。
  内訳は `SEARCH-GROWTH-CYCLE-01` (承認の運用でページ効果ではない)、`BLOG-SEO-PACE-01` (公開ペースの規律でGSC効果ではない)、
  `SITE-LINKROT-01` (`BLOG-LINKROT-01` と同じ監査の重複で統合)、`COVERAGE-LOOP-01` (9/24 に終了済み)。
  残る 6 行は、根拠のある目標値を今は書けない。理由は、単一ページで測れないコホート比較 (BLOG-SEO-TYPES/QUEUE)、対象 56 キーが未特定 (RANKING-REINDEX)、
  是正デプロイ前 (BLOG-LINKROT)、独自の d7/d28/d56 計測体系 (THEME-EXPANSION-EFFECT・STP-AI-WATCH)。
  目標値の後付けはしていない。`cli.mjs --dry-run` は exit 0 で、存在しないページが判定対象に紛れ込んでいないことも確認済み。
- **次 (残り)**: ① `BLOG-LINKROT-01` は是正デプロイ後に対象ページと事前 target を付ける。② RANKING-REINDEX は 56 キーを特定してから目印を付ける。
  ③ 済 (2026-09-26・オーナー判断): コホート比較 (BLOG-SEO-TYPES/QUEUE) と独自計測 (THEME-EXPANSION-EFFECT・STP-AI-WATCH) の 4 行は
  improvements.md に「効果判定エンジン対象外」と代わりの判定手順を明記した (dry-run で subject に現れないことを確認)。
- **完了条件**: 計測サイクルの「GSC 施策 N 件中、機械判定できるのは M 件」で、残る行がすべて理由付きで終了または目印付きになる。

### [AREA-DATABOOK-CHART-FIX-01] 県データブックの「推移」グラフの点数不足と、スマホで読めない文字・単位なしの軸を直す

タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 「有効求人倍率の推移」は 2022年度の 1 点、「1人当たり県民所得の推移」は
  2020〜2021年度の 2 点だけで推移として機能していない (e-Stat をその場で読むグラフ。`template.ts` の
  `area-ov-job-opening` / `area-ov-prefectural-income`、原因は未確認)。390px では高さ 9px 未満のグラフ文字が 80 個あり、
  「高齢化率・年少人口割合の推移」「高齢者世帯の推移」の縦軸に単位が無い。縦軸目盛りの切れは `UI-CHART-TEXT-LOOP-01` の担当。
- **次**: ① 点数不足の原因 (statsDataId の年範囲・取得パラメータ・キャッシュ) を実測で特定し、年を揃えた系列に直すか、
  推移グラフをやめて数値カードにする。② 狭い画面での文字サイズの下限と軸単位の表示を、共通チャート部品側で直す
  (`chart-component-builder`)。③ 「推移」グラフの最低点数の検査は `SITE-DISPLAY-SEMANTICS-AUDIT-01` に含める。
  **② は `UI-CHART-TEXT-LOOP-01` の D3 部品の修正 (文字を描画範囲に収める共通処理。14 部品分の途中成果がブランチ `wip/ui-chart-text-loop-01` にある) と
  同じファイル群を触る。** 先に同カードの WIP ブランチを取り込み、その上で文字サイズの下限と軸単位を足す。
- **完了条件**: 県データブックの推移グラフがすべて 3 点以上、390px でグラフ文字が 10px 以上、縦軸に単位がある。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 有効求人倍率の推移が 2022 年度の 1 点だけで大きな枠を占める / 1 人当たり県民所得が 2 点だけ /
  軸の文字が 5〜6px / 右端の年ラベルが切れる / 縦軸に単位が無い。縦軸の先頭の桁が欠ける不具合は `CHART-YAXIS-LABEL-CLIP-01` (🔴) で先に直す。

### [AREA-PAGE-LAYOUT-01] 県ページの長さと節構成を整理し、内部用語と表記揺れを除く

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 390px でページ高 13,174px。データブックの数値カードがスマホで 1 行 1 個に並ぶため。
  「地価」「旅行者」は数値 1 個、「産業」は 2 個で全幅の節を使い、「暮らし」(犯罪) と「安全・くらし」(交通事故) の分け方が
  分かりにくい。空間分析カードに内部用語「保存則 47/47」がそのまま出る。「%」と「％」の混在、「11％」と「11.2％」の小数桁の不揃い、
  見出し「東京都の市区町村40 件」の空白抜け。交通事故グラフの横軸は「年度」だが、元統計は暦年の可能性がある (未確認)。
- **次**: ① スマホでも数値カードを 2 列にする。② 数値の少ない節を統合し、「暮らし」と「安全・くらし」の区分を決め直す
  (`area-databook-designer`)。③ 「保存則」を読者向けの表現に直す。④ 単位記号・小数桁を共通の書式に揃える。
  ⑤ 交通事故の年の型を出典で確かめる。
- **完了条件**: 390px のページ高が現状比で大きく減り (目標値は ① の実装後に実測で決める)、1 指標だけの節が無く、
  内部用語と表記揺れが 0 件。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 640 / 768px で「他県と比較」ボタンが 2 行に折れる / 「47位」が「47/位」と折れる /
  県×テーマページ (`/areas/*/<theme>`) の「〇〇県の視点」帯が 390px で細かく折り返す、ページ内ナビの末尾が途中で切れる、プロフィールへのリンクが 2 回続く、
  見出しと 1 文だけの中身の無い節、カード名に節の名前が繰り返される、人口移動フローの県選択が空欄、5 枚目のカードが単独で残る。
  `/areas/02000/landslide-exposure` で「0 区域」が 2 位 (順位の向きが不明)、「単年データのため推移グラフはありません」のカードが 8 枚続く。

### [AFF-FURUSATO-SHOP-DIVERSITY-01] ふるさと納税の返礼品カードを「代表品目を複数」にし、品目と店の重複をなくして毎日・毎週検査する

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:収益導線]

- **背景 (2026-09-25 実測 2 件)**:
  - `/areas/13000`: 「東京都の人気返礼品」の 4 件がすべて同じ店 (魚久) の商品だった。
  - `/ranking/natto-consumption-expenditure`: 「1位 福島県の人気返礼品」の 4 件のうち 3 件が桃で、残り 1 件も桃を含む
    「野菜とフルーツセット」だった。2〜4 枠目が同じ品目なので、読者には比べて選ぶ余地がない。
  - 原因 (コードで確認): 代表品目の表 `FURUSATO_SIGNATURE` (`apps/web/src/features/ads/constants/furusato-nozei.ts`) は
    1 県 1 品目 (福島 = 桃)。同期の `searchFurusatoItems` (`apps/web/src/features/ads/lib/rakuten-api.ts`) は
    「ふるさと納税 {県名} {代表品目}」でレビュー数順に 30 件を検索し、上位 4 件を保存する。品目と店の重複を除く処理は、
    同期にもカード側の `selectQualityItems` にも無い (除くのは同じ URL だけ)。
  - 同一案件の重複を避ける方針 (auto memory `affiliate-strategy`) に反する。
- **決定 (2026-09-25 オーナー)**: 代表品目を 1 県に複数登録し、1 品目 1 枠で並べる。

#### 実装

1. **代表品目の表を複数形にする**。`FURUSATO_SIGNATURE` を 1 県あたり 3〜4 品目の配列にする (置き場は今と同じファイル。
   別の SSOT を作らない)。各品目は「検索語」と「一致とみなす表記」を持つ (例: 桃 = `桃` / `もも` / `白桃`。
   福島の 4 件目「もも【川中島白桃】」のように、ひらがな表記で出品される商品があるため)。
   1 品目だけの県は今と同じ動きになるので、県ごとに順に増やしてよい。
2. **同期で 1 品目 1 枠を選ぶ**。品目ごとに検索し、先頭から「店が既出でない」1 件を取る。
   何も出ない品目の枠は、県名だけの検索の結果で埋める (店の重複は同じく除く)。代表品目が未登録の県 (東京・大阪など) は
   県名だけで検索し、1 店 1 件にする。
   保存する snapshot に「どの品目の枠か」(品目名 / 県名だけの検索で埋めた枠) を持たせ、監査がそれを読めるようにする。
3. **カード側でも 1 店 1 件を守る**。`selectQualityItems` の重複判定に店を加える (古い snapshot が残っていても並ばないように)。
   店の識別には `RakutenItem.shopName` がある。店コードが取れるかは実データで確かめ、取れるなら店コードを使う。
4. **同期にかかる時間**: 楽天への問い合わせは 1 回ごとに 1.2 秒空ける (`RAKUTEN_REQUEST_INTERVAL_MS`)。
   47 県 × 4 品目で約 190 回、約 4 分 (今は 1 県 1〜2 回)。毎朝 4 時の `sync-rakuten-catalog.yml` の中で収まることを
   最初の実行で確かめる。

#### 機械的チェック (PR の時点で止める)

- **表の契約テスト**: 各県の品目数が 1〜4、同じ県で検索語が重複しない、一致表記が空でない。
- **選び方の単体テスト**: 候補が同じ店・同じ品目ばかりでも、選ぶ関数が 1 店 1 件・1 品目 1 件を返す。
  品目が 0 件のとき県名だけの検索で埋める。
  テストは「なぜ要るか」を固定する (今回の福島・東京の並びを入力にして、直す前の実装なら落ちることを一度確かめる)。

#### 毎日の監査 (同期の直後)

- 既存の `apps/web/scripts/audit-rakuten-catalog.ts` (同期後に 47 県を読み直す、API を叩かない監査) に、県ごとの次の項目を足す。
  - `shopDuplicates`: 1 枚のカードで同じ店が 2 件以上 → **0 件でなければ監査を失敗にする** (選び方の実装が壊れている)
  - `keywordMismatch`: 品目の枠に入った商品の名前が、その品目の一致表記を含まない件数 (「野菜とフルーツセット」が桃の枠に入る型)
  - `emptyKeywords`: 検索して何も出なかった代表品目 (表の見直し候補)
  - `preorderCount`: 名前に「先行予約」「〜年出荷」を含む件数 (季節ずれの観測。当面は数えるだけで直さない)
- 失敗の通知は既存の `rakuten-alert` の経路を使う。新しいラベルは作らない。

#### 週次の組み込み

- 毎日の監査結果 (`audit.json`) は CI の artifact に 14 日しか残らない。週に 1 回、最新の結果を
  `.claude/state/ads/` に要約して記録する (県ごとの上の 4 項目。アフィリエイト運用の機械状態の置き場)。
  どの週次 workflow に載せるか (`affiliate-ga4-weekly.yml` に 1 step 足すか、同期 workflow の週 1 回分で書くか) は実装時に決め、
  新しい workflow は作らない。
- **起票の条件**: `emptyKeywords` か `keywordMismatch` が **2 週続けて** 同じ県・同じ品目で出たら、「代表品目の見直し」カードを
  backlog へ 1 枚起票する (1 週だけの揺れでは起票しない)。起票の仕組みは page-quality の UI 指摘キュー
  (`.claude/scripts/page-quality/ui-findings.ts`) と同じ形を流用し、別実装を作らない。
- 週次メトリクス Issue に「返礼品カードの重複 0 件 / 見直し候補 N 件」の 1 行を出す。

#### 境界

- **停止条件**: 表示件数を減らす変更は `AFF-SLOT-REDUCTION-01` の計測と混ぜない。どの広告を出すかの変更なので
  `AFF-INTENT-FALLBACK-STOP-01` と同じデプロイにしない (どちらが効いたか分離できなくなる)。計測の区切り日を記録する。
- **季節ずれは対象外**: 品目の並び順を季節で入れ替える案は、`preorderCount` の実測を見てから別カードで判断する。
- **意味の判定は機械に任せない**: 「その県らしい品目か」の選定は人が表に書く。監査は一致表記と件数だけを見る。

- **完了条件**:
  - 47 県の返礼品カードで同じ店・同じ品目の商品が 2 件以上並ばない (毎日の監査で `shopDuplicates` 0)。
  - 代表品目が 3 品目以上登録された県が 30 県以上ある (大都市など未登録の県は県名だけの検索で 1 店 1 件)。
  - 表の契約テストと選び方の単体テストが CI で動き、直す前の実装で落ちることを確認済み。
  - 週次の要約が `.claude/state/ads/` に 1 回以上記録され、週次メトリクス Issue に 1 行出ている。

### [UI-CHART-TEXT-LOOP-01] チャートの文字のはみ出し・重なりを座標で検出し、起票から修正・本番確認までのループに乗せる

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **背景 (2026-09-25 実測)**: `/areas/13000` の積み上げ面グラフ (`StackedAreaChart`) で縦軸の目盛り「1,400.0万」などが
  左に 4〜12px 切れている (左の余白が `computeMarginsByRatio` による幅比の固定値で、長い目盛りが収まらない)。
  note 記事のビール月別折れ線 SVG (`b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg`、`svg-builder` の
  `line.ts`) は、下の凡例 (プロット下端 +18px) と斜めの月ラベル (+14px から下へ) が同じ帯に重なり、縦軸タイトルに
  図のタイトル全文を入れて高さからはみ出し、単位「(円)」が 2 か所に出ている。スクショを agent に見せるだけでは
  縮小で 1 文字の欠けを読めず判断も揺れるため、**文字の外枠の座標で機械判定する**。
- **方針 (検出 → 起票 → 修正 → 本番確認)**:
  1. **検出 (機械)**: ①`chart_text_issues` — 週次ページ品質監査のブラウザ検査 (代表URL) で、ページに直接描く SVG の
     `<text>` の外接矩形が描画範囲から 2px 超出るもの (overflow: visible は除外) と、同じ SVG 内の文字どうしが
     小さい方の 25% 以上かつ 3px 四方以上重なるものを数える。チャートは遅延描画なので、スクロールで描かせてから測る
     (撮影側のスクロール処理を `ui-probe.ts` の共通関数にし、幅ごとの `responsive_layout_issues` にも含める)。
     ②`blog_svg_text_issues` — `<img>` の記事 SVG は DOM から見えないので、全記事の `/app/blog/<slug>/data/*.svg` を
     取得し、`svg-lint.mjs` に足す `findChartTextIssues(svg) → { overflows, overlaps }` (文字幅は既存の半角 0.55em /
     全角 1.0em 推定、回転と text-anchor を反映) で静的に検査する (`checkImages` が画像 URL を消す前に呼ぶ)。
  2. **起票**: 2 指標を `UI_METRIC_KEYS` と `page-quality-budgets.json` (warning・閾値 0) に足し、既存の
     `ui-findings.ts --sync` で `UI-FIX-<種類>` カードにする (新しい起票の仕組みは作らない)。
  3. **修正の振り分け**: カード本文に指摘の種類ごとの手順を出す (`chartFixGuide`)。
     - **agent が直す**: D3 チャートは共有部品の不具合で、1 部品を直せば全ページが直る。描画後に文字の外枠を測って
       `viewBox` を広げる共通処理 (`fitSvgViewBox`) を軸つきの D3 部品すべてに適用し、長いラベルの回帰テストを足す。
       記事 SVG で作り直しても直らないもの (`generator-fix`) は `svg-builder` を直す (`line.ts`: 凡例を目盛りの帯の下へ・
       入らないときだけ斜めにする・縦軸タイトルの長さ確認・単位の重複をやめる)。
     - **スクリプトで直る**: 生成器が既に正しい記事 SVG は data JSON から作り直すだけで直る (`regen-fixes`)。
       `.claude/scripts/blog/plan-svg-text-fix.ts @<batch>` が公開中と作り直し後の両方を検査して `regen-fixes` /
       `generator-fix` / `no-data` / `clean` に振り分け、`regenerate-blog-svgs.yml` の slug 指定コマンドを出す。
       R2 反映はオーナー承認なので、ループは `[実行:ユーザー]` カードを起票して `--mark-owner` で紐付ける。
  4. **本番確認**: 既存どおり次の週次で消えたら done、残れば pending に戻る。
- **途中成果**: リモートのブランチ `wip/ui-chart-text-loop-01` (commit `f8344bf3c`、35 ファイル。2026-09-25 時点の develop の上に
  stash を衝突なしで適用したもの。develop へは未取り込み)。**検証済み**: ①の検出を本番の代表URL 12 件 × 412/1440px で実行し、
  `/areas/13000` の縦軸切れを検出・他 11 ページは 0 件 / 検出とカード手順のテスト (壊すと落ちることも確認)。
  **未完・未検証**: `findChartTextIssues` (途中)・`line.ts` の修正 (未着手)・D3 14 部品への `fitSvgViewBox` 適用
  (テスト・型チェック未実施)・`check-svg-text.ts` と `plan-svg-text-fix.ts` のテスト。
- **次 (実行順)**: ①`wip/ui-chart-text-loop-01` を develop へ追従させて (`git merge develop`) 型チェック ②`findChartTextIssues` を完成させ、欠陥ごとの合成 SVG で感度テスト
  ③公開済み記事 SVG の該当件数を実測し、公開前 gate (`quality-gate.mjs`) を error にするか件数固定の baseline にするか決める
  ④`line.ts` を直してビール SVG を作り直す ⑤D3 の共通処理を型チェック・テストし、localhost の `/areas/13000` で
  `chart_text_issues` が 0 になることを確かめる ⑥残りのテスト ⑦週次監査を 1 回手動で流し、カードに手順が載ることを確かめる。
- **関係するカード**: `AREA-DATABOOK-CHART-FIX-01` ② (狭い画面の文字サイズ・軸単位) は同じ D3 部品を触るので、こちらの WIP ブランチを先に
  取り込ませる。`NAV-CLICK-COVERAGE-01` P3 と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も週次監査の同じファイル群に指標を足すので並行実装しない。
- **停止条件・禁止**: R2 反映・ワークフローの dispatch・本番デプロイはオーナー承認。公開済み SVG の該当が多い場合、
  gate を error にして無関係なコミットを止めない (新規・再生成分だけ止める)。
- **完了条件**: 週次監査が 2 指標を計測して UI-FIX カードに振り分け手順が載り、`/areas/13000` の縦軸切れとビール SVG の
  重なりが本番で 0 件になっている。

### [UI-CARD-HEADER-SIMPLIFY-01] カードの見出しを「白いカードのまま・見出しの下に線を引かない」形にそろえ、検索窓はカードで包まない

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-25] [レーン:UI・回遊]

- **背景 (2026-09-25・スクショ 2 枚 = 左レールのカテゴリ / ブログの右レール)**: 見出しの下の区切り線 (`border-b`) のすぐ下で
  一覧の各行にも線があり、見出し直下に線が 2 本近接して見える。本文の下余白が固定 (`pb-4`) なので一覧の最後の行の下に空白が残る。
  見出しは灰色の小さい文字 (`text-muted-foreground`) で、見出しとしての強さが弱いのに線と余白で面積を取っている。
  「記事検索」は入力欄 1 つのためにカードと見出しを持っている。
- **決定 (2026-09-25 オーナー)**: 3 案のモック (A 見出しをカードの外へ / B カードは残し見出しの線をなくす / C カードをなくす) から **B**。
  A はレールに 5〜6 ブロック並ぶと見出しが灰色の地に浮いて帰属が曖昧、C は地の上に一覧がむき出しになりレール契約も変わるため不採用。
  - 見出し: 濃い色の太字の小見出し (`text-foreground` + `font-semibold`、大きさは `text-sm` のまま)。**見出しの下に線を引かない**
  - 区切り線は一覧の行と行の間だけ (最初の行の上には引かない)
  - 本文の下余白を固定しない (一覧は行の余白だけで閉じ、一覧でない本文だけ小さな下余白を持つ)
  - 検索窓 (`RailSearchCard`) はカードと見出しをやめ、レールの先頭に入力欄とボタンだけを置く。読み上げ用ラベル (`ariaLabel`) は既にあり維持する
- **範囲 (2026-09-25 のコード検索)**: 見出しの作りは 3 系統。`RailCard` (左右レール・23 ファイル) と `SectionCard` (本文の見出し付きカード・
  10 ファイル) は `apps/web/src/components/surface/SurfaceCard.tsx` の `HEADER_CLASS` を共有。`ChartPanel` (本文のチャート枠・76 ファイル) は
  同じ見た目 (`border-b border-border px-4 py-3`) を `components/charts/ChartPanel.tsx` に**重複して**書いている → 同じ定数を使わせて 1 か所にする。
  `RailSearchCard` は 2 か所 (`features/blog/components/BlogNavigationCards.tsx` / `app/blog/[slug]/page.tsx`)。
  見出しの下線を前提にしているもの: `components/surface/__tests__/rail-card-contract.test.tsx` の「ヘッダーは border-b を持つ」と、
  `docs/01_技術設計/04_デザインシステム.md`「レール UI 契約」の見出し・本文余白の記述。
- **既存カードとの関係**: `UI-CARD-TYPOGRAPHY-UNIFY-01` の「契約」にある RailCard の見出し (灰色・中太・`border-b`) と本文余白 (`pb-4`) を
  **このカードが改訂する**。同カード C-1 の `no-manual-card-header` (手書きヘッダ禁止) は、新しい見出しの形を基準に書く。
  `NAV-CLICK-COVERAGE-01` P1 が同じレール部品に計測用の属性を足すので、同じコミットに混ぜない。
- **次 (実行順)**: ①`SurfaceCard.tsx` の見出しと本文余白を変える (RailCard と SectionCard が同時に変わる) ②`ChartPanel` の見出しを同じ定数へ
  ③`RailSearchCard` からカードと見出しを外す ④契約テストを「見出しの下に線が無い・行の間だけに線がある」形で固定し直し、デザインシステム文書を改訂
  ⑤localhost で代表ページ (`/` `/ranking/total-population` `/areas/13000` `/themes/population-dynamics` `/category/population` `/blog`
  `/blog/<記事>` `/survey/census`) をライト・ダーク・390px で撮り、変更前と並べて確認 ⑥チャート枠は見出しとチャートの間隔が変わるので、
  76 か所のうち代表的なチャートの種類ごとに目視する。
- **決定 (2026-09-25 オーナー)**: チャート枠の下部 (出典・ランキングの開閉。`ChartPanel.tsx` の `border-t border-border px-4 py-3`) の
  上線も**残さない**。見出しと同じく、線ではなく余白で区切る。
- **追加の不具合 (2026-09-25 実測)**: `ChartPanel.tsx` は `footer && (...)` でフッターの枠を描くが、渡されるフッター要素が空の中身しか
  描かなくても枠 (上線 + `px-4 py-3`) は出る。ランキングページでは地図と表の下に高さ 25px の空の帯が全 8 幅で出ていた
  (`RANKING-MAP-TABLE-CARD-01` の背景)。フッターは中身があるときだけ描く (空の判定をフッター側の部品に持たせるか、
  呼び出し側で中身が無ければ `footer` を渡さない)。
- **停止条件・禁止**: 契約テストを弱めない (線の有無を消すのではなく、新しい形を固定し直す)。本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 3 部品が同じ見出しの定数を使い、見出しの下の線と一覧末尾の固定余白が無い / 検索窓がカードで包まれていない /
  代表ページの撮り比べで確認済み / `npm run design-system:check -w apps/web` と対象の vitest が緑。

### [BLOG-POPULAR-AUTO-01] ブログ一覧の「よく読まれている記事」を閲覧数から週次で自動選定し、表示数を定数 1 か所にする

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **現状 (2026-09-25 コード確認)**: `apps/web/src/features/blog/config/popular-articles.ts` に slug 3 件を手で固定している
  (2026-08-28 の直近 28 日の**アフィリエイト表示回数**上位。変更は作成時の 1 回だけ)。見つからない slug は公開日の新しい記事で補う
  (`repositories/blog-snapshot-reader.ts` の `readBlogIndexPageFromR2`)。表示数は `popularRows.length >= 3` と `slice(0, 3)` の
  2 か所に直書き。表示先は `/blog` の右レールだけ。読まれ方が変わっても入れ替わらず、広告の出ない記事は候補に入らない。
- **決定 (2026-09-25 オーナー)**:
  1. **指標**: GA4 のボット除去済みページ別閲覧数 = 週次スナップショット `.claude/skills/analytics/ga4-improvement/reference/snapshots/<週>/pages-clean.csv`
     の `screenPageViews`。除去前の `pages.csv` は使わない (W38 で 1 記事がトップページ並みの 1,255 件=ボット混入の疑い)。
     GSC のクリック数は検索流入だけで SNS・サイト内の閲覧が入らないので使わない。
  2. **置き場所と更新**: 週次 CI が選定結果を **R2 の JSON** に書き出し、`/blog` は表示時に読む (集計から作るデータ = R2。
     git の TS に書くと反映にデプロイが要る)。R2 の書き手は CI だけ。
  3. **表示先と件数**: `/blog` だけ・3 件のまま。件数は名前付き定数 1 か所で変えられるようにする。記事ページへ広げるかは
     `NAV-CLICK-COVERAGE-01` の計測で効果を見てから別途決める。
- **次 (実行順)**:
  ①選定の純粋関数を作る: `/blog/<slug>` の行だけを対象に、直近 4 週分の `pages-clean.csv` を合算して閲覧数の多い順に並べ、
  公開中の記事だけ残して上位 N 件を返す (単週の揺れを抑えるため 4 週。`pages-clean.meta.json` で各週の集計期間を確かめ、
  期間が重なるなら合算方法を直す)。
  ②週次の GA4 取得 workflow (スナップショットを作っている job) の後段で①を実行し、R2 に書き出す。キー名と保持は
  `.claude/rules/r2-storage-design.md` に従う。
  ③`readBlogIndexPageFromR2` を、R2 の選定結果を読んで上位 N 件を返す形に変える。結果が無い・読めないときは今と同じく
  公開日の新しい記事で埋める。直書きの `3` 2 か所を定数 1 つにし、`popular-articles.ts` の固定リストは削除する。
  ④**確認項目**: `/blog` の `revalidate = 86400` がこの OpenNext 構成で実際に効くかを本番のレスポンスヘッダで確かめる
  (`.claude/rules/nextjs-ssg-preservation.md` のとおり、prerender 済みページは R2 を更新しても再デプロイまで変わらない)。
  効かないなら、選定結果の読み込みを表示時に行う形 (動的描画) にする。
  ⑤テスト: 選定関数 (閲覧数順・`/blog/` 以外と非公開の除外・件数)、R2 に結果が無いときの補充。
- **停止条件・禁止**: ローカルから R2 に書かない (CI だけ)。本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 週次 CI が選定結果を R2 に書き出し、`/blog` の「よく読まれている記事」がそれに従って入れ替わることを本番で確認済み。
  表示数の定数を変えると件数が変わる。固定リストが無くなり、対象テストが緑。

### [RANKING-MAP-TABLE-CARD-01] ランキングの地図と表を 1 枚のカードにし (1280px 以上は横並び・それ未満はタブ)、年と計算方法の切り替えをカードの見出しに集約する

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-25] [レーン:UI・回遊]

- **owner**: ranking-ui-manager
- **背景 (2026-09-25 localhost `/ranking/natto-consumption-expenditure` を 390/640/768/992/1024/1280/1440/1920px で撮影・DOM 実測)**:
  ① 1280px 以上で地図と表が別々のカードとして横に並び、高さが 608px 対 565px でずれる。② 本文の列幅は 1280・1440・1920px
  のどれでも同じ (コンテナ最大幅で頭打ち) で、表のカードは約 412px しかなく、右端の「偏差値」列が切れて横スクロールになる
  (1024px は縦に並ぶので切れない)。③ 地図と表のそれぞれに同じ「2024年」の年の選択があり、見出しの行がそれだけのために
  区切り線付きで使われている。④ 767px 以下では「計算方法を切替」(総数・人口当たり・面積当たり) が地図の**下**にあり、
  中身を切り替える操作が中身より後に来る。
- **経緯 (壊さないこと)**: スマホで地図を h1 の直後に出すのは意図的な設計 (旧構成では地図がヘッダーから約 1300px 下に埋もれていた)。
  `RankingKeyPageClient.tsx` は DOM を 1 つのまま `order` で並べ替え、`<lg` は h1 → 地図/表 → 操作 → スタット、`lg+` は
  h1 → 操作 → スタット → 地図|表。地図と表は Radix のタブを `forceMount` で使い、**非表示の側も HTML に常に含まれる** (検索エンジンから
  表の中身が見える)。この 2 点は維持する。
- **決定 (2026-09-25 オーナー)**: 地図と表を **1 枚のカード**にする。
  - 1280px 以上 (本文が広い): カードの中で地図と表を**横に並べる**。
  - 1279px 以下: 同じカードの中で、今のスマホと同じ**タブ**切り替え (1024〜1279px は右レールが出て本文が約 588px しかなく、横並びは両方窮屈)。
  - 年の選択と計算方法の切り替えを**カードの見出しに 1 つだけ**置く。スマホでも操作が中身の上に来て、地図をすぐ見せる意図も保てる。
  - フッター (出典・ランキングの開閉) はカードに 1 つ。中身が空なら描かない (`UI-CARD-HEADER-SIMPLIFY-01` の空フッター対応と同じ規則)。
- **対象ファイル**: `apps/web/src/features/ranking/components/RankingKeyPage/RankingVisualizationSection.tsx` (タブ `lg:hidden`・
  `TAB_CONTENT_CLASS` の `lg:data-[state=inactive]:block`・`xl:grid xl:grid-cols-2` の 2 列配置) /
  `RankingKeyPage/RankingKeyPageClient.tsx` (`order-*` の並べ替え・`headerActions`・`cardFooter`) /
  `RankingMapChart/RankingMapChartClient.tsx` と `RankingDataTable/index.tsx` (それぞれが `ChartPanel` を持つ → 外側の 1 枚へ) /
  `RankingHeader/RankingHeaderControls.tsx` (計算方法の切り替え)。
- **次 (実行順)**:
  1. 外側に `ChartPanel` を 1 つ置き、地図と表はその中の枠なしの領域にする (カード内カード禁止の規則に合わせる)。
  2. 1280px 以上の横並びで表が切れないよう、横並びの幅のときだけ表を詰めた表示にする (セルの左右余白・順位列の幅・数値の桁区切り)。
     詰めても 4 列が収まらなければ、地図と表の幅の比を変えて表を広くする。収まったことを 1280/1440/1920px で実測する。
  3. 地図の高さを表 (10 件表示) の高さに合わせ、横並びのときに短い側の下に余白が出ないようにする。
  4. 年の選択と計算方法の切り替えを見出しへ移し、`order` の並べ替えから計算方法を外す (カードの見出しに入るため)。
  5. `forceMount` と、タブの切り替え・地図の初期表示の既存テストを保つ。横並び・タブの切り替わり幅と、表が HTML に常に含まれることを
     テストで固定する。
- **最初に開くタブ (1279px 以下)**: 当面は地図 (今のスマホと同じ)。`NAV-CLICK-COVERAGE-01` でタブの切り替えを数週観測し、表の方が
  選ばれるなら見直す。
- **停止条件・禁止**: `forceMount` を外さない (表が HTML から消えると検索に影響する)。h1 を DOM の先頭から動かさない。
  本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: localhost の 390/768/1024/1280/1440/1920px で、地図と表が 1 枚のカードに入り、1280px 以上は横並びで表の 4 列が
  横スクロールなしで見え、1279px 以下はタブで切り替わる。年と計算方法の選択がページに 1 つずつ。カードの下に空の帯が無い。
  関係する vitest と `design-system:check` が緑。

### [RANKING-PAGE-STRUCTURE-01] ランキングページの補足文・出典・関連リストの置き方を整理し、重複と冗長を減らす

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **owner**: ranking-ui-manager
- **背景 (2026-09-25 localhost `/ranking/natto-consumption-expenditure` の撮影・DOM 実測)**:
  ① **カードの外に浮いた文章**: 地図と表の下に、補足文 (「都道府県庁所在市の二人以上世帯の年間納豆消費支出額」)・「最終更新 2026-09-07」・
  注記 (「県庁所在市の…購入量ではない…」) が、枠の無い地の上に並ぶ。補足文と最終更新は `RankingVisualizationDetails.tsx`、
  注記は別の部品。スマホ (390px) では補足文 (上端から 842px) と注記 (1332px) の間に計算方法とスタットのカードが挟まり約 490px 離れる
  (PC では隣接)。「最終更新」はサイトの更新日で、データの年ではない (読み違いのもと)。
  ② **「データ出典」だけカードの外**: `RankingPageClientShell.tsx` の `DataSourceList` の節が、灰色の地に上線付きで置かれ、直前のカード
  (相関が高い指標) との間に大きな空白がある。
  ③ **関連するランキングの一覧が 3 つ**: 本文の「同カテゴリの関連ランキング」(`RelatedRankingsGrid.tsx`、9 件)、右レールのカテゴリ一覧
  (`RankingSidebar`、同じ「1位 県 値」の形・20 件 + もっと見る)、出典調査のカードの「同じ調査のランキング」(`SurveyTaxonomyCard.tsx`)。
  スマホではこれが縦に続き、ページ高さが 5,284px (PC 3,235px)。本文の一覧はスマホで 1 列・行間が広い。
  ④ **「このデータを使う」の枠** (`DataUsageCard.tsx`): ボタンが文章の横に並び、390px では文章が狭い列で 6 行に折り返す。
  ⑤ **見出しまわりの余白と情報量** (2026-09-25 追記・1440px 実測): ヘッダーの下端 (52px) から最初のカード (259px) まで 207px あり、
  あるのはパンくず・h1・「計算方法を切替」の見出しと切り替え・共有ボタンだけで、数字が 1 つも出ていない。
  ⑥ **右レールの関連記事と出典調査のカード** (2026-09-25 追記・オーナーと合意):
  - 関連記事 (`RelatedArticlesCard.tsx`) が 1 件だけで、文字だけの 1 行のため広告より目立たない。上限は 3 件だが、候補が
    「この指標を散布図で扱う相関記事」と「タグが一致する記事」の 2 種しかなく、上限の前に尽きている
    (納豆のタグと記事の対応は R2 で未確認)。
  - 「この統計の出典調査」(`SurveyCard.tsx` → `SurveyTaxonomyCard`) は、調査名とリンクが本文末尾の「データ出典」と重なり、
    「同じ調査のランキング」がレール先頭の関連ランキングと重なる (③ の 3 つ目)。ただし出典の部品 `DataSourceList.tsx` のコメントは
    「調査ハブへの回遊は右レールの `SurveyTaxonomyCard` が担う」としており、意図して置かれている。同じカードはカテゴリ・テーマ・ブログでも使う。
  - 「家計調査（品目別）」の同じ調査のランキングに「情報通信係数」が並ぶ。家計調査の指標として不自然で、紐付けの誤りの可能性がある (未確認)。
- **次 (実行順)**:
  1. 補足文と注記を 1 か所にまとめる (推奨: ページ見出しの説明として全幅で出す)。スマホでも離れないようにする。「最終更新」はデータの年
     (`yearName` 等) に置き換えるか削除する (データの年はスタットと地図の年表示に既にあるなら削除)。
  2. 「データ出典」を他の節と同じカード (`SurfaceSection` 等) に入れ、直前の空白と上線をやめる。出典の中身と部品
     (`DataSourceList`) は変えない (2026-09-25 の出典表示の統一の成果)。
  3. 関連リストの役割を分けて 1 つ減らす (推奨: 本文の「同カテゴリの関連ランキング」とレールのカテゴリ一覧はどちらか一方にする。
     「同じ調査のランキング」は 6 で出典調査のカードごと移す)。スマホで本文の一覧を 2 列にするか件数を絞る。
  4. `DataUsageCard` を 639px 以下でボタンを下に積む形にする。
  5. 見出しまわりを詰めて情報を足す: 計算方法の切り替えは `RANKING-MAP-TABLE-CARD-01` で地図と表のカードの見出しへ移るので、残る共有ボタンを
     h1 と同じ行の右端へ寄せる (切り替えが抜けると単独の行になるため)。h1 の下に要点を 1 行で出す (例「2024年｜1位 福島県 7,830円｜
     全国平均 4,897円」。値はスタットと同じ出どころから取り、二重計算しない)。1 の補足文と合わせ、見出しまわりで「何のランキングで結果は
     どうか」が分かるようにする。1440px で最初のカードまでの距離を実測し、現状 207px から減ったことを記録する。
  6. 右レールを整理する:
     - **関連記事を増やす**: 候補が 3 件に満たないときは、同じカテゴリ・同じ調査の記事で補う (補い方は
       `getRelatedArticleSummaries` の呼び出し側で決め、集約の共有ロジックは変えない)。0 件ならカードを出さない今の動きは残す。
     - **関連記事にサムネイルを付ける**: 既存の `blogThumbnailUrl` (`apps/web/src/lib/metadata/ogp-image.ts`、ブログ一覧で使用中) を使い、
       左に 16:9 の小さな画像 (幅 80px 程度)・右にタイトル 2 行の形にする。画像は遅延読み込み。新しい画像は作らない。
     - **出典調査のカードをランキングページの右レールから外す**: 調査ページへのリンクは本文末尾の「データ出典」が持つ。
       「同じ調査のランキング」は関連ランキングのカードへ統合するか、出典の節の下へ移す。カテゴリ・テーマ・ブログのカードはこのカードでは
       変えない (別に判断する)。`DataSourceList.tsx` の「調査ハブへの回遊は右レールが担う」のコメントも同じ差分で直す。
     - 「情報通信係数」が家計調査（品目別）に紐付いている理由を確かめ、誤りなら紐付けを直す (owner は survey-curator。
       直し方の正典は `.claude/rules/survey-linkage-standards.md`)。
  7. 390/768/1024/1440px で撮り直し、スマホのページ高さを実測して記録する (目標値は 1〜3 の実装後に決める)。
- **決めること (実装前・オーナー)**: 3 の関連リストで、本文とレールのどちらを残すか。判断材料に `NAV-CLICK-COVERAGE-01` の導線別クリックを使ってよい。
- **停止条件**: 関連リストや出典調査のカードを消す前に、クリックの計測値 (`rail_click` / `nav_click`、出典調査のカードは
  nav_surface `ranking_survey`) を確認し、使われている方を残す。保存済みの計測 state にはこのカードのクリック数が無い (2026-09-25 確認) ので
  GA4 から取り直す。サムネイルと関連記事の補充は、付ける前後で関連記事のクリック数を比べられるよう、区切り日を記録する。本番デプロイは
  他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 補足文・注記・出典がカードに入り、補足と注記が 1 か所にまとまっている / 関連リストが 2 つ以下 / `DataUsageCard` が
  スマホで縦に積まれる / 関連記事がサムネイル付きで、補う候補が 3 件以上あるページ (納豆で確認) では 3 件出る / ランキングページの右レールに出典調査のカードが無い /
  撮り直しでスマホのページ高さが現状 (5,284px) から減っている。

### [BLOG-OUTBOX-DATA-SOURCE-01] docs/21 に滞留した公開フラグ付き原稿 19 本の理由を確かめ、手書き出典節を移行する

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --outbox] [起票:2026-09-25] [レーン:データ品質]

- **背景**: 2026-09-25 の出典統一で `quality-gate.mjs` が本文の手書き「データ出典」節を blocker にした。`docs/21_ブログ記事原稿` には
  手書き節を持つ原稿が 27 本あり、うち 19 本は `published: true` のまま公開されずに残っている (prune は R2 と内容一致のときだけ消すので、
  R2 と差がある)。なぜ公開されていないかは未確認。このまま公開しようとすると新しい gate で止まる。
- **次**: ① 19 本について、公開 workflow (`blog-auto-publish.yml`) が選ばなかった理由を `select-republish-slugs.mjs` と
  `quality-gate.mjs` の出力で確かめる。② 公開を意図するものは `migrate-data-source-sections.ts --outbox --apply` で変換してから公開経路へ戻す。
  意図しないものは `published: false` にするか、R2 と同じ内容なら outbox から除く。
- **停止条件**: 公開 (R2 反映) はオーナーの確認を取ってから行う。変換は出典節だけを変え、散文は変えない。
- **完了条件**: 検証コマンドが「docs/21 原稿: 0 本」を返す。

### [KINDLE-DATA-SOURCE-01] Kindle の章の出典をブログ本文の手書き節から切り離し、据え置き 61 本の本文も移行する

タグ: [収益化] [種類:改善] [実行:対話] [検証:npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check] [起票:2026-09-25] [レーン:note・商品販売]

- **背景**: 2026-09-25 にブログの出典表示を `DataSourceList` に統一し、本文の手書き「データ出典」節を 531 本で移行した。
  ただし Kindle 書籍の章に使う 61 本 (`KINDLE_BOOKS` の blogSlug) は本文を変えていない。Kindle は本番 R2 の本文を取得して
  `editorial-corrections.ts` の校正指示を当て、置換元が本文に 1 回だけ無いと生成を止める設計で、移行すると校正指示を持つ 64 記事中
  23 記事で書籍を作れなくなる (実測)。さらに章末の出典は `fetch-content.ts` の `appendDataSourceSection` が本文の手書き節か
  `<data-source>` タグに頼っており、節が消えると章の出典が消える。Web は描画時の変換で表示をそろえているだけで、本文には旧節が残っている。
- **影響 23 記事**: aging-solo-living-crisis / commercial-land-price-trend / communication-cost-burden / crime-rate-regional-gap /
  earthquake-insurance-prefecture-gap / energy-infrastructure-gas-electricity / inbound-by-nationality-regional-preference /
  inbound-overnight-regional-gap / industrial-water-manufacturing-nexus / library-museum-cultural-capital / local-government-debt-burden /
  mackerel-expenditure-ranking / manufacturing-aichi-dominance / manufacturing-productivity / per-capita-income-gap /
  population-migration-tokyo-concentration / renewable-energy-regional-gap / small-business-dominance-map / sports-facility-regional-divide /
  sports-urban-paradox / unmarried-rate-40years-crisis / waste-management-recycling-gap / workplace-accident-regional-map
- **次 (実行順)**: ① `appendDataSourceSection` を、本文に節が無いとき `app/blog/all.json` の `sources` (DataSourceEntry) から章末の
  「データ出典」を作る形に変える (`fetchPublishedSlugSet` が既に all.json を読んでいる)。書籍の出典表記の書式は既存章と同じにし、
  単体テストで固定する。② 上の 23 記事の校正指示のうち置換元が旧出典節にあるものを、書籍側の出典生成へ移すか削除する
  (書籍の出典を直す指示は、出典行の生成規則か章単位の補足として残す)。③ 移行後の本文 (`migrate-data-source-sections.ts` の変換結果) に
  全 64 記事の校正指示が当たることを確認する。④ `migrate-data-source-sections.ts` の Kindle 除外を外し、`blog-data-source-migration.yml`
  (mode=migrate-bodies) で 61 本を移行する。⑤ 週次監査の実測で `survey-taxonomy-ratchet.json` の `maxLegacyDataSourceSectionArticles` を
  67 → 6 (図の無い読み物 6 本) へ下げる。
- **停止条件・禁止**: 校正指示を当てられない記事が 1 本でも残るうちは④を実行しない。販売中の版 (KDP) の再アップロードは人間工程で、
  このカードの範囲外。書籍の本文・出典の表記を変える版は再校閲を経てから出す。
- **完了条件**: 全 64 記事で校正指示が当たり書籍を生成でき、61 本の本文から手書き節が消え、ratchet の上限が 6 で検証コマンドが exit 0。

### [TOOL-MATERIAL-BUILDER-01] 資料ビルダー（指標×地域を出典付き Excel へ持ち出す無料ツール）の最小版を作る

タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-09-24] [レーン:行政資料]

- **owner**: Claude Code（実装） / strategy-advisor（有料化の採否は `ADMIN-STAT-PILOT-01` 側）
- **正典**: 境界と実装契約は `docs/01_技術設計/03_情報設計.md`「ページとツールの境界」、保存先は `docs/01_技術設計/02_データアーキテクチャ.md`「ツールと利用者データ」。利用者が選んだ指標 N 個×地域 M 個を、年次・単位・出典を揃えた一つの Excel にする。既存ページ（`/areas/[code]/[themeSlug]` 等）の一覧表示は複製しない。
- **根拠（2026-09-24 時点）**: ランキング CSV のダウンロードは 28 日で 193 件・120 ページ（`ADMIN-STAT-PILOT-01` の GA4 実測）。データを持ち出す利用はあるが、複数指標をまとめて持ち出す需要・支払意思は未検証。
- **開始条件**: `ADMIN-STAT-PILOT-01` の①で対象資料 1 件の指標・地域粒度・年次が具体化されたら着手し、その資料を初期プリセットにする。聞き取り前に汎用の指標選択 UI を作り込まない。
- **次（実行順）**: ①都道府県粒度だけで、指標と地域の上限を入力検証で固定した R2 オンザフライ生成の API を `api/ranking/[rankingKey]/download` と同じ構成で作る ②`/tools/<slug>` の route を url-policy・middleware・sitemap とその test に登録し、結果を noindex にする ③入口のページから条件入力済みで開く導線を 1 か所だけ置く ④利用・出力の GA4 イベントを analytics-event-standards の台帳に登録してから配線する。
- **禁止**: ログイン・保存・決済・会員を作らない（データアーキテクチャの改訂と収益化戦略 §5 のゲートが先）。都道府県と市区町村を一つの出力に混ぜない。年次・定義を揃えられない値を揃えたことにしない。
- **DB は不要（2026-09-24 確認）**: 指標の選択はキー参照（`app/stats/<key>/values.json` を N 個読む）で、検索ではない。都道府県の実測は有効求人倍率 6KB・総人口（全年）294KB で、20 指標でも数 MB に収まる。
- **市区町村へ広げるとき**: 総人口の `cities.json`（全年）は 2.7MB あり、大きな指標を 10 個選ぶと数十 MB になる。Workers のメモリ・CPU 上限は未計測。対策は DB ではなく、最新年だけを切り出した派生 snapshot を R2 に作るか、選べる指標数の上限を下げること。拡張前に 1 リクエストのメモリと実行時間を計測する。
- **停止条件**: `ADMIN-STAT-PILOT-01` が Stop になった、または対象資料の指標が R2 の都道府県データで揃わない場合は着手しない。
- **完了条件**: localhost でプリセットの Excel が生成され、全セルに指標名・年次・単位・出典が付き、利用者の Excel 環境で開いて編集できる。route の test と `npm run type-check` が通る。

### [AREA-SPECIALTY-IMAGES-01] 都道府県ページの特産品画像が未生成で頭文字タイルのまま

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:週次 page-quality の degraded_images が prefecture-detail で 0] [起票:2026-09-23] [レーン:UI・回遊]

- **owner**: area-curator (対象の確定) / image-prompt-curator (画像)
- **実測 (2026-09-23)**: 600 URL の試運転で 12 県・21 枚の `app/areas/<code>/specialty/*.webp` が R2 で 404 (例: 07000 nameko / 10000 brix-nine・aka-imo / 12000 tomisato-suika・shiro-takenoko / 22000 midori-mai・kajiki / 24000 ise-hijiki・ao-sanori)。画面は `SpecialtyImage` が頭文字タイルに切り替えるので壊れては見えないが、写真が出ていない。全件の件数は次回の週次監査の `degraded_images` で確定する。
- **次**: 週次結果から欠落の全リストを出し、`editorial/<code>.ts` の特産品と照合して画像を用意するか、画像を持たない表示に統一する。
- **完了条件**: 週次監査の `degraded_images` が 0、または画像を出さない設計に決めて代替表示を正式化している。

### [METRIC-ACUPUNCTURIST-RATE-UNIT-01] 「人口10万対はり師数」の値が実数になっている

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-23] [レーン:データ品質]

- **owner**: data-ingester
- **実測 (2026-09-23)**: `acupuncturist-rate` は title が「人口10万対はり師数」、unit が「人」だが、R2 `app/ranking/acupuncturist-rate/values.json` (2020) の値は東京都 22,314・大阪府 16,049・鳥取県 277 で、人口 10 万人あたりではなく実数。config は `statsDataId: 0004026940` / `cdCat01: 100` / `conversionFactor: 1` で、`normalizationOptions` に「人/10万人」があるのに基底値は正規化されていない。ランキングページもこの名前で実数を並べている。IG 地域カルーセルの試作で東京の「全国 1 位」として拾われて発覚した。
- **同種 (2026-09-23 追記)**: `intellectual-crime-per-100k` (知能犯認知件数) も key は 10 万人あたりだが、R2 の 2023 年値は東京都 7,336・大阪府 5,391・福井県 130 で実数の桁。X 投稿の候補選定で発覚し、投稿からは外した。 → 2026-09-25 確認: config の title は「知能犯認知件数」・unit「件」で実数と一致し、画面表示は正しい。key 名だけが per-100k で、変えると URL が変わるため本カードの対象外 (X 投稿で「10 万人あたり」と書かないことだけ注意)。
- **原因と config 修正 (2026-09-24)**: 0004026940 で config が指していた cdTab=0120 は「はり師数」の実数 (東京都 22,314人)。人口10万対の率は cdTab=0160 (東京都 158.8、1位大阪府 181.6)。同じ誤りが柔道整復師数 (0140→0180) と看護師数 0004026841 (0270→0310) にもあった。3 config を率の列へ直し、二重割りを防ぐため「人口10万人あたり」の換算オプションを外し、seoTitle から古い順位の数値を外した。犯罪 3 件・火災死亡者数は title が実数名で値と一致しているので対象外。`validate:config` / `validate:years` / type-check / vitest 971 件 exit 0。
- **進捗 (2026-09-25 07:15 JST 時点・別 PC で続きをやる人向け)**:
  - 済: config を率の列へ修正 (main 反映済み、PR #1024) / R2 再取り込み (data-refresh run 36056848146 success。はり師 1位大阪府 181.6・柔道整復師 1位大阪府 105.5・看護師 1位高知県 1,623.4、東京都の看護師 854.6 は商品パック値と一致) / seoTitle・seoDescription を新しい値で再作成 (PR #1025 で main 反映、item 再生成 run 36063161344 success、本番 title で確認) / ランキング AI 解説を 3 件再生成 (audit blocker 0・critic PASS、publish-ai-content run 36061846323 success)。
  - 実行中: `sync-snapshots.yml` only=master (run 36063838343、06:49 JST 開始)。他ページの「関連ランキング」カードが読む `app/category/<key>/items.json` の `top1` がまだ旧実数 (例: 柔道整復師・看護師ページに「1位 東京都 22,314人」) なので、その再生成と、同じ run 内の「変更があった ranking の OGP / カード画像」再生成・known/sitemap 再生成を待っている。
- **次 (別 PC で再開したら)**:
  1. `gh run view 36063838343` で success を確認する。failure / cancelled なら `gh workflow run sync-snapshots.yml --ref main -f only=master -f dry_run=false` を再実行する (r2-write の同時実行グループで待機中の run は後続に取り消されるので、他の R2 書き込み workflow と同時に投げない)。
  2. この run が「keys changed」で PR を作っていたら中身を確認してマージする。
  3. 確認: `curl -s "https://storage.stats47.jp/app/category/socialsecurity/items.json" | grep -o '"rankingKey":"acupuncturist-rate"[^}]*top1[^}]*}'` が大阪府 181.6 を返し、`curl -s https://stats47.jp/ranking/judo-therapist-rate | grep -c '22,314'` と `.../nurses-per-100k-population` が 0 になること。3 指標の OGP (`https://storage.stats47.jp/app/ranking/<key>/ogp/ogp.png`) も新しい順位で描かれていること。
  4. すべて満たしたらこのカードを削除する。
- **完了条件**: title・unit・値の意味が一致し、ランキングページと seoTitle が正しい。

### [METRIC-YEARFORMAT-KAKEI-01] 家計調査由来 metric の yearFormat (暦年/年度) と surveyId を揃える

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --slug real-disposable-income-reversal] [起票:2026-09-19] [期日:2026-10-17] [レーン:データ品質]

- **owner**: survey-curator (surveyId) / data-ingester (yearFormat)
- **実測 (2026-09-19)**: 同じ家計調査 (SSDS 経由) 由来なのに `disposable-income-worker-households` / `disposable-income-after-rent` / `real-disposable-income` は `yearFormat: 'fiscal'`、`black-tea-consumption-expenditure` / `private-rent-consumption-expenditure` / `engel-coefficient` は `'calendar'`。サイトの yearName が同じ調査で「2024年度」と「2024年」に分かれ、ブログ (real-disposable-income-reversal 等) が「2024年度」を書く原因になった。家計調査の年次結果は暦年平均 (統計局「2024年（令和6年）平均」)。上記 4 key と `per-capita-prefectural-income-h27` は `surveyId` 未設定で指標定義シートが「(surveyId 未設定)」を返す。
- **次**: ①家計調査由来 metric を列挙し (`grep -l 家計調査 packages/data-configs/src/metrics/*.ts`)、yearFormat を出典で確定して揃える (SSDS の表ラベルは「年度」でも家計調査項目は暦年)。②surveyId を `kakei-chousa` 等へ紐付け `/audit-survey-linkage` を通す。③ranking-prominence / seoTitle の再生成が要るか確認。
- **範囲の拡張 (2026-09-19 追記)**: S1 12 冊の図 120 枚を `.local/kindle-audit/fig-years.ts` (図の年表記 × source.json の rankingKey × config yearFormat) で実測すると、国勢調査 (未婚率・単独世帯 2020)、社会生活基本調査 (行動者率 2021)、住宅・土地統計、宿泊旅行統計 (2024) まで一律 `fiscal` だった。家計調査に限らず「調査の集計期間が暦年・時点のもの」を一次資料で確定して直す。書籍側は `figure-corrections.ts` で本文に合わせて図の年表記を当てているが、config が直ればその校訂は不要になる。
- **停止条件**: yearFormat を一括置換しない (SSDS には年度が正しい項目もある)。出典で確認できない key は `未宣言` のまま残し、指標定義シートに出す。
- **完了条件**: 家計調査由来 metric の yearFormat が出典と一致し、S1-01 の 9 slug で定義シートの「期間の型」が本文と一致する。
- **画面への影響 (2026-09-25 追記)**: 県データブックの数値カードに年を出したため (`AREA-DATABOOK-LABEL-INTEGRITY-01`)、
  「消費」節の家計調査 5 指標が「2024年度」と表示されるようになった。yearFormat を直すとここも暦年表記に揃う。


### [CI-SPEED-STATIC-GATES-HEAVY-STEPS-01] Static Gates の重い step (Commit-back Contract 115 秒 / SEO Meta Factual 46 秒) を軽くするか scheduled へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-runtime-budget.cjs] [起票:2026-09-18] [期日:2026-11-30] [レーン:基盤]

- **owner**: devops-runner
- **実測 (run 35157109396)**: Workflow Commit-back Contract Gate 115 秒 (npm ci より重い)、SEO Meta Factual Gate
  46 秒 (R2 を約 2,000 回読む = 「静的」ではない)、Image Generation Pipeline Contract 28 秒、
  Theme Portfolio State 23 秒。
- **次**: `test:workflow-commit-back` の 115 秒の内訳を `node --test --test-reporter` で取り、
  重い test を `--test-concurrency` で並列化するか、workflow 全走査を差分対象に絞る。SEO Meta Factual は
  `--only <staged keys>` を PR、`--fail-on-new` 全数を weekly に分ける (pre-commit 側は既にこの形)。
  `check-runtime-budget.cjs` の予算 (`.claude/config/check-runtime-budgets.json`) にこれらを登録し、
  再肥大化を機械で止める。
- **完了条件**: 対象 step の合計が 100 秒以下、budget に登録済み。
- **実施 (2026-09-18、部分)**: 115 秒の内訳は `ranking-scoped-workflow.test.mjs` 1 ファイル 76 秒 (69 test が sync-snapshots /
  generate-ogp-images の bash step をシム付きで実行、各 3〜6 秒)。依存は workflow YAML とテスト自身だけなので
  `test:scoped-workflow-contracts` へ分離し、`plan-pr-quality.mjs` の新 flag `workflow_contracts` (workflow YAML か
  *-scoped-workflow テストの変更時のみ true) で contract-tests job の step を差分連動にした。全数は週次
  `quality-suite-weekly.yml` の tests job に追加。`test:workflow-commit-back` は残り 2 ファイル (数秒)。
  **SEO Meta Factual (46 秒) は未着手**: PR で `--only <変更 key>` にするには shallow clone の catalog-gates job で
  base SHA を fetch して diff を取る仕組みが要り、pre-commit 側の `--only` と同型の実装を別途足す必要がある。
  `check-runtime-budgets.json` への登録も未 (network 検査を静的 budget に入れると毎 PR 46 秒増える)。

### [CI-SPEED-PRECOMMIT-TRIM-01] pre-commit を「秒単位のもの」だけに削り、metric config 時の `npx tsx` 直列 6 本と image pipeline 検査を preflight:pr / CI へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/preflight-commit.test.mjs .claude/scripts/lib/__tests__/pre-commit-guard-paths.test.cjs] [起票:2026-09-18] [期日:2026-11-30] [レーン:基盤]

- **owner**: devops-runner
- **実測 (2026-09-17)**: `apps/web/scripts/pre-commit-checks.sh` は 718 行・27 セクション。常時実行分は数秒だが、
  パス連動が重い: metric config が staged だと `validate-metric-years` / `validate-metric-config` /
  `audit-seo-meta-facts --only` (R2 ネットワーク) / `validate-polarity` / `generate-runtime-metric-summaries --check` /
  `generate-ranking-prominence --check` の `npx tsx` 6 本が**直列**に走り、それぞれ 2,000 件超の registry を
  読む (Windows PC で 12 分の記録: memory `project_two_machine_local_footprint_2026-09`)。
  `.github/workflows/*.yml` か `package.json` が staged だと image pipeline の vitest + 型検査 (約 15 秒) と
  `docs:check` が発火する。これらは develop-quality-gate / Static Gates でも走るので最大 3 重実行。
- **次**: pre-commit に残すのは commit-msg / 一時ファイル掃除 / secret 走査 / file-url・import.meta guard /
  `preflight-commit.mjs --commit-static` (7 並列 1 秒) だけにする。metric config 系 6 本は
  `preflight:pr` に集約し (gate 一覧は 2026-09-24 に `quality-gates.json` 由来へ変更済み)、`npx tsx` の起動を 1 プロセスに
  まとめる runner を検討する。`package.json` を image pipeline / docs の trigger から外す
  (依存追加のたびに両方が走る理由が無い)。
- **停止条件**: 外した検査が CI 側 (develop-gate または Static Gates) に無いものは外さない
  (`CI-DEVELOP-GATE-COVERAGE-01` の症状を再発させない)。
- **完了条件**: metric config 1 件 + workflow 1 件を staged した commit の pre-commit が Mac で 10 秒以内。
- **実施 (2026-09-18)**: pre-commit から §6.45〜6.6b (単位鏡 / years / config / SEO meta `--only` / polarity / topics /
  theme catalog / runtime summaries / prominence / area databook の `npx tsx` 直列、193 行) を外し、代わりに
  develop-quality-gate.yml へ `catalog-gates` job (`npm run preflight:pr`、CI では main 先行チェックを skip) を追加した。
  同じ検査は push 前 `preflight:pr` (18 gate・18〜21 秒) / develop 着地 / main PR Catalog Gates の 3 か所で走る。
  pre-commit は 718→541 行。`package.json` を image pipeline / docs の trigger から外す案は、workflow policy 監査が
  script 名の存在を見るため見送り。rule 4 本 (unit-semantics / theme-catalog / area-databook / blog-svg-chart) の
  「pre-commit + CI」表記を追従。実測は次の commit で確認する。

### [MEDIA-AFFILIATE-RELEASE-01] 媒体別画像と記事別アフィリエイト監査を公開まで完了する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --check] [起票:2026-09-17] [レーン:収益導線]

- **owner**: chart-author（ブログ・note画像）/ affiliate-manager（関連性判断）/ devops-runner（検証・公開段取り）
- **次（実行順）**: ①develop→main反映後、`regenerate-blog-svgs` workflowをdry-runし、全ブログのmobile画像生成結果とギャラリーを目視する。②承認後、対象を限定してR2へexact publishし、PC/mobileの切替を代表記事で確認する。③`.claude/state/ads/relevance-latest.json`の270候補を意味レビューし、必要な記事だけ理由付きで`BLOG_AFFILIATE_POLICY`へ追加する。④既存note画像をmobile方針で再生成・差替えし、note本文の視認性を監査する。⑤web全テストを再実行し、survey timeout 1件・product OGP 2件・right-rail contract 1件が再現する場合は今回の変更と分離して起票する。
- **禁止**: 候補270件を機械判定だけで一括変更しない。テスト契約を弱めない。ユーザー承認なしにdeploy・R2 write・note公開を実行しない。
- **完了条件**: ブログのPC/mobile画像が全対象で生成・目視・公開確認済み、note既存画像の差替えと監査が完了、関連性候補が全件レビュー済み、今回変更に属するwebテストがgreenである。

### [ESTAT-CATALOG-01] e-Statメタデータ完全カタログの初回バックフィルと旧発見スクリプトの退役

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --import tsx .claude/scripts/estat/catalog.mjs search 人口] [起票:2026-09-16] [レーン:ランキング]

- **owner**: estat-researcher (catalog検索の消費側配線) / r2-publisher (初回backfillのdispatch)
- 2026-09-16、`.claude/scripts/estat/catalog.mjs` (run/pull/search) + `estat-catalog-monthly.yml`
  (月次cron・専用ブランチpushトリガー) を実装済み。R2 `estat-catalog/` へ全国/都道府県/市区町村の
  statsDataId一覧とgetMetaInfo要約 (年次・エリア種別・47県判定) を月次で保有する。
  設計: `docs/02_実装計画/48_e-Statカタログ実装仕様.md`。単体テスト19件 (`npm run estat:catalog:test`) PASS。
  **未実施**: 実e-Stat APIに対する初回runとR2 push (APP_IDはCI専任のためローカル未検証)。
- **次 (実行順)**:
  1. `estat-catalog-run` ブランチへpushしCIで初回run (`--dry-run`でL1件数を先に確認 → 全国の実件数を見て
     `meta-scope`に1を足すか判断)
  2. 時間予算150分では1回で終わらない (県+市区町村≈12,000表)。pendingが0になるまで3〜4回push
  3. `curl https://storage.stats47.jp/estat-catalog/manifest.json` で反映を実測
  4. `.claude/skills/estat/{search-estat,inspect-estat-meta}/SKILL.md` と
     `.claude/agents/{estat-researcher,theme-researcher,survey-curator}.md` にcatalog検索を先に引く1行を追記
  5. 上記が安定稼働したら旧発見スクリプト3系統を退役: `discover-prefecture-candidates.mjs` +
     `discover-estat-candidates.yml` + git内 `prefecture-candidates.json` (3.1MB・LARGE_FILE例外) /
     `estat-fetch-meta.yml` / `estat-city-discovery.json` (いずれもcatalogの`index/tables/`から導出可能)
     → 2026-09-16 にオーナー指示で 1ヶ月待ちを前倒しし退役済み (manifest metaPending 0 を実測): `estat-fetch-meta.yml` +
     branch `estat-meta-run` + `proof-batch-statsids.json`、`discover-estat-candidates.yml` + branch `estat-discovery-run` +
     `discover-prefecture-candidates.mjs` + `prefecture-candidates.json` (読み手ゼロ)、`estat-city-discovery.json`
     (読み手 2 件のうち estat-researcher は `search --collect-area 3` へ配線、estimate-city-data-size.mjs は D1 前提のため同日削除)。手順5 は完了
  6. `ssds-candidates.json`をcatalog派生に置換、find-metricsに未登録候補の索引を追加
- **完了条件**: manifestの`collectAreas.{2,3}.metaPending`が0、consumer 3件の配線完了、旧スクリプト退役
  (旧スクリプトの退役は新カタログが最低1ヶ月安定稼働してから)
- **禁止**: 全国(collectArea=1)の一律`--meta-scope 1`実行 (推定20万表超・時間予算超過のリスク。
  必ず実測件数を見てから判断)

### [THEME-SELECTION-BACKFILL-01] ThemeCatalogの選定根拠(selection)未記入540件を夜間の無人バッチで白書・公式統計から裏付ける

タグ: [エージェント・SSOT] [種類:改善] [実行:windows] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-16] [レーン:テーマ・Geo]

- **owner**: theme-designer (catalog TS の書き手) / theme-researcher (調査) / validator は data-configs scripts
- **背景 (2026-09-16 実測)**: `validate:catalog` の `no-adoption-criteria` warn は 539 件 (warn 合計 552 のうち。
  chart-temporal-fit 13 を除く)。aging-society 9 指標を theme-researcher(sonnet) → 呼び元検証 → 書き込みで処理し
  1 テーマ 19 分 (agent 9 分・41 tool call・28.5 万 token / 検証+書き込み+gate 10 分)。受け入れ検証で agent が
  社会生活統計指標コードを 7 件中 2 件誤記 (#A06603/04 ≠ config の #A06601/02) したのを捕捉。
  NotebookLM CLI はこの PC では SSL 証明書エラーで不可、白書は WebFetch で足りた。
  **構造の発見**: 55 テーマ中 31 テーマ + 既存テーマ拡張 67 章は `expanded.ts` の tuple で定義され、
  per-metric の selection 欄が無い → `selection-evidence.ts` を新設して置き場にした (規約 §4「置き場」)。
- **完了 (2026-09-16 同日)**: 手順 1〜3 を実装・パイロット済 (詳細は skill `/backfill-theme-selection`)
  1. validator: `[selection-code-mismatch]` / `[selection-boilerplate]` / `[selection-source-required]` /
     `[selection-criteria-all]` を error で追加 (`validateSelectionEvidence`)。population-dynamics の 3 件は
     proposedBy が内部監査名のまま adoptionCriteria が付いていたので外して対象に戻した (539 → 542)。
     URL 到達性と引用実在は network が要るので validator でなく backfill gate が担う。ratchet は既存の
     `check-quality-warning-ratchet.cjs` (baseline 548 → 540) を `develop-quality-gate.yml` にも配線
  2. skill `/backfill-theme-selection` + `.claude/scripts/themes/selection-backfill{,-core}.mjs`
     (targets / prompt / apply / run)。モデルはファイルを触らず JSON を返すだけ (tools = WebFetch/WebSearch、
     cwd は repo 外)。gate: 引用の逐語照合 (HTML 本文 / PDF は pdftotext) ・https 到達・定型文・コード一致
     (config cdCat01 + pull 済み e-Stat カタログ)・基準語彙。role / rejectedCandidates は書かない
  3. 夜間ドライバ `.claude/scripts/themes/run-selection-backfill.sh`: 専用 worktree・npm ci・catalog pull・
     preflight・並列 2・枠エラー 3 連続 (30 分待ち×3) と gate 不合格率 > 30% で停止・夜 1 コミット・
     report を `manage-theme-portfolio/reference/audits/<日付>-selection-backfill.md`
  - パイロット: tsunami-exposure 2 指標 → 通過 2/2、15 turns、128K トークン、$0.69。PDF 出典 2 件とも
    pdftotext 経由で引用 found。残 540 件
- **本番 run 1 晩目 (2026-09-16 21:24〜23:11、実測)**: 53 テーマ 481 指標を処理し 通過 206 / gate 不合格 17
  (引用not-found 8・引用短すぎ 7・URL 403 が 2) / 資料なし skip 19 (ふるさと納税系 7 件が PDF 解析不可で集中) /
  **未応答 239** (22:58 頃から `claude CLI error: You've hit your session limit` で 37 テーマがまるごと空振り。
  費用 $89.00 / 入力 28.7M トークン)。gate 不合格率は評価対象 242 件中 17 件 = 7% で停止条件 (30%) 未到達。
  report: `.claude/skills/theme/manage-theme-portfolio/reference/audits/2026-09-16-selection-backfill.md`。
  206 件を develop へ cherry-pick + push 済み (`128c42a42`)。ratchet baseline `no-adoption-criteria` 540 → 275
  (残数の実測値)。driver の commit trailer をセッション実行モデルに合わせて修正済み (`f0efdd550`)
- **次 (実行順)**:
  1. 今夜: `nohup setsid bash .claude/scripts/themes/run-selection-backfill.sh --push-develop > .local/selection-backfill/full-run-2026-09-17.log 2>&1 &`
     (worktree は自動で origin/develop にリセットされ、残 275 件を再導出する。`--push-develop` で
     stop 条件到達でも exit 3 は正常扱いされ commit + develop へ rebase push まで進む)
  2. 翌朝: report の「gate 不合格」「資料なし」を人が処理 (develop への取り込みは 1 で自動化済み)。
     「role の推奨」の処理は `THEME-ROLE-REVIEW-01` に分離済み
  3. session limit のリセット時刻 (前回 12:40am JST) をまたいで回すと最も長く継続できる。1 晩で終わらなければ
     同じコマンドを翌晩も繰り返す (残数は catalog から都度再導出されるので `--themes` 指定は不要)
  4. Windows PC で回すなら pdftotext (poppler) を入れる。無ければ PDF 出典は到達性のみで通る (`skipped-pdf`)
- **完了条件**: `no-adoption-criteria` = 0、role 推奨リストの人間処理完了 (ratchet 配線は完了)
- **停止条件**: 1 晩の gate 不合格率 > 30% (prompt か gate の問題なので続行しない)、枠エラー 3 連続
- **禁止**: 夜間バッチによる role 変更・rejectedCandidates への追加・`git commit --no-verify`・
  gate 未通過の selection の書き込み

### [THEME-ROLE-REVIEW-01] 夜間backfillのrole変更提案を人が採否判断しThemeCatalogへ反映・サイトへ展開する

タグ: [エージェント・SSOT] [種類:意思決定] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-17] [レーン:テーマ・Geo]

- **owner**: theme-designer (採否判断・`<theme>.ts` 編集) / 最終承認はユーザー
- **背景**: `THEME-SELECTION-BACKFILL-01` の調査は selection の裏付けだけでなく、副産物として
  「今の role (primary/secondary/context) は適切か」の判定も出す。これは selection と違い
  **採用すればサイト表示 (指標カードの並び) が変わる**唯一の出力。ただし夜間バッチは role を
  書き換えない (禁止事項) ので、人の採否判断とカタログ編集を挟まないとサイトに届かない。
- **進捗管理 (2026-09-17 新設)**: `.claude/scripts/themes/build-role-review-queue.mjs` が
  全 `reference/audits/*-selection-backfill.md` の「role の推奨」を横断集約し
  `.claude/state/theme/{role-review-queue.json,LATEST.md}` へ書く。夜間 run が自動で再構築する
  (driver に配線済み)。**「反映済み」は手動フラグでなく `THEME_CATALOGS` の実際の role と
  recommended の一致で自動判定する** (手動フラグはドリフトする)。現在: 45 件 pending (2026-09-16 run 分)
- **サイトへの展開経路 (実行順)**:
  1. `.claude/state/theme/LATEST.md` で pending 一覧を確認
  2. 1 件ずつ採否判断し記録: `node --import tsx .claude/scripts/themes/build-role-review-queue.mjs decide --theme <theme> --key <rankingKey> --decision accept|reject --note "..."`
  3. accept した分を対象 `<theme>.ts` (または `expanded.ts` の tuple 第3要素) の role へ反映
  4. `npm run generate:catalog --workspace=@stats47/data-configs && npm run validate:catalog --workspace=@stats47/data-configs && npm run type-check --workspace=@stats47/data-configs`
  5. localhost で視覚 QA (`theme-improvement-execution.md` の QA チェックリスト)
  6. commit → develop へ push
  7. **別承認で develop→main の通常デプロイ** (`.claude/rules/branch-workflow.md`)。role は
     `packages/types/src/indicator-sets/<key>.ts` (codegen) 経由で `apps/web` に**ビルド時 static
     import** される (`config/all-themes.ts` → `to-theme-config.ts` の `tabIndicators`/
     `defaultRankingKey`)。**R2 push だけでは反映されない** (2026-09-17 訂正: page-components R2
     sync で足りるのは chart 定義側だけで、role が駆動するカード表示は毎回アプリデプロイが要る)
  8. `node --import tsx .claude/scripts/themes/build-role-review-queue.mjs` を再実行し、対象行が
     `applied` になったことを確認
- **完了条件**: `role-review-queue.json` の `pending`+`accepted` が 0 (backfill が続く限り毎晩増える。
  日次で LATEST.md を捌く運用が定着したら本カードは削除し `THEME-SELECTION-BACKFILL-01` の「次」だけに戻す)
- **禁止**: 承認前の R2 push、`experiments.json` への baseline 登録なしの本番反映
- **参照**: `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md`
  (採択ゲート・実装契約・視覚QAの正典)

### [THEME-CHART-TEMPORAL-MISMATCH-01] line-chartが単年設定の13指標を再取り込みして年範囲を拡張する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-09-15] [レーン:テーマ・Geo]

- **owner**: data-ingester (年範囲拡張・再取り込み。判断待ちなし、以下は全件データ存在確認済み)
- `npm run validate:catalog` の `[chart-temporal-fit]` warn (2026-09-15新設) が機械的に検出。
  対象10テーマ13指標の line-chart が、`years: {from,to}` が単年 (from===to) の指標を参照しており
  推移を描けない状態だった (componentKeyに「trend」を含むものも複数: `theme-health-expense-trend`
  `railway-passenger-trend-jr` `roads-length-trend` 等)。
- **2026-09-15 e-Stat実データで確認済み (getStatsData実測、値がnullでない年のみ集計)**:
  全13指標とも**e-Statに複数年の実データが存在する**(config側の年範囲設定が不足していただけ)。
  チャート型変更は不要、年範囲拡張が正解。

  | metric key | statsDataId | config年数 | e-Stat実在年数 | 実在年 |
  |---|---|---:|---:|---|
  | national-medical-expense-per-person | 0000010209 | 1 | 14 | 1999-2022 (隔年等) |
  | turnover-rate | 0000010206 | 1 | 11 | 1977-2022 (5年おき) |
  | job-change-rate | 0000010206 | 1 | 11 | 1977-2022 (5年おき) |
  | gender-wage-gap | 0003426933 | 1 | 2 | 2021-2022 |
  | single-person-household-ratio | 0000010201 | 1 | 9 | 1980-2020 (5年おき) |
  | jr-passenger-transport | 0000010103 | 1 | 19 | 2005-2023 |
  | consumer-price-difference-index-housing | 0000010212 | 1 | 12 | 2013-2024 |
  | consumer-price-difference-index-food | 0000010212 | 1 | 12 | 2013-2024 |
  | actual-income-worker-households-per-month | 0000010212 | 1 | 50 | 1975-2024 |
  | road-total-length-with-expressway | 0000010108 | 1 | 19 | 2005-2023 |
  | road-expressway-length | 0000010108 | 1 | 19 | 2005-2023 |
  | building-fire-count-per-100-thousand-people | 0000010211 | 1 | 49 | 1975-2023 |
  | air-passenger-transport | 0000010103 | 1 | 49 | 1975-2023 |

- **次 (実行順)**: ①各 `packages/data-configs/src/metrics/<key>.ts` の `years` を上表の実在年範囲へ
  拡張 (5年おき等の指標は `{years:[...]}` 形式、連続年は `{from,to}`) ②`validate:years`/`validate:config`
  ③`page-data-batch --metric <key>` で再取り込み ④`npm run validate:catalog` で
  `chart-temporal-fit` warn 解消を確認。gender-wage-gap は2年のみのため折れ線でなく2点比較の
  表示 (mixed-chart等) が妥当か theme-designer が判断してもよい。
- **完了条件**: 対象13件で `chart-temporal-fit` warn が解消 (ラチェットは新規追加時の再発防止)。
- **検証**: `npx tsx packages/data-configs/scripts/validate-theme-catalog.ts`

### [LOCAL-RESOURCE-BUDGET-01] 資料の復元経路と再起動後のメモリ削減効果を確認する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-10] [レーン:基盤]

- **owner**: devops-runner（計測・保持確認）／オーナー（Codex再起動）
- **次（実行順）**: ①次回Codex再起動後に local:health を実行し、重複MCP設定変更の適用とNode数・専用メモリを同じ代表作業で比較する。②日本国勢図会のprivate Drive保管6分割bundleをWindowsへ復元し、既存source-vaultのSHA-256検証と再展開検証を通してから books/ を回収する。③残る一時GISの原本ZIP・固有スクリプトは取得URL・成果保存先・復元手順がそろうものから回収する。
- **再開材料**: 端末内 .local/resource-health/ の計測・掃除・GIS復元台帳、既存 source-inventory/japan-zue/2025-26/source-bundle-manifest.json。Driveの日本国勢図会/2025・2026年版にmanifestと6分割ファイルの存在・非共有・容量を確認し、ローカル1746ファイルのhash一致と全profileのcoverage 100%は検証済み。Drive connectorのバイナリ返却先はsediment URIで、このWindows端末への復元経路は未確立。
- **停止条件**: 未検証のDrive原本・GIS・WIP・認証profileを削除しない。既存セッションの一括終了やGit履歴リセットで軽量化しない。Node数・メモリはツール稼働を含む瞬間値であり、条件を合わせず削減効果と断定しない。
- **完了条件**: 再起動後の同条件計測を保存し、参考文献のDrive復元検証と source-vault:check が通る。GISは回収した各対象から保全先と再生成手順が辿れ、保全できないものには保持理由を残す。導入済み予算・定期点検方式は local-environment.md と自動化インベントリを参照する。

### [COCONALA-MEASUREMENT-CONTRACT-01] 14商品の公開後計測を整え改善台帳へ引き渡す

タグ: [インフラ・計測] [種類:改善] [実行:別環境] [起票:2026-09-06] [期日:2026-09-13] [レーン:note・商品販売]

- **status**: pending（期日は計測契約整備の次回確認期限）
- **owner**: coconala-operator（取得可否確認）／improvement-triage（効果観測の排他writer）
- **次**: 既存13定型商品＋Geo1商品の公開日時・baseline・観測期間・母数・判定条件・観測期限後の次手を定義する。本人照合・商品別閲覧/販売件数/お気に入りと全体販売額の収集入口は`measurement/marketplace-status.mjs`、日次証拠はprivate R2。問い合わせ数・商品別販売額は未取得であり、画面に無い指標を推測しない。
- **停止条件**: 公開前baseline不明はunknownとし、公開後の値を公開前の代用にしない。未取得を0とせず、母数0のCVRは未算出とする。認証・権限不足では停止し、売上効果を断定しない。商品変更・実験開始は行わない。読み取りの定期収集は2026-09-21の自動化依頼の範囲。
- **完了条件**: 取得根拠・日時付きbaseline/unknownと計測契約を既存商品stateへ保存し、improvement-triageが別IDのeffect/pendingへ引き継ぐ。引渡し証拠をbacklog-loopへ渡し、以後の観測待ちを本カードに重複保持しない。

### [GEO-SERVICE-PILOT-01] Geo納品見本の販売条件を確定し1商品だけ出品判断する
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-06] [レーン:note・商品販売]

- **owner**: オーナー（販売条件・承認）/ coconala-product-manager（再生成）/ coconala-operator（承認後の出品）
- **対象**: `packages/product-factory/src/channels/geo/service-offer.ts`。生成・見本・検証状態は `.claude/state/products/geo-service-readiness-2026-09-06.json` を参照する。
- **次**: 外部公開と匿名閲覧の検証結果は上記stateのpublicationを参照。出品の再実行は不要。商品生成コード・本人照合修正・出品台帳・`.claude/state/products/coconala-packs-2026-09-06.json`を含むcommitのdevelop反映をGitで照合し、ledger gateでカードを閉じる。Office実機確認・本人手続きはCOCONALA-PROFILE-OWNER-01へ分離済み。
- **停止条件**: 価格・公開未承認、公開manifestと不一致、空間結合・保存則FAILでは出品しない。需要未確認の公開はオーナーの明示指示を記録し、購入実績があるとは扱わない。note自動取得403を非公開・閲覧ゼロと誤判定しない。任意商圏・住所検索・鑑定・安全保証へ範囲を拡大しない。
- **完了条件**: 承認記録、納品ZIPのSHA、サービスURL・販売条件・実際の納品物の一致を確認するか、オーナーが出品見送りを決定する。カード削除はbacklog-loopのledger gate経由。

### [AFF-A8-NOTE-PILOT-01] A8 の note 用広告リンクを意図一致の無料 note 1 本で試し、stats47 分として計測できるか確かめる

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:収益導線]

- **owner**: affiliate-operator (A8 の確認・口座 assert) / note-manager (記事更新) / オーナー (公開承認)
- **背景**: A8 は 2026-09-01 に X・Threads・note 専用の広告リンク発行を始め (新メディア管理画面のみ)、
  09-17 に X 用リンクの商品画像 (OGP) 表示に対応した。X・Threads は採用しない。投稿のリンク枠が
  stats47 への送客と競合し、成果を GA4 で計測できず、OGP が統計図を広告主の商品画像に置き換えるため。
  note は読者の意図が案件と一致する記事に限れば、文脈一致の原則 (`.claude/rules/affiliate-ads-standards.md`) と両立する。
- **次 (実行順)**: ① A8 新管理画面で、note 用リンクの発行にメディアサイト登録が要るか、成果レポートで
  note 経由の成果を stats47 分として取り出せるかを確認する (A8 は doboku-note と口座共用でサイト切替が無い)。
  ② 取り出せる場合だけ、ふるさと納税・移住など意図が明確な既存の無料 note 記事 1 本と提携済み案件 1 件を選び、
  必要な click 数と最大期間を開始前に計算する。③ PR 表記付きでリンクを追加し、観測は improvements.md の別 ID へ引き渡す。
- **停止条件・禁止**: 成果を stats47 分として分離できなければ導入しない。新規提携申請、X・Threads への展開、
  ブロックリスト該当案件、クリックを促す表現は禁止。note 記事の更新は outward-facing なので実行前にオーナー承認を得る。
- **完了条件**: ①の結果を証拠付きで記録する。分離できる場合はパイロット 1 本が公開済みで観測 ID が起票されていること、
  分離できない場合は不採用の判断を `docs/00_プロジェクト管理/02_収益化戦略.md` へ 1 行で反映していること。

### [AFF-PLACEMENT-MAP-CORE-01] placement-map-core を「出典調査 → タグ → カテゴリ」に追従させ、survey の stale 判定を直す

タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [検証:node --test .claude/scripts/ads/__tests__/placement-map-core.test.mjs] [起票:2026-09-03] [期日:2026-09-30] [レーン:収益導線]

- **owner**: affiliate-manager
- **症状**: `.claude/scripts/ads/lib/placement-map-core.mjs` はブログを tags → vertical だけで判定し、
  ranking を categoryKey だけで判定する。#913 以降の実装は出典調査を最上位に見るので、
  `placement-map-latest.json` の `unmapped.byReason.tags-unmapped` と `demand.byVertical` が
  実態と食い違う (家計調査ページが economy に計上され続ける)。`survey-hardcoded-tags` の理由コードも
  2026-07-28 に survey ページが categoryKey 最頻値へ変わった時点で stale。
- **現在地**: `codex/affiliate-optimization` で実際のTS resolverを共有し、R2の調査メタを入力化。
  ローカル回帰テストと公開R2を読むdry-runを検証し、取り込み後の週次出力確認を残す。
- **次**: builder の入力に surveyIds (R2 `app/ranking/<key>/item.json` / `app/blog/all.json`) を足し、
  `resolveContentVertical` と同じ順で判定する。判定は純関数のまま (`placement-map-core.test.mjs` に
  「調査 null → 広告なし」「調査あり → カテゴリより優先」のケースを追加)。
- **完了条件**: 週次 `affiliate-dashboard-refresh.yml` の出力で家計調査ページが furusato に、
  学校保健統計ページが `no-intent` (新理由コード) に計上される。

### [AFF-VERTICAL-FIT-02] population / health / education 軸の上位在庫を主題に合わせて入れ替える

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-03] [期日:2026-10-15] [レーン:収益導線]

- **owner**: affiliate-manager / 判断は uruhayato373
- **実測 (2026-09-03)**: priority 上位 3 が主題と合っていない軸が残る。
  - population: マッチングアプリ ×2 が最上位。未婚率・婚姻には合うが、人口密度・在留外国人・
    世帯構造 (週 8K imp) には合わない
  - health: RIZAP / ClassPass が難病・精神病床・中絶率のページに出る。精力サプリは #913 で
    priority 1 に下げたが停止はしていない (improvements `AFF-BRAND-FIT-01` の判断待ち)
  - education: AI Agent Camp (Claude Code 研修) / LEC 資格講座が図書館・学校数のページに出る
- **次**: (a) マッチングアプリ・結婚相談所は `targetRankingKeys` で未婚率・婚姻・初婚年齢の
  ranking に限定する (b) 人口密度・世帯構造には子育て・保険系を上位にする (c) 図書館・学校数には
  通信教育・塾探し (エデュスタ p20) を上位にする。priority 変更は週 1 vertical 1 変更まで (rules §10)。
- **完了条件**: 3 軸とも GSC imp 上位 3 ページで priority 上位 3 の広告が主題と合っている
  (人が読んで判定。表を PR に残す)。

### [AFF-RAKUTEN-FIRST-01] 家計調査ページで楽天商品カードを native 枠より上に出し、計測を分離する

タグ: [UI・UX] [種類:改善] [実行:sweep] [検証:npm run test --workspace apps/web -- src/features/ads] [起票:2026-09-03] [期日:2026-10-31] [レーン:収益導線]

- **owner**: ranking-ui-manager / affiliate-manager
- **現在地 (2026-09-13)**: 後続の明示指示に基づき、全セッションの関連変更をPR963で公開した。app34739098468成功、計測定義切替は2026-09-13T05:02:32Z。楽天run34726845212で510検索を新規取得し、有品373・正常空137・失敗0。公開先510canonical GETの内容とepoch一致を確認した。固定28日baselineは `.claude/state/metrics/affiliate-placement-baseline-2026-09-08.json` を維持する。
- **公開後の次**: 48時間後に `rakuten-sidebar` のpage/device別計測を確認し、未取得なら
  商品在庫・DOM表示・GA4送信を切り分ける。14日以上の非重複窓で表示/PV・商品クリックを比較し、
  楽天成果レポート未取得の間は収益増と判定しない。直前のPR945の影響と混在するため因果効果は断定しない。
- **未完了**: 「楽天市場で探す」は通常検索URLのまま、affiliate_clickから除外済み。
  収益化するには楽天公式リンク作成で発行した検索リンクを取得し、生成URLを改変せず採用する。
- **なぜ**: 「納豆消費量ランキング」の読者に最も合うのは品目一致の楽天商品カードだが、現在は
  右レールの末尾 (`RakutenItemsCard`) にあり、GA4 では `blog-sidebar` / `ranking-sidebar` に
  混ざって計測されるため効果を分離できない。
- **次**: 9/15 14:02:32 JST以降に48時間の計装確認、9/27に14日経過後の比較可否を確認する。現行GA4のdays指定は当日を含むinclusive窓のため、明示日付の確定した非重複期間が取得できるまでは効果を判定しない。
- **停止条件**: 取得失敗・他県混入・PR/計測欠落があれば担当へ修正を引き渡す。収益化されていない通常検索リンクを成果クリックに含めない。
- **完了条件**: GA4 の `link_position=rakuten-sidebar` が家計調査ページで取れ、CTR が
  native 枠と比較できる。

### [PREFECTURE-DEVIATION-S5-01] 『47都道府県の偏差値』の一次資料候補25件をmetric/theme/ranking候補へ展開する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run source-vault:test] [起票:2026-09-15] [レーン:ランキング]

- **owner**: 台帳は`open-data-curator`、metricKey実在検証は`estat-researcher`、投入は`data-ingester`。
- **現状証拠**: profile `prefecture-deviation` (Drive `参考文献/47都道府県の偏差値/2018年版`、6分冊PDF・103ページ)を
  全ページOCR (jpn+eng, rotate 90, psm 4)。一律`rights-hold`103件だった旧判定 (書誌確定前の暫定placeholder) を撤去し、
  `packages/data-configs/src/evidence-inventory/prefecture-deviation/analyses.json` に章単位の分析・論点53件を authored
  (kakei-marketingと同じ形式)。`.claude/state/source-inventory/prefecture-deviation/2018/`はcoverage 100%
  (`combined-analysis` 25 / `primary-source-unavailable` 20 / `context-only` 5 / `not-applicable` 3)。
  書籍の偏差値・数値そのものは転記せず、章の着想だけを一次資料 (総務省家計調査・人口動態調査・国勢調査・
  住宅土地統計調査・文科省学力調査等) で独立再検証可能かを判定した。
- **次**: `combined-analysis` 25件を1件ずつ、①既存metric/rankingとの重複確認、②未登録なら`estat-researcher`が
  statsDataId実在検証、③`data-ingester`が投入、の順で管理画面`/content/references`にunit接続が出るまで進める。
  `context-only`5件 (自動車検査登録情報協会・全国軽自動車協会連合会等の業界団体統計) は既存記事の分析文脈補強にのみ使う。
- **停止条件**: 書籍の偏差値・数値・図表・本文を公開物へ直接流さない。一次資料で再取得できない項目は
  `primary-source-unavailable`のまま留める (`週刊朝日`独自集計の東大・京大合格者数ランキング等、20件は既に該当)。
  R2 write・deploy・SNS公開は別途承認。
- **完了条件**: `combined-analysis`25件全てがreuse-existing-metric/new-metricいずれかで既存SSOTへ接続され、
  管理画面`/content/references`で実在証跡が確認できる。

### [REFERENCE-CONTENT-DRAFTS-01] 参考文献由来のテーマ企画と横断ブログ下書きを制作する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run test --workspace=apps/admin -- reference-expansion-plans] [起票:2026-08-30] [レーン:テーマ・Geo]

- **owner**: テーマ採択は`theme-designer`、ブログ本文は`article-writer`、管理画面の読み取り契約は`admin-console`。
- **前提**: `japan-zue`の解決済みinventoryは論点発見だけに使う。記事・テーマへ載せる定義、年度、単位、値は、各metricの一次資料とR2観測値で再検証する。原文、OCR、書籍値、内部cropは公開しない。
- **テーマ企画**: 参考文献で`theme`対象になり、既存ThemeCatalogまたはIndicatorSetへ未統合の制作単位だけを保持する。`draft`は採択・チャート設計待ち、`blocked`はactiveな公開metricが無いため停止中。

<!-- reference-theme-plans:start -->
| metricKey | title | targetTheme | status | hypothesis |
| --- | --- | --- | --- | --- |
| projected-population-2020 | 将来推計人口 | population-dynamics | blocked | 将来人口と現在の人口動態を同じ時間軸で比較する |
| gross-prefectural-product-expenditure-nominal-h27 | 県内総生産 | local-economy | blocked | 地域経済の規模と産業・雇用構造を同じ画面で比較する |
| students-requiring-japanese-instruction | 日本語指導が必要な児童生徒数 | education-culture | blocked | 国籍と支援ニーズを分け、人数・児童生徒比・学校側の受入体制を重ねて読む |
| general-households | 一般世帯数 | population-dynamics | draft | [却下 2026-09-14] 人口動態=増減メカニズムと無関係、世帯構造は別テーマ向き |
| area-ratio-of-total | 面積割合 | climate | draft | [却下 2026-09-14] 面積割合は気候(気象)と直接関係せず地理指標 |
| number-of-establishments-manufacturing | 製造業事業所数 | manufacturing | draft | [却下 2026-09-14] 登録済みmanufacturing-establishmentsと同一statsDataId重複、年度が古い |
| average-life-expectancy-male | 男性の平均余命 | healthcare | draft | [却下 2026-09-14] subtitle年齢欠落・値63年が0歳時点と矛盾、metric要修正が先 |
<!-- reference-theme-plans:end -->

- **2026-09-14 テーマ企画14件を判定 (theme-designer)**: 採択11件をcontext roleでThemeCatalogへ追加 (`sex-ratio-total`→population-dynamics、`day-time-population`→labor-mobility、`electricity-generation-capacity`/`agricultural-employment-population`→local-economy、`avg-propensity-to-consume-worker-households`→real-income、`municipality-count`/`households-on-public-assistance`→local-finance、`infant-deaths`/`infant-mortality-rate-per-1000-births`/`average-life-expectancy-female-20`/`average-life-expectancy-female-65`→healthcare)。却下3件: `general-households`(人口動態=増減メカニズムと無関係、世帯構造テーマ向き)、`area-ratio-of-total`(気候テーマと面積は無関係、landweatherカテゴリのまま)、`number-of-establishments-manufacturing`(登録済み`manufacturing-establishments`と同一statsDataId・年度が古い重複)、`average-life-expectancy-male`(subtitleに年齢欠落・値63年が0歳時点と矛盾し要metric修正)。`generate:catalog`→`validate:catalog`(0 error/0 warn)→`tsc --noEmit -p apps/web/tsconfig.json`(0 error)まで確認済み。
- **ブログ下書き**: `docs/21_ブログ記事原稿/{household-structure-daytime-population-gap,agriculture-output-employment-productivity-gap,electricity-generation-manufacturing-establishments-gap,household-spending-debt-propensity-gap}/article.md`。4本とも`published:false`で、一次資料・R2接地前の数値主張を置かない。`general-households`/`number-of-establishments-manufacturing`は却下済みのため、該当2本のペア構成をarticle-writerが着手前に見直す。
- **次**: blocked 3件はactiveな公開metricが出た時点で再判定する。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
- **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
- **完了条件**: blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [レーン:基盤]

- **owner**: Claude Code
- **症状 (2026-08-17 実測)**: `sync-snapshots --only ranking-items` 完走後も
  `/ranking/marriages-per-total-population` の `<title>` が旧値 (2014年・東京 6.49) のままだった。
  三層で切り分けた結果 **R2 と Worker は正しく、Cloudflare エッジだけが stale**:
  - R2 `app/ranking/<key>/item.json` の `generatedAt` = 20:25:21・新 seoTitle 入り
  - `?cb=<random>` でエッジを迂回 → **新 title**・`cf-cache-status: MISS`
  - 素の URL → 旧 title・`cf-cache-status: HIT`・`age: 1649`
- **原因**: `sync-snapshots.yml` の「🧹 Purge Workers Cache after snapshot sync」が呼ぶのは
  `purge-worker-cache.ts` で、**Workers Cache しか消さない** (スクリプト冒頭に
  「zone purge API は Workers Cache へ影響しないため」と明記されている)。
  ゾーンのエッジキャッシュは別レイヤで、誰も purge していない。
  さらに origin は `cache-control: public, max-age=0, must-revalidate` を返しているのに
  エッジが HIT を返す = **Cloudflare 側の Cache Rule が Edge TTL を上書きしている**
  (`ogp-image-standards.md` §5.0 の `storage.stats47.jp` が `max-age=14400` を返すのと同じ構図)。
- **なぜ毎回は表面化しないか**: エッジにエントリが無い URL は origin まで抜けるので新値が出る。
  実際 同じ同期で `divorces-per-total-population` は即座に新 title になった。
  **「1 ページ直ったから反映済み」と判断すると取りこぼす**。
- **★ゾーン purge では直らないことを実測した (2026-08-17 21:00)**: `purge-cdn.yml` を
  prefix 空 (`purge_everything`) で dispatch し **run 32068743106 は success**
  (`🔄 Purging ALL CDN cache for https://storage.stats47.jp...` → `✅ Full cache purge complete`、
  zone `4caf2866…`)。にもかかわらず当該 HTML の `age` は 20:27 の充填時刻から
  **一度もリセットされず**増え続けた (2076 → 2153 → 2188)。同時刻に
  `storage.stats47.jp` は `DYNAMIC` を返しており、**purge はストレージ側にしか届いていない**。
  `deploy-workers.yml` 冒頭にも「purge-cdn は CDN のみで ISR には効かない」と既に書かれていた。
- **現時点で判明している構造**: ページ経路のエッジコピーを消す手段が**リポジトリ内に存在しない**。
  - `purge-worker-cache.ts --all` (sync-snapshots step 9・20:31:21 success) → Workers Cache のみ
  - `purge-cache.ts` (purge-cdn) → `storage.stats47.jp` のみ。`--files` も
    `${R2_PUBLIC_URL}/<key>` しか組み立てず `stats47.jp` の HTML を狙えない
  - → **purge 系スクリプトでは消せない**。実測では 50 分経過時点でまだ `HIT`
- **★デプロイすれば消える (2026-08-17 21:29 実測)**: PR #805 の develop→main デプロイ直後、
  同じ URL が `cf-cache-status: MISS` で **2022年・1位東京都（5.36人口千対）** を返した。
  buildId が変わってエッジコピーが無効化されるため。**「TTL 切れを待つしかない」は誤り**で、
  実務上は**次のデプロイまで stale**が正しい。したがって
  「snapshot 同期だけして数日デプロイしない」期間が危険窓になる (今回は 1 時間で解消した)。
- **次**: (1) Cloudflare ダッシュボードで **stats47.jp のゾーン ID と Cache Rule の Edge TTL** を
  確認する (オーナー領域。`CLOUDFLARE_ZONE_ID` が storage 用の別ゾーンを指している可能性を含む)。
  (2) ページ経路に届く purge 手段を決める (正しいゾーン ID での purge / Cache-Tag / `--files` の
  ホスト対応のいずれか)。(3) 決まったら `sync-snapshots` に配線する。
- **完了条件**: snapshot 同期の**次のデプロイ後**に本番 `<title>` を Googlebot UA で実測して新値になっている
  (代表 2 URL 以上)。判断できるまでは同期後の実測手順を SKILL に残す。
- **停止条件 / 承認境界**: ゾーン全体 purge は本番のキャッシュを一斉に落とすので、
  恒久配線はオーナー承認を経てから。Cloudflare の設定変更も outward-facing。
- 関連: `.claude/skills/db/sync-snapshots/SKILL.md` / `packages/r2-storage/src/scripts/{purge-worker-cache,purge-cache}.ts`

### [TILEMAP-LINEAGE-01] タイルマップの手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-03] [レーン:データ品質]

- **owner**: `chart-author`
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行の自動復元器が
  確証できる残件は0。タイルマップの手動判断残件は6枚で、正確な対象は
  `.claude/state/blog/svg-lineage-queue.json` の `residualCard === "TILEMAP-LINEAGE-01"` を正典とする。
  1枚 (`per-capita-income-gap/income-map`) は2021年SSOTと100%一致してローカル復元済み。
- **問題**: 公開済みタイルマップ 123 枚のうち 9 枚が現行の 720×720 デザインに移行できていない。内訳は (a) `data/*.json` が R2 に無い 7 枚 = 元データ消失 (`alcohol-prefecture-map/alcohol-consumption-map` / `childcare-friendly-prefecture-ranking/tile-grid-score` / `food-consumption-prefecture-battle/ramen-gyoza-tilemap` / `international-cooperation-volunteer-map/volunteer-rate-map` / `per-capita-income-gap/income-map` / `purchasing-power-adjusted/income-map` / `waiting-children-progress/waiting-children-map`)、(b) 年が確定できない 2 枚 (`fiscal-health-50years-trend/fiscal-map` / `fiscal-self-reliance-gap/fiscal-strength-map`)。
- **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
- **(a) の手順**: `.claude/rules/blog-data-schema.md` §1.7 の restoreMethod に従い SSOT から復元する。SVG の絵から値を逆復元しない。SSOT に該当年が無ければ e-Stat から取り込んで SSOT を伸ばす (`data-ingester`)。届かない図は記事から外すか SSOT にある図に差し替える。
- **(b) の手順**: 両記事の本文は 2022年度 を論じているのに地図は 1988年 (live) を表示しており、再生成すると 1989年 に振れる (SSOT 照合が両年で同程度に一致するため)。どの年の地図が記事の主張に対応するかを人が決めてから `--mapping` で固定する。**確定するまで push しない**。
- **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。

### [THEME-EXPANSION-IMPLEMENT-01] 地震曝露の住宅部分に使える全国空間原典を確保する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-09] [レーン:テーマ・Geo]

- **対象**: 候補105の住宅部分。現在の採用範囲と未充足は [全体実装記録](../state/metrics/themes/2026-09-10-all-expansion.json) の `scopeCounts` / `validation.next253Tsunami29.scopeAudit`、採否は [候補カタログ](../skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json) のdecisionを正典とする。
- **owner**: theme-designer（採用判断）／open-data-curator（原典探索）／data-ingester・gis-pipeline-runner（取得・空間集計）。
- **次・実行順**: ①住宅を直接数える全国空間原典を公式提供元で確認し、版・単位・住宅の定義・地域カバレッジ・利用条件を記録する。②利用可能ならJ-SHISとの空間対応、県別途中artifact、保存則を実装・検証する。③採用指標と章へ接続し、生成物・実表示・本番反映を同じ対象で確認する。
- **停止条件**: 全国住宅の原典が確保できない間は未充足を維持する。人口・一般世帯・建物棟数を住宅戸数の代用にしない。PLATEAU等の部分カバレッジを全国値にしない。原典未発見を全国に存在しないという断定にしない。
- **完了条件**: 住宅部分を原典から再現でき、定義・時点・空間集計・配信値の整合を検証し、候補105のdecisionと全体実装記録へ証拠を反映する。公開後の計測と品質観測は `THEME-EXPANSION-EFFECT-01` へ接続する。

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [種類:改善] [実行:対話] [起票:2026-07-18] [レーン:note・商品販売]

- **owner**: Claude Code
- **2026-08-27 監査**: 最新note metricsの上位24記事はcatalogのnote IDと一致0件で、対象アカウントの
  series別流入・clickを判定できない。誤ったseriesをpilotに選ばず、stats47 note側の計測が揃うまで待つ。
- **trigger**: note既存記事の流入・クリックを確認し、上位1シリーズだけをpilotできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。

### [NOTE-MAGAZINE-REORG-01] note既存投稿のマガジン再編成 + 新規投稿の増産

タグ: [種類:制作] [実行:windows] [起票:2026-08-03] [レーン:note・商品販売]

- **owner**: Claude Code
- **方針**: ココナラ商品カタログと同型 (git TS カタログ = SSOT)。ただし公開済み stats47-note 159 件は回収スタブ (key = note ID・不透明・`r2Body:false`) で、カテゴリはタイトルからしか導出できない点がココナラと異なる。
- **済 (Phase 1)**: `magazines.ts` を e-Stat 17 カテゴリ + 行動者率クラスタ = 18 マガジンに細分化。`assign-magazines-by-title.mjs` (タイトル分類・決定的) で公開済み 159 件中 143 件 (90%) を `s47-*` マガジンへ割当。validator pass・派生インデックス再生成済。
- **残り**:
  1. **note-operator 自動化を新設** (coconala-operator 相当・Playwright)。マガジン作成 + 記事割当を note.com へ反映する。**note ログインは人手** (初回・所有者アカウント)、実反映は draft-first + 承認境界。まず 1 マガジン (件数最多 = `s47-sports-culture`) で実証してから横展開。
     - 実装済: `.claude/scripts/note/login-note-profile.mjs` (永続プロファイル `.local/playwright-note-profile` への対話ログイン + account assert `.claude/config/note-account.json`)。
     - 実装済: `.claude/scripts/note/probe-magazine-ui.mjs` / `fetch-note-magazines.mjs` (read-only。既存マガジンを API 取得)。
     - **★probe で判明した実態 (2026-08-03)**: note.com には既に**有料マガジン3つ**が稼働中 — 公務員×Claude Code (¥1,980・key m512ad7023815) / e-Stat×Claude Code (¥1,480・m1b836e4c8dce) / D3.js配色完全ガイド (¥500・mfe0fab2606eb) + デフォルト「あとで読む」。**ランキング系マガジンはまだ note.com に無い**。
     - **済 (Track A・照合取り込み)**: 既存3マガジンの noteUrl + isPaid を magazines.ts に反映。product-d3-colors 新設 + D3 全6章を帰属 (第2-6章=stats47-note / 配色理論=koumuin-gis)。validator error 0。
     - **済 (membership 検証)**: `fetch-magazine-members.mjs` で各マガジンの note.com 実所属を取得・突合。結果: product-d3-colors 6=6 一致 / koumuin-claude-code note.com 37 vs catalog 35 (note.com が2件多い・マガジンが vertical 跨ぎ) / **koumuin-estat note.com 1 vs catalog 14 = 13件未追加 (Track B で追加)**。30 warn (有料マガジンに無料記事) は note.com buy-once モデルの実態と確認 (catalog は正しい)。
     - **flow 判明 (create-probe)**: マガジン作成/管理は `/notes` ダッシュボード。記事の「…」→ マガジンに追加、上部「マガジン ▾」で絞り込み。`/magazine/new` は 404。作成入口は追加モーダル内 or 専用ページ (要 click probe)。
     - **済 (Track B・operator 実装)**: `lib/note-session.mjs` (account assert) + `note-magazine.mjs` CLI (`plan` / `create --key --commit`)。作成フォームは `https://note.com/magazines/new` (名前≤30字 + 説明≤400字 + 無料/有料 + 作成)。dry-run で作成候補15件 (14 s47 + koumuin-gis・全て名前30字以内) を算出済み。無料マガジン専用 (有料は手動)、既存 noteUrl 持ちは作り直さない、`--commit` gate + account assert。
     - **済 (Track B・マガジン作成)**: `note-magazine.mjs create-all --commit` で s47-\* 14 + koumuin-gis = **15マガジンを note.com に実作成完了** (pilot 検証後に一括)。全 noteUrl を magazines.ts へ書き戻し。note.com マガジン総数 19 (今回15 + 既存4) を実測確認。catalog 18中15稼働・残3 (ict/international/energy) は記事0で受け皿。auto mode は「全て自動化」の明示指示で outbound write を許可。
     - **済 (Track B・記事割当 = add-article)**: `note-magazine.mjs add-articles --commit` で **合計156記事をマガジンへ投入完了** (s47-sports-culture 74本 / 自治体財政 14本 / koumuin-estat +13本 等・成功率100%)。API は `POST /api/v1/our/magazines/{magKey}/notes` body `{note_id, note_key}` (両方必須) + header `X-Requested-With: XMLHttpRequest` (CSRF 不要)。note_id は creator contents API (`kind=note`) の key→id マップから解決。既存メンバーは skip する冪等実装。**マガジン再編成 + 記事投入は note.com 上で完全稼働**。
       1b. **残 (整理・任意)**: (a) note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) の削除判断 = オーナー領域。(b) 未公開ドラフト22件のカテゴリ手当て or 整理。(c) s47-ict/international/energy (記事0) は新規投稿が付いたら create + add。(d) 新規投稿の増産 (`sns-content-standards.md` の note 頻度上限は 2026-08-03 撤廃済)。
       1c. **下書き37本の新規投稿 (browser-use・進行中) ★resume ポイント**:
     - **方針**: 「投稿できるものは全て投稿・上限なし」(2026-08-03 オーナー判断)。対象 = 完成済み下書き37本 (stats47-note 28 + koumuin-claude-code 9)。product-sales 55 は凍結チャネルで対象外。
     - **前提**: 投稿は **browser-use + Chrome Profile 5** (note.com/stats47 ログイン済・アカウントゲート合格確認済)。実行環境 = オーナーのローカル Mac。`export PATH="$HOME/.browser-use-env/bin:$PATH"`。
     - **済 (pilot 1本・実公開)**: `a-maximum-temperature` → https://note.com/stats47/n/n91e96edf3950 (HTTP 200・図3枚正配置・s47-climate へ束ね済)。
     - **修正済バグ2件** (commit 73bbe8939 等): ① `prepare-article.cjs` の画像 regex が `images/` を取りこぼす → `(?:\.\/)?images/`。② `ins_img` が目次(TOC)同名見出しに誤マッチ → `publish-new-note.sh` が投稿前に目次を折りたたむ。
     - **パイプライン (1本ごと)**: `node .claude/scripts/note/prepare-article.cjs <slug>` → `build-body.cjs <slug>` → `bash .claude/scripts/note/restore-from-r2.sh <slug>` → `node generate-note-covers.mjs --slug <slug>`(koumuin は `generate-koumuin-covers.cjs`) → `node generate-note-hashtags.mjs --slug <slug>` → `bash .claude/scripts/note/publish-new-note.sh <slug> <vertical> --publish` → live 確認 (`curl -sI note.com/stats47/n/<id>`) → catalog を published+noteUrl+magazine に更新 → `note-magazine.mjs add-articles --key <mag> --commit` で束ね。
     - **残 36本** (resume): catalog で `status:"draft"` の stats47-note 27 + koumuin-claude-code 9。`npx tsx -e 'import {NOTE_ARTICLES} from "./.claude/scripts/note/catalog/index.ts"; console.log(NOTE_ARTICLES.filter(a=>a.status==="draft"&&a.r2Body!==false&&a.vertical!=="product-sales").map(a=>a.vertical+"/"+a.key).join("\n"))'` で残スラッグを列挙。1本 ~5分・実 Chrome 占有・Bash 10分上限で1回2本程度。resume 可 (published は skip)。
     - **注意**: `koumuin-shigoto-kouritsuka-ai`/`pinned-intro` は vertical/性質が特殊 → 個別判断。誤配置の旧ドラフト `ndd6577272515` は削除確認ボタンが取れず残存 → note.com で手動削除。browser-use は毎回 daemon kill + editor.note.com タブ close (`browser-use-cleanup.md`)。
  2. **誤 vertical 16 件の再評価 (済/残)**: D3配色の章5件は実在有料マガジン (¥500) の中身 → 帰属済。Claude Code 記事は koumuin 有料マガジンの member (membership 検証で確認)。note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) は削除判断 = オーナー領域 (残)。
  3. **未解決 22 件 (未公開ドラフトの英語キー)** をカテゴリ手当て or ドラフト整理。
  4. **新規投稿の増産**: カテゴリマガジンを受け皿に増やす。`sns-content-standards.md` の note 頻度上限 (月1-2本) の見直しが要る (別判断)。
- **完了条件**: 公開済み記事が note.com 上でマガジンに束ねられ、新規投稿が catalog のカテゴリマガジンに自動で割り当たること。記事一括変更しない (1 マガジンずつ実証)。
- **停止条件 / 承認境界**: note.com への実反映 (マガジン作成・記事割当・新規公開) は outward-facing。人手ログイン + オーナー承認を経てから。SSOT は catalog git TS、note.com は反映先。
- **なぜ blocked-local-runtime か (2026-08-17)**: 残る主工程 (1c の下書き36本投稿) が
  **browser-use + Chrome Profile 5 をオーナーのローカル Mac で占有する**ため、CI からは
  原理的に閉じられない。status が `pending` のままだと日次ループが拾って 3 回失敗し
  quarantine するだけになる (`ASP-CONTINUITY-01` で実際に踏んだ)。
  **catalog だけで閉じられる残り (1b の (b) 未公開ドラフト22件の整理 / 3. 未解決22件のカテゴリ手当て) は
  ローカル不要**なので、着手するときは別 ID へ切り出してループに戻す。
- 関連: [NOTE-CIRCULATION-CTA-01] (回遊/CTA の catalog 駆動)・`.claude/scripts/note/catalog/README.md`・`.claude/rules/sns-content-standards.md` §note

### [MIGRATION-FLOW-PHASE23-01] 人口移動 月次/年次 workflowの生成ステップ未実装

タグ: [種類:不具合] [実行:対話] [起票:2026-08-01] [レーン:データ品質]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [種類:制作] [実行:ユーザー] [起票:2026-07-10] [レーン:ランキング]

- **owner**: Claude Code
- **trigger**: e-Statで2025年年報の公表を確認できること。
- **次**: 既存697 metricの年次更新を先に行い、需要確認済みの中分類だけを第2弾へ追加する。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。
- **正典**: `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 11 件

タグ: [種類:不具合] [実行:ユーザー] [起票:2026-07-30] [レーン:基盤]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない** (2026-08-17): 対象が `.github/` だけで、ループの verify は
  そこを**禁止パス**にしている（workflow を書き換えられると allowedTools・許可パス・timeout・
  モデルを自分で緩められるため）。status を pending のままにするとループが毎回 pick して
  `class-needs-pr` で skip し、枠だけを消費する。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所が 11 件残っている (2026-09-24 に `improvement-log-reminder-weekly` の 2 件を workflow ごと削除)。dispatch できる者が任意コードを実行できる類型。private repo で dispatch 権限者は push もできるため実効的な権限昇格ではないが、衛生上の負債。
- **★この負債は現在 CodeQL に検出されていない** (2026-07-30 実測): `.github/workflows/security-scan.yml` の init は `languages: javascript,typescript` で、**workflow ファイル自体は走査対象外** (走査には `languages: actions` が要る)。PR #655 で出た CodeQL 3 件はこれとは無関係で、`.claude/scripts/` の `execSync(テンプレート文字列)` = `js/command-line-injection` だった (同 PR で argv 形式へ是正済)。**「CodeQL が出たら workflow の式インジェクション」と早合点しない** — 2 度誤診した。
- **対象**: `blog-auto-publish` / `blog-remediation-daily` / `fetch-metrics-weekly` / `migration-flow-weekly` (2) / `publish-ai-content` / `sns-weekly-report` (2) / `sync-snapshots` (3)
- **次**: 各 step に `env:` ブロックを足し、`run:` はシェル変数だけを参照する形へ書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと 11 件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失図表の手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-12] [レーン:データ品質]

- **owner**: Claude Code
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行のranking自動復元器が
  確証できる残件は0。非タイルマップの手動判断残件は93枚
  (unknown 41 / ranking 18 / line 23 / stacked 4 / scatter 5 / findings 2)。正確な対象は
  `.claude/state/blog/svg-lineage-queue.json` の
  `residualCard === "CHART-LINEAGE-RESIDUAL-01"` を正典とする。CROSS側はこれらを推測復元せず閉じる。
- **背景**: 公開散布図 102 枚のうち 24 枚が元データ (`<base>.json` / `.source.json`) を失い、
  gate の検証対象外だった (gate は「78/78 正準」と報告するが 24 枚を見ていない = 死角)。
  2026-08-12 に SSOT から **19 枚を復元** (33 軸を SSOT 照合・一致率 80% 未満 0 件・R2 反映済)。
  残り 5 枚は**指標を同定できない / SSOT に値が無い**ため、捏造せず flag した。
  ★ SVG のピクセル座標から値を逆算して data json にするのは禁止 (`blog-data-schema.md` §1.7)。
- **残り 5 枚と律速**:
  | slug/base | 律速 |
  |---|---|
  | `international-cooperation-volunteer-map/{travel,foreign-pop}-vs-volunteer-scatter` | 「国際協力ボランティア率」に該当する metric が SSOT に**存在しない**。e-Stat 側の表を特定して投入する必要がある |
  | `per-capita-income-gap/income-vs-industry-scatter` | Y 軸「1人当たり県民所得」の現行基準が `isActive:false` / 値未投入。`data/data-refresh-requests.json` で 2021 年度取り込みを要求済 (2026-08-12) |
  | `purchasing-power-adjusted/income-vs-price-scatter` | 同上 (X 軸が同じ指標) |
  | `foreign-residents-diversity-map/manufacturing-vs-foreign-scatter` | X 軸「製造品出荷額 1人当たり」の**算出式と年次を特定できない** (最有力候補でも一致率 67-72%) |
- **次**: ① 県民所得の取り込み結果を確認し 2 枚を復元 ② 国際協力ボランティア率の e-Stat 表を
  `estat-researcher` で特定 ③ 製造業の算出式は記事本文の記述から再構成できるか確認する
- **完了条件**: `chartType === "scatter" && status !== "both"` の非正準が 0 枚
  (測定: S3 実体を読む。公開 URL は `max-age=14400` で最大 4 時間古い)
- **禁止**: 一致率が足りないまま「だいたい合っている」で復元しない。復元できないなら記事から図を外す

- **タイルマップ側の残り 6 枚** (2026-08-12 実測。公開 120 枚中、元データを持つ 22 枚は
  現行 svg-builder で再生成し R2 反映済 = 正準 114/120):
  | slug/base | 現状 | 律速 |
  |---|---|---|
  | `per-capita-income-gap/income-map` | 600×665 | 県民所得の現行基準が SSOT 未投入 (散布図と同じ) |
  | `purchasing-power-adjusted/income-map` | 600×700 | 同上 |
  | `international-cooperation-volunteer-map/volunteer-rate-map` | 600×700 | 「国際協力ボランティア率」が SSOT に存在しない (散布図と同じ) |
  | `alcohol-prefecture-map/alcohol-consumption-map` | 600×690 | 指標・年次の同定が要る |
  | `food-consumption-prefecture-battle/ramen-gyoza-tilemap` | 960×520 | 2 指標の対比図。同定が要る |
  | `waiting-children-progress/waiting-children-map` | 600×690 | 指標・年次の同定が要る |
- **散布図とタイルマップで律速が重なる**: `per-capita-income-gap` / `purchasing-power-adjusted` /
  `international-cooperation-volunteer-map` の 3 記事は両方の図が同じ SSOT 欠落で止まっている。
  **指標を投入すれば 2 種類まとめて解ける**ので、この 3 記事を先に片付ける

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [期日:2026-09-20] [レーン:テーマ・Geo]

- **owner**: gis-pipeline-runner（生成・再開）／r2-publisher（公開契約）／devops-runner（CI）
- **状態・着手時期**: 実装未着手。今回の公開完了後、次回Geo原典更新前に計測・設計から着手する。期日は初回設計の確認期限。
- **実測根拠**: [Geo run 34726806521](https://github.com/uruhayato373/stats47/actions/runs/34726806521) の2026-09-13 UTCの準備は00:01:59〜00:44:28（42分29秒）、dry-runは00:44:28〜01:21:35（37分07秒）。apply/readbackは01:21:35〜04:03:28（2時間41分53秒）、runはsuccess。17,717件・stored 2,199,375,814 bytesを公開し全件のS3/公開query照合に成功。3フェーズ合計4時間01分29秒（job準備等を除く）。[アプリCI run 34731862870](https://github.com/uruhayato373/stats47/actions/runs/34731862870) は `8f66cb638` で01:58:36〜02:08:11（9分35秒）・success。再取得は `gh run view 34726806521 --repo uruhayato373/stats47 --json jobs`。
- **コード根拠・未計測部分**: `apps/web/scripts/geo-source-publish-core.ts` の `buildExactPlan`、dry-run preflight＋共有publisher、apply preflight＋共有publisher＋PUT後確認は、変更対象1件につき計6回のHEADを行う構造。共有処理は `packages/r2-storage/src/scripts/push-exact-r2-assets-core.ts`。`mapGeoSourceBatch` は4件固定バッチの全終了待ちで、`.github/workflows/geo-source-publish.yml` は準備・dry-runもglobal `r2-write` lock内に置き、楽天公開の待ち要因になる。対象コードのdevelop pushは全件再生成・公開を発火する。実API数・HEADや解凍の時間寄与・短縮率は未計測。
- **次（実行順）**: ①phase別の壁時間、件数、API種類別回数、最大同時数、転送bytes、lock待ちを記録し、今回runの終了値を比較元に固定する。②最大4件のworker poolで空き枠を継続利用し、失敗検出後の新規dispatch停止とin-flight完了待ちをテストする。③候補の重複解凍・HEADの整理を計測結果から選ぶ。④原典SHA＋生成コード＋schemaに結び付いた検証済み生成物の再利用・再開を設計し、失効条件と失効時の再生成を固定する。⑤コードpushは検証、公開は明示scopeのCIへ分離する。準備と書込lockの分離は、巨大artifactの保存・転送・復元時間と費用を含めて採否を決める。
- **保持する契約・停止条件**: 全scope検査を最初のPUTより前に完了し、ETag条件PUT、gzipとdecoded両方のSHA、S3とcache-bust付き公開HTTPの全件照合、catalog-lastを保持する。purge後のcanonical検証は索引51件＋50ページの代表GISを予定範囲として区別し、実行時の対象キー・件数を記録する。全GISのcanonical GET完了とは扱わない。変更分への同強度検証と定期全件監査は別契約として設計・検証し、後者を前者の代用にしない。scope漏れ、再利用の失効判定不能、異常後の新規dispatch、検証強度低下、転送込みの時間・費用悪化があれば採用を止める。現在のCIをcancel/rerunせず、今回リリースへの実装追加をしない。短縮率の予測を成果にしない。
- **完了条件**: 対象テストで並行上限4・失敗後停止・ETag変更・gzip/decoded不一致・scope漏れ・生成物失効・catalog順序の異常を拒否し、同一scope/bytesの比較可能なCIで全フェーズと待ち時間・API数・転送量の変更前後を残す。変更なし／一部変更／再開／全件監査の各経路で、必要な公開対象と同強度検証の取り落しがない。未採用案は実測理由を残し、実測短縮が確認できるまで高速化完了としない。
- **既存カードとの境界**: `SYNC-SNAPSHOTS-MANIFEST-CARRY-01` は一般snapshotのmanifest持ち越し、`BUILD-PERF-PHASE34` はアプリCI cache・型検査の重複が対象。本カードはGeo原典生成からexact公開・再開・書込lockまでを扱う。

### [SYNC-SNAPSHOTS-MANIFEST-CARRY-01] sync-snapshots の「差分 push」が CI では毎回フル push になる

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [レーン:基盤]

- **owner**: `r2-publisher`
- **問題**: `diff-push-r2` は manifest (`.local/r2-manifest/`) と突合して差分だけ送る設計だが、
  manifest は runner ローカルなので CI では毎回空 (`マニフェスト記録済み: 0`)。結果
  **アップロード対象が常に全件**になる。run 32020891418 の実測で **14,033 件 / 24m44s**
  (9.45 files/s)、生成 33m07s と合わせて sync job は 58 分かかる。timeout 45 分では
  構造的に完走できず push が途中で打ち切られていた (是正済・timeout 120 分)。
- **次**: manifest を `actions/cache` で run 間に持ち越すか、R2 の ETag / SHA と突合して
  差分を出す。どちらを採るかは、cache の失効時に全件送りへ安全に degrade できるかで決める。
- **完了条件**: 連続 2 回の run で、2 回目の「アップロード対象」が全件でないことを実測する。
- **禁止**: push を速くするために検証や purge を削らない。差分判定を誤って
  **送るべきものを skip する**方が、全件送るより実害が大きい (stale 配信は 6 日間気づかれなかった)。

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [レーン:ランキング]

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [レーン:ランキング]

- **owner**: open-data-curator
- **正典**: `packages/data-configs/src/prefecture-statistics-catalog/README.md`
- **次**: 各県ポータルを1巡し、複数県で反復する指標だけを、定義、単位、粒度、年次、一次出典付きで上の表へ追加する。
- **完了条件**: 47県を確認し、既存metricとの非重複と全国比較可能性を検証する。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [種類:制作] [実行:対話] [起票:2026-05-19] [レーン:ランキング]

一次統計の実在、都道府県粒度、既存 metric との非重複を確認した候補だけを残す。
需要未確認の大量候補、取得失敗、重複は削除済みで、再調査は Git 履歴から行う。
`parse-backlog.cjs` が次の表を読む。`high` は既存テーマの欠測または需要が明確、`medium` は鮮度・特殊軸・導入先の追加判断が必要。

| priority | candidate_slug                     | category          | suggested_theme     | estat_stats_data_id | rationale                                                             | status  |
| -------- | ---------------------------------- | ----------------- | ------------------- | ------------------- | --------------------------------------------------------------------- | ------- |
| high     | outpatient-consultation-rate-total | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=4。既存テーマに全傷病の外来受療率がない    | pending |
| high     | inpatient-consultation-rate-total  | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=1。外来と対で医療アクセスを比較できる      | pending |
| high     | ambulance-dispatch-count           | safetyenvironment | healthcare          | 0000010111          | SSDS K1210、47県。救急搬送の基礎指標                                  | pending |
| high     | infant-mortality-rate              | socialsecurity    | healthcare          | 0003411730          | 人口動態統計2024、47県。既存healthcareの結果指標を補う                | pending |
| high     | average-household-members          | population        | population-dynamics | 0003414255          | 国勢調査2020 cdTab=1390、47県。人口動態テーマの世帯構造を補う         | pending |
| high     | working-age-population-ratio       | population        | population-dynamics | 0000010201          | SSDS #A03502、2024。年齢構造の基礎比率                                | pending |
| high     | juvenile-offenders-count           | safetyenvironment | safety              | 0000010111          | SSDS K4204、2023、47県。千人比は別calculated metricで扱う             | pending |
| high     | average-job-tenure                 | laborwage         | labor-wages         | 0003426933          | 賃金構造基本統計 cat04=01,cat03=01、47県                              | pending |
| high     | equivalized-disposable-income-gini | economy           | real-income         | 0003440743          | 全国家計構造調査2019表7-6、cat01=1（OECD新基準準拠）、47県・小数値   | pending |
| high     | nursing-home-count                 | socialsecurity    | aging-society       | 0000010210          | SSDS #J022011、2023、既存4指標と非重複                                | pending |
| high     | paid-nursing-home-count            | socialsecurity    | aging-society       | 0000010210          | SSDS #J02204、2023、47県                                              | pending |
| high     | life-time-use-series               | laborwage         | living-housing      | 0000010113          | SSDS生活時間。sleep/housework/mealsのcdCat01確定後に個別keyへ分割する | pending |
| medium   | beef-cattle-count                  | agriculture       | local-economy       | 0004041846          | 畜産統計2024。都道府県がcat01=1013-1059に入るためarea読替が必要       | pending |
| medium   | pig-count                          | agriculture       | local-economy       | 0004041860          | 畜産統計2024。通常area軸ではなくcat01読替が必要                       | pending |
| medium   | household-head-average-age         | economy           | consumer-prices     | 0003348239          | 家計調査2024、県庁所在市52件。都道府県値と誤認しない表示設計が必要    | pending |
| medium   | fishery-species-catch-salmon       | agriculture       | fishery-marine      | 0003425253          | さけ・ます類、2019、cat01=100-150。鮮度を明示する                     | pending |
| medium   | fishery-species-harvest-nori       | agriculture       | fishery-marine      | 0003425258          | のり類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | fishery-species-harvest-oyster     | agriculture       | fishery-marine      | 0003425257          | かき類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | housing-seismic-retrofit-count     | construction      | safety              | 0004025509          | 住宅土地統計2023 cat03=15。「耐震化率」ではなく改修実施戸数として扱う | pending |

**投入手順** (完了した行は削除する):

1. `parse-backlog.cjs` で候補を選ぶ。
2. e-Statメタと代表値を再確認し、`metric-config-standards.md` と `data-provenance-standards.md` に従ってconfigを作る。
3. config validation、R2 snapshot生成、ranking item、KNOWN/sitemapの順で整合を取る。
4. 本番反映はユーザー承認後にまとめて1回行い、HTTP 200、年、単位、代表値を実測する。
5. 完了した行は削除する。

### [METRIC-SUBTITLE-KAKEI-NOTE-01] 家計調査系 706 metric の subtitle が調査方法の定型文で、一覧・h1 直下に冗長表示される

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-09-16] [レーン:UI・回遊]

- **owner**: data-ingester (config 一括是正) / ranking-ui-manager (表示面の確認)
- 実測 (2026-09-16): `packages/data-configs/src/metrics/` の `kind: "kakei-chousa"` 706 件すべてが
  `subtitle: "都道府県庁所在市の二人以上世帯の年間{品目}消費支出額"` の形。`metric-config-standards.md` の役割表では
  subtitle は「同名指標を区別する短い定義補足」で、調査方法は `note` / `description` の責務。lint `subtitle-redundant`
  (`validate-metric-config.ts:250`) は「subtitle が title を包含」を真の識別子 (乳用牛(めす)) のために許容しているので、この定型文はすり抜ける。
- 表示への影響: ranking 右レールと関連ランキンググリッドは 2026-09-16 に UI 側で除外済み
  (`select-sidebar-items.ts` の `getSidebarDetail`: subtitle が title を含む場合は識別に使えないとして非表示)。**残っている面**:
  ranking 詳細の h1 直下 (`classifyRankingSubtitle` 経由)、category / survey / municipalities 一覧の `${title}（${subtitle}）` 連結
  (`app/category/[categoryKey]/page.tsx:184`、`app/survey/[surveyKey]/page.tsx:211`、`app/municipalities/**`) で
  「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」の重複が出る。
- **次**: ①決定的スクリプトで 706 件の subtitle 定型文を `note` (「都道府県庁所在市の二人以上世帯・年間値」等の短文 1 種) へ移し、
  subtitle は null にする (同名衝突がある metric だけ短い識別子を残す)。②`validate:config` / `validate:years` を通す。
  ③`sync-snapshots` の `ranking-items` で item.json を再生成 (デプロイが先: `branch-workflow.md`「R2 反映は main のコードで動く」)。
  ④UI 側の暫定ヒューリスティック (`getSidebarDetail` の包含判定・`classifyRankingSubtitle`) はデータ側が揃ったあとに縮退を検討する。
- **停止条件**: 一括書き換えで `subtitle-redundant` 以外の lint error が増えたら止める。R2 反映とデプロイはオーナー承認後。
- **完了条件**: 家計調査系 config の subtitle 行に定型文が 0 件、category / survey 一覧のタイトルに定型文の括弧書きが出ない、
  ranking 詳細ではチャート下の note として表示される。

## 🟢 低 — 時期未定・条件付き (trigger は本文に)

### [CHART-SOURCE-DERIVE-01] 図ごとの出典 (ブログの `<data-source>` タグ・機能別 ChartFooter の固定値) をデータから導出する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [レーン:データ品質]

- **背景**: 2026-09-25 にページ末尾の出典は `DataSourceList` でデータ由来に統一したが、図ごとの出典は手書き・固定値が残る。
  公開ブログ 94 記事の図の直下に手書きの `<data-source url label>` タグがあり (URL 43 種)、source.json と照合されていない。
  `apps/web/src/features` の 10 ファイルは `ChartFooter` に出典名を固定文字列で渡している (例: 人口移動 Sankey の統計表 ID)。
  実例として `depopulation-area-medical-facilities` の source.json は国土数値情報 P04 の旧 URL (`KsjTmplt-P04.html`、404) を持つ
  (表示は displaySources で現行 URL にしたが、系譜の URL は古いまま)。
- **次**: ① `<data-source>` タグの label/url を、同じ図の source.json から導出した出典と突き合わせ、食い違い・リンク切れを一覧化する。
  ② 図の直下の出典を source.json から自動表示する (タグを使わない) か、タグを残すなら監査に載せるかを決めて実装する。
  ③ 機能別の固定値を metric config / attribution 由来に置き換える。④ 系譜 URL の到達性を定期監査に入れるか検討する。
- **trigger**: 出典リンク切れ・誤表記の指摘、または図の出典の書式を変えるとき。
- **完了条件**: 図ごとの出典がデータから導出され、手書きの出典 URL が監査対象になっている。

### [WIN-PREFLIGHT-NPM-SPAWN-01] Windows で preflight:pr の 3 gate が `spawnSync npm ENOENT` で判定前に落ちる

タグ: [インフラ・計測] [種類:不具合] [実行:windows] [検証:npm run preflight:pr] [起票:2026-09-25] [レーン:基盤]

- **背景**: 2026-09-25 にこの Windows PC で `npm run preflight:pr` を実行すると、`check-japan-zue-evidence-inventory.mjs` と
  `check-quality-warning-ratchet.cjs` が `spawnSync("npm", …)` で ENOENT、`check-money-unit-audit.cjs` も collector の起動で失敗し、
  ゲートの判定まで到達しなかった (Linux CI では同じ gate が成功)。既知の環境要因 2 gate (Sitemap / Unit Semantics Mirror) とは別物。
  原因の型は memory `feedback_windows_script_portability` の「npx/npm の spawn (Node22 は .cmd を EINVAL)」。
- **次**: 3 スクリプトの npm/npx 起動を、Windows でも動く形 (node で npm-cli を直接起動するか `shell` 指定) に揃える。
  共通の起動ヘルパーがあればそれを使う。
- **完了条件**: この PC で上記 3 gate が判定まで進む (成功・失敗は中身次第)。

### [SCRIPT-ORPHAN-DELETE-01] orphan スクリプトを紐づけ先カードの完了時に再判定する ((c) 群は 2026-09-24 判定済み)

タグ: [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-agent-skill-consistency.cjs で orphan 一覧を再取得] [起票:2026-08-17] [レーン:基盤]

- **owner**: uruhayato373 (削除可否はオーナー判断)
- **前提**: `SCRIPT-ORPHAN-TRIAGE-01` で orphan **29 本すべてを分類し、残す理由を記録した**
  (下記「orphan 29 本の分類」)。
- **済 (2026-09-16)**: (a) 群 6 本をオーナー承認で削除。`estat/estimate-city-data-size.mjs` (D1 前提。出力・cache・
  local-resources / .gitignore 登録も同時撤去) と、`blog/gen-chart-svg.cjs` / `lib/update-skill-primary-agent.cjs`
  (maintenance-debt baseline の UNBOUNDED_LEGACY 1 件も除去) / `note/generate-remaining-covers.cjs` /
  `note/inject-affiliate-blocks.mjs` / `sns/backfill-x-templates.cjs`。いずれも他スクリプト・skill・workflow からの参照なし。
- **trigger**: 下表 (b) の紐づけ先カードが閉じたとき。そのカードに紐づくスクリプトだけを再判定する。
- **次**: (c) 群は 2026-09-24 に判定・削除済み。残作業は (b) 群と (c) で残した 3 本の、紐づけ先が閉じた時点での再判定だけ。
- **完了条件**: (b) 群と残した 3 本がすべて、紐づけ先の完了後に削除されるか恒常利用へ移っている。
- **禁止**: (b) 群を巻き込んで一括削除しない。

#### orphan 29 本の分類 (2026-08-17 実測・`check-agent-skill-consistency.cjs`)

エントリ記載の 20 本は古い。実測は **29 本**。全件に残す/消す理由を付けた。

**(a) 役目が終わっている 6 本** → 2026-09-16 に全て削除済み (上記「済」)

**(b) 生きているバックログに紐づく 13 本** → 消さない。紐づけ先が閉じるまで資産として残す

| 紐づけ先                                                                        | スクリプト                                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`      | `db/export-city-local-finance.cjs` / `estat/{etl-city-stats,fetch-city-local-finance}` / `gsc/inspect-cities-sample.cjs`            |
| `BLOG-SVG-LINEAGE-RESTORE-01` (in-progress)                                     | `blog/restore-{findings,ranking,scatter}-from-svg.mjs`                                                                              |
| `NOTE-MAGAZINE-REORG-01` (in-progress)                                          | `note/{note-magazine,fetch-note-magazines,fetch-magazine-members}.mjs` / `note/probe-{create-form,magazine-create,magazine-ui}.mjs` |
| `CHART-LINEAGE-RESIDUAL-01` (pending)                                           | `blog/resolve-scatter-axes.mjs`                                                                                                     |

`restore-*-from-svg.mjs` は名前に反して**逆復元をしない** — 旧 SVG の表示値を
「SSOT が正しいことの照合先」としてのみ使い、≥0.95 一致したときだけ SSOT から再生成する
(`.claude/rules/blog-data-schema.md` §1.6 の捏造防止規約に適合)。名前だけで消さない。

`probe-*` は note.com の UI が変わったとき再実行する read-only 調査用。note は SPA で
DOM が変わりやすく、実機 probe なしでは実装を直せない (`kdp-publish` と同じ理由)。

**(c) 用途が判断できなかった 9 本** → 2026-09-24 に判定済み (リリース #1021〜#1023 後も未使用を確認)

- 削除 6 本: `blog/prefecture-food-profile.mjs` (一度きりの記事用・入力は /tmp) / `blog/select-conformance-candidates.mjs`
  (依存する routine は 6 月から未登録・無効。`triggers.json` の該当定義に削除を注記) / `gsc/discover-trends-fetch.cjs`
  (`/discover-trends` から呼ばれない) / `note/affiliate-incremental.sh` (単一広告・Profile 直書きの一度きり作業) /
  `note/download-affiliate-banners.mjs` (取得済み・呼び出し元なし) / `note/expand-for-fix.mjs` (/tmp 入力の一度きり作業)
- 残す 3 本: `blog/build-article-data-from-r2.mjs` (2026-08-26 にも修正あり。R2 から記事 data を作り直す代替手段) /
  `note/publish-new-note.sh` (publish-note SKILL・テストから参照され使用中。orphan 一覧からも外れた) /
  `psi/generate-cwv-pr.mjs` (有効な routine `stats47 weekly CWV PR` の手動代替として `triggers.json` に明記)

**なぜ orphan 警告を 0 にしないか**: (b) の 13 本は「今は呼ばれていないが消してはいけない」もので、
これを 0 にするには allowlist を作るか無理に参照を生やすことになる。どちらも実態を曇らせる。
warning のまま**理由付きで残す**のが正しい形で、これが本エントリの成果物。

- **完了条件**: orphan 警告が 0 になるか、残るものが「なぜ残すか」を添えて記録されている。

### [NOTE-PAID-MANUSCRIPT-SYNC-01] API パッチで変えた有料記事 6 本の private R2 原稿を live 本文に追従させる

タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [起票:2026-09-20] [レーン:note・商品販売]

- **owner**: note-manager
- **背景**: 2026-09-20 に `patch-note-paid-landing.mjs` で d-kakei / d-geo 4 本 / 財政 ¥200 の無料部分を live で直接更新した。
  変更内容は `catalog/data/paid-landing/<key>.json` (git) にあるが、private R2 (`stats47-private/note/…/draft.md`) の原稿は改稿前のまま。
  d-kakei は `note-published-urls.json` に無く `publish-paid-note-private-r2.ts` の対象外 (index 漏れ)。
- **trigger**: 有料記事の原稿を private R2 から復元して再公開する作業が発生したとき、または paid-landing spec を持つ記事が 10 本を超えたとき。
- **次**: `publish-paid-note-private-r2.ts` に `--from-live <key>` (所有者 API の全文を draft.md 相当として保存) を足すか、
  spec 適用後の本文を原稿として書き戻す。d-kakei を published index へ登録する。
- **完了条件**: spec を持つ全記事について private R2 の原稿 SHA が live 本文から再現できる。

### [CATEGORY-NAV-CONSOLIDATION-01] カテゴリ一覧UIの2実装 (PortalCategoryGrid / CategoryNavGrid) 統合検討

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-15] [レーン:UI・回遊]

- home (`/`) と `/category/[categoryKey]` は同一の `PortalCategoryGrid`
  (`apps/web/src/features/home-portal/components/PortalCategoryGrid.tsx`) を使い、17カテゴリの
  順序・データ源 (`CATEGORY_DEFS`) は一致している (整合済み・対応不要)。
- 一方 `/areas/[areaCode]` は別実装の `CategoryNavGrid`
  (`apps/web/src/features/area-profile/components/CategoryNavGrid.tsx`) を使い、アイコン+色タイル
  (件数なし) と `PortalCategoryGrid` のテキスト+件数行という異なる見た目・挙動になっている。
- trigger: `/areas/[areaCode]` を次に触るセッションで、統合が本当に妥当か (県スコープの
  リンク生成・件数表示の要否が違うため意図的な分離の可能性もある) を精読してから判断する。
  2026-09-15 時点でこのファイルは別の並行セッションが直後に編集済み (uncommitted) のため、
  今回は触れずこのカードだけ残す。

### [MUNI-RANKING-EXPANSION-01] 市区町村ランキング拡充 (全量公開 2026-09-01 実施済み・残は SSDS 未使用分)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-01] [レーン:ランキング]

- **owner**: Claude Code (選定・監査) + オーナー (公開承認)
- **実施済み (2026-09-01)**:
  - 第1バッチ 6 key + テーマ population (オーナー承認・本番実測済み)
  - **全量公開 (オーナー指示「公開できるものは全て公開したい」)**: 候補 184 のうち **171 key + 19 テーマ**を
    published 昇格。除外 13 の理由は catalog の unsupported/unknown エントリが正典
    (cities.json 不在 4 / 値完全一致の重複 7 / 品質監査未了 2 = industrial-land-price・major-lake-area)。
    fiscal-strength-index の unknown は「0 = 194 行政区 + 特別区部のみ」の実測で解消。
    同名 title の系列は item snapshot の `subtitle` でページ title を区別 (generator が衝突未解決を throw)。
    副産物: moving-in-excess-rate の subtitle 誤り是正 + SSDS 系 10 config の displayName/url 補記
- **残り (次の拡充はここから)**:
  1. 品質監査未了 2 件 (industrial-land-price / major-lake-area) の要否判断
  2. **SSDS 未使用 733 指標** (`expansion-survey.json` の `ssdsUntapped`・同じ 1,913 団体軸) —
     e-Stat から `page-data-batch --kind city` で cities.json を作れば同じ pipeline で公開可能。
     metric config 新設が要るため data-ingester 系の作業
  3. 非 SSDS 3,349 表 (R2 estat-catalog `npm run estat:catalog:search -- <語> --collect-area 3`、2026-09-16 manifest) — 表ごとに軸 pin 設計が要る長尾
- **計測**: 公開 28 日後 (2026-09-29 目安) に GSC/GA4 で市区町村面の実測。pilot の 9/21 判定は
  confounded (doc 44 記録済み)
- **関連**: doc 44 WP8 / `MUNI-AI-CONTENT-01` (公開 key が 10 を超えたため trigger 1 は成立。
  trigger 2=解説スロット・3=オーナー承認 は未成立)

### [MUNI-AI-CONTENT-01] 市区町村ランキング用 ai-content を別契約で新設する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-08-31] [レーン:ランキング]

- **owner**: Claude Code (ranking-content-author 系の拡張として)
- **trigger (3 つすべて満たすまで着手しない)**:
  1. doc 44 WP8 の実測判断で公開 municipality ranking key が増えること (目安 10 key 以上。現在 1)
  2. `/municipalities/ranking/<key>` ページが解説を描画する設計になること (現状 item.json の
     title/description のみで、解説スロットが無い = 消費者不在)
  3. オーナーが市区町村面のコンテンツ投資を承認すること
- **設計要点 (着手時の前提。正典 = `ranking-content-standards.md` §スコープ境界)**:
  - namespace は `app/municipalities/ranking/<key>/ai-content.json` (県版 `app/ranking/` と混ぜない)
  - スキーマは県版の流用禁止。1,717 自治体に「県別解説 47 件」の相当物は成立しないため、
    上位/下位の要約・県別分布・母集団と除外自治体 (entityPolicy / valuePolicy) の説明・FAQ で構成する
  - 監査は `app/municipalities/ranking/<key>/values.json` (cities.json 由来・1,717 entity) と
    突合する専用実装。県版の EXPECTED_PREF_COUNT=47 / thin 40 / 7 地方区分は持ち込まない
  - 共有するのは原理のみ: 数値突合 (number-audit の設計)・author/critic 分離・outbox → push → CI 公開
- **完了条件**: pilot key 1 件で生成 → 専用監査 blocker 0 → critic PASS → ページ描画まで通し、
  誤値を注入して監査が発火することを実測する
- **関連**: doc 44 (`docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`) WP8 / `JAPAN-COMMENTARY-01`

### [JAPAN-COMMENTARY-01] /japan の時系列解説は別コンテンツ型として要否から判断する

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-08-31] [レーン:SEO・ブログ]

- **owner**: Claude Code (theme-designer / strategy-advisor と協働)
- **trigger**: `/japan/*` の GSC 実測で流入が付き、解説の読者価値を検証する意味が出たとき
  (doc 43 は「最低コンテンツ基準を満たす slug だけ active」— 需要実測が先)
- **決めること**: ランキング ai-content の派生では作らない (正典 `ranking-content-standards.md`
  §スコープ境界)。`/japan` の契約は `app/japan/<metric>/series.json` = 公式全国値の時系列で、
  1位/最下位/県別解説の形が構造的に当てはまらない。候補は (a) theme の evidenceTopics /
  markdown-section の系譜で人手キュレーション、(b) 時系列専用の生成契約を新設、(c) 作らない。
  要否そのものから判断する
- **完了条件**: 採否の判断が実測根拠つきで記録され、採用時は設計が別 backlog として起票されること
- **関連**: doc 43 (`docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md`) / `MUNI-AI-CONTENT-01`

### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [種類:改善] [実行:対話] [起票:2026-07-12] [レーン:基盤]

- **owner**: Claude Code
- **状態**: 未完了範囲はCIのbuild成果物再利用・変更種別ごとの検査分岐・短縮効果の実測。型検査の必須性を維持し、同一入力で合格したローカル検査は変更理由がなければ繰り返さない。
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **追加の実測根拠（2026-09-13）**: PR964の初回CI `34740979345` はE2E 102/103成功。公開R2の地域経済チャートは意図した折れ線へ更新済みだったが、テストの旧ドーナツ表示要求が残っていた。テストmatrixだけを修正した次回CI `34741425669` でも全体build・型・unit・E2Eが実行され、18チェック成功。job全体（依存導入などを含む）はStatic Gates 533秒、Full E2E 522秒、Build Check 309秒で並行実行されており、合算を待ち時間と扱わない。コードだけでなく公開データ版も検証入力として記録する必要がある。
- **次（実行順）**: ①jobごとの依存導入・build・検査・cache復元/保存の壁時間を測る。②コード・lockfile・生成設定・データmanifestの組を固定し、同じ入力の検証済みbuildを後続jobで再利用できるか試す。③アプリ変更、テスト変更、運用記録だけの変更に応じたrequired checksを設計し、無関係な全体buildの繰り返しを減らす。④同じscopeの前後時間と費用を比較する。公開R2を候補コードへ組み合わせるE2Eでは、カタログ変更の公開前後で期待値がずれるケースを別途検出する。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。
- **完了条件**: 変更種別ごとに必要な検査が必ず実行され、入力変更時のcache失効と失敗伝播を確認する。復元/保存込みの同条件比較で短縮が実測されるまで高速化完了とはしない。今回のリリースへCI構成変更を追加しない。

### [AREA-DATABOOK-REMAINDER] 県データブックの小粒残件

タグ: [種類:改善] [実行:対話] [起票:2026-07-19] [レーン:UI・回遊]

- **owner**: Claude Code
- **trigger**: 既存47県版の利用実測で、欠損セクションが回遊または検索の阻害要因と確認できたとき。

### [MULTICHANNEL-CONTENT-PRODUCT-01] 商品チャネル横断化

タグ: [種類:制作] [実行:対話] [起票:2026-07-18] [レーン:note・商品販売]

- **owner**: Claude Code
- **trigger**: ココナラまたはnoteの単一商品で実売、粗利、supportMinutesを測定できた後。
- **正典**: `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`

### [GIS-CROSS-CONTENT-BACKLOG] 統計×GISコンテンツ

タグ: [種類:制作] [実行:対話] [起票:2026-07-04] [レーン:テーマ・Geo]

- **owner**: Claude Code
- **trigger**: 既存GIS素材と検索需要が一致する単一pilotを選べたとき。

### [CLOUDFLARE-INVOICE-01] 請求書PDFと予測値の突合

タグ: [種類:改善] [実行:対話] [起票:2026-05-16] [レーン:基盤]

- **owner**: Claude Code
- **trigger**: 手動精算漏れが再発するか、請求額が継続して予測から10%以上ずれるとき。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [レーン:ランキング]

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [LEFT-RAIL-992-HEADER-DECISION-01] 992〜1023px で「ヘッダーは折りたたみ・左レールは表示」になる食い違いをどう揃えるか決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **観測 (UI 全面点検 2026-09-25・`UI-SITEWIDE-MINOR-01` から切り出し)**: 992px でヘッダーのナビは折りたたみ (ハンバーガー) なのに、
  ホーム・カテゴリの左のカテゴリ欄が出て本文が狭くなる。
- **判断が要る理由**: `.claude/rules/ui-components.md` は「全ページの左レールは共通境界 992px から出す。992px でも本文幅 656px を
  確保でき、1024px 未満のアプリ内ブラウザでも横幅を使える」と意図した設計として定めている。直すには次のどちらかを選ぶ必要がある。
- **選択肢**: ① 左レールの境界を 1024px (ヘッダーの展開と同じ) へ上げる (規約と `LeftRailLayout` の変更。アプリ内ブラウザで左レールが消える)。
  ② 今のまま (本文 656px を許容し、食い違いは仕様として記録する)。
- **完了条件**: どちらかを決め、① なら規約・`LeftRailLayout`・契約テストを同じ変更で直し、② なら規約に理由を追記してこのカードを消す。

### [AFF-PR-LABEL-DECISION-01] アフィリエイトのバナーに「PR」「広告」の表示を付けるかを決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-25] [レーン:収益導線]

- **発見 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: ホーム・ランキング・市区町村ランキングなどのバナーに「PR」表記が無く、本文と区別しにくいと 2 グループの目視が指摘した。
- **現行の方針**: 収益化戦略 §3.2 は「バナーは画像だけを表示し、PR 見出し、説明、Card 装飾は加えない」と定めている。
- **決めること**: 景品表示法のステルスマーケティング規制 (2023 年 10 月施行) との整合。消費者庁の公式資料を確認し、広告であることの表示が
  必要なら、クリックを促さない小さな「広告」表記を全バナーに付ける (収益化戦略 §3.2 と `affiliate-ads-standards.md` を同時に改訂する)。
  外部の規制についての主張は公式資料の URL と確認日を付けて記録する (`evidence-based-judgment.md` 状況 2)。

### [DEV-ARTICLE-PLACEMENT-01] Claude Code などの制作手順の記事を、一般読者向けの一覧にどう出すかを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-09-25] [レーン:SEO・ブログ]

- **発見 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: `/blog` の人気タグに「ClaudeCode」、`/survey/police-statistics` の関連記事と `/tag/population` の記事カードに
  「Claude Code で 1 分で作る」などの制作手順の記事が並び、統計の読者向けの一覧と混ざっている。
- **考慮**: これらは行政実務者向け (Track B) の入口でもある (`/blog/assembly-answer-chatgpt-5steps` は CTR 13.1%)。一律に除外すると入口を失う。
- **決めること**: 一般の一覧・関連記事から外して専用の入口 (実務者向けのタグやハブ) にまとめるか、現状のまま混在させるか。

### [LAYOUT-MAX-WIDTH-DECISION-01] データのページ (ランキング・テーマ・都道府県) だけコンテナの最大幅を広げるかを決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **現状**: `PageShell` と `ArticleShell` のコンテナは `max-w-[1280px]` (`apps/web/src/components/layout/PageShell.tsx` の
  `SHELL_WIDTH_CLASS`、`ArticleShell.tsx`)。2026-07-11 に「サイト全体の統一・doboku-note と同じ固定幅」のため 1700px から 1280px に
  狭めた。広い幅で具体的な不具合が出たという記録は見当たらない。
- **実測 (2026-09-25 localhost・1920px で最大幅の制限を一時的に外して撮影)**:
  - ランキング (`/ranking/natto-consumption-expenditure`): 本文のカードの最大幅が 844px → 1,484px。1280px 固定では切れていた表の
    「偏差値」列が全部見えた。地図は高さ 500px 固定なので縦に伸びすぎない。構造は崩れない。
  - ブログ (`/blog/telework-gap-tokyo-6x`): 本文 1 行の文字数が 43 字 → 71 字 (読みやすい目安は 1 行 40 字前後)。記事内の図は中央に小さく残る。
  - 1280px・1440px の画面では、最大幅を外しても本文の幅はほぼ増えない (画面幅で先に頭打ち)。表の列が切れる問題は
    `RANKING-MAP-TABLE-CARD-01` の「表を詰める」対応で直す必要があり、幅を広げても代わりにならない。
- **決めること**:
  1. データのページだけ最大幅を広げるか (候補 1536px)。広げるなら、本文の文章の列は読みやすい幅に制限する (1 行 40 字前後)。
  2. ブログ: **本文とレールの幅は今のまま**。図を本文より広く出す案は**採らない** (2026-09-25 オーナー判断: 見栄えが悪い)。
     レールを 2 列にする案は選択肢として残す (成り立つのは 1,536px 以上の画面だけ。今のレールは目次・出典調査・関連記事・広告で、
     `BLOG-TOC-TOP-ONLY-01` で目次が本文上部へ移ると中身が減り、2 列では埋まらない恐れがある。UI 規約の「左レールは右レールと
     併用しない」との関係も確認する)。
- **判断材料を集める手順**: ① GA4 で訪問者の画面幅 (`screenResolution` 等) の分布を直近 28 日で取り、1,536px 以上の割合を確かめる
  (割合が小さければ広げる効果は小さい)。② 候補の幅で `/ranking/*`・`/themes/*`・`/areas/*` の代表ページを 1536/1920px で撮り、
  カード・チャート・表の崩れが無いかを見る。③ 広げる場合の変更点 (Shell の幅の定数を種類別にする・ヘッダーの幅との揃え方・
  文章の列の上限) を洗い出す。
- **完了条件**: 広げるか・広げないか、ブログのレールを 2 列にするかを決め、採るなら実装カードへ置き換える。見送るならカードを削除する。
  2026-07-11 の統一の判断を変える場合は、`PageShell.tsx` のコメントとデザインシステム文書の横幅の記述も同時に直す。

### [AREA-TOC-MOBILE-01] 県ページの目次をスマホでも本文上部に出すか、16 項目をどう見せるかを決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **背景 (2026-09-25 localhost `/areas/13000` 実測)**: 「〇〇の目次」(県データブックの 16 節へのリンク、
  `AREA_DATABOOK_TOC_ITEMS`) は PC では右レール最上部 (追従なし) にあるが、375px では 1 件も表示されない
  (リンクの表示幅 0)。スマホには県ページの目次が実質無い。ブログと違い 16 項目あるので、本文上部へ縦に並べると
  画面を大きく占める。
- **決めること**: ① スマホで本文上部に目次を出すか。② 出すなら見せ方 (折り返す横並びのリンク / 主要節だけ /
  その他)。表示領域に収まるリンク一覧は折りたたまない規約 (`.claude/rules/ui-components.md`) を前提にする。
  ③ PC の右レールの目次を残すか、本文上部へ統一するか (`BLOG-TOC-TOP-ONLY-01` の「目次は本文最上部 1 か所」と
  そろえるか)。判断材料に `NAV-CLICK-COVERAGE-01` の導線名で目次のクリックを数週観測してもよい。
- **完了条件**: 採否と見せ方を決め、採るなら実装カードへ置き換える。見送るならカードを削除する。

### [RANKING-SOURCE-TRIPLE-01] ランキングページで出典が 3 か所に出る (ヒーロー行・ページ末尾・サイドバー) のを整理するか決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [レーン:UI・回遊]

- **背景**: 2026-09-25 にページ末尾へ `DataSourceList` (統計表リンク付き) を加えた結果、`/ranking/<key>` では出典が
  ヒーローカード下の `SourceAttribution` 行、ページ末尾の「データ出典」、右レールの「この統計の出典調査」の 3 か所に出る。
  役割は正典 (`docs/01_技術設計/04_デザインシステム.md`「データ出典」) で分けてあるが、読者から見て重複かどうかは未判断。
- **決めること**: ヒーロー行を残すか (上部で出典に 1 手で届く利点) / 右レールの調査カードと統合するか。GA4 の `nav_click`
  (`ranking_survey` と `ranking_source`) で各導線の利用を数週観測してから決める。
- **完了条件**: 採否を決め、採るなら実装して正典の役割表を更新する。見送るならカードを削除する。

### [RULES-OWNER-READ-CHECK-01] owner agent が担当 rule を明示 Read しているかを検査するか決める

タグ: [エージェント・SSOT] [種類:意思決定] [実行:対話] [起票:2026-09-23] [レーン:基盤]

- **owner**: オーナー (採否) / Claude Code (採択後に `check-agent-skill-consistency.cjs` へ実装)
- **背景**: 2026-09-08 に rule を `paths:` 条件付き読み込みへ切り替えたため、rule は **その agent 自身が一致ファイルを Read したときだけ**載る (`docs-vs-issues.md`「rules の読み込み条件」)。owner agent の手順に担当 rule の Read が無いと、subagent は規約を知らないまま作業する。`RULES-DEMOTE-01` (rule 3 本の移設、2026-09-23 完了) で残った判断。
- **次**: 採るなら、agent frontmatter / 本文から担当 rule を抽出し、手順に `.claude/rules/<name>.md` の Read が無い agent を warn にする。誤検知の出方を全 agent で実測してから error 化を決める。
- **完了条件**: 採否と理由が決まる。採る場合は checker の検査が既存 agent で誤検知 0 になり、Read を消すと warn が出ることを確認する。

### [ADMIN-STAT-PILOT-01] 行政資料1業務の統計整理商品を検証し、有料pilotの採否を決める

タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-09-18] [期日:2026-10-02] [レーン:行政資料]

- **owner**: オーナー（実務例・協力者・購入条件） / strategy-advisor（比較と採否） / coconala-product-manager（採択後のサンプル仕様）
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §2・§3.4・§5。一般向け統計メディアを維持しながら、議会答弁・計画策定のために各所の統計をExcelへ集める重複作業を減らす。課題はオーナーとの議論で確認したが、対象業務の詳細・削減時間・支払者・価格・購入需要は未検証。
- **記録先（2026-09-20 新設）**: `.claude/state/products/admin-stat-interviews.json`。聞き取り結果はここへ書く（対象業務・完成条件・使った統計・現行手順・所要時間・手直し・再実施頻度・既存手段で残る作業・支払者・根拠）。**回顧による時間と実測を別フィールドで持つ**（収益化戦略 §5 段階2 の要求）。感想や意欲は記録しない（購入意思の代用にしないため）。
- **聞き取り相手はすでにサイトへ来ている（2026-09-20 実測）**: 行政実務の文脈にあるページが GSC 上位に並ぶ。`/blog/assembly-answer-chatgpt-5steps`（48 clicks / 366 imp・CTR 13.1%、サイト全体 3.36% の 4 倍）、`/blog/local-government-debt-burden`（425 clicks）、`/blog/local-tax-revenue-gap`（47 clicks）。出典 `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W37/pages.csv`。**相手を探す段階は越えているので、①②に時間をかけすぎない。**
- **①の途中経過（2026-09-25・オーナー指示で一時停止）**: 題材は「都道府県の介護保険事業支援計画（第9期・2024〜2026年度）の高齢者の現状分析章」にオーナーが決めた（比較した候補は水道広域化推進プラン・農業振興計画）。理由は、3年ごとに47県すべてが策定し、第10期（2027年度〜）の策定作業が今年度にあたること、metric 定義が最も厚いこと（`elderly-population-ratio`・`elderly-single-person-households`・`single-households-age65plus-{male,female}`・`long-term-care-certified-persons`・`nursing-home-capacity-per-1000-65plus`・`nursing-home-staff-per-100k-65plus` など）。対象資料の第一候補は岡山県「第９期 岡山県高齢者保健福祉計画・介護保険事業支援計画（案）」令和6年2月（https://www.pref.okayama.jp/uploaded/attachment/363015.pdf 、14.3MB を取得済み）。**案の段階の版なので、確定版の公開 URL を探して差し替える。** 既定の `pdftotext`（mingw64）は日本語を出力しなかったため、指標の抜き出しは未着手。**R2 の都道府県データで揃う指標・揃わない指標の実測も未着手**で、どの指標も揃ったとはまだ言えない。再開時の次の一手は、①確定版 PDF から現状分析章の図表を列挙し（指標名・地域粒度・年次・出典）、②各指標の R2 `app/stats/<key>/values.json` の有無と最新年を確認して表にし、③揃わない指標が完成条件に必須なら TOOL-MATERIAL-BUILDER-01 の停止条件に当たるとして報告する。
- **GA4 の業務文脈シグナル（2026-09-24 実測）**: GA4 Data API で country=Japan、2026-08-27〜09-23 のブログ着地セッションを対象に、PC 比率と平日9〜18時比率を「職場で読まれている」手掛かりとして集計した（行政実務者本人である証明ではなく、祝日は除外していない）。ブログ着地全体は 7,199 セッションで PC 比率 45.0%、平日9〜18時比率 44.4%。この平均を大きく上回る着地は water-sewage-crisis（47 セッション・PC 96%・平日 73%）、estat-7-techniques-from-unusable-to-usable（38・95%・69%）、household-solo-vs-dualincome（36・92%・63%）、rice-harvest-volume-prefecture-gap（163・80%・88%）、farmland-crisis-abandoned-land（94・63%・57%）、aging-solo-living-crisis（73・67%・54%）、automotive-industry-transformation-map（227・67%・53%）だった。一方でこのカードが根拠にしている `/blog/local-government-debt-burden`（606 セッション）は PC 30%・平日 39% で平均を下回り、`/blog/assembly-answer-chatgpt-5steps`（88 セッション）は PC 52%・41% でほぼ平均だった。Microsoft Teams 経由（参照元 teams.public.onecdn.static.microsoft）の流入が 28 日で 17 セッションあり、education-expenses-gap・local-government-debt-burden・estat-7-techniques-from-unusable-to-usable・aging-solo-living-crisis などに着地しており、組織内でリンクが共有されている形跡がある。ランキング CSV のダウンロード（file_download）は 28 日で 193 件・120 ページだが、ブログ着地からのダウンロードは 0 件だった。継続観測先は週次 snapshot の `.claude/skills/analytics/ga4-improvement/reference/snapshots/<YYYY-Www>/landing-context.csv`（2026-W38 から、コミット `3ea0fece3`）。**この実測が示すのは、聞き取り①の題材候補として地方財政より上下水道・農業・高齢単身・e-Stat 実務の側に職場からの読者が集まっている可能性であり、標本が小さいため題材決定の決め手ではなく優先順位づけの参考にとどめる。**
- **優先・次（実行順）**: ①公開情報で再現できる実際の資料1件について、必要な地域粒度・統計・年次・完成条件・現行手順・再実施頻度を具体化する。②担当者3人を目安に、RESAS・自治体ダッシュボード・書籍・既存Excelでも残る作業と支払者の購入条件を確認する。③同じ仕様で助けられる場合だけ既存資産から無料サンプルを1つ作り、出典照合と利用者のExcel環境での編集を確認し、手直し込みの総時間を比較する。④収益化戦略§5の試用条件を満たした場合に価格・工数上限・時間単価・販売面を定め、有料pilotのGo/Pivot/Stopを判断する。期日は初回の採否・不足証拠確認日であり、未検証でも発売する期限ではない。
- **既存タスクとの境界**: `PRODUCT-SALES-READINESS-01`等の品質是正・既存購入者への対応は維持するが、全商品完成を本検証の前提にしない。既存パックを利用できるかを先に調べ、用途未確認の新作・販売面を増やさない。採否後の優先順位は事業計画TS・商品カタログの開始条件にも反映する。商品在庫を需要の証拠と扱わない。
- **停止条件**: 既存手段で十分、担当者ごとに要件が異なり共通化できない、必要な粒度が取得できない、照合・手直しを含む時間が減らない場合は対象変更または見送り。協力者・試用が得られなければ未検証と記録し、次回確認日と再開条件を決める。検索数・DL数・AI作成の架空ペルソナで実務試用を代替しない。実務者への連絡、販売・価格の外部反映はこのカードだけでは実行しない。
- **完了条件**: 対象業務・必要粒度・代替手段・時間の測定方法と結果・支払者・購入経路・採算の入力が確認済み/未確認に分かれ、根拠付きのGo/Pivot/Stopが収益化戦略へ反映される。Goの場合だけ1商品・1販売面・価格・上限工数・観測期限が具体化される。実売を観測していなければ「事業成立」と報告しない。

### [AFF-NO-INTENT-FALLBACK-01] 「広告なし」にした主題 (身長・気候・犯罪など週 7,757+ imp) に何を出すか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03] [レーン:収益導線]

- **owner**: uruhayato373
- **背景**: #913 で `SURVEY_AFFILIATE_MAP` に null を置いた調査 (学校保健統計・気象統計・面積・
  犯罪・火災・水害・廃棄物・上下水道) はランキングで週 7,757 imp、ブログで 20,501 imp (気候・地名・
  公務員向け how-to 含む) が意図軸の広告なし (ハウス枠 + AdSense) になる。意図の合わない広告を
  上位に置くより空の方が無害という判断だが、収益機会としては空いている。
- **選択肢**: (a) 現状維持 (AdSense のみ) (b) 汎用ハウス枠 (転職 neo-recruit は 28 日で
  5,093 imp / 5 click と全広告中最多) を 2 枚に増やす (c) 主題ごとに商材を開拓する
  (身長 → 成長サプリ・子ども向け通信教育、気候 → 引越し・家電)。
- **決めること**: (b) にするか、(c) をどの主題からやるか。決まったら 🟡 に実装カードを切る。

### [AFF-GEO-SLOT-01] /geo に広告枠を置くか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03] [レーン:収益導線]

- **owner**: uruhayato373
- **背景**: 2026-09-02 の棚卸しで枠の無い route は `/japan` (54 imp/週)・`/municipalities` (0)・
  `/geo` (0)・法務ページのみ。japan / municipalities は #912 で足した。`/geo` は
  `geo-analysis-standards.md` が canonical ページの 7 構成 (問い → 途中地図 → 検算 → 集計 → 補助
  レイヤー → 方法) を規定しており、広告の置き場を規定していない。流入 0 なので急がない。
- **決めること**: 置くなら「方法・限界」の後 (読了位置) に native 1 段、vertical は分析の主題
  (駅アクセス → mobility、2050 人口 → population)。置かないなら本カードを削除。

### [GIT-HISTORY-SECRET-PURGE-01] Git履歴のAPIキーを扱う方針決定

タグ: [種類:意思決定] [実行:対話] [起票:2026-07-11] [レーン:基盤]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [T2-RANKING-NORM-SSG-01] ranking正規化派生のURL方針

タグ: [種類:意思決定] [実行:対話] [起票:2026-05-25] [レーン:ランキング]

- **owner**: Claude Code
- **次**: queryを別URLへ昇格する案、別rankingKey化、canonical吸収の3案を、検索需要とsnapshot容量で比較する。
- **完了条件**: URL policy、canonical、sitemap、既存queryの扱いを先に決め、実装案を混在させない。

### [MIGRATION-FLOW-IG-01] migration-flow の IG 投稿が 3 か月止まっている

タグ: [種類:意思決定] [実行:対話] [起票:2026-08-13] [レーン:SNS]

- **owner**: uruhayato373 (継続可否の判断)
- **問題**: `migration-flow-weekly.yml` の Instagram 投稿ステップが **12 回連続失敗** (約 3 か月・1 本も投稿されていない)。
  `❌ ディレクトリが存在しません: .local/r2/sns/migration-flow/okayama/instagram`。
  `.local/r2/` は gitignore された作業域なので runner のチェックアウトには無い。R2 から取得する段が
  無いか、`cleanup-r2-sns-videos.yml` (投稿済み動画を 30 日で削除) で素材が消えたかのどちらか。
  2026-08-13 の cron 横断ヘルスチェック初回実行で発覚 (それまで誰も気づいていなかった)。
- **次**: 「この IG 投稿を今後も回すか」を決める。**止める**なら workflow を無効化して
  自動化インベントリから外す。**続ける**なら素材を R2 から取得する段を足す (レンダから
  やり直すのか、保持ポリシーを変えるのかもセットで決める)。
- **禁止**: 素材の所在を確認せずに「取得段を足す」だけの修正をしない (30 日削除ポリシーと
  衝突すると同じ失敗を繰り返す)。
- **完了条件**: workflow が緑になる、または schedule が外れて横断ヘルスチェックの対象から消える。
- **正典**: `.claude/rules/sns-content-standards.md` §5.5 (R2 素材保持ポリシー)

### [NOTE-INS-IMG-HEADING-PLACEMENT-01] ins_img が見出し直前の段落をアンカーにすると画像が見出し直後へずれる

タグ: [種類:不具合] [実行:対話] [起票:2026-09-16] [レーン:note・商品販売]

- **owner**: 未定
- **問題**: `.claude/scripts/note/editor-helpers.sh` の `ins_img` は、アンカー文字列を含む段落の
  「次の `<p id=>`/`<li>`」を探して画像挿入位置にしているため、アンカー段落の直後が見出し
  (`<h2>`/`<h3>`) だと見出しを読み飛ばし、次セクション先頭の段落の前に画像を置いてしまう
  (実質: 画像が見出しの直後＝意図した位置の1ブロック先にずれる)。2026-09-16、b-kakei-* 8本の
  画像復元時に `audit-note-figure-split.mjs` の misplaced 件数で発覚 (7/8 本で計14枚が該当)。
  内容自体は正しい画像で欠落や誤情報ではないため公開は維持している。
- **試して失敗した案**: アンカー段落自身をそのままクリックし段落末尾へキャレットを置いて
  Enter する変更 → `b-kakei-necktie-decline` で misplaced が 1→2 に悪化して撤回済み
  (原因未特定。`BU state` が出す accessibility tree のダンプ形式の想定が外れている可能性が高い)。
- **次**: 実際に `BU state` の生ダンプ (`/tmp/ns.txt`) を見出し前後の段落で目視してから
  awk の抽出条件を組み直す。ライブの note エディタで最低3パターン (見出し直前 / 見出し無し /
  リスト直前) を実地検証してから全 note 記事へ展開する。
- **禁止**: ライブ DOM の実物を見ずに正規表現だけを推測で直さない (今回の失敗の再発)。
- **完了条件**: 見出し直前アンカーを含む記事で `audit-note-figure-split.mjs` の misplaced が 0。

### [NOTE-RECOVERED-DUPLICATE-CONSOLIDATION-01] recovered-* に同一テーマの重複投稿が残っている

タグ: [種類:意思決定] [実行:対話] [起票:2026-09-16] [レーン:note・商品販売]

- **owner**: uruhayato373 (どちらを残すかの編集判断)
- **問題**: note全体189本の商品カード監査中に発見。`recovered-n581a1409b2c9` と
  `recovered-ned30a382334d` が同一タイトル「大学数ランキング」、`recovered-n6f8a367906d1` と
  `recovered-nb2d65c42c28b` が同一タイトル「最高気温ランキング」で同日投稿。後者はさらに
  3本目の stub (`n863f429319ca`) と、画像付きで書き直した後継記事 `a-maximum-temperature`
  (現在 status:draft で未公開) も存在する。いずれもチャート画像パイプライン導入前の
  note.com バックフィルによる復元 stub。
- **次**: 各組で「どれを正本として残すか」を決める (後継記事があるものは後継を仕上げて
  公開し、旧stubを非公開化する方針が有力)。どの note 投稿を非公開/削除するかは
  公開済みコンテンツへの不可逆操作なのでオーナー判断が必要。
- **完了条件**: 各組が1本に統合される、またはそれぞれ独立して残す理由が記録される。
