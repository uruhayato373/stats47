import type {
    EstatClassInfo,
} from "../stats-data/types";

import { logger } from "@stats47/logger";
import { findClassObject } from "./find-class-object";

/**
 * CLASS_INFから指定された時間コードに対応する時間名を取得
 *
 * @param classInf - e-Stat APIのCLASS_INF
 * @param timeCode - 時間コード
 * @returns 時間名（見つからない場合はnull）
 */
export function extractTimeNameFromClassInf(
  classInf: EstatClassInfo | undefined,
  timeCode: string
): string | null {
  if (!classInf || !timeCode) {
    return null;
  }

  // @idが"time"のCLASS_OBJを取得
  const timeClassObj = findClassObject(classInf, "time");
  if (!timeClassObj || !timeClassObj.CLASS) {
    logger.warn({ timeCode }, "時間軸のCLASS_OBJが見つかりませんでした");
    return null;
  }

  const classes = Array.isArray(timeClassObj.CLASS)
    ? timeClassObj.CLASS
    : [timeClassObj.CLASS];

  // @codeがtimeCodeと一致する項目の@nameを取得
  for (const cls of classes) {
    if (cls["@code"] === timeCode) {
      logger.info(
        {
          timeCode,
          timeName: cls["@name"],
        },
        "時間名を取得"
      );
      return cls["@name"];
    }
  }

  logger.warn(
    {
      timeCode,
      availableCodes: classes.map((c) => c["@code"]).slice(0, 10),
    },
    "指定された時間コードに対応する時間名が見つかりませんでした"
  );

  return null;
}
