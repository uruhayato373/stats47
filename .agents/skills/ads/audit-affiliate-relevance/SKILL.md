---
name: audit-affiliate-relevance
description: ブログ記事の読者意図とアフィリエイト vertical の関連性を全量監査する。記事明示policy、出典調査、タグの競合を抽出し、自動修正せずレビュー候補を生成する。Use when user says "アフィリエイト関連性監査", "記事と広告のミスマッチ", "広告選定を全記事チェック".
primary_agent: affiliate-manager
co_agents: [blog-editor]
---

ブログ記事の **読者意図 × AffiliateVertical** を決定的に棚卸しする。調査名はデータ出典であり購買意図とは
限らないため、survey と tag の競合を候補化し、意味判断を自動適用しない。

- **明示policy SSOT**: `apps/web/src/features/ads/constants/blog-affiliate-policy.ts`
- **自動解決 SSOT**: `apps/web/src/features/ads/constants/affiliate-category.ts`
- **判定コア**: `.claude/scripts/ads/lib/affiliate-relevance-core.mjs`
- **state**: `.claude/state/ads/relevance-latest.json`（派生物・手編集禁止）

## 実行

```bash
# PR向け。slug・10 vertical・理由の構造をネットワークなしで検査
npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --check

# 公開全記事を監査し、レビュー候補stateを更新
npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --live
```

## 判定と是正

| 結果 | 意味 | 次の処理 |
|---|---|---|
| policy error | slug不存在、10軸外、理由不足 | policyを修正。CI blocker |
| `survey-tag-conflict` / `survey-without-intent-tag` | 出典調査だけでverticalが決まる、または記事タグと不一致 | 記事本文と検索意図を人が確認 |
| `survey-blocks-tag` / `multiple-tag-verticals` | 調査nullとタグが競合、または複数意図タグ | 1軸または広告なしを人が判断 |
| 明示 `vertical` | 記事単位で自動分類を上書き | 理由を保ち、広告在庫は別管理 |
| 明示 `null` | 合う商材がなく広告を出さない | 別verticalへフォールバックしない |

- 監査は分類候補を出すだけ。記事の広告を一括で自動変更しない。
- 修正が必要な記事だけ `BLOG_AFFILIATE_POLICY` に理由付きで追加する。
- 広告コード、priority、ASP在庫は変更しない。compliance は `/audit-affiliate-compliance` が担当する。
- `--live` は週次 `affiliate-dashboard-refresh.yml` で実行し、stateをartifactへ残す。

## 完了条件

1. `--check` が成功する。
2. 純粋関数テスト `node --test .claude/scripts/ads/__tests__/affiliate-relevance-core.test.mjs` が成功する。
3. `--live` の件数とstateの `articleCount` / `reviewFindingCount` が一致する。
4. 採否判断した記事は明示policyに理由があり、未判断候補はstateに残る。
