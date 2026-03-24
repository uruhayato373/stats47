/**
 * kazu-note ブランド定義
 *
 * 断酒エッセイシリーズ用のデザイントークン。
 * stats47 のデータ駆動なトーンとは異なり、
 * 温かみのある内省的なビジュアルを目指す。
 */

export const KAZU = {
  /** 背景: 深い暖色系チャコール */
  background: "#1A1614",
  /** 前景: 柔らかいオフホワイト */
  foreground: "#F5F0EB",
  /** ミュート: 温かいグレー */
  muted: "#9C8E82",
  /** アクセント: 琥珀色（断酒の象徴としてのアンバー） */
  accent: "#D4A054",
  /** アクセントライト */
  accentLight: "#E8C88A",
  /** ボーダー */
  border: "rgba(212, 160, 84, 0.2)",
} as const;

/** シリーズごとのアクセントカラー */
export const SERIES_ACCENT = {
  ソバーキュリアス: "#D4A054",
  断酒: "#6B9E78",
  "Re：断酒": "#7A8EAF",
} as const;

export type SeriesName = keyof typeof SERIES_ACCENT;
