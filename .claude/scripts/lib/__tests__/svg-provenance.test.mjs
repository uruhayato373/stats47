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
  buildProvenanceLine,
  sameSvgContent,
  sanitizeProvenanceLine,
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

describe("XML 安全化 — 相関 scatter の '--' で不正 XML にしない", () => {
  const now = new Date("2026-08-12T00:00:00.000Z");
  // 相関 scatter の data 名は 2 key を "--" で連結する (実際に broken image を起こした形)。
  const DASH = "a-height-2nd-male--b-rice-cracker-scatter.json";

  // 冒頭コメント本文に "--" が残っていないか (終端 "-->" は除いて判定)。
  const commentBodyHasDoubleHyphen = (svg) => {
    const m = svg.match(/^<!--([\s\S]*?)-->/);
    return m ? m[1].includes("--") : false;
  };

  it("buildProvenanceLine は '--' を XML コメント本文に残さない", () => {
    const line = buildProvenanceLine(DASH, now);
    assert.ok(!commentBodyHasDoubleHyphen(line), "コメント本文に '--' が残っている");
    assert.ok(line.endsWith("-->\n"), "終端 '-->' を壊した");
    assert.ok(line.includes("rice-cracker"), "ファイル名が読めなくなっている");
  });

  it("withProvenance は新規作成時に XML 安全化する", () => {
    const out = withProvenance(BODY, BODY, DASH, now);
    assert.ok(!commentBodyHasDoubleHyphen(out), "新規コメントに '--' が残っている");
  });

  it("withProvenance は '--' を含む旧コメントを引き継ぐとき修復する", () => {
    const brokenP = `<!-- data-source: ${DASH} | generated: 2026-08-05T13:36:32.472Z -->\n`;
    assert.ok(commentBodyHasDoubleHyphen(brokenP), "前提: 旧コメントは壊れている");
    const out = withProvenance(BODY, brokenP + BODY, DASH, now);
    assert.ok(!commentBodyHasDoubleHyphen(out), "旧 '--' を再導入している");
    // 内容は不変 (元の generated 日時を保つ)。
    assert.ok(out.includes("2026-08-05T13:36:32.472Z"), "引き継ぎ時に日時を無駄に更新した");
    assert.ok(sameSvgContent(out, brokenP + BODY), "本文まで変えてしまった");
  });

  it("sanitizeProvenanceLine は終端 '-->' を壊さず本文だけ直す", () => {
    const broken = `<!-- data-source: ${DASH} | generated: ${now.toISOString()} -->\n`;
    const fixed = sanitizeProvenanceLine(broken);
    assert.ok(fixed.endsWith("-->\n"), "終端 '-->' を '- ->' に壊した");
    assert.ok(!commentBodyHasDoubleHyphen(fixed), "本文の '--' が残っている");
  });

  it("'--' を含まない行は無変化 (誤って空白を挿入しない)", () => {
    assert.equal(sanitizeProvenanceLine(P1), P1);
    assert.equal(
      buildProvenanceLine("x-scatter.json", now),
      `<!-- data-source: x-scatter.json | generated: ${now.toISOString()} -->\n`,
    );
  });
});
