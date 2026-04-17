# 観測基盤の導入計画（Cloudflare 完結版）

## 背景

**現状の観測力の欠如**:
- GSC は週次サンプル（最大 1,000 URL）しか取れない
- 本番 5xx の URL 別発生頻度・時刻・原因が追えない
- 施策デプロイ後に「どこで何が起きているか」リアルタイムで見えない
- 施策効果測定は GSC 反映を 2-4 週間待つしかない

**目指す状態**:
- 本番 5xx を URL パターン別・発生時刻別に Dashboard で確認
- 施策デプロイ前後で 5xx 件数の変化を時系列で追える
- エラー閾値超過時に自動メール通知
- すべて **Cloudflare 純正機能 + 追加コスト 0 円** で完結

## 設計方針

Sentry などの外部 SaaS は使わず、Cloudflare の組み込み機能だけで完結する。stats47 は Cloudflare Workers 上で稼働しているため、追加契約なしで以下が利用可能:

| 機能 | 種別 | 状態 |
|---|---|---|
| Workers Observability (Logs/Traces/Metrics) | 組み込み | ✅ T1-OBS-01 で有効化済 |
| Analytics Engine | binding | ✅ T1-OBS-01 で宣言済（利用は将来） |
| Cloudflare Web Analytics | 無料 | ⏳ Dashboard で有効化 |
| Notifications (Email/Slack/Webhook) | 無料 | ⏳ Dashboard で設定 |
| Speed Insights (Lighthouse) | 無料 | ⏳ Dashboard で有効化 |
| Cache Analytics | 無料 | ✅ 既に有効（確認のみ） |
| Security Analytics | 無料 | ✅ 既に有効（確認のみ） |

追加コスト: **$0**（全て Workers Paid / Pro プラン内に含まれる）。

## A. Workers Observability — 5xx 原因追跡の本命

### A-1. 何ができるか

- 本番の全リクエストの URL × status × duration が自動記録
- エラー時のスタックトレースが見られる
- URL フィルタ・期間指定で検索可能
- 保持期間: 7 日（Workers Paid）

### A-2. 現状

✅ `apps/web/wrangler.toml` で本番 `observability.enabled = true`、`observability.traces.enabled = true`（T1-OBS-01 でデプロイ済）

### A-3. 使い方（ユーザー）

1. Cloudflare Dashboard → Workers & Pages → **stats47**
2. 上部タブ「**Logs**」: エラー・console.log が検索可能
3. 上部タブ「**Metrics**」: Invocations / Errors / CPU Time
4. Traces ビュー: URL 別レスポンス時間、失敗パターン

### A-4. ターミナルからのリアルタイム監視

```bash
cd /Users/minamidaisuke/stats47/apps/web
npx wrangler tail --env production
```

## B. Analytics Engine — カスタム集計（必要時のみ）

### B-1. 何ができるか

- 全リクエストの URL × status × UA × 応答時間を SQL で集計
- デプロイ前後 24h 比較、Googlebot vs 一般ユーザー分離など

### B-2. 現状

✅ binding 宣言済（`stats47_requests`、T1-OBS-01）
⏳ 書き込みコード未実装（将来 T1-OBS-02 で middleware or instrumentation.ts に統合）

### B-3. 使い方（現状では空データ）

```sql
-- 過去 24h の URL 別 5xx 件数（書き込み実装後）
SELECT blob1 AS url, COUNT() AS count
FROM stats47_requests
WHERE blob2 LIKE '5%' AND timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY url
ORDER BY count DESC
LIMIT 50;
```

### B-4. いつ必要になるか

Workers Observability で URL 別 5xx が十分見える場合、Analytics Engine 実装は不要。以下のケースで必要:
- 30 日超の長期トレンド分析（Observability は 7 日保持のみ）
- Googlebot/GPTBot 別のアクセスパターン分析
- 特殊な集計軸（地域別、時間帯別など）

## C. Cloudflare Web Analytics — フロント RUM（無料・Cookie レス）

### C-1. 何ができるか

- ページビュー、Core Web Vitals（LCP, FID, CLS）
- 参照元、デバイス、国別
- Cookie 不要、プライバシー重視（GDPR 準拠）
- GA4 と併用可能（重複問題なし、補完的）

### C-2. 有効化手順（ユーザー作業 2 分）

1. Cloudflare Dashboard → **Analytics & Logs** → **Web Analytics**
2. 「**Add a site**」
3. 設定:
   - Hostname: `stats47.jp`
   - Automatic setup: **Enabled**（Cloudflare 経由なので自動注入される）
4. Save

script tag を手動で追加する必要はない（Cloudflare Orange Cloud が自動注入）。

### C-3. 見られるもの

Dashboard → **Analytics & Logs** → **Web Analytics** → stats47.jp:
- Total page views / Unique visitors（Cookie レスなので GA4 より正確）
- Core Web Vitals の URL 別スコア
- Referrers（stats47.jp への流入元）
- Countries（どこからアクセスされているか）

## D. Notifications — 異常検知の自動アラート

### D-1. 何ができるか

- Workers Errors が閾値超過したら自動メール通知
- Deploy 失敗時に通知
- Slack Webhook 連携も可能
- 「v1/v2 のような事故」を数分で検知

### D-2. 設定手順（ユーザー作業 5 分）

1. Cloudflare Dashboard → **Notifications**
2. 「**Add**」→ 検索で「**Workers**」

