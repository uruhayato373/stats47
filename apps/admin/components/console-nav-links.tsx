"use client";

import { usePathname, useSearchParams } from "next/navigation";

type NavLinkItem = { href: string; label: string };
export type NavGroup = { title: string | null; items: readonly NavLinkItem[] };

const TODO_LAYERS = new Set(["weekly", "monthly", "improvements"]);

/**
 * ルート以外は前方一致。TODO だけは同じ pathname 内の f=層まで比較する。
 * 未知の f はページ側と同じくバックログへフォールバックする。
 */
function isActive(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
  href: string,
): boolean {
  const [path, query = ""] = href.split("?");
  if (href === "/") return pathname === "/";
  if (path === "/todo") {
    if (pathname !== "/todo") return false;
    const expectedLayer = new URLSearchParams(query).get("f");
    const currentLayer = searchParams.get("f");
    if (expectedLayer) return currentLayer === expectedLayer;
    return currentLayer === null || !TODO_LAYERS.has(currentLayer);
  }
  if (path === "/content") return pathname === "/content";
  return pathname === path || pathname.startsWith(path + "/");
}

export function ConsoleNavLinks({ groups }: { groups: readonly NavGroup[] }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

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
            const active = isActive(pathname, searchParams, item.href);
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
