---
type: implementation-spec
feature: x-competitive-research-playwright
created: 2026-07-18
status: proposed
owner: trend-scout
parent: docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md
tags: [X, Playwright, 競合分析, SNS, browser-automation]
---

# X競合調査Playwright実装仕様

## 0. 決定

X上の都道府県統計、ランキング、日本地図、GIS、データ可視化、移住、年収、住宅等の公開投稿を、
Playwrightでローカル・読み取り専用に調査するcollectorを実装する。

目的は投稿を自動操作することではなく、検索、公開数値、画像URL、証拠、同一アカウント通常値を収集し、
決定的コードで異常値を抽出した後、上位投稿のフックと視覚構造を人間/モデルが分析することである。

本仕様は次の下位実装仕様である。

- 親: `docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`
- 既存skill: `.claude/skills/sns/x-viral-research/SKILL.md`
- 既存account観測: `.claude/skills/sns/competitor-scan/SKILL.md`
- 既存投稿実装: `.claude/skills/sns/publish-x/`（**コード・profile・writerを共用しない**）

## 1. 成功条件と非目的

### 1.1 成功条件

1. 3検索軸×最大10投稿のdry-runを、投稿・いいね・リポスト・フォローなしで完了できる。
2. URL、author、投稿日時、本文、公開metrics、media URL、取得日時、取得状態を構造化できる。
3. 取得不可の数値を0ではなく`null`として保存できる。
4. 「該当投稿0件」と「未ログイン」「selector変更」「rate limit」を区別できる。
5. 同一投稿の再観測で履歴を上書きしない。
6. 同一account・同形式の通常値と比較し、outlier候補を決定的に計算できる。
7. 第三者画像・スクリーンショットを公開SNS素材用R2へ送れない。
8. 調査profileと投稿profileを分離し、同時利用をlockで拒否できる。
9. live Xを使わないfixture testでparser・guard・statusを検証できる。
10. gallery `/research`から証拠・欠損・失敗理由を確認できる。

### 1.2 非目的

- X APIやUI制限の回避。
- CAPTCHA、2FA、ログイン要求、rate limitの自動突破。
- follower、view、bookmark等の非公開値の推定。
- 無限scroll、全件crawl、過去全投稿の収集。
- いいね、リポスト、返信、引用、フォロー、投稿、削除、予約。
- 第三者投稿文・画像・動画の再配布、加工、公開素材への流用。
- Playwrightに「なぜ伸びたか」を判断させること。
- 既存`publish-x.ts`への調査機能追加。

## 2. 既存実装との境界

### 2.1 再利用するもの

| 既存 | 再利用 |
|---|---|
| repoの`playwright`依存 | Chromium API、locator、persistent context |
| X検索語 | `x-viral-research`のstats/map/dataviz/emotion軸 |
| taxonomy | `sns-content-standards`、`buzz-map-standards`の型 |
| URL canonical化 | doc 31 Phase 1で作る共通関数 |
| gallery | `apps/gallery`のjob、safe-local-file、media preview設計 |
| agent | `trend-scout` orchestrator |
| cleanup知見 | `browser-use-cleanup.md`の残留process確認思想 |

### 2.2 共用しないもの

| 対象 | 理由 |
|---|---|
| `.local/playwright-x-profile` | 投稿用profile。調査との同時利用・cookie破損・誤操作を避ける |
| `publish-x.ts` | write操作とfail-safeが混在。read collectorと責務が逆 |
| `sns-posts-store.cjs` | 自社投稿台帳writer。競合観測にimport不要 |
| gallery `publish-x` action | 外向き変更。調査jobとはrouteを分離 |
| 第三者mediaのR2 push | 著作権・公開再配布を避ける |

### 2.3 専用profile

```text
.local/playwright-x-research-profile/
.local/locks/x-research.lock
.local/sns-research/x/
```

- gitignore対象。
- 初回だけheadedで人間がログインする。
- cookie、localStorage、tokenをJSONとしてrepoへexportしない。
- 通常Chrome profileを直接指定しない。
- 投稿用profileからコピーしない。
- profile pathをlog、error API、gallery responseへ露出しない。

