import data from "../../../../data/geo/infra-history/networks.json";
import { findKsjClassification } from "../mlit-ksj/classifications";
import { GIS_DATASETS_BY_ID, resolveKsjUsageTerms, type KsjDataId } from "../mlit-ksj/datasets";
import { INFRA_PUBLICATION_REQUIRED_SCOPES } from "./types";
import type { InfraAttributeMap, InfraNetworkDefinition, InfraNetworkKey, InfraSourceTerms } from "./types";

/** 台帳の 1 件。種別の属性名 (`attributes.category`) と種別 (`categories`) は区分の台帳から結ぶので持たない */
type InfraNetworkRecord = Omit<InfraNetworkDefinition, "categories" | "attributes"> & {
  readonly attributes: Omit<InfraAttributeMap, "category">;
};

/**
 * 交通網の変遷ページの台帳の読み込み口。
 *
 * 記録の正本は台帳 `geo.infra-history-networks` (data/geo/infra-history/networks.json + Schema)。原典の版・SHA・公開状態を
 * そこに置く。生成スクリプトは原典 ZIP の SHA が台帳と一致しなければ止まり、R2 publisher は `publication.status` が
 * `public-approved` でなければ `app/geo/history/<key>/` を拒否する (`ksj-publication-guard.ts`)。
 * 種別と色は区分の台帳 `geo.ksj-classifications` (単体 GIS ページと共有) から、原典の dataId で結ぶ。
 *
 * 利用条件と公式ページの URL は台帳に書かず、GIS 台帳 `geo.ksj-datasets` (読み込み口 `mlit-ksj/datasets.ts`) の `usageTerms` と
 * `sourcePageUrl` から引く (`infraNetworkTerms` / `infraNetworkPageUrl`)。広告の有無もその利用条件から決める
 * (`isInfraNetworkAdFree`)。高速道路・鉄道は時系列として描くと非商用なので広告を出さず、公開は事務局の書面回答を待つ
 * (`.claude/rules/geo-analysis-standards.md`「商用公開Gate」)。空港は商用可。
 */
export const INFRA_NETWORKS: readonly InfraNetworkDefinition[] = (data.networks as unknown as readonly InfraNetworkRecord[]).map(
  (network) => {
    const classification = findKsjClassification(network.source.dataId);
    if (!classification) throw new Error(`区分の台帳に ${network.source.dataId} がありません (交通網 ${network.key})`);
    const { start, end, name, ...rest } = network.attributes;
    const { years, cautions, ...head } = network;
    return {
      ...head,
      key: network.key as InfraNetworkKey,
      attributes: { start, end, name, category: classification.field, ...rest },
      categories: classification.classes,
      years,
      cautions,
    };
  },
);

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
