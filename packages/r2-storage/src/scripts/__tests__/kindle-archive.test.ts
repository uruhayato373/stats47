import { describe, expect, it } from "vitest";

import {
  decryptKindleArchiveBytes,
  deriveKindleArchiveKey,
  encryptKindleArchiveBytes,
  KINDLE_ARCHIVE_FORMAT,
  kindleArchiveRevision,
  sha256,
  signKindleArchiveManifest,
  verifyKindleArchiveManifest,
} from "../lib/kindle-archive";

describe("Kindle archive", () => {
  it("AES-GCMで暗号化した完成物を復号できる", () => {
    const key = deriveKindleArchiveKey("test-secret");
    const plain = Buffer.from("epub bytes\0日本語");
    const encrypted = encryptKindleArchiveBytes(plain, key);

    expect(encrypted.equals(plain)).toBe(false);
    expect(decryptKindleArchiveBytes(encrypted, key)).toEqual(plain);
  });

  it("改ざんされた暗号文を拒否する", () => {
    const key = deriveKindleArchiveKey("test-secret");
    const encrypted = encryptKindleArchiveBytes(Buffer.from("cover"), key);
    encrypted[20] ^= 1;

    expect(() => decryptKindleArchiveBytes(encrypted, key)).toThrow();
  });

  it("manifestの署名とrevisionを決定的に検証する", () => {
    const key = deriveKindleArchiveKey("test-secret");
    const files = [
      { name: "cover.jpg", plainSha256: sha256("cover"), plainSize: 5 },
      { name: "book.epub", plainSha256: sha256("book"), plainSize: 4 },
    ];
    const revision = kindleArchiveRevision(files);
    const manifest = signKindleArchiveManifest(
      {
        schemaVersion: 1,
        archiveFormat: KINDLE_ARCHIVE_FORMAT,
        bookId: "K-S1-01",
        version: "v1",
        revision,
        archivedAt: "2026-08-30T00:00:00.000Z",
        files: files.map((file) => ({
          ...file,
          cipherSha256: sha256(`${file.name}-cipher`),
          cipherSize: file.plainSize + 36,
          key: `archive/${file.name}.s47enc`,
        })),
      },
      key,
    );

    expect(verifyKindleArchiveManifest(manifest, key)).toBe(true);
    expect(
      verifyKindleArchiveManifest({ ...manifest, revision: "tampered" }, key),
    ).toBe(false);
    expect(revision).toBe(kindleArchiveRevision([...files].reverse()));
  });
});
