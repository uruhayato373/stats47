// @vitest-environment node
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { blogRendererSources } from '../../data/image-generator-registry';
import { createArticleImagegenRequest, resolveArticleBackgroundSource } from '../blog-article-background';
import { FULLBLEED_SCENES, FULLBLEED_LIGHTING, createFullbleedImagegenRequest, fullbleedBackgroundScene, fullbleedBackgroundLighting, hasLocalArticleBackground, ingestFullbleedBackgroundAsset, resolvePreferredArticleBackgroundSource } from '../blog-fullbleed-background';
import { blogRendererSourcesForBackground, renderBlogImageBundleForBackground } from '../blog-fullbleed-render';
import { decideBlogBackgroundStatus } from '../blog-background-status';
import { calculateRendererHash, sha256 } from '../image-generation-manifest';
import { buildBlogExternalOgp } from '../blog-image-render';
import { renderToPng } from '../blog-thumbnail-render';
vi.mock('../blog-thumbnail-render', async importOriginal => ({ ...await importOriginal<object>(), renderToPng: vi.fn() }));
const dirs: string[] = [];
const root = () => { const dir = mkdtempSync(join(tmpdir(), 'fullbleed-')); dirs.push(dir); return dir; };
const context = { slug: 'example-article', title: '統計の問い', description: '要約', introduction: '導入' };
afterEach(() => { dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })); vi.clearAllMocks(); });
const jpeg = () => sharp({ create: { width: 1200, height: 630, channels: 3, background: '#C8553D' } }).jpeg().toBuffer();
const put = (dir: string, file: string, bytes: Buffer) => { const dest = join(dir, file); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, bytes); return dest; };
describe('full-bleed article backgrounds', () => {
  it('selects the specified scenes and lighting deterministically from the slug', () => {
    const scenes = new Set<string>();
    const lighting = new Set<string>();
    expect(FULLBLEED_SCENES).toHaveLength(8);
    expect(FULLBLEED_LIGHTING).toHaveLength(4);
    for (let i = 0; i < 100; i++) {
      const slug = `article-${i}`;
      const hash = createHash('sha256').update(slug).digest('hex');
      expect(fullbleedBackgroundScene(slug)).toBe(FULLBLEED_SCENES[parseInt(hash.slice(0, 8), 16) % 8]);
      expect(fullbleedBackgroundLighting(slug)).toBe(FULLBLEED_LIGHTING[parseInt(hash.slice(8, 10), 16) % 4]);
      scenes.add(fullbleedBackgroundScene(slug));
      lighting.add(fullbleedBackgroundLighting(slug));
    }
    expect(scenes.size).toBe(8);
    expect(lighting.size).toBe(4);
    const request = createFullbleedImagegenRequest(context);
    expect(request).toMatchObject({ promptVersion: 'blog-photo-v2', model: 'gpt-image-2', assetPath: 'assets/blog/fullbleed-backgrounds/example-article.jpg' });
    for (const value of [context.title, context.description, context.introduction, fullbleedBackgroundScene(context.slug), fullbleedBackgroundLighting(context.slug)]) expect(request.prompt).toContain(value);
    expect(request.prompt).not.toMatch(/left 55|rightmost|x=780|empty title|solid colour field|background colour|#[0-9a-f]{6}/i);
    expect(request.prompt).toContain('Use case: photorealistic-natural');
    expect(request.prompt).toContain('people, body parts, hands, faces, animals in distress, buildings, shops, vehicles on roads, streets, landscapes, or any place.');
    expect(request.prompt).toContain('recognisable real places or landmarks');
    expect(request.prompt).toContain('Device and document constraints:');
    expect(createFullbleedImagegenRequest(context)).toEqual(request);
    expect(createFullbleedImagegenRequest({ ...context, title: 'changed' }).promptHash).not.toBe(request.promptHash);
  });
  it('preserves the legacy resolution and fingerprint until a full-bleed asset exists', async () => {
    const dir = root(); const bytes = await jpeg();
    expect(hasLocalArticleBackground(dir, context.slug)).toBe(false);
    expect(await resolvePreferredArticleBackgroundSource(dir, context)).toBeNull();
    put(dir, createArticleImagegenRequest(context).assetPath, bytes);
    const legacy = await resolveArticleBackgroundSource(dir, context);
    expect(await resolvePreferredArticleBackgroundSource(dir, context)).toEqual(legacy);
    expect(blogRendererSourcesForBackground(legacy!.promptVersion)).toEqual(blogRendererSources('ai'));
    expect(hasLocalArticleBackground(dir, context.slug)).toBe(true);
    put(dir, createFullbleedImagegenRequest(context).assetPath, bytes);
    const full = await resolvePreferredArticleBackgroundSource(dir, context);
    expect(full!.promptVersion).toBe('blog-photo-v2');
    expect(blogRendererSourcesForBackground(full!.promptVersion)).toEqual([...blogRendererSources('ai'), 'apps/web/scripts/lib/blog-fullbleed-render.ts']);
    const project = resolve(import.meta.dirname, '../../../../..');
    expect(calculateRendererHash(project, blogRendererSourcesForBackground(full!.promptVersion))).not.toBe(calculateRendererHash(project, blogRendererSources('ai')));
  });
  it('ingests only a matching request and validates the full-bleed image', async () => {
    const dir = root(); const request = createFullbleedImagegenRequest(context);
    const inputPath = put(dir, 'input.jpg', await jpeg());
    await expect(ingestFullbleedBackgroundAsset({ projectRoot: dir, context, inputPath, promptHash: 'old' })).rejects.toThrow('prompt hash');
    await ingestFullbleedBackgroundAsset({ projectRoot: dir, context, inputPath, promptHash: request.promptHash });
    expect(hasLocalArticleBackground(dir, context.slug)).toBe(true);
    expect(await sharp(join(dir, request.assetPath)).metadata()).toMatchObject({ width: 1200, height: 630, format: 'jpeg' });
    put(dir, request.assetPath, Buffer.from('bad image'));
    await expect(resolvePreferredArticleBackgroundSource(dir, context)).rejects.toThrow();
  });
  it('flattens transparent input onto neutral white', async () => {
    const dir = root(); const request = createFullbleedImagegenRequest(context);
    const transparent = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const inputPath = put(dir, 'transparent.png', transparent);
    await ingestFullbleedBackgroundAsset({ projectRoot: dir, context, inputPath, promptHash: request.promptHash });
    const { data, info } = await sharp(join(dir, request.assetPath)).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(3);
    expect(data.every(value => value === 255)).toBe(true);
  });
  it('renders the entire image into identical light/dark bytes and retains external OGP', async () => {
    const dir = root();
    const bytes = await sharp(await jpeg()).composite([{ input: Buffer.from('<svg width="1200" height="630"><rect width="180" height="630" fill="#24807F"/><circle cx="1000" cy="315" r="150" fill="#DFA32B"/></svg>') }]).jpeg().toBuffer();
    const data = { title: '題名', subtitle: '副題' };
    const outputs = { light: join(dir, 'light.webp'), dark: join(dir, 'dark.webp'), ogp: join(dir, 'ogp.png'), background: join(dir, 'background.jpg') };
    await renderBlogImageBundleForBackground('blog-photo-v2', { data, fonts: [], outputs, aiBackground: { buffer: bytes, sha256: sha256(bytes) } });
    const expected = await sharp(bytes).resize(640, 336, { fit: 'fill' }).webp({ quality: 62, effort: 6 }).toBuffer();
    expect(readFileSync(outputs.light)).toEqual(expected);
    expect(readFileSync(outputs.dark)).toEqual(expected);
    expect(readFileSync(outputs.background)).toEqual(bytes);
    expect(renderToPng).toHaveBeenCalledWith(buildBlogExternalOgp(data), [], outputs.ogp);
    await expect(renderBlogImageBundleForBackground('blog-photo-v2', { data, fonts: [], outputs, aiBackground: { buffer: bytes, sha256: 'wrong' } })).rejects.toThrow('SHA');
  });
  it('accepts full-bleed assets without a legacy or published background', () => {
    expect(decideBlogBackgroundStatus({ slug: context.slug, articlePath: 'article.md', hasFullbleedAsset: true, hasArticleAsset: false, hasCodexCatalog: false, publishedBackground: null, currentPromptHashes: [] })).toEqual({ kind: 'fullbleed-asset', ok: true });
  });
});
