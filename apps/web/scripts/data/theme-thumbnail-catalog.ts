/**
 * テーマのサムネイル (サイト内カードの 16:9 の絵) の生成カタログ。
 *
 * 画風は外部 OGP (`link-card-design.ts` の LINK_CARD_DESIGN) に寄せる: 明るい手描きのミニチュアの小物、
 * 空色・黄色・紫の差し色。ただし OGP と違い、中央の文字の面と文字は入れない (題名はカードの DOM の文字が持つ。
 * 2026-11-16 オーナー判断)。共通の指示 (画風・構図・禁止事項) はここだけに置き、テーマごとには描く小物 (scene) だけを持つ。
 *
 * 元画像は `assets/themes/thumbnails/<key>.jpg` (3:2・1536×1024。Codex の PNG を ingest で JPEG にして 1MB 未満に収める)、配信画像は
 * `apps/web/public/images/themes/<key>.webp` (640×360・中央で 16:9 に切り出す)。
 * 生成は Codex (経路の正本は config/image-generation-routes.json の theme-thumbnail)。
 */

const THEME_THUMBNAIL_STYLE =
  'Asset type: thumbnail illustration for a theme card on a Japanese prefectural-statistics website. ' +
  'Bright hand-painted miniature desk objects in a cheerful, polished educational illustration style, pop and bold, ' +
  'with sky blue, sunny yellow and deep blue-violet purple (#6637b8) accents, soft daylight, and a light warm tabletop or pale sky backdrop. ' +
  'Use the deep blue-violet for every purple element; no pink, magenta, or pale lavender. ' +
  'Objects look like simplified painted wooden toys with smooth surfaces; food and plants are toy-like and simplified, not photorealistic. ';

const THEME_THUMBNAIL_COMPOSITION =
  ' Composition: 3:2 landscape, 1536×1024, full-bleed scene with no empty text panel. ' +
  'Place the main objects inside the central 80% of the width and the central 70% of the height so the picture survives a center crop to 16:9 and still reads at 240px wide; leave clear background above the tallest object and below the lowest one. ' +
  'Two to four large objects, few small details, clear silhouettes. ' +
  'Strictly no text, letters, numbers, kanji, words, logos, brand marks, watermarks, people, faces, hands, mascots, fake charts, fake statistics, maps, or invented geographic shapes. ' +
  'Do not draw an official Red Cross emblem.';

export interface ThemeThumbnailSubject {
  /** テーマの名前 (確認用。表示には使わない) */
  name: string;
  /** 描く小物 (英語。1 文) */
  scene: string;
}

