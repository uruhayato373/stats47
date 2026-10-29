import 'server-only';
import { PanelGrid } from '@stats47/components';
import { contentTagIds } from '@stats47/data-configs/content';
import { Newspaper } from 'lucide-react';

import { ArticleTeaserCard, ArticleTeaserGrid } from '@/components/surface';

import { readContentRecommendations } from '@/features/content-navigation/server';

import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

interface Props { themeKey?: string; tagKeys: string[]; rankingKeys?: string[]; limit?: number; }

/**
 * 「このテーマを読み解く記事」。記事カード (ArticleTeaserCard) を記事カードの格子に並べる (2026-10-29。旧: 画像付きのリンク行)。
 * 見出しのセルと格子を節ごと線の格子にし、ページの最後 (ダッシュボードを読み終えた位置) に置かれる。
 */
export async function ThemeRelatedArticles({ themeKey, tagKeys, rankingKeys = [], limit = 3 }: Props) {
  const items = await readContentRecommendations({sourceId: `theme:${themeKey ?? ''}`, kinds: ['blog'], ...(themeKey ? {} : {rankingKeys}), tagIds: contentTagIds(tagKeys), limit});
  if (!items.length) return null;
  return (
    <PanelGrid as="section" aria-labelledby="theme-related-articles">
      <h2 id="theme-related-articles" className="flex items-center gap-2 text-base leading-5.5 font-medium text-foreground">
        <Newspaper aria-hidden="true" className="size-4 text-muted-foreground" />
        このテーマを読み解く記事
      </h2>
      <ArticleTeaserGrid>
        {items.map((item) => (
          <ArticleTeaserCard
            key={item.id}
            href={item.href}
            title={item.title}
            thumbnail={{
              lightSrc: blogThumbnailUrl(item.key, 'light'),
              darkSrc: blogThumbnailUrl(item.key, 'dark'),
            }}
            navSurface="theme_blog"
          />
        ))}
      </ArticleTeaserGrid>
    </PanelGrid>
  );
}
