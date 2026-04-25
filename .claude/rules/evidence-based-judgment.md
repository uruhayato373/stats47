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

`improvement` 系スキル（gsc-improvement / ga4-improvement / performance-improvement / sns-metrics-improvement / cloudflare-cost-improvement / adsense-improvement）と判定系スキル（seo-audit / weekly-review / critical-review / nsm-experiment）は、effect ラベル付与手順の **直前** に以下のチェックリストを置く:

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
  .claude/skills/analytics/{gsc,ga4,performance,sns-metrics,cloudflare-cost,adsense}-improvement/reference/ \
  .claude/skills/analytics/seo-audit/SKILL.md \
  .claude/skills/management/{weekly-review,critical-review,nsm-experiment}/SKILL.md \
  | grep -v "evidence-based-judgment\|archive/" \
  || echo "✓ NG ワード残存なし"
```

`evidence-based-judgment.md` 自身（このファイル）と `archive/` 配下は NG ワード例示のため除外。

---

## 関連

- 過去施策の判定が「実証ベースで再評価」されたログ: 各 improvement-log の冒頭に rewrite サインがあるもの
- 親方針: `CLAUDE.md` の「行動原則 2: 検証してから完了」
- 既存実装: `.claude/scripts/gsc/url-inspection-daily.cjs`（URL Inspection API の参照実装）
