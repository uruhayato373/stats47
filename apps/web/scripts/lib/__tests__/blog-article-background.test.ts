// @vitest-environment node
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createArticleImagegenRequest,
  ingestArticleBackgroundAsset,
  type BlogArticleImageContext,
} from '../blog-article-background';

const contexts: BlogArticleImageContext[] = [
  {
    slug: 'sixth-industry-direct-sales',
    title: '農業日本一の北海道は、農家総所得では何位なのか',
    description: '農業生産と直売の収入を比べる。',
    introduction: '畑や農場の規模と農家の所得を比べる。',
  },
  {
    slug: 'cc-estat-20-publish',
    title: 'Claude Code で作った47都道府県チャートを公開',
    description: 'Next.js と Cloudflare でグラフを公開する。',
    introduction: '棒グラフや散布図の画面を公開する。',
  },
  {
    slug: 'fiscal-self-reliance-gap',
    title: '財政力指数と自主財源比率の差',
    description: '都市と地方の財政を比較する。',
    introduction: '税収と財源の関係を考える。',
  },
];

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('article background composition contract', () => {
  it.each(contexts)(
    '$slug の記事文脈より無地領域と描画禁止を優先する',
    (context) => {
      const { prompt } = createArticleImagegenRequest(context);

      expect(prompt).toContain(context.title);
      expect(prompt).toMatch(/left 55 percent completely empty/i);
      expect(prompt).toMatch(/x=0 through x=660/i);
      expect(prompt).toMatch(/x=696 through x=1164/i);
      expect(prompt).toMatch(/no horizon/i);
      expect(prompt).toMatch(/screens.*blank.*no.*charts/i);
      expect(prompt).toMatch(/article context.*never overrides/i);
    }
  );

  it('公開手順はPCとサーバーだけに絞り、記事文脈の変更はhashに反映する', () => {
    const context = contexts[1];
    const request = createArticleImagegenRequest(context);
    const revised = createArticleImagegenRequest({
      ...context,
      title: '書き直した公開手順の記事',
    });

    expect(request.prompt).toMatch(/laptop.*blank dark screen.*server/i);
    expect(request.prompt).toMatch(/no maps, globes/i);
    expect(request.prompt).toMatch(/x=780 through x=1140/i);
    expect(revised.prompt).toContain('書き直した公開手順の記事');
    expect(revised.promptHash).not.toBe(request.promptHash);
  });

  it('旧prompt versionのrequestを拒否し、既存画像を書き換えない', async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'blog-article-background-'));
    temporaryDirectories.push(projectRoot);
    const inputPath = join(projectRoot, 'existing.jpg');
    const original = Buffer.from('existing image must remain unchanged');
    writeFileSync(inputPath, original);
    const context = contexts[0];
    const request = createArticleImagegenRequest(context);
    const assetPath = join(projectRoot, request.assetPath);
    mkdirSync(dirname(assetPath), { recursive: true });
    writeFileSync(assetPath, original);
    const oldHash = `sha256-${createHash('sha256')
      .update(
        JSON.stringify({
          model: request.model,
          promptVersion: 'blog-article-context-v1',
          prompt: request.prompt,
        })
      )
      .digest('hex')}`;

    await expect(
      ingestArticleBackgroundAsset({
        projectRoot,
        context,
        inputPath,
        promptHash: oldHash,
      })
    ).rejects.toThrow('prompt hashが記事内容と一致しません');
    expect(readFileSync(inputPath)).toEqual(original);
    expect(readFileSync(assetPath)).toEqual(original);
  });

  it('現在のrequestで取り込むと1200×630 JPEGと同じpromptHashを返す', async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'blog-article-background-'));
    temporaryDirectories.push(projectRoot);
    const inputPath = join(projectRoot, 'generated.png');
    await sharp({
      create: { width: 320, height: 200, channels: 3, background: '#f7f3eb' },
    })
      .png()
      .toFile(inputPath);
    const context = contexts[0];
    const request = createArticleImagegenRequest(context);

    const result = await ingestArticleBackgroundAsset({
      projectRoot,
      context,
      inputPath,
      promptHash: request.promptHash,
    });

    expect(result.promptHash).toBe(request.promptHash);
    expect(
      await sharp(join(projectRoot, result.assetPath)).metadata()
    ).toMatchObject({ format: 'jpeg', width: 1200, height: 630 });
  });
});
