---
type: implementation-spec
feature: instagram-competitive-research-playwright
created: 2026-07-18
status: proposed
owner: trend-scout
parent: docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md
tags: [Instagram, Playwright, 競合分析, SNS, browser-automation]
---

# Instagram競合調査Playwright実装仕様

## 0. 決定

Instagramの公開プロフィール、投稿、リール、カルーセルを、Playwrightでローカル・読み取り専用に少量観測する。
目的は第三者素材の複製ではなく、stats47に近い投稿の公開反応、フック、画面構成、展開順、CTAを証拠付きで
抽象化し、独自データと独自表現へ適応できる勝ちパターン候補を作ることである。

- 親仕様: `docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`
- X実装仕様: `docs/02_実装計画/33_X競合調査Playwright実装仕様.md`
- 既存定点観測: `.claude/skills/sns/competitor-scan/SKILL.md`
- 自社投稿: `.claude/skills/sns/post-instagram/`（**コード、token、writerを共用しない**）
- 自社metrics: `.claude/skills/sns/update-sns-metrics/references/platform-instagram.md`（競合取得には使わない）

X版と共通domain、score、evidence、gallery contractを使い、ブラウザ、selector、format解析、失敗判定だけを
Instagram adapterに閉じ込める。共通実装をコピーしない。

## 1. 成功条件と非目的

### 1.1 成功条件

1. Web検索、既知handle、hashtag seedから最大15件の候補を得られる。
2. permalink、author、日時、caption、公開likes/comments/views、format、media countを構造化できる。
3. carousel、reel、single imageを区別し、取得不能値を`null`で保持する。
4. 0件、login wall、challenge、rate limit、private/deleted、selector driftを区別する。
5. 同一permalinkの再観測をappendし、過去値を上書きしない。
6. account×formatの通常値に対するoutlierを決定的コードで算出する。
7. 上位候補だけ、表紙、冒頭3秒、スライド展開、CTAを人間/モデルが分析できる。
8. like、comment、save、share、follow、DM、投稿等のmutationをnetwork/UI両方で拒否する。
9. 第三者mediaを公開R2、自社投稿素材、生成AI参照画像へ流用できない。
10. synthetic fixtureでparser、guard、status、budgetをlive Instagramなしに検証できる。

### 1.2 非目的

- 非公開のreach、impressions、saves、shares、watch time、retentionの推定。
- Business Discovery等、権限のない競合APIアクセス。
- CAPTCHA、2FA、challenge、login wall、rate limitの回避。
- hashtag全件、followers/following一覧、コメント全件のcrawl。
- 音源、動画、画像、captionの転載は禁止転載、再編集、生成AI入力。
- follower数だけで投稿価値を断定すること。
- likesをviewsの代用にしたengagement rateの捏造。
- 自動投稿、自動反応、競合への接触。

## 2. 方式の優先順位

```text
通常のWeb検索で候補URL発見
  → 公開permalinkをPlaywrightで確認
  → 既知handleの直近グリッドを少量確認
  → hashtagは候補発見補助のみ
  → blockedなら人手確認へ戻す
```

Instagram Graph APIはstats47自身の投稿・insightsには使うが、任意の競合観測の代替としない。
検索結果だけで取得できるtitle/snippet/URLはブラウザを開かず保存し、深掘り候補だけInstagramを開く。

## 3. 実装配置と境界

```text
.claude/skills/sns/instagram-competitive-research/
├── SKILL.md
├── scripts/
│   ├── cli.ts
│   ├── login.ts
│   ├── collect.ts
│   ├── inspect-post.ts
│   └── build-report.ts
├── lib/
│   ├── instagram-adapter.ts
│   ├── browser-context.ts
│   ├── read-only-guard.ts
│   ├── login-state.ts
│   ├── parse-profile.ts
│   ├── parse-post.ts
│   ├── parse-metric.ts
│   ├── format-classifier.ts
│   ├── scroll-budget.ts
│   └── evidence.ts
└── __tests__/
    ├── fixtures/
    │   ├── profile-public.html
    │   ├── profile-private.html
    │   ├── post-single.html
    │   ├── post-carousel.html
    │   ├── reel-with-views.html
    │   ├── post-partial.html
    │   ├── login-wall.html
    │   ├── challenge.html
    │   └── selector-changed.html
    └── *.test.ts
```

