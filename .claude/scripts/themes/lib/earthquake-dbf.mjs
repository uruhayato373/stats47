import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url),
  unzipper = require('unzipper');
export async function readPopulationZip(zipPath, pref, onRecord) {
  const z = await unzipper.Open.file(zipPath),
    name = `250m_mesh_2024_${pref}.dbf`,
    entries = z.files.filter((f) => f.path === name);
  assert.equal(entries.length, 1, `Expected DBF ${name}`);
  const entry = entries[0],
    wanted = [
      'MESH_ID',
      'SHICODE',
      'PTN_2020',
      'PTN_2050',
      'HITOKU2050',
      'GASSAN2050',
    ];
  let pending = Buffer.alloc(0),
    header = null,
    fields = null,
    recordCount = 0,
    bytes = 0;
  const h = createHash('sha256');
  for await (const chunk of entry.stream()) {
    bytes += chunk.length;
    h.update(chunk);
    pending = Buffer.concat([pending, chunk]);
    if (!header) {
      if (pending.length < 32) continue;
      const recordLength = pending.readUInt16LE(10),
        headerLength = pending.readUInt16LE(8),
        records = pending.readUInt32LE(4);
      assert.equal(pending[0], 3, 'Expected dBase III');
      if (pending.length < headerLength) continue;
      let offset = 1,
        all = [];
      for (let i = 32; i < headerLength && pending[i] !== 0x0d; i += 32) {
        const rawName = pending.subarray(i, i + 11),
          zero = rawName.indexOf(0),
          fieldName = rawName
            .subarray(0, zero < 0 ? 11 : zero)
            .toString('ascii'),
          type = String.fromCharCode(pending[i + 11]),
          length = pending[i + 16],
          decimals = pending[i + 17];
        assert.ok(length > 0);
        all.push({ name: fieldName, type, length, decimals, offset });
        offset += length;
      }
      assert.equal(offset, recordLength);
      fields = wanted.map((key) => {
        const a = all.filter((f) => f.name === key);
        assert.equal(a.length, 1, `missing or duplicate field ${key}`);
        return a[0];
      });
      assert.ok(
        fields
          .filter((f) => f.name.startsWith('PTN_'))
          .every((f) => ['N', 'F'].includes(f.type))
      );
      assert.ok(
        fields
          .filter((f) => !f.name.startsWith('PTN_'))
          .every((f) => f.type === 'C')
      );
      header = { records, recordLength, headerLength, fields };
      pending = pending.subarray(headerLength);
    }
    let consumed = 0;
    while (
      recordCount < header.records &&
      pending.length - consumed >= header.recordLength
    ) {
      const row = pending.subarray(consumed, consumed + header.recordLength);
      assert.equal(row[0], 0x20, 'deleted or malformed DBF record');
      let p = {};
      for (const f of fields) {
        let text = row.toString('ascii', f.offset, f.offset + f.length).trim();
        if (f.name.startsWith('PTN_')) {
          assert.ok(
            text.length > 0 &&
              /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text),
            `invalid numeric ${f.name}`
          );
          p[f.name] = Number(text);
          assert.ok(
            Number.isFinite(p[f.name]) && p[f.name] >= 0,
            `negative or non-finite ${f.name}`
          );
        } else p[f.name] = text;
      }
      assert.ok(
        /^\d{8}[1-4]{2}$/.test(p.MESH_ID),
        `invalid quartermesh ${p.MESH_ID}`
      );
      assert.ok(
        /^\d{5}$/.test(p.SHICODE) && p.SHICODE.startsWith(pref),
        `wrong municipality ${p.SHICODE} for ${pref}`
      );
      onRecord(p, recordCount);
      recordCount++;
      consumed += header.recordLength;
    }
    pending = pending.subarray(consumed);
  }
  assert.ok(header);
  assert.equal(recordCount, header.records);
  assert.ok(
    pending.length === 0 || (pending.length === 1 && pending[0] === 0x1a),
    'extra bytes after DBF records'
  );
  assert.equal(bytes, entry.uncompressedSize);
  return {
    archiveEntry: name,
    bytes,
    sha256: h.digest('hex'),
    records: recordCount,
    fields: header.fields,
    decoder:
      'dBase III selected ASCII fields, strict complete record count; compressed source SHA verified by caller',
  };
}
