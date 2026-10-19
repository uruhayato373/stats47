import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ root: '' }));
vi.mock('@/lib/server/project-root', () => ({
  projectRoot: () => fixture.root,
}));
vi.mock('@/lib/server/content-quality', () => ({ saveVisualReview: vi.fn() }));
import { GET, PATCH } from '@/app/api/media-library/[id]/route';
import {
  ROOT,
  FILES,
  imageLibrary,
  readQuality,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';

describe('image classification route uses the shared ledger', () => {
  beforeEach(() => {
    fixture.root = fs.mkdtempSync(
      path.join(os.tmpdir(), 'stats47-classification-route-')
    );
    for (const rel of [
      ...Object.values(FILES),
      'data/note/articles.json',
      'data/note/magazines.json',
      'data/note/cover-assets.json',
      'data/sns/posts.json',
    ]) {
      // 在庫索引の正本は private R2 (live/ は gitignore)。CI のように未取得なら写さず、空の在庫として読ませる
      if (!fs.existsSync(path.join(ROOT, rel))) continue;
      fs.mkdirSync(path.dirname(path.join(fixture.root, rel)), {
        recursive: true,
      });
      fs.copyFileSync(path.join(ROOT, rel), path.join(fixture.root, rel));
    }
    fs.writeFileSync(
      path.join(fixture.root, FILES.quality),
      JSON.stringify({ schemaVersion: 1, reviews: {}, images: {} })
    );
  });
  afterEach(() => {
    const target = path.resolve(fixture.root);
    if (
      path.dirname(target) !== path.resolve(os.tmpdir()) ||
      !path.basename(target).startsWith('stats47-classification-route-')
    )
      throw Error('Unexpected test cleanup path');
    fs.rmSync(target, { recursive: true, force: true });
  });
  function patch(id: string, body: unknown, origin = 'http://127.0.0.1:4757') {
    return PATCH(
      new Request('http://127.0.0.1:4757/api/media-library/' + id, {
        method: 'PATCH',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) }
    );
  }
  it('saves classification evidence, reads it back, and rejects stale or foreign writers', async () => {
    const image = imageLibrary(fixture.root).images.find(
      (i) => i.kind !== 'cover'
    )!;
    const body = {
      action: 'plan',
      revision: image.revision,
      templateId: 'diagram',
      role: 'diagram',
      reason: '実画像の矢印と手順を確認',
      purpose: 'explanation',
      selection: 'na',
      policy: '文字を拡大',
    };
    expect((await patch(image.id, body, 'https://example.com')).status).toBe(
      403
    );
    expect(Object.keys(readQuality(fixture.root).images)).toHaveLength(0);
    const response = await patch(image.id, body);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.classification.status).toBe('confirmed');
    expect(result.tasks).not.toContain('classification');
    const read = await GET(new Request('http://127.0.0.1:4757'), {
      params: Promise.resolve({ id: image.id }),
    });
    expect((await read.json()).record.classification.reason).toBe(body.reason);
    expect((await patch(image.id, body)).status).toBe(409);
    expect(readQuality(fixture.root).images[image.id].templateId).toBe(
      'diagram'
    );
  });
  it('allows policy-only work on pending images and prevents invalid classification', async () => {
    const image = imageLibrary(fixture.root).images.find(
      (i) => i.templateId === 'unclassified' && i.kind !== 'cover'
    )!;
    const bad = await patch(image.id, {
      action: 'plan',
      revision: image.revision,
      templateId: 'ranking',
      role: 'chart',
      reason: ' ',
      policy: '修正',
    });
    expect(bad.status).toBe(400);
    const good = await patch(image.id, {
      action: 'policy',
      revision: image.revision,
      policy: '原本と固定入力を回収する',
    });
    expect(good.status).toBe(200);
    expect((await good.json()).classification.status).toBe('pending');
  });
  it('persists generic comparison links without changing classification, image basis or publication', async () => {
    const images = imageLibrary(fixture.root).images;
    const image = images.find((i) => i.kind !== 'cover' && !i.previewOnly)!;
    const other = images.find(
      (i) =>
        i.id !== image.id &&
        i.kind !== 'cover' &&
        !i.previewOnly &&
        i.templateId === image.templateId &&
        i.classification.purpose === image.classification.purpose &&
        i.classification.selection === image.classification.selection
    )!;
    const plan = {
      key: 'electric-demand-2024',
      title: '電力需要',
      sharedChannels: ['web', 'x'],
      reason: '同じ固定入力・項目・年・単位を使用',
    };
    const payload = {
      action: 'comparison',
      revision: image.revision,
      comparison: plan,
    };
    expect((await patch(image.id, payload, 'https://example.com')).status).toBe(
      403
    );
    const sources = fs.readFileSync(
      path.join(fixture.root, 'data/sns/posts.json'),
      'utf8'
    );
    const result = await patch(image.id, payload);
    expect(result.status).toBe(200);
    const saved = await result.json();
    expect(saved.record.comparison).toEqual(plan);
    expect(saved.basis).toBe(image.basis);
    expect(saved.classification).toEqual(image.classification);
    expect(saved.original).toEqual(image.original);
    expect(saved.approved).toBe(image.approved);
    expect((await patch(image.id, payload)).status).toBe(409);
    expect(
      (
        await patch(other.id, {
          ...payload,
          revision: other.revision,
          comparison: { ...plan, title: '別の図' },
        })
      ).status
    ).toBe(400);
    expect(
      (await patch(other.id, { ...payload, revision: other.revision })).status
    ).toBe(200);
    expect(
      (
        await patch(image.id, {
          action: 'comparison',
          revision: saved.revision,
          comparison: null,
        })
      ).status
    ).toBe(200);
    expect(
      fs.readFileSync(path.join(fixture.root, 'data/sns/posts.json'), 'utf8')
    ).toBe(sources);
    expect(
      (
        await patch(other.id, {
          ...payload,
          comparison: { ...plan, sharedChannels: ['email'] },
        })
      ).status
    ).toBe(400);
  });
});
