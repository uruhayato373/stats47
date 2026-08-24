import { HOME_PORTAL_USE_CASES } from '@stats47/data-configs/home-portal';

import { HorizontalCardCarousel } from '@/components/surface';

import { PortalNavCard } from './PortalNavCard';

/**
 * 「知りたいことから探す」= theme を利用意図へ翻訳した curated use case。
 * 共通carouselで mobile 1枚+peek / sm 2枚 / lg 3枚 / xl 4枚。
 */
export function PortalUseCaseGrid() {
  const items = HOME_PORTAL_USE_CASES.filter((u) => u.isActive).sort(
    (a, b) => a.order - b.order
  );
  return (
    <HorizontalCardCarousel ariaLabel="知りたいことから探す">
      {items.map((u) => (
        <PortalNavCard
          key={u.id}
          href={`/themes/${u.themeKey}`}
          label={u.label}
          description={u.description}
          imageSrc={u.imageSrc}
        />
      ))}
    </HorizontalCardCarousel>
  );
}
