---
type: agent-reference
date: 2026-08-25
status: superseded
tags: [theme-catalog, definitions, caveats, ui]
---

# テーマ定義・注意事項カード仕様

> **2026-08-25 superseded**: ヘッダー直後へ定義カードを複製する案は実装しない。
> `/ranking/[key]` を指標定義・一般注釈・出典・関連記事の指標ハブとし、Theme chart は
> `relatedRankingKeys` で接続する。chart 固有の誤読防止条件だけを `ThemeCatalog.charts[].annotation` から
> footer に表示する。正典は `docs/01_技術設計/03_情報設計.md`、
> `.claude/rules/theme-catalog-standards.md`、`apps/web/src/features/theme-dashboard/README.md`。
> 以下は採用しなかった旧案の記録であり、実装指示として使用しない。

> 実装状況と優先度は `.claude/todo/backlog.md` の
> `THEME-GUIDANCE-CARDS-01` を正典とする。本書はエージェントが実装時に読む詳細仕様であり、
> 進捗台帳として使用しない。

## 結論

テーマページに「主要指標の定義」と「比較時の注意」を常時表示することは有効である。チャートを見る前に分母・単位・年度・因果解釈の限界を伝えられ、テーマレビューで発見した誤読リスクをUIで直接防げる。

実装は以下に統一する。

- 内容SSOT: `packages/data-configs/src/theme-catalog/<key>.ts`
- 共通UI: `apps/web/src/features/theme-dashboard/components/ThemeGuidanceCards.tsx`
- 掲載位置: `ThemeAreaHeader` の直後、`ThemeDashboardClient` の直前
- 表示: 「指標の定義」と「比較時の注意」の2枚
- 実装対象: まずレビュー済み10テーマ。ただしテーマごとのPR-0監査後に有効化する

## 目的と非目的

### 目的

- 指標名だけでは分からない分子・分母・単位を説明する
- 実数/率、観測/推計、都道府県/庁所在市の違いを明示する
- ランキング上位=良いとは限らない指標を警告する
- 相関を因果と誤読しないようにする
- 各テーマの定義文をcatalogでreview可能にする

### 非目的

- 全metricの長文定義をテーマページに複製すること
- `selection`（選定根拠）の代替。選定根拠は従来どおり「このテーマの全指標」に表示
- チャートごとの軸・凡例・出典の代替
- 法的免責文や長いmethodology文書の掲載

## UI仕様

### 配置

```text
Breadcrumb
ThemeAreaHeader
ThemeGuidanceCards        ← 新規
ThemeDashboardClient
InContentAd
GIS sections
ThemeIndicatorCatalogSection
```

チャートの後ではなく前に置く。ただしh1と説明の間に挟まず、`ThemeAreaHeader` の後とする。

### 構造

```text
section[aria-labelledby]
├─ h2: このテーマの読み方
├─ p: guidance.summary
└─ grid (1 col / md:2 cols)
   ├─ SurfaceSection: 主要指標の定義
   │  └─ dl (term / description)
   └─ SurfaceSection: 比較時の注意
      └─ ul
```

- 新しいカード基底を作らず `SurfaceSection` を使う
- 日常的な読み方なので `Alert` の destructive/warning 色は使わない
- 角丸を追加しない。デザインシステムのフラット表現に従う
- 定義は `<dl><dt><dd>`、注意事項は `<ul><li>` で構造化
- 重要な注意をAccordion内に隠さない
- カード1枚に最大4項、1項は原則70文字以内
- ソースリンクはカード末尾に「定義の出典」としてまとめる

### 見た目

- outer: `mt-6 space-y-3`
- heading: `text-lg font-bold`
- grid: `grid grid-cols-1 gap-3 md:grid-cols-2`
- card: `SurfaceSection className="p-4"`
- card title: `text-sm font-semibold`
- body: `text-sm leading-6 text-muted-foreground`
- iconは `BookOpen` / `CircleAlert` 程度に留め、色だけで意味を伝えない

## データモデル

`packages/data-configs/src/theme-catalog/types.ts` に次を追加する。