## 3. 配置

既存skillに実装を密結合させる。

```text
.claude/skills/sns/x-viral-research/
├── SKILL.md                       # 既存。Playwright実装へ更新
├── scripts/
│   ├── cli.ts
│   ├── login.ts
│   ├── collect.ts
│   ├── inspect-post.ts
│   ├── build-report.ts
│   └── validate-fixtures.ts
├── lib/
│   ├── types.ts
│   ├── query-builder.ts
│   ├── browser-context.ts
│   ├── read-only-guard.ts
│   ├── login-state.ts
│   ├── parse-tweet.ts
│   ├── parse-metric.ts
│   ├── canonicalize.ts
│   ├── scroll-budget.ts
│   ├── evidence.ts
│   └── scoring.ts
└── __tests__/
    ├── fixtures/
    │   ├── search-ja.html
    │   ├── post-with-metrics.html
    │   ├── post-partial.html
    │   ├── login-wall.html
    │   ├── rate-limit.html
    │   └── selector-changed.html
    ├── parse-tweet.test.ts
    ├── read-only-guard.test.ts
    ├── query-builder.test.ts
    ├── scoring.test.ts
    └── status.test.ts
```

共有domain型がdoc 31 Phase 1で実装済みならimportする。未実装なら本Phaseで独自の重複型を作らず、doc 31 Phase 1を先行する。

## 4. CLI

```bash
# 初回ログイン。人間がheaded browserで操作し、Enterで終了
npx tsx .claude/skills/sns/x-viral-research/scripts/cli.ts login

# fixtureのみ。外部アクセスなし
npx tsx .claude/skills/sns/x-viral-research/scripts/cli.ts validate-fixtures

# dry-run。結果は/tmpのみ
npx tsx .claude/skills/sns/x-viral-research/scripts/cli.ts collect \
  --axis stats,map,dataviz \
  --days 14 \
  --max-per-query 10 \
  --max-total 30 \
  --dry-run \
  --out /tmp/x-competitive-observations.json

# URL 1件の深掘り
npx tsx .claude/skills/sns/x-viral-research/scripts/cli.ts inspect-post \
  --url https://x.com/<handle>/status/<id> \
  --dry-run

# 正式state/R2接続後のreport生成。公開操作なし
npx tsx .claude/skills/sns/x-viral-research/scripts/cli.ts report \
  --date YYYY-MM-DD
```

`collect`の既定は`--dry-run`相当とし、正式writerは`--persist`を明示しない限り呼ばない。
`--persist`はPhase 4まで実装しない。

## 5. 検索設計

### 5.1 query catalog

検索語SSOTはdoc 31の`.claude/scripts/research/data/search-taxonomy.ts`を参照する。X構文だけを本skill側で組み立てる。

```ts
type XSearchAxis = "stats" | "map" | "dataviz" | "identity" | "utility" | "attention";
```

初期query:

| axis | query component |
|---|---|
| stats | `都道府県 ランキング` / `47都道府県 統計` / `県別 データ` |
| map | `日本地図 で見る` / `地図にしてみた` / `市区町村 地図` |
| dataviz | `可視化してみた` / `データで見る` / `推移 グラフ` |
| identity | `あなたの県` / `県民性 データ` / `地元 あるある` |
| utility | `移住 県 比較` / `年収 都道府県` / `空き家 市区町村` |
| attention | `治安 県` / `格差 都道府県` / `ワースト 県` |

X query builder:

```text
(<synonyms joined by OR>) lang:ja -filter:replies since:YYYY-MM-DD
(<synonyms>) min_faves:N lang:ja -filter:replies since:YYYY-MM-DD
from:<known_handle> since:YYYY-MM-DD
```

`attention`は発見対象だが、自動制作候補へ昇格しない。

### 5.2 Top / Latest

- `f=top`: 既に伸びた投稿の型。
- `f=live`: 新しく伸び始めた投稿とvelocity。
- 同queryで両方を取得し、source tabを記録する。
- TopとLatestの重複はcanonical status URLでdedupする。

