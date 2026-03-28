/**
 * jsdom型定義
 * @types/jsdomがインストールされていない場合のフォールバック
 */
declare module 'jsdom' {
  export class JSDOM {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fallback type definition
    constructor(html?: string, options?: any);
    window: Window & typeof globalThis;
    document: Document;
  }
}

