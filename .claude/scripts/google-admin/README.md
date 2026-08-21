# Google 管理自動化 runbook

GA4、Google Search Console（GSC）、AdSense の監査・設定変更について、
API、GitHub Actions、ローカル Playwright、人間操作の境界を定義する。
実装進捗は `.claude/todo/backlog.md` の
`GOOGLE-ADMIN-AUTOMATION-01`、認証ブラウザの一般規則は
`docs/01_技術設計/07_Playwright認証プロファイル.md` を参照する。

## 結論

- 取得、監査、GA4 カスタムディメンション作成は直接 API を使う。
- API-only の read-only 監査は GitHub Actions の schedule へ置ける。
- 外部設定を変更する API は `workflow_dispatch`、計画トークン、
  protected GitHub Environment の人間承認をすべて要求する。
- GSC リンク作成と GA4 Library collection 公開は公式 API がないため、
  ローカル headed Playwright に残す。
- AdSense `adunits.create` / `patch` はメソッド自体は存在するが、
  AdSense for Platforms 系の制限プロジェクト向けであり、現状は `DISPLAY` のみである。
  stats47 で利用可能という証拠がないため、自動化対象にしない。
- MCP はセレクタ探索には使えるが、CI/CD の実行基盤にはしない。

## 操作別の正典と実行場所

| 対象 | 現在 | 採択する実行場所 | 備考 |
|---|---|---|---|
| GSC 週次 snapshot | API + Actions | 現状維持 | `fetch-metrics-weekly.yml` |
| GSC URL Inspection | API + Actions | 現状維持 | `gsc-url-inspection-daily.yml` |
| GSC property 存在・権限監査 | API | API-only CIへ統合 | `audit-gsc.mjs`を再利用 |
| GA4 週次 snapshot | Data API + Actions | 現状維持 | `fetch-metrics-weekly.yml` |
| affiliate GA4 集計 | Data API + Actions | 現状維持 | `affiliate-ga4-weekly.yml` |
| GA4 property / stream 監査 | Playwright | Admin APIへ移行 | property IDとstats47.jpを照合 |
| GA4 custom dimensions 監査 | Playwright | Admin APIへ移行 | 台帳との突合は既存pure関数を再利用 |
| GA4 custom dimension 作成 | Playwright | Admin API + 承認付き手動Workflow | `analytics.edit`、1 run 1件 |
| GA4 AdSense link 監査 | Playwright | Admin APIへ移行 | 作成は現在必要性がないためallowlist外 |
| GA4 Search Console link 作成 | Playwright | ローカルPlaywright維持 | 公式APIなし |
| GA4 Library collection 公開 | Playwright | ローカルPlaywright維持 | 公式APIなし |
| AdSense 週次snapshot | API + Actions | 認証復旧後に現状維持 | read-only |
| AdSense account / unit inventory | API | API-only CIへ統合 | `list` / `getAdcode` |
| AdSense unit作成・改名 | dispatch未実装 | 人間の管理画面操作 | create/patchは制限プロジェクトのみ |
| AdSense Auto ads等 | 対象外 | 人間のみ | 常にdenylist |
| Google Cloud OAuth client / Secret | 人間 | 人間のみ | Secretは作成直後だけコピー |

公式仕様:

- AdSense unit create:
  https://developers.google.com/adsense/management/reference/rest/v2/accounts.adclients.adunits/create
- AdSense unit patch:
  https://developers.google.com/adsense/management/reference/rest/v2/accounts.adclients.adunits/patch
- GA4 custom dimension create:
  https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.customDimensions/create
- GA4 AdSense link:
  https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.adSenseLinks

API の有無はメソッド名だけで判定しない。利用主体、product code、format、
OAuth scope、必要ロールまで公式リファレンスとローカル `googleapis` 型定義の両方で確認する。

## SSOT

| 責務 | 正典 |
|---|---|
| 本runbook、実行境界、移行手順 | 本README |
| active status / 次 / 完了条件 | `.claude/todo/backlog.md` |
| allowlist / denylist / plan token / dimension plan | `apply-allowlisted-settings.mjs` |
| GA4 API inventory / custom dimension apply | `audit-ga4-api.mjs` |
| GSC inventory | `audit-gsc.mjs` |
| GA4 UI residual (GSC link / Library のみ) | `audit-ga4.mjs` |
| AdSense API inventory / account assert | `audit-adsense.mjs` |

