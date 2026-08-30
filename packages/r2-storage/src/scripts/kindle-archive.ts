/**
 * Kindle完成物を暗号化してR2へ版管理し、別PCへ検証付きで復元する。
 *
 * 既存stats47 bucketは公開URLを持つため、EPUB・表紙・レビュー記録をAES-256-GCMで
 * クライアント側暗号化してから保存する。暗号鍵そのものはR2/Gitへ置かない。
 * KINDLE_ARCHIVE_KEYがあれば優先し、未設定時はR2_SECRET_ACCESS_KEYからHKDFで導出する。
 *
 *   ... --push --all
 *   ... --audit --all [--deep] [--record]
 *   ... --restore --id K-S1-01 [--revision <hash>] [--target <dir>] [--force]
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getS3Client } from "../lib/clients/get-s3-client";
import { assertR2WriteAllowed } from "./_assert-ci-write";
import {
  decryptKindleArchiveBytes,
  deriveKindleArchiveKey,
  encryptKindleArchiveBytes,
  KINDLE_ARCHIVE_FORMAT,
  type KindleArchiveFile,
  type KindleArchiveManifest,
  kindleArchiveRevision,
  sha256,
  signKindleArchiveManifest,
  verifyKindleArchiveManifest,
} from "./lib/kindle-archive";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
config({ path: join(PROJECT_ROOT, ".env.local") });

const BUCKET = process.env.KINDLE_ARCHIVE_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
const ARCHIVE_PREFIX = "archive/kindle-encrypted";
const LOCAL_ROOT = join(PROJECT_ROOT, ".local/kindle-books");
const STATE_PATH = join(PROJECT_ROOT, ".claude/state/products/kindle-archives.json");
const VERSION = "v1";
const REQUIRED_ARCHIVE_FILES = [
  "book.epub",
  "cover.jpg",
  "cover.png",
  "metadata.json",
  "READINESS.md",
] as const;
const OPTIONAL_ARCHIVE_FILES = ["review.md"] as const;

interface ArchiveRevisionState {
  revision: string;
  archivedAt: string;
  verifiedAt: string;
  remotePrefix: string;
  manifestSha256: string;
  files: KindleArchiveFile[];
}

interface ArchiveBookState {
  id: string;
  version: string;
  latestRevision: string;
  revisions: ArchiveRevisionState[];
}

interface ArchiveState {
  schemaVersion: 1;
  archiveFormat: typeof KINDLE_ARCHIVE_FORMAT;
  bucket: string;
  prefix: string;
  generatedAt: string;
  books: Record<string, ArchiveBookState>;
}

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
const value = (flag: string): string | undefined => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};

function operation(): "push" | "audit" | "restore" {
  const selected = (["push", "audit", "restore"] as const).filter((name) => has(`--${name}`));
  if (selected.length !== 1) {
    throw new Error("--push | --audit | --restore のいずれか1つを指定してください");
  }
  return selected[0];
}

function archiveSecret(): string {
  const secret = process.env.KINDLE_ARCHIVE_KEY || process.env.R2_SECRET_ACCESS_KEY;
  if (!secret) {
    throw new Error("KINDLE_ARCHIVE_KEY または R2_SECRET_ACCESS_KEY が必要です");
  }
  return secret;
}

function emptyState(): ArchiveState {
  return {
    schemaVersion: 1,
    archiveFormat: KINDLE_ARCHIVE_FORMAT,
    bucket: BUCKET,
    prefix: ARCHIVE_PREFIX,
    generatedAt: new Date(0).toISOString(),
    books: {},
  };
}

function readState(): ArchiveState {
  if (!existsSync(STATE_PATH)) return emptyState();
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as ArchiveState;
  if (state.schemaVersion !== 1 || state.archiveFormat !== KINDLE_ARCHIVE_FORMAT) {
    throw new Error(`未対応のKindle archive state: ${STATE_PATH}`);
  }
  return state;
}

function writeState(state: ArchiveState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  const sortedBooks = Object.fromEntries(
    Object.entries(state.books).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(
    STATE_PATH,
    JSON.stringify({ ...state, generatedAt: new Date().toISOString(), books: sortedBooks }, null, 2) + "\n",
  );
}

function targetIds(state: ArchiveState, op: ReturnType<typeof operation>): string[] {
  const id = value("--id");
  if (id) return [id];
  if (!has("--all")) throw new Error("--id <K-S1-01> または --all が必要です");
  if (op === "push") {
    if (!existsSync(LOCAL_ROOT)) return [];
    return readdirSync(LOCAL_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  }
  return Object.keys(state.books).sort();
}

function assertBookId(id: string): void {
  if (!/^K-S[1-4]-\d{2}$/.test(id)) throw new Error(`不正なKindle book id: ${id}`);
}

async function getObject(key: string): Promise<Buffer | null> {
  try {
    const response = await getS3Client().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!response.Body) return null;
    return Buffer.from(await response.Body.transformToByteArray());
  } catch (error: unknown) {
    const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

async function readRemoteManifest(key: string, encryptionKey: Buffer): Promise<KindleArchiveManifest | null> {
  const bytes = await getObject(key);
  if (!bytes) return null;
  const manifest = JSON.parse(bytes.toString("utf8")) as KindleArchiveManifest;
  if (!verifyKindleArchiveManifest(manifest, encryptionKey)) {
    throw new Error(`R2 manifest署名不一致: ${key}`);
  }
  return manifest;
}

function collectPlainFiles(id: string): Array<{ name: string; path: string; bytes: Buffer; sha: string }> {
  const dir = join(LOCAL_ROOT, id, VERSION);
  const required = REQUIRED_ARCHIVE_FILES.map((name) => {
    const path = join(dir, name);
    if (!existsSync(path)) throw new Error(`${id}: archive必須ファイルがありません: ${name}`);
    const bytes = readFileSync(path);
    return { name, path, bytes, sha: sha256(bytes) };
  });
  const optional = OPTIONAL_ARCHIVE_FILES.flatMap((name) => {
    const path = join(dir, name);
    if (!existsSync(path)) return [];
    const bytes = readFileSync(path);
    return [{ name, path, bytes, sha: sha256(bytes) }];
  });
  return [...required, ...optional];
}

function writeLocalMarker(id: string, manifest: KindleArchiveManifest, manifestSha256: string): void {
  const marker = {
    schemaVersion: 1,
    bookId: id,
    version: manifest.version,
    revision: manifest.revision,
    manifestSha256,
    archivedAt: manifest.archivedAt,
  };
  writeFileSync(join(LOCAL_ROOT, id, VERSION, ".kindle-archive.json"), JSON.stringify(marker, null, 2) + "\n");
}

async function pushBook(id: string, state: ArchiveState, encryptionKey: Buffer): Promise<void> {
  assertBookId(id);
  const plainFiles = collectPlainFiles(id);
  const revision = kindleArchiveRevision(
    plainFiles.map((file) => ({ name: file.name, plainSha256: file.sha, plainSize: file.bytes.length })),
  );
  const remotePrefix = `${ARCHIVE_PREFIX}/${id}/${VERSION}/${revision}`;
  const manifestKey = `${remotePrefix}/manifest.json`;
  const existing = await readRemoteManifest(manifestKey, encryptionKey);
  let manifest: KindleArchiveManifest;

  if (existing) {
    manifest = existing;
    console.log(`[archive] ${id} ${revision}: R2に同一revisionあり`);
  } else {
    assertR2WriteAllowed({ op: `Kindle archive ${id}` });
    const archivedAt = new Date().toISOString();
    const files: KindleArchiveFile[] = [];
    for (const file of plainFiles) {
      const encrypted = encryptKindleArchiveBytes(file.bytes, encryptionKey);
      const key = `${remotePrefix}/${file.name}.s47enc`;
      const cipherSha256 = sha256(encrypted);
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: encrypted,
          ContentType: "application/octet-stream",
          CacheControl: "private, no-store",
          Metadata: {
            bookid: id,
            version: VERSION,
            revision,
            plainsha256: file.sha,
            ciphersha256: cipherSha256,
            archiveformat: KINDLE_ARCHIVE_FORMAT,
          },
        }),
      );
      files.push({
        name: file.name,
        plainSha256: file.sha,
        cipherSha256,
        plainSize: file.bytes.length,
        cipherSize: encrypted.length,
        key,
      });
      console.log(`[archive] ${id}: uploaded ${file.name} (${file.bytes.length} bytes)`);
    }
    manifest = signKindleArchiveManifest(
      {
        schemaVersion: 1,
        archiveFormat: KINDLE_ARCHIVE_FORMAT,
        bookId: id,
        version: VERSION,
        revision,
        archivedAt,
        files,
      },
      encryptionKey,
    );
    const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: manifestKey,
        Body: manifestBytes,
        ContentType: "application/json; charset=utf-8",
        CacheControl: "private, no-store",
        Metadata: { bookid: id, revision, archiveformat: KINDLE_ARCHIVE_FORMAT },
      }),
    );
  }

  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  const manifestSha256 = sha256(manifestBytes);
  const revisionState: ArchiveRevisionState = {
    revision,
    archivedAt: manifest.archivedAt,
    verifiedAt: new Date().toISOString(),
    remotePrefix,
    manifestSha256,
    files: manifest.files,
  };
  const previous = state.books[id]?.revisions ?? [];
  state.books[id] = {
    id,
    version: VERSION,
    latestRevision: revision,
    revisions: [...previous.filter((item) => item.revision !== revision), revisionState].sort((a, b) =>
      a.archivedAt.localeCompare(b.archivedAt),
    ),
  };
  writeState(state);
  writeLocalMarker(id, manifest, manifestSha256);
}

function selectRevision(state: ArchiveState, id: string): ArchiveRevisionState {
  const book = state.books[id];
  if (!book) throw new Error(`${id}: archive stateがありません`);
  const requested = value("--revision") || book.latestRevision;
  const revision = book.revisions.find((item) => item.revision === requested);
  if (!revision) throw new Error(`${id}: revision ${requested} がありません`);
  return revision;
}

async function auditRevision(
  id: string,
  revision: ArchiveRevisionState,
  encryptionKey: Buffer,
  deep: boolean,
): Promise<KindleArchiveManifest> {
  const manifestKey = `${revision.remotePrefix}/manifest.json`;
  const manifest = await readRemoteManifest(manifestKey, encryptionKey);
  if (!manifest) throw new Error(`${id}: R2 manifestがありません: ${manifestKey}`);
  const manifestSha256 = sha256(Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
  if (manifestSha256 !== revision.manifestSha256) {
    throw new Error(`${id}: stateとR2のmanifest SHAが不一致`);
  }
  for (const file of manifest.files) {
    const head = await getS3Client().send(new HeadObjectCommand({ Bucket: BUCKET, Key: file.key }));
    if (head.ContentLength !== file.cipherSize) throw new Error(`${id}/${file.name}: cipher size不一致`);
    if (head.Metadata?.plainsha256 !== file.plainSha256) throw new Error(`${id}/${file.name}: metadata SHA不一致`);
    if (!deep) continue;
    const encrypted = await getObject(file.key);
    if (!encrypted || sha256(encrypted) !== file.cipherSha256) {
      throw new Error(`${id}/${file.name}: cipher SHA不一致`);
    }
    const plain = decryptKindleArchiveBytes(encrypted, encryptionKey);
    if (plain.length !== file.plainSize || sha256(plain) !== file.plainSha256) {
      throw new Error(`${id}/${file.name}: 復号後SHA不一致`);
    }
  }
  return manifest;
}

async function restoreBook(id: string, state: ArchiveState, encryptionKey: Buffer): Promise<void> {
  assertBookId(id);
  const revision = selectRevision(state, id);
  const manifest = await auditRevision(id, revision, encryptionKey, true);
  const baseTarget = value("--target") ? resolve(value("--target")!) : LOCAL_ROOT;
  const targetDir = join(baseTarget, id, manifest.version);
  const temp = mkdtempSync(join(tmpdir(), "stats47-kindle-restore-"));
  try {
    for (const file of manifest.files) {
      const encrypted = await getObject(file.key);
      if (!encrypted) throw new Error(`${id}/${file.name}: R2 objectがありません`);
      const plain = decryptKindleArchiveBytes(encrypted, encryptionKey);
      if (sha256(plain) !== file.plainSha256) throw new Error(`${id}/${file.name}: 復号後SHA不一致`);
      writeFileSync(join(temp, file.name), plain);
    }
    mkdirSync(targetDir, { recursive: true });
    for (const file of manifest.files) {
      const destination = join(targetDir, file.name);
      const source = join(temp, file.name);
      if (existsSync(destination)) {
        const current = readFileSync(destination);
        if (sha256(current) === file.plainSha256) continue;
        if (!has("--force")) {
          throw new Error(`${destination} は内容が異なります。上書きには --force が必要です`);
        }
      }
      const staging = `${destination}.restore-${process.pid}`;
      copyFileSync(source, staging);
      renameSync(staging, destination);
    }
    const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
    writeLocalMarker(id, manifest, sha256(manifestBytes));
    console.log(`[archive] ${id}: restored ${manifest.revision} -> ${targetDir}`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const op = operation();
  const state = readState();
  const encryptionKey = deriveKindleArchiveKey(archiveSecret());
  const ids = targetIds(state, op);
  if (!ids.length) throw new Error("対象のKindle書籍がありません");
  console.log(`[archive] op=${op} bucket=${BUCKET} targets=${ids.length}`);

  for (const id of ids) {
    if (op === "push") {
      await pushBook(id, state, encryptionKey);
      continue;
    }
    if (op === "restore") {
      await restoreBook(id, state, encryptionKey);
      continue;
    }
    const revision = selectRevision(state, id);
    await auditRevision(id, revision, encryptionKey, has("--deep"));
    if (has("--record")) {
      revision.verifiedAt = new Date().toISOString();
      writeState(state);
    }
    console.log(`[archive] ${id}: audit PASS ${revision.revision}${has("--deep") ? " (deep)" : ""}`);
  }
}

main().catch((error: unknown) => {
  console.error(`[archive] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