### 5.3 budget

既定:

- query最大6件/実行。
- query当たり10投稿。
- 合計30投稿。
- scroll最大4回/query。
- 1scroll後の待機1.5〜3秒。固定sleepだけに依存せずlocator/data増加を待つ。
- 実行全体最大10分。
- 同日live run最大2回。

上限到達は成功として`truncated=true`を記録する。無限scrollしない。

## 6. Playwright browser設計

### 6.1 context

```ts
const context = await chromium.launchPersistentContext(RESEARCH_PROFILE_DIR, {
  headless: false,
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: false,
});
```

- headedを既定とする。Xはログイン・rate limit・UI変化を人間が認識できる必要がある。
- Phase 2で安定確認するまでheadlessを提供しない。
- download eventは即cancel。
- pageは1枚だけ。parallel browser/pageでXを巡回しない。

### 6.2 lock

起動時に`.local/locks/x-research.lock`を`wx`相当で原子的作成する。

lock内容:

```json
{ "pid": 123, "startedAt": "ISO", "command": "collect" }
```

- 既存PIDが生存中ならexit 3。
- stale lockはPID不在と10分超を確認後に除去。
- 終了時finallyで削除。
- 投稿用`.local/playwright-x-profile`のlock/Chrome processが生存中なら調査を拒否する。
- 調査中に`publish-x`を起動できない相互lockをPhase 3で追加する。

### 6.3 read-only network guard

Xは画面表示だけでもPOST/GraphQLを使用するため、HTTP methodだけで全POSTを止めない。既知の外向きmutation operationを拒否する。

拒否対象URL/operation name例:

- `CreateTweet`
- `DeleteTweet`
- `FavoriteTweet` / `UnfavoriteTweet`
- `CreateRetweet` / `DeleteRetweet`
- `CreateBookmark` / `DeleteBookmark`
- `Follow` / `Unfollow`
- `CreateScheduledTweet`
- DM関連mutation

guardが拒否した場合:

- requestをabort。
- operation nameだけlog。
- cookie、headers、body全文、query IDをlogしない。
- `blockedMutationCount`をsummaryへ記録。
- 1件でもcollector自身の操作から発生した場合はexit 4。

未知のmutationを完全検出できるとは断定しない。UI操作allowlistも併用する。

### 6.4 UI操作allowlist

許可:

- `page.goto`。
- 検索inputへの入力。
- Top/Latest tab。
- 投稿detail link。
- scroll。
- Escape/close。

禁止:

- `[data-testid=like]`、`retweet`、`reply`、`bookmark`、`follow`、`tweetButton`のclick。
- composer、DM、notification settings。
- 任意buttonのtext検索click。

全clickは`safeClick(kind, locator)`を経由し、kind enumのallowlist外をcompile時に拒否する。

### 6.5 login判定

成功条件:

- `https://x.com/home`または検索画面へ遷移可能。
- `article[data-testid="tweet"]`または検索empty stateが見える。
- login form / challenge / account locked bannerが無い。

状態:

- `authenticated`
- `blocked-login`
- `blocked-two-factor`
- `blocked-challenge`
- `blocked-account`
- `unknown`

ログイン失敗時は人間操作用`login`コマンドを案内して終了する。credential入力を自動化しない。

## 7. Selector契約

Xのclass名は使わない。可能な範囲で`data-testid`、semantic element、status URL、timeを使う。

### 7.1 tweet root

優先:

```text
article[data-testid="tweet"]
article[role="article"]
```

後者はfallback。root内に`a[href*="/status/"]`と`time[datetime]`の両方が無い場合、tweetとして確定しない。

### 7.2 fields