```ts
export interface ThemeGuidanceDefinition {
  term: string;
  description: string;
}

export interface ThemeGuidanceSource {
  label: string;
  url: string;
}

export interface ThemeGuidance {
  summary: string;
  definitions: ThemeGuidanceDefinition[];
  caveats: string[];
  sources?: ThemeGuidanceSource[];
}

export interface ThemeCatalog {
  // existing fields...
  guidance?: ThemeGuidance;
}
```

### 設計判断

- `guidance` は任意。未移行テーマのUIを壊さない
- keyのないfree-form JSONにせず、型付きフィールにする
- 表示用文章はpage-components JSONへ生成しない。`THEME_CATALOGS` からServer Componentが直接読む
- `MetricConfig.description/note`はランキング単体用。複数指標を横断するテーマの読み方は `ThemeCatalog.guidance` が持つ
- `selection` と混ぜない。`selection.rationale` はなぜ採用したか、`guidance` はどう読むか

## コンポーネン仕様

### 新規ファイル

`apps/web/src/features/theme-dashboard/components/ThemeGuidanceCards.tsx`

```tsx
interface Props {
  themeKey: string;
}

export function ThemeGuidanceCards({ themeKey }: Props) {
  const guidance = THEME_CATALOGS[themeKey]?.guidance;
  if (!guidance) return null;

  // SurfaceSection × 2、dl/ul、sourcesを描画
}
```

- Server Componentのままにする。`"use client"`を付けない
- `THEME_CATALOGS` から取得し、propsに長文データを重複して渡さない
- 外部出典リンクは `target="_blank" rel="noopener noreferrer"`
- guidanceなしは `null`を返し、legacyテーマを壊さない

### 変更ファイル

`apps/web/src/features/theme-dashboard/components/ThemePageLayout.tsx`

```tsx
<ThemeAreaHeader ... />
<ThemeGuidanceCards themeKey={theme.themeKey} />
<ThemeDashboardClient ... />
```

`ThemeGuidanceCards` に `mt-6` を持たせ、各pageが余白を重複指定しない。

## 10テーマの掲載内容

### 1. population-dynamics（人口動態）

```ts
guidance: {
  summary: "人口の増減を、出生・死亡による自然増減と、転入・転出による社会増減に分けて読みます。",
  definitions: [
    {
      term: "人口増減率",
      description: "一定期間の人口増減を基準人口に対する割合で示した指標です。",
    },
    {
      term: "自然増減率",
      description: "出生数と死亡数の差を人口に対する率で示します。",
    },
    {
      term: "社会増減率",
      description: "転入等と転出等の差を人口に対する率で示します。",
    },
    {
      term: "合計特殊出生率",
      description: "15〜49歳の女性の年齢別出生率を合計した指標で、粗出生率とは異なります。",
    },
  ],
  caveats: [
    "実数は人口規模の影響を受けるため、都道府県比較では率と併記します。",
    "指標ごとに利用可能年が異なります。特に社会増減率は表示年を確認してください。",
    "将来推計は観測値ではありません。実績と同じものとして解釈しないでください。",
  ],
  sources: [
    { label: "総務省統計局 人口推計", url: "https://www.stat.go.jp/data/jinsui/2024np/index.html" },
    { label: "厚生労省 人口動態調査", url: "https://www.mhlw.go.jp/toukei/list/81-1.html" },
  ],
}
```

### 2. aging-society（少子高齢化）

```ts
guidance: {
  summary: "高齢化率だけでなく、年少・生産年齢・老年人口の構成と支え手の比率を組み合わせて読みます。",
  definitions: [
    {
      term: "高齢化率",
      description: "総人口に占める65歳以上人口の割合です。",
    },
    {
      term: "老年化指数",
      description: "年少人口に対する65歳以上人口の比率で、世代構成の偏りを示します。",
    },
    {
      term: "従属人口指数",
      description: "生産年齢人口に対する年少人口と65歳以上人口の合計の比率です。",
    },
    {
      term: "75歳以上人口",
      description: "65歳以上とは別区分です。医療・介護需要を読む際は区別が必要です。",
    },
  ],
  caveats: [
    "高齢化率の上昇は高齢者数の増加だけでなく、若年・生産年齢人口の減少でも起こります。",
    "65歳以上と75歳以上は医療・介護制度上も異なる区分です。",
    "将来値は仮定に基づく推計です。実績値と視覚的に区別して読みます。",
  ],
  sources: [
    { label: "内閣府 高齢社会白書", url: "https://www8.cao.go.jp/kourei/whitepaper/w-2025/zenbun/07pdf_index.html" },
    { label: "国立社会保障・人口問題研究所 将来推計人口", url: "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp" },
  ],
}
```

