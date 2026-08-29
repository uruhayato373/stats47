import type { OpenDataSource } from "./types";
import { MHLW_MEDICAL_DATASETS } from "./datasets/mhlw";
import { MLIT_REINFOLIB_DATASETS } from "./datasets/mlit-reinfolib";
import { MLIT_DPF_DATASETS } from "./datasets/mlit-dpf";
import { GSI_HAZARD_DATASETS } from "./datasets/gsi-hazard";
import { DIGITAL_AGENCY_ODS_DATASETS } from "./datasets/digital-agency-ods";
import { MAFF_REGIONAL_DATASETS } from "./datasets/maff";
import { JFLEC_DATASETS } from "./datasets/jflec";
import { NIER_DATASETS } from "./datasets/nier";
import { FDMA_HEATSTROKE_DATASETS } from "./datasets/fdma";

/**
 * source カタログ (初期 13 source)。
 * 登録・編集は open-data-curator が公式一次情報を確認して行う。
 * lastVerifiedAt は実際に公式ページを開いて確認した日だけ更新する。
 * datasetIds は dataset 定義から機械導出し双方向不一致を構造的に防ぐ (validator も検証)。
 */

const ids = (datasets: readonly { id: string }[]): readonly string[] => datasets.map((d) => d.id);

export const OPEN_DATA_SOURCES: readonly OpenDataSource[] = [
  {
    id: "fdma-heatstroke",
    name: "熱中症による救急搬送人員",
    publisher: "総務省消防庁",
    kind: "government-portal",
    homepageUrl: "https://www.fdma.go.jp/disaster/heatstroke/",
    catalogUrl: "https://www.fdma.go.jp/disaster/heatstroke/post4.html",
    termsUrl: "https://www.fdma.go.jp/about/others/post3.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-08-28",
    datasetIds: ids(FDMA_HEATSTROKE_DATASETS),
    notes:
      "2008年以降の年次資料を公開。2025年確定値は5月1日-9月30日、47都道府県別。人口10万人当たり指標は2024年total-populationを分母に派生する。",
  },
  {
    id: "mhlw-medical-info",
    name: "医療情報ネット オープンデータ",
    publisher: "厚生労働省",
    kind: "government-portal",
    homepageUrl:
      "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html",
    termsUrl: "https://www.digital.go.jp/resources/open_data/public_data_license_v1.0",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(MHLW_MEDICAL_DATASETS),
    notes:
      "全国の病院・診療所・歯科・助産所・薬局 CSV (緯度経度付き)。約 6 ヶ月おきスナップショットで過去分も残置。PDL 1.0",
  },
  {
    id: "mlit-reinfolib",
    name: "不動産情報ライブラリ",
    publisher: "国土交通省",
    kind: "government-api",
    homepageUrl: "https://www.reinfolib.mlit.go.jp/",
    apiDocsUrl: "https://www.reinfolib.mlit.go.jp/help/apiManual/",
    termsUrl: "https://www.reinfolib.mlit.go.jp/help/termsOfUse/",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(MLIT_REINFOLIB_DATASETS),
    notes:
      "API キー申請制 (Ocp-Apim-Subscription-Key)。標準 PDL 1.0 だが国土数値情報・ハザードマップ由来コンテンツは別ルール適用の記載あり。XKT002-011/015/017-030・XGT001・XST001 の 21 API は未個別確認のため未登録",
  },
  {
    id: "mlit-dpf",
    name: "国土交通データプラットフォーム",
    publisher: "国土交通省",
    kind: "government-api",
    homepageUrl: "https://www.mlit-data.jp/",
    catalogUrl: "https://www.mlit-data.jp/platform/",
    apiDocsUrl: "https://www.mlit-data.jp/api_docs/",
    termsUrl:
      "https://www.mlit-data.jp/assets/policy/国土交通データプラットフォームAPI機能利用規約.pdf",
    isOfficial: true,
    status: "partially-verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(MLIT_DPF_DATASETS),
    notes:
      "GraphQL API でカタログ横断取得。全 36 カタログを棚卸し登録済。nlni_ksj/dpf_area_data/dpf_statistical_data は KSJ/N03/e-Stat と重複するため not-suitable。ライセンスはカタログ別で一括未確認 → 採用時に個別確認。直接 fetch は bot-block 403・ドメイン移行中 (data-platform.mlit.go.jp → mlit-data.jp) の案内あり",
  },
  {
    id: "gsi-hazard",
    name: "ハザードマップポータルサイト",
    publisher: "国土地理院",
    kind: "gis-portal",
    homepageUrl: "https://disaportal.gsi.go.jp/",
    catalogUrl: "https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html",
    termsUrl: "https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(GSI_HAZARD_DATASETS),
    notes:
      "重ねるハザードマップはラスタータイル (PNG) のみでベクタ非提供。GIS 加工は KSJ (A31b/A33/A32/A40) が SSOT",
  },
  {
    id: "digital-agency-municipal-ods",
    name: "自治体標準オープンデータセット",
    publisher: "デジタル庁",
    kind: "municipal-portal",
    homepageUrl: "https://www.digital.go.jp/resources/open_data/municipal-standard-data-set-test",
    catalogUrl: "https://www.digital.go.jp/resources/open_data/municipal-standard-data-set-test",
    termsUrl: "https://www.digital.go.jp/resources/open_data/municipal-standard-data-set-test",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(DIGITAL_AGENCY_ODS_DATASETS),
    notes:
      "各自治体が個別公開する分散データで全国集約カタログは無い (e-Gov データポータルも自治体 ODS 集約とは明記されず)。定義書 E-H (外部基準参照) は個別仕様 URL 未取得のため未登録",
  },
  {
    id: "maff-regional-db",
    name: "地域の農業を見て・知って・活かすDB",
    publisher: "農林水産省 (統計部経営・構造統計課センサス統計室)",
    kind: "government-portal",
    homepageUrl: "https://www.maff.go.jp/j/tokei/census/shuraku_data/",
    catalogUrl: "https://www.maff.go.jp/j/tokei/census/shuraku_data/",
    termsUrl: "https://www.maff.go.jp/j/use/link.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: ids(MAFF_REGIONAL_DATASETS),
    notes:
      "農業集落カード (地域指標 xlsx)・筆ポリゴン (FlatGeobuf)・集落境界 WebGIS。データ一覧定義 = format.xlsx (48 シート)。出典表示で商用利用可 (政府標準利用規約)",
  },
  {
    id: "egov-data-portal",
    name: "e-Gov データポータル",
    publisher: "デジタル庁",
    kind: "government-portal",
    homepageUrl: "https://data.e-gov.go.jp/",
    catalogUrl: "https://data.e-gov.go.jp/data/dataset/?organization=default",
    termsUrl: "https://data.e-gov.go.jp/info/ja/terms",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes: "政府横断のデータセット探索入口。個別 dataset は発行府省側 source で登録する (二重登録しない)",
  },
  {
    id: "mlit-ksj",
    name: "国土数値情報ダウンロードサービス",
    publisher: "国土交通省",
    kind: "gis-portal",
    homepageUrl: "https://nlftp.mlit.go.jp/ksj/",
    catalogUrl: "https://nlftp.mlit.go.jp/ksj/gml/gml_datalist.html",
    termsUrl: "https://nlftp.mlit.go.jp/ksj/other/agreement.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes:
      "dataset は本カタログに複製しない: 稼働メタ SSOT = packages/gis/src/mlit-ksj/datasets.ts (登録 41)、候補 superset = packages/database/seed/ksj-catalog.json (126)。利用許諾はデータ別 (CC-BY-4.0 / 非商用 混在)",
  },
  {
    id: "mlit-plateau",
    name: "PLATEAU (3D 都市モデル)",
    publisher: "国土交通省",
    kind: "gis-portal",
    homepageUrl: "https://www.mlit.go.jp/plateau/",
    catalogUrl: "https://www.mlit.go.jp/plateau/open-data/",
    termsUrl: "https://www.mlit.go.jp/plateau/site-policy/",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes:
      "対象都市限定 (全国比較不可)。配布は G空間情報センター (front.geospatial.jp) と国交 DPF 経由 (mlit-dpf-mlit-plateau カタログ参照)。CityGML",
  },
  {
    id: "gsi-fgd",
    name: "基盤地図情報",
    publisher: "国土地理院",
    kind: "gis-portal",
    homepageUrl: "https://www.gsi.go.jp/kiban/",
    catalogUrl: "https://service.gsi.go.jp/kiban/",
    termsUrl: "https://www.gsi.go.jp/GSI/chosaku.htm",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes: "境界・標高・基盤地物。測量成果の利用は別途申請手続きページあり (利用時に個別確認)",
  },
  {
    id: "mhlw-ndb-open",
    name: "NDB オープンデータ",
    publisher: "厚生労働省",
    kind: "government-portal",
    homepageUrl: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00011.html",
    catalogUrl: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00011.html",
    termsUrl: "https://www.mhlw.go.jp/chosakuken/index.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes:
      "第 7 回 NDB オープンデータまで公開・医療行為/健診の都道府県別集計 xlsx あり (ranking 候補の宝庫。dataset 深掘りは次の反復)",
  },
  {
    id: "env-biodiversity-gis",
    name: "自然環境調査 Web-GIS",
    publisher: "環境省 生物多様性センター",
    kind: "gis-portal",
    homepageUrl: "https://www.biodic.go.jp/",
    termsUrl: "https://www.biodic.go.jp/copyright/terms_of_service.html",
    isOfficial: true,
    status: "verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes: "植生・湿地・生物多様性。「いきもの地図」「JIBIS」等の複数 GIS サブサービスあり",
  },
  {
    id: "resas",
    name: "RESAS 地域経済分析システム",
    publisher: "経済産業省 / 内閣官房",
    kind: "dashboard",
    homepageUrl: "https://www.resas.go.jp/",
    apiDocsUrl: "https://opendata.resas-portal.go.jp/docs/api/v1/index.html",
    termsUrl: "https://www.resas.go.jp/",
    isOfficial: true,
    status: "partially-verified",
    lastVerifiedAt: "2026-07-18",
    datasetIds: [],
    notes:
      "UI は継続 (2025 年に新システム提供。METI 2025-01 / 2025-10 プレス)。旧 API は 2025-03-24 終了 — apiDocsUrl は旧 API ドキュメントの参照用で新規利用不可。直接 fetch は bot-block 403 のため利用規約ページ未確認 (termsUrl は暫定でトップ)。需要探索 (何が見られているか) の research-only",
  },
  {
    id: "jflec-financial-literacy",
    name: "金融経済教育推進機構 (J-FLEC) 調査・統計データ",
    publisher: "金融経済教育推進機構 (旧・金融広報中央委員会「知るぽると」、2024年事業承継)",
    kind: "government-portal",
    homepageUrl: "https://www.j-flec.go.jp/data/",
    catalogUrl: "https://www.j-flec.go.jp/data/literacy_chosa_2025/",
    termsUrl: "https://www.j-flec.go.jp/guidelines/",
    isOfficial: true,
    status: "partially-verified",
    lastVerifiedAt: "2026-07-19",
    datasetIds: ids(JFLEC_DATASETS),
    notes:
      "金融リテラシー調査 (2016/2019/2022/2025・3年周期)。ウェブサイト運営方針で商用引用・使用は" +
      "「調査データは除く」と明記 (=調査データは商用利用可、出所明示必須)。e-Stat 未掲載。" +
      "xlsx を直接解析し47都道府県別シート・比較表の実在を確認済み (jflec.ts 参照)",
  },
  {
    id: "nier-gakuryoku-chousa",
    name: "全国学力・学習状況調査",
    publisher: "文部科学省 / 国立教育政策研究所 (NIER)",
    kind: "government-portal",
    homepageUrl: "https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html",
    catalogUrl: "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
    termsUrl: "https://www.mext.go.jp/b_menu/1351168.htm",
    isOfficial: true,
    status: "partially-verified",
    lastVerifiedAt: "2026-07-20",
    datasetIds: ids(NIER_DATASETS),
    notes:
      "教科正答率 (国語/算数・数学) + 児童生徒質問紙 (朝食・読書・宿題・地域行事参加・ネット利用・通塾・" +
      "学校外学習・通学時間等の生活習慣) を47都道府県・指定都市別に xlsx 分散配布 (県コード+ローマ字の" +
      "URL パターン)。2007年度〜毎年実施 (令和2年度=2020年は新型コロナで中止・欠測)。都道府県別全量は" +
      "令和7年度(2025)が最新 (令和8年度=2026は全国平均のみ2026-07-16公表、県別factsheet未公開)。" +
      "NIER著作権ページがMEXTウェブサイト利用規約(政府標準利用規約2.0・CC BY 4.0互換)に従う旨明記→" +
      "商用利用可・出典表示必須・加工時表示必須。e-Stat 未掲載",
  },
];

export function getOpenDataSource(id: string): OpenDataSource | undefined {
  return OPEN_DATA_SOURCES.find((s) => s.id === id);
}
