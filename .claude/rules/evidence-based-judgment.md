# 実証ベース判定ルール

施策の効果判定・原因推定・仕様の主張を行うとき、API/curl/公式ドキュメントによる実証なしで結論を出してはならない。

## なぜこのルールがあるか

2026-04-25、assistant が「Google の修正を検証ボタンは 410 では合格しない」と推測で説明し誤った。URL Inspection API で確認すると、Google は対象 URL を 2026-03-09 以降ほぼ再クロールしておらず、410 を一度も観測していなかった（pageFetchState=SERVER_ERROR で固定）。私が主張した「Google 仕様」自体が誤りだった。

同様の推測ベース判定が過去 GSC improvement-log の 65-70% に紛れ込んでいることが調査で判明。effect/full・effect/partial が実証なしで付けられ、その判定を前提に次の施策を組み立てる連鎖が起きていた。本ルールは再発防止のためにある。

## 実証なしで結論を出してはいけない 5 状況

### 状況 1: 効果判定（effect/* ラベル付与）

施策後に effect/full / effect/partial / effect/none / effect/adverse を付ける前。

**必須**:
- 想定値 / 実測値 / 経過日数を明記
- 実測値の取得コマンド（コピペ実行可能）を併記
- 想定値の根拠（過去事例 / 公式数値 / 計算式）

**NG**: 「想定 +300、実測 +52 だが浸透待ち」だけで effect/pending を放置 → 「なぜ 248 不足したか」の仮説と検証コマンドがないと次に進めない

#### 閾値エンジン経由の確定（2026-07-30 オーナー判断）

effect ラベルは、下記 3 条件を**すべて**満たす場合に限り機械が自動確定してよい。人間の目視ゲートは
この経路では要求しない。事故の原因は「判定が自動だったこと」ではなく「外部システムの仕様を出典なしに
断定したこと」なので、状況 2（仕様主張）と状況 3（原因推定）は人間・機械どちらにも無条件で適用し続ける。

1. **境界が SSOT にある** — 判定に使う数値は `.claude/scripts/lib/effect-verdict/thresholds.mjs`
   だけに置く。engine 側にリテラルを書かない（テストが直書きを検出して落ちる）
2. **根拠が残る** — `.claude/state/effect-verdict/verdicts-<week>.json` に `before` / `after` /
   `target` / `attainment` / `sources[{name,observedAt,freshness}]` / `guards` /
   `thresholdsVersion` を記録し、improvement-log の `### 判定` に判定・根拠データ・閾値 SSOT・
   ガード・再現コマンドの 5 項目を出す
3. **判定不能を宣言する** — 4 ガード（`insufficient-sample` / `stale-source` / `confounded` /
   `insufficient-target`）が 1 つでも hit したら `effect/pending` に留める。これは人間ゲートの
   復活ではなく「閾値ルールが判定不能と宣言している状態」で、`guards[]` がその記録である

**エンジンは観測差分と閾値の比較のみを出力し、原因や外部仕様を出力してはならない。** 「なぜ未達か」
「Google がどう扱うか」は engine の出力に含めない（人間 / improvement-triage が状況 2・3 の要件を
満たして書く）。想定効果値は `[target: ±N 単位]` の明示記法だけを機械可読とし、散文からの推測はしない
（取れなければ `insufficient-target` で pending に留まる = 状況 4 の担保）。

**統計的有意性は導入しない** — 週次 snapshot は各 1 点で分散が取れず、比率検定を入れると
「有意性を装った推測」を作るだけになる。判定は達成率（第一基準）と noise floor（第二基準）の 2 段のみ。

手動で判定する場合は上の **必須** 3 点を人間が満たす（エンジンを通さない判定に免除はない）。

### 状況 2: Google・サードパーティの仕様主張

「Google は X する」「Cloudflare は Y する」など外部システムの挙動を断定する場面。

