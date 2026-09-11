#!/usr/bin/env node

/**
 * 参考文献 private vault CLI (expanded layout)
 *
 * Google Drive のローカルマウント上 `stats47/参考文献/<資料名>/<版>/` に、原本 PDF・ページ画像・
 * 文字起こし・図クロップを展開したまま置く。tar bundle と `r<N>` の不変 archive は 2026-09-10 に廃止した
 * (分割の唯一の根拠だった Drive MCP の 100MB 上限がマウント経由では無関係になったため)。
 *
 *   create   source root (OS 一時領域) を歩いて Git manifest を書く
 *   upload   manifest に載る file を vault directory へ複製し、readback で sha256 を照合する
 *   verify   manifest と source root / vault directory の全 file を sha256 で照合する
 *   restore  vault directory を OS 一時領域の work directory へ複製し、複製後に照合する
 *   vault-root  マウントの解決結果を表示する
 *   check-local repo 内に原本が残っていないことを確認する
 *
 * 正典: .claude/rules/reference-source-standards.md §2 / §3
 */

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync } from 'node:fs';
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../..');
const PROFILE_CONFIG_PATH = path.join(
  PROJECT_ROOT,
  '.claude',
  'config',
  'source-vault.json'
);
export const VAULT_ROOT_ENV = 'STATS47_SOURCE_VAULT_ROOT';
const MANIFEST_SCHEMA_VERSION = 2;
// vault directory に置くが manifest の files[] には含めない補助 file
const VAULT_IGNORED_NAMES = new Set(['.DS_Store', 'desktop.ini', 'Icon\r']);
const VAULT_MANIFEST_PATTERN = /^stats47-[a-z0-9-]+\.manifest\.json$/;

let DRIVE_ROOT_FOLDER;
let DRIVE_COLLECTION_FOLDER;
let PROFILE_NAME;
let SOURCE_KEY;
let EDITION;
let REVISION;
let SOURCE_ROOT_NAME;
let MANIFEST_FILE_NAME;
let DEFAULT_SOURCE;
let DEFAULT_OUTPUT_DIR;
let DRIVE_FOLDER_PATH;

function sourceWorkPath(sourceKey, edition, sourceRootName) {
  return path.join(
    tmpdir(),
    'stats47-source-vault',
    'work',
    sourceKey,
    edition,
    sourceRootName
  );
}

/**
 * Google Drive のローカルマウント上の `stats47` folder を解決する。
 * env が最優先で、無ければ OS ごとの既知のマウント先を順に試す。
 * 日本語ロケールの Drive アプリは `My Drive` ではなく `マイドライブ` を作る (2026-09-10 実測)。
 */
export function resolveVaultRoot({
  env = process.env,
  platform = process.platform,
  homeDir = homedir(),
  exists = existsSync,
  listDir = (dir) => readdirSync(dir),
  rootFolder = DRIVE_ROOT_FOLDER ?? 'stats47',
  collectionFolder = DRIVE_COLLECTION_FOLDER ?? '参考文献',
} = {}) {
  const marker = collectionFolder;
  const tried = [];
  const isVault = (root) => exists(path.join(root, marker));

  if (env[VAULT_ROOT_ENV]) {
    const root = env[VAULT_ROOT_ENV].replace(/[\\/]+$/, '');
    if (isVault(root)) return { root, source: `env:${VAULT_ROOT_ENV}` };
    throw new Error(
      `${VAULT_ROOT_ENV}=${root} does not contain ${marker}/ (env is authoritative; candidates are not tried)`
    );
  }

  const candidates = [];
  const driveFolderNames = ['マイドライブ', 'My Drive'];
  if (platform === 'darwin') {
    const cloud = path.join(homeDir, 'Library', 'CloudStorage');
    let mounts = [];
    try {
      mounts = listDir(cloud).filter((name) => name.startsWith('GoogleDrive-'));
    } catch {
      mounts = [];
    }
    for (const mount of mounts)
      for (const driveFolder of driveFolderNames)
        candidates.push(path.join(cloud, mount, driveFolder, rootFolder));
  }
  if (platform === 'win32') {
    for (const letter of ['G', 'H', 'I'])
      for (const driveFolder of driveFolderNames)
        candidates.push(path.join(`${letter}:\\`, driveFolder, rootFolder));
  }
  for (const driveFolder of driveFolderNames)
    candidates.push(path.join(homeDir, 'Google Drive', driveFolder, rootFolder));

  for (const candidate of candidates) {
    tried.push(candidate);
    if (isVault(candidate)) return { root: candidate, source: 'candidate' };
  }
  throw new Error(
    `Google Drive vault root not found. Set ${VAULT_ROOT_ENV} to the mounted ${rootFolder}/ folder. Tried:\n- ${tried.join('\n- ')}`
  );
}

