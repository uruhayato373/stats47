// e-Stat メタ情報表示用のヘルパー関数

/**
 * 安全にレンダリングするためのヘルパー関数
 * @param value - レンダリングする値
 * @returns 文字列として表示可能な値
 */
export function safeRender(value: unknown): string {
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
    const obj = value as Record<string, unknown>;
    // オブジェクトの場合は、$プロパティがあればそれを表示
    if ("$" in obj && typeof obj.$ === "string") {
      return obj.$;
    }
    // @noプロパティがあればそれを表示
    if ("@no" in obj && typeof obj["@no"] === "string") {
      return obj["@no"];
    }
    // その他の場合は、JSON.stringifyで表示
    return JSON.stringify(value);
  }
  return String(value);
}
