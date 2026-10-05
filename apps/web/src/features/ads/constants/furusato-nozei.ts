import { fetchPrefectures, NATIONAL_AREA_CODE, to5DigitPrefCode } from "@stats47/area";

interface FurusatoNozeiLink {
  prefCode: string;          // "01000" 形式
  prefName: string;          // "北海道"
  rakutenAreaSlug: string;   // 楽天エリアページのパス名
  /** その県の代表的な人気返礼品カテゴリ (楽天検索の絞り込み用)。未設定なら prefName のみで検索。 */
  signatureKeyword?: string;
}

/** 47都道府県の楽天ふるさと納税エリアページマッピング (楽天のエリア slug = @stats47/area の romaji) */
const FURUSATO_NOZEI_LINKS: FurusatoNozeiLink[] = fetchPrefectures().map((pref) => ({
  prefCode: pref.prefCode,
  prefName: pref.prefName,
  rakutenAreaSlug: pref.romaji,
}));

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
  if (!/^\d{5}$/.test(areaCode) || areaCode === NATIONAL_AREA_CODE) return null;
  const prefCode = to5DigitPrefCode(areaCode);
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

/** 単一県が主題の記事だけに返礼品を置く。比較記事から一方の県を恣意的に選ばない。 */
export function detectSinglePrefCodeFromText(text: string): string | null {
  const names = FURUSATO_NOZEI_LINKS.flatMap((link) => [
    link.prefName, link.prefName.replace(/[都府県]$/, ""),
  ]).sort((a, b) => b.length - a.length);
  // 長い県名を先に消費し、「東京都」内の「京都」を再検出しない。
  const matches = text.match(new RegExp([...new Set(names)].join("|"), "g")) ?? [];
  const codes = new Set(matches.map((name) => detectPrefCodeFromText(name)));
  return codes.size === 1 ? [...codes][0] : null;
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
