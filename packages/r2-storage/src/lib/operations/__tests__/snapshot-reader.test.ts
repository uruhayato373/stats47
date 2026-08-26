import { describe, expect, it, vi } from "vitest";

import {
  createSnapshotReader,
  type SnapshotReadResult,
} from "../snapshot-reader";

interface TestSnapshot {
  schemaVersion: 2;
  generatedAt: string;
  items: string[];
}

function parseTestSnapshot(value: unknown): TestSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("snapshot must be an object");
  }
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== undefined && record.schemaVersion !== 2) {
    throw new Error("unsupported schemaVersion");
  }
  if (typeof record.generatedAt !== "string" || !Array.isArray(record.items)) {
    throw new Error("invalid snapshot");
  }
  if (!record.items.every((item) => typeof item === "string")) {
    throw new Error("items must contain strings");
  }
  return {
    schemaVersion: 2,
    generatedAt: record.generatedAt,
    items: record.items as string[],
  };
}

const now = new Date("2026-08-26T00:00:00.000Z");
const current = {
  schemaVersion: 2,
  generatedAt: "2026-08-25T00:00:00.000Z",
  items: ["current"],
};

function reader(
  fetchText: () => Promise<string | null>,
  overrides: Partial<{
    staleAfterDays: number;
    timeoutMs: number;
    maxAttempts: number;
  }> = {},
) {
  return createSnapshotReader<TestSnapshot, string[]>({
    key: "app/test/snapshot.json",
    label: "test",
    parse: parseTestSnapshot,
    select: (snapshot) => snapshot.items,
    fallback: [],
    fetchText,
    now: () => now,
    ...overrides,
  });
}

describe("createSnapshotReader runtime contract", () => {
  it("正常payloadをokとして返す", async () => {
    const result = await reader(async () => JSON.stringify(current)).readResult();

    expect(result).toMatchObject({ status: "ok", data: ["current"], attempts: 1 });
  });

  it("404だけをno-dataにし、compat loaderでfallbackする", async () => {
    const load = reader(async () => null);

    await expect(load.readResult()).resolves.toMatchObject({ status: "no-data", attempts: 1 });
    await expect(load()).resolves.toEqual([]);
  });

  it("malformed JSONをschema-invalidとし、空配列へ変換しない", async () => {
    const load = reader(async () => "{");

    await expect(load.readResult()).resolves.toMatchObject({
      status: "schema-invalid",
      reason: "malformed-json",
    });
    await expect(load()).rejects.toThrow("JSON");
  });

  it("schema-invalid payloadを分類し、retryしない", async () => {
    const fetchText = vi.fn(async () => JSON.stringify({ ...current, items: [1] }));
    const load = reader(fetchText, { maxAttempts: 3 });

    await expect(load.readResult()).resolves.toMatchObject({
      status: "schema-invalid",
      reason: "schema-invalid",
      attempts: 1,
    });
    expect(fetchText).toHaveBeenCalledTimes(1);
  });

  it("schemaVersion無しの旧payloadをparserで明示移行する", async () => {
    const legacy = { generatedAt: current.generatedAt, items: ["legacy"] };
    const result = await reader(async () => JSON.stringify(legacy)).readResult();

    expect(result).toMatchObject({ status: "ok", data: ["legacy"] });
  });

  it("現行schemaVersionをそのまま読む", async () => {
    const result = await reader(async () => JSON.stringify(current)).readResult();

    expect(result).toMatchObject({ status: "ok", data: ["current"] });
  });

  it("閾値を超えたpayloadをstaleとしてdata付きで返す", async () => {
    const stale = { ...current, generatedAt: "2026-06-01T00:00:00.000Z" };
    const result = await reader(async () => JSON.stringify(stale), {
      staleAfterDays: 30,
    }).readResult();

    expect(result).toMatchObject({ status: "stale", data: ["current"] });
    expect(result.status === "stale" && result.ageDays).toBeGreaterThan(30);
  });

  it("5xx相当のtransport errorを決定的にretry後source-unavailableにする", async () => {
    const fetchText = vi.fn(async () => {
      throw new Error("公開 R2 URL 取得に失敗 (HTTP 503)");
    });
    const result = await reader(fetchText, { maxAttempts: 2 }).readResult();

    expect(result).toMatchObject({
      status: "source-unavailable",
      reason: "transport-error",
      attempts: 2,
    });
    expect(fetchText).toHaveBeenCalledTimes(2);
  });

  it("timeoutをretry上限後source-unavailableにする", async () => {
    const never = () => new Promise<string | null>(() => undefined);
    const result = await reader(never, {
      timeoutMs: 2,
      maxAttempts: 2,
    }).readResult();

    expect(result).toMatchObject({
      status: "source-unavailable",
      reason: "timeout",
      attempts: 2,
    } satisfies Partial<SnapshotReadResult<string[]>>);
  });
});
