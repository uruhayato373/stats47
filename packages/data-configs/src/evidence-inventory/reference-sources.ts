import type {
  InternalEvidenceAdoption,
  ReferenceSourcePolicy,
} from "./types";

/**
 * 参考文献の原本・OCR本文・数値を保持せず、候補の解決方針と生成stateだけを結ぶ authored SSOT。
 * 各itemの解決結果は source-inventory CLI がこの方針を適用して state へ決定的に生成する。
 */
export const REFERENCE_SOURCE_POLICIES = [
  {
    sourceKey: "japan-zue",
    edition: "2025-26",
    statePath:
      ".claude/state/source-inventory/japan-zue/2025-26/inventory.json",
    inputUnit: "quantitative-item",
    fallbackResolution: "primary-source-unavailable",
    fallbackReason: "直接出典を機械的に特定できないため公開候補へ進めない",
    publicOriginalReuse: "forbidden",
  },
  {
    sourceKey: "prefecture-databook",
    edition: "2021",
    statePath:
      ".claude/state/source-inventory/prefecture-databook/2021/inventory.json",
    inputUnit: "page",
    fallbackResolution: "not-applicable",
    fallbackReason: "表紙・目次・広告・重複スキャン等で公開候補ではない",
    publicOriginalReuse: "forbidden",
  },
  {
    sourceKey: "prefecture-deviation",
    edition: "2018",
    statePath:
      ".claude/state/source-inventory/prefecture-deviation/2018/inventory.json",
    inputUnit: "page",
    fallbackResolution: "rights-hold",
    fallbackReason: "書誌は確定済みだが各図表の再利用条件と一次資料照合が未確定のため全ページを公開停止",
    publicOriginalReuse: "forbidden",
  },
  {
    sourceKey: "claude-skills-guide",
    edition: "2026",
    statePath:
      ".claude/state/source-inventory/claude-skills-guide/2026/inventory.json",
    inputUnit: "page",
    fallbackResolution: "not-applicable",
    fallbackReason: "公開統計の根拠には使わず、採択した内部運用原則だけを統合する",
    publicOriginalReuse: "forbidden",
  },
] as const satisfies readonly ReferenceSourcePolicy[];

const ANTHROPIC_SKILLS_DOCS =
  "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview";

export const CLAUDE_SKILLS_GUIDE_ADOPTIONS = [
  {
    id: "progressive-disclosure",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [5],
    concept: "skill本文と必要時参照resourceを分離する段階的開示",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: ["CLAUDE.md"],
  },
  {
    id: "concrete-use-cases",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [8, 12],
    concept: "具体的な利用場面・trigger・成功結果からskillを設計する",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: [".claude/skills/dev/create-skill/SKILL.md"],
  },
  {
    id: "skill-structure-and-naming",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [10],
    concept: "SKILL.md、frontmatter、kebab-case名、任意resourceの構造契約",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: ["CLAUDE.md", ".claude/skills/dev/create-skill/SKILL.md"],
  },
  {
    id: "trigger-testing",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [15],
    concept: "肯定・言い換え・非該当のtrigger testを持つ",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: [".claude/skills/dev/audit-consistency/SKILL.md"],
  },
  {
    id: "iterative-quality-gate",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [23],
    concept: "明示した品質条件を検査し、失敗箇所だけを反復是正する",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: [".claude/skills/dev/verification-loop/SKILL.md"],
  },
  {
    id: "deterministic-critical-validation",
    sourceKey: "claude-skills-guide",
    edition: "2026",
    pages: [26],
    concept: "重要な不変条件は自然言語だけでなく決定的scriptで検証する",
    verifiedAgainst: ANTHROPIC_SKILLS_DOCS,
    mappedFiles: ["CLAUDE.md", ".claude/rules/model-prompting.md"],
  },
] as const satisfies readonly InternalEvidenceAdoption[];
