/**
 * MiniflareのdevalueがBufferを正しく処理できないため、Uint8Arrayに変換
 * BufferはUint8Arrayのサブクラスだが、Miniflareのシリアライズ処理で問題が発生する
 * 
 * @param body - ボディデータ
 * @returns 変換後のデータ
 */
export function convertBodyForR2(
  body: string | ArrayBuffer | Buffer | Uint8Array
): string | ArrayBuffer | Uint8Array {
  if (body instanceof Buffer) {
    return new Uint8Array(body);
  } else if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  } else {
    return body;
  }
}
