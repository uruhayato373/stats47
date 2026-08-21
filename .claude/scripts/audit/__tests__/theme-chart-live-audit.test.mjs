import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyNational,
  isFiniteEstatValue,
} from "../theme-chart-live-audit.mjs";

/**
 * 全国行判定のテスト (THEME-AUDIT-NATIONAL-VALUE-GAP-01)。
 *
 * ★両方向を固定する。「全 PASS」は「何も見ていない」と区別がつかないため、
 *   ①プレースホルダを実データと誤認しないこと ②実データを誤って捨てないこと の
 *   両方を assert する。①だけ入れると「常に false を返す」実装が通ってしまい、
 *   ②だけ入れると元の「行の存在だけを見る」実装が通ってしまう。
 */

const row = (area, value) => ({ "@area": area, $: value });

test("実データの値は有限数として受け入れる", () => {
  for (const v of ["1234", "0", "12.5", "1,234,567", "-3.2", 42]) {
    assert.equal(isFiniteEstatValue(v), true, `${v} は実データのはず`);
  }
});

test("e-Stat のプレースホルダは実データとして扱わない", () => {
  // '-' (ASCII hyphen) と '‐' (U+2010) の両方が実データに出る。
  for (const v of ["-", "‐", "***", "X", "", "   ", undefined, null]) {
    assert.equal(isFiniteEstatValue(v), false, `${String(v)} はプレースホルダのはず`);
  }
});

test("00000 行が無ければ hasNationalRow も hasNational も false", () => {
  const r = classifyNational([row("01000", "10"), row("13000", "20")]);
  assert.deepEqual(r, { hasNationalRow: false, hasNational: false });
});

test("00000 行があり値が実データなら両方 true", () => {
  const r = classifyNational([row("00000", "5,000"), row("01000", "10")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: true });
});

test("★00000 行はあるが全てプレースホルダなら hasNational は false (旧実装はここで true を返していた)", () => {
  // 実測: in-pref-university-entrance-ratio-by-highschool-origin (0000010205 #E0940302) は
  // 1980-2024 の全 42 時点が '-'。行の存在だけを見ると「全国値あり」と誤判定する。
  const r = classifyNational([row("00000", "-"), row("00000", "‐"), row("01000", "12.3")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: false });
});

test("00000 行が混在するなら 1 つでも実データがあれば hasNational は true", () => {
  const r = classifyNational([row("00000", "-"), row("00000", "3.4")]);
  assert.deepEqual(r, { hasNationalRow: true, hasNational: true });
});
