/**
 * 旧形式 Excel (.xls = OLE2 + BIFF8) の最小リーダ。依存パッケージなしで値だけを読む。
 * 対応: SST 文字列 / LABELSST / LABEL / NUMBER / RK / MULRK / FORMULA(数値結果) / CONTINUE。
 * 書式・日付変換・セル結合は扱わない (数値は生の number、文字列は string)。
 *
 * 使い方: const sheets = readXls(buffer);  // { name, rows: Map<rowIdx, Map<colIdx, value>> }[]
 * 用途: 国立がん研究センターのがん統計 (.xls) の取り込み。
 */

const FREESECT = 0xfffffffe;

function readCfbStream(buf, wantNames) {
  const sectorShift = buf.readUInt16LE(30);
  const miniShift = buf.readUInt16LE(32);
  const secSize = 1 << sectorShift;
  const miniSize = 1 << miniShift;
  const nFat = buf.readUInt32LE(44);
  const dirStart = buf.readUInt32LE(48);
  const miniCutoff = buf.readUInt32LE(56);
  const miniFatStart = buf.readUInt32LE(60);
  let difatStart = buf.readUInt32LE(68);
  const nDifat = buf.readUInt32LE(72);
  const secOff = (s) => (s + 1) * secSize;

  const fatSectors = [];
  for (let i = 0; i < 109 && fatSectors.length < nFat; i++) fatSectors.push(buf.readUInt32LE(76 + i * 4));
  for (let d = 0; d < nDifat && difatStart < FREESECT; d++) {
    const off = secOff(difatStart);
    for (let i = 0; i < secSize / 4 - 1 && fatSectors.length < nFat; i++) fatSectors.push(buf.readUInt32LE(off + i * 4));
    difatStart = buf.readUInt32LE(off + secSize - 4);
  }
  const fat = [];
  for (const s of fatSectors) {
    const off = secOff(s);
    for (let i = 0; i < secSize / 4; i++) fat.push(buf.readUInt32LE(off + i * 4));
  }
  const chain = (start) => {
    const out = [];
    let s = start;
    while (s < FREESECT && out.length < fat.length + 1) { out.push(s); s = fat[s]; }
    return out;
  };
  const readChain = (start) => Buffer.concat(chain(start).map((s) => buf.subarray(secOff(s), secOff(s) + secSize)));

  const dir = readChain(dirStart);
  const entries = [];
  for (let i = 0; i + 128 <= dir.length; i += 128) {
    const nameLen = dir.readUInt16LE(i + 64);
    if (nameLen === 0) continue;
    entries.push({
      name: dir.subarray(i, i + nameLen - 2).toString("utf16le"),
      type: dir[i + 66],
      start: dir.readUInt32LE(i + 116),
      size: dir.readUInt32LE(i + 120),
    });
  }
  const root = entries.find((e) => e.type === 5);
  const target = entries.find((e) => wantNames.includes(e.name) && e.type === 2);
  if (!target) throw new Error("Workbook ストリームが見つかりません");
  if (target.size >= miniCutoff) return readChain(target.start).subarray(0, target.size);
  // mini stream
  const miniStream = readChain(root.start);
  const miniFat = [];
  const mf = readChain(miniFatStart);
  for (let i = 0; i + 4 <= mf.length; i += 4) miniFat.push(mf.readUInt32LE(i));
  const parts = [];
  let s = target.start;
  while (s < FREESECT && parts.length < miniFat.length + 1) {
    parts.push(miniStream.subarray(s * miniSize, (s + 1) * miniSize));
    s = miniFat[s];
  }
  return Buffer.concat(parts).subarray(0, target.size);
}

function decodeRk(rk) {
  let v;
  if (rk & 2) v = rk >> 2;
  else {
    const b = Buffer.alloc(8);
    b.writeUInt32LE((rk & 0xfffffffc) >>> 0, 4);
    v = b.readDoubleLE(0);
  }
  return rk & 1 ? v / 100 : v;
}

/** レコード列。CONTINUE は呼び出し側で扱えるよう chunks として保持する。 */
function* records(wb) {
  let pos = 0;
  while (pos + 4 <= wb.length) {
    const id = wb.readUInt16LE(pos);
    const len = wb.readUInt16LE(pos + 2);
    yield { id, pos, data: wb.subarray(pos + 4, pos + 4 + len) };
    pos += 4 + len;
  }
}

