import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  BLOG_CODEX_BACKGROUND_BY_SLUG,
  BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION,
  BLOG_CODEX_BACKGROUND_MODEL,
  BLOG_CODEX_BACKGROUND_PROMPT_VERSION,
  buildCodexBackgroundPrompt,
  computeCodexBackgroundPromptHash,
} from '../../data/blog-codex-background-catalog';
import {
  createCodexMcpImagegenRequest,
  ingestCodexBackgroundAsset,
  normalizeCodexBackgroundInput,
  resolveCodexBackgroundSource,
  resolveCodexBackgroundAssetPath,
  validateCodexBackgroundCatalog,
} from '../blog-codex-background-workflow';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('blog Codex background catalog', () => {
  it('新着24記事を23個の単一モチーフ背景へ割り当てる', () => {
    const definitions = Object.values(BLOG_CODEX_BACKGROUND_BY_SLUG);

    expect(definitions).toHaveLength(24);
    expect(new Set(definitions.map((def) => def.assetId)).size).toBe(23);
    expect(
      BLOG_CODEX_BACKGROUND_BY_SLUG[
        'tuna-consumption-quantity-vs-national-medical-expense-per'
      ]
    ).toBe(
      BLOG_CODEX_BACKGROUND_BY_SLUG[
        'tuna-consumption-quantity-vs-annual-new-inpatients-general'
      ]
    );
  });

  it('全背景がJPEG 1200x630で、タイトル安全域を持つプロンプトを記録する', async () => {
    for (const def of Object.values(BLOG_CODEX_BACKGROUND_BY_SLUG)) {
      const assetPath = resolve(PROJECT_ROOT, def.assetPath);
      expect(existsSync(assetPath), def.assetPath).toBe(true);

      const metadata = await sharp(readFileSync(assetPath)).metadata();
      expect(
        {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
        },
        def.assetPath
      ).toEqual({ format: 'jpeg', width: 1200, height: 630 });

      const prompt = buildCodexBackgroundPrompt(def);
      if (def.promptVersion === BLOG_CODEX_BACKGROUND_PROMPT_VERSION) {
        expect(prompt).toContain('1200 by 630');
      } else {
        expect(def.promptVersion).toBe(
          BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION
        );
        expect(prompt).not.toContain('1200 by 630');
      }
      expect(prompt).toContain('LEFT 62 PERCENT');
      expect(prompt).toContain('RIGHTMOST 35 PERCENT');
      expect(computeCodexBackgroundPromptHash(def)).toMatch(
        /^sha256-[0-9a-f]{64}$/
      );
    }
  });

  it('Codex MCP requestをSSOTから決定的に構築する', () => {
    const slug =
      'tuna-consumption-quantity-vs-national-medical-expense-per';
    const request = createCodexMcpImagegenRequest(slug);

    expect(request.generation.model).toBe(BLOG_CODEX_BACKGROUND_MODEL);
    expect(request.mcp.tool).toBe('mcp__codex__codex');
    expect(request.mcp.arguments).toMatchObject({
      cwd: '<REPO_ROOT>',
      sandbox: 'read-only',
      'approval-policy': 'never',
    });
    expect(request.mcp.arguments.prompt).toContain('Use $imagegen');
    expect(request.mcp.arguments.prompt).toContain(request.promptHash);
    expect(request.mcp.arguments.prompt).toContain(request.prompt);
    expect(request.mcp.arguments.prompt).toContain(
      'Do not edit repository files'
    );
    expect(request.promptHash).toBe(
      'sha256-c2e6d0367f9f2903161a9efae89a6390ac281338965f62b881648b0d3b2da18e'
    );
    expect(
      computeCodexBackgroundPromptHash(
        BLOG_CODEX_BACKGROUND_BY_SLUG[
          'avg-height-high-school-2nd-male-vs-fish-pickled-consumption'
        ]
      )
    ).toBe(
      'sha256-714dee31405607965494c6860aba33c5909759273e298be4237e4047f73db9fe'
    );
  });

  it('cloud/staged generatorが共有する背景sourceを解決する', async () => {
    const source = await resolveCodexBackgroundSource(
      PROJECT_ROOT,
      'tuna-consumption-quantity-vs-national-medical-expense-per'
    );

    expect(source).toMatchObject({
      model: BLOG_CODEX_BACKGROUND_MODEL,
      promptVersion: BLOG_CODEX_BACKGROUND_PROMPT_VERSION,
      motif: 'codex:tuna',
      promptHash:
        'sha256-c2e6d0367f9f2903161a9efae89a6390ac281338965f62b881648b0d3b2da18e',
    });
    expect(source?.buffer.byteLength).toBeGreaterThan(0);
    expect(source?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stale prompt hashの画像取り込みを拒否する', async () => {
    await expect(
      ingestCodexBackgroundAsset({
        projectRoot: PROJECT_ROOT,
        slug: 'tuna-consumption-quantity-vs-national-medical-expense-per',
        inputPath: '/tmp/not-used.png',
        promptHash: 'sha256-stale',
      })
    ).rejects.toThrow(/prompt hashが現在のSSOTと一致しません/);
  });

  it('catalogとtracked assetの1対1対応を検証する', async () => {
    const result = await validateCodexBackgroundCatalog(PROJECT_ROOT);

    expect(result.slugs).toBe(24);
    expect(result.assets).toBe(23);
    expect(Object.keys(result.assetSha256)).toHaveLength(23);
    expect(
      Object.values(result.assetSha256).every((value) =>
        /^[0-9a-f]{64}$/.test(value)
      )
    ).toBe(true);
  });

  it('入力画像を決定的なJPEG 1200x630契約へ正規化する', async () => {
    const input = await sharp({
      create: {
        width: 320,
        height: 320,
        channels: 4,
        background: '#2f4f75',
      },
    })
      .png()
      .toBuffer();
    const output = await normalizeCodexBackgroundInput(input);
    const metadata = await sharp(output).metadata();

    expect({
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
    }).toEqual({ format: 'jpeg', width: 1200, height: 630 });
  });

  it('catalog assetのpath traversalを拒否する', () => {
    expect(() =>
      resolveCodexBackgroundAssetPath(PROJECT_ROOT, {
        assetId: 'invalid',
        assetPath: '../outside.jpg',
        subject: 'one object',
        detail: 'none',
        model: BLOG_CODEX_BACKGROUND_MODEL,
        promptVersion: BLOG_CODEX_BACKGROUND_PROMPT_VERSION,
      })
    ).toThrow(/許可範囲外/);
  });
});
