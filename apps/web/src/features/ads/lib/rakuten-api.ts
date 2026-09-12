/**
 * 楽天ウェブサービス API クライアント
 *
 * ★2026-08-04: 新 Rakuten Developers ポータル (openapi.rakuten.co.jp) へ移行した。
 *   実機プローブで確定した仕様 (公式ドキュメントだけでは読み切れなかった部分を含む):
 *     - endpoint : https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701
 *     - 認証     : applicationId (クエリ) + accessKey (**ヘッダ** `accessKey`) の **両方必須**
 *                  ヘッダ名 `X-Access-Key` は認識されない (400 になる)
 *     - 応答     : `Items` (大文字 I)。formatVersion=2 で要素はフラット ({Item:{}} ラップ無し)
 *     - 画像     : **string[]** で返る。旧実装/コンポーネントが期待する {imageUrl}[] ではない
 *     - IP 制限  : アプリに Allowed IP の登録が**必須項目**。未登録 IP からは 403 CLIENT_IP_NOT_ALLOWED
 *
 *   ★IP 制限について: **Cloudflare Workers の送信元 IP は動的**で個別登録できないため、
 *     楽天アプリ側の Allowed IP を `0.0.0.0/0` (全許可) にして実行時呼び出しを成立させている
 *     (2026-08-04 に CIDR 全許可が通ることを実機で確認)。
 *     ここを特定 IP に戻すと**本番の全ページで楽天カードが消える**ので変更しないこと。
 *     アクセス制御は accessKey (秘匿値) が担う。
 *     正典: .claude/rules/affiliate-ads-standards.md §12
 */

/** 楽天市場 商品検索 API のレスポンス型 (formatVersion=2 / 要素はフラット) */
import { furusatoQualityReasons, productQualityReasons, type RakutenQualityItem } from "./rakuten-item-quality";

interface RakutenItemSearchResponse {
  count: number;
  page: number;
  pageCount: number;
  hits: number;
  Items: unknown[];
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

/** 日次取得・フォールバックとも Expected QPS=1 を下回る間隔を使う。 */
export const RAKUTEN_REQUEST_INTERVAL_MS = 1200;

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
  excludeKeyword?: string;
  genreId?: string;
  hits?: number;
  sort?: string;
  /** 既定 3 秒。ページ描画を止めないための上限で、超えたらカードを出さない。 */
  timeoutMs?: number;
  /** Batch generation must distinguish failed requests from genuine zero results. */
  strict?: boolean;
}

export const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

export class RakutenApiError extends Error {
  constructor(public readonly code: "missing-credentials" | "http" | "network" | "invalid-response", public readonly status?: number) {
    // Never include request URLs, credentials or upstream response bodies in errors.
    super(`Rakuten API ${code}${status ? ` (HTTP ${status})` : ""}`);
    this.name = "RakutenApiError";
  }
}

export function toRakutenQualityItem(item: RakutenItem): RakutenQualityItem {
  return { name: item.itemName, url: item.affiliateUrl ?? item.itemUrl, price: item.itemPrice,
    image: item.mediumImageUrls[0]?.imageUrl ?? item.smallImageUrls[0]?.imageUrl ?? null,
    shopName: item.shopName, genreId: item.genreId };
}

function getRakutenConfig() {
  const applicationId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  return { applicationId, accessKey, affiliateId };
}

/** 画像配列の要素。新 API は string[] を返すが、旧形式 ({imageUrl}) も受けられるようにする。 */
type RawImage = string | { imageUrl?: string } | null | undefined;

function toImageUrls(raw: unknown): { imageUrl: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v: RawImage) => (typeof v === "string" ? v : (v?.imageUrl ?? "")))
    .filter((u): u is string => Boolean(u))
    .map((imageUrl) => ({ imageUrl }));
}

/**
 * API レスポンスを `RakutenItem[]` に正規化する。
 *
 * 吸収する差異 (どれも実機で観測 or 旧実装が前提としていた形):
 *   - 配列キーが `Items` / `items` のどちらでも受ける
 *   - 要素が `{Item:{...}}` でラップされていてもフラットでも受ける (formatVersion 差)
 *   - 画像配列が `string[]` でも `{imageUrl}[]` でも `{imageUrl}[]` に揃える
 *     (コンポーネントは `mediumImageUrls[0]?.imageUrl` を読むため、ここで形を守る)
 */
export function normalizeRakutenItems(data: unknown): RakutenItem[] {
  const root = (data ?? {}) as Record<string, unknown>;
  const arr = (root.Items ?? root.items) as unknown;
  if (!Array.isArray(arr)) return [];

  return arr.map((entry) => {
    const e = ((entry as Record<string, unknown>)?.Item ?? entry) as Record<string, unknown>;
    return {
      itemName: String(e.itemName ?? ""),
      itemPrice: Number(e.itemPrice ?? 0),
      itemUrl: String(e.itemUrl ?? ""),
      affiliateUrl: e.affiliateUrl ? String(e.affiliateUrl) : undefined,
      shopName: String(e.shopName ?? ""),
      shopUrl: String(e.shopUrl ?? ""),
      shopAffiliateUrl: e.shopAffiliateUrl ? String(e.shopAffiliateUrl) : undefined,
      mediumImageUrls: toImageUrls(e.mediumImageUrls),
      smallImageUrls: toImageUrls(e.smallImageUrls),
      reviewCount: Number(e.reviewCount ?? 0),
      reviewAverage: Number(e.reviewAverage ?? 0),
      genreId: String(e.genreId ?? ""),
    };
  });
}

