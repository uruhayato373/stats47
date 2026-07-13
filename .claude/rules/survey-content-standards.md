# survey コンテンツクラスター標準 (survey-content-standards)

`/survey/<surveyKey>` を「関連ランキング一覧」から**調査ごとに異なる検索意図を受ける編集ハブ**へ育てる運用正典。
survey ハブの編集コンテンツ (summary / 分かること / 代表的な問い / 注意点 / 関連記事) を設計・編集する
agent (`survey-curator`) / 人間はこれに従う。2026-07-12 に旧 `docs/02_実装計画/20_survey別コンテンツクラスター戦略.md`
の運用スペック (編集文法・ハブ構成・SSOT/境界・禁止事項) を本 rule へ抽出し、運用 SSOT を .claude に一本化した。

> **実装済み SSOT**: survey 編集情報の git TS は `apps/web/src/features/survey/survey-editorial.ts`
> (`summary` / `whatYouCanLearn[]` / `readerQuestions[]{question,rankingKey}` / `caveats[]` / `relatedArticleSlugs[]`)。
> **紐付け (ranking↔survey) の正典は別**: `.claude/rules/survey-linkage-standards.md` (surveys.json / provenance)。
> 本 rule は**編集コンテンツ**、linkage-standards は**紐付けメタ**。両方 survey-curator が所有する。
> 横展開の進捗・census 実験の計測は `.claude/state/surveys/{portfolio,experiments}.json`
> (survey-curator / skill `/manage-survey-portfolio`) が追跡 (2026-07-13 に handoff から移行)。

## ファネル役割 (維持する・混ぜない)

- `/ranking/[key]`: 単一の問い・事実を取る集客面
- `/blog/[slug]`: 背景・理由・生活への含意を説明する集客面
- `/survey/[key]`: 同じ調査に属する問いを束ねる潜在集客ハブ
- `/themes` `/areas` `/compare`: 内部回遊・深掘り面

Google の people-first 方針に合わせ、独自分析・明確な出典・集計方法・著者情報を価値の中心に置く。
検索流入だけを目的とした薄い自動生成ページは作らない。

## 調査タイプ別の編集文法

| 調査タイプ | 代表 survey | 主な読者意図 | 優先する切り口 | 注意点 |
|---|---|---|---|---|
| 人口・世帯 | 国勢調査、人口推計 | 自分の地域、結婚、世帯、人口減少 | 年代・性別・家族構成・都市集中・時系列 | 母数、年齢階級、調査年 |
| 出生・死亡 | 人口動態統計 | 少子化、婚姻、離婚、健康 | 出生・死亡・婚姻の関係、長期変化 | 率と件数、因果表現、センシティブ表現 |
| 家計・消費 | 家計調査 | 県民性、食文化、生活費 | 数量と支出、価格、季節性、食文化 | 都道府県ではなく県庁所在市の場合を明記 |
| 労働・賃金 | 賃金構造基本統計、労働力調査 | 転職、年収、雇用 | 年齢・性別・職種・産業・生活コスト | 名目値、標本、属性差 |
| 住宅・土地 | 住宅・土地統計調査 | 空き家、家賃、持ち家、移住 | 住宅費、空き家、老朽化、地域選択 | 空き家定義、住宅数と世帯数 |
| 教育 | 学校基本調査 | 進学、学校数、若者流出 | 進路、地域格差、人口移動 | 学力との混同、年度差 |
| 産業・事業所 | 経済センサス、工業統計 | 地域経済、産業構造 | 特化産業、生産性、事業所規模 | 再編・分類変更、名目額 |
| 行政・財政 | 地方財政状況調査 | 自治体財政、行政サービス | 財政力、歳入構造、将来負担 | 単一指標で健全性を断定しない |

## 各クラスターの4つの問い

各 survey は次の4方向から論点を選ぶ。全方向を機械的に埋める必要はない。

1. **どこが高い・低いか** — ranking が回答する
2. **なぜ地域差があるか** — blog が複数指標と背景を説明する
3. **生活や意思決定にどう関係するか** — blog が結婚、仕事、移住等へ翻訳する
4. **数字をどう読むか** — survey ハブが母数、対象、頻度、誤読注意を説明する

## survey ハブの情報構成

