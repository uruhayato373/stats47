import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { renderReferenceBarSvg, renderReferencePrefectureSvg, type PrefectureFigureMetric } from './figure-renderer';

interface QuintileValues { average: number; q: number[] }
interface FigureItem {
  key: string; label: string; unit: string; values?: Record<string, QuintileValues>;
  price?: number[]; priceUnit?: string;
}
export interface ReferenceFigureData {
  kind?: string; metrics?: PrefectureFigureMetric[]; items?: FigureItem[];
  year?: string; years?: string[]; ages?: string[]; engel?: number[];
}
const QUINTILES = ['第Ⅰ階級','第Ⅱ階級','第Ⅲ階級','第Ⅳ階級','第Ⅴ階級'];

export function renderSavedReferenceFigure(data: ReferenceFigureData, filename: string): string {
  if(data.metrics) {
    const metric=data.metrics.find(metric=>`${metric.key}.png`===filename);
    if(!metric)throw Error(`Figure not present in fixed metrics: ${filename}`);
    return renderReferencePrefectureSvg(metric);
  }
  if(data.kind==='quintile') {
    const item=data.items?.find(item=>`${item.key}-quintile.png`===filename);
    const year=data.years?.slice().sort().at(-1);
    const values=year&&item?.values?.[year];
    if(!item||!year||!values||values.q.length!==QUINTILES.length)throw Error(`Invalid quintile source: ${filename}`);
    return renderReferenceBarSvg({title:`${item.label}（年収五分位別）`,year,unit:item.unit,scope:'全国・二人以上の世帯・1世帯当たりの年間支出額',source:'総務省統計局「家計調査」',rows:[{label:'平均',value:values.average},...QUINTILES.map((label,index)=>({label,value:values.q[index]}))]});
  }
  if(data.kind==='age') {
    const item=data.items?.find(item=>`${item.key}-price-age.png`===filename);
    const isEngel=filename==='engel-coefficient-age.png';
    const values=isEngel?data.engel:item?.price;
    if(!data.year||!data.ages||!values||values.length!==data.ages.length||(!isEngel&&!item?.priceUnit))throw Error(`Invalid age source: ${filename}`);
    return renderReferenceBarSvg({title:isEngel?'エンゲル係数（食料÷消費支出）':`${item!.label}の購入単価`,year:data.year,unit:isEngel?'％':item!.priceUnit!,scope:'全国・二人以上の世帯・世帯主の年齢階級別',source:'総務省統計局「家計調査」',rows:data.ages.map((label,index)=>({label,value:values[index]}))});
  }
  throw Error(`Unknown figure data kind: ${filename}`);
}

/** Same common SVG converter as other note figures; indexed, opaque PNG keeps text sharp and files small. */
export async function writeReferenceFigure(svgPath: string, pngPath: string, svg: string) {
  writeFileSync(svgPath,svg);
  const {svgToPng}=require('../../../lib/svg-to-png.cjs') as {svgToPng:(svg:string,png:string)=>Promise<unknown>};
  await svgToPng(svgPath,pngPath);
  const source=readFileSync(pngPath);
  const png=await sharp(source).flatten({background:'#F8F5EC'}).png({palette:true,colours:32,quality:80,dither:0,effort:10,compressionLevel:9}).toBuffer();
  writeFileSync(pngPath,png);
  return {bytes:png.length};
}
