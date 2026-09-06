# バズ地図カード標準 (buzz-map の型・トークン・テーマカタログの正典)

まちの計量舎（@machi_measure）系「日本地図×統計」の SNS カード/動画を stats47 ブランドで量産するための
**実行規約の単一ソース (SSOT)**。企画・生成・改善に関わる agent / skill / 人間はこれに従う。

> **方式**: `sns-content-standards.md` と同じ「rules に規約カタログ 1 ファイル、skill/agent は参照のみ」。
> **機械値（色 hex・キャンバス px・fps 等）の正本は `apps/remotion/src/features/buzz-map/tokens.ts`**。
> 本ファイルには値を転記しない（二重管理禁止）。値を変えるときは tokens.ts を編集し、§6 決定ログに日付付きで追記する。
> 競合分析・企画の背景は obsidian vault `memos/20260715_proposal_stats47バズ地図テンプレ/`（読み物）。

---

## 1. 型（フォーマット）

| 型 | 内容 | コンポジション | 用途 |
|---|---|---|---|
| **型A** | 静止画・二値/少区分マップ | `BuzzMap-Still-{45,11,169,916}` | 「該当する自治体はどこ?」の意外な事実系（例: 内陸8県、女性>男性） |
| **型B** | 時系列アニメ・連続量マップ | `BuzzMap-Reel-{11,916}`（静止画化は `BuzzMap-Still-*` に `year`/`showSummary` props） | 長期トレンドの実感系（例: さくら開花日の50年）。30〜60秒 |
| **型C** | 静止画・点プロット（白地図＋accent 点） | `BuzzMap-Still-{45,11,169,916}`（`data.points`＝凡例 rowKey → `[lon,lat][]`。`spec.pointRadius` 任意） | 「◯◯をプロット」系（例: 乗降5千人以上の駅、ダム、道の駅）。点は本土＋沖縄インセットに自動振り分け投影 |
| **型D** | 線ネットワーク（白地図＋accent 線）。静止画＋時系列リール | `BuzzMap-Still-*`（静止画・全網図 or `year` prop で特定年）／ `BuzzMap-Reel-{11,916}`（`lineYearProp`＋`years` で供用開始年ごとに伸びる時系列） | 「◯◯網はどう伸びたか」系（例: 高速道路網 N06、鉄道網 N02）。`data.linesAsset`＝staticFile パス（topojson/GeoJSON）。線は本土/沖縄インセットに centroid で自動振り分け。`spec.lineWidth` 任意 |
| **型E** | レイヤー合成（塗り＋点＋線を1枚に重ねる・静止画） | `BuzzMap-Still-{45,11,169,916}`（`data.values`＋`data.points`＋`data.linesAsset` の任意組。`pointFill`/`lineStroke` で塗りと色分離、凡例 row の `marker`＝fill/point/line） | 「◯◯（塗り）×△△（点/線）」の掛け合わせ系（例: 転入超過×高速道路網、過疎×医療機関）。e-Stat 塗り × 国土数値情報 点/線 のクロスが主戦場。合成は `merge-buzz-map-specs.ts` で既存 spec 2 つをマージ |

### 共通レイアウト（全カード固定・5要素）

1. **タイトルブロック（左上）**: 本題＋1行サブコピー（疑問形・自分事化）。**最大2行**、2行になる場合は
   spec の `titleLines` で助詞の前に手動改行（中途半端な折返しを許さない）
2. **出典（右上・極小）**: データ出典＋加工者表記＋ `stats47.jp`（転載時の透かし）
3. **沖縄・南西諸島インセット（左上の海域）**: 本土が空ける左上海域を**大きく使い切る**（4:5/1:1 で幅46%×高さ32%、916 は高さ20%。2026-07-16 拡大）。ヘアライン枠＋**枠内**ラベル必須。描画は先島〜沖縄本島の弧（**大東諸島は fit を間延びさせるため非描画** = §3 の外れ島扱い）。16:9 のみ非表示（本土トリム）
4. **凡例カード（右下）**: 型A は区分名＋**件数必須**（色だけに頼らない補助。海色上の social accent は
   コントラスト 2.98:1 のための必須要件）。型B はブルー単色ランプ＋目盛
5. **ブランド行（左下）**: `stats47.jp 統計で見る都道府県`（全カード共通・固定位置）

### 配色規則（3テーマ制・2026-07-16〜）

- **カード全体の配色は 3 テーマから選ぶ**（`spec.theme`・既定 `blue`。パレットの機械正本は `tokens.ts` の `BUZZ_MAP_THEMES`）:
  - `blue` … 淡青の海＋白い陸（初期ルック・既定）
  - `dark` … ダークネイビー「夜の日本」。ネオンピンク/シアン強調。IG フィードでの停止力・本家（淡色系）との差別化に最適
  - `paper` … 生成り紙アトラス。朱×深緑のヴィンテージ地図帳
- **テーマ内の色は固定**（テーマ＝シリーズの顔）。テーマの追加・パレット変更は tokens.ts 編集 + §6 決定ログとセット
- 強調色は **social（人口・社会系）/ infra（インフラ・経済系）の2択固定**でシリーズ認知を作る（実色はテーマごと）。
  連続量は**テーマごとの単色ランプ（`BUZZ_MAP_RAMPS`・虹色禁止）**、増減の分岐が要る場合は blue↔red＋中立グレー（未実装・要決定ログ）
- blue は dataviz 検証器で検証済み（social×infra: CVD ΔE 13.4）。**トークン変更時・dark/paper を投稿主力にする前に再検証**する

