import { describe, expect, it } from 'vitest';
import {
  templateExamples,
  channelExamples,
  channelRatios,
  exampleDimensions,
  templateSamplePool,
  templateBranches,
  resolveTemplateBranch,
  comparisonGroups,
  comparisonExamples,
  comparisonTopic,
  TEMPLATE_CHANNELS,
} from '@/lib/media-template-examples';
import type { ImageView } from '../../../../.claude/scripts/media/lib/workspace.mjs';

function image(id: string, patch: Partial<ImageView> = {}): ImageView {
  return {
    id,
    templateId: 'bar',
    original: { key: id + '.png', sha256: id },
    classification: {
      status: 'confirmed',
      purpose: 'comparison',
      selection: 'complete',
      role: 'chart',
    },
    ...patch,
  } as ImageView;
}
function candidate(id: string, patch: Partial<ImageView> = {}): ImageView {
  return image(id, {
    candidate: {
      id: 'revision-' + id,
      storage: { sha256: id },
      review: null,
    } as ImageView['candidate'],
    candidateMatches: true,
    approved: false,
    ...patch,
  });
}
describe('template reference images', () => {
  it('groups unrelated bar topics separately and shares references only when explicitly configured', () => {
    const a = image('a', {
      channel: 'note',
      title: '同じ見出し',
      file: 'one.png',
    });
    const b = image('b', {
      channel: 'x',
      title: '同じ見出し',
      file: 'two.png',
    });
    const topics = comparisonGroups([a, b]);
    expect(topics).toHaveLength(2);
    expect(comparisonExamples([a, b], 'x', comparisonTopic(a).key)).toEqual([]);
    const shared = {
      ...a,
      comparison: { ...comparisonTopic(a), sharedChannels: ['web' as const] },
    };
    expect(
      comparisonExamples([shared, b], 'web', comparisonTopic(a).key)[0]
    ).toMatchObject({
      image: { id: 'a', channel: 'note' },
      sharedFrom: 'note',
      state: 'existing',
    });
    expect(
      comparisonExamples([shared, b], 'instagram', comparisonTopic(a).key)
    ).toEqual([]);
    const copy = { ...b, original: a.original };
    expect(comparisonGroups([a, copy])).toHaveLength(1);
    expect(
      comparisonExamples([a, copy], 'x', comparisonTopic(a).key)[0].image.id
    ).toBe('b');
  });
  it('keeps every classified Web bar topic beyond the representative cap', () => {
    const bars = Array.from({ length: 12 }, (_, i) =>
      image('web-' + i, { channel: 'web', title: '棒' + i, file: i + '.svg' })
    );
    const pool = templateSamplePool(bars);
    expect(pool.images).toHaveLength(12);
    expect(comparisonGroups(pool.images)).toHaveLength(12);
  });
  it('keeps note-image previews out of actual X/Instagram layout references', () => {
    const previews = ['x', 'instagram'].map((channel) =>
      image('preview-' + channel, { channel, previewOnly: true })
    );
    const actual = image('actual-x', { channel: 'x' });
    expect(templateExamples(previews)).toEqual([]);
    expect(
      channelExamples([...previews, actual], 'x').map((e) => e.image.id)
    ).toEqual(['actual-x']);
    expect(channelExamples(previews, 'instagram')).toEqual([]);
    const pool = templateSamplePool([...previews, actual]);
    expect(pool.images.map((i) => i.id)).toEqual(['actual-x']);
    expect(pool.counts.bar).toBe(1);
  });
  it('keeps cover originals in their own type and never uses an unreviewed cover candidate', () => {
    const cover = image('cover', {
      kind: 'cover',
      templateId: 'note-cover',
      coverUrl: '/old-cover',
      coverCandidateUrl: '/new-cover',
    });
    const samples = templateExamples([cover]);
    expect(samples[0].src).toBe('/old-cover');
    expect(samples[0].state).toBe('existing');
    expect(
      templateExamples([
        image('pending', { templateId: 'unclassified' }),
        image('stale', {
          classification: { status: 'stale' } as ImageView['classification'],
        }),
      ])
    ).toEqual([]);
  });
  it('keeps all note/SNS references selectable and limits only the larger Web catalogue', () => {
    const images = [
      ...Array.from({ length: 20 }, (_, n) =>
        image('square-' + n, { channel: 'x', width: 1080, height: 1080 })
      ),
      image('portrait', { channel: 'x', width: 1080, height: 1350 }),
      candidate('note', { channel: 'note' }),
      image('web', { templateId: 'scatter', channel: 'web' }),
      ...Array.from({ length: 20 }, (_, n) =>
        image('web-bar-' + n, { channel: 'web', width: 1080, height: 1080 })
      ),
      ...Array.from({ length: 10 }, (_, n) =>
        image('web-scatter-' + n, { templateId: 'scatter', channel: 'web' })
      ),
    ];
    const pool = templateSamplePool(images);
    expect(pool.counts).toMatchObject({ bar: 42, scatter: 11 });
    expect(pool.images.length).toBeLessThan(images.length);
    for (const channel of ['note', 'x', 'web']) {
      for (const ratio of ['', ...channelRatios(images, channel)]) {
        expect(
          channelExamples(
            pool.images,
            channel,
            ratio,
            channel === 'web' ? 3 : Infinity
          ).map((e) => e.image.id)
        ).toEqual(
          channelExamples(
            images,
            channel,
            ratio,
            channel === 'web' ? 3 : Infinity
          ).map((e) => e.image.id)
        );
      }
    }
  });
  it('groups by purpose and shape, keeps ranges as metadata and ignores old selection filters', () => {
    const row = (
      id: string,
      purpose: string,
      selection: string,
      channel = 'note'
    ) =>
      image(id, {
        channel,
        classification: {
          purpose,
          selection,
          status: 'confirmed',
        } as ImageView['classification'],
      });
    const branches = templateBranches([
      row('rank-note', 'ranking', 'top-bottom'),
      row('rank-x', 'ranking', 'top-bottom', 'x'),
      row('rank-ig', 'ranking', 'selected', 'instagram'),
      row('household-note', 'comparison', 'selected'),
      row('household-ig', 'comparison', 'selected', 'instagram'),
      row('wrong', 'comparison', 'top-bottom'),
    ]);
    expect(branches).toHaveLength(2);
    const ranking = resolveTemplateBranch(branches, { template: 'bar' })!;
    expect(ranking.purpose).toBe('ranking');
    expect(ranking.images.map((i) => i.id)).toEqual([
      'rank-note',
      'rank-x',
      'rank-ig',
    ]);
    expect(channelExamples(ranking.images, 'instagram')).toHaveLength(1);
    const comparison = resolveTemplateBranch(branches, {
      template: 'bar',
      'sample-note': 'household-note',
    })!;
    expect(comparison.purpose).toBe('comparison');
    expect(comparison.images.map((i) => i.id)).toEqual([
      'household-note',
      'household-ig',
    ]);
    expect(
      resolveTemplateBranch(branches, {
        template: 'bar',
        selection: 'top-bottom',
      })?.purpose
    ).toBe('ranking');
    expect(
      resolveTemplateBranch(branches, {
        template: 'bar',
        purpose: 'ranking',
        selection: 'complete',
      })?.key
    ).toBe(ranking.key);
  });
  it('keeps classification review separate from the type catalogue', () => {
    const rows = [
      image('ready', { channel: 'x' }),
      image('suggestion', {
        channel: 'web',
        classification: {
          status: 'suggested',
          purpose: 'comparison',
          selection: 'undecided',
        } as ImageView['classification'],
      }),
      image('unknown-purpose', {
        channel: 'web',
        classification: {
          status: 'recorded',
          purpose: 'undecided',
          selection: 'complete',
        } as ImageView['classification'],
      }),
      image('unknown-range', {
        channel: 'web',
        classification: {
          status: 'recorded',
          purpose: 'comparison',
          selection: 'undecided',
        } as ImageView['classification'],
      }),
    ];
    expect(templateSamplePool(rows).images.map((i) => i.id)).toEqual(['ready']);
    expect(templateBranches(rows).map((b) => b.key)).toEqual([
      'bar:comparison:',
    ]);
  });
  it('compares fixed-size trial layouts and keeps the old note original out of the template preview', () => {
    const meta = {
      key: 'electric-demand-example',
      title: '同じ都市の家計',
      url: 'https://note.com/example',
      requiredSelection: 'complete',
    };
    const rows = [
      image('note-original-x', {
        channel: 'x',
        previewOnly: true,
        comparison: { ...meta, role: 'note-original' },
        original: { key: 'note.png', sha256: 'original' },
      }),
      image('note-original-ig', {
        channel: 'instagram',
        previewOnly: true,
        comparison: { ...meta, role: 'note-original' },
        original: { key: 'note-copy.png', sha256: 'original' },
      }),
      image('x-layout', {
        channel: 'x',
        comparison: { ...meta, role: 'layout' },
      }),
      candidate('ig-page-1', {
        channel: 'instagram',
        comparison: { ...meta, role: 'layout' },
        classification: {
          status: 'confirmed',
          purpose: 'comparison',
          selection: 'complete',
        } as ImageView['classification'],
      }),
      image('ig-page-2', {
        channel: 'instagram',
        comparison: { ...meta, role: 'layout' },
        classification: {
          status: 'confirmed',
          purpose: 'comparison',
          selection: 'selected',
        } as ImageView['classification'],
      }),
      image('unrelated', { channel: 'note' }),
      candidate('note-layout', {
        channel: 'note',
        comparison: {
          ...meta,
          role: 'layout',
          candidateOnly: true,
          sharedChannels: ['web'],
        },
      }),
    ];
    const pool = templateSamplePool(rows);
    expect(comparisonGroups(pool.images)).toEqual(
      expect.arrayContaining([{ key: meta.key, title: meta.title }])
    );
    const note = comparisonExamples(pool.images, 'note', meta.key);
    expect(note).toHaveLength(1);
    expect(note[0].image.id).toBe('note-layout');
    expect(note[0].state).toBe('candidate');
    const site = comparisonExamples(pool.images, 'web', meta.key);
    expect(TEMPLATE_CHANNELS).toEqual(['note', 'web', 'x', 'instagram']);
    expect(site).toHaveLength(1);
    expect(site[0]).toMatchObject({
      image: { id: 'note-layout', channel: 'note' },
      src: note[0].src,
      state: 'candidate',
      sharedFrom: 'note',
    });
    expect(comparisonExamples(pool.images, 'web', 'another-topic')).toEqual([]);
    expect(
      comparisonExamples(
        rows.map((i) =>
          i.id === 'note-layout' ? { ...i, candidateMatches: false } : i
        ),
        'web',
        meta.key
      )
    ).toEqual([]);
    expect(
      comparisonExamples(
        [
          ...rows,
          image('site-original', {
            channel: 'web',
            comparison: { ...meta, role: 'layout' },
          }),
        ],
        'web',
        meta.key
      ).map((example) => example.image.id)
    ).toEqual(['site-original']);
    expect(
      comparisonExamples(
        rows.map((i) =>
          i.id === 'note-layout' ? { ...i, approved: true } : i
        ),
        'web',
        meta.key
      )[0].state
    ).toBe('candidate');
    expect(
      comparisonExamples(
        pool.images.filter((i) => i.id !== 'note-layout'),
        'note',
        meta.key
      )
    ).toEqual([]);
    expect(
      comparisonExamples(
        rows.map((i) =>
          i.id === 'note-layout' ? { ...i, candidateMatches: false } : i
        ),
        'note',
        meta.key
      )
    ).toEqual([]);
    expect(rows.find((i) => i.id === 'note-original-x')?.previewOnly).toBe(
      true
    );
    expect(
      comparisonExamples(pool.images, 'x', meta.key).map((e) => e.image.id)
    ).toEqual(['x-layout']);
    expect(
      comparisonExamples(
        [
          image('ig-single', {
            channel: 'instagram',
            comparison: { ...meta, role: 'layout' },
          }),
        ],
        'instagram',
        meta.key
      )
    ).toHaveLength(1);
    expect(comparisonExamples(pool.images, 'instagram', meta.key)).toHaveLength(
      1
    );
    expect(
      comparisonExamples(
        pool.images.filter((i) => i.id !== 'ig-page-1'),
        'instagram',
        meta.key
      )
    ).toEqual([]);
    expect(
      comparisonExamples(
        rows.map((i) =>
          i.id === 'ig-page-1' ? { ...i, candidateMatches: false } : i
        ),
        'instagram',
        meta.key
      )
    ).toEqual([]);
    expect(channelExamples(pool.images, 'x').map((e) => e.image.id)).toEqual([
      'x-layout',
    ]);
    expect(templateBranches(pool.images)).toHaveLength(1);
  });
  it('prefers directly stored originals over Drive-only examples and excludes rejected-only ratios', () => {
    const drive = image('a-drive', {
      channel: 'x',
      original: { provider: 'drive', sha256: 'drive' },
      legacyUrl: '/sns-asset/1/image.png',
    });
    const stored = image('z-stored', { channel: 'x' });
    expect(channelExamples([drive, stored], 'x')[0].image.id).toBe('z-stored');
    const rejected = candidate('rejected', { channel: 'x', original: null });
    rejected.candidate!.review = {
      status: 'needs-revision',
      reason: '修正',
      mobile: false,
      original: false,
      data: false,
    };
    rejected.candidate!.width = 1080;
    rejected.candidate!.height = 1920;
    expect(channelRatios([rejected], 'x')).toEqual([]);
  });
  it('selects each medium before applying the limit or deduplicating', () => {
    const images = [
      image('a', { channel: 'web' }),
      image('b', { channel: 'web' }),
      image('c', { channel: 'web' }),
      image('note', { channel: 'note' }),
      image('x', {
        channel: 'x',
        original: { key: 'x.png', sha256: 'shared' },
      }),
      image('ig', {
        channel: 'instagram',
        original: { key: 'ig.png', sha256: 'shared' },
      }),
    ];
    expect(channelExamples(images, 'note').map((e) => e.image.id)).toEqual([
      'note',
    ]);
    expect(channelExamples(images, 'x').map((e) => e.image.id)).toEqual(['x']);
    expect(channelExamples(images, 'instagram').map((e) => e.image.id)).toEqual(
      ['ig']
    );
    expect(channelExamples(images, 'missing')).toEqual([]);
  });
  it('filters actual candidate dimensions, not the original or misleading filename', () => {
    const c = candidate('trial', { channel: 'note', width: 1200, height: 630 });
    c.candidate!.width = 1280;
    c.candidate!.height = 1920;
    const square = image('square', {
      channel: 'x',
      file: 'choropleth-1200x630.png',
      width: 1080,
      height: 1080,
    });
    const unknown = image('unknown', { channel: 'x', file: '1200x630.png' });
    expect(exampleDimensions(square)?.ratio).toBe('1:1');
    expect(exampleDimensions(unknown)).toBeNull();
    expect(channelRatios([c, square, unknown], 'note')).toEqual(['2:3']);
    expect(channelExamples([c, square], 'note', '1.90:1')).toEqual([]);
    expect(channelExamples([c, square], 'note', '2:3')[0].image.id).toBe(
      'trial'
    );
    expect(
      exampleDimensions(image('svg', { viewBox: '0 0 1080 1350' }))?.ratio
    ).toBe('4:5');
    expect(
      exampleDimensions(image('invalid', { width: -1, height: 10 }))
    ).toBeNull();
  });
  it('does not show retired topic categories as visual examples', () => {
    const images = [
      image('x', { templateId: 'household', channel: 'x' }),
      image('ig', { templateId: 'household', channel: 'instagram' }),
      image('unreviewed-note', { templateId: 'household', channel: 'note' }),
    ];
    expect(channelExamples(images, 'x')).toHaveLength(0);
    expect(channelExamples(images, 'instagram')).toHaveLength(0);
    expect(channelExamples(images, 'note')).toHaveLength(0);
  });
  it('puts current candidates before existing images and never calls a stale approval approved', () => {
    const images = [
      image('original'),
      candidate('stale', { approved: true, candidateMatches: false }),
      candidate('trial'),
      candidate('approved', { approved: true }),
    ];
    const before = JSON.stringify(images);
    expect(templateExamples(images).map((e) => [e.image.id, e.state])).toEqual([
      ['approved', 'approved'],
      ['trial', 'candidate'],
      ['original', 'existing'],
    ]);
    expect(JSON.stringify(images)).toBe(before);
  });
  it('does not promote a rejected candidate or infer approval from the separate cover workflow', () => {
    const rejected = candidate('rejected');
    rejected.candidate!.review = {
      status: 'needs-revision',
      reason: 'labels overlap',
      original: true,
      mobile: false,
      data: true,
    };
    const cover = candidate('cover', {
      kind: 'cover',
      coverUrl: '/published-cover',
      coverCandidateUrl: '/unreviewed-cover',
    });
    const result = templateExamples([rejected, cover]);
    expect(result.every((e) => e.state === 'existing')).toBe(true);
    expect(result.map((e) => e.src)).not.toContain('/published-cover');
    expect(result).toHaveLength(1);
    expect(result.map((e) => e.src)).toContain(
      '/api/media-library/rejected/file'
    );
  });
  it('deduplicates the same asset and keeps missing or unclassified images out of basic forms', () => {
    const result = templateExamples([
      image('a', { original: { key: 'a.png', sha256: 'same' } }),
      image('b', { original: { key: 'b.png', sha256: 'same' } }),
      image('none', { original: null }),
      image('unknown', { templateId: 'unclassified' }),
    ]);
    expect(result.map((e) => e.image.id)).toEqual(['a']);
  });
  it('binds candidate links to an immutable revision and is stable across inventory order', () => {
    const images = [image('b'), candidate('c'), image('a'), image('d')];
    expect(templateExamples(images)).toEqual(
      templateExamples([...images].reverse())
    );
    expect(templateExamples(images)[0].src).toBe(
      '/api/media-library/c/file?revision=revision-c'
    );
  });
  it('preserves minority purpose/selection samples and does not mix table and bar counts', () => {
    const images = [
      ...Array.from({ length: 10 }, (_, n) =>
        image('bar-' + n, {
          channel: 'note',
          classification: {
            purpose: 'ranking',
            selection: 'top-bottom',
            status: 'confirmed',
          } as ImageView['classification'],
        })
      ),
      image('table', {
        templateId: 'table',
        channel: 'note',
        classification: {
          purpose: 'ranking',
          selection: 'top-bottom',
          status: 'confirmed',
        } as ImageView['classification'],
      }),
      image('comparison', {
        channel: 'note',
        classification: {
          purpose: 'comparison',
          selection: 'selected',
          status: 'confirmed',
        } as ImageView['classification'],
      }),
    ];
    const pool = templateSamplePool(images);
    expect(pool.counts['bar:ranking:top-bottom']).toBe(10);
    expect(pool.counts['table:ranking:top-bottom']).toBe(1);
    expect(pool.images.map((i) => i.id)).toContain('comparison');
  });
  it('never displays an old candidate under a newly assigned visual type', () => {
    const row = candidate('old-chart', {
      templateId: 'table',
      candidateMatches: false,
      width: 1200,
      height: 630,
    });
    row.candidate!.width = 1080;
    row.candidate!.height = 1350;
    const example = templateExamples([row])[0];
    expect(example.state).toBe('existing');
    expect(example.src).not.toContain('revision=');
    expect(channelRatios([{ ...row, channel: 'note' }], 'note')).toEqual([
      '1.90:1',
    ]);
  });
});
