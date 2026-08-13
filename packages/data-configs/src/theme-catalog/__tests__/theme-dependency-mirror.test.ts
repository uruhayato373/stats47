import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildThemeDependencyMirror } from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";

/**
 * WP4 residual — 依存ミラーの鮮度 (drift guard)。
 *
 * ★live 監査 (`.claude/scripts/audit/theme-chart-live-audit.mjs`) は素の node で走るため
 *   TS collector を import できない。正典 `collectThemeDataDependenciesWithProvenance` から
 *   生成した JSON ミラーを監査母集団の単一ソースにする (unit-semantics の二層 SSOT と同型)。
 *   ここでは committed ミラーが正典の出力と byte 一致することを固定し、catalog を変えたのに
 *   再生成し忘れる (= 監査が古い集合を見る) ドリフトを止める。
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../../..");
const MIRROR = resolve(REPO_ROOT, ".claude/scripts/audit/theme-chart-dependencies.generated.json");

describe("theme dependency mirror — 監査母集団の鏡が正典と一致 (drift guard)", () => {
  it("committed ミラーが live collector 出力と一致 (陳腐化したら --check で落とす)", () => {
    expect(existsSync(MIRROR)).toBe(true);
    const onDisk = JSON.parse(readFileSync(MIRROR, "utf8"));
    const live = buildThemeDependencyMirror(THEME_CATALOGS);
    expect(onDisk).toEqual(live);
  });
});
