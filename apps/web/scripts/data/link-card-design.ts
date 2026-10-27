/** External cards only. Internal thumbnail renderers do not consume this policy. */
export const LINK_CARD_DESIGN = {
  version: 'note-family-2026-10-26-v1',
  referenceSha256: '4f8f677ae58fbb349eb7138daa5c28e9253026149bf0f5be015a180ecfad6aa6',
  referenceUrl: 'https://assets.st-note.com/production/uploads/images/327706934/rectangle_large_type_2_40e2a97aeb814b8903158b1ca06aec0c.png?width=1200',
  width: 1200, height: 630,
  prompt: `Create a finished Japanese cover, including all exact lettering. Match the reference's bright hand-painted miniature desk objects, bold dark navy lettering with thick white and golden-yellow outlines, sky blue, sunny yellow and purple accents. No people, faces, mascots, fake charts, fake statistics or invented geographic shapes. A cheerful, polished educational illustration, pop and bold. Wide 1.91:1 composition. IMPORTANT: all lettering AND outlines must be confined to the central 42% of image width (x29%-71%), y25%-75%. Side thirds show large topic-specific objects. Compact centered title, not edge-to-edge typography. Use two or three title lines when needed. Pale solid opaque yellow or white backing behind the text; no object or patterned background may cross a letter. The complete central square must remain readable. Include only the supplied exact copy, no price, no invented year, no extra slogans.`,
} as const;

/** Copy is intentionally shorter than the public magazine name, without changing its subject. */
export const MAGAZINE_CARD_DESIGNS: Record<string, {title: string; eyebrow: string; scene: string}> = {
  's47-climate': {title:'気候・自然',eyebrow:'都道府県ランキング',scene:'sun model, white cloud, blue raindrops, green miniature mountain, notebooks'},
  's47-economy': {title:'家計・所得\n物価',eyebrow:'都道府県ランキング',scene:'wallet, coins without numbers, grocery basket, receipt without text, notebooks'},
  's47-housing': {title:'住宅・建設',eyebrow:'都道府県ランキング',scene:'miniature house, wooden blocks, rolled architectural paper without markings, ruler'},
  's47-population': {title:'人口・世帯',eyebrow:'都道府県ランキング',scene:'clusters of miniature houses of different sizes, colorful building blocks, notebooks; no human figures'},
  's47-health': {title:'医療・健康\n社会保障',eyebrow:'都道府県ランキング',scene:'stethoscope, apple, medical bag without cross emblem, green leaves, notebooks'},
  's47-education': {title:'教育・学び',eyebrow:'都道府県ランキング',scene:'open books, oversized pencil, desk lamp, notebooks'},
  's47-sports-culture': {title:'趣味・スポーツ\n文化活動',eyebrow:'都道府県ランキング',scene:'baseball, violin, paint brushes, open book, notebooks'},
  's47-fiscal': {title:'自治体財政',eyebrow:'都道府県ランキング',scene:'miniature civic building, coins without numbers, ledger notebook, wooden calculator without text'},
  's47-kakei-reading': {title:'家計調査の\n読み方',eyebrow:'47都道府県の家計',scene:'shopping basket, household notebook, magnifying glass, colorful grocery objects'},
  's47-agriculture': {title:'農林水産',eyebrow:'都道府県ランキング',scene:'rice stalks, tomato, wooden tree, blue fish model, notebooks'},
  's47-safety': {title:'安全・環境',eyebrow:'都道府県ランキング',scene:'helmet, safety cone, leafy sapling, clear water droplet model, notebooks'},
  's47-labor': {title:'労働・雇用',eyebrow:'都道府県ランキング',scene:'briefcase, desk clock without numbers, work gloves, notebook'},
  's47-tourism': {title:'観光・宿泊',eyebrow:'都道府県ランキング',scene:'travel suitcase, miniature inn, camera, railway ticket without lettering'},
  's47-industry': {title:'産業・商業',eyebrow:'都道府県ランキング',scene:'miniature shop and factory, gear, cardboard boxes, notebooks'},
  's47-infrastructure': {title:'交通・インフラ',eyebrow:'都道府県ランキング',scene:'miniature train, bridge, road, construction blocks, notebooks'},
  's47-energy': {title:'エネルギー\n水',eyebrow:'都道府県ランキング',scene:'light bulb, solar panel model, blue water droplet, notebook'},
  's47-ict': {title:'情報通信',eyebrow:'都道府県ランキング',scene:'laptop without screen text, network cable, antenna, notebooks'},
  's47-international': {title:'国際・外国人',eyebrow:'都道府県ランキング',scene:'suitcase, passport without markings, colorful language books, no maps or flags'},
  'koumuin-claude-code': {title:'Claude Code\n実務活用',eyebrow:'公務員のための',scene:'laptop with blank screen, civic office miniature, purple and yellow folders, notebooks'},
  'koumuin-estat-claude-code': {title:'e-Stat\nClaude Code',eyebrow:'公務員の実務ガイド',scene:'laptop with blank screen, magnifying glass, data folders without text, notebooks'},
  'koumuin-gis': {title:'GIS 入門',eyebrow:'自治体職員のための',scene:'layered abstract terrain model, magnifying glass, laptop without screen text; no invented administrative maps'},
  'product-d3-colors': {title:'D3.js\n配色ガイド',eyebrow:'地図可視化のための',scene:'large colorful paint swatches, paintbrushes, laptop without text, notebooks; no map outlines'},
};

export function magazineCardPrompt(key: string) {
  const item = MAGAZINE_CARD_DESIGNS[key];
  if (!item) throw Error(`Magazine design missing: ${key}`);
  return `${LINK_CARD_DESIGN.prompt}\nRole: magazine cover. Scene: ${item.scene}.\nExact text, top to bottom:\n${item.eyebrow}\n${item.title}\nstats47\nPreserve the supplied title line breaks. The title is the largest text. Do not copy the reference image's title or year.`;
}
