#!/usr/bin/env node
// 全ブログ SVG を取得し構造シグネチャで分類する（共通化候補の発見）
const R2 = "https://storage.stats47.jp";

async function fetchText(u){const r=await fetch(u);if(!r.ok)throw new Error(`${r.status} ${u}`);return r.text();}
async function pMap(items,fn,c){const out=[];let i=0;async function w(){while(i<items.length){const k=i++;try{out[k]=await fn(items[k]);}catch(e){out[k]={error:String(e.message)};}}}await Promise.all(Array.from({length:Math.min(c,items.length)},w));return out;}

// 構造シグネチャ抽出
function signature(svg, file){
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1] ?? "?";
  const rects = (svg.match(/<rect/g)||[]).length;
  const circles = (svg.match(/<circle/g)||[]).length;
  const polylines = (svg.match(/<polyline|<path/g)||[]).length;
  const texts = (svg.match(/<text/g)||[]).length;
  const lines = (svg.match(/<line/g)||[]).length;
  const hasTheme = /prefers-color-scheme/.test(svg);
  // ファイル名サフィックスでの宣言型
  let declared = "other";
  if (/-prefecture-rankings$/.test(file.replace(/\.svg$/,""))) declared="bar";
  else if (/-tile-grid$/.test(file.replace(/\.svg$/,""))) declared="tile-grid";
  else if (/-timeseries$/.test(file.replace(/\.svg$/,""))) declared="line";
  else if (/-scatter$/.test(file.replace(/\.svg$/,""))) declared="scatter";
  else if (/-stacked$/.test(file.replace(/\.svg$/,""))) declared="stacked";
  // 構造からの推定型
  let inferred = "other";
  if (circles >= 20) inferred="scatter";
  else if (rects >= 40 && texts >= 40) inferred="tile-grid";
  else if (rects >= 8 && rects < 40) inferred="bar/stacked";
  else if (polylines >= 1 && circles < 20 && rects < 8) inferred="line";
  return {file, viewBox, rects, circles, polylines, texts, lines, hasTheme, declared, inferred};
}

const manifest = JSON.parse(await fetchText(`${R2}/app/blog/all.json`));
const arts = (manifest.articles||[]).filter(a=>a.hasCharts);
console.error(`記事 ${arts.length} 件を解析中...`);

const all = [];
await pMap(arts, async(a)=>{
  let md; try{ md = await fetchText(`${R2}/app/blog/${a.slug}/article.md`);}catch{return;}
  const refs=[...new Set([...md.matchAll(/\]\(data\/([^)]+\.svg)\)/g)].map(m=>m[1]))];
  const sigs = await pMap(refs, async(f)=>{
    try{const svg=await fetchText(`${R2}/app/blog/${a.slug}/data/${f}`);return {slug:a.slug,...signature(svg,f)};}catch{return null;}
  },4);
  for(const s of sigs) if(s) all.push(s);
}, 12);

console.error(`SVG ${all.length} 枚を分類完了\n`);

// 集計
const byDeclared={}, byInferred={}, byViewBox={}, suffixCount={};
for(const s of all){
  byDeclared[s.declared]=(byDeclared[s.declared]||0)+1;
  byInferred[s.inferred]=(byInferred[s.inferred]||0)+1;
  byViewBox[s.viewBox]=(byViewBox[s.viewBox]||0)+1;
  const suffix = s.file.replace(/\.svg$/,"").split("-").slice(-2).join("-");
  suffixCount[suffix]=(suffixCount[suffix]||0)+1;
}
const top=(o,n=15)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`  ${String(v).padStart(4)}  ${k}`).join("\n");

console.log("=== 宣言型（ファイル名サフィックス）===");
console.log(top(byDeclared));
console.log("\n=== 構造推定型（要素数から）===");
console.log(top(byInferred));
console.log("\n=== viewBox 分布（上位）===");
console.log(top(byViewBox));
console.log("\n=== ファイル名サフィックス分布（上位20）===");
console.log(top(suffixCount,20));
console.log("\n=== ダークモード未対応 ===");
console.log(`  ${all.filter(s=>!s.hasTheme).length} / ${all.length} 枚`);
console.log("\n=== 'other'（命名規則外）サンプル ===");
console.log(all.filter(s=>s.declared==="other").slice(0,20).map(s=>`  ${s.slug}/${s.file} [${s.inferred}] vb=${s.viewBox}`).join("\n"));
