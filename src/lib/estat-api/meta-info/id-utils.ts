/**
 * e-STAT統計表IDユーティリティ
 * 責務: ID関連の汎用的な操作
 */

import { EstatIdValidationError } from "../errors";
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
   * e-Stat統計表IDの形式:
   * - 10桁の数字
   * - 先頭は0でも可
   * - 有効な範囲: 0000000001 ~ 9999999999
   *
   * @param id - 統計表ID
   * @returns 妥当な場合true
   */
  static isValidId(id: string): boolean {
    // 基本的な形式チェック
    if (!/^\d{10}$/.test(id)) {
      return false;
    }

    // 数値範囲チェック
    const num = parseInt(id, 10);
    if (num < 1 || num > 9999999999) {
      return false;
    }

    return true;
  }

  /**
   * IDの形式を検証（より詳細なエラー情報を返す）
   *
   * @param id - 統計表ID
   * @returns 検証結果とエラーメッセージ
   */
  static validateIdFormat(id: string): { valid: boolean; error?: string } {
    if (typeof id !== "string") {
      return { valid: false, error: "IDは文字列である必要があります" };
    }

    if (id.length !== 10) {
      return {
        valid: false,
        error: `IDは10桁である必要があります（現在: ${id.length}桁）`,
      };
    }

    if (!/^\d+$/.test(id)) {
      return { valid: false, error: "IDは数字のみで構成される必要があります" };
    }

    const num = parseInt(id, 10);
    if (num < 1) {
      return { valid: false, error: "IDは1以上である必要があります" };
    }

    if (num > 9999999999) {
      return { valid: false, error: "IDは9999999999以下である必要があります" };
    }

    return { valid: true };
  }

  /**
   * IDを正規化（桁数調整）
   *
   * @param id - 統計表ID
   * @returns 正規化されたID
   * @throws {EstatIdValidationError} IDが無効な場合
   */
  static normalizeId(id: string): string {
    const validation = this.validateIdFormat(id);
    if (!validation.valid) {
      throw new EstatIdValidationError(
        validation.error || `無効なID: ${id}`,
        id,
        "normalizeId"
      );
    }

    const num = parseInt(id, 10);
    return this.formatId(num);
  }
}
