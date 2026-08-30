import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const MAGIC = Buffer.from("S47KDP01", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;

export const KINDLE_ARCHIVE_FORMAT = "aes-256-gcm-v1" as const;

export interface KindleArchiveFile {
  name: string;
  plainSha256: string;
  cipherSha256: string;
  plainSize: number;
  cipherSize: number;
  key: string;
}

export interface KindleArchiveManifestPayload {
  schemaVersion: 1;
  archiveFormat: typeof KINDLE_ARCHIVE_FORMAT;
  bookId: string;
  version: string;
  revision: string;
  archivedAt: string;
  files: KindleArchiveFile[];
}

export interface KindleArchiveManifest extends KindleArchiveManifestPayload {
  hmacSha256: string;
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function deriveKindleArchiveKey(secret: string): Buffer {
  if (!secret.trim()) throw new Error("Kindle archive encryption secret is empty");
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(secret, "utf8"),
      Buffer.from("stats47-kindle-archive", "utf8"),
      Buffer.from(KINDLE_ARCHIVE_FORMAT, "utf8"),
      32,
    ),
  );
}

export function encryptKindleArchiveBytes(plain: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, iv, encrypted, cipher.getAuthTag()]);
}

export function decryptKindleArchiveBytes(encrypted: Buffer, key: Buffer): Buffer {
  const minimum = MAGIC.length + IV_BYTES + TAG_BYTES;
  if (encrypted.length < minimum || !encrypted.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Invalid stats47 Kindle archive header");
  }
  const ivStart = MAGIC.length;
  const bodyStart = ivStart + IV_BYTES;
  const tagStart = encrypted.length - TAG_BYTES;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    encrypted.subarray(ivStart, bodyStart),
  );
  decipher.setAuthTag(encrypted.subarray(tagStart));
  return Buffer.concat([
    decipher.update(encrypted.subarray(bodyStart, tagStart)),
    decipher.final(),
  ]);
}

function canonicalPayload(payload: KindleArchiveManifestPayload): string {
  return JSON.stringify(payload);
}

export function signKindleArchiveManifest(
  payload: KindleArchiveManifestPayload,
  key: Buffer,
): KindleArchiveManifest {
  const hmacSha256 = createHmac("sha256", key)
    .update(canonicalPayload(payload))
    .digest("hex");
  return { ...payload, hmacSha256 };
}

export function verifyKindleArchiveManifest(
  manifest: KindleArchiveManifest,
  key: Buffer,
): boolean {
  const { hmacSha256, ...payload } = manifest;
  if (!/^[a-f0-9]{64}$/.test(hmacSha256)) return false;
  const expected = createHmac("sha256", key)
    .update(canonicalPayload(payload))
    .digest();
  return timingSafeEqual(expected, Buffer.from(hmacSha256, "hex"));
}

export function kindleArchiveRevision(
  files: Array<Pick<KindleArchiveFile, "name" | "plainSha256" | "plainSize">>,
): string {
  const source = [...files]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => `${file.name}:${file.plainSha256}:${file.plainSize}`)
    .join("\n");
  return sha256(source).slice(0, 16);
}
