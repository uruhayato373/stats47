// generated, do not edit
// Source: packages/r2-storage/src/keys.ts
// Generate: npm run r2-keys:mirror
// Verify: npm run r2-keys:mirror:check
import { SITE } from "./site-config.cjs";
/** Metric observation and ranking snapshot namespaces. Safe in scripts and Workers. */
export const STATS_R2_PREFIX = "app/stats";
export const RANKING_R2_PREFIX = "app/ranking";
export const R2_PUBLIC_ORIGIN = SITE.r2PublicBaseUrl;
const RANKING_KINDS = [
    "item",
    "values",
    "values-per-population",
    "values-per-area",
    "national-trend",
    "ai-content",
    "page-cards",
    "values-per-household",
    "thumbnail",
    "ogp-image",
    "ogp-generation",
    "download",
];
export function rankingR2Key(rankingKey, kind, download) {
    if (typeof rankingKey !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rankingKey)) {
        throw new Error(`Invalid ranking key segment: ${rankingKey}`);
    }
    // Plain-node callers do not have the TypeScript union guard.
    if (!RANKING_KINDS.includes(kind)) {
        throw new Error(`Invalid ranking R2 kind: ${kind}`);
    }
    if (kind === "download") {
        if (!download)
            throw new Error("download requires options");
        const basisSuffix = download.basis === "original" ? "" : `-${download.basis.replace(/_/g, "-")}`;
        const encodingSuffix = download.encoding === "sjis" ? ".sjis" : "";
        return `${RANKING_R2_PREFIX}/${rankingKey}/downloads/values${basisSuffix}${encodingSuffix}.${download.format}`;
    }
    const filename = kind === "ogp-image" ? "ogp/ogp.png"
        : kind === "ogp-generation" ? "ogp/generation.json" : `${kind}.json`;
    return `${RANKING_R2_PREFIX}/${rankingKey}/${filename}`;
}
export function statsR2Key(metricKey, entityKind, year) {
    switch (entityKind) {
        case "prefecture":
            return `${STATS_R2_PREFIX}/${metricKey}/values.json`;
        case "city":
            return `${STATS_R2_PREFIX}/${metricKey}/cities.json`;
        case "port":
            return `${STATS_R2_PREFIX}/${metricKey}/ports.json`;
        case "migration-flow":
            if (year == null)
                throw new Error("migration-flow requires year parameter");
            return `${STATS_R2_PREFIX}/${metricKey}/migration-flow-${year}.json`;
        default: {
            const _exhaustive = entityKind;
            throw new Error(`unknown entity kind: ${_exhaustive}`);
        }
    }
}
