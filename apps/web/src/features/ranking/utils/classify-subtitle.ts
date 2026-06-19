/**
 * ランキングの `subtitle` を「定義補足」と「データ注釈 (※)」に振り分ける。
 *
 * 背景: `subtitle` フィールドは本来「短い定義補足」(例:「乳用牛(めす)の飼養頭数合計」)
 * 用だが、一部の metric では調査の注意書き (例:「※ 内陸8県は調査対象外 (value=0)」) が
 * 紛れ込んでいる。注釈をタイトル h1 に連結すると名称が肥大化するため、UI 側で振り分け
 * て描画位置を変える (定義 → h1 直下の控えめ行 / 注釈 → チャート直下キャプション)。
 *
 * ※ 将来は config に専用の `note` フィールドを設けてデータ側で分離する (型整理の次段)。
 *   それまでの暫定として、既存 item.json の subtitle を文面から判定する。
 */

/** subtitle がデータ注釈 (※系) かどうかを文面から判定する。 */
export function isCaveatNote(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  return (
    t.startsWith("※") ||
    t.startsWith("注") ||
    t.includes("調査対象外") ||
    t.includes("value=0") ||
    t.includes("対象外")
  );
}

interface ClassifiedSubtitle {
  /** 定義補足 (h1 直下に控えめ表示)。注釈だった場合は null。 */
  subtitle: string | null;
  /** データ注釈 (チャート直下キャプション)。定義だった場合は null。 */
  note: string | null;
}

/**
 * subtitle を定義補足 / データ注釈に分類する。
 * 注釈と判定したら `note` に、それ以外は `subtitle` に振り分ける。
 */
export function classifyRankingSubtitle(
  raw: string | null | undefined,
): ClassifiedSubtitle {
  const text = raw?.trim() ? raw.trim() : null;
  if (!text) return { subtitle: null, note: null };
  if (isCaveatNote(text)) return { subtitle: null, note: text };
  return { subtitle: text, note: null };
}
