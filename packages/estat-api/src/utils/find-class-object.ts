import type {
    EstatClassInfo,
    EstatClassObject,
} from "../stats-data/types";

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
