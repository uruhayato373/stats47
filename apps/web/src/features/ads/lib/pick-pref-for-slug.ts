import { FURUSATO_NOZEI_LINKS } from "../constants/furusato-nozei";

/**
 * 文字列 (記事 slug 等) から決定論的に 1 つの prefCode を選ぶ。
 *
 * 同じ入力には必ず同じ出力を返す (FNV-1a 32bit ハッシュ → 47 県インデックス)。
 *
 * 用途: ブログ記事に都道府県が登場しないが、ふるさと納税の
 * 県別カードは出したい場合に、記事ごとに「固定された県」を割り当てる。
 * - 同一 URL ならビルドや ISR を跨いで常に同じ県が表示される (SSG 整合性)
 * - サイト全体としては 47 県が分散して表示される (アフィリエイト多様性)
 */
export function pickPrefCodeForSlug(slug: string): string {
  if (!slug) return FURUSATO_NOZEI_LINKS[0].prefCode;

  // FNV-1a 32bit
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = (hash >>> 0) % FURUSATO_NOZEI_LINKS.length;
  return FURUSATO_NOZEI_LINKS[idx].prefCode;
}
