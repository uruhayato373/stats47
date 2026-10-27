'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { mediaUrl, templateReturnUrl } from '@/lib/media-workspace-navigation';

export function MediaWorkspaceNav({
  active,
  template = '',
  owner = '',
  dirty = false,
}: {
  active: 'templates' | 'images' | 'articles';
  template?: string;
  owner?: string;
  dirty?: boolean;
}) {
  const params = useSearchParams();
  const returnTo =
    active === 'templates'
      ? mediaUrl('templates', Object.fromEntries(params))
      : (templateReturnUrl(params.get('returnTo')) ?? '');
  const links = [
    ['templates', '型の見本', returnTo || mediaUrl('templates', { template })],
    ['images', '画像ライブラリ', mediaUrl('images', { template, returnTo })],
    ['articles', '記事・投稿の改善', mediaUrl('articles', { owner, returnTo })],
  ] as const;
  return (
    <nav
      aria-label="画像・記事の管理"
      className="flex shrink-0 flex-wrap items-center gap-2"
    >
      <SidebarTrigger
        className="hidden md:inline-flex"
        aria-label="メニューを切り替える"
      />
      {links.map(([key, label, href]) => (
        <Link href={href} aria-current={active === key ? 'page' : undefined} onClick={(event) => {
              if (
                active === key ||
                (dirty &&
                  !window.confirm(
                    '未保存の変更があります。ページを移動しますか？'
                  ))
              )
                event.preventDefault();
            }} key={key} data-slot="button" className={buttonVariants({ variant: active === key ? 'default' : 'outline', size: "sm" })}>
            {label}
          </Link>
      ))}
    </nav>
  );
}
