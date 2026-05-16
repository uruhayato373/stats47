---
type: backlog
category: feature
created: 2026-05-16
status: pending
---

# 機能開発バックログ (Tier-2/3)

未着手の機能開発タスク。優先度は tier で示す。実装着手時は section header に `[in-progress]` を付与、完了時に `[done]` + 完了日を追記。

---

## #129 [T2-AI-CONTENT-01] regional_analysis を UI に配線（または insights へ統合）

- **tier**: 2
- **status**: pending
- **related_issue**: #129 (closed)

### 背景

ranking_ai_content テーブルの `regional_analysis` フィールドは、v1.0 から運用されているが **`apps/web/src/app/ranking/[rankingKey]/page.tsx` で `regionalAnalysisSection` prop が wired されていない**ため、DB に保存された内容が一切描画されていない。

2026-04-26 の v3.0 pilot 再生成で発覚（`/ranking/konbu-consumption-quantity` で「## 相関構造：北日本食文化クラスター」セクションが DB には存在するが本番ページに出ない）。

### 現状

- `RankingKeyPageClient` は `regionalAnalysisSection?: ReactNode` を受け取る（既に accordion レイアウトのスロット存在）
- 親 page.tsx は `insightsSection={...}` `faqSection={...}` `correlationSection={...}` のみ渡し、`regionalAnalysisSection` は未配線
- 結果、pilot 8 件すべてで v3.0 の `regional_analysis` 内容（地理特徴 + 相関構造）が読者に届いていない

### 影響範囲

- 8 件すべての pilot 再生成 content の **約 1/3 が不可視**
- v2.0 規模の総 1,922 件についても同様

### 対応案

#### 案 A: regionalAnalysisSection を wire（最小変更）

`page.tsx` に以下を追加。AiContentAccordion の表示位置（insights の前後など）は要 UX 確認:

```tsx
regionalAnalysisSection={
  aiContent?.regional_analysis
    ? <AiContentAccordion title="地域別の特徴"><AiMarkdownContent content={aiContent.regional_analysis} /></AiContentAccordion>
    : null
}
```

#### 案 B: regional_analysis を insights に統合してフィールド削除

- v3.0 プロンプトで生成範囲を insights に集約
- DB マイグレーションで `regional_analysis` カラム廃止
- 利点: 1 セクション分の冗長性除去、AI 生成コスト削減
- 欠点: 既存 1,922 件の content 移行作業が必要

### 推奨

案 A を **先に実装**（既存 v3.0 content をすぐ可視化）→ 効果を見て案 B を検討。

### 完了条件

- `/ranking/konbu-consumption-quantity` で「相関構造：北日本食文化クラスター」が描画される
- pilot 8 件で `regional_analysis` の文字数 / 描画位置を確認
- LCP/CLS への影響を測定（accordion デフォルト閉じならノーリスク）

---

## #131 [T2-CORR-UI-01] CorrelationSection UI 拡張（partial_r 表示 + scatter mini）

- **tier**: 2
- **status**: pending
- **related_issue**: #131 (closed)

### 背景

ローカル D1 に correlation_analysis 1,674,544 行 / リモートに完全 sync 済み（2026-04-26 完了）。`partial_r_population/area/aging/density` と `scatter_data` (47 県座標 JSON) も全行に格納済み。

しかし `apps/web/src/features/ranking/components/CorrelationSection/CorrelationSectionClient.tsx` は **ranking_name + pearson_r のみ表示** で、todo-ran.com 等の競合と比較して情報量が不足している。

### 不足している既存 DB データ

| データ | 用途 |
|---|---|
| `partial_r_population` | 人口の影響を除いた偏相関 |
| `partial_r_area` | 面積の影響を除いた偏相関 |
| `partial_r_aging` | 高齢化率の影響を除いた偏相関 |
| `partial_r_density` | 人口密度の影響を除いた偏相関 |
| `scatter_data` | 47 県プロット用の散布図データ |

### 改善案（優先順）

#### 🥇 即実装（DB 既存データ活用）

**1. partial_r 表示**: 人口除外の偏相関を pearson_r の隣に小さく表示
- 効果: 「人口比例の自明な相関」を一目で見抜ける
- UI: `r=0.98 (人口除外 0.68)` のような併記

**2. scatter mini プレビュー**: SVG で 47 点を 60×40 px に圧縮表示
- 効果: 一目で相関の形（正/負/U字/外れ値）が分かる
- 既存 `scatter_data` JSON をそのまま使える

#### 🥈 中規模実装

**3. partial_r トグル UI**: 「人口の影響を除く」チェックボックス
**4. 相関の解釈ラベル**: r 値による定性ラベル（「強い正の相関」など）

#### ❌ 後回し

5. 動的 scatter（hover で県名表示等）→ /correlation 詳細ページに任せる
6. 時系列相関（同指標の年次変化）→ 別機能

### 想定効果

- 「自明な相関」と「真の相関」を区別できる ＝ 滞在時間 / engagement 改善
- AI 考察（v3.0）で言及した内容が UI でも検証できるようになり、信頼性向上

### 完了条件

- partial_r が表示される
- scatter mini が描画される（少なくとも上位 5 相関について）
- パフォーマンス影響測定（LCP/CLS）

---

## #132 [T3-AI-CONTENT-02] v3.0 プロンプトを全 1,914 件に展開

- **tier**: 3
- **status**: pending
- **related_issue**: #132 (closed)

### 背景

2026-04-26 に pilot 8 件で v3.0 プロンプト（相関データ込みの insights 生成）を inline 生成・適用済み。残 **約 1,914 件** を自動化して展開する必要あり。

pilot 結果（remote D1 反映済み）:
- 6 件: 相関構造を含む insights を生成（agricultural-output / starting-salary-highschool / general-hospital-bed-occupancy-rate / wind-power-turbine-count / konbu-consumption-quantity / elementary-school-count）
- 2 件: EXCLUDED（total-population / foreign-resident-count）に「他指標との相関は集計対象外」を明記

### 自動化案

| 案 | 内容 | コスト目安 |
|---|---|---|
| **A: ANTHROPIC_API_KEY** | Sonnet 4.6 で `generate-parallel.ts` を改修・実行 | $80-100（Sonnet, 1,914 件、1 件 5K tokens） |
| **B: Claude Code CLI (`claude -p`)** | 本セッションのサブスクリプション内で実行 | 0 円 + 8-12 時間（並列度低） |

### 必要な準備

1. **`packages/ai-content/src/services/prompts/ranking-content-prompt.ts`** に v3.0 ルールを反映（pilot 8 件で検証済みの構造）
2. **`RankingContentInput`** に `correlations` フィールド追加（top 5、`partial_r_*` 含む）
3. **excluded keys ハンドリング** （`packages/correlation/src/trivial-pairs.ts` の `EXCLUDED_CORRELATION_KEYS` を参照）
4. **再生成スクリプト**: 各 ranking について `correlation_analysis` から top 5 を取得 → 既存 inputs に join → AI 呼び出し
5. **バックアップ**: 全 1,914 件の v2 → `/tmp/ai-content-backup-v2-bulk.json`

### 完了条件

- 全 1,922 件で `prompt_version='3.0.0'`
- pilot 8 件は本作業の対象外（ベースラインとして維持）
- 相関言及を含む比率: 80% 以上（excluded 除く）
- tsc PASS
- production 上で 10 件サンプリングして相関考察の質確認