function vaultDirectory() {
  const { root } = resolveVaultRoot();
  return path.join(root, DRIVE_COLLECTION_FOLDER, ...DRIVE_FOLDER_PATH.split('/').slice(1));
}

async function activateProfile(profileName) {
  const config = JSON.parse(await readFile(PROFILE_CONFIG_PATH, 'utf8'));
  if (
    config.schemaVersion !== 2 ||
    !config.profiles ||
    typeof config.profiles !== 'object'
  ) {
    throw new Error(`Invalid source vault config: ${PROFILE_CONFIG_PATH}`);
  }
  if (config.driveRootFolder !== 'stats47') {
    throw new Error(
      `Source vault driveRootFolder must be stats47: ${PROFILE_CONFIG_PATH}`
    );
  }
  if (config.driveCollectionFolder !== '参考文献') {
    throw new Error(
      `Source vault driveCollectionFolder must be 参考文献: ${PROFILE_CONFIG_PATH}`
    );
  }
  DRIVE_ROOT_FOLDER = config.driveRootFolder;
  DRIVE_COLLECTION_FOLDER = config.driveCollectionFolder;
  PROFILE_NAME = profileName ?? config.defaultProfile;
  const profile = config.profiles[PROFILE_NAME];
  if (!profile) {
    throw new Error(`Unknown source vault profile: ${PROFILE_NAME}`);
  }
  for (const field of [
    'sourceKey',
    'edition',
    'sourceRootName',
    'driveSourceFolderName',
    'driveEditionFolderName',
  ]) {
    if (typeof profile[field] !== 'string' || profile[field] === '') {
      throw new Error(
        `Invalid ${field} in source vault profile: ${PROFILE_NAME}`
      );
    }
  }
  if (!Number.isInteger(profile.revision) || profile.revision < 1) {
    throw new Error(
      `Invalid revision in source vault profile: ${PROFILE_NAME}`
    );
  }
  if (
    !/^[a-z0-9][a-z0-9-]*$/.test(profile.sourceKey) ||
    !/^[a-z0-9][a-z0-9-]*$/.test(profile.edition)
  ) {
    throw new Error(
      `Unsafe sourceKey or edition in source vault profile: ${PROFILE_NAME}`
    );
  }
  assertSafeFileName(profile.sourceRootName, 'profile sourceRootName');
  assertSafeFileName(
    profile.driveSourceFolderName,
    'profile driveSourceFolderName'
  );
  assertSafeFileName(
    profile.driveEditionFolderName,
    'profile driveEditionFolderName'
  );
  SOURCE_KEY = profile.sourceKey;
  EDITION = profile.edition;
  REVISION = profile.revision;
  SOURCE_ROOT_NAME = profile.sourceRootName;
  DRIVE_FOLDER_PATH = [
    DRIVE_COLLECTION_FOLDER,
    profile.driveSourceFolderName,
    profile.driveEditionFolderName,
  ].join('/');
  MANIFEST_FILE_NAME = `stats47-${SOURCE_KEY}-${EDITION}.manifest.json`;
  DEFAULT_SOURCE = sourceWorkPath(SOURCE_KEY, EDITION, SOURCE_ROOT_NAME);
  DEFAULT_OUTPUT_DIR = path.join(
    tmpdir(),
    'stats47-source-vault',
    SOURCE_KEY,
    EDITION,
    `r${REVISION}`
  );
}

