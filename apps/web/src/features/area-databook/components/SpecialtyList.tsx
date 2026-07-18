import { getSurfaceCardClassName } from "@/components/surface";

import { SpecialtyImage } from "./SpecialtyImage";

import type { AreaEditorial } from "@stats47/data-configs";


/** R2 公開 URL のベース (イラスト解決用)。特産品イラストは常にここから解決を試み、
 *  未生成の県は SpecialtyImage 内の onError でイニシャルに degrade する。 */
const R2_PUBLIC_BASE = "https://storage.stats47.jp";

interface Props {
  editorial: AreaEditorial | null;
}

/**
 * 特産品リスト (イラスト・品名・産地・独自解説・出典)。書籍の写真・文言は複製せず、
 * 品名/産地は事実、解説は editorial の独自書き起こしを表示する。イラストは Codex MCP で
 * R2 に生成配置 (`app/areas/<code>/specialty/<slug>.webp`)。未生成の県は
 * SpecialtyImage の onError でイニシャルの代替タイルに degrade する。
 */
export function SpecialtyList({ editorial }: Props) {
  if (!editorial || editorial.specialties.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 @container @md:grid-cols-2">
      {editorial.specialties.map((sp) => {
        const imgUrl = `${R2_PUBLIC_BASE}/app/areas/${editorial.areaCode}/specialty/${sp.slug}.webp`;
        return (
          <div
            key={sp.slug}
            className={getSurfaceCardClassName({ className: "flex gap-3 p-3" })}
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-none bg-muted">
              <SpecialtyImage
                src={imgUrl}
                alt={sp.name}
                fallbackInitial={sp.name.slice(0, 1)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h4 className="text-sm font-bold text-foreground">{sp.name}</h4>
                <span className="text-[11px] text-muted-foreground">{sp.municipality}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {sp.description}
              </p>
              <a
                href={sp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[10px] text-primary hover:underline"
              >
                出典
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
