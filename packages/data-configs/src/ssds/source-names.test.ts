import { describe, expect, it } from 'vitest';

import surveys from '../../../../data/surveys/master/surveys.json';
import { DISPLAYNAME_TO_SURVEY, STATS_DATA_ID_TO_SURVEY_OVERRIDE } from './displayname-to-survey';
import {
  CDCAT01_SOURCE_OVERRIDE,
  KNOWN_SOURCE_TO_SURVEY,
  PROPOSED_SOURCE_TO_SURVEY,
  resolveSurveyId,
} from './source-name-to-survey';

const master = new Map((surveys as Array<{ id: string; organization: string }>).map((s) => [s.id, s]));

describe('出典名と調査の対応表 (surveys.source-names)', () => {
  it('known は proposed より先に引き、どちらにも無い出典名は null (auto-slug へ)', () => {
    expect(resolveSurveyId('国勢調査報告')).toBe('census');
    expect(resolveSurveyId('特許行政年次報告書')).toBe('patent-administration-annual-report');
    expect(resolveSurveyId('登録されていない出典')).toBeNull();
  });

  it('known と proposed は同じ出典名を二重に持たない', () => {
    const both = Object.keys(KNOWN_SOURCE_TO_SURVEY).filter((k) => k in PROPOSED_SOURCE_TO_SURVEY);
    expect(both).toEqual([]);
  });

  it('cdCat01 の手当ては、すべて known / proposed で解決できる原典名を指す', () => {
    for (const [code, names] of Object.entries(CDCAT01_SOURCE_OVERRIDE)) {
      for (const name of names) expect(resolveSurveyId(name), `${code}: ${name}`).not.toBeNull();
    }
  });

  it('対応表が指す調査 id は、すべて調査マスタに実在し機関を持つ', () => {
    const ids = new Set([
      ...Object.values(KNOWN_SOURCE_TO_SURVEY),
      ...Object.values(PROPOSED_SOURCE_TO_SURVEY),
      ...Object.values(DISPLAYNAME_TO_SURVEY),
      ...Object.values(STATS_DATA_ID_TO_SURVEY_OVERRIDE).map((v) => v.id),
    ]);
    for (const id of ids) {
      expect(master.has(id), id).toBe(true);
      expect(master.get(id)?.organization, id).toBeTruthy();
    }
  });
});
