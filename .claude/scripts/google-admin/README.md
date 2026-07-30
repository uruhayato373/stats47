# Google Admin Playwright runner

GA4・Search Console・AdSense の管理画面を、ローカルの headed Playwright で
監査し、明示 allowlist に含まれる不足設定だけを冪等に反映する。

## 正典

| 対象 | 正典 |
|---|---|
| 実行入口・安全ガード | 本 README + `cli.mjs` |
| allowlist / denylist 判定 | `apply-allowlisted-settings.mjs` |
| GA4 / GSC inventory | `audit-ga4.mjs` / `audit-gsc.mjs` |
| profile・lock・cleanup | `browser-context.mjs` |
| 出力の秘匿化 | `redact.mjs` |
| dimension 登録状況 | `.claude/rules/analytics-event-standards.md` |
| 実測済み監査結果 | `.claude/state/metrics/google-admin/latest.json` |

AdSense の取得・診断契約は
`.claude/scripts/metrics/lib/adsense-report-contract.mjs` と
`.claude/scripts/metrics/lib/adsense-diagnostics.mjs` がコード SSOT。
週次改善の運用は
`.claude/skills/analytics/adsense-improvement/SKILL.md` が所有する。

## コマンド

```bash
# read-only inventory
npm run google-admin:audit

# allowlist の不足だけを反映
npm run google-admin:apply -- --confirm-site stats47.jp

# 設定後の再監査
npm run google-admin:verify

# browser を起動しない pure / decision test
npm run google-admin:test
```

## 実行境界

- ローカル headed 実行専用。cron・CI・GitHub Actionsへ接続しない。
- `.local/playwright-google-admin-profile/` だけを使い、通常Chromeや他サービスの
  profileを流用しない。
- context 1つ・page 1枚で実行し、`.local/locks/google-admin.lock` で多重実行を拒否する。
- 未ログイン、MFA、CAPTCHAは人間がブラウザ上で処理する。自動回避しない。
- runnerが起動したcontext・tab・lockだけを`finally`で閉じ、通常Chromeを一括終了しない。
- Cookie、token、localStorage、認証header、account email、個人情報を保存・出力しない。

## mutation前のidentity確認

次をすべて取得でき、完全一致した場合だけmutationを計画する。

1. GA4 property IDが`GA4_PROPERTY_ID`と一致する。
2. web streamのdefault URL / domainが`stats47.jp`。
3. GSC propertyが`sc-domain:stats47.jp`。
4. AdSense publisher accountが既存環境と観測値に一致する。
5. browser上の選択propertyとplanned actionが一致する。

値を取得できない、複数候補、別account、selector drift、権限不足の場合は
fail closedで停止する。

## allowlist

`apply`が変更してよいのは次の5操作だけ。

| action | 条件 |
|---|---|
| `create-search-console-link` | linkが0件、exact GSC property、正しいweb stream、権限あり |
| `publish-search-console-collection` | 正しいlinkがあり、Libraryのcollectionが未公開 |
| `create-ad-id-dimension` | 台帳が要登録、GA4にexact paramなし、event-scoped枠に空き |
| `create-ad-unit` | account assert ok、inventoryに同名なし、コード側が`pending`宣言、1 runに1件 |
| `rename-ad-unit` | slotId一致でdisplay nameがコードの`adUnitName`と不一致、unit IDが引ける、1 runに1件 |

`ad_id`はdisplay name `Affiliate ad ID`、scope `Event`、event parameter
`ad_id`で固定する。同じparameterが既にあれば作成せず、scope不一致はblockerにする。

ad unitの2操作は`--commit`と`--approve <token>`が揃ったときだけ実行する（下記「承認ゲート」）。

### ad unitだけを解禁している理由

AdSenseの設定は危険性が非対称なので、unitの作成・改名だけをallowlistに置く。

- **新規unit作成は既存の配信を一切変えない。** slotIdが発行されるだけで、
  `apps/web/src/lib/google-adsense/constants.ts`に埋めるまで1 impも出ない。
  管理画面操作とコード反映の二段ゲートが構造的に存在する。
- **renameはunit IDを変えない。** レポートの`AD_UNIT_ID`軸の時系列
  （`.claude/state/metrics/adsense/history-units.csv`）を壊さない。改名が必要になるのは、
  コード側`adUnitName`とAdSense側display nameが食い違って突き合わせ不能になっている場合だけ。
- 対して**Auto ads / ad format / exclusion / blocking controlは全ページの配信を即時・不可逆に
  変える**。これらはdenylistのまま実行経路を作らない。

## denylist

次は本runnerで変更しない。

- Google account / GA4 / GSC / AdSenseのuser、owner、permission
- property、stream、accountの作成・削除
- 既存GSC link、AdSense link、custom dimensionの削除・置換・rename
- timezone、currency、retention、filter、Google Signals、consent
- GSC change of address、property削除、bulk export、association削除
- sitemap submit/delete、URL inspection request、Indexing API publish
- AdSense Auto ads、ad format変更、exclusion、blocking control
- **既存ad unitの削除・アーカイブ・停止・format変更**（作成と改名だけallowlist）
- billing、payment、tax、policy、brand safety
- production deploy、R2 write、GitHub Secrets

wrong GSC linkは自動削除・再作成せず、blockerとして報告する。

## 承認ゲート（ad unit mutation）

ad unitの作成・改名は既定で実行しない。`apply`は計画とbefore screenshotを
`/tmp/stats47-google-admin-<run-id>/`へ出して停止する（draft-first）。

実行には次の4つすべてが必要。`--force`相当の迂回は用意しない。

1. `apply`サブコマンド
2. `--confirm-site stats47.jp`
3. `--commit`
4. `--approve <token>` — `audit`が出力した`approvalToken`と完全一致

tokenは`plannedActionToken(site, accountId, actions, plan)`が計画から決定的に導出する。
計画が1文字でも変わればtokenが変わるので、承認は**その計画そのもの**に対してだけ有効になる。

## ad unit inventoryはAPIが一次ソース

`accounts.adclients.adunits.list`が`reportingDimensionId`（=レポートの`AD_UNIT_ID`）を返し、
`adunits.getAdcode`が`data-ad-slot`を含むadCodeを返すため、unit↔slotIdの対応は
**read-only APIで決定的に取れる**（scopeは`adsense.readonly`。AdSense v2に書き込みAPIは無い）。

DOMを使うのはapply直前のduplicate再確認とSave後verifyだけにして、selector driftの影響範囲を
作成フォームに封じ込める。セレクタは`adsense-probe`でdumpしてから確定する（実機を見ずに書かない）。

## mutation手順

1. inventory取得とexact duplicate check。
2. before screenshotとplanned action JSONを`/tmp/stats47-google-admin-<run-id>/`へ保存。
3. form入力後、Save直前にproperty / siteを再照合。
4. 1 actionだけ実行し、success状態を待つ。
5. reload後にAPIまたはUIでverify。
6. after screenshotとredact済みsummaryを保存。

Save後に検証できなければ`mutation-unknown`として停止し、盲目的に再実行しない。
repoへ保存してよいのはredact済み
`.claude/state/metrics/google-admin/latest.json`だけとする。
