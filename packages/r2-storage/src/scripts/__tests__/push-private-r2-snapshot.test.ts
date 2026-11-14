import { describe, expect, it } from "vitest";
import { pushPrivateR2Snapshot } from "../push-private-r2-snapshot-core";
import { R2_PRIVATE_BUCKET } from "../r2-key-classes";

const dataKey = "estat-tables/0003445758/data/all.json.gz";
const manifestKey = "estat-tables/0003445758/manifest.json";
const objects = [{ key: manifestKey, bytes: Buffer.from("manifest") }, { key: dataKey, bytes: Buffer.from("data") }];
function fixture(initial: [string, Buffer][] = [], badHead?: string, transport: "s3" | "wrangler-oauth" = "s3") {
  const remote = new Map(initial);
  const calls: string[] = [];
  const store = {
    bucket: R2_PRIVATE_BUCKET,
    transport,
    async get(key: string) { calls.push(`GET ${key}`); return remote.get(key) ?? null; },
    async put(key: string, bytes: Buffer, options?: { ifNoneMatch?: boolean }) {
      calls.push(`PUT ${key}`);
      if (options?.ifNoneMatch && remote.has(key)) throw new Error("precondition failed");
      remote.set(key, bytes);
    },
    async head(key: string) {
      calls.push(`HEAD ${key}`);
      return remote.has(key) ? { size: remote.get(key)!.length + (badHead === key ? 1 : 0) } : null;
    },
  };
  return { store, remote, calls };
}

