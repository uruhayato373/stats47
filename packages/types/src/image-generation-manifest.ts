export const IMAGE_GENERATION_MANIFEST_KIND =
  'stats47-image-generation' as const;
export const IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION = 1 as const;
export const IMAGE_GENERATION_PUBLISH_PLAN_KIND =
  'stats47-image-publish-plan' as const;
export const IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION = 1 as const;

export interface ImageGenerationAsset {
  key: string;
  variant: string;
  contentType: `image/${string}`;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

/**
 * R2 画像派生物の共通 manifest。
 *
 * fingerprint は「入力 + renderer + asset contract」の決定的ハッシュであり、
 * 一致する場合だけ再生成を省略できる。generatedAt は fingerprint に含めない。
 */
export interface ImageGenerationManifest<TMetadata = Record<string, unknown>> {
  kind: typeof IMAGE_GENERATION_MANIFEST_KIND;
  schemaVersion: typeof IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION;
  generator: string;
  entityId: string;
  inputHash: string;
  rendererHash: string;
  fingerprint: string;
  generatedAt: string;
  assets: ImageGenerationAsset[];
  metadata: TMetadata;
}

export interface ImageGenerationPublishPlanItem {
  entityId: string;
  manifestKey: string;
  fingerprint: string;
  manifestSha256: string;
  /**
   * generator が staging へ書いた asset の完全な契約。
   * publisher は staged manifest と完全一致する場合だけ PUT する。
   */
  assets: ImageGenerationAsset[];
  /**
   * plan 作成時に観測した remote manifest bytes のSHA。
   * fingerprintが同じまま更新された場合や古いplanの再実行も拒否する。
   */
  expectedRemoteManifestSha256: string | null;
  /**
   * plan 作成時に観測した remote manifest の fingerprint。
   * publisher は実 R2 を再読し、異なれば競合として拒否する。
   */
  expectedRemoteFingerprint: string | null;
}

/**
 * 生成された画像だけを反映する exact publish plan。
 *
 * stageRoot は project root からの相対パスで、publisher は
 * `.local/image-staging/` 配下だけを受理する。
 */
export interface ImageGenerationPublishPlan {
  kind: typeof IMAGE_GENERATION_PUBLISH_PLAN_KIND;
  schemaVersion: typeof IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION;
  generator: string;
  stageRoot: string;
  createdAt: string;
  items: ImageGenerationPublishPlanItem[];
}
