---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-08-27
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

### [THEME-EVIDENCE-LENS-ROLLOUT-01] 白書論点レンズをテーマ横断で段階展開する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-08-24] [期日:2026-08-31]

- **owner**: `theme-researcher → theme-designer → theme-component-builder`。観測は GA4 `nav_surface=theme_evidence`。
- **実装済み基盤**: `evidence-lenses.ts` の lens/source SSOT、`ThemeCatalog.evidenceTopics`、
  source/ranking/chart/theme/tag validator、`ThemeEvidenceTopicsSection`、教育・文化の2論点、クリック計測。
  教育・文化は可視化パイロットとして、施設指標を学校/文化の2群へ分割し、重複する独立推移2件を削除、
  高等教育2系列を比較チャートへ統合済み。開発ゲートウェイはgit管理のpage-componentsをローカル優先し、
  生成直後の配置をR2 pushなしで確認できる。
- **2026-08-26 checkpoint**: 公式一次資料とactiveな内部routeを親側でも再確認し、道路2論点、医療2論点、
  鉄道2論点を追加した。医療の候補1件は観測値の既知欠陥を検出して不採択。鉄道はJR・民鉄の旅客規模と
  貨物利用を分離し、延べ輸送量と実人数、発送量とCO2削減量を混同しない注意書きを固定した。
- **2026-08-26 ports wave**: 港湾統計の公式一覧とactiveな内部routeを実測し、貨物・コンテナ利用と
  船舶旅客利用の2論点を追加した。国土交通白書のNotebookLM台帳IDは実機に存在しなかったため利用せず、
  公式HTTPS一次資料へ直接接続した。catalog / 生成物 / 対象test / data-configs・web型検査はgreen。
- **2026-08-26 living-housing wave**: 内閣府「令和7年版 高齢社会白書」と総務省統計局
  「令和5年住宅・土地統計調査」の公式URL、activeな内部routeを実測し、高齢化と住宅ストック、
  持ち家・借家の居住面積差の2論点を追加した。母集団の違いと価格・家賃・世帯人員を直接説明できない
  限界を明記し、catalog / 生成物 / 対象test / data-configs・web型検査はgreen。
- **2026-08-27 tourism wave**: 観光庁「宿泊旅行統計調査」とactiveなテーマ・ランキングrouteを実測し、
  国内・訪日客の延べ宿泊者数の地域集中を1論点として追加した。泊数を人数と同一視しないこと、
  外国人延べ宿泊者数は総数の内数で加算しないことを固定。供給・稼働率、交通・アクセス候補は
  母集団・観光目的を一次資料から確定できないため不採択。catalog / 生成物 / 対象test / 型検査はgreen。
- **2026-08-27 safety wave**: 警察庁「犯罪統計」「交通事故発生状況」とactiveな内部routeを実測し、
  犯罪認知件数と検挙率、交通事故発生件数と負傷者数の2論点を追加した。未認知事件、検挙人員割合、
  物損事故を混同せず、件数と人数を加算しない注意を固定。火災・救急、自殺・不慮事故は資料主体と
  対象定義が異なるため不採択。catalog / 生成物 / 対象test / 型検査はgreen。
- **2026-08-27 aging-society wave**: 内閣府「令和7年版 高齢社会白書」の公式2節と登録済みNotebookを
  照合し、地域別高齢化と年齢構成、高齢者世帯の構成の2論点を追加した。高齢化率は絶対数でないこと、
  世帯3指標は重なりがあり合計100%にならないことを固定。出生率、医療・介護需要、移動困難は
  一次資料・同一theme chart・active rankingの組合せ不足で不採択。catalog / test / 型検査はgreen。
- **2026-08-27 consumer-prices wave**: 総務省統計局「小売物価統計調査（構造編）」とactiveな内部routeを
  実測し、総合物価水準と家賃、食料・住居・光熱水道の価格構造の2論点を追加した。地域差指数は
  物価上昇率でなく全国平均=100の価格水準であり、費目指数は支出額・割合でなく単純加算できないことを固定。
  全国CPI等の候補は都道府県別の直接根拠不足で不採択。catalog / test / 型検査はgreen。
- **2026-08-27 manufacturing / fishery wave**: 経産省等「2026年版ものづくり白書」と水産庁
  「令和7年度 水産白書」を一次資料に、製造拠点・雇用、人員あたり出荷規模、漁獲と養殖、漁業担い手の
  4論点を追加した。関連ranking 5件・theme 3件は公開200、専用test 6件、data-configs全693件、
  catalog error 0、生成物check、data-configs / web型検査はgreen。未整備は8テーマ。
- **2026-08-27 labor / foreign-residents wave**: 厚労省「令和7年版 労働経済白書」・
  「賃金構造基本統計調査」、総務省「令和2年国勢調査」を一次資料に、労働需給、男女賃金差、
  外国人人口規模・比率、国籍構成の4論点を追加した。公式URL 3件、内部route 10件は公開200、
  専用test 6件、data-configs全699件、catalog error 0、生成物check、型検査はgreen。未整備は6テーマ。
- **2026-08-27 population / local-finance wave**: 厚労省「2024年人口動態統計」、総務省
  「人口推計 2024年」「令和7年版 地方財政白書」「令和5年度 健全化判断比率確報」を一次資料に、
  自然増減、年齢構成、財源構成、公債費・将来負担の4論点を追加した。公式URL 4件、内部route 12件は
  公開200、専用test 6件、data-configs全705件、catalog error 0、生成物check、型検査はgreen。未整備は4テーマ。
- **次**: 白書台帳に登録済みのテーマから2〜3件ずつ `/research-theme-catalog <theme-key>` を実行する。
  NotebookLM は引用付き候補抽出だけに使い、公式HTTPS URLと実在routeを確認できた候補だけ
  theme-designerが採択する。文部科学白書は公式source登録済みだがNotebookLM ID未登録なので、
  別PCで `find-or-create` / `add-source` 後に台帳へ実IDを記録する。
- **展開順**: (1) 登録済みNotebookのあるテーマ、(2) GSC流入のあるテーマ、(3) 残り。
  1テーマ1〜3論点を上限とし、同じ問い・説明・リンク集合を横展開しない。
- **計測**: 公開後56日で `theme_evidence` のtopic別クリック、遷移先、ページ回遊を確認する。
  外部白書リンクは内部CTRへ混ぜない。効果判定前にGA4 dimension台帳を確認する。
- **完了条件**: 適用可能な各ThemeCatalogが、公式sourceと1件以上の内部routeを持つ採択済み論点、
  または「白書で県別に検証できる論点なし」の明示判定を持ち、catalog/type/test/docs gateが全て通る。
- **停止条件**: NotebookLMのみの根拠、推測URL、inactive ranking、他テーマのchart key、内部route 0、
  白書名を第四taxonomy/新規URLにする案は採択せず停止する。
- **Claude Code Sonnet指示**: 「`THEME-EVIDENCE-LENS-ROLLOUT-01` の次テーマ1件だけを処理。
  research-theme-catalogの実証ゲートに従い、公式資料とrouteを検証してからThemeCatalogへ反映。
  validate:catalog、対象test、web type-checkを通し、カードの次テーマだけ更新。デプロイしない。」

### [ASP-CONTINUITY-01] afb の承認追跡と広告コード取得 (オーナーのログインが要る分)