### アスペクト比

| ratio | 実寸 | 用途 |
|---|---|---|
| `45` | 1080×1350 | **静止画の既定**（X・IG フィード） |
| `11` | 1080×1080 | X 動画・IG 正方形 |
| `916` | 1080×1920 | IG リール・TikTok（※TikTok は投稿禁止=素材のみ）・リール表紙 |
| `169` | 1920×1080 | OGP。**本土左寄せトリム・沖縄インセット非表示** |

### 型B の演出規約

- **年カウンター**は右の海域（地図右に 22% の海を確保）・Archivo Bold 数字・地図と重ねない
- **減速カーブ**: 転換点以降を `speed` で遅くする（例: 2000年まで 2.5年/秒 → 以降 1.25年/秒）
- **ラスト静止 2 秒**（`holdSeconds`）で最大・最小のサマリーを表示してから終わる
- 同 spec の最終年静止画（`BuzzMap-Still-* --props` に `"showSummary": true`）を**併投稿用に必ず出す**（静止画→動画の二段導線）

## 2. spec（1カード/1動画 = 1 JSON）

- 型定義の正本: `apps/remotion/src/features/buzz-map/types.ts`（`BuzzMapSpec`）
- 置き場: `apps/remotion/src/features/buzz-map/specs/<id>.json`（**`{"spec": {...}}` の形で保存** ＝ そのまま `--props` に渡せる）
- コード体系: 都道府県=2桁（"01"〜"47"）/ 市区町村=N03_007 5桁
- `level`: `pref` / `muni`（全国市区町村）/ `muni:NN`（県トリム）。muni は県境オーバーレイが自動で乗る
- `theme`: `blue`（既定・省略可）/ `dark` / `paper`（§1 配色規則）。ヘルパーは `--theme` で指定可
- **ダミーデータのカードは `title` に【サンプル】、出典に「実データではありません」を必ず明記**（sample-anim が例）

## 3. ジオデータ

| level | ソース | 備考 |
|---|---|---|
| pref | `apps/remotion/public/prefecture.topojson`（既存共用） | N03_007 2桁 / N03_001 |
| muni | `apps/remotion/public/buzz-map/municipalities.topojson` | smartnews-smri/japan-topography s0010（1.5MB・2021-01-01 時点 1,906 自治体=政令市区含む）。再取得URL はファイル履歴と §6 参照 |
| 地名点（gsi レーン） | R2 `gis/gsi-pni/points.json`（`fetch-gsi-place-names.ts` が生成） | 国土地理院 電子国土基本図（地名情報）ベクトルタイル z15（居住地名=`experimental_nrpt`・admCode あり / 自然地名=`experimental_nnfpt`・峠/山/川 等）。全国点データ `[{name,kana,kind:admin\|nature,featureType,lon,lat,pref}]`。**PDL1.0 準拠・出典明記で商用/SNS 可**（`gsi.go.jp/kikakuchousei/kikakuchousei40182.html`）。取得は一度きり、以後は R2 を読む分析基盤 |

- 本土は固定フレーム（`MAINLAND_BBOX`）に投影。**小笠原・大東諸島等の外れ島は v1 では非描画**（沖縄・先島はインセットに集約。大東諸島はインセットの fit からも除外 = `inInsetDomain`）
- 市区町村の合併・境界改定でデータ年次と地図年次がずれる場合は topojson の年次を明記して差し替える（gis-curator 相談）
- **地名点は居住地名に `admCode`（県コード）が入る**ため県別集計が空間 join なしで可能（「◯◯地名が多い県」等のブログ/ランキング素材化）。自然地名は行政コードを持たない（県別集計は空間 join が要る＝将来拡張）

## 4. テーマカタログ（★企画の台帳）

status: `案` → `spec作成` → `生成済` → `投稿済`（投稿記録の正本は posts.json。ここは企画側の一覧）。

> **候補の供給源（棚卸しの真実源）は `.claude/state/sns/buzz-map-catalog.json`**
> （builder `.claude/scripts/sns/build-buzz-map-catalog.ts` が全供給源をスコアリング・status upsert 保持）。
> **5 レーン**で「利用できるものすべて」を採録する。うち `curated` が SNS 企画の主レーン
> （人が選定した企画 SSOT）、`muni`〜`mlit-dpf` は機械採録の素材レーン:
> - `curated` … **人が選定した企画 SSOT `.claude/scripts/sns/data/buzz-map-curated-ideas.ts`（160件）**。
>   各 idea を score gate（8要素 + landing 補正）・hard gate（license/sensitivity/hook）・
>   landing router（§5 inventory 突合で strategy/readiness 解決）に通し、machine レーンとは
>   `metricKeys`/`aliases` で dedup（`aliasesOf` に被マッチ key を記録）。既存 generated/posted へ dedup した
>   idea は landing readiness を `live` に backfill。router/inventory/contract のコアは
>   `.claude/scripts/sns/lib/buzz-map-{router,inventory,contract}-core.mjs`（純粋関数 + `__tests__/`）
> - `muni` … e-Stat 市区町村指標 210 全量（型A 二値マップ）
> - `pref` … e-Stat 都道府県指標を機械フィルタ ≤400（型A 二値マップ）
> - `ksj` … 国土数値情報 127（登録 42 + 候補 superset）。`renderClass`（point-plot=型C /
>   line-timeline=型D 時系列リール / muni-binary=型A / line-network=型D 静止画 / point-muni=型A PIP /
>   mesh・polygon-overlay・flow=型未対応）と `availability`（r2=即spec化 / registered=要 pipeline /
>   candidate=要登録）付き。**未登録候補の形状（点/線/面）は KSJ 公式ページから機械抽出した対照表**
>   `.claude/scripts/sns/data/ksj-geometry.generated.json`（再生成: `build-ksj-geometry-map.ts`）で確定
>   （公式ページに型表記が無く内容からも点/線/面が確定できない属性表・統計情報 6 件のみ unknown 残置）
> - `mlit-dpf` … 国土交通データプラットフォーム 31（`nlni_ksj`/`dpf_area_data`/`dpf_statistical_data` は
>   KSJ/N03/e-Stat と重複するため除外）。availability=api（GraphQL 取得 → `--geojson` でヘルパーに投入）
>
> **「次に何を作るか」はこのキューの `candidate` から選ぶ**（`--next N` は既定で `curated` レーンの
> eligible かつ landing が blocked でないものを score 降順で払い出す。素材レーンは `--lane muni|pref|ksj|mlit-dpf`）。
> 下の表は spec 作成以降に進んだ**固有テーマの台帳**で、全候補を列挙する場所ではない。status（spec/generated/posted）は
> builder の `--mark-*` で更新し、台帳表にも 1 行足す。型A spec は `build-buzz-map-spec.ts`（e-Stat）、
> 型C/点→自治体 spec は `build-buzz-map-spec-ksj.ts`（KSJ/DPF）で自動生成する。

