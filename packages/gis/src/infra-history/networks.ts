import { ksjClassification } from "../mlit-ksj/classifications";
import { GIS_DATASETS_BY_ID, resolveKsjUsageTerms, type KsjDataId } from "../mlit-ksj/datasets";
import { INFRA_PUBLICATION_REQUIRED_SCOPES } from "./types";
import type { InfraNetworkDefinition, InfraNetworkKey, InfraSourceTerms } from "./types";

/** 非商用データの公開を止める理由 (高速道路・鉄道で共通) */
/**
 * 2026-10-29 にオーナーが国土数値情報の事務局へ電話で確認した内容 (高速道路 N06・鉄道 N05 の両方)。
 * 地図の表示 (加工した線データをブラウザへ配ることを含む) と SNS を了承。広告のあるページでの利用は了承の範囲に無い
 */
const PHONE_PERMISSION_2026_10_29 = {
  method: "phone",
  date: "2026-10-29",
  counterpart: "国土数値情報 事務局",
  scope: ["ad-free-page", "processed-data-delivery", "sns"],
  summary:
    "広告・アフィリエイトのないページでの時系列の地図表示 (加工した線データをブラウザへ配ることを含む) と、同じデータから作った画像・動画の SNS 投稿を了承 (オーナーが電話で確認)",
  recordedBy: "owner (Claude が聞き取って記録)",
} as const;


/**
 * 交通網の変遷ページの台帳 (git TS が SSOT)。
 *
 * 原典の版・SHA・公開状態をここに置く。生成スクリプトは原典 ZIP の SHA が
 * ここと一致しなければ止まり、R2 publisher は `publication.status` が `public-approved` で
 * なければ `app/geo/history/<key>/` を拒否する (`ksj-publication-guard.ts`)。
 *
 * 利用条件と公式ページの URL はここに書かず、GIS 台帳 (`mlit-ksj/datasets.ts`) の `usageTerms` と
 * `sourcePageUrl` から引く (`infraNetworkTerms` / `infraNetworkPageUrl`)。広告の有無もその利用条件から決める
 * (`isInfraNetworkAdFree`)。高速道路・鉄道は時系列として描くと非商用なので広告を出さず、公開は事務局の書面回答を待つ
 * (`.claude/rules/geo-analysis-standards.md`「商用公開Gate」)。空港は商用可。
 */
export const INFRA_NETWORKS: readonly InfraNetworkDefinition[] = [
  {
    key: "expressway",
    label: "高速道路",
    question: "高速道路網はどの順番で広がったか",
    description:
      "1962年の首都高速道路の最初の区間から2024年まで、国土数値情報の高速道路時系列データで区間ごとの開通年を年単位で地図に描きます。",
    source: {
      dataId: "N06",
      version: "24",
      name: "国土数値情報 高速道路時系列データ",
      provider: "国土交通省",
      archiveUrl: "https://nlftp.mlit.go.jp/ksj/gml/data/N06/N06-24/N06-24_GML.zip",
      archiveSha256: "d93847fd40fad45bf108448d43e1598f1148815fa8d696ec6085976860160969",
      archiveBytes: 7751741,
      entry: "UTF-8/N06-24_HighwaySection.geojson",
      retrievedAt: "2026-10-29T00:18:00.000Z",
    },
    usage: "time-series",
    geometry: "line",
    measure: { label: "延長", unit: "km" },
    publication: {
      status: "public-approved",
      permissionEvidence: PHONE_PERMISSION_2026_10_29,
      blockedReason: null,
    },
    attributes: {
      start: "N06_002",
      end: "N06_003",
      name: "N06_007",
      category: ksjClassification("N06").field,
      relation: "N06_004",
      relationNote: "N06_011",
    },
    // 種別と色は区分の台帳 (単体 GIS ページと共有)
    categories: ksjClassification("N06").classes,
    years: { first: 1962, last: 2024 },
    cautions: [
      "開通年は区間ごとの供用開始年です。月は扱わず、同じ年に開通した区間はまとめて表示します。",
      "延長は線データの長さから計算した値で、公表されている供用延長とは一致しません。",
    ],
  },
  {
    key: "railway",
    label: "鉄道",
    question: "鉄道網はどこで伸び、どこで消えたか",
    description:
      "1950年から2024年まで、国土数値情報の鉄道時系列データで路線ごとの開業と廃止を年単位で地図に描きます。",
    source: {
      dataId: "N05",
      version: "24",
      name: "国土数値情報 鉄道時系列データ",
      provider: "国土交通省",
      archiveUrl: "https://nlftp.mlit.go.jp/ksj/gml/data/N05/N05-24/N05-24_GML.zip",
      archiveSha256: "84ce3d3d50ad56aa53970ef2907eab32a8b7d1a2cc894c164ff4107384dff24b",
      archiveBytes: 33268725,
      entry: "UTF-8/N05-24_RailroadSection2.geojson",
      retrievedAt: "2026-10-29T00:18:00.000Z",
    },
    usage: "time-series",
    geometry: "line",
    measure: { label: "延長", unit: "km" },
    currentDataId: "N02",
    publication: {
      status: "public-approved",
      permissionEvidence: PHONE_PERMISSION_2026_10_29,
      blockedReason: null,
    },
    attributes: {
      start: "N05_005b",
      end: "N05_005e",
      name: "N05_002",
      category: ksjClassification("N05").field,
      relation: "N05_006",
      relationNote: "N05_010",
    },
    categories: ksjClassification("N05").classes,
    years: { first: 1950, last: 2024 },
    cautions: [
      "1950年以前に開業した路線は、原典の仕様で開始年が1950年にまとめられています。1950年の地図は「1950年時点で存在した路線」です。",
      "事業者の種別は年ごとの区分です。国鉄の路線は1987年の民営化までJRの区分で表されます。",
      "一部の区間は原典で路線位置が推定とされています。",
    ],
  },
  {
    key: "airport",
    label: "空港",
    question: "空港はいつ、どこに増えたか",
    description:
      "1952年から2021年まで、国土数値情報の空港時系列データで公共用空港・飛行場の供用の始まりと終わりを年単位で地図に描きます。",
    source: {
      dataId: "N08",
      version: "21",
      name: "国土数値情報 空港時系列データ",
      provider: "国土交通省",
      archiveUrl: "https://nlftp.mlit.go.jp/ksj/gml/data/N08/N08-21/N08-21_GML.zip",
      archiveSha256: "52e2a850ce28f100979c67592c42e6e527fd7d9c7a3ba53c281527d39555e811",
      archiveBytes: 893917,
      // 空港区域 (面)。種別・所在地の市区町村コード・関係 ID を持つので、点 (標点) ではなく面の中心を位置にする
      entry: "UTF-8/N08-21_Airport.geojson",
      retrievedAt: "2026-10-29T03:37:00.000Z",
    },
    usage: "time-series",
    geometry: "point",
    measure: { label: "空港数", unit: "か所" },
    currentDataId: "N08",
    publication: {
      status: "public-approved",
      permissionEvidence: {
        method: "official-terms",
        date: "2026-10-29",
        counterpart: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N08-2021.html",
        scope: ["ad-free-page", "processed-data-delivery", "sns", "ad-page"],
        summary: "公式ページの使用許諾条件が「商用可」。事務局への確認は不要",
        recordedBy: "Claude (公式ページを確認)",
      },
      blockedReason: null,
    },
    attributes: {
      start: "N08_014",
      end: "N08_015",
      name: "N08_003",
      category: ksjClassification("N08").field,
      relation: "N08_016",
      prefectureSource: { kind: "muniCode", field: "N08_001" },
    },
    // 2008 年の空港法改正で区分が変わったので、時代をまたいで同じ色で追えるよう 4 つにまとめる (コード表 AirportCatCd)
    categories: ksjClassification("N08").classes,
    years: { first: 1952, last: 2021 },
    cautions: [
      "原典は1952年以降の公共用空港・飛行場 (2021年度版、112か所) です。",
      "位置は空港区域の中心です。同じ空港が同じ年に複数の区域を持つ場合も1か所として数えます。",
      "空港の種別は年ごとの区分です。2008年の空港法改正の前後で区分が変わるため、近い区分をまとめて色分けしています。",
    ],
  },
] as const;

