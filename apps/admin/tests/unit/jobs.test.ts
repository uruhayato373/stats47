import { EventEmitter } from "node:events";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot, readGalleryState } from "../helpers/fixture-root";

/**
 * jobs.ts の spawn を node:child_process の mock で置き換え、
 * 同時実行 1 / log 500 行上限 / close(0)→success / close(≠0)→failed / error→failed /
 * publish-x + exit0 で gallery-state 更新 / globalThis singleton を検証する。
 *
 * mock child は EventEmitter を stdout/stderr/本体に持たせ、テストが手で data/close/error を emit する。
 */

// spawn が返すフェイク child。テストが child.stdout.emit("data", ...) / child.emit("close", code) を叩く。
class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

const spawnMock = vi.fn<(...args: unknown[]) => FakeChild>();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

describe("startJob", () => {
  let root: string;

  beforeEach(() => {
    root = makeFixtureRoot({ posts: [], galleryState: {} });
    process.env.STATS47_PROJECT_ROOT = root;
    spawnMock.mockReset();
    spawnMock.mockImplementation(() => new FakeChild());
    // globalThis singleton をクリアして、テスト間でジョブレジストリが漏れないようにする。
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
    vi.resetModules();
  });

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
    delete (globalThis as { __galleryJobs?: unknown }).__galleryJobs;
  });

  it("close(0) で status=success + exitCode=0", async () => {
    const { startJob, getJob } = await import("@/lib/server/jobs");
    const r = startJob("test", "echo", ["hi"]);
    expect("id" in r).toBe(true);
    if (!("id" in r)) return;
    const child = spawnMock.mock.results[0].value as FakeChild;
    child.emit("close", 0);
    const job = getJob(r.id);
    expect(job?.status).toBe("success");
    expect(job?.exitCode).toBe(0);
    expect(job?.endedAt).toBeTruthy();
  });

  it("close(≠0) で status=failed", async () => {
    const { startJob, getJob } = await import("@/lib/server/jobs");
    const r = startJob("test", "false", []);
    if (!("id" in r)) throw new Error("expected id");
    const child = spawnMock.mock.results[0].value as FakeChild;
    child.emit("close", 1);
    expect(getJob(r.id)?.status).toBe("failed");
    expect(getJob(r.id)?.exitCode).toBe(1);
  });

  it("error イベントで status=failed + log に spawn error", async () => {
    const { startJob, getJob } = await import("@/lib/server/jobs");
    const r = startJob("test", "nonexistent-bin", []);
    if (!("id" in r)) throw new Error("expected id");
    const child = spawnMock.mock.results[0].value as FakeChild;
    child.emit("error", new Error("ENOENT"));
    const job = getJob(r.id);
    expect(job?.status).toBe("failed");
    expect(job?.log.some((l) => l.includes("spawn error"))).toBe(true);
  });

  it("同時実行 1: 実行中に 2 個目は { error }", async () => {
    const { startJob } = await import("@/lib/server/jobs");
    const first = startJob("test", "sleep", ["10"]);
    expect("id" in first).toBe(true);
    // first はまだ close していない (running)。
    const second = startJob("test", "echo", ["x"]);
    expect("error" in second).toBe(true);
    // spawn は 1 回しか呼ばれない (2 個目は起動されない)。
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it("先行ジョブ完了後は次のジョブを起動できる", async () => {
    const { startJob, getJob } = await import("@/lib/server/jobs");
    const first = startJob("test", "echo", ["1"]);
    if (!("id" in first)) throw new Error("expected id");
    (spawnMock.mock.results[0].value as FakeChild).emit("close", 0);
    expect(getJob(first.id)?.status).toBe("success");
    const second = startJob("test", "echo", ["2"]);
    expect("id" in second).toBe(true);
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it("log は 500 行上限 (600 行流して先頭が捨てられる)", async () => {
    const { startJob, getJob } = await import("@/lib/server/jobs");
    const r = startJob("test", "gen", []);
    if (!("id" in r)) throw new Error("expected id");
    const child = spawnMock.mock.results[0].value as FakeChild;
    // 1 行ずつ 600 行を data として流す。
    for (let i = 0; i < 600; i++) child.stdout.emit("data", `line-${i}\n`);
    const job = getJob(r.id);
    expect(job?.log.length).toBe(500);
    // 先頭 100 行 (line-0..line-99) が捨てられ、line-100 が先頭になる。
    expect(job?.log[0]).toBe("line-100");
    expect(job?.log[job.log.length - 1]).toBe("line-599");
  });

  it("kind=publish-x + exit0 で gallery-state の lastPublishXSuccess を更新する", async () => {
    const { startJob } = await import("@/lib/server/jobs");
    const r = startJob("publish-x", "npx", ["tsx", "publish-x.ts", "key"]);
    if (!("id" in r)) throw new Error("expected id");
    const child = spawnMock.mock.results[0].value as FakeChild;
    child.emit("close", 0);
    const state = readGalleryState(root);
    expect(state.lastPublishXSuccess).toBeTruthy();
    expect(typeof state.lastPublishXSuccess).toBe("string");
  });

  it("kind=publish-x でも exit≠0 なら gallery-state を更新しない", async () => {
    const { startJob } = await import("@/lib/server/jobs");
    const r = startJob("publish-x", "npx", ["tsx", "publish-x.ts", "key"]);
    if (!("id" in r)) throw new Error("expected id");
    (spawnMock.mock.results[0].value as FakeChild).emit("close", 1);
    expect(readGalleryState(root).lastPublishXSuccess).toBeUndefined();
  });

  it("非 publish-x kind は exit0 でも gallery-state を更新しない", async () => {
    const { startJob } = await import("@/lib/server/jobs");
    const r = startJob("regenerate:ogp-ranking", "sh", ["-c", "echo"]);
    if (!("id" in r)) throw new Error("expected id");
    (spawnMock.mock.results[0].value as FakeChild).emit("close", 0);
    expect(readGalleryState(root).lastPublishXSuccess).toBeUndefined();
  });

  it("globalThis singleton: 再 import してもジョブレジストリが維持される", async () => {
    const mod1 = await import("@/lib/server/jobs");
    const r = mod1.startJob("test", "echo", ["x"]);
    if (!("id" in r)) throw new Error("expected id");
    // resetModules 後の再 import でも globalThis 経由で同じ registry を見る。
    vi.resetModules();
    const mod2 = await import("@/lib/server/jobs");
    expect(mod2.getJob(r.id)?.id).toBe(r.id);
  });
});
