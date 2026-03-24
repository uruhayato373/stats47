/**
 * 楽天ウェブサービス API クライアント
 *
 * Step 1: ふるさと納税（楽天市場商品検索 API）
 * Step 2: 楽天トラベル（Simple Hotel Search API）— 将来実装
 */

/** 楽天市場 商品検索 API のレスポンス型 */
export interface RakutenItemSearchResponse {
  count: number;
  page: number;
  pageCount: number;
  hits: number;
  Items: RakutenItem[];
}

export interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl?: string;
  shopName: string;
  shopUrl: string;
  shopAffiliateUrl?: string;
  mediumImageUrls: { imageUrl: string }[];
  smallImageUrls: { imageUrl: string }[];
  reviewCount: number;
  reviewAverage: number;
  genreId: string;
}

/** ふるさと納税のジャンルID */
export const FURUSATO_NOZEI_GENRE_ID = "553283";

/** 楽天トラベル 都道府県 middleClassCode マッピング */
export const PREF_TO_TRAVEL_MIDDLE_CLASS: Record<string, string> = {
  "01": "hokkaido",
  "02": "aomori",
  "03": "iwate",
  "04": "miyagi",
  "05": "akita",
  "06": "yamagata",
  "07": "fukushima",
  "08": "ibaraki",
  "09": "tochigi",
  "10": "gunma",
  "11": "saitama",
  "12": "chiba",
  "13": "tokyo",
  "14": "kanagawa",
  "15": "niigata",
  "16": "toyama",
  "17": "ishikawa",
  "18": "fukui",
  "19": "yamanashi",
  "20": "nagano",
  "21": "gifu",
  "22": "shizuoka",
  "23": "aichi",
  "24": "mie",
  "25": "shiga",
  "26": "kyoto",
  "27": "osaka",
  "28": "hyogo",
  "29": "nara",
  "30": "wakayama",
  "31": "tottori",
  "32": "shimane",
  "33": "okayama",
  "34": "hiroshima",
  "35": "yamaguchi",
  "36": "tokushima",
  "37": "kagawa",
  "38": "ehime",
  "39": "kochi",
  "40": "fukuoka",
  "41": "saga",
  "42": "nagasaki",
  "43": "kumamoto",
  "44": "oita",
  "45": "miyazaki",
  "46": "kagoshima",
  "47": "okinawa",
};

interface SearchItemsParams {
  keyword?: string;
  genreId?: string;
  hits?: number;
  sort?: string;
}

function getRakutenConfig() {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  return { applicationId, affiliateId };
}

/**
 * 楽天市場 商品検索 API を呼び出す
 */
export async function searchRakutenItems(
  params: SearchItemsParams,
): Promise<RakutenItem[]> {
  const { applicationId, affiliateId } = getRakutenConfig();
  if (!applicationId) return [];

  const url = new URL(
    "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601",
  );
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("format", "json");
  url.searchParams.set("hits", String(params.hits ?? 4));

  if (params.keyword) url.searchParams.set("keyword", params.keyword);
  if (params.genreId) url.searchParams.set("genreId", params.genreId);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data: RakutenItemSearchResponse = await res.json();
    return data.Items ?? [];
  } catch {
    return [];
  }
}

/**
 * ふるさと納税の返礼品を検索する
 */
export async function searchFurusatoItems(
  prefName: string,
  hits = 4,
): Promise<RakutenItem[]> {
  return searchRakutenItems({
    keyword: prefName,
    genreId: FURUSATO_NOZEI_GENRE_ID,
    hits,
    sort: "-reviewCount",
  });
}
