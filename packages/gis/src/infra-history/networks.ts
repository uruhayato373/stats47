import { GIS_DATASETS_BY_ID, resolveKsjUsageTerms } from "../mlit-ksj/datasets";
import type { InfraNetworkDefinition, InfraNetworkKey, InfraSourceTerms } from "./types";

/**
 * 交通網の変遷ページの台帳 (git TS が SSOT)。
 *
 * 原典の版・SHA・公開状態をここに置く。生成スクリプトは原典 ZIP の SHA が
 * ここと一致しなければ止まり、R2 publisher は `publication.status` が `public-approved` で
 * なければ `app/geo/history/<key>/` を拒否する (`ksj-publication-guard.ts`)。
 *
 * 利用条件と公式ページの URL はここに書かず、GIS 台帳 (`mlit-ksj/datasets.ts`) の `usageTerms` と
 * `sourcePageUrl` から引く (`infraNetworkTerms` / `infraNetworkPageUrl`)。どちらも時系列として描くので非商用で、
 * 広告・アフィリエイトを出さず、公開は事務局の書面回答を待つ (`.claude/rules/geo-analysis-standards.md`「商用公開Gate」)。
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
    publication: {
      status: "local-only",
      adPolicy: "none",
      permissionEvidence: null,
      blockedReason: "非商用データの画面公開は国土数値情報の事務局の書面回答を得てから行う",
    },
    attributes: {
      start: "N06_002",
      end: "N06_003",
      name: "N06_007",
      category: "N06_008",
      relation: "N06_004",
      relationNote: "N06_011",
    },
    categories: [
      { code: "1", label: "高速自動車国道", color: "hsl(var(--chart-3))" },
      { code: "2", label: "並行する自動車専用道路", color: "hsl(var(--chart-2))" },
      { code: "3", label: "一般国道の自動車専用道路", color: "hsl(var(--chart-4))" },
      { code: "4", label: "本州四国連絡高速道路", color: "hsl(var(--chart-1))" },
      { code: "5", label: "指定都市高速道路", color: "hsl(var(--muted-foreground))" },
      { code: "6", label: "その他の道路", color: "hsl(var(--muted-foreground))" },
    ],
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
    publication: {
      status: "local-only",
      adPolicy: "none",
      permissionEvidence: null,
      blockedReason: "非商用データの画面公開は国土数値情報の事務局の書面回答を得てから行う",
    },
    attributes: {
      start: "N05_005b",
      end: "N05_005e",
      name: "N05_002",
      category: "N05_001",
      relation: "N05_006",
      relationNote: "N05_010",
    },
    categories: [
      { code: "1", label: "JR新幹線", color: "hsl(var(--chart-3))" },
      { code: "2", label: "JR在来線", color: "hsl(var(--chart-2))" },
      { code: "3", label: "公営鉄道", color: "hsl(var(--chart-4))" },
      { code: "4", label: "民営鉄道", color: "hsl(var(--chart-1))" },
      { code: "5", label: "第三セクター", color: "hsl(var(--muted-foreground))" },
    ],
    years: { first: 1950, last: 2024 },
    cautions: [
      "1950年以前に開業した路線は、原典の仕様で開始年が1950年にまとめられています。1950年の地図は「1950年時点で存在した路線」です。",
      "事業者の種別は年ごとの区分です。国鉄の路線は1987年の民営化までJRの区分で表されます。",
      "一部の区間は原典で路線位置が推定とされています。",
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

/** 原典の公式ページ (GIS 台帳の sourcePageUrl) */
export function infraNetworkPageUrl(network: InfraNetworkDefinition): string {
  const url = GIS_DATASETS_BY_ID.get(network.source.dataId)?.sourcePageUrl;
  if (!url) throw new Error(`GIS 台帳に ${network.source.dataId} の公式ページがありません`);
  return url;
}

export function findInfraNetwork(key: string): InfraNetworkDefinition | null {
  return INFRA_NETWORKS.find((network) => network.key === key) ?? null;
}

export function isInfraNetworkKey(key: string): key is InfraNetworkKey {
  return INFRA_NETWORKS.some((network) => network.key === key);
}
