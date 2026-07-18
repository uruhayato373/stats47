import Image from "next/image";

import { getSurfaceCardClassName } from "@/components/surface";

import type { AreaEditorial } from "@stats47/data-configs";


interface Props {
  editorial: AreaEditorial | null;
  /** R2 公開 URL のベース (イラスト解決用)。未設定ならイニシャルの代替表示 */
  publicBaseUrl?: string;
}

/**
 * 特産品リスト (品名・産地・独自解説・出典)。書籍の写真・文言は複製せず、
 * 品名/産地は事実、解説は editorial の独自書き起こしを表示する。イラストは Phase 3 で
 * R2 に AI 生成 (task area-specialty)。未生成の間はイニシャルの代替タイルにフォールバックする。
 */
export function SpecialtyList({ editorial, publicBaseUrl }: Props) {
  if (!editorial || editorial.specialties.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 @container @md:grid-cols-2">
      {editorial.specialties.map((sp) => {
        const imgUrl =
          publicBaseUrl && sp.slug
            ? `${publicBaseUrl}/app/areas/${editorial.areaCode}/specialty/${sp.slug}.webp`
            : null;
        return (
          <div
            key={sp.slug}
            className={getSurfaceCardClassName({ className: "flex gap-3 p-3" })}
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-none bg-muted">
              {imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={sp.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
                  {sp.name.slice(0, 1)}
                </div>
              )}
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
