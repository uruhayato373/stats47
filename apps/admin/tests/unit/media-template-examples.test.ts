import { describe, expect, it } from 'vitest';
import {
  templateExamples,
  channelExamples,
  channelRatios,
  exampleDimensions,
  templateSamplePool,
} from '@/lib/media-template-examples';
import type { ImageView } from '../../../../.claude/scripts/media/lib/workspace.mjs';

function image(id: string, patch: Partial<ImageView> = {}): ImageView {
  return {
    id,
    templateId: 'ranking',
    original: { key: id + '.png', sha256: id },
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
  it('keeps cover originals in their own type and never uses an unreviewed cover candidate',()=>{
    const cover=image('cover',{kind:'cover',templateId:'note-cover',coverUrl:'/old-cover',coverCandidateUrl:'/new-cover'});
    const samples=templateExamples([cover]);
    expect(samples[0].src).toBe('/old-cover');expect(samples[0].state).toBe('existing');
    expect(templateExamples([image('pending',{templateId:'unclassified'}),image('stale',{classification:{status:'stale'} as ImageView['classification']})])).toEqual([]);
  });
  it('keeps every medium/ratio sample and full counts while reducing the browser payload', () => {
    const images = [
      ...Array.from({ length: 20 }, (_, n) =>
        image('square-' + n, { channel: 'x', width: 1080, height: 1080 })
      ),
      image('portrait', { channel: 'x', width: 1080, height: 1350 }),
      candidate('note', { channel: 'note' }),
      image('web', { templateId: 'svg-scatter', channel: 'web' }),
    ];
    const pool = templateSamplePool(images);
    expect(pool.counts).toEqual({ ranking: 22, 'svg-scatter': 1 });
    expect(pool.images.length).toBeLessThan(images.length);
    for (const channel of ['note', 'x', 'web']) {
      for (const ratio of ['', ...channelRatios(images, channel)]) {
        expect(
          channelExamples(pool.images, channel, ratio).map((e) => e.image.id)
        ).toEqual(
          channelExamples(images, channel, ratio).map((e) => e.image.id)
        );
      }
    }
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
  it('does not apply note legacy sample pins to SNS images of the same type', () => {
    const images = [
      image('x', { templateId: 'household', channel: 'x' }),
      image('ig', { templateId: 'household', channel: 'instagram' }),
      image('unreviewed-note', { templateId: 'household', channel: 'note' }),
    ];
    expect(channelExamples(images, 'x')).toHaveLength(1);
    expect(channelExamples(images, 'instagram')).toHaveLength(1);
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
      ['stale', 'stale'],
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
});
