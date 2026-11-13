import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { ANALYSIS_PREVIEWS } from '../../../src/features/products/analysis-previews.generated';
import { resolveAnalysisRevision, type AuthoredAnalysisRevision } from '../../../../../packages/product-factory/src/analysis/catalog';

const root = resolve(__dirname, '../../../../..');
const read = (file: string) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));

it('改訂台帳・検査記録・LPの派生値をCIでも突合し、手編集や生成漏れを止める', () => {
  const plans = readdirSync(resolve(root, 'data/products/landings')).filter(file => file.endsWith('.json'))
    .map(file => ({ ...read(`data/products/landings/${file}`), file })).filter(landing => landing.analysisRevision || landing.analysisReuse);
  expect(ANALYSIS_PREVIEWS.length).toBe(plans.length);
  for (const landing of plans) {
    if (landing.analysisReuse) {
      const evidence = read(`data/products/landing-evidence/${landing.file}`).reuseRevision;
      const preview = ANALYSIS_PREVIEWS.find(product => product.id === landing.productId)!;
      expect(evidence.planSha256).toBe(createHash('sha256').update(JSON.stringify(landing.analysisReuse)).digest('hex'));
      expect(createHash('sha256').update(`${JSON.stringify(preview, null, 2)}\n`).digest('hex')).toBe(evidence.files.find((file: {file: string}) => file.file === 'preview-product.json').sha256);
      for (const dependency of evidence.dependencies) {
        const source = plans.find(item => item.productId === dependency.productId)!;
        expect(source.analysisRevision.version).toBe(dependency.version);
        const upstream = read(`data/products/landing-evidence/${source.file}`).analysisRevision;
        expect(createHash('sha256').update(`${JSON.stringify(upstream, null, 2)}\n`).digest('hex')).toBe(dependency.manifestSha256);
      }
      continue;
    }
    const plan: AuthoredAnalysisRevision = landing.analysisRevision;
    const resolved = resolveAnalysisRevision(plan, read('data/metrics/analysis-source-variants.json').variants);
    const evidence = read(`data/products/landing-evidence/${landing.file}`).analysisRevision;
    expect(evidence.planSha256).toBe(createHash('sha256').update(JSON.stringify(plan)).digest('hex'));
    expect(evidence.resolvedPlanSha256).toBe(createHash('sha256').update(JSON.stringify(resolved)).digest('hex'));
    expect(evidence.version).toBe(plan.version);
    const preview = ANALYSIS_PREVIEWS.find(product => product.id === landing.productId)!;
    expect(createHash('sha256').update(`${JSON.stringify(preview, null, 2)}\n`).digest('hex')).toBe(evidence.files.find((file: {file: string}) => file.file === 'preview-product.json').sha256);
    expect(preview.title).toBe(plan.title);
    expect(preview.description).toBe(plan.description);
    expect(preview.useCases).toEqual(plan.useCases);
    expect(preview.showcase?.filter(section => section.kind === 'chart').length).toBe(plan.recipes.length);
    for (const recipe of plan.recipes) {
      expect(plan.sources.some(source => source.id === recipe.sourceId)).toBe(true);
      expect(recipe.references.length).toBeGreaterThan(0);
      expect(recipe.references.every(id => plan.research.references.some(reference => reference.id === id))).toBe(true);
      expect(preview.showcase?.some(section => section.heading === recipe.heading && section.figures.some(figure => figure.file === `${recipe.id}.png`))).toBe(true);
    }
    for (const source of plan.sources) {
      expect(plan.recipes.some(recipe => recipe.sourceId === source.id)).toBe(true);
      const input = evidence.sources.find((item: { id: string }) => item.id === source.id);
      expect(input.years).toEqual(source.years);
      expect(input.rows).toBe(input.areas * source.inputs.length * source.years.length);
      expect(input.inputs).toEqual(resolved.sources.find(item => item.id === source.id)!.inputs.map(
        ({ metricKey, variantId, statsDataId, code, unit, rawUnit, filters }) => ({ metricKey, ...(variantId ? { variantId } : {}), statsDataId, code, unit, ...(rawUnit ? { rawUnit } : {}), ...(filters ? { filters } : {}) }),
      ));
      expect(input.coverage).toHaveLength(source.years.length);
      for (const year of input.coverage) expect(year.kept + year.dropped).toBe(input.areas);
    }
    for (const section of preview.showcase ?? []) for (const figure of section.figures) {
      expect(evidence.files.some((file: {file: string}) => file.file === `images/${figure.file}`)).toBe(true);
    }
  }
});

it('改訂候補は開発環境専用で、購入導線を既存の販売ページへ混入しない', () => {
  const route = readFileSync(resolve(root, 'apps/web/src/app/products/preview/[slug]/page.tsx'), 'utf8');
  expect(route).toContain('process.env.NODE_ENV !== "development"');
  expect(route).toContain('robots: { index: false, follow: false }');
  expect(route).toContain('await resolveProductDetail(published.slug)');
  const normal = readFileSync(resolve(root, 'apps/web/src/app/products/[slug]/page.tsx'), 'utf8');
  expect(normal).toContain('await resolveProductDetail(slug)');
  expect(normal).toContain('<ProductDetail {...detail} />');
  expect(route).toContain('<ProductDetail {...detail} />');
  for (const file of ['apps/web/src/features/products/storefront.generated.ts', 'apps/web/src/app/sitemap.ts']) {
    expect(readFileSync(resolve(root, file), 'utf8')).not.toContain('ANALYSIS_PREVIEWS');
  }
});