> **組み合わせ（掛け合わせ・型E）は別カタログ** `.claude/state/sns/buzz-map-combo-catalog.json`
> （builder `build-buzz-map-combo-catalog.ts`）。単品カタログのエントリを部品 (`parts`) に参照し、
> 「ベース塗り × オーバーレイ（点/線）」を 2 層で列挙する: **signature combos**（物語つき定番・
> `story` 必須・~8 本）＋ **機械候補**（e-Stat塗り×KSJ線 / e-Stat塗り×KSJ点 / KSJ指定地域×KSJ点 を
> パターン別に ≤120 件 cap）。`feasibility`（now=全 parts 即マージ可 / needs-pipeline=KSJ塗りが要変換）。
> `--next N [--feasible-only]` で払い出し。合成 spec は `merge-buzz-map-specs.ts` が既存 spec 2 つを
> 型E にマージ（塗り=accent・overlay=accent2 で色分離、凡例に marker 自動付与、出典マージ）。

### カバレッジ表（★何が作れて何が未実装か・全カタログエントリの `capability` の意味）

各カタログエントリは `capability` フィールドで「そのデータから何が作れるか（型と実装状況）」を持つ。
builder が `renderClass`（KSJ/DPF）または `lane`（e-Stat）から機械導出するので、**「地図にできるが未実装」を
取りこぼさず追える**。下表が capability 文言の正典（件数は 2026-07-16 rebuild 実測）。

| capability（renderClass / lane 由来） | 対応する型 | 実装状況 | 件数 |
|---|---|---|---|
| 型A 二値マップ（e-Stat pref） | A | ✅ 実装済 | 409 |
| 型A 二値マップ + 型E 合成の塗りベース（e-Stat muni） | A / E | ✅ 実装済 | 210 |
| 型C 点プロット（KSJ/DPF point-plot） | C | ✅ 実装済 | 62 |
| 型D 線ネットワーク静止画（KSJ line-network） | D | ✅ 実装済 | 15 |
| 型D 線ネットワーク・時系列リール（KSJ line-timeline） | D | ✅ 実装済 | 2 |
| 型C 点プロット（GSI 地名情報・gsi レーン） | C | ✅ 実装済 | 10 |
| 型A 面塗り（KSJ polygon-overlay） | A 流用 | 🟡 要 pipeline（R2 未変換） | 34 |
| 型F メッシュ塗り（KSJ/DPF mesh） | F | 🔴 未実装（標高/将来推計人口/土地利用マップ） | 18 |
| OD/流動矢印（DPF flow） | — | 🔴 未実装（通勤流動・訪日外国人流動） | 3 |
| 形状未確定（unknown） | — | ⚪ 属性表/文書で地図化不能 or 要 datasets.ts 登録 | 15 |

### まちの計量舎の分析タイプ → stats47 カバレッジ（差別化の地図）

本家（@machi_measure）が出す分析タイプを stats47 の型に対照し、**利用できるデータ源と実装状況**を明示する。
「データはあるが未実装」（型F メッシュ・OD 流動）が次の拡張候補。

