interface FurusatoNozeiLink {
  prefCode: string;          // "01000" 形式
  prefName: string;          // "北海道"
  rakutenAreaSlug: string;   // 楽天エリアページのパス名
  /** その県の代表的な人気返礼品カテゴリ (楽天検索の絞り込み用)。未設定なら prefName のみで検索。 */
  signatureKeyword?: string;
}

/** 47都道府県の楽天ふるさと納税エリアページマッピング */
const FURUSATO_NOZEI_LINKS: FurusatoNozeiLink[] = [
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
 * 都道府県 → その県で人気の代表的な返礼品カテゴリ (楽天検索を絞り込むキーワード)。
 * 「その県で最も選ばれる返礼品」を高意図で見せて CTR を上げる。教育的な特産品ではなく
 * ふるさと納税で実際に売れる signature を採る。検索が 0 件なら prefName のみに自動フォールバック
 * するため、絞りすぎても既存挙動を壊さない (searchFurusatoItems 参照)。
 * 大都市など signature が定まらない県は未設定 (prefName のみ)。
 */
const FURUSATO_SIGNATURE: Record<string, string> = {
  "01000": "海鮮", // 北海道: カニ/いくら/ホタテ
  "02000": "りんご", // 青森
  "03000": "牛肉", // 岩手: 前沢牛
  "04000": "牛タン", // 宮城
  "05000": "米", // 秋田: あきたこまち
  "06000": "さくらんぼ", // 山形
  "07000": "桃", // 福島
  "08000": "メロン", // 茨城
  "09000": "いちご", // 栃木: とちおとめ
  "12000": "海鮮", // 千葉
  "15000": "米", // 新潟: コシヒカリ
  "18000": "カニ", // 福井: 越前がに
  "19000": "ぶどう", // 山梨
  "20000": "りんご", // 長野
  "21000": "飛騨牛", // 岐阜
  "22000": "うなぎ", // 静岡
  "23000": "うなぎ", // 愛知
  "24000": "松阪牛", // 三重
  "25000": "近江牛", // 滋賀
  "28000": "神戸牛", // 兵庫
  "30000": "みかん", // 和歌山
  "31000": "カニ", // 鳥取: 松葉がに
  "33000": "マスカット", // 岡山
  "34000": "牡蠣", // 広島
  "35000": "ふぐ", // 山口
  "37000": "うどん", // 香川
  "38000": "みかん", // 愛媛
  "39000": "かつお", // 高知
  "40000": "明太子", // 福岡
  "41000": "佐賀牛", // 佐賀
  "43000": "馬刺し", // 熊本
  "45000": "宮崎牛", // 宮崎
  "46000": "うなぎ", // 鹿児島
  "47000": "マンゴー", // 沖縄
};

/**
 * areaCode（先頭2桁を都道府県コードとして使用）から
 * 楽天ふるさと納税リンク情報を返す。
 * 全国コード（"00000"）や市区町村コードも先頭2桁で都道府県を特定する。
 * 該当なしの場合は null を返す。
 */
export function getFurusatoNozeiLink(areaCode: string): FurusatoNozeiLink | null {
  if (areaCode === "00000") return null;
  const prefCode = `${areaCode.substring(0, 2)}000`;
  const link = FURUSATO_NOZEI_LINKS.find((l) => l.prefCode === prefCode);
  if (!link) return null;
  return { ...link, signatureKeyword: FURUSATO_SIGNATURE[prefCode] };
}

/**
 * テキスト (ブログ記事タイトル等) から都道府県コードを検出する。
 *
 * ブログ記事の 60% はタイトルに県名を含む (「愛知の食卓」「秋田の食卓｜さんま・みそが日本一」等)
 * ため、記事に対応する県のふるさと納税を出せる。GSC 実測で最大流入は食品消費量クエリ 46% で、
 * 返礼品 (食品中心) と文脈が近い。
 *
 * ★ 部分一致の罠: 「東京都」は「京都」を部分文字列として含む。**最も早く出現したものを採り、
 *   同じ位置なら長い方を採る**ことで「東京都」が「京都」に誤判定されるのを防ぐ。
 *   (「東京」は index 0、「京都」は index 1 なので東京が勝つ)
 *
 * @returns 5 桁の都道府県コード ("23000") / 見つからなければ null
 */
export function detectPrefCodeFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  let best: { index: number; length: number; prefCode: string } | null = null;
  for (const link of FURUSATO_NOZEI_LINKS) {
    // 「愛知県」と「愛知」の両方を見る (記事タイトルは接尾辞を省くことが多い)。
    // 北海道は接尾辞を持たないので bare と同一になる。
    const bare = link.prefName.replace(/[都府県]$/, "");
    for (const name of new Set([link.prefName, bare])) {
      const i = text.indexOf(name);
      if (i < 0) continue;
      if (!best || i < best.index || (i === best.index && name.length > best.length)) {
        best = { index: i, length: name.length, prefCode: link.prefCode };
      }
    }
  }
  return best?.prefCode ?? null;
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
