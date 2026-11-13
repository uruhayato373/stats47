import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { hrefFor } from '@stats47/data-configs/content/href';

/** 関係の正本は商品の作成例。テーマ側に逆引きの対応表を持たない。 */
export interface ProductThemeReference {
  themeKey: string;
  sectionKey: string;
}

export function resolveProductThemeReferences(refs: readonly ProductThemeReference[]) {
  if (!refs.length) throw Error('作成例のテーマ参照がありません');
  const seen = new Set<string>();
  return refs.map(ref => {
    const id = `${ref.themeKey}/${ref.sectionKey}`;
    if (seen.has(id)) throw Error(`テーマ参照が重複しています: ${id}`);
    seen.add(id);
    const theme = THEME_CATALOGS[ref.themeKey];
    const section = theme?.sections?.find(item => item.key === ref.sectionKey);
    if (!section) throw Error(`テーマの章がありません: ${id}`);
    return { ...ref, title: theme.title, sectionTitle: section.title,
      href: `${hrefFor('theme', { themeSlug: theme.key })}#theme-section-${section.key}` };
  });
}