**必須**:
- Google 公式ドキュメント URL（`developers.google.com/search/...`）または API レスポンスサンプル
- 「観測されたバージョン / 日付」（仕様は変わるため）

**NG**: 「Google の仕様で 410 は検証パスしない」（出典なし、API で逆の結果が出る可能性）

### 状況 3: 原因推定

「これは X が原因」と書く場面。

**必須**:
- 原因と結果を直接結ぶ実証データ（A/B 比較、ログ、API レスポンス）
- 競合する仮説を列挙し、なぜその仮説に絞ったか説明

**NG**: 「ISR キャッシュか Cloudflare キャッシュ、どちらかが原因」を **根本原因未確定のまま対策を打つ**（後で原因が違ったとわかると対策ごと無駄になる）

#### 3-a. 現在の状態から過去の事象を推論しない（★2026-08-21 に実際に誤った）

過去に観測された事象の原因を調べるとき、**いま測って「無い」ものを「犯人ではない」の根拠にしない。**
事象の時点と観測の時点の間に何が変わったかを先に並べる。

実例: 出典テキストがリンク化される不具合の犯人を、**AdSense を停止した 5 日後に**測って
「AdSense は読み込まれていないので犯人ではない」と結論した。実際は次の順序で、
「停止したから撃てなくなった」だけだった。これは犯人説を**支持する**自然実験である。

| 日付 | 出来事 | 観測対象の有無 |
|---|---|---|
| 08-04 | 事象を捕捉 | **有** |
| 08-16 | 該当機能を停止 | 以降 無 |
| 08-21 | 「無いので犯人ではない」と結論 | 無 |

**必須**: 原因候補を否定する前に、`git log -S<識別子>` / 設定フラグの変更履歴 / デプロイ履歴で
**事象の時点にそれが有効だったか**を確認する。有効だったなら「今は再現しない」は
無罪の証拠ではなく、**単に条件が消えている**だけ。

#### 3-b. 「検索して 0 件」を「存在しない」の根拠にしない（★同日に誤った）

リテラル文字列の grep が 0 件でも、同じ意味の式が別の書き方で存在しうる。

実例: `href="#"` を検索して 0 件だったので「自分たちのコードは `#` を出力しない」と断定したが、
`href={href ?? "#"}` が 4 箇所あった。この誤りの上に検査を作ったので、検査の根拠ごと誤っていた。

**必須**: 否定を主張するなら、**値が構築される形**（`?? "#"`, `|| "#"`, テンプレート、定数経由）まで
探すか、実行時の出力を観測する。探索の網羅性を示せないなら「見つからなかった」と書き、
「存在しない」と書かない。

### 状況 4: 想定効果値

「+300 ～ +700」「< 500」「30% 改善」など定量的な予測値を書く場面。

**必須**:
- 過去事例の引用（improvement-log の rewrite 後正確版）
- もしくは計算式（「未登録 16,628 × 削減率 5% = -800」など）

**NG**: 数値を出すが根拠が示されていない。「目標感」だけで意思決定ベースになると、未達のときに本当の問題が隠れる

### 状況 5: PENDING / 浸透待ち判定

「効果が出るのに時間がかかる」と判断を保留する場面。

**必須**:
- いつまでに何の指標が動くべきかの期日
- 期日になっても動かなかった場合の next action（複数仮説）
- 待ち期間中に取れる実証コマンド（URL Inspection API 等）

**NG**: 「Google の反映待ち」と書いて期日も検証コマンドもない → 永遠に PENDING のまま放置される

---

## 各種 API での最低検証コマンド

### GSC（Google Search Console）

```bash
# URL Inspection API: 個別 URL の Google 認識状態
node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10
# → coverageState / pageFetchState / lastCrawlTime を取得
# 詳細実装: .claude/scripts/gsc/url-inspection-daily.cjs

# 全体 snapshot: 4 週分の query/page/device 別集計
/fetch-gsc-data last28d page snapshot YYYY-Www
```

