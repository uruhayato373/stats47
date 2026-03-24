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
  } else if (body instanceof Buffer) {
    return body.length;
  } else if (body instanceof ArrayBuffer) {
    return body.byteLength;
  } else if (body instanceof Uint8Array) {
    return body.length;
  }
  return 0;
}
