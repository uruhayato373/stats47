/**
 * データブック PowerPoint ジェネレータ。
 * 実体は pptx.ts の buildDatabookPptx (buildProductPptx を複数データセット対応に拡張したもの)。
 * 生成物のプライベート補助関数を共有するため実装は pptx.ts に置き、ここから再エクスポートする。
 */
export { buildDatabookPptx } from "./pptx";
