import Link from "next/link";

import type { LucideIcon } from "lucide-react";

/**
 * ユーザー統計カードのプロパティ
 */
interface UserStatCardProps {
  /** 表示するアイコン（Lucide React） */
  icon: LucideIcon;
  /** アイコンの色クラス（Tailwind CSS） */
  iconColor: string;
  /** ラベルテキスト */
  label: string;
  /** 表示する値（数値または文字列） */
  value: number | string;
  /** オプションのリンク情報 */
  link?: { href: string; text: string };
}

/**
 * ユーザー統計カードコンポーネント
 *
 * 管理画面でユーザー統計を表示するためのカードコンポーネントです。
 * アイコン、ラベル、値を表示し、オプションでリンクを提供できます。
 *
 * 使用例:
 * ```tsx
 * <UserStatCard
 *   icon={Users}
 *   iconColor="text-blue-500"
 *   label="総ユーザー数"
 *   value={150}
 * />
 *
 * <UserStatCard
 *   icon={Shield}
 *   iconColor="text-green-500"
 *   label="管理者"
 *   value="5名"
 *   link={{ href: "/admin/users", text: "詳細を見る" }}
 * />
 * ```
 *
 * @param icon - 表示するLucide Reactアイコン
 * @param iconColor - アイコンの色クラス（Tailwind CSS）
 * @param label - ラベルテキスト
 * @param value - 表示する値（数値の場合は大きく表示、文字列の場合は通常サイズ）
 * @param link - オプションのリンク情報（hrefとtextを含む）
 */
export function UserStatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  link,
}: UserStatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        {/* アイコン表示 */}
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <div className="ml-4">
          {/* ラベル表示 */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          {/* 値の表示（数値、リンク、文字列の3パターン） */}
          {typeof value === "number" ? (
            // 数値の場合は大きく表示
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          ) : link ? (
            // リンクが指定されている場合はリンクとして表示
            <Link
              href={link.href}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {link.text}
            </Link>
          ) : (
            // 文字列の場合は通常サイズで表示
            <p className="text-sm">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
