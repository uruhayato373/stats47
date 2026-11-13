---
paths:
  - "apps/web/src/{features/survey,app/survey}/**"
  - ".claude/{scripts/surveys,skills/survey}/**"
  - "data/surveys/**"
  - "config/schema/surveys.lenses.schema.json"
  - ".claude/scripts/lib/survey-lenses.mjs"
  - "packages/data-configs/src/{kakei-analysis-catalog,survey-editorial}.ts"
  - ".claude/agents/survey-curator.md"
---
# survey コンテンツクラスター標準 (survey-content-standards)

`/survey/<surveyKey>` を「関連ランキング一覧」から**調査ごとに異なる検索意図を受ける編集ハブ**へ育てる運用正典。
survey ハブの編集コンテンツ (summary / 分かること / 代表的な問い / 注意点 / 関連記事) を設計・編集する
agent (`survey-curator`) / 人間はこれに従う。2026-07-12 に旧 survey 別コンテンツクラスター計画
の運用スペック（編集文法・ハブ構成・SSOT/境界・禁止事項）を本 rule へ抽出し、運用 SSOT を `.claude/` に一本化した。旧版が必要な場合は Git 履歴を参照する。

> **実装済み SSOT**: survey 編集情報はカタログの `surveys.editorial` (JSON + Schema。読み込みは `packages/data-configs/src/survey-editorial.ts`)
> (`summary` / `whatYouCanLearn[]` / `readerQuestions[]{question,rankingKey}` / `caveats[]` / `relatedArticleSlugs[]` /
> `areaLabel` (ハブ冒頭の地域の表記。都市別の値を集める調査だけ書く) /
> `surveyCycle{intervalYears,anchorYear}` (毎年でない調査の実施周期。ハブ冒頭の最新年を実施年から出す。国勢調査は 5 年ごと))。
> `readerQuestions` の rankingKey は、ハブの代表ランキングとランキングページの「同じ調査のランキング」でも最優先に並ぶ (2026-11-02)。
> **同じ調査の別 ID は 1 つのハブにまとめる**: 指標の紐付けで ID が分かれていても (家計調査は品目別 `kakei-chousa` と社会・人口統計体系経由の
> `household-survey`)、読者にとって 1 つの調査ならハブは 1 つにする。表は `packages/data-configs/src/content/href.ts` の `SURVEY_HUB_ALIASES`
> (リンク・一覧・サイトマップ・301 がこの表を読む)。紐付けの ID は変えない。2 つ目の編集ハブを作らない (2026-11-02 オーナー判断)。
> **紐付け (ranking↔survey) の正典は別**: `.claude/rules/survey-linkage-standards.md` (surveys.json / provenance)。
> 本 rule は**編集コンテンツ**、linkage-standards は**紐付けメタ**。両方 survey-curator が所有する。
> 横展開の進捗・census 実験の計測は `data/surveys/{portfolio,experiments}.json`
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

読者の問いにどう答えるかの順に並べる (2026-11-03 オーナー指摘で組み替え)。

1. 調査名・実施主体・ランキング件数・最新年・対象地域を見出しの下の 1 行に (数値タイルにしない)
2. ランキング: 読者の問いを題にした地図付きのカード (`featuredItems`。記事と同じ `CardGrid`)。カードに入らない問いは「ほかのランキング」のリンク
3. ブログ記事 (サムネイル付き)
4. テーマ (全国の時系列 `/japan/<slug>` は同じテーマの比較の単位違いなので別の節にせず、1 テーマ 1 枚のカードにまとめる)
5. 全ランキング一覧 → 分類から探す
6. この調査について (summary の 1 段落だけ。ページの説明文をゼロにしないため、シートに移さない)

数字を読む際の注意・「分かること」・一次出典は、見出しの右の「出典・指標の定義」ボタンから開く共通のシート (`SourcesSheet`。テーマのページと同じ部品) に出す (2026-11-03)。

ページ内の目次や分類の一覧を最初に置かない (問いと答えより先に移動の道具が出ると、何が分かるページか伝わらない)。
一覧より前に独自解説を積まず、ファーストビューで問いと答えの地図カードが見える構成にする。

## SSOT と実装境界

survey 固有の編集情報は低 volume・人手・review 対象なので **`data/` の台帳 (`surveys.editorial`) を SSOT** とする。R2 JSON を手編集しない。調査マスタと
ranking 紐付けの既存 SSOT (surveys.json / `resolveSurveyLinkage`) は変更しない。