| 分析タイプ（本家例） | stats47 のデータ源 | 型 / capability | 状況 |
|---|---|---|---|
| 二値/少区分マップ（内陸県・町村） | e-Stat muni/pref 610 指標 | 型A | ✅ 実装済 |
| 時系列塗り（開花日 50 年） | e-Stat（全年観測値） | 型B | ✅ 実装済（sample-anim で実証） |
| 点プロット（乗降 5 千人駅・ダム・道の駅） | KSJ S12/W01/P35 等 62 点データ | 型C | ✅ 実装済（station-5k-plot 実証） |
| 線ネットワーク＋時系列（高速道路網 60 年） | KSJ N06/N05 | 型D | ✅ 実装済（highway-network-growth 実証） |
| 掛け合わせ（過疎の塗り × 医療機関の点） | e-Stat 塗り × KSJ 点/線 | 型E | ✅ 実装済（migration-x-highway 実証・combo カタログ） |
| **標高/傾斜メッシュ・将来推計人口メッシュ・土地利用メッシュ** | KSJ G04/mesh1000r6/L03 等 18 メッシュ | 型F（capability=メッシュ塗り） | 🔴 **データあり・型F 未実装**（次の拡張候補） |
| **通勤流動 OD・訪日外国人流動・幹線旅客純流動** | e-Stat 従業地/通学地集計・DPF ffd/rdpf/lpfs | flow（capability=OD/流動矢印） | 🔴 **データあり・OD 描画未実装**（e-Stat OD は未取得） |
| 平均年齢マップ | e-Stat 年齢階級別人口（算出可） | 型A（要 metric 化） | 🟡 e-Stat から算出可・metric 未登録 |
| 人口重心の移動 | （e-Stat メッシュ人口から算出）| — | 🔴 未カバー（重心算出ロジック未実装） |
| **地名系（宿のつく地名・数字地名・難読地名）** | **国土地理院 地名情報（gsi レーン）** | 型C | ✅ **実装済**（`build-buzz-map-spec-gsi.ts`。居住地名＋自然地名を 2 色プロット） |

> **拡張の優先順**: 「データあり・未実装」の型F メッシュ（18 件）と OD 流動（3 件）が最大の伸びしろ。
> 本家がメッシュ標高・OD 流動を主力にしている領域で、stats47 は現状 型A-E のみ。型F・flow の
> レンダラー追加は計測後の次フェーズ（§6 決定ログに起票してから着手）。
> **地名系は当初 OSM 系統外＝対象外としていたが、一次ソース＝国土地理院 地名情報（PDL1.0・型C で描画可）と判明し
> gsi レーンとして解禁済**（2026-07-16・§6 決定ログ）。地名辞書 OSM は不採用（GSI が権威一次ソース）。

