import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import sharp from 'sharp';

import {
  BLOG_CODEX_BACKGROUND_ASSET_DIR,
  BLOG_CODEX_BACKGROUND_BY_SLUG,
  BLOG_CODEX_BACKGROUND_LEGACY_MODEL,
  BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION,
  BLOG_CODEX_BACKGROUND_MODEL,
  BLOG_CODEX_BACKGROUND_PROMPT_VERSION,
  BLOG_CODEX_BACKGROUND_PROVIDER,
  BLOG_CODEX_BACKGROUND_SCHEMA_VERSION,
  BLOG_CODEX_BACKGROUND_TOOL,
  buildCodexBackgroundPrompt,
  computeCodexBackgroundPromptHash,
  type BlogCodexBackgroundDef,
} from '../data/blog-codex-background-catalog';

import {
  BLOG_AI_BACKGROUND_HEIGHT,
  BLOG_AI_BACKGROUND_WIDTH,
} from './blog-ai-background-normalizer';
import { sha256 } from './image-generation-manifest';

export interface CodexMcpImagegenRequest {
  schemaVersion: number;
  slug: string;
  assetId: string;
  assetPath: string;
  prompt: string;
  promptHash: string;
  generation: {
    provider: string;
    tool: string;
    model: string;
    promptVersion: string;
  };
  output: {
    format: 'jpeg';
    width: number;
    height: number;
  };
  mcp: {
    tool: 'mcp__codex__codex';
    arguments: {
      cwd: '<REPO_ROOT>';
      sandbox: 'read-only';
      'approval-policy': 'never';
      prompt: string;
    };
  };
}

export interface BlogCodexCatalogValidation {
  slugs: number;
  assets: number;
  assetSha256: Readonly<Record<string, string>>;
}

export interface ResolvedCodexBackgroundSource {
  def: BlogCodexBackgroundDef;
  buffer: Buffer;
  sha256: string;
  prompt: string;
  promptHash: string;
  model: string;
  promptVersion: string;
  motif: string;
}

export function resolveCodexBackgroundAssetPath(
  projectRoot: string,
  def: BlogCodexBackgroundDef
): string {
  const assetRoot = resolve(projectRoot, BLOG_CODEX_BACKGROUND_ASSET_DIR);
  const assetPath = resolve(projectRoot, def.assetPath);
  const relativePath = relative(assetRoot, assetPath);
  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    relativePath.includes('/../') ||
    relativePath.includes('\\..\\')
  ) {
    throw new Error(`Codex背景asset pathが許可範囲外です: ${def.assetPath}`);
  }
  return assetPath;
}

export function buildCodexMcpImagegenPrompt(
  slug: string,
  def: BlogCodexBackgroundDef
): string {
  const prompt = buildCodexBackgroundPrompt(def);
  const promptHash = computeCodexBackgroundPromptHash(def);
  return [
    '<task>',
    `  <goal>Use $imagegen to generate exactly one blog background for ${slug}.</goal>`,
    '  <scope>Generate one image only. Do not edit repository files, run shell commands, publish to R2, or deploy.</scope>',
    `  <sources>Use the exact image prompt and prompt hash below. Prompt hash: ${promptHash}</sources>`,
    '  <done_when>The image generation tool returns one completed image and its absolute local path.</done_when>',
    '  <authorization>Image generation only.</authorization>',
    '</task>',
    '<output_format>Return one JSON object only with keys generated_image_path and prompt_hash. No markdown fences or prose.</output_format>',
    '<image_prompt>',
    prompt,
    '</image_prompt>',
  ].join('\n');
}

