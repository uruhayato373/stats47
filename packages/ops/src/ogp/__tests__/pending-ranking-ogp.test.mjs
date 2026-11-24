import assert from "node:assert/strict";
import { test } from "node:test";

import { rankingR2Key } from "../../../../r2-storage/mirror/r2-keys.mjs";
import { keysMissingOgp, parseKnownKeys, pendingKeys } from "../pending-ranking-ogp.mjs";

/**
 * 守る意図 (R2-WRITE-PENDING-DISPLACE-01): r2-write の待ち枠を奪われて取り消された OGP 生成のキーを、
 * 次の実行が必ず拾い直す。対象を「この push で足されたキー」ではなく「main に無いキー」で決めるのはそのため。
 * 画像が揃っていれば空を返し、待ち枠に入らない (ほかの R2 writer の待機を奪わない)。
 */
const MAIN = `export const KNOWN = [\n  "a-key",\n  "b-key",\n] as const;\n`;
const DEVELOP = `export const KNOWN = [\n  "a-key",\n  "b-key",\n  "d-key",\n  "c-key",\n] as const;\n`;

test("known-ranking-keys.ts の行からキーだけを抜く (コメントや宣言の行は拾わない)", () => {
  assert.deepEqual([...parseKnownKeys(`// "x-key",\n  "a-key",\n  "b-key"\n`)], ["a-key", "b-key"]);
});

test("取り消された push で足したキーも、main に無い限り次の実行の対象に残る", () => {
  assert.deepEqual(pendingKeys(DEVELOP, MAIN), ["c-key", "d-key"]);
});

test("main へ出たキーは対象から外れる", () => {
  assert.deepEqual(pendingKeys(DEVELOP, DEVELOP), []);
});

test("og:image が 200 のキーは外し、404 と通信の失敗は作る側に倒す", async () => {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push([url, init.method]);
    if (url.includes("/fresh/")) return { ok: true, status: 200 };
    if (url.includes("/broken/")) throw new Error("network");
    return { ok: false, status: 404 };
  };
  const missing = await keysMissingOgp(["fresh", "absent", "broken"], { base: "https://r2.example/", fetchImpl });
  assert.deepEqual(missing, ["absent", "broken"]);
  assert.deepEqual(seen[0], [`https://r2.example/${rankingR2Key("fresh", "ogp-image")}`, "HEAD"]);
});

test("全キーに画像があれば空を返す (呼び元は r2-write の待ち枠に入らない)", async () => {
  const missing = await keysMissingOgp(["a-key"], { base: "https://r2.example", fetchImpl: async () => ({ ok: true, status: 200 }) });
  assert.deepEqual(missing, []);
});