### 3. healthcare（医療・健康）

```ts
guidance: {
  summary: "健康結果、医療の需要・利用、医師・病床等の供給資源、予防の4層を分けて読みます。",
  definitions: [
    {
      term: "人口10万人当たり",
      description: "人口規模の異なる地域を比較するため、人数や施設数を10万人当たりに換算した値です。",
    },
    {
      term: "受療率",
      description: "調査日に医療機関で受療した推計患者数を人口当たりで示した指標です。",
    },
    {
      term: "健康寿命",
      description: "日常生活に制限のない期間の平均で、平均寿命とは異なります。",
    },
    {
      term: "1人当たり医療費",
      description: "医療費総額を対象人口で割った値で、年齢構成や受療行動の影響を受けます。",
    },
  ],
  caveats: [
    "医師数や病床数が多いことだけで、地域の医療が十分とは判断できません。",
    "年齢調整していない死亡率は、高齢化率の高い地域ほど高くなりやすい点に注意が必要です。",
    "健診受診率と死亡率等の地域相関は、直接の因果関係を証明するものではありません。",
  ],
  sources: [
    { label: "厚生労省 地域医療構想", url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000080850.html" },
    { label: "厚生労省 健康日本21（第三次）", url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/kenkounippon21_00006.html" },
  ],
}
```

### 4. living-housing（暮らし・住まい）

```ts
guidance: {
  summary: "住宅ストック、広さ・安全性、家賃等の負担、世帯・立地の4層を分けて読みます。",
  definitions: [
    {
      term: "空き家率",
      description: "住宅総数に占める空き家の割合で、賃貸用・売却用・二次的住宅等も含み得ます。",
    },
    {
      term: "持ち家率",
      description: "人が居住する住宅に占める持ち家の割合です。",
    },
    {
      term: "1住宅当たり延べ面積",
      description: "住宅の各階床面積を合計した平均値で、持ち家と借家で水準が異なります。",
    },
    {
      term: "3.3m²当たり家賃",
      description: "住宅の広さの影響を調整するため、家賃を約1坪当たりで示した値です。",
    },
  ],
  caveats: [
    "空き家率は、放置空き家や法上の管理不全空家の割合とは一致しません。",
    "持ち家率が高い、または住宅が広いことだけで暮らしやすさは判断できません。",
    "家計調査由来の住居費は、都道府県庁所在市や二人以上世帯など対象が限定される場合があります。",
  ],
  sources: [
    { label: "総務省統計局 住宅・土地統計調査", url: "https://www.stat.go.jp/data/jyutaku/2023/tyousake.html" },
    { label: "国土交通省 空家等対策", url: "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk3_000035.html" },
  ],
}
```

### 5. real-income（実質所得）

`real-income` は正式レビューの派生指標監査（PR-0）が完了するまで、以下の `guidance` をcatalogへ追加しない。監査承認後にそのまま実装候補として使用する。

```ts
guidance: {
  summary: "額面収入、税・社会保険料控除後の可処分所得、物価補正後の購買力、住居費控除後の手残りを分けて読みます。",
  definitions: [
    {
      term: "実収入",
      description: "勤め先収入や事業収入、社会保障給付などを含む世帯の受取額で、可処分所得とは異なります。",
    },
    {
      term: "可処分所得",
      description: "実収入から税金や社会保険料などの非消費支出を差し引いた、消費や貯蓄に使える所得です。",
    },
    {
      term: "実質可処分所得",
      description: "可処分所得を地域の物価水準で補正した購買力の指標です。補正式と基準値を確認して読みます。",
    },
    {
      term: "消費者物価地域差指数",
      description: "同じ年の地域間物価水準を全国平均=100として示す指数で、物価の前年比とは異なります。",
    },
  ],
  caveats: [
    "家計調査由来の値は、二人以上の勤労者世帯や都道府県庁所在市など対象が限定される場合があります。",
    "月額と年額、異なる世帯区分、異なる調査年の値を、そのまま加減算・比較してはいけません。",
    "1人当たり県民所得は地域経済計算上の指標で、個人や世帯の給与・手取り額ではありません。",
    "派生指標は計算式・単位・入力年が検証済みの場合だけ表示します。",
  ],
  sources: [
    { label: "総務省統計局 家計調査", url: "https://www.stat.go.jp/data/kakei/index.html" },
    { label: "総務省統計局 消費者物価地域差指数", url: "https://www.stat.go.jp/data/kouri/kouzou/index.html" },
    { label: "内閣府 県民経済計算", url: "https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html" },
  ],
}
```