function usage() {
  return `Usage:
  node .claude/scripts/source-vault/source-vault.mjs create [options]
  node .claude/scripts/source-vault/source-vault.mjs upload [options]
  node .claude/scripts/source-vault/source-vault.mjs verify [options]
  node .claude/scripts/source-vault/source-vault.mjs restore [options]
  node .claude/scripts/source-vault/source-vault.mjs vault-root
  node .claude/scripts/source-vault/source-vault.mjs check-local

create options:
  --profile <name>     Source profile from .claude/config/source-vault.json (default: ${PROFILE_NAME})
  --source <dir>       Source directory (default: ${DEFAULT_SOURCE})
  --manifest <file>    Manifest output (default: ${DEFAULT_OUTPUT_DIR}/${MANIFEST_FILE_NAME})
  --force              Replace an existing manifest

upload options:
  --manifest <file>    Required manifest
  --source <dir>       Source directory to copy from (default: ${DEFAULT_SOURCE})
  --force              Overwrite vault files whose sha256 differs from the manifest

verify options:
  --manifest <file>    Required manifest
  --source <dir>       Verify a local source directory against the manifest
  --vault              Verify the Drive vault directory against the manifest

restore options:
  --manifest <file>    Required manifest
  --target <dir>       Restore target (default: OS temp source work directory)

Drive destination: ${DRIVE_ROOT_FOLDER}/${DRIVE_FOLDER_PATH}  (mount: ${VAULT_ROOT_ENV} or auto-detected)
Files are private source material. Do not place them inside the Git repository.`;
}

async function checkLocalResidue() {
  const forbidden = [
    'books',
    path.join('docs', 'books'),
    path.join('.claude', 'pdfs'),
  ];
  const existing = [];
  for (const relativePath of forbidden) {
    if (await pathExists(path.join(PROJECT_ROOT, relativePath)))
      existing.push(relativePath);
  }
  if (existing.length > 0) {
    throw new Error(
      `Private reference material must not persist in the repository: ${existing.join(', ')}`
    );
  }
  return {
    clean: true,
    checkedPaths: ['books/', 'docs/books/', '.claude/pdfs/'],
  };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === '--force' || arg === '--vault') {
      options[arg.slice(2)] = true;
      continue;
    }
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    const value = rest[index + 1];
    if (!value || value.startsWith('--'))
      throw new Error(`Missing value for ${arg}`);
    options[arg.slice(2)] = value;
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

function assertOutsideRepository(target, label) {
  const relative = path.relative(PROJECT_ROOT, path.resolve(target));
  if (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  ) {
    throw new Error(
      `${label} must be outside the public Git repository: ${target}`
    );
  }
}

function normalizeRelative(filePath) {
  // macOS (APFS / Drive マウント) は日本語ファイル名を NFD で返すことがあるため、manifest(NFC) と
  // 実ファイル一覧の照合を NFC に揃える (2026-09-05 に restore が「missing / unexpected」で失敗した)。
  const normalized = filePath.split(path.sep).join('/').normalize('NFC');
  if (
    normalized === '' ||
    normalized.startsWith('/') ||
    normalized.split('/').includes('..')
  ) {
    throw new Error(`Unsafe relative path: ${filePath}`);
  }
  return normalized;
}

function assertSafeFileName(value, label) {
  if (
    typeof value !== 'string' ||
    value === '' ||
    value === '.' ||
    value === '..' ||
    value.includes('/') ||
    value.includes('\\') ||
    value.includes('\0')
  ) {
    throw new Error(`Unsafe ${label}: ${String(value)}`);
  }
}

function assertSafeManifestPath(value, label) {
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

function isVaultAuxiliary(name) {
  return VAULT_IGNORED_NAMES.has(name) || VAULT_MANIFEST_PATTERN.test(name);
}

/**
 * root 配下の全 file を manifest 形式 ({path,bytes,sha256}) で集める。
 * `absolute` は復元・複製で実体を開くために保持し、manifest には書かない。
 */
async function collectFiles(root, { ignoreAuxiliary = false, hash = true } = {}) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'ja'));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (VAULT_IGNORED_NAMES.has(entry.name)) continue;
      if (ignoreAuxiliary && current === root && isVaultAuxiliary(entry.name))
        continue;
      if (entry.isSymbolicLink())
        throw new Error(`Symlink is not allowed in source vault: ${absolute}`);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        const relative = normalizeRelative(path.relative(root, absolute));
        const fileStat = await stat(absolute);
        files.push({
          path: relative,
          bytes: fileStat.size,
          sha256: hash ? await sha256File(absolute) : null,
          absolute,
        });
      } else {
        throw new Error(`Unsupported filesystem entry: ${absolute}`);
      }
    }
  }
  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path, 'ja'));
}

