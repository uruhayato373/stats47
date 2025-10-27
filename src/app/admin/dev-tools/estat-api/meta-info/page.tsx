import {
  EstatMetaInfoDisplay,
  EstatMetaInfoFetcher,
  EstatMetaInfoSidebar,
} from "@/features/estat-api/meta-info/components";

/**
 * MetaInfoPage - e-Statメタ情報管理ページ
 *
 * 責務:
 * - レイアウト構築のみ
 *
 * 注: データフェッチと状態管理は各コンポーネントに移譲
 */
export default function MetaInfoPage() {
  return (
    <div className="transition-all duration-300 min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex flex-col lg:flex-row min-h-full">
        <div className="flex-1 bg-white dark:bg-neutral-800">
          <div className="p-4 md:p-6 space-y-6">
            <EstatMetaInfoFetcher />
            <EstatMetaInfoDisplay />
          </div>
        </div>
        <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <EstatMetaInfoSidebar className="h-full" />
        </div>
      </div>
    </div>
  );
}
