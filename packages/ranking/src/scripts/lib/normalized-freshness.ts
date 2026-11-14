/**
 * 正規化 snapshot の鮮度判定 (純関数)。
 *
 * 監査本体 (`audit-ranking-data-integrity.ts`) は import した時点で main が走るので、
 * 判定だけをここに置いてテストできるようにする (`empty-values-alarm.ts` と同じ形)。
 */

/**
 * 正規化 snapshot が values.json より古いときの許容日数 (values.json の generatedAt − 正規化の generatedAt)。
 * sync-snapshots は週次なので 8 日あれば正常運用では絶対に超えない。
 *
 * 向きは片側だけを見る。values.json の generatedAt は「中身が最後に変わった生成の時刻」で、
 * 前回配信と同じ中身なら引き継がれる (generate-ranking-values.ts)。年次の統計は数か月変わらないので、
 * 毎週作り直す正規化 snapshot のほうが新しいのが正常で、差の絶対値で見るとその全件が違反になる。
 * 違反にするのは「values.json は変わったのに、正規化がそれより 8 日を超えて古いまま」の向きだけ。
 * 正規化の writer が止まったこと自体は、下の絶対鮮度が捕まえる。
 */
export const NORMALIZED_STALE_DAYS = 8;

/**
 * 正規化 snapshot の **絶対鮮度** の上限日数 (現在時刻との差)。
 *
 * NORMALIZED_STALE_DAYS は values.json との**相対**比較なので、values.json 自身も同時に
 * 凍結していると素通りする (2026-07-29 実測: inpatient-rate-per-100k は values.json 05-22 /
 * 正規化 05-21 で 1 日差のため検知できず、100 倍の誤値が残っていた)。
 * writer は sync-snapshots のたびに全 target を上書きするので、正常運用なら 30 日を超えない。
 * 「writer が動かなくなった」ものを相対比較の死角なしに捕まえる。
 */
export const NORMALIZED_ABSOLUTE_STALE_DAYS = 30;

export interface StaleArtifact {
  key: string;
  artifact: string;
  ageDays: number;
  kind: "relative" | "absolute";
}

/**
 * 正規化 artifact の鮮度を 2 軸で検査する。
 * - relative: values.json より古い日数 (values.json は変わったのに正規化が追従していないケース)
 * - absolute: 現在時刻との差 (正規化の writer が止まったケース = 相対比較の死角)
 */
export function checkFreshness(
  key: string,
  artifact: string,
  baseGeneratedAt: string | undefined,
  artifactGeneratedAt: string | undefined,
  now: number,
): StaleArtifact[] {
  const out: StaleArtifact[] = [];
  const rel = daysBehind(baseGeneratedAt, artifactGeneratedAt);
  if (rel !== null && rel > NORMALIZED_STALE_DAYS) {
    out.push({ key, artifact, ageDays: Math.round(rel), kind: "relative" });
  }
  const abs = artifactGeneratedAt ? (now - Date.parse(artifactGeneratedAt)) / 86_400_000 : null;
  if (abs !== null && Number.isFinite(abs) && abs > NORMALIZED_ABSOLUTE_STALE_DAYS) {
    out.push({ key, artifact, ageDays: Math.round(abs), kind: "absolute" });
  }
  return out;
}

/** artifact が base より何日古いか (base − artifact)。artifact のほうが新しければ負。パース不能なら null */
function daysBehind(base: string | undefined, artifact: string | undefined): number | null {
  if (!base || !artifact) return null;
  const baseAt = Date.parse(base);
  const artifactAt = Date.parse(artifact);
  if (!Number.isFinite(baseAt) || !Number.isFinite(artifactAt)) return null;
  return (baseAt - artifactAt) / 86_400_000;
}
