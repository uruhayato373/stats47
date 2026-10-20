import { describe, expect, it } from 'vitest';
import type { ImageView } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { resolveStatisticalSamples } from '@/lib/server/template-statistical-samples';

function household(channel: string, patch: Partial<ImageView> = {}): ImageView {
  return {
    id: channel,
    channel,
    templateId: 'bar',
    original: { key: channel + '.png', sha256: channel },
    classification: { status: 'confirmed', purpose: 'comparison', selection: 'complete', role: 'chart' },
    comparison: { key: 'a-kakei-aichi', role: 'layout', requiredSelection: 'complete', candidateOnly: true, sharedChannels: channel === 'note' ? ['web'] : [] },
    candidate: { id: 'revision-' + channel, width: 1080, height: 1350, storage: { sha256: channel }, review: null },
    candidateMatches: true,
    approved: false,
    ...patch,
  } as ImageView;
}
describe('fixed real-statistic sample resolution', () => {
  it('keeps native household layouts and explicitly shares the note layout with the site', () => {
    const samples = resolveStatisticalSamples(['note', 'x', 'instagram'].map((c) => household(c)));
    const media = samples.find((s) => s.id === 'household-nagoya')!.media;
    expect(Object.keys(media)).toEqual(['note', 'web', 'x', 'instagram']);
    expect(media.note).toMatchObject({ imageId: 'note', width: 1080, height: 1350, kind: 'trial' });
    expect(media.web).toEqual(media.note);
    expect(media.x?.imageId).toBe('x');
    expect(media.instagram?.imageId).toBe('instagram');
    expect(samples.find((s) => s.id === 'household-aomori')!.media).toEqual({});
  });
  it('never restores expired, partial, or preview-only household images as the reviewed sample', () => {
    const images = [
      household('x', { candidateMatches: false }),
      household('note', { previewOnly: true }),
      household('instagram', { classification: { status: 'confirmed', purpose: 'comparison', selection: 'top-bottom', role: 'chart' } as ImageView['classification'] }),
    ];
    expect(resolveStatisticalSamples(images).find((s) => s.id === 'household-nagoya')!.media).toEqual({});
  });
  it('uses only the pinned reference without mistaking it for a prepared media layout', () => {
    const unrelated = household('note', { id: 'unrelated', comparison: undefined });
    const reference = household('note', {
      id: 'IMG-c9dcca78991487bb8046b5dc',
      templateId: 'table',
      candidate: null,
      width: 1200,
      height: 630,
    });
    const result = resolveStatisticalSamples([unrelated, reference]);
    const media = result.find((s) => s.id === 'tokyo-osaka')!.media;
    expect(media.note).toMatchObject({ imageId: reference.id, kind: 'reference', width: 1200, height: 630 });
    expect(media.web).toEqual(media.note);
    expect(media.x).toEqual(media.note);
    expect(media.instagram).toEqual(media.note);
    expect(resolveStatisticalSamples([unrelated]).find((s) => s.id === 'tokyo-osaka')!.media).toEqual({});
    expect(result.find((s) => s.id === 'household-radar')!.media).toEqual({});
  });
  it.each(['maximum-temperature-bars', 'maximum-temperature-table', 'maximum-temperature-tile-map', 'engel-trend'])('uses generated %s for all four media without article inventory', (id) => {
    const media = resolveStatisticalSamples([]).find((s) => s.id === id)!.media;
    expect(Object.keys(media)).toEqual(['note', 'web', 'x', 'instagram']);
    expect(media.note).toMatchObject({ src: '/api/template-samples/' + id, kind: 'trial', width: 1080, height: 1350 });
    expect(media.web).toEqual(media.note);
    expect(media.x).toEqual(media.note);
    expect(media.instagram).toEqual(media.note);
  });
  it('binds the trend sample to Engel data and its own trend domain', () => {
    const sample = resolveStatisticalSamples([]).find((s) => s.id === 'engel-trend')!;
    expect(sample.binding?.metricKey).toBe('engel-coefficient');
    expect(sample.binding?.dataKey).toBe('app/stats/engel-coefficient/values.json');
    expect(sample.binding?.visualization.trendDomain).toEqual({ mode: 'extent', padding: 0.08 });
  });
  it('keeps the recorded published originals as visible layout references without guessing other images', () => {
    const note = household('note', { id: 'IMG-13e4c802056bd58faa30fc45', pageUrl: 'https://note.com/example' });
    const instagram = household('instagram', { id: 'IMG-00f8e848935569c9b086c2c1', pageUrl: 'https://instagram.com/example' });
    const sample = resolveStatisticalSamples([note, instagram]).find((s) => s.id === 'maximum-temperature-tile-map')!;
    expect(sample.basisImages).toEqual([
      { src: '/api/media-library/' + note.id + '/file', label: 'note：住居費割合（公開済み）', pageUrl: note.pageUrl },
      { src: '/api/media-library/' + instagram.id + '/file', label: 'Instagram：焼酎支出クイズ（公開済み）', pageUrl: instagram.pageUrl },
    ]);
    expect(resolveStatisticalSamples([]).find((s) => s.id === sample.id)!.basisImages).toEqual([]);
  });
  it('keeps published note and Instagram bars beside the common ranking form as references', () => {
    const note = household('note', { id: 'IMG-37a9dcaff111583e70fc2cf7', pageUrl: 'https://note.com/stats47/n/n91e96edf3950' });
    const instagram = household('instagram', { id: 'IMG-0c14873010e41a46fd627e96', pageUrl: 'https://www.instagram.com/p/Dd1yg5lmEk3/' });
    const sample = resolveStatisticalSamples([note, instagram]).find((s) => s.id === 'maximum-temperature-bars')!;
    expect(sample.basisImages).toEqual([
      { src: '/api/media-library/' + note.id + '/file', label: 'note：最高気温（公開済み）', pageUrl: note.pageUrl },
      { src: '/api/media-library/' + instagram.id + '/file', label: 'Instagram：副業者の割合（公開済み）', pageUrl: instagram.pageUrl },
    ]);
    expect(resolveStatisticalSamples([]).find((s) => s.id === sample.id)!.basisImages).toEqual([]);
    expect(new Set(Object.values(sample.media).map((media) => media?.src))).toEqual(new Set(['/api/template-samples/maximum-temperature-bars']));
  });
});
