import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  s3Send: vi.fn(),
  bindingGet: vi.fn(),
}));

vi.mock("../../clients/get-s3-client", () => ({
  getS3Client: () => ({ send: mocks.s3Send }),
}));

vi.mock("../../clients/get-r2-client", () => ({
  getR2Client: async () => ({ get: mocks.bindingGet }),
}));

import { fetchFromR2 } from "../fetch";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

/**
 * 旧 `fetchFromR2` は公開 R2 URL を `${base}/${key}` の文字列連結で組んでいた。
 * key に URL としての意味を持つ文字が混ざると、パスではなくクエリやフラグメントとして
 * 解釈され、意図と別のオブジェクトを取りに行く。
 *
 * 実測 (2026-08-30): key="app/blog/x?foo=1" は new URL 上で
 * pathname="/app/blog/x" / search="?foo=1" になる。
 *
 * 現在は固定オリジンの pathname にエンコード済みセグメントだけを設定する。
 * 非ASCII も正しくパスへ載るため拒否してはいけない
 * (参考文献は日本語の R2 キーを使う。`.claude/rules/reference-source-standards.md`)。
 * ASCII allowlist へ戻すとその経路が全滅するので、この 2 方向を同時に固定する。
 */
describe("fetchFromR2 のキー検証", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    process.env.R2_ACCESS_KEY_ID = "access";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_S3_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.R2_PUBLIC_FETCH_URL = "https://storage.example.test";
    mocks.s3Send.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    });
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array([9]), { status: 200 }));
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    globalThis.fetch = ORIGINAL_FETCH;
  });

  const TAB = String.fromCharCode(9);
  const LF = String.fromCharCode(10);
  const NUL = String.fromCharCode(0);
  const BACKSLASH = String.fromCharCode(92);

  it.each([
    ["クエリ文字", "app/blog/x?foo=1"],
    ["フラグメント", "app/blog/x#frag"],
    ["空白", "app/blog/ x"],
    ["タブ", `app/blog/a${TAB}b`],
    ["改行", `app/blog/a${LF}b`],
    ["NUL", `app/blog/x${NUL}`],
    ["絶対パス", "/abs/path"],
    ["スキーム付き URL", "http://evil.example/x"],
    ["パストラバーサル", "app/../etc/passwd"],
    ["現在位置セグメント", "app/./x.json"],
    ["バックスラッシュ", `a${BACKSLASH}b`],
  ])("%s を含むキーは読まずに null を返す", async (_label, key) => {
    await expect(fetchFromR2(key)).resolves.toBeNull();
    expect(mocks.s3Send).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["通常の配信キー", "app/blog/x/article.md"],
    ["観測値", "app/stats/total-population/values.json"],
    ["日本語を含む参考文献キー", "archive/参考文献/日本国勢図会/2025/a.json"],
    ["GIS キー", "gis/mlit-ksj/N06/24/x.topojson"],
    ["記号を含む正当なキー", "a-b_c.1/d"],
  ])("%s は通す", async (_label, key) => {
    await expect(fetchFromR2(key)).resolves.not.toBeNull();
    expect(mocks.s3Send).toHaveBeenCalled();
  });

  it.each([
    ["app/%2e%2e/object.json", "/prefix/app/%252e%252e/object.json"],
    ["app/%2f%2fevil.example/x", "/prefix/app/%252f%252fevil.example/x"],
    ["archive/参考文献/a.json", "/prefix/archive/%E5%8F%82%E8%80%83%E6%96%87%E7%8C%AE/a.json"],
    ["app/@evil.example/x", "/prefix/app/%40evil.example/x"],
  ])("公開読み取りで %s はホストを変えず同じオブジェクトキーを保つ", async (key, pathname) => {
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_S3_ENDPOINT;
    process.env.R2_PUBLIC_FETCH_URL = "https://storage.example.test/prefix/";
    await expect(fetchFromR2(key)).resolves.not.toBeNull();
    const [input, options] = vi.mocked(globalThis.fetch).mock.calls[0]!;
    const url = new URL(String(input));
    expect(url.origin).toBe("https://storage.example.test");
    expect(url.pathname).toBe(pathname);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(options?.redirect).toBe("error");
  });
});
