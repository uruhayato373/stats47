# PSI / Core Web Vitals 改善ログ

パフォーマンス指標（PSI スコア・Lab data・CrUX 実ユーザー計測）の継続的追跡と改善施策の記録。

> **2026-04-25 確認**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づき本ファイルを点検。NG ワード（「のはず」「兆候」「浸透待ち」等）残存なし。新規エントリは下記テンプレに従うこと。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（「PSI 2026-03-28 取得 / snapshots/2026-03-28/metrics.csv」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [EXP-NNN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <PSI 過去事例 / web.dev URL>]
- **検証コマンド**: `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile"`
- **実測 (before)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **実測 (after)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

---

## Baseline

**取得日**: 2026-03-27 / 2026-03-28
**ソース**: `snapshots/2026-03-27/metrics.csv`（17 行）, `snapshots/2026-03-28/metrics.csv`（8 行）
**取得手段**: `/lighthouse-audit`（PageSpeed Insights API）

### サンプル（ホームページ・モバイル/デスクトップ両方）

| date | url | strategy | performance | LCP (ms) | CLS | TBT (ms) | TTFB (ms) |
|---|---|---|---:|---:|---:|---:|---:|
| 2026-03-28 | `/` | both | 59 | 9,993 | 0.0002 | 222 | 1,393 |
| 2026-03-28 | `/areas/01000` | both | 58 | 10,495 | 0.000 | 120 | 356 |
| 2026-03-28 | `/areas/13000` | both | 55 | 10,979 | 0.021 | 86 | 22,082 |

### Budget 違反サマリ（budgets.json 基準）

- `all × mobile × lcp_ms <= 2500` **NG**（ほぼ全 URL で 5,000〜11,000ms）
- `all × mobile × score_performance >= 80` **NG**（55〜59）
- CLS は合格圏（ほぼ 0）
- TBT は合格圏（100〜300ms、警告圏が一部）

---

## Action Log

### [EXP-003] Cookie 同意バナーを LCP 候補から外す — setVisible を 4s 遅延

- **デプロイ日**: 2026-04-26 (予定) / コミット: <pending>
- **想定効果**: stats47.jp/ mobile LCP 8,251ms → 2,500ms 以下 (-69%) [根拠: PSI 2026-04-25 で LCP 要素を `body.fixed > div.container > p` (CookieConsentBanner) と特定、render delay 3,075ms。banner を LCP 計測ウィンドウ後に挿入すれば本来意図した FeaturedRankings (`apps/web/src/app/page.tsx:121`) が LCP に戻る]
- **検証コマンド**: `curl 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance' | jq '.lighthouseResult.audits["largest-contentful-paint"].numericValue, .lighthouseResult.audits["largest-contentful-paint-element"].details.items[0].node.snippet'`
- **実測 (before)**: LCP 8,251ms / FCP 3,751ms / TBT 353ms / Perf 57 / 取得日 2026-04-25 / `.claude/state/metrics/psi/psi-batch-2026-04-25T17-39-06.json`
- **実測 (after)**: <pending — 翌朝 PSI 自動計測待ち>
- **判定**: pending
- **未確定 / 仮説**:
  - **[仮説]** banner を 4s 遅延すれば FeaturedRankings が LCP になる / 検証期日 2026-04-27 / 期日後の判定: LCP < 2,500ms かつ lcp_element が `FeaturedRankings` 配下なら effect/full、LCP < 5,000ms なら effect/partial、それ以外は別の LCP 候補（hero h1 / FCP 自体の遅延）を再調査
  - **[別件]** CrUX TTFB 2,390ms (lab 4ms と乖離) → Cloudflare cache miss path 調査が必要。本 EXP のスコープ外、別 EXP で扱う
- **副次計測**: `/themes/*` `/ranking/*` 詳細ページの LCP も同じ banner が起点になっていれば同程度改善するか合わせて観測（mobile LCP 11,000-15,000ms 帯）

### 2026-04-17: 計測データを D1 → ファイルへ移行

- 旧 D1 テーブル `performance_metrics` / `performance_budgets` を `.claude/skills/analytics/performance-improvement/` 配下のファイルに移行
- 理由: 「計測蓄積は .claude/ 配下のファイル」という記録先統一原則（CLAUDE.md §記録先の統一原則）
- 旧データは snapshots/YYYY-MM-DD/metrics.csv として保存、閾値は budgets.json に集約
- コミット: (本コミットで確定)

---

## Observation Log

_（次回 `/lighthouse-audit` 実行後に追記）_

---

## Next Actions

Baseline のデータから以下を優先候補として検討:

1. **LCP 2.5s 達成**: 主要ページ（/, /areas/*）で LCP > 10s が常態化している。画像最適化・JS 削減・SSR データ取得の見直しが必要
2. **Performance スコア 80 達成**: 現状 55〜59。LCP 改善と同時に進行
3. **TTFB 改善**: `/areas/13000` で 22,082ms という異常値あり（計測時のコールドスタートか恒常的か要判定）

次回アクション決定時に `/nsm-experiment propose` から EXP-NNN として登録する想定。
