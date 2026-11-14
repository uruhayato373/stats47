---
title: Playwright認証プロファイル
type: technical-design
status: adopted
updated: 2026-11-14
---

# Playwright認証プロファイル

Playwright を使う運用スクリプトのログイン状態、アカウント照合、復旧方法を定義する。実際にログインできるか、Cookie が有効か等の変動状態は本書へ記録しない。

## 原則

- profile と storage state は `.local/` 配下に置き、git へ commit しない。
- サービスとアカウント用途ごとに profile を分離する。
- 投稿、申請、公開、購入に関わる操作は実行前に対象アカウントを照合する。
- 認証失敗を自動再登録や別アカウントで回避しない。人が headed browser で復旧する。
- 例外: A8 / もしも / KDP の計測ログインと X の予約投稿用ログインだけは、オーナー承認 (A8・もしも 2026-09-26、KDP 2026-09-27、X 2026-09-30) により Mac 上で macOS キーチェーンの ID/PW による再ログインを 1 回だけ許す (`.claude/scripts/measurement/refresh-session.mjs`)。失敗・2FA・CAPTCHA は突破せず失敗印を残して停止し、人が確認して印を消すまで再試行しない。ID/PW を CI・git・ログへ置かない。KDP は本棚 → 既知 ASIN の口座照合 → Reports の順に通し、Amazon の 2FA (`/ap/mfa`)・追加確認 (`/ap/cvf`)・CAPTCHA が出たら同じく停止する。「ログインしたままにする」を付けて 2FA の再要求を減らすが、毎回 2FA を求められる口座では自動化できない。
  - **資格情報の読み口 (2026-09-28)**: `.claude/scripts/measurement/credential-store.mjs` が唯一の入口。Mac はキーチェーン、Windows は資格情報マネージャー (`cmdkey /generic:stats47-measurement-<source> /user:<ID> /pass` で登録。Win32 `CredRead` を PowerShell 5.1 から読むので追加モジュール不要)、それ以外 (CI) は読まない。サービス名は両 OS で同じ。直接読む書き方は `credential-store-contract.test.mjs` が止める。Bitwarden 等の外部サービスは使わない (オーナー判断)。
  - **資格情報の正本 (2026-10-01 オーナー決定)**: ログインが必要な全サービスの一覧と自動ログインの可否は `.claude/config/auth-credentials.json` が正本 (ID/PW は書かない)。この PC の登録状況は管理画面 `/ops/auth`「ログインと資格情報」で見る (登録の有無と ID だけを読み、パスワードは読まない)。ログインは Mac だけが持ち、CI と GitHub Secrets には ID・パスワード・セッションを置かない (2026-10-20 オーナー判断。下の「Macでの認証付き計測」)。**楽天アフィリエイト (2026-10-01)**: 成果 API が無いので、`rakuten-report.mjs` がログイン済みセッションで管理画面と同じ JSON (`/api/report/monthly?overview=1`・`/api/report/reward`) を読み `rakuten-results.json` に当月・前月を書く。照合テストは `__tests__/auth-credential-ssot.test.mjs`。
  - **2FA は認証アプリ方式 (TOTP) だけ自動化する**: `stats47-measurement-<source>-totp` に秘密鍵 (base32) を登録した口座だけ、`/ap/mfa` の画面でコードを計算して 1 回入力する (RFC 6238 の試験値でテスト済み)。SMS / メールのコード、追加確認 (`/ap/cvf`)、CAPTCHA は従来どおり停止する。Amazon の MFA 画面のセレクタは実機未確認で、外れた場合も停止する。
  - **同時に 2 台でログインしない**: 下の state 共用の理由と同じく、自動ログインは 1 台 (現状は Mac で、週次レビューの最初にオーナーが手で回す `npm run weekly:collect` の `refresh-session.mjs`。2026-11-08 に launchd の自動起動はやめた) だけにする。Windows で `refresh-session.mjs` を使うのは、Mac で回せない週に手動で 1 回だけ回すときに限る。