<!-- buzz-map:catalog:start -->
| theme_id | テーマ（固有名） | 型 | level | データ源 | spec | status |
|---|---|---|---|---|---|---|
| sample-landlocked | 海に面していない都道府県 | A | pref | 地理的事実（検証済み内陸8県） | specs/sample-landlocked.json | 生成済（検証用サンプル） |
| sample-anim | 【サンプル】◯◯率の推移 | B | pref | ダミー値（実データではない） | specs/sample-anim.json | 生成済（検証用サンプル） |
| sample-towns-villages | いまも「町」と「村」の自治体 | A | muni | 国土数値情報（行政区域） | specs/sample-towns-villages.json | 生成済（検証用サンプル） |
| migration-inflow-muni | 人が集まっている市区町村はどこか | A | muni | e-Stat 転入超過率 `moving-in-excess-rate`（2020・566自治体） | specs/migration-inflow-muni.json | 生成済・IG draft登録（id 696） |
| station-5k-plot | 1日5千人以上が乗り降りする駅はどこか | C | pref | 国土数値情報 S12 駅別乗降客数（令和4年度・2,858駅） | specs/station-5k-plot.json | 生成済・IG draft登録（id 697） |
| highway-network-growth | 高速道路網はこの60年でどう伸びたか | D | pref | 国土数値情報 N06 高速道路時系列（供用開始年 N06_002・1962-2020・14,805km） | specs/highway-network-growth.json | 生成済・IG draft登録（id 698・31秒リール916） |
| migration-x-highway | 高速道路が通っても人は集まるのか | E | muni | e-Stat 転入超過率（塗り）× 国土数値情報 N06 高速道路網（線） | specs/migration-x-highway.json | 生成済・IG draft登録（id 699） |
| towns-villages | いまも「町」と「村」の自治体はどこか | A | muni | 国土数値情報 行政区域（2021-01・町村932 vs 市974） | specs/towns-villages.json | 生成済・IG draft登録（id 700・sample を本番化） |
| population-growth-muni | 人口が増えている街はどこか | A | muni | e-Stat 社会・人口統計体系 `population-growth-rate`（2020・人口増116自治体） | specs/population-growth-muni.json | 生成済・IG draft登録（id 701） |
| vacant-housing-muni | 空き家が多い街はどこか | A | muni | e-Stat 社会・人口統計体系 `vacant-housing-ratio`（2023・20%以上214自治体） | specs/vacant-housing-muni.json | 生成済・IG draft登録（id 702） |
| no-station-muni | 鉄道駅が1つも無い街はどこか | A | muni | 国土数値情報 S12 駅別乗降客数（令和4年度・点→自治体invert・駅なし611自治体） | specs/no-station-muni.json | 生成済・IG draft登録（id 703） |
| shuku-place-names | 「宿」のつく地名はどこか | C | pref | 国土地理院 地名情報（居住地名1,533＋自然地名52・gsi レーン実証） | specs/shuku-place-names.json | 生成済（gsi 実証。本家と同題材のため投稿は差別化テーマを優先） |
| onsen-place-names | 「温泉」のつく地名はどこか | C | pref | 国土地理院 地名情報（行政338＋自然607・dark テーマ・gsi レーン） | specs/onsen-place-names.json | 生成済・IG draft登録（id 704・R2 素材 200 実測） |
| sakura-bloom-50y | さくら開花日の50年 | B | pref | 気象庁 生物季節観測（issue [#538](https://github.com/uruhayato373/stats47/issues/538)） | — | 案（第1弾候補。交通インフラ系は本家と被るため回避） |
| female-majority-muni | 女性が男性より多い市区町村 | A | muni | 国勢調査（e-Stat） | — | 案（まちの計量舎の令和2年版に対し最新調査で差別化） |
<!-- buzz-map:catalog:end -->

テーマ選定4条件: ①全国地図 ②市区町村粒度が刺されば優先 ③固有名・地元ネタ ④ツッコミ余地（リプで語りたくなる余白）。

## 5. 運用フロー

- **ネタ選定の入口はカタログ builder**: `npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts`
  で候補を再構築 → `--next N --lane muni|pref` で `candidate` 上位を払い出す（真実源 §4 の注記）
- **型A spec（e-Stat）はヘルパーで自動生成**: `npx tsx .claude/scripts/sns/build-buzz-map-spec.ts --metric <key>
  --id <theme_id> --level muni|pref --mode threshold --op gte --value N --title "..." --accent social|infra
  --label-hit "..." --label-miss "..."`（R2 観測値 → 二値化 → `specs/<id>.json`。muni は topojson コード集合と
  join し unmatched を報告）。生成後に `build-buzz-map-catalog.ts --mark-spec <key> --theme-id <id>`
- **型C 点プロット / 点→自治体（KSJ・DPF）は `build-buzz-map-spec-ksj.ts`**:
  `--data-id S12 --version 24 --mode point-plot --filter "S12_057>=5000" --id <id> --title "..." --accent social
  --label-hit "..." [--data-year "令和4年度"]`（R2 KSJ topojson → 属性フィルタ → 代表点 geoCentroid → 型C spec）。
  `--mode point-muni [--invert]` で「◯◯がある/ない自治体」の型A に。DPF は GraphQL 取得した GeoJSON を `--geojson <path>` で投入。
  KSJ指定入力は取得前に`ksj-publication-guard.ts`で検査する。`non-commercial`、部分許諾、未判定の
  座標spec/原典コピーは停止し、公式条件・書面許諾を解決してから利用する（S12はcc-by-4.0）。
  `--r2-key`のKSJ入力と`--geojson`に併記したKSJ IDにも同じ検査を適用する。DPF等のローカル入力は各providerの条件確認が別途必要。
- **型D 線ネットワーク（時系列）は `--mode line-network`**:
  `--r2-key app/highway-history/highway-sections.topojson --id <id> --year-prop N06_002 --title "..." --accent infra
  --label-hit "高速道路 総延長km" [--data-year "1962-2020"]`（R2 線 topojson → `public/buzz-map/assets/<id>.topojson`
  に配置 → `--year-prop` から `years{from,to}` を自動導出＋総延長 km を geoLength で集計し凡例に焼き込み）。
  `--year-prop` があれば時系列リール可（静止画は最新年の全網図、`year` prop で特定年）。`--r2-key`（任意キー）と
  `--data-id/--version`（gis/mlit-ksj 規約パス）の両対応。線 asset は git commit（spec は座標を焼かず参照）
- **型E 合成（掛け合わせ）は `merge-buzz-map-specs.ts`**:
  `--base <塗りspec id> --overlay <点/線spec id> --id <id> --title "..." [--subtitle "..."]
  [--point-fill accent2] [--line-stroke accent2]`（既存 spec 2 つを型E にマージ。base の塗り＋
  overlay の点/線を 1 枚に。色は塗り=accent・overlay=accent2 で自動分離、凡例に marker 付与、出典マージ）。
  組み合わせネタは combo カタログ `build-buzz-map-combo-catalog.ts --next N --feasible-only` から選ぶ
- **地名系（型C）は GSI 地名情報レーン**: まず全国点データを一度取得して R2 に永続化
  （`fetch-gsi-place-names.ts --all` → `.local/gsi-pni/points.json` → `diff-push-r2.ts --prefix gis/gsi-pni`）。
  以後は spec を `build-buzz-map-spec-gsi.ts --pattern "宿" --id <id> --title "..." --accent social
  [--label-admin "..." --label-nature "..."] [--theme dark]` で生成（正規表現で地名フィルタ →
  居住地名＝accent・自然地名＝accent2 の 2 色型C）。候補は `--lane gsi` で払い出す。データ再取得は不要
- **生成の入口は `/buzz-map` スキル**（`.claude/skills/sns/buzz-map/SKILL.md`）。レンダ実行は sns-renderer の担当領域
- **バッチ量産は `prepare-buzz-map-batch.ts`**（dry-run 既定・`--apply` で実行・`--limit 12` 既定・動画 ≤3/batch・
  idempotent）: selectBatch (score 降順 × eligible) → spec → render → R2 push (`sns/buzz-map/` prefix 限定) →
  HEAD 200+Content-Type 検証 → caption (UTM は `sns-utm.cjs` 正典) → **isPostable（commercialUse=allowed・
  sensitivity≠high・landingContract=pass・landing live 200・dedup) 全通過のみ** posts.json draft (store 経由・予約なし)。
  コアは `lib/buzz-map-{batch,router,contract,inventory,utm,attribution}-core.mjs` + `node --test lib/__tests__/`
- **landing router / contract**: 企画→着地の判定は `lib/buzz-map-router-core.mjs`（判定順: 既存ranking→既存blog→
  theme→新規、readiness は live 実測で確定）、SNS と landing の整合検証は `lib/buzz-map-contract-core.mjs`
  （live 200 / canonical クリーン / noindex なし / requiredTerms / metricKeys / 年次）。**contract pass 前の draft 登録は禁止**