function parseSst(chunks) {
  // chunks[0] = SST 本体、以降 CONTINUE。文字列が chunk 境界をまたぐとき、境界直後に 1 byte の文字幅フラグが入る。
  let ci = 0, p = 8; // total(4)+unique(4)
  const uniq = chunks[0].readUInt32LE(4);
  const out = [];
  const cur = () => chunks[ci];
  const need = (n) => { // 現 chunk に n byte 残っていなければ次 chunk へ (固定長ヘッダ部は境界をまたがない)
    if (p + n > cur().length && ci + 1 < chunks.length) { ci++; p = 0; }
  };
  for (let k = 0; k < uniq; k++) {
    need(3);
    const cch = cur().readUInt16LE(p); p += 2;
    const flags = cur()[p]; p += 1;
    let rich = 0, ext = 0;
    if (flags & 8) { need(2); rich = cur().readUInt16LE(p); p += 2; }
    if (flags & 4) { need(4); ext = cur().readUInt32LE(p); p += 4; }
    let wide = !!(flags & 1);
    let s = "";
    let remain = cch;
    while (remain > 0) {
      if (p >= cur().length && ci + 1 < chunks.length) { ci++; p = 0; wide = !!(cur()[p] & 1); p += 1; }
      const bytesPer = wide ? 2 : 1;
      const avail = Math.floor((cur().length - p) / bytesPer);
      const take = Math.min(remain, avail);
      if (take <= 0) throw new Error(`SST 解析エラー k=${k}/${uniq} ci=${ci}/${chunks.length} p=${p}/${cur().length} remain=${remain} wide=${wide}`);
      s += wide ? cur().subarray(p, p + take * 2).toString("utf16le") : cur().subarray(p, p + take).toString("latin1");
      p += take * bytesPer;
      remain -= take;
    }
    let skip = rich * 4 + ext;
    while (skip > 0) {
      if (p >= cur().length && ci + 1 < chunks.length) { ci++; p = 0; }
      const t = Math.min(skip, cur().length - p);
      p += t; skip -= t;
    }
    out.push(s);
  }
  return out;
}

export function readXls(buffer) {
  const wb = readCfbStream(buffer, ["Workbook", "Book"]);
  const sheets = [];
  let sst = [];
  const recs = [...records(wb)];
  // SST (+ CONTINUE)
  for (let i = 0; i < recs.length; i++) {
    if (recs[i].id === 0x00fc) {
      const chunks = [recs[i].data];
      let j = i + 1;
      while (j < recs.length && recs[j].id === 0x003c) chunks.push(recs[j++].data);
      sst = parseSst(chunks);
      break;
    }
  }
  // BOUNDSHEET
  for (const r of recs) {
    if (r.id === 0x0085) {
      const off = r.data.readUInt32LE(0);
      const cch = r.data[6];
      const wide = r.data[7] & 1;
      const name = wide ? r.data.subarray(8, 8 + cch * 2).toString("utf16le") : r.data.subarray(8, 8 + cch).toString("latin1");
      sheets.push({ name, offset: off, rows: new Map() });
    }
  }
  const byPos = new Map(recs.map((r, i) => [r.pos, i]));
  for (const sh of sheets) {
    let i = byPos.get(sh.offset);
    if (i === undefined) throw new Error(`シート ${sh.name} の開始位置が不正`);
    const set = (r, c, v) => {
      if (!sh.rows.has(r)) sh.rows.set(r, new Map());
      sh.rows.get(r).set(c, v);
    };
    let lastFormula = null;
    for (i += 1; i < recs.length; i++) {
      const { id, data } = recs[i];
      if (id === 0x000a) break; // EOF
      if (id === 0x00fd) set(data.readUInt16LE(0), data.readUInt16LE(2), sst[data.readUInt32LE(6)]);
      else if (id === 0x0203) set(data.readUInt16LE(0), data.readUInt16LE(2), data.readDoubleLE(6));
      else if (id === 0x027e) set(data.readUInt16LE(0), data.readUInt16LE(2), decodeRk(data.readInt32LE(6)));
      else if (id === 0x00bd) {
        const row = data.readUInt16LE(0), c0 = data.readUInt16LE(2);
        const n = (data.length - 6) / 6;
        for (let k = 0; k < n; k++) set(row, c0 + k, decodeRk(data.readInt32LE(4 + k * 6 + 2)));
      } else if (id === 0x0204) {
        const cch = data.readUInt16LE(6);
        const wide = data[8] & 1;
        set(data.readUInt16LE(0), data.readUInt16LE(2), wide ? data.subarray(9, 9 + cch * 2).toString("utf16le") : data.subarray(9, 9 + cch).toString("latin1"));
      } else if (id === 0x0006) {
        const r = data.readUInt16LE(0), c = data.readUInt16LE(2);
        if (data.readUInt16LE(12) !== 0xffff) set(r, c, data.readDoubleLE(6));
        else lastFormula = [r, c];
      } else if (id === 0x0207 && lastFormula) {
        const cch = data.readUInt16LE(0);
        const wide = data[2] & 1;
        set(lastFormula[0], lastFormula[1], wide ? data.subarray(3, 3 + cch * 2).toString("utf16le") : data.subarray(3, 3 + cch).toString("latin1"));
        lastFormula = null;
      }
    }
  }
  return sheets;
}

/** rows (Map) を 2 次元配列へ。 */
export function sheetToArray(sheet) {
  const maxR = Math.max(...sheet.rows.keys());
  const out = [];
  for (let r = 0; r <= maxR; r++) {
    const row = sheet.rows.get(r);
    if (!row) { out.push([]); continue; }
    const maxC = Math.max(...row.keys());
    const arr = new Array(maxC + 1).fill(null);
    for (const [c, v] of row) arr[c] = v;
    out.push(arr);
  }
  return out;
}
