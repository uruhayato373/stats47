---
type: design-proposal
target: AFF-05
status: implemented-framework
date: 2026-06-04
related_log: docs/02_実装計画/03_改善バックログ.md#AFF-05
---

# AFF-05 設計: クリエイティブ A/B テスト基盤 (どの広告/サイズ/文言が効くか計測)

> **2026-06-04: framework 実装済 (方式 A 採用)**。具体的な実験 (枠/variant) は未設定 = データを見て後決め。
> 実装ファイル: `VariantAdSlot.tsx` / `resolveExperimentVariantsByCategoryKey` / GA4 param 拡張 / `fetch-affiliate-ga4.cjs`。

## 実験の始め方 (P4・運用手順)

1. 対象枠とカテゴリを決める (例: ranking-sidebar の economy)。
2. `apps/web/scripts/affiliate-ads-data.ts` に **同じ `experimentId`・別 `variantId`** のエントリを 2〜3 件追加
   (サイズ違いの banner / text / CTA 文言違い)。`weight` 省略時は均等。
3. develop へ push → `publish-affiliate-ads.yml` が R2 反映。`AffiliateAdSlot` が自動で `VariantAdSlot` 出し分けに切替。
4. GA4 管理画面で custom dimension `experiment_id` / `variant_id` / `creative_size` を登録。
5. `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28` で variant 別 CTR を観測 → 停止ルールで勝者採用。

---

> 以下は設計の根拠 (実装前の提案内容を保持)。
> 目的: 同じ枠に複数のクリエイティブ候補 (サイズ違い・バナー/テキスト・CTA 文言違い) を用意し、
> **ランダム配分 (または期間配分) で出し分け → variant 別 CTR を計測 → 勝者を採用**するループを作る。

## 0. 最重要の制約: SSG + CDN キャッシュ

stats47 は **完全 SSG + Cloudflare CDN キャッシュ**。ページ HTML はビルド時に1回生成され、全訪問者に同じ
キャッシュが配信される。**ビルド時に variant を1つ選ぶと「全員同じ広告」になり、ランダム計測にならない。**
また `cookies()/headers()` でサーバー出し分けすると force-dynamic 化して SSG が崩れる
(`.claude/rules/nextjs-ssg-preservation.md`)。

→ **出し分けは「クライアント側」で行うのが唯一 SSG を壊さない方法。**

## 1. 配分方式の比較と推奨

| 方式 | SSG | 統計的純度 | 反映速度 | 推奨 |
|---|---|---|---|---|
| **A. クライアント側 加重ランダム** (推奨) | ✅ 維持 | ◎ 同時並行で交絡なし | ◎ 即時 (再ビルド不要) | **採用** |
| B. クライアント側 ユーザーバケット (localStorage で固定) | ✅ | ◎ 同一ユーザーは同 variant | ◎ | A に内包 (sticky 化) |
| C. 期間配分 (ビルド時に週替わり) | ✅ | △ 時期で交絡 (季節性) | × 再ビルド要 | 補助/フォールバック |
| D. エッジ (Worker/middleware で出し分け) | ✗ キャッシュ分断 | ◎ | ○ | 不採用 (SSG 方針に反する) |

**推奨: 方式 A + sticky 化。**
- サーバー (ビルド時) は枠の **候補 variant を全件** client コンポーネントに props で渡す (静的 HTML に同梱)。
- client が mount 時に `localStorage` の実験割当を見て、無ければ **加重ランダム**で1つ選び保存 (sticky)。
- 選ばれた variant だけ表示し、`ad_impression` を **variant 属性付き**で送信。クリックも同様。
- → CDN キャッシュは1種類のままで、訪問者ごとに別 variant が出る。再ビルドなしで配分変更可能。

> CLS 対策: 枠は **固定高さのコンテナ**にして、どの variant でもレイアウトが動かないようにする。

## 2. SSOT モデル (git TS 拡張・完全DBレス維持)

`apps/web/scripts/affiliate-ads-data.ts` の `AffiliateAd` に **任意フィールドを3つ追加**するだけ
(既存エントリは無変更で動く):

```ts
experimentId?: string | null;  // 同一枠で競合する実験 ID 例: "ranking-sidebar-economy"
variantId?: string | null;     // 実験内で一意 例: "300x250-A" / "text-cta-benefit"
weight?: number | null;        // 加重ランダムの重み (既定 1)
```

- **variant = 1 クリエイティブ** = 1 エントリ (既存の width/height/adType/imageUrl/htmlContent がサイズ・形式・文言を表す)。
- 同じ `experimentId` を持つ active エントリが「同じ枠の候補」。`experimentId` 無しは従来どおり priority 解決 (後方互換)。
- 解決ロジック (`resolveAffiliateBannersByCategoryKey` 等) を「experiment があれば候補を全件返す」に拡張。
- 横断整合 (同 experiment 内で variantId 重複なし等) は **export スクリプトでビルド時 validate** (手編集 JSON を SSOT にしない原則どおり)。

## 3. 計測の拡張 (GA4)

現状 `ad_impression` / `affiliate_click` は `affiliate_category` / `link_position` / `event_label` のみ。
**variant 属性を3つ追加**する:

| param | 例 | 用途 |
|---|---|---|
| `experiment_id` | `ranking-sidebar-economy` | 実験単位の集計 |
| `variant_id` | `300x250-A` | 勝敗判定の主キー |
| `creative_size` | `300x250` / `text` | サイズ/形式の横断比較 |

