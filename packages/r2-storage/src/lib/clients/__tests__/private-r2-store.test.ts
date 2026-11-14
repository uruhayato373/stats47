import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import https from "node:https";
import { EventEmitter } from "node:events";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2Store } from "../private-r2-store.mjs";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("shared Node R2 transport", () => {
  it("uses S3 HEAD and conditional PUT, preserves write-once and handles only 404 as missing", async () => {
    vi.stubEnv("R2_S3_ENDPOINT", "https://example.test");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test"); vi.stubEnv("R2_SECRET_ACCESS_KEY", "test");
    const send = vi.spyOn(S3Client.prototype, "send");
    send.mockResolvedValue({ ContentLength: 23 } as never);
    const store = createR2Store({ bucket: "stats47-private" });
    expect(store.transport).toBe("s3");
    expect(await store.head("k")).toEqual({ size: 23 });
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    await store.put("k", Buffer.from("abc"), { ifNoneMatch: true });
    expect(send.mock.calls[1][0]).toBeInstanceOf(PutObjectCommand);
    expect(send.mock.calls[1][0].input).toMatchObject({ IfNoneMatch: "*" });
    await createR2Store({ bucket: "stats47-private", writeOnce: true }).put("k", Buffer.from("abc"));
    expect(send.mock.calls[2][0].input).toMatchObject({ IfNoneMatch: "*" });
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });
    expect(await store.head("k")).toBeNull();
    send.mockResolvedValueOnce({} as never);
    await expect(store.head("k")).rejects.toThrow(/HEAD unavailable/);
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 403 } });
    await expect(store.head("k")).rejects.toThrow(/HEAD unavailable/);
  });

  it("uses Wrangler OAuth for GET / PUT / GET readback, preserving raw gzip bytes without relying on HEAD", async () => {
    vi.stubEnv("R2_S3_ENDPOINT", ""); vi.stubEnv("R2_ACCESS_KEY_ID", ""); vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account"); vi.stubEnv("HTTPS_PROXY", ""); vi.stubEnv("https_proxy", "");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "statSync").mockReturnValue({ isDirectory: () => false } as ReturnType<typeof fs.statSync>);
    vi.spyOn(fs, "readFileSync").mockReturnValue('oauth_token = "test-token"\nexpiration_time = "2999-01-01T00:00:00Z"');
    const bytes = Buffer.from([31, 139, 8, 0]);
    const calls: { url: string; options: Record<string, unknown>; body?: Buffer }[] = [];
    let status = 200;
    vi.spyOn(https, "request").mockImplementation(((url: URL | string, options: Record<string, unknown>, callback: (res: EventEmitter) => void) => {
      const call = { url: String(url), options, body: undefined as Buffer | undefined }; calls.push(call);
      const req = Object.assign(new EventEmitter(), {
        setTimeout() {},
        end(body?: Buffer) {
          call.body = body;
          const res = Object.assign(new EventEmitter(), { statusCode: options.method === "HEAD" ? 405 : status,
            headers: { "content-length": "4" } });
          callback(res);
          if (options.method === "GET") res.emit("data", bytes);
          res.emit("end");
        },
      });
      return req;
    }) as typeof https.request);
    const store = createR2Store({ bucket: "stats47-private" });
    expect(store.transport).toBe("wrangler-oauth");
    expect(await store.get("path/tab=08.json.gz")).toEqual(bytes);
    await store.put("path/tab=08.json.gz", bytes, { ifNoneMatch: true });
    expect(await store.get("path/tab=08.json.gz")).toEqual(bytes);
    expect(calls.map((c) => c.options.method)).toEqual(["GET", "PUT", "GET"]);
    expect(calls[1].options.headers).toMatchObject({ authorization: "Bearer test-token", "if-none-match": "*", "content-length": "4" });
    expect(calls[1].body).toEqual(bytes);
    expect(calls.every((c) => c.url.startsWith("https://api.cloudflare.com/client/v4/accounts/test-account/r2/buckets/stats47-private/objects/"))).toBe(true);
    expect(calls[0].url).toContain("tab%3D08.json.gz");
    status = 404; expect(await store.get("missing")).toBeNull();
    status = 403; await expect(store.get("forbidden")).rejects.toThrow(/read HTTP 403/);
    await expect(store.head("path/tab=08.json.gz")).rejects.toThrow(/HEAD HTTP 405/);
  });
});
