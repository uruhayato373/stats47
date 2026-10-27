'use client';

/**
 * Server Component (ルートレイアウトと AppSidebar) が使うサイドバー部品と AdSenseScript の入口。
 *
 * `sidebar.tsx` は 'use client' のモジュールなので、Server Component から直接 import すると
 * 使う部品ごとに client reference が RSC payload に載り、どの route の HTML にも同じ参照の一覧が繰り返される。
 * この 1 ファイルから名前付きで再 export し、Server Component 側の import 先を 1 か所に寄せる
 * (2026-10-28 配信サイズの点検・策 A)。部品の見た目と振る舞いは sidebar.tsx のまま変えない。
 */
export {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@stats47/components/atoms/ui/sidebar';
export { AdSenseScript } from '@/lib/google-adsense/components/AdSenseScript';
