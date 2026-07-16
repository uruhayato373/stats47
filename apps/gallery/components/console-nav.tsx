import { ConsoleNavLinks } from "./console-nav-links";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/sns", label: "SNS" },
  { href: "/assets", label: "画像資産" },
  { href: "/svg", label: "SVG" },
  { href: "/dashboard", label: "現況" },
] as const;

export function ConsoleNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-console-border bg-console-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-6 py-3">
        <span className="text-sm font-bold tracking-tight text-console-fg">
          stats47 統合メディアコンソール
        </span>
        <ConsoleNavLinks items={NAV_ITEMS} />
      </div>
    </header>
  );
}