```text
surveys.master (カタログの ID)
  └─ 調査の reference 情報（名称・組織・URL）: 既存のまま

surveys.editorial (カタログの ID)  ← survey 編集情報の SSOT
  ├─ summary
  ├─ whatYouCanLearn[]
  ├─ readerQuestions[] { question, rankingKey }
  ├─ caveats[]
  ├─ areaLabel / surveyCycle
  └─ relatedArticleSlugs[]

data/surveys/lenses/<surveyId>.json  ← 調査の切り口台帳 (下の「調査の切り口台帳」)

R2 app/survey/<id>/items.json
  └─ survey に属する ranking 一覧: 既存の導出を維持
```

- `surveys.json` に長文 SEO コピーを混在させない。blog と survey の独自紐付けを R2/DB に新設せず、
  編集 TS 側に記事 slug を明示する。ranking↔survey は既存の `resolveSurveyLinkage` だけを使用する。
- 定義欠落 survey は現行 UI へフォールバックさせる (1 survey ずつ編集ハブ化・他は壊さない)。
- 実装前に確認: survey page.tsx の exports・取得境界 / article repository・`related-articles.ts` の再利用可否 /
  既存 page_components・SectionHeader・ArticleShell / rules `coding-standards.md`・`ui-components.md`・`survey-linkage-standards.md` /
  docs `03_情報設計.md`・`04_デザインシステム.md`・`02_データアーキテクチャ.md`・(URL/metadata/構造化データを触るなら) コード `apps/web/src/lib/url-policy.ts` + `middleware.ts`。

## 調査の切り口台帳 (2026-11-02)

1 つの統計調査が持つ分析の切り口 (家計調査なら「都市の間で比べる」「支出額を数量と単価に分ける」「年収階級で比べる」
「長期推移を見る」など) は、**調査ごとの台帳** `data/surveys/lenses/<surveyId>.json` (JSON Schema
`config/schema/surveys.lenses.schema.json`) を正本にする。担当は survey-curator。コンテンツの展開 (ランキング・テーマ・
ブログ・note・Kindle・SNS) は、まずこの台帳の切り口と、切り口ごとのチャネルの役割から考える。

- **切り口は資料 (本) の持ち物ではなく、調査の持ち物**。参考文献の規約が禁じる「資料ごとの分類」とは別物である
  (`reference-source-standards.md` §5)。本・NotebookLM・自分たちの発想は、切り口に問いを足す材料にすぎない。
  2026-11-02 に「資料ごとに分類を作らない」を「切り口の台帳を作らない」と読み違え、切り口を本の企画に付ける札へ格下げしかけた。
- 台帳が持つもの: 切り口ごとの読者の問いの型・説明・地域の粒度 (`capital-cities` は県全体の値ではない、`national` はランキングにしない)・
  使う表 (statsDataId)・軸・誤読の注意・チャネルごとの役割 (書いたチャネルが展開先の候補)・準備状況 (データの取得手段が無ければ
  `blocked` と理由)。
- 台帳が持たないもの: **展開の進み具合**。済み・企画中・見送りは展開記録 (`data/source-inventory/expansion.json`) と各チャネルの
  正本から集計する (`npm run surveys:lenses:status`)。同じ状態を 2 か所に書くとずれる。
- 参照の向き: 資料の問い (`data/source-inventory/<source>/<edition>/analyses.json` の `lensIds`) と、調査ごとの分析単位
  (家計調査はカタログの `surveys.analysis-units` の `lensId`。問い × 表の軸 × 載せるページ) が切り口を参照する。
  **切り口台帳のある調査を `surveyIds` に持つ問いは、資料を問わず 1 つ以上の切り口に結ぶ** (文脈だけの資料は任意)。
- 検査: `npm run surveys:lenses:check` (PR CI)。表 id の実在、問いと分析単位からの参照の実在 (調査 id の実在は check-datasets の refs)、未接続の問いを止める。
  品目単位の「どの品目を指標にし、どれを見送ったか」は調査ごとの台帳 (家計調査は `data/estat/kakei-ledger/`) が持ち、切り口台帳には書かない。
- 新しい調査に切り口台帳を作るときは、表の棚卸し (e-Stat カタログ `npm run estat:catalog:search`) を先に行い、切り口ごとに使う表を確かめてから書く。

### コンテンツのサイクル (台帳 → 切り口 → 指標 → ページ・2026-11-02)

同じ見落としを繰り返さないため、展開は次の鎖でだけ進め、各段の決まりを検査で止める。ページ側に「出す・出さない」の一覧を持たない。

