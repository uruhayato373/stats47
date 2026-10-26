/**
 * ボディのサイズを計算
 * 
 * @param body - ボディデータ
 * @returns バイト数
 */
export function calculateBodySize(
  body: string | ArrayBuffer | Buffer | Uint8Array
): number {
  if (typeof body === "string") {
    return Buffer.byteLength(body);
  }
  // Buffer・Uint8Array・ArrayBuffer はどれも byteLength を持つ (Buffer の length と同じ値)。
  // instanceof で分けると、新しい @types/node では Buffer の分岐の後に型が絞り込めず length が型エラーになる。
  return body.byteLength;
}