| field | primary | fallback |
|---|---|---|
| text | `[data-testid="tweetText"]` | rootのlang付きtext nodeを限定抽出 |
| status URL | `a[href*="/status/"] time`の親link | status link候補からcanonical pattern |
| postedAt | `time[datetime]` | null |
| author | canonical URLのhandle | User-Name area link |
| reply | `[data-testid="reply"]` aria-label | role=group aria-label parser |
| repost | `[data-testid="retweet"]` aria-label | role=group aria-label parser |
| like | `[data-testid="like"], [data-testid="unlike"]` | role=group aria-label parser |
| bookmark | `[data-testid="bookmark"], [data-testid="removeBookmark"]` | detail pageのaria-label |
| views | status analytics link/aria-label | role=group aria-label parser |
| images | `img[src*="pbs.twimg.com/media"]` | root内media img、avatar除外 |
| video | `[data-testid="videoPlayer"]`存在 | root内video |

primary/fallbackのどちらを使ったかを`fieldEvidence`に記録する。

### 7.3 selector drift

次のいずれかで`selector-changed`:

- tweet rootは3件以上あるがstatus URL取得率50%未満。
- metrics取得率が前回正常runより50 point以上低下。
- root内の本文・time・status URLが全て取れない。
- pageにlogin/rate-limit/emptyの既知状態がなく、tweet 0件。

`selector-changed`を0件成功として保存しない。HTML全文はcredentialや個人情報を含み得るため保存せず、
DOM構造の許可属性だけをredacted diagnostic JSONにする。

## 8. Metric parser

### 8.1 数値

対応例:

- `1,234`
- `1.2万`
- `3万`
- `1.5M`
- `2K`

locale parserで整数へ変換し、元textも`raw`へ保持する。曖昧・非表示は`null`。

```ts
type ParsedMetric = {
  value: number | null;
  raw: string | null;
  source: "testid-aria" | "group-aria" | "detail" | "unavailable";
};
```

- `非表示`を0にしない。
- `0件`と明記された場合だけ0。
- like buttonのaria labelと表示textが矛盾する場合は`metric-conflict`。
- 万/M/K丸め値は`approximate=true`。

### 8.2 viewsとimpressions

X UIの公開`views`は取得できる場合だけ`views`へ入れる。自社analyticsのimpressionsと同一fieldにしない。
第三者投稿では`impressions`を作らない。

## 9. データ契約

### 9.1 Observation

```ts
type XObservation = {
  artifactId: string;
  postUrl: string;
  nativePostId: string;
  authorHandle: string;
  postedAt: string | null;
  observedAt: string;
  sourceTab: "top" | "latest" | "account" | "detail";
  matchedQueryIds: readonly string[];
  textSummary: string;
  textHash: string;
  metrics: {
    views: ParsedMetric;
    likes: ParsedMetric;
    reposts: ParsedMetric;
    replies: ParsedMetric;
    bookmarks: ParsedMetric;
  };
  media: readonly {
    kind: "image" | "video" | "gif";
    publicUrl: string | null;
    alt: string | null;
  }[];
  fieldEvidence: Record<string, string>;
  collectionStatus:
    | "ok" | "partial" | "removed" | "blocked-login"
    | "blocked-rate-limit" | "selector-changed" | "metric-conflict";
  unavailable: readonly string[];
};
```

第三者本文全文をgit TS/stateへ恒久保存しない。調査に必要な先頭要約、hash、URLを持ち、全文はlive pageで再確認する。

### 9.2 Run summary

```ts
type XCollectionRun = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  queryIds: readonly string[];
  requestedMax: number;
  observed: number;
  deduplicated: number;
  ok: number;
  partial: number;
  blocked: number;
  fieldCoverage: Record<string, number>;
  blockedMutationCount: number;
  truncated: boolean;
  status: "success" | "partial" | "blocked" | "failed";
};
```

## 10. 保存と証拠

### 10.1 Phase 2 dry-run

```text
/tmp/x-competitive-observations.json
/tmp/x-competitive-run-summary.json
.local/sns-research/x/<run-id>/screenshots/   # 明示--screenshots時のみ
```

### 10.2 正式接続

doc 31のSSOTに従う。

