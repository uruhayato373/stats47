/**
 * e-STAT統計表IDユーティリティ
 * 責務: ID関連の汎用的な操作
 */
export class EstatIdUtils {
  /**
   * ID範囲から配列を生成
   *
   * @param startId - 開始ID（例: "0000010101"）
   * @param endId - 終了ID（例: "0000010110"）
   * @returns 統計表IDの配列
   * @throws {Error} IDが無効な場合
   *
   * @example
   * EstatIdUtils.generateIdRange("0000010101", "0000010103")
   * // => ["0000010101", "0000010102", "0000010103"]
   */
  static generateIdRange(startId: string, endId: string): string[] {
    const startNum = parseInt(startId);
    const endNum = parseInt(endId);

    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error("開始IDと終了IDは数値である必要があります");
    }

    if (startNum > endNum) {
      throw new Error("開始IDは終了ID以下である必要があります");
    }

    const ids: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      ids.push(this.formatId(i));
    }

    return ids;
  }

  /**
   * 数値をe-STAT統計表ID形式にフォーマット
   *
   * @param num - 数値
   * @returns ゼロパディングされたID（10桁）
   *
   * @example
   * EstatIdUtils.formatId(10101)
   * // => "0000010101"
   */
  static formatId(num: number): string {
    return num.toString().padStart(10, "0");
  }

  /**
   * IDの妥当性を検証
   *
   * @param id - 統計表ID
   * @returns 妥当な場合true
   */
  static isValidId(id: string): boolean {
    return /^\d{10}$/.test(id);
  }

  /**
   * IDを正規化（桁数調整）
   *
   * @param id - 統計表ID
   * @returns 正規化されたID
   * @throws {Error} IDが無効な場合
   */
  static normalizeId(id: string): string {
    const num = parseInt(id);
    if (isNaN(num)) {
      throw new Error(`無効なID: ${id}`);
    }
    return this.formatId(num);
  }
}
