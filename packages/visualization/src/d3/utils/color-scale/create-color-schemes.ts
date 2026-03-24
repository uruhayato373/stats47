/**
 * D3カラースケール関数のマッピングを生成
 *
 * D3.jsのカラースケール補間関数をマッピングオブジェクトとして提供します。
 */

import type { D3Module } from "../../types";

/**
 * D3カラースケール関数のマッピングを生成
 *
 * @param d3 - D3モジュール
 * @returns カラースケール名と補間関数のマッピング
 */
export function createColorSchemes(d3: D3Module): Record<string, (t: number) => string> {
  return {
    // Sequential (単色グラデーション)
    interpolateBlues: d3.interpolateBlues,
    interpolateGreens: d3.interpolateGreens,
    interpolateGreys: d3.interpolateGreys,
    interpolateOranges: d3.interpolateOranges,
    interpolatePurples: d3.interpolatePurples,
    interpolateReds: d3.interpolateReds,

    // Sequential (多色)
    interpolateViridis: d3.interpolateViridis,
    interpolatePlasma: d3.interpolatePlasma,
    interpolateInferno: d3.interpolateInferno,
    interpolateMagma: d3.interpolateMagma,
    interpolateTurbo: d3.interpolateTurbo,
    interpolateCool: d3.interpolateCool,
    interpolateWarm: d3.interpolateWarm,

    // Diverging (発散カラースケール)
    interpolateBrBG: d3.interpolateBrBG,
    interpolatePRGn: d3.interpolatePRGn,
    interpolatePiYG: d3.interpolatePiYG,
    interpolatePuOr: d3.interpolatePuOr,
    interpolateRdBu: d3.interpolateRdBu,
    interpolateRdGy: d3.interpolateRdGy,
    interpolateRdYlBu: d3.interpolateRdYlBu,
    interpolateRdYlGn: d3.interpolateRdYlGn,
    interpolateSpectral: d3.interpolateSpectral,
  };
}
