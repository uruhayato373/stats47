/**
 * 問いの詳細と公開待ちの下書き: 何を作り、どこへつないだかを中身で見せるための整形。読み取りのみ。
 * 事業の問いとは混ぜない (lib/question-progress.ts の冒頭)。
 */

/** frontmatter の 1 行の値 */
export function frontmatterValue(markdown: string, name: string): string | null {
  const match = new RegExp(`^${name}:\\s*(.+)$`, "m").exec(markdown.split(/^---\s*$/m)[1] ?? "");
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** 本文の見出し (h2) の並び */
export function outlineOf(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/** review.md の verdict。無ければ null */
export function verdictOf(review: string): string | null {
  return /^verdict:\s*(\w+)/m.exec(review)?.[1] ?? null;
}

/** 記事の図のうち、明るい版だけを本文の順に返す */
export function articleFigures(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(data\/([^)]+\.svg)\)/g)].map((m) => m[1]);
}
