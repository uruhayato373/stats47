/**
 * 次元情報抽出のユーティリティ
 *
 * 統計データAPIのCLASS_INFからの次元情報抽出機能を提供します。
 */


import { logger } from "@stats47/logger";
import { EstatClassInfo, EstatClassObject } from "../types";

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
  const classesToCheck: Array<EstatClassObject["@id"]> = [
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

/**
 * テキストから単位を抽出
 *
 * 全角または半角括弧で囲まれた末尾の文字列を単位として抽出します。
 * 例:
 * - "出荷額（百万円）" -> "百万円"
 * - "人口(人)" -> "人"
 *
 * ただし以下の場合は単位として扱いません：
 * - "除く"、"含む" などで終わる場合（注釈とみなす）
 * - 数字で始まる場合
 * - 10文字を超える場合
 *
 * @param text - 対象テキスト
 * @returns 抽出された単位、またはnull
 */
export function extractUnitFromText(text: string): string | null {
  if (!text) return null;

  let candidate: string | null = null;

  // 全角括弧: （単位）
  const fullWidthMatch = text.match(/（([^）]+)）$/);
  if (fullWidthMatch) {
    candidate = fullWidthMatch[1];
  }

  // 半角括弧: (単位)
  if (!candidate) {
    const halfWidthMatch = text.match(/\(([^)]+)\)$/);
    if (halfWidthMatch) {
      candidate = halfWidthMatch[1];
    }
  }

  if (candidate && isValidUnit(candidate)) {
    return candidate;
  }

  return null;
}

/**
 * 抽出されたテキストが有効な単位かどうかを判定
 *
 * @param text - 判定対象テキスト
 * @returns 有効な単位であればtrue
 */
function isValidUnit(text: string): boolean {
  // 除外キーワードパターン（末尾マッチ）
  const excludeSuffixes = [/除く$/, /含む$/, /のみ$/, /に限る$/, /該当するもの$/];

  for (const pattern of excludeSuffixes) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // 数字で始まるものは除外（例: 2015年）
  // ただし "1000人" のようなケースも考えられるが、
  // 現状のe-Statデータの傾向として括弧内が数字始まりの場合は注釈（年次など）のことが多い
  if (/^\d/.test(text)) {
    return false;
  }

  // 文字数が長すぎる場合も除外（単位としては長すぎる）
  if (text.length > 10) {
    return false;
  }

  return true;
}

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

/**
 * CLASS_OBJから指定されたIDのクラスオブジェクトを取得
 *
 * @param classInf - e-Stat APIのCLASS_INF
 * @param classId - 取得するクラスID
 * @returns クラスオブジェクト、またはnull
 */
export function findClassObject(
  classInf: EstatClassInfo,
  classId: EstatClassObject["@id"]
): EstatClassObject | null {
  const classObj = classInf.CLASS_OBJ;

  if (Array.isArray(classObj)) {
    return classObj.find((c) => c["@id"] === classId) || null;
  } else if (classObj && classObj["@id"] === classId) {
    return classObj;
  }

  return null;
}

