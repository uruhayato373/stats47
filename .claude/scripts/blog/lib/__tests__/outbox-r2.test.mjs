import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyAgainstLive,
  needsPublish,
  normalizeBody,
} from "../outbox-r2.mjs";

const BODY = "---\npublished: true\n---\n\n本文\n";

test("未公開 (R2 に無い) は公開対象", () => {
  const s = classifyAgainstLive({ published: true, localBody: BODY, liveBody: null });
  assert.equal(s, "unpublished");
  assert.equal(needsPublish(s), true);
});

test("改稿版 (R2 に旧版が live) は公開対象", () => {
  const s = classifyAgainstLive({ published: true, localBody: BODY, liveBody: "---\npublished: true\n---\n\n旧本文\n" });
  assert.equal(s, "revised");
  assert.equal(needsPublish(s), true, "これを落とすと brushup の成果が本番に届かない");
});

test("R2 と一致していれば公開しない (無限再公開を防ぐ)", () => {
  const s = classifyAgainstLive({ published: true, localBody: BODY, liveBody: BODY });
  assert.equal(s, "in-sync");
  assert.equal(needsPublish(s), false);
});

test("published:false は R2 の状態によらず公開しない", () => {
  for (const liveBody of [null, BODY, "別内容"]) {
    const s = classifyAgainstLive({ published: false, localBody: BODY, liveBody });
    assert.equal(s, "draft");
    assert.equal(needsPublish(s), false, "REVISE 中のドラフトを公開してはならない");
  }
});

test("published が不明 (null) なら公開しない", () => {
  const s = classifyAgainstLive({ published: null, localBody: BODY, liveBody: null });
  assert.equal(s, "draft");
  assert.equal(needsPublish(s), false);
});

test("改行と行末空白の差だけなら一致とみなす", () => {
  // 行末空白は**末尾行ではなく中間行**に置く。末尾に置くと .trim() が吸収してしまい、
  // 行末空白の正規化を外しても落ちない (= 何も見ていない) テストになる。
  const a = "行1   \r\n行2\r\n行3\r\n";
  const b = "行1\n行2\n行3\n";
  assert.equal(normalizeBody(a), normalizeBody(b));
  assert.equal(
    classifyAgainstLive({ published: true, localBody: a, liveBody: b }),
    "in-sync",
    "publish は cp -R の verbatim コピーなので、この差で再公開ループに入らせない",
  );
});

test("prune と publish の判定が排他になっている", () => {
  // 同じ状態を「消す」と「出す」の両方に振り分けてはならない。
  // pruner が消すのは in-sync のみ、publish が出すのは unpublished / revised のみ。
  const prunes = (s) => s === "in-sync";
  for (const s of ["unpublished", "revised", "in-sync", "draft"]) {
    assert.equal(prunes(s) && needsPublish(s), false, `${s} が prune と publish の両方に該当している`);
  }
  // どちらでもない状態が放置されないこと (draft は意図的に放置してよい)
  const handled = ["unpublished", "revised", "in-sync"].every((s) => prunes(s) || needsPublish(s));
  assert.equal(handled, true, "published:true のどれかが宙に浮いている");
});
