import type {
    EstatClassId,
    EstatClassInfo,
} from "../stats-data/types";

import { logger } from "@stats47/logger";
import { extractUnitFromText } from "./extract-unit-from-text";
import { findClassObject } from "./find-class-object";

/**
 * CLASS_INFから単位を抽出
 *
 * 優先順位: tab > cat01 > cat02 > cat03
 *
 * @param classInf - e-Stat APIのCLASS_INF
 * @returns 単位（見つからない場合はnull）
 */
export function extractUnitFromClassInf(
  classInf: EstatClassInfo | undefined
): string | null {
  if (!classInf || !classInf.CLASS_OBJ) {
    return null;
  }

  // 優先順位: tab > cat01 > cat02 > cat03
  const classesToCheck: Array<EstatClassId> = [
    "tab",
    "cat01",
    "cat02",
    "cat03",
  ];

  for (const classId of classesToCheck) {
    const targetClass = findClassObject(classInf, classId);
    if (!targetClass || !targetClass.CLASS) {
      continue;
    }

    const classes = Array.isArray(targetClass.CLASS)
      ? targetClass.CLASS
      : [targetClass.CLASS];

  // CLASSの中から@unitを持つものを探す
    for (const cls of classes) {
      if (cls["@unit"]) {
        logger.info(
          {
            foundInClass: classId,
            className: targetClass["@name"],
            itemCode: cls["@code"],
            itemName: cls["@name"],
            unit: cls["@unit"],
          },
          "単位を発見（@unit属性）"
        );
        return cls["@unit"];
      }
    }
  }

  // フォールバック: @unitが見つからない場合、項目名(@name)から抽出を試みる
  // 例: "出荷額（百万円）" -> "百万円"
  for (const classId of classesToCheck) {
    const targetClass = findClassObject(classInf, classId);
    if (!targetClass || !targetClass.CLASS) {
      continue;
    }

    const classes = Array.isArray(targetClass.CLASS)
      ? targetClass.CLASS
      : [targetClass.CLASS];

    for (const cls of classes) {
      if (cls["@name"]) {
        const extractedUnit = extractUnitFromText(cls["@name"]);
        if (extractedUnit) {
          logger.info(
            {
              foundInClass: classId,
              className: targetClass["@name"],
              itemCode: cls["@code"],
              itemName: cls["@name"],
              extractedUnit,
            },
            "単位を発見（項目名から抽出）"
          );
          return extractedUnit;
        }
      }
    }
  }

  logger.warn(
    {
      checkedClasses: classesToCheck,
    },
    "いずれのクラスからも単位が見つかりませんでした"
  );

  return null;
}
