"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * EstatAPIPageLayoutProps - e-Stat API ページレイアウトのプロパティ
 */
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
}

/**
 * EstatAPIPageLayout - e-Stat API ページ用の共通レイアウトテンプレート
 *
 * 機能:
 * - e-Stat API 関連ページの統一されたレイアウトを提供
 * - ヘッダー、メインコンテンツ、サイドバーの配置を管理
 * - フラットデザインでシームレスな表示
 * - レスポンシブデザイン対応
 *
 * レイアウト構成:
 * - ヘッダー: タイトル + アイコン + アクションボタン + e-STAT API リンク
 * - メインコンテンツ: サイドバー有無に応じたレイアウト調整
 * - サイドバー: オプション、デスクトップでのみ表示
 *
 * 使用例:
 * ```tsx
 * <EstatAPIPageLayout
 *   title="メタ情報"
 *   icon={Database}
 *   actions={<RefreshButton />}
 *   sidebar={<MetaInfoSidebar />}
 * >
 *   <MetaInfoContent />
 * </EstatAPIPageLayout>
 * ```
 */
export function EstatAPIPageLayout({
  title,
  icon: Icon,
  actions,
  sidebar,
  children,
}: EstatAPIPageLayoutProps) {
  // ===== レイアウトコンテンツの構築 =====
  const content = (
    <>
      {/* ヘッダーセクション */}
      <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
        {/* タイトルエリア */}
        <div>
          <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Icon className="w-6 h-6 text-indigo-600" />
            {title}
          </h1>
        </div>

        {/* アクションボタンエリア */}
        <div className="flex items-center gap-x-2">
          {/* カスタムアクションボタン（リフレッシュボタンなど） */}
          {actions}

          {/* e-STAT API 公式リンク */}
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
        // サイドバーありレイアウト（レスポンシブ対応）
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* メインコンテンツ */}
          <div className="flex-1 bg-white dark:bg-neutral-800">
            <div className="p-4 md:p-6 space-y-6">{children}</div>
          </div>
          {/* サイドバー区切り線（デスクトップのみ） */}
          <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>
          {/* サイドバーコンテンツ */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">{sidebar}</div>
        </div>
      ) : (
        // サイドバーなしレイアウト（全幅使用）
        <div className="p-4 bg-white dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </div>
      )}
    </>
  );

  // ===== レンダリング =====
  // フラットデザイン: 余白とカードスタイルを削除
  return <div className="transition-all duration-300 min-h-screen">{content}</div>;
}
