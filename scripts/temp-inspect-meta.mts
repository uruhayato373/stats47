import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

// Use the raw e-Stat API to get metadata for 0000020204 (D行政基盤 指標 都道府県)
const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
const statsDataId = "0000020204";

const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${appId}&statsDataId=${statsDataId}&lang=J`;

const response = await fetch(url);
const data = await response.json();

const classInf = data.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
if (!classInf) {
  console.log("No CLASS_INF found");
  console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  process.exit(1);
}

for (const classObj of classInf) {
  const id = classObj["@id"];
  const name = classObj["@name"];
  const classes = Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
  
  console.log(`\n=== ${id}: ${name} (${classes.length} items) ===`);
  
  if (id === "cat01") {
    // Look for deficit-related items
    for (const cls of classes) {
      const code = cls["@code"];
      const clsName = cls["@name"];
      if (clsName.includes("赤字") || clsName.includes("健全化") || clsName.includes("将来負担") || clsName.includes("公債")) {
        console.log(`  ${code}: ${clsName}`);
      }
    }
    console.log("  ...(showing deficit/health related only)");
    console.log("  Total items: " + classes.length);
  } else {
    // Show first few items for other dimensions
    for (const cls of classes.slice(0, 5)) {
      console.log(`  ${cls["@code"]}: ${cls["@name"]}`);
    }
    if (classes.length > 5) console.log(`  ... (${classes.length} total)`);
  }
}
