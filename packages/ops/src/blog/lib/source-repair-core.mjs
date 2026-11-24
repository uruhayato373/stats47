import crypto from 'node:crypto';

const SHA256_RE = /^[a-f0-9]{64}$/;

export function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function parseSourceRepairPayload(encoded, maxEntries = 40) {
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(encoded)) {
    throw new Error('source_repair_payload は base64 必須');
  }
  let repairs;
  try {
    repairs = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    throw new Error('source_repair_payload のJSONを解釈できません');
  }
  if (
    !Array.isArray(repairs) ||
    repairs.length < 1 ||
    repairs.length > maxEntries
  ) {
    throw new Error(`repair は1〜${maxEntries}件の配列にすること`);
  }
  return repairs;
}

export function resolveCasJsonWrite({
  currentContent,
  nextContent,
  expectedSha256,
  label,
}) {
  if (typeof nextContent !== 'string' || nextContent.length === 0) {
    throw new Error(`${label}: 書込内容が空です`);
  }
  if (expectedSha256 != null && !SHA256_RE.test(expectedSha256)) {
    throw new Error(`${label}: expectedSha256 は64桁hex必須`);
  }
  if (currentContent == null) {
    if (expectedSha256 != null) {
      throw new Error(`${label}: 既存objectを期待したが存在しません`);
    }
    return { action: 'create', beforeSha256: null };
  }
  if (currentContent === nextContent) {
    return { action: 'unchanged', beforeSha256: sha256Text(currentContent) };
  }
  if (expectedSha256 == null) {
    throw new Error(`${label}: 既存objectの更新にはexpectedSha256が必要です`);
  }
  const actualSha256 = sha256Text(currentContent);
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `${label}: CAS不一致 expected=${expectedSha256} actual=${actualSha256}`
    );
  }
  return { action: 'update', beforeSha256: actualSha256 };
}
