# 各種 API での最低検証コマンド

`.claude/rules/evidence-based-judgment.md` の実証要件（状況 1〜5）を満たすための取得コマンド集。
仕様主張・効果判定・原因推定の根拠データはここに挙げた一次の API / curl / 公式ドキュメントから取る。

## GSC（Google Search Console）

```bash
# URL Inspection API: 個別 URL の Google 認識状態
node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10
# → coverageState / pageFetchState / lastCrawlTime を取得
# 詳細実装: .claude/scripts/gsc/url-inspection-daily.cjs

# 全体 snapshot: 4 週分の query/page/device 別集計
/fetch-gsc-data last28d page snapshot YYYY-Www
```

「Google にどう見えているか」を主張するなら **URL Inspection API の生レスポンス** を引用すること。GSC UI のエラー一覧は古いスナップショットなので根拠にならない。

## GA4

```bash
# 任意指標の dimension 別実測
/fetch-ga4-data last28d eventName,pagePath
```

## PSI（PageSpeed Insights / Core Web Vitals）

```bash
# 公式 API（PageSpeed Insights）で実測
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance"
# → lighthouseResult.audits['largest-contentful-paint'].numericValue 等
```

CrUX（実ユーザー実測）は GSC > Core Web Vitals レポートまたは BigQuery `chrome-ux-report` を使う。Lighthouse 実測値（Lab data）は CrUX と異なるので両方取る。

## HTTP 挙動の確認

```bash
# 必ず Googlebot UA で本番に当てる（dev server は経路が違う）
curl -s -o /dev/null -w "%{http_code}\n" \
  -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://stats47.jp/<path>"
```

## サードパーティ仕様の主張

公式ドキュメント URL を必ず引用:
- Google Search: https://developers.google.com/search/docs
- Indexing API: https://developers.google.com/search/apis/indexing-api
- Cloudflare: https://developers.cloudflare.com/

引用は URL に **アクセス日 (YYYY-MM-DD)** を併記（仕様は変わる）。
