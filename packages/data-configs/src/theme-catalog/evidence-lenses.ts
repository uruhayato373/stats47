/**
 * 白書・報告書を Theme の指標と周遊導線へ接続する論点レンズの SSOT。
 *
 * EvidenceLens は公開 URL を持つ第4分類軸ではない。Theme 内で「何を問うか」を
 * 揃える従属メタデータで、採択済みの問いだけを ThemeCatalog.evidenceTopics から参照する。
 */

export interface EvidenceLensDefinition {
  label: string;
  description: string;
}

export const EVIDENCE_LENS_CATALOG = {
  "regional-access": {
    label: "地域アクセス",
    description: "距離、人口、面積などを踏まえ、サービスへ到達しやすいかを読む。",
  },
  "service-capacity": {
    label: "供給・受け皿",
    description: "施設、人員、設備など、地域が提供できる量と余力を読む。",
  },
  participation: {
    label: "参加・利用",
    description: "制度や施設が、実際にどの程度利用されているかを読む。",
  },
  outcomes: {
    label: "成果",
    description: "投入量ではなく、暮らしや学びに現れた結果を読む。",
  },
  mobility: {
    label: "移動・流動",
    description: "人や活動が地域をまたいで動く方向と規模を読む。",
  },
  composition: {
    label: "構成",
    description: "総量の内訳や属性構成を読み、単純な件数比較を補う。",
  },
  equity: {
    label: "格差・公平性",
    description: "地域や属性による機会・負担・成果の差を読む。",
  },
  sustainability: {
    label: "持続可能性",
    description: "人口・財政・環境の変化に対して、現在の仕組みを維持できるかを読む。",
  },
} as const satisfies Record<string, EvidenceLensDefinition>;

export type EvidenceLensKey = keyof typeof EVIDENCE_LENS_CATALOG;

export interface EvidenceSourceDefinition {
  kind: "whitepaper" | "report" | "statistical-overview";
  title: string;
  publisher: string;
  sourceUrl: string;
  /** NotebookLM 側の名前。ID は確認できた場合だけ設定する。 */
  notebookName?: string;
  notebookId?: string;
  /** whitepaper-chart-inventory で使う slug。未棚卸しなら省略する。 */
  inventorySlug?: string;
}

export const EVIDENCE_SOURCE_CATALOG = {
  "mext-whitepaper-2024": {
    kind: "whitepaper",
    title: "令和6年度 文部科学白書",
    publisher: "文部科学省",
    sourceUrl: "https://www.mext.go.jp/b_menu/hakusho/html/hpab202001/mext_00001.html",
    notebookName: "文部科学白書",
    inventorySlug: "education",
  },
  "mext-statistical-overview-2024": {
    kind: "statistical-overview",
    title: "文部科学統計要覧（令和6年版）",
    publisher: "文部科学省",
    sourceUrl: "https://www.mext.go.jp/b_menu/toukei/002/002b/1417059_00009.htm",
  },
  "mext-school-basic-survey-2024": {
    kind: "statistical-overview",
    title: "学校基本調査－令和6年度 結果の概要",
    publisher: "文部科学省",
    sourceUrl:
      "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
  },
  "mlit-whitepaper-2025-road-network": {
    kind: "whitepaper",
    title: "令和7年版 国土交通白書－幹線道路ネットワークの整備",
    publisher: "国土交通省",
    sourceUrl:
      "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2511000.html",
  },
  "mlit-whitepaper-2025-infrastructure-maintenance": {
    kind: "whitepaper",
    title: "令和7年版 国土交通白書－社会資本の老朽化対策等",
    publisher: "国土交通省",
    sourceUrl:
      "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2140000.html",
  },
  "mlit-whitepaper-2025-railway-industry": {
    kind: "whitepaper",
    title: "令和7年版 国土交通白書－鉄道関連産業の動向と施策",
    publisher: "国土交通省",
    sourceUrl:
      "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2531000.html",
  },
  "mlit-whitepaper-2025-low-carbon-transport": {
    kind: "whitepaper",
    title: "令和7年版 国土交通白書－地球温暖化対策（緩和策）の推進",
    publisher: "国土交通省",
    sourceUrl:
      "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2712000.html",
  },
  "jta-accommodation-survey": {
    kind: "statistical-overview",
    title: "宿泊旅行統計調査",
    publisher: "観光庁",
    sourceUrl:
      "https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html",
  },
  "npa-crime-statistics": {
    kind: "statistical-overview",
    title: "犯罪統計",
    publisher: "警察庁",
    sourceUrl:
      "https://www.npa.go.jp/publications/statistics/sousa/statistics.html",
  },
  "npa-traffic-accident-statistics": {
    kind: "statistical-overview",
    title: "交通事故発生状況",
    publisher: "警察庁",
    sourceUrl:
      "https://www.npa.go.jp/publications/statistics/koutsuu/index_jiko.html",
  },
  "mhlw-physician-workforce-plan": {
    kind: "report",
    title: "医師確保対策・医師確保計画",
    publisher: "厚生労働省",
    sourceUrl:
      "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/kinkyu/index.html",
  },
  "mhlw-regional-healthcare-vision": {
    kind: "report",
    title: "地域医療構想",
    publisher: "厚生労働省",
    sourceUrl:
      "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000080850.html",
  },
  "mhlw-hospital-function-report-2025": {
    kind: "statistical-overview",
    title: "令和7年度 病床機能報告公表データ",
    publisher: "厚生労働省",
    sourceUrl:
      "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/open_data_00020.html",
  },
  "mlit-port-statistics": {
    kind: "statistical-overview",
    title: "港湾関係統計データ",
    publisher: "国土交通省",
    sourceUrl: "https://www.mlit.go.jp/statistics/details/port_list.html",
  },
  "cao-aging-whitepaper-2025-housing": {
    kind: "whitepaper",
    title: "令和7年版 高齢社会白書－高齢期の生活環境",
    publisher: "内閣府",
    sourceUrl:
      "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html",
    notebookName: "最新の白書",
    notebookId: "2bf7f0dd-3935-49be-8cef-2d428c59eaa9",
  },
  "stat-housing-land-survey-2023": {
    kind: "statistical-overview",
    title: "令和5年住宅・土地統計調査－調査の結果",
    publisher: "総務省統計局",
    sourceUrl: "https://www.stat.go.jp/data/jyutaku/2023/tyousake.html",
  },
} as const satisfies Record<string, EvidenceSourceDefinition>;

export type EvidenceSourceKey = keyof typeof EVIDENCE_SOURCE_CATALOG;
