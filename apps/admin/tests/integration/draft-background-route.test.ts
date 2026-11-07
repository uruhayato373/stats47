import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanupFixtureRoot, makeFixtureRoot } from '../helpers/fixture-root';
import { readDraftStates } from '../../../../.claude/scripts/issues/issue-draft-state.mjs';

let root: string;
afterEach(() => { if (root) cleanupFixtureRoot(root); vi.unstubAllEnvs(); });

describe('draft backgrounds', () => {
  it.each<{ paths: Record<string, string>; expected: string }>([
    { paths: { 'assets/blog/article-backgrounds/example.jpg': 'legacy' }, expected: 'legacy' },
    { paths: { 'assets/blog/fullbleed-backgrounds/example.jpg': 'fullbleed' }, expected: 'fullbleed' },
    { paths: { 'assets/blog/article-backgrounds/example.jpg': 'legacy', 'assets/blog/fullbleed-backgrounds/example.jpg': 'fullbleed' }, expected: 'fullbleed' },
  ])('serves $expected and clears the background waiting state', async ({ paths, expected }) => {
    root = makeFixtureRoot({ stateFiles: {
      ...paths,
      'contents/blog/example/article.md': '---\ntitle: Example\npublished: false\n---\n本文',
      'contents/blog/example/review.md': 'verdict: PASS',
    } });
    vi.stubEnv('STATS47_PROJECT_ROOT', root);
    vi.resetModules();
    const { GET } = await import('@/app/api/content/draft-file/[...path]/route');
    const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ path: ['background', 'example.jpg'] }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(await response.text()).toBe(expected);
    expect(readDraftStates(root, [{ destinations: [{ slug: 'example' }] }]).get('example')).toBe('公開待ち');
    const forbidden = await GET(new Request('http://localhost'), { params: Promise.resolve({ path: ['background', '..', 'example.jpg'] }) });
    expect(forbidden.status).toBe(403);
  });
});