/** 楽天市場 商品検索 API。既定は [] へ縮退、バッチの strict は取得失敗を区別する。 */
export async function searchRakutenItems(
  params: SearchItemsParams,
): Promise<RakutenItem[]> {
  const { applicationId, accessKey, affiliateId } = getRakutenConfig();
  // 新 API は applicationId と accessKey の両方が必須。片方でも欠ければ呼ばない。
  if (!applicationId || !accessKey) {
    if (params.strict) throw new RakutenApiError("missing-credentials");
    return [];
  }

  const url = new URL(RAKUTEN_ITEM_SEARCH_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("format", "json");
  // 要素をフラットにする (未指定だと {Item:{...}} ラップになり呼び出し側が壊れる)
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("hits", String(params.hits ?? 4));
  // Official API: restricted search + available products with images. Still validate titles ourselves.
  // https://webservice.rakuten.co.jp/documentation/ichiba-item-search
  url.searchParams.set("field", "1");
  url.searchParams.set("imageFlag", "1");
  url.searchParams.set("availability", "1");

  if (params.keyword) url.searchParams.set("keyword", params.keyword);
  if (params.excludeKeyword) url.searchParams.set("NGKeyword", params.excludeKeyword);
  if (params.genreId) url.searchParams.set("genreId", params.genreId);
  if (params.sort) url.searchParams.set("sort", params.sort);
  // アフィリエイト URL を得るために必須。無いと itemUrl だけになり成果にならない。
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);

  try {
    const res = await fetch(url.toString(), {
      // accessKey は**ヘッダ**で渡す (クエリでも通るが、URL に載せるとログ・キャッシュキーに残る)
      headers: { accessKey },
      // ページ表示のたびに楽天を叩かない (Expected QPS=1 のため必須)。
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(params.timeoutMs ?? 3000),
    });
    if (!res.ok) throw new RakutenApiError("http", res.status);
    const data: RakutenItemSearchResponse = await res.json();
    if (!data || !(Array.isArray(data.Items) || Array.isArray((data as unknown as { items?: unknown }).items))) {
      throw new RakutenApiError("invalid-response");
    }
    return normalizeRakutenItems(data);
  } catch (error) {
    if (params.strict) throw error instanceof RakutenApiError ? error : new RakutenApiError("network");
    return [];
  }
}

/**
 * ふるさと納税の返礼品を検索する (都道府県指定)。
 * 「ふるさと納税 + 県名 + 代表返礼品」で検索し、対象県の自治体ショップだけを採用する。
 * 0 件なら代表返礼品を外す。553283 は「ギフト券・商品券」であり返礼品共通のジャンルではない。
 */
export async function searchFurusatoItems(
  prefName: string,
  hits = 4,
  signatureKeyword?: string,
  timeoutMs?: number,
  strict = false,
): Promise<RakutenItem[]> {
  const { applicationId, accessKey } = getRakutenConfig();
  if (!applicationId || !accessKey) {
    if (strict) throw new RakutenApiError("missing-credentials");
    return [];
  }

  const search = async (keyword: string) => {
    const items = await searchRakutenItems({
      keyword,
      // 検索は商品説明にも一致するため、多めに取得して寄附先の県を確認する。
      hits: 30,
      sort: "-reviewCount",
      timeoutMs,
      strict,
      // Both searches stay in food, not gift certificates (553283) or unrelated goods.
      // Official category: https://www.rakuten.co.jp/category/100227/
      genreId: "100227",
    });
    const seen = new Set<string>();
    return items.filter((item) => {
      const value = toRakutenQualityItem(item);
      if (furusatoQualityReasons(value, prefName, { requireShop: true, context: "food" }).length || seen.has(value.url)) return false;
      seen.add(value.url);
      return true;
    }).slice(0, hits);
  };
  const keyword = `ふるさと納税 ${prefName}`;
  if (signatureKeyword) {
    const focused = await search(`${keyword} ${signatureKeyword}`);
    if (focused.length > 0) return focused;
    // 2 回の検索の「後」ではなく「間」で待つ。直後の再検索による 429 を防ぐ。
    await new Promise((resolve) => setTimeout(resolve, RAKUTEN_REQUEST_INTERVAL_MS));
  }
  return search(keyword);
}

/** More candidates than display slots; low-quality results must not occupy the four slots. */
export async function searchRakutenProductItems(keyword: string, hits = 4, timeoutMs = 15000): Promise<RakutenItem[]> {
  const items = await searchRakutenItems({ keyword, excludeKeyword: "ふるさと納税", hits: 30,
    sort: "-reviewCount", timeoutMs, strict: true });
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = toRakutenQualityItem(item);
    if (productQualityReasons(value, keyword).length || seen.has(value.url)) return false;
    seen.add(value.url);
    return true;
  }).slice(0, hits);
}
