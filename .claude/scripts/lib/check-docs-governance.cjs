#!/usr/bin/env node
"use strict";

/**
 * docs governance checker
 *
 * 人・agent向けの判断規則: .claude/rules/docs-vs-issues.md
 * 決定的な機械契約:       .claude/config/docs-governance.json
 *
 * Usage:
 *   node .claude/scripts/lib/check-docs-governance.cjs
 *   node .claude/scripts/lib/check-docs-governance.cjs --fail-on-warn
 *   node .claude/scripts/lib/check-docs-governance.cjs --json
 *   node .claude/scripts/lib/check-docs-governance.cjs --fix
 *
 * --fix は生成管理された実装計画INDEXだけを更新する。文書の統合・削除・
 * frontmatter日付の書換えは意味判断が必要なため自動実行しない。
 */

const fs = require("node:fs");
const path = require("node:path");
const backlogLib = require("./backlog-lib.cjs");

const DEFAULT_ROOT =
  process.env.DOCS_GOVERNANCE_ROOT ||
  process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(__dirname, "..", "..", "..");
const DEFAULT_CONFIG =
  process.env.DOCS_GOVERNANCE_CONFIG ||
  ".claude/config/docs-governance.json";

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relative(root, file) {
  return toPosix(path.relative(root, file));
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/**
 * git が symlink を通常ファイルとして展開したもの (materialized symlink) かを判定する。
 *
 * Windows の `core.symlinks=false` なチェックアウトでは、git は mode 120000 の entry を
 * 「リンク先の相対パス 1 行だけを含む通常ファイル」として書き出す。`lstat` は symlink と
 * 認識しないため素朴に内容比較すると必ず不一致になり、リポジトリ側は正しいのに
 * DG003 が上がり続ける (実測: AGENTS.md が "CLAUDE.md" の 9 バイトファイルになる)。
 *
 * 本物のドリフト (mirror が canonical の古い複製になっている等) は引き続き検出したいので、
 * **「改行を含まない短い文字列」かつ「そこから解決した実体が canonical と同一」** の
 * 両方を満たすときだけ symlink とみなす。中身が実際の文書なら 1 つ目の条件で落ちる。
 */
function isMaterializedSymlink(mirrorAbs, canonicalAbs) {
  const target = readText(mirrorAbs).trim();
  // 空・複数行・長すぎるものはパスではなく文書とみなす (PATH_MAX 相当で足切り)。
  if (!target || target.length > 260 || /[\r\n]/.test(target)) return false;
  try {
    const resolved = path.resolve(path.dirname(mirrorAbs), target);
    if (!fs.existsSync(resolved)) return false;
    return fs.realpathSync(resolved) === fs.realpathSync(canonicalAbs);
  } catch {
    return false;
  }
}

function loadConfig(root = DEFAULT_ROOT, configPath = DEFAULT_CONFIG) {
  const absolute = path.resolve(root, configPath);
  const parsed = JSON.parse(fs.readFileSync(absolute, "utf8"));
  if (parsed.version !== 1) {
    throw new Error(`unsupported docs governance config version: ${parsed.version}`);
  }
  return parsed;
}

function walk(directory, output = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    if ([".git", "node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else output.push(absolute);
  }
  return output;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    return { exists: false, values: {}, raw: "" };
  }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { exists: false, values: {}, raw: "" };
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s/.test(line) || /^\s*(?:#|$)/.test(line)) continue;
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (!field) continue;
    let value = field[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[field[1]] = value;
  }
  return { exists: true, values, raw: match[1] };
}

function finding(level, code, file, message) {
  return { level, code, file, message };
}

function dateAtJst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function daysBetween(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return NaN;
  return Math.floor((end - start) / 86_400_000);
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isoWeek(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date - yearStart) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function escapeTable(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function getImplementationPlans(root, config) {
  const directory = path.join(root, config.implementationPlans.directory);
  const indexName = path.basename(config.implementationPlans.index);
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== indexName)
    .map((entry) => {
      const file = path.join(directory, entry.name);
      const frontmatter = parseFrontmatter(readText(file));
      return {
        file: relative(root, file),
        name: entry.name,
        title: frontmatter.values.title || entry.name.replace(/\.md$/, ""),
        status: frontmatter.values.status || "",
        relatedBacklog: frontmatter.values.related_backlog || "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function renderImplementationPlanBlock(root, config) {
  const plans = getImplementationPlans(root, config);
  const rows = [
    config.implementationPlans.generatedBlockStart,
    "| ファイル | 内容 | Status | 関連バックログ |",
    "|---|---|---|---|",
    ...plans.map(
      (plan) =>
        `| [\`${escapeTable(plan.name)}\`](./${encodeURI(plan.name)}) | ${escapeTable(plan.title)} | \`${escapeTable(plan.status)}\` | \`${escapeTable(plan.relatedBacklog)}\` |`,
    ),
    config.implementationPlans.generatedBlockEnd,
  ];
  return rows.join("\n");
}

function fixImplementationPlanIndex(root, config) {
  const index = path.join(root, config.implementationPlans.index);
  const text = readText(index);
  const start = config.implementationPlans.generatedBlockStart;
  const end = config.implementationPlans.generatedBlockEnd;
  const block = renderImplementationPlanBlock(root, config);
  let next = text;

  if (text.includes(start) && text.includes(end)) {
    const pattern = new RegExp(
      `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    );
    next = text.replace(pattern, block);
  } else {
    const heading = "## 🟢 領域別の実行計画（active）";
    const related = "\n## 関連";
    const headingIndex = text.indexOf(heading);
    const relatedIndex = text.indexOf(related, headingIndex + heading.length);
    if (headingIndex < 0 || relatedIndex < 0) {
      throw new Error(`generated block insertion point not found: ${config.implementationPlans.index}`);
    }
    next =
      text.slice(0, headingIndex + heading.length) +
      `\n\n${block}\n` +
      text.slice(relatedIndex);
  }

  if (next !== text) {
    fs.writeFileSync(index, next, "utf8");
    return true;
  }
  return false;
}

function inspectRepository({
  root = DEFAULT_ROOT,
  config = loadConfig(root),
  now = process.env.DOCS_GOVERNANCE_NOW || dateAtJst(),
} = {}) {
  const findings = [];
  const docsRoot = path.join(root, "docs");
  const add = (level, code, file, message) =>
    findings.push(finding(level, code, file, message));

  // SSOTとClaude/Codex共有入口
  const canonical = path.join(root, config.sharedAgentInstructions.canonical);
  if (!fs.existsSync(canonical)) {
    add("error", "DG001", config.sharedAgentInstructions.canonical, "共有agent指示の正典が存在しない");
  }
  for (const mirrorPath of config.sharedAgentInstructions.mirrors) {
    const mirror = path.join(root, mirrorPath);
    if (!fs.existsSync(mirror)) {
      add("error", "DG002", mirrorPath, "共有agent指示のmirrorが存在しない");
      continue;
    }
    let same = false;
    try {
      if (fs.lstatSync(mirror).isSymbolicLink()) {
        same = fs.realpathSync(mirror) === fs.realpathSync(canonical);
      } else {
        same = readText(mirror) === readText(canonical) || isMaterializedSymlink(mirror, canonical);
      }
    } catch {
      same = false;
    }
    if (!same) {
      add(
        "error",
        "DG003",
        mirrorPath,
        `${config.sharedAgentInstructions.canonical}と同一内容または同ファイルへのsymlinkではない`,
      );
    }
  }

  for (const required of config.requiredReferences) {
    const text = readText(path.join(root, required.file));
    if (!text) {
      add("error", "DG004", required.file, "必須参照元が存在しない、または空");
      continue;
    }
    for (const expected of required.contains) {
      if (!text.includes(expected)) {
        add("error", "DG005", required.file, `必須参照がない: ${expected}`);
      }
    }
  }

  // docs直下のallowlist
  const allowedFiles = new Set(config.topLevel.allowedFiles);
  const allowedDirectories = new Set(config.topLevel.allowedDirectories);
  for (const entry of fs.readdirSync(docsRoot, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const item = `docs/${entry.name}`;
    if (entry.isDirectory() && !allowedDirectories.has(item)) {
      add("error", "DG010", item, "docs直下の未登録ディレクトリ");
    } else if (entry.isFile() && !allowedFiles.has(item)) {
      add("error", "DG011", item, "docs直下の未登録ファイル");
    }
  }

  // 固定ディレクトリは追加・欠落を許さない
  for (const [directory, expectedNames] of Object.entries(config.fixedDirectories)) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
      add("error", "DG013", directory, "固定構成の必須ディレクトリが欠落");
      continue;
    }
    const actual = fs
      .readdirSync(absolute, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
    const expected = [...expectedNames].sort();
    for (const name of actual.filter((name) => !expected.includes(name))) {
      add("error", "DG012", `${directory}/${name}`, "固定構成にないファイル。既存SSOTへ統合する");
    }
    for (const name of expected.filter((name) => !actual.includes(name))) {
      add("error", "DG013", `${directory}/${name}`, "固定構成の必須ファイルが欠落");
    }
  }

  for (const directory of config.flatDirectories) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        add("error", "DG014", `${directory}/${entry.name}`, "フラット構成にサブディレクトリを作成できない");
      }
    }
  }

  // archive/review/handoffはcontent領域を含むdocs全域で禁止する。
  for (const absolute of walk(docsRoot)) {
    const file = relative(root, absolute);
    const segments = file.split("/");
    const forbiddenDir = segments.slice(1, -1).find((segment) =>
      config.naming.forbiddenDirectoryNames.some(
        (term) => segment.toLocaleLowerCase() === term.toLocaleLowerCase(),
      ),
    );
    if (forbiddenDir) {
      add("error", "DG015", file, `禁止ディレクトリを含む: ${forbiddenDir}`);
    }
  }

  const governedFiles = config.governedDirectories
    .flatMap((directory) =>
      walk(path.join(root, directory)).filter((file) => file.endsWith(".md")),
    )
    .sort();
  const titleOwners = new Map();
  const frontmatters = new Map();
  const datedPattern = new RegExp(config.naming.datedFilePattern, "i");

  for (const absolute of governedFiles) {
    const file = relative(root, absolute);
    const basename = path.basename(file);
    const text = readText(absolute);
    const frontmatter = parseFrontmatter(text);
    frontmatters.set(file, frontmatter);

    if (!frontmatter.exists) {
      add("error", "DG020", file, "frontmatterがない");
      continue;
    }
    for (const field of config.frontmatter.requiredFields) {
      if (!frontmatter.values[field]) {
        add("error", "DG021", file, `frontmatter.${field}がない`);
      }
    }
    const status = frontmatter.values.status;
    if (status && !config.frontmatter.allowedStatuses.includes(status)) {
      const inactive = config.frontmatter.inactiveStatuses.includes(status);
      add(
        "error",
        inactive ? "DG022" : "DG023",
        file,
        inactive
          ? `完了・廃止状態(${status})の文書を残さずGit履歴へ移す`
          : `未許可のstatus: ${status}`,
      );
    }
    const updated = frontmatter.values.updated;
    if (updated) {
      if (!isIsoDate(updated)) {
        add("error", "DG024", file, `updatedがYYYY-MM-DDではない: ${updated}`);
      } else if (daysBetween(now, updated) > 0) {
        add("error", "DG025", file, `updatedが未来日: ${updated}`);
      }
    }
    const title = frontmatter.values.title;
    if (title) {
      if (titleOwners.has(title)) {
        add("error", "DG026", file, `titleが重複: ${title} (${titleOwners.get(title)})`);
      } else {
        titleOwners.set(title, file);
      }
    }
    if (datedPattern.test(basename)) {
      add("error", "DG027", file, "管理文書に日付付きファイル名を使わない。既存SSOTへ統合する");
    }
    const forbiddenTerm = config.naming.forbiddenFileTerms.find((term) =>
      basename.toLocaleLowerCase().includes(term.toLocaleLowerCase()),
    );
    if (forbiddenTerm) {
      add("error", "DG028", file, `保存禁止の一時文書名を含む: ${forbiddenTerm}`);
    }
  }

  // 鮮度は警告。構造CIを止めず、週次 --fail-on-warn で通知する。
  for (const absolute of governedFiles) {
    const file = relative(root, absolute);
    const freshness = config.freshness.find(
      (rule) => rule.file === file || (rule.pathPrefix && file.startsWith(rule.pathPrefix)),
    );
    if (!freshness) continue;
    const updated = frontmatters.get(file)?.values.updated;
    if (!updated || !/^\d{4}-\d{2}-\d{2}$/.test(updated)) continue;
    const age = daysBetween(updated, now);
    if (age > freshness.maxAgeDays) {
      add(
        "warning",
        "DG030",
        file,
        `最終確認から${age}日。上限${freshness.maxAgeDays}日を超過`,
      );
    }
  }

  // ★パスは config から読む (2026-08-18)。ここを直書きにすると TODO の配置を変えたとき
  //   DG031/032 だけが無音で死ぬ (他は全て config 駆動なので移設に追従してしまう)。
  const monthFile = config.todo.monthFile;
  const weekFile = config.todo.weekFile;
  const expectedMonth = now.slice(0, 7);
  const expectedWeek = isoWeek(now);
  const actualMonth = frontmatters.get(monthFile)?.values.month;
  const actualWeek = frontmatters.get(weekFile)?.values.week;
  if (actualMonth && actualMonth !== expectedMonth) {
    add("warning", "DG031", monthFile, `monthが現在月でない: ${actualMonth} (現在 ${expectedMonth})`);
  }
  if (actualWeek && actualWeek !== expectedWeek) {
    add("warning", "DG032", weekFile, `weekが現在週でない: ${actualWeek} (現在 ${expectedWeek})`);
  }

  // 実装計画: 命名、backlog参照、INDEX生成ブロック
  const planPattern = new RegExp(config.naming.implementationPlanPattern);
  const plans = getImplementationPlans(root, config);
  const todoCorpus = config.todo.files.map((file) => readText(path.join(root, file))).join("\n");
  for (const plan of plans) {
    if (!planPattern.test(plan.name)) {
      add("error", "DG040", plan.file, "実装計画のファイル名がNN_日本語名.md形式ではない");
    }
    if (config.implementationPlans.requiredRelatedBacklog && !plan.relatedBacklog) {
      add("error", "DG041", plan.file, "activeな実装計画にrelated_backlogがない");
    } else if (plan.relatedBacklog && !todoCorpus.includes(plan.relatedBacklog)) {
      add("error", "DG042", plan.file, `related_backlogがTODOに存在しない: ${plan.relatedBacklog}`);
    }
  }
  const indexText = readText(path.join(root, config.implementationPlans.index));
  const expectedBlock = renderImplementationPlanBlock(root, config);
  if (!indexText.includes(expectedBlock)) {
    add(
      "error",
      "DG043",
      config.implementationPlans.index,
      "active実装計画一覧が実ファイルと不一致。npm run docs:fixを実行する",
    );
  }

  // TODO定義ID。現在計画内の参照は定義として数えない。
  const todoDefinitions = [];
  const improvementFile = config.todo.files[0];
  const improvementText = readText(path.join(root, improvementFile));
  let inImprovementTable = false;
  for (const line of improvementText.split(/\r?\n/)) {
    if (/^\|\s*ID\s*\|/.test(line)) {
      inImprovementTable = true;
      continue;
    }
    if (inImprovementTable && line.trim() === "") {
      inImprovementTable = false;
      continue;
    }
    if (!inImprovementTable || /^\|\s*:?-+/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 6) {
      add("error", "DG049", improvementFile, `改善TODO表は6列必須: ${line.trim()}`);
      continue;
    }
    const [id, title, status, due, owner, metric] = cells;
    todoDefinitions.push({ id, file: improvementFile });
    if (!new RegExp(config.todo.idPattern).test(id)) {
      add("error", "DG050", improvementFile, `TODO ID形式が不正: ${id}`);
    }
    if (!title || !owner || !metric) {
      add("error", "DG051", improvementFile, `${id}のタイトル・Owner・Metricのいずれかが空`);
    }
    if (!config.todo.allowedImprovementStatuses.includes(status)) {
      add("error", "DG052", improvementFile, `${id}のStatusが未許可: ${status}`);
    }
    if (!isIsoDate(due)) {
      add("error", "DG053", improvementFile, `${id}のDueがYYYY-MM-DDではない: ${due}`);
    } else if (daysBetween(due, now) > 0) {
      add("warning", "DG054", improvementFile, `${id}のDue超過: ${due}`);
    }
  }

  // カード型バックログ (v3-unified)。構文・語彙の正典は .claude/rules/todo-standards.md、
  // パーサは backlog-lib.cjs が唯一の実装 (admin / backlog-loop と同じものを使う)。
  // パースは寛容・リントは厳格: 未知タグキーや語彙外の値はここで error にする。
  // 分類待ち (タグ・実行・種類の欠落) は**ファイル単位の集計 warning** に畳む —
  // カードごとに warning を出すと移行直後に数十行が並び、週次 --fail-on-warn の
  // 信号 (Due 超過等) が埋もれるため。
  for (const todoFile of config.todo.files.slice(1)) {
    const text = readText(path.join(root, todoFile));
    const cards = backlogLib.parseBacklog(text);

    for (const orphan of backlogLib.findOrphanHeadings(text)) {
      add(
        "error",
        "DG055",
        todoFile,
        `tierセクション外の見出しはカードにならない (L${orphan.line}: ${orphan.title})`,
      );
    }

    let untagged = 0;
    let noExecutor = 0;
    let noKind = 0;
    let noId = 0;
    for (const card of cards) {
      if (card.id) {
        todoDefinitions.push({ id: card.id, file: todoFile });
        if (!new RegExp(config.todo.idPattern).test(card.id)) {
          add("error", "DG050", todoFile, `TODO ID形式が不正: ${card.id}`);
        }
      } else {
        noId += 1;
      }
      const label = card.id ?? `L${card.line} ${card.title}`;
      for (const unknown of card.unknownKeys) {
        add("error", "DG056", todoFile, `${label}のタグキーが語彙外: [${unknown.raw}]`);
      }
      if (card.executor && !backlogLib.EXECUTORS.includes(card.executor)) {
        add("error", "DG057", todoFile, `${label}の実行が語彙外: ${card.executor}`);
      }
      if (card.kind && !backlogLib.KINDS.includes(card.kind)) {
        add("error", "DG057", todoFile, `${label}の種類が語彙外: ${card.kind}`);
      }
      for (const category of card.unknownCategories) {
        add("error", "DG057", todoFile, `${label}のカテゴリが語彙外: ${category}`);
      }
      if (!card.hasTagLine) untagged += 1;
      else if (!card.executor) noExecutor += 1;
      if (!card.kind) noKind += 1;
    }

    const pending = untagged + noExecutor;
    if (pending > 0 || noId > 0) {
      add(
        "warning",
        "DG058",
        todoFile,
        `分類待ち ${pending} 件 (タグ行なし ${untagged} / 実行なし ${noExecutor} / ID なし ${noId}) — todo-curator が漸次付与する`,
      );
    }
    if (noKind > 0) {
      add("warning", "DG059", todoFile, `種類なし ${noKind} 件 / 全 ${cards.length} カード`);
    }
  }

  const definitionOwners = new Map();
  for (const definition of todoDefinitions) {
    if (definitionOwners.has(definition.id)) {
      add(
        "error",
        "DG060",
        definition.file,
        `TODO IDが重複: ${definition.id} (${definitionOwners.get(definition.id)})`,
      );
    } else {
      definitionOwners.set(definition.id, definition.file);
    }
  }

  findings.sort((a, b) =>
    `${a.level}:${a.code}:${a.file}:${a.message}`.localeCompare(
      `${b.level}:${b.code}:${b.file}:${b.message}`,
      "ja",
    ),
  );
  return {
    version: 1,
    policyDocument: config.policyDocument,
    checkedAt: now,
    governedFiles: governedFiles.length,
    todoDefinitions: todoDefinitions.length,
    implementationPlans: plans.length,
    errors: findings.filter((item) => item.level === "error"),
    warnings: findings.filter((item) => item.level === "warning"),
    findings,
  };
}

function printReport(report) {
  if (report.findings.length === 0) {
    console.log(
      `✓ docs governance OK — ${report.governedFiles} docs / ${report.todoDefinitions} TODO / ${report.implementationPlans} plans`,
    );
    return;
  }
  for (const item of report.findings) {
    const prefix = item.level === "error" ? "✗" : "⚠";
    const stream = item.level === "error" ? console.error : console.warn;
    stream(`${prefix} [${item.code}] ${item.file}: ${item.message}`);
  }
  const summary =
    `docs governance — errors ${report.errors.length} / warnings ${report.warnings.length} / ` +
    `${report.governedFiles} docs`;
  if (report.errors.length) console.error(summary);
  else console.warn(summary);
}

function main() {
  const args = process.argv.slice(2);
  const root = DEFAULT_ROOT;
  let config;
  try {
    config = loadConfig(root);
  } catch (error) {
    console.error(`✗ docs governance configを読めない: ${String(error)}`);
    process.exit(2);
  }

  if (args.includes("--fix")) {
    try {
      const changed = fixImplementationPlanIndex(root, config);
      console.log(changed ? "✓ 実装計画INDEXを再生成" : "✓ 実装計画INDEXは最新");
    } catch (error) {
      console.error(`✗ docs自動修正に失敗: ${String(error)}`);
      process.exit(2);
    }
  }

  const report = inspectRepository({ root, config });
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else printReport(report);

  const fail =
    report.errors.length > 0 ||
    (args.includes("--fail-on-warn") && report.warnings.length > 0);
  process.exit(fail ? 1 : 0);
}

if (require.main === module) main();

module.exports = {
  dateAtJst,
  fixImplementationPlanIndex,
  inspectRepository,
  isIsoDate,
  isoWeek,
  loadConfig,
  parseFrontmatter,
  renderImplementationPlanBlock,
};
