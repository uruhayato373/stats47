/**
 * Default prefecture for Geo pages and previews when neither the path nor the
 * query names one (兵庫県, matching the migration content default of 28).
 * Kept free of heavy imports so client components can use it.
 */
export const GEO_DEFAULT_PREF_CODE = '28';
export const GEO_DEFAULT_AREA_CODE = `${GEO_DEFAULT_PREF_CODE}000`;
export const GEO_DEFAULT_PREF_LABEL = '兵庫県（淡路島を含む）';
