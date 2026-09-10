import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
const code = process.env.LANDSLIDE_CODE_ROOT ?? process.cwd(),
  root = process.env.LANDSLIDE_CANONICAL_ROOT ?? path.resolve('.local/r2'),
  base = path.join(root, 'app/geo/population-landslide-exposure'),
  available = fs.existsSync(path.join(base, 'manifest.json')),
  read = (p) => JSON.parse(fs.readFileSync(p, 'utf8')),
  clone = (x) => JSON.parse(JSON.stringify(x));
test(
  'canonical landslide bundle and negative contracts',
  { skip: !available },
  async (t) => {
    const c = await import(
        pathToFileURL(
          path.join(code, 'packages/gis/src/geo-analysis/landslide-exposure.ts')
        )
      ),
      manifest = read(path.join(base, 'manifest.json')),
      snapshot = read(path.join(base, 'item.json'));
    await t.test('all 47 details and 46 conservation checks', () => {
      assert(c.parseGeoLandslideManifest(manifest));
      assert(c.parseGeoLandslideSnapshot(snapshot));
      for (let i = 1; i <= 47; i++) {
        const pref = String(i).padStart(2, '0'),
          d = c.parseGeoLandslidePrefDetail(
            read(path.join(base, 'pref', pref + '.json')),
            pref + '000'
          );
        assert(d);
        c.assertGeoLandslideConservation(
          d,
          snapshot.rows.find((r) => r.areaCode === pref + '000')
        );
      }
    });
    for (const [name, mutate] of [
      ['missing original input', (m) => m.inputs.pop()],
      [
        'changed original source SHA',
        (m) => (m.inputs[0].sha256 = '0'.repeat(64)),
      ],
      [
        'unauthorized Kyoto archive',
        (m) => {
          const p = clone(m.inputs.at(-1));
          p.key = 'gis/mlit-ksj/A33/25/26.zip';
          m.inputs.push(p);
        },
      ],
      [
        'missing source index',
        (m) => {
          const s = m.stages.find((s) => s.id === 'landslide-polygons');
          s.outputs = s.outputs.filter((o) => !o.key.endsWith('/index.json'));
        },
      ],
      ['missing prefecture detail', (m) => m.stages[0].outputs.pop()],
      ['wrong stage dependencies', (m) => m.stages[3].inputIds.pop()],
      [
        'wrong output pattern',
        (m) => (m.stages[0].outputKeyPattern = 'app/geo/other/{prefCode}.json'),
      ],
      [
        'duplicate output key',
        (m) => m.stages[2].outputs.push(clone(m.stages[2].outputs[0])),
      ],
    ])
      await t.test(name, () => {
        const m = clone(manifest);
        mutate(m);
        assert.equal(c.parseGeoLandslideManifest(m), null);
      });
    await t.test(
      'every canonical artifact matches Web serialization bytes and SHA',
      () => {
        const artifacts = new Map(
          manifest.stages.flatMap((s) => s.outputs).map((a) => [a.key, a])
        );
        for (const a of artifacts.values()) {
          const v = read(path.join(root, a.key)),
            body =
              (a.key === manifest.aggregate.key
                ? JSON.stringify(v, null, 2)
                : JSON.stringify(v)) + '\n';
          assert.equal(
            crypto.createHash('sha256').update(body).digest('hex'),
            a.sha256,
            a.key
          );
          assert.equal(Buffer.byteLength(body), a.bytes, a.key);
        }
      }
    );
    await t.test('Kyoto cannot become zero', () => {
      const s = clone(snapshot);
      for (const k of Object.keys(
        s.rows.find((r) => r.areaCode === '26000').values
      ))
        s.rows.find((r) => r.areaCode === '26000').values[k] = 0;
      assert.equal(c.parseGeoLandslideSnapshot(s), null);
    });
    await t.test('national is pooled from 46 eligible rows', () => {
      const v = c.landslideNationalValues(snapshot.rows);
      assert.equal(
        v.exposedCenterPopulationShare,
        (v.exposedCenterPopulation / v.population2020) * 100
      );
      const s = clone(snapshot.rows);
      s.pop();
      assert.throws(() => c.landslideNationalValues(s));
    });
    await t.test('duplicated facility rejected', () => {
      const d = read(path.join(base, 'pref/01.json'));
      d.facilities[1] = d.facilities[0];
      assert.equal(c.parseGeoLandslidePrefDetail(d, '01000'), null);
    });
    await t.test('population denominator alteration rejected', () => {
      const d = read(path.join(base, 'pref/01.json'));
      d.summary.totalScaled++;
      assert.equal(c.parseGeoLandslidePrefDetail(d, '01000'), null);
    });
  }
);
