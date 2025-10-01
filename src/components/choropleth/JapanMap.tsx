'use client';

import React, { useState } from 'react';
import { ChoroplethDataPoint } from '@/types/choropleth';

interface JapanMapProps {
  data: ChoroplethDataPoint[];
  colorScheme: string;
  onPrefectureClick?: (prefecture: ChoroplethDataPoint) => void;
  onPrefectureHover?: (prefecture: ChoroplethDataPoint | null) => void;
}

export const JapanMap: React.FC<JapanMapProps> = ({
  data,
  colorScheme,
  onPrefectureClick,
  onPrefectureHover,
}) => {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  // データから色を計算
  const getColorForValue = (prefCode: string): string => {
    const prefData = data.find(d => d.prefectureCode === prefCode);
    if (!prefData) return '#e5e7eb'; // グレー（データなし）

    // データの最小値と最大値を取得
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // 正規化（0-1の範囲）
    const normalized = max === min ? 0.5 : (prefData.value - min) / (max - min);

    // カラースキームに基づいて色を生成
    return getColorFromScheme(normalized, colorScheme);
  };

  const handlePrefectureClick = (prefCode: string) => {
    const prefData = data.find(d => d.prefectureCode === prefCode);
    if (prefData && onPrefectureClick) {
      onPrefectureClick(prefData);
    }
  };

  const handlePrefectureHover = (prefCode: string | null) => {
    setHoveredPref(prefCode);
    if (onPrefectureHover) {
      const prefData = prefCode ? data.find(d => d.prefectureCode === prefCode) : null;
      onPrefectureHover(prefData || null);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        style={{ maxWidth: '800px', maxHeight: '600px' }}
      >
        {/* 北海道 */}
        <path
          d="M 200 50 L 280 50 L 290 70 L 280 100 L 250 110 L 210 90 L 200 70 Z"
          fill={getColorForValue('01')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('01')}
          onMouseEnter={() => handlePrefectureHover('01')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 青森県 */}
        <path
          d="M 240 120 L 260 120 L 265 140 L 255 150 L 240 145 Z"
          fill={getColorForValue('02')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('02')}
          onMouseEnter={() => handlePrefectureHover('02')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 岩手県 */}
        <path
          d="M 245 155 L 265 155 L 268 180 L 258 190 L 243 185 Z"
          fill={getColorForValue('03')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('03')}
          onMouseEnter={() => handlePrefectureHover('03')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 宮城県 */}
        <path
          d="M 240 195 L 260 195 L 260 210 L 245 212 Z"
          fill={getColorForValue('04')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('04')}
          onMouseEnter={() => handlePrefectureHover('04')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 秋田県 */}
        <path
          d="M 220 155 L 240 155 L 240 185 L 225 190 Z"
          fill={getColorForValue('05')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('05')}
          onMouseEnter={() => handlePrefectureHover('05')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 山形県 */}
        <path
          d="M 220 195 L 238 195 L 238 215 L 225 218 Z"
          fill={getColorForValue('06')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('06')}
          onMouseEnter={() => handlePrefectureHover('06')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 福島県 */}
        <path
          d="M 225 220 L 255 220 L 258 245 L 240 250 L 225 240 Z"
          fill={getColorForValue('07')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('07')}
          onMouseEnter={() => handlePrefectureHover('07')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 関東地方（簡略化） */}
        {/* 茨城県 */}
        <path
          d="M 245 255 L 265 255 L 268 275 L 250 280 Z"
          fill={getColorForValue('08')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('08')}
          onMouseEnter={() => handlePrefectureHover('08')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 栃木県 */}
        <path
          d="M 225 260 L 243 260 L 243 278 L 228 278 Z"
          fill={getColorForValue('09')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('09')}
          onMouseEnter={() => handlePrefectureHover('09')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 群馬県 */}
        <path
          d="M 205 260 L 223 260 L 223 278 L 210 278 Z"
          fill={getColorForValue('10')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('10')}
          onMouseEnter={() => handlePrefectureHover('10')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 埼玉県 */}
        <path
          d="M 215 282 L 238 282 L 238 298 L 220 298 Z"
          fill={getColorForValue('11')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('11')}
          onMouseEnter={() => handlePrefectureHover('11')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 千葉県 */}
        <path
          d="M 240 285 L 260 285 L 265 305 L 248 310 L 240 300 Z"
          fill={getColorForValue('12')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('12')}
          onMouseEnter={() => handlePrefectureHover('12')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 東京都 */}
        <path
          d="M 220 302 L 238 302 L 238 315 L 225 315 Z"
          fill={getColorForValue('13')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('13')}
          onMouseEnter={() => handlePrefectureHover('13')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 神奈川県 */}
        <path
          d="M 210 318 L 235 318 L 235 330 L 215 330 Z"
          fill={getColorForValue('14')}
          stroke="#fff"
          strokeWidth="1"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePrefectureClick('14')}
          onMouseEnter={() => handlePrefectureHover('14')}
          onMouseLeave={() => handlePrefectureHover(null)}
        />

        {/* 中部地方（簡略化してまとめて配置） */}
        {/* 新潟県 - 山梨県（15-19） */}
        {['15', '16', '17', '18', '19', '20', '21', '22', '23', '24'].map((code, idx) => {
          const x = 160 + (idx % 5) * 25;
          const y = 240 + Math.floor(idx / 5) * 30;
          return (
            <rect
              key={code}
              x={x}
              y={y}
              width="22"
              height="27"
              fill={getColorForValue(code)}
              stroke="#fff"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePrefectureClick(code)}
              onMouseEnter={() => handlePrefectureHover(code)}
              onMouseLeave={() => handlePrefectureHover(null)}
            />
          );
        })}

        {/* 近畿地方（25-30） */}
        {['25', '26', '27', '28', '29', '30'].map((code, idx) => {
          const x = 120 + (idx % 3) * 25;
          const y = 310 + Math.floor(idx / 3) * 30;
          return (
            <rect
              key={code}
              x={x}
              y={y}
              width="22"
              height="27"
              fill={getColorForValue(code)}
              stroke="#fff"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePrefectureClick(code)}
              onMouseEnter={() => handlePrefectureHover(code)}
              onMouseLeave={() => handlePrefectureHover(null)}
            />
          );
        })}

        {/* 中国地方（31-35） */}
        {['31', '32', '33', '34', '35'].map((code, idx) => {
          const x = 90 + idx * 25;
          const y = 380;
          return (
            <rect
              key={code}
              x={x}
              y={y}
              width="22"
              height="27"
              fill={getColorForValue(code)}
              stroke="#fff"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePrefectureClick(code)}
              onMouseEnter={() => handlePrefectureHover(code)}
              onMouseLeave={() => handlePrefectureHover(null)}
            />
          );
        })}

        {/* 四国地方（36-39） */}
        {['36', '37', '38', '39'].map((code, idx) => {
          const x = 105 + idx * 25;
          const y = 420;
          return (
            <rect
              key={code}
              x={x}
              y={y}
              width="22"
              height="27"
              fill={getColorForValue(code)}
              stroke="#fff"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePrefectureClick(code)}
              onMouseEnter={() => handlePrefectureHover(code)}
              onMouseLeave={() => handlePrefectureHover(null)}
            />
          );
        })}

        {/* 九州地方（40-47） */}
        {['40', '41', '42', '43', '44', '45', '46', '47'].map((code, idx) => {
          const x = 60 + (idx % 4) * 25;
          const y = 460 + Math.floor(idx / 4) * 30;
          return (
            <rect
              key={code}
              x={x}
              y={y}
              width="22"
              height="27"
              fill={getColorForValue(code)}
              stroke="#fff"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePrefectureClick(code)}
              onMouseEnter={() => handlePrefectureHover(code)}
              onMouseLeave={() => handlePrefectureHover(null)}
            />
          );
        })}

        {/* ホバー時のツールチップ用テキスト */}
        {hoveredPref && (
          <g>
            <rect
              x="350"
              y="50"
              width="200"
              height="80"
              fill="white"
              stroke="#ccc"
              strokeWidth="1"
              rx="4"
              className="shadow-lg"
            />
            <text x="360" y="75" className="text-sm font-medium fill-gray-900">
              {data.find(d => d.prefectureCode === hoveredPref)?.prefectureName || ''}
            </text>
            <text x="360" y="95" className="text-sm fill-gray-600">
              値: {data.find(d => d.prefectureCode === hoveredPref)?.displayValue || '-'}
            </text>
            <text x="360" y="115" className="text-xs fill-gray-500">
              順位: {data.find(d => d.prefectureCode === hoveredPref)?.rank || '-'}位
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// カラースキームから色を生成
function getColorFromScheme(normalized: number, colorScheme: string): string {
  const intensity = normalized;

  switch (colorScheme) {
    case 'interpolateBlues':
      return `hsl(210, ${50 + intensity * 50}%, ${80 - intensity * 50}%)`;
    case 'interpolateGreens':
      return `hsl(120, ${40 + intensity * 50}%, ${80 - intensity * 50}%)`;
    case 'interpolateOranges':
      return `hsl(25, ${60 + intensity * 40}%, ${85 - intensity * 45}%)`;
    case 'interpolateReds':
      return `hsl(0, ${50 + intensity * 50}%, ${80 - intensity * 50}%)`;
    default:
      return `hsl(210, ${50 + intensity * 50}%, ${80 - intensity * 50}%)`;
  }
}