タグ: [収益化] [種類:改善] [実行:ユーザー] [検証:node --test .claude/scripts/ads/__tests__/*.test.mjs] [起票:2026-07-28]

- **owner**: uruhayato373 (afb の手動ログインと `--commit` 承認)
- **★2026-08-21 に前提を実測し直した。カードの旧記述は誤りだった**:
  - 「Playwright プロファイルがオーナー側にある」→ **この Windows 端末に実在する**
    (`.local/playwright-{a8,afb,moshimo}-profile`。a8 は 282MB)。
  - **もしもはセッションが生きており、read-only 走査がこの端末で通る**。実測:
    提携中 39 行 / ID 39 件、申請中 37 行 / ID 37 件、SID 638943 (stats47) の assert ok、
    行数と ID 数のパリティ一致、幻 ID 検出なし。ドリフト 29 件を検出
    (申請中のはずが実機に無い 28 件 = 却下か走査漏れ / 提携中のはずが無い 1 件 = 提携終了の可能性)。
  - **afb だけがセッションを持ち越せない** (`sessionPersistsAcrossProcesses: false`)。実測で
    180 秒待っても `requiredlogin` から抜けず、1 バイトも読めなかった。**ここが唯一の構造的な
    オーナー工程**で、3 ASP をまとめて「オーナー待ち」と扱っていたのが誤りだった。
- **★backlog-loop では閉じない**: afb は run のたびに人のログインが要る。CI にはどちらも無い。
- **残り (オーナー工程)**:
  1. afb に手動ログインして `affiliate-status.mjs --asp afb` を通し、applying/partnered を確定する。
  2. もしもの検出ドリフト 29 件を人が確認し、`affiliate-status.mjs --asp moshimo --write` で台帳を直す
     (却下と走査漏れは機械では区別できない)。
  3. 提携申請の `--commit` 承認 (規約同意を伴う不可逆操作)。手順は下の機械ゲート経由。
  4. harvest → SSOT 登録 → 公開は、それぞれ別に承認する。
- **完了条件**: afb の applying/partnered が台帳と一致し、もしものドリフトが 0 になり、
  承認済みの申請が journal に `confirmed` として残る。
- **停止条件**: login 要求、captcha、selector 数不一致、pagination 不明、plan hash 不一致、
  lock 競合、site/program 不一致のいずれかで停止する。
- **正典**: `.claude/rules/affiliate-ads-standards.md` §11 /
  `docs/02_実装計画/42_アフィリエイトPlaywright継続運用・安全化実装仕様.md`

### [AFF-INTENT-FRICTION-PORTFOLIO-01] 低ハードル・高意図案件を二層で検証できるアフィリエイト基盤

タグ: [収益化] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/ads/__tests__/*.test.mjs] [起票:2026-08-20]

- **owner**: Claude Code Sonnet（通常実装は high。work package ごとに1回ずつ実行）
- **再開ポインタ**: `nextWorkPackage=WP0` / `lastCompleted=none`。各WPは完了条件の検証後にだけ
  `lastCompleted`と`nextWorkPackage`を更新する。長い実行ログは残さず、検証コマンドと結果を1〜3行で記録する。
- **目的**: 報酬単価中心の候補選定を、`vertical × discovery/decision × 行動負担 × 確定収益`で
  検証できるポートフォリオへ改める。高単価案件は高意図ページに残し、低ハードル案件は別レーンで
  一つずつ試す。枠数・クリック数の最大化を成果にしない。
- **実測ベースライン (2026-08-20)**:
  - 配信SSOTは260エントリ。A8 catalogは205案件（registered 120 / approved 25 / applied 44）、
    報酬168・EPC178・確定率184案件に値があるが、成果条件・action type・frictionは無い。
  - 3 ASP catalogは226案件、approved 74。approvedのEPC・確定率は0件で、rewardYenだけが主な経済情報。
  - GA4は直近snapshotで12,020 viewable impression / 3 click。`measurementGate`は
    `ga4-variant-dimension-missing`でblocked。取得器の最上位dimension tierが`ad_id`を取る代わりに
    experiment/variantを含めないため、登録状況だけでなくquery設計も切り分ける必要がある。
  - A8成果SSOTはsite-summaryならstats47単独、program-detailは口座横断。共用案件をstats47単独成果へ
    配賦してはならない。`programIdMap`は広告SSOTの`mid=`から導出できるため二重手編集を解消できる。
    現時点で`.claude/state/metrics/affiliate/{a8-results,a8-report-log}.json`は未生成。A8の既定期間は
    年初から当月までの累計で、normalizerは単月でなければ月次recordsへ写さない。期間フォーム対応前に
    CV・確定額を0または当月実績として扱わない。
- **2026-08-26 WP0 checkpoint**: GA4取得を`overview` / `experiments` / `pages`の独立reportへ分離し、
  ad_id tierの成功がvariant取得を隠さないfallbackと標準`pagePath`→page type導出をpure core + fixtureで固定。
  実験判定は「95%有意」を廃止し、sample・期間・measurement freshness・confound guardを通った場合だけ
  `ready-to-decide`として人間へ提示する契約へ統一した。広告script全201 test、追加core 27 test、
  operations state validateはgreen。実stateは`ga4-variant-dimension-missing`で正しくblocked。
  A8 `--probe-period`はread-only起動したが未ログインを検出して入力・クリック前に停止したため、
  月/日レンジselectorと`outcomeGate`のfixture化は未完了。`nextWorkPackage=WP0`を維持する。
- **依存・競合回避**:
  - standalone Claude CodeとCodexを同じ作業ツリーで同時実行しない。開始時に対象fileがdirtyなら
    別worktreeを作るか、現在の変更を所有者がcommitするまで停止する。`git add -A`は禁止。
  - `ASP-CONTINUITY-01` Phase 2のeligibility / `targetRankingKeys` fail-closedを再利用し、同じgateを作らない。
  - `AFF-IMPRESSION-ROUTING-01`と`blog-inbody-format`が未判定の間は公開pilotを開始しない。
    基盤・read-only state・管理画面までは実装可。既存実験と同じページ/枠を同時変更しない。

#### WP0 — 現行契約と計測断絶の固定

1. `git status`、広告state、active experiments、A8結果の鮮度を取得し、同じコマンドで再現できるbaselineを残す。
2. `fetch-affiliate-ga4.cjs`を広告別・実験別・ページ別の独立reportへ分ける設計をfixtureで固定する。
   richest tierが先に成功してvariant内訳を隠す現在の構造を廃止する。標準`pagePath`からpage typeを
   決定的に導出し、不要なcustom dimensionを増やさない。
3. `manage-affiliate-experiment`の「95%有意」と`evidence-based-judgment`の「snapshot 1点へ統計的有意性を
   導入しない」の不整合を解消する。採択は達成率・noise floor・sample/freshness/confound guardを使う。
4. A8期間フォームの月レンジ/日レンジを推測で操作せず、`--probe-period`の観察結果からselector、要求期間、
   CSVファイル名の実期間をfixture化する。成果SSOT未生成と累計期間を`outcomeGate=blocked`の理由として保持する。
5. 現在のコードとrulesの配置表を突合する。とくに未commitのtheme/ranking末尾枠変更を推測で上書きしない。

- **完了条件**: query fallback事故、variant欠落、旧schema混入、stale sourceを両方向fixtureで再現し、
  WP1以降が読むbaseline、measurement gate、outcome gateが決定的になる。

#### WP1 — 型付きoffer catalogとprogram参照

1. `apps/web/scripts/affiliate-offer-profiles-data.ts`を、安定した人手判断だけを持つgit TS SSOTとして追加する。
   最小fieldは`programRef`（`a8:<programId>`等）、`vertical`、`lane`、`actionType`、`frictionTier`、
   `conversionCondition`、`personalDataLevel`、`humanContact`、`conditionSource`、`verifiedAt`、
   `portfolioStatus`、`allowedPageTypes`。報酬・EPC・確定率など変動値は持たせない。
2. `AffiliateAd`へ`programRef`を追加し、export時にoffer profileをjoinして配信snapshotへ必要最小限をdenormalizeする。
   複数creative/placementへ成果条件を複製しない。
3. A8の既存`programIdMap`/`mid=`からprogramRef候補を機械生成する。action/frictionは案件名から自動確定せず、
   未確認を`unknown`として一覧化する。もしも/afbも識別子を推測しない。
4. `affiliate-catalog.json`と`a8-catalog.json`は状態機械として維持し、offer catalogへ統合しない。
   authored判断・運用状態・配信creativeの3責務をvalidatorで分離する。

- **変更候補**: `apps/web/src/features/ads/types/index.ts`、`affiliate-ads-data.ts`、
  `export-affiliate-ads-snapshot.ts`、新規`affiliate-offer-profiles-data.ts`、
  `.claude/scripts/ads/lib/affiliate-offer-core.mjs`とtest。
- **完了条件**: programRef一意性、参照先存在、vertical一致、成果条件の出典・日付、lane/friction整合を検査し、
  `unknown`をdiscoveryへ流すmutation testが失敗する。既存広告の見た目と解決順は変えない。

#### WP2 — 採用gate・候補生成・実験隔離

1. `discovery`と`decision`を別キューにし、同じ重み付きscoreへ混ぜない。raw rewardだけで並べず、
   文脈一致→条件確認済み→lane適合→確定EPC/確定率の順でPareto候補を提示する。値不明は0へ変換しない。
2. discoveryはF0〜F2かつsensitive personal dataなし、decisionは`targetRankingKeys`または直接配置必須。
   ブランド適合がreview/blocked、成果条件がstale/unknown、共用口座成果しかない案件はpilot不可。
3. experiment variantを通常readerから除外し、実験対象外の枠へ漏らさない。target指定広告を非ranking文脈へ
   出さないfail-closedは`ASP-CONTINUITY-01`のpure coreを利用する。
4. agentは候補を1件提示するだけ。apply、winner反映、priority変更、公開は自動化しない。

- **完了条件**: 高単価F4がthemeへ出ない、F1が文脈不一致で出ない、experiment variantが通常枠へ出ない、
  unknownが候補上位にならないことをresolver/core testで固定する。

#### WP3 — GA4・ASP成果・portfolio state

1. GA4 snapshotをschema v3へ上げ、`overview`（ad/vertical/position）、`experiments`、`pages`を別配列で保持する。
   各reportのdimension可用性を個別gateにし、一つのfallback成功で他の欠落を隠さない。
2. A8のnormalized SSOTを`programRef`でjoinする。site-summaryはサイト総額、program-detailはaccount-wideと明記し、
   shared案件は広告別勝敗から除外する。もしも/afb成果が未取得なら`unknown`理由を保持する。
   A8収集器へ明示期間を追加し、要求期間とCSVファイル名の実期間が完全一致した単月データだけを月次成果へ
   upsertする。期間不一致、累計、欠損はfail-closedとし、既存raw CSV/manifestはappend-onlyを維持する。
3. `.claude/state/ads/affiliate-portfolio-latest.json`を生成する。program/offer/ad/placement別に
   viewable imp、click、CTR、CV、確定率、確定額、確定収益/1,000 viewable imp、source/freshness/qualityを持つ。
   これは派生stateであり手編集禁止。
4. `affiliate-operations-latest.json`へportfolio gateとrecommendedActionsを追加する。stale、scope mismatch、
   missing programRef、outcome unavailableを明示し、0へ丸めない。

- **変更候補**: `fetch-affiliate-ga4.cjs`、`affiliate-operations-core.mjs`、
  `build-affiliate-operations-state.ts`、新規`build-affiliate-portfolio-state.ts`、A8 report map生成/check、関連tests。
- **完了条件**: 同一fixtureで広告別CTRと実験別CTRを同時取得でき、A8 shared/account-wideをstats47単独へ
  誤配賦するmutationが落ちる。state schema validatorが欠損理由を要求する。

#### WP4 — agent・skill・管理UI・自動化・文書

1. `affiliate-manager`をoffer catalogの排他writer、`affiliate-operator`を成果条件・ASP条件の取得者、
   `ga4-analyst`をGA4、`a8-report-collector`を成果CSV、`improvement-triage`をeffect判定として維持する。
   `asp-scout`はaction/frictionを推測確定せず`pending-classification`を返す。
2. 新skillを増やさず`affiliate-improvement`へ`portfolio/classify/next`を追加し、
   `register-affiliate-banner`はprogramRefとoffer profileが無い新規active広告を拒否する。
3. `apps/admin/app/ads`をread-onlyの運用入口にし、measurement gate、未分類、二層portfolio、実験、
   確定収益、stale/unknownを表示する。単体HTML dashboardは同じpure view modelから生成し二重判定を持たない。
4. 週次workflowはstate生成・候補提示まで。ASP申請、SSOT書換え、winner反映、push/deployを含めない。
   workflow healthの対象にportfolio state freshnessを追加する。
5. 恒久判断は収益化戦略/affiliate rules、反復手順はskills、機械値はstate、active施策はimprovementsに分離する。

- **完了条件**: agent/skill consistency、dashboard/admin parity、workflow安全境界、automation inventory、
  analytics event台帳、docs governanceがgreen。read-only UIから外部変更できない。

#### WP5 — 公開pilot（別承認・1実験ずつ）

1. 既存提携・既存配信中のA8案件から、成果条件を実機確認でき、stats47専用成果へjoinできる候補だけを使う。
   health/高リスク金融/個人情報の重い案件は初回pilotから除外する。候補不足なら新規申請せず停止する。
2. 検索需要と文脈があるranking/blogの一つを選ぶ。theme/category/homeへ新しい枠を足さない。
   同じ位置で`discovery`対`decision`を比較し、各variantをexperiment専用に隔離する。
3. UIは既存コンポーネントを再利用し、広告をカード化・複数段積み・クリック誘導しない。1 decision momentに
   主CTAは一つ。mobileで追加表示しない。PR表記とASP creative規約を守る。
4. registryへ期間、minimum sample、成果確定待ち、primary metric、UX guard、停止条件を事前固定する。
   CTR勝者を収益勝者と扱わない。直近12,020 impression / 3 clickを基準に必要click/impと推定日数を先に算出し、
   最大期間内に判定母数へ届かない場合は`not-feasible`として公開しない。

- **開始gate**: measurement/portfolio ready、variant取得可、programRef coverage、A8成果fresh、既存同枠実験なし、
  オーナーの案件・ページ・push承認。
- **完了条件**: 対象test、web/admin type-check、SSGを含むweb build、compliance、主要routeのlocalhost目視がgreen。
  deploy/R2/ASP操作はこのカードを承認と解釈せず、実行直前に別確認する。

#### WP6 — 観測・判断・横展開

1. 事前固定したsample・duration・outcome maturityに達するまで`effect/pending`。重複窓や別施策混入はconfounded。
2. 主指標は確定収益/1,000 viewable imp。CTR、CVR、確定率、imp/pageview、engagement・内部回遊は説明/guard。
3. 勝者は人間へ提示し、1ページ→同意図クラスタの順に拡大する。負け/判定不能でも自動停止・priority変更しない。
4. 実験決着後はimprovement-logへ根拠を残し、active行と完了カードを規約どおり削除する。

- **完了条件**: source、取得日、再現コマンド、before/after、guard、判定不能理由を持つverdictが生成され、
  次の1実験だけがrecommendedActionになる。

- **横断検証**:
  `node --test .claude/scripts/ads/__tests__/*.test.mjs` / 広告関連vitest /
  `npm run type-check --workspace apps/web` / `npm run type-check --workspace apps/admin` /
  `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --json --check-size` /
  `npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --check` /
  `npm run docs:fix` / `npm run docs:check` / `npm run docs:check:all`。WP5だけfull web buildを追加する。
- **停止・禁止**: unknownの推測補完、rewardだけの自動採用、複数pilot同時開始、既存dirty差分のrestore、
  外部ASP申請、GA4管理設定、R2 write、commit/push/deploy、winner/priority自動反映は、個別の明示承認なしに行わない。
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` / `.claude/rules/affiliate-ads-standards.md` /
  `docs/02_実装計画/42_アフィリエイトPlaywright継続運用・安全化実装仕様.md` /
  `.claude/rules/evidence-based-judgment.md`。

#### 別PC・新規セッションからの再開プロンプト

次の短いpromptをClaude Code Sonnet（effort: high）へ貼る。詳細は本カードを正典として読み、prompt本文へ複製しない。

```text
CLAUDE.mdを読み、.claude/todo/backlog.md の AFF-INTENT-FRICTION-PORTFOLIO-01 を全文確認してください。
再開ポインタの nextWorkPackage だけを対象に、計画の説明で止まらず、実装・対象テスト・型チェック・短い進捗記録まで完了してください。
開始時に git status と対象ファイルの既存差分を確認し、他者のdirty変更と重なる場合は上書きせず停止してください。
カード記載のagent/skill、変更候補、完了条件、停止条件、横断検証を守り、既存pure coreとSSOTを再利用してください。
完了条件を実測できた場合だけ lastCompleted と nextWorkPackage を更新し、未検証を完了扱いしないでください。
ASP申請、GA4管理画面変更、R2 write、commit、push、deploy、winner/priority反映は別の明示承認なしに実行しないでください。
最後に、成果、変更ファイル、検証結果、既存問題、未完了、次のWPを簡潔に報告してください。
```

### [CROSS-PAGE-DATA-SSOT-01] テーマ・ランキング・ブログのデータ／単位／配色SSOT統合

タグ: [進行中] [起票:2026-08-13]

- **owner**: Claude Code
- **trigger**: Claude CodeへこのIDを指定したTask Capsuleを渡し、WP0から順番に実装する。
- **目的**: テーマ、ランキング、ブログのチャートを、同じ `MetricConfig → 取得・変換 → R2 snapshot`
  から読む構成に統一する。単位換算は取り込み時に一度だけ行い、配色は意味ロールから解決し、
  取得・変換・監査の対象集合を同じ依存抽出器で決める。
- **採用する最終形**:
  `git TS (MetricConfig / ThemeCatalog / unit semantics / color roles) → build時検証 → e-Stat取得・変換 → R2 → 全ページ`。
  本番 `apps/web` からe-Statを直接呼ばない。ThemeCatalogに生のe-Statパラメータ、倍率、色コードを持たせない。
- **実測ベースライン (2026-08-13)**:
  - ThemeCatalogは20テーマ・113 chart。87 chartが生の`estatParams`を持ち、`relatedRankingKeys`ありは3 chartだけ。
  - ThemeCatalogのcolor系pathに生の色値179箇所・14色があり、webと`packages/visualization`にも別paletteがある。
  - テーマの本番取得経路にe-Stat直呼びが残り、CPI等は規約で禁止済みの`cdArea`も送る。
  - catalog validatorはerror 0 / warning 194。現行live監査は130 requestを検査するが、catalogから機械抽出した
    期待集合158 requestのうち28 requestを列挙できず、population pyramidの34 category requestもcatalog外にある。
  - unit SSOTとmirrorは一致し、unit test 32件、metric config 2,295件のerrorは0。ただし金額347 metricの監査は
    mismatch 42 / unknown 300で、42件の是正は`MONEY-UNIT-SCALE-01`に分離済み。
  - ranking値はactive 2,173件のshape violation 0まで回復したが、normalized artifact欠落1件、
    既知のstale delivery 14件が残る。blog SVGは1,062枚中、lineage完備938、未復元124、provenance defect 23。
- **WP0 再計測 (2026-08-13)**: pure collector `packages/data-configs/src/theme-catalog/baseline-collector.ts`
  で実行時 THEME_CATALOGS から決定的に再計測。テスト `__tests__/baseline-collector.test.ts` が
  shrink-only (生estatParams/生色) と grow-only (relatedRankingKeys) の ratchet で固定。
  - 一致確認 (baseline 不変): themes 20 / charts 113 / 生estatParams chart 87 / relatedRankingKeys chart 3 /
    生色 179箇所・14色。
  - **migration 注意 (実測で確定)**: 社会・人口統計体系テーブル (statsDataId 000001020x) の cat01 コードは
    `#A0160102` / `#D0210101` / `#F01201` のように **`#` 前置が e-Stat の実コード**。本番キャッシュで
    STATUS 0・単一カテゴリに正しくフィルタされ distinct な値を返すことを 3 テーブルで確認済み
    (foreign-residents 東京2020: 中国 1393.4 / 韓国 565.3 / 総数 3441.0)。**欠陥ではない**ので R2 移行時に
    `#` を strip しない (charts が壊れる)。
  - 本番 `apps/web` の `@stats47/estat-api` **直接値 import は 10 ファイル**
    (`import type` の RankingChart / prefetch-theme-kpi と、インライン import 型のみの fetch-db-chart-data は
    直呼びではない)。WP2 の境界 CI check の縮小対象。
- **WP1 完了 (2026-08-13)**: `theme-catalog/stat-series-ref.ts` に目標参照モデル `StatSeriesRef`
  (metricKey/year/area/label/colorRole・変換式なし) と `ChartColorRole` (WP5 拡張)、現行 componentProps の
  chart 種別ごと discriminated-union 検証 `validateChartProps` (exhaustive・未知種別 error) を新設。
  `validate-theme-catalog.ts` に `[chart-props]` として配線 (従来は union membership しか見ず必須フィールド
  欠落を素通りしていた)。実データ 113 chart 誤検知 0・validate:catalog error 0・data-configs tsc 0。
  全 9 componentType が StatSeriesRef で表せることを fixture 固定 (WP6 移行の受入基準)。テスト 22 件。
- **WP2 境界ゲート先行 (2026-08-13)**: `.claude/scripts/lib/check-web-estat-imports.cjs` を新設し
  `pr-quality-check.yml` に配線。本番 `apps/web` の e-Stat 直接値 import (現行 10) を **shrink-only
  allowlist** で監視し、新規直呼びを CI で弾く (最終形 0)。値/型/インライン import の分類は文境界ガード付き
  (テスト 12 件で誤検出両方向を固定)。**caller の R2 reader 移行本体 (allowlist 縮小) は WP6 で、
  runtime e-Stat cache/action の削除も caller 0 後**。
- **WP4 core (2026-08-13)**: 依存抽出の共通 collector `theme-catalog/chart-dependencies.ts`
  (`collectChartDependencies` / `collectThemeDataDependencies`・exhaustive switch・**未知種別 throw**) を新設。
  pyramid の 34 (年齢×性別) 依存は app fetch にハードコードされ catalog から列挙不能だったので、
  SSOT `theme-catalog/population-pyramid-deps.ts` に移設し **app `fetch-population-pyramid.ts` と collector が共有**。
  これで期待依存集合が完全列挙可能に (**総 258 / distinct 192 request**・旧 live 監査の 158＋列挙不能 28＋
  pyramid 外を解消)。donut category / composition segment / CPI statsDataId / pyramid code の陰性対照をテスト固定
  (theme-catalog テスト計 41)。apps/web tsc 0。
- **WP4 完了 (2026-08-13)**: 三者一致を配線した。正典 `collectThemeDataDependenciesWithProvenance` から
  機械生成する JSON 依存ミラー `.claude/scripts/audit/theme-chart-dependencies.generated.json`
  (generator `generate-theme-dependency-mirror.ts --check`・unit-semantics と同型の二層 SSOT) を新設し、
  素の node で走る live 監査 `theme-chart-live-audit.mjs` の母集団を**このミラー全件**へ切替えた
  (旧: page-components から独自抽出 130 request → 新: 192 distinct・pyramid 34 を含む)。監査の成功条件を
  「取れた分が成功」→「**期待集合=実集合かつ全件成功**」に変更 (limit 無し時 `coverageOk`)。
  `pr-quality-check.yml` に Theme Dependency Mirror Gate を配線。ミラー破損で `--check` 落ち・restore で
  緑を実測、live e-Stat 5 件 smoke で pyramid が初めて監査対象に入ることを確認。三者一致 =
  validator (catalog well-formed) × generate:catalog --check (catalog==page-components JSON) ×
  mirror gate (mirror==collector 出力) → 監査は mirror 全件。テスト計 44 (mirror parity + provenance 3)。
  **残 (WP6): 全 192 request の live 全件緑は e-Stat 実照会が要る (read-only・cron が担う)**。
- **survey taxonomy 横断 checkpoint (2026-08-22)**: `survey-taxonomy.ts` を共通 resolver とし、
  ranking / ThemeCatalog 113 chart / 公開 blog chart を同じ survey master へ接続。master 80、ranking active
  2,164 件中 1,924 解決 (88.91%)、theme は適用対象 89/89 解決 (100%)、blog は 1,087 chart 中
  resolved 733 / unresolved 99 / missing-lineage 179 / not-applicable 76。週次全量監査・PR offline freshness・
  shrink-only ratchet・双方向 UI / GA4 計測まで実装済み。blog lineage 再監査は 1,089 枚中 source+json 983 / neither 106、
  source provenance defect 22。残件は推測で survey を付けず、本項目 WP6 と既存 lineage queue で縮小する。
- **WP5 core (2026-08-13)**: 色 semantic role の SSOT `theme-catalog/chart-color-role.ts`
  (`CHART_COLOR_ROLES` 20 role + web resolver `resolveChartColorCssVar` + static/SVG resolver
  `resolveChartColorHex`)。両 resolver が同 role 集合を実装する parity をテスト固定
  (`Record<ChartColorRole,string>` でコンパイル時 parity も保証)。`ChartColorRole` を本ファイルに一本化。
- **WP5 完了 (2026-08-13)**: 生色 179→0 を移行した。**catalog (SSOT) は色 role・生成物 page-components は
  解決済み hex** という二段構成にし、生成器 `transform.chartToPageComponent` が
  `resolveComponentPropsColors` で色キー文脈の role → hex を解決する。移行は予約 8 色 → semantic role /
  追加 6 色 → series-7..12 (role パレットを 14→20 に拡張)。**`generate:catalog --check` の golden diff が
  byte 一致 = app側renderer入力のconfig回帰0を証明**（実ブラウザの描画回帰までは証明しない。179置換後にpage-components /
  indicator-sets とも git diff 空）。生色の再混入は validator `[raw-color]` (error) と WP0 ratchet
  (rawColorPlaces=0) が CI で弾く (mutation で発火・restore で緑を実測)。色キーの正典 (COLOR\_\*\_KEYS /
  COLOR_VALUE_RE) を chart-color-role.ts に一本化し baseline collector と共有。web/static resolver parity
  (WP5 core) 済。data-configs 508 test / tsc 0・apps/web tsc 0。
  **レビュー指摘 2 点を是正 (2026-08-13)**: ① validator が未知 role (typo) を素通ししていた
  (resolveComponentPropsColors が未知値を pass-through するため壊れた色文字列が焼き込まれる) →
  `collectColorFieldViolations` + `[color-role]` error を追加し raw-color / unknown-role の両方を弾く
  (mutation で発火実測)。② 逆写像 test が移行後の空 baseline を走査して空振り green になっていた →
  移行前 14 色の固定 fixture で role→hex の hex 再現を閉じ、別途「live catalog の生色 0」を不変量として固定。
  **owner 判断 (resolver 去就)**: 生成時 hex 解決を最終形とした結果 CSS resolver の consumer と
  `--chart-<role>` token は 0 件。(A) done_when「web/static parity」節を満たすため保持し WP6/7 で CSS-var
  追従 (テーマ追従チャート=新挙動・visual-gated) を採用 / (B) 削除して CSS-var 追従を別提案にする、の分岐。
  現状は (A) で保持 (parity テストが採用時の一致を保証する契約)。
- **WP3 core (2026-08-13)**: 単位比較 classifier `unit/unit-comparability.ts`
  (`classifyUnitComparability` → same/convertible/incomparable+reason)。unit-semantics を正典に、
  %/‰・分母あり/なし・両側指定した月額/年額 (period)・次元違い・解釈不能を理由付きで拒否するcoreを追加。
- **WP3 classifier 是正 (2026-08-13・concurrent review 指摘)**: 再監査で見つけた取りこぼしを test-first で是正:
  ① **分母が両方あって中身が違う** (人口10万対 vs 人口1万対) を hasDenominator boolean 一致だけで
  「same/factor 1」にしていた → normalized の括弧内を比較し差があれば incomparable。
  ② **片側だけ period** (monthly vs 不明) を素通しで same にしていた → 片側のみ提示は「同じ」と確認できず
  incomparable に倒す。非空 fixture で両方向固定 (11 test green)。
  ③ **公開 entry を追加** — `src/unit/index.ts` バレルを新設し `@stats47/data-configs/unit` から classifier を
  公開 (既存の conversionFactor importer は後方互換・product-factory tsc 0)。
  **残 (WP3 の別スコープ)**: SI 接頭 (km↔m=1000) と計数語 (件↔回) の誤 factor 1 は **parseUnit/unit-semantics
  側の限界** (classifier は parseUnit の次元・スケールを信頼するだけ)。実測で active config に裸の SI 接頭単位は
  0 件のため theoretical。修正は unit-semantics 正典 + 鏡再生成を伴うため別途 (必要な metric が出たら着手)。
  **production consumer は WP6 の `WrittenStatsMeta` 焼き込み時に接続** (R2 再生成を伴うため remote-gated)。
  **`sourceUnit`/`valueScale` の `WrittenStatsMeta` 焼き込み (取り込み時一回) と
  consumer 二重変換の縮小 ratchet は R2 再生成を伴うため残 (WP6・`MONEY-UNIT-SCALE-01` 依存)**。
- **WP6 wave 1 (2026-08-26)**: `kpi-lf-current-balance`を旧APIとR2で48地域比較し、値・年・unit・
  欠測の差分0を確認して`seriesRefs`へ移行した。QG2 parser付きの共通R2 readerを使い、直API fallbackはない。
  生参照chart 78→77、request 241→240、typed metric ref 6→7。data-configs 669 test、対象web test、
  両package型検査、catalog / 生成物 / 依存mirror gateはgreen。地方財政の本番routeはbespoke dashboardなので、
  このwaveはcatalog依存の移行でありroute本体のreader置換とは数えない。年度集合が一致しないline候補は移行しなかった。
- **依存**:
  - `MONEY-UNIT-SCALE-01`: `sourceUnit` / `valueScale` / 取り込みゲート / R2再生成を再利用し、同じ変換表を作らない。
  - `RANKING-VALUES-PARTITION-INTEGRITY-01`: `MetricRecipe` / shape gate / configHash監査を再利用する。
  - `CHART-LINEAGE-RESIDUAL-01`と`TILEMAP-LINEAGE-01`: blogの手動同定が必要な残件は各項目の停止条件を優先する。
- **実装規律**:
  - 既定はClaude Code単独、子agent 0。並行化する場合も同じworking treeのwriterを複数起動しない。
  - 最初に失敗する契約test / mutation testを置き、そのtestが意図した欠陥で落ちることを確認してから実装する。
  - 最終形はR2 snapshot参照へ一本化する。移行中だけ既存`estatParams`を読み、追加禁止・件数縮小のratchetを置く。
  - 実データを推測で補完しない。SSOTから再現できないchartは直APIへ逃がさず、対象keyと不足軸を報告して停止する。
- **実行順**:
  1. **WP0 — ベースラインと境界testを固定**
     - dirty worktreeを確認し、この項目と無関係な差分を編集・stageしない。
     - 上記件数を再計測するpure collectorを先に作る。ThemeCatalogのchart種別ごとのdependency数、
       生`estatParams`数、生色値数、本番e-Stat import/call数をtest fixtureへ固定する。
     - 陰性対照としてdonutのcategory、CPIのtop-level params、pyramidの1 category、倍率、色ロールを1つずつ壊し、
       対応するgateが落ちることを確認する。baselineは欠陥を許可する上限であり、新規追加を許すallowlistにしない。
  2. **WP1 — chart data参照の型を単一定義化**
     - `packages/data-configs`に、R2上のmetricを指す型付き`StatSeriesRef`を置く。最小フィールドは
       `metricKey`、必要時の`year` / area selection、表示label、`colorRole`とし、データ変換式は参照側へ書かない。
     - ThemeCatalogの各chart component propsを`Record<string, unknown>`任せにせず、chart種別ごとのdiscriminated unionで検証する。
     - 時系列、複合軸、構成比、donut、CPI profile、population pyramidを同じ参照モデルで表せるかを
       representative fixtureで先に確認する。既存metricで表せない系列は、git TSにMetricConfigまたは型付きderived recipeを追加し、
       R2へ生成する。ランキング表示の必要がないmetricを無理に公開ランキング化しない。
  3. **WP2 — 読み取りをR2へ統一し、本番e-Stat直呼びを廃止**
     - `packages/stats-r2`の共通readerへ、metricKey / year / areaで値とmetaを読むAPIを置く。
       theme、ranking、blogのadapterは同じreaderと同じ欠測規則を使う。
     - `fetchEstatData.ts`、theme dashboard actions、indicator year、timeseries、population pyramid等のcallerを
       chart種別ごとの小さいwaveで置換する。callerが0になってからruntime e-Stat cache / actionを削除する。
     - `apps/web`のproduction sourceから`@stats47/estat-api`のvalue importまたはe-Stat endpoint呼び出しを検出したら
       CIを失敗させる境界checkを追加する。CLI、取り込みscript、test fixtureは明示allowlistに限定する。
  4. **WP3 — 単位と変換を取り込み時一回に固定**
     - `MONEY-UNIT-SCALE-01`の`sourceUnit` / `valueScale`を先に完了し、`WrittenStatsMeta`へ
       source unit、stored/display unit、適用scale、period semantics、recipe hashを焼く。
     - readerとchart formatterはmeta / MetricConfigのunitを使う。chart propsの自由記述unit、consumer側の倍率、
       `display.conversionFactor`による二重変換を新規禁止し、必要な互換処理は縮小ratchet下へ置く。
     - 金額の10倍/1,000倍だけでなく、`%`対割合、人口10万対、月額対年額、分母違いのmutation testを追加する。
       比較不能な系列は自動換算せず、共通unit classifierが理由付きで拒否する。
  5. **WP4 — 依存抽出と監査母集団を共通化**
     - `collectThemeDataDependencies`をpure coreとして一箇所に置き、catalog validator、snapshot generator、live/R2 auditが
       同じ集合を使う。chart種別のswitchはexhaustiveにし、未知種別はskipせずerrorにする。
     - donut、CPI、pyramidを含む全系列について、存在、year、area coverage、shape、unit、recipe/config hash、provenanceを検査する。
       監査の成功条件は「取得できたrequestが成功」ではなく「期待集合と実集合が一致し、その全件が成功」とする。
     - warning 194は一括抑制せず、selection provenance、sortOrder、primary orphan、重複を種類別に修正し、0または
       根拠・期限付きallowlistへ縮小する。polarity未割当は推測で埋めず、配色に必要なものから根拠付きで確定する。
  6. **WP5 — 配色をsemantic roleへ統一**
     - 連続・発散choroplethは既存`color-scheme-policy.ts`を正典として維持する。
       categorical / semantic chart用に`ChartColorRole`を共有型として追加し、ThemeCatalogはroleだけを保存する。
     - webはCSS custom property、server/static SVGは決定的な固定値resolverを使う。両resolverが同じrole集合を実装するtestを置く。
     - `ChartPalette.ts`、`packages/visualization`のpalette、各chart内のliteralは共通resolverのadapterへ縮約する。
       地図ライブラリ、外部ブランド、生成済み静的asset等の例外は理由付き・file単位allowlistにする。
     - ThemeCatalogの生色値179箇所を0へ移行し、raw color追加をCIで拒否する。視覚的な意味やコントラストを変える場合は
       representative chartをlocalhostで比較し、意図しない色順・正負反転・凡例不一致がないことを確認する。
  7. **WP6 — データとblog lineageを回復**
     - normalized artifact欠落1件とstale delivery 14件を、既存refresh / sync経路で再生成できる状態へ直す。
       dry-runと対象key一覧を先に出し、remote R2 writeは承認後に一回へまとめる。
     - ThemeCatalog 87 chartを、line/KPI → mixed/composition → donut/CPI → pyramidの順でR2参照へ移行する。
       各waveでlegacy件数が単調減少することと、表示値・年・unit・欠測注記のbefore/afterを確認する。
     - blogは既存lineage復元scriptを使い、未復元124とprovenance defect 23を機械復元可能・手動同定・削除/差替え判断へ分類する。
       SSOTに値がないものはSVGから逆算せず、既存の残件項目へ対象keyと次の調査だけを残す。
  8. **WP7 — 最終gate、恒久文書、外部反映preflight**
     - 関連package test、unit mutation、catalog validator、config/year/polarity、money unit、ranking integrity、blog lineage、
       design-system/color gate、全package type-checkを実行する。runtime/SSG/R2 schemaに触るため最後にweb full buildも行う。
     - 恒久化した境界だけをデータアーキテクチャ、unit semantics、theme catalog、metric config、R2設計の既存SSOTへ反映する。
       一時的な監査全文や長い作業promptをdocsへ残さない。文書変更後は`docs:fix`、`docs:check`、`docs:check:all`を実行する。
       既存の無関係なwarningだけが残る場合は勝手に直さず、開始時との差分が0であることと内容を報告する。
     - 変更file、検証結果、legacy残数、R2対象key、rollbackをpreflightとして提示し、owner承認までcommit/PR/deploy/
       workflow dispatch/R2 writeを実行しない。承認後も外部反映は一回にまとめ、反映後auditで閉じる。
- **停止条件**:
  - money unitの不一致が42件から大きく増える、または変換を一意に決められない。
  - ThemeCatalogの期待dependency数が理由なく減る、未知chart種別が現れる、mutationでgateが落ちない。
  - R2参照化で同じ指標・年・母集団を再現できず、公開値の意味を変える判断が必要になる。
  - backward compatibleに読めないR2 schema変更、ユーザー差分との競合、secret不足、remote write/deployが必要になる。
  - 上記では直API fallback、推測、allowlist拡大をせず、対象key・証拠・選択肢を提示してowner判断を待つ。
- **完了条件**:
  - production `apps/web`のe-Stat直呼び0、ThemeCatalogの生`estatParams`0、生色値0。
  - 全chart dependencyが型付き参照から列挙され、期待集合=生成集合=監査集合。全chart種別の陰性対照が検知される。
  - 単位換算は取り込み時一回で、scale-bearing active metricにsilent unknown / mismatchがない。
    既存`MONEY-UNIT-SCALE-01`のR2実測条件も満たす。
  - normalized artifact欠落0、stale delivery 0。blogの自動復元可能残件0、provenance defect 0。
    手動判断残件は捏造せず、既存の個別IDへ根拠付きで分離されている。
  - 色roleの共有型とweb/static resolverが一致し、新しいliteralをCIが拒否する。主要chartで色順、正負、凡例、contrastの回帰なし。
  - 対象test、全type-check、web buildがgreenで、docs checksに新規error / warningがない。
    外部反映後は同じ監査でR2実測まで確認する。
- **正典**: `docs/01_技術設計/02_データアーキテクチャ.md` / `.claude/rules/estat-api.md` /
  `.claude/rules/unit-semantics-standards.md` / `.claude/rules/theme-catalog-standards.md` /
  `.claude/rules/metric-config-standards.md` / `.claude/rules/r2-storage-design.md` /
  `packages/data-configs/src/unit/` / `packages/data-configs/src/color-scheme-policy.ts`

### [MUNICIPALITY-SCOPE-SEPARATION-01] 市区町村テーマ・ランキングを独立した地理スコープへ分離する

タグ: [UI・UX] [種類:改善] [実行:別環境] [検証:npm run validate:municipalities --workspace=@stats47/data-configs] [起票:2026-08-20]

- **owner**: Claude Code Sonnet 5 high（1 session = 1 work package、writerは同時に1体）
- **再開ポインタ**: `nextWorkPackage=WP8-measurement` / `lastCompleted=WP7-remote-release` (2026-08-26)。WPのgateを満たした場合だけ更新する。
  完了した作業の長文ログは残さず、変更path、検証、未検証、次の一手を3〜6行で追記する。
- **WP1 完了 (2026-08-24)**: `packages/area/src/municipalities/` と
  `packages/data-configs/src/geo-scope/{types,municipality-catalog}.ts` にscope・entity policy・公開判断SSOTを追加した。
  現行マスタ1,913行から公開候補1,718、行政区除外194、`13100 特別区部`集約除外1を決定的に導出する。
  active city metric 184件は全件availability理由を持ち、監査済みpilot 1件だけをpublishedにした。
- **WP2〜WP6 ローカル完了 (2026-08-24)**: 専用R2 namespace、hub/theme/ranking、検索・県filter・50件paging、
  city profile相互導線、known/410/redirect/sitemap/navigationを実装。対象93 test、lint、全25 package type-check、web buildはgreen。
  `elderly-population-ratio` は2020年1,717有効値。分母人口0の双葉町0%をvaluePolicyで欠測相当へ除外した。
- **WP5 blocked**: 個別東京23特別区の観測値が現R2/masterに無いため地方財政はdraft。県theme一覧から旧city themeを除き、
  市区町村hubへ監査中表示と一時転送を置いた。推測値・行政区混入・0埋めは行わない。
- **WP7 remote release完了 (2026-08-26)**: 専用R2の`item.json` / `values.json`と本番routeがHTTP 200。
  `values.json`はschemaVersion 1、2020年度、1,717自治体（分母人口0の双葉町を除外）で、canonicalも
  `/municipalities/ranking/elderly-population-ratio`に一致した。catalog監査は入力1,913 / 公開可能1,718 /
  候補184 / 公開pilot 1でgreen。次は公開値やURLを変えず、28日/56日の専用prefix計測だけを行う。
  pilot公開日を2026-08-24とし、28日判定は2026-09-21、56日判定は2026-10-19。GSCの表示回数・クリック、
  GA4のlanding/engagement/市区町村導線eventをprefecture既存ページと混在させず専用URL prefixで比較する。
- **WP0 完了 (2026-08-21)**: read-only 棚卸しを機械化した。
  生成器 `.claude/scripts/municipalities/build-wp0-inventory.ts` /
  出力 `.claude/state/municipalities/{wp0-inventory.json,LATEST.md}`。コード・R2・URL は未変更。
  - metric: active 2,193 のうち **city-only 19 / both 165 = 候補 184 件** (カードの見立てと一致)。
  - R2 `app/stats/<key>/cities.json`: **present 180 / absent 4 / undetermined 0** (184 件を実測)。
    absent は家計費目 4 件 (`{culture-recreation,education,healthcare,housing}-cost-all-households`)。
  - **★最大の発見: present 180 件のうち 178 件が政令市の「本体」と「行政区」を同じ payload に
    同居させている**。entity 数は一律 1,913 = 自治体 1,719 + 行政区 194 で、素の件数だけ見ると
    二重計上に気づけない (札幌市と札幌市中央区が同じ表に並ぶ)。WP1 の entity policy が機械的に落とす。
  - entity 母集団: cities.json 1,913 行 / 自治体 1,719 / 行政区 194 / 政令市本体 21。
    重複 code 0・親不明の行政区 0。行政区の `prefCode` は県ではなく**親の市コード**を指す (全件で確認)。
  - **東京23特別区は個別 entity として存在しない** — cities.json は「特別区部」1 件 (13100) に
    集約している。doc 44 の pilot 規則が言う「東京23特別区を含む財政主体監査」は現状のデータでは
    満たせないので、WP1 でこの前提を先に決める。
  - 鮮度: 最新年が 2015 年未満の artifact が **36 件** (最古 `crime-rate-per-1k` 2005)。
  - URL 面: `/municipalities` 系 route は無し。公開 city allowlist は `stage-1-cities.ts` と
    `sitemap.ts` の 2 箇所が読む。
- **pilot 候補 (WP0 の結論・WP1 で確定する)**: `elderly-population-ratio` を第一候補にする。
  2020 年・null 率 0・zero 率 0.0016 (3 件) で母集団が最も素直、定義が全自治体で一貫し、
  財政主体の曖昧さが無い。`per-taxpayer-income` は 2023 年と新しく需要も見込めるが
  **zero 率 8.9% (171 件) の説明が付いていない**ので、理由を確かめるまで pilot にしない。
  `fiscal-strength-index` は地方財政なので pilot 規則により除外。
- **目的**: `/themes/*` と `/ranking/*` を47都道府県に保ち、市区町村比較を
  `/municipalities/{themes,ranking}/*` へ分離する。既存 `/areas/{pref}/cities/{city}` canonicalは維持する。
- **根拠**: active MetricConfig 2,193件のうち市区町村候補は184件（city-only 19 / pref+city 165）だが、
  現行ranking loaderはprefecture固定で、`rankingValuesKeyPath`はareaTypeを無視するためcity生成が県valuesを
  上書きし得る。`/themes/local-finance/cities` は財政主体scope監査がblockedのままである。
- **発見 (2026-08-21・本カードの対象外だがWP6で拾う)**: `/areas/{prefCode}/cities` (一覧パス) は
  route fileが無いのに **HTTP 200** を返す。middlewareのareas判定が `seg[2] !== "cities"` で410対象から
  除外する一方、Next側は `/areas/[areaCode]/[themeSlug]` が "cities" をthemeSlugとして拾うため、
  not-found相当の中身を200で返すsoft 404になっている (noindexは付くので索引はされない)。47県ぶん存在するが
  内部リンクが無く、GSC是正キューにも0件 = まだクロールされていない。WP6 (URL/SEO/計測) で404/410か
  実ページかを決める。市区町村詳細側のsoft 404 (未公開cityコード) はGSC是正キューが49件pendingとして
  既に追跡している (observe-after-fix 42 / noindex 7)。
- **実行順**: doc 44の WP0〜WP8を順に進める。WP0 inventory → WP1 scope/entity/catalog →
  WP2専用R2 snapshot/ranking core → WP3 pilot route → WP4 theme UX → WP5地方財政移行 →
  WP6 URL/SEO/計測 → WP7承認付きrelease → WP8計測後の拡大。
- **統合 (2026-08-21)**: 旧 `[CITY-PAGES-REVIVAL]` (市区町村ページの公開数を増やす・trigger待ち) を
  受入条件を持つ本カードへ統合して削除した。現状の公開は `PHASE_1_SSG_CITIES` の **360市** のみ
  (政令市20 + 中核市/県庁所在地60 + STAGE_3 280。sitemap shard 8 = city 360 + city-category 720 = 1,080 URL)。
  それ以外の city コードは HTTP 200 + 「市区町村が見つかりません」= soft 404 (noindex 済)。公開数を
  増やすかは WP8 (計測後の拡大) で pilot の 28日/56日判定を見てから決める。旧カードの trigger を引き継ぐ:
  都道府県ページで検索・回遊の需要を実証し、city snapshot 欠損と thin-content 基準を解消した後。
- **pilot規則**: WP0で値・entity・年度・検索需要を監査して一件だけ選ぶ。地方財政は、市・町・村・
  東京23特別区を含み政令指定都市の行政区を除く財政主体監査が完了するまでpilotにしない。
- **停止条件**: entity/年度/単位/母集団が不明、欠測と0を区別できない、県artifactへ差分が出る、
  city canonicalやredirectと競合する、対象fileがdirtyで安全に統合できない、外部変更が必要になった時点で停止する。
- **禁止**: 184候補の一括公開、queryだけの別canonical、行政区の自治体扱い、欠測0化、
  `app/ranking/{key}`のcity上書き、個別city URL一括移行、`git add -A`、他者差分のrestore/reset。
- **完了条件**: 市区町村hub/theme/rankingが専用catalog・R2・canonicalを持ち、公開entity policy、
  検索/県filter/paging、city profile相互導線、known/sitemap/redirect、対象test/type-check/build/docs gateがgreen。
  pilot公開後の28日/56日判定があり、remote R2・push・PR・deployの実行と承認が明示されている。
- **正典**: `docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md` /
  `docs/01_技術設計/03_情報設計.md` /
  `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-13-theme-local-finance-city.md`
- **別PC / 新しいClaude Code taskで使う再開prompt**:

```xml
<task>
  <goal>backlogのMUNICIPALITY-SCOPE-SEPARATION-01を、nextWorkPackageの1件だけ実装してgateまで完了する。</goal>
  <scope>doc 44で当該WPに指定されたpathと最小の関連test。次WP、remote R2、push、PR、deployは対象外。</scope>
  <sources>CLAUDE.md、.claude/todo/backlog.mdの当該カード、docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md、同書が指定するSSOTを全文読む。</sources>
  <done_when>当該WPのGateを満たし、決定的testを実行し、カードのlastCompleted/nextWorkPackageと短い証拠を更新する。</done_when>
  <authorization>ローカルread/edit/test/dry-runのみ。外部write、git push、PR、deploy、既存差分の破棄は禁止。</authorization>
</task>
<output_format>最初に対象WPとdirty競合の有無を1段落、最後に変更・検証・未検証・次WPを各1〜3行で報告する。</output_format>

開始時に git status --short --branch を確認する。新規cloneなら bash .claude/scripts/setup-memory-symlink.sh を
一度実行する。同じworking treeで別writerが動いている、または対象pathがdirtyなら編集せず、別worktreeか
所有者の整理を待つ。存在しないcommand/pathを推測せず、exportsと呼び出し元を読んでから実装する。
```

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [起票:2026-08-13]

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

### [RANKING-VALUES-PARTITION-INTEGRITY-01] 分類軸の絞り忘れによる配信データ汚染の是正

タグ: [進行中] [起票:2026-07-30]

- **owner**: Claude Code
- **発見経緯**: ai-content の実データ照合ゲート (`audit-ai-content.mjs`、2026-07-30) が検出したのは
  ai-content の誤りではなく**配信データ側の欠陥**だった。当初 15 件と見積もったが、全件走査で 209 件と判明。
- **規模** (2026-07-30 に active 2,179 件を全件走査した実測。健全は 1,984 件):
  - **重複行 176 件**: 同一 (areaCode, yearCode) に複数行。倍率 2-10倍:53 / 10-100倍:106 / 100倍超:15。
    最悪は `smartphone-usage-students` の 97,916 行 (本来 47 行)
  - **単位と値の矛盾 27 件**: unit が `%` なのに最大値が 100 超。うち 13 件は重複行と併発
  - **県の欠落 24 件**: うち **15 件は正当** (`port-*`/`fishery-*`。`port-cargo-total` の欠落 8 県は
    内陸 8 県と完全一致することを実測で確認)。要調査は 4 件
  - 港湾・漁業の正当分を除くと **194 件**。うち **153 件に検索流入**あり (直近週 4,590 表示)
- **読者に見えている実害**: `/ranking/sports-participation-rate-swimming` は 1 位 74.5% と表示するが
  これは水泳ではない別種目の値 (正しくは 8.6%)。`/ranking/vacant-housing-rate` は 896,500%。
  `/ranking/carpenter-annual-income` は 320 行。
- **消費側への波及**: theme カタログから 59 参照 (`occupation-salary` は 39 指標 = ほぼ全体が汚染)、
  area データブック 4 指標 (全 47 県ページ)、ブログは source.json 経由。
- **原因**: 取り込み側。metric config が e-Stat の分類軸を絞りきれず複数系列が混入していた。
  `page-data-batch.ts` は cdCat01/02/03 しか API に渡さず、4 軸目・表章項目 (tab)・時間粒度を
  絞る手段がなかった。**194 件すべて `source.kind === "estat"`**。
- **なぜ 2 ヶ月気づかなかったか**: 既存の週次監査 `audit-ranking-data-integrity.ts` は同日に実行して
  違反 0 件 = ✓ OK を返した。存在・rowCount 0・年整合・正規化値域は見るが、**行が多すぎること**を
  見ていなかった。`expected-empty.ts` (2026-07-29) が塞いだのは「少なすぎる」側だけだった。
  検知情報は書き込み時点で揃っていた (`buildMeta` の rowCount / areaCount / yearRange)。
- **実装済み (再発防止)**:
  - `packages/data-configs/src/shape-gate.ts` — 純関数。重複行 / 打ち切り / 単位矛盾 / 県カバレッジ。
    取り込み・監査・走査が同じ関数を import する
  - `expected-shape-anomaly.ts` — 既知 203 エントリ (生成物)。`until` 必須 / `observedSeverity` より
    悪化したら降格しない / `MAX_KNOWN_BROKEN` ラチェット
  - `page-data-batch.ts` — `gateShape` (error なら書かず既存を温存) / `RESULT.STATUS` 検査 /
    `RESULT_INF` で打ち切り検知 / `--dry-run` が実際に fetch するよう変更 / `--allow-shape`
  - `audit-ranking-data-integrity.ts` — 検査 (j) を追加 (payload は取得済みなので追加コスト 0)
  - `scan-stats-shape.ts` — R2 走査 + allowlist 生成 + 進捗計測
  - `diagnose-unpinned-axes.ts` — getMetaInfo から未指定軸を機械的に列挙し wave 分類する
- **是正が機械化できる根拠**: 未指定軸のコード数の積が観測倍率とほぼ一致することを 3 件で検証済み
  (`smartphone-usage-students` は未指定 tab(1)×cat03(16)×cat04(8)×cat05(23))。
  「どの軸を絞り忘れたか」は getMetaInfo だけで決まり、残る判断は「その軸のどのコードか」だけ。
- **修正済み (8件)**: swimming(cat03=15) / hiking(cat03=17) / cinema(cat03=04) /
  convenience-store-count-commercial・sales-monthly(cat03=01030100 + timeScope) /
  freelance-count(cat03=0,cat04=00) / retail-sales(cat03=0,cdTab=703-2021) /
  retail-establishments(cdTab=701-2021)。**config 修正のみで R2 未反映**。
  この 3 件 (convenience-store 系 + retail-sales) だけで汚染分表示の 40% を占める。
- **是正の進捗 (2026-07-30)**: **146 metric の config を修正済** (全件 e-Stat の dry-run で
  形状違反ゼロを実測)。診断の分類は ambiguous 76 → 3 まで縮小した。
  - 単一軸の pin 89 / 多軸の軸別解決 10 / 賃金構造基本統計の tab 線形結合 39 / 個別 10
  - 是正の途中で自分の実装の誤りを 6 つ見つけて直した (総数フォールバック / 一致下限 3 文字 /
    共通部分列のみの評価 / timeScope の誤検知 / 多軸での率判定漏れ / coverage ラチェットの起点)。
    うち 2 つはゲート自身が止めた (timeScope の 0 行化・port-cargo の県数 39→34)
  - `tabCombination` を新設。平均年収 = きまって支給する現金給与額(tab=08)×12 + 年間賞与(tab=12)。
    実測で大工の値が 1,686.5 千円 (月額系の生値) → 約 3,400 千円 に是正された
  - config の `years` が壊れたデータから導出されていた 29 件を範囲指定に修正
    (実データのある 2022 年が抜けていた)
- **次**: PR を develop へ merge → `data/data-refresh-requests.json` を push して
  `data-refresh.yml` を発火 → 全件再生成 → 監査 (a)-(k) 全緑と `unbaked` 0 を確認 →
  allowlist を自動縮小 (`shrink-shape-allowlist.ts`) して `MAX_KNOWN_BROKEN` を下げる。
- **★再取り込み前の dry-run 検証が要る (2026-08-13・CROSS-PAGE-DATA-SSOT-01 WP6 preflight で発見)**:
  `page-data-batch.ts --metric <key> --dry-run` (e-Stat fetch・R2 write なし) で stale 4 件を実測。
  - **`convenience-store-count-commercial` は config bug を発見・是正済 (2026-08-13)**: `years` が
    `{from:2025,to:2025}` だったが e-Stat の実データは **2022〜2024 のみ** (2025 は未公表)。年フィルタで
    全 141 行が落ちて 0 行になっていた (「修正済み (8件)」に反して years が未修正だった)。`{from:2022,to:2024}`
    に是正 → dry-run が `ok=1 / shape=0 / shape-allowed=0` (allowlist にも当たらない完全クリーン) を実測。
    **R2 反映は残** (page-data-batch → generate-ranking-values → generate-ranking-items の順で app/ranking まで
    伝播が要るため CI `data-refresh.yml` の全件フローで実行する。単独 app/stats 手動 push は ranking ページに
    伝播せず不完全)。allowlist からも外せる。
  - `current-balance-ratio` / `nursery-utilization-rate` / `future-burden-ratio` は `shape-allowed=1` (既知
    anomaly を allowlist で許容したまま = years bug ではなく別の shape 課題)。→ **`data-refresh.yml` 発火前に
    全 14 件を dry-run し、empty になる key は config を直してから**再取り込みする (盲目的な全件再生成は無駄)。
- **軸の絞り込みは完了 (2026-07-30)**: 診断の分類から ambiguous / pin-match / pin-multi /
  pin-total / meta-missing がすべて 0 になった。**155 metric** の config を是正済み。
  - `convenience-store-sales-yoy`: key 名だけが `-yoy` で、title・unit・displayName と
    公開中のページはいずれも販売額だった。tab=100 (販売額) を pin し、矛盾していた
    subtitle「対前年比」を実際の区別軸「2019年・確報旧表」に直した (東京 1,786,288 で一致)
  - `maternal-child-health-guidance`: cat03 の総数コードがメタに存在するのに**行が 1 つも無い**。
    5 区分 (妊婦/産婦/乳児/幼児/その他) を axisSum で合算した (東京 2020 = 246,484 で一致)
  - `bed-utilization-rate` / `average-length-of-stay`: メタ取得が 503 で失敗したまま
    キャッシュされていた。取り直して tab を pin (病床利用率 34,335,382 → 75.2%)
- **港湾 5 件は解決済 (2026-07-30)**: `axisSum` を新設して対応した。実測で判明したこと:
  - 港湾関連 metric は estat 9 件 / external 10 件に分かれるが、**どちらも e-Stat の港湾調査**。
    external は港単位 (甲種+乙種のマージが要る)、estat は都道府県集計版という違い
  - 海上出入貨物表の「輸送形態」は計コードを持つが、**輸送形態が 1 つだけの県には計の行が出ない**
    (岩手は一般のみ)。計を pin すると 39 → 33 県に減る。メンバー合算なら全県そろい、
    東京 2023 で `計 82,630,481 = 一般 72,052,876 + 自動車航送船 10,577,605` と完全一致を実測
  - 入港船舶表の「航路」は外国/内国の 2 つだけで計が無い。tab は 110=隻数 / 130=総トン数
- **率系 14 件は解決済 (2026-07-30)**: `axisRatio` を新設し取り込み時に計算する
  (`calculated` source を使わないので実行機構の問題が消えた)。分子・分母とも**コード配列**に
  したのは「部分 / 部分の合計」が実在するため (非正規率 = 322 / (321+322))。
  - 分子分母は getMetaInfo の実軸コード表を 1 件ずつ読んで確定した。診断の 2 文字偶然一致に
    よる提案は 2 件とも誤り (バリアフリー化住宅率に「共同住宅」、オートロック率に「給与住宅」)
  - **公表値と一致**: 空き家率 全国 13.8% = 公表 13.8% / 非正規雇用率 36.9% = 公表 36.9%
  - **陰性対照で形状ゲートの穴が見つかった**: 分子分母を入れ替えた 1076% が
    `shape:allowed` に落ちて書き込まれていた (重症度ラチェットは「悪化」しか見ないので
    896500% → 1076% を改善と見なす)。取り込み gate で「書いてよいか」と
    「run を fail させるか」を分離し、既知破損でも**書かない**ようにした
- **0 件 6 件も解決済 (2026-07-30)**: 真因は「cdCat01 の誤座標」ではなく**表の形**だった。
  患者調査 5 件は都道府県が area 軸ではなく cat 軸 (連番) に入る表で `areaAxis` を新設。
  救急告示病院数は 3 年ごとの調査で 2021 年が存在しないのに years を 2021 単年に固定していた。
  dairy-cattle-count の北海道欠落も最新表 (2025) への差し替えで解消 (北海道 816,800 頭で 1 位)。
  areaAxis 是正の結果 3 metric が入院受療率と完全同値と判明したので非公開にした (未公開のため実害なし)
- **レシピの単一定義化 (2026-07-30)**: 出典だけでは値は決まらないので、軸 pin・tab 選択・
  線形結合・軸合算・率・時間粒度・地域軸を `MetricRecipe` として R2 の値の隣に焼く。
  取り込み・builder・監査が同じ `buildRecipe` を import する。監査 (k) が
  `configHash` を突き合わせて「R2 が stale」を検知する (従来 (a)-(j) では原理的に見えなかった)。
  併せてオンデマンド取得 4 経路が `sourceConfig` を丸ごと spread して cdCat03 以降を
  落としていたのを是正した (155 件の config 是正がこの経路に届いていなかった)
- **反映**: config 修正だけでは R2 に届かない。`data-refresh.yml` (page-data-batch → diff-push-r2)
  → `sync-snapshots.yml` の `ranking-values` → `ranking-items` の順で再生成が要る。
- **2026-08-26 再監査**: 公開R2 active 2,167件はitem/values欠落0、正規化欠落0、shape未許可error 0、
  configHash drift 0。旧allowlistの`known-broken`13件を一次データで再判定したところ、12件は
  経常収支比率・昼間人口比率・食料自給率等の「100%を上限としない比率」で、R2 recipeも現configと一致。
  残る日雇受給率もe-Stat公式計算式`J6110/J6109`どおり、福島県1994年度
  `170人÷11人×100=1545.5%`と一致した。13件の偽債務を削除し、日雇受給率だけは1000超errorを
  書き込み可能にする`legitimate`例外として保持。`MAX_KNOWN_BROKEN=0`、再取り込みキュー0、
  対象61 test・type-check・当該metric e-Stat dry-runがgreen。allowlist生成器もerrorだけを候補化し、
  100〜1000のwarnを自動で`known-broken`へ誤分類しないよう是正した。
- **残りの実測値**: 形状warnはarea coverage 31、正当な100%超13、zero-heavy 2。カード完了を止めるのは
  公開payloadの未焼き込み33件だけでconfig driftは0。full data-refresh / snapshot同期後に未焼き込み0を
  再実測する（R2 write・workflow dispatchの承認は別）。
- **完了条件**: `scan-stats-shape.ts` の未許可errorと`known-broken`が0で、残るwarnが一次資料または
  `verified-value-profiles.ts`で説明されていること。`MAX_KNOWN_BROKEN`は0を維持する。加えて監査 (k) の
  `unbaked` が0になること（全payloadにレシピが焼かれた状態）。100%を上限としない公式比率や
  port/fisheryの正当なcoverage不足を、件数を0にするためだけに欠陥扱いしない。
- **停止条件**: 再生成後の監査で `drift` が 0 にならない場合は R2 push を止めて原因を見る
  (config と R2 が食い違ったまま配信するより、古いデータが残る方がまし)。
- **正典**: `.claude/rules/metric-config-standards.md` §形状ゲート /
  `.claude/rules/ranking-content-standards.md` §実データ照合

### [AICONTENT-DBLESS-REBUILD] ranking ai-content生成の完走

タグ: [進行中] [起票:2026-06-01]

- **owner**: Claude Code
- **次**: 対話セッションで 3 件並列を続ける。2026-08-24 に 86 件試して生成 FAIL 0 / 公開 83 件
  (CI の権威ゲートでも skip 0)。止まった 2 件は接地データ側の欠陥で
  `AICONTENT-BUILDINPUT-ZEROFILL-01` が扱う。旧「次」が指していた
  `CONTENT-ROUTINE-LIVE-VERIFY-01` はカードが現存せず、日次ループ
  (`ai-content-generate-daily.yml`) も 2026-08-21 に削除済みなので無効。件数は月次計画が
  目標を持ち週次が割り当てる。
- **2026-08-26 checkpoint**: R2公開後にactive 2,167件を全量再構築し、done 362 / needs 1,805
  （missing 198 / incomplete 1,548 / blocker 59）を確定。当日公開9件はすべて公開R2の決定的監査が
  blocker 0 / warn 0で、Googlebotの対象routeも200。上位5件
  `gpp-public-service` / `voter-turnout-governor` / `high-school-teacher-annual-income` /
  `junior-high-club-per100-soft-tennis` / `junior-high-club-per100-swimming`は公開済み。意味criticで、公務分の指標名、暦年/年度、派生指標の
  分子・分母時点を是正した。疎なpartitionは実観測件数とcommentary件数を照合し、未観測県を
  47件へ水増ししない監査契約を追加（AI監査48 test green）。当日の月次上限内で生成を停止し、次回は
  `other-fresh-fish-consumption-expenditure`から再開する。
- **2026-08-26 next 1**: `other-fresh-fish-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  長崎9,910円（1位）/ 高知3,652円（47位）を含む順位・県名・値・areaCode不一致0、機械監査
  blocker 0 / warn 0。独立criticの初回REVISE（数値過多・反復・神奈川の誤認）を是正し、delta最終PASS。
  R2公開は全データrefreshとの競合を避け、親工程で直列実行する。
- **2026-08-27 next 2**: `game-console-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  静岡3,033円（1位）、8県0円（同率40位）を欠測へ変換せず全47県の解説へ保持し、構造不一致0、
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのdelta判定までgreen。R2公開は全データrefresh後に直列実行する。
- **2026-08-27 next 3**: `manufacturing-establishments`を2024年度・事業所・47県の公開R2へ接地して生成。
  大阪18,481（最大）/ 鳥取854（最小）、欠測・0値・同率0、全areaCode・県名・順位・値の不一致0。
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのREVISE 4点をdelta是正して最終PASS。
- **2026-08-27 next 4**: `cod-roe-consumption-expenditure`を2024年・円・47県の公開R2へ接地して生成。
  福岡4,870円（最大）/ 沖縄589円（最小）、欠測・0値・同率0、全areaCode・県名・順位・値の不一致0。
  機械監査blocker 0 / warn 0、AI監査48件、独立criticのREVISEを全件delta是正して最終PASS。
- **完了条件**: 全active rankingを処理し、欠測・矛盾・未検証生成を0にする。R2 pushとCDN反映は別承認。
- **正典**: `.claude/rules/ranking-content-standards.md`

### [PUBLIC-DATA-CONTRACT-AUDIT-01] blog / ranking / theme の配信データ契約を全量検証する

タグ: [起票:2026-08-03]

- **owner**: Claude Code
- **監査時点の証拠**:
  - ranking は公開中の既知 2,176 件で `item` / `values` が全件 HTTP 200、年の対応も一致した。ただし直近の data refresh は対象 14 件中 12 件の更新に留まり、`convenience-store-count-commercial` は0行、`employment-insurance-daily-receipt-rate` はshape gateで既存値を温存した。全2,295 metricの定期更新完走を示す証拠ではない。
  - theme は22ページすべて HTTP 200だが、282参照（256 unique）のうち4 metricがR2に存在せず、1 metricは期待する地域種別とpayloadが不一致だった。部分データfallbackによりページのHTTP成功だけでは欠測を検知できない。
  - blog は公開419記事の本文を取得できたが、本文が参照する1,047 assetのうち `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` が404だった。
- **2026-08-26 checkpoint**: 期待集合を`KNOWN_RANKING_KEYS` / `ALL_THEMES` / 公開blog manifestから作る
  `audit-public-data-contract.ts`を実装し、missing / empty / wrong area type / 本文のみ参照asset /
  theme部分fallback / transientの6 fixtureがgreen。全量liveはranking 2,167、theme参照299、blog 434、
  asset 1,091を検査し、上記SVG 1件だけが404。themeの旧欠測参照は実在するowner/rented 2系列へ是正済み。
  data-refresh、blog自動/手動publish、週次監査へ同一gateを配線し、専用Issueの起票・復旧Close・artifact・
  最終job失敗をworkflow契約testで固定した。次はこの差分とSVGを承認付きで1回反映し、live全量greenと
  full data-refresh成功を確認する。
- **2026-08-27 live再監査**: R2公開値をranking 2,167、theme参照299、blog 434、asset 1,088で再検査し、
  findingは5件。前回refreshの派生生成が途中失敗したため、4 ranking
  (`actual-income-worker-households-per-month` / `bank-loan-balance` / `cpi-change-rate-housing` /
  `mobile-phone-bill-consumption-expenditure`) の`latestYear`が欠落し、前者を参照する`real-income` themeも
  unusableになっている。既知集合だけを派生生成へ渡す修正とR2 readの30秒・3回retryはdevelopへ反映済み。
  修正版のfull refresh後に同じ全量監査でfinding 0を確認するまで未完了とする。
- **実行順**:
  1. 上記1 assetを正しいJSON/sourceから再生成し、themeの欠測4件（`manufacturing-sales-private` / `manufacturing-net-value-added-private` / `industrial-land-price` / `housing-floor-area`）と地域種別不一致1件を、R2再生成またはcatalog参照削除で解消する。
  2. 公開blog全記事、`ALL_THEMES`、`KNOWN_RANKING_KEYS`から期待集合を決定的に生成し、R2の存在、schema、row数、年、地域種別、参照assetをread-onlyで全量検査する。既存ファイルの列挙だけで期待集合を作らない。
  3. 欠落、空payload、誤地域種別、本文だけが参照する欠落asset、部分fallbackをfixtureで再現し、各欠陥を検知できることをテストする。
  4. data refresh後、blog publish後、定期監査に同じgateを接続し、違反時はworkflowを失敗させて`auto-generated` Issueを起票する。復旧後の自動closeも検証する。
  5. e-Stat / R2の一時的な到達不能と、確定した404・空payloadを別分類し、既知欠陥を自動でbaselineへ取り込まない。
- **停止条件**: 正当に疎なデータか判定できない場合、外部通信が監査全体で不通の場合、またはR2 write・公開deployが必要になった時点で停止する。欠陥の自動allowlist化や参照の推測削除はしない。
- **完了条件**: 全公開blogの本文参照assetが200、全theme参照が正しい地域種別の非空`item` / `values`を持つか明示的にcatalogから除外、全known rankingの契約が合格し、全metric更新の実走証跡が残る。さらにseedした5種類の欠陥でCIが失敗し、復旧後にgreenへ戻ること。
- **正典**: `.github/workflows/ranking-integrity-audit-weekly.yml` / `.github/workflows/blog-remediation-daily.yml` / `apps/web/src/features/theme-dashboard/lib/load-theme-data.ts`

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [進行中] [起票:2026-07-22]

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

### [GOOGLE-ADMIN-AUTOMATION-01] Google管理操作のAPI/UI境界整理とCI化

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:npm run google-admin:test] [起票:2026-07-30]

- **owner**: uruhayato373 (残りは GitHub Environment の作成と credential 登録の 2 手だけ)
- **機械側は達成済**（2026-08-21 再実測）: `google-admin:test` 37 件 pass / `metrics:test` 76 件 pass /
  `docs:check` errors 0。schedule は audit のみ（`0 20 * * 0`）、apply job は
  `workflow_dispatch` かつ `mode=apply` のときだけ起動し `confirm_site` + `approval_token` を要求する。
  workflow の `permissions: contents: read`（repo へ書かない）。
- **2026-08-21 に修正した実バグ**: 週次 audit が毎回「AdSense ad units: 0 件 (error)」を出していたのは
  **credential ではなく walk の実装欠陥**だった。このアカウントは content 用 `ca-pub-*` に加えて
  AdSense for Search の `partner-pub-*` を持ち、後者は広告ユニットの概念が無く `adunits.list` が
  NOT_FOUND を返す。`audit-adsense.mjs` に per-client の try/catch が無く、1 件の失敗で inventory 全体が
  空になっていた。**同じ資格情報で `fetch-adsense-snapshot.mjs` は成功しており**（2026-08-16 の run で
  実測・W33 の snapshot は保存済み）、あちらは 2026-08-04 に同じ欠陥を修正済みだった。判定を揃えるため
  `collectAdUnits` を切り出し、失敗した client は `skippedClients` に残して**全滅のときだけ throw** する形にした。
  CLI も一部 skip を出すようにし、欠けた件数が status=ok のまま黙って緑にならないようにした。
- **カードの旧記述は stale だった**: 「AdSense weekly snapshot は最新 run でも別 project の OAuth client を
  参照して全 job が error」は 2026-08-16 の実測と食い違う。AdSense account assert = ok /
  GA4 link = ok / GSC = siteOwner で、**OAuth は復旧済み**。
- **待っている成果**: custom dimension 7 件が `confirmed-absent`（`cta_id` / `content_id` / `target_type` /
  `target_key` / `card_variant` / `slot` / `experiment_variant`）。台帳 `analytics-event-standards.md` の
  ⏳要登録 と一致する。これが入るまで buzz-map の deep-click と home-featured の variant 別内訳は取れない。
- **残るオーナー工程（順序が重要）**:
  1. GitHub Environment `google-admin-production` を **required reviewer 付きで作る**（現状 `Preview` /
     `Production` しか無い）。
  2. `analytics.edit` を持つサービスアカウント鍵を **その Environment の secret** として
     `GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON` に登録する。
  - **★順序を逆にしない。** 存在しない Environment を参照する job は GitHub が実行時に
    **保護ルール無しで自動作成**する。先に repo secret として鍵を登録すると、承認ゲートを通らずに
    apply が走る状態になる。今は鍵がどこにも無いため apply は `admin-credential-missing` で
    BLOCKED（二重の fail closed）で安全。
- **完了条件**: `google-admin-production` が required reviewer 付きで存在し、鍵がその Environment の
  secret として登録され、`mode=plan` → `mode=apply` で custom dimension 1 件を承認付きで作成できる。
  `google-admin:test` / `metrics:test` / `docs:check` が exit 0。
- **停止条件**: property/stream/account 不一致、inventory 取得不能、plan token 不一致、authored dimension
  定義なし、quota 不明、外部 secret/role 変更が必要な時点で mutation を止める。
- **禁止**: AdSense `adunits.create`/`patch` を利用可能と仮定しない（AdSense for Platforms 系の制限
  プロジェクト向けで stats47 の利用権限は未証明）。`--force`、既存 dimension の archive/delete、
  storageState の CI 持込、外部 secret の無承認変更を行わない。
- **正典**: `.claude/scripts/google-admin/README.md`

### [KSJ-PREF-ASSIGN-01] KSJ 由来ランキングの県帰属を全 13 指標で是正する

タグ: [起票:2026-08-17]

- **owner**: claude
- **問題**: 旧 `register-ksj-rankings.ts` の `findNearestPref` が施設座標から**最寄りの県庁所在地**で
  県を決めていた。距離は行政境界と無関係なので県境・離島で系統的に取り違える。本番実測 (2026-08-17):
  原子炉の無い**京都府に 8 基** (高浜 4 + 大飯 4 が福井県から流出)、八丈島 (東京都) の地熱が**神奈川県**、
  秋田県 (澄川・上の岱) と福島県 (柳津西山) が **0**。旧アルゴリズムを実データ座標で再現し、
  配信値と完全一致することを確認済み。
- **済 (12 指標が本番反映まで完了)**: 帰属の共有モジュール
  (`packages/gis/src/mlit-ksj/prefecture-assign.ts`、属性 → 空間結合 → 距離上限つき海岸線許容 (既定 5km)、
  決められなければ null で推測しない) + `generate-ksj-stats-values.ts`。`findNearestPref` を含む旧
  script は削除。あわせて `unit: "か所"` に対して号機を数えていた問題も是正した (施設名 + 住所で
  重複排除。原発 68 レコード → 21 施設 / 地熱 19 → 17)。12 指標すべて**未解決 0**で再生成し、
  R2 は app/stats → app/ranking (values / item / 正規化 / national-trend) + `app/ranking-items/all.json`
  まで反映済み。誤りを引き継いでいた ai-content 12 件と相関 snapshot は削除して再生成待ちにした
  (退避 = `.local/{ai-content-removed,correlation-removed,ksj-aicontent-backup}/`)。
  `datasets.ts` からは実体の無い 2 ranking (`expressway-junction-count` / `photovoltaic-power-plant-count`。
  metric config も R2 データも無く soft 404 だった) を落とした。
- **是正後の主な値** (すべて生成データで実測・seoTitle/Description も更新済み):
  ダム 1位北海道190 / 湖沼 1位北海道107 / 火力 1位神奈川15 / 水力 1位長野54 /
  風力 1位北海道55 / バイオマス 1位北海道33 / 道の駅 1位北海道122 (最下位 東京1) /
  漁港 1位北海道290・2位長崎288 (0 は内陸 8 県ちょうど) / 空港 1位北海道15・2位沖縄13 (0 は 10 県) /
  鉄道駅 1位東京892 (最下位 沖縄19)。
- **2026-08-26 checkpoint (13指標目の定義・ローカル生成まで完了)**: 国土数値情報P12の一次資料と
  2014年データを再確認し、これは観光地の網羅的な施設数ではなく「観光資源台帳A級以上」と
  観光庁「観光地点等名簿」を統合した**登録件数**だと確定した。表示名を`観光資源データ登録件数`へ変更し、
  基準日2014-09-30・非網羅性・同一県内の`P12_001`重複除外を説明へ固定。公式19,140地物を処理して
  登録17,254件、形状重複1,886件、県帰属未解決0件で`.local/r2/app/stats/tourism-resource-count/values.json`
  を生成した（1位新潟1,913、兵庫874、愛知4）。同じ資源IDが別県に現れた場合は別登録として数え、
  同一県・同一IDだけを畳む回帰testを追加した。
- **商用境界**: 公式配布ページがP12を`非商用`と明記するため、商品factory・Kindle・データブックから
  `tourism-resource-count`をfail-closedで除外し、全商品catalogに混入しない回帰testを追加した。
  GIS空間処理結果の利用可否と配信形態は公開前に利用規約の条件を再確認し、データベース再配布は行わない。
- **残り**: ローカル生成物を承認付きsnapshot同期で`app/stats`→`app/ranking`（values / item /
  正規化 / national-trend）と`app/ranking-items/all.json`へ反映し、本番表示・出典・未解決0を実測する。
  本カードの存在をR2 write / deploy承認とは解釈しない。
- **住所が欠けるレイヤに注意**: P03 でも水力 6 / 太陽光 843 / 風力 4 件は住所が空で、空間結合に
  落ちる。太陽光は施設名だけで畳むと 9,808 → 3,253 に潰れるので、重複排除は必ず名前 + 住所で行う。
- **禁止**: 全プロパティを走査して「それらしい値」を県コードに使わない。P12 観光資源の `P12_001` は
  資源 ID だが 5 桁で、市区町村コードとして読むと別の県に化ける。C09 の `C09_006` は県名に見えるが
  政令市では市名が入る (実測 2931 件中 1631 件が解決不能) ので `C09_003` (市区町村コード) を使う。
- **完了条件**: 13 指標すべてが属性または空間結合で解決され、未解決 0 で再生成・公開されている。
- **正典**: `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/prefecture-assign.ts`

### [DATA-REFRESH-ZEROGATE-ALLORNOTHING-01] 形状ゲートに掛かる 4 metric を是正する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:gh run list --workflow=data-refresh.yml --limit 3] [起票:2026-08-17]

- **owner**: data-ingester
- **★カードを 2026-08-21 に実測で書き直した。起票時の前提はもう成り立たない。**
  当時は「empty 37 件が本体」と書いたが、**empty は 0 になっている**。
  いま止めているのは形状ゲートで、対象は **4 metric だけ**。
- **最新の実測** (run 31975905930 / 2026-08-16 の full dispatch):
  `ok=2175 / fail=9 / skip=57 / empty=0 / empty-allowed=2 / shape=4 / shape-allowed=48`
  fatal は `[fatal] 形状が壊れた metric が 4 件あります`。
- **落ちている 4 件**（いずれも `expected-shape-anomaly.ts` に**未登録**。実測で確認済み）:
  | key | 素性 |
  |---|---|
  | `bowling-alley-public` | **全 47 県が 0**。ai-content 側で既知 (`value-health` が not-eligible 判定) |
  | `gini-coefficient-disposable-income` | 同上。ai-content キューから除外済み |
  | `unemployment-measures-project-expenses-prefecture` | 同上 |
  | `commuter-ratio-from-other-municipalities` | 比率系の市区町村データに閾値が合っていない可能性。**allowlist の冒頭コメントは「legitimate で登録した」と書いているが実エントリが無い** — コメントと実装のドリフト |
- **✅ 完了 (2026-08-21)**: 巻き添え構造は解消した。1 件でもゲートに掛かると exit 1 で
  後続の push が skip され、**正常に取り込んだ 2,175 件が一度も R2 へ届かなかった**。
  `data-refresh.yml` の batch を `continue-on-error` にして push と派生生成を通し、
  最後の「🔴 Reflect batch gate result」で job を赤にする形にした。
  - 安全性の根拠: 壊れた metric は `writable = notEmpty && shapeOk` でローカルにも書かれず、
    `diff-push-r2` は `DeleteObjectCommand` を持たない **upload-only**。部分 push で
    壊れたデータが配信されることも R2 が削られることもない。
  - 契約テスト: `.claude/scripts/lib/__tests__/content-generation-routine.test.cjs`
    (`continue-on-error` を外す / 反映ステップを前へ動かす の両方が退行として落ちる)。
- **✅ 2026-08-26 追加是正**: 3件の全県0 metricは既に退役済み。残る
  `commuter-ratio-from-other-municipalities` をCI dry-run (run 32942581934) とe-Stat一次データで再実測した。
  市区町村表 `0000020306` / `#F02702` は単位が`％`のまま最大9,640（葛尾村・2015年）で、
  千代田区など100％超が継続するため、一般的な百分率上限を適用できない正当値と確定。
  city限定の`legitimate`例外と重症度ラチェットをSSOTへ追加し、known-brokenは書き込み不可、
  legitimateだけは観測済み最大値まで書き込み可とする取り込み契約・陰性対照テストを実装した。
  対象60 testと`@stats47/data-configs` type-checkはgreen。次はこの差分をdevelop/mainへ反映後、
  full data-refreshを実走して当月`app/stats`更新を確認する。
- **次**: 上記差分をdevelop/mainへ反映し、data-refreshのfull runを実行する。成功後に
  `app/stats`の`generatedAt`が当月へ更新されていることと、city payloadに9,640を含む正当値が
  欠落せず反映されたことを実測する。
- **2026-08-27 初回full rerun**: e-Stat batchは`ok=2089 / fail=1 / skip=55 / empty=0 / shape=0`
  （`freshwater-clam-consumption-expenditure`の一時的fetch失敗1件）。14,003件のupload自体はerror 0だったが、
  旧orphan item 38件をstrict parserへ渡したこととR2 read 10秒・1回のtimeoutで派生生成が失敗した。
  既知公開keyだけを列挙し、readを30秒・3回retryする修正を追加済み。GitHub Actions復旧後に再実走する。
- **完了条件**: data-refresh の full run (schedule または dispatch) が success で終わり、
  `app/stats` が当月分に更新されていることを実測できる。
- **注意**: 2026-07-05 の失敗は**別原因** (sync-snapshots の correlation task が JS ヒープ
  OOM。heap は 8GB へ引き上げ済)。同じ「連続失敗」でも原因が違うので混同しない。
  2026-08-17 の失敗も別で、page-data-batch と push は成功し `sync-snapshots` で落ちている。

### [SOURCE-TEXT-LINK-INJECTION-01] 出典テキストが第三者スクリプトでリンクに置換される

タグ: [収益化] [種類:不具合] [実行:ユーザー] [検証:npx playwright test --config playwright.smoke.config.ts third-party-dom-injection] [起票:2026-08-04]

- **症状**: チャート footer の「出典: 人口動態統計」の「統計」だけが `href="#"` のリンク + アイコンに
  なる (SSR HTML には無く hydration 後に出現)。本文でも「人口」「旅行ガイド、旅行記」が同様に置換される。
  出典の信頼性を損ない、**PR 表記の無いアフィリエイトリンクが引用文の中に生まれる**。
  証跡 = post-deploy smoke run 30876315662 の error-context.md (aria: `link "統計" /url: "#"`)。
- **★出所は AdSense の自動広告。オーナーが 2026-08-21 に設定を解除した。**
  私が同日「AdSense ではない」と書いたのは**測定時期を取り違えた誤り**だった。タイムラインが決定的:

  | 日付       | 出来事                                                 | `adsbygoogle.js`     |
  | ---------- | ------------------------------------------------------ | -------------------- |
  | 2026-08-04 | smoke が `link "統計" /url: "#"` を捕捉                | **読み込まれていた** |
  | 2026-08-16 | `ec944e50b feat(web): pause all AdSense display`       | 以降は読み込まれない |
  | 2026-08-21 | 私の実測「AdSense は読み込まれていない」「再現しない」 | 読み込まれない       |

  `AdSenseScript` は `ADSENSE_DISPLAY_ENABLED` が true のときだけ `adsbygoogle.js` を挿す。
  **停止の 5 日後に観測して「犯人ではない」と結論した**が、実際は「停止したから撃てなくなった」
  だけで、これは自動広告説を**支持する**自然実験だった。現在の状態から過去の事象を推論しない
  (`evidence-based-judgment.md`)。
  - A8 リンクマネージャーを疑ったのも取り下げる。公式仕様
    (support.a8.net/as/linkmanager) は「**広告主サイトへのリンク**をアフィリエイトリンクに
    置換する」URL 書き換えで、平文の断片をリンク化する機能ではない。

- **2026-08-21 に再現しなかったのは AdSense が 8/16 に停止していたから**。
  headless / headed × themes / blog / ranking を最大 36 秒スクロールして `#` リンクは 0 件。
  **停止中の緑は「直った」ではなく「今は撃てない」**を意味する。
- **完了済 (2026-08-21)**: post-deploy smoke に検知を追加した
  (`apps/web/tests/smoke/third-party-dom-injection.spec.ts`)。自分たちのコードは `href="#"` を
  一度も出力しないので、`#` リンクの存在がそのまま外部注入の証拠になる。
  - **誤検知を 2 回踏んで是正した**。(1) Leaflet のズーム (`a.leaflet-control-zoom-in`)。
    (2) **自分たちのフォールバック** — `md-content.tsx` の `source-link` /
    `related-article-link` / banner は記事が href を書き忘れると `href={href ?? "#"}` を出す。
    最初「自分たちは `#` を出力しない」と書いたのは誤りで、リテラル検索しかしていなかった。
  - そこで**症状そのもの**で判定する形にした: 「文章の中の 1 語だけがリンクになる」=
    **親に生のテキストノードが同居しているインラインの `#` リンク**。上の 2 種はどちらも
    兄弟テキストを持たないので分離できる (兄弟「要素」を数えると Leaflet の + と − が
    互いを兄弟テキストとみなして再び誤検知する — これも実測で踏んだ)。
  - **両方向を実測**: 本番 3 ページで緑 / 本文へ `#` リンクを 1 本注入すると赤
    (文脈つきの指摘文が出る)。緑であること自体が「今は起きていない」という観測になる。
  - 副産物: hydration 前に append したリンクは React の再描画で消えるため、注入は
    hydration 後にしか成立しない。settle は 12 秒。
- **残り**: **AdSense を再開したとき**に再発しないことを確認する。停止中の緑は証拠にならないので、
  再開手順に smoke の実行を紐づけた (`affiliate-ads-standards.md` §12)。自動広告の解除は
  実施済みなので、再開後の smoke が緑なら解決とみなす。
- **完了条件**: AdSense 再開後の post-deploy smoke で、出典・本文がリンク化されないことを示す。

## 🟡 中 — 2〜3ヶ月以内

### [A11Y-FOOTER-TAP-TARGET-01] フッター SNS アイコンのタップ領域が 16px で WCAG 2.5.8 を満たさない

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:node .claude/scripts/ui/measure-page-a11y.mjs] [起票:2026-08-21]

- **owner**: Claude Code
- **根拠 (2026-08-21 実測・Playwright)**: `FooterSocialLinks.tsx` の 4 リンクは
  `<a>` にパディングが無く、中の lucide アイコン (`h-4 w-4` / `h-5 w-5`) がそのまま
  タップ領域になる。実測は X 16×16 / Instagram 16×16 / YouTube 20×20 / note 16×16。
  **WCAG 2.5.8 (AA・24×24) を下回る**。`gap-3` (12px) では 24px 円が重なるので
  間隔による例外も成立しない。フッターは全ページに出る。
- **同時に測った他の 44px 未満**: ヘッダのロゴ (96×20)・パンくず「ホーム」(42×20)・
  フッタ法務リンク 3 件 (18px) は**文中リンク相当**で 2.5.8 の適用外。テーマ切替ボタン
  (40×40)・検索 input (358×40)・cookie banner のボタン (28px) は **AA は満たす**が
  44px (2.5.5 AAA) には届かない。**`/areas` の県選択 UI は 47 件すべて 44px 以上**で問題なし。
- **次**: `<a>` に `inline-flex items-center justify-center` + 最低 24px (できれば 44px) の
  当たり判定を付ける。アイコンの見た目サイズは変えない (余白で確保する)。
- **停止条件**: フッターの高さが変わってレイアウトが崩れるなら、`-m` の相殺で見た目を保つ。
  それでも崩れるならデザイン判断としてオーナーへ返す。
- **完了条件**: 390px で 4 リンクとも 24×24 以上。`npm run check:design-system` と
  対象 test が green で、フッターの見た目に差分が無い。
- **正典**: `apps/web/src/components/organisms/Footer/FooterSocialLinks.tsx` /
  `.claude/rules/ui-components.md`

### [PERF-AREA-DETAIL-01] /areas/<code> だけ dev で 1.9 秒かかる原因を特定する

タグ: [インフラ・計測] [種類:改善] [実行:windows] [検証:npm run dev:web] [起票:2026-08-21]

- **owner**: Claude Code
- **前提**: PERF-LOCAL-NAV-01 で dev gateway の GET キャッシュを入れ、R2 依存の重いページは
  `/themes/population-dynamics` 2,857→862ms、`/ranking/total-population` 1,213→862ms へ短縮した
  (同一端末・warm・中央値)。**`/areas/13000` だけ 2,228→1,788ms でほぼ動かない**。
- **根拠**: キャッシュ有効/無効で差が出ない = R2 往復が律速ではない。残る候補は server component の
  計算量、module graph の大きさ、県データブックのブロック数。
- **次**: `/areas/13000` の server render を分解する。まず R2 read の回数と distinct キー数を数え、
  次に databook のセクション数と `page-components` の展開コストを見る。
- **停止条件**: 原因が本番 (Cloudflare Workers) に無く dev 固有と分かった時点で、投資を止めて記録する。
- **完了条件**: 律速が何かを実測で名指しし、直すか「直さない理由」を書く。UI・DOM・URL は変えない。
- **正典**: `.claude/rules/local-environment.md`「会社 Windows PC の dev は Windows R2 gateway を使う」

### [JAPAN-DERIVED-METRICS-01] /japan に derived レシピ由来の指標を足せるか判定する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-08-21]

- **owner**: Claude Code
- **前提**: `/japan` (18テーマ・146指標) は 2026-08-20 に公開済み (PR #808 / #809)。GEO-SCOPE-SEPARATION-01 の
  完了条件は全て満たして 2026-08-21 にカードを削除した。ここで扱うのは**公式全国値を採用できなかった残り**だけ。
- **対象**: `unknown-non-estat` 9件 (external / kakei-chousa ソース)。e-Stat の全国行が無いため、
  分子・分母を宣言して derived として組めるかを 1 件ずつ審査する。未採用テーマは
  `consumer-prices` / `occupation-salary` の 2 件。
- **対象外 (再調査しない)**: `verified-unsupported` 71件。2026-08-20 に実 e-Stat fetch で値レベル照合し、
  全国行の値がプレースホルダ (`'-'` 等) = 公式全国値が存在しないと確定した。実測全文は
  `.claude/state/geo-scope/wp6-expansion-verification.json`。
- **停止条件**: 分子・分母の単位や母集団が揃わない、年次が一致しない、「47県から合成した値」を
  公式全国値として出すことになる — いずれかに当たったら採用しない。
- **完了条件**: 9件それぞれに採用/不採用の判定と根拠があり、採用分は `app/japan/<metric>/series.json` が
  生成されて `/japan/<theme>` に実データで描画される。
- **正典**: `docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md` /
  `packages/data-configs/src/geo-scope/` / `.claude/rules/unit-semantics-standards.md`

### [BACKLOG-LOOP-PERMISSION-01] backlog-loop が `.claude/todo/` を書き換えられない原因を確定する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-08-21] [期日:2026-08-24]

- **症状 (2026-08-20 run 32395252885)**: `permission_denials_count: 16`。セッションは
  「Edit / Write / Bash の `>` と `sed -i` がすべて権限レベルで拒否された」と報告したが、
  `.claude/settings.json` に該当する deny は無く `--allowedTools` にも `Write,Edit` が入っている。
  **モデルの自己申告以外の証拠が無く原因を確定できていない。**
- **★前提は解消していなかった (2026-08-21 実測)**: `9af614eb2` の summarizer は
  `result.permission_denials_count` を読むが、**実行ログのファイルにはこのフィールドが無い**。
  ai-content run 32404256626 は action の console 出力に `"permission_denials_count": 12` を
  出しているのに、同じ run の Step Summary は `denials=null` で `[permission 拒否]` 節が
  1 行も出ていない (`entry 種別` は `result:1` なので result エントリ自体は読めている)。
  つまり **console と実行ログファイルで result の中身が違う**。artifact 化されていないので
  ファイルの実体をこちらから見られず、フィールド名を推測で当てるべきではない。
- **次 (改)**: summarizer に「`permission_denials_count` が無いときは result エントリの
  キー名一覧を出す」診断を足す (キー名は秘密ではない)。次の run でフィールド名が判明したら
  それを読む。**それまで `[permission 拒否]` 節が出ないことを「拒否ゼロ」と読まない。**
- **次**: 修正後の run の Step Summary を読み、拒否された tool と対象を実測で名指しする。
  Bash だけなら設計どおり (許可パターンは prefix 一致)。Edit / Write が拒否されているなら
  `--permission-mode dontAsk` と `--allowedTools` の相互作用を疑う。
- **完了条件**: 拒否の内訳を実測で示し、(a) 設定を直して書き込みが通る か
  (b) 通せない理由を確定して needs-owner へ回す のどちらかまで到達する。
- **禁止**: 回避のために `.github/` や `backlog-routing-policy.json` を触らない
  (ループが自分の権限を広げる口になる)。

### [GSC-ANCHOR-ROWS-01] `pages.csv` のアンカー行を consumer ごとに扱うか決める

タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-08-21]

- **事実 (2026-08-21 実測)**: GSC の page 次元には `#見出し` 付き URL が独立行として入る。
  W33 で **312 行・39,934 imp・clicks 3 (CTR 0.01%)** = page 次元 imp の **26%**。4 週で倍増した。
  日付次元には含まれない (非アンカー合計 ÷ `daily.csv` 合計が 5 週とも 104.4-105.0% で安定)。
  除外前は blog の CTR を 1.90% と読んでいたが、実際は 3.26% だった。
- **問題**: `pages.csv` を読む 5 スクリプト (`build-remediation-queue` / `build-ai-content-queue` /
  `analyze-winning-patterns` / `extract-low-ctr-ranking-pages` / `build-placement-map`) が
  **いずれもアンカー行を明示的に扱っていない**。含めるか外すかが偶然に決まっている。
- **次**: 各 consumer が slug 完全一致で弾いているか前方一致で束ねているかを読む。束ねている経路が
  あれば CTR が半減して見えるので除外する。判定は `analyze-ctr-seesaw.mjs` の `isAnchorRow` を使う。
- **完了条件**: 5 スクリプトそれぞれについて「含める / 外す」を決め、その意図をコードに書く。
  挙動が変わるものは変更前後の出力差を実測で示す。

### [BACKLOG-LOOP-V3-VERIFY-01] v3-unified 移行後の backlog-loop 日次 run が green か確認する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-08-18] [期日:2026-08-21]

- **背景**: 2026-08-18 に TODO を v3-unified カード構文へ移行した (queue パリティは移行時に
  実測一致: picked 同一・needsOwner 16+意図的2・wip 5)。無人 CI (JST 01:30) が新形式で
  実走して green になることは翌日の run でしか確認できない。
- **実測 (2026-08-21)**: 移行後 3 run とも完了条件を満たしていない。8/18・8/19 は green だが
  **ledger を 1 行も更新せず commit も無い** (最終更新は 8/17)。8/20 は 2 件を実装して gate も
  通したのに `.claude/todo/backlog.md` を書き換えられず、verify が `gate-passed-but-not-removed` で
  run ごと落とし実装差分も ledger も破棄された (108 turn / $16.21)。3 run とも同じ 2 件を選び直している。
- **対応済み (`9af614eb2`)**: 拒否の内訳を Step Summary に出すようにし、prompt を「消してから記録する」
  順序へ変更した (消せなければ deferred に落とし、実装差分と ledger は push される)。
- **次**: 原因の確定は `BACKLOG-LOOP-PERMISSION-01` へ切り出した。本カードは
  **修正後の run が 1 回 green になるまで残す**。
- **完了条件**: 移行後の日次 run が 1 回 green (行削除があった場合は verify も通過)。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [起票:2026-08-17]

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

### [SITEMAP-BLOG-ENTRIES-DRIFT-01] ブログ公開で sitemap-blog-entries が更新されない

タグ: [起票:2026-08-17]

- **owner**: Claude Code
- **問題**: `apps/web/src/config/sitemap-blog-entries.ts` を**再生成する経路が
  `sync-snapshots.yml` (手動 dispatch のみ) の `sync-ranking-keys` job にしかない**。
  一方 `--check` は `pr-quality-check.yml` (main への全 PR) で走る。したがって
  **ブログを公開しても sitemap は更新されず、次に main へ PR を出した人が必ず落ちる**。
- **実測 (2026-08-17)**: PR #798 の Static Gates が
  `❌ sitemap-blog-entries がコミット済みの内容と一致しません (R2: blog 430 / tag 60 / survey 73)`
  で失敗。原因は当日の `blog-generate-daily` が公開した
  `bread-consumption-expenditure-vs-site-area-per-dwelling`。checker のメッセージが言うとおり
  「sitemap に載らない公開記事がある」状態が、誰かが main へ PR を出すまで検知されない。
- **これは検知の穴でもある**: 公開から次の main PR までの間、新しい記事は sitemap に載らない。
  `blog-auto-publish.yml` は R2 へ記事を出すが sitemap 生成物には触らない (grep 実測: 当該
  スクリプトを参照するのは `sync-snapshots.yml` と `pr-quality-check.yml` の 2 つだけ)。
- **次**: `blog-auto-publish.yml` の公開成功後に再生成 + commit-back を足すか、
  日次 cron (`blog-remediation-daily.yml` 等) に寄せるかを決める。**`.github/` を触るので
  人間の PR が要る** (`ACTIONS-EXPRESSION-INJECTION-01` と同じ制約)。
- **完了条件**: 記事を 1 本公開したあと、main への PR を出さずに
  `generate-sitemap-blog-entries.ts --check` が通ることを実測する。
- **禁止**: `--check` を PR ゲートから外して回避しない (sitemap 欠落が見えなくなる)。

### [TILEMAP-LINEAGE-01] タイルマップ 9 枚が SSOT からも data JSON からも再生成できない

タグ: [起票:2026-08-03]

- **owner**: `chart-author`
- **問題**: 公開済みタイルマップ 123 枚のうち 9 枚が現行の 720×720 デザインに移行できていない。内訳は (a) `data/*.json` が R2 に無い 7 枚 = 元データ消失 (`alcohol-prefecture-map/alcohol-consumption-map` / `childcare-friendly-prefecture-ranking/tile-grid-score` / `food-consumption-prefecture-battle/ramen-gyoza-tilemap` / `international-cooperation-volunteer-map/volunteer-rate-map` / `per-capita-income-gap/income-map` / `purchasing-power-adjusted/income-map` / `waiting-children-progress/waiting-children-map`)、(b) 年が確定できない 2 枚 (`fiscal-health-50years-trend/fiscal-map` / `fiscal-self-reliance-gap/fiscal-strength-map`)。
- **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
- **(a) の手順**: `.claude/rules/blog-data-schema.md` §1.7 の restoreMethod に従い SSOT から復元する。SVG の絵から値を逆復元しない。SSOT に該当年が無ければ e-Stat から取り込んで SSOT を伸ばす (`data-ingester`)。届かない図は記事から外すか SSOT にある図に差し替える。
- **(b) の手順**: 両記事の本文は 2022年度 を論じているのに地図は 1988年 (live) を表示しており、再生成すると 1989年 に振れる (SSOT 照合が両年で同程度に一致するため)。どの年の地図が記事の主張に対応するかを人が決めてから `--mapping` で固定する。**確定するまで push しない**。
- **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。

### [DATA-PATIENT-SURVEY-01] 患者調査 (0004026104) の取り込みが0件で3ページが更新不能

タグ: [起票:2026-07-29]

- **owner**: `data-ingester` (座標の実在検証は `estat-researcher`)
- **問題**: `inpatient-rate-per-100k` / `outpatient-rate-per-100k` / `patient-receiving-rate-by-age` の正典 `app/stats/<key>/values.json` が rowCount 0 (generatedAt 2026-07-05)。observationが無く values/normalized writer の対象外になるため配信データを更新できない。3件とも isActive かつ sitemap 掲載済で、2026-05-22 の凍結値が現行値のように見え、`?norm=per_area` は 100 倍のまま。3件が `statsDataId` と `cdCat01` まで完全に同一座標を指しており、少なくとも2件は cdCat01 が誤りと考えられる。
- **次**: `estat-researcher` で 0004026104 の cdCat01 一覧と各コードの意味を確認し、3 metric へ正しいコードを割り当てる。座標が正しいのに0件なら、その統計表が都道府県別の値を持たない可能性を検討する。
- **完了条件**: 3件の `app/stats/<key>/values.json` が rowCount > 0 になり、sync-snapshots 後に `audit-ranking-data-integrity` の実在欠落と絶対鮮度違反が0件になること。
- **機械検知**: 週次 `ranking-integrity-audit-weekly.yml` が実在と絶対鮮度でこの3件を検出し `ranking-alert` を起票するため、放置しても埋もれない。

### [RELATED-RANKINGS-TAGS-01] ブログ関連ランキングが常時非表示

タグ: [起票:2026-07-24]

- **owner**: Claude Code
- **問題**: metric configの`tags`が全件空で、`RelatedRankingsSection`が必ず0件。tagごとに約5MBの`all.json`を読む設計も非効率。
- **次**: category/themeからの決定的tag導出と、高流入metricへの人手tagのどちらを採るか決める。同時に全tagを1 fetchでfilterする。
- **完了条件**: 関連性のある候補だけが描画され、0件時の不要fetchがなく、R2モノリス読込回数が1以下。

### [LOCAL-FINANCE-CHART-HOVER-01] local-financeチャートのhover再現

タグ: [実行:ユーザー] [起票:2026-06-19]

- **owner**: Claude Code
- **次**: 実ブラウザの `/themes/local-finance` でpointer event、overlay rect、CSS clipping、z-index、hydrationをDevToolsで切り分ける。
- **完了条件**: 原因を再現testへ固定し、見た目を変えずtooltip操作を回復する。

### [COCONALA-PRODUCT-FACTORY-01] 14テーマパックの商品化

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **次**: Office実機検証を1商品ずつ行い、P-14に家計・消費の代表datasetを接続する。note channelは14パックから決定的に導出し、旧174商品前提を除去する。
- **完了条件**: catalog、dataset、Office成果物、validatorが一致し、最初の1商品を出品判断できる。出品操作はユーザーが行う。
- **正典**: `.claude/rules/coconala-product-standards.md` / `.claude/skills/product/build-coconala-product/`

### [THEME-PORTFOLIO-REMAINDER-01] テーマ分類・カタログの残工程

タグ: [起票:2026-07-04]

- **owner**: Claude Code
- **統合元**: `THEME-TAXONOMY-REORGANIZE-01` / `THEME-CATALOG-QUALITY-01` / chart expansion。旧 guidance card 案は 2026-08-25 に指標ハブ契約へ置換済み。
- **次**: 22テーマreviewの結果から、欠測・重複・定義誤認だけを修正する。分類再編は重複matrixと移行影響が確定するまで実装しない。
- **完了条件**: catalog validator、選定provenance、分類契約が一致し、UI変更はテーマ単位の小さな差分で検証する。
- **正典**: `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md` / `theme-taxonomy-reorganization.md` / `.claude/rules/theme-catalog-standards.md`

### [KAIYU-HUB-01] 回遊面ハブ化のread-only監査

タグ: [起票:2026-07-09]

- **owner**: Claude Code
- **次**: blog/ranking/theme/area/surveyの既存リンクをread-onlyでグラフ化し、壊れ・重複・noindex/410を除外したpilot候補を1 placementだけ選ぶ。
- **完了条件**: reason code、dedupe、GA4 impression/click/continue契約とbefore baselineを定義する。監査結果の確認前にUI実装しない。
- **正典**: `.claude/skills/analytics/seo-audit/reference/site-navigation-graph.md`

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **trigger**: note既存記事の流入・クリックを確認し、上位1シリーズだけをpilotできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。

### [NOTE-MAGAZINE-REORG-01] note既存投稿のマガジン再編成 + 新規投稿の増産

タグ: [実行:windows] [起票:2026-08-03]

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

### [BUZZ-MAP-FOLLOWUP-01] buzz-map投稿とdeep-click計測

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **次**: 公開済みlandingとのexact matchを満たす素材だけを対象に、投稿→landing→deep clickを一つのUTM契約で測る。
- **完了条件**: attribution欠損、重複投稿、landing不一致をgateで停止する。

### [MIGRATION-FLOW-PHASE23-01] 人口移動 月次/年次 workflowの生成ステップ未実装

タグ: [起票:2026-08-01]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [RANKING-AICONTENT-UI-UNIFY-HELD] ranking考察セクション統合の保留差分

タグ: [実行:ユーザー] [起票:2026-06-21]

- **owner**: Claude Code
- **次**: 現在の`page.tsx`と2コンポーネントに差分が残るかを再監査し、他セッション変更と混在していれば実装し直さず分離する。
- **完了条件**: UI変更を続ける価値がある場合だけvisual回帰込みで単独PR化し、不要なら差分を安全に廃棄する判断をユーザーへ返す。

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [実行:ユーザー] [起票:2026-07-10]

- **owner**: Claude Code
- **trigger**: e-Statで2025年年報の公表を確認できること。
- **次**: 既存697 metricの年次更新を先に行い、需要確認済みの中分類だけを第2弾へ追加する。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。
- **正典**: `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`

### [BACKLOG-LOOP-PHASE23-01] バックログ処理ループの学習 (Phase 2) と指標バックログ取り込み (Phase 3)

タグ: [起票:2026-08-17]

- **owner**: Claude Code
- **前提**: Phase 0 (分類・台帳・gate 突合) と Phase 1 (日次 CI `backlog-loop-daily.yml`) は
  実装・マージ済み (PR #789)。実案件 2 件が実際にループを通っている
  (`RANKING-ITEM-CITY-ONLY-01` = misconception-close / `SYNC-SNAPSHOTS-ALLORNOTHING-01` = impl-small)。
  **schedule は default branch の workflow しか発火しない**ので、main に載るまで日次ループは動かない。
- **次**: 下の 1 → 2 → 3 の順で進める。
  1. **初回 3〜5 run を観測する。** 見るのは「宣言だけの削除 0」「許可外 diff 0」「分類の妥当性」。
     これを満たすまで件数 (`LIMIT`) を上げない
  2. **Phase 2 = routing policy の自動学習。** `update-routing-policy.mjs` + 週次 workflow。
     ledger と `.claude/state/metrics/claude-usage/history.csv` の実測から class×model の成功率を出し、
     `guards` (minSamples 8 / windowDays 28 / 昇降格しきい値) を通ったときだけ policy を書き換える。
     実測が足りなければ**変更しない** (effect-verdict の「判定不能は pending に留める」と同じ思想)
  3. **Phase 3 = 06 指標バックログの取り込み。** `indicator-expansion` class を足し、
     estat 実在検証 → config 生成 → `validate:config` / `validate:years` を draft PR で通す
- **完了条件**: policy 更新が minSamples ガードを通って 1 回成立し、その diff と
  `.claude/state/metrics/prompt-evals/` の出力が残っている。
- **禁止**: 実測が揃う前に件数を上げない (ai-content が limit 10 で timeout に当たり 0 件になった前例)。
  escalation の梯子に opus を入れない (sonnet → fable → 人間)。
  **リポジトリ全体の agent frontmatter `model:` を自動変更しない** — 実測を添えた提案 PR までで人間が承認する。
  ループに `.github/` と routing policy を触らせない (verify の禁止パスを緩めない)。
- **正典**: `.claude/rules/backlog-loop.md` / skill `/process-backlog` /
  agent `backlog-processor`・`backlog-solver-hard`

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 13 件

タグ: [実行:ユーザー] [起票:2026-07-30]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない** (2026-08-17): 対象が `.github/` だけで、ループの verify は
  そこを**禁止パス**にしている（workflow を書き換えられると allowedTools・許可パス・timeout・
  モデルを自分で緩められるため）。status を pending のままにするとループが毎回 pick して
  `class-needs-pr` で skip し、枠だけを消費する。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所が 13 件残っている。dispatch できる者が任意コードを実行できる類型。private repo で dispatch 権限者は push もできるため実効的な権限昇格ではないが、衛生上の負債。
- **★この負債は現在 CodeQL に検出されていない** (2026-07-30 実測): `.github/workflows/security-scan.yml` の init は `languages: javascript,typescript` で、**workflow ファイル自体は走査対象外** (走査には `languages: actions` が要る)。PR #655 で出た CodeQL 3 件はこれとは無関係で、`.claude/scripts/` の `execSync(テンプレート文字列)` = `js/command-line-injection` だった (同 PR で argv 形式へ是正済)。**「CodeQL が出たら workflow の式インジェクション」と早合点しない** — 2 度誤診した。
- **対象**: `blog-auto-publish` / `blog-remediation-daily` / `fetch-metrics-weekly` / `improvement-log-reminder-weekly` (2) / `migration-flow-weekly` (2) / `publish-ai-content` / `sns-weekly-report` (2) / `sync-snapshots` (3)
- **次**: 各 step に `env:` ブロックを足し、`run:` はシェル変数だけを参照する形へ書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと 13 件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失の図表 残り11枚 (SSOT側の欠落が律速)

タグ: [起票:2026-08-12]

- **owner**: Claude Code
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

### [SYNC-SNAPSHOTS-MANIFEST-CARRY-01] sync-snapshots の「差分 push」が CI では毎回フル push になる

タグ: [起票:2026-08-17]

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

### [SCRIPTS-TYPECHECK-01] `.claude/scripts` を型検査に載せる

タグ: [起票:2026-08-13]

- **owner**: uruhayato373
- **背景**: 2026-08-13 に `scripts` ディレクトリ全件を型検査へ載せた際、`.claude/scripts` だけ
  免除として残した。TS 41 ファイル、compiler option を調整しても error 71 件
  (TS7006 implicit any 39 / TS2339 21 ほか)。素 JS の `lib/*.mjs` core を import する設計なので、
  型付けの方針 (JSDoc で型を付ける / `.d.ts` を置く / core を TS 化する) を決めるところから要る。
- **次**: 方針を 1 つ選び、まず 1 ドメイン (例 `ads`) で実証する。
- **完了条件**: `.claude/scripts/tsconfig.json` が `type-check:scripts` に載り、
  `scripts-type-check-coverage.test.cjs` の `KNOWN_UNCOVERED` が空になる。
- **正典**: `.claude/rules/coding-standards.md`「CI が動かすスクリプトも型検査に載せる」

### [GINI-ALT-SOURCE-01] 等価可処分所得ジニ係数の代替出典

- **owner**: estat-researcher
- **source**: 2026-08-05 の値分布検証 (退役した `gini-coefficient-disposable-income` の後継)
- **背景**: SSDS 0000010112 の `L7501` は **e-Stat 自身が全 48 エリア・全年 "0" を返す**
  (getStatsData で実測確認済み)。整数丸めで配信されておりジニ係数を取得できない。
  config の軸選択は正しく cdCat 是正では直らないため、metric を退役 (isActive:false + GONE) した。
- **次**: 全国家計構造調査 (旧・全国消費実態調査) の都道府県別ジニ係数表を e-Stat で探し、
  小数が保持されている統計表があるか確認する。無ければ厚労省「所得再分配調査」も当たる。
- **完了条件**: 47 県 × 小数値を持つ統計表の statsDataId と cdCat を確定し、上の候補表へ移す。
- **禁止**: 整数丸めされた系列を「ジニ係数」として再投入しない (全県 0 に戻るだけ)。

### [CLIMATE-SOURCE-01] 気候変動・猛暑・熱中症の都道府県比較

- **owner**: open-data-curator
- **source**: GitHub #538 / #640
- **次**: 気象庁「日本の気候変動2025」素材集、地点別猛暑日、消防庁の都道府県別熱中症救急搬送を一次資料で確認し、47県比較できる1指標へ絞る。
- **完了条件**: 定義、代表地点の採用規則、分母、年次、一次URLを確定し、既存の最高気温系metricとの非重複を確認して上の候補表へ移す。
- **禁止**: 新聞記事・紙面転記値を観測値のSSOTにしない。

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出

- **owner**: open-data-curator
- **正典**: `packages/data-configs/src/prefecture-statistics-catalog/README.md`
- **次**: 各県ポータルを1巡し、複数県で反復する指標だけを、定義、単位、粒度、年次、一次出典付きで上の表へ追加する。
- **完了条件**: 47県を確認し、既存metricとの非重複と全国比較可能性を検証する。

### [SSDS-EDU-DIFFUSION-CODE-01] 教育普及度 2 指標の代替コード特定 (または退役)

タグ: [起票:2026-08-16]

- **owner**: estat-researcher
- **trigger**: `expected-empty.ts` の期限 **2026-11-30** まで。期限を過ぎると allowlist が失効し
  data-refresh が再び 0 件ゲートで落ちる。
- **事実 (実測)**: `kindergarten-education-diffusion-rate` / `nursery-education-diffusion-rate` が
  参照する SSDS 0000010205 の cat01 から `#E0910101` / `#E0910102` が消滅した。現行 59 コードに
  該当なし・名称に「普及」を含むコードも 0 件・`#E091xxxx` の命名帯自体が現行カタログに無い。
  同表の実在コード (`#E0110104`) は 1392 行を正常返却するので、表の廃止ではなく指標コードの改廃。
- **次**: SSDS の指標コード改番履歴を追い、同義の後継コードがあれば config の cdCat01 を差し替える。
  無ければ退役 (isActive:false + GONE + KNOWN/SITEMAP/INDEXABLE 再生成) へ切り替える。
- **完了条件**: 代替コードで 47 県ぶんの値が取れることを dry-run で実測するか、退役の連動を
  完了して `expected-empty.ts` から 2 エントリを削除する。
- **注意**: 既存の配信データ (1,664 / 1,615 行) は生きているのでページは正常に見える。
  「表示が正常＝データが更新されている」ではない。

### [CONSTRUCTION-ORDER-ALT-01] 建設工事受注データの代替出典を採るか判断する

タグ: [起票:2026-08-16]

- **owner**: theme-designer
- **背景**: 2026-08-16 に `construction-contract-*` 8 件 + `noise-regulation-rate` を退役した
  (e-Stat 側で統計表が廃止・後継なし。詳細は `gone-ranking-keys.ts` の 2026-08-16 エントリ)。
- **代替候補**: 「元請完成工事高」(業種別 × 都道府県別、statsDataId `0003126332` 2011-/`0003126364` -2010)。
  ただし旧指標の「工事種類別 (住宅/道路/河川/下水道/港湾空港/災害復旧)」とは**軸が違う**
  (契約業者の業種分類)。既存 `prime-contractor-completed-construction` (SSDS 0000010103) と
  概念が重複する可能性もある。
- **次**: 重複の有無を確認し、採るなら指標名・subtitle で「業種別」であることを明示して投入する。
  採らないならこの項目を削除する。
- **完了条件**: 採否を決め、採る場合は 47 県ぶんの取得を dry-run で実測する。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [実行:対話] [起票:2026-05-19]

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

### [CPI-NATIONAL-EMPTY-STATE-01] テーマページで全国選択時に cpi-profile / cpi-heatmap が無言で消える

タグ: [種類:改善] [起票:2026-08-04]

テーマページで全国を選ぶと cpi-profile / cpi-heatmap が無言で消える。CPI 地域差指数表は全国行を持たず `prefCode=00000` で 0 件 → null 返却。「全国平均=100 の指数なので全国は表示しない」旨の案内を出すか、全国選択時はカード自体を隠すか要判断

根拠・再現条件: `/themes/consumer-prices` を全国表示。`fetch-db-chart-data.ts` の `fetchCpiProfileData` / `fetchCpiHeatmapData` は `isNational` を受け取らず cdArea=00000 をそのまま渡す

### [NATIONAL-AVG-FALLBACK-LABEL-01] 全国行を持たない 5 チャートの 47 県平均フォールバックが無表記

タグ: [種類:改善] [起票:2026-08-04]

全国行を持たない 5 チャートは 47 県平均へフォールバックする (labor-wages 1 / ports 4)。KPI は「（全国平均）」と明示するがチャート本体は無表記。凡例か注記で出すか要判断

根拠・再現条件: `node .claude/scripts/audit/theme-chart-live-audit.mjs` の `[no-national]` warn

### [THEME-KPI-DECIMAL-PRECISION-01] KPI カードの小数丸めで合計特殊出生率 1.15 が 1.2 になる

タグ: [種類:不具合] [起票:2026-08-04]

KPI カードの小数表示が 1 桁に丸められ、合計特殊出生率の全国値 **1.15 が「1.2」** と出る。0.05 の差でも出生率では意味が変わる。指標の unit / 桁数に応じた表示桁の解決が要る (`.claude/rules/blog-svg-chart-standards.md` の `resolveValuePrecision` と同じ考え方)

根拠・再現条件: localhost `/themes/population-dynamics` の KPI「合計特殊出生率 1.2 （人）」。R2 `app/stats/total-fertility-rate` の全国値は 1.15

### [ESLINT-FEATURE-DEEP-IMPORT-01] features/\*/components で no-restricted-imports が実質無効

タグ: [種類:改善] [起票:2026-08-04]

**eslint の `no-restricted-imports` が features/\*/components 配下で実質無効**。`eslint.config.mjs:67` が `@/features/*/lib/*` 等の deep import を禁止しているが、同 174-221 の「ドメイン内Barrel強制」ブロックが `src/features/*/components/**` に対しルールを丸ごと上書きするため、**component ファイルからは他 feature の内部実装を自由に deep import できてしまう**。今回 1 件是正したが、他にも同型が残っている可能性。上書きブロックに元の patterns をマージすべきか要判断 (影響が全 feature に及ぶので別タスク)

根拠・再現条件: `eslint.config.mjs` の 61-79 と 174-221 を読む。実例: `CommuteFlowSectionClient.tsx` が `@/features/migration-flow/lib/useFlowFocusPrefecture` を import しても lint が通っていた (2026-08-04 是正済)

### [SMOKE-OGIMAGE-RETRY-01] post-deploy smoke が og:image の単発タイムアウトで赤くなる

タグ: [種類:改善] [起票:2026-08-04]

**post-deploy smoke が単発で赤くなることがある**。本番相手に 5 回連続実行して 1 回だけ `1/16 failed` になり、直後の 3 回は 16/16 緑。og:image の実 fetch (`--max-time 20`) がタイムアウトしたか cold start の 5xx が疑わしいが特定できていない。デプロイの gate なので、単発の揺れで赤くなると gate 自体が信用されなくなる。ページ本体と同じく og:image チェックにも短い再試行を入れるか要判断 (chart-provenance は最大 3 回再試行の前例あり)

根拠・再現条件: `bash .github/scripts/smoke-test-routes.sh https://stats47.jp` を 5 回。1 回だけ失敗、再現せず

### [MIGRATION-FLOW-WEEKLY-REOPEN-01] migration-flow-weekly の週次 IG 投稿が停止したまま (設計欠陥未修正)

タグ: [種類:改善] [起票:2026-08-16]

**migration-flow-weekly の schedule を停止したまま (投稿の設計欠陥は未修正)**。`post-instagram.ts:86-88` が gitignored な `.local/r2/sns/<slug>/instagram` を existsSync で要求するため、clean checkout の CI では構造的に必ず失敗する (2026-05-25 から 12 回連続失敗)。8/16 に schedule を削除して無言の失敗を止めたが、**週次の県ローテーション IG 投稿そのものが止まったまま**。再開するなら post-instagram-scheduled.yml と同じ「公開 R2 URL を IG Graph API に渡す」経路へ寄せるか、post step 前に R2 から pull する step を足す

根拠・再現条件: `.github/workflows/migration-flow-weekly.yml` (冒頭コメントに経緯)。成功している手本 = `.claude/scripts/instagram/post-from-schedule.cjs` の `PUBLIC_R2_BASE` 経由

### [MUSEUM-COUNT-AXIS-01] 博物館系 3 指標が類似施設を除外して実在県を 0 にしている

タグ: [種類:不具合] [起票:2026-08-05]

**博物館系 3 指標が「類似施設」を除外して実在県を 0 にしている**。`botanical-garden-count` は登録+相当の 10 館のみ集計だが同調査の博物館類似施設に植物園が 107 館・33 県ある。`zoo-count` は 35 館のみで類似施設の動物園 59 館・26 県を除外 (大分等が 0 表示)、`aquarium-count` は 38 館のみで類似施設 46 館・28 県を除外。cdCat の集計軸を見直すか、指標名を「登録博物館のみ」に改めるかの判断が要る

根拠・再現条件: e-Stat 0003348811。値分布の検証キャンペーンで検出。未検証キューに残置

### [HEALTH-CHECKUP-RATE-RETIRE-01] health-checkup-rate-lifestyle-diseases が 2017 年以降 全国値 0%

タグ: [種類:不具合] [起票:2026-08-05]

**`health-checkup-rate-lifestyle-diseases` は全国値も 2017 年以降 0.0%**。1997 年と 2008 年に定義・実施主体が変わり、いまの系列は保健所実施分のみ = 実際の受診率と別軸。ランキングとして意味を成していないので、代替出典 (特定健診の法定報告等) への差し替えか退役かの判断が要る

根拠・再現条件: e-Stat 0000010209。未検証キューに残置

### [PORT-PASSENGERS-MISSING-COASTAL-01] port-passengers-total から沿岸 13 県が消えている

タグ: [種類:不具合] [起票:2026-08-05]

**`port-passengers-total` から沿岸 13 県が消えている**。欠落 21 県のうち新潟・千葉・宮城・熊本等 13 県は沿岸県。新潟は 2009-19 年に約 300 万人を計上していたが 2020 年以降消失し、2021 年は 6 行しかない。他の港湾系 (39 行) と件数が違う理由が説明できず、集計軸か調査対象の変更を疑う

根拠・再現条件: e-Stat 0003130737。R2 `app/stats/port-passengers-total/values.json` の年別行数を確認。未検証キューに残置

## 🟢 低 — 時期未定・条件付き (trigger は本文に)

### [DISPATCH-FRESHNESS-PRECISION-01] main 反映順チェックの入力パス判定を workflow ごとに絞る

タグ: [起票:2026-08-17]

- **owner**: Claude Code
- **前提**: `check-dispatch-freshness.cjs` (2026-08-17 新設) は「main pinned な workflow へ
  dispatch するとき `origin/main...origin/develop` に生成の入力になりうるパスの差分があれば止める」。
  入力パスは `packages/**` / `apps/*/scripts/**` / sync-snapshots の `run.sh` を**広く**取っている。
  transitive import を追い切れず取りこぼすくらいなら広く取る、という判断 (取りこぼしは
  「安全だ」と嘘をつく方向の誤りなので避けた)。
- **課題**: `apps/web/scripts/` には生成器 (`export-*.ts`) と開発ツール (`pre-commit-checks.sh`) が
  同居するため、後者の変更だけでも発火する。実際 `purge-cdn.yml` の dispatch で
  `pre-commit-checks.sh` を理由に止まり、`acknowledgedMainLag` で上書きした
  (purge-cdn が main から動かすのは `purge-cache.ts` だけ)。**上書きが常態化するとチェックが形骸化する**。
- **次**: workflow ファイルから **その job が実際に実行するスクリプト** (`npx tsx <path>` /
  `bash <path>`) を機械抽出し、そのスクリプトが属するパッケージだけを入力パスにする。
  抽出できなかった workflow は現行の広い判定へフォールバックする (安全側)。
- **完了条件**: `purge-cdn.yml` の dispatch が `acknowledgedMainLag` なしで通り、
  かつ 2026-08-17 の事故検体 (sync-snapshots × data-configs 差分) では従来どおり止まる。
  両方向をテストで固定する。
- 関連: `.claude/scripts/lib/check-dispatch-freshness.cjs` / `.claude/skills/db/sync-snapshots/SKILL.md`

### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [起票:2026-07-12]

- **owner**: Claude Code
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。

### [AREA-DATABOOK-REMAINDER] 県データブックの小粒残件

タグ: [起票:2026-07-19]

- **owner**: Claude Code
- **trigger**: 既存47県版の利用実測で、欠損セクションが回遊または検索の阻害要因と確認できたとき。

### [MULTICHANNEL-CONTENT-PRODUCT-01] 商品チャネル横断化

タグ: [起票:2026-07-18]

- **owner**: Claude Code
- **trigger**: ココナラまたはnoteの単一商品で実売、粗利、supportMinutesを測定できた後。
- **正典**: `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`

### [GIS-CROSS-CONTENT-BACKLOG] 統計×GISコンテンツ

タグ: [起票:2026-07-04]

- **owner**: Claude Code
- **trigger**: 既存GIS素材と検索需要が一致する単一pilotを選べたとき。

### [CHART-DARKMODE-BATCH-01] 既存ブログSVGのdark mode対応

タグ: [起票:2026-05-28]

- **owner**: Claude Code
- **trigger**: chart auditでdark mode欠損が主要品質問題として再浮上し、CTR施策より優先すると判断したとき。

### [AUTO-ALERT-CLOSE-01] 古い自動アラートIssueの整理

タグ: [起票:2026-05-16]

- **owner**: Claude Code
- **trigger**: open alertが運用判断を阻害する件数まで再蓄積したとき。
- **制約**: 同種alertが直近3日継続中ならcloseしない。dry-runを先に行う。

### [CLOUDFLARE-INVOICE-01] 請求書PDFと予測値の突合

タグ: [起票:2026-05-16]

- **owner**: Claude Code
- **trigger**: 手動精算漏れが再発するか、請求額が継続して予測から10%以上ずれるとき。

### [CODEQL-JS-BACKLOG-01] CodeQL JS/TS の既存 alert 9 件

タグ: [起票:2026-07-30]

- **owner**: Claude Code
- **背景**: 2026-07-30 に `security-scan.yml` へ SARIF ダンプを配線して初めて中身が見えた (それまでは件数だけが見え、Security タブと code-scanning API はどちらも一部セッションから 403 で読めなかった)。ブランチ全体で当初 12 件。同日に 3 件を是正 (`js/incomplete-html-attribute-sanitization` × 2 = EPUB を壊す実バグ、`js/identity-replacement` × 1 = 死んだ置換)。残り 9 件が本項目。**CodeQL は required check ではないので merge はブロックしない** (`mergeable_state: unstable`)。
- **★9 件すべてこの PR の差分外** (`main` と同一)。CodeQL が一部を「新規」と報告するのは自身の注記どおり "changes were too large" による誤帰属。件数は `node .github/scripts/dump-codeql-sarif.mjs sarif-results` が Security Scan job の summary に出す

| severity | rule                                          | file:line                                                                                                                                                                                                        | 評価                                                                                                                                                                                                                                                         |
| -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9.1 × 4  | `js/request-forgery`                          | `packages/gis/src/geoshape/adapters/{fetch-topology-from-r2.ts:59,geoshape-api-client.ts:22}` / `packages/gis/src/mlit/adapters/fetch-mlit-from-r2.ts:56` / `packages/r2-storage/src/lib/operations/fetch.ts:61` | 未評価。R2 key / dataId を URL に組む経路。key の形を検証 (`/^[a-z0-9/_.-]+$/` 等) して塞げる見込み                                                                                                                                                          |
| 7.5 × 4  | `js/path-injection`                           | `packages/gis/src/geoshape/services/geoshape-service.ts:54,55,81,82`                                                                                                                                             | 未評価。areaCode 由来のパス結合と思われる。コード形式の検証で塞げる見込み                                                                                                                                                                                    |
| 6.3      | `js/shell-command-injection-from-environment` | `apps/admin/lib/server/jobs.ts:68`                                                                                                                                                                               | **実危険度は低い**。gallery は localhost 専用 (127.0.0.1 固定)。taint 源は `process.env.STATS47_PROJECT_ROOT` で、これを設定できる者はすでにローカルでコードを実行できる。`regenerate()` は `kind` をホワイトリスト・`keys` を `/^[a-z0-9,_-]+$/` で検証済み |

#### 是正済 (2026-08-17・9 件中 7 件)

`prefCode` の書式検証 (`/^\d{2}$/`) を **補間する直前の 2 箇所**に置いた。`request-forgery` 3 件と
`path-injection` 4 件はどちらもこの経路を指しており同時に塞がる。

| 置いた場所                                                | 直前の状態                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/gis/src/mlit/utils/mlit-r2-path.ts`             | **一切検証せず** R2 key とローカルのファイルパスへ補間していた = **唯一の実バグ** |
| `packages/gis/src/geoshape/utils/geoshape-url-builder.ts` | `extractPrefectureCode` (= `substring(0,2)` のみ) の戻り値を無検証で補間          |

検証器は `packages/gis/src/utils/prefecture-code.ts` (`isValidPrefectureCode` / `assertPrefectureCode`)。
**`packages/area` の `extractPrefectureCode` は変えていない** — 5 桁の市区町村コードから県コードを
切り出す用途では現在の挙動が正しく、厳格化すると area 全体に波及するため。

テストは `packages/gis/src/{utils,mlit/utils}/__tests__/` に新規作成 (mlit にはテストが 1 本も
無かった)。正常系のパスが**変わらない**ことと、不正値で throw することの両方を固定した。
gis 123 件 + `apps/web` type-check green。両呼び出し元 (`geoshape-service.ts` の
`tryReadLocalMlitFile` / `fetchMlitTopologyFromR2`) はどちらも try/catch で geoshape へ
フォールバックするので、throw で表示が壊れる経路は無い。

- **残り 2 件**: `packages/r2-storage/src/lib/operations/fetch.ts:61` は同ファイル L21 の
  `isSafeR2Key` が L89 で**先に**効いており多層防御済み (CodeQL が sanitizer を認識していない)。
  コードを変えず dismiss するか、CodeQL が追える `new URL(key, base)` 形へ書き換えるかの判断が要る。
  `apps/admin/lib/server/jobs.ts:68` は `sh -c "A && test -f plan && B"` の argv 化
  (`startJobSteps(kind, steps)` を足し `test -f` を `fs.existsSync` へ移す)。単体テスト先行。
- **次**: SARIF ダンプで 7 件が消えたことを実測する。その後に残り 2 件を判断する
- **完了条件**: SARIF ダンプの表で該当行が消える。gallery の regenerate が実際に 1 回成功する (画像生成が走るので `--max-generate` を小さくして確認)
- **制約**: gallery は動いている開発ツール。E2E 検証には実際の画像生成が走るため、step runner は単体テストで先に検証してから配線する。**severity の数値を推測で書かない** — SARIF ダンプの実測値だけを使う (このセッションで request-forgery を medium、html-attribute を新規 medium 2 件と 2 度誤認した)

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。

### [THEME-SIDENAV-MOBILE-DOM-01] ThemeSideNav が xl 未満でも DOM に残り転送量を食う

タグ: [種類:改善] [起票:2026-08-04]

テーマ左レール (`ThemeSideNav`) は xl 未満で `display:none` のまま DOM に残る (PageShell の `hidden xl:block`)。表示はされないがモバイルでもテーマ 22 リンクが HTML に含まれる。既存の右レールと同じ挙動なので緊急ではないが、テーマページは全 22 ページで効くため転送量を測って判断したい

根拠・再現条件: `/themes/population-dynamics` を 375px で DOM 検査 (`nav[aria-label="テーマと地域"]` の rect width = 0 だがリンク 22 件が存在)

### [VALUE-DISTRIBUTION-UNVERIFIED-01] 値分布の未検証 2 件 (幼稚園費・鉄道投資) の裏取り

タグ: [種類:改善] [起票:2026-08-05]

**値分布の未検証 2 件は根拠を得られず保留**。`kindergarten-expenses-prefecture` は全国計=47県合計で欠損は無いが、非ゼロ 15 県 (長野 116 億等) が県立園費なのか私学助成なのか特定できず 0 の性質が不明。`general-project-investment-railway` は非ゼロ 25 府県が整備新幹線等と対応するものの静岡・広島・沖縄の 0 を裏付ける一次情報が未確認。推測で profile を書かず unverified のまま baseline に残している

根拠・再現条件: `.claude/state/ranking/integrity-audit.json` の valueVerification.unverified。skill `/verify-value-distribution` で消化

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [GIT-HISTORY-SECRET-PURGE-01] Git履歴のAPIキーを扱う方針決定

タグ: [実行:対話] [起票:2026-07-11]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [SCRIPT-ORPHAN-DELETE-01] 役目が終わった orphan スクリプト 6 本の削除可否

タグ: [実行:対話] [起票:2026-08-17]

- **owner**: uruhayato373 (削除可否はオーナー判断)
- **前提**: `SCRIPT-ORPHAN-TRIAGE-01` で orphan **29 本すべてを分類し、残す理由を記録した**
  (下記「orphan 29 本の分類」)。残るのは (a) 群 6 本の削除可否だけ。
- **(a) 役目が終わっている 6 本**: `blog/gen-chart-svg.cjs` (自身が
  「⚠ SUPERSEDED (2026-05-27)」と明記) / `lib/update-skill-primary-agent.cjs` (一回きりの移行) /
  `note/generate-remaining-covers.cjs` (一回きりの一括生成) / `note/inject-affiliate-blocks.mjs`
  (一回きりの一括注入) / `sns/backfill-x-templates.cjs` (一回きりの backfill) /
  `estat/estimate-city-data-size.mjs` (廃止済み永続 D1 の行数試算が前提)。
- **次**: オーナーが 6 本の削除を承認する。承認後は git rm するだけ (履歴から復元可)。
- **完了条件**: 6 本が削除されるか、残す理由が本エントリに追記されている。
- **禁止**: (b)(c) 群を巻き込んで一括削除しない。

#### orphan 29 本の分類 (2026-08-17 実測・`check-agent-skill-consistency.cjs`)

エントリ記載の 20 本は古い。実測は **29 本**。全件に残す/消す理由を付けた。

**(a) 役目が終わっている 6 本** → 上記のとおり削除候補 (オーナー判断)

**(b) 生きているバックログに紐づく 13 本** → 消さない。紐づけ先が閉じるまで資産として残す

| 紐づけ先                                                                        | スクリプト                                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `MUNICIPALITY-SCOPE-SEPARATION-01` (旧 CITY-PAGES-REVIVAL を 2026-08-21 に統合) | `db/export-city-local-finance.cjs` / `estat/{etl-city-stats,fetch-city-local-finance}` / `gsc/inspect-cities-sample.cjs`            |
| `BLOG-SVG-LINEAGE-RESTORE-01` (in-progress)                                     | `blog/restore-{findings,ranking,scatter}-from-svg.mjs`                                                                              |
| `NOTE-MAGAZINE-REORG-01` (in-progress)                                          | `note/{note-magazine,fetch-note-magazines,fetch-magazine-members}.mjs` / `note/probe-{create-form,magazine-create,magazine-ui}.mjs` |
| `CHART-LINEAGE-RESIDUAL-01` (pending)                                           | `blog/resolve-scatter-axes.mjs`                                                                                                     |

`restore-*-from-svg.mjs` は名前に反して**逆復元をしない** — 旧 SVG の表示値を
「SSOT が正しいことの照合先」としてのみ使い、≥0.95 一致したときだけ SSOT から再生成する
(`.claude/rules/blog-data-schema.md` §1.6 の捏造防止規約に適合)。名前だけで消さない。

`probe-*` は note.com の UI が変わったとき再実行する read-only 調査用。note は SPA で
DOM が変わりやすく、実機 probe なしでは実装を直せない (`kdp-publish` と同じ理由)。

**(c) 用途が判断できない 10 本** → 1 リリース残して未使用なら (a) 群へ落とす

`blog/build-article-data-from-r2.mjs` / `blog/prefecture-food-profile.mjs` /
`blog/select-conformance-candidates.mjs` / `gsc/discover-trends-fetch.cjs` /
`note/affiliate-incremental.sh` / `note/download-affiliate-banners.mjs` /
`note/expand-for-fix.mjs` / `note/publish-new-note.sh` / `psi/generate-cwv-pr.mjs` /
`estat/estimate-city-data-size.mjs` は D1 前提が明確なので (a) へ寄せた

**なぜ orphan 警告を 0 にしないか**: (b) の 13 本は「今は呼ばれていないが消してはいけない」もので、
これを 0 にするには allowlist を作るか無理に参照を生やすことになる。どちらも実態を曇らせる。
warning のまま**理由付きで残す**のが正しい形で、これが本エントリの成果物。

- **完了条件**: orphan 警告が 0 になるか、残るものが「なぜ残すか」を添えて記録されている。

### [T2-RANKING-NORM-SSG-01] ranking正規化派生のURL方針

タグ: [実行:対話] [起票:2026-05-25]

- **owner**: Claude Code
- **次**: queryを別URLへ昇格する案、別rankingKey化、canonical吸収の3案を、検索需要とsnapshot容量で比較する。
- **完了条件**: URL policy、canonical、sitemap、既存queryの扱いを先に決め、実装案を混在させない。

### [MIGRATION-FLOW-IG-01] migration-flow の IG 投稿が 3 か月止まっている

タグ: [実行:対話] [起票:2026-08-13]

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

### [KDP-PUBLISH-REMAINING-01] KDP 残り 22 冊を出すか出版をやめるかの方針決定

タグ: [種類:意思決定] [実行:対話] [起票:2026-08-16]

**KDP 残り 22 冊の出版が手動待ちになった**。日次 cron (`com.stats47.kdp-resume-daily`) を停止し KDP 出品は手動のみへ確定したため (規約 `.claude/rules/coconala-product-standards.md` §8)、`status != listed` の 22 冊は誰かが `/kdp-publish` を回さない限り進まない。1 冊ずつ承認して出すか、出版自体をやめるかの方針が要る

根拠・再現条件: `.claude/config/kdp-listings.json` の status。skill `/kdp-publish`・agent `kdp-operator`。KDP は未公開 10 冊前後で作成数制限に当たるため一度に全部は出せない