### 6. consumer-prices（物価・消費）

```ts
guidance: {
  summary: "同じ年の全国平均と比べ、総合と費目別の物価水準が地域ごとにどう異なるかを読みます。",
  definitions: [
    {
      term: "消費者物価地域差指数",
      description: "同じ年の地域間物価水準を全国平均=100として示す指数です。",
    },
    {
      term: "総合指数",
      description: "各費目を家計支出のウエイトで統合した指数で、費目別指数の単純平均ではありません。",
    },
    {
      term: "家賃を除く総合",
      description: "住居費の地域差を除いて物価水準を比較するための指数です。",
    },
    {
      term: "消費者物価指数（CPI）",
      description: "物価の時間的な変化を測る指数です。地域差指数とは比較する方向が異なります。",
    },
  ],
  caveats: [
    "指数が100を上回ることは全国平均より相対的に高いことを示し、物価上昇率を意味しません。",
    "指数差をそのまま世帯の支出額や生活費の円額差へ換算することはできません。",
    "総合順位だけでなく、住居・食料・光熱水道など費目別の構成を確認してください。",
    "高物価かどうかだけで暮らしやすさは判断できず、所得や住宅費との併読が必要です。",
  ],
  sources: [
    { label: "総務省統計局 小売物価統計調査（構造編）", url: "https://www.stat.go.jp/data/kouri/kouzou/index.html" },
    { label: "総務省統計局 消費者物価指数", url: "https://www.stat.go.jp/data/cpi/" },
  ],
}
```

### 7. labor-wages（労働・賃金）

```ts
guidance: {
  summary: "最低賃金、初任給、属性別賃金、労働時間を分け、対象労働者と金額の単位を揃えて読みます。",
  definitions: [
    {
      term: "地域別最低賃金",
      description: "都道府県ごとに定められる1時間当たりの法定最低額で、地域の平均賃金ではありません。",
    },
    {
      term: "所定内給与額",
      description: "所定労働時間に対して支払われる給与で、超過労働給与や賞与を含みません。",
    },
    {
      term: "初任給",
      description: "新規学卒者の入職時賃金です。学歴、企業規模、対象年を確認して比較します。",
    },
    {
      term: "男女賃金格差",
      description: "男女の平均賃金の差または比率です。比率の向きと対象労働者の定義確認が必要です。",
    },
  ],
  caveats: [
    "月額、時間額、年収は同じ単位ではなく、そのまま順位や差を比較できません。",
    "一般労働者と短時間労働者、男女、産業、企業規模、年齢構成の違いが平均値へ影響します。",
    "男女の単純平均差は、同じ職務を行う個人間の賃金差を直接示すものではありません。",
    "名目賃金が高くても、税・社会保険料や物価を考慮した購買力が高いとは限りません。",
  ],
  sources: [
    { label: "厚生労働省 賃金構造基本統計調査", url: "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html" },
    { label: "厚生労働省 地域別最低賃金", url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/index.html" },
  ],
}
```

### 8. labor-mobility（労働移動・雇用市場）