「Google にどう見えているか」を主張するなら **URL Inspection API の生レスポンス** を引用すること。GSC UI のエラー一覧は古いスナップショットなので根拠にならない。

### GA4

```bash
# 任意指標の dimension 別実測
/fetch-ga4-data last28d eventName,pagePath
```

### PSI（PageSpeed Insights / Core Web Vitals）

```bash
# 公式 API（PageSpeed Insights）で実測
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance"
# → lighthouseResult.audits['largest-contentful-paint'].numericValue 等
```

CrUX（実ユーザー実測）は GSC > Core Web Vitals レポートまたは BigQuery `chrome-ux-report` を使う。Lighthouse 実測値（Lab data）は CrUX と異なるので両方取る。

### HTTP 挙動の確認

```bash
# 必ず Googlebot UA で本番に当てる（dev server は経路が違う）
curl -s -o /dev/null -w "%{http_code}\n" \
  -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://stats47.jp/<path>"
```

### サードパーティ仕様の主張

公式ドキュメント URL を必ず引用:
- Google Search: https://developers.google.com/search/docs
- Indexing API: https://developers.google.com/search/apis/indexing-api
- Cloudflare: https://developers.cloudflare.com/

引用は URL に **アクセス日 (YYYY-MM-DD)** を併記（仕様は変わる）。

---

## 推測表現 NG ワード

以下の表現は「引用 / 検証コマンド併記なし」では使用禁止。

| NG ワード | 代替案 |
|---|---|
| 〜のはず | 「[仮説] 〜の可能性。検証コマンド: 〜」 |
| 〜と思われる | 「実測値 X（取得日 / コマンド）」 |
| Google の仕様 | 「Google 公式 (URL + アクセス日)」 |
| クロール予算枯渇 | 「URL Inspection API で再クロール件数 N 件 / 日 を観測」 |
| 正常な挙動 | 「curl で確認、HTTP X 応答」 |
| 〜は犯人ではない (現在の観測だけを根拠に) | 「事象の時点で有効だったかを履歴で確認した上で」(状況 3-a) |
| 〜は存在しない (grep 0 件を根拠に) | 「リテラル検索では見つからなかった」(状況 3-b) |
| 壊滅 / 致命的 | 定量予測 + 根拠（「-XX% 想定、根拠: 〜」） |
| 兆候 | 「実測 X。N 日後に再評価」 |
| 浸透待ち | 「[仮説] 〜の可能性。期日 YYYY-MM-DD、その時点で X が動かなければ次の検証: 〜」 |
| だろう / だと考えられる | 「[仮説] 〜。検証期日: 〜」 |

---

## 推測のまま残してよい場合

仮説段階の思考は重要。以下の形式なら推測表現を残してよい:

```markdown
**[仮説]** Google が再クロールしないのは sitemap が大きすぎるため  
**検証コマンド**: `node .claude/scripts/gsc/url-inspection-daily.cjs` で再クロール件数 / 日を測定  
**検証期日**: 2026-05-09  
**期日後の判定**: 再クロール件数 > 50 / 日 なら仮説支持、< 10 なら仮説棄却して次を試す
```

3 点セット（仮説 / 検証コマンド / 検証期日 + 期日後の判定基準）が揃っていれば OK。1 つでも欠けるなら推測扱い。

---

## スキル設計上の取り込み方

`improvement` 系スキル（gsc-improvement / ga4-improvement / performance-improvement / sns-metrics-improvement / cloudflare-cost-improvement / adsense-improvement / affiliate-improvement）と判定系スキル（seo-audit / weekly-review / critical-review / nsm-experiment）は、effect ラベル付与手順の **直前** に以下のチェックリストを置く:

```markdown
## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 検証コマンドを実行したか（このスキル固有: <具体例>）
- [ ] 公式ドキュメント URL を引用したか（仕様主張がある場合）
- [ ] 比較対象（before / after / baseline）が明確か
- [ ] NG ワードを使っていないか（`evidence-based-judgment.md` 参照）
- [ ] 効果が想定の 80% 未満なら、なぜ未達かの仮説と次の検証コマンドを書いたか

このチェック未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。
```

