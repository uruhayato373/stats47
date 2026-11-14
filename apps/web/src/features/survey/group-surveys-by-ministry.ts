/** 府省庁の分類として独立させる最小の調査数。これ未満の府省庁は「その他の機関」へまとめる */
const MIN_SURVEYS_PER_GROUP = 3;

const OTHER_GROUP_LABEL = 'その他の機関';

/** 作成機関の名前の先頭にある府省庁 (例: 総務省統計局 → 総務省、総務省・経済産業省 → 総務省) */
const MINISTRY_PATTERN = /^(.+?(?:省|庁|府))/;

/** 作成機関の名前から最初の府省庁を取り出す。府省庁の名前を持たない機関は null */
export function ministryOf(organization: string | null | undefined): string | null {
  if (!organization) return null;
  return MINISTRY_PATTERN.exec(organization)?.[1] ?? null;
}

interface SurveyLike {
  id: string;
  name: string;
  organization: string | null;
}

export interface SurveyMinistryGroup<T extends SurveyLike> {
  /** ページ内リンク用の id (分類の順の番号。日本語を URL の断片に入れない) */
  id: string;
  label: string;
  surveys: T[];
}

/**
 * 調査一覧 (/survey) を作成した府省庁で分ける (HUB-LIST-FINDABILITY-01)。
 * 分類は調査の多い順 (「その他の機関」は最後)。分類の中はランキングの多い順、同数は調査名の順。
 */
export function groupSurveysByMinistry<T extends SurveyLike>(
  surveys: readonly T[],
  rankingCountOf: (surveyId: string) => number,
): SurveyMinistryGroup<T>[] {
  const byMinistry = new Map<string, T[]>();
  for (const survey of surveys) {
    const key = ministryOf(survey.organization) ?? OTHER_GROUP_LABEL;
    byMinistry.set(key, [...(byMinistry.get(key) ?? []), survey]);
  }

  const named: Array<[string, T[]]> = [];
  let others: T[] = [];
  for (const [label, members] of byMinistry) {
    if (label === OTHER_GROUP_LABEL || members.length < MIN_SURVEYS_PER_GROUP) {
      others = [...others, ...members];
    } else {
      named.push([label, members]);
    }
  }
  named.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'ja'));

  const bySize = (a: T, b: T) =>
    rankingCountOf(b.id) - rankingCountOf(a.id) || a.name.localeCompare(b.name, 'ja');
  const ordered = others.length > 0 ? [...named, [OTHER_GROUP_LABEL, others] as [string, T[]]] : named;
  return ordered.map(([label, members], index) => ({
    id: `survey-group-${index + 1}`,
    label,
    surveys: [...members].sort(bySize),
  }));
}