共通のartifact/observation/score/canonicalizeはdoc 31のdomainをimportする。未実装ならdoc 31 Phase 0を先行し、
Instagram側へ重複型を作らない。`post-instagram.ts`、token、posts store、publish logはimport禁止。

### 3.1 専用profileとlock

```text
.local/playwright-instagram-research-profile/
.local/locks/instagram-research.lock
.local/sns-research/instagram/
```

- 自社投稿、通常Chrome、X調査profileと分離する。
- 初回だけheadedで人間がログインする。認証情報をrepo、JSON、logへexportしない。
- profileをコピーしない。lock取得失敗時は即終了する。
- 終了時は`context.close()`と`browser.close()`を`finally`で必ず実行し、残留processを確認する。
- browser-useは使わないが、`.claude/rules/browser-use-cleanup.md`の「残留させない」原則を適用する。

## 4. CLI

```bash
# 人間による初回ログイン
npx tsx .claude/skills/sns/instagram-competitive-research/scripts/cli.ts login

# 外部アクセスなし
npx tsx .claude/skills/sns/instagram-competitive-research/scripts/cli.ts validate-fixtures

# 候補URLを入力した安全なdry-run
npx tsx .claude/skills/sns/instagram-competitive-research/scripts/cli.ts collect \
  --input /tmp/instagram-candidate-urls.txt \
  --max-total 15 --dry-run \
  --out /tmp/instagram-competitive-observations.json

# 既知handleの直近投稿（Phase 3以降）
npx tsx .claude/skills/sns/instagram-competitive-research/scripts/cli.ts inspect-profile \
  --handle example --max-posts 6 --dry-run

# permalink 1件の深掘り
npx tsx .claude/skills/sns/instagram-competitive-research/scripts/cli.ts inspect-post \
  --url https://www.instagram.com/reel/<shortcode>/ --dry-run
```

既定はdry-runで`/tmp`出力。`--persist`はPhase 4まで存在させない。URLは`instagram.com/p/<shortcode>/`または
`instagram.com/reel/<shortcode>/`のみ許可し、外部redirect、短縮URL、login callbackを拒否する。

## 5. 検索・競合seed

検索語SSOTはdoc 31のsearch taxonomyを参照し、Instagram固有queryをadapterで生成する。

| axis | Web/site query・hashtag seed |
|---|---|
| stats | `site:instagram.com/reel 都道府県 ランキング` / `#都道府県ランキング` |
| map | `site:instagram.com/reel 日本地図 データ` / `#日本地図` `#GIS` |
| identity | `site:instagram.com/reel 県民性 あるある` / `#県民性` `#ご当地` |
| utility | `site:instagram.com/reel 移住 県 比較` / `#地方移住` |
| attention | `site:instagram.com/reel 治安 格差 県`（発見のみ、自動採用禁止） |
| known | 承認済みhandleのプロフィール→直近6件 |

seedはgit TSで`source`, `axis`, `queryOrHandle`, `status`, `reason`, `addedAt`を持つ。競合handle追加は、関連投稿が
2件以上か、単一outlierがstats47の題材と強く一致する場合にproposalとし、人間承認後にactiveへする。

### 5.1 budget

- 初期live smoke: permalink最大3件。
- 通常1run: 最大15投稿、profile最大3、profile当たり6投稿。
- post詳細を開くのは最大15回、carousel操作は投稿当たり最大3枚まで。
- scroll最大3回/profile、全体最大10分、同日最大2run。
- コメント本文は取得しない。件数だけ公開表示があれば取得する。
- budget到達は`truncated=true`の成功。無限scrollしない。

## 6. 観測schema

```ts
type InstagramFormat = "single_image" | "carousel" | "reel" | "video" | "unknown";
type InstagramAccessState =
  | "ok" | "partial" | "empty" | "login_required" | "challenge"
  | "rate_limited" | "private" | "deleted" | "selector_drift" | "blocked";

interface InstagramObservation {
  platform: "instagram";
  canonicalUrl: string;
  shortcode: string;
  observedAt: string;
  source: "web_search" | "known_handle" | "hashtag" | "manual_url";
  authorHandle: string | null;
  publishedAt: string | null;
  caption: string | null;
  format: InstagramFormat;
  mediaCount: number | null;
  durationSeconds: number | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  plays: number | null;
  followerCountAtObservation: number | null;
  audioLabel: string | null;
  locationLabel: string | null;
  hashtags: string[];
  accessState: InstagramAccessState;
  missingFields: string[];
  selectorVersion: string;
  evidenceManifestPath: string | null;
  truncated: boolean;
}
```

