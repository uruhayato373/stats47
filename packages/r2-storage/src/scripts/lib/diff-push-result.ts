export interface DiffPushResult {
  attempted: number;
  success: number;
  errors: number;
}

/**
 * R2 の部分 upload を成功扱いにしない。
 *
 * snapshot producer は push 直後の object を後続処理が読むため、1件でも失敗した状態で
 * exit 0 にすると新旧 snapshot が混在する。件数不一致も同じく fail closed にする。
 */
export function assertDiffPushComplete(result: DiffPushResult): void {
  if (result.errors > 0 || result.success !== result.attempted) {
    throw new Error(
      `R2差分同期が不完全です: attempted=${result.attempted} success=${result.success} errors=${result.errors}`,
    );
  }
}
