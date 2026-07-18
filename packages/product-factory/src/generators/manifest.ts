/**
 * manifest.json (リリース台帳の商品側メタ)。入力 snapshot の決定的ハッシュと生成物のファイル一覧を持つ。
 * 購入者の個人情報やメッセージ本文は保存しない (販売実績は別途 sales-ledger)。
 */
import { createHash } from "node:crypto";

export interface ManifestFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface ProductManifest {
  readonly productId: string;
  readonly family: string;
  readonly version: string;
  /** 生成時刻 (呼び出し元が渡す。決定的テストでは固定値を渡す)。 */
  readonly generatedAt: string;
  /** 入力 (商品定義 + データセット + 設定) の決定的ハッシュ。 */
  readonly inputHash: string;
  readonly indicator: string;
  readonly unit: string;
  readonly year: string;
  readonly notice: string;
  readonly files: readonly ManifestFile[];
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** 入力オブジェクトの決定的ハッシュ (JSON 直列化 → sha256)。 */
export function buildInputHash(input: unknown): string {
  return sha256(JSON.stringify(input));
}
