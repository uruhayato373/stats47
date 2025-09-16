"use client";

import React from "react";
import { Table, Map } from "lucide-react";
import { useStyles } from "@/hooks/useStyles";

export type DisplayMode = 'table' | 'map';

interface EstatModeSelectorProps {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}

export default function EstatModeSelector({
  currentMode,
  onModeChange
}: EstatModeSelectorProps) {
  const styles = useStyles();

  const modes = [
    {
      key: 'table' as DisplayMode,
      label: 'テーブル表示',
      icon: Table,
      description: 'データを表形式で詳細表示'
    },
    {
      key: 'map' as DisplayMode,
      label: '地図表示',
      icon: Map,
      description: 'コロプレス地図で可視化'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
      <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
        <h3 className={`font-medium text-sm ${styles.text.primary}`}>
          表示モード
        </h3>
        <p className={`text-xs ${styles.text.tertiary} mt-1`}>
          データの表示方法を選択してください
        </p>
      </div>

      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.key;

            return (
              <button
                key={mode.key}
                onClick={() => onModeChange(mode.key)}
                className={`
                  flex-1 p-4 rounded-lg border transition-all duration-200
                  ${isActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-700'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-neutral-400'
                    }`}
                  />
                  <span className={`font-medium text-sm ${
                    isActive
                      ? 'text-indigo-900 dark:text-indigo-100'
                      : styles.text.primary
                  }`}>
                    {mode.label}
                  </span>
                  <span className={`text-xs mt-1 ${
                    isActive
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : styles.text.tertiary
                  }`}>
                    {mode.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}