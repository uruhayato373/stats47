import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEstatIngestClient, resolveEstatAppId, ESTAT_MAX_CONCURRENCY } from "../ingest-client";

const ID = "0003445758";
function page(from = 1, total = 1, next?: number) {
  return { GET_STATS_DATA: { RESULT: { STATUS: 0 }, PARAMETER: { STATS_DATA_ID: ID, APP_ID: "secret" },
    STATISTICAL_DATA: { TABLE_INF: { "@id": ID, UPDATED_DATE: "2024-11-27" }, CLASS_INF: { CLASS_OBJ: [] },
      RESULT_INF: { TOTAL_NUMBER: total, FROM_NUMBER: from, TO_NUMBER: from, ...(next ? { NEXT_KEY: next } : {}) },
      DATA_INF: { VALUE: { "@tab": from === 1 ? "13" : "08", "@area": "01000", $: "123" } } } } };
}
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
afterEach(() => { vi.useRealTimers(); });

describe("Node ingestion entry", () => {
  it("resolves environment first, then quoted/exported .env without printing secrets", () => {
    const dir = mkdtempSync(join(tmpdir(), "estat-env-"));
    try {
      const file = join(dir, ".env");
      writeFileSync(file, "export NEXT_PUBLIC_ESTAT_APP_ID='file-id' # comment\n");
      expect(resolveEstatAppId({ NEXT_PUBLIC_ESTAT_APP_ID: " env-id " }, file)).toBe("env-id");
      expect(resolveEstatAppId({}, file)).toBe("file-id");
      expect(() => resolveEstatAppId({}, join(dir, "missing"))).toThrow(/absent/);
    } finally { rmSync(dir, { recursive: true }); }
  });

  it("follows NEXT_KEY, caps the page limit and removes credentials from persisted results", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json(page(1, 2, 2))).mockResolvedValueOnce(json(page(2, 2)));
    const result = await createEstatIngestClient({ appId: "secret", fetch }).fetchAll({ statsDataId: ID, cdTab: "13", limit: 200_000 });
    expect(result.rowCount).toBe(2);
    expect(result.requestCount).toBe(2);
    const urls = fetch.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls.map((url) => url.searchParams.get("startPosition"))).toEqual(["1", "2"]);
    expect(urls.every((url) => url.searchParams.get("limit") === "100000")).toBe(true);
    expect(urls.every((url) => url.searchParams.get("cdTab") === "13")).toBe(true);
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(result.response?.GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF).toEqual({ TOTAL_NUMBER: 2, FROM_NUMBER: 1, TO_NUMBER: 2 });
  });

  it("backs off exponentially for 429/503 but does not retry 400", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(json(page()));
    const promise = createEstatIngestClient({ appId: "secret", fetch, initialDelay: 100 }).fetchAll({ statsDataId: ID });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(199);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect((await promise).requestCount).toBe(3);
    const bad = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("", { status: 400 }));
    await expect(createEstatIngestClient({ appId: "secret", fetch: bad }).fetchAll({ statsDataId: ID })).rejects.toThrow("HTTP 400");
    expect(bad).toHaveBeenCalledTimes(1);
  });

  it("stops at retry exhaustion without leaking an app ID from transport errors", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error("https://api.e-stat.go.jp/?appId=secret"));
    await expect(createEstatIngestClient({ appId: "secret", fetch, maxRetries: 1, initialDelay: 0 })
      .fetchAll({ statsDataId: ID })).rejects.toThrow("network/timeout");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("enforces the shared four-request ceiling across clients", async () => {
    let active = 0;
    let peak = 0;
    const fetch: typeof globalThis.fetch = async () => {
      active++; peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return json(page());
    };
    const clients = [createEstatIngestClient({ appId: "secret", fetch }), createEstatIngestClient({ appId: "secret", fetch })];
    await Promise.all(Array.from({ length: 12 }, (_, i) => clients[i % 2].fetchAll({ statsDataId: ID })));
    expect(peak).toBe(ESTAT_MAX_CONCURRENCY);
  });

  it("rejects incomplete pages, repeated cursors, changing totals and API errors", async () => {
    const variants = [page(1, 2), page(1, 2, 1), { GET_STATS_DATA: { RESULT: { STATUS: 100 } } }, {}];
    for (const body of variants) {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json(body));
      await expect(createEstatIngestClient({ appId: "secret", fetch }).fetchAll({ statsDataId: ID })).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    }
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json(page(1, 2, 2))).mockResolvedValueOnce(json(page(2, 3, 3)));
    await expect(createEstatIngestClient({ appId: "secret", fetch }).fetchAll({ statsDataId: ID })).rejects.toThrow(/changed/);
  });

  it("records an empty partition explicitly", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ GET_STATS_DATA: { RESULT: { STATUS: 1 } } }));
    expect(await createEstatIngestClient({ appId: "secret", fetch }).fetchAll({ statsDataId: ID })).toMatchObject({ response: null, rowCount: 0 });
  });
});
