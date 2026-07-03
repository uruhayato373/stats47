import Link from 'next/link';

import { Button } from "@stats47/components";
import { LayoutDashboard, Home, MapPin, Search } from "lucide-react";

import { PageShell } from "@/components/layout";

import { NotFoundTracker } from "@/lib/analytics/components/NotFoundTracker";

/** 404 ページに表示する主要動線 */
const NOT_FOUND_LINKS = [
  { href: "/", icon: Home, label: "トップページ" },
  { href: "/themes", icon: LayoutDashboard, label: "テーマから探す" },
  { href: "/areas", icon: MapPin, label: "都道府県から探す" },
  { href: "/search", icon: Search, label: "キーワード検索" },
];

export default function NotFound() {
  return (
    <PageShell variant="reading">
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <NotFoundTracker />
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          404 — Not Found
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
          ページが見つかりません
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          お探しのページは削除されたか、URL が変更された可能性があります。
          下記の主要ページから目的のデータを探してみてください。
        </p>

        <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {NOT_FOUND_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col items-center gap-1.5 rounded-none border border-border bg-card px-3 py-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        <Button asChild className="mt-8">
          <Link href="/">トップページに戻る</Link>
        </Button>
      </div>
    </PageShell>
  );
}
