import { describe, expect, it } from 'vitest';

import { fetchCities } from '../../repositories/fetch-cities';
import {
  buildMunicipalityEntityPolicy,
  listPublishableMunicipalities,
} from '../entity-policy';

import type { City } from '../../types/city';

describe('municipality entity policy', () => {
  it('実在マスタから自治体1,718件を公開可能とし、行政区と特別区集約を除外する', () => {
    const policy = buildMunicipalityEntityPolicy();
    const publishable = listPublishableMunicipalities(policy);
    const administrativeWards = policy.entities.filter(
      (entity) => entity.kind === 'administrative-ward'
    );
    const specialWardsAggregate = policy.entities.filter(
      (entity) => entity.kind === 'special-wards-aggregate'
    );

    expect(policy.entities).toHaveLength(1913);
    expect(publishable).toHaveLength(1718);
    expect(administrativeWards).toHaveLength(194);
    expect(specialWardsAggregate.map((entity) => entity.code)).toEqual([
      '13100',
    ]);
    expect(
      policy.entities.filter((entity) => entity.disposition === 'unknown')
    ).toEqual([]);
  });

  it('政令指定都市本体は含め、その行政区は親市付きで除外する', () => {
    const policy = buildMunicipalityEntityPolicy();
    const sapporo = policy.entities.find((entity) => entity.code === '01100');
    const chuoWard = policy.entities.find((entity) => entity.code === '01101');

    expect(sapporo).toMatchObject({ disposition: 'publishable', kind: 'city' });
    expect(chuoWard).toMatchObject({
      disposition: 'excluded',
      kind: 'administrative-ward',
      prefectureCode: '01000',
      parentMunicipalityCode: '01100',
    });
  });

  it('将来追加される東京23特別区の個別行をspecial-wardとして扱える', () => {
    const fixture: City[] = [
      {
        cityCode: '13101',
        cityName: '東京都 千代田区',
        prefCode: '13000',
        level: '2',
      },
    ];

    expect(buildMunicipalityEntityPolicy(fixture).entities[0]).toMatchObject({
      disposition: 'publishable',
      kind: 'special-ward',
    });
  });

  it('分類できないlevel=2は推測で公開せずunknownにする', () => {
    const fixture: City[] = [
      {
        cityCode: '13999',
        cityName: '東京都 未分類地域',
        prefCode: '13000',
        level: '2',
      },
    ];

    expect(buildMunicipalityEntityPolicy(fixture).entities[0]).toMatchObject({
      disposition: 'unknown',
      kind: 'unknown',
    });
  });

  it('重複コード、親不明、親県不一致を拒否する', () => {
    const city = fetchCities()[0];
    expect(() => buildMunicipalityEntityPolicy([city, city])).toThrow(
      /duplicate municipality code/
    );
    expect(() =>
      buildMunicipalityEntityPolicy([
        {
          cityCode: '01101',
          cityName: '北海道 札幌市 中央区',
          prefCode: '01100',
          level: '3',
        },
      ])
    ).toThrow(/administrative ward parent is missing/);
    expect(() =>
      buildMunicipalityEntityPolicy([
        {
          cityCode: '01100',
          cityName: '北海道 札幌市',
          prefCode: '01000',
          level: '2',
        },
        {
          cityCode: '02101',
          cityName: '北海道 札幌市 中央区',
          prefCode: '01100',
          level: '3',
        },
      ])
    ).toThrow(/parent prefecture mismatch/);
  });
});
