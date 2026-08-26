#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const PROFILE_CONFIG_PATH = path.join(PROJECT_ROOT, ".claude", "config", "source-vault.json");
const DEFAULT_PART_SIZE_MIB = 90;
let PROFILE_NAME;
let SOURCE_KEY;
let EDITION;
let REVISION;
let SOURCE_ROOT_NAME;
let BUNDLE_FILE_NAME;
let MANIFEST_FILE_NAME;
let DEFAULT_SOURCE;
let DEFAULT_OUTPUT_DIR;
let DRIVE_FOLDER_PATH;

async function activateProfile(profileName) {
  const config = JSON.parse(await readFile(PROFILE_CONFIG_PATH, "utf8"));
  if (config.schemaVersion !== 1 || !config.profiles || typeof config.profiles !== "object") {
    throw new Error(`Invalid source vault config: ${PROFILE_CONFIG_PATH}`);
  }
  PROFILE_NAME = profileName ?? config.defaultProfile;
  const profile = config.profiles[PROFILE_NAME];
  if (!profile) {
    throw new Error(`Unknown source vault profile: ${PROFILE_NAME}`);
  }
  for (const field of ["sourceKey", "edition", "sourceRootName", "localPath", "driveFolderPath"]) {
    if (typeof profile[field] !== "string" || profile[field] === "") {
      throw new Error(`Invalid ${field} in source vault profile: ${PROFILE_NAME}`);
    }
  }
  if (!Number.isInteger(profile.revision) || profile.revision < 1) {
    throw new Error(`Invalid revision in source vault profile: ${PROFILE_NAME}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(profile.sourceKey) || !/^[a-z0-9][a-z0-9-]*$/.test(profile.edition)) {
    throw new Error(`Unsafe sourceKey or edition in source vault profile: ${PROFILE_NAME}`);
  }
  assertSafeFileName(profile.sourceRootName, "profile sourceRootName");
  SOURCE_KEY = profile.sourceKey;
  EDITION = profile.edition;
  REVISION = profile.revision;
  SOURCE_ROOT_NAME = profile.sourceRootName;
  DRIVE_FOLDER_PATH = profile.driveFolderPath;
  BUNDLE_FILE_NAME = `stats47-${SOURCE_KEY}-${EDITION}-r${REVISION}.tar.gz`;
  MANIFEST_FILE_NAME = `stats47-${SOURCE_KEY}-${EDITION}-r${REVISION}.manifest.json`;
  DEFAULT_SOURCE = path.resolve(PROJECT_ROOT, profile.localPath);
  const booksRoot = path.join(PROJECT_ROOT, "books");
  const sourceRelative = path.relative(booksRoot, DEFAULT_SOURCE);
  if (
    sourceRelative === "" ||
    sourceRelative.startsWith("..") ||
    path.isAbsolute(sourceRelative) ||
    path.basename(DEFAULT_SOURCE) !== SOURCE_ROOT_NAME
  ) {
    throw new Error(`Profile localPath must be a named child of books/: ${PROFILE_NAME}`);
  }
  DEFAULT_OUTPUT_DIR = path.join(
    tmpdir(),
    "stats47-source-vault",
    SOURCE_KEY,
    EDITION,
    `r${REVISION}`,
  );
}

function usage() {
  return `Usage:
  node .claude/scripts/source-vault/japan-zue-bundle.mjs create [options]
  node .claude/scripts/source-vault/japan-zue-bundle.mjs verify [options]
  node .claude/scripts/source-vault/japan-zue-bundle.mjs restore [options]

create options:
  --profile <name>     Source profile from .claude/config/source-vault.json (default: ${PROFILE_NAME})
  --source <dir>       Source directory (default: books/${SOURCE_ROOT_NAME})
  --bundle <file>      Archive output (default: ${DEFAULT_OUTPUT_DIR}/${BUNDLE_FILE_NAME})
  --manifest <file>    Manifest output (default: ${DEFAULT_OUTPUT_DIR}/${MANIFEST_FILE_NAME})
  --parts-dir <dir>    Part output directory (default: bundle directory)
  --part-size-mib <n>  Part size below the Drive MCP 100 MB limit (default: ${DEFAULT_PART_SIZE_MIB})
  --force              Replace existing generated outputs

verify options:
  --manifest <file>    Required manifest
  --bundle <file>      Verify archive bytes and SHA-256
  --parts-dir <dir>    Verify every archive part
  --source <dir>       Verify extracted source files and per-file SHA-256

restore options:
  --manifest <file>    Required manifest
  --bundle <file>      Required archive
  --parts-dir <dir>    Use verified parts instead of --bundle
  --target <dir>       Restore target (default: books/<manifest.sourceRootName>)

The bundle is private source material. Do not place it inside the Git repository.`;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Unknown argument: ${arg}`);
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
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
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`${label} must be outside the public Git repository: ${target}`);
  }
}

