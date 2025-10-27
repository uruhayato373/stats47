/**
 * shadcn/ui クラス名ユーティリティ
 *
 * Tailwind CSS のクラス名を条件付きで結合・マージするために使用されます。
 *
 * @see https://ui.shadcn.com/docs/installation
 *
 * @warning このファイルは削除しないでください
 * プロジェクト全体のUIコンポーネント（32ファイル）で使用されています。
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を条件付きで結合し、Tailwind CSS のクラスをマージする
 *
 * clsx で条件付きクラス名を結合し、twMerge で重複する Tailwind クラスを
 * 適切にマージします（後のクラスが優先されます）。
 *
 * @example
 * ```tsx
 * // 条件付きクラス名
 * cn("base-class", condition && "conditional-class")
 *
 * // Tailwind クラスのマージ
 * cn("px-2 py-1", "px-4") // => "py-1 px-4"
 *
 * // コンポーネントでの使用例
 * <button className={cn(baseStyles, variant === "primary" && primaryStyles)} />
 * ```
 *
 * @param inputs - 結合するクラス名（文字列、配列、オブジェクト等）
 * @returns マージされたクラス名文字列
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