```ts
guidance: {
  summary: "雇用需給、人材の入職・離職・転職、テレワーク等の働き方を、異なる指標として分けて読みます。",
  definitions: [
    {
      term: "有効求人倍率",
      description: "有効求人数を有効求職者数で割った値です。就業地別・受理地別等の種別確認が必要です。",
    },
    {
      term: "完全失業率",
      description: "労働力人口に占める完全失業者の割合で、働いていない人全体の割合ではありません。",
    },
    {
      term: "就業率と有業率",
      description: "出典調査、対象年齢、分母、調査時点が異なるため、同じ指標として扱いません。",
    },
    {
      term: "離職率と転職率",
      description: "離職した人すべてが転職するわけではなく、分子・分母と対象期間も確認が必要です。",
    },
  ],
  caveats: [
    "求人倍率が高いことは、職種ミスマッチや深刻な人手不足を示す場合もあります。",
    "都道府県別失業率は全国値より標本誤差が大きく、短期的な順位差を過大解釈しないでください。",
    "離職率の高さだけで雇用環境の良し悪しは判断できず、離職理由や転職後の状況が必要です。",
    "テレワーク率や副業率は、地域の産業・職種構成に大きく影響されます。",
  ],
  sources: [
    { label: "厚生労働省 一般職業紹介状況", url: "https://www.mhlw.go.jp/toukei/list/114-1.html" },
    { label: "総務省統計局 労働力調査", url: "https://www.stat.go.jp/data/roudou/index.html" },
    { label: "総務省統計局 就業構造基本調査", url: "https://www.stat.go.jp/data/shugyou/2022/index2.html" },
  ],
}
```

### 9. occupation-salary（職業別給与）

```ts
guidance: {
  summary: "同じ職業の給与を地域間・時系列で比較し、年齢、勤続年数、労働時間、企業規模の構成差と併読します。",
  definitions: [
    {
      term: "推計年収",
      description: "月例給与と年間賞与等から算出した年額です。算出式と含まれる給与項目を確認します。",
    },
    {
      term: "きまって支給する現金給与額",
      description: "基本給等に超過労働給与を含む月額で、所定内給与額とは異なります。",
    },
    {
      term: "所定内給与額",
      description: "所定労働時間に対して支払われる給与で、超過労働給与を除きます。",
    },
    {
      term: "職種別平均",
      description: "その職種の労働者平均で、年齢・勤続・男女・企業規模等の構成差を含みます。",
    },
  ],
  caveats: [
    "平均年収は個人が受け取れる典型額や中央値、手取り額を示すものではありません。",
    "都道府県×細職種では標本が小さく、順位や前年差が不安定になる場合があります。",
    "職種分類の改定前後は、同じ名称でも同一系列として比較できない場合があります。",
    "労働時間、年齢、勤続年数、雇用形態が異なる職種を年収だけで評価しないでください。",
  ],
  sources: [
    { label: "厚生労働省 賃金構造基本統計調査", url: "https://www.mhlw.go.jp/toukei/list/chinginkouzou.html" },
  ],
}
```

### 10. local-economy（地域経済）

```ts
guidance: {
  summary: "経済規模、実質的な成長、産業別付加価値、県民所得を分け、総額と1人当たりを区別して読みます。",
  definitions: [
    {
      term: "県内総生産",
      description: "県内で一定期間に生み出された付加価値の総額で、地域の経済規模を示します。",
    },
    {
      term: "実質経済成長率",
      description: "価格変動の影響を除いた県内総生産の変化率です。基準年と計算方式を確認します。",
    },
    {
      term: "県民所得",
      description: "雇用者報酬、企業所得、財産所得等を含む地域経済計算上の所得で、個人給与ではありません。",
    },
    {
      term: "産業別付加価値構成",
      description: "各産業が県内総生産に占める割合で、産業別就業者構成とは異なります。",
    },
  ],
  caveats: [
    "県内総生産の総額は人口規模の影響が大きく、住民の豊かさを直接示しません。",
    "名目値と実質値、総額と1人当たり、県内概念と県民概念を混同しないでください。",
    "1人当たり県民所得は、住民個人が受け取る平均給与や手取り額ではありません。",
    "基準改定や遡及改定を跨ぐ時系列は、同じ系列として比較できるか確認が必要です。",
  ],
  sources: [
    { label: "内閣府 県民経済計算", url: "https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/kenmin_top.html" },
    { label: "総務省統計局 経済センサス", url: "https://www.stat.go.jp/data/e-census/2021/index.html" },
  ],
}
```

## validator仕様

`packages/data-configs/scripts/validate-theme-catalog.ts` に次を追加する。

### error