> **ad client を 1 つ落としても inventory 全体を捨てない (2026-08-21)**: この口座は content 用
> `ca-pub-*` に加えて AdSense for Search の `partner-pub-*` を持ち、後者は広告ユニットの概念が
> 無く `adunits.list` が NOT_FOUND を返す。per-client の try/catch が無かったため、
> **週次 audit は毎回「AdSense ad units: 0 件 (error)」だった** (同じ資格情報で
> `fetch-adsense-snapshot.mjs` は成功しており、原因は credential ではなく walk の実装だった)。
> `collectAdUnits` が失敗した client を `skippedClients` に残し、**全滅のときだけ throw** する。
> CLI は skip を `! ad client を読めなかった: …` として出すので、一部欠けが status=ok のまま
> 緑に見えることはない。
| custom dimension台帳との突合 | `dimension-ledger.mjs` |
| custom dimension登録状況 | `.claude/rules/analytics-event-standards.md` |
| code slot定義 | `apps/web/src/lib/google-adsense/constants.ts` |
| AdSense report契約 | `.claude/scripts/metrics/lib/adsense-report-contract.mjs` |
| secret / env名 | `.claude/config/env-registry.json` |
| 自動処理の索引 | `docs/01_技術設計/06_自動化インベントリ.md` |
| 生成された監査state | `.claude/state/metrics/google-admin/` |

status、期日、実測件数を本READMEへ複製しない。

## 認証の分離

### 既存read-only経路

| 環境変数 | 用途 | 置き場所 |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | GSC / GA4 Data API / GA4 Admin read | GitHub repository secret |
| `GA4_PROPERTY_ID` | 対象propertyの固定 | GitHub repository variable |
| `GOOGLE_ADSENSE_CLIENT_ID` | AdSense OAuth client識別子 | GitHub repository variable |
| `GOOGLE_ADSENSE_CLIENT_SECRET` | AdSense OAuth secret | GitHub repository secret |
| `GOOGLE_ADSENSE_REFRESH_TOKEN` | `adsense.readonly` | GitHub repository secret |
| `GOOGLE_ADSENSE_ACCOUNT_ID` | account assert | GitHub repository variable |

AdSense の週次取得に書き込みscopeを与えない。`.claude/scripts/adsense/oauth-setup.js` は
旧前提で `https://www.googleapis.com/auth/adsense` を要求していたが、Phase 0 で既定を
`adsense.readonly` へ戻した（実装済）。認証復旧はこの read-only scope で行う。

### 新設するmutation経路

`google-admin-production` GitHub Environment を作り、required reviewerを設定する。
GA4の設定変更専用サービスアカウント鍵を
`GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON`としてEnvironment secretへ置く。

- 対象GA4 propertyだけに必要ロールを付与する。
- GSC、AdSense、Google Cloud IAMの不要な権限を付与しない。
- repository secretのread用サービスアカウントを安易にEditorへ昇格しない。
- workflowのapply jobだけがEnvironment secretを参照する。
- サービスアカウントの作成、鍵発行、GA4 role付与は人間工程とする。

`GOOGLE_OAUTH_CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` はactiveコードからの
参照が見つからないcleanup候補である。実装セッションでは削除せず、GitHub Secretsと
Google Cloud Consoleの用途をオーナーへ報告する。外部secretやOAuth clientの削除には
別途明示承認が必要である。

`NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID`はWeb配信用の公開publisher IDであり、
管理API用OAuth credentialとは別物なので統合しない。

## 不変の安全契約

### identity

mutation前に次をすべてAPIで確認する。

1. `properties/{GA4_PROPERTY_ID}`が1件取得できる。
2. web data streamのdefault URIのhostが`stats47.jp`。
3. GSCに`sc-domain:stats47.jp`が存在する。
4. AdSenseは`accounts.list`がちょうど1件で
   `GOOGLE_ADSENSE_ACCOUNT_ID`と完全一致する。
5. live inventoryから再計算したplan tokenが承認値と一致する。

未取得、複数、別account、権限不足、API version driftはすべてfail closedとする。

### allowlist

移行後の自動mutation allowlistは当面、次の1操作だけとする。

| action | 条件 |
|---|---|
| `create-ga4-custom-dimension` | 台帳が`⏳要登録`、authored定義あり、同じparameterなし、EVENT scope、空き枠あり |

