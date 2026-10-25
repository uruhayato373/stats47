import { ContentAuditPanel, FilterLink, StageBadge } from "@/components/content/content-ui";
import Link from "next/link";
import { Cell, DataTable, Row } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

import { NativeSelect } from "@/components/ui/native-select";
import { datasetPath } from "../../../../../config/datasets.mjs";
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";
export const metadata = { title: "note運用 — stats47 admin" };

type Query = { stage?: string; gate?: string; vertical?: string; q?: string };
const STAGES = ["ready", "draft", "blocked", "published"] as const;
const STAGE_LABELS = { ready: "公開準備完了", draft: "内容レビュー中", blocked: "公開条件未充足", published: "公開済み" } as const;
const GATE_LABELS = {
  body: "本文未作成",
  duplicate: "同題の公開記事あり",
  product: "販売条件の確認待ち",
  cover: "カバー未採用",
  review: "内容レビュー待ち",
} as const;

function href(query: Query, patch: Partial<Query>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `/content/note?${text}` : "/content/note";
}

export default async function NoteContentPage({ searchParams }: { searchParams: Promise<Query> }) {
  const data = contentOperations();
  const query = await searchParams;
  if (hasError(data)) {
    return (
      <div className="space-y-4">
        <PageHeading title="note運用" source="note catalog + R2" />
        <ErrorNote error={data.error} />
      </div>
    );
  }
  const stage = STAGES.includes(query.stage as (typeof STAGES)[number]) ? query.stage : undefined;
  const gate = Object.keys(GATE_LABELS).includes(query.gate ?? "") ? query.gate : undefined;
  const verticals = [...new Set(data.note.map((x) => x.vertical))].sort();
  const vertical = verticals.includes(query.vertical ?? "") ? query.vertical : undefined;
  const word = query.q?.trim().toLowerCase() ?? "";
  const articles = data.note.filter(
    (article) =>
      (!stage || article.stage === stage) &&
      (!gate || article.publicationGate === gate) &&
      (!vertical || article.vertical === vertical) &&
      (!word || `${article.key} ${article.title}`.toLowerCase().includes(word)),
  );
  const findings = data.audit.findings.filter((x) => x.channel === "note");

  return (
    <div className="space-y-8">
      <PageHeading
        title="note運用"
        source={`${datasetPath("note.articles")} (Git記事台帳) + R2 note/<vertical>/<slug>/ (本文)`}
      >
        <p className="text-xs text-console-muted">
          Git記事台帳の公開記録と制作中の記事を確認します。本文はR2に保存します。この画面の「未公開」はnote.com管理画面の下書き件数ではありません。
        </p>
        <Link href="/content/note/covers" className="text-xs text-console-accent hover:underline">カバー画像を分類別に確認する →</Link>
        <Link href="/product/content-quality?channel=note" className="text-sm text-console-accent hover:underline">本文・画像の改善方針を管理する →</Link>
      </PageHeading>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterLink href={href(query, { stage: undefined })} active={!stage}>すべて {data.note.length}</FilterLink>
          {STAGES.map((value) => (
            <FilterLink key={value} href={href(query, { stage: value })} active={stage === value}>
              {STAGE_LABELS[value]} {data.note.filter((x) => x.stage === value).length}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterLink href={href(query, { gate: undefined })} active={!gate}>公開条件すべて</FilterLink>
          {Object.entries(GATE_LABELS).map(([value, label]) => (
            <FilterLink key={value} href={href(query, { gate: value })} active={gate === value}>
              {label} {data.note.filter((article) => article.publicationGate === value).length}
            </FilterLink>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" action="/content/note">
          {stage ? <input type="hidden" name="stage" value={stage} /> : null}
          {gate ? <input type="hidden" name="gate" value={gate} /> : null}
          <NativeSelect
            name="vertical"
            defaultValue={vertical}
            aria-label="note vertical" size="sm">
            <option value="">全vertical</option>
            {verticals.map((value) => <option key={value} value={value}>{value}</option>)}
          </NativeSelect>
          <Input
            name="q"
            defaultValue={query.q}
            aria-label="note記事を検索"
            placeholder="slug・タイトルで検索" className="w-56" />
          <button className="rounded-md border border-console-border px-3 text-xs text-console-muted">絞り込む</button>
        </form>
      </div>

      <Section title="記事" count={articles.length}>
        <DataTable columns={["記事", "状態", "分類", "本文・公開", "次の作業"]}>
          {articles.map((article) => (
            <Row key={`${article.vertical}-${article.key}`}>
              <Cell>
                <Link className="font-medium text-console-accent hover:underline" href={'/product/content-quality?owner='+encodeURIComponent('note/'+article.key)}>{article.title}</Link>
                <div className="font-mono text-[10px] text-console-muted">{article.key}</div>
              </Cell>
              <Cell nowrap>
                <StageBadge stage={article.stage} />
                {article.publicationGate ? <div className="text-[10px] text-console-muted">{GATE_LABELS[article.publicationGate]}</div> : null}
              </Cell>
              <Cell nowrap muted>
                <div>{article.vertical}</div>
                <div>{article.series ?? "—"} / {article.magazine ?? "未割当"}</div>
                <div>{article.isPaid ? `有料 ¥${article.priceJpy}` : "無料"}</div>
              </Cell>
              <Cell muted>
                <div>R2本文 {article.r2Body ? "あり" : "未復元"}</div>
                {article.noteUrl ? (
                  <a href={article.noteUrl} target="_blank" rel="noreferrer" className="text-console-accent hover:underline">
                    note.comを開く
                  </a>
                ) : (
                  <span>未公開</span>
                )}
                <div className="text-[10px]">{article.r2Path}</div>
              </Cell>
              <Cell>
                <div>{article.nextAction}</div>
                {article.publicationGate === "cover" && article.coverProductionId ? (
                  <Link href={`/content/note/covers?scope=all&ids=${encodeURIComponent(article.coverProductionId)}`} className="text-xs text-console-accent hover:underline">カバーを管理する →</Link>
                ) : article.publicationGate === "product" ? (
                  <Link href="/product/status" className="text-xs text-console-accent hover:underline">商品状態を確認する →</Link>
                ) : null}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="note監査">
        <ContentAuditPanel
          status={findings.some((x) => x.severity === "error") ? "fail" : findings.length ? "warn" : "pass"}
          findings={findings}
        />
      </Section>
    </div>
  );
}
