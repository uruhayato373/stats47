export const IMAGE_USES:Record<string,string>;
export const SVG_TEMPLATE:Record<string,string>;
export function catalogTemplates():import('./workspace.mjs').Template[];
export function snsImageTemplate(post:{template?:string|null},asset:{source?:string|null}):string;
