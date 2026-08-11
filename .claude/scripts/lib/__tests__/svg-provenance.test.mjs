/**
 * provenance 比較の検出力テスト。
 * 実行: node --test .claude/scripts/lib/__tests__/svg-provenance.test.mjs
 *
 * ★ここで固定したいのは 2 つの逆方向:
 *   ① provenance だけの差は「同じ」と判定する (誤検知を消す)
 *   ② 内容の差は必ず「違う」と判定する (gate を盲目にしない)
 *   ②が無いと、①の修正が「全部 already-canonical」を作るだけの無検査 gate に化ける。
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  sameSvgContent,
  stripProvenance,
  withProvenance,
} from "../svg-provenance.mjs";

const BODY = '<svg viewBox="0 0 720 720"><circle cx="10" cy="20" r="4"/></svg>';
const P1 = "<!-- data-source: x-scatter.json | generated: 2026-08-05T13:36:32.472Z -->\n";
const P2 = "<!-- data-source: x-scatter.json | generated: 2026-08-12T00:00:00.000Z -->\n";

describe("stripProvenance", () => {
  it("冒頭の provenance 行を落とす", () => {
    assert.equal(stripProvenance(P1 + BODY), BODY);
  });

  it("provenance が無い SVG はそのまま", () => {
    assert.equal(stripProvenance(BODY), BODY);
  });

  it("本文中の同形コメントは落とさない (冒頭限定)", () => {
    const s = BODY.replace("<circle", "<!-- data-source: inner --><circle");
    assert.equal(stripProvenance(s), s);
  });
});

describe("sameSvgContent — ① provenance 差は無視する", () => {
  it("生成日時だけ違う", () => {
    assert.ok(sameSvgContent(P1 + BODY, P2 + BODY));
  });

  it("片方だけ provenance を持つ (公開 78 枚が 69/9 に割れていた実際の形)", () => {
    assert.ok(sameSvgContent(P1 + BODY, BODY));
    assert.ok(sameSvgContent(BODY, P1 + BODY));
  });
});

describe("sameSvgContent — ★② 内容差は必ず検出する (gate を盲目にしない)", () => {
  const cases = [
    { name: "点の座標が動いた", other: BODY.replace('cx="10"', 'cx="11"') },
    { name: "点が 1 つ消えた", other: '<svg viewBox="0 0 720 720"></svg>' },
    { name: "キャンバスが変わった", other: BODY.replace("0 0 720 720", "0 0 560 560") },
    { name: "色が付いた", other: BODY.replace("<circle", '<circle fill="#ff0000"') },
  ];
  for (const c of cases) {
    it(`★${c.name}`, () => {
      assert.ok(!sameSvgContent(P1 + BODY, P1 + c.other), "内容差を見逃している");
      assert.ok(!sameSvgContent(P1 + BODY, c.other), "provenance 無し側の内容差も見逃している");
    });
  }
});

describe("withProvenance — 書き出し時に落とさない", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");

  it("元の行を引き継ぐ (生成日時を無駄に更新しない)", () => {
    assert.equal(withProvenance(BODY, P1 + BODY, "x-scatter.json", now), P1 + BODY);
  });

  it("元に無ければ新規作成する", () => {
    assert.equal(
      withProvenance(BODY, BODY, "x-scatter.json", now),
      `<!-- data-source: x-scatter.json | generated: ${now.toISOString()} -->\n${BODY}`,
    );
  });

  it("既に付いていれば二重に付けない", () => {
    assert.equal(withProvenance(P2 + BODY, P1 + BODY, "x-scatter.json", now), P2 + BODY);
  });
});