- A8 / もしもの state (`playwright-{a8,moshimo}-state.json`) は stats47 と doboku-note で共用する (2026-09-26)。実体は `~/.local/share/asp-sessions/{a8,moshimo}-state.json` (mode 600) で、両リポジトリの `.local/` にはそこへの symlink を置く。ログインするのは stats47 の Mac の `refresh-session.mjs` (`npm run weekly:collect` の 1 段目) だけで、doboku-note は読むだけにする (同じ口座へ別々にログインすると互いのセッションを切る恐れがある)。新しいマシンでは symlink を張り直す。state を rename で置き換える書き方は symlink を壊すので使わない。
- 2FA、CAPTCHA、税務・銀行情報、規約同意は人の操作として残す。
- 実行後は `.claude/rules/browser-use-cleanup.md` に従い browser / daemon / tab を閉じる。

## Playwright を使う前の判断（API 代替の可否）

**公式 API がある操作に Playwright を使わない。** API 経路は OAuth scope で権限を最小化でき、ブラウザセッション（サービス全権を持つ Cookie）を扱わず、セッション期限切れによる再ログインも要らない。Playwright は「API が提供されていない操作」だけの最後の手段とする。

判定を誤らないため、**API の有無と利用条件を型定義・公式リファレンスで実際に確認する**。
2026-07-30にはAdSense write methodをgrepで取りこぼし、翌日はmethodの存在だけを見て
一般publisherでも使えると誤認した。`create` / `patch`等の名前だけでなく、利用主体、
product code、対応format、scope、必要roleまで確認する。

