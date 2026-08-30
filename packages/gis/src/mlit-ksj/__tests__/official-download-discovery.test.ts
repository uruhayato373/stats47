import { describe, expect, it } from 'vitest';

import { parseOfficialKsjArchives } from '../official-download-discovery';

describe('parseOfficialKsjArchives', () => {
  it('最新・GeoJSON・全国を優先し、旧版と県別重複を除く', () => {
    const row = (label: string, size: string, filename: string, path: string) =>
      `<tr><td>${label}</td><td>世界測地系</td><a onclick="DownLd('${size}','${filename}','${path}',this)"></a></tr>`;
    const html = [
      row('全国', '10MB', 'A54-23_GEOJSON.zip', '../data/A54/A54-23/A54-23_GEOJSON.zip'),
      row('北海道', '1MB', 'A54-23_01_GEOJSON.zip', '../data/A54/A54-23/A54-23_01_GEOJSON.zip'),
      row('全国', '8MB', 'A54-22_GEOJSON.zip', '../data/A54/A54-22/A54-22_GEOJSON.zip'),
      row('全国', '5MB', 'A54-23_GML.zip', '../data/A54/A54-23/A54-23_GML.zip'),
    ].join('');
    const result = parseOfficialKsjArchives({
      dataId: 'A54',
      sourcePageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A54.html',
      pageSource: html,
    });
    expect(result.map((item) => item.filename)).toEqual(['A54-23_GEOJSON.zip']);
  });

  it('巨大な全国archiveは47都道府県partitionを選び地域重複を除く', () => {
    const rows: string[] = [];
    rows.push(`<tr><td>全国</td><a onclick="DownLd('511MB','500m_mesh_2024_GEOJSON.zip','/ksj/gml/data/m500r6/m500r6-24/500m_mesh_2024_GEOJSON.zip',this)"></a></tr>`);
    for (let code = 1; code <= 47; code += 1) {
      const scope = String(code).padStart(2, '0');
      rows.push(`<tr><td>${scope}</td><a onclick="DownLd('10MB','500m_mesh_2024_${scope}_GEOJSON.zip','/ksj/gml/data/m500r6/m500r6-24/500m_mesh_2024_${scope}_GEOJSON.zip',this)"></a></tr>`);
    }
    rows.push(`<tr><td>東北地方</td><a onclick="DownLd('50MB','500m_mesh_2024_52_GEOJSON.zip','/ksj/gml/data/m500r6/m500r6-24/500m_mesh_2024_52_GEOJSON.zip',this)"></a></tr>`);
    const result = parseOfficialKsjArchives({
      dataId: 'm500r6',
      sourcePageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh500r6.html',
      pageSource: rows.join(''),
    });
    expect(result).toHaveLength(47);
    expect(result.some((item) => item.scope === '52')).toBe(false);
  });

  it('同一都道府県の複数公式archiveに一意なscopeを付ける', () => {
    const rows: string[] = [];
    for (let code = 1; code <= 40; code += 1) {
      const pref = String(code).padStart(2, '0');
      for (const layer of ['81', '82']) {
        const filename = `A31a-24_${layer}_${pref}_GEOJSON.zip`;
        rows.push(
          `<tr><td>${pref}</td><a onclick="DownLd('1MB','${filename}','/ksj/gml/data/A31a/A31a-24/${filename}',this)"></a></tr>`
        );
      }
    }
    const result = parseOfficialKsjArchives({
      dataId: 'A31a',
      sourcePageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31a-2024.html',
      pageSource: rows.join(''),
    });
    expect(result).toHaveLength(80);
    expect(new Set(result.map((item) => item.scope)).size).toBe(80);
    expect(result.map((item) => item.scope)).toContain('81_01');
    expect(result.map((item) => item.scope)).toContain('82_01');
  });

  it('A55は都道府県全域のGeoJSONだけを選ぶ', () => {
    const pageSource = `const tokei_data2024=${JSON.stringify([
      { city: '北海道全域', citycode: '01000', data: 'GEOJSON形式', file: 'A55-24_01000_GEOJSON.zip', dl: '/ksj/gml/data/A55/A55-24/A55-24_01000_GEOJSON.zip', filecapacity: '1MB', CS: '世界測地系' },
      { city: '札幌市', citycode: '01100', data: 'GEOJSON形式', file: 'A55-24_01100_GEOJSON.zip', dl: '/ksj/gml/data/A55/A55-24/A55-24_01100_GEOJSON.zip', filecapacity: '1MB', CS: '世界測地系' },
      { city: '北海道全域', citycode: '01000', data: 'CityGML形式', file: 'A55-24_01000_GML.zip', dl: '/ksj/gml/data/A55/A55-24/A55-24_01000_GML.zip', filecapacity: '1MB', CS: '世界測地系' },
    ])};`;
    const result = parseOfficialKsjArchives({
      dataId: 'A55',
      sourcePageUrl: 'https://example.test/A55',
      pageSource,
    });
    expect(result.map((item) => item.scope)).toEqual(['01']);
  });

  it('世界測地系が無い旧版は日本測地系を変換対象として残す', () => {
    const html = `<tr><td>首都圏</td><td>日本測地系</td><a onclick="DownLd('6MB','A03-03_SYUTO-tky_GML.zip','../data/A03/A03-03/A03-03_SYUTO-tky_GML.zip',this)"></a></tr>`;
    const result = parseOfficialKsjArchives({
      dataId: 'A03',
      sourcePageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A03.html',
      pageSource: html,
    });
    expect(result).toHaveLength(1);
    expect(result[0].datum).toBe('tokyo');
  });

  it('GeoJSONが無い公式配布ではShapefileをGMLより優先する', () => {
    const html = [
      `<tr><td>北海道</td><td>世界測地系</td><a onclick="DownLd('2MB','A45-19_01_SHP.zip','/ksj/gml/data/A45/A45-19/A45-19_01_SHP.zip',this)"></a></tr>`,
      `<tr><td>北海道</td><td>世界測地系</td><a onclick="DownLd('3MB','A45-19_01_GML.zip','/ksj/gml/data/A45/A45-19/A45-19_01_GML.zip',this)"></a></tr>`,
    ].join('');
    const result = parseOfficialKsjArchives({
      dataId: 'A45',
      sourcePageUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A45.html',
      pageSource: html,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ format: 'shp', scope: '01' });
  });
});
