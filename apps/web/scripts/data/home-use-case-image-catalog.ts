/**
 * home「知りたいことから探す」画像の生成カタログ。
 *
 * 画風・構図・禁止事項を共通化し、用途ごとには主題と色だけを持つ。
 * 元画像は `docs/assets/home-use-case-<id>.png`、配信画像は
 * `apps/web/public/images/home/use-cases/<id>.webp` に固定する。
 */

const HOME_USE_CASE_IMAGE_STYLE =
  'Use case: stylized-concept. Asset type: responsive homepage navigation-card illustration for a Japanese prefectural-statistics website. ' +
  'Create a clean editorial flat-vector illustration with consistent soft geometric forms, crisp edges, and a calm, trustworthy tone. ';

const HOME_USE_CASE_IMAGE_COMPOSITION =
  ' Composition: 3:2 landscape, 1536×1024. Keep the LEFT 58% completely empty and cluster every illustrated object inside the RIGHT 42%, centered vertically, with generous edge padding. ' +
  'Background: perfectly flat, uniform solid chroma-key magenta (#ff00ff), with no texture, gradient, shadow, vignette, noise, paper grain, or lighting variation. ' +
  'The subject must remain legible when displayed small. Do not use magenta or pink in the subject. ' +
  'Strictly no text, letters, numbers, kanji, words, logos, watermarks, photorealism, precise administrative map borders, real charts, or real data values.';

export interface HomeUseCaseImageSubject {
  name: string;
  subject: string;
  palette: string;
}

export const HOME_USE_CASE_IMAGE_SUBJECTS = {
  migration: {
    name: '移住先を比較したい',
    subject:
      'Show a small modern house, two location pins, an abstract cluster of rounded regional tiles that only loosely suggests Japan, and one gentle curved movement arrow. Communicate comparing destinations, not tourism.',
    palette: 'muted indigo, slate blue, pale cyan, warm sand, and off-white',
  },
  'childcare-education': {
    name: '子育て・教育で選びたい',
    subject:
      'Show an open pictureless book, a pencil, three simple building blocks, and a small abstract school building. Communicate comparing educational and childcare environments, not a toy advertisement.',
    palette: 'muted indigo, slate blue, warm amber, pale cream, and off-white',
  },
  'income-cost': {
    name: '年収と物価を比べたい',
    subject:
      'Show a closed wallet, a few coin stacks, a simple grocery basket containing abstract unbranded shapes, and a blank price-tag shape. Communicate purchasing power and household budgets.',
    palette: 'muted indigo, slate blue, warm coral, muted gold, pale cream, and off-white',
  },
  aging: {
    name: '高齢化の実態を知りたい',
    subject:
      'Show three simple faceless geometric human figures representing different generations, a small community house, and a subtle walking cane beside the oldest figure. Keep the figures dignified, active, and neutral; avoid frailty stereotypes.',
    palette: 'muted indigo, slate blue, soft violet, warm sand, pale cream, and off-white',
  },
  healthcare: {
    name: '医療環境を確かめたい',
    subject:
      'Show a stethoscope, a small modern clinic building, a simple medical bag, and a gentle heart-pulse line. Do not use an official Red Cross emblem. Communicate access to healthcare and medical capacity.',
    palette: 'muted indigo, slate blue, soft teal, pale cyan, pale cream, and off-white',
  },
  'local-economy': {
    name: '地域経済を比較したい',
    subject:
      'Show a small local storefront, a tidy low factory with no smoke, a simple cultivated field motif, a few coin stacks, and three abstract vertical blocks of different heights. Communicate regional industry and economic activity without promising growth.',
    palette: 'muted indigo, slate blue, warm terracotta, muted gold, soft teal, pale cream, and off-white',
  },
} as const satisfies Record<string, HomeUseCaseImageSubject>;

export type HomeUseCaseImageId = keyof typeof HOME_USE_CASE_IMAGE_SUBJECTS;

export function buildHomeUseCaseImagePrompt(id: HomeUseCaseImageId): string {
  const entry = HOME_USE_CASE_IMAGE_SUBJECTS[id];
  return (
    HOME_USE_CASE_IMAGE_STYLE +
    `Primary request: ${entry.subject} Palette for the subject only: ${entry.palette}.` +
    HOME_USE_CASE_IMAGE_COMPOSITION
  );
}

export function getHomeUseCaseImageSource(id: HomeUseCaseImageId): string {
  return `docs/assets/home-use-case-${id}.png`;
}

export function getHomeUseCaseImageOutput(id: HomeUseCaseImageId): string {
  return `apps/web/public/images/home/use-cases/${id}.webp`;
}