function stripAbsolute(files) {
  return files.map(({ path: filePath, bytes, sha256 }) => ({
    path: filePath,
    bytes,
    sha256,
  }));
}

function componentCounts(files) {
  const counts = {
    markdown: 0,
    figures: 0,
    pageImages: 0,
    ocrRaw: 0,
    transcripts: 0,
    pdfs: 0,
    auxiliary: 0,
  };
  for (const file of files) {
    if (file.path.startsWith('md/') && file.path.endsWith('.md'))
      counts.markdown += 1;
    else if (file.path.startsWith('figures/')) counts.figures += 1;
    else if (file.path.startsWith('pages/')) counts.pageImages += 1;
    else if (file.path.startsWith('ocr-raw/')) counts.ocrRaw += 1;
    else if (file.path.startsWith('transcripts/')) counts.transcripts += 1;
    else if (
      !file.path.includes('/') &&
      file.path.toLowerCase().endsWith('.pdf')
    )
      counts.pdfs += 1;
    else counts.auxiliary += 1;
  }
  return counts;
}

/** 全 file の path と sha256 から決定的に導く内容 hash。processing workspace が同一性の照合に使う。 */
export function contentSha256(files) {
  const hash = createHash('sha256');
  for (const file of [...files].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0
  )) {
    hash.update(`${file.path}\n${file.sha256}\n`);
  }
  return hash.digest('hex');
}

async function readManifest(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (
    manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
    typeof manifest.sourceKey !== 'string' ||
    typeof manifest.edition !== 'string' ||
    !Number.isInteger(manifest.revision) ||
    typeof manifest.sourceRootName !== 'string' ||
    manifest.storage?.layout !== 'expanded' ||
    typeof manifest.storage?.folderPath !== 'string' ||
    typeof manifest.contentSha256 !== 'string' ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error(
      `Unsupported or invalid manifest (schemaVersion ${MANIFEST_SCHEMA_VERSION}, storage.layout expanded required): ${manifestPath}`
    );
  }
  if (
    !/^[a-z0-9][a-z0-9-]*$/.test(manifest.sourceKey) ||
    !/^[a-z0-9][a-z0-9-]*$/.test(manifest.edition)
  ) {
    throw new Error(`Unsafe sourceKey or edition in manifest: ${manifestPath}`);
  }
  assertSafeFileName(manifest.sourceRootName, 'manifest sourceRootName');
  const filePaths = new Set();
  for (const file of manifest.files) {
    assertSafeManifestPath(file.path, 'manifest file path');
    if (filePaths.has(file.path))
      throw new Error(`Duplicate manifest file path: ${file.path}`);
    filePaths.add(file.path);
  }
  if (contentSha256(manifest.files) !== manifest.contentSha256)
    throw new Error(`Manifest contentSha256 does not match files[]: ${manifestPath}`);
  return manifest;
}

function compareFiles(actualFiles, manifest, label) {
  const expectedByPath = new Map(
    manifest.files.map((file) => [file.path, file])
  );
  const actualByPath = new Map(actualFiles.map((file) => [file.path, file]));
  const errors = [];
  for (const expected of manifest.files) {
    const actual = actualByPath.get(expected.path);
    if (!actual) errors.push(`missing file: ${expected.path}`);
    else if (
      actual.bytes !== expected.bytes ||
      actual.sha256 !== expected.sha256
    ) {
      errors.push(`content mismatch: ${expected.path}`);
    }
  }
  for (const actual of actualFiles) {
    if (!expectedByPath.has(actual.path))
      errors.push(`unexpected file: ${actual.path}`);
  }
  if (actualFiles.length !== manifest.fileCount) {
    errors.push(
      `file count: expected=${manifest.fileCount} actual=${actualFiles.length}`
    );
  }
  if (errors.length > 0) {
    const visible = errors.slice(0, 20);
    const suffix =
      errors.length > visible.length
        ? `\n- ... ${errors.length - visible.length} more`
        : '';
    throw new Error(
      `${label} verification failed:\n- ${visible.join('\n- ')}${suffix}`
    );
  }
  return {
    fileCount: actualFiles.length,
    componentCounts: componentCounts(actualFiles),
  };
}

