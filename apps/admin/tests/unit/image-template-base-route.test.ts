import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ root: '' }));
vi.mock('@/lib/server/project-root', () => ({
  projectRoot: () => fixture.root,
}));
vi.mock('@/components/content/image-template-workspace', () => ({
  ImageTemplateWorkspace: () => null,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Error('redirect:' + url);
  },
}));
import Page from '@/app/ops/image-templates/page';
import { PATCH } from '@/app/api/media-templates/[id]/route';
import {
  ROOT,
  FILES,
  readTemplates,
  sha,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
describe('basic-form route does not require articles or image inventory', () => {
  beforeEach(() => {
    fixture.root = fs.mkdtempSync(
      path.join(os.tmpdir(), 'stats47-base-route-')
    );
    fs.mkdirSync(path.dirname(path.join(fixture.root, FILES.templates)), {
      recursive: true,
    });
    fs.copyFileSync(
      path.join(ROOT, FILES.templates),
      path.join(fixture.root, FILES.templates)
    );
  });
  afterEach(() => {
    const target = path.resolve(fixture.root);
    if (
      path.dirname(target) !== path.resolve(os.tmpdir()) ||
      !path.basename(target).startsWith('stats47-base-route-')
    )
      throw Error('Unexpected cleanup path');
    fs.rmSync(target, { recursive: true, force: true });
  });
  it('opens the basic form with only a type catalogue present', async () => {
    expect(
      await Page({
        searchParams: Promise.resolve({ template: 'bar', purpose: 'ranking' }),
      })
    ).toBeTruthy();
    expect(fs.existsSync(path.join(fixture.root, FILES.quality))).toBe(false);
  });
  it('normalizes an old article bookmark to the same type', async () => {
    await expect(
      Page({
        searchParams: Promise.resolve({
          template: 'bar',
          medium: 'compare',
          purpose: 'ranking',
          topic: 'asset-old',
        }),
      })
    ).rejects.toThrow(
      'redirect:/ops/image-templates?template=bar&purpose=ranking'
    );
  });
  it('returns a current revision after saving a type policy without reading article inventory', async () => {
    const template = readTemplates(fixture.root).templates.find(
      (t) => t.id === 'bar'
    )!;
    const response = await PATCH(
      new Request('http://127.0.0.1:4747/api/media-templates/bar', {
        method: 'PATCH',
        headers: {
          origin: 'http://127.0.0.1:4747',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          revision: sha(template),
          policy: template.policy + ' 基本形を検討する。',
          profiles: template.profiles,
        }),
      }),
      { params: Promise.resolve({ id: 'bar' }) }
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    const saved = readTemplates(fixture.root).templates.find(
      (t) => t.id === 'bar'
    )!;
    expect(
      result.templates.find((t: { id: string }) => t.id === 'bar').revision
    ).toBe(sha(saved));
    expect(saved.version).toBe(template.version + 1);
    expect(fs.existsSync(path.join(fixture.root, FILES.quality))).toBe(false);
  });
});
