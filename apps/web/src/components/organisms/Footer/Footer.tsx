import Link from "next/link";

import { FooterSocialLinks } from "./FooterSocialLinks";

const SITE_LINKS = [
  { href: "/about", label: "このサイトについて" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
] as const;

export function Footer() {
  return (
    <footer
      className="w-full border-t border-border bg-muted/30 py-4 pb-[calc(1rem+var(--safe-area-bottom))]"
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
        <FooterSocialLinks />
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {SITE_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