1. 調査名、実施主体、調査周期、最新年
2. 「この調査で分かること」3〜5項目
3. 代表的な問い（自然文）と対応 ranking
4. 注目ランキング（既存 `featuredItems` を再利用）
5. 数字を読む際の注意（母数、対象、年齢階級、時点）
6. 関連する分析記事
7. 全ランキング一覧
8. 一次出典

一覧より前に独自解説を無制限に積まず、ファーストビュー付近でユーザーが目的の ranking に移動できる構成にする。

## SSOT と実装境界

survey 固有の編集情報は低 volume・人手・型/review 対象なので **git TS を SSOT** とする
(実装: `apps/web/src/features/survey/survey-editorial.ts`)。R2 JSON を手編集しない。調査マスタと
ranking 紐付けの既存 SSOT (surveys.json / `resolveSurveyLinkage`) は変更しない。

```text
packages/ranking/src/data/surveys.json
  └─ 調査の reference 情報（名称・組織・URL）: 既存のまま

apps/web/src/features/survey/survey-editorial.ts  ← survey 編集情報の git TS SSOT
  ├─ summary
  ├─ whatYouCanLearn[]
  ├─ readerQuestions[] { question, rankingKey }
  ├─ caveats[]
  └─ relatedArticleSlugs[]

R2 app/survey/<id>/items.json
  └─ survey に属する ranking 一覧: 既存の導出を維持
```

- `surveys.json` に長文 SEO コピーを混在させない。blog と survey の独自紐付けを R2/DB に新設せず、
  編集 TS 側に記事 slug を明示する。ranking↔survey は既存の `resolveSurveyLinkage` だけを使用する。
- 定義欠落 survey は現行 UI へフォールバックさせる (1 survey ずつ編集ハブ化・他は壊さない)。
- 実装前に確認: survey page.tsx の exports・取得境界 / article repository・`related-articles.ts` の再利用可否 /
  既存 page_components・SectionHeader・ArticleShell / rules `coding-standards.md`・`ui-components.md`・`survey-linkage-standards.md` /
  docs `07_情報設計.md`・`13_統一レイアウト設計.md`・`12_完全DBレス設計.md`・(URL/metadata/構造化データを触るなら) コード `apps/web/src/lib/url-policy.ts` + `middleware.ts`。

## 横展開の進め方 (小さく実証してから)

- 75 調査を一括で長文化せず、**1 survey (census) で実証 → GSC 実測が基準を満たした場合だけ横展開**する。
- 横展開順は推測で固定せず、`.claude/state/surveys/portfolio.json` (editorial-candidate の優先順位) の GSC 実測を使う
  (初回監査の証跡: `.claude/skills/survey/manage-survey-portfolio/reference/audits/2026-07-11-survey-portfolio-audit.md`)。
- 判定 (デプロイ4〜8週後・baseline 比): CTR +30% 以上かつ impressions 100 以上 / クラスター clicks +20% 以上 /
  平均順位 2 以上改善 or 11-20位→Top10 / 内部遷移 GA4 で発生 / 品質 (誤出典・数値不一致・soft404・重複canonical) 0。
  母数不足なら `effect/none` と断定せず計測期間を延長する。

## やらないこと

- 75 survey の一括 AI 長文化 / 47 都道府県ごとの薄い記事生成
- ranking↔survey 紐付けロジックの別実装 (既存 `resolveSurveyLinkage` のみ)
- R2 JSON や生成 snapshot の手編集
- query parameter 違いの類似ページ量産
- 未検証の相関を「理由」や「原因」と断定
- 実験ごとの本番デプロイ (まとまりで 1 回・明示承認後)

## 関連

- 紐付けメタ (別正典): `.claude/rules/survey-linkage-standards.md`
- 実装 SSOT: `apps/web/src/features/survey/survey-editorial.ts`
- 横展開・census 実験の進捗: `.claude/state/surveys/{portfolio,experiments}.json` (skill `/manage-survey-portfolio`・schema は `.claude/state/surveys/README.md`)
- 情報設計 (ファネル役割): `docs/01_技術設計/07_情報設計.md`
- 品質基準 (blog 側): `.claude/rules/blog-quality-standards.md` / 実証判定: `.claude/rules/evidence-based-judgment.md`
- agent: `survey-curator` (編集コンテンツ + 紐付け) / 生成は article-writer / 監査は `/audit-survey-linkage`
