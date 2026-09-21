---
title: Playwright認証プロファイル
type: technical-design
status: adopted
updated: 2026-09-21
---

# Playwright認証プロファイル

Playwright を使う運用スクリプトのログイン状態、アカウント照合、復旧方法を定義する。実際にログインできるか、Cookie が有効か等の変動状態は本書へ記録しない。

## 原則

- profile と storage state は `.local/` 配下に置き、git へ commit しない。
- サービスとアカウント用途ごとに profile を分離する。
- 投稿、申請、公開、購入に関わる操作は実行前に対象アカウントを照合する。
- 認証失敗を自動再登録や別アカウントで回避しない。人が headed browser で復旧する。
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
| afb 成果データ取得 | [公式の成果情報API](https://www.afi-b.com/guide/api-linkage/)と[仕様書](https://drive.google.com/file/d/1-k9l9QA16sNhSzxtX7LK1A2szQx25OY7/view)（2023-12-25版、2026-09-21確認） | `AFB_API_KEY` Secretで公式APIを使う。成果取得ではCookieを移送しない。提携操作は別のローカル経路 |
| ココナラ / もしも | **未確認**（推測で「無い」と書かない） | 現状 Playwright |

### CI 実行について

**Playwright 自体は CI で動く。** `pr-quality-check.yml` と `post-deploy-smoke.yml` が `ubuntu-latest`（GitHub ホストランナー）で実行している。ただし認証済みセッションを登録しても、別環境への移送可否・Reports等の追加認証・取得内容の完全性はサービス別に検証が必要。ログイン成功だけでCI収集可能とは判定しない。

- **セルフホストランナーは本 repo では使えない。** stats47 は PUBLIC で、GitHub 公式が「セルフホストランナーは private repository のみ推奨。public repository の fork が危険なコードをランナー上で実行しうる」と警告している。
- 認証済みセッションはサービス別にdomain allowlistで絞り、圧縮storageStateを`MEASUREMENT_SESSION_<SOURCE>` Secretsへ登録する。Cookieはread-only権限ではなくアカウント操作権限を持ちうるため、実行対象を固定済みの読み取りcollectorに限定する。public repositoryのgit・artifact・ログへstateを出さない。
- セッションは期限切れするため、この経路でも初回作成と期限切れ時の再作成は人の操作として残る。

`authenticated-measurement.yml`が毎日JST18:20にGitHub hosted Ubuntu + Playwright Chromium + Xvfbで実行する。
`main`/`develop`だけを許可し、PR/forkではSecrets付きcollectorを起動しない。投稿・申請・出版・振込・設定変更は対象外。
初回のdevelop workflow変更pushでも起動するが、schedule有効化にはmainへの反映が必要。

| 対象 | 固定の読み取り範囲 | 完了と混同しないもの |
|---|---|---|
| もしも | site ID照合後の期間別成果 | 帰属不明・確定待ちを確定収益にしない |
| A8 | 口座照合、サイト別月次CSV、reject検査 | 複数サイト共用口座の全体値をstats47にしない。個別案件EPCは別契約 |
| afb | 公式APIでstats47の直近28日成果を発生日/確定日別に取得。要求site IDと全行のsite IDを照合 | 両系列は重なるため足さない。承認/未承認/却下を分離し、報酬を純収益・入金にしない。提携状態はCIの取得対象外 |
| note | 帰属・期間・全ページ・合計・公開カタログ・カバーの照合 | 欠落記事はnull。不完全データを全件成功にしない |
| GSC | property照合、概要と5分類の詳細CSV。ZIP内カテゴリ・件数・URLのサイト帰属をingestで照合 | APIの検索パフォーマンスとは別経路。概要CSVの成功を詳細CSV成功にしない。UI exportの上限は各分類1,000行 |
| KDP | known ASINで口座照合、登録書籍の出版状態、昨日の注文/KENP/電子書籍ロイヤリティ見積り、月別の電子書籍/KENPロイヤリティ | Reportsは別認証。現版/旧版ASINと著者名を照合し共用口座の他サイト書籍を除外。月次ロイヤリティを入金・税引後利益・週次純収益にしない |
| ココナラ | seller照合、全体と公開商品別の対象期間/閲覧/販売件数/お気に入り、全体販売額、期間と行合計照合 | 有料表示数・商品別販売額・問い合わせ数はnull/未取得。ローリング30日を確定7日や手数料控除後収益にしない |

保存先はprivate bucket `stats47-private` の `operations/authenticated-measurement/<source>/`。
`MEASUREMENT_VAULT_KEY`によるAES-256-GCMでobject addressごとに認証し、PUT後GETの一致を検証する。
`session.enc`（更新済み認証）、`latest-attempt.enc`、`latest-success.enc`と、UTC日付の剰余による
`runs/day-0..29.enc`（30日分の循環slot）を保持する。KDPの月次だけは`kdp/monthly/month-0..23.enc`に原本XLSX・正規化結果・SHAを24報告月の循環slotとして別保管する（税務帳簿の保存契約ではない）。無制限に履歴を増やさず、公開custom domainへ置かない。
vault keyはR2 credentialsとは別Secret。初回端末の`.local/authenticated-measurement/vault-key`を保持し、
紛失時に無断でrotateしない。認証・生データの漏洩時は本書のSecurity incidentに従う。

gitに残すのは`.claude/state/metrics/authenticated/latest.json`の対象別成否・時刻・固定理由・証跡hashだけ。
失敗は固定`authenticated-measurement-alert`へupsertし全対象復旧でcloseする。別系統の`workflow-health-daily.yml`
も48時間の鮮度を確認する。週次summary/reviewもこの状態を読み、古い成功や未取得を実測0にしない。
収集範囲（capability）・対象source・実行ID・観測時刻が一致しないstatusは成功にしない。
再実行は同名artifactが残り、download側の同名除去が古い結果を選ぶことがある。対処はartifact名`authenticated-status-<source>-<runAttempt>`と中のファイル名`<source>-<runAttempt>.json`の両方を分離し、集約で最大attemptを選ぶこと。ファイル名だけの変更では未解決。最新attemptが失敗・不正なら古い成功に戻さず、収集jobの失敗中は警告をcloseしない（2026-09-21 CI `35560007703` attempts 3/4のdownloadログとgit記録の不一致で確認、回帰テスト追加）。
afbは`site-conversion-outcomes`だけを受理し、旧`partnership-status`成功では成果取得を充足しない。
公式APIは本日から30日以内の参照に限られるため、前日までの28日を毎日2回（発生日/確定日）取得する。
partner IDは`affiliate-asp.json`の`asps.afb.api`、site IDは同設定の既存`sites.stats47`を使う。
全行の帰属・成果ID重複・基準日・承認状態・報酬数値・レスポンス形式を検証し、APIエラーを空配列にしない。
HTTP成功時のJSON本文は配列として扱う。2026-09-21の実応答は`[]`で、仕様表の`response`を外側のJSONキーとは扱わない。エラーobject・不明な形式は停止する。非ゼロ明細の形式は公式仕様に基づくfixtureで検証し、実データが出た時も同じgateを通す。
`restore.mjs afb`は正規化成果だけを`.local/authenticated-measurement/restored/afb.json`へ復元する。
APIキーはオーナー承認を得てGitHub Actions Secret `AFB_API_KEY`へ登録し、git・ログ・artifact・vaultへ書かない。
認証エラーはキーと公式設定を照合する。Cookie再ログインへのfallbackや無断再発行はしない。
復元側もcapabilityを照合する。人間ログイン時刻を`bootstrapCapturedAt`として保持し、古いログイン由来のCI更新が新しいSecretを上書き選択しない。世代情報のない旧sessionはSecretより優先しない。
KDPはknown ASINで本棚の口座を照合後、全書籍の状態巡回より先にReports認証を確認する。巡回後の日次・月次Reports取得と検査まで成功して初めて認証更新を保存する。本棚だけ成功した試行でReports未認証のsessionを保存しない。本人ログインの`--reports`もEnterだけではexportせず、Reportsの表示を確認する。
KDPの昨日値は速報値で、注文等はマーケットプレイス現地日付、KENPはUTC。正規化は各recordの`dateBasis`に保持する（[公式Dashboard](https://kdp.amazon.com/en_US/help/topic/GX7EGDFGS9CZCA2F)、2026-09-21確認）。遅延や再集計がありうるため、日次値の単純合算で確定週次売上を作らない。確定収益の元資料は毎月15日前後に作成される[月別のロイヤリティ](https://kdp.amazon.co.jp/ja_JP/help/topic/G200641190)。ASIN・通貨別の月次収益であり、共有口座の支払い総額や週次純収益にそのまま転記しない。
月次collectorはJST15日以降は前月、14日までは前々月を要求し、実画面の選択月・総収益の`N/A`不在・ダウンロード名・全sheetの販売期間と列を照合する。日付だけで確定とは判定せず、未発行や形式変更なら停止する。現版/旧版ASINと著者を照合し、未写像のstats47書籍・重複・注文数と返品数の不整合を拒否する。通貨を合算せず、KU端数と返品の負額を保持する。Prime Readingボーナス・入金・税引後利益は対象外。未観測の書籍を0埋めせず、`sales-ledger`の週次純収益へ自動転記しない。
日本語の電子書籍/KENPの2sheetを実機契約とし、紙書籍・未知のボーナス等の新sheetは黙って捨てずschema errorにする。原本はprivate R2だけに残し、`restore.mjs kdp`は日次・月次を分離した正規化`status.json`だけを`.local/authenticated-measurement/restored/kdp.json`へ復元する。旧日次のみのcapabilityは月次取得の成功に流用しない。
過去月は`node .claude/scripts/measurement/restore.mjs kdp --month YYYY-MM`で正規化結果だけを`restored/kdp-monthly-YYYY-MM.json`へ復元する。月の一致と原本SHAを再検査し、循環slotが別月へ上書き済みなら停止する。履歴復元には最新試行の48時間鮮度を要求しないが、現在の収集成功や認証有効性を証明するものではなく、最新結果を上書きしない。
もしも/A8はaffiliate週次、GSCはcoverage週次がprivate R2からallowlist化した入力だけを復元する。
初回成功後は最新試行の失敗・48時間超で復元を止め、古いgit入力へのfallbackはしない。

```bash
# ログイン済み専用profile/stateをSecretsへ送る（gh authが必要）。値はstdinで送り表示しない。
npm run measurement:bootstrap -- note --publish
# 初回/期限切れは専用ブラウザを開き、人がログイン・2FAを完了する。
npm run measurement:bootstrap -- moshimo --login --publish
# KDP本棚とは別のReports認証（本棚へのログインも必要）
npm run measurement:bootstrap -- kdp --login --reports --publish
# Googleは通常Chromeの専用profileで本人ログイン後、その専用Chromeを終了してexportする。
node .claude/scripts/google-admin/cli.mjs login
npm run measurement:bootstrap -- gsc --from-profile --publish
# 保存stateではなくprofileを使う場合
npm run measurement:bootstrap -- moshimo --from-profile --publish
npm run measurement:status -- --check
npm run measurement:test
```

worktreeから既存profileを更新する場合だけ`--root /path/to/main-checkout`を指定する。同じprofileの別processは閉じる。
bootstrapはセッション移送であり、取得成功の証明ではない。次のCIでaccount assertと実レポートを確認する。
Googleの通常Chrome profileは一時コピーからexportし、Playwrightの`--password-store=basic` / `--use-mock-keychain`を除外してOSの暗号化方式を維持する。元profileをテスト用既定値で直接開かない。これは保存方式の互換性対策であり、認証拒否・CAPTCHAを回避するものではない。
Cloudflare Browser Runへ置き換えてもログイン・2FA・Cookieの期限は解消しないため、まず既存CLIを再利用する。

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
| `playwright-x-profile/`                               | X                    | `.claude/skills/sns/publish-x/`、`.claude/skills/sns/update-x-profile/` | `--expect-account` で handle を照合                     |
| `playwright-ig-profile/`                              | Instagram            | `.claude/scripts/sns/delete-instagram-posts.ts`                         | headed login を保持                                     |
| `playwright-a8-profile/` + `playwright-a8-state.json` | A8.net               | `.claude/skills/ads/scout-asp/scripts/`、`.claude/scripts/ads/`         | storage state の再注入を併用                            |
| `playwright-moshimo-profile/`                         | もしもアフィリエイト | `.claude/scripts/ads/`                                                  | `.claude/config/affiliate-asp.json` の site ID を照合   |
| `playwright-afb-profile/`                             | afb                  | `.claude/scripts/ads/`                                                  | login から完了まで同一 headed process                   |
| `playwright-coconala-profile/`                        | ココナラ             | `.claude/scripts/coconala/`                                             | `.claude/config/coconala-account.json` の seller を照合 |
| `playwright-kdp-profile/`                             | Amazon KDP           | `.claude/scripts/kdp/`                                                  | `.claude/config/kdp-account.json` の account を照合     |
| `playwright-note-profile/`                            | note                 | `.claude/scripts/note/`                                                 | `.claude/config/note-account.json` の account を照合    |
| `playwright-google-admin-profile/`                    | Google Admin         | `.claude/scripts/google-admin/`                                         | GSC link / GA4 Library のAPI非提供操作だけに使う         |

archive skill だけが参照する profile は Active 一覧へ含めない。復活させる場合は script、profile、account assertion、cleanup を再監査してから追加する。

## サービス固有の認証

### A8.net

永続 context だけでは session が復元できない場合があるため、`.local/playwright-a8-state.json` を併用する。初回または期限切れ時は `.claude/skills/ads/scout-asp/scripts/login.mjs` を headed で実行する。

### もしも / afb

同じ ASP アカウント内に複数サイトが存在するため、ログイン成功だけでは安全条件を満たさない。

- もしも: 対象 site ID を config と照合する。
- afbの提携操作: storage state の別 process 復元や headless が拒否される場合がある。ログインから対象確認、操作完了まで同一 headed process で行う。成果取得は上記の公式API経路へ分離する。

### ココナラ / KDP

専用 config の account assertion が一致しない場合は停止する。KDP の税務情報、銀行口座、2FA は自動入力しない。

### Google Admin

profileはGSC coverageの読み取りと、承認付きGSC link作成・GA4 Library collection公開に使う。
GA4 Admin API、AdSense read API、CIの承認境界、設定変更のallowlistは
`.claude/scripts/google-admin/README.md`を正典とする。

## worktree と OS

`.local/` は git worktree へ複製されない。worktree 相対の profile path を使うと、新しい空 profile が作られ再ログインになる。

現在は二つの実装が混在している。

1. ASP 共通基盤は、既知の main checkout が実在すればそこを使い、無ければ script 位置から repository root を解決する。
2. X、Instagram、ココナラ、KDP の一部は main checkout の絶対 path を使用する。

このため browser 操作は原則として main checkout から実行する。別 OS または別 clone で動かす場合は、空 profile を正しい profile と誤認していないか、対象 script の `PROFILE_ROOT` / `PROFILE_DIR` を先に確認する。

profile path の実装を統一する変更は、全サービスを一括置換せず、account assertion とログイン復旧をサービス単位で検証する。

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
