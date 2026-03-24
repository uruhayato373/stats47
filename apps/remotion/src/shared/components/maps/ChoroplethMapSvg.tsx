import React from "react";
import type { ChoroplethPathInfo } from "../../utils/choropleth";

interface ChoroplethMapSvgProps {
  paths: ChoroplethPathInfo[];
  width: number;
  height: number;
  /** viewBox のサイズ（パス計算時のサイズ）。省略時は width/height と同じ */
  viewBoxSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
  /** 回転角度 (度) */
  rotation?: number;
  /** ドロップシャドウを表示するか */
  dropShadow?: boolean;
  /** シャドウの色 */
  shadowColor?: string;
  /** シャドウの不透明度 */
  shadowOpacity?: number;
}

/**
 * コロプレス地図の SVG 描画コンポーネント
 *
 * computeChoroplethPaths() で計算済みのパス情報を受け取り、
 * SVG として描画する純粋な表示コンポーネント。
 */
export const ChoroplethMapSvg: React.FC<ChoroplethMapSvgProps> = ({
  paths,
  width,
  height,
  strokeColor = "#ffffff",
  strokeWidth = 0.5,
  viewBoxSize,
  rotation = 0,
  dropShadow = false,
  shadowColor = "#000000",
  shadowOpacity = 0.4,
}) => {
  const filterId = "map-drop-shadow";
  const vbW = viewBoxSize ?? width;
  const vbH = viewBoxSize ?? height;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      {dropShadow && (
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodOpacity={shadowOpacity}
              floodColor={shadowColor}
            />
          </filter>
        </defs>
      )}
      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${width / 2}px ${height / 2}px`,
          filter: dropShadow ? `url(#${filterId})` : "none",
        }}
      >
        {paths.map((info) => (
          <path
            key={info.prefCode}
            d={info.path}
            fill={info.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
};
