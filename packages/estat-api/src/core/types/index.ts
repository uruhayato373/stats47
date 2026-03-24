/**
 * e-STAT API共通型定義
 */

/** テキストノード（$: 値, @属性: 属性値） */
export interface EstatTextNode {
    $: string;
    "@no"?: string;
    "@code"?: string;
  }
  
  /** APIレスポンス結果 */
  export interface EstatResult {
    STATUS: number;
    ERROR_MSG?: string;
    DATE?: string;
  }
  
  /**
   * HTTP通信エラー
   */
  export class APIResponseError extends Error {
    constructor(
      public message: string,
      public statusCode: number,
      public response?: unknown
    ) {
      super(message);
      this.name = "APIResponseError";
    }
  }
  