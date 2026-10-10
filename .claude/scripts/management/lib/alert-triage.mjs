/**
 * 自動アラート Issue (label auto-generated) の回収の判定 (純関数)。CLI は ../check-alert-triage.mjs。
 *
 * アラートは検知・更新・自動クローズまでは各 workflow が行うが、開いたままの Issue を誰が引き取るかが
 * 決まっていなかった (2026-10-10 時点で 20 件、8/1 から開いたまま毎日更新され続けるものもあった)。
 * staleDays を過ぎたアラートには、コメントで「→ 振り分け: <行き先>」を付けることを求める。
 * 行き先の語彙はレビューの申し送りと同じ (review-wiring.json の handoffRouting)。
 * 本文は各 workflow が毎回書き換えるので、振り分けはコメントにだけ書く (本文の記述は数えない)。
 */
import { classifyRoute, parseRoutes } from "./review-cadence.mjs";

const DAY = 86400000;

/** コメントを新しい順に見て、振り分けの記法を含む最新の 1 件から行き先を取る */
export function latestRouting(comments, marker) {
  const sorted = [...(comments ?? [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  for (const c of sorted) {
    for (const line of String(c.body ?? "").split("\n").reverse()) {
      const routes = parseRoutes(line, marker);
      if (routes) return { routes, at: c.createdAt, line: line.trim() };
    }
  }
  return null;
}

/**
 * @param {Array<{number:number,title:string,createdAt:string,comments?:Array<{body:string,createdAt:string}>,labels?:Array<{name:string}>}>} issues
 * @param {{now?: Date, staleDays: number, marker: string, ids: Set<string>}} opts
 */
export function triageAlerts(issues, { now = new Date(), staleDays, marker, ids }) {
  return issues
    .map((issue) => {
      const ageDays = Math.floor((now.getTime() - Date.parse(issue.createdAt)) / DAY);
      const routing = latestRouting(issue.comments, marker);
      let status = "fresh";
      let problem = null;
      if (routing) {
        const bad = routing.routes.map((r) => ({ r, v: classifyRoute(r, ids, true) })).filter((x) => x.v !== "ok");
        status = bad.length ? "bad-route" : "routed";
        if (bad.length) problem = `${bad[0].v}:${bad.map((x) => x.r).join(",")}`;
      } else if (ageDays >= staleDays) {
        status = "unrouted";
      }
      return { number: issue.number, title: issue.title, ageDays, status, routes: routing?.routes ?? [], problem };
    })
    .sort((a, b) => b.ageDays - a.ageDays);
}

export function formatTriage(rows, { staleDays, marker }) {
  const errors = rows.filter((r) => r.status === "unrouted" || r.status === "bad-route");
  const lines = [
    `## 自動アラートの回収`,
    ``,
    `開いている自動アラート ${rows.length} 件 / 振り分け済み ${rows.filter((r) => r.status === "routed").length} / ` +
      `未振り分け (${staleDays} 日超) ${rows.filter((r) => r.status === "unrouted").length} / 行き先の誤り ${rows.filter((r) => r.status === "bad-route").length}`,
    ``,
  ];
  if (errors.length) {
    lines.push(`| Issue | 経過日数 | 状態 | 内容 |`, `|---|---:|---|---|`);
    for (const r of errors) lines.push(`| #${r.number} | ${r.ageDays} | ${r.status === "unrouted" ? "未振り分け" : `行き先の誤り (${r.problem})`} | ${r.title} |`);
    lines.push(
      ``,
      `直し方: Issue に「${marker} <カード ID / EXP-NNN / #Issue / 見送り (理由)>」のコメントを付ける。` +
        `カード ID は .claude/todo/backlog.md・improvements.md に実在するもの。本文は workflow が毎回書き換えるのでコメントに書く。`,
    );
  }
  return { body: lines.join("\n"), errors: errors.length };
}
