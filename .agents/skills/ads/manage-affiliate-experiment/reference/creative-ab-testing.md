# クリエイティブ A/B テスト基盤 — 現行仕様 (AFF-05 framework・実装済)

2026-06-04 に方式 A (client 加重ランダム + sticky) で実装済みの現行仕様。
旧設計提案の全文 (配分方式比較・サイズカタログ案) は git 履歴の
旧 docs/40_アフィリエイト管理 の AFF-05 設計文書 (2026-07-15 削除) を参照。

## 制約: SSG + CDN キャッシュ

stats47 は完全 SSG + Cloudflare CDN キャッシュ。ビルド時に variant を 1 つ選ぶと全訪問者が同じ広告になり、
`cookies()`/`headers()` のサーバー出し分けは force-dynamic 化で SSG を壊す
(`.claude/rules/nextjs-ssg-preservation.md`)。→ **出し分けはクライアント側のみ**。

## 配分方式 (方式 A: client 加重ランダム + sticky)

- サーバー (ビルド時) は枠の候補 variant を**全件** client コンポーネントに props で渡す (静的 HTML に同梱)。
- client が mount 時に `localStorage` の実験割当を見て、無ければ**加重ランダム**で 1 つ選び保存 (sticky)。
- 選ばれた variant のみ表示し、`affiliate_impression` / `affiliate_click` を variant 属性付きで送信。
- CDN キャッシュは 1 種類のまま・再ビルド不要で配分変更可能。
- CLS 対策: 枠は固定高さコンテナ (どの variant でもレイアウトが動かない)。
- 実装: `VariantAdSlot.tsx` / `resolveExperimentVariantsByCategoryKey` (`resolve-affiliate-ad.ts`)。
  `AffiliateAdSlot` が experimentId 付き在庫を検出すると自動で `VariantAdSlot` 出し分けに切替。

## SSOT モデル (git TS)

`apps/web/scripts/affiliate-ads-data.ts` の `AffiliateAd` 任意フィールド 3 つ (既存エントリは無変更で動く):

```ts
experimentId?: string | null;  // 同一枠で競合する実験 ID 例: "ranking-sidebar-economy"
variantId?: string | null;     // 実験内で一意 例: "300x250-A" / "text-cta-benefit"
weight?: number | null;        // 加重ランダムの重み (既定 1)
```

- **variant = 1 クリエイティブ = 1 エントリ** (width/height/adType/imageUrl がサイズ・形式を表す)。
- 同じ `experimentId` を持つ active エントリが「同じ枠の候補」。`experimentId` 無しは従来どおり priority 解決。
- サイズは canonical 4 種 (300×250 / 250×250 / 320×100 / text) に限る (`affiliate-ads-standards.md` §3)。
- 実験ごとの停止条件は `.claude/state/ads/experiments.json` (registry) に事前固定する
  (SKILL.md `start` 参照)。registry の無い experimentId は判定スクリプトが `invalid` にする。

## GA4 計測

`affiliate_impression` / `affiliate_click` に variant 属性 3 つ (実装済):

| param | 例 | 用途 |
|---|---|---|
| `experiment_id` | `ranking-sidebar-economy` | 実験単位の集計 |
| `variant_id` | `300x250-A` | 勝敗判定の主キー |
| `creative_size` | `300x250` / `text` | サイズ/形式の横断比較 |

- GA4 管理画面のカスタムディメンション登録が必要 (手順: `affiliate-ads-standards.md` §6)。
  未登録は `fetch-affiliate-ga4.cjs` の `hasVariantBreakdown: false` で機械検知され、進行中実験が
  あれば `measurementGate` が blocked になる。
- variant 別 imp / click / CTR は `fetch-affiliate-ga4.cjs` の snapshot rows から
  `build-affiliate-operations-state.ts` が集計する。

## 勝敗判定 (実証ベース・ピーキング回避)

`.claude/rules/evidence-based-judgment.md` 準拠。**停止ルールは実験開始時に registry へ固定**する:

1. **最小サンプルと期間**: registry の `minSamplePerVariant` / `minDurationDays` の両方を満たす。
   `maxDurationDays`へ達してsample不足なら`inconclusive`にする。期間だけでsampleを代替しない。
2. **判定guard**: measurement gateがreadyで、snapshotがfresh、`confounds`が空の場合だけ
   `ready-to-decide`にする。snapshot 1点へz検定や「95%有意」を導入しない。
3. **比較**: variant別 imp / click / CTRとCTRの相対差を人間へ提示する。これは自動勝者判定ではない。
4. **勝者採用**: 人間の決定後に weight 引き上げ / 敗者 `isActive:false`。実測・サンプル・判定根拠を
   improvement-log に記録 (status 更新は improvement-triage)。
5. **比較数**: 1 実験の variant は 2〜3 個に絞る。

判定状態 (invalid / collecting / ready-to-decide / inconclusive / closed) の定義と評価は
`lib/affiliate-operations-core.mjs` の `evaluateExperiments` が正典 (テスト付き)。
