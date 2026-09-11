import {
  EARTHQUAKE_EXPOSURE_SOURCE,
  assertEarthquakeManifest,
  assertEarthquakePopulationSnapshot,
  assertEarthquakeVerification,
  buildEarthquakePrefArtifact,
  type EarthquakeArtifactRef,
  type EarthquakePopulationManifest,
  type EarthquakePopulationSnapshot,
  type EarthquakePopulationVerification,
} from '@stats47/data-configs/theme-catalog';

export interface EarthquakeExposureBundle {
  snapshot: EarthquakePopulationSnapshot;
  manifest: EarthquakePopulationManifest;
  verification: EarthquakePopulationVerification;
}
export async function matchesEarthquakeArtifact(
  text: string,
  ref: EarthquakeArtifactRef
): Promise<boolean> {
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength !== ref.bytes || bytes.byteLength > 5_000_000)
    return false;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha = Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, '0')
  ).join('');
  return sha === ref.sha256;
}
/** The limited private-source contract admits county-band totals, never hazard mesh bodies. */
export async function parseEarthquakeExposureBundle(input: {
  itemText: string;
  manifestText: string;
  verificationText: string;
}): Promise<EarthquakeExposureBundle | null> {
  try {
    if (
      Object.values(input).some(
        (text) => new TextEncoder().encode(text).byteLength > 5_000_000
      )
    )
      return null;
    const snapshot: unknown = JSON.parse(input.itemText);
    const manifest: unknown = JSON.parse(input.manifestText);
    const verification: unknown = JSON.parse(input.verificationText);
    assertEarthquakePopulationSnapshot(snapshot);
    assertEarthquakeManifest(manifest);
    assertEarthquakeVerification(verification);
    if (
      snapshot.generatedAt !== manifest.generatedAt ||
      snapshot.generatedAt !== verification.generatedAt
    )
      return null;
    if (
      !(await matchesEarthquakeArtifact(input.itemText, manifest.aggregate)) ||
      !(await matchesEarthquakeArtifact(
        input.verificationText,
        manifest.verification
      ))
    )
      return null;
    // Reconstruct only county-band artifacts from the checked snapshot; no raw hazard geometry is loaded.
    const prefChecks = await Promise.all(
      snapshot.rows.map(async (row) => {
        const ref = manifest.intermediates.find(
          (r) => r.areaCode === row.areaCode
        );
        return (
          !!ref &&
          matchesEarthquakeArtifact(
            JSON.stringify(buildEarthquakePrefArtifact(snapshot, row)),
            ref
          )
        );
      })
    );
    if (
      !prefChecks.every(Boolean) ||
      manifest.operation !== EARTHQUAKE_EXPOSURE_SOURCE.algorithm
    )
      return null;
    return { snapshot, manifest, verification };
  } catch {
    return null;
  }
}
