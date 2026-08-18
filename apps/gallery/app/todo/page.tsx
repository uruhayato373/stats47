import { todoSummary, type TodoEntry } from "@/lib/server/todo";

export const dynamic = "force-dynamic";

export const metadata = { title: "TODO — stats47 統合メディアコンソール" };

/**
 * TODO 台帳 (.claude/todo) の閲覧ページ。
 *
 * ★読み取り専用。書き込み API を持たない — 台帳の編集は agent (todo-curator /
 *   improvement-triage / backlog-loop) と skill が排他契約で行っており、画面から
 *   直接書けると排他が崩れる。人が直したいときはエディタで開くリンクを使う。
 */

// 05_機能バックログ.md の実際の節名 (合わない節も末尾に出るので、ここは並び順の指定だけ)
const SECTION_ORDER = ["P0 緊急", "P1 今月", "P2 次", "P3 条件付き保留"];

function editorHref(abs: string, line: number) {
  // Windows のパスは vscode:// でも / 区切りにする
  return `vscode://file/${abs.split('\\').join('/')}:${line}`;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-console-muted">—</span>;
  const tone = status.startsWith("blocked")
    ? "text-console-warn border-console-warn"
    : status === "in-progress"
      ? "text-console-info border-console-info"
      : "text-console-muted border-console-border";
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] ${tone}`}>{status}</span>
  );
}

function EntryRow({ entry, abs }: { entry: TodoEntry; abs: string }) {
  return (
    <tr className="border-b border-console-border/50 align-top">
      <td className="whitespace-nowrap px-2 py-1.5">
        <a
          href={editorHref(abs, entry.startLine)}
          className="font-mono text-[11px] text-console-accent hover:underline"
          title={`エディタで開く (${entry.startLine} 行目)`}
        >
          {entry.id}
        </a>
      </td>
      <td className="px-2 py-1.5 text-console-fg">{entry.title}</td>
      <td className="whitespace-nowrap px-2 py-1.5">
        <StatusBadge status={entry.status} />
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-console-muted">{entry.owner ?? "—"}</td>
      <td className="whitespace-nowrap px-2 py-1.5 text-console-muted">{entry.created ?? "—"}</td>
    </tr>
  );
}

export default function TodoPage() {
  const data = todoSummary();

  if (data.error) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">TODO</h1>
        <p className="text-sm text-console-bad">読み取り失敗: {data.error}</p>
      </div>
    );
  }

  const byKey = Object.fromEntries(data.files.map((f) => [f.key, f]));
  const featureAbs = byKey.feature?.abs ?? "";
  const sections = SECTION_ORDER.filter((s) =>
    data.featureEntries.some((e) => e.section === s),
  ).concat(
    [...new Set(data.featureEntries.map((e) => e.section))].filter(
      (s) => !SECTION_ORDER.includes(s),
    ),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-console-fg">TODO</h1>
        <p className="text-sm text-console-muted">
          真実源: <code className="rounded bg-console-card px-1">.claude/todo/</code>{" "}
          — このページは読み取り専用です。編集は ID リンクからエディタで開いてください。
        </p>
      </header>

      {/* 台帳の構成と鮮度 */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-console-fg">台帳</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.files.map((f) => (
            <a
              key={f.key}
              href={editorHref(f.abs, 1)}
              className="rounded-md border border-console-border bg-console-card p-3 transition-colors hover:border-console-accent/50"
            >
              <div className="text-sm font-medium text-console-fg">{f.label}</div>
              <div className="mt-1 font-mono text-[11px] text-console-muted">{f.file}</div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-console-muted">
                <span>{f.entryCount} 件</span>
                <span>更新 {f.updated ?? "—"}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 未整理タスク (inbox) */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-console-fg">
          未整理タスク{" "}
          <span className="font-normal text-console-muted">({data.inboxRows.length})</span>
        </h2>
        {data.inboxRows.length === 0 ? (
          <p className="text-sm text-console-muted">受信箱は空です。</p>
        ) : (
          <ul className="space-y-1.5">
            {data.inboxRows.map((r, i) => (
              <li
                key={i}
                className="rounded-md border border-console-border bg-console-card px-3 py-2 text-sm"
              >
                <span className="mr-2 font-mono text-[11px] text-console-muted">{r.date}</span>
                <span className="mr-2 rounded border border-console-border px-1.5 py-0.5 text-[11px] text-console-muted">
                  {r.kind}
                </span>
                <span className="text-console-fg">{r.body}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 機能バックログ (見出し型) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-console-fg">
          機能バックログ{" "}
          <span className="font-normal text-console-muted">({data.featureEntries.length})</span>
        </h2>
        {sections.map((section) => {
          const rows = data.featureEntries.filter((e) => e.section === section);
          return (
            <div key={section} className="space-y-1">
              <h3 className="text-[13px] font-medium text-console-muted">
                {section} ({rows.length})
              </h3>
              <div className="overflow-x-auto rounded-md border border-console-border bg-console-card">
                <table className="w-full text-[13px]">
                  <thead className="border-b border-console-border text-left text-[11px] text-console-muted">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">ID</th>
                      <th className="px-2 py-1.5 font-medium">タイトル</th>
                      <th className="px-2 py-1.5 font-medium">status</th>
                      <th className="px-2 py-1.5 font-medium">owner</th>
                      <th className="px-2 py-1.5 font-medium">created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <EntryRow key={e.id} entry={e} abs={featureAbs} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-[11px] text-console-muted">
        改善バックログ (04) の一覧は{" "}
        <a href="/dashboard" className="text-console-accent hover:underline">
          プロジェクト現況
        </a>{" "}
        にあります。ここでは重複を避けて件数だけ出しています。
      </p>
    </div>
  );
}
