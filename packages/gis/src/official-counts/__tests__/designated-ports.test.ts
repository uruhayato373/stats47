import { describe, expect, it } from 'vitest';

import {
  PREF_CODES,
  PREF_NAME_BY_CODE,
} from '../../mlit-ksj/prefecture-assign';
import {
  DESIGNATED_PORT_ZERO_CODES,
  parseDesignatedPortRows,
  PORT_DATA_DATE,
  PORT_LAW_REVISION,
  readDesignatedPortRows,
  verifySakaiAttribution,
} from '../designated-ports';

function rows() {
  const data = PREF_CODES.filter(
    (code) => !DESIGNATED_PORT_ZERO_CODES.includes(code)
  ).map((code) => [
    PREF_NAME_BY_CODE[code],
    code === '25' ? '' : '甲港',
    '乙港',
  ]);
  data[0][1] = Array.from({ length: 124 }, (_, i) => `甲${i}港`).join('　');
  data[0][2] = Array.from({ length: 462 }, (_, i) => `乙${i}港`).join('　');
  return [
    ['都道府県', '甲種港湾', '乙種港湾'],
    ...data,
    ['鳥取・島根', '境港', ''],
    ['合計', '百六十三港', '五百一港'],
  ];
}
function law() {
  return {
    revision_info: {
      law_revision_id: PORT_LAW_REVISION,
      amendment_enforcement_date: PORT_DATA_DATE,
    },
    law_full_text: {
      tag: 'AppdxTable',
      children: [
        { tag: 'AppdxTableTitle', children: ['別表'] },
        {
          tag: 'Table',
          children: rows().map((row) => ({
            tag: 'TableRow',
            children: row.map((value) => ({
              tag: 'TableColumn',
              children: [value],
            })),
          })),
        },
      ],
    },
  };
}
const attribution =
  '<table><tr><td><strong>鳥取県</strong></td></tr><tr><td><a>境港</a></td></tr></table>';

describe('single-year designated port contract (synthetic, not stored observations)', () => {
  it('conserves 163+501=664 over 47 prefectures; jointly named port counts once', () => {
    const result = parseDesignatedPortRows(readDesignatedPortRows(law()));
    expect(result.counts.size).toBe(47);
    expect([result.ko, result.otsu]).toEqual([163, 501]);
    expect(result.counts.get('31')).toBe(3);
    expect(result.counts.get('32')).toBe(2);
    expect(result.ports.filter((p) => p.name === '境港')).toEqual([
      {
        name: '境港',
        prefectureCode: '31',
        sourcePrefecture: '鳥取・島根',
        kind: '甲種',
      },
    ]);
    expect(
      [...result.counts].filter(([, n]) => n === 0).map(([code]) => code)
    ).toEqual(DESIGNATED_PORT_ZERO_CODES);
    expect(result.counts.get('25')).toBe(1);
  });
  it('allows same port names in different prefectures, not within either class of one prefecture', () => {
    expect(
      parseDesignatedPortRows(rows()).ports.filter((p) => p.name === '乙港')
        .length
    ).toBe(39);
    const data = rows();
    data[2][2] = data[2][1];
    expect(() => parseDesignatedPortRows(data)).toThrow(/identity/);
  });
  it.each(['missing', 'duplicate', 'blank'] as const)(
    'rejects %s prefecture data instead of treating missing as zero',
    (mode) => {
      const data = rows();
      if (mode === 'missing') data.splice(2, 1);
      if (mode === 'duplicate') data.splice(2, 0, data[2]);
      if (mode === 'blank') data[2][2] = '';
      expect(() => parseDesignatedPortRows(data)).toThrow();
    }
  );
  it('rejects total drift, unexpected prefecture, and joint-port ambiguity', () => {
    for (const mutate of [
      (data: string[][]) => {
        data[1][1] += '　追加港';
      },
      (data: string[][]) => {
        data[2][0] = '栃木県';
      },
      (data: string[][]) => {
        data[data.length - 2][1] = '境港　別港';
      },
    ]) {
      const data = rows();
      mutate(data);
      expect(() => parseDesignatedPortRows(data)).toThrow();
    }
  });
  it('rejects revision/date and duplicated appendix drift', () => {
    const wrongDate = law();
    wrongDate.revision_info.amendment_enforcement_date = '2026-01-01';
    expect(() => readDesignatedPortRows(wrongDate)).toThrow(/date/);
    const wrongId = law();
    wrongId.revision_info.law_revision_id = 'latest';
    expect(() => readDesignatedPortRows(wrongId)).toThrow(/revision/);
    const duplicate = {
      ...law(),
      law_full_text: {
        tag: 'Law',
        children: [law().law_full_text, law().law_full_text],
      },
    };
    expect(() => readDesignatedPortRows(duplicate)).toThrow(/appendix/);
  });
  it('requires exact unique Sakai link under the official Tottori heading', () => {
    expect(() => verifySakaiAttribution(attribution)).not.toThrow();
    for (const html of [
      attribution.replace('鳥取県', '島根県'),
      attribution.replace('境港', '境港市'),
      attribution + attribution,
    ]) {
      expect(() => verifySakaiAttribution(html)).toThrow();
    }
  });
});
