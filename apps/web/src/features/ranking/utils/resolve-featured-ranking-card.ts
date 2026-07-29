import { HOME_FEATURED_PROMINENCE } from "@stats47/data-configs/ranking-prominence";

import type { FeaturedValue } from "@stats47/ranking";

export interface HomeFeaturedSnapshotFields {
  homeFeatured?: {
    order: number;
    hook: string;
  } | null;
  featuredTop?: FeaturedValue | null;
  tileMapSvg?: string | null;
}

export interface FeaturedRankingCardDefinition {
  hook: string;
}

export interface FeaturedRankingCardFields {
  definition?: FeaturedRankingCardDefinition | null;
  featuredTop?: FeaturedValue | null;
  tileMapSvg?: string | null;
}

/** home / category / survey が共用する唯一のカードmodel。 */
export interface FeaturedRankingCardModel {
  hook: string;
  top: {
    rank?: number;
    areaName: string;
    value: string;
  };
  mapSvg: string;
}

const FEATURED_CARD_DEFINITION_BY_KEY = new Map(
  HOME_FEATURED_PROMINENCE.map((definition) => [
    definition.rankingKey,
    { hook: definition.hook },
  ]),
);

/** 同じrankingKeyは、表示面が変わっても同じhookを使う。 */
export function getFeaturedRankingCardDefinition(
  rankingKey: string,
): FeaturedRankingCardDefinition | null {
  return FEATURED_CARD_DEFINITION_BY_KEY.get(rankingKey) ?? null;
}

/**
 * 1位と地理地図が揃った場合だけ共通カードmodelを返す。
 * 別variantや画像なしfallbackは持たない。
 */
export function resolveFeaturedRankingCardModel(
  item: FeaturedRankingCardFields,
  fallbackHook: string,
): FeaturedRankingCardModel | null {
  const top = item.featuredTop ?? null;
  const mapSvg = item.tileMapSvg ?? null;
  if (
    top === null ||
    top.areaName.trim().length === 0 ||
    top.value === null ||
    !mapSvg
  ) {
    return null;
  }

  return {
    hook: item.definition?.hook ?? fallbackHook,
    top: {
      rank: top.rank,
      areaName: top.areaName,
      value: top.value,
    },
    mapSvg,
  };
}

/**
 * snapshot に焼かれた mini map SVG 1枚の許容サイズ。
 * compact 化前の未簡略化 path は 1 枚 1.7MB あり、RSC payload を肥大させていた。
 */
const MAX_TILE_MAP_SVG_BYTES = 100_000;

function exceedsTileMapSvgBudget(svg: string): boolean {
  // UTF-8 の byte 数は常に UTF-16 code unit 数以上なので、
  // 明らかに長い場合は encode せずに打ち切れる。
  if (svg.length > MAX_TILE_MAP_SVG_BYTES) return true;
  return new TextEncoder().encode(svg).length > MAX_TILE_MAP_SVG_BYTES;
}

/**
 * snapshot の mini map SVG が現行世代 (回転済み・compact path) か。
 *
 * 「fetch が必要か」の判定と「焼かれた SVG を破棄して再生成するか」の判定は
 * 必ずこの1つの述語を共有する。ずれると stale と判定しながら旧SVGを表示し続ける。
 */
export function isCurrentHomeFeaturedMapSvg(
  svg: string | null | undefined,
): svg is string {
  if (!svg) return false;
  if (!svg.includes('data-map-rotation="clockwise-')) return false;
  if (!svg.includes('data-map-format="compact-v1"')) return false;
  return !exceedsTileMapSvgBudget(svg);
}

/**
 * home snapshotの表示にvalues.jsonの追加fetchが必要か。
 * 地理地図または1位が不足している旧snapshotだけを補完する。
 */
export function needsHomeFeaturedValuesFetch(
  item: HomeFeaturedSnapshotFields,
): boolean {
  if (!isCurrentHomeFeaturedMapSvg(item.tileMapSvg)) return true;
  const top = item.featuredTop;
  return top == null || top.value == null || top.areaName.trim().length === 0;
}
