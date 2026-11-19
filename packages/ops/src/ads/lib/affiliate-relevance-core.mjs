export function auditBlogAffiliatePolicyCatalog(policies, knownSlugs, allowedVerticals) {
  const errors = [];
  const known = new Set(knownSlugs);
  const allowed = new Set(allowedVerticals);
  for (const [slug, policy] of Object.entries(policies)) {
    if (!known.has(slug)) errors.push(`${slug}: sitemap に存在しない記事`);
    if (!policy || typeof policy !== 'object') {
      errors.push(`${slug}: policy が object でない`);
      continue;
    }
    if (policy.vertical !== null && !allowed.has(policy.vertical)) {
      errors.push(`${slug}: vertical ${String(policy.vertical)} は許可10軸外`);
    }
    if (typeof policy.reason !== 'string' || policy.reason.trim().length < 20) {
      errors.push(`${slug}: reason は20文字以上で意味判断の根拠を残す`);
    }
  }
  return errors;
}

function tagKeysOf(article) {
  return (article.tags ?? [])
    .map((tag) => typeof tag === 'string' ? tag : tag?.tagKey)
    .filter((tag) => typeof tag === 'string' && tag.length > 0);
}

export function auditBlogAffiliateRelevance({ articles, policies, surveyMap, tagMap }) {
  const findings = [];
  const rows = [];
  for (const article of articles.filter((row) => row?.published !== false)) {
    const tags = tagKeysOf(article);
    const tagVerticals = [...new Set(tags.map((tag) => tagMap[tag]).filter(Boolean))];
    let surveyMatched = false;
    let surveyVertical;
    for (const surveyId of article.surveyIds ?? []) {
      if (!Object.prototype.hasOwnProperty.call(surveyMap, surveyId)) continue;
      surveyMatched = true;
      surveyVertical = surveyMap[surveyId];
      break;
    }
    const policy = policies[article.slug];
    const automaticVertical = surveyMatched ? surveyVertical : (tagVerticals[0] ?? null);
    const effectiveVertical = policy ? policy.vertical : automaticVertical;
    const source = policy ? 'explicit' : surveyMatched ? 'survey' : tagVerticals.length ? 'tags' : 'none';
    if (!policy && surveyMatched) {
      if (surveyVertical === null && tagVerticals.length > 0) {
        findings.push({
          severity: 'review',
          slug: article.slug,
          reason: 'survey-blocks-tag',
          surveyVertical,
          tagVerticals,
          tags,
        });
      } else if (
        surveyVertical &&
        tagVerticals.length > 0 &&
        !tagVerticals.includes(surveyVertical)
      ) {
        findings.push({
          severity: 'review',
          slug: article.slug,
          reason: 'survey-tag-conflict',
          surveyVertical,
          tagVerticals,
          tags,
        });
      } else if (surveyVertical && tagVerticals.length === 0) {
        findings.push({
          severity: 'review',
          slug: article.slug,
          reason: 'survey-without-intent-tag',
          surveyVertical,
          tagVerticals,
          tags,
        });
      }
    } else if (!policy && !surveyMatched && tagVerticals.length > 1) {
      findings.push({
        severity: 'review',
        slug: article.slug,
        reason: 'multiple-tag-verticals',
        tagVerticals,
        tags,
      });
    }
    rows.push({
      slug: article.slug,
      source,
      effectiveVertical: effectiveVertical ?? null,
      automaticVertical: automaticVertical ?? null,
      tagVerticals,
      policyReason: policy?.reason ?? null,
    });
  }
  return { rows, findings };
}
