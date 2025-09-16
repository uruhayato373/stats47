"use client";

import React from "react";
import { Table, Map } from "lucide-react";

export type DisplayMode = 'table' | 'map';

interface EstatModeSelectorProps {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}

export default function EstatModeSelector({
  currentMode,
  onModeChange
}: EstatModeSelectorProps) {
  const modes = [
    {
      key: 'table' as DisplayMode,
      label: 'テーブル',
      icon: Table
    },
    {
      key: 'map' as DisplayMode,
      label: '地図',
      icon: Map
    }
  ];

  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-1 dark:bg-neutral-700">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.key;

        return (
          <button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${isActive
                ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-600 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}