import type {
  OpenDatasetDefinition,
  AccessMethod,
  DataFormat,
  GeographicLevel,
  GeometryType,
  DatasetCoverage,
  UpdateFrequency,
  VerificationStatus,
} from "../types";

/**
 * 国土交通データプラットフォーム (MLIT DPF) の提供カタログ 36 件の全量棚卸し。
 * 調査: open-data-curator 2026-07-18 (ローカル既存カタログ + 公式サイト突合)。
 *
 * - 取得は GraphQL API (データカタログ横断)。カタログ個別のランディング URL は無く、
 *   プラットフォーム内カタログのため landingPageUrl はトップページを共有する。
 * - ライセンスはカタログ/データセット別に個別で、一括の商用可否は未確認
 *   (commercialUse=unknown) → 全カタログを採用候補にしない (research-only / not-suitable)。
 *   採用したいカタログが出たら個別にライセンスを確認して昇格する。
 * - nlni_ksj (KSJ ミラー)・dpf_area_data (N03)・dpf_statistical_data (e-Stat 国勢調査) の
 *   3 カタログは既存 SSOT と重複するため not-suitable (buzz-map カタログと同じ除外判断)。
 * - 県限定 (静岡/熊本/東京/福島/広島)・工事納品物・点群系は 47 県比較不能 = not-suitable。
 */

const DPF_TOP = "https://www.mlit-data.jp/";
const DPF_TERMS =
  "https://data-platform.mlit.go.jp/assets/policy/国土交通データプラットフォーム利用規約.pdf";
const VERIFIED_AT = "2026-07-18";

function dpfCatalog(input: {
  catalogId: string;
  name: string;
  description: string;
  access?: AccessMethod;
  formats: readonly DataFormat[];
  geographicLevels: readonly GeographicLevel[];
  geometry?: readonly GeometryType[];
  coverage: DatasetCoverage;
  updateFrequency: UpdateFrequency;
  notSuitable?: boolean;
  status?: VerificationStatus;
  existingGisDataIds?: readonly string[];
  suggestedCategories?: readonly string[];
  notes?: string;
}): OpenDatasetDefinition {
  return {
    id: `mlit-dpf-${input.catalogId.replace(/_/g, "-")}`,
    sourceId: "mlit-dpf",
    name: `MLIT DPF ${input.name}`,
    description: input.description,
    landingPageUrl: DPF_TOP,
    accessMethods: [input.access ?? "api"],
    formats: input.formats,
    geographicLevels: input.geographicLevels,
    hasGeometry: input.geometry !== undefined,
    ...(input.geometry ? { geometryTypes: input.geometry } : {}),
    coverage: input.coverage,
    updateFrequency: input.updateFrequency,
    license: {
      name: "unknown (カタログ/データセット別・DPF 利用規約参照)",
      commercialUse: "unknown",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: DPF_TERMS,
    },
    stats47Uses: [input.notSuitable ? "not-suitable" : "research-only"],
    suggestedCategories: input.suggestedCategories ?? [],
    existingMetricKeys: [],
    existingGisDataIds: input.existingGisDataIds ?? [],
    candidateMetricConcepts: [],
    verification: {
      status: input.status ?? "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [DPF_TOP],
      ...(input.notes ? { notes: input.notes } : {}),
    },
  };
}