export function createCodexMcpImagegenRequest(
  slug: string
): CodexMcpImagegenRequest {
  const def = BLOG_CODEX_BACKGROUND_BY_SLUG[slug];
  if (!def) {
    throw new Error(
      `${slug}: blog-codex-background-catalog.ts に背景定義がありません`
    );
  }
  return {
    schemaVersion: BLOG_CODEX_BACKGROUND_SCHEMA_VERSION,
    slug,
    assetId: def.assetId,
    assetPath: def.assetPath,
    prompt: buildCodexBackgroundPrompt(def),
    promptHash: computeCodexBackgroundPromptHash(def),
    generation: {
      provider: BLOG_CODEX_BACKGROUND_PROVIDER,
      tool: BLOG_CODEX_BACKGROUND_TOOL,
      model: def.model,
      promptVersion: def.promptVersion,
    },
    output: {
      format: 'jpeg',
      width: BLOG_AI_BACKGROUND_WIDTH,
      height: BLOG_AI_BACKGROUND_HEIGHT,
    },
    mcp: {
      tool: 'mcp__codex__codex',
      arguments: {
        cwd: '<REPO_ROOT>',
        sandbox: 'read-only',
        'approval-policy': 'never',
        prompt: buildCodexMcpImagegenPrompt(slug, def),
      },
    },
  };
}