async function verifySource(sourcePath, manifest) {
  return compareFiles(await collectFiles(sourcePath), manifest, 'Source');
}

async function verifyVault(manifest) {
  const vaultDir = vaultDirectory();
  if (!(await pathExists(vaultDir)))
    throw new Error(`Vault directory does not exist: ${vaultDir}`);
  const result = compareFiles(
    await collectFiles(vaultDir, { ignoreAuxiliary: true }),
    manifest,
    'Vault'
  );
  return { vaultDir, ...result };
}

async function createManifest(options) {
  const sourcePath = path.resolve(options.source ?? DEFAULT_SOURCE);
  assertOutsideRepository(sourcePath, 'Source directory');
  const manifestPath = path.resolve(
    options.manifest ?? path.join(DEFAULT_OUTPUT_DIR, MANIFEST_FILE_NAME)
  );
  const sourceStat = await stat(sourcePath);
  if (!sourceStat.isDirectory())
    throw new Error(`Source is not a directory: ${sourcePath}`);
  if (path.basename(sourcePath).normalize('NFC') !== SOURCE_ROOT_NAME) {
    throw new Error(
      `Source root must be named ${SOURCE_ROOT_NAME}: ${sourcePath}`
    );
  }
  if ((await pathExists(manifestPath)) && !options.force) {
    throw new Error(
      `Manifest already exists (use --force to replace generated output): ${manifestPath}`
    );
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const files = stripAbsolute(await collectFiles(sourcePath));
  if (files.length === 0)
    throw new Error(`Source directory is empty: ${sourcePath}`);
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    profile: PROFILE_NAME,
    sourceKey: SOURCE_KEY,
    edition: EDITION,
    revision: REVISION,
    sourceRootName: SOURCE_ROOT_NAME,
    storage: {
      provider: 'google-drive',
      visibility: 'private',
      layout: 'expanded',
      folderPath: DRIVE_FOLDER_PATH,
    },
    contentSha256: contentSha256(files),
    fileCount: files.length,
    componentCounts: componentCounts(files),
    createdAt: new Date().toISOString(),
    files,
  };
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  return { sourcePath, manifestPath, manifest };
}

function progress(done, total, label) {
  if (done === total || done % 100 === 0)
    process.stderr.write(`${label}: ${done}/${total}\n`);
}

/**
 * source root の file を vault directory へ複製する。sha256 が一致する file は触らない。
 * 複製後に vault 側を読み戻して manifest と照合する (マウントへの書き込みとクラウド同期の完了は別なので、
 * ここで保証できるのはローカルマウント上の実体まで)。
 */
