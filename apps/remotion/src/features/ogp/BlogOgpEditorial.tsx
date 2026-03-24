import React from "react";
import { AbsoluteFill } from "remotion";

import {
  FONT,
  type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

interface BlogOgpEditorialProps {
  title: string;
  subtitle?: string;
  ogpTitle?: string;
  ogpSubtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
  hideWatermark?: boolean;
}

/**
 * ブログ Editorial OGP 画像 (1200x630)
 *
 * モックC「Editorial Typography」に基づくデザイン。
 * 白・ライトグレー基調の余白を活かしたレイアウト。
 */
export const BlogOgpEditorial: React.FC<BlogOgpEditorialProps> = ({
  title,
  subtitle,
  ogpTitle,
  ogpSubtitle,
  theme = "light", // 明るい背景が前提のデザイン
  showGuides = false,
  hideWatermark = false,
}) => {
  const displayTitle = ogpTitle || title;
  const displaySubtitle = ogpSubtitle || subtitle;
  const isLight = theme === "light";
  const titleFontSize = getBlogTitleFontSize(displayTitle);

  // 色定義 (Editorial)
  const bgColor = isLight ? "#F8FAFC" : "#0F172A";
  const sidebarColor = isLight ? "#0F172A" : "#F8FAFC";
  const gridColor = isLight ? "#CBD5E1" : "#334155";
  const textColor = isLight ? "#0F172A" : "#F8FAFC";
  const brandBlue = isLight ? "#2563EB" : "#3B82F6";
  const mutedText = isLight ? "#334155" : "#94A3B8";
  const metaText = isLight ? "#64748B" : "#64748B";

  // 今日の日付 (モック用、必要があればpropsに逃す)
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <OgpSafeZone showGuides={showGuides}>
      <AbsoluteFill
        style={{
          backgroundColor: bgColor,
          fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Splash/Sidebar */}
        {!hideWatermark && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 630, backgroundColor: sidebarColor }} />
        )}
        
        {/* Abstract Background Element (Large Shape) */}
        {!hideWatermark && (
          <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.03, zIndex: 0 }}>
            <path d="M 600 -200 L 1400 -200 L 1400 830 L 800 830 Z" fill={sidebarColor} />
          </svg>
        )}

        {/* Editorial Grid Lines */}
        {!hideWatermark && (
          <svg width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
            <line x1="80" y1="180" x2="1120" y2="180" stroke={gridColor} strokeWidth="1" />
            <line x1="80" y1="460" x2="1120" y2="460" stroke={gridColor} strokeWidth="1" />
          </svg>
        )}

        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {/* Header Row */}
          <div style={{ position: 'absolute', top: 50, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Logo Watermark */}
            {!hideWatermark ? (
              <LogoWatermark width={240} color={sidebarColor} accentColor={brandBlue} />
            ) : (
              <div /> // Spacer
            )}

            {/* Article Meta */}
            {!hideWatermark && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: sidebarColor, letterSpacing: 2 }}>
                  RESEARCH / ANALYSIS
                </div>
                <div style={{ fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 18, color: metaText, marginTop: 4 }}>
                  {dateStr}
                </div>
              </div>
            )}
          </div>

          {/* Main Title Area */}
          <div style={{ position: 'absolute', top: 220, left: 80, width: 1040 }}>
            <h1 style={{ 
              fontSize: titleFontSize, 
              fontWeight: 800, 
              color: textColor, 
              letterSpacing: -2, 
              lineHeight: 1.2,
              margin: 0,
              wordBreak: 'break-word',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {displayTitle.split('\\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </h1>
          </div>

          {/* Subtitle Area */}
          {displaySubtitle && (
            <div style={{ 
              position: 'absolute', 
              bottom: 65, 
              left: 80, 
              right: 80, 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <div style={{ width: 4, height: 60, backgroundColor: brandBlue, marginRight: 24, flexShrink: 0 }} />
              <div style={{ 
                fontSize: 32, 
                fontWeight: 400, 
                color: mutedText,
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {displaySubtitle}
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};

// ... Utility functions for layout
function getBlogTitleFontSize(title: string): number {
  const count = countFullWidthEquivalent(title.replace(/\\n/g, ''));
  if (count > 36) return 48; // 極端に長い場合
  if (count > 28) return 60;
  if (count > 21) return 72;
  if (count > 17) return 82;
  return 90;
}

function countFullWidthEquivalent(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0x3000 && code <= 0x9fff) || (code >= 0xff00 && code <= 0xffef)) {
      count++;
    } else {
      count += 0.5;
    }
  }
  return count;
}
