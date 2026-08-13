/**
 * lintSvgContent の「XML コメント違法性」検査の対照テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/svg-lint.xml-comment.test.mjs
 *
 * ★背景 (2026-08-13): 相関 scatter 7 枚が、先頭 provenance コメントに焼かれた
 *   ファイル名の "--" (2 ranking key の連結子) で不正 XML になり、<img> で
 *   broken image になっていた。既存 gate は先頭コメントを strip するだけで
 *   コメント本文の XML 妥当性を見ておらず、全 gate をすり抜けて公開されていた。
 *
 * ★全 PASS は「ゲートが何も見ていない」と区別がつかない。両方向を固定する:
 *   ① 違法コメント (本文に "--" / 末尾 "-") は必ず error を出す
 *   ② 妥当な SVG (妥当な provenance 含む) は error を出さない (誤検知ゼロ)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lintSvgContent } from "../svg-lint.mjs";

const BODY =
  '<svg viewBox="0 0 720 720" width="720" height="720" xmlns="http://www.w3.org/2000/svg">' +
  "<circle cx=\"10\" cy=\"20\" r=\"4\"/></svg>";

// XML コメント違法性の error だけを取り出す (他の構造 error と混ざらないよう限定判定)。
const xmlCommentErrors = (svg, name) =>
  lintSvgContent(svg, name).errors.filter((e) => e.includes("XML コメントが不正"));

describe("① 違法な XML コメントは必ず発火する", () => {
  const cases = [
    {
      name: "先頭 provenance の '--' (相関 scatter の実際の壊れ方)",
      svg:
        "<!-- data-source: a-height-2nd-male--b-rice-cracker-scatter.json | generated: 2026-08-10T15:00:53.439Z -->\n" +
        BODY,
      file: "a-height-2nd-male--b-rice-cracker-scatter.svg",
    },
    {
      name: "コメント本文の末尾が '-' (--> の直前・'--->' を作る)",
      // 本文 = "x-" (末尾 '-'、"--" は含まない)。XML では '-' の直後に '-->' は違法。
      svg: "<!--x--->\n" + BODY,
      file: "x-scatter.svg",
    },
    {
      name: "本文中コメントの '--'",
      svg: BODY.replace("<circle", "<!-- note: a--b --><circle"),
      file: "x-scatter.svg",
    },
  ];
  for (const c of cases) {
    it(`★${c.name}`, () => {
      const errs = xmlCommentErrors(c.svg, c.file);
      assert.equal(errs.length, 1, `違法コメントを検出できていない: ${c.name}`);
    });
  }
});

describe("② 妥当な SVG は発火しない (誤検知ゼロ)", () => {
  const cases = [
    {
      name: "妥当な provenance (単一ハイフンのみ)",
      svg:
        "<!-- data-source: x-rice-cracker-scatter.json | generated: 2026-08-12T00:00:00.000Z -->\n" +
        BODY,
      file: "x-rice-cracker-scatter.svg",
    },
    {
      name: "XML 安全化後の provenance ('- -' に割れている)",
      svg:
        "<!-- data-source: a-height-2nd-male- -b-rice-cracker-scatter.json | generated: 2026-08-12T00:00:00.000Z -->\n" +
        BODY,
      file: "a-height-2nd-male--b-rice-cracker-scatter.svg",
    },
    {
      name: "コメント無し",
      svg: BODY,
      file: "x-scatter.svg",
    },
    {
      name: "コメント外の本文に '--' があっても無反応 (属性値等)",
      svg: BODY.replace("<circle", '<circle data-note="a--b"'),
      file: "x-scatter.svg",
    },
  ];
  for (const c of cases) {
    it(c.name, () => {
      assert.equal(xmlCommentErrors(c.svg, c.file).length, 0, `誤検知した: ${c.name}`);
    });
  }
});
