/**
 * e-Stat メタ情報表示用のヘルパー関数
 *
 * e-Stat APIのレスポンスを安全にレンダリングするためのユーティリティ関数群。
 * 型安全性を保ちながら、様々なデータ形式に対応する。
 */

/**
 * e-Stat APIのオブジェクト形式用のプロパティ優先順位
 *
 * e-Stat APIでは複数のプロパティ形式が存在するため、
 * 表示優先順位を定義して一貫したレンダリングを実現する。
 */
const ESTAT_PROPERTY_PRIORITY = ["$", "@name", "@no", "@code"] as const;

/**
 * e-Stat APIのオブジェクト型（共通形式）
 *
 * e-Stat APIで使用されるオブジェクトの基本構造を定義。
 * 実際のAPIレスポンスでは、これらのプロパティの一部のみが存在する。
 */
type EstatApiObject = {
  $?: string;
  "@name"?: string;
  "@no"?: string;
  "@code"?: string;
  [key: string]: unknown;
};

/**
 * レンダリング可能な値の型
 *
 * safeRender関数で処理可能な値の型を定義。
 * 基本的な型とe-Stat APIオブジェクトを含む。
 */
type RenderableValue = string | number | null | undefined | EstatApiObject;

/**
 * 安全にレンダリングするためのヘルパー関数
 *
 * e-Stat APIのレスポンスを安全に文字列としてレンダリングする。
 * オブジェクトの場合は優先順位に従ってプロパティを選択し、
 * フォールバックとしてJSON.stringifyを使用する。
 *
 * @param value - レンダリングする値
 * @param options - オプション設定
 * @returns 文字列として表示可能な値
 *
 * @example
 * ```typescript
 * // 基本的な値
 * safeRender("Hello"); // "Hello"
 * safeRender(123); // "123"
 * safeRender(null); // ""
 *
 * // e-Stat APIオブジェクト
 * safeRender({ $: "総務省", "@no": "001" }); // "総務省"
 * safeRender({ "@name": "人口", "@code": "001" }); // "人口"
 * safeRender({ "@no": "001" }); // "001"
 *
 * // カスタム優先順位
 * safeRender({ $: "総務省", "@name": "人口" }, {
 *   propertyPriority: ['@name', '$']
 * }); // "人口"
 * ```
 */
export function safeRender(
  value: RenderableValue,
  options?: {
    propertyPriority?: readonly string[];
    fallbackToJson?: boolean;
  }
): string {
  const { propertyPriority = ESTAT_PROPERTY_PRIORITY, fallbackToJson = true } =
    options || {};

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as EstatApiObject;

    // 優先順位に従ってプロパティを検索
    for (const prop of propertyPriority) {
      if (prop in obj && typeof obj[prop] === "string") {
        return obj[prop] as string;
      }
    }

    // フォールバック: JSON.stringify
    if (fallbackToJson) {
      return JSON.stringify(value);
    }
  }

  return String(value);
}
