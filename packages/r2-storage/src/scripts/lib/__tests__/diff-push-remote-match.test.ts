import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { remoteListPrefixes, splitUnchangedOnRemote, type RemoteObjectSummary } from "../diff-push-remote-match";

/**
 * diff-push-r2 の「送らない」条件は手元の manifest (size と mtime) だけだった。CI の runner は毎回
 * 空の manifest で始まるので、中身が R2 と同じでも全件を送り直していた (2026-11-02 の sync-snapshots
 * run 41406400636 で 14,321 件)。R2 にある object と中身が同じファイルは送らない。
 */

const md5 = (body: string) => createHash("md5").update(body).digest("hex");
const file = (key: string, body: string) => ({ key, size: Buffer.byteLength(body), body });
const remoteOf = (entries: Array<[string, string, string?]>) =>
  new Map<string, RemoteObjectSummary>(
    entries.map(([key, body, etag]) => [key, { size: Buffer.byteLength(body), etag: etag ?? `"${md5(body)}"` }]),
  );
const md5Of = (f: { body: string }) => md5(f.body);

describe("splitUnchangedOnRemote", () => {
  it("R2 の object と中身が同じファイルは送らず、違うファイルと R2 に無いファイルだけを送る", () => {
    const same = file("app/ranking/a/values.json", '{"generatedAt":"2026-11-02","v":1}');
    const changed = file("app/ranking/b/values.json", '{"generatedAt":"2026-11-09","v":2}');
    const added = file("app/ranking/c/values.json", '{"v":3}');
    const remote = remoteOf([
      [same.key, same.body],
      [changed.key, '{"generatedAt":"2026-11-02","v":1}'],
    ]);

    const result = splitUnchangedOnRemote([same, changed, added], remote, md5Of);

    expect(result.unchanged.map((f) => f.key)).toEqual([same.key]);
    expect(result.toUpload.map((f) => f.key)).toEqual([changed.key, added.key]);
  });

  it("サイズが違うファイルは中身を読まずに送る側へ入れる", () => {
    const local = file("app/x.json", '{"v":10}');
    const hash = vi.fn(md5Of);

    const result = splitUnchangedOnRemote([local], remoteOf([[local.key, '{"v":1}']]), hash);

    expect(result.toUpload).toEqual([local]);
    expect(hash).not.toHaveBeenCalled();
  });

  it("サイズが同じでも中身が違えば送る", () => {
    const local = file("app/x.json", '{"v":2}');

    const result = splitUnchangedOnRemote([local], remoteOf([[local.key, '{"v":1}']]), md5Of);

    expect(result.toUpload).toEqual([local]);
  });

  it("ETag が MD5 の形でない object (multipart で書かれたもの) は、中身が同じでも送る", () => {
    const local = file("app/big.bin", "same body");
    const remote = remoteOf([[local.key, local.body, `"${md5(local.body)}-2"`]]);

    const result = splitUnchangedOnRemote([local], remote, md5Of);

    expect(result.toUpload).toEqual([local]);
    expect(result.unchanged).toEqual([]);
  });

  it("引用符の無い ETag でも中身が同じなら送らない", () => {
    const local = file("app/x.json", '{"v":1}');
    const remote = remoteOf([[local.key, local.body, md5(local.body).toUpperCase()]]);

    expect(splitUnchangedOnRemote([local], remote, md5Of).unchanged).toEqual([local]);
  });
});

describe("remoteListPrefixes", () => {
  it("--prefix があればその prefix だけを一覧する", () => {
    expect(remoteListPrefixes("app/ranking", ["app/ranking/a/values.json"])).toEqual(["app/ranking"]);
  });

  it("--prefix が無ければ、送る候補の最上位ディレクトリだけを一覧する (bucket 全体を一覧しない)", () => {
    expect(
      remoteListPrefixes("", ["app/ranking/a/values.json", "app/stats/a/values.json", "state/x/latest.json", "robots.txt"]),
    ).toEqual(["app/", "robots.txt", "state/"]);
  });
});