display name、parameter、scopeを台帳の文章から推測しない。
コード側に明示したauthored定義だけをplan対象にする。
1 runにつき1件だけ計画・作成する。

ローカルPlaywrightのallowlistは次の2操作だけ残す。

| action | 条件 |
|---|---|
| `create-search-console-link` | link 0件、exact GSC property、正しいstream、権限あり |
| `publish-search-console-collection` | 正しいlinkあり、collection未公開 |

### denylist

- Google account / GA4 / GSC / AdSenseのuser、owner、permission
- property、stream、accountの作成・削除
- custom dimensionの削除、archive、rename、scope変更
- GA4 AdSense linkの作成・削除（現段階）
- timezone、currency、retention、filter、Google Signals、consent
- GSC property変更、association削除、sitemap変更、Indexing API publish
- AdSense unitのAPI create / patch、削除、archive、停止、format変更
- AdSense Auto ads、exclusion、blocking control
- Google Cloud IAM、OAuth client、Client Secret
- GitHub Secrets / Environments
- production deploy、R2 write

## Claude Code実装手順

外部設定を変更せず、Phase 0から順に1つの差分として実装する。

### Phase 0: 誤った前提と命名を是正する

1. `audit-adsense.mjs`とREADME類の「AdSense v2に書き込みAPIが無い」を、
   「メソッドはあるが制限プロジェクト向けでstats47利用可の証拠がない」に直す。
2. `ALLOWED_ACTIONS`から`create-ad-unit` / `rename-ad-unit`を外し、
   inventory差分はmutation actionではなく人間向けrecommendationとして返す。
3. `cli.mjs`のAdSense `not-implemented` dispatchと、
   AdSenseフォーム実装を前提にしたメッセージを削除する。
4. `probe-adsense.mjs`のconsumerがなくなったことを`rg`で確認して削除する。
5. `oauth-setup.js`をread-only復旧用へ戻す。
   full scopeを要求するモードは、制限API利用権限の証拠がない限り追加しない。
6. `auditAdSenseApiEnabled()`はGA4/GSC用サービスアカウントのprojectを見ており、
   AdSense OAuth clientのproject有効化判定になっていない。AdSense preflightから外し、
   OAuth clientでの`accounts.list`成功を決定的gateにする。
7. `fetch-adsense-data/SKILL.md`の一時スクリプトと`.env.local`正典記述を削り、
   既存`oauth-setup.js`とGitHub Secretsを参照する。
8. `ga4-analyst.md`、`analytics-event-standards.md`、
   `07_Playwright認証プロファイル.md`のAPI/UI境界を本書へ揃える。

完了条件:

- AdSense write actionへ到達するコードパスが0件。
- read-only inventoryとmapping recommendationは残る。
- allowlist集合とdenylist回帰テストが更新される。

### Phase 1: GA4 Admin API read-only inventory

新規モジュール名は`audit-ga4-api.mjs`を既定とする。既存
`audit-ga4.mjs`はUI residual専用であることが分かる名前またはコメントへ直す。

実装するread操作:

1. `analyticsadmin({version: "v1beta"})`
   `properties.get({name: properties/<id>})`
2. `properties.dataStreams.list`を全page取得し、web streamのdefault URIを照合
3. `properties.customDimensions.list`を全page取得
4. `analyticsadmin({version: "v1alpha"})`
   `properties.adSenseLinks.list`を全page取得
5. 既存`auditGscProperty()`を呼ぶ
6. 既存`auditAdSenseAccount()` / `auditAdUnits()`を呼ぶ
7. `parseDimensionLedger()` / `reconcileDimensions()`で台帳とlive定義を突合

実装規則:

- read用は`GOOGLE_SERVICE_ACCOUNT_KEY_JSON`と
  `analytics.readonly`を使う。
- CIでは`GA4_PROPERTY_ID`未設定時のhard-coded fallbackを許可しない。
- responseのemail、token、OAuth client情報はstateへ書かない。
- API errorは200文字程度へsanitizeし、statusを`error`として返す。
- 一部API失敗を`ok`へ読み替えない。
- stateは`.claude/state/metrics/google-admin/api-latest.json`へ保存できるが、
  scheduleからrepoへ自動commitしない。Workflow artifactとStep Summaryを一次出力にする。

CLI / package scripts:

