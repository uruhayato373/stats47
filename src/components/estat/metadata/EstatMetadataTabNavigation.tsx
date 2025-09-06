"use client";

import { Database, Save, Archive } from "lucide-react";
import { useStyles } from "@/hooks/useStyles";

export type TabId = "fetch" | "save" | "saved";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface EstatMetadataTabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabs: Tab[] = [
  {
    id: "fetch",
    label: "メタ情報取得",
    icon: <Database className="w-4 h-4" />,
    description: "e-Stat APIからメタ情報を取得・表示",
  },
  {
    id: "save",
    label: "メタ情報保存",
    icon: <Save className="w-4 h-4" />,
    description: "取得したメタ情報をデータベースに保存",
  },
  {
    id: "saved",
    label: "保存済データ確認",
    icon: <Archive className="w-4 h-4" />,
    description: "保存済みのメタ情報を閲覧・管理",
  },
];

export default function EstatMetadataTabNavigation({
  activeTab,
  onTabChange,
}: EstatMetadataTabNavigationProps) {
  const styles = useStyles();

  return (
    <div className="border-b border-gray-200 dark:border-neutral-700">
      <nav className="flex space-x-6 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-xs transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === tab.id
                ? `border-indigo-500 ${styles.text.brand}`
                : `border-transparent ${styles.text.secondary} hover:${styles.text.primary} hover:border-gray-300`
            }`}
            title={tab.description}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
