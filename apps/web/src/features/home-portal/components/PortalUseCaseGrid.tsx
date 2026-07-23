import { HOME_PORTAL_USE_CASES } from "@stats47/data-configs";

import { PortalNavCard } from "./PortalNavCard";

/**
 * 「知りたいことから探す」= theme を利用意図へ翻訳した curated use case。
 * 文章中心なので mobile 1列 / sm 2列 / lg 3列 (仕様 §9・§6.5)。
 */
export function PortalUseCaseGrid() {
  const items = HOME_PORTAL_USE_CASES.filter((u) => u.isActive).sort(
    (a, b) => a.order - b.order,
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((u) => (
        <PortalNavCard
          key={u.id}
          href={`/themes/${u.themeKey}`}
          label={u.label}
          description={u.description}
          surface="home_use_case"
        />
      ))}
    </div>
  );
}
