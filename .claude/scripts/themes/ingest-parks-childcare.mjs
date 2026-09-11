#!/usr/bin/env node
/** Official ENV/CFA county series. Run from repository root; only --write-local stages canonical values. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
const root = process.cwd();
const requireRepo = createRequire(resolve(root, 'package.json'));
const ExcelJS = requireRepo('exceljs');
const prefs = requireRepo('./packages/area/src/data/prefectures.json');
const sum = (values) => values.reduce((a, b) => a + b, 0);
const clean = (v) =>
  String(v ?? '')
    .normalize('NFKC')
    .replace(/\s/g, '');
const pref = (v) => {
  const s = clean(v);
  return prefs.find((p) =>
    [p.prefName, p.prefName.replace(/[都府県]$/, '')].some(
      (n) => clean(n) === s
    )
  );
};
export const sha = (body) => createHash('sha256').update(body).digest('hex');
const count = (c) => {
  const v = c.type === ExcelJS.ValueType.Formula ? c.result : c.value;
  assert.ok(
    Number.isSafeInteger(v) && v >= 0,
    `${c.address} missing/non-integer/negative count ${JSON.stringify(v)}`
  );
  return v;
};
const plainCount = (c) => {
  assert.notEqual(
    c.type,
    ExcelJS.ValueType.Formula,
    'unexpected childcare formula'
  );
  return count(c);
};
const rowText = (sheet, row) =>
  clean(
    sheet
      .getRow(row)
      .values.filter((v) => typeof v === 'string')
      .join(' ')
  );
export const SOURCES = [
  {
    filename: 'parks-2024.xlsx',
    url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
    sha256: '1cf6dfc31087f48b84a53677207e32da30a75fce7614c6ac64ab919b75f7524c',
    bytes: 120929,
  },
  {
    filename: 'parks-overview.pdf',
    url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_gaiyo.pdf',
    sha256: '2c45d577facac8fde29cf9b4e4de08bfb0eaba1baa94df66c5598271691e7a2c',
    bytes: 180487,
  },
  {
    filename: 'childcare-report-2025.pdf',
    url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/c853cacb/20250828_policies_hoiku_torimatome_r7_01.pdf',
    sha256: '55c7128aa48f487ddf2fb17e79f99531aab71484f85cd1790bd0f5ad98031efe',
    bytes: 2685221,
  },
  {
    filename: 'childcare-summary-2025.xlsx',
    url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1a728dcc/20250828_policies_hoiku_torimatome_r7_02.xlsx',
    sha256: 'f04ff62f2419d73dc99b23d2904a8e3c1b58b3bdd0a6792393b5a6477f44d3d1',
    bytes: 260508,
  },
  {
    filename: 'childcare-applications-2025.xlsx',
    url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
    sha256: '5f3e86aa669a9ca66c55549991491a37c059d40110e88eb8b07fbd8a664b9bca',
    bytes: 833819,
  },
];
export const FIELDS = [
  {
    key: 'national-quasi-national-park-visits',
    filename: 'parks-2024.xlsx',
    unit: '千人',
    year: 2024,
    yearName: '2024年（暦年）',
    valueField: 'total',
  },
  {
    key: 'childcare-applicants',
    filename: 'childcare-applications-2025.xlsx',
    unit: '人',
    year: 2025,
    yearName: '2025年4月1日現在',
    valueField: 'applicants',
  },
];
export const EXPECTED_SOURCES = {
  'national-quasi-national-park-visits': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '環境省「自然公園等利用者数調」',
    url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
    config: {
      source: {
        name: '環境省「自然公園等利用者数調」',
        url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
      },
      provenance: {
        url: 'https://www.env.go.jp/park/doc/data/natural/naturalpark_06.xlsx',
        sourceSha256:
          '1cf6dfc31087f48b84a53677207e32da30a75fce7614c6ac64ab919b75f7524c',
        publicationIndexUrl: 'https://www.env.go.jp/park/doc/data.html',
        table:
          '表Ⅱ-５ 都道府県別利用者数（国立、国定公園別）／表Ⅱ-３・表Ⅱ-４の県別欄',
        valueColumn:
          '表Ⅱ-５の47県ブロック総計G/N/U列、国立D/K/R列、国定F/M/T列',
        dataYear: '2024年（暦年）',
        accessedAt: '2026-09-10',
        extraction:
          '県ラベルB/I/P列のブロック境界と総計結合セルのmasterを解決。国立・国定の各県セル177件を元表D/I列へ逆参照し、県名・公園名・数値を照合。県境公園全体E/J列の重複配賦を禁止。',
        verification:
          '47県欠測0・県別合計保存・原表県別177セルを各1回使用。全国国立336140千人＋国定256623千人＝592763千人。概要PDFの万人単位公表値へ丸め一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-parks-childcare.mjs --write-local',
        sourceUnit: '千人',
        geography: '原表の都道府県別公園利用者数',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        timeScope: 'calendar-year-2024',
        population: 'national-and-quasi-national-parks-only',
        counting: 'reported-annual-visits-not-distinct-persons',
        denominator: 'none',
        definitionUrl:
          'https://www.env.go.jp/park/doc/data/natural/naturalpark_gaiyo.pdf',
        definitionSha256:
          '2c45d577facac8fde29cf9b4e4de08bfb0eaba1baa94df66c5598271691e7a2c',
        classificationChange:
          '2024-06-25 Hidaka national designation; no annual change series generated',
      },
    },
  },
  'childcare-applicants': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: 'こども家庭庁「保育所等関連状況取りまとめ」',
    url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
    config: {
      source: {
        name: 'こども家庭庁「保育所等関連状況取りまとめ」',
        url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
      },
      provenance: {
        url: 'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/1aa96453/20250828_policies_hoiku_torimatome_r7_04.xlsx',
        sourceSha256:
          '5f3e86aa669a9ca66c55549991491a37c059d40110e88eb8b07fbd8a664b9bca',
        publicationIndexUrl:
          'https://www.cfa.go.jp/policies/hoiku/torimatome/r7/',
        table: '（参考）申込者の状況（令和７年４月１日）',
        valueColumn:
          '申込者の状況!E10:E1750（市区町村1,741行の申込者数、合計欄）',
        dataYear: '2025年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'B列連番とC列都道府県・D列市区町村を固定。各市区町村の11利用状況区分計＝申込者、4年齢区分計＝全年齢を検算して47県へ集約。',
        verification:
          '1,741市区町村一意、47県欠測0、全国2765235人。60申込欄＋28定員欄の県計＝全国。別XLSX県47＋独立市82の重複なし集計と利用者・定員・待機数を照合し、PDF15頁の全県4系列と一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-parks-childcare.mjs --write-local',
        sourceUnit: '人',
        geography: '報告市区町村の所属都道府県（市区町村報告の単純積上げ）',
        periodStart: '2025-04-01',
        periodEnd: '2025-04-01',
        asOf: '2025-04-01',
        timeScope: 'point-in-time-2025-04-01',
        population: 'childcare-applicants-including-current-users',
        counting: 'reported-applicants-not-new-applications',
        denominator: 'none',
        definitionUrl: 'https://www.cfa.go.jp/policies/hoiku/torimatome/r7/',
        verificationUrl:
          'https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/b0a8057b-34bf-4c20-84fb-ae592708ca9b/c853cacb/20250828_policies_hoiku_torimatome_r7_01.pdf',
        verificationSha256:
          '55c7128aa48f487ddf2fb17e79f99531aab71484f85cd1790bd0f5ad98031efe',
        verificationPdfPage: 15,
        municipalityRows: 1741,
        separateCityRowsForCrossCheck: 82,
      },
    },
  },
};
function groupText(s, row, col, min, max, resolve) {
  const c = s.getCell(row, col);
  const direct = resolve(c.text);
  if (direct) return direct;
  assert.equal(clean(c.text), '', `unknown label ${c.address}: ${c.text}`);
  let start = row,
    end = row;
  while (
    start > min &&
    !s.getCell(start, col).border?.top &&
    !s.getCell(start - 1, col).border?.bottom
  )
    start--;
  while (
    end < max &&
    !s.getCell(end, col).border?.bottom &&
    !s.getCell(end + 1, col).border?.top
  )
    end++;
  const labels = [
    ...new Set(
      Array.from({ length: end - start + 1 }, (_, i) =>
        resolve(s.getCell(start + i, col).text)
      ).filter(Boolean)
    ),
  ];
  assert.equal(
    labels.length,
    1,
    `ambiguous label ${c.address} ${start}:${end} ${labels}`
  );
  return labels[0];
}
export function parseParks(w) {
  assert.deepEqual(
    w.worksheets.map((s) => s.name),
    [
      '表Ⅱ-３・国立公園',
      '表Ⅱ-４・国定公園',
      '表Ⅱ-５・都道府県別',
      '表Ⅱ-６・県立公園',
    ]
  );
  for (const s of w.worksheets.slice(0, 3)) {
    assert.ok(rowText(s, 1).includes('令和6年'), 'park calendar year');
    const units = s
      .getRow(3)
      .values.filter((v) => typeof v === 'string' && v.includes('単位'));
    assert.ok(units.length > 0, 'missing park unit');
    for (const unit of units)
      assert.equal(clean(unit), '(単位:千人)', 'park unit');
  }
  for (const s of w.worksheets.slice(0, 2))
    for (const col of [4, 9])
      assert.equal(
        clean(s.getCell(5, col).text),
        '県別',
        'county versus park total'
      );
  const s = w.worksheets[2],
    proof = [],
    seenRefs = new Set();
  let blankSourceLabels = 0;
  for (const [pc, end] of [
    [2, 61],
    [9, 60],
    [16, 55],
  ]) {
    const starts = [];
    for (let r = 6; r <= end; r++) {
      const p = pref(s.getCell(r, pc).text);
      if (p) starts.push({ start: r, p });
    }
    for (let i = 0; i < starts.length; i++) {
      const { start, p } = starts[i],
        last = i + 1 < starts.length ? starts[i + 1].start - 1 : end;
      const totals = new Map();
      for (let r = start; r <= last; r++) {
        const c = s.getCell(r, pc + 5);
        if (c.value !== null) totals.set(c.master.address, c.master);
      }
      assert.equal(
        totals.size,
        1,
        `single county total ${p.prefName}: ${[...totals.keys()]}`
      );
      const totalCell = [...totals.values()][0];
      assert.ok(totalCell.row >= start && totalCell.row <= last);
      const total = count(totalCell);
      const families = [];
      for (const [family, offset, sourceIndex, ranges] of [
        [
          'national',
          1,
          0,
          [
            [4, 6, 45],
            [9, 6, 47],
          ],
        ],
        [
          'quasi',
          3,
          1,
          [
            [4, 6, 53],
            [9, 6, 52],
          ],
        ],
      ]) {
        const entries = [],
          subtotals = [];
        for (let r = start; r <= last; r++) {
          const name = s.getCell(r, pc + offset).text,
            c = s.getCell(r, pc + offset + 1);
          if (clean(name) === '計') {
            subtotals.push(count(c));
            continue;
          }
          if (!clean(name)) {
            assert.equal(c.value, null, `orphan park count ${c.address}`);
            continue;
          }
          const formula = c.formula,
            match = /^'([^']+)'!([DI])(\d+)$/.exec(formula ?? '');
          assert.ok(match, `not direct county cell ${c.address}: ${formula}`);
          const target = w.getWorksheet(match[1]);
          assert.equal(target, w.worksheets[sourceIndex]);
          const value = count(c),
            ref = match[2] + match[3],
            row = Number(match[3]),
            column = match[2] === 'D' ? 4 : 9;
          assert.equal(value, count(target.getCell(ref)));
          const range = ranges.find((x) => x[0] === column);
          assert.ok(row >= range[1] && row <= range[2]);
          const county = groupText(
            target,
            row,
            column - 1,
            range[1],
            range[2],
            (v) => pref(v)?.prefCode
          );
          assert.equal(
            county,
            p.prefCode,
            `${c.address} source county ${county} expected ${p.prefCode}`
          );
          if (!clean(target.getCell(row, column - 1).text)) blankSourceLabels++;
          const parkName = groupText(
            target,
            row,
            column - 2,
            range[1],
            range[2],
            (v) => clean(v) || null
          );
          assert.equal(
            clean(name).replace(/^※/, ''),
            parkName.replace(/^※/, ''),
            `${c.address} parkname`
          );
          const sourceKey = target.name + '!' + ref;
          assert.ok(!seenRefs.has(sourceKey), 'duplicate source county cell');
          seenRefs.add(sourceKey);
          entries.push({
            parkName: name,
            value,
            cell: c.address,
            sourceCell: sourceKey,
            sourceCounty: county,
          });
        }
        const amount = entries.reduce((n, e) => n + e.value, 0);
        for (const subtotal of subtotals)
          assert.equal(
            subtotal,
            amount,
            p.prefName + ' ' + family + ' subtotal'
          );
        assert.ok(subtotals.length <= 1);
        families.push({
          family,
          amount,
          subtotals,
          entries,
          absence:
            entries.length === 0
              ? 'no listed park in complete county table'
              : null,
        });
      }
      assert.equal(
        families[0].amount + families[1].amount,
        total,
        p.prefName + ' total'
      );
      proof.push({
        areaCode: p.prefCode,
        areaName: p.prefName,
        startRow: start,
        endRow: last,
        prefectureCell: s.getCell(start, pc).address,
        totalCell: totalCell.address,
        total,
        families,
      });
    }
  }
  assert.equal(proof.length, 47);
  assert.equal(new Set(proof.map((p) => p.areaCode)).size, 47);
  for (const [index, ranges] of [
    [
      0,
      [
        [4, 6, 45],
        [9, 6, 47],
      ],
    ],
    [
      1,
      [
        [4, 6, 53],
        [9, 6, 52],
      ],
    ],
  ])
    for (const [c, lo, hi] of ranges)
      for (let r = lo; r <= hi; r++)
        assert.ok(
          seenRefs.has(
            w.worksheets[index].name +
              '!' +
              w.worksheets[index].getCell(r, c).address
          ),
          'unreferenced county source cell'
        );
  const national = {
    national: proof.reduce((n, p) => n + p.families[0].amount, 0),
    quasi: proof.reduce((n, p) => n + p.families[1].amount, 0),
    total: proof.reduce((n, p) => n + p.total, 0),
  };
  assert.equal(national.national, 336140);
  assert.equal(national.quasi, 256623);
  assert.equal(national.total, 592763);
  for (const [c, v] of [
    ['W5', national.national],
    ['X5', national.quasi],
    ['Y5', national.total],
  ])
    assert.equal(count(s.getCell(c)), v);
  return {
    status: 'PASS',
    national,
    countyParkCells: seenRefs.size,
    blankSourceLabels,
    proof: proof.sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
  };
}
export function parseChildcare(w, summary) {
  assert.deepEqual(
    w.worksheets.map((s) => s.name),
    ['定員の状況', '申込者の状況']
  );
  for (const s of w.worksheets) {
    assert.ok(
      rowText(s, 3).includes(s.name + '(令和7年4月1日)'),
      'childcare as-of date/title'
    );
    assert.ok(
      rowText(s, 5).includes('市区町村からの報告に基づき単純に積み上げた数値'),
      'reported municipality population'
    );
    assert.equal(rowText(s, 6), '(人)', 'childcare unit');
    for (let r = 1752; r <= s.rowCount; r++)
      assert.ok(
        s.getRow(r).values.every((v) => v === null || v === undefined),
        'unexpected extra municipality'
      );
  }
  const labels = [
    '申込者数',
    '保育所を利用している者',
    '幼保連携型認定こども園を利用している者',
    '幼稚園型認定こども園等を利用している者',
    '地域型保育事業を利用している者',
    '特例保育等を利用している者',
    '企業主導型保育事業を利用している者',
    '地方単独事業を利用している者',
    '育児休業中の者',
    '特定の保育園等のみ希望している者',
    '求職活動を休止している者',
    '待機児童',
  ];
  const ageLabels = ['合計', '0歳児', '1歳児', '2歳児', '3歳以上児'];
  const capacityLabels = [
    '保育所',
    '幼保連携型認定こども園',
    '幼稚園型認定こども園等',
    '地域型保育事業',
    '特例保育等',
    '企業主導型保育事業',
    '地方単独事業',
  ];
  for (let g = 0; g < 5; g++) {
    assert.equal(
      clean(w.worksheets[1].getCell(7, 5 + g * 12).text),
      ageLabels[g],
      'childcare age header'
    );
    for (let j = 0; j < 12; j++)
      assert.equal(
        clean(w.worksheets[1].getCell(8, 5 + g * 12 + j).text),
        labels[j],
        'childcare status header'
      );
  }
  for (let g = 0; g < 4; g++) {
    assert.equal(
      clean(w.worksheets[0].getCell(7, 5 + g * 7).text),
      ['合計', '0歳児', '1,2歳児', '3歳以上児'][g],
      'capacity age header'
    );
    for (let j = 0; j < 7; j++)
      assert.equal(
        clean(w.worksheets[0].getCell(8, 5 + g * 7 + j).text),
        capacityLabels[j],
        'capacity type header'
      );
  }
  const a = w.getWorksheet('申込者の状況'),
    c = w.getWorksheet('定員の状況');
  const detail = [],
    seen = new Set();
  let ageChecks = 0,
    statusChecks = 0,
    capacityChecks = 0;
  for (let r = 10; r <= 1750; r++) {
    const order = plainCount(a.getCell(r, 2));
    assert.equal(order, r - 9);
    assert.equal(plainCount(c.getCell(r, 2)), order);
    const pname = a.getCell(r, 3).text,
      city = a.getCell(r, 4).text,
      key = a.getCell(r, 1).text;
    assert.equal(key, pname + city);
    assert.ok(!seen.has(key), 'duplicate reporting municipality');
    seen.add(key);
    const p = prefs.find((p) => p.prefName === pname);
    assert.ok(p);
    assert.equal(c.getCell(r, 1).text, key);
    assert.equal(c.getCell(r, 3).text, pname);
    assert.equal(c.getCell(r, 4).text, city);
    const all = Array.from({ length: 60 }, (_, i) =>
      plainCount(a.getCell(r, i + 5))
    );
    const cap = Array.from({ length: 28 }, (_, i) =>
      plainCount(c.getCell(r, i + 5))
    );
    for (let j = 0; j < 12; j++) {
      assert.equal(
        all[j],
        sum([1, 2, 3, 4].map((g) => all[12 * g + j])),
        'age sum'
      );
      ageChecks++;
    }
    for (let g = 0; g < 5; g++) {
      assert.equal(
        all[g * 12],
        sum(all.slice(g * 12 + 1, g * 12 + 12)),
        'status partition'
      );
      statusChecks++;
    }
    for (let j = 0; j < 7; j++) {
      assert.equal(
        cap[j],
        sum([1, 2, 3].map((g) => cap[7 * g + j])),
        'capacity age sum'
      );
      capacityChecks++;
    }
    detail.push({
      areaCode: p.prefCode,
      areaName: pname,
      cityName: city,
      ordinal: order,
      row: r,
      applicants: all[0],
      users: sum(all.slice(1, 5)),
      capacity: sum(cap.slice(0, 4)),
      waiting: all[11],
      applicantAgeGroups: [all[12], all[24], all[36], all[48]],
      statusGroups: all.slice(1, 12),
      raw: all,
      rawCapacity: cap,
    });
  }
  assert.equal(seen.size, 1741);
  for (let j = 0; j < 60; j++)
    assert.equal(
      sum(detail.map((r) => r.raw[j])),
      plainCount(a.getCell(1751, j + 5)),
      'national application column'
    );
  for (let j = 0; j < 28; j++)
    assert.equal(
      sum(detail.map((r) => r.rawCapacity[j])),
      plainCount(c.getCell(1751, j + 5)),
      'national capacity column'
    );
  const rows = prefs.map((p) => {
    const local = detail.filter((r) => r.areaCode === p.prefCode);
    assert.ok(local.length);
    return {
      areaCode: p.prefCode,
      areaName: p.prefName,
      municipalities: local.length,
      applicants: sum(local.map((x) => x.applicants)),
      users: sum(local.map((x) => x.users)),
      capacity: sum(local.map((x) => x.capacity)),
      waiting: sum(local.map((x) => x.waiting)),
    };
  });
  const national = Object.fromEntries(
    ['applicants', 'users', 'capacity', 'waiting'].map((k) => [
      k,
      sum(rows.map((r) => r[k])),
    ])
  );
  assert.deepEqual(national, {
    applicants: 2765235,
    users: 2678417,
    capacity: 3029282,
    waiting: 2254,
  });
  const s = summary.getWorksheet('資料3');
  let cityRows = 0;
  const compare = prefs.map((p, i) => {
    const r = i + 6;
    assert.equal(plainCount(s.getCell(r, 1)), i + 1);
    assert.equal(s.getCell(r, 2).text, p.prefName);
    return {
      areaCode: p.prefCode,
      areaName: p.prefName,
      capacity: plainCount(s.getCell(r, 4)),
      users: plainCount(s.getCell(r, 5)),
      waiting: plainCount(s.getCell(r, 6)),
      cityNames: [],
    };
  });
  for (let r = 6; r <= s.rowCount; r++) {
    const id = s.getCell(r, 7).value;
    if (typeof id !== 'number') continue;
    assert.equal(id, 48 + cityRows);
    const city = s.getCell(r, 8).text,
      match = detail.filter((d) => d.cityName === city);
    assert.equal(match.length, 1, 'city lookup unique');
    const d = match[0],
      p = compare.find((x) => x.areaCode === d.areaCode);
    for (const [k, col] of [
      ['capacity', 10],
      ['users', 11],
      ['waiting', 12],
    ]) {
      assert.equal(plainCount(s.getCell(r, col)), d[k], 'city summary ' + k);
      p[k] += d[k];
    }
    p.cityNames.push(city);
    cityRows++;
  }
  assert.equal(cityRows, 82);
  for (const row of rows) {
    const cross = compare.find((x) => x.areaCode === row.areaCode);
    for (const key of ['capacity', 'users', 'waiting'])
      assert.equal(
        row[key],
        cross[key],
        row.areaName + ' disjoint county+city check ' + key
      );
  }
  const map = summary.getWorksheet('資料4');
  for (let i = 0; i < 47; i++) {
    assert.equal(map.getCell(i + 4, 16).text, prefs[i].prefName);
    assert.equal(plainCount(map.getCell(i + 4, 17)), rows[i].waiting);
  }
  return {
    status: 'PASS',
    national,
    checks: {
      municipalities: 1741,
      prefectures: 47,
      ageChecks,
      statusChecks,
      capacityChecks,
      nationalColumns: 88,
      cityRows,
      disjointPrefectureCityComparisons: 141,
      waitingPrefectureCrossChecks: 47,
    },
    rows,
    detail: detail.map(({ raw, rawCapacity, ...d }) => d),
    cross: compare,
  };
}

export function verifyPdfTables(
  parksText,
  childcarePage15,
  childcarePage7,
  parks,
  childcare
) {
  const overview = clean(parksText);
  for (const phrase of [
    '令和6年',
    '暦年毎の自然公園の利用者数',
    '都道府県からの報告',
    '35の国立公園利用者数が3億3,614万人',
    '57の国定公園利用者数が2億5,662万人',
  ])
    assert.ok(overview.includes(phrase), 'park overview ' + phrase);
  assert.equal(Math.round(parks.national.national / 10), 33614);
  assert.equal(Math.round(parks.national.quasi / 10), 25662);
  const text = childcarePage15.normalize('NFKC');
  assert.ok(
    clean(text).includes('令和7年4月1日の保育所等利用状況'),
    'PDF reference date'
  );
  const pattern = new RegExp(
    '(' +
      ['全国', ...prefs.map((p) => p.prefName)].join('|') +
      ')\\s+([\\d,]+)人\\s+([\\d,]+)人\\s+([\\d,]+)人\\s+([\\d,]+)人\\s+([\\d.]+)%',
    'g'
  );
  const found = [...text.matchAll(pattern)];
  assert.equal(found.length, 48, 'PDF prefectures plus national');
  const seen = new Set();
  const comparisons = [];
  for (const m of found) {
    assert.ok(!seen.has(m[1]), 'PDF duplicate geography');
    seen.add(m[1]);
    const expected =
      m[1] === '全国'
        ? childcare.national
        : childcare.rows.find((r) => r.areaName === m[1]);
    assert.ok(expected);
    const observed = Object.fromEntries(
      ['capacity', 'applicants', 'users', 'waiting'].map((key, i) => [
        key,
        Number(m[i + 2].replaceAll(',', '')),
      ])
    );
    for (const key of ['capacity', 'applicants', 'users', 'waiting'])
      assert.equal(observed[key], expected[key], m[1] + ' PDF ' + key);
    // Published rounded occupancy is a cross-check, not another output metric.
    assert.equal(
      Math.round((observed.users / observed.capacity) * 1000) / 10,
      Number(m[6]),
      m[1] + ' PDF occupancy'
    );
    comparisons.push({ areaName: m[1], ...observed });
  }
  const page7 = childcarePage7.normalize('NFKC');
  assert.ok(page7.includes('R7.4.1'), 'PDF applicant age date');
  const expectedAge = [141980, 473953, 527718, 1621584];
  for (let i = 0; i < 4; i++) {
    assert.equal(
      sum(childcare.detail.map((r) => r.applicantAgeGroups[i])),
      expectedAge[i],
      'national applicant age pin'
    );
    const label = ['0歳', '1歳', '2歳', '3歳以上'][i];
    const line = page7
      .split('\n')
      .find((line) => line.trim().startsWith(label + ' '));
    assert.ok(line, 'PDF age row');
    const values = line.trim().split(/\s+/);
    assert.equal(
      Number(values.at(-1).replaceAll(',', '')),
      expectedAge[i],
      'PDF latest year age'
    );
  }
  return {
    countyAndNationalValueChecks: 192,
    roundedOccupancyChecks: 48,
    applicantAgeChecks: 4,
    parkRoundedNationalChecks: 2,
    comparisons,
  };
}

export function validateConfig(config, field) {
  assert.ok(config, 'missing metric config ' + field.key);
  assert.equal(config.key, field.key);
  assert.equal(config.unit, field.unit);
  assert.deepEqual(config.years, { from: field.year, to: field.year });
  assert.equal(config.yearFormat, 'calendar');
  assert.deepEqual(config.entities, ['prefecture']);
  assert.equal(config.isActive, true);
  assert.equal(config.display?.conversionFactor, 1);
  assert.equal(config.display?.decimalPlaces, 0);
  assert.equal(config.calculation?.isCalculated ?? false, false);
  assert.deepEqual(
    config.calculation?.normalizationOptions ?? [],
    [],
    'no cross-population normalization'
  );
  assert.deepEqual(
    config.source,
    EXPECTED_SOURCES[field.key],
    'immutable source/cohort/provenance contract'
  );
}

export function validateSourceBytes(source, body) {
  assert.equal(body.length, source.bytes, source.filename + ' source bytes');
  assert.equal(sha(body), source.sha256, source.filename + ' source SHA');
}

async function sourceBody(source, directory) {
  const file = resolve(directory, source.filename);
  let body;
  let fetchedAt = null;
  try {
    body = await readFile(file);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(45000),
    });
    assert.ok(response.ok, source.filename + ' HTTP ' + response.status);
    body = Buffer.from(await response.arrayBuffer());
    validateSourceBytes(source, body);
    fetchedAt = new Date().toISOString();
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    await writeFile(
      file + '.source.json',
      JSON.stringify({ ...source, fetchedAt }, null, 2) + '\n'
    );
  }
  validateSourceBytes(source, body);
  if (!fetchedAt) {
    try {
      const receipt = JSON.parse(await readFile(file + '.source.json', 'utf8'));
      if (receipt.sha256 === source.sha256 && receipt.url === source.url)
        fetchedAt = receipt.fetchedAt ?? null;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  return {
    body,
    observed: {
      ...source,
      localPath: file,
      fetchedAt,
      verifiedAt: new Date().toISOString(),
    },
  };
}
const pdfText = (body, page) =>
  execFileSync(
    'pdftotext',
    [
      ...(page ? ['-f', String(page), '-l', String(page)] : []),
      '-layout',
      '-',
      '-',
    ],
    { input: body, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  );

async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/parks-childcare-source'
        ),
      },
      'config-file': { type: 'string' },
      'local-r2-root': { type: 'string', default: resolve(root, '.local/r2') },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/parks-childcare-source.json'
        ),
      },
    },
  });
  const configs = o['config-file']
    ? JSON.parse(await readFile(o['config-file'], 'utf8'))
    : Object.values(
        requireRepo('./packages/data-configs/src/registry.ts').METRICS_REGISTRY
      );
  for (const f of FIELDS) {
    const matches = configs.filter((c) => c.key === f.key);
    assert.equal(matches.length, 1, 'unique config ' + f.key);
    validateConfig(matches[0], f);
  }
  const bodies = {},
    observed = [];
  for (const s of SOURCES) {
    const result = await sourceBody(s, o['source-dir']);
    bodies[s.filename] = result.body;
    observed.push(result.observed);
  }
  const workbooks = {};
  for (const s of SOURCES.filter((s) => s.filename.endsWith('.xlsx'))) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bodies[s.filename]);
    workbooks[s.filename] = workbook;
  }
  const parks = parseParks(workbooks['parks-2024.xlsx']);
  const childcare = parseChildcare(
    workbooks['childcare-applications-2025.xlsx'],
    workbooks['childcare-summary-2025.xlsx']
  );
  const pdfChecks = verifyPdfTables(
    pdfText(bodies['parks-overview.pdf']),
    pdfText(bodies['childcare-report-2025.pdf'], 15),
    pdfText(bodies['childcare-report-2025.pdf'], 7),
    parks,
    childcare
  );
  const { buildRecipe } = requireRepo('./packages/data-configs/src/recipe.ts');
  const { parseStatsValuesPayload } = requireRepo(
    './packages/stats-r2/src/schemas.ts'
  );
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const config = configs.find((c) => c.key === f.key),
      rows = f.filename.startsWith('parks') ? parks.proof : childcare.rows;
    const payload = parseStatsValuesPayload({
      metricKey: f.key,
      entityKind: 'prefecture',
      rows: rows.map((row) => ({
        areaCode: row.areaCode,
        areaName: row.areaName,
        yearCode: String(f.year),
        yearName: f.yearName,
        unit: f.unit,
        value: row[f.valueField],
      })),
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: [String(f.year), String(f.year)],
        recipe: buildRecipe(config),
      },
    });
    assert.equal(payload.rows.length, 47);
    assert.equal(new Set(payload.rows.map((r) => r.areaCode)).size, 47);
    files.push({
      key: `app/stats/${f.key}/values.json`,
      content: JSON.stringify(payload),
      metricKey: f.key,
      rowCount: 47,
    });
  }
  // Validate every input and both payloads before creating any canonical file.
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(o['local-r2-root'], f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    generatedAt,
    candidates: [31, 49],
    sources: observed,
    parks,
    childcare,
    pdfChecks,
    files: files.map(({ content, ...f }) => ({
      ...f,
      sha256: sha(content),
      bytes: Buffer.byteLength(content),
    })),
    limits: [
      '自然公園は国立・国定だけの延べ利用。県立公園を含む面積との比率や重複排除した実人数は生成しない。',
      '保育申込は利用中児童等を含む2025年4月1日の総数。利用者・定員・待機数は同年原典との検算だけに保持し、別年指標との差を計算しない。',
      '県別原表からの集計で、国境・県境越え来訪者や自治体間申込みを独立個人として名寄せした数ではない。',
    ],
    remaining: [
      'Parent catalog/registry adoption, browser and publication gates. No remote writes.',
    ],
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(resolve(o.out), JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      metrics: 2,
      prefecturesPerMetric: 47,
      parkCountyCells: 177,
      childcareMunicipalities: 1741,
      out: o.out,
    })
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => null)) ===
    fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