export const THEME_THUMBNAIL_SUBJECTS = {
  'population-dynamics': { name: '人口動態', scene: 'a cluster of miniature houses of different sizes, a baby rattle, a small moving box, and a curved arrow made of colored wooden blocks' },
  'aging-society': { name: '少子高齢化', scene: 'a wooden walking cane, reading glasses on a cushion, a baby shoe, and a small house model' },
  'living-housing': { name: '暮らし・住まい', scene: 'a miniature detached house and a small apartment block model, a set of house keys, and a tidy floor-plan sketch without any lettering' },
  'local-economy': { name: '地域経済', scene: 'a miniature storefront, a small clean factory model, stacked gold coins, and a sprout growing from a coin' },
  'labor-wages': { name: '労働・賃金', scene: 'a pay envelope without writing, stacked coins, a work helmet, and a wall clock' },
  manufacturing: { name: '製造業', scene: 'large meshing gears, a small factory model without smoke, a wrench, and a cardboard product box' },
  healthcare: { name: '医療・健康', scene: 'a stethoscope, a first-aid bag without symbols, a small clinic building model, and a heart-shaped cushion' },
  safety: { name: '安全', scene: 'a toy fire truck, a traffic cone, a padlock, and a fire extinguisher' },
  'education-culture': { name: '教育・文化', scene: 'an open textbook without readable writing, a graduation cap, colored pencils, and a small school building model' },
  tourism: { name: '観光', scene: 'a suitcase, a camera, a hot-spring towel bundle, and a small bullet-train toy' },
  'consumer-prices': { name: '物価・消費', scene: 'a shopping basket of vegetables and bread, a blank price tag, a coin purse, and a small scale' },
  'foreign-residents': { name: '外国人', scene: 'a passport-like booklet without marks, a paper airplane, a suitcase, and a small house model' },
  'occupation-salary': { name: '職業別年収', scene: 'a row of work tools — a stethoscope, a laptop, a hard hat, and a chef hat — beside a stack of coins' },
  'real-income': { name: '実質収入・購買力', scene: 'an open wallet, a shopping bag, a balance scale weighing coins against groceries, and a magnifying glass' },
  'labor-mobility': { name: '人材流動性・雇用環境', scene: 'a briefcase, a pair of shoes stepping between two small office building models, and a wall calendar without numbers' },
  'local-finance': { name: '地方財政', scene: 'a piggy bank, a small classical town hall model, stacked coins, and a ledger notebook without writing' },
  'fishery-marine': { name: '漁業（水産業）', scene: 'a small fishing boat model, a fish on a wooden board, a coiled rope, and a fishing float' },
  ports: { name: '港湾', scene: 'a container ship model, stacked colorful shipping containers, a harbor crane, and an anchor' },
  railway: { name: '鉄道', scene: 'a toy train on curved wooden rails, a small station platform model, and a ticket punch' },
  roads: { name: '道路', scene: 'a winding toy road with a small car, a traffic cone, a road roller toy, and a miniature bridge' },
  climate: { name: '気候', scene: 'a sun model, a white cloud, blue raindrops, a snowflake, and a thermometer' },
  'construction-industry': { name: '建設業', scene: 'a toy excavator, a small crane, stacked steel beams, and a hard hat' },
  'waste-recycling': { name: 'ごみ・リサイクル', scene: 'three colored recycling bins, a crushed can, a glass bottle, and a looping green arrow made of paper' },
  'information-industry': { name: '情報通信業', scene: 'a laptop with a blank screen, a server rack model, a router with antennas, and a cable coil' },
  'land-property-market': { name: '不動産取引と地価', scene: 'a small plot of land with a wooden fence, a house model, a blank sold sign shape, and a measuring tape' },
  'agriculture-production': { name: '農業の生産力', scene: 'rice stalks, a basket of vegetables, a small toy tractor, and a watering can' },
  'forestry-timber': { name: '森林・林業・木材産業', scene: 'stacked logs, a pine tree model, a hand saw, and wooden planks' },
  'retail-commerce': { name: '商業と小売', scene: 'a miniature shop with an awning, a shopping cart, a cash register without digits, and paper bags' },
  'local-services': { name: '飲食・生活関連サービス', scene: 'a ramen bowl, a barber pole, a folded towel, and a laundry basket' },
  'business-demography': { name: '起業と開廃業', scene: 'a small shop model with an open-sign shape without lettering, a sprout in a pot, a key, and a closed shutter model' },
  'innovation-patents': { name: '研究開発と特許', scene: 'a glowing light bulb, a microscope, a flask, and a small rocket model' },
  'childcare-services': { name: '保育の需給', scene: 'a small nursery building model, building blocks, a baby bottle, and a tiny backpack' },
  'single-parent-households': { name: 'ひとり親家庭の生活', scene: 'a small house model, a lunch box, a child backpack, and a warm mug' },
  'long-term-care': { name: '介護認定とサービスの需給', scene: 'a wheelchair model, a care bed model, a warm blanket, and a small care home building' },
  'disability-support': { name: '障害福祉と社会参加', scene: 'a wheelchair model, a white cane, a ramp model, and a small community building' },
  'public-assistance': { name: '生活保護と生活困窮', scene: 'a small house model under an umbrella, a rice bowl, and a coin purse' },
  'health-checkups': { name: '生活習慣と健診', scene: 'a bathroom scale without digits, a blood pressure cuff, a measuring tape, and an apple' },
  'daily-time-use': { name: '睡眠と生活時間', scene: 'an alarm clock without numerals, a pillow, a coffee cup, and an hourglass' },
  'household-assets-debt': { name: '貯蓄と負債', scene: 'a piggy bank, a bank passbook without writing, stacked coins, and a house key' },
  'freight-logistics': { name: '物流と貨物輸送', scene: 'a toy delivery truck, stacked cardboard boxes, a hand cart, and a cargo plane toy' },
  'regional-transport': { name: '自動車依存と移動手段', scene: 'a toy car, a toy bus, a bicycle, and a bus-stop pole without signs' },
  'geographic-access': { name: '交通空白と生活アクセス', scene: 'a small station model, a footpath with footprints, a bicycle, and a compass' },
  'water-services': { name: '水道の持続性', scene: 'a water faucet with droplets, a water pipe section, a wrench, and a glass of water' },
  'communication-access': { name: '通信環境とデジタル基盤', scene: 'a smartphone with a blank screen, a Wi-Fi router, a small antenna tower, and a cable coil' },
  'regional-energy': { name: 'エネルギー消費', scene: 'a small solar panel, an electric plug, a light bulb, and a power socket' },
  'environmental-quality': { name: '大気と水環境', scene: 'a clear water droplet, a leaf, a test tube of clean water, and a small white cloud' },
  'natural-environment': { name: '森林と自然環境', scene: 'a miniature forest of trees, a mountain model, a bird, and a small stream' },
  'earthquake-exposure': { name: '地震への備え', scene: 'an emergency backpack, a safety helmet, a flashlight, and a bottle of water' },
  'landslide-exposure': { name: '土砂災害', scene: 'a small hillside model with a retaining wall, a rain cloud, and a safety helmet' },
  'tsunami-exposure': { name: '津波と沿岸防災', scene: 'a coastal seawall model, a tall evacuation tower model, and a stylized wave' },
  'cultural-participation': { name: '文化芸術への参加', scene: 'a theater curtain model, a painting easel, an open book without readable writing, and a violin' },
  'sports-participation': { name: 'スポーツ施設と利用', scene: 'a soccer ball, a baseball glove, plain running shoes with no logos, swooshes, or stripes, and a small stadium model' },
  'local-government-digital': { name: '自治体DX', scene: 'a small town hall model, a tablet with a blank screen, an envelope, and a cloud icon shape' },
  'gender-participation': { name: '地域の男女共同参画', scene: 'two matching briefcases side by side, a balance scale in equilibrium, and a cooking pot' },
  'community-participation': { name: '市民参加と地域活動', scene: 'a ballot box without marks, a volunteer armband without lettering, a broom, and a small community hall' },
  'household-food-spending': { name: '食卓と家計の支出', scene: 'a dining table with a rice bowl, grilled fish, vegetables, and a coin purse' },
} as const satisfies Record<string, ThemeThumbnailSubject>;

export type ThemeThumbnailKey = keyof typeof THEME_THUMBNAIL_SUBJECTS;

export function isThemeThumbnailKey(key: string): key is ThemeThumbnailKey {
  return key in THEME_THUMBNAIL_SUBJECTS;
}

export function buildThemeThumbnailPrompt(key: ThemeThumbnailKey): string {
  return (
    THEME_THUMBNAIL_STYLE +
    `Primary request: ${THEME_THUMBNAIL_SUBJECTS[key].scene}.` +
    THEME_THUMBNAIL_COMPOSITION
  );
}

export function getThemeThumbnailSource(key: ThemeThumbnailKey): string {
  return `assets/themes/thumbnails/${key}.jpg`;
}

export function getThemeThumbnailOutput(key: ThemeThumbnailKey): string {
  return `apps/web/public/images/themes/${key}.webp`;
}
