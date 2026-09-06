#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, readdir,
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../..');
const CONFIG_PATH = path.join(PROJECT_ROOT, '.claude/config/source-vault.json');
const VAULT_SCRIPT = path.join(SCRIPT_DIR, 'source-vault.mjs');
const TEMP_VAULT_ROOT = path.join(tmpdir(), 'stats47-source-vault');
const BOOLEAN_OPTIONS = new Set(['force', 'contract-only', 'allow-all-pages', 'check']);
const MD_PAGE_KINDS = new Set(['text', 'figure', 'table', 'mixed', 'blank']);
const PDF_TOOLS = ['pdfinfo', 'pdftotext', 'pdftoppm', 'tesseract', 'magick'];

function usage() {
  return `Usage:
  node .claude/scripts/source-vault/source-processing.mjs readiness [--profile <name>] [--contract-only]
  node .claude/scripts/source-vault/source-processing.mjs prepare --profile <name> [--manifest <file>] [--source <dir>] [--output-dir <dir>]
  node .claude/scripts/source-vault/source-processing.mjs extract --workspace <dir> --document <id-or-path> --pages <selector> [--mode auto|text|ocr] [--dpi <n>] [--rotate 0|90|180|270] [--psm <0-13>] [--force]
  node .claude/scripts/source-vault/source-processing.mjs crop --workspace <dir> --spec <json> [--force]
  node .claude/scripts/source-vault/source-processing.mjs md-check --workspace <dir> [--md-dir <dir>] [--check]
  node .claude/scripts/source-vault/source-processing.mjs stage --workspace <dir> --revision <n> [--md-dir <dir>] [--force]
  node .claude/scripts/source-vault/source-processing.mjs stage-status [--profile <name>]
  node .claude/scripts/source-vault/source-processing.mjs cleanup --profile <name>

Page selectors: 1,3-5 or all (all requires --allow-all-pages).
Derived transcripts, page images, and crops stay under ${TEMP_VAULT_ROOT}/derived and are never public source assets.`;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    const key = arg.slice(2);
    if (BOOLEAN_OPTIONS.has(key)) {
      options[key] = true;
      continue;
    }
    const value = rest[index + 1];
    if (!value || value.startsWith('--'))
      throw new Error(`Missing value for ${arg}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function assertInside(base, target, label, { allowBase = false } = {}) {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedBase, resolvedTarget);
  if (
    (!allowBase && relative === '') ||
    relative.startsWith('..') ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `${label} must be inside ${resolvedBase}: ${resolvedTarget}`
    );
  }
  return resolvedTarget;
}

function assertOutsideRepository(target, label) {
  const resolved = path.resolve(target);
  const relative = path.relative(PROJECT_ROOT, resolved);
  if (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  ) {
    throw new Error(
      `${label} must be outside the public Git repository: ${resolved}`
    );
  }
  return resolved;
}

function safeRelativePath(value, label) {
  if (
    typeof value !== 'string' ||
    value === '' ||
    value.includes('\\') ||
    value.includes('\0')
  ) {
    throw new Error(`Unsafe ${label}: ${String(value)}`);
  }
  const segments = value.split('/');
  if (
    value.startsWith('/') ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    )
  ) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return value;
}

function safeId(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error(`${label} must be lowercase kebab-case: ${String(value)}`);
  }
  return value;
}

export function validateOcrLayout(rotation, psm) {
  const rotationDegrees = Number(rotation);
  const pageSegmentationMode = Number(psm);
  if (![0, 90, 180, 270].includes(rotationDegrees)) {
    throw new Error('OCR rotation must be one of 0, 90, 180, or 270');
  }
  if (
    !Number.isInteger(pageSegmentationMode) ||
    pageSegmentationMode < 0 ||
    pageSegmentationMode > 13
  ) {
    throw new Error('Tesseract --psm must be an integer from 0 to 13');
  }
  return { rotationDegrees, pageSegmentationMode };
}

/**
 * ページ画像の本文領域 (Kindle の UI 枠などを除く) を "WxH+X+Y" で宣言する。
 * 座標は render 後のフルページ画像の pixel。宣言は profile.processing.pageImage.contentCrop に置き、
 * page-dims.json へ記録して crop 座標の基準を追跡できるようにする。
 */
export function parseContentCrop(geometry) {
  if (geometry == null) return null;
  const match =
    typeof geometry === 'string' &&
    geometry.match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/);
  if (!match) throw new Error(`contentCrop must be WxH+X+Y: ${String(geometry)}`);
  const [width, height, x, y] = match.slice(1).map(Number);
  if (width < 1 || height < 1) throw new Error('contentCrop size must be positive');
  return { geometry, width, height, x, y };
}

export function validatePageImageContract(pageImage, label = 'pageImage') {
  if (pageImage == null) return null;
  if (typeof pageImage !== 'object') throw new Error(`${label} must be an object`);
  const dpi = Number(pageImage.dpi ?? 180);
  if (!Number.isInteger(dpi) || dpi < 72 || dpi > 600)
    throw new Error(`${label}.dpi must be an integer from 72 to 600`);
  const format = pageImage.format ?? 'png';
  if (!['png', 'jpg'].includes(format))
    throw new Error(`${label}.format must be png or jpg`);
  const quality = Number(pageImage.quality ?? 85);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100)
    throw new Error(`${label}.quality must be an integer from 1 to 100`);
  const contentCrop = parseContentCrop(pageImage.contentCrop);
  return { dpi, format, quality, contentCrop };
}

/**
 * md/pNNNN.md の frontmatter と本文を検査する純関数。書籍本文の内容は見ない (内部専用の文字起こしなので)。
 * 必須: page (ファイル名と一致) / kind (text|figure|table|mixed|blank)。figures は crop id の配列で、
 * 実在する crop に限る。blank 以外は本文が要る。
 */
export function validateMdPage({ fileName, frontmatter, body, knownFigureIds }) {
  const errors = [];
  const match = fileName.match(/^p(\d{4})\.md$/);
  if (!match) {
    errors.push(`file name must be pNNNN.md: ${fileName}`);
    return errors;
  }
  const page = Number(match[1]);
  if (Number(frontmatter.page) !== page)
    errors.push(`${fileName}: frontmatter.page must be ${page}`);
  if (!MD_PAGE_KINDS.has(frontmatter.kind))
    errors.push(`${fileName}: kind must be one of ${[...MD_PAGE_KINDS].join('|')}`);
  const figures = frontmatter.figures ?? [];
  const figureList = Array.isArray(figures)
    ? figures
    : String(figures)
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
  for (const id of figureList) {
    if (!knownFigureIds.has(id)) errors.push(`${fileName}: unknown figure id ${id}`);
  }
  if ((frontmatter.kind === 'figure' || frontmatter.kind === 'table') && figureList.length === 0) {
    errors.push(`${fileName}: kind ${frontmatter.kind} requires figures[]`);
  }
  if (frontmatter.kind !== 'blank' && body.replace(/\s/g, '').length === 0)
    errors.push(`${fileName}: body is empty`);
  return errors;
}

/**
 * manifest の componentCounts と inventory summary から処理段階の到達状況を決める純関数。
 * S0 保全 → S1 ページ画像 → S2 文字起こし (transcript / markdown) → S3 図クロップ → S4 台帳。
 */
export function stageStatus(manifest, summary) {
  const counts = manifest.componentCounts ?? {};
  const pages = summary?.input?.pages ?? null;
  const parity = (count) => (pages == null ? count > 0 : count >= pages);
  return {
    revision: manifest.revision,
    pages,
    stages: {
      s0Preserved: (counts.pdfs ?? 0) > 0,
      s1PageImages: parity(counts.pageImages ?? 0),
      s2Transcripts: parity(counts.transcripts ?? 0),
      s2Markdown: parity(counts.markdown ?? 0),
      s3Figures: (counts.figures ?? 0) > 0,
      s4Inventory: summary?.resolutionCoverage === 1,
    },
    counts,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function run(command, args, { cwd = PROJECT_ROOT } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, LANG: 'C', LC_ALL: 'C' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', (code) => {
      const result = {
        code,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      };
      if (code === 0) resolve(result);
      else
        reject(
          new Error(
            `${command} exited with code ${code}: ${result.stderr || result.stdout}`
          )
        );
    });
  });
}

async function loadConfig() {
  const config = await readJson(CONFIG_PATH);
  if (
    config.schemaVersion !== 2 ||
    !config.profiles ||
    typeof config.profiles !== 'object'
  ) {
    throw new Error(`Unsupported source vault config: ${CONFIG_PATH}`);
  }
  return config;
}

function profilePaths(profile) {
  const revision = `r${profile.revision}`;
  return {
    download: path.join(
      TEMP_VAULT_ROOT,
      'download',
      profile.sourceKey,
      profile.edition,
      revision
    ),
    source: path.join(
      TEMP_VAULT_ROOT,
      'work',
      profile.sourceKey,
      profile.edition,
      profile.sourceRootName
    ),
    derived: path.join(
      TEMP_VAULT_ROOT,
      'derived',
      profile.sourceKey,
      profile.edition,
      revision
    ),
  };
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return {};
  const end = markdown.indexOf('\n---\n', 4);
  if (end === -1) return {};
  const values = {};
  for (const line of markdown.slice(4, end).split('\n')) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function expectedDrivePath(config, profile) {
  return [
    config.driveCollectionFolder,
    profile.driveSourceFolderName,
    profile.driveEditionFolderName,
  ].join('/');
}

function validateProcessingContract(profileName, profile) {
  const processing = profile.processing;
  if (!processing || typeof processing !== 'object') {
    throw new Error(`Missing processing contract: ${profileName}`);
  }
  if (
    typeof profile.manifestPath !== 'string' ||
    !profile.manifestPath.startsWith('.claude/state/source-inventory/')
  ) {
    throw new Error(`Invalid manifestPath: ${profileName}`);
  }
  if (
    typeof processing.usageSpecPath !== 'string' ||
    !processing.usageSpecPath.startsWith('docs/02_実装計画/')
  ) {
    throw new Error(`Invalid usageSpecPath: ${profileName}`);
  }
  if (typeof processing.owner !== 'string' || processing.owner === '') {
    throw new Error(`Missing processing owner: ${profileName}`);
  }
  if (
    !Array.isArray(processing.ocrLanguages) ||
    processing.ocrLanguages.length === 0
  ) {
    throw new Error(`Missing OCR languages: ${profileName}`);
  }
  validateOcrLayout(
    processing.ocrRotationDegrees,
    processing.ocrPageSegmentationMode
  );
  if (
    JSON.stringify(processing.internalArtifacts) !==
    JSON.stringify(['transcript', 'page-image', 'crop'])
  ) {
    throw new Error(`Invalid internalArtifacts contract: ${profileName}`);
  }
  if (processing.publicOriginalReuse !== 'forbidden') {
    throw new Error(`publicOriginalReuse must be forbidden: ${profileName}`);
  }
  validatePageImageContract(processing.pageImage, `${profileName}.processing.pageImage`);
  if (
    !Array.isArray(processing.stats47Targets) ||
    processing.stats47Targets.length === 0
  ) {
    throw new Error(`Missing stats47Targets: ${profileName}`);
  }
  if (profile.bibliography != null) {
    for (const field of ['title', 'author', 'publisher', 'published', 'isbn']) {
      if (typeof profile.bibliography[field] !== 'string' || profile.bibliography[field] === '') {
        throw new Error(`Invalid bibliography ${field}: ${profileName}`);
      }
    }
    if (!/^https:\/\//.test(profile.bibliography.verifiedAt ?? '')) {
      throw new Error(`Invalid bibliography verifiedAt: ${profileName}`);
    }
  }
}

async function loadProfile(profileName) {
  const config = await loadConfig();
  const selected = profileName ?? config.defaultProfile;
  const profile = config.profiles[selected];
  if (!profile) throw new Error(`Unknown source vault profile: ${selected}`);
  validateProcessingContract(selected, profile);
  const manifestPath = assertInside(
    PROJECT_ROOT,
    path.join(PROJECT_ROOT, profile.manifestPath),
    'Manifest'
  );
  const manifest = await readJson(manifestPath);
  return { config, profileName: selected, profile, manifestPath, manifest };
}

async function checkProfileContract(config, profileName, profile) {
  validateProcessingContract(profileName, profile);
  const manifestPath = assertInside(
    PROJECT_ROOT,
    path.join(PROJECT_ROOT, profile.manifestPath),
    'Manifest'
  );
  const usageSpecPath = assertInside(
    PROJECT_ROOT,
    path.join(PROJECT_ROOT, profile.processing.usageSpecPath),
    'Usage specification'
  );
  const [manifest, usageSpec] = await Promise.all([
    readJson(manifestPath),
    readFile(usageSpecPath, 'utf8'),
  ]);
  const frontmatter = parseFrontmatter(usageSpec);
  const errors = [];
  const expectedPath = expectedDrivePath(config, profile);
  if (manifest.schemaVersion !== 1) errors.push('manifest schemaVersion');
  if (manifest.profile != null && manifest.profile !== profileName)
    errors.push('manifest profile');
  if (manifest.sourceKey !== profile.sourceKey)
    errors.push('manifest sourceKey');
  if (manifest.edition !== profile.edition) errors.push('manifest edition');
  if (manifest.revision !== profile.revision) errors.push('manifest revision');
  if (manifest.sourceRootName !== profile.sourceRootName)
    errors.push('manifest sourceRootName');
  if (manifest.storage?.provider !== 'google-drive')
    errors.push('manifest storage provider');
  if (manifest.storage?.visibility !== 'private')
    errors.push('manifest storage visibility');
  if (manifest.storage?.folderPath !== expectedPath)
    errors.push('manifest Drive path');
  if (
    !Array.isArray(manifest.bundle?.parts) ||
    manifest.bundle.parts.length === 0
  )
    errors.push('bundle parts');
  if (
    !Array.isArray(manifest.files) ||
    !manifest.files.some((file) => /\.pdf$/i.test(file.path))
  ) {
    errors.push('PDF input');
  }
  if (frontmatter.type !== 'implementation-spec')
    errors.push('usage spec type');
  if (frontmatter.status !== 'active') errors.push('usage spec status');
  if (!frontmatter.related_backlog) errors.push('usage spec related_backlog');
  if (!usageSpec.includes(profile.sourceKey))
    errors.push('usage spec sourceKey');
  if (errors.length > 0) {
    throw new Error(
      `${profileName} readiness contract failed: ${errors.join(', ')}`
    );
  }
  return {
    profile: profileName,
    sourceKey: profile.sourceKey,
    edition: profile.edition,
    revision: profile.revision,
    drivePath: expectedPath,
    manifestPath: profile.manifestPath,
    usageSpecPath: profile.processing.usageSpecPath,
    owner: profile.processing.owner,
    pdfCount: manifest.files.filter((file) => /\.pdf$/i.test(file.path)).length,
    targets: profile.processing.stats47Targets,
    publicOriginalReuse: profile.processing.publicOriginalReuse,
  };
}

async function checkToolchain(requiredLanguages) {
  const versionArgs = {
    pdfinfo: ['-v'],
    pdftotext: ['-v'],
    pdftoppm: ['-v'],
    tesseract: ['--version'],
    magick: ['-version'],
  };
  const tools = {};
  for (const tool of PDF_TOOLS) {
    const result = await run(tool, versionArgs[tool]);
    tools[tool] = (result.stdout || result.stderr).split('\n')[0].trim();
  }
  const languageResult = await run('tesseract', ['--list-langs']);
  const installed = new Set(
    languageResult.stdout
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const missing = [...requiredLanguages].filter(
    (language) => !installed.has(language)
  );
  if (missing.length > 0)
    throw new Error(`Missing Tesseract languages: ${missing.join(', ')}`);
  return { tools, ocrLanguages: [...requiredLanguages].sort() };
}

async function readiness(options) {
  const config = await loadConfig();
  const profileNames = options.profile
    ? [options.profile]
    : Object.keys(config.profiles);
  const profiles = [];
  const requiredLanguages = new Set();
  for (const profileName of profileNames) {
    const profile = config.profiles[profileName];
    if (!profile)
      throw new Error(`Unknown source vault profile: ${profileName}`);
    profiles.push(await checkProfileContract(config, profileName, profile));
    for (const language of profile.processing.ocrLanguages)
      requiredLanguages.add(language);
  }
  return {
    ready: true,
    contractOnly: Boolean(options['contract-only']),
    profiles,
    toolchain: options['contract-only']
      ? 'not-checked'
      : await checkToolchain(requiredLanguages),
  };
}

function parsePdfInfo(output, documentPath) {
  const pages = Number(output.match(/^Pages:\s+(\d+)$/m)?.[1]);
  if (!Number.isInteger(pages) || pages < 1)
    throw new Error(`pdfinfo did not report pages: ${documentPath}`);
  const pageSize = output.match(/^Page size:\s+(.+)$/m)?.[1] ?? null;
  const encrypted = output.match(/^Encrypted:\s+(.+)$/m)?.[1] ?? null;
  return { pages, pageSize, encrypted };
}

async function prepare(options) {
  if (!options.profile) throw new Error('prepare requires --profile');
  const {
    profileName,
    profile,
    manifestPath: configuredManifestPath,
  } = await loadProfile(options.profile);
  const paths = profilePaths(profile);
  const manifestPath = path.resolve(options.manifest ?? configuredManifestPath);
  const manifest = await readJson(manifestPath);
  if (
    manifest.sourceKey !== profile.sourceKey ||
    manifest.edition !== profile.edition ||
    manifest.revision !== profile.revision ||
    manifest.sourceRootName !== profile.sourceRootName
  ) {
    throw new Error(
      `Manifest does not match profile ${profileName}: ${manifestPath}`
    );
  }
  const sourceRoot = assertOutsideRepository(
    options.source ?? paths.source,
    'Source root'
  );
  const outputDir = assertInside(
    TEMP_VAULT_ROOT,
    options['output-dir'] ?? paths.derived,
    'Derived output'
  );
  if (path.basename(sourceRoot) !== profile.sourceRootName) {
    throw new Error(
      `Source root must be named ${profile.sourceRootName}: ${sourceRoot}`
    );
  }
  if (await pathExists(outputDir)) {
    if (!options.force)
      throw new Error(
        `Derived output already exists; use --force: ${outputDir}`
      );
    await rm(outputDir, { recursive: true, force: true });
  }
  await run(process.execPath, [
    VAULT_SCRIPT,
    'verify',
    '--profile',
    profileName,
    '--manifest',
    manifestPath,
    '--source',
    sourceRoot,
  ]);

  const documents = [];
  for (const file of manifest.files.filter((entry) =>
    /\.pdf$/i.test(entry.path)
  )) {
    safeRelativePath(file.path, 'PDF path');
    const absolutePath = assertInside(
      sourceRoot,
      path.join(sourceRoot, file.path),
      'PDF input'
    );
    const info = await run('pdfinfo', [absolutePath]);
    const textSample = await run('pdftotext', [
      '-f',
      '1',
      '-l',
      '1',
      '-layout',
      absolutePath,
      '-',
    ]);
    documents.push({
      id: `pdf-${file.sha256.slice(0, 12)}`,
      path: file.path,
      bytes: file.bytes,
      sha256: file.sha256,
      ...parsePdfInfo(info.stdout, file.path),
      firstPageTextCharacters: textSample.stdout.replace(/\s/g, '').length,
    });
  }
  const images = manifest.files
    .filter((entry) => /\.(?:png|jpe?g|webp|tiff?)$/i.test(entry.path))
    .map((entry) => ({
      path: entry.path,
      bytes: entry.bytes,
      sha256: entry.sha256,
    }));
  const workspace = {
    schemaVersion: 1,
    profile: profileName,
    sourceKey: profile.sourceKey,
    edition: profile.edition,
    revision: profile.revision,
    sourceRoot,
    sourceBundleSha256: manifest.bundle.sha256,
    usageSpecPath: profile.processing.usageSpecPath,
    publicOriginalReuse: 'forbidden',
    ocrLanguages: profile.processing.ocrLanguages,
    ocrRotationDegrees: profile.processing.ocrRotationDegrees,
    ocrPageSegmentationMode: profile.processing.ocrPageSegmentationMode,
    pageImage: validatePageImageContract(profile.processing.pageImage),
    documents,
    images,
    preparedAt: new Date().toISOString(),
  };
  const workspaceManifestPath = path.join(
    outputDir,
    'processing-manifest.json'
  );
  const cropTemplatePath = path.join(outputDir, 'crop-spec.template.json');
  await writeJson(workspaceManifestPath, workspace);
  await writeJson(cropTemplatePath, {
    schemaVersion: 1,
    profile: profileName,
    sourceKey: profile.sourceKey,
    edition: profile.edition,
    revision: profile.revision,
    sourceBundleSha256: manifest.bundle.sha256,
    internalUseOnly: true,
    publicOriginalReuse: 'forbidden',
    crops: [],
  });
  return {
    prepared: true,
    profile: profileName,
    outputDir,
    workspaceManifestPath,
    cropTemplatePath,
    documentCount: documents.length,
    imageCount: images.length,
  };
}

export function parsePageSelector(selector, pageCount, allowAllPages = false) {
  if (!Number.isInteger(pageCount) || pageCount < 1)
    throw new Error('Invalid PDF page count');
  if (selector === 'all') {
    if (!allowAllPages)
      throw new Error('Selecting all pages requires --allow-all-pages');
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (
    typeof selector !== 'string' ||
    !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(selector)
  ) {
    throw new Error(`Invalid page selector: ${String(selector)}`);
  }
  const pages = new Set();
  for (const token of selector.split(',')) {
    const [startText, endText] = token.split('-');
    const start = Number(startText);
    const end = Number(endText ?? startText);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Page selector is outside 1-${pageCount}: ${token}`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return [...pages].sort((left, right) => left - right);
}

async function loadWorkspace(workspaceDir) {
  const resolved = assertInside(
    TEMP_VAULT_ROOT,
    workspaceDir,
    'Processing workspace'
  );
  const manifestPath = path.join(resolved, 'processing-manifest.json');
  const workspace = await readJson(manifestPath);
  if (
    workspace.schemaVersion !== 1 ||
    workspace.publicOriginalReuse !== 'forbidden'
  ) {
    throw new Error(`Invalid processing workspace: ${manifestPath}`);
  }
  assertOutsideRepository(workspace.sourceRoot, 'Workspace source root');
  return { workspaceDir: resolved, workspace, manifestPath };
}

function findDocument(workspace, selector) {
  const document = workspace.documents.find(
    (entry) => entry.id === selector || entry.path === selector
  );
  if (!document) throw new Error(`Unknown PDF document: ${selector}`);
  return document;
}

async function renderPage(
  documentPath,
  page,
  dpi,
  outputPrefix,
  rotationDegrees = 0
) {
  await run('pdftoppm', [
    '-f',
    String(page),
    '-l',
    String(page),
    '-r',
    String(dpi),
    '-png',
    '-singlefile',
    documentPath,
    outputPrefix,
  ]);
  const outputPath = `${outputPrefix}.png`;
  if (!(await pathExists(outputPath)))
    throw new Error(`pdftoppm did not create ${outputPath}`);
  if (rotationDegrees !== 0) {
    const rotatedPath = `${outputPrefix}.rotated.png`;
    await run('magick', [
      outputPath,
      '-rotate',
      String(rotationDegrees),
      rotatedPath,
    ]);
    await rm(outputPath, { force: true });
    await run('magick', [rotatedPath, outputPath]);
    await rm(rotatedPath, { force: true });
  }
  return outputPath;
}

async function extract(options) {
  if (!options.workspace || !options.document || !options.pages) {
    throw new Error('extract requires --workspace, --document, and --pages');
  }
  const { workspaceDir, workspace } = await loadWorkspace(options.workspace);
  const document = findDocument(workspace, options.document);
  const mode = options.mode ?? 'auto';
  if (!new Set(['auto', 'text', 'ocr']).has(mode))
    throw new Error(`Invalid extraction mode: ${mode}`);
  const pageImageContract = workspace.pageImage ?? null;
  const dpi = Number(options.dpi ?? pageImageContract?.dpi ?? 180);
  if (!Number.isInteger(dpi) || dpi < 72 || dpi > 600)
    throw new Error('--dpi must be an integer from 72 to 600');
  const pageFormat = pageImageContract?.format ?? 'png';
  const contentCrop = pageImageContract?.contentCrop ?? null;
  const { rotationDegrees, pageSegmentationMode } = validateOcrLayout(
    options.rotate ?? workspace.ocrRotationDegrees ?? 0,
    options.psm ?? workspace.ocrPageSegmentationMode ?? 6
  );
  const pages = parsePageSelector(
    options.pages,
    document.pages,
    options['allow-all-pages']
  );
  const documentPath = assertInside(
    workspace.sourceRoot,
    path.join(
      workspace.sourceRoot,
      safeRelativePath(document.path, 'PDF path')
    ),
    'PDF input'
  );
  if ((await sha256File(documentPath)) !== document.sha256) {
    throw new Error(
      `PDF SHA-256 no longer matches the source manifest: ${document.path}`
    );
  }
  const pageDir = path.join(workspaceDir, 'pages', document.id);
  const transcriptDir = path.join(workspaceDir, 'transcripts', document.id);
  const extractionDir = path.join(workspaceDir, 'extractions');
  const extractionManifestPath = path.join(
    extractionDir,
    `${document.id}.json`
  );
  if ((await pathExists(extractionManifestPath)) && !options.force) {
    throw new Error(
      `Extraction already exists; use --force: ${extractionManifestPath}`
    );
  }
  await mkdir(pageDir, { recursive: true });
  await mkdir(transcriptDir, { recursive: true });
  const results = [];
  let fullPagePixels = null;
  for (const page of pages) {
    const pageName = `p${String(page).padStart(4, '0')}`;
    const renderedPng = path.join(pageDir, `${pageName}.png`);
    const pageImage = path.join(pageDir, `${pageName}.${pageFormat}`);
    const transcript = path.join(transcriptDir, `${pageName}.txt`);
    if (
      !options.force &&
      ((await pathExists(pageImage)) || (await pathExists(transcript)))
    ) {
      throw new Error(`Page output already exists; use --force: ${pageName}`);
    }
    await rm(pageImage, { force: true });
    await rm(renderedPng, { force: true });
    await rm(transcript, { force: true });
    await renderPage(
      documentPath,
      page,
      dpi,
      path.join(pageDir, pageName),
      rotationDegrees
    );
    if (fullPagePixels == null) {
      const dimensions = await run('magick', ['identify', '-format', '%w %h', renderedPng]);
      const [width, height] = dimensions.stdout.trim().split(/\s+/).map(Number);
      fullPagePixels = { width, height };
    }
    if (contentCrop) {
      if (
        contentCrop.x + contentCrop.width > fullPagePixels.width ||
        contentCrop.y + contentCrop.height > fullPagePixels.height
      ) {
        throw new Error(
          `contentCrop ${contentCrop.geometry} exceeds rendered page ${fullPagePixels.width}x${fullPagePixels.height}`
        );
      }
      const croppedPath = `${renderedPng}.cropped.png`;
      await run('magick', [renderedPng, '-crop', contentCrop.geometry, '+repage', croppedPath]);
      await rm(renderedPng, { force: true });
      await run('magick', [croppedPath, renderedPng]);
      await rm(croppedPath, { force: true });
    }
    if (pageFormat === 'jpg') {
      await run('magick', [renderedPng, '-quality', String(pageImageContract.quality), pageImage]);
      await rm(renderedPng, { force: true });
    }
    let engine = mode;
    if (mode === 'text' || mode === 'auto') {
      await run('pdftotext', [
        '-f',
        String(page),
        '-l',
        String(page),
        '-layout',
        documentPath,
        transcript,
      ]);
      const nativeText = await readFile(transcript, 'utf8');
      if (mode === 'auto' && nativeText.replace(/\s/g, '').length < 40)
        engine = 'ocr';
      else engine = 'pdftotext';
    }
    if (mode === 'ocr' || engine === 'ocr') {
      await rm(transcript, { force: true });
      await run('tesseract', [
        pageImage,
        transcript.slice(0, -4),
        '-l',
        workspace.ocrLanguages.join('+'),
        '--psm',
        String(pageSegmentationMode),
        'txt',
      ]);
      engine = 'tesseract';
    }
    const text = await readFile(transcript, 'utf8');
    results.push({
      page,
      engine,
      dpi,
      rotationDegrees,
      pageSegmentationMode,
      textCharacters: text.replace(/\s/g, '').length,
      pageImage: path
        .relative(workspaceDir, pageImage)
        .split(path.sep)
        .join('/'),
      pageImageSha256: await sha256File(pageImage),
      transcript: path
        .relative(workspaceDir, transcript)
        .split(path.sep)
        .join('/'),
      transcriptSha256: await sha256File(transcript),
    });
  }
  const pageDimsPath = path.join(workspaceDir, 'page-dims.json');
  const pageDims = (await pathExists(pageDimsPath)) ? await readJson(pageDimsPath) : {
    schemaVersion: 1,
    sourceKey: workspace.sourceKey,
    edition: workspace.edition,
    revision: workspace.revision,
    publicOriginalReuse: 'forbidden',
    documents: {},
  };
  pageDims.documents[document.id] = {
    path: document.path,
    pageCount: document.pages,
    render: { tool: 'pdftoppm', dpi, rotationDegrees, fullPagePixels },
    pageFormat,
    contentCrop: contentCrop
      ? {
          geometry: contentCrop.geometry,
          outputPixels: { width: contentCrop.width, height: contentCrop.height },
          note: 'pages/ の画像と crop 座標は contentCrop 適用後の pixel を基準にする',
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(pageDimsPath, pageDims);
  await writeJson(extractionManifestPath, {
    schemaVersion: 1,
    profile: workspace.profile,
    sourceKey: workspace.sourceKey,
    edition: workspace.edition,
    revision: workspace.revision,
    sourceBundleSha256: workspace.sourceBundleSha256,
    document: { id: document.id, path: document.path, sha256: document.sha256 },
    publicOriginalReuse: 'forbidden',
    pages: results,
    extractedAt: new Date().toISOString(),
  });
  return {
    extracted: true,
    document: document.path,
    extractionManifestPath,
    pages: results,
  };
}

export function validateCropSpec(spec, workspace) {
  const errors = [];
  if (spec.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  for (const field of [
    'profile',
    'sourceKey',
    'edition',
    'revision',
    'sourceBundleSha256',
  ]) {
    if (
      spec[field] !==
      workspace[field === 'sourceBundleSha256' ? 'sourceBundleSha256' : field]
    ) {
      errors.push(`${field} does not match the processing workspace`);
    }
  }
  if (spec.internalUseOnly !== true)
    errors.push('internalUseOnly must be true');
  if (spec.publicOriginalReuse !== 'forbidden')
    errors.push('publicOriginalReuse must be forbidden');
  if (!Array.isArray(spec.crops) || spec.crops.length === 0)
    errors.push('crops must contain at least one job');
  const ids = new Set();
  for (const [index, crop] of (spec.crops ?? []).entries()) {
    try {
      safeId(crop.id, `crops[${index}].id`);
      if (ids.has(crop.id)) errors.push(`duplicate crop id: ${crop.id}`);
      ids.add(crop.id);
    } catch (error) {
      errors.push(error.message);
    }
    const document = workspace.documents.find(
      (entry) => entry.id === crop.document || entry.path === crop.document
    );
    if (!document)
      errors.push(`unknown crop document: ${String(crop.document)}`);
    if (
      !Number.isInteger(crop.page) ||
      crop.page < 1 ||
      (document && crop.page > document.pages)
    ) {
      errors.push(`invalid crop page: ${String(crop.page)}`);
    }
    if (crop.box?.unit !== 'pixel')
      errors.push(`crop ${crop.id} box.unit must be pixel`);
    for (const field of ['x', 'y', 'width', 'height']) {
      const value = crop.box?.[field];
      if (
        !Number.isInteger(value) ||
        value < (field === 'width' || field === 'height' ? 1 : 0)
      ) {
        errors.push(`crop ${crop.id} box.${field} is invalid`);
      }
    }
    if (typeof crop.purpose !== 'string' || crop.purpose.trim() === '')
      errors.push(`crop ${crop.id} purpose is required`);
    if (typeof crop.sourceRef !== 'string' || crop.sourceRef.trim() === '')
      errors.push(`crop ${crop.id} sourceRef is required`);
    if (
      typeof crop.intendedStats47Use !== 'string' ||
      crop.intendedStats47Use.trim() === ''
    ) {
      errors.push(`crop ${crop.id} intendedStats47Use is required`);
    }
    if (crop.primarySourceRequired !== true)
      errors.push(`crop ${crop.id} primarySourceRequired must be true`);
  }
  if (errors.length > 0)
    throw new Error(`Crop specification failed:\n- ${errors.join('\n- ')}`);
  return spec;
}

async function crop(options) {
  if (!options.workspace || !options.spec)
    throw new Error('crop requires --workspace and --spec');
  const { workspaceDir, workspace } = await loadWorkspace(options.workspace);
  const specPath = assertInside(
    TEMP_VAULT_ROOT,
    options.spec,
    'Crop specification'
  );
  const spec = validateCropSpec(await readJson(specPath), workspace);
  const outputDir = path.join(workspaceDir, 'crops');
  const cropManifestPath = path.join(workspaceDir, 'crop-manifest.json');
  if ((await pathExists(cropManifestPath)) && !options.force) {
    throw new Error(
      `Crop manifest already exists; use --force: ${cropManifestPath}`
    );
  }
  await mkdir(outputDir, { recursive: true });
  const scratch = await mkdtemp(path.join(workspaceDir, '.crop-scratch-'));
  const results = [];
  try {
    for (const job of spec.crops) {
      const document = findDocument(workspace, job.document);
      const documentPath = assertInside(
        workspace.sourceRoot,
        path.join(
          workspace.sourceRoot,
          safeRelativePath(document.path, 'PDF path')
        ),
        'PDF input'
      );
      if ((await sha256File(documentPath)) !== document.sha256) {
        throw new Error(
          `PDF SHA-256 no longer matches the source manifest: ${document.path}`
        );
      }
      const dpi = Number(job.dpi ?? 180);
      if (!Number.isInteger(dpi) || dpi < 72 || dpi > 600)
        throw new Error(`Invalid dpi for crop ${job.id}`);
      const { rotationDegrees } = validateOcrLayout(
        job.rotate ?? workspace.ocrRotationDegrees ?? 0,
        workspace.ocrPageSegmentationMode ?? 6
      );
      const pagePath = await renderPage(
        documentPath,
        job.page,
        dpi,
        path.join(scratch, job.id),
        rotationDegrees
      );
      const dimensions = await run('magick', [
        'identify',
        '-format',
        '%w %h',
        pagePath,
      ]);
      const [pageWidth, pageHeight] = dimensions.stdout
        .trim()
        .split(/\s+/)
        .map(Number);
      const { x, y, width, height } = job.box;
      if (x + width > pageWidth || y + height > pageHeight) {
        throw new Error(
          `Crop ${job.id} exceeds rendered page ${pageWidth}x${pageHeight}: ${width}x${height}+${x}+${y}`
        );
      }
      const outputPath = path.join(outputDir, `${job.id}.png`);
      if ((await pathExists(outputPath)) && !options.force) {
        throw new Error(
          `Crop output already exists; use --force: ${outputPath}`
        );
      }
      await rm(outputPath, { force: true });
      await run('magick', [
        pagePath,
        '-crop',
        `${width}x${height}+${x}+${y}`,
        '+repage',
        outputPath,
      ]);
      results.push({
        id: job.id,
        document: document.path,
        page: job.page,
        dpi,
        rotationDegrees,
        box: job.box,
        purpose: job.purpose,
        sourceRef: job.sourceRef,
        intendedStats47Use: job.intendedStats47Use,
        primarySourceRequired: true,
        output: path
          .relative(workspaceDir, outputPath)
          .split(path.sep)
          .join('/'),
        sha256: await sha256File(outputPath),
      });
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
  await writeJson(cropManifestPath, {
    schemaVersion: 1,
    profile: workspace.profile,
    sourceKey: workspace.sourceKey,
    edition: workspace.edition,
    revision: workspace.revision,
    sourceBundleSha256: workspace.sourceBundleSha256,
    internalUseOnly: true,
    publicOriginalReuse: 'forbidden',
    crops: results,
    croppedAt: new Date().toISOString(),
  });
  return { cropped: true, cropManifestPath, crops: results };
}

function mdDirFor(workspaceDir, options) {
  return options['md-dir']
    ? assertOutsideRepository(options['md-dir'], 'Markdown directory')
    : path.join(workspaceDir, 'md');
}

async function knownFigureIds(workspaceDir) {
  const cropManifestPath = path.join(workspaceDir, 'crop-manifest.json');
  if (!(await pathExists(cropManifestPath))) return new Set();
  const manifest = await readJson(cropManifestPath);
  return new Set((manifest.crops ?? []).map((crop) => crop.id));
}

async function mdCheck(options) {
  if (!options.workspace) throw new Error('md-check requires --workspace');
  const { workspaceDir, workspace } = await loadWorkspace(options.workspace);
  const mdRoot = mdDirFor(workspaceDir, options);
  const figureIds = await knownFigureIds(workspaceDir);
  const documents = [];
  const errors = [];
  for (const document of workspace.documents) {
    const dir = workspace.documents.length === 1 ? mdRoot : path.join(mdRoot, document.id);
    const present = new Set();
    if (await pathExists(dir)) {
      for (const name of await readdir(dir)) {
        if (!/^p\d{4}\.md$/.test(name)) continue;
        const text = await readFile(path.join(dir, name), 'utf8');
        const frontmatter = parseFrontmatter(text);
        const end = text.startsWith('---\n') ? text.indexOf('\n---\n', 4) : -1;
        const body = end === -1 ? text : text.slice(end + 5);
        errors.push(...validateMdPage({ fileName: name, frontmatter, body, knownFigureIds: figureIds }));
        present.add(Number(name.slice(1, 5)));
      }
    }
    const missing = [];
    for (let page = 1; page <= document.pages; page += 1) if (!present.has(page)) missing.push(page);
    documents.push({
      id: document.id,
      path: document.path,
      pages: document.pages,
      markdown: present.size,
      coverage: present.size === 0 ? 0 : (document.pages - missing.length) / document.pages,
      missing: missing.slice(0, 20),
    });
  }
  const complete = errors.length === 0 && documents.every((entry) => entry.missing.length === 0);
  if (options.check && !complete) {
    throw new Error(`Markdown transcription incomplete:\n- ${[...errors, ...documents.filter((d) => d.missing.length).map((d) => `${d.path}: missing ${d.pages - d.markdown} pages`)].join('\n- ')}`);
  }
  return { checked: true, complete, mdRoot, documents, errors };
}

/**
 * 派生 workspace の pages / transcripts / crops / md / page-dims を、次の revision の bundle 用に
 * source root へ規約名で配置する。配置後に `source-vault create` で r<N> を作る。
 */
async function stage(options) {
  if (!options.workspace || !options.revision)
    throw new Error('stage requires --workspace and --revision');
  const { workspaceDir, workspace } = await loadWorkspace(options.workspace);
  const { profile } = await loadProfile(workspace.profile);
  const revision = Number(options.revision);
  if (!Number.isInteger(revision) || revision <= workspace.revision) {
    throw new Error(`--revision must be an integer greater than the processed revision r${workspace.revision}`);
  }
  if (profile.revision !== revision) {
    throw new Error(`Set profiles.${workspace.profile}.revision to ${revision} in .claude/config/source-vault.json before staging`);
  }
  const sourceRoot = assertOutsideRepository(workspace.sourceRoot, 'Source root');
  const single = workspace.documents.length === 1;
  const copies = [];
  async function copyTree(fromDir, toDir, filter) {
    if (!(await pathExists(fromDir))) return 0;
    let count = 0;
    for (const name of (await readdir(fromDir)).sort()) {
      if (!filter(name)) continue;
      await mkdir(toDir, { recursive: true });
      const target = path.join(toDir, name);
      if ((await pathExists(target)) && !options.force)
        throw new Error(`Staged file already exists; use --force: ${target}`);
      await copyFile(path.join(fromDir, name), target);
      count += 1;
    }
    return count;
  }
  for (const document of workspace.documents) {
    const sub = single ? '' : document.id;
    copies.push({
      document: document.id,
      pages: await copyTree(path.join(workspaceDir, 'pages', document.id), path.join(sourceRoot, 'pages', sub), (n) => /^p\d{4}\.(?:png|jpg)$/.test(n)),
      transcripts: await copyTree(path.join(workspaceDir, 'transcripts', document.id), path.join(sourceRoot, 'transcripts', sub), (n) => /^p\d{4}\.txt$/.test(n)),
      markdown: await copyTree(single ? mdDirFor(workspaceDir, options) : path.join(mdDirFor(workspaceDir, options), document.id), path.join(sourceRoot, 'md', sub), (n) => /^p\d{4}\.md$/.test(n)),
    });
  }
  const figures = await copyTree(path.join(workspaceDir, 'crops'), path.join(sourceRoot, 'figures'), (n) => /\.(?:png|jpg)$/.test(n));
  const auxiliary = [];
  for (const name of ['page-dims.json', 'crop-manifest.json']) {
    const from = path.join(workspaceDir, name);
    if (!(await pathExists(from))) continue;
    const target = path.join(sourceRoot, name);
    if ((await pathExists(target)) && !options.force)
      throw new Error(`Staged file already exists; use --force: ${target}`);
    await copyFile(from, target);
    auxiliary.push(name);
  }
  return {
    staged: true,
    profile: workspace.profile,
    revision,
    sourceRoot,
    copies,
    figures,
    auxiliary,
    next: `node .claude/scripts/source-vault/source-vault.mjs create --profile ${workspace.profile}`,
  };
}

async function stageStatusCommand(options) {
  const config = await loadConfig();
  const names = options.profile ? [options.profile] : Object.keys(config.profiles);
  const profiles = [];
  for (const name of names) {
    const profile = config.profiles[name];
    if (!profile) throw new Error(`Unknown source vault profile: ${name}`);
    const manifest = await readJson(path.join(PROJECT_ROOT, profile.manifestPath));
    const summaryPath = path.join(path.dirname(path.join(PROJECT_ROOT, profile.manifestPath)), 'summary.json');
    const summary = (await pathExists(summaryPath)) ? await readJson(summaryPath) : null;
    profiles.push({ profile: name, sourceKey: profile.sourceKey, edition: profile.edition, ...stageStatus(manifest, summary) });
  }
  return { profiles };
}

async function cleanup(options) {
  if (!options.profile) throw new Error('cleanup requires --profile');
  const { profileName, profile } = await loadProfile(options.profile);
  const paths = profilePaths(profile);
  const removed = [];
  for (const [kind, target] of Object.entries(paths)) {
    assertInside(TEMP_VAULT_ROOT, target, `Cleanup ${kind}`);
    const existed = await pathExists(target);
    await rm(target, { recursive: true, force: true });
    removed.push({ kind, path: target, existed });
  }
  return { cleaned: true, profile: profileName, removed };
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === 'help') {
    console.log(usage());
    return;
  }
  let result;
  if (command === 'readiness') result = await readiness(options);
  else if (command === 'prepare') result = await prepare(options);
  else if (command === 'extract') result = await extract(options);
  else if (command === 'crop') result = await crop(options);
  else if (command === 'md-check') result = await mdCheck(options);
  else if (command === 'stage') result = await stage(options);
  else if (command === 'stage-status') result = await stageStatusCommand(options);
  else if (command === 'cleanup') result = await cleanup(options);
  else throw new Error(`Unknown command: ${command}\n${usage()}`);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
