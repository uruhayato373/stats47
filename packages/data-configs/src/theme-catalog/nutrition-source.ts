/** 2024年国民健康・栄養調査の県別年齢調整平均と標本誤差。 */
export const NUTRITION_SOURCE = {
  r2Key: 'app/themes/health-checkups/nutrition.json',
  period: '2024',
  ageAdjustment: '20歳以上・男女とも59歳に調整',
  url: 'https://www.mhlw.go.jp/content/001675215.pdf',
  sha256: 'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
  title: '令和6年国民健康・栄養調査 第67・68表',
  metrics: [
    { key: 'vegetable-intake-male-age-adjusted', label: '野菜摂取量・男性', table: '第67表', pdfPage: 3 },
    { key: 'vegetable-intake-female-age-adjusted', label: '野菜摂取量・女性', table: '第67表', pdfPage: 3 },
    { key: 'salt-intake-male-age-adjusted', label: '食塩摂取量・男性', table: '第68表', pdfPage: 4 },
    { key: 'salt-intake-female-age-adjusted', label: '食塩摂取量・女性', table: '第68表', pdfPage: 4 },
  ],
} as const;
