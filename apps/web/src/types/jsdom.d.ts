/**
 * jsdom型定義
 * @types/jsdomがインストールされていない場合のフォールバック
 */
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: any);
    window: Window & typeof globalThis;
    document: Document;
  }
}

