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
const SOURCE_KEY = "japan-zue";
const EDITION = "2025-26";
const REVISION = 1;
const SOURCE_ROOT_NAME = "日本国勢図絵";
const BUNDLE_FILE_NAME = `stats47-${SOURCE_KEY}-${EDITION}-r${REVISION}.tar.gz`;
const MANIFEST_FILE_NAME = `stats47-${SOURCE_KEY}-${EDITION}-r${REVISION}.manifest.json`;
const DEFAULT_SOURCE = path.join(PROJECT_ROOT, "books", SOURCE_ROOT_NAME);
const DEFAULT_OUTPUT_DIR = path.join(
  tmpdir(),
  "stats47-source-vault",
  SOURCE_KEY,
  EDITION,
  `r${REVISION}`,
);
const DEFAULT_PART_SIZE_MIB = 90;

function usage() {
  return `Usage:
  node .claude/scripts/source-vault/japan-zue-bundle.mjs create [options]
  node .claude/scripts/source-vault/japan-zue-bundle.mjs verify [options]
  node .claude/scripts/source-vault/japan-zue-bundle.mjs restore [options]

create options:
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
  --target <dir>       Restore target (default: books/${SOURCE_ROOT_NAME})

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
    manifest.sourceKey !== SOURCE_KEY ||
    manifest.edition !== EDITION ||
    manifest.revision !== REVISION ||
    manifest.sourceRootName !== SOURCE_ROOT_NAME ||
    !manifest.bundle ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error(`Unsupported or invalid manifest: ${manifestPath}`);
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
    sourceKey: SOURCE_KEY,
    edition: EDITION,
    revision: REVISION,
    sourceRootName: SOURCE_ROOT_NAME,
    storage: {
      provider: "google-drive",
      visibility: "private",
      folderPath: `stats47-private-sources/${SOURCE_KEY}/${EDITION}`,
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
  const targetPath = path.resolve(options.target ?? DEFAULT_SOURCE);
  if (await pathExists(targetPath)) throw new Error(`Restore target already exists; refusing to overwrite: ${targetPath}`);

  const manifestPath = path.resolve(options.manifest);
  const manifest = await readManifest(manifestPath);
  let bundlePath;
  let removeAssembledBundle = false;
  let assembledDir;
  if (options.bundle) {
    bundlePath = path.resolve(options.bundle);
    await verifyBundle(bundlePath, manifest);
  } else {
    assembledDir = await mkdtemp(path.join(tmpdir(), "stats47-source-vault-restore-"));
    bundlePath = path.join(assembledDir, BUNDLE_FILE_NAME);
    await assembleParts(path.resolve(options["parts-dir"]), bundlePath, manifest);
    removeAssembledBundle = true;
  }

  const parent = path.dirname(targetPath);
  await mkdir(parent, { recursive: true });
  const staging = path.join(parent, `.source-vault-restore-${process.pid}-${Date.now()}`);
  await mkdir(staging, { recursive: false });
  try {
    await runTar(["-xzf", bundlePath, "-C", staging], PROJECT_ROOT);
    const extractedRoot = path.join(staging, SOURCE_ROOT_NAME);
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
