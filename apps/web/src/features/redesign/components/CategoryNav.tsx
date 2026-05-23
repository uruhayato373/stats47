import Link from "next/link";

interface CategoryNavItem {
  key: string;
  name: string;
  icon: string;
  href: string;
  active?: boolean;
  color?: string;
}

interface CategoryNavProps {
  items: CategoryNavItem[];
}

/**
 * D-System カテゴリナビ（横一列ピル）
 *
 * - desktop: 最大 9 列のグリッド
 * - tablet: 5 列
 * - mobile: 3 列（横スクロールではなくグリッド折り返し）
 *
 * active 状態を `active: true` + `color` で色付ける（任意）。
 */
export function CategoryNav({ items }: CategoryNavProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
      {items.map((c) => {
        const activeStyle = c.active
          ? {
              backgroundColor: c.color ?? "var(--color-primary)",
              borderColor: c.color ?? "var(--color-primary)",
            }
          : undefined;

        return (
          <Link
            key={c.key}
            href={c.href}
            style={activeStyle}
            className={
              "flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-2.5 text-center transition-colors hover:border-primary/40 " +
              (c.active ? "text-primary-foreground" : "text-foreground")
            }
          >
            <span aria-hidden className="text-lg">
              {c.icon}
            </span>
            <span
              className={
                "text-[11px] leading-tight " +
                (c.active ? "font-bold" : "font-medium")
              }
            >
              {c.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