- raw observation: R2 `research/competitive-intelligence/x/observations/YYYY-MM-DD/<run-id>.json`
- latest/cursor/failure: `.claude/state/research/competitive-intelligence/x/`
- curated pattern: git TS、人間承認後。
- review: `docs/04_レビュー/YYYY-MM-DD-x-viral-research.md`

R2 writeはcollectorが直接行わない。ローカルoutbox→`r2-publisher`または専用の安全なwriterへ委譲する。

### 10.3 screenshot

- 既定off。上位候補またはselector diagnosticだけ。
- full-page禁止。tweet rootのbounding boxだけ。
- `.local`内部参照。git commit、公開R2 push禁止。
- file名はpost ID hash。author handleをfile名へ入れない。
- 30日後削除候補。削除実装は別Phaseで明示設計。
- screenshot自体をSNS素材、商品、学習datasetへ流用しない。

## 11. Scoring

Playwrightは取得だけ。scoreは純粋関数で計算する。

```text
ageHours = max(1, observedAt - postedAt)
viewsPerHour = views / ageHours
engagementPublic = likes + reposts + replies
publicEngagementRate = engagementPublic / views  # views取得時だけ
accountLift = views / 同一account・同format・直近20件median views
```

formatは`image`、`video`、`text`、`thread`へ分ける。account baselineが5件未満なら`confidence=low`。

Discovery score:

| 要素 | 点 |
|---|---:|
| accountLift | 30 |
| velocity percentile | 20 |
| public engagement | 15 |
| stats47 topic fit | 10 |
| visual/pattern novelty | 10 |
| data/rights feasibility | 10 |
| differentiation | 5 |

topic fit、novelty、differentiationだけがmodel判断。観測値scoreをモデルに計算させない。

## 12. エージェント分業

| agent | model | 責務 | write boundary |
|---|---|---|---|
| `trend-scout` | Sonnet | query plan、run、候補統合、review | review draft、research latest proposal |
| `competitive-research-collector` | Haiku | CLI実行結果の欠損・coverage確認 | raw observationのみ |
| `creative-pattern-analyst` | Sonnet | 上位10件のhook/visual/format分析 | assessment candidate |
| `competitive-strategy-critic` | Opus条件付き | taxonomy変更、高sensitivity、上位pilot審査 | verdictのみ |
| `x-strategist` | Sonnet | 承認済みpatternのstats47投稿適応 | 自社draft。調査rawにはwriteしない |

Playwright collector自体はモデルではなくTypeScriptコード。

### Output Contract

Collector audit:

```text
OUTPUT FORMAT: 1 markdown table only.
Columns: Run | Coverage | Missing fields | Blocked mutations | Status | Required action.
Do not interpret why a post performed.
```

Pattern analyst:

```text
OUTPUT FORMAT: 1 markdown table only.
Columns: Post URL | Evidence IDs | Hook | Visual | Format | Reusable structure | Exact-copy risk | Confidence.
Do not reproduce full post text.
```

## 13. gallery `/research` X view

Phase 4で追加する。

- query、Top/Latest、取得日時、coverage。
- URL、author、postedAt、metrics履歴。
- `null`と0の明確な表示。
- source selector badge。
- screenshotはlocal存在時だけ。
- `blocked-login`、`rate-limit`、`selector-changed` alert。
- deep-review queue登録。
- pattern昇格proposal。

外向き操作ボタンを置かない。`publish-x` route/componentをimportしない。

## 14. エラーとexit code

| code | 状態 |
|---:|---|
| 0 | success |
| 2 | validation/argument error |
| 3 | lock/profile conflict |
| 4 | prohibited mutation attempted |
| 5 | login/challenge blocked |
| 6 | rate limit |
| 7 | selector changed |
| 8 | partial below coverage budget |
| 9 | unexpected browser failure |

stack、cookie、credential、request body、profile pathをgallery API responseへ返さない。

## 15. テスト

### 15.1 unit

- 日本語`万`、K/M、comma metric parser。
- nullと0。
- canonical status URL、tracking query除去。
- author/native ID抽出。
- query escapingとsince。
- scroll/max total budget。
- accountLift、age、score。
- mutation operation blocklist。
- status非巻戻し、observation append。