- `AdImpressionTracker` / `TrackedAffiliateLink` / `events.ts` にこれらの param を通す (後方互換: 任意)。
- **GA4 管理画面でカスタムディメンション登録**が必要 (`affiliate_category`/`link_position` と同様)。未登録だと内訳不可。
- `.claude/scripts/ads/fetch-affiliate-ga4.cjs` の dimension に `customEvent:experiment_id` / `customEvent:variant_id` /
  `customEvent:creative_size` を追加し、**variant 別 impression / click / CTR** を出力するよう拡張。

## 4. 勝敗判定 (実証ベース・ピーキング回避)

`.claude/rules/evidence-based-judgment.md` 準拠。**停止ルールを実験開始時に固定**する:

1. **最小サンプル**: 各 variant が impression ≥ 1,000 に達するまで判定しない (低トラフィック枠は期間で代替: 最低4週)。
2. **比較**: variant 間の CTR を 2 標本比率の z 検定 (有意水準 5%) で比較。実用上は「勝者 CTR が次点比 +20% かつ 95% 有意」を採用条件にする。
3. **勝者採用**: 勝った variant の `weight` を上げる/他を `isActive:false`。`docs/02_実装計画/03_改善バックログ.md` に
   想定/実測/サンプル/判定根拠を記録 (effect/* は実測が揃ってから)。
4. **多重比較**: 1 実験の variant は 2〜3 個に絞る (4 個以上は必要サンプルが急増)。

`/affiliate-improvement observe` を variant 対応に拡張し、上記を半自動で出す。

## 5. クリエイティブ (サイズ/形式) のカタログ提案

「何を試すか」の初期候補。**枠ごとにレイアウト幅の制約**があるので、はみ出さないサイズに限定する。

### サイドバー (右レール ~360px、実効描画幅 ~300–336px)

| サイズ | 種別 | 特性 / 狙い | 備考 |
|---|---|---|---|
| **300×250** | medium rectangle | 基準。モバイルでも安全。バナーブラインドネス中 | A/B の baseline に最適 |
| **336×280** | large rectangle | 面積 +25%、視認性↑ | デスクトップ専用 (モバイルは 300 に) |
| **300×600** | half page | 縦長で viewability/CTR が高い傾向 | デスクトップのみ、モバイル非表示 |
| **160×600** | wide skyscraper | 縦長の別案 | 300×600 の対抗 |
| テキスト (現行) | text link ×2 | 広告感が薄く文脈に馴染む | バナー vs テキストの比較軸 |
| **ネイティブ/カード** | 自前カード | サイトのフラットUIに同化、CTR が高い場合あり | 要自前実装、PR 表記は維持 |

### ブログ記事内/末尾 (本文幅 ~760px)

| サイズ | 種別 | 狙い |
|---|---|---|
| 300×250 / 336×280 | rectangle (PC 2-up) | 現行踏襲 |
| **728×90** | leaderboard | 本文幅にフィット、デスクトップ |
| ネイティブ/カード | 自前 | 記事文脈に同化 |
| 468×60 | banner | **非推奨** (ブラインドネス強)。比較対象としてのみ |

### モバイル

| サイズ | 種別 | 狙い |
|---|---|---|
| **320×100** | large mobile banner | 320×50 より視認性↑ |
| 300×250 | inline rectangle | 記事内 |

### テキスト/CTA の variant 軸 (バナー以外の試行)

- **CTA 文言**: ベネフィット型 (「年間◯円お得」) vs 好奇心型 (「あなたの県は?」) vs 行動型 (「無料で試す」)
- **体裁**: ボタン vs インラインリンク / 補足microcopy あり・なし / 報酬・価格ヒントあり・なし
- **PR 表記位置**: 上 vs 下 (景表法は維持)

> レスポンシブ原則: サイドバーは 360px を超えない / モバイルは ≤ viewport / 枠は固定高さ (CLS 回避)。
> デスクトップ専用サイズ (300×600 等) は `xl:` 以上でのみ表示し、モバイルは 300×250 にフォールバック。

## 6. 段階的ロールアウト (提案する実装フェーズ)

| Phase | 内容 | リスク |
|---|---|---|
| **P1** | SSOT に experimentId/variantId/weight 追加 + export validate。GA4 param 3 つ追加 + custom dimension 登録依頼 | 低 (後方互換) |
| **P2** | client 加重ランダム + sticky 選択コンポーネント (`VariantAdSlot`)。固定高さ枠。`AffiliateAdSlot` から利用 | 中 (SSG 維持を build で確認) |
| **P3** | `fetch-affiliate-ga4.cjs` を variant 別集計に拡張 + `/affiliate-improvement` に実験判定モード | 低 |
| **P4** | 最初の実験を1枠で開始 (例: ranking-sidebar の economy で 300×250 vs 336×280 vs text) | 低 |

## 7. 承認が要る決定事項

1. **配分方式**: 方式 A (クライアント加重ランダム + sticky) でよいか。
2. **最初の実験対象枠**: ranking サイドバー (economy 等トラフィックの多いカテゴリ) で開始でよいか。
3. **最初に比較する variant**: 例「300×250 vs 336×280 vs 現行テキスト」。
4. 実装は P1→P4 を**別 PR**で段階投入 (P1+P3 はデータ基盤、P2 がレンダリング変更=SSG 確認必須)。
