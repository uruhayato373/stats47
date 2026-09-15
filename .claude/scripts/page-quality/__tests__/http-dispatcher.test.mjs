import assert from "node:assert/strict";
import test from "node:test";

import { isLoopbackUrl } from "../lib/http-dispatcher.ts";

test("localhost系URLは環境proxyを迂回する", () => {
  assert.equal(isLoopbackUrl("http://localhost:3000/areas"), true);
  assert.equal(isLoopbackUrl("http://127.0.0.1:4777/__health"), true);
  assert.equal(isLoopbackUrl("http://[::1]:3000/"), true);
});

test("公開URLはproxy判定対象のまま残す", () => {
  assert.equal(isLoopbackUrl("https://stats47.jp/areas"), false);
  assert.equal(isLoopbackUrl(undefined), false);
});
