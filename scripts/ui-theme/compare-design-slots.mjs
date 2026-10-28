// 使い方: node scripts/ui-theme/compare-design-slots.mjs <refDir> <siteDir> [width]
// 部品の種類 (data-slot) ごとに、見本と stats47 の最多の値 (上位 2 つ) を並べる
import fs from "node:fs";
import path from "node:path";

const [, , refDir, siteDir, width = "1440"] = process.argv;
const SLOTS = ["card", "card-header", "card-title", "card-description", "card-content", "card-footer", "card-action", "button", "badge", "input", "select-trigger", "tabs-list", "tabs-trigger", "table-head", "table-cell", "table-row", "accordion-trigger", "accordion-content", "breadcrumb-list", "empty", "skeleton", "separator"];
const load = (dir) => {
  const slots = {};
  const body = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(`-${width}.json`))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const [slot, { variants }] of Object.entries(d.slots)) {
      slots[slot] ??= {};
      for (const [k, n] of Object.entries(variants)) slots[slot][k] = (slots[slot][k] || 0) + n;
    }
    if (d.text?.body) body[`${d.text.body.font} ${d.text.body.fontFamily.slice(0, 30)}`] = (body[`${d.text.body.font} ${d.text.body.fontFamily.slice(0, 30)}`] || 0) + 1;
  }
  return { slots, body };
};
const ref = load(refDir);
const site = load(siteDir);
const top = (variants) =>
  variants
    ? Object.entries(variants)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k, n]) => {
          const o = JSON.parse(k);
          return `${n}× font ${o.font} pad ${o.pad} gap ${o.gap.split(" ")[0]} border ${o.border} r ${o.radius}${o.h ? ` h ${o.h}` : ""}`;
        })
        .join("  ||  ")
    : "(なし)";
console.log(`body: REF ${JSON.stringify(ref.body)}  SITE ${JSON.stringify(site.body)}`);
for (const slot of SLOTS) {
  console.log(`\n## ${slot}\n  REF  ${top(ref.slots[slot])}\n  SITE ${top(site.slots[slot])}`);
}