公開UIに表示されない値は`null`。表示された「0」だけ0とする。`likes hidden`も`null`であり0ではない。
`views`と`plays`を混同せず、labelが特定できない値は保存しない。`followerCountAtObservation`は同時点profileを
開いた場合だけ記録し、過去値や推定値で補完しない。

## 7. selector contract

DOM class名やCSS階層へ依存せず、複数の根拠を段階評価する。

1. canonical/meta: `link[rel=canonical]`, Open Graph URL/title/description。
2. permalink: `/p/<shortcode>/`, `/reel/<shortcode>/`。
3. semantic elements: `article`, `time[datetime]`, `img[alt]`, `video`。
4. accessible label/roleと表示ラベル。
5. locale別metric parser（日本語/英語）。

単一fallbackの成功で全体を`ok`にせず、fieldごとのprovenanceとconfidenceを記録する。主要fixtureの
required field coverageが閾値を下回れば`selector_drift`とし、空配列で成功させない。

format判定:

- URLが`/reel/`かつvideo要素/リールlabel → `reel`。
- carousel次へボタンまたは複数item indicator → `carousel`。
- 画像1件 → `single_image`。
- 根拠が競合する場合は`unknown`、推測しない。

## 8. metric parser

`1,234`, `1.2万`, `3万`, `1.5K`, `2M`を整数へ変換する。全角空白、NBSP、locale separatorをfixture化する。
丸め表示は`metricIsRounded=true`をprovenanceへ持たせる。labelと数値の対応が曖昧なら`null`。

likes非表示、views非表示、caption折りたたみは欠損として扱い、自動クリックで「もっと見る」を開くのは
allowlist対象とする。ただしコメント欄展開、音源遷移、プロフィールfollow操作は行わない。

## 9. 読み取り専用guard

### 9.1 network deny

context routeで非GET/HEAD/OPTIONSを既定拒否し、document取得に必要とfixtureで確認した例外だけallowlist化する。
少なくとも次の意味を持つrequestはmethodを問わず拒否する。

- media publish/delete/edit
- like/unlike、save/unsave、comment、share
- follow/unfollow、block、report
- direct message、notification変更
- profile edit、login credential変更

Instagram内部operation名を固定仕様として信用せず、Phase 2 live smokeでobserved operation inventoryを作る。
未知のmutation候補はfail closed。拒否時はURL全文/body/tokenをlogせず、host、method、分類だけを記録する。

### 9.2 UI allowlist

許可するclickは次だけ。

- cookie noticeを閉じる。
- captionの「続きを読む」。
- carouselの次へ（最大3回）。
- 人間操作のlogin command内だけの認証UI。

禁止: like、comment、save、share、follow、message、音源利用、投稿作成、編集、削除。禁止buttonが候補になった時点で
`READ_ONLY_GUARD_BLOCKED`として停止する。汎用`button.click()`や座標clickを禁止する。

## 10. 証拠・著作権・個人情報

- screenshotは上位候補またはfailure診断だけ。投稿articleのbounding boxへ限定する。
- local専用、git/R2/gallery公開media routeへ置かない。既定30日で削除候補。
- screenshot manifestはpath、取得日時、目的、hash、source URL、retention期限を持つ。
- 第三者の顔、ユーザー名、コメントを制作物や生成AIへ入力しない。
- 画像/動画のdownloadは行わない。ブラウザcacheをassetとして収集しない。
- カタログ化するのは「1枚目に対比数字」「2〜4枚で順位」「最後に保存CTA」のような抽象構造のみ。
- captionの長文引用は保存せず、hookの分類と短い内部メモにする。

## 11. outlierと勝ちパターン

比較単位は`authorHandle × format × 観測期間`。最低5投稿未満はbaseline不足として順位を断定しない。

```text
primarySignal = views ?? likes ?? null
baselineRatio = primarySignal / median(same account, same format)
```

viewsがある投稿群とlikesしかない投稿群を同一ratioで混ぜない。discovery scoreはrelevance、recency、
baselineRatio、public engagement、field coverageを決定的に計算し、attention軸にはbrand-risk penaltyを付ける。

