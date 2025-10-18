"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

export interface EstatAPIPageLayoutProps {
  /** ページタイトル */
  title: string;
  /** タイトル横に表示するアイコン */
  icon: React.ComponentType<{ className?: string }>;
  /** ヘッダー右側のアクションボタン（リフレッシュボタンなど） */
  actions?: React.ReactNode;
  /** サイドバーコンテンツ（オプション） */
  sidebar?: React.ReactNode;
  /** メインコンテンツ */
  children: React.ReactNode;
  /** カードラッパーを使用するか（デフォルト: true） */
  useCard?: boolean;
}

export function EstatAPIPageLayout({
  title,
  icon: Icon,
  actions,
  sidebar,
  children,
  useCard = true,
}: EstatAPIPageLayoutProps) {
  const content = (
    <>
      {/* ヘッダーセクション */}
      <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
        <div>
          <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Icon className="w-6 h-6 text-indigo-600" />
            {title}
          </h1>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-x-2">
          {actions}

          {/* e-STAT API リンク */}
          <a
            href="https://www.e-stat.go.jp/api/"
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            e-STAT API
          </a>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      {sidebar ? (
        // サイドバーありレイアウト
        <div className="flex flex-col lg:flex-row min-h-full">
          <div className="flex-1 bg-white dark:bg-neutral-800">
            <div className="p-4 md:p-6 space-y-6">{children}</div>
          </div>
          <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">{sidebar}</div>
        </div>
      ) : (
        // サイドバーなしレイアウト
        <div className="p-4 bg-white dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </div>
      )}
    </>
  );

  if (useCard) {
    return (
      <div className="transition-all duration-300 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="transition-all duration-300 px-3 pb-3 min-h-screen">
      {content}
    </div>
  );
}
