// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ writes: new Map<string, string>(), existing: [] as string[], mkdir: vi.fn() }));
vi.mock('node:fs', async importOriginal => ({
  ...await importOriginal<object>(),
  existsSync: (file: string) => io.existing.some(suffix => file.endsWith(suffix)),
  readFileSync: () => '---\ntitle: 全面の記事\ndescription: 要約\n---\n導入',
  mkdirSync: io.mkdir,
  writeFileSync: (file: string, value: string) => io.writes.set(file, value),
}));
afterEach(() => { io.writes.clear(); io.existing = []; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('request-article writes a full-bleed request at the unchanged request path', async () => {
  vi.resetModules();
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'script', 'request-article', '--slug', 'new-example', '--article', '/tmp/article.md']);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('../../manage-blog-codex-backgrounds');
  await vi.waitFor(() => expect(io.writes.size).toBe(1));
  const [file, body] = [...io.writes][0];
  expect(file).toMatch(/\.local\/blog-imagegen\/requests\/new-example\.json$/);
  expect(JSON.parse(body)).toMatchObject({ assetPath: 'assets/blog/fullbleed-backgrounds/new-example.jpg', promptVersion: 'blog-photo-v1' });
});

it('queue excludes both local asset directories and published AI even with --force', async () => {
  vi.resetModules();
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'script', 'queue', '--force']);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  io.existing = ['assets/blog/article-backgrounds/legacy-example.jpg', 'assets/blog/fullbleed-backgrounds/full-example.jpg'];
  const slugs = ['legacy-example', 'full-example', 'published-example', 'missing-example'];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const body = url.endsWith('all.json') ? JSON.stringify(slugs.map(slug => ({ slug, published: true })))
      : url.endsWith('article.md') ? '---\ntitle: 新記事\n---\n本文'
      : JSON.stringify({ metadata: { background: url.includes('published-example') ? { source: 'ai', sha256: 'existing' } : { source: 'shared' } } });
    return new Response(body);
  }));
  await import('../../manage-blog-codex-backgrounds');
  await vi.waitFor(() => expect([...io.writes.keys()].some(file => file.endsWith('/queue.json'))).toBe(true));
  const queue = JSON.parse([...io.writes].find(([file]) => file.endsWith('/queue.json'))![1]);
  expect(queue.requests.map((request: { slug: string }) => request.slug)).toEqual(['missing-example']);
  expect(queue.requests[0].promptVersion).toBe('blog-photo-v1');
});
