/**
 * コロプレス地図用のカラースケールを生成（メイン関数）
 *
 * 順序、発散、カテゴリの3つのカラースケールタイプを統合して
 * 適切なカラースケールを生成します。
 */

import { createCategoricalColorScale } from './create-categorical-color-scale';
import { createDivergingColorScale } from './create-diverging-color-scale';
import { createSequentialColorScale } from './create-sequential-color-scale';

import type { ColorScaleOptions } from "../../types";

/**
 * コロプレス地図用のカラースケールを生成（メイン関数）
 *
 * @param options - カラースケールのオプション
 * @returns 値から色への変換関数
 */
export async function createColorScale(
  options: ColorScaleOptions
): Promise<(value: number) => string> {
  switch (options.type) {
    case 'sequential':
      return createSequentialColorScale(options);
    case 'diverging':
      return createDivergingColorScale(options);
    case 'categorical':
      return createCategoricalColorScale(options);
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(`Unknown color scheme type: ${(options as any).type}`);
  }
}
