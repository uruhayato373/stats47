/**
 * MLIT KSJ データの R2 パス構築
 */

const R2_MLIT_KSJ_PREFIX = "gis/mlit-ksj/";

export interface MlitKsjR2PathOptions {
  dataId: string;
  version: string;
  prefCode?: string;
  filename?: string;
}

/**
 * R2 保存パスを構築
 *
 * @example
 * buildMlitKsjR2Path({ dataId: "N02", version: "22" })
 * // → "gis/mlit-ksj/N02/22/national.topojson"
 *
 * buildMlitKsjR2Path({ dataId: "P04", version: "20", prefCode: "13" })
 * // → "gis/mlit-ksj/P04/20/13.topojson"
 */
export function buildMlitKsjR2Path(options: MlitKsjR2PathOptions): string {
  const { dataId, version, prefCode } = options;
  const filename =
    options.filename ??
    (prefCode ? `${prefCode}.topojson` : "national.topojson");
  return `${R2_MLIT_KSJ_PREFIX}${dataId}/${version}/${filename}`;
}

/**
 * ローカル R2 ストレージのパスを構築
 */
export function buildMlitKsjLocalPath(
  projectRoot: string,
  options: MlitKsjR2PathOptions
): string {
  return `${projectRoot}/.local/r2/${buildMlitKsjR2Path(options)}`;
}
