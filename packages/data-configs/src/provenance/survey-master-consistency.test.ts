import { describe, expect, it } from 'vitest';

import surveysMaster from '../../../ranking/src/data/surveys.json';
import { METRICS_REGISTRY } from '../registry';
import estatProvenanceJson from '../ssds/estat-provenance.generated.json';
import ssdsProvenanceJson from '../ssds/ssds-provenance.generated.json';
import {
  isSyntheticSurveyId,
  resolveMetricProvenance,
  resolveProvenanceByParams,
} from './resolve-metric-provenance';

/**
 * 調査名の正本は surveys.json。生成 JSON の調査 id は実在し、配信される調査名はマスタの name と一致する。
 * 合成 id (`ssds-src:` / `src:`) は /survey/<id> に着地しないので件数を縮小専用ラチェットで管理する。
 */

/**
 * 合成 id のラチェット (2026-10-26 実測)。**増えたら fail、減ったら定数を下げる** (縮小専用)。
 * 減らし方: 原典を surveys.json に足し、displayname-to-survey / source-name-to-survey の辞書へ写像する。
 */
const MAX_SYNTHETIC_SURVEY_IDS = 55;
const MAX_METRICS_WITH_SYNTHETIC_SURVEY = 157;

const MASTER_NAME = new Map(
  (surveysMaster as Array<{ id: string; name: string }>).map((s) => [s.id, s.name])
);

const ESTAT = estatProvenanceJson as {
  statsDataIdToSurvey: Record<string, { id: string; name: string }>;
};
const SSDS = ssdsProvenanceJson as Record<string, { originalSurveys: { id: string; name: string }[] }>;

function resolveAll() {
  return Object.values(METRICS_REGISTRY).map((metric) => ({
    key: metric.key,
    surveys: resolveMetricProvenance(metric, METRICS_REGISTRY),
  }));
}

describe('生成 provenance ⇄ surveys.json', () => {
  it('estat-provenance の調査 id はすべてマスタに実在し、解決後の名前はマスタの name', () => {
    for (const [statsDataId, survey] of Object.entries(ESTAT.statsDataIdToSurvey)) {
      expect(MASTER_NAME.has(survey.id), `${statsDataId} → ${survey.id}`).toBe(true);
      expect(resolveProvenanceByParams(statsDataId, undefined)).toEqual([
        { id: survey.id, name: MASTER_NAME.get(survey.id) },
      ]);
    }
  });

  it('ssds-provenance の非合成 id はすべてマスタに実在する', () => {
    const missing = Object.values(SSDS)
      .flatMap((entry) => entry.originalSurveys)
      .filter((s) => !isSyntheticSurveyId(s.id) && !MASTER_NAME.has(s.id))
      .map((s) => s.id);
    expect([...new Set(missing)]).toEqual([]);
  });

  it('全 metric の解決結果: 非合成 id の名前はマスタの name と一致する', () => {
    const mismatched = resolveAll().flatMap(({ key, surveys }) =>
      surveys
        .filter((s) => !isSyntheticSurveyId(s.id) && MASTER_NAME.has(s.id))
        .filter((s) => s.name !== MASTER_NAME.get(s.id))
        .map((s) => `${key}: ${s.id} "${s.name}" ≠ "${MASTER_NAME.get(s.id)}"`)
    );
    expect(mismatched).toEqual([]);
  }, 60000);
});

describe('合成 survey id の縮小専用ラチェット', () => {
  it(`合成 id は ${MAX_SYNTHETIC_SURVEY_IDS} 種・${MAX_METRICS_WITH_SYNTHETIC_SURVEY} metric を超えない (減ったら定数を下げる)`, () => {
    const all = resolveAll();
    const ids = new Set(
      all.flatMap(({ surveys }) => surveys.map((s) => s.id).filter(isSyntheticSurveyId))
    );
    const metrics = all.filter(({ surveys }) => surveys.some((s) => isSyntheticSurveyId(s.id)));
    expect(ids.size, '合成 id が増えた。原典を surveys.json と辞書へ登録する').toBeLessThanOrEqual(
      MAX_SYNTHETIC_SURVEY_IDS
    );
    expect(metrics.length).toBeLessThanOrEqual(MAX_METRICS_WITH_SYNTHETIC_SURVEY);
    // 縮小したらラチェットを締める (緩いまま放置すると次の増加を見逃す)
    expect(ids.size, '合成 id が減った。MAX_SYNTHETIC_SURVEY_IDS を下げる').toBe(MAX_SYNTHETIC_SURVEY_IDS);
    expect(metrics.length, 'MAX_METRICS_WITH_SYNTHETIC_SURVEY を下げる').toBe(
      MAX_METRICS_WITH_SYNTHETIC_SURVEY
    );
  }, 60000);
});