- **管理画面はread-only gallery `/buzz-map`**（`npm run admin` → http://127.0.0.1:4747/buzz-map）:
  catalog横断表示 (filter/score/evidence/landing/素材preview) だけを提供する。landing再判定/spec生成/
  レンダ/R2 push/draft登録/投稿/予約は管理画面から実行せず、`/buzz-map`と各配信skillのagentが担う
- **Geo地域分析とは別ドメイン**: buzz-mapは分布を直感把握する地図カード。複数layerの空間演算と
  意思決定説明を価値とするGeo投稿は`/operate-geo-content`の`GeoX-InsightCard`を使い、相互流用しない
- **計測**: `buzz-map-attribution.mjs` が sessionCampaign `buzz-map-*` を campaign 別集計 → `buzz-map-attribution-latest.json` → score 還流入力
  (`buildScoreFeedback`・session 0 は加点 0)。**deep-click (cta_click の content_id/target_type) は GA4 管理画面で
  custom dimension (イベントスコープ) の登録が必要**（affiliate と同手順・未登録の間は session KPI のみ）
- **改善ループ**: 生成 PNG を Read で目視 → 崩れは **spec 側の修正を優先**。カード CSS/レイアウト
  （`BuzzMapCard.tsx`）や tokens.ts を触る変更は **§6 決定ログ追記とセット**（勝手に型を漂流させない）
- **投稿は本カタログの範囲外**: X は §2-9/§2-0（`sns-content-standards.md`）の既存フロー。buzz-map を
  X 画像カタログ（§2-9 image_kind）へ登録する改訂は **§2-10 の人間承認ゲート経由**で行う（未実施）
- 出力先: `.local/r2/sns/buzz-map/<theme_id>/{x,instagram}/...`（gitignored・R2 push は `/push-r2`）
- 頻度リミット・キャプション雛形は `sns-content-standards.md` §1-2 に従う（本ファイルで重複定義しない）

## 6. 決定ログ

- **2026-07-15 基盤新設**: Playwright+ffmpeg の独立パイプライン案を棄却し、既存 Remotion 基盤の feature
  （`apps/remotion/src/features/buzz-map/`）として実装（レンダ入口一本化の規約に従う）。
  デザインは obsidian vault の競合分析＋モック（PR uruhayato373/obsidian#6）から移植
- **2026-07-15 フォント同梱**: レンダ環境（リモート Linux）に Noto Sans JP が無く描画が環境依存になるため、
  @fontsource の japanese+latin サブセット woff2（400/700、計約2.3MB）と Archivo Bold 数字サブセット（2.8KB）を
  `public/buzz-map/fonts/` にコミットし FontFace API でロード（`useBuzzMapFonts`）
- **2026-07-15 市区町村データ**: smartnews-smri/japan-topography s0010 全国版（1.5MB）を public にコミット。
  展開・投影は実行時計算（キャッシュ不要の軽さのため）。外れ島（小笠原等）は v1 非描画
- **2026-07-15 配色検証**: sea/land/accent×2/ランプ7段を dataviz 検証器で確認（CVD ΔE 13.4・
  海色上 social 2.98:1 → 凡例件数ラベル必須を型仕様に固定）
- **2026-07-16 ネタカタログ + spec ヘルパー**: SNS 計画展開のため、e-Stat 由来 metric registry を一次ソースに
  した候補カタログ（`build-buzz-map-catalog.ts` → `.claude/state/sns/buzz-map-catalog.json`、muni 210 全量 +
  pref 機械フィルタ ≤400、status upsert 保持）と型A spec 自動生成ヘルパー（`build-buzz-map-spec.ts`、R2 観測値
  → 二値化 → spec、muni は topojson N03_007 集合と join）を新設。実証 = `migration-inflow-muni`（転入超過率）。
- **2026-07-16 型C 点プロット + KSJ/DPF レーン**: まちの計量舎の駅プロット系に対応するため **型C**（白地図＋点。
  `data.points`＝rowKey → `[lon,lat][]`、点は本土/沖縄インセットに自動振り分け投影）を `types.ts`/`geo.ts`/
  `BuzzMapCard.tsx` に追加（型A/B 非回帰確認済）。カタログ builder に `ksj`（国土数値情報 127＝登録 42+候補、
  renderClass/availability 付き）と `mlit-dpf`（国土交通データPF 31、KSJ/N03/e-Stat と重複する 3 カタログは除外）
  レーンを追加。KSJ/DPF 変換ヘルパー `build-buzz-map-spec-ksj.ts`（point-plot=型C / point-muni=型A PIP /
  `--geojson` で DPF GeoJSON 投入）を新設。実証 = `station-5k-plot`（S12 駅別乗降客数・令和4年度・乗降5千人以上 2,858 駅）。
  MLIT MCP はローカル Mac 依存のため builder は非依存（GraphQL 直＋静的表）。DPF 実データ取得は次ステップ
- **2026-07-16 型D 線ネットワーク（時系列）**: 高速道路網・鉄道網の地図表示と時系列アニメに対応するため
  **型D**（白地図＋accent 線。`data.linesAsset`＝staticFile パス、`lineYearProp`＋`years` で供用開始年ごとに
  伸びる時系列リール）を `types.ts`/`geo.ts`（線を本土/沖縄インセットに centroid 振り分け投影）/`BuzzMapCard.tsx`
  （year フィルタ描画・凡例を線スウォッチ化）/`BuzzMapStill.tsx`（型C/D 専用分岐）/`BuzzMapReel.tsx`（型D は
  型B の年機構を共用）に追加（型A/B/C 非回帰確認済）。ヘルパーに `--mode line-network`（R2 線 topojson →
  public assets 配置 → years 自動導出＋km 集計）を追加。カタログに renderClass `line-timeline`（型D 時系列）/
  `line-network`（型D 静止画）を新設し N06→line-timeline・N02→line-network、未登録候補 N05（鉄道時系列）を
  格上げ。実証 = `highway-network-growth`（N06 高速道路・1962-2020・14,805km、静止画＋リール、1970年=東名/名神のみ
  →2020年=全国網を年フィルタで確認）。N06 は highway-history 派生の R2 asset を `--r2-key` で読む（gis/mlit-ksj
  規約パスには未変換）。鉄道網 N02 の全国 1 枚化は素材 14MB の間引きが要るため次ステップ