```text
google-admin:audit-api  # 完全read-only、browserを起動しない
google-admin:audit-ui   # GSC link / Library residualのread-only監査
```

既存`google-admin:audit`は移行期間だけ`audit-ui`のaliasとして残し、
consumerを更新した後に曖昧なaliasを削除する。

テスト:

- pagination
- property ID / stream host一致と不一致
- custom dimension exact duplicate
- scope不一致
- partial API failure
- redaction
- 台帳reconcile

### Phase 2: GA4 custom dimensionのAPI plan / apply

`create-ga4-custom-dimension`を次の二段階に分ける。

#### plan

1. read用credentialでPhase 1 inventoryを再取得する。
2. 台帳の`⏳要登録`だけを候補にする。
3. authored定義がないparameterはblockerにする。
4. 同じ`parameterName`があればno-opにする。
5. 同名のscopeがEVENT以外ならblockerにする。
6. event-scoped上限までの空きを確認する。
7. 候補を安定順で並べ、先頭1件だけをplanにする。
8. site、property ID、action、request bodyから
   `plannedActionToken()`を決定的に生成する。
9. sanitized planとtokenをStep Summary / artifactへ出す。

authored定義の最低schema:

```js
{
  action: "create-ga4-custom-dimension",
  displayName: "Human-readable name",
  parameterName: "exact_parameter_name",
  scope: "EVENT",
  description: "stats47: <event用途>"
}
```

#### apply

1. `--confirm-site stats47.jp`
2. `--commit`
3. `--approve <plan-token>`
4. protected Environmentの承認

の4条件をすべて要求する。`--force`は追加しない。

apply jobはadmin credentialでlive inventoryを取り直し、plan tokenを再計算する。
一致した場合だけ次を1回呼ぶ。

```js
analyticsadmin.properties.customDimensions.create({
  parent: `properties/${propertyId}`,
  requestBody: {
    displayName,
    parameterName,
    scope: "EVENT",
    description,
  },
});
```

呼び出し後は`customDimensions.list`を再取得し、
`parameterName`、scope、resource nameを確認する。
verify不能なら`mutation-unknown`として停止し、再試行しない。

custom dimensionは誤作成しても自動削除できないため、実装セッションでは
apply Workflowを実行しない。実行はオーナーの別明示承認後とする。

### Phase 3: GitHub Actionsへ接続する

`.github/workflows/google-admin-settings.yml`を追加する。

trigger:

- 週1回の`schedule`: `audit`だけ
- `workflow_dispatch`: `audit` / `plan` / `apply`

inputs:

| name | 内容 |
|---|---|
| `mode` | `audit` / `plan` / `apply` |
| `confirm_site` | apply時に`stats47.jp`必須 |
| `approval_token` | apply時に前回planのtoken必須 |

workflow契約:

- `permissions: contents: read`
- GitHub-hosted `ubuntu-latest`
- Nodeはrepo既存versionへ合わせ、Actionsはcommit SHA pin
- `concurrency.group: google-admin-settings`
- `cancel-in-progress: false`
- PR triggerなし
- scheduleではmutation jobを構造的に作らない
- audit / planはrepository read secretsだけを使う
- apply jobだけ`environment: google-admin-production`
- apply jobだけ`GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON`を読む
- screenshot、storageState、Cookieをartifactへ含めない
- artifactはsanitized JSONだけ
- repo、R2、GitHub Secretsへ書かない

二段実行:

1. `mode=plan`を実行し、planとtokenを確認する。
2. `mode=apply`へ同じtokenを入力する。
3. Environment reviewerが承認する。
4. applyがlive planを再計算し、一致時だけ1件変更する。

workflow追加時は
`docs/01_技術設計/06_自動化インベントリ.md`と
`.github/workflows/README.md`を同じ差分で更新する。

### Phase 4: ローカルPlaywrightをresidual専用にする

ローカルheaded runnerに残すのは次だけである。

- `create-search-console-link`
- `publish-search-console-collection`
- 上記2操作のread-only UI audit

専用profile、lock、MFA/CAPTCHAを人が処理する契約、`/tmp` screenshot、
finally cleanupは維持する。CI、MCP、storageState Secretへ接続しない。

AdSense unit作成・改名は管理画面で人が行い、その後API inventoryと
`check-adsense-unit-mapping.mjs --strict`で検証する。