### 15.2 fixture integration

- normal search HTML→10 observations。
- partial metrics→`partial`+null。
- login wall→exit 5。
- rate limit→exit 6。
- unknown DOM→exit 7。
- mutation request fixture→abort+exit 4。
- 0 result empty state→success 0。
- root 3件でstatus URL coverage不足→selector-changed。

fixture HTMLには実在投稿全文、cookie、credentialを保存しない。構造を再現した最小synthetic HTMLにする。

### 15.3 live smoke

人間承認後、ローカルのみ:

```bash
collect --axis stats --days 7 --max-per-query 3 --max-total 3 --dry-run
```

確認:

- browser headed。
- 調査profile。
- 3件以下。
- mutation 0。
- profile/login情報がoutputに無い。
- context/process/lockが終了後に残らない。

live smokeをCIで実行しない。

## 16. cleanup

Playwrightは`finally`で次を実行する。

1. page close。
2. context close。
3. browser process終了待ち。
4. lock削除。
5. 自分が起動したPIDだけ残存確認。

`pkill`で通常Chromeや投稿用profileを広くkillしない。browser-use daemonを起動しないためbrowser-use cleanup trapを
そのまま流用せず、Playwright専用のPID所有cleanupを実装する。異常終了時のstale lock回収をtestする。

## 17. Phase

### Phase 0: read-only監査

- doc 31、x-viral、competitor-scan、publish-x、update-x-profile、update-x-metricsを読む。
- Playwright version、profile、lock、selector、既存writerを棚卸し。
- 共通domain型の有無を確認。
- 実装変更なし。

### Phase 1: pure domain + fixture

- types、query builder、metric parser、canonical URL、budget、score。
- synthetic fixture tests。
- browser/profile/live Xなし。

### Phase 2: login + dry-run collector

- 専用profile、manual login、context、read-only guard、lock。
- `/tmp`出力のみ。
- 3query×10件dry-run。
- screenshot既定off。

### Phase 3: live pilot hardening

- Top/Latest、account baseline、detail metrics。
- selector coverage、rate limit、diagnostic。
- 上位10件のローカルscreenshot。
- 人間が取得内容を全件review。

### Phase 4: formal store + gallery

- doc 31 schema/R2 outbox/state writer。
- gallery `/research` X view。
- review builder。
- publish actionとのcompile/runtime境界test。

### Phase 5: periodic assisted run

- 月次competitor scan、週次viral discovery。
- 自動cronではなくローカル明示実行を既定。
- 安定性が2か月確認できたsourceだけ定期化候補。

Phaseを飛ばさない。Phase 2のlive X前にfixture testsをgreenにする。

## 18. 受入条件

- [ ] 調査profileと投稿profileが分離されている。
- [ ] mutation network guardとUI click allowlistがある。
- [ ] posts store/publish-xをcollectorからimportしていない。
- [ ] fixtureだけでparser/status/guardが検証できる。
- [ ] null/0、empty/failureを区別する。
- [ ] query、scroll、件数、時間budgetがある。
- [ ] login/challenge/rate-limitを回避せず停止する。
- [ ] screenshotはlocal・限定・非公開・期限付き。
- [ ] 同一投稿のmetric履歴をappendする。
- [ ] scoreは決定的コード、意味分析だけmodel。
- [ ] live smokeは最大3件・headed・人間確認。
- [ ] cleanupで所有processとlockだけを片付ける。
- [ ] galleryに外向き操作が無い。
- [ ] Claude CodeのPhase 0はコードを変更しない。

## 19. Claude Code Phase 0指示prompt