1. **e-Stat カタログ → 調査の台帳** (家計調査は `data/estat/kakei-ledger/`): すべての表に採用・予定・除外を理由付きで書く。
   採用は指標か作成済みの分析単位から自動で決まり、予定・除外は `decisions.json` に書く。未判断の数は `maxUndecidedTables` を超えられない (縮小専用。判断したら下げる)
2. **台帳 ↔ 切り口台帳**: 切り口が使う表は未判断にできない (`LENS_TABLE_UNDECIDED`)。採用・予定の表はどれかの切り口に属させる (`TABLE_WITHOUT_LENS`)。除外した表を切り口が使わない (`LENS_USES_EXCLUDED`)
3. **台帳 → 指標・分析単位**: 指標 (`kind: kakei-chousa`) と分析単位 (`surveys.analysis-units`) の両方を表の使い手として数える。予定の表を使う指標・図ができたら台帳を作り直す (`npm run estat:kakei-ledger:build`)
4. **指標 → ページ**: テーマ・調査ハブ・ランキング・県ページは指標の定義と台帳を読むだけにする
5. **週次レビュー**: `npm run weekly:audits` の survey-taxonomy が台帳と切り口台帳を検査し、予定のまま作られていない表 (`PLANNED_TABLES`) と未判断の数 (`UNDECIDED_TABLES`) を出す。レビュー本文の課題へ書き、backlog へ流す

検査は `npm run estat:kakei-ledger:check` と `npm run surveys:lenses:check` (PR CI と週次)。

### 面ごとの点検表 (切り口を展開するとき・2026-11-02)

切り口をサイトへ展開するときは、切り口 1 つずつ、代表のページを localhost (`npm run dev:web`) で開いて下の面を点検する。
1 ページで見つけた問題は型として扱い、同じ調査の全ページへ機械で直す (1 ページだけ手で直して終えない)。

- **ランキング** (`/ranking/<key>`): 題・小見出しが台帳の地域の粒度と合う (家計調査は「県庁所在市の二人以上世帯」で、県全体の値と書かない)。
  単位が測っているものと合う (食品は消費量、耐久財などは購入数量)。誤読しやすい品目に定義の注記がある (`kakei-definition-reading`)。
  「同じ調査のランキング」が編集の `readerQuestions` を先に出す。
- **テーマ** (`/themes/<key>`): 切り口のチャネルに `theme` があるとき、その指標が ThemeCatalog に入っている。全国集計 (`national`) の切り口を県の地図にしない。
- **調査ハブ** (`/survey/<key>`): 地域の表記 (`areaLabel`)・読者の問い・注意点が台帳の `readerQuestion`・`caveats` と食い違わない。同じ調査の別 ID は 1 つのハブにまとまり (`SURVEY_HUB_ALIASES`)、別名の URL はそのハブへ 301 する。
- **導線**: ランキング → 調査ハブ → 関連記事 → ランキングの往復がどれも実在するページへ届く (soft 404 は `audit-site-links.mjs` で見る)。
  切り口の記事 (ブログ) が、その指標のランキングの関連記事に出る (`rankingArticleIndex`)。
- **UI**: 代表カードのフック文が値と単位を取り違えない。スマホ幅 (375px) で題・単位・注記が切れない。

点検で見つけた型は、直す仕組み (lint・生成スクリプト・編集 TS) と一緒に記録する。直せないものは backlog にカードを起票する。

## 横展開の進め方 (小さく実証してから)

- 75 調査を一括で長文化せず、**1 survey (census) で実証 → GSC 実測が基準を満たした場合だけ横展開**する。
- 横展開順は推測で固定せず、`data/surveys/portfolio.json` (editorial-candidate の優先順位) の GSC 実測を使う
  (初回監査の証跡: `data/surveys/audits/2026-07-11-survey-portfolio-audit.md`)。
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
- 編集本文の SSOT: カタログの `surveys.editorial`
- 横展開・census 実験の進捗: `data/surveys/{portfolio,experiments}.json` (skill `/manage-survey-portfolio`・形は カタログの surveys.portfolio・surveys.experiments (Schema))
- 情報設計 (ファネル役割): `docs/01_技術設計/03_情報設計.md`
- 品質基準 (blog 側): `.claude/rules/blog-quality-standards.md` / 実証判定: `.claude/rules/evidence-based-judgment.md`
- agent: `survey-curator` (編集コンテンツ + 紐付け) / 生成は article-writer / 監査は `/audit-survey-linkage`
