---
type: implementation-plan
status: phase-2-prep
created: 2026-05-24
target_period: 2026-W45 〜 2027-W20 (6 ヶ月)
related_files:
  - docs/02_実装計画/100x-pv-strategy.md
  - docs/02_実装計画/phase-2-authority-content-plan.md
  - docs/30_note記事企画/note戦略.md
  - docs/00_プロジェクト管理/02_収益化戦略.md
---

# Phase 2 note 収益化フロー設計

> 100x-pv-strategy.md Phase 2 (×3 倍率) における note 収益化 + stats47 ファネル定量化。

## Context

### 現状 (2026-W21 時点)

- note 投稿数: 32 件 (全て無料)
- フォロワー数: 不明 (要確認)
- note → stats47 流入: 計測なし
- stats47 → note 流入: 計測なし
- 月収益: 0 円 (有料記事 0)

### Phase 2 での位置づけ

- 単独で月 +30K PV/月 (相互送客効果) を狙う
- AdSense + 有料記事 + アフィリエイトの 3 軸で月収益 5-10 万円を目標
- 「stats47 = 無料の権威データ」「note = 加工済み詳細データ + 分析」の役割分担確立

---

## ファネル設計

### Funnel A: stats47 → note (有料化)

```
stats47 検索流入 (450K PV/月)
  ↓ 5% (CVR)
  ↓
note 記事プレビュー閲覧 (22,500/月)
  ↓ 10% (転換率)
  ↓
note フォロー or 有料記事購入 (2,250/月)
  ↓ 5% (有料転換)
  ↓
有料記事購入 (110/月) × 500 円 = 5.5 万円/月
```

### Funnel B: note → stats47 (相互送客)

```
note 検索流入 / SNS 流入 (note 独自、想定 10K/月)
  ↓ 50% (内部リンクから移動)
  ↓
stats47 訪問 (5,000/月)
  ↓
AdSense 表示 + 関連記事閲覧
```

---

## note 記事カテゴリ設計

### Category 1: 無料記事 (集客用、月 4 本)

**目的**: SEO + SNS 流入で note のフォロワー獲得、stats47 への送客

| カテゴリ | 例 | 想定本数/月 |
|---|---|---|
| A: 公務員 hack | 「e-Stat 検索のコツ」「議会答弁 AI 活用」 | 2 |
| B: 都道府県雑学 | 「意外と知らない X 県の TOP 指標」 | 2 |

### Category 2: 有料記事 (収益化、月 2 本)

**目的**: 加工済みデータ + 詳細分析を 500-1,000 円で提供

| カテゴリ | 例 | 価格 | 想定本数/月 |
|---|---|---|---|
| C: CSV データパック | 「47都道府県人口推計 (1980-2050) CSV + 分析レポート」 | 1,000 円 | 1 |
| D: 分析手法ガイド | 「自治体予算分析テンプレート (Excel + 解説)」 | 500 円 | 1 |

### Category 3: 限定公開 (フォロワー限定、月 2 本)

**目的**: フォロワー価値向上 (リテンション・口コミ)

| 例 |
|---|
| 「次の総選挙の都道府県別予測」 |
| 「政策評価の社内資料テンプレ集」 |

---

## stats47 ↔ note 内部リンク設計

### stats47 → note 誘導 (有料記事 CVR 向上)

各 stats47 記事末尾に「もっと深く知りたい方へ」CTA:

```html
<aside class="note-cta">
  <h3>📊 さらに詳しい分析を note で公開</h3>
  <p>本記事のデータを 1980 年からの推移で見たい方、Excel テンプレートで自分の県を分析したい方は note の有料記事をご覧ください。</p>
  <a href="https://note.com/stats47/m/xxxxx" rel="external">
    note で詳細を見る (500 円〜)
  </a>
</aside>
```

配置: ブログ記事 + 主要 /ranking 詳細ページ末尾 + /areas/{prefCode} 末尾

### note → stats47 誘導

各 note 記事に「無料データ" ベース"」へのリンク:

```
本記事のデータは [stats47.jp](https://stats47.jp/ranking/...) でグラフ・地図で無料公開しています。
```

配置: note 全記事の冒頭 + 中盤 (本文中の自然な箇所)

---

## 計測設計

### UTM パラメータ規約

stats47 → note:
- `?utm_source=stats47&utm_medium=blog&utm_campaign=phase2&utm_content={slug}`

note → stats47:
- `?utm_source=note&utm_medium=article&utm_campaign=phase2&utm_content={note_slug}`

### GA4 で追跡する metric

- `note_cta_click` event (stats47 → note の CTA クリック)
- `note_referral_landing` event (note → stats47 の着地)
- `purchase_conversion` event (note 有料記事購入完了)

### 月次レポート (Phase 2 期間中)

`docs/03_週次運用/週次レビュー/YYYY-Www.md` に以下を追記:

- stats47 → note CTA CTR
- note 有料記事 月間購入数
- note → stats47 流入数
- note + AdSense 合計月収益

---

## Stage 別実装計画

| Stage | 期間 | 作業 |
|---|---|---|
| **2-N-S1: 基盤** | W45-W46 | UTM 規約確立、CTA コンポーネント作成、GA4 event 実装 |
| **2-N-S2: 無料記事拡張** | W47-2027W4 | 無料記事 8 本投稿 (フォロワー獲得目的) |
| **2-N-S3: 有料記事 pilot** | 2027W5-W8 | 有料記事 4 本投稿 (CSV データパック中心) |
| **2-N-S4: 最適化** | 2027W9-W20 | UTM データに基づき CTA 改善、有料化率向上 |

---

## 検証 KPI (Phase 2 完了時 = 2027W20)

- note フォロワー: 0 → 500+ (今 0 から想定)
- note 月間 PV: 不明 → 50K+
- stats47 → note 流入: 0 → 月 5K+
- note → stats47 流入: 不明 → 月 3K+
- 月収益: 0 → 5 万円+ (note + AdSense)

---

## リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| note 有料記事が売れない | 月収益未達 | 価格を 300 円に下げる、無料サンプル拡充 |
| CTA が邪魔で UX 低下 | bounce rate 上昇 | A/B テスト、控えめなデザインに調整 |
| note 規約変更で外部リンク制限 | ファネル崩壊 | note 独自で完結する有料記事に転換 |

---

## 関連ドキュメント

- 親計画: `docs/02_実装計画/100x-pv-strategy.md` Phase 2
- 兄弟計画: `docs/02_実装計画/phase-2-authority-content-plan.md`
- 兄弟計画: `docs/02_実装計画/phase-2-backlink-strategy.md`
- 既存 note 戦略: `docs/30_note記事企画/note戦略.md`
- 収益化戦略: `docs/00_プロジェクト管理/02_収益化戦略.md`
