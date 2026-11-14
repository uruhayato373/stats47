import assert from "node:assert/strict";
import { test } from "node:test";

import { findReleaseDue, latestReleasedDataYear } from "../release-calendar.mjs";

const kakei = { surveyId: "kakei-chousa", lagYears: 1, month: 2 };
const census = { surveyId: "census", lagYears: 1, month: 9, everyYears: 5, anchorYear: 2020 };
const estimates = { surveyId: "population-estimates", lagYears: 1, month: 4, skipEveryYears: 5, skipAnchorYear: 2020 };
const schoolBasic = { surveyId: "school-basic-survey", lagYears: 0, month: 12 };

test("公表月の翌月 1 日から、その年のデータを公表済みとみなす (公表日が月内のどこか分からないので早めに数えない)", () => {
  assert.equal(latestReleasedDataYear(kakei, "2026-02-27"), 2024);
  assert.equal(latestReleasedDataYear(kakei, "2026-03-01"), 2025);
  // 同じ年の 12 月に公表する調査 (学校基本調査の確定値) は、その年の 12 月中はまだ前年まで
  assert.equal(latestReleasedDataYear(schoolBasic, "2026-12-20"), 2025);
  assert.equal(latestReleasedDataYear(schoolBasic, "2027-01-01"), 2026);
});

test("5 年ごとの調査は周期の年だけ、周期の年を飛ばす推計はその年を除いて数える", () => {
  assert.equal(latestReleasedDataYear(census, "2026-09-30"), 2020);
  assert.equal(latestReleasedDataYear(census, "2026-11-14"), 2025);
  // 国勢調査の年 (2025) の 10 月 1 日現在の推計は出ないので、2026 年 11 月時点の最新は 2024 年
  assert.equal(latestReleasedDataYear(estimates, "2026-11-14"), 2024);
  assert.equal(latestReleasedDataYear(estimates, "2027-05-01"), 2026);
});

test("公表済みの年より古い年の図を持つ公開記事を、指標の取り込みが先か記事の更新だけかに分けて出す", () => {
  const out = findReleaseDue(
    [
      {
        slug: "engel",
        title: "エンゲル係数",
        published: true,
        rankingRefs: [
          { rankingKey: "engel", year: "2024" },
          { rankingKey: "pop", year: "2020" },
        ],
      },
      { slug: "fresh", title: "最新", published: true, rankingRefs: [{ rankingKey: "engel", year: "2025" }] },
    ],
    {
      asOf: "2026-11-14",
      calendar: [kakei, census, estimates],
      latestYearByKey: new Map([
        ["engel", "2024"],
        ["pop", "2025"],
      ]),
      surveyIdsByKey: new Map([
        ["engel", ["kakei-chousa"]],
        // 国勢調査と人口推計を継いだ系列は、どちらかが出した新しい方の年まで公表済み
        ["pop", ["population-estimates", "census"]],
      ]),
    },
  );
  assert.deepEqual(out, [
    {
      slug: "engel",
      title: "エンゲル係数",
      due: [
        { rankingKey: "pop", surveyIds: ["population-estimates", "census"], articleYear: "2020", siteLatestYear: "2025", releasedYear: "2025", action: "refresh-article" },
        { rankingKey: "engel", surveyIds: ["kakei-chousa"], articleYear: "2024", siteLatestYear: "2024", releasedYear: "2025", action: "ingest-metric" },
      ],
    },
  ]);
});

test("下書き・年の無い参照・公表暦に無い調査を含む指標・調査の分からない指標は判定しない (古いと決めつけない)", () => {
  const out = findReleaseDue(
    [
      { slug: "draft", published: false, rankingRefs: [{ rankingKey: "engel", year: "2001" }] },
      { slug: "link-only", published: true, rankingRefs: [{ rankingKey: "engel" }] },
      { slug: "uncovered", published: true, rankingRefs: [{ rankingKey: "mixed", year: "2001" }] },
      { slug: "no-survey", published: true, rankingRefs: [{ rankingKey: "no-survey", year: "2001" }] },
      { slug: "fiscal-code", published: true, rankingRefs: [{ rankingKey: "engel", year: "2001100000" }] },
    ],
    {
      asOf: "2026-11-14",
      calendar: [kakei],
      latestYearByKey: new Map([["engel", "2025"]]),
      surveyIdsByKey: new Map([
        ["engel", ["kakei-chousa"]],
        ["mixed", ["kakei-chousa", "not-in-calendar"]],
        ["no-survey", []],
      ]),
    },
  );
  assert.deepEqual(out, []);
});