上位候補だけ次をSonnetへ渡す。

- cover hook（問い、断言、対比、数字、感情）。
- carousel narrative（答えの遅延、順位展開、地図、解説、CTA）。
- reel opening（冒頭3秒の文字量、動き、答え提示時点）。
- visual grammar（余白、色数、数字階層、地図/棒/カード）。
- stats47が独自データで再構成する案。
- 模倣リスクと差別化点。

投稿の成功理由を公開数値だけで因果断定しない。`hypothesis`として記録し、自社実験で検証する。

## 12. agent/model割り当て

| role | model | 責務 | write boundary |
|---|---|---|---|
| `trend-scout` | Sonnet | query/seed、run承認、候補選定 | proposal/report |
| collector/parser | コード + Haiku監査 | 取得、parse、欠損、重複排除 | raw observationのみ |
| `creative-pattern-analyst` | Sonnet | 上位候補の構造・差別化分析 | assessment draft |
| `instagram-strategist` | Sonnet | approved patternの自社企画化 | 自社draft、投稿しない |
| monthly critic | Opus条件付き | 競合仮説と自社実測の反証 | reviewのみ |

Opusは月次、判断衝突、高コスト施策、2回連続不発時だけ。URL正規化、parse、score、status、budgetはモデルへ渡さない。
Agent toolを実装で使う場合は`.claude/rules/agent-output-contract.md`に従い、prompt冒頭へOutput Formatを置く。

## 13. SSOT・保存先・gallery

- authored query/handle/pattern: git TS。
- raw observation: 親仕様に従いR2。Phase 1〜3は`/tmp`fixture/dry-runのみ。
- cursor/failure/lock: `.claude/state/research/competitive-intelligence/instagram/`。
- evidence image: `.local/sns-research/instagram/`、期限付きlocal-only。
- 月次判断: `docs/04_レビュー/YYYY-MM-DD-instagram-competitive-review.md`。
- 永続D1を追加しない。手編集JSONをSSOTにしない。

gallery `/research?platform=instagram`は観測値、欠損、evidence、assessment、adaptation proposalのread-only表示から始める。
投稿、like、follow、R2 push actionを置かない。自社制作への接続はapproved proposal IDだけを渡し、第三者media pathを渡さない。

## 14. status・終了コード

| code | 状態 |
|---:|---|
| 0 | 成功またはbudgetで正常打切り |
| 2 | 引数・URL・config不正 |
| 10 | login required |
| 11 | challenge / checkpoint |
| 12 | rate limited |
| 13 | private/deleted |
| 20 | selector drift / required coverage不足 |
| 30 | read-only guard blocked |
| 40 | profile lock競合 |
| 50 | cleanup失敗・browser残留 |

challenge/rate limitは自動retryしない。selector driftも連続scrollで回避しない。cleanup失敗は観測成功より優先して非0終了する。

## 15. テスト

### Phase 1（外部アクセスなし）

- canonical URL/shortcode、metric locale、format、null/zero。
- login/challenge/private/deleted/selector drift判定。
- network guardとUI allowlist。
- budget、dedup、append、baseline不足。
- screenshot pathがlocal allowlist外へ出ないこと。

### live smoke（Phase 2、人間同席）

1. 専用profileで公開permalink最大3件。
2. request inventoryを保存するがtoken/bodyは保存しない。
3. mutation request 0、禁止click 0を確認。
4. context/browser/processが終了していることを確認。
5. observationを人間が画面と照合する。

live HTMLをfixtureとしてrepoへ保存しない。手製synthetic fixtureを用い、個人情報と第三者captionを含めない。

## 16. 実装フェーズ

### Phase 0: read-only監査

- doc 31/33、本仕様、既存competitor-scan、自社IG API、gallery contractを読む。
- Playwright/profile/lock/cleanup/共通domainの再利用可否を表にする。
- コード変更、ブラウザ起動、Instagramアクセス、profile読込をしない。

### Phase 1: pure domain + fixture

- 共通domainが未実装なら先行させる。
- Instagram固有type、canonicalize、metric、format、status、budget、guardをfixtureで実装。
- browser launch、live URL、persistent profileは未実装。

### Phase 2: permalink smoke

- 専用profile/login、最大3URL、request inventory、cleanup。
- 人間同席・dry-run・`/tmp`だけ。

