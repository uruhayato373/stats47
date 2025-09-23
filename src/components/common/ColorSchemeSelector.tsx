"use client";

import React, { useState } from "react";
import { ChevronDown, Palette } from "lucide-react";

export interface MapVisualizationOptions {
  colorScheme: string;
  divergingMidpoint: 'zero' | 'mean' | 'median' | number;
}

interface ColorSchemeSelectorProps {
  options: MapVisualizationOptions;
  onOptionsChange: (options: MapVisualizationOptions) => void;
  className?: string;
}

interface ColorSchemeInfo {
  name: string;
  displayName: string;
  type: 'sequential' | 'diverging' | 'categorical';
  description: string;
}

const COLOR_SCHEMES: ColorSchemeInfo[] = [
  // Sequential
  { name: 'interpolateBlues', displayName: 'Blues', type: 'sequential', description: '青色系グラデーション' },
  { name: 'interpolateGreens', displayName: 'Greens', type: 'sequential', description: '緑色系グラデーション' },
  { name: 'interpolateReds', displayName: 'Reds', type: 'sequential', description: '赤色系グラデーション' },
  { name: 'interpolateOranges', displayName: 'Oranges', type: 'sequential', description: 'オレンジ系グラデーション' },
  { name: 'interpolatePurples', displayName: 'Purples', type: 'sequential', description: '紫色系グラデーション' },
  { name: 'interpolateGreys', displayName: 'Greys', type: 'sequential', description: 'グレー系グラデーション' },
  { name: 'interpolateViridis', displayName: 'Viridis', type: 'sequential', description: '知覚的に均一な緑-青-紫' },
  { name: 'interpolatePlasma', displayName: 'Plasma', type: 'sequential', description: '知覚的に均一な紫-ピンク-黄' },
  { name: 'interpolateInferno', displayName: 'Inferno', type: 'sequential', description: '知覚的に均一な黒-赤-黄' },
  { name: 'interpolateMagma', displayName: 'Magma', type: 'sequential', description: '知覚的に均一な黒-紫-白' },
  { name: 'interpolateCividis', displayName: 'Cividis', type: 'sequential', description: '色覚障害に配慮した青-黄' },
  { name: 'interpolateWarm', displayName: 'Warm', type: 'sequential', description: '暖色系グラデーション' },
  { name: 'interpolateCool', displayName: 'Cool', type: 'sequential', description: '寒色系グラデーション' },

  // Diverging
  { name: 'interpolateRdBu', displayName: 'Red-Blue', type: 'diverging', description: '赤-白-青の発散' },
  { name: 'interpolateRdYlBu', displayName: 'Red-Yellow-Blue', type: 'diverging', description: '赤-黄-青の発散' },
  { name: 'interpolateRdYlGn', displayName: 'Red-Yellow-Green', type: 'diverging', description: '赤-黄-緑の発散' },
  { name: 'interpolateSpectral', displayName: 'Spectral', type: 'diverging', description: 'スペクトラル発散' },
  { name: 'interpolateBrBG', displayName: 'Brown-Blue-Green', type: 'diverging', description: '茶-青緑の発散' },
  { name: 'interpolatePiYG', displayName: 'Pink-Yellow-Green', type: 'diverging', description: 'ピンク-黄緑の発散' },
  { name: 'interpolatePRGn', displayName: 'Purple-Green', type: 'diverging', description: '紫-緑の発散' },
  { name: 'interpolateRdGy', displayName: 'Red-Grey', type: 'diverging', description: '赤-グレーの発散' },
];

const MIDPOINT_OPTIONS = [
  { value: 'zero' as const, label: 'ゼロ (0)', description: '0を基準値とする' },
  { value: 'mean' as const, label: '平均値', description: 'データの平均値を基準値とする' },
  { value: 'median' as const, label: '中央値', description: 'データの中央値を基準値とする' },
];

export default function ColorSchemeSelector({
  options,
  onOptionsChange,
  className = '',
}: ColorSchemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMidpoint, setCustomMidpoint] = useState<string>('');

  const currentScheme = COLOR_SCHEMES.find(scheme => scheme.name === options.colorScheme);
  const isDivergingScheme = currentScheme?.type === 'diverging';

  const handleSchemeChange = (schemeName: string) => {
    onOptionsChange({
      ...options,
      colorScheme: schemeName,
    });
    setIsOpen(false);
  };

  const handleMidpointChange = (midpoint: 'zero' | 'mean' | 'median' | number) => {
    onOptionsChange({
      ...options,
      divergingMidpoint: midpoint,
    });
  };

  const handleCustomMidpointSubmit = () => {
    const value = parseFloat(customMidpoint);
    if (!isNaN(value)) {
      handleMidpointChange(value);
      setCustomMidpoint('');
    }
  };

  const groupedSchemes = COLOR_SCHEMES.reduce((acc, scheme) => {
    if (!acc[scheme.type]) acc[scheme.type] = [];
    acc[scheme.type].push(scheme);
    return acc;
  }, {} as Record<string, ColorSchemeInfo[]>);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* カラースキーマ選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          <Palette className="w-4 h-4 inline mr-1" />
          カラースキーマ
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-4 rounded border border-gray-300">
                  {/* カラープレビューは後で実装 */}
                  <div className="w-full h-full bg-gradient-to-r from-blue-200 to-blue-600 rounded"></div>
                </div>
                <span>{currentScheme?.displayName || 'Blues'}</span>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  ({currentScheme?.type || 'sequential'})
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none dark:bg-neutral-800 dark:ring-neutral-600">
              {Object.entries(groupedSchemes).map(([type, schemes]) => (
                <div key={type}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-neutral-700 dark:text-neutral-400">
                    {type === 'sequential' ? 'Sequential (連続値)' :
                     type === 'diverging' ? 'Diverging (発散型)' :
                     'Categorical (カテゴリ)'}
                  </div>
                  {schemes.map((scheme) => (
                    <button
                      key={scheme.name}
                      onClick={() => handleSchemeChange(scheme.name)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 ${
                        options.colorScheme === scheme.name ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-4 rounded border border-gray-300">
                          {/* カラープレビューは後で実装 */}
                          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-400 rounded"></div>
                        </div>
                        <div>
                          <div className="font-medium">{scheme.displayName}</div>
                          <div className="text-xs text-gray-500 dark:text-neutral-400">{scheme.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ダイバージング中央値設定 */}
      {isDivergingScheme && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            発散基準値
          </label>
          <div className="space-y-2">
            {MIDPOINT_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="midpoint"
                  value={option.value}
                  checked={options.divergingMidpoint === option.value}
                  onChange={() => handleMidpointChange(option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-neutral-600"
                />
                <div className="ml-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}

            {/* カスタム値入力 */}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="midpoint"
                checked={typeof options.divergingMidpoint === 'number'}
                onChange={() => {}}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-neutral-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">カスタム値:</span>
              <input
                type="number"
                value={typeof options.divergingMidpoint === 'number' ? options.divergingMidpoint : customMidpoint}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomMidpoint(value);
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    handleMidpointChange(numValue);
                  }
                }}
                placeholder="例: 50"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}