/**
 * このページの使い方に適用される利用条件 (GIS 台帳の `usageTerms`)。
 * 台帳に根拠付きの条件が無ければ止める (根拠の無い条件で公開や広告の判断をしない)。
 */
export function infraNetworkTerms(network: InfraNetworkDefinition): InfraSourceTerms {
  const terms = resolveKsjUsageTerms(network.source.dataId, network.usage);
  if (!terms) {
    throw new Error(`GIS 台帳に ${network.source.dataId} の「${network.usage}」の利用条件がありません`);
  }
  return { ...terms, usage: network.usage };
}

/** 広告・アフィリエイトを出さないページか。使い方の利用条件が非商用なら出さない */
export function isInfraNetworkAdFree(network: InfraNetworkDefinition): boolean {
  return infraNetworkTerms(network).license === "non-commercial";
}

/** 原典の公式ページ (GIS 台帳の sourcePageUrl) */
export function infraNetworkPageUrl(network: InfraNetworkDefinition): string {
  const url = GIS_DATASETS_BY_ID.get(network.source.dataId)?.sourcePageUrl;
  if (!url) throw new Error(`GIS 台帳に ${network.source.dataId} の公式ページがありません`);
  return url;
}

/** 単体 GIS ページ (`/geo/datasets/<dataId>`) から時系列ページへ戻すための逆引き */
export function findInfraNetworksForDataset(dataId: string): InfraNetworkDefinition[] {
  return INFRA_NETWORKS.filter(
    (network) => network.source.dataId === dataId || network.currentDataId === (dataId as KsjDataId),
  );
}

export function findInfraNetwork(key: string): InfraNetworkDefinition | null {
  return INFRA_NETWORKS.find((network) => network.key === key) ?? null;
}

export function isInfraNetworkKey(key: string): key is InfraNetworkKey {
  return INFRA_NETWORKS.some((network) => network.key === key);
}

/**
 * 公開してよい網か (R2 反映・検索掲載)。台帳の status だけでなく、根拠の了承範囲に
 * 広告なしページでの表示と加工データの配信の両方が含まれることを確かめる
 */
export function isInfraNetworkPublishable(network: Pick<InfraNetworkDefinition, "publication">): boolean {
  const { status, permissionEvidence } = network.publication;
  if (status !== "public-approved" || !permissionEvidence) return false;
  return INFRA_PUBLICATION_REQUIRED_SCOPES.every((scope) => permissionEvidence.scope.includes(scope));
}