### Phase 5: 認証・文書ドリフトを整理する

1. `.claude/config/env-registry.json`へ
   `GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON`をsecretとして追加する。
2. active参照がない`GOOGLE_OAUTH_*`はcleanup候補として最終報告する。
   外部secretは削除しない。
3. `analytics-event-standards.md`の登録方法をAPI-firstへ更新する。
4. `ga4-analyst.md`の担当外記述をAPI/UI residualへ更新する。
5. 本README、Playwright認証設計、機能バックログ間の重複を作らない。
6. workflow追加後だけ自動化インベントリを更新する。
7. 文書変更後に`npm run docs:fix`と`npm run docs:check`を実行する。

## 人間が行う工程

Claude Codeのローカル実装と分離し、次を自動実行しない。

1. AdSense OAuth clientの正しいGoogle Cloud projectを選ぶ。
2. read-only scopeでrefresh tokenを再発行し、
   repository variable `GOOGLE_ADSENSE_CLIENT_ID` と repository secrets
   `GOOGLE_ADSENSE_CLIENT_SECRET` / `GOOGLE_ADSENSE_REFRESH_TOKEN`を同時に更新する。
3. 完了済みISO週を指定して`fetch-metrics-weekly.yml`を手動実行し、
   AdSense各jobが0行errorでないことをログとmanifestで確認する。
4. `google-admin-production` Environmentとrequired reviewerを作る。
5. GA4専用サービスアカウントを作り、対象propertyだけに必要ロールを付与する。
6. Environment secretへ鍵を登録する。
7. 初回`mode=apply`を承認する。
8. 不要なGitHub Secrets / OAuth clientsを削除するか判断する。

Claude Codeは人間工程が未完了でも、コード・pure test・workflow構造・文書まで実装し、
未実施をblockerとして報告する。外部stateを推測で完了扱いしない。

## 検証

### 実装中

```bash
npm run google-admin:test
npm run metrics:test
npm run docs:fix
npm run docs:check
```

workflow YAMLはPRの既存static gateも通す。exit codeはpipe越しで判定しない。

### read-only live検証

```bash
npm run google-admin:audit-api
```

確認すること:

- GA4 property assertがok
- stats47.jp web streamがexact一致
- GSC propertyがpresent
- custom dimensionsがAPIから取得できる
- 台帳reconcileがregistered / absentを区別する
- AdSense credential不良がgreenに隠れない
- secret、email、tokenがconsole / state / artifactに出ない

### 外部mutation検証

実装セッションでは実行しない。オーナー承認後にplan、applyの順で1件だけ実行し、
API再取得と24–48時間後のGA4 Data API内訳で確認する。

## 停止条件

次のいずれかでmutationを実行せず終了する。

- property / stream / GSC / AdSense accountの不一致
- live inventoryの取得失敗
- plan token不一致
- custom dimensionの同parameter・scope不一致
- authored定義なし
- quota上限または空き不明
- admin credentialまたはEnvironment未設定
- API version / method /権限制約が公式資料と一致しない
- mutation後のverify不能
- external secret、Cloud role、Environment変更が必要

## ロールバック

- コードとworkflowは通常のgit revertで戻す。
- scheduleはread-onlyなので外部stateのロールバックを持たない。
- custom dimensionは自動削除・archiveしない。誤作成時は追加mutationを止め、
  resource nameとsanitized結果を報告して人間が判断する。
- Playwright profile、Cookie、GitHub Secrets、Google Cloud credentialを
  git rollbackの対象にしない。

## 完了条件

ローカル実装の完了:

- API/UI/manualの境界がコード・README・テストで一致する。
- GA4 Admin read auditがbrowserなしで動く。
- GA4 custom dimensionのplan/applyが1件・fail closed・承認付きで実装される。
- AdSense write経路がなく、read-only取得とinventoryは維持される。
- GitHub Actionsはschedule read-only、manual apply protectedの構造になる。
- pure/decision test、metrics test、docs checkがexit 0。
- 未実施の人間工程が最終報告に列挙される。

運用まで含む完了:

- AdSense weekly snapshotが正しいprojectのread-only OAuthで復旧する。
- `google-admin-settings.yml`のaudit runがgreenになる。
- owner承認済みのcustom dimension 1件でplan→apply→verifyが実証される。
- `.env.local`、Playwright session、MCPへ依存せずAPI部分が完結する。
