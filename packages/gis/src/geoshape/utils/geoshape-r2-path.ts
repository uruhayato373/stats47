/**
 * Geoshape R2 相対パス構築ユーティリティ
 *
 * 外部 API と同一のパス表現（jp_pref.l / city_dc.i 等）で R2 のオブジェクトキーを決める。
 * buildGeoshapePathSegment を利用し、R2 取得・保存の両方で同じパスを使う。
 */

import { buildGeoshapePathSegment } from "./geoshape-url-builder";

import type { GeoshapeOptions } from "../types/geoshape-options";

/** R2 上の geoshape データのプレフィックス */
const R2_GEOSHAPE_PREFIX = "gis/geoshape/";

/**
 * R2 相対パスを構築
 *
 * パスセグメント（buildGeoshapePathSegment）にプレフィックスを付与する。
 * 例: gis/geoshape/20230101/jp_pref.l.topojson, gis/geoshape/20230101/47/47_city_dc.i.topojson
 *
 * @param options - データ取得オプション
 * @returns R2 相対パス
 */
export function buildGeoshapeR2Path(options: GeoshapeOptions): string {
  const pathSegment = buildGeoshapePathSegment(options);
  return `${R2_GEOSHAPE_PREFIX}${pathSegment}`;
}
