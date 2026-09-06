import { VERIFIED_PRODUCT_LABELS } from "./verified-product-labels";

/** Delivery labels must retain denominators, population scope and reference periods. */
export function productIndicatorLabel(key: string, cfg: Record<string, unknown>, fallback?: string): string {
  const src = (cfg.source ?? {}) as Record<string, unknown>;
  const verified = VERIFIED_PRODUCT_LABELS[key];
  if (verified) {
    if (src.statsDataId !== verified.statsDataId || String(src.cdCat01 ?? "") !== verified.cdCat01) {
      throw new Error(`Source changed; reverify product label: ${key}`);
    }
    return verified.label;
  }
  const title = String(cfg.title ?? key);
  if (!fallback && /^00000102\d\d$/.test(String(src.statsDataId ?? ""))) {
    throw new Error(`Official indicator definition not verified: ${key}`);
  }
  return fallback || (cfg.subtitle ? `${title}（${String(cfg.subtitle)}）` : title);
}
