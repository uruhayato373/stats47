import { createHash } from 'node:crypto';
import { assertLandPriceConservation, type GeoAnalysisSnapshot, type GeoLandPricePrefDetail } from '@stats47/gis';
import { GEO_SERVICE_OFFER } from './service-offer';

const COORDINATE_SCALE = 1_000_000;
export const digest = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');
export const htmlEscape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export function csv(rows: readonly (readonly unknown[])[]): string {
  return '\uFEFF' + rows.map(row => row.map(value => {
    const text = value == null ? '' : String(value);
    const safe = typeof value === 'string' && /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n') + '\r\n';
}

export function pointRows(detail: GeoLandPricePrefDetail) {
  const byId = new Map(detail.meshes.map(mesh => [mesh[0], mesh]));
  return detail.landPricePoints.map((point, index) => {
    const meshId = detail.pointMeshIds[index];
    const mesh = meshId ? byId.get(meshId) : undefined;
    const exclusion = !mesh ? 'unmatched' : point[4] === null ? 'missing_change' : mesh[5] <= 0 ? 'zero_baseline_population' : null;
    return {
      pointId: point[0], longitude: point[1] / COORDINATE_SCALE, latitude: point[2] / COORDINATE_SCALE,
      priceYenPerM2: point[3], changePercent: point[4], meshId: meshId ?? null,
      meshPopulation2020: mesh?.[5] ?? null, meshPopulation2050: mesh?.[6] ?? null,
      exclusion,
      risingDeclining: exclusion ? null : point[4]! > 0 && mesh![6] < mesh![5],
    };
  });
}

export function assertDeliveryDetail(detail: GeoLandPricePrefDetail, aggregate: GeoAnalysisSnapshot): void {
  const row = aggregate.rows.find(r => r.areaCode === detail.areaCode);
  if (!row || row.areaName !== detail.areaName || detail.slug !== GEO_SERVICE_OFFER.analysisSlug || detail.generatedAt !== aggregate.generatedAt) throw new Error('detail identity/version mismatch');
  if (detail.landPricePoints.length !== detail.pointMeshIds.length || !detail.meshes.length || !detail.landPricePoints.length) throw new Error('detail counts invalid');
  if (new Set(detail.meshes.map(m => m[0])).size !== detail.meshes.length || new Set(detail.landPricePoints.map(p => p[0])).size !== detail.landPricePoints.length) throw new Error('duplicate geometry id');
  for (const m of detail.meshes) if (m.length !== 7 || !m.slice(1).every(v => typeof v === 'number' && Number.isFinite(v)) || m[1] >= m[3] || m[2] >= m[4] || m[5] < 0 || m[6] < 0) throw new Error('mesh invalid');
  for (const p of detail.landPricePoints) if (p.length !== 5 || !p.slice(1, 4).every(v => typeof v === 'number' && Number.isFinite(v)) || p[3] < 0 || (p[4] !== null && !Number.isFinite(p[4]))) throw new Error('point invalid');
  assertLandPriceConservation(detail, row);
  const points = pointRows(detail);
  const comparable = points.filter(p => !p.exclusion).length;
  const overlap = points.filter(p => p.risingDeclining === true).length;
  if (comparable !== detail.summary.comparablePointCount || overlap !== detail.summary.risingDecliningPointCount) throw new Error('delivery counts mismatch');
}

/** 北を上にした経緯度模式図。投影地図・背景地図・距離測定は提供しない。全地物を保持する。 */
export function spatialSvg(detail: GeoLandPricePrefDetail): string {
  const points = pointRows(detail);
  const minX = Math.min(...detail.meshes.map(m => m[1]), ...detail.landPricePoints.map(p => p[1]));
  const maxX = Math.max(...detail.meshes.map(m => m[3]), ...detail.landPricePoints.map(p => p[1]));
  const minY = Math.min(...detail.meshes.map(m => m[2]), ...detail.landPricePoints.map(p => p[2]));
  const maxY = Math.max(...detail.meshes.map(m => m[4]), ...detail.landPricePoints.map(p => p[2]));
  const scale = Math.min(820 / (maxX - minX), 480 / (maxY - minY));
  const x = (v: number) => 30 + (v - minX) * scale;
  const y = (v: number) => 30 + (maxY - v) * scale;
  const cells = detail.meshes.map(m => `<rect x="${x(m[1])}" y="${y(m[4])}" width="${(m[3] - m[1]) * scale}" height="${(m[4] - m[2]) * scale}" fill="${m[6] < m[5] ? '#cbd5e1' : '#f1f5f9'}" stroke="#fff" stroke-width=".2"><title>${htmlEscape(m[0])} / ${m[5]}人 → ${m[6]}人</title></rect>`).join('');
  const dots = points.map(p => `<circle cx="${x(p.longitude * COORDINATE_SCALE)}" cy="${y(p.latitude * COORDINATE_SCALE)}" r="2.3" fill="${p.exclusion ? '#64748b' : p.risingDeclining ? '#be123c' : '#0369a1'}"><title>${htmlEscape(p.pointId)} / ${htmlEscape(p.exclusion ?? (p.risingDeclining ? '地価上昇×人口減少' : 'その他の比較可能地点'))}</title></circle>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${htmlEscape(detail.areaName)}の人口メッシュと住宅地点の模式図" viewBox="0 0 900 650"><rect width="900" height="650" fill="white"/>${cells}${dots}<text x="865" y="25" font-size="14">北↑</text><g font-size="13" font-family="sans-serif" fill="#172554"><text x="30" y="560">${htmlEscape(detail.areaName)} / 住宅地価2025→2026年 × 1kmメッシュ人口2020→2050年</text><text x="30" y="583">赤点: 地価上昇×人口減少　青点: その他の比較可能地点　灰点: 比較対象外</text><text x="30" y="606">灰メッシュ: 人口減少　薄灰: 非減少 / 経緯度模式図・面積と距離の測定不可</text><text x="30" y="632">出典: 国土交通省 地価公示2026年・1kmメッシュ別将来推計人口R6 / CC BY 4.0 / 加工: stats47</text></g></svg>`;
}

export function buildDelivery(detail: GeoLandPricePrefDetail, aggregate: GeoAnalysisSnapshot): Map<string, string> {
  assertDeliveryDetail(detail, aggregate);
  const points = pointRows(detail);
  const headers = Object.keys(points[0]);
  const summary = detail.summary;
  const urls = aggregate.sources.map(s => `${s.name} / ${s.version} / ${s.url} / ${s.license}`).join('\n');
  const attribution = `出典: ${urls}\n加工: 統計で見る都道府県（stats47）。地点と人口メッシュを包含結合し、表・図へ再構成。公式機関の公認・推奨ではありません。`;
  const dictionary = `# 納品データの読み方\n\n${GEO_SERVICE_OFFER.scope}\n\n` +
    `points.csv は住宅標準地1地点1行。pointIdは元artifactの識別子（住所検索用コードではない）、longitude/latitudeはJGD2011の経度/緯度（度）、priceYenPerM2は円/㎡、changePercentは%です。meshIdは包含メッシュ、meshPopulation2020/2050はそのメッシュ全体の人口（人、推計の小数を保持）。地点に住む人数ではなく、同じメッシュ人口が複数地点に反復します。points.csvの人口列を合計してはいけません。\n\n` +
    `exclusion: unmatched=メッシュ未接続、missing_change=対前年地価変動率欠測、zero_baseline_population=2020年人口0。除外行のrisingDecliningはnull（CSVは空欄）、falseではありません。非除外行のtrueは地価変動率>0かつ2050年人口<2020年人口、falseはその他です。\n\n` +
    `meshes.csvは1メッシュ1行。WKTはJGD2011の経緯度（X=経度/Y=緯度）。人口合計を求める場合はこちらを使います。QGIS等ではコードを文字列として読み込み、座標系をJGD2011として明示してください。座標変換・測量精度は提供しません。\n\n` +
    `detail.jsonが原artifact、summary.jsonが同じ県の集計。lineage.jsonのSHAから原入力・途中結果を辿れます。初回原典取得日時は未記録。生成日時・今回確認日時を原典取得日と解釈しないでください。\n\n` +
    `## 制約\n\n${aggregate.caveats.map(c => `- ${c}`).join('\n')}\n\n${attribution}\n`;
  const license = `利用条件（公開前確認用）\n\nデータ・加工データ部分: 出典2データはCC BY 4.0。出典・ライセンスURL・加工表示を保って商用利用・改変・再配布が可能です。${GEO_SERVICE_OFFER.licenseUrl}\n\nstats47独自の説明文・レイアウト部分: 提案条件は購入者の社内資料・クライアント成果物への利用可、商品そのものとしての再販売・再配布は禁止。この制約を原典・CC BYデータ・著作権の生じない事実へ適用しません。著作権譲渡・独占利用は含みません。\n\n地理院タイルや第三者背景地図は同梱しません。権利確認日: ${GEO_SERVICE_OFFER.rightsCheckedAt}。\n\n${attribution}\n`;
  const report = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${htmlEscape(detail.areaName)} 地価地点×将来人口</title><style>body{font:16px/1.8 system-ui,sans-serif;color:#172554;max-width:1000px;margin:40px auto;padding:0 24px}h1{font-size:30px}h2{font-size:22px;margin-top:36px}svg{width:100%;border:1px solid #cbd5e1}table{border-collapse:collapse;width:100%}td,th{padding:8px;text-align:left;border-bottom:1px solid #cbd5e1}.notice{background:#f1f5f9;padding:16px}a{color:#0369a1}@media print{body{margin:0;font-size:11pt}h2{break-after:avoid}svg,table{break-inside:avoid}}</style><body><p>STATS47 / Geo納品見本 / 未出品・需要確認待ち</p><h1>${htmlEscape(detail.areaName)}<br>地価が上がる地点でも周囲の人口は減るのか</h1><p>${htmlEscape(GEO_SERVICE_OFFER.scope)}</p><p class="notice">比較可能な${summary.comparablePointCount.toLocaleString('ja-JP')}地点のうち、地価上昇と人口減少が重なるのは${summary.risingDecliningPointCount.toLocaleString('ja-JP')}地点（${summary.risingDecliningPointShare ?? '算出不可'}%）。これは地点の比率で、県民や土地面積の比率ではありません。</p><h2>位置と重なりを確認する</h2>${spatialSvg(detail)}<p>赤: 地価上昇×人口減少 / 青: その他の比較可能地点 / 灰点: 比較対象外。灰色メッシュ: 人口減少、薄灰: 非減少。全${detail.meshes.length}メッシュ・全${points.length}地点を表示。離島も省略していません。経緯度の模式図であり、面積・距離測定不可。詳細はCSVと原artifactを参照。</p><h2>分母と除外理由</h2><table><tr><th>区分</th><th>地点数</th></tr>${[['全住宅標準地点', points.length], ['比較可能', summary.comparablePointCount], ['未接続', points.filter(p => p.exclusion === 'unmatched').length], ['地価変動率欠測（接続済み）', points.filter(p => p.exclusion === 'missing_change').length], ['2020年人口0（変動率あり）', points.filter(p => p.exclusion === 'zero_baseline_population').length]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><h2>この資料で判断できないこと</h2><ul>${aggregate.caveats.map(c => `<li>${htmlEscape(c)}</li>`).join('')}</ul><h2>次に確認する順序</h2><ol><li>points.csvを開き、関心のある地点のmeshIdと除外理由を確認する。</li><li>meshes.csvの同一meshIdの人口を確認する。同一人口の二重加算はしない。</li><li>現地条件や自治体の一次資料を別途確認する。土地の購入判断をこの結果だけで行わない。</li></ol><h2>出典・検証経路</h2><p>原artifact生成日時: ${htmlEscape(aggregate.generatedAt)}。初回原典取得日時は未記録。</p><ul>${aggregate.sources.map(s => `<li><a href="${htmlEscape(s.url)}">${htmlEscape(s.name)}</a> / 版 ${htmlEscape(s.version)} / ${htmlEscape(s.license)}</li>`).join('')}</ul><p>加工: stats47。包含結合・集計・模式図を作成。公式機関の公認・推奨ではありません。</p><p><a href="https://stats47.jp/geo/population-land-price/${detail.areaCode.slice(0,2)}/overlap">県別の空間演算</a> / <a href="https://stats47.jp/geo/method">方法と限界</a></p></body></html>`;
  const files = new Map<string, string>([
    ['report.html', report], ['map.svg', spatialSvg(detail)],
    ['points.csv', csv([headers, ...points.map(p => Object.values(p))])],
    ['meshes.csv', csv([['meshId', 'WKT', 'population2020', 'population2050'], ...detail.meshes.map(m => { const [w,s,e,n] = m.slice(1,5).map(v => Number(v) / COORDINATE_SCALE); return [m[0], `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`, m[5], m[6]]; })])],
    ['detail.json', JSON.stringify(detail, null, 2) + '\n'], ['summary.json', JSON.stringify(aggregate.rows.find(r => r.areaCode === detail.areaCode), null, 2) + '\n'],
    ['DATA-DICTIONARY.md', dictionary], ['LICENSE-ja.txt', license],
    ['SOURCES.csv', csv([['datasetId','provider','name','version','url','license','acquiredAt','processedBy'], ...aggregate.sources.map(s => [s.datasetId,'国土交通省',s.name,s.version,s.url,s.license,'初回取得日時未記録','stats47: 包含結合・集計・表示変換'])])],
  ]);
  return files;
}