function normalizeRelative(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  if (normalized === "" || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`Unsafe relative path: ${filePath}`);
  }
  return normalized;
}

function assertSafeFileName(value, label) {
  if (
    typeof value !== "string" ||
    value === "" ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    throw new Error(`Unsafe ${label}: ${String(value)}`);
  }
}

function assertSafeManifestPath(value, label) {
  if (typeof value !== "string" || value === "" || value.includes("\\") || value.includes("\0")) {
    throw new Error(`Unsafe ${label}: ${String(value)}`);
  }
  const segments = value.split("/");
  if (value.startsWith("/") || segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function collectFiles(root) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "ja"));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed in source vault: ${absolute}`);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile()) {
        const relative = normalizeRelative(path.relative(root, absolute));
        const fileStat = await stat(absolute);
        files.push({
          path: relative,
          bytes: fileStat.size,
          sha256: await sha256File(absolute),
        });
      } else {
        throw new Error(`Unsupported filesystem entry: ${absolute}`);
      }
    }
  }
  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path, "ja"));
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
    if (file.path.startsWith("md/") && file.path.endsWith(".md")) counts.markdown += 1;
    else if (file.path.startsWith("figures/")) counts.figures += 1;
    else if (file.path.startsWith("pages/")) counts.pageImages += 1;
    else if (file.path.startsWith("ocr-raw/")) counts.ocrRaw += 1;
    else if (file.path.startsWith("transcripts/")) counts.transcripts += 1;
    else if (!file.path.includes("/") && file.path.toLowerCase().endsWith(".pdf")) counts.pdfs += 1;
    else counts.auxiliary += 1;
  }
  return counts;
}

async function runTar(args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn("tar", args, {
      cwd,
      env: { ...process.env, COPYFILE_DISABLE: "1", LANG: "C", LC_ALL: "C" },
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
  });
}

function partFileName(index) {
  return `${BUNDLE_FILE_NAME}.part-${String(index).padStart(3, "0")}`;
}

async function splitBundle(bundlePath, partsDir, partSizeBytes, force) {
  await mkdir(partsDir, { recursive: true });
  const bundleStat = await stat(bundlePath);
  const input = await open(bundlePath, "r");
  const parts = [];
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let sourceOffset = 0;
  let partIndex = 1;
  try {
    while (sourceOffset < bundleStat.size) {
      const fileName = partFileName(partIndex);
      const partPath = path.join(partsDir, fileName);
      if ((await pathExists(partPath)) && !force) {
        throw new Error(`Part already exists (use --force to replace generated output): ${partPath}`);
      }
      if (force) await rm(partPath, { force: true });
      const output = await open(partPath, "w");
      let partBytes = 0;
      try {
        while (partBytes < partSizeBytes && sourceOffset < bundleStat.size) {
          const requested = Math.min(buffer.length, partSizeBytes - partBytes, bundleStat.size - sourceOffset);
          const { bytesRead } = await input.read(buffer, 0, requested, sourceOffset);
          if (bytesRead === 0) throw new Error(`Unexpected EOF while splitting ${bundlePath}`);
          await output.write(buffer, 0, bytesRead, partBytes);
          sourceOffset += bytesRead;
          partBytes += bytesRead;
        }
      } finally {
        await output.close();
      }
      parts.push({
        index: partIndex,
        fileName,
        bytes: partBytes,
        sha256: await sha256File(partPath),
      });
      partIndex += 1;
    }
  } finally {
    await input.close();
  }
  return parts;
}

async function readManifest(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (
    manifest.schemaVersion !== 1 ||
    typeof manifest.sourceKey !== "string" ||
    typeof manifest.edition !== "string" ||
    !Number.isInteger(manifest.revision) ||
    typeof manifest.sourceRootName !== "string" ||
    !manifest.bundle ||
    typeof manifest.bundle.fileName !== "string" ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error(`Unsupported or invalid manifest: ${manifestPath}`);
  }
  assertSafeFileName(manifest.sourceRootName, "manifest sourceRootName");
  assertSafeFileName(manifest.bundle.fileName, "manifest bundle fileName");
  if (!Array.isArray(manifest.bundle.parts) || manifest.bundle.parts.length === 0) {
    throw new Error(`Manifest does not contain bundle parts: ${manifestPath}`);
  }
  const partNames = new Set();
  for (const part of manifest.bundle.parts) {
    assertSafeFileName(part.fileName, "manifest part fileName");
    if (partNames.has(part.fileName)) throw new Error(`Duplicate manifest part fileName: ${part.fileName}`);
    partNames.add(part.fileName);
  }
  const filePaths = new Set();
  for (const file of manifest.files) {
    assertSafeManifestPath(file.path, "manifest file path");
    if (filePaths.has(file.path)) throw new Error(`Duplicate manifest file path: ${file.path}`);
    filePaths.add(file.path);
  }
  return manifest;
}

async function verifyBundle(bundlePath, manifest) {
  const bundleStat = await stat(bundlePath);
  const actualSha256 = await sha256File(bundlePath);
  const errors = [];
  if (path.basename(bundlePath) !== manifest.bundle.fileName) {
    errors.push(`bundle file name: expected=${manifest.bundle.fileName} actual=${path.basename(bundlePath)}`);
  }
  if (bundleStat.size !== manifest.bundle.bytes) {
    errors.push(`bundle bytes: expected=${manifest.bundle.bytes} actual=${bundleStat.size}`);
  }
  if (actualSha256 !== manifest.bundle.sha256) {
    errors.push(`bundle sha256: expected=${manifest.bundle.sha256} actual=${actualSha256}`);
  }
  if (errors.length > 0) throw new Error(`Bundle verification failed:\n- ${errors.join("\n- ")}`);
  return { bytes: bundleStat.size, sha256: actualSha256 };
}

async function verifyParts(partsDir, manifest) {
  if (!Array.isArray(manifest.bundle.parts) || manifest.bundle.parts.length === 0) {
    throw new Error("Manifest does not contain bundle parts");
  }
  const errors = [];
  let totalBytes = 0;
  for (const expected of manifest.bundle.parts) {
    const partPath = path.join(partsDir, expected.fileName);
    if (!(await pathExists(partPath))) {
      errors.push(`missing part: ${expected.fileName}`);
      continue;
    }
    const partStat = await stat(partPath);
    const actualSha256 = await sha256File(partPath);
    totalBytes += partStat.size;
    if (partStat.size !== expected.bytes) {
      errors.push(`part bytes ${expected.fileName}: expected=${expected.bytes} actual=${partStat.size}`);
    }
    if (actualSha256 !== expected.sha256) {
      errors.push(`part sha256 ${expected.fileName}: expected=${expected.sha256} actual=${actualSha256}`);
    }
  }
  if (totalBytes !== manifest.bundle.bytes) {
    errors.push(`part total bytes: expected=${manifest.bundle.bytes} actual=${totalBytes}`);
  }
  if (errors.length > 0) throw new Error(`Part verification failed:\n- ${errors.join("\n- ")}`);
  return { partCount: manifest.bundle.parts.length, bytes: totalBytes };
}

async function assembleParts(partsDir, outputPath, manifest) {
  assertOutsideRepository(outputPath, "Assembled bundle");
  await verifyParts(partsDir, manifest);
  await mkdir(path.dirname(outputPath), { recursive: true });
  if (await pathExists(outputPath)) throw new Error(`Assembled bundle already exists: ${outputPath}`);
  const output = await open(outputPath, "w");
  let outputOffset = 0;
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    for (const part of manifest.bundle.parts) {
      const input = await open(path.join(partsDir, part.fileName), "r");
      let inputOffset = 0;
      try {
        while (inputOffset < part.bytes) {
          const requested = Math.min(buffer.length, part.bytes - inputOffset);
          const { bytesRead } = await input.read(buffer, 0, requested, inputOffset);
          if (bytesRead === 0) throw new Error(`Unexpected EOF while assembling ${part.fileName}`);
          await output.write(buffer, 0, bytesRead, outputOffset);
          inputOffset += bytesRead;
          outputOffset += bytesRead;
        }
      } finally {
        await input.close();
      }
    }
  } finally {
    await output.close();
  }
  await verifyBundle(outputPath, manifest);
  return outputPath;
}

async function verifySource(sourcePath, manifest) {
  const actualFiles = await collectFiles(sourcePath);
  const expectedByPath = new Map(manifest.files.map((file) => [file.path, file]));
  const actualByPath = new Map(actualFiles.map((file) => [file.path, file]));
  const errors = [];

  for (const expected of manifest.files) {
    const actual = actualByPath.get(expected.path);
    if (!actual) errors.push(`missing file: ${expected.path}`);
    else if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
      errors.push(`content mismatch: ${expected.path}`);
    }
  }
  for (const actual of actualFiles) {
    if (!expectedByPath.has(actual.path)) errors.push(`unexpected file: ${actual.path}`);
  }
  if (actualFiles.length !== manifest.fileCount) {
    errors.push(`file count: expected=${manifest.fileCount} actual=${actualFiles.length}`);
  }
  if (errors.length > 0) {
    const visible = errors.slice(0, 20);
    const suffix = errors.length > visible.length ? `\n- ... ${errors.length - visible.length} more` : "";
    throw new Error(`Source verification failed:\n- ${visible.join("\n- ")}${suffix}`);
  }
  return { fileCount: actualFiles.length, componentCounts: componentCounts(actualFiles) };
}

async function createBundle(options) {
  const sourcePath = path.resolve(options.source ?? DEFAULT_SOURCE);
  const bundlePath = path.resolve(options.bundle ?? path.join(DEFAULT_OUTPUT_DIR, BUNDLE_FILE_NAME));
  const manifestPath = path.resolve(options.manifest ?? path.join(DEFAULT_OUTPUT_DIR, MANIFEST_FILE_NAME));
  const partsDir = path.resolve(options["parts-dir"] ?? path.dirname(bundlePath));
  const partSizeMib = Number(options["part-size-mib"] ?? DEFAULT_PART_SIZE_MIB);
  if (!Number.isInteger(partSizeMib) || partSizeMib < 1 || partSizeMib >= 100) {
    throw new Error("--part-size-mib must be an integer from 1 to 99");
  }
  assertOutsideRepository(bundlePath, "Bundle");
  assertOutsideRepository(partsDir, "Parts directory");

  const sourceStat = await stat(sourcePath);
  if (!sourceStat.isDirectory()) throw new Error(`Source is not a directory: ${sourcePath}`);
  if (path.basename(sourcePath) !== SOURCE_ROOT_NAME) {
    throw new Error(`Source root must be named ${SOURCE_ROOT_NAME}: ${sourcePath}`);
  }
  for (const output of [bundlePath, manifestPath]) {
    if ((await pathExists(output)) && !options.force) {
      throw new Error(`Output already exists (use --force to replace generated output): ${output}`);
    }
  }

  await mkdir(path.dirname(bundlePath), { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  if (options.force) {
    await rm(bundlePath, { force: true });
    await rm(manifestPath, { force: true });
  }

  const files = await collectFiles(sourcePath);
  if (files.length === 0) throw new Error(`Source directory is empty: ${sourcePath}`);
  await runTar(["-czf", bundlePath, "-C", path.dirname(sourcePath), SOURCE_ROOT_NAME], PROJECT_ROOT);
  const bundleStat = await stat(bundlePath);
  const parts = await splitBundle(bundlePath, partsDir, partSizeMib * 1024 * 1024, options.force);
  const manifest = {
    schemaVersion: 1,
    profile: PROFILE_NAME,
    sourceKey: SOURCE_KEY,
    edition: EDITION,
    revision: REVISION,
    sourceRootName: SOURCE_ROOT_NAME,
    storage: {
      provider: "google-drive",
      visibility: "private",
      folderPath: DRIVE_FOLDER_PATH,
    },
    bundle: {
      fileName: BUNDLE_FILE_NAME,
      format: "tar.gz",
      bytes: bundleStat.size,
      sha256: await sha256File(bundlePath),
      parts,
    },
    fileCount: files.length,
    componentCounts: componentCounts(files),
    createdAt: new Date().toISOString(),
    files,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { sourcePath, bundlePath, manifestPath, partsDir, manifest };
}

async function verify(options) {
  if (!options.manifest) throw new Error("--manifest is required");
  if (!options.bundle && !options["parts-dir"] && !options.source) {
    throw new Error("Provide --bundle, --parts-dir, and/or --source");
  }
  const manifestPath = path.resolve(options.manifest);
  const manifest = await readManifest(manifestPath);
  const result = { manifestPath, sourceKey: manifest.sourceKey, edition: manifest.edition, revision: manifest.revision };
  if (options.bundle) result.bundle = await verifyBundle(path.resolve(options.bundle), manifest);
  if (options["parts-dir"]) result.parts = await verifyParts(path.resolve(options["parts-dir"]), manifest);
  if (options.source) result.source = await verifySource(path.resolve(options.source), manifest);
  return result;
}

async function restore(options) {
  if (!options.manifest || (!options.bundle && !options["parts-dir"])) {
    throw new Error("restore requires --manifest and either --bundle or --parts-dir");
  }
  const manifestPath = path.resolve(options.manifest);
  const manifest = await readManifest(manifestPath);
  const targetPath = path.resolve(options.target ?? path.join(PROJECT_ROOT, "books", manifest.sourceRootName));
  if (await pathExists(targetPath)) throw new Error(`Restore target already exists; refusing to overwrite: ${targetPath}`);
  let bundlePath;
  let removeAssembledBundle = false;
  let assembledDir;
  if (options.bundle) {
    bundlePath = path.resolve(options.bundle);
    await verifyBundle(bundlePath, manifest);
  } else {
    assembledDir = await mkdtemp(path.join(tmpdir(), "stats47-source-vault-restore-"));
    bundlePath = path.join(assembledDir, manifest.bundle.fileName);
    await assembleParts(path.resolve(options["parts-dir"]), bundlePath, manifest);
    removeAssembledBundle = true;
  }

  const parent = path.dirname(targetPath);
  await mkdir(parent, { recursive: true });
  const staging = path.join(parent, `.source-vault-restore-${process.pid}-${Date.now()}`);
  await mkdir(staging, { recursive: false });
  try {
    await runTar(["-xzf", bundlePath, "-C", staging], PROJECT_ROOT);
    const extractedRoot = path.join(staging, manifest.sourceRootName);
    await verifySource(extractedRoot, manifest);
    await rename(extractedRoot, targetPath);
  } finally {
    await rm(staging, { recursive: true, force: true });
    if (removeAssembledBundle && assembledDir) await rm(assembledDir, { recursive: true, force: true });
  }
  return { targetPath, fileCount: manifest.fileCount, bundleSha256: manifest.bundle.sha256 };
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  await activateProfile(options.profile);
  if (!command || command === "--help" || command === "help") {
    console.log(usage());
    return;
  }
  let result;
  if (command === "create") result = await createBundle(options);
  else if (command === "verify") result = await verify(options);
  else if (command === "restore") result = await restore(options);
  else throw new Error(`Unknown command: ${command}\n${usage()}`);

  const printable = result.manifest
    ? {
        sourcePath: result.sourcePath,
        bundlePath: result.bundlePath,
        manifestPath: result.manifestPath,
        partsDir: result.partsDir,
        bundle: result.manifest.bundle,
        fileCount: result.manifest.fileCount,
        componentCounts: result.manifest.componentCounts,
      }
    : result;
  console.log(JSON.stringify(printable, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
