"use client";

import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };
export type NavGroup = { title: string | null; items: readonly NavItem[] };

/** ルート以外は前方一致。ルートだけ完全一致にしないと全ページで active になる。 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function ConsoleNavLinks({ groups }: { groups: readonly NavGroup[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group, i) => (
        <div key={group.title ?? `group-${i}`} className="flex flex-col gap-0.5">
          {group.title ? (
            <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-console-muted/70">
              {group.title}
            </span>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-md bg-console-accent/15 px-3 py-2 text-sm font-medium text-console-accent"
                    : "rounded-md px-3 py-2 text-sm text-console-muted transition-colors hover:bg-console-border/40 hover:text-console-fg"
                }
              >
                {item.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