- **2026-07-16 型E レイヤー合成 + 組み合わせカタログ**: 「掛け合わせ地図」(e-Stat 塗り × 国土数値情報
  点/線) に対応するため **型E**（塗り data.values ＋ 点 data.points ＋ 線 data.linesAsset を 1 枚に重ねる。
  `pointFill`/`lineStroke` で色分離、凡例 row `marker`＝fill/point/line）を `types.ts`/`useBuzzMapGeo.ts`
  （データ在れば読込）/`BuzzMapStill.tsx`（型E 分岐）/`BuzzMapCard.tsx`（点/線の色分離・凡例マーカー行単位）
  に追加（型A/B/C/D 非回帰確認済）。合成は既存 spec 2 つをマージする `merge-buzz-map-specs.ts` で行う
  （新規データを組まず検証済み spec を部品再利用）。**組み合わせは別カタログ**
  `build-buzz-map-combo-catalog.ts` → `buzz-map-combo-catalog.json`（signature 8 + 機械候補 120 = 128 件、
  即マージ可 124 件、単品カタログを parts 参照・status upsert）。実証 = `migration-x-highway`（転入超過の
  塗り × 高速道路網の線）。KSJ 指定地域塗り（過疎 A17 等）を使う combo は feasibility=needs-pipeline で記録
- **2026-07-16 capability フィールド + カバレッジ表**: 「そのデータで何が作れるか（型と実装状況）」を全 768
  カタログエントリに `capability` として付与（builder が `renderClass`/`lane` から機械導出、欠落 0）。これで
  「地図にできるが未実装」（型F メッシュ 18・OD 流動 3）を取りこぼさず追える。§4 に**カバレッジ表**（capability
  文言の正典 + まちの計量舎の分析タイプ → stats47 実装状況の対照）を追加。実装済 = 型A-E（e-Stat 塗り 619・
  KSJ 点 62・線 17・型E 合成）、データあり未実装 = 型F メッシュ（標高/将来推計人口/土地利用）・OD 流動（通勤/
  訪日外国人/幹線旅客）、系統外 = 地名系（OSM）。KSJ 未登録候補で公式ページから形状抽出できなかった施設系
  P02（公共施設）/P20（避難施設）/S05-c（駅別乗降数）を内容から point-plot に手動格上げ（unknown 9→6、
  残 6 は属性表/統計情報で地図化不能）
- **2026-07-16 IG 投稿バッチ第1弾 (8本・素材+R2+draft)**: まちの計量舎の勝ちタイプに対応する 8 本を
  Instagram 用に量産 (型A 6 + 型C 1 + 型D リール 1 + 型E 1)。新規 spec 3 本 (`population-growth-muni`
  人口増116自治体 / `vacant-housing-muni` 空き家率20%以上214自治体 / `no-station-muni` 駅なし611自治体・
  S12 point-muni invert)、`sample-towns-villages` を本番化 (`towns-villages`)、既存 4 本を IG レイアウトで
  再レンダ。**IG は Graph API が R2 公開 URL を要求**するため、`BuzzMap-Still-45` (1080×1350 4:5) を
  `sns/buzz-map/<id>/instagram/stills/slide-1-cover-1080x1350.png`、highway リールは `BuzzMap-Reel-916`
  (1080×1920・31秒) を `instagram/reel.mp4`、caption を `instagram/caption.txt` に配置 → `diff-push-r2`
  で push (公開 URL 全 8 本 HTTP 200 実測) → posts.json に draft 登録 (id 696-703・`template=buzzmap-<型>`)。
  **予約/投稿はせず draft 止まり** (投稿タイミングは人間判断)。レンダは新 chromium が旧 headless を廃止した
  ため `chromium_headless_shell-1194/chrome-linux/headless_shell` を `--browser-executable` に使う。
  出典は metric config SSOT に合わせ社会・人口統計体系と明記 (特定調査名の過剰主張を回避)。
  既知の未解決: リールの R2 content-type が `application/octet-stream` (投稿時に video/mp4 化が要るか要確認)。
- **2026-07-16 3テーマ制 + 沖縄インセット拡大**: 「本家 (@machi_measure) の淡色ルックに似すぎ」という
  オーナー指摘を受け、旧「海色不変」を撤回し **3 テーマ制** (`spec.theme`: `blue`=初期ルック既定 /
  `dark`=夜の日本・ネオン強調 / `paper`=生成り紙アトラス・朱×深緑) に変更。パレット+単色ランプは
  `tokens.ts` の `BUZZ_MAP_THEMES`/`BUZZ_MAP_RAMPS` (旧 `BUZZ_MAP_COLORS`/`BUZZ_MAP_RAMP` は blue への
  deprecated alias・後方互換。削除条件: 参照ゼロを確認した清掃時)。Card/Still/Reel/lib を `buzzMapColors(spec.theme)` 経由に統一し、凡例スウォッチ枠の
  ハードコード rgba も legendBorder へ寄せた。spec 生成ヘルパー 3 本に `--theme` を追加 (merge は
  `--theme > base > overlay` の順で継承)。**沖縄インセットを拡大** (幅 30%→38%・高さ 15%→20%、916 は
  11%→14%・全テーマ共通)。blue の非回帰は同一 spec の再レンダで目視確認 (差分は沖縄拡大と凡例枠色
  .18→.14 の不可視差のみ)。dark/paper を投稿主力にする場合は dataviz 再検証を先に行う (§1)。
