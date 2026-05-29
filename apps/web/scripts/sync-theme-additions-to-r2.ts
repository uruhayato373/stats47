/**
 * THEME_COMPONENT_ADDITIONS を本番 R2 の
 * app/page-components/theme/<key>.json へ直接マージ反映する。
 *
 * このクラウド環境にはローカルビルド DB が無い (R2 に未 push) ため、
 * DB→export パイプラインが使えない。代わりに既存 R2 snapshot を取得し、
 * 同一 componentKey を置換しつつ追加分を append して書き戻す (idempotent)。
 *
 * ※ SSOT は Mac のローカルビルド DB。Mac 側では seed-theme-page-components.ts を
 *   流せば同じ結果になり drift しない。
 *
 * 使用方法:
 *   R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY を env に設定し
 *   npx tsx apps/web/scripts/sync-theme-additions-to-r2.ts
 */

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

import { THEME_COMPONENT_ADDITIONS } from "./theme-page-component-additions";

dotenv.config({ path: ".env.local" });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

interface R2PageComponent {
  componentKey: string;
  componentType: string;
  title: string;
  componentProps: Record<string, unknown>;
  sourceName: string | null;
  sourceLink: string | null;
  rankingLink: string | null;
  gridColumnSpan: number;
  gridColumnSpanTablet: number | null;
  gridColumnSpanSm: number | null;
  dataSource: string | null;
  section: string | null;
  sortOrder: number;
}

function keyPath(pageKey: string): string {
  return `app/page-components/theme/${encodeURIComponent(pageKey)}.json`;
}

function createS3(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("エラー: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY が未設定です");
    process.exit(1);
  }
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

async function getExisting(s3: S3Client, key: string): Promise<R2PageComponent[]> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await (res.Body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    const parsed = JSON.parse(Buffer.from(bytes).toString("utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: unknown) {
    const name = (e as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return [];
    throw e;
  }
}

async function main() {
  const s3 = createS3();
  let totalAdded = 0;

  for (const [pageKey, comps] of Object.entries(THEME_COMPONENT_ADDITIONS)) {
    const key = keyPath(pageKey);
    const existing = await getExisting(s3, key);
    const newKeys = new Set(comps.map((c) => c.componentKey));

    // 同一 componentKey を除去 (idempotent 置換) し、既存 + 追加を結合
    const merged: R2PageComponent[] = [
      ...existing.filter((c) => !newKeys.has(c.componentKey)),
      ...comps.map<R2PageComponent>((c) => ({
        componentKey: c.componentKey,
        componentType: c.componentType,
        title: c.title,
        componentProps: c.componentProps,
        sourceName: c.sourceName,
        sourceLink: c.sourceLink,
        rankingLink: c.rankingLink,
        gridColumnSpan: 12,
        gridColumnSpanTablet: null,
        gridColumnSpanSm: null,
        dataSource: "ranking",
        section: null,
        sortOrder: c.sortOrder,
      })),
    ];
    merged.sort((a, b) => a.sortOrder - b.sortOrder);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(merged),
        ContentType: "application/json; charset=utf-8",
      }),
    );
    totalAdded += comps.length;
    console.log(`  ✅ ${key}  (existing=${existing.length} → total=${merged.length}, +${comps.length})`);
  }

  console.log(`\n✅ R2 反映完了: themes=${Object.keys(THEME_COMPONENT_ADDITIONS).length} added=${totalAdded}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
