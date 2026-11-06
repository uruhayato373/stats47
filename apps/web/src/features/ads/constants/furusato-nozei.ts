import { fetchPrefectures } from "@stats47/area";

const PREFECTURES = fetchPrefectures();

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
  for (const link of PREFECTURES) {
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
  const names = PREFECTURES.flatMap((link) => [
    link.prefName, link.prefName.replace(/[都府県]$/, ""),
  ]).sort((a, b) => b.length - a.length);
  // 長い県名を先に消費し、「東京都」内の「京都」を再検出しない。
  const matches = text.match(new RegExp([...new Set(names)].join("|"), "g")) ?? [];
  const codes = new Set(matches.map((name) => detectPrefCodeFromText(name)));
  return codes.size === 1 ? [...codes][0] : null;
}