```text
OUTPUT FORMAT:
最終報告は「結論 / 既存資産 / 衝突・リスク / Phase 1変更案 / 検証計画」の5見出し、800語以内。
各主張にファイルpathまたは確認コマンドを付ける。コードは変更しない。

BEHAVIOR CONTRACT:
- docs/02_実装計画/33_X競合調査Playwright実装仕様.md のPhase 0だけを実施する。
- Playwrightを起動しない。Xへアクセスしない。ログインしない。
- TypeScript、agent、skill、state、gallery、profileを変更しない。
- 既存未コミット変更をユーザー所有物として保護する。
- profile/cookie/token/.env.local/サービスアカウントを読出・表示しない。
- git commit/push、PR、deploy、R2 write、SNS操作をしない。
- agent prompt冒頭に .claude/rules/agent-output-contract.md 準拠のOUTPUT FORMATを書く。
- agent起動時は mode: bypassPermissions を既定にする。

ROLE:
あなたはFable。X競合調査Playwright collectorのPhase 0監査を統括する。

MODEL ROUTING:
- Sonnet: 既存Playwright/X skill/script/profile/selector/test/stateのread-only棚卸し。
- Opus: 起動しない。投稿事故につながる解消不能な設計矛盾だけFableが報告する。
- Haiku: rg結果の機械一覧が必要な場合のみ。
- Fable: 重複判定、file boundary、Phase 1最小案、ready/blocked判定。

必読:
- CLAUDE.md
- docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md
- docs/02_実装計画/33_X競合調査Playwright実装仕様.md
- docs/04_レビュー/2026-07-18-youtube-competitive-analysis.md
- .claude/skills/sns/x-viral-research/SKILL.md
- .claude/skills/sns/competitor-scan/SKILL.md
- .claude/skills/sns/publish-x/{SKILL.md,publish-x.ts}
- .claude/skills/sns/update-sns-metrics/references/platform-x.md
- .claude/skills/sns/update-x-profile/
- .claude/agents/{README,trend-scout,x-strategist}.md
- .claude/rules/{agent-output-contract,data-storage,docs-vs-issues,browser-use-cleanup,sns-content-standards}.md
- apps/galleryのactions/jobs/contracts/tests
- package.jsonとPlaywright依存

TASK:
1. git statusを確認し、本件関連の未コミット・未追跡ファイルを所有者不明として列挙する。
2. X関連Playwright実装のprofile path、起動方法、lock、cleanup、selectors、writer importを表にする。
3. doc 33の提案配置・型・agent・stateが既存実装と重複する箇所を示す。
4. publish-xと調査collectorをcompile/runtimeで分離する最小境界を決める。
5. Phase 1で追加/変更する最小ファイルと、触らないファイルを確定する。
6. synthetic fixture testのcaseと、live Xなしで満たせる受入条件を確定する。
7. docs/04_レビュー/YYYY-MM-DD-x-playwright-phase0-audit.mdへ監査結果を保存する。
8. Phase 1開始可否をready/blockedで判定する。コード実装へ進まない。
```

## 20. Claude Code Phase 1指示prompt

Phase 0が`ready`の場合だけ使用する。

```text
OUTPUT FORMAT:
最終報告は「結果 / 変更ファイル / テスト / 未実装 / Phase 2 gate」の5見出し、800語以内。
未検証を完了と書かない。

BEHAVIOR CONTRACT:
- docs/02_実装計画/33_X競合調査Playwright実装仕様.md のPhase 1だけを実装する。
- browser/Playwrightを起動しない。Xへアクセスしない。profileを作成・読込しない。
- pure domainとsynthetic fixture testだけを実装する。
- publish-x、posts store、gallery、state、R2、agent、外部公開を変更しない。
- 既存変更を保護し、Phase 0で確定したfile boundaryを守る。
- git commit/push、PR、deployをしない。

TASK:
1. Phase 0 auditとdoc 33を読む。
2. 既存共通domain型があれば再利用し、同義型を増やさない。
3. types、query builder、metric parser、canonical URL、scroll budget、scoringを最小実装する。
4. synthetic HTML fixtureでnormal/partial/login/rate-limit/selector-drift/mutationを表現する。
5. nullと0、日本語万/K/M、URL dedup、budget、score、statusをunit testする。
6. browser依存module、profile、live X collectorは作らない。
7. 対象test、type-check、git diff --checkを実行する。
8. Phase 2開始条件と未実装を報告する。
```
