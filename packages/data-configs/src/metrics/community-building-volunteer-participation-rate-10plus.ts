import type { MetricConfig } from '../types';

export const communityBuildingVolunteerParticipationRate10plus: MetricConfig = {
  key: 'community-building-volunteer-participation-rate-10plus',
  title: 'まちづくり活動の年間行動者率',
  subtitle: '10歳以上・ボランティア活動',
  description:
    '過去1年間にまちづくりのためのボランティア活動を行った10歳以上の人の割合。',
  note: '2021年社会生活基本調査の調査票A。居住地別、10歳以上、男女計、人口集中地区・以外を合わせた全域、活動形態の総数。2020年10月20日〜2021年10月19日の1年間に「まちづくりのための活動」を行った人の、同じ属性の推定人口に対する割合。道路・公園の清掃、地域団体のリーダーとしての活動、村おこし・地域おこしなど、報酬を目的とせず主に他人や社会のために行う活動を含む。催しへの単なる参加や政治活動は含めない。他種類の活動との重複があり、各種類の割合を足して全体とはしない。標本調査であり、自治会加入率や孤独感の指標ではない。',
  unit: '％',
  category: 'educationsports',
  source: {
    kind: 'estat',
    statsDataId: '0003455937',
    cdTab: '202110A09B08',
    cdCat01: '0',
    cdCat02: '99000',
    cdCat03: '0',
    cdCat04: '06',
    displayName: '社会生活基本調査',
    url: 'https://www.e-stat.go.jp/dbview?sid=0003455937',
  },
  entities: ['prefecture'],
  years: {
    from: 2021,
    to: 2021,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  isActive: true,
};
