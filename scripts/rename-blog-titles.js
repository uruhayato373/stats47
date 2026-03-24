const fs = require('fs');
const path = require('path');

// New title proposals: [slug, newTitle, newSubtitle (optional, null = keep current)]
const proposals = [
  // --- economy ---
  ["prefectural-income-ranking", "共働き率で逆転する世帯月収", null],
  ["household-income-ranking", "世帯月収で1.6倍の首都圏格差", null],
  ["household-spending-ranking", "月の生活費は県で1.4倍違う", null],
  ["household-structure-ranking", "都市は独居、地方は共働き", null],
  ["household-structure-transformation", "日本の世帯は「小さく」なった", null],
  ["per-capita-prefectural-income-ranking", "県民所得2.5倍差の東京と沖縄", null],
  ["real-purchasing-power-ranking", "物価補正で逆転する県の豊かさ", null],
  ["real-wage-ranking", "賃金が高い県は本当に豊かか", null],
  ["savings-balance-ranking", "貯蓄額3倍差の都道府県格差", null],
  ["savings-rate-ranking", "貯蓄率2倍差の家計格差", null],
  ["food-expenditure-ranking", "「食」の消費パターン県間比較", null],
  ["minimum-wage-gap-regional-economy", "最低賃金212円差の地域経済", null],
  ["commercial-sales-productivity-gap", "商業の1人あたり販売額5.3倍差", null],
  ["small-business-dominance-map", "事業所の6割が従業者4人以下の県", null],
  ["fiscal-strength-ranking", "財政力4.2倍差の都道府県格差", null],
  ["local-debt-ranking", "歳入の2倍の借金を抱える県", null],
  ["local-tax-revenue-gap", "地方税割合4倍差の財源格差", null],
  ["expenditure-structure-comparison", "47都道府県の歳出構造を比較", null],

  // --- manufacturing ---
  ["manufacturing-shipment-ranking", "愛知58兆円一強の製造業地図", null],

  // --- laborwage ---
  ["unemployment-rate-ranking", "失業率2倍差の労働市場格差", null],
  ["workplace-accident-regional-map", "労災頻度3.8倍差の地域構造", null],

  // --- population ---
  ["aging-society-ranking", "老年化指数で見る超高齢社会", null],
  ["aging-solo-living-crisis", "高齢独居率の地域差マップ", null],
  ["population-decline-birthrate-ranking", "出生72万、死亡157万の人口減少", null],
  ["birth-rate-fertility-ranking", "合計特殊出生率の都道府県格差", null],
  ["population-density-urbanization", "可住地密度44倍差の日本地図", null],
  ["marriage-divorce-ranking", "結婚も離婚も日本一は沖縄", null],
  ["marriage-unmarried-crisis", "婚姻率の低下が止まらない", null],
  ["foreign-residents-diversity-map", "外国人人口は東京が秋田の9倍", null],
  ["child-physique-ranking", "中学生の体格に3.9cmの地域差", null],

  // --- consumer price ---
  ["consumer-price-regional-gap", "費目で変わる物価の地域差", null],
  ["consumer-price-regional-gap-ranking", "物価指数8ptの県間格差", null],
  ["inflation-rate-ranking", "インフレ率の都道府県格差", null],
  ["cpi-change-rate-ranking", "消費者物価の変化率と地域差", null],

  // --- construction / land ---
  ["commercial-land-price-trend", "都市と地方で10ptの地価格差", null],
  ["habitable-area-land-use", "住める土地は大阪70% vs 高知16%", null],
  ["vacant-house-rate-ranking", "空き家率2倍差の住宅ストック危機", null],

  // --- education ---
  ["education-cost-per-child", "公立小の教育費に1.7倍の地域差", null],
  ["university-advancement-capacity", "大学収容力5倍差の教育格差", null],
  ["school-nonattendance-ranking", "不登校率1.7倍差の地域構造", null],
  ["waiting-children-ranking", "16県がゼロ達成、残る待機児童", null],

  // --- safetyenvironment ---
  ["crime-rate-regional-gap", "治安の良い県、悪い県の差4倍", null],
  ["traffic-accident-deaths-ranking", "交通事故死者の57%が65歳以上", null],
  ["pollution-complaints-regional-map", "公害苦情4.7倍差の地域構造", null],

  // --- agriculture ---
  ["agricultural-output-ranking", "北海道1.3兆円の農業独走", null],
  ["farmland-crisis-abandoned-land", "農地の3割が「受け手なし」の危機", null],
  ["fishery-catch-aquaculture-shift", "「獲る漁業」から「育てる漁業」へ", null],
  ["sixth-industry-direct-sales", "「作って売る」農家が稼ぐ時代", null],
  ["forest-coverage-woodland-economy", "森林大国なのに林業は稼げない", null],

  // --- landweather ---
  ["sunshine-duration-ranking", "太平洋側と日本海側の日照格差", null],
  ["precipitation-snow-regional-gap", "年間降水量3.7倍差の気候格差", null],
  ["temperature-extremes-map", "年平均気温14℃差の日本列島", null],

  // --- socialsecurity ---
  ["health-life-expectancy-structure", "延びた寿命と拡大する不健康期間", null],
  ["nursing-care-infrastructure-ranking", "2040年に介護人材69万人不足", null],
  ["barber-beauty-salon-regional-gap", "理美容所の密度は秋田が3倍", null],
  ["alcohol-consumption-ranking", "酒を最も飲む県、飲まない県", null],

  // --- energy ---
  ["electricity-demand-gap", "電力需要22倍差の産業構造", null],
  ["industrial-water-manufacturing-nexus", "製造業と水資源の切れない関係", null],
  ["water-infrastructure-crisis", "水の安全保障格差マップ", null],
  ["waste-recycling-rate-ranking", "リサイクル率2.4倍の県間差", null],

  // --- ict ---
  ["ict-communication-cost-burden-ranking", "通信費が家計を圧迫する県", null],
  ["ict-mobile-phone-contracts-ranking", "1人1台超え時代の携帯契約格差", null],
  ["ict-post-office-density-ranking", "過疎地の「最後のインフラ」郵便局", null],

  // --- educationsports ---
  ["sports-participation-ranking", "都会ほどスポーツをする逆説", null],
  ["convenience-store-density-map", "コンビニ密度は県で2.4倍差", null],
  ["park-green-space-ranking", "公園と緑地の県間格差8倍", null],
];

