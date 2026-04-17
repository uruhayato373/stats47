import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";

/**
 * `/themes/<slug>` で有効な slug 一覧
 *
 * themes は静的に `ALL_THEMES` で定義されており、対応する page.tsx も個別に
 * 配置されている。未知の slug が渡された場合 Next.js ルーター側で 404 を返すが、
 * middleware で 410 Gone を返して Google に「完全削除」シグナルを送る。
 *
 * 新規テーマ追加時は `all-themes.ts` に登録するだけで自動追従する。
 */
export const KNOWN_THEME_SLUGS: ReadonlySet<string> = new Set(
  ALL_THEMES.map((t) => t.themeKey),
);
