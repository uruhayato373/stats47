const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KEY_FILE = '/Users/minamidaisuke/stats47/stats47-f6b5dae19196.json';
const SITE_URL = 'https://stats47.jp/';

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const searchconsole = google.searchconsole({ version: 'v1', auth });

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchQueries(startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 500,
    },
  });
  return res.data.rows || [];
}

async function fetchPagesForQuery(startDate, endDate, query) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      dimensionFilterGroups: [{
        filters: [{ dimension: 'query', operator: 'equals', expression: query }]
      }],
      rowLimit: 5,
    },
  });
  return res.data.rows || [];
}

(async () => {
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const currentStart = new Date(end);
  currentStart.setDate(currentStart.getDate() - 7);
  const prevEnd = new Date(currentStart);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 7);

  const endStr = toDateStr(end);
  const currentStartStr = toDateStr(currentStart);
  const prevEndStr = toDateStr(prevEnd);
  const prevStartStr = toDateStr(prevStart);

  console.log(JSON.stringify({
    periods: {
      current: { start: currentStartStr, end: endStr },
      prev: { start: prevStartStr, end: prevEndStr }
    }
  }));

  const [current, prev] = await Promise.all([
    fetchQueries(currentStartStr, endStr),
    fetchQueries(prevStartStr, prevEndStr),
  ]);

  const prevMap = new Map();
  for (const row of prev) {
    prevMap.set(row.keys[0], row);
  }

  const growth = current.map(row => {
    const key = row.keys[0];
    const prevRow = prevMap.get(key);
    return {
      query: key,
      currentClicks: row.clicks,
      prevClicks: prevRow?.clicks || 0,
      currentImpressions: row.impressions,
      prevImpressions: prevRow?.impressions || 0,
      clickGrowth: prevRow ? (row.clicks - prevRow.clicks) / (prevRow.clicks || 1) : null,
      impressionGrowth: prevRow ? (row.impressions - prevRow.impressions) / (prevRow.impressions || 1) : null,
      isNew: !prevRow,
    };
  });

  const isBrandOrNoise = (q) => {
    if (/stats47/i.test(q)) return true;
    const prefectures = ['東京','大阪','愛知','神奈川','北海道','京都','兵庫','福岡','埼玉','千葉','茨城','栃木','群馬','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','三重','滋賀','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄','青森','岩手','宮城','秋田','山形','福島'];
    if (prefectures.includes(q.trim())) return true;
    return false;
  };

  const newQueries = growth.filter(g => g.isNew && g.currentClicks >= 3 && !isBrandOrNoise(g.query));
  const surgeQueries = growth.filter(g => !g.isNew && g.clickGrowth !== null && g.clickGrowth >= 1 && g.currentClicks >= 5 && !isBrandOrNoise(g.query));
  const imprQueries = growth.filter(g => !g.isNew && g.impressionGrowth !== null && g.impressionGrowth >= 2 && g.currentImpressions >= 50 && g.currentClicks < 5 && !isBrandOrNoise(g.query));

  newQueries.sort((a,b) => b.currentClicks - a.currentClicks);
  surgeQueries.sort((a,b) => b.clickGrowth - a.clickGrowth);
  imprQueries.sort((a,b) => b.impressionGrowth - a.impressionGrowth);

  console.log('=== 新規クエリ ===');
  console.log(JSON.stringify(newQueries.slice(0, 20), null, 2));
  console.log('=== 急上昇クエリ ===');
  console.log(JSON.stringify(surgeQueries.slice(0, 20), null, 2));
  console.log('=== 表示急増クエリ ===');
  console.log(JSON.stringify(imprQueries.slice(0, 20), null, 2));

  // Fetch pages for top candidates
  const topQueries = [...newQueries.slice(0,10), ...surgeQueries.slice(0,10), ...imprQueries.slice(0,10)];
  const pageInfo = {};
  for (const g of topQueries) {
    try {
      const rows = await fetchPagesForQuery(currentStartStr, endStr, g.query);
      pageInfo[g.query] = rows.map(r => ({ page: r.keys[1], clicks: r.clicks, impressions: r.impressions }));
    } catch (e) {
      pageInfo[g.query] = [];
    }
  }
  console.log('=== 流入先ページ ===');
  console.log(JSON.stringify(pageInfo, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