export async function normalizeCodexBackgroundInput(
  input: Buffer
): Promise<Buffer> {
  return sharp(input, { failOn: 'error' })
    .rotate()
    .resize(BLOG_AI_BACKGROUND_WIDTH, BLOG_AI_BACKGROUND_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .flatten({ background: '#f7f3eb' })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

export async function readValidatedCodexBackgroundAsset(
  projectRoot: string,
  def: BlogCodexBackgroundDef
): Promise<{ buffer: Buffer; sha256: string }> {
  const assetPath = resolveCodexBackgroundAssetPath(projectRoot, def);
  const buffer = readFileSync(assetPath);
  const metadata = await sharp(buffer, { failOn: 'error' }).metadata();
  if (
    metadata.format !== 'jpeg' ||
    metadata.width !== BLOG_AI_BACKGROUND_WIDTH ||
    metadata.height !== BLOG_AI_BACKGROUND_HEIGHT
  ) {
    throw new Error(
      `Codex背景画像契約が不正です: ${def.assetPath} ` +
        `(expected=jpeg ${BLOG_AI_BACKGROUND_WIDTH}x${BLOG_AI_BACKGROUND_HEIGHT}, ` +
        `actual=${metadata.format ?? '?'} ${metadata.width ?? '?'}x${metadata.height ?? '?'})`
    );
  }
  return { buffer, sha256: sha256(buffer) };
}

export async function resolveCodexBackgroundSource(
  projectRoot: string,
  slug: string
): Promise<ResolvedCodexBackgroundSource | null> {
  const def = BLOG_CODEX_BACKGROUND_BY_SLUG[slug];
  if (!def) return null;
  const asset = await readValidatedCodexBackgroundAsset(projectRoot, def);
  return {
    def,
    buffer: asset.buffer,
    sha256: asset.sha256,
    prompt: buildCodexBackgroundPrompt(def),
    promptHash: computeCodexBackgroundPromptHash(def),
    model: def.model,
    promptVersion: def.promptVersion,
    motif: `codex:${def.assetId}`,
  };
}

export async function ingestCodexBackgroundAsset(options: {
  projectRoot: string;
  slug: string;
  inputPath: string;
  promptHash: string;
}): Promise<{ assetPath: string; promptHash: string; sha256: string }> {
  const def = BLOG_CODEX_BACKGROUND_BY_SLUG[options.slug];
  if (!def) {
    throw new Error(
      `${options.slug}: blog-codex-background-catalog.ts に背景定義がありません`
    );
  }
  const expectedPromptHash = computeCodexBackgroundPromptHash(def);
  if (options.promptHash !== expectedPromptHash) {
    throw new Error(
      `${options.slug}: prompt hashが現在のSSOTと一致しません ` +
        `(expected=${expectedPromptHash}, actual=${options.promptHash})`
    );
  }
  const inputPath = resolve(options.inputPath);
  if (!existsSync(inputPath)) {
    throw new Error(`生成画像がありません: ${inputPath}`);
  }
  const outputPath = resolveCodexBackgroundAssetPath(options.projectRoot, def);
  const normalized = await normalizeCodexBackgroundInput(
    readFileSync(inputPath)
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, normalized);
  renameSync(temporaryPath, outputPath);
  const validated = await readValidatedCodexBackgroundAsset(
    options.projectRoot,
    def
  );
  return {
    assetPath: def.assetPath,
    promptHash: expectedPromptHash,
    sha256: validated.sha256,
  };
}

export async function validateCodexBackgroundCatalog(
  projectRoot: string
): Promise<BlogCodexCatalogValidation> {
  const byAssetId = new Map<string, BlogCodexBackgroundDef>();
  for (const [slug, def] of Object.entries(BLOG_CODEX_BACKGROUND_BY_SLUG)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      throw new Error(`Codex背景catalogのslugが不正です: ${slug}`);
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(def.assetId)) {
      throw new Error(`Codex背景catalogのassetIdが不正です: ${def.assetId}`);
    }
    const expectedPath = `${BLOG_CODEX_BACKGROUND_ASSET_DIR}/${def.assetId}.jpg`;
    if (def.assetPath !== expectedPath) {
      throw new Error(
        `${slug}: assetPathはassetIdから決定してください ` +
          `(expected=${expectedPath}, actual=${def.assetPath})`
      );
    }
    if (!def.subject.trim() || !def.detail.trim()) {
      throw new Error(`${slug}: subject/detailが空です`);
    }
    if (
      def.promptVersion !== BLOG_CODEX_BACKGROUND_PROMPT_VERSION &&
      def.promptVersion !== BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION
    ) {
      throw new Error(
        `${slug}: 未対応のCodex背景promptVersionです: ${def.promptVersion}`
      );
    }
    const expectedModel =
      def.promptVersion === BLOG_CODEX_BACKGROUND_LEGACY_PROMPT_VERSION
        ? BLOG_CODEX_BACKGROUND_LEGACY_MODEL
        : BLOG_CODEX_BACKGROUND_MODEL;
    if (def.model !== expectedModel) {
      throw new Error(
        `${slug}: modelとpromptVersionの組が不正です ` +
          `(expected=${expectedModel}, actual=${def.model})`
      );
    }
    const existing = byAssetId.get(def.assetId);
    if (
      existing &&
      (existing.assetPath !== def.assetPath ||
        existing.subject !== def.subject ||
        existing.detail !== def.detail)
    ) {
      throw new Error(
        `${def.assetId}: 同じassetIdに異なる背景定義があります`
      );
    }
    byAssetId.set(def.assetId, def);
  }

  const assetSha256: Record<string, string> = {};
  for (const def of byAssetId.values()) {
    const asset = await readValidatedCodexBackgroundAsset(projectRoot, def);
    assetSha256[def.assetId] = asset.sha256;
  }

  const assetRoot = resolve(projectRoot, BLOG_CODEX_BACKGROUND_ASSET_DIR);
  const trackedJpegs = existsSync(assetRoot)
    ? readdirSync(assetRoot)
        .filter((name) => name.endsWith('.jpg'))
        .sort()
    : [];
  const expectedJpegs = [...byAssetId.keys()]
    .map((assetId) => `${assetId}.jpg`)
    .sort();
  const orphaned = trackedJpegs.filter(
    (name) => !expectedJpegs.includes(name)
  );
  const missing = expectedJpegs.filter((name) => !trackedJpegs.includes(name));
  if (orphaned.length > 0 || missing.length > 0) {
    throw new Error(
      `Codex背景assetとcatalogが不一致です ` +
        `(orphaned=${orphaned.join(',') || '-'}, missing=${missing.join(',') || '-'})`
    );
  }

  return {
    slugs: Object.keys(BLOG_CODEX_BACKGROUND_BY_SLUG).length,
    assets: byAssetId.size,
    assetSha256,
  };
}
