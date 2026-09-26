/**
 * カテゴリ別のカラークラスマッピング
 *
 * 各カテゴリに固有の背景色・テキスト色を割り当てる。
 * ダークモード対応のため dark: バリアントも指定。
 */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; hoverBg: string; hoverText: string }> = {
  population: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-600 dark:text-blue-400",
    hoverBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
    hoverText: "group-hover:text-white",
  },
  economy: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    hoverBg: "group-hover:bg-amber-600 dark:group-hover:bg-amber-500",
    hoverText: "group-hover:text-white",
  },
  laborwage: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
    hoverText: "group-hover:text-white",
  },
  agriculture: {
    bg: "bg-green-50 dark:bg-green-950/50",
    text: "text-green-600 dark:text-green-400",
    hoverBg: "group-hover:bg-green-600 dark:group-hover:bg-green-500",
    hoverText: "group-hover:text-white",
  },
  commercial: {
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-600 dark:text-orange-400",
    hoverBg: "group-hover:bg-orange-600 dark:group-hover:bg-orange-500",
    hoverText: "group-hover:text-white",
  },
  construction: {
    bg: "bg-stone-100 dark:bg-stone-900/50",
    text: "text-stone-600 dark:text-stone-400",
    hoverBg: "group-hover:bg-stone-600 dark:group-hover:bg-stone-500",
    hoverText: "group-hover:text-white",
  },
  miningindustry: {
    bg: "bg-slate-100 dark:bg-slate-900/50",
    text: "text-slate-600 dark:text-slate-400",
    hoverBg: "group-hover:bg-slate-600 dark:group-hover:bg-slate-500",
    hoverText: "group-hover:text-white",
  },
  educationsports: {
    bg: "bg-violet-50 dark:bg-violet-950/50",
    text: "text-violet-600 dark:text-violet-400",
    hoverBg: "group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
    hoverText: "group-hover:text-white",
  },
  socialsecurity: {
    bg: "bg-pink-50 dark:bg-pink-950/50",
    text: "text-pink-600 dark:text-pink-400",
    hoverBg: "group-hover:bg-pink-600 dark:group-hover:bg-pink-500",
    hoverText: "group-hover:text-white",
  },
  safetyenvironment: {
    bg: "bg-teal-50 dark:bg-teal-950/50",
    text: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-teal-600 dark:group-hover:bg-teal-500",
    hoverText: "group-hover:text-white",
  },
  landweather: {
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    text: "text-cyan-600 dark:text-cyan-400",
    hoverBg: "group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500",
    hoverText: "group-hover:text-white",
  },
  energy: {
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    text: "text-yellow-600 dark:text-yellow-400",
    hoverBg: "group-hover:bg-yellow-600 dark:group-hover:bg-yellow-500",
    hoverText: "group-hover:text-white",
  },
  infrastructure: {
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-600 dark:text-indigo-400",
    hoverBg: "group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500",
    hoverText: "group-hover:text-white",
  },
  ict: {
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-600 dark:text-sky-400",
    hoverBg: "group-hover:bg-sky-600 dark:group-hover:bg-sky-500",
    hoverText: "group-hover:text-white",
  },
  tourism: {
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-600 dark:text-rose-400",
    hoverBg: "group-hover:bg-rose-600 dark:group-hover:bg-rose-500",
    hoverText: "group-hover:text-white",
  },
  international: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-600 dark:text-purple-400",
    hoverBg: "group-hover:bg-purple-600 dark:group-hover:bg-purple-500",
    hoverText: "group-hover:text-white",
  },
  administrativefinancial: {
    bg: "bg-red-50 dark:bg-red-950/50",
    text: "text-red-600 dark:text-red-400",
    hoverBg: "group-hover:bg-red-600 dark:group-hover:bg-red-500",
    hoverText: "group-hover:text-white",
  },
};

const DEFAULT_COLOR = {
  bg: "bg-primary/10",
  text: "text-primary",
  hoverBg: "group-hover:bg-primary",
  hoverText: "group-hover:text-primary-foreground",
};

/**
 * カテゴリキーに対応するカラークラスを取得
 */
export function getCategoryColor(categoryKey: string) {
  return CATEGORY_COLORS[categoryKey] ?? DEFAULT_COLOR;
}
