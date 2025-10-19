/**
 * カテゴリカラーマッピング
 *
 * カテゴリの色定義を一元管理し、UIコンポーネントで再利用可能にする
 */

export interface CategoryColorClasses {
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
}

export const categoryColorMap: Record<string, CategoryColorClasses> = {
  teal: {
    bg: "bg-teal-100",
    bgDark: "dark:bg-teal-900/30",
    text: "text-teal-600",
    textDark: "dark:text-teal-400",
  },
  blue: {
    bg: "bg-blue-100",
    bgDark: "dark:bg-blue-900/30",
    text: "text-blue-600",
    textDark: "dark:text-blue-400",
  },
  yellow: {
    bg: "bg-yellow-100",
    bgDark: "dark:bg-yellow-900/30",
    text: "text-yellow-600",
    textDark: "dark:text-yellow-400",
  },
  green: {
    bg: "bg-green-100",
    bgDark: "dark:bg-green-900/30",
    text: "text-green-600",
    textDark: "dark:text-green-400",
  },
  gray: {
    bg: "bg-gray-100",
    bgDark: "dark:bg-gray-900/30",
    text: "text-gray-600",
    textDark: "dark:text-gray-400",
  },
  purple: {
    bg: "bg-purple-100",
    bgDark: "dark:bg-purple-900/30",
    text: "text-purple-600",
    textDark: "dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-100",
    bgDark: "dark:bg-orange-900/30",
    text: "text-orange-600",
    textDark: "dark:text-orange-400",
  },
  indigo: {
    bg: "bg-indigo-100",
    bgDark: "dark:bg-indigo-900/30",
    text: "text-indigo-600",
    textDark: "dark:text-indigo-400",
  },
  red: {
    bg: "bg-red-100",
    bgDark: "dark:bg-red-900/30",
    text: "text-red-600",
    textDark: "dark:text-red-400",
  },
  pink: {
    bg: "bg-pink-100",
    bgDark: "dark:bg-pink-900/30",
    text: "text-pink-600",
    textDark: "dark:text-pink-400",
  },
};

/**
 * カテゴリの色クラスを取得する
 * @param colorName 色の名前
 * @returns 色クラスオブジェクト（デフォルトはgray）
 */
export function getCategoryColorClasses(
  colorName: string
): CategoryColorClasses {
  return categoryColorMap[colorName] || categoryColorMap.gray;
}
