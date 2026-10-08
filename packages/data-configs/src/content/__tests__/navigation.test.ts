import { describe, expect, it } from 'vitest';
import { contentIdFromHref, contentTagIds, resolveContentTag, type ContentPage } from '../index';
import { selectContentRecommendations } from '../navigation';

const page = (id: string, kind: string, rankingKeys: string[] = [], published = true): ContentPage => ({ id, kind, key: id.split(':')[1]!, title: id, href: `/${kind}/${id.split(':')[1]}`, published, rankingKeys });

describe('content identity and navigation', () => {
  it('県の特徴には制作手順を自動混入させず、明示した編集関係は尊重する', () => {
    const source = page('area:39000', 'area');
    const guide = { ...page('blog:guide', 'blog', ['manufacturing']), tagIds: ['tag:t-a8cd52d0d273'] };
    const story = page('blog:story', 'blog', ['manufacturing']);
    const context = { sourceId: source.id, kinds: ['blog'], rankingKeys: ['manufacturing'] };
    expect(selectContentRecommendations([source, guide, story], [], context).map(row => row.id)).toEqual(['blog:story']);
    expect(selectContentRecommendations([source, guide], [{ from: source.id, to: guide.id, relation: 'explains' }], context).map(row => row.id)).toEqual(['blog:guide']);
  });
  it('表示名・英語の旧キー・IDを同じタグへ解決し、URLのクエリはIDを変えない', () => {
    expect(contentTagIds(['気候', 'climate', 'tag:climate'])).toEqual(['tag:climate']);
    expect(resolveContentTag('climate')?.key).toBe('気候');
    expect(contentIdFromHref('/tag/%E6%B0%97%E5%80%99')).toBe('tag:climate');
    expect(contentIdFromHref('/ranking/annual-sunshine-duration?year=2024#map')).toBe('ranking:annual-sunshine-duration');
    expect(contentIdFromHref('/areas/39000/climate')).toBe('area-theme:39000:climate');
    expect(contentIdFromHref('/municipalities/themes/population')).toBe('municipality-theme:population');
    expect(contentIdFromHref('/geo/population-land-price/39/overlap')).toBe('geo:population-land-price:39:overlap');
  });
  it('直接の指標一致をタグ一致より先に出し、自分・非公開・重複・無関係な新着を除外する', () => {
    const source = {...page('blog:source', 'blog', ['sunshine']), tagIds:['tag:climate']};
    const direct = page('blog:direct', 'blog', ['sunshine']);
    const tagged = {...page('blog:tagged', 'blog'), tagIds:['tag:climate']};
    const selected = selectContentRecommendations([source, tagged, direct, direct, page('blog:draft','blog',['sunshine'],false), page('blog:latest','blog')], [], {sourceId:source.id,kinds:['blog']});
    expect(selected.map(item=>item.id)).toEqual(['blog:direct','blog:tagged']);
    expect(selected.map(item=>item.relation)).toEqual(['sharedMetric','tag']);
  });
  it('記事が使った非公開ランキングは、古い索引に残っていても出さない', () => {
    const pages = [page('blog:source','blog',['visible','closed']), page('ranking:visible','ranking'), page('ranking:closed','ranking',[],false)];
    expect(selectContentRecommendations(pages, [], {sourceId:'blog:source',kinds:['ranking']}).map(item=>item.id)).toEqual(['ranking:visible']);
  });
  it('Geoの明示的な紐付けは公開対象だけを出し、タグからGeoを推測しない', () => {
    const pages = [page('geo:analysis','geo'),page('blog:explainer','blog'),page('blog:draft','blog',[],false)];
    const links = [{from:'geo:analysis',to:'blog:explainer',relation:'explains' as const},{from:'geo:analysis',to:'blog:draft',relation:'explains' as const}];
    expect(selectContentRecommendations(pages,links,{sourceId:'geo:analysis',kinds:['blog']}).map(item=>item.id)).toEqual(['blog:explainer']);
  });
  it('同順位は不変IDで並び、件数上限と候補が空の状態を守る', () => {
    const pages = [page('ranking:sunshine','ranking'),page('blog:z','blog',['sunshine']),page('blog:a','blog',['sunshine'])];
    expect(selectContentRecommendations(pages,[],{sourceId:'ranking:sunshine',kinds:['blog'],limit:1})[0]?.id).toBe('blog:a');
    expect(selectContentRecommendations(pages,[],{sourceId:'missing',kinds:['blog']})).toEqual([]);
  });
});
