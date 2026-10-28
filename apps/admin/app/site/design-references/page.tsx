import type { Metadata } from "next";

import { Cell, DataTable, PanelCard, Row, StatusBadge, type Tone } from "@/components/admin-ui";
import { Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { type DesignAdoption, type DesignReference, designReferences, SCREENS_ROOT } from "@/lib/server/design-references";
import { datasetPath } from "../../../../../config/datasets.mjs";

export const metadata: Metadata = {
  title: "参考サイト — stats47 管理コンソール",
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<DesignReference["status"], { label: string; tone: Tone }> = {
  adopted: { label: "採用", tone: "good" },
  trial: { label: "試行候補", tone: "info" },
  rejected: { label: "見送り", tone: "neutral" },
};

const ADOPTION_LABEL: Record<DesignAdoption["state"], { label: string; tone: Tone }> = {
  done: { label: "反映済み", tone: "good" },
  todo: { label: "未対応", tone: "warn" },
  proposed: { label: "提案", tone: "info" },
  rejected: { label: "見送り", tone: "neutral" },
};

function screenUrl(file: string) {
  return `/api/design-references/${file.slice(SCREENS_ROOT.length + 1).split("/").map(encodeURIComponent).join("/")}`;
}

/** 参考サイトの台帳。型 B (一覧): 参考サイトごとに採否と理由・条件・反映先・撮影 */
export default function DesignReferencesPage() {
  const references = designReferences();
  return (
    <>
      <PageHeading title="参考サイト" source={datasetPath("design.references")} />
      <Stack>
        {references.map((ref) => {
          const status = STATUS_LABEL[ref.status];
          return (
            <PanelCard
              key={ref.id}
              id={ref.id}
              title={ref.name}
              action={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              description={`${ref.decidedAt} 決定 · ${ref.decision}`}
            >
              <dl className="m-0 grid grid-cols-[4.5rem_1fr] gap-x-3 sm:grid-cols-[8rem_1fr] sm:gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="m-0 break-all">
                  <a href={ref.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {ref.url}
                  </a>
                </dd>
                {ref.source ? (
                  <>
                    <dt className="text-muted-foreground">ソース</dt>
                    <dd className="m-0 break-all">{ref.source}</dd>
                  </>
                ) : null}
                {ref.scope ? (
                  <>
                    <dt className="text-muted-foreground">範囲</dt>
                    <dd className="m-0">{ref.scope}</dd>
                  </>
                ) : null}
                {ref.spec ? (
                  <>
                    <dt className="text-muted-foreground">仕様</dt>
                    <dd className="m-0">{ref.spec}</dd>
                  </>
                ) : null}
                {ref.measurements ? (
                  <>
                    <dt className="text-muted-foreground">実測</dt>
                    <dd className="m-0 break-all">{ref.measurements}</dd>
                  </>
                ) : null}
              </dl>
              {ref.conditions?.length ? (
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-medium">条件</p>
                  <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm">
                    {ref.conditions.map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <DataTable columns={["部品", "参考にすること", "状態", "反映先"]}>
                {ref.adoptions.map((adoption) => {
                  const state = ADOPTION_LABEL[adoption.state];
                  return (
                    <Row key={adoption.part}>
                      <Cell nowrap>{adoption.part}</Cell>
                      <Cell>{adoption.what}</Cell>
                      <Cell nowrap>
                        <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                      </Cell>
                      <Cell muted>{adoption.reflectedIn ?? "—"}</Cell>
                    </Row>
                  );
                })}
              </DataTable>
              {ref.screenFiles.length ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {ref.screenFiles.map((file) => (
                    <a key={file} href={screenUrl(file)} target="_blank" rel="noreferrer" className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {/* eslint-disable-next-line @next/next/no-img-element -- ローカルの撮影画像をそのまま見せる */}
                      <img src={screenUrl(file)} alt={file.split("/").pop()} loading="lazy" className="aspect-video w-full rounded-md border object-cover object-top" />
                      {file.split("/").pop()}
                    </a>
                  ))}
                </div>
              ) : null}
            </PanelCard>
          );
        })}
      </Stack>
    </>
  );
}
