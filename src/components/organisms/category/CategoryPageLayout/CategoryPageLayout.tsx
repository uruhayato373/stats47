/**
 * カテゴリページレイアウトコンポーネント
 *
 * カテゴリページの基本レイアウト構造を提供
 */

import React from "react";

interface CategoryPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const CategoryPageLayout: React.FC<CategoryPageLayoutProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen ${className}`}
    >
      <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
        {children}
      </div>
    </div>
  );
};
