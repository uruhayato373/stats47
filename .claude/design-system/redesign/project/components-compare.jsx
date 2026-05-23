/* Compare page sample data — 東京都 vs 大阪府 / カテゴリ: 人口・世帯 */

const COMPARE_REGIONS = [
  { code: "13000", name: "東京都", region: "関東", color: "#1d4ed8", lightColor: "#dbeafe", population: 14010000, area: 2194 },
  { code: "27000", name: "大阪府", region: "近畿", color: "#b45309", lightColor: "#fef3c7", population: 8780000, area: 1905 },
];

const COMPARE_CATEGORY = {
  key: "population-households",
  name: "人口・世帯",
  description: "人口・世帯に関する統計を都道府県間で比較",
  icon: "👥",
};

const COMPARE_CATEGORIES = [
  { key: "population-households", name: "人口・世帯", icon: "👥", active: true },
  { key: "labor-wages",           name: "労働・賃金", icon: "💼" },
  { key: "education-culture",     name: "教育・文化", icon: "📚" },
  { key: "healthcare",            name: "医療・介護", icon: "🏥" },
  { key: "safety",                name: "安全・防災", icon: "🚓" },
  { key: "local-economy",         name: "地域経済", icon: "💰" },
  { key: "tourism",               name: "観光", icon: "🗾" },
  { key: "consumer-prices",       name: "物価", icon: "🛒" },
];

const COMPARE_KPIS = [
  { label: "総人口",       unit: "万人",    aVal: 1401,    bVal: 878,    aRank: 1,  bRank: 3 },
  { label: "人口密度",     unit: "人/km²",  aVal: 6398,    bVal: 4609,   aRank: 1,  bRank: 2 },
  { label: "世帯数",       unit: "万世帯",  aVal: 754,     bVal: 425,    aRank: 1,  bRank: 3 },
  { label: "平均世帯人員", unit: "人",      aVal: 1.95,    bVal: 2.10,   aRank: 47, bRank: 43, lowerBetter: true },
  { label: "高齢化率",     unit: "％",      aVal: 23.5,    bVal: 28.6,   aRank: 47, bRank: 35, lowerBetter: true },
  { label: "出生率",       unit: "‰",       aVal: 6.4,     bVal: 6.7,    aRank: 32, bRank: 25 },
];

const COMPARE_INDICATORS = [
  { name: "総人口",         aVal: "1,401万",  bVal: "878万",   diff: "+59.6%" },
  { name: "人口密度",       aVal: "6,398",   bVal: "4,609",  diff: "+38.8%" },
  { name: "世帯数",         aVal: "754万",   bVal: "425万",  diff: "+77.4%" },
  { name: "平均世帯人員",   aVal: "1.95",    bVal: "2.10",   diff: "-7.1%" },
  { name: "高齢化率",       aVal: "23.5%",   bVal: "28.6%",  diff: "-17.8%" },
  { name: "年少人口比率",   aVal: "11.4%",   bVal: "11.7%",  diff: "-2.6%" },
  { name: "生産年齢人口比率", aVal: "65.1%", bVal: "59.7%",  diff: "+9.0%" },
  { name: "出生率",         aVal: "6.4‰",    bVal: "6.7‰",   diff: "-4.5%" },
  { name: "死亡率",         aVal: "10.2‰",   bVal: "11.8‰",  diff: "-13.6%" },
  { name: "婚姻率",         aVal: "5.4‰",    bVal: "5.1‰",   diff: "+5.9%" },
  { name: "離婚率",         aVal: "1.82‰",   bVal: "1.95‰",  diff: "-6.7%" },
  { name: "外国人人口",     aVal: "63万",    bVal: "27万",   diff: "+133%" },
];

// Mini japan with both highlighted
function CompareJapanMini({ codeA, codeB, colorA = "#1d4ed8", colorB = "#b45309" }) {
  const prefs = [
    [78,28,"01000"],[76,50,"02000"],[82,56,"03000"],[73,56,"05000"],[82,64,"04000"],
    [77,66,"06000"],[80,73,"07000"],[73,75,"09000"],[78,80,"08000"],[70,79,"10000"],
    [73,84,"11000"],[78,86,"12000"],[73,88,"13000"],[70,91,"14000"],[63,75,"15000"],
    [60,80,"16000"],[56,82,"17000"],[55,86,"18000"],[65,86,"19000"],[65,92,"20000"],
    [60,90,"21000"],[62,95,"22000"],[56,92,"23000"],[50,92,"24000"],[47,90,"25000"],
    [44,92,"26000"],[43,96,"27000"],[40,92,"28000"],[40,98,"29000"],[38,100,"30000"],
    [35,90,"31000"],[33,94,"32000"],[33,88,"33000"],[30,92,"34000"],[27,96,"35000"],
    [27,102,"36000"],[24,100,"37000"],[22,104,"38000"],[20,108,"39000"],[16,100,"40000"],
    [12,104,"41000"],[10,108,"42000"],[16,106,"43000"],[18,112,"44000"],[13,114,"45000"],
    [10,118,"46000"],[5,130,"47000"],
  ];
  return (
    <svg viewBox="0 0 100 140" style={{ width: "100%", height: "auto" }}>
      {prefs.map(([x, y, code], i) => {
        const isA = code === codeA;
        const isB = code === codeB;
        return (
          <circle key={i} cx={x} cy={y}
            r={isA || isB ? 4.5 : 2.6}
            fill={isA ? colorA : isB ? colorB : "#cbd5e1"}
            stroke="#fff" strokeWidth="0.4"
          />
        );
      })}
    </svg>
  );
}

Object.assign(window, {
  COMPARE_REGIONS, COMPARE_CATEGORY, COMPARE_CATEGORIES,
  COMPARE_KPIS, COMPARE_INDICATORS, CompareJapanMini,
});
