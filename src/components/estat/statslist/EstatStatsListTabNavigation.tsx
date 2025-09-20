import { Search, BarChart3, Download, Layers } from "lucide-react";
import { TabId } from "./types";

interface EstatStatsListTabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabs = [
  {
    id: "search" as TabId,
    label: "検索",
    icon: Search,
    description: "統計表を検索",
  },
  {
    id: "summary" as TabId,
    label: "サマリー",
    icon: BarChart3,
    description: "統計サマリー",
  },
  {
    id: "fetch" as TabId,
    label: "フェッチ",
    icon: Download,
    description: "個別データ取得",
  },
  {
    id: "bulk" as TabId,
    label: "一括処理",
    icon: Layers,
    description: "バルク処理",
  },
];

export default function EstatStatsListTabNavigation({
  activeTab,
  onTabChange,
}: EstatStatsListTabNavigationProps) {
  return (
    <div className="border-b border-gray-200 dark:border-neutral-700">
      <nav className="flex space-x-8 px-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`mr-2 h-5 w-5 ${
                  isActive
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-gray-400 group-hover:text-gray-500 dark:text-neutral-500 dark:group-hover:text-neutral-400"
                }`}
              />
              {tab.label}
              <span className="ml-2 hidden sm:inline text-xs opacity-60">
                {tab.description}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}