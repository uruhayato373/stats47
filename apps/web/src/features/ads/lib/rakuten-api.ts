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
  /** 既定 3 秒。ページ描画を止めないための上限で、超えたらカードを出さない。 */
  timeoutMs?: number;
}

export const RAKUTEN_ITEM_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

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

/** 楽天市場 商品検索 API を呼び出す。失敗は常に [] (カードを出さない) に倒す。 */
export async function searchRakutenItems(
  params: SearchItemsParams,
): Promise<RakutenItem[]> {
  const { applicationId, accessKey, affiliateId } = getRakutenConfig();
  // 新 API は applicationId と accessKey の両方が必須。片方でも欠ければ呼ばない。
  if (!applicationId || !accessKey) return [];

  const url = new URL(RAKUTEN_ITEM_SEARCH_ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("format", "json");
  // 要素をフラットにする (未指定だと {Item:{...}} ラップになり呼び出し側が壊れる)
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("hits", String(params.hits ?? 4));

  if (params.keyword) url.searchParams.set("keyword", params.keyword);
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
    if (!res.ok) return [];
    const data: RakutenItemSearchResponse = await res.json();
    return normalizeRakutenItems(data);
  } catch {
    return [];
  }
}

/**
 * ふるさと納税の返礼品を検索する (都道府県指定)。
 * signatureKeyword があれば「県名 + 代表返礼品」で高意図検索し、0 件なら県名のみで再検索する
 * (絞りすぎで動的カードを失わないためのフォールバック)。
 */
export async function searchFurusatoItems(
  prefName: string,
  hits = 4,
  signatureKeyword?: string,
): Promise<RakutenItem[]> {
  if (signatureKeyword) {
    const focused = await searchRakutenItems({
      keyword: `${prefName} ${signatureKeyword}`,
      genreId: FURUSATO_NOZEI_GENRE_ID,
      hits,
      sort: "-reviewCount",
    });
    if (focused.length > 0) return focused;
  }
  return searchRakutenItems({
    keyword: prefName,
    genreId: FURUSATO_NOZEI_GENRE_ID,
    hits,
    sort: "-reviewCount",
  });
}