- **2026-07-16 沖縄インセット大型化 + 大東諸島非描画**: 本家の地名プロット系レイアウト（左上海域を
  インセットで使い切る構成）を参考に、インセットを 46%×32%（916 は 20%）へ大型化しラベルを枠内へ移動。
  大東諸島（東に ~300km の飛び地 2 村）が fit を横に間延びさせ島が極小になっていたため、`inInsetDomain`
  （lon 122-129.5 / lat 23.5-28.7）で fit・点・線の振り分けから除外（本土 bbox 外の小笠原と同じ v1 非描画）。
  ドメイン外の点/線は inset へ誤投影せず落とす（従来は「本土外=全部 inset」で大東の点が枠外に漂った）。
  muni 塗り・点プロット・916 リール・1:1 の 4 ケースで本土と干渉しないことを目視確認。
- **2026-07-16 GSI 地名情報レーン（地名系の解禁）**: まちの計量舎の「◯◯のつく地名」系の一次ソースが
  OSM ではなく**国土地理院 電子国土基本図（地名情報）**（PDL1.0・出典明記で商用/SNS 可）と判明したため、
  §4 カバレッジ表の「地名系＝系統外・対象外」を撤回し **gsi レーン**として解禁した。実装:
  (1) `fetch-gsi-place-names.ts` — 実験ベクトルタイル z15（居住地名 `experimental_nrpt`＝admCode あり /
  自然地名 `experimental_nnfpt`）を、mokuroku 目録が無いため municipalities.topojson の陸域ポリゴンを
  scanline ラスタライズして「陸タイルだけ」約 42 万を走査（resumable キャッシュ・並列 32・90 tiles/s）。
  統合点 JSON `[{name,kana,kind:admin|nature,featureType,lon,lat,pref}]` を R2 `gis/gsi-pni/` に永続化
  （raw ~50MB/gzip 10-20MB・完全DBレスの「一度取得→以後 R2 を読む分析基盤」）。居住地名は admCode で県別集計可。
  (2) `build-buzz-map-spec-gsi.ts` — 正規表現で地名フィルタ → 居住地名=accent・自然地名=accent2 の 2 色型C spec。
  (3) レンダラー小改修: `BuzzMapCard.tsx` の点描画を `pt.key`→凡例 row.fill 解決に変更（型C 2区分の色分け対応。
  単一キー型C＝station-5k-plot は再レンダで非回帰確認済＝挙動不変）。
  (4) catalog に gsi レーン + 10 候補（宿/温泉/谷/沢/新田/島/台/数字/馬/谷戸）を追加（既存レーン件数不変）。
  地名辞書 OSM は不採用（GSI が権威一次ソース）。自然地名は行政コード非提供のため県別集計は空間 join が必要（将来拡張）。
- **2026-07-17 集客ゲート統合**: buzz-map を「企画→landing→生成→R2→draft→計測」の一体
  パイプラインへ拡張。(1) **curated レーン新設** — 人選 171 企画の SSOT `data/buzz-map-curated-ideas.ts`
  （全候補+P0 landing 案・license/sensitivity 手動判定）を builder が machine と統合 (938 entries・alias 統合 82・
  score 100点+landing 補正・hard gate・status upsert は posts.json draft / 後段 status を巻き戻さない)。
  (2) **landing router / contract** (`lib/buzz-map-{router,contract,inventory}-core.mjs`) — §5 の運用フローで strategy/readiness
  確定・機械検証 (contract pass 前の draft 禁止)。(3) **batch CLI** `prepare-buzz-map-batch.ts` (dry-run 既定・
  limit12・動画3・idempotent・CT 検証・isPostable ゲート)。初回実行で X draft 2 件 (vacant-housing-muni /
  migration-inflow-top-decile-muni)・R2 代表 5 型 push・実投稿 0。(4) **gallery `/buzz-map`** 管理画面 (job 分離・
  確認ダイアログ・allowlist)。(5) **2 パターン比較モード** を spec-gsi に追加 (`--pattern-a/--pattern-b` — 谷 vs 沢・澤
  等の対比。kind 2 色と別分岐・単一 pattern は不変)。初回レンダが admin/nature 既定色で「谷vs沢」の問いに答えて
  いなかった目視差し戻しから生まれた教訓: **比較系ネタは凡例が問いの 2 項になっているかを目視必須**。
  (6) **UTM 一本化** — 生成は `.claude/scripts/lib/sns-utm.cjs` が全 SNS ドメインの単一実装 (buzz-map は
  campaign=buzz-map-<ideaId> / content=<variant>。canonical に query 混入禁止)。(7) **GA4 計測**
  `buzz-map-attribution.mjs` + score 還流 (evidence-based: session 0 = 加点 0)。tests 108 (node --test)。
  P1 記事 30 本は全件終端 (drafted-pass 16 / blocked-data 14・published:false)
