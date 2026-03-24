export interface FurusatoNozeiLink {
  prefCode: string;          // "01000" 形式
  prefName: string;          // "北海道"
  rakutenAreaSlug: string;   // 楽天エリアページのパス名
}

/** 47都道府県の楽天ふるさと納税エリアページマッピング */
export const FURUSATO_NOZEI_LINKS: FurusatoNozeiLink[] = [
  { prefCode: "01000", prefName: "北海道", rakutenAreaSlug: "hokkaido" },
  { prefCode: "02000", prefName: "青森県", rakutenAreaSlug: "aomori" },
  { prefCode: "03000", prefName: "岩手県", rakutenAreaSlug: "iwate" },
  { prefCode: "04000", prefName: "宮城県", rakutenAreaSlug: "miyagi" },
  { prefCode: "05000", prefName: "秋田県", rakutenAreaSlug: "akita" },
  { prefCode: "06000", prefName: "山形県", rakutenAreaSlug: "yamagata" },
  { prefCode: "07000", prefName: "福島県", rakutenAreaSlug: "fukushima" },
  { prefCode: "08000", prefName: "茨城県", rakutenAreaSlug: "ibaraki" },
  { prefCode: "09000", prefName: "栃木県", rakutenAreaSlug: "tochigi" },
  { prefCode: "10000", prefName: "群馬県", rakutenAreaSlug: "gunma" },
  { prefCode: "11000", prefName: "埼玉県", rakutenAreaSlug: "saitama" },
  { prefCode: "12000", prefName: "千葉県", rakutenAreaSlug: "chiba" },
  { prefCode: "13000", prefName: "東京都", rakutenAreaSlug: "tokyo" },
  { prefCode: "14000", prefName: "神奈川県", rakutenAreaSlug: "kanagawa" },
  { prefCode: "15000", prefName: "新潟県", rakutenAreaSlug: "niigata" },
  { prefCode: "16000", prefName: "富山県", rakutenAreaSlug: "toyama" },
  { prefCode: "17000", prefName: "石川県", rakutenAreaSlug: "ishikawa" },
  { prefCode: "18000", prefName: "福井県", rakutenAreaSlug: "fukui" },
  { prefCode: "19000", prefName: "山梨県", rakutenAreaSlug: "yamanashi" },
  { prefCode: "20000", prefName: "長野県", rakutenAreaSlug: "nagano" },
  { prefCode: "21000", prefName: "岐阜県", rakutenAreaSlug: "gifu" },
  { prefCode: "22000", prefName: "静岡県", rakutenAreaSlug: "shizuoka" },
  { prefCode: "23000", prefName: "愛知県", rakutenAreaSlug: "aichi" },
  { prefCode: "24000", prefName: "三重県", rakutenAreaSlug: "mie" },
  { prefCode: "25000", prefName: "滋賀県", rakutenAreaSlug: "shiga" },
  { prefCode: "26000", prefName: "京都府", rakutenAreaSlug: "kyoto" },
  { prefCode: "27000", prefName: "大阪府", rakutenAreaSlug: "osaka" },
  { prefCode: "28000", prefName: "兵庫県", rakutenAreaSlug: "hyogo" },
  { prefCode: "29000", prefName: "奈良県", rakutenAreaSlug: "nara" },
  { prefCode: "30000", prefName: "和歌山県", rakutenAreaSlug: "wakayama" },
  { prefCode: "31000", prefName: "鳥取県", rakutenAreaSlug: "tottori" },
  { prefCode: "32000", prefName: "島根県", rakutenAreaSlug: "shimane" },
  { prefCode: "33000", prefName: "岡山県", rakutenAreaSlug: "okayama" },
  { prefCode: "34000", prefName: "広島県", rakutenAreaSlug: "hiroshima" },
  { prefCode: "35000", prefName: "山口県", rakutenAreaSlug: "yamaguchi" },
  { prefCode: "36000", prefName: "徳島県", rakutenAreaSlug: "tokushima" },
  { prefCode: "37000", prefName: "香川県", rakutenAreaSlug: "kagawa" },
  { prefCode: "38000", prefName: "愛媛県", rakutenAreaSlug: "ehime" },
  { prefCode: "39000", prefName: "高知県", rakutenAreaSlug: "kochi" },
  { prefCode: "40000", prefName: "福岡県", rakutenAreaSlug: "fukuoka" },
  { prefCode: "41000", prefName: "佐賀県", rakutenAreaSlug: "saga" },
  { prefCode: "42000", prefName: "長崎県", rakutenAreaSlug: "nagasaki" },
  { prefCode: "43000", prefName: "熊本県", rakutenAreaSlug: "kumamoto" },
  { prefCode: "44000", prefName: "大分県", rakutenAreaSlug: "oita" },
  { prefCode: "45000", prefName: "宮崎県", rakutenAreaSlug: "miyazaki" },
  { prefCode: "46000", prefName: "鹿児島県", rakutenAreaSlug: "kagoshima" },
  { prefCode: "47000", prefName: "沖縄県", rakutenAreaSlug: "okinawa" },
];

/**
 * areaCode（先頭2桁を都道府県コードとして使用）から
 * 楽天ふるさと納税リンク情報を返す。
 * 全国コード（"00000"）や市区町村コードも先頭2桁で都道府県を特定する。
 * 該当なしの場合は null を返す。
 */
export function getFurusatoNozeiLink(areaCode: string): FurusatoNozeiLink | null {
  if (areaCode === "00000") return null;
  const prefCode = `${areaCode.substring(0, 2)}000`;
  return FURUSATO_NOZEI_LINKS.find((l) => l.prefCode === prefCode) ?? null;
}

/**
 * 楽天ふるさと納税エリアページのURLを生成する。
 * アフィリエイトIDが設定されている場合はアフィリエイトリンクを返す。
 */
export function buildFurusatoNozeiUrl(slug: string, affiliateId?: string): string {
  const targetUrl = `https://event.rakuten.co.jp/furusato/area/${slug}/`;
  if (!affiliateId) return targetUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(targetUrl)}&link_type=hybrid_url`;
}
