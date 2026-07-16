"use client";

import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

export function ConsoleNavLinks({
  items,
}: {
  items: readonly NavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-full bg-console-accent/15 px-3 py-1.5 font-medium text-console-accent"
                : "rounded-full px-3 py-1.5 text-console-muted transition-colors hover:text-console-fg"
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
