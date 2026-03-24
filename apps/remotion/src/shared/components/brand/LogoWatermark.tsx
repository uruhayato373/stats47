import React from 'react';

interface LogoWatermarkProps {
  /** 横幅 */
  width?: number;
  /** ロゴのメインカラー (デフォルト: "#18181B" などのダーク色) */
  color?: string;
  /** ハイライトの色 (デフォルト: "#2563EB" などのアクセント色) */
  accentColor?: string;
}

/**
 * 日本列島ブロックモチーフのロゴ（横長版）SVGコンポーネント
 * OGP画像のウォーターマーク（透かし）などに使用する
 */
export const LogoWatermark: React.FC<LogoWatermarkProps> = ({
  width = 200,
  color = '#18181B',
  accentColor = '#2563EB',
}) => {
  // 元のViewBoxは 0 0 800 250 なので高さ比率は 250/800 = 0.3125
  const height = width * 0.3125;

  return (
    <svg width={width} height={height} viewBox="0 0 800 250" xmlns="http://www.w3.org/2000/svg">
      {/* 
        背景の <rect width="800" height="250" fill="#FAFAFA"/> 等は、
        ウォーターマークとして使うために透過にするため削除しています。
      */}
      
      {/* Left Side: Icon */}
      <g transform="translate(-220, -25) scale(0.75)">
        <g fill={color}>
          {/* Hokkaido & Tohoku */}
          <rect x="580" y="80" width="8" height="40" rx="4"/>
          <rect x="600" y="60" width="8" height="60" rx="4"/>
          <rect x="620" y="100" width="8" height="30" rx="4"/>
          
          <rect x="560" y="140" width="8" height="50" rx="4"/>
          <rect x="545" y="160" width="8" height="70" rx="4"/>
          
          {/* Kanto / Chubu */}
          <rect x="520" y="210" width="8" height="80" rx="4"/>
          <rect x="500" y="230" width="8" height="60" rx="4"/>
          <rect x="480" y="240" width="8" height="50" rx="4"/>
          
          {/* Highlight */}
          <rect x="460" y="220" width="8" height="70" rx="4" fill={accentColor}/>
          <circle cx="464" cy="210" r="8" fill={accentColor}/>
          
          {/* Chugoku / Shikoku */}
          <rect x="440" y="250" width="8" height="60" rx="4"/>
          <rect x="420" y="270" width="8" height="40" rx="4"/>
          <rect x="400" y="280" width="8" height="30" rx="4"/>
          <rect x="380" y="290" width="8" height="25" rx="4"/>
          
          {/* Kyushu */}
          <rect x="350" y="310" width="8" height="50" rx="4"/>
          <rect x="330" y="330" width="8" height="30" rx="4"/>
        </g>
      </g>
      
      {/* Right Side: Text (Wordmark) */}
      <text x="320" y="142" fontFamily="'Georgia', serif" fontWeight="bold" fontSize="52" fill={color} letterSpacing="2" textAnchor="start">
        stats47<tspan fill={accentColor}>.jp</tspan>
      </text>
    </svg>
  );
};