### Phase 3: assisted collection

- Web候補URL入力、既知handle最大3、最大15投稿。
- evidence manifest、outlier、analyst packet。persistなし。

### Phase 4: observation persistence + gallery

- 親schema/R2 append、failure cursor、gallery read-only view。
- retention、safe-local-file、第三者media遮断をテスト。

### Phase 5:継続改善

- 月次定点観測と自社Instagram metricsをpattern IDで結合。
- reach/play baseline、saves、shares、profile actionsで自社効果を判断する。
- 2回不発はhold、反証付きreview。自動投稿へ直結させない。

## 17. 受入条件

- [ ] 自社Graph APIと競合Playwrightの認証・コード・writerが分離される。
- [ ] 専用profile/lock/cleanupがあり、残留を成功扱いしない。
- [ ] mutationをnetworkとUIの二重guardで拒否する。
- [ ] null/zero、views/likes、empty/failureを混同しない。
- [ ] carousel/reel/singleを根拠付きで分類する。
- [ ] query/handle/budgetと追加・休止条件がSSOT化される。
- [ ] raw観測、分析、adaptation、自社実測が別artifactになる。
- [ ] 第三者mediaがgit/R2/制作/生成AIへ流れない。
- [ ] fixture testだけでPhase 1を完了できる。
- [ ] live smokeは3件、人間同席、dry-run、cleanup確認付き。
- [ ] galleryはread-onlyで、公開操作を持たない。
- [ ] 勝ちパターンは人間承認後、自社独自データで再構成される。

## 18. Claude Code Phase 0 prompt

```text
Output Format:
1. 読んだファイル
2. 既存資産と再利用可否の表
3. Instagram固有リスクと不明点
4. Phase 1の最小変更ファイル案
5. テスト計画
6. 変更・実行していないこと

stats47でInstagram競合調査Playwright実装のPhase 0監査だけを行ってください。

必読:
- CLAUDE.md
- docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md
- docs/02_実装計画/33_X競合調査Playwright実装仕様.md
- docs/02_実装計画/34_Instagram競合調査Playwright実装仕様.md
- .claude/rules/sns-content-standards.md
- .claude/rules/browser-use-cleanup.md
- .claude/rules/data-storage.md
- .claude/rules/docs-vs-issues.md
- .claude/rules/agent-output-contract.md
- .claude/skills/sns/competitor-scan/SKILL.md
- .claude/skills/sns/post-instagram/SKILL.md
- .claude/skills/sns/update-sns-metrics/references/platform-instagram.md
- apps/gallery/README.md

制約:
- read-only監査だけ。コード、設定、docs、stateを変更しない。
- Playwright/browserを起動しない。Instagramへアクセスしない。
- profile、cookie、token、.env.localを読まない。
- 投稿、API write、R2 write、デプロイをしない。
- git statusで既存変更を確認し、所有権を主張しない。

成功条件:
- 自社Graph APIと競合UI観測の境界が明示される。
- X版から共通化できるdomainとInstagram adapterの境界が明示される。
- Phase 1がsynthetic fixtureだけで実装可能な最小file/testへ絞られる。
- selectorや内部operation名を未検証の事実として断定しない。
```

## 19. Claude Code Phase 1 prompt

```text
Output Format:
1. 実装概要
2. 変更ファイル
3. 安全境界
4. テスト結果
5. 未実装・未検証
6. Phase 2へ進む条件

承認済みPhase 0監査を前提に、Instagram競合調査のPhase 1だけを実装してください。

範囲:
- 共通domainが既にあればimportし、無ければ勝手に重複実装せず報告する。
- Instagram permalink canonicalize/shortcode parser。
- 日本語/英語metric parserとnull/zero。
- format/status/budgetのpure function。
- network deny policyとUI action allowlistのpure判定。
- 個人情報を含まないsynthetic HTML/data fixtureとunit test。

禁止:
- Playwright browser launch、persistent context、live Instagramアクセス。
- .env.local、token、cookie、既存profileの読込。
- post-instagram/posts store/publish logのimport・変更。
- R2/state/gallery writer、SNS投稿、デプロイ。
- live HTML、第三者caption、画像、動画のrepo保存。

検証:
- 対象unit test。
- 影響workspaceのtype-check（構成上可能な場合）。
- git diff --check。
- テストしなかったものを完了扱いしない。
```