export const MLIT_DPF_DATASETS: readonly OpenDatasetDefinition[] = [
  // ── 既存 SSOT と重複 (除外対象) ──
  dpfCatalog({ catalogId: "nlni_ksj", name: "国土数値情報", description: "KSJ 本家と同一データのミラー (63 DS)。", formats: ["geojson", "shapefile", "other"], geographicLevels: ["prefecture", "municipality", "polygon", "point"], geometry: ["polygon", "point", "line"], coverage: "all-japan", updateFrequency: "irregular", notSuitable: true, notes: "重複除外対象: KSJ (packages/gis mlit-ksj) が SSOT" }),
  dpfCatalog({ catalogId: "dpf_statistical_data", name: "統計データ (人口・世帯)", description: "令和2年国勢調査の人口・世帯 (メッシュ/市区町村)。", formats: ["csv", "other"], geographicLevels: ["mesh", "municipality"], coverage: "all-japan", updateFrequency: "static", notSuitable: true, notes: "重複除外対象: e-Stat が SSOT" }),
  dpfCatalog({ catalogId: "dpf_area_data", name: "行政区域データ", description: "行政区域ポリゴン。", formats: ["geojson", "shapefile"], geographicLevels: ["municipality", "polygon"], geometry: ["polygon"], coverage: "all-japan", updateFrequency: "static", notSuitable: true, existingGisDataIds: ["N03"], notes: "重複除外対象: KSJ N03 が SSOT" }),
  // ── 全国系 (research-only: ライセンス個別確認まで採用候補にしない) ──
  dpfCatalog({ catalogId: "ipf", name: "社会資本情報", description: "空港/公園/ダム/砂防/官庁施設等の点データ (10 DS)。", formats: ["geojson", "other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "unknown", suggestedCategories: ["infrastructure"] }),
  dpfCatalog({ catalogId: "msil", name: "海しる (海洋状況表示)", description: "港湾/漁港/灯台等の海洋関連点データ (5 DS・海上保安庁)。", formats: ["geojson", "other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "unknown", suggestedCategories: ["infrastructure"] }),
  dpfCatalog({ catalogId: "dhb", name: "ダム便覧", description: "全国のダム諸元 (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "annual", suggestedCategories: ["infrastructure"], existingGisDataIds: ["W01"], notes: "ダム点データは KSJ W01 と重複領域あり" }),
  dpfCatalog({ catalogId: "hwq", name: "水文水質データベース", description: "雨量観測所・水位流量観測所 (2 DS)。", formats: ["csv", "other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "unknown", suggestedCategories: ["landweather"] }),
  dpfCatalog({ catalogId: "ffd", name: "訪日外国人流動データ", description: "空港間流動 2014-2019 年・交通手段別 (8 DS)。", formats: ["csv", "other"], geographicLevels: ["prefecture", "point"], coverage: "all-japan", updateFrequency: "static", status: "verified", suggestedCategories: ["tourism", "international"], notes: "OD 流動。buzz-map カバレッジ表の「OD/流動矢印 未実装」素材" }),
  dpfCatalog({ catalogId: "qol", name: "都市 QOL データ", description: "都市圏・都道府県の QOL 指標 (2 DS)。", formats: ["other"], geographicLevels: ["prefecture", "polygon"], geometry: ["polygon"], coverage: "all-japan", updateFrequency: "unknown", suggestedCategories: ["economy"], notes: "県別指標だが指標定義・ライセンス未確認" }),
  dpfCatalog({ catalogId: "gtfs", name: "GTFS データリポジトリ", description: "バス時刻表/運賃/経路 (1 DS)。事業者ごとに公開状況が異なる。", formats: ["other"], geographicLevels: ["point", "line"], geometry: ["point", "line"], coverage: "partial", updateFrequency: "unknown", status: "verified", suggestedCategories: ["infrastructure"] }),
  dpfCatalog({ catalogId: "rdpf", name: "道路データ PF (県間 OD 交通量)", description: "都道府県間 OD 交通量 (2 DS)。", formats: ["other"], geographicLevels: ["prefecture"], coverage: "all-japan", updateFrequency: "unknown", suggestedCategories: ["infrastructure"], notes: "OD 流動素材" }),
  dpfCatalog({ catalogId: "rsdb", name: "全国道路施設点検データベース", description: "橋梁/トンネル/シェッド/大型カルバート等の施設・点検結果 (7 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "irregular", status: "verified", suggestedCategories: ["infrastructure"], notes: "老朽化インフラの県別集計候補 (ライセンス確認後)" }),
  dpfCatalog({ catalogId: "mlit_plateau", name: "3D 都市モデル (PLATEAU)", description: "年度別 3D 都市モデル (6 DS)。対象都市限定。", formats: ["citygml", "other"], geographicLevels: ["municipality", "polygon"], geometry: ["polygon", "3d"], coverage: "partial", updateFrequency: "annual", status: "verified", notes: "対象都市限定 = 47 県比較不可。別途 PLATEAU 規約 (source mlit-plateau 参照)" }),
  dpfCatalog({ catalogId: "rtc", name: "道路交通センサス", description: "令和3年度・平成27年度の交通量調査 (2 DS)。", formats: ["csv", "other"], geographicLevels: ["point", "line"], geometry: ["point", "line"], coverage: "all-japan", updateFrequency: "irregular", suggestedCategories: ["infrastructure"] }),
  dpfCatalog({ catalogId: "ngi", name: "国土地盤情報データベース", description: "ボーリング柱状図等 (1 DS・Kunijiban 由来 + 自治体地盤情報、未検定含む)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "partial", updateFrequency: "irregular", status: "verified" }),
  dpfCatalog({ catalogId: "ndm", name: "自然災害伝承碑", description: "過去の災害記録の伝承碑 (1 DS)。", formats: ["geojson", "other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "irregular", suggestedCategories: ["safetyenvironment"] }),
  dpfCatalog({ catalogId: "sip4d", name: "SIP4D (基盤的防災情報)", description: "MP-PAWR 降雨レーダー等 (4 DS)。ダウンロード不可・タイル表示専用。", access: "tile-service", formats: ["vector-tile", "other"], geographicLevels: ["mesh"], geometry: ["mesh"], coverage: "all-japan", updateFrequency: "realtime", status: "verified", notSuitable: true, notes: "DL 不可のため分析用途に使えない" }),
  dpfCatalog({ catalogId: "dimaps", name: "DiMAPS (災害情報)", description: "一般被害/河川施設/空港施設/高速道路・鉄道運行状況 (4 DS)。", formats: ["geojson", "other"], geographicLevels: ["point", "polygon"], geometry: ["point", "polygon"], coverage: "all-japan", updateFrequency: "realtime", status: "verified", suggestedCategories: ["safetyenvironment"] }),
  dpfCatalog({ catalogId: "lpfs", name: "全国幹線旅客純流動調査", description: "県間の幹線旅客流動 (12 DS)。", formats: ["csv", "other"], geographicLevels: ["prefecture"], coverage: "all-japan", updateFrequency: "irregular", suggestedCategories: ["infrastructure", "tourism"], notes: "OD 流動素材" }),
  dpfCatalog({ catalogId: "crtc", name: "工事実績情報 (コリンズ)", description: "工事実績情報 (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "all-japan", updateFrequency: "unknown", notSuitable: true }),
  // ── 県限定・工事納品物・点群系 (47 県比較不能 = not-suitable) ──
  dpfCatalog({ catalogId: "alpc", name: "静岡県航空レーザ点群", description: "静岡県限定の航空レーザ測量点群 (2 DS)。", formats: ["other"], geographicLevels: ["mesh", "point"], geometry: ["point", "mesh"], coverage: "prefecture-specific", updateFrequency: "static", status: "verified", notSuitable: true }),
  dpfCatalog({ catalogId: "ntrack", name: "航空機騒音監視測定", description: "空港周辺の騒音監視測定 (9 DS)。", formats: ["csv", "other"], geographicLevels: ["point"], geometry: ["point"], coverage: "partial", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "psc", name: "災害緊急撮影 (斜め写真)", description: "災害時撮影の斜め写真 (2 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "partial", updateFrequency: "irregular", notSuitable: true }),
  dpfCatalog({ catalogId: "cyport", name: "サイバーポート (港湾インフラ)", description: "係留施設 (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "partial", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "karte", name: "事業評価カルテシステム", description: "事業評価カルテ (2 DS・詳細不明)。", formats: ["other"], geographicLevels: ["national"], coverage: "partial", updateFrequency: "unknown", status: "unverified", notSuitable: true }),
  dpfCatalog({ catalogId: "mcc", name: "地方公共団体の工事データ (MCC)", description: "地方公共団体発注業務納品物・IFC 3D データ含む (1 DS)。", formats: ["other"], geographicLevels: ["municipality", "point"], geometry: ["point", "3d"], coverage: "partial", updateFrequency: "irregular", status: "verified", notSuitable: true }),
  dpfCatalog({ catalogId: "nvpf", name: "歩行空間ナビゲーション", description: "歩行空間ネットワーク (1 DS)。", formats: ["other"], geographicLevels: ["line", "point"], geometry: ["line", "point"], coverage: "partial", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "mms", name: "MMS 三次元点群データ", description: "モービルマッピングシステム点群 (1 DS)。", formats: ["other"], geographicLevels: ["line", "point"], geometry: ["point", "3d"], coverage: "partial", updateFrequency: "static", notSuitable: true }),
  dpfCatalog({ catalogId: "imm", name: "インフラみらいマップ", description: "インフラ事業情報 (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point"], coverage: "partial", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "jyubunpc", name: "重要文化財点群データ", description: "重要文化財の点群 (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point", "3d"], coverage: "partial", updateFrequency: "static", notSuitable: true }),
  dpfCatalog({ catalogId: "kkd", name: "熊本県施設管理データベース", description: "熊本県限定の施設管理 (7 DS)。", formats: ["other"], geographicLevels: ["municipality", "point"], geometry: ["point"], coverage: "prefecture-specific", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "nxc", name: "高速道路会社の工事図面データ", description: "高速道路工事図面 (1 DS)。", formats: ["other"], geographicLevels: ["line", "point"], geometry: ["line", "point"], coverage: "partial", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "tcd", name: "東京都 ICT 活用工事データ", description: "3 次元起工測量/施工管理データ (1 DS)。", formats: ["other"], geographicLevels: ["point"], geometry: ["point", "3d"], coverage: "prefecture-specific", updateFrequency: "unknown", status: "verified", notSuitable: true }),
  dpfCatalog({ catalogId: "cals_fukushima", name: "福島県電子納品保管管理システム", description: "福島県限定の電子納品 (2 DS)。", formats: ["other"], geographicLevels: ["municipality", "point"], geometry: ["point"], coverage: "prefecture-specific", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "dobox", name: "広島県インフラマネジメント基盤", description: "広島県限定のインフラ情報 (1 DS)。", formats: ["other"], geographicLevels: ["municipality", "point"], geometry: ["point"], coverage: "prefecture-specific", updateFrequency: "unknown", notSuitable: true }),
  dpfCatalog({ catalogId: "sample", name: "サンプルデータ", description: "要素技術情報の実装例 (1 DS)。実運用データではない。", formats: ["other"], geographicLevels: ["national"], coverage: "partial", updateFrequency: "static", status: "verified", notSuitable: true }),
];
