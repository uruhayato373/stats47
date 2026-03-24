import React from "react";
import { AbsoluteFill } from "remotion";

import {
  FONT,
  type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { LogoWatermark } from "@/shared/components/brand/LogoWatermark";

interface BlogOgpGlassProps {
  title: string;
  subtitle?: string;
  ogpTitle?: string;
  ogpSubtitle?: string;
  theme?: ThemeName;
  showGuides?: boolean;
  hideWatermark?: boolean;
}

/**
 * ブログ Glassmorphism OGP 画像 (1200x630)
 *
 * モックB「Vibrant Glassmorphism」に基づくデザイン。
 */
export const BlogOgpGlass: React.FC<BlogOgpGlassProps> = ({
  title,
  subtitle,
  ogpTitle,
  ogpSubtitle,
  theme = "dark",  // 暗い背景が前提のデザイン
  showGuides = false,
  hideWatermark = false,
}) => {
  const displayTitle = ogpTitle || title;
  const displaySubtitle = ogpSubtitle || subtitle;
  const isDark = theme === "dark";
  const titleFontSize = getBlogTitleFontSize(displayTitle);

  // 色定義
  const bgColor = "#09090B";
  const brandBlue = "#3B82F6";
  const textColor = "#FAFAFA";
  const mutedColor = "#A1A1AA";

  // 今日の日付 (モック用、必要があればpropsに逃す)
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  return (
    <OgpSafeZone showGuides={showGuides}>
      <AbsoluteFill
        style={{
          backgroundColor: bgColor,
          fontFamily: FONT.family,
          overflow: "hidden",
        }}
      >
        {/* Ambient Glow Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -150, left: -100, width: 500, height: 500, borderRadius: '50%', backgroundColor: '#3B82F6', filter: 'blur(120px)', opacity: 0.3 }} />
          <div style={{ position: 'absolute', bottom: -200, right: -150, width: 600, height: 600, borderRadius: '50%', backgroundColor: '#8B5CF6', filter: 'blur(120px)', opacity: 0.3 }} />
          <div style={{ position: 'absolute', top: 115, left: 200, width: 800, height: 800, borderRadius: '50%', backgroundColor: '#06B6D4', filter: 'blur(120px)', opacity: 0.15 }} />
        </div>

        {/* Glass Card Container */}
        <div style={{ position: 'absolute', top: 60, left: 60, width: 1080, height: 510 }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: 24, 
            backgroundColor: 'rgba(24, 24, 27, 0.4)', 
            border: '1.5px solid rgba(255,255,255,0.15)',
            boxSizing: 'border-box',
            position: 'absolute',
            zIndex: 1,
            backdropFilter: 'blur(30px)'
          }} />

          {/* PatternOverlay inside card */}
          <svg width="100%" height="100%" style={{ position: 'absolute', zIndex: 2, opacity: 0.05, borderRadius: 24 }}>
            <pattern id="cardGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
            <rect width="1080" height="510" fill="url(#cardGrid)" />
          </svg>

          {/* Content */}
          <div style={{ position: 'absolute', zIndex: 10, padding: 60, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', height: '100%' }}>
            
            {/* Top Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ backgroundColor: brandBlue, padding: '6px 16px', borderRadius: 6, color: '#FFFFFF', fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>
                ARTICLE
              </div>
              <div style={{ color: mutedColor, fontWeight: 500, fontSize: 18 }}>
                {dateStr}
              </div>
            </div>

            {/* Typography */}
            <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
              <h1 style={{ 
                fontSize: titleFontSize, 
                fontWeight: 900, 
                color: textColor, 
                margin: 0, 
                lineHeight: 1.2, 
                wordBreak: 'break-word',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}>
                {title.split('\\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </h1>
              
              <div style={{ width: 100, height: 4, backgroundColor: brandBlue, borderRadius: 2, margin: '30px 0' }} />

              {subtitle && (
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 500, 
                  color: '#D4D4D8',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {subtitle}
                </div>
              )}
            </div>

            {/* Logo (Bottom Right) */}
            {!hideWatermark && (
              <div style={{ position: 'absolute', right: 60, bottom: 60 }}>
                <LogoWatermark width={220} color={textColor} accentColor={brandBlue} />
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};

// ... Utility functions for layout
function getBlogTitleFontSize(title: string): number {
  const count = countFullWidthEquivalent(title.replace(/\\n/g, ''));
  if (count > 36) return 44; // 極端に長い場合
  if (count > 28) return 52;
  if (count > 21) return 64;
  if (count > 17) return 72;
  return 80;
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
