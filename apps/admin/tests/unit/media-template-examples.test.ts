import { describe, expect, it } from 'vitest';
import { templateExamples } from '@/lib/media-template-examples';
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