- `guidance.summary` が空
- `definitions` が0件または5件以上
- `term` / `description` が空
- `caveats` が0件または5件以上
- source URLが `http://` / `https://` 以外
- 同一termの重複

### warn（実装対象10テーマは0件にする）

- summary 120文字超
- definition/caveat 120文字超
- sourceなし
- primaryが3件以上あるのにdefinitionsが1件のみ

## テスト仕様

### data-configs

- guidance付きcatalogがvalidatorを通過
- 空summary、空term、5件以上、不正URLを拒否
- guidanceなしlegacy catalogを許容

### Web component

- guidanceなしで `null`
- summary、definitions、caveats、sourcesを描画
- `<dl>` / `<dt>` / `<dd>` / `<ul>` のsemanticを確認
- 外部リンクの `target` / `rel`を確認
- 同一themeKeyで安定したheading idを生成

### 視覚QA

- 375px: 1列、文字切れ・横スクロールなし
- 768px以上: 2列、カードの高さを無理に固定しない
- 1024 / 1280 / 1440px: chartとの間隔、PageShell内の幅を確認 (shell 上限 1280px)
- 1280px (xl) 前後: 左レール `ThemeSideNav` の出現と、狭幅代替セレクタの入れ替わりを確認
- ダークモードで文字・border・リンクのコントラストを確認

## Claude Code実装指示

### PR-0: real-income 派生指標監査

1. `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-real-income.md` の P0 を先に解消
2. `real-disposable-income` の計算結果、R2 snapshot、SEO値が同じ式・単位か照合
3. `disposable-income-after-rent` の月額/年額、世帯区分、地域粒度、調査年を照合
4. 整合しない指標は公開対象から外すか、同一条件の入力へ差し替える
5. 監査結果と採否を正式レビューへ追記してからPR-1へ進む

### PR-1: 共通基盤 + 10テーマ

1. 本文書と `.claude/rules/theme-catalog-standards.md`を全文確認
2. `ThemeGuidance*` 型と `ThemeCatalog.guidance?`を追加
3. `ThemeGuidanceCards.tsx`をServer Componentとして追加
4. `ThemePageLayout.tsx`の `ThemeAreaHeader` 直後に配置
5. 本文書の文面を10catalogへ追加。ただし各テーマは正式レビューのPR-0承認後のみ
   - `population-dynamics.ts`
   - `aging-society.ts`
   - `healthcare.ts`
   - `living-housing.ts`
   - `real-income.ts`（PR-0承認後）
   - `consumer-prices.ts`（内容・データ意味監査後）
   - `labor-wages.ts`（定義・系列監査後）
   - `labor-mobility.ts`（定義・地域粒度監査後）
   - `occupation-salary.ts`（年収式・職種分類・重複監査後）
   - `local-economy.ts`（コア指標・基準系列監査後）
6. validatorとテストを追加
7. ローカルで10テーマ×5幅を確認

### PR-2: 全テーマ展開

10テーマの文面・情報量・表示位置を確認後、1テーマずつ公式根拠付きguidanceを追加する。機械的に似た文章を複製しない。

### 禁止

- page-components JSONに定義カードを重複登録しない
- area系 `DefinitionsCard` のdefinition registryにテーマ文靠を追加しない
- featureごとに別の定義カードを作らない
- 重要な注意事項をAccordionやtooltipのみに隠さない
- 高さを固定して文靠を切らない
- `any` や無検証の `Record<string, unknown>` にしない
- 本作業でR2 push / deployを行わない

## 検証コマンド

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
npm run design-system:check --workspace apps/web
```

## 完了条件

- テーマ別PR-0が承認済みの10テーマで、ヘッダー直後に2枚のカードが表示される
- guidanceのないテーマの表示は変わらない
- 各テーマの正式レビューで指摘した主要な誤読リスクがcard文靠に反映される
- definitions/caveats/sourceがsemantic HTMLで読める
- モバイルで横溢れせず、ダークモードで読める
- catalog validator、type-check、test、design-system checkが成功
- 生成物の手編集、R2 push、deployが行われていない

## 関連レビュー

- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-population-dynamics.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-aging-society.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-healthcare.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-living-housing.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-real-income.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-consumer-prices.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-labor-wages.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-labor-mobility.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-occupation-salary.md`
- `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-local-economy.md`
