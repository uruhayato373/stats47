---
name: page_semantic_dedup_contract
description: 同じ意味のUIを別コンポーネントが描画する重複は、部品単体テストではなくページ合成とfeature全量renderer監査で防ぐ
type: feedback
---

**問題**: ranking詳細で「全国平均 2024年」と「全国平均の推移（総数）」が連続し、同じ値・同じ2007〜2024年の折れ線・同じ変化率を二重表示していた。共通ページ構成なので、複数年データを持つ都道府県ランキング全体に波及していた。

**原因**: `8a3cb2355` が独立 `NationalTrendCard` を追加した後、`e0aa9963c3` がヘッダー再設計で `RankingNationalAverageStat` に同じ推移を追加した。各コンポーネントの単体テストは自身の描画だけを検証しており、ページ全体で「全国平均トレンドのcanonical ownerは1つ」という契約が無かった。`abbb64aeb4` の統合でも両者がそのまま残った。

**対策**: canonical ownerを `RankingHeader/RankingNationalAverageStat.tsx` に固定する。ページ合成テストは `RankingHeaderStats` が1回だけ現れ、旧 `NationalTrendCard` と重複R2 readerが無いことを検査する。さらにranking components全量を走査し、`seriesName="全国平均"` のrendererがcanonical owner 1ファイルだけであることを固定する。重複UIの再発防止は個々のsnapshotテストではなく、ページ合成と意味単位の件数契約で行う。

**証拠**: `apps/web/src/features/ranking/components/RankingKeyPage/__tests__/ranking-header-density-contract.test.ts`。2026-08-23に localhost の `grilled-eel-consumption-expenditure` で全国平均カード1件、旧独立カード0件を確認。
