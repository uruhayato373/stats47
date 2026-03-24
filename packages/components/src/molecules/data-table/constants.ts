/**
 * DataTableコンポーネントで使用する共通スタイル定数
 */
export const DATA_TABLE_STYLES = {
  /** フィルター用セレクトトリガーのクラス名 */
  selectTrigger: "h-7 w-[150px] text-xs",
  /** フィルター用セレクトコンテンツのクラス名 */
  selectContent: "[&_*]:text-xs",
  /** フィルター用ラベルのクラス名 */
  selectLabel: "text-[10px] font-medium text-muted-foreground",
  /** テキストフィルター用Inputのクラス名 */
  textInput: "h-7 w-[150px]",
  /** ページネーション用セレクトトリガーのクラス名 */
  paginationSelectTrigger: "h-7 w-[70px] text-xs",
} as const;
