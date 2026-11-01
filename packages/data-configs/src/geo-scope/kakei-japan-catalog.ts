import { getMetricConfig } from '../registry';
import type { JapanCatalogTheme } from './japan-catalog';

/** 公式全国行の実値・単位を検証した家計調査の年次系列。 */
const SPECS = [
  {
    slug: 'household-food-spending', title: '食費と食品購入',
    description: '二人以上世帯の食費、米・納豆・飲料などへの支出額と購入数量が、日本全国で年ごとにどう変わったかを確認できます。',
    keywords: ['家計調査', '食費', '食品', '全国', '時系列'],
    keys: [
      'consumption-expenditure-total', 'food-expenditure-total',
      'rice-consumption-expenditure', 'rice-consumption-quantity',
      'natto-consumption-expenditure', 'green-tea-consumption-quantity',
      'cup-noodles-consumption-expenditure', 'beef-consumption-quantity',
      'coffee-consumption-expenditure', 'sugar-consumption-expenditure', 'sugar-consumption-quantity',
    ],
  },
  {
    slug: 'household-appliances', title: '家電と住まいの用品',
    description: 'エアコン、暖房器具、冷蔵庫、洗濯機などの購入支出と購入数量を、日本全国の年次系列で確認できます。',
    keywords: ['家計調査', '家電', '冷蔵庫', 'エアコン', '全国', '時系列'],
    keys: [
      'air-conditioner-consumption-expenditure', 'air-conditioner-consumption-quantity',
      'heater-consumption-expenditure', 'cooking-appliance-consumption-expenditure',
      'washing-machine-consumption-expenditure', 'vacuum-cleaner-consumption-expenditure',
      'refrigerator-consumption-expenditure', 'refrigerator-consumption-quantity',
      'microwave-consumption-expenditure',
    ],
  },
  {
    slug: 'household-clothing', title: '衣服の購入',
    description: '男女別のコートやセーター、子供服などへの支出と購入数量の変化を、日本全国の家計調査で確認できます。',
    keywords: ['家計調査', '衣服', 'コート', 'セーター', '全国', '時系列'],
    keys: [
      'childrens-clothing-consumption-expenditure', 'other-womens-underwear-consumption-expenditure',
      'mens-coat-consumption-expenditure', 'mens-sweater-consumption-expenditure',
      'mens-underwear-consumption-expenditure', 'mens-clothing-consumption-expenditure',
      'womens-coat-consumption-expenditure', 'womens-coat-consumption-quantity',
      'womens-sweater-consumption-expenditure', 'womens-sweater-consumption-quantity',
      'womens-clothing-consumption-expenditure',
    ],
  },
  {
    slug: 'household-health-spending', title: '医療と健康への支出',
    description: '診療代、薬、眼鏡、コンタクトレンズなどへの支出額を、二人以上世帯の全国年次系列で確認できます。',
    keywords: ['家計調査', '医療費', '薬', '眼鏡', '全国', '時系列'],
    keys: [
      'contact-lens-consumption-expenditure', 'massage-fee-consumption-expenditure',
      'medical-fee-consumption-expenditure', 'supplement-consumption-expenditure',
      'cold-medicine-consumption-expenditure', 'eyeglasses-consumption-expenditure',
      'dental-fee-consumption-expenditure',
    ],
  },
  {
    slug: 'household-transport-spending', title: '自動車と移動への支出',
    description: 'ガソリン、自動車購入、レンタカーへの支出や購入数量が、全国で年ごとにどう変わったかを確認できます。',
    keywords: ['家計調査', '自動車', 'ガソリン', '移動', '全国', '時系列'],
    keys: [
      'gasoline-consumption-expenditure', 'gasoline-consumption-quantity',
      'rental-car-consumption-expenditure', 'car-purchase-consumption-expenditure',
      'car-purchase-consumption-quantity',
    ],
  },
  {
    slug: 'household-education-leisure', title: '教育と娯楽への支出',
    description: '大学や補習教育への支出、テレビ・パソコン・映像などへの支出の変化を全国年次系列で確認できます。',
    keywords: ['家計調査', '教育費', '娯楽', 'テレビ', '全国', '時系列'],
    keys: [
      'camera-consumption-expenditure', 'cable-tv-fee-consumption-expenditure',
      'television-consumption-expenditure', 'television-consumption-quantity',
      'personal-computer-consumption-expenditure', 'recorded-media-consumption-expenditure',
      'language-lesson-consumption-expenditure', 'high-school-tutoring-consumption-expenditure',
      'public-university-consumption-expenditure', 'private-university-consumption-expenditure',
    ],
  },
  {
    slug: 'household-other-purchases', title: '身の回り品と仕送り',
    description: 'かばん、傘、腕時計、仕送り金など、暮らしの支出が全国で年ごとにどう変わったかを確認できます。',
    keywords: ['家計調査', '身の回り品', '仕送り', '全国', '時系列'],
    keys: [
      'tobacco-consumption-expenditure', 'handbag-consumption-expenditure',
      'handbag-consumption-quantity', 'domestic-student-remittance-consumption-expenditure',
      'umbrella-consumption-expenditure', 'umbrella-consumption-quantity',
      'wristwatch-consumption-expenditure',
    ],
  },
] as const;

export const KAKEI_JAPAN_CATALOGS: Record<string, JapanCatalogTheme> = Object.fromEntries(
  SPECS.map(spec => [spec.slug, {
    themeSlug: spec.slug,
    title: spec.title,
    description: spec.description,
    keywords: [...spec.keywords],
    metrics: spec.keys.map(metricKey => {
      const metric = getMetricConfig(metricKey);
      if (!metric || metric.source.kind !== 'kakei-chousa') throw new Error(`家計調査の全国系列に未登録の指標: ${metricKey}`);
      return { metricKey, shortLabel: metric.title };
    }),
  }]),
);
