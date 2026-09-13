import { describe, expect, it } from 'vitest';

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { sanitizeArchiveBaseName, resolveShapefileEncoding, extractGeoJson } from '../downloader';
import { getCodeConfig } from '../registry';

describe('legacy DBF character encoding', () => {
  it('rejects legacy GeoJSON unless an explicit DBF encoding permits the original Shapefile fallback', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stats47-legacy-geojson-'));
    const zip = path.join(dir, 'source.zip');
    try {
      // One CP932 point in both representations; no CPG. Mirrors A42–A44 archives.
      writeFileSync(zip, Buffer.from('UEsDBBQAAAAAAAAAAACnXWFejgAAAI4AAAAMAAAAZGF0YS5nZW9qc29ueyJ0eXBlIjoiRmVhdHVyZUNvbGxlY3Rpb24iLCJmZWF0dXJlcyI6W3sidHlwZSI6IkZlYXR1cmUiLCJnZW9tZXRyeSI6eyJ0eXBlIjoiUG9pbnQiLCJjb29yZGluYXRlcyI6WzEzOSwzNV19LCJwcm9wZXJ0aWVzIjp7Im5hbWUiOiKORJZ5jnMifX1dfVBLAwQUAAAAAAAAAAAAKXzJDYAAAACAAAAACAAAAGRhdGEuc2hwAAAnCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQOgDAAABAAAAAAAAAABgYUAAAAAAAIBBQAAAAAAAYGFAAAAAAACAQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAKAQAAAAAAAAAAYGFAAAAAAACAQUBQSwMEFAAAAAAAAAAAAKqOniZXAAAAVwAAAAgAAABkYXRhLmRiZgMAAAABAAAAQQAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAbmFtZQAAAAAAAABDAAAAABQAAAAAAAAAAAAAAAAAAAANII5ElnmOcyAgICAgICAgICAgICAgGlBLAQIUABQAAAAAAAAAAACnXWFejgAAAI4AAAAMAAAAAAAAAAAAAAAAAAAAAABkYXRhLmdlb2pzb25QSwECFAAUAAAAAAAAAAAAKXzJDYAAAACAAAAACAAAAAAAAAAAAAAAAAC4AAAAZGF0YS5zaHBQSwECFAAUAAAAAAAAAAAAqo6eJlcAAABXAAAACAAAAAAAAAAAAAAAAABeAQAAZGF0YS5kYmZQSwUGAAAAAAMAAwCmAAAA2wEAAAAA', 'base64'));
      await expect(extractGeoJson(zip, '')).rejects.toThrow();
      const files = await extractGeoJson(zip, '', 'shift-jis');
      const data = JSON.parse(readFileSync(files[0], 'utf8'));
      expect(data.features).toHaveLength(1);
      expect(data.features[0].properties.name).toBe('札幌市');
      expect(data.features[0].geometry.coordinates).toEqual([139, 35]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('uses a supplied UTF-8 GeoJSON when the old UTF-8 directory is absent', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'stats47-geojson-'));
    const zip = path.join(dir, 'source.zip');
    try {
      writeFileSync(zip, Buffer.from('UEsDBAoAAAAAAFE0KF0AAAAAAAAAAAAAAAALAAAATDAxLTI2X0dNTC9QSwMECgAAAAgAUTQoXduEyyV4AAAAlwAAABkAAABMMDEtMjZfR01ML0wwMS0yNi5nZW9qc29uq1YqqSxIVbJScktNLCktSnXOz8lJTS7JzM9T0lFKg4gVK1lFV6OpA8oWFOUXpBaVZILkq5XyEnNB0s/mrH26s+fpjialWh2l9NT83NSSokqQPFR7QH5mXglQc3J+flFKZl5iCdh0QxNDPWNTHRNjPQOz2Nra2FoAUEsBAhQACgAAAAAAUTQoXQAAAAAAAAAAAAAAAAsAAAAAAAAAAAAQAAAAAAAAAEwwMS0yNl9HTUwvUEsBAhQACgAAAAgAUTQoXduEyyV4AAAAlwAAABkAAAAAAAAAAAAAAAAAKQAAAEwwMS0yNl9HTUwvTDAxLTI2Lmdlb2pzb25QSwUGAAAAAAIAAgCAAAAA2AAAAAAA', 'base64'));
      const files = await extractGeoJson(zip, 'UTF-8/');
      expect(files).toHaveLength(1);
      expect(JSON.parse(readFileSync(files[0], 'utf8')).features[0].properties.name).toBe('札幌市');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('uses the explicitly verified encoding for W09 archives without CPG files', () => {
    expect(resolveShapefileEncoding(undefined, getCodeConfig('W09')?.shapefileEncoding)).toBe('shift-jis');
    expect(resolveShapefileEncoding('UTF-8')).toBe('utf-8');
  });
  it.each(['932','CP932','Shift_JIS','shift-jis','Windows-31J'])('recognizes %s without a second decode using the default encoding', label => {
    expect(resolveShapefileEncoding(label)).toBe('shift-jis');
  });
});

describe('sanitizeArchiveBaseName', () => {
  it('Shift-JIS由来の不正な日本語名を行政コードだけのASCII名にする', () => {
    expect(sanitizeArchiveBaseName('01662_���݌S���ݒ�.geojson', 1)).toBe('01662');
  });

  it('英数字の意味あるファイル名は維持する', () => {
    expect(
      sanitizeArchiveBaseName(
        'A42-18_Preservation_Area_of_Historic_Landscape.geojson',
        1
      )
    ).toBe('A42-18_Preservation_Area_of_Historic_Landscape');
  });
});
