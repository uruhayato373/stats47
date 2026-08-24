/**
 * home「知りたいことから探す」の編集設定。
 *
 * 現行契約: apps/web/src/features/home-portal/README.md
 *
 * - themeの分類SSOTは変更せず、homeで見せる利用意図と順番だけを型付きgit TSで管理する。
 * - `themeKey`は`ALL_THEMES`に実在することを`validateHomePortal`で検証する。
 * - JSON / D1 / runtime LLMの新しいSSOTを作らない。
 */

/** themeを人間向けの利用意図へ翻訳したhome用項目。 */
export interface HomePortalUseCase {
  /** 一意なID（kebab-case）。 */
  id: string;
  /** 利用意図の表示文。 */
  label: string;
  /** 1行の補足説明。 */
  description: string;
  /** ALL_THEMESに実在するthemeKey。hrefは`/themes/<themeKey>`を導出する。 */
  themeKey: string;
  /** public配下の文字なし・透過WebP。生成仕様はweb側の画像カタログで管理する。 */
  imageSrc: string;
  /** 表示順（1始まりの連番）。 */
  order: number;
  /** 掲載可否。 */
  isActive: boolean;
}

export const HOME_PORTAL_USE_CASES: readonly HomePortalUseCase[] = [
  {
    id: 'migration',
    label: '移住先を比較したい',
    description: '人口移動・転入超過から住みやすい地域を探す',
    themeKey: 'population-dynamics',
    imageSrc: '/images/home/use-cases/migration.webp',
    order: 1,
    isActive: true,
  },
  {
    id: 'childcare-education',
    label: '子育て・教育で選びたい',
    description: '教育環境や文化資源を都道府県で比較する',
    themeKey: 'education-culture',
    imageSrc: '/images/home/use-cases/childcare-education.webp',
    order: 2,
    isActive: true,
  },
  {
    id: 'income-cost',
    label: '年収と物価を比べたい',
    description: '名目と実質の所得・購買力の地域差を見る',
    themeKey: 'real-income',
    imageSrc: '/images/home/use-cases/income-cost.webp',
    order: 3,
    isActive: true,
  },
  {
    id: 'aging',
    label: '高齢化の実態を知りたい',
    description: '高齢化率と社会構造の変化を地域で確かめる',
    themeKey: 'aging-society',
    imageSrc: '/images/home/use-cases/aging.webp',
    order: 4,
    isActive: true,
  },
  {
    id: 'healthcare',
    label: '医療環境を確かめたい',
    description: '医療提供体制や健康指標を都道府県で比較する',
    themeKey: 'healthcare',
    imageSrc: '/images/home/use-cases/healthcare.webp',
    order: 5,
    isActive: true,
  },
  {
    id: 'local-economy',
    label: '地域経済を比較したい',
    description: '産業構造や経済活動の地域差を読み解く',
    themeKey: 'local-economy',
    imageSrc: '/images/home/use-cases/local-economy.webp',
    order: 6,
    isActive: true,
  },
] as const;

const HOME_PORTAL_USE_CASE_LIMIT = 8;

/**
 * home用利用意図の決定的validation。
 *
 * @param themeKeys ALL_THEMESに実在するthemeKeyの集合。
 * @param useCases テスト時に差し替える検証対象。
 */
export function validateHomePortal(
  themeKeys: ReadonlySet<string>,
  useCases: readonly HomePortalUseCase[] = HOME_PORTAL_USE_CASES
): string[] {
  const errors: string[] = [];
  const activeUseCases = useCases.filter((item) => item.isActive);

  if (activeUseCases.length === 0) errors.push('active な use case が無い');
  if (activeUseCases.length > HOME_PORTAL_USE_CASE_LIMIT) {
    errors.push(
      `active use case が上限 ${HOME_PORTAL_USE_CASE_LIMIT} 超: ${activeUseCases.length}`
    );
  }

  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();
  const seenImageSources = new Set<string>();
  const seenOrders = new Set<number>();

  for (const item of useCases) {
    if (seenIds.has(item.id)) errors.push(`use case id 重複: ${item.id}`);
    seenIds.add(item.id);

    if (!themeKeys.has(item.themeKey)) {
      errors.push(
        `themeKey が ALL_THEMES に不在: ${item.id} (${item.themeKey})`
      );
    }

    const href = `/themes/${item.themeKey}`;
    if (seenHrefs.has(href)) errors.push(`use case href 重複: ${href}`);
    seenHrefs.add(href);

    const expectedImageSrc = `/images/home/use-cases/${item.id}.webp`;
    if (item.imageSrc !== expectedImageSrc) {
      errors.push(
        `use case imageSrc がID規約と不一致: ${item.id} (${item.imageSrc})`
      );
    }
    if (seenImageSources.has(item.imageSrc)) {
      errors.push(`use case imageSrc 重複: ${item.imageSrc}`);
    }
    seenImageSources.add(item.imageSrc);

    if (seenOrders.has(item.order)) {
      errors.push(`use case order 重複: ${item.order}`);
    }
    seenOrders.add(item.order);

    if (item.label.trim() === '')
      errors.push(`use case label が空: ${item.id}`);
  }

  const sortedOrders = useCases.map((item) => item.order).sort((a, b) => a - b);
  for (let index = 0; index < sortedOrders.length; index += 1) {
    if (sortedOrders[index] !== index + 1) {
      errors.push(
        `use case order が 1 始まりの連番でない: ${sortedOrders.join(',')}`
      );
      break;
    }
  }

  return errors;
}