推奨設定 A: **Workers Errors 閾値超過**
- Product: `Workers`
- Event: `Health Check (Worker Exceptions)`
- Conditions: エラー率 > 5% または `error count > 100 / hour`
- Notification type: **Email**
- Send to: uruhayato373@gmail.com

推奨設定 B: **Deploy 失敗通知**
- Product: `Workers` / `Pages`
- Event: `Deployment Failed`
- Notification type: **Email**

推奨設定 C: **Logpush 関連（任意）**
- HTTP 5xx スパイク時に通知

### D-3. Slack Webhook 連携（任意）

Slack で `Incoming Webhooks` を作成 → URL を Cloudflare Notifications の Webhook destination に登録。

## E. Speed Insights (Lighthouse 自動実行)

### E-1. 何ができるか

- 本番 URL の Lighthouse スコアを定期測定
- Performance / Accessibility / SEO / Best Practices
- PSI budgets との整合性チェック

### E-2. 有効化手順（ユーザー作業 2 分）

Cloudflare Workers の場合:
1. Dashboard → Workers & Pages → **stats47** → **Settings**
2. **Speed Insights** タブ
3. 「**Enable Speed Insights**」
4. サンプリング率: 100%（高トラフィック時は 10% に絞る）

※ Workers で Speed Insights が未対応の場合、代替として:
- PageSpeed Insights API を CI で定期実行
- または `.claude/skills/analytics/performance-improvement/` で取得済の lighthouse-audit を継続利用

### E-3. 既存仕組みとの関係

`.claude/skills/analytics/performance-improvement/` に PSI 計測の仕組みは既存。Cloudflare Speed Insights は補完的に使う（Dashboard で視覚的に確認できるのが利点）。

## F. Cache Analytics — キャッシュヒット率・帯域最適化

### F-1. 何ができるか

- エッジキャッシュのヒット/ミス率
- データ転送量
- Top キャッシュ URL

### F-2. 現状

✅ 既に有効。Dashboard で見るだけ。

### F-3. 見る場所

Cloudflare Dashboard → **Analytics & Logs** → **Traffic**:
- Cached vs Uncached requests
- Bandwidth saved

キャッシュヒット率が低い URL があれば Cache Rules で TTL 調整。

## G. Security Analytics — Bot / 攻撃検知

### G-1. 何ができるか

- Bot score 分布
- Firewall events（Cloudflare Bot Fight Mode のブロック）
- WAF ルールヒット

### G-2. 現状

✅ 既に有効。Dashboard で見るだけ。

### G-3. 見る場所

Cloudflare Dashboard → **Security** → **Events**:
- Googlebot / GPTBot / Bingbot のアクセス数
- 不審な Bot の特定
- robots.txt 違反検知

## H. 優先度と運用

### H-1. 優先実施（ユーザー作業、合計 10 分）

| 優先度 | 施策 | 所要 | 効果 |
|---|---|---|---|
| ★★★ | C. Web Analytics 有効化 | 2 分 | フロント RUM / CWV が見える |
| ★★★ | D. Notifications Workers Errors | 5 分 | エラースパイクで自動メール |
| ★★ | E. Speed Insights 有効化 | 2 分 | Lighthouse 定期測定 |

### H-2. 週次運用（既存 weekly-review に統合）

`/weekly-review` の Phase 1 Agent C に以下を追加（将来の改善）:
- Web Analytics の今週 CWV 平均
- Cache hit rate
- Workers Errors 件数（前週比）

### H-3. 月次運用

- Notifications トリガー履歴をレビュー
- 発生した 5xx パターンを T0-5xx-01 に追加
- 不要なアラートは閾値調整

## I. 既存ファイルとの関係

| 既存 | 関係 |
|---|---|
| `.claude/skills/analytics/performance-improvement/` | PSI 計測と継続改善ログ。Speed Insights と併用 |
| `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` | 施策 ID ベースの PDCA。T1-OBS-* として追跡 |
| `apps/web/wrangler.toml` | observability + analytics_engine binding 設定 |

## J. 追加コスト試算

| 項目 | 料金 | 現在の契約 |
|---|---|---|
| Workers Paid | $5/mo | ✅ 契約済（T1-OBS-01 が動いている証明） |
| Workers Observability | 無料（Paid に含む） | ✅ 含む |
| Analytics Engine | 10M events/mo 無料 | ✅ 範囲内 |
| Web Analytics | 無料 | - |
| Notifications | 無料 | - |
| Speed Insights | 無料 | - |
| Cache / Security Analytics | 無料 | - |
| **合計追加コスト** | **$0** | - |

## K. Sentry は使わない判断

外部 SaaS を使わないことで:
- アカウント管理不要
- DSN 漏洩リスクなし
- データが Cloudflare 内に閉じる（プライバシー / コンプライアンス面で有利）
- 月額コストゼロ

将来 Cloudflare だけでは不足を感じたら（例: エラーの自動クラスタリング、Session Replay 等）、そのタイミングで Sentry を追加検討する。

## 参照

- `apps/web/wrangler.toml` — observability / analytics_engine 設定
- `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` — T1-OBS-01 デプロイ記録
- [Cloudflare Workers Observability](https://developers.cloudflare.com/workers/observability/)
- [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)
- [Cloudflare Notifications](https://developers.cloudflare.com/notifications/)