const dir = '.local/r2/blog';
let applied = 0;
let skipped = 0;
const report = [];

for (const [slug, newTitle, newSubtitle] of proposals) {
  const mdPath = path.join(dir, slug, 'article.md');
  if (!fs.existsSync(mdPath)) {
    report.push(`SKIP ${slug}: article.md not found`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(mdPath, 'utf8');
  const titleMatch = content.match(/^title:\s*["'](.+?)["']/m);
  const oldTitle = titleMatch ? titleMatch[1] : '';

  if (!oldTitle) {
    report.push(`SKIP ${slug}: no title found`);
    skipped++;
    continue;
  }

  // Count full-width character length
  function charLen(str) {
    let len = 0;
    for (const ch of str) {
      len += ch.charCodeAt(0) > 127 ? 1 : 0.5;
    }
    return len;
  }

  const len = charLen(newTitle);
  const lenMark = len > 17 ? ' ⚠️OVER' : '';

  // Replace title
  content = content.replace(/^(title:\s*["']).+?(["'])/m, `$1${newTitle}$2`);

  // Replace subtitle if provided
  if (newSubtitle !== null) {
    content = content.replace(/^(subtitle:\s*["']).+?(["'])/m, `$1${newSubtitle}$2`);
  }

  fs.writeFileSync(mdPath, content);
  report.push(`✅ ${slug}: "${oldTitle}" → "${newTitle}" (${len}字${lenMark})`);
  applied++;
}

console.log('=== Title Rename Report ===\n');
for (const line of report) console.log(line);
console.log(`\nApplied: ${applied}, Skipped: ${skipped}`);