describe("private snapshot push", () => {
  it("preflights every object and blocks changed authoritative bytes before any PUT, including manifest changes", async () => {
    for (const key of [dataKey, manifestKey]) {
      const { store, calls } = fixture([[key, Buffer.from("older")]]);
      await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow(/--allow-authoritative-overwrite/);
      expect(calls.filter((c) => c.startsWith("PUT"))).toEqual([]);
    }
  });
  it("reports NEW / UNCHANGED / CHANGED without writes or HEAD in dry-run", async () => {
    const { store, calls } = fixture([[dataKey, Buffer.from("data")], [manifestKey, Buffer.from("older")]]);
    expect(await pushPrivateR2Snapshot({ objects, manifestKey, store, dryRun: true })).toEqual({ NEW: 0, UNCHANGED: 1, CHANGED: 1, transport: "s3", verification: "HEAD:size" });
    expect(calls.every((c) => c.startsWith("GET"))).toBe(true);
  });
  it("skips identical bytes and writes the manifest only after slice HEAD succeeds", async () => {
    const { store, calls } = fixture([[dataKey, Buffer.from("data")]]);
    expect(await pushPrivateR2Snapshot({ objects, manifestKey, store })).toEqual({ NEW: 1, UNCHANGED: 1, CHANGED: 0, transport: "s3", verification: "HEAD:size" });
    expect(calls).toEqual([`GET ${dataKey}`, `GET ${manifestKey}`, `HEAD ${manifestKey}`, `HEAD ${dataKey}`, `PUT ${manifestKey}`, `HEAD ${manifestKey}`]);
  });
  it("writes slices before manifest regardless of the input order", async () => {
    const { store, calls } = fixture();
    await pushPrivateR2Snapshot({ objects, manifestKey, store });
    expect(calls.slice(2)).toEqual([`HEAD ${manifestKey}`, `PUT ${dataKey}`, `HEAD ${dataKey}`, `PUT ${manifestKey}`, `HEAD ${manifestKey}`]);
  });
  it("bounds parallel operations at four and verifies every slice before writing the manifest", async () => {
    const { store, calls } = fixture();
    const slices = Array.from({ length: 9 }, (_, i) => ({ key: `estat-tables/0003445758/data/tab=${i}.json.gz`, bytes: Buffer.from(`data${i}`) }));
    let active = 0, maximum = 0;
    const get = store.get;
    store.get = async (key) => {
      active++; maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--; return get(key);
    };
    await pushPrivateR2Snapshot({ objects: [objects[0], ...slices], manifestKey, store });
    expect(maximum).toBe(4);
    const firstPut = calls.findIndex((call) => call.startsWith("PUT"));
    expect(calls.slice(0, firstPut).filter((call) => call.startsWith("GET"))).toHaveLength(10);
    const manifestPut = calls.indexOf(`PUT ${manifestKey}`);
    for (const slice of slices) expect(calls.indexOf(`HEAD ${slice.key}`)).toBeLessThan(manifestPut);
  });
  it("settles started writes after a slice failure and never publishes its manifest", async () => {
    const { store, calls } = fixture();
    const slices = Array.from({ length: 8 }, (_, i) => ({ key: `estat-tables/0003445758/data/tab=${i}.json.gz`, bytes: Buffer.from(`data${i}`) }));
    let active = 0;
    const put = store.put;
    store.put = async (key, bytes, options) => {
      active++;
      try {
        if (key === slices[0].key) throw new Error("slice failed");
        await new Promise((resolve) => setTimeout(resolve, 5));
        await put(key, bytes, options);
      } finally { active--; }
    };
    await expect(pushPrivateR2Snapshot({ objects: [...slices, objects[0]], manifestKey, store })).rejects.toThrow("slice failed");
    expect(active).toBe(0);
    expect(calls).not.toContain(`PUT ${manifestKey}`);
    expect(calls.filter((call) => call.startsWith("PUT"))).toHaveLength(3);
  });
  it("permits changed objects only with explicit overwrite flag", async () => {
    const { store, remote } = fixture([[dataKey, Buffer.from("older")]]);
    await pushPrivateR2Snapshot({ objects, manifestKey, store, allowAuthoritativeOverwrite: true });
    expect(remote.get(dataKey)).toEqual(Buffer.from("data"));
  });
  it("fails on HEAD mismatch and does not publish manifest after a slice mismatch", async () => {
    for (const key of [dataKey, manifestKey]) {
      const { store, calls } = fixture([], key);
      await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow(/HEAD size mismatch/);
      if (key === dataKey) expect(calls).not.toContain(`PUT ${manifestKey}`);
    }
  });
  it("does not treat read failure as NEW, and rejects wrong bucket or unregistered keys", async () => {
    const { store, calls } = fixture();
    store.get = async () => { throw new Error("offline"); };
    await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow("offline");
    expect(calls).toEqual([]);
    await expect(pushPrivateR2Snapshot({ objects, manifestKey, store: { ...store, bucket: "stats47" } })).rejects.toThrow(/private/);
    await expect(pushPrivateR2Snapshot({ objects: [{ key: "unknown/file", bytes: Buffer.alloc(0) }], manifestKey: "unknown/file", store })).rejects.toThrow(/registered/);
  });
  it("conditionally creates NEW keys so a concurrent writer cannot be overwritten", async () => {
    const { store, remote } = fixture();
    const put = store.put;
    store.put = async (key, bytes, options) => {
      remote.set(key, Buffer.from("concurrent"));
      return put(key, bytes, options);
    };
    await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow(/precondition/);
    expect(remote.get(dataKey)).toEqual(Buffer.from("concurrent"));
    expect(remote.has(manifestKey)).toBe(false);
  });
  it("rejects unsupported HEAD before any write, even for an entirely NEW snapshot", async () => {
    const { store, calls } = fixture();
    store.head = async () => { throw new Error("R2 HEAD HTTP 405"); };
    await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow("HEAD HTTP 405");
    expect(calls.some((c) => c.startsWith("PUT"))).toBe(false);
  });
  it("verifies OAuth writes by GET size and SHA, never HEAD, with manifest last", async () => {
    const { store, calls } = fixture([], undefined, "wrangler-oauth");
    store.head = async () => { throw new Error("OAuth HEAD must not be called"); };
    expect(await pushPrivateR2Snapshot({ objects, manifestKey, store })).toEqual({
      NEW: 2, UNCHANGED: 0, CHANGED: 0, transport: "wrangler-oauth", verification: "GET:size+sha256",
    });
    expect(calls).toEqual([`GET ${dataKey}`, `GET ${manifestKey}`, `PUT ${dataKey}`, `GET ${dataKey}`, `PUT ${manifestKey}`, `GET ${manifestKey}`]);
  });
  it("reports OAuth dry-run mode and identical counts without any write", async () => {
    const { store, calls } = fixture(objects.map((o) => [o.key, o.bytes]), undefined, "wrangler-oauth");
    expect(await pushPrivateR2Snapshot({ objects, manifestKey, store, dryRun: true })).toEqual({
      NEW: 0, UNCHANGED: 2, CHANGED: 0, transport: "wrangler-oauth", verification: "GET:size+sha256",
    });
    expect(calls).toEqual([`GET ${dataKey}`, `GET ${manifestKey}`]);
  });
  it("fails OAuth readback on size mismatch, same-size SHA mismatch, or missing data, before publishing manifest", async () => {
    for (const corrupted of [Buffer.from("shorter"), Buffer.from("evil"), null]) {
      const { store, remote, calls } = fixture([], undefined, "wrangler-oauth");
      const put = store.put;
      store.put = async (key, bytes, options) => {
        await put(key, bytes, options);
        if (corrupted === null) remote.delete(key); else remote.set(key, corrupted);
      };
      await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow(
        corrupted?.length === 4 ? /GET sha256 mismatch/ : /GET size mismatch/);
      expect(calls).not.toContain(`PUT ${manifestKey}`);
    }
  });
  it("fails if the final manifest is corrupted or OAuth readback is unavailable", async () => {
    for (const unavailable of [false, true]) {
      const { store, remote } = fixture([], undefined, "wrangler-oauth");
      const get = store.get;
      store.get = async (key) => {
        if (key === manifestKey && remote.has(key)) {
          if (unavailable) throw new Error("R2 read HTTP 403");
          return Buffer.from("MANIFEST"); // same size; byte-count-only verification would miss this
        }
        return get(key);
      };
      await expect(pushPrivateR2Snapshot({ objects, manifestKey, store })).rejects.toThrow(
        unavailable ? /R2 read HTTP 403/ : /GET sha256 mismatch/);
    }
  });
});
