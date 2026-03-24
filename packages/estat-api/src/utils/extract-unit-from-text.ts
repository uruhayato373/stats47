/**
 * テキストから単位を抽出
 *
 * 全角または半角括弧で囲まれた末尾の文字列を単位として抽出します。
 * 例:
 * - "出荷額（百万円）" -> "百万円"
 * - "人口(人)" -> "人"
 *
 * ただし以下の場合は単位として扱いません：
 * - "除く"、"含む" などで終わる場合（注釈とみなす）
 * - 数字で始まる場合
 * - 10文字を超える場合
 *
 * @param text - 対象テキスト
 * @returns 抽出された単位、またはnull
 */
export function extractUnitFromText(text: string): string | null {
  if (!text) return null;

  let candidate: string | null = null;

  // 全角括弧: （単位）
  const fullWidthMatch = text.match(/（([^）]+)）$/);
  if (fullWidthMatch) {
    candidate = fullWidthMatch[1];
  }

  // 半角括弧: (単位)
  if (!candidate) {
    const halfWidthMatch = text.match(/\(([^)]+)\)$/);
    if (halfWidthMatch) {
      candidate = halfWidthMatch[1];
    }
  }

  if (candidate && isValidUnit(candidate)) {
    return candidate;
  }

  return null;
}

/**
 * 抽出されたテキストが有効な単位かどうかを判定
 *
 * @param text - 判定対象テキスト
 * @returns 有効な単位であればtrue
 */
function isValidUnit(text: string): boolean {
  // 除外キーワードパターン（末尾マッチ）
  const excludeSuffixes = [/除く$/, /含む$/, /のみ$/, /に限る$/, /該当するもの$/];

  for (const pattern of excludeSuffixes) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // 数字で始まるものは除外（例: 2015年）
  // ただし "1000人" のようなケースも考えられるが、
  // 現状のe-Statデータの傾向として括弧内が数字始まりの場合は注釈（年次など）のことが多い
  if (/^\d/.test(text)) {
    return false;
  }

  // 文字数が長すぎる場合も除外（単位としては長すぎる）
  if (text.length > 10) {
    return false;
  }

  return true;
}
