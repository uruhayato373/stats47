import assert from 'node:assert/strict';
import test from 'node:test';
import { renderReferenceBarSvg, renderReferencePrefectureSvg, type PrefectureFigureMetric } from '../lib/figure-renderer';
import { renderSavedReferenceFigure } from '../lib/figure-files';
import { isCapitalCityMetric } from '../build-reference-note';
const metric:PrefectureFigureMetric={key:'nursery-count-per-100k-0-5',label:'保育所等数（0～5歳人口10万人当たり）',unit:'所',year:'2020',capitalCity:false,rows:[{areaCode:'02000',areaName:'青森県',value:1042.8},{areaCode:'29000',areaName:'奈良県',value:404.8}],source:{name:'社会・人口統計体系'}};
test('population denominator and both fixed extrema are visible and bound to source values',()=>{
  const svg=renderReferencePrefectureSvg(metric);
  assert.match(svg,/0～5歳人口10万人当たり/);assert.match(svg,/最小：404\.8/);assert.match(svg,/最大：1,042\.8/);
  assert.match(svg,/data-area="02000" data-value="1042\.8"/);assert.match(svg,/data-area="29000" data-value="404\.8"/);
  assert.equal([...svg.matchAll(/data-area=/g)].length,47);
});
test('city scope uses the fixed flag, even without a city keyword in the subtitle',()=>{
  const svg=renderReferencePrefectureSvg({...metric,key:'education-cost-all-households',label:'教育費',subtitle:'全世帯',capitalCity:true,rows:[{areaCode:'11000',areaName:'埼玉県',value:26682},{areaCode:'18000',areaName:'福井県',value:7057}]});
  assert.match(svg,/さいたま市/);assert.match(svg,/福井市/);assert.match(svg,/東京都区部/);
  assert.match(svg,/1世帯当たり・1か月/);assert.ok(!svg.includes('都道府県全体の値'));
});
test('missing regions say missing while a measured zero remains zero',()=>{
  const svg=renderReferencePrefectureSvg({...metric,rows:[{areaCode:'02000',areaName:'青森県',value:0}]});
  assert.match(svg,/data-area="02000" data-value="0"/);assert.match(svg,/data-area="01000" data-value="missing"/);assert.match(svg,/値なし/);
});
test('unknown regions, duplicate regions and nonfinite values fail closed',()=>{
  assert.throws(()=>renderReferencePrefectureSvg({...metric,rows:[...metric.rows,metric.rows[0]]}),/Duplicate/);
  assert.throws(()=>renderReferencePrefectureSvg({...metric,rows:[{areaCode:'48000',areaName:'unknown',value:1}]}),/Invalid/);
  assert.throws(()=>renderReferencePrefectureSvg({...metric,rows:[{areaCode:'01000',areaName:'北海道',value:NaN}]}),/Invalid/);
});
test('bar groups keep their order and use the same zero baseline',()=>{
  const svg=renderReferenceBarSvg({title:'世帯主の年齢別',year:'2024',unit:'円/kg',scope:'全国',source:'家計調査',rows:[{label:'29歳以下',value:100},{label:'70歳以上',value:200}]});
  assert.ok(svg.indexOf('data-class="29歳以下"')<svg.indexOf('data-class="70歳以上"'));
  assert.match(svg,/width="600" height="36"/);assert.match(svg,/width="1200" height="36"/);assert.match(svg,/横棒の上限：200 円\/kg/);
});
test('quintile figures select the stored latest year and refuse a mismatched filename',()=>{
  const data={kind:'quintile',years:['2014','2024'],items:[{key:'tea',label:'紅茶',unit:'円',values:{'2014':{average:1,q:[1,2,3,4,5]},'2024':{average:15,q:[10,20,30,40,50]}}}]};
  const svg=renderSavedReferenceFigure(data,'tea-quintile.png');
  assert.match(svg,/対象年：2024/);assert.match(svg,/data-class="第Ⅴ階級" data-value="50"/);assert.match(svg,/1世帯当たりの年間支出額/);
  assert.throws(()=>renderSavedReferenceFigure(data,'coffee-quintile.png'),/Invalid quintile/);
});
test('derived city income is detected from typed configuration with unquoted multiline properties',()=>{
  const item={rankingKey:'real-disposable-income',title:'実質可処分所得',unit:'円',categoryKey:'economy'};
  assert.equal(isCapitalCityMetric('real-disposable-income',item),true);
  assert.equal(isCapitalCityMetric('disposable-income-after-rent',item),true);
  assert.equal(isCapitalCityMetric('annual-income-per-household',item),false);
});
test('mobile text has a readable floor and untrusted source strings are escaped',()=>{
  const svg=renderReferencePrefectureSvg({...metric,source:{name:'<script> & data'}});
  assert.match(svg,/&lt;script&gt; &amp; data/);
  const sizes=[...svg.matchAll(/font-size="([\d.]+)"/g)].map(match=>Number(match[1]));
  assert.ok(sizes.every(size=>size>=38));
});