| 操作 | 公式 API | 判定 |
|---|---|---|
| AdSense 広告ユニットの作成・更新 | `accounts.adclients.adunits.create` / `patch` は存在するが、AdSense for Platforms 系の制限プロジェクト向けかつ現状 `DISPLAY` のみ。stats47 の利用権限は未証明 | **API化しない。人間が管理画面で実施** |
| GA4 カスタムディメンション作成 | `properties.customDimensions.create` / `patch` / `archive` | **API を使う** |
| GA4 AdSense リンク監査・作成 | `properties.adSenseLinks.list` / `create` / `delete` | 監査はAPI。作成・削除は必要性と承認がある場合だけ個別allowlist化 |
| Instagram 投稿削除 | Graph API `DELETE /<IG_MEDIA_ID>`（`instagram_manage_contents`） | **API を使う** |
| GA4 の Search Console リンク作成 | 無い（Admin API v1alpha の型定義に `searchConsole` の語が無い。`Searchads` は Search Ads 360 で別物） | Playwright |
| GA4 Library の collection 公開 | 無い（Properties サブリソースに Library / Collection が無い） | Playwright |
| Amazon KDP の出品 | 無い（Amazon が公開 API を提供していない） | Playwright |
| note の記事投稿 | 公式 API 無し。非公開エンドポイントは note が保証せず規約・アカウントリスクがある | Playwright |
| A8 の提携申請・広告コード取得 | メディア側の該当 API は見当たらない（A8 の公開 API は広告主・ASP 事業者向けの成果確定／成果連携） | Playwright |
| afb 成果データ取得 | [公式の成果情報API](https://www.afi-b.com/guide/api-linkage/)と[仕様書](https://drive.google.com/file/d/1-k9l9QA16sNhSzxtX7LK1A2szQx25OY7/view)（2023-12-25版、2026-09-21確認） | 2026-10-19 に A8・楽天へ集約し、stats47 では成果を取得していない。再開するなら Cookie ではなく公式 API を使う。提携操作は別のローカル経路 |
| もしも | **未確認**（推測で「無い」と書かない） | 現状 Playwright |

### CI 実行について

**Playwright 自体は CI で動く。** `pr-quality-check.yml` と `post-deploy-smoke.yml` が `ubuntu-latest`（GitHub ホストランナー）で実行している。ただし**ログインが要る取得は CI で行わない** (2026-10-20 オーナー判断)。認証付き計測の CI 実行 (`authenticated-measurement.yml`)・補完起動・CI 再ログインと、セッション・ID/PW を持たせていた Secrets は撤去した。セッションを CI へ移送すると KDP などが毎回入り直しを求めて失敗し、そのたびにオーナーの手が止まっていたためである。

- **セルフホストランナーは本 repo では使えない。** stats47 は PUBLIC で、GitHub 公式が「セルフホストランナーは private repository のみ推奨。public repository の fork が危険なコードをランナー上で実行しうる」と警告している。
- CI に残るのは、Mac が保管庫へ書いた証跡を読む復元 (`restore.mjs`。`affiliate-ga4-weekly.yml` と `fetch-metrics-weekly.yml`) だけで、そのための Secret は `MEASUREMENT_VAULT_KEY` と R2 の資格情報である。CI は保管庫へ書かない (`vault.mjs` が Mac の定期実行以外の書き込みを止める)。

### Macでの認証付き計測

ログインが要る取得元 (A8・楽天・note・GSC の画面・KDP) は、毎週土曜の週次レビューの最初に Mac が取得する。`npm run weekly:collect` の 1 段目 `scripts/scheduled/measurement-session-refresh.sh` がログインを保ち直し、続けて `measurement-collect-local.sh` が定期実行専用の clone で取得して develop へ記録する。周期と、セッション中のエージェントが記録から読む決まりは `.claude/rules/recorded-measurement-first.md` が正典。

- ログインとセッションは Mac の専用 profile だけが持つ。`bootstrap-session.mjs` が profile から取り出した state を取得元の domain allowlist で絞って `.local/authenticated-measurement/<source>.bootstrap` (mode 600) に置き、`collect.mjs` がそれを一時 Playwright context へ読み込む。state を git・ログ・GitHub Secrets・保管庫へ出さない。
- Cookie は read-only 権限ではなくアカウント操作権限を持ちうるため、実行対象を固定済みの読み取り collector に限定する。投稿・申請・出版・振込・設定変更は対象外。
- 提供元が本人認証を要求した取得元は、その週は判定不能にする。土曜のレビューの場でオーナーが入り直して取り直すか、次の週を待つ。2FA/CAPTCHA の自動突破や、拒否された認証での再接続の反復は行わない。他の取得元は独立して継続する。
- 欠測を 0 に置換せず、初回成功だけで継続運用完了にしない。

| 対象 | 固定の読み取り範囲 | 完了と混同しないもの |
|---|---|---|
| A8 | 口座照合、サイト別月次CSV、reject検査 | 複数サイト共用口座の全体値をstats47にしない。個別案件EPCは別契約 |
| 楽天 | 管理画面と同じ JSON の当月・前月の成果 | 報酬を純収益・入金にしない |
| note | 帰属・期間・全ページ・合計・公開カタログ・カバーの照合 | 欠落記事はnull。不完全データを全件成功にしない |
| GSC | property照合、概要と5分類の詳細CSV。ZIP内カテゴリ・件数・URLのサイト帰属をingestで照合 | APIの検索パフォーマンスとは別経路。概要CSVの成功を詳細CSV成功にしない。UI exportの上限は各分類1,000行 |
| KDP | known ASINで口座照合、登録書籍の出版状態、昨日の注文/KENP/電子書籍ロイヤリティ見積り、月別の電子書籍/KENPロイヤリティ | Reportsは別認証。現版/旧版ASINと著者名を照合し共用口座の他サイト書籍を除外。月次ロイヤリティを入金・税引後利益・週次純収益にしない |

もしも・afb は 2026-10-19 に A8・楽天へ集約し、取得元から外した。

保存先はprivate bucket `stats47-private` の `operations/authenticated-measurement/<source>/`。
`MEASUREMENT_VAULT_KEY`によるAES-256-GCMでobject addressごとに認証し、PUT後GETの一致を検証する。
`latest-attempt.enc`、`latest-success.enc`と、UTC日付の剰余による
`runs/day-0..29.enc`（30日分の循環slot）を保持する。KDPの月次だけは`kdp/monthly/month-0..23.enc`に原本XLSX・正規化結果・SHAを24報告月の循環slotとして別保管する（税務帳簿の保存契約ではない）。無制限に履歴を増やさず、公開custom domainへ置かない。
セッションは保管庫へ置かない。ブラウザを開く前に止まった試行 (セッションを取り出せない等) の証跡は固定`latest-blocked.enc`に分離し、最後に実際の画面で失敗した日の証跡を上書きしない。
vault keyはR2 credentialsとは別。初回端末の`.local/authenticated-measurement/vault-key`を保持し、
紛失時に無断でrotateしない。認証・生データの漏洩時は本書のSecurity incidentに従う。

gitに残すのは`data/authenticated/latest.json`の対象別成否・時刻・固定理由・証跡hashだけ。
失敗は固定`authenticated-measurement-alert`のIssueへupsertし全対象復旧でcloseする (`measurement-collect-local.sh`)。別系統の週次レビューの CI の健全性 (`weekly:audits` の ci-health)
も鮮度を確認する。週次summary/reviewもこの状態を読み、古い成功や未取得を実測0にしない。
収集範囲（capability）・対象source・実行ID・観測時刻が一致しないstatusは成功にしない。同じ実行に複数の試行があれば最大の試行番号を選び、それが失敗・不正なら古い成功に戻さない。
復元側もcapabilityを照合する。
KDPはknown ASINで本棚の口座を照合後、全書籍の状態巡回より先にReports認証を確認する。本人ログインの`--reports`もEnterだけではexportせず、Reportsの表示を確認する。
Reportsの遷移直後のURLだけでは認証失敗と断定しない。実画面の「昨日」tabを最大30秒待ち、表示と`https://kdpreports.amazon.co.jp`の完全一致を確認する。待機後もsign-inなら`auth_required`で停止し、初期redirectの有無・最終origin/path・password欄の表示有無だけを暗号化証跡へ記録する。URL query・Cookie・入力値は診断へ含めず、フォーム送信・認証保護の回避は行わない。成功時も初期redirectの有無を記録し、待機処理が成功原因だったかを証拠で区別する。
再ログイン要求を受けたstateを加工したり、認証保護を無効化して継続しない。
KDPの昨日値は速報値で、注文等はマーケットプレイス現地日付、KENPはUTC。正規化は各recordの`dateBasis`に保持する（[公式Dashboard](https://kdp.amazon.com/en_US/help/topic/GX7EGDFGS9CZCA2F)、2026-09-21確認）。遅延や再集計がありうるため、日次値の単純合算で確定週次売上を作らない。確定収益の元資料は毎月15日前後に作成される[月別のロイヤリティ](https://kdp.amazon.co.jp/ja_JP/help/topic/G200641190)。ASIN・通貨別の月次収益であり、共有口座の支払い総額や週次純収益にそのまま転記しない。
月次collectorはJST15日以降は前月、14日までは前々月を要求し、実画面の選択月・総収益の`N/A`不在・ダウンロード名・全sheetの販売期間と列を照合する。日付だけで確定とは判定せず、未発行や形式変更なら停止する。現版/旧版ASINと著者を照合し、未写像のstats47書籍・重複・注文数と返品数の不整合を拒否する。通貨を合算せず、KU端数と返品の負額を保持する。Prime Readingボーナス・入金・税引後利益は対象外。未観測の書籍を0埋めせず、`sales-ledger`の週次純収益へ自動転記しない。
日本語の電子書籍/KENPの2sheetを実機契約とし、紙書籍・未知のボーナス等の新sheetは黙って捨てずschema errorにする。原本はprivate R2だけに残し、`restore.mjs kdp`は日次・月次を分離した正規化`status.json`だけを`.local/authenticated-measurement/restored/kdp.json`へ復元する。旧日次のみのcapabilityは月次取得の成功に流用しない。
過去月は`node .claude/scripts/measurement/restore.mjs kdp --month YYYY-MM`で正規化結果だけを`restored/kdp-monthly-YYYY-MM.json`へ復元する。月の一致と原本SHAを再検査し、循環slotが別月へ上書き済みなら停止する。履歴復元には最新試行の鮮度を要求しないが、現在の収集成功や認証有効性を証明するものではなく、最新結果を上書きしない。
A8・楽天はaffiliate週次、GSCはcoverage週次がprivate R2からallowlist化した入力だけを復元する。
初回成功後は最新試行の失敗・鮮度切れ (`MEASUREMENT_MAX_AGE_MS` = 8 日超) で復元を止め、古いgit入力へのfallbackはしない。
noteだけは`node .claude/scripts/measurement/restore.mjs note --inventory-only`で棚卸し専用の`restored/note-inventory.json`を復元できる。記事行の欠落以外に異常が無く、帰属・全ページ・合計・鮮度・カバー照合・集合・null保持・最新試行の証跡SHAが一致した場合だけ`inventoryAvailable:true`とする。全体は`report_incomplete`・`metricsAvailable:false`のまま、通常の復元先は更新せず、全件KPI・効果判定には使わない。復元結果の全行も`baselineEligible:false`に固定する。カバー監査に無い欠測記事もplaceholderで保持し、unknown/investigateにする。

```bash
# 週次の取得 (ログインの保ち直し → 取得 → develop への記録)。土曜の週次レビューの最初に回す。
npm run weekly:collect
# 切れた取得元に本人が入り直す (2FA を含め、開いたブラウザで最大 10 分待つ。KDP は Reports の認証まで待つ)
node .claude/scripts/measurement/refresh-session.mjs kdp --wait-human
# Googleは通常Chromeの専用profileで本人ログイン後、その専用Chromeを終了する。取得時に profile から取り出す。
node .claude/scripts/google-admin/cli.mjs login
# 入り直したあと、ログインの保ち直しと取得だけをやり直す
bash scripts/scheduled/measurement-session-refresh.sh
npm run measurement:status -- --check
npm run measurement:test
```

worktreeから既存profileを使う場合だけ、`bootstrap-session.mjs`に`--root /path/to/main-checkout`を指定する (`collect-local.mjs`は`--main-root`で渡す)。同じprofileの別processは閉じる。
profile からの取り出しはセッションの受け渡しであり、取得成功の証明ではない。取得でaccount assertと実レポートを確認する。
Googleの通常Chrome profileは一時コピーからexportし、Playwrightの`--password-store=basic` / `--use-mock-keychain`を除外してOSの暗号化方式を維持する。元profileをテスト用既定値で直接開かない。これは保存方式の互換性対策であり、認証拒否・CAPTCHAを回避するものではない。

### Playwright でも取得できないもの（提供側が封じた機能）

**Google Cloud Console は OAuth クライアントの Client Secret の表示を廃止した**（2026-07-31 実機確認）。画面には `****FOrt` のようなマスク表示しか出ず、Console 自身がこう明記している。

> クライアント シークレットの表示とダウンロードは利用できなくなりました。下記のシークレットを紛失した場合は、新しいシークレットを追加してください。

したがって **Secret を Playwright で読み取ることはできない**。セレクタの問題ではなく機能が存在しない。取得できるのは「シークレットを追加」した直後のダイアログだけで、そこを逃すと二度と見られない。

- Secret が要るときは **人が Console で追加し、その場でコピーする**。自動化の対象外とする。
- 自動化スクリプトが「追加」だけ実行して値を取れないと、**使えない Secret が増えるだけ**になる（同日に実際に発生させ、無効化して後始末した）。追加を自動化しない。
- 同種の「作成時にしか表示されない」認証情報（API キー、サービスアカウント鍵）も同じ扱いとする。

### Playwright MCP の位置づけ

MCP は AI エージェントを live なブラウザセッションへ接続する仕組みで、**CI/CD の無人自動化の手段ではない**。CI で回すのはコミット済みの決定的スクリプトとする（CLAUDE.md 原則 5「モデルは判断時のみ。決定的なものはコードで処理する」と同旨。無人 cron に LLM を載せない方針は `.claude/rules/affiliate-ads-standards.md` §10 の A8 cron と揃える）。

MCP が有用なのは**セレクタ確定の探索工程**である。実機を見てセレクタを確定し、その結果を決定的スクリプトへ落として CI へ載せる。

## Active profile

| `.local/` 配下                                        | サービス             | 主な利用箇所                                                            | 固定契約                                                |
| ----------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `playwright-x-profile/`                               | X                    | `.claude/skills/sns/publish-x/`、`.claude/skills/sns/update-x-profile/` | `--expect-account` で handle を照合。切れたら `refresh-session.mjs x` (キーチェーン `stats47-measurement-x`。土曜の週次の取得 `weekly:collect` の最初と、必要なときに) が Playwright 同梱 Chromium で 1 回だけ再ログインする。Chrome 本体で開かない (Cookie の暗号化方式が変わる)。state は CI へ渡さない |
| `playwright-ig-profile/`                              | Instagram            | `.claude/scripts/sns/delete-instagram-posts.ts`                         | headed login を保持                                     |
| `playwright-threads-profile/` | Threads | `.claude/skills/sns/publish-threads/` | ログインはオーナーが行う (自動ログインの経路は無い)。期限は日次の事前確認が `sessionid` で見る |
| `playwright-a8-profile/` + `playwright-a8-state.json` | A8.net               | `.claude/skills/ads/scout-asp/scripts/`、`.claude/scripts/ads/`         | storage state の再注入を併用                            |
| `playwright-moshimo-profile/`                         | もしもアフィリエイト | `.claude/scripts/ads/`                                                  | `config/affiliate-asp.json` の site ID を照合   |
| `playwright-afb-profile/`                             | afb                  | `.claude/scripts/ads/`                                                  | login から完了まで同一 headed process                   |
| `playwright-kdp-profile/`                             | Amazon KDP           | `.claude/scripts/kdp/`                                                  | `config/kdp-account.json` の account を照合     |
| `playwright-note-profile/`                            | note                 | `.claude/scripts/note/`                                                 | `config/note-account.json` の account を照合    |
| `playwright-google-admin-profile/`                    | Google Admin         | `.claude/scripts/google-admin/`                                         | GSC link / GA4 Library のAPI非提供操作だけに使う         |

archive skill だけが参照する profile は Active 一覧へ含めない。復活させる場合は script、profile、account assertion、cleanup を再監査してから追加する。

## サービス固有の認証

### A8.net

永続 context だけでは session が復元できない場合があるため、`.local/playwright-a8-state.json` を併用する。初回または期限切れ時は `.claude/skills/ads/scout-asp/scripts/login.mjs` を headed で実行する。

### もしも / afb

同じ ASP アカウント内に複数サイトが存在するため、ログイン成功だけでは安全条件を満たさない。

- もしも: 対象 site ID を config と照合する。
- afbの提携操作: storage state の別 process 復元や headless が拒否される場合がある。ログインから対象確認、操作完了まで同一 headed process で行う。成果取得は上記の公式API経路へ分離する。

### KDP

専用 config の account assertion が一致しない場合は停止する。KDP の税務情報、銀行口座、2FA は自動入力しない。

### Google Admin

profileはGSC coverageの読み取りと、承認付きGSC link作成・GA4 Library collection公開に使う。
GA4 Admin API、AdSense read API、CIの承認境界、設定変更のallowlistは
`.claude/scripts/google-admin/README.md`を正典とする。

## worktree と OS

`.local/` は git worktree へ複製されない。worktree 相対の profile path を使うと、新しい空 profile が作られ再ログインになる。

現在は二つの実装が混在している。

1. ASP 共通基盤は、既知の main checkout が実在すればそこを使い、無ければ script 位置から repository root を解決する。
2. X、Instagram、KDP の一部は main checkout の絶対 path を使用する。

このため browser 操作は原則として main checkout から実行する。別 OS または別 clone で動かす場合は、空 profile を正しい profile と誤認していないか、対象 script の `PROFILE_ROOT` / `PROFILE_DIR` を先に確認する。

profile path の実装を統一する変更は、全サービスを一括置換せず、account assertion とログイン復旧をサービス単位で検証する。

## agent が使ってよい範囲 (2026-11-14 オーナー決定)

「ログインが要る」ことを理由に作業を止めない。止める理由になるのは、サービス側の制約で人の操作が要るときだけである。

| 操作 | agent | 根拠 |
|---|---|---|
| 保存済みセッション (profile / storage state) での画面操作 | 実行してよい。先に `npm run measurement:status -- --preflight --json` で、そのサービスが `usable` かを確かめる | 値を読まずに済む |
| セッションが切れたときの再ログイン 1 回 | `refresh-session.mjs <src>` を実行してよい。キーチェーンを読むのはこのスクリプトで、agent は ID・パスワードの値を読まない・出力しない・入力しない | 自動ログインの承認範囲 (本文書「原則」) |
| 2 段階認証・CAPTCHA・追加確認・失敗印 `.autologin-failed` | 止めて、`refresh-session.mjs <src> --wait-human` をオーナーへ渡す。迂回しない | 人の確認が要る |
| 税務・銀行・規約同意・資格情報の登録 | 行わない (オーナーの作業) | 本文書「禁止事項」 |

- セッションが使えても、公開・送信・申請・出品などの外へ出る操作は、従来どおりオーナーの承認が要る (`todo-standards.md` §7)。
  カードには `[待ち:承認]` を付け、`[待ち:ログイン]` は上の表の下 2 行に当たるときだけ付ける。
- 計測値を読むための管理画面は、従来どおり土曜の記録から読む (`recorded-measurement-first.md`。hook が止める)。
- 期限の事前確認は launchd の日次 (`scripts/scheduled/com.stats47.session-preflight.plist`) が行い、期限が近い・切れている・
  失敗印ありを通知する。状態は管理画面 `/ops/auth` の「保存済みセッション」に出る。cookie の期限は上限で、提供元が先に切ることはある。

## ログイン復旧

1. 対象 script と profile path を確認する。
2. 同じ profile を使う別 process と browser を閉じる。
3. サービス固有の login command または対象 script の headed mode で開く。
4. 人が login、2FA、CAPTCHA を完了する。
5. account / site assertion を実行する。
6. dry-run または read-only mode で session を確認する。
7. context を正常終了し、profile lock を残さない。

profile が壊れたと判断しても、既存 directory を即時削除しない。path の取り違え、別 process の lock、Cookie 期限切れを先に確認し、必要なら退避してから再作成する。

## 禁止事項

- profile、storage state、Cookie、screenshot 内の個人情報を commit する。
- profile をサービス間または別用途アカウント間で共有する。
- login 成功だけで対象サイト・seller・handle の照合を省く。
- CAPTCHA 回避、2FA secret の埋め込み、規約同意の自動化。
- headless 拒否を検知した後も retry loop を続ける。
- 実際の login 状態、メールアドレス、handle を git 文書の TODO として残す。

## Security incident

profile の漏洩は account takeover 相当として扱う。

1. 対象サービスの session を revoke する。
2. password / token を必要に応じて rotate する。
3. repository history と artifact への混入を確認する。
4. 原因が path、log、screenshot、artifact のどこかを特定する。
5. 再発防止を `.claude/todo/improvements.md` または `bug` Issue へ記録する。
