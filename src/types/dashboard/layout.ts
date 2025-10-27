/**
 * レイアウトの型定義
 */

export type ResponsiveBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig {
  breakpoint: ResponsiveBreakpoint;
  columns: number;
  gap?: string;
}

export interface LayoutProps {
  layoutType: string;
  children: React.ReactNode;
  className?: string;
}
