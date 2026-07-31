import fs from "node:fs";
import { generateChoroplethSvg } from "./src/charts/choropleth";

const NAMES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
const items = NAMES.map((name, i) => ({
  code: String(i + 1).padStart(2, "0"),
  name,
  value: Math.round((60.4 - i * 0.8) * 10) / 10,
}));
const svg = generateChoroplethSvg(items, { title: "対照実験用の新デザイン検体", unit: "件", showValue: true, showRankList: true });
fs.writeFileSync("/tmp/new-tilemap.svg", svg);
console.log("written", svg.match(/viewBox="[^"]*"/)?.[0]);