async function upload(options) {
  if (!options.manifest) throw new Error('--manifest is required');
  const manifest = await readManifest(path.resolve(options.manifest));
  const sourcePath = path.resolve(options.source ?? DEFAULT_SOURCE);
  assertOutsideRepository(sourcePath, 'Source directory');
  await verifySource(sourcePath, manifest);
  const vaultDir = vaultDirectory();
  await mkdir(vaultDir, { recursive: true });
  const existing = new Map(
    (await collectFiles(vaultDir, { ignoreAuxiliary: true, hash: false })).map(
      (file) => [file.path, file]
    )
  );
  const summary = { copied: 0, unchanged: 0, replaced: 0 };
  let done = 0;
  for (const file of manifest.files) {
    const target = path.join(vaultDir, ...file.path.split('/'));
    const current = existing.get(file.path);
    if (current) {
      const currentSha = await sha256File(current.absolute);
      if (currentSha === file.sha256 && current.bytes === file.bytes) {
        summary.unchanged += 1;
        done += 1;
        progress(done, manifest.files.length, 'upload');
        continue;
      }
      if (!options.force) {
        throw new Error(
          `Vault file differs from manifest; use --force to overwrite: ${file.path}`
        );
      }
      summary.replaced += 1;
    } else {
      summary.copied += 1;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(sourcePath, ...file.path.split('/')), target);
    done += 1;
    progress(done, manifest.files.length, 'upload');
  }
  const extra = [...existing.keys()].filter(
    (filePath) => !manifest.files.some((file) => file.path === filePath)
  );
  await writeFile(
    path.join(vaultDir, MANIFEST_FILE_NAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  const readback = await verifyVault(manifest);
  return {
    uploaded: true,
    vaultDir,
    ...summary,
    unexpectedInVault: extra,
    readback,
    note: 'Local mount verified. Cloud sync completes asynchronously; confirm in Drive before deleting local copies.',
  };
}

async function verify(options) {
  if (!options.manifest) throw new Error('--manifest is required');
  if (!options.vault && !options.source) {
    throw new Error('Provide --source and/or --vault');
  }
  const manifestPath = path.resolve(options.manifest);
  const manifest = await readManifest(manifestPath);
  const result = {
    manifestPath,
    sourceKey: manifest.sourceKey,
    edition: manifest.edition,
    revision: manifest.revision,
    contentSha256: manifest.contentSha256,
  };
  if (options.source)
    result.source = await verifySource(path.resolve(options.source), manifest);
  if (options.vault) result.vault = await verifyVault(manifest);
  return result;
}

async function restore(options) {
  if (!options.manifest) throw new Error('restore requires --manifest');
  const manifestPath = path.resolve(options.manifest);
  const manifest = await readManifest(manifestPath);
  const targetPath = path.resolve(
    options.target ??
      sourceWorkPath(
        manifest.sourceKey,
        manifest.edition,
        manifest.sourceRootName
      )
  );
  assertOutsideRepository(targetPath, 'Restore target');
  if (await pathExists(targetPath))
    throw new Error(
      `Restore target already exists; refusing to overwrite: ${targetPath}`
    );
  const vaultDir = vaultDirectory();
  const vaultFiles = await collectFiles(vaultDir, {
    ignoreAuxiliary: true,
    hash: false,
  });
  const byPath = new Map(vaultFiles.map((file) => [file.path, file]));
  const missing = manifest.files
    .filter((file) => !byPath.has(file.path))
    .map((file) => file.path);
  if (missing.length > 0) {
    throw new Error(
      `Vault is missing ${missing.length} manifest file(s):\n- ${missing.slice(0, 20).join('\n- ')}`
    );
  }
  const parent = path.dirname(targetPath);
  await mkdir(parent, { recursive: true });
  const staging = path.join(
    parent,
    `.source-vault-restore-${process.pid}-${Date.now()}`
  );
  await mkdir(staging, { recursive: false });
  try {
    let done = 0;
    for (const file of manifest.files) {
      const target = path.join(staging, ...file.path.split('/'));
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(byPath.get(file.path).absolute, target);
      done += 1;
      progress(done, manifest.files.length, 'restore');
    }
    await verifySource(staging, manifest);
    await rename(staging, targetPath);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return {
    targetPath,
    vaultDir,
    fileCount: manifest.fileCount,
    contentSha256: manifest.contentSha256,
  };
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  await activateProfile(options.profile);
  if (!command || command === '--help' || command === 'help') {
    console.log(usage());
    return;
  }
  let result;
  if (command === 'create') result = await createManifest(options);
  else if (command === 'upload') result = await upload(options);
  else if (command === 'verify') result = await verify(options);
  else if (command === 'restore') result = await restore(options);
  else if (command === 'vault-root')
    result = { ...resolveVaultRoot(), profileVaultDir: vaultDirectory() };
  else if (command === 'check-local') result = await checkLocalResidue();
  else throw new Error(`Unknown command: ${command}\n${usage()}`);

  const printable = result.manifest
    ? {
        sourcePath: result.sourcePath,
        manifestPath: result.manifestPath,
        contentSha256: result.manifest.contentSha256,
        fileCount: result.manifest.fileCount,
        componentCounts: result.manifest.componentCounts,
      }
    : result;
  console.log(JSON.stringify(printable, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
