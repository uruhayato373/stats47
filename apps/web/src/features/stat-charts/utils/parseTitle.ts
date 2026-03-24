/**
 * タイトル末尾の括弧（全角・半角）を分離する
 *
 * "図書館数（人口100万人当たり）" → { main: "図書館数", sub: "人口100万人当たり" }
 * "大学進学率" → { main: "大学進学率", sub: null }
 */
export function parseTitle(title: string): { main: string; sub: string | null } {
  // 末尾の全角括弧 or 半角括弧にマッチ
  const match = title.match(/^(.+?)[（(](.+?)[）)]$/);
  if (match) {
    return { main: match[1], sub: match[2] };
  }
  return { main: title, sub: null };
}
