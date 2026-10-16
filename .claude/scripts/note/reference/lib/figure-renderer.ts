import { PREF_CAPITAL_COORDS } from '../../../../../packages/migration-flow/src/lib/pref-capitals';
export const REFERENCE_FIGURE_RENDERER_VERSION = 'reference-fixed-figures-v1';

export interface FigureRow { areaCode: string; areaName: string; value: number }
export interface PrefectureFigureMetric {
  key: string; label: string; unit: string; year: string; subtitle?: string;
  capitalCity: boolean; rows: FigureRow[]; source?: { name: string } | null;
  figureNote?: string;
}
export interface ReferenceBarFigure {
  title: string; year: string; unit: string; scope: string; source: string;
  rows: { label: string; value: number }[];
}
const WIDTH = 1280, MARGIN = 40, INK = '#183B48', BACKGROUND = '#F8F5EC';
const COLORS = ['#EEF2F7', '#C5D3E3', '#9CB5D0', '#4B6E95', '#1F3A5F'];
const REGIONS: [string, number, number][] = [['北海道',1,1],['東北',2,7],['関東',8,14],['中部',15,23],['近畿',24,30],['中国',31,35],['四国',36,39],['九州・沖縄',40,47]];
// Qualifications absent from the short ranking subtitle but stated in the fixed article/source definition.
const FIGURE_NOTES: Record<string,string> = {
  'education-cost-all-households':'全世帯・1世帯当たり・1か月の教育費',
  'real-disposable-income':'勤労者世帯の月額。所得は県庁所在市、物価指数は都道府県の参考計算。',
  'disposable-income-after-rent':'勤労者世帯の可処分所得と二人以上世帯の家賃を使う参考計算（月額）。',
};
const escape = (value: string | number) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const measure = (value: string) => [...value].reduce((sum,char)=>sum+(/[\x20-\x7e]/.test(char)?0.57:1),0);
const format = (value: number) => value.toLocaleString('ja-JP',{maximumFractionDigits:2});
const text = (value: string, x: number, y: number, size=42, color=INK) => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="600">${escape(value)}</text>`;
function wrapped(value: string, x: number, y: number, size=42, maxWidth=WIDTH-2*MARGIN) {
  const lines: string[] = []; let line='';
  for(const char of value) {
    if(char==='\n'||measure(line+char)*size>maxWidth) {
      if(/[。、）]/.test(char)&&line) { lines.push(line+char); line=''; }
      else { if(line)lines.push(line); line=char==='\n'?'':char; }
    } else line+=char;
  }
  if(line)lines.push(line);
  return {svg:lines.map((value,index)=>text(value,x,y+index*size*1.35,size)).join(''),height:lines.length*size*1.35};
}
function frame(parts: string[], height: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${Math.ceil(height)}" viewBox="0 0 ${WIDTH} ${Math.ceil(height)}"><rect width="${WIDTH}" height="${Math.ceil(height)}" fill="${BACKGROUND}"/><g font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif">${parts.join('')}</g></svg>`;
}
function header(title: string, year: string, unit: string, scope: string, notes: string[]) {
  const parts=[text('stats47',MARGIN,82,44)]; let y=182;
  const titleBlock=wrapped(title,MARGIN,y,64); parts.push(titleBlock.svg); y+=titleBlock.height+18;
  parts.push(text(`対象年：${year}　単位：${unit}`,MARGIN,y,44)); y+=68;
  for(const value of [scope,...notes].filter(Boolean)) { const block=wrapped(value,MARGIN,y,40); parts.push(block.svg); y+=block.height+14; }
  return {parts,y};
}
/** Values and geographic scope come from the article's fixed chart-data, never the latest ranking snapshot. */
export function renderReferencePrefectureSvg(metric: PrefectureFigureMetric) {
  if(!metric.rows.length||metric.rows.some(row=>!/^\d{2}000$/.test(row.areaCode)||!Number.isFinite(row.value)||Number(row.areaCode.slice(0,2))<1||Number(row.areaCode.slice(0,2))>47)) throw Error('Invalid source areas/values');
  if(new Set(metric.rows.map(row=>row.areaCode)).size!==metric.rows.length)throw Error('Duplicate source area');
  const rows=new Map(metric.rows.map(row=>[Number(row.areaCode.slice(0,2)),row]));
  const values=metric.rows.map(row=>row.value),lo=Math.min(...values),hi=Math.max(...values);
  const {parts,y:headerEnd}=header(metric.label,metric.year,metric.unit,metric.capitalCity?'対象：県庁所在市（東京都は区部）の値':'対象：都道府県全体の値',[metric.subtitle??'',metric.figureNote??FIGURE_NOTES[metric.key]??'']);
  let y=headerEnd;
  parts.push(text('色が濃いほど値が大きい',MARGIN,y,42));y+=80;
  const cellWidth=386,gap=21,cellHeight=156;
  for(const [region,first,last] of REGIONS) {
    parts.push(text(region,MARGIN,y,46));y+=25;
    for(let id=first;id<=last;id++) {
      const row=rows.get(id),index=id-first,x=MARGIN+(index%3)*(cellWidth+gap),top=y+Math.floor(index/3)*(cellHeight+18);
      const bin=row?(hi===lo?2:Math.min(4,Math.floor((row.value-lo)/(hi-lo)*5))):-1;
      const color=bin>=3?'#FFFFFF':INK;
      const areaCode=String(id).padStart(2,'0');
      const name=metric.capitalCity?(id===13?'東京都区部':PREF_CAPITAL_COORDS[areaCode].name):(row?.areaName??`県コード${areaCode}`);
      const nameSize=Math.min(50,(cellWidth-34)/measure(name));
      if(nameSize<38)throw Error('Area label would be unreadable');
      parts.push(`<g data-area="${areaCode}000" data-value="${row?row.value:'missing'}"><rect x="${x}" y="${top}" width="${cellWidth}" height="${cellHeight}" rx="12" fill="${bin<0?'#E5E5E5':COLORS[bin]}"/>${text(name,x+17,top+60,nameSize,color)}${text(row?format(row.value):'値なし',x+17,top+126,52,color)}</g>`);
    }
    y+=Math.ceil((last-first+1)/3)*(cellHeight+18)+68;
  }
  parts.push(text('凡例：小さい値 → 大きい値',MARGIN,y,42));y+=30;
  COLORS.forEach((color,index)=>parts.push(`<rect x="${MARGIN+index*240}" y="${y}" width="240" height="36" fill="${color}"/>`));y+=99;
  parts.push(text(`最小：${format(lo)}`,MARGIN,y,44),text(`最大：${format(hi)}`,680,y,44));y+=75;
  for(const value of ['同じ大きさのタイルです。面積や人口規模・正確な位置を表しません。',`出典：${metric.source?.name??'保存済み観測値（chart-data.json）'}`,'値は小数第2位まで表示（必要な桁のみ）']) {const block=wrapped(value,MARGIN,y,38);parts.push(block.svg);y+=block.height+20;}
  return frame(parts,y+40);
}
/** Income/age groups retain their natural order; bar lengths share a zero baseline and one scale. */
export function renderReferenceBarSvg(figure: ReferenceBarFigure) {
  if(!figure.rows.length||figure.rows.some(row=>!row.label||!Number.isFinite(row.value)||row.value<0))throw Error('Invalid class values');
  const {parts,y:headerEnd}=header(figure.title,figure.year,figure.unit,figure.scope,[]);
  const maximum=Math.max(...figure.rows.map(row=>row.value),1),barWidth=WIDTH-2*MARGIN;
  let y=headerEnd+35;
  for(const [index,row] of figure.rows.entries()) {
    const amount=`${format(row.value)} ${figure.unit}`;
    if(measure(amount)*48>610)throw Error('Value label would overlap');
    parts.push(`<g data-class="${escape(row.label)}" data-value="${row.value}">${text(row.label,MARGIN,y,48)}${text(amount,680,y,48)}<rect x="${MARGIN}" y="${y+20}" width="${barWidth}" height="36" rx="6" fill="#E5EAF1"/><rect x="${MARGIN}" y="${y+20}" width="${row.value/maximum*barWidth}" height="36" rx="6" fill="${row.label==='平均'?'#4B6E95':'#1F3A5F'}"/></g>`);
    y+=120;
    if(index===0&&row.label==='平均')y+=30;
  }
  parts.push(text('0',MARGIN,y,40),text(`横棒の上限：${format(maximum)} ${figure.unit}`,680,y,40));y+=75;
  const source=wrapped(`出典：${figure.source}`,MARGIN,y,38);parts.push(source.svg);y+=source.height+20;
  parts.push(text('値は小数第2位まで表示（必要な桁のみ）',MARGIN,y,38));
  return frame(parts,y+60);
}