**このチェックリストは手動判定時に必須**。閾値エンジン経由の自動判定では engine の 4 ガードが
同等の役割を果たし、`guards` フィールドがその記録である（対応関係は下表）。

| 実証チェックリストの項目 | 自動判定での担保 |
|---|---|
| 検証コマンドを実行したか | verdict の `### 判定` に **[再現コマンド]** を必ず出す |
| 比較対象が明確か | `before` / `after` / `window` を verdict JSON に記録 |
| 効果が想定の 80% 未満なら未達の説明 | `attainment` と `boundaries` を記録し、`insufficient-target` で想定値なしを弾く |
| 標本が足りるか | `insufficient-sample`（imp 下限 + noise floor） |
| 根拠データが古くないか | `stale-source`（`freshness.mjs` の `classifyAge` を共有） |
| 他施策と混ざっていないか | `confounded`（同時投入 / after 窓の後発投入） |
| 公式ドキュメント URL を引用したか（仕様主張） | **engine は仕様を出力しない**ので対象外。仕様に触れる記述は人間が状況 2 の要件で書く |
| NG ワードを使っていないか | engine の出力は実測値と閾値の引用のみ（テストで NG ワード非混入を固定） |

閾値エンジンの入口: `node .claude/scripts/lib/effect-verdict/cli.mjs`（週次 cron で自動実行）。
閾値 SSOT: `.claude/scripts/lib/effect-verdict/thresholds.mjs`。

---

## 改善ログ記入テンプレ

improvement-log.md の各エントリは以下のテンプレに従う:

```markdown
### [施策ID] タイトル

- **デプロイ日**: YYYY-MM-DD
- **想定効果**: <定量値> [根拠: <データ源 or 過去事例リンク>]
- **検証コマンド**: <curl / API 呼び出し（コピペ実行可能）>
- **実測**: <値 + 取得日 + 取得コマンドへのリンク>
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜」形式、検証期日付き>
```

---

## 違反検知

NG ワードの検出スクリプト（CI で走らせるか手動レビュー時に実行）:

```bash
NG="のはず\|と思われる\|Google の仕様\|クロール予算枯渇\|壊滅\|兆候\|浸透待ち\|だろう\|と考えられる"
grep -rn "$NG" \
  .claude/skills/analytics/{gsc,ga4,performance,sns-metrics,cloudflare-cost,adsense,affiliate}-improvement/reference/ \
  .claude/skills/analytics/seo-audit/SKILL.md \
  .claude/skills/management/{weekly-review,critical-review,nsm-experiment}/SKILL.md \
  | grep -v "evidence-based-judgment\|archive/" \
  || echo "✓ NG ワード残存なし"
```

`evidence-based-judgment.md` 自身（このファイル）と `archive/` 配下は NG ワード例示のため除外。

---

## 関連

- 過去施策の判定が「実証ベースで再評価」されたログ: 各 improvement-log の冒頭に rewrite サインがあるもの
- 親方針: `CLAUDE.md` の行動原則 12「失敗を隠さない — 未検証部分・スキップ箇所は『完了』と言わず明示する」
- 既存実装: `.claude/scripts/gsc/url-inspection-daily.cjs`（URL Inspection API の参照実装）
- 閾値エンジン: `.claude/scripts/lib/effect-verdict/`（`thresholds.mjs` = 閾値 SSOT / `engine.mjs` = 判定純粋関数 / `cli.mjs` = 週次ランナー）
- テスト: `node --test .claude/scripts/lib/__tests__/effect-verdict.test.mjs`（群 A 正常系 + 群 B mutation。閾値を動かすと判定が変わることを固定）
- 抑制台帳 writer: `.claude/scripts/lib/write-past-effects.mjs`（effect/none|adverse → candidate の confidence 抑制）
