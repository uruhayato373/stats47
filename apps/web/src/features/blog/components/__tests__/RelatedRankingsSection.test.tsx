import { selectContentRecommendations } from '@stats47/data-configs/content/navigation';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/content-navigation/server', () => ({
  readContentRecommendations: async (context: Parameters<typeof selectContentRecommendations>[2]) => selectContentRecommendations([
    {id:'ranking:published',kind:'ranking',key:'published',title:'公開指標',href:'/ranking/published',published:true},
    {id:'ranking:stale',kind:'ranking',key:'stale',title:'終了指標',href:'/ranking/stale',published:false},
  ], [], context),
}));
import { RelatedRankingsSection } from '../RelatedRankingsSection';

describe('RelatedRankingsSection', () => {
  it('記事で使う指標のうち公開中のものだけを表示し、IDを計測ラベルへ渡す', async () => {
    const element = await RelatedRankingsSection({tagKeys:[],rankingKeys:['stale','published']});
    const {container} = render(element);
    expect([...container.querySelectorAll('a')].map(a=>a.getAttribute('href'))).toEqual(['/ranking/published']);
    expect(container.querySelector('a')?.getAttribute('data-nav-label')).toBe('ranking:published');
  });
  it('記事の指標が非公開なら、無関係なカテゴリ代表指標で埋めず何も表示しない', async () => {
    expect(await RelatedRankingsSection({tagKeys:['気候'],rankingKeys:['stale']})).toBeNull();
  });
});
