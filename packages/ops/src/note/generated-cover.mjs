import sharp from 'sharp';
import { coverSha } from './cover-assets.mjs';
import { assertCoverReference } from './cover-geography.mjs';

export const expectedCoverText = plan => [plan.policySnapshot.label, ...plan.composition.headline.split('\n'),
  ...plan.composition.subline.split('\n'), plan.composition.publisher].filter(Boolean);
export const expectedCoverChecks = plan => plan.policySnapshot.visualRules?.checks ?? [];

/** Visual checks are recorded as visual evidence, never as Satori layout measurements. */
export function assertGeneratedCoverReview(plan, review, source) {
  if (plan?.renderer !== 'note-imagegen-cover-v1' || !plan.imagePrompt ||
      review?.planSha256 !== plan.planSha256 || review.sourceSha256 !== coverSha(source) ||
      review.tool !== 'imagegen' || !review.prompt?.trim() || !Number.isFinite(Date.parse(review.checkedAt)) ||
      review.original !== true || review.thumbnailWidth !== 320 || review.textBounds !== 'pass' ||
      review.textOverlap !== 'pass' || !review.reason?.trim() ||
      JSON.stringify(review.transcription) !== JSON.stringify(expectedCoverText(plan)))
    throw Error('complete cover requires exact-source visual review and matching copy');
  const checks = expectedCoverChecks(plan);
  if (checks.length && (!review.checks || Object.keys(review.checks).length !== checks.length || checks.some(key => review.checks[key] !== 'pass')))
    throw Error('category visual checks must all pass, including characters and supplement readability');
  if (plan.mapReference && !/^[a-f0-9]{64}$/.test(review.referenceSha256 ?? ''))
    throw Error('geographic reference visual review SHA required');
}

export async function prepareGeneratedCover(plan, source, review, referenceBytes) {
  assertGeneratedCoverReview(plan, review, source);
  await assertCoverReference(plan, referenceBytes);
  if (plan.mapReference && coverSha(referenceBytes) !== review.referenceSha256) throw Error('reviewed geographic reference SHA mismatch');
  const meta = await sharp(source).metadata();
  if (source.length > 16 * 1024 * 1024 || meta.format !== 'png' || !meta.width || !meta.height ||
      meta.width < 1280 || meta.height < 670 || Math.abs(meta.width / meta.height - 1280 / 670) > 0.05)
    throw Error('complete cover source must be a full-size landscape PNG');
  // Normalize dimensions without cutting off any generated text or stretching the image.
  const png = await sharp(source).resize(1280, 670, { fit: 'contain', background: '#fffdf7' }).png().toBuffer();
  return { png, evidence: { renderer: plan.renderer, production: plan, sourceImageSha256: coverSha(source),
    ...(referenceBytes ? { referenceImageSha256: coverSha(referenceBytes) } : {}),
    visualReview: review, validationMethod: 'visual', normalization: 'contain-1280x670' } };
}
