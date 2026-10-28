/**
 * 呼び出し側の className のうち、部品の lyra に負けて効いていないクラスを見つける (lyra-dead-caller-class)。
 *
 * なぜ要るか: テンプレート (lyra) の部品は、lyra の値を呼び出し側の className より後ろで合成する
 * (scripts/ui-theme/inline-lyra.mjs)。そのため lyra と同じ性質を決める呼び出し側のクラス
 * (TableHead の text-right、Button の h-11、Skeleton の rounded-md など) は ! が無いと効かない。
 * 2026-10-28 の洗い出しで約 210 件あり、表の数値列の見出しが左寄せのまま・共有ボタンのブランド色が
 * 出ないなどの不具合になっていた (LYRA-DEAD-CALLER-CLASSES-01)。
 * 効かせたいなら ! を付け、要らないなら消す。ボタンの大きさは ! で上書きせず size を選ぶ
 * (button-no-forced-size)。
 *
 * 読む範囲: 部品 (packages/components/src/atoms/ui) の `/* lyra *\/ "…"` と `<名前>Lyra = cva(…)`、
 * 書き出された `xVariants({ className })`、className を部品へそのまま渡す包み (ChartPanel など 1〜2 段)。
 * 呼び出し側は JSX の最上位の className (文字列・cn(…)・同じファイルの文字列定数) と、
 * variant / size の文字列リテラルだけを見る。別ファイルの定数 (*.palette.ts など) は追わない。
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { losesToLyra } from '../../../../scripts/ui-theme/inline-lyra.mjs';

const VARIANT_PROP = /(variant|size|orientation|side)(?:=|\s*:\s*)["']([^"']+)["']/g;
const IMPORT = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
const ATOM_IMPORT_SOURCE = /@stats47\/components|atoms\/ui/;

/** text[open] が ( / { / [ のとき、対応する閉じ括弧の位置 (文字列とコメントを飛ばす) */
function matchClose(text, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const stack = [pairs[text[open]]];
  let i = open + 1;
  while (i < text.length && stack.length > 0) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i += 1;
      while (i < text.length && text[i] !== ch) i += text[i] === '\\' ? 2 : 1;
      i += 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i) + 2;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i);
      continue;
    }
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === stack[stack.length - 1]) stack.pop();
    i += 1;
  }
  return i - 1;
}

/** cva(base, { variants, defaultVariants }) の写し (lyra の cva は compoundVariants を持たない) */
function miniCva(base, config = {}) {
  return (props = {}) => {
    const out = [base];
    for (const [key, values] of Object.entries(config.variants ?? {})) {
      const chosen = props[key] ?? config.defaultVariants?.[key];
      if (chosen != null && values[chosen]) out.push(values[chosen]);
    }
    return out.join(' ');
  };
}

/** 部品の名前 → (variant などの props) => lyra のクラス列 */
export function buildLyraMap(atomsDir) {
  const map = new Map();
  for (const file of readdirSync(atomsDir)) {
    if (!file.endsWith('.tsx')) continue;
    const text = readFileSync(path.join(atomsDir, file), 'utf8');
    const lyraCva = new Map();
    for (const m of text.matchAll(/const (\w+Lyra) = cva\(/g)) {
      const open = m.index + m[0].length - 1;
      lyraCva.set(m[1], new Function('cva', `return cva${text.slice(open, matchClose(text, open) + 1)}`)(miniCva));
    }
    const wrappers = new Map();
    for (const m of text.matchAll(/function (\w+Variants)\([^)]*\)[^{]*\{[^}]*?(\w+Lyra)\(/g)) {
      if (lyraCva.has(m[2])) wrappers.set(m[1], lyraCva.get(m[2]));
    }
    const funcs = [...text.matchAll(/^(?:export )?function ([A-Z]\w*)\(/gm)];
    funcs.forEach((m, k) => {
      const body = text.slice(m.index, k + 1 < funcs.length ? funcs[k + 1].index : text.length);
      for (const c of body.matchAll(/(?<![\w.])cn\(/g)) {
        const open = c.index + 2;
        const args = body.slice(open + 1, matchClose(body, open));
        if (!/(^|[,\s])className\s*(,|$)/m.test(args.replace(/\/\* lyra \*\/ "[^"]*"/, ''))) continue;
        const literal = /\/\* lyra \*\/ "([^"]*)"/.exec(args);
        if (literal) {
          map.set(m[1], () => literal[1]);
          return;
        }
        const viaCva = /(\w+Lyra)\(/.exec(args);
        if (viaCva && lyraCva.has(viaCva[1])) {
          map.set(m[1], lyraCva.get(viaCva[1]));
          return;
        }
      }
      const viaWrapper = /(\w+Variants)\(\{[^}]*className/.exec(body);
      if (viaWrapper && wrappers.has(viaWrapper[1])) map.set(m[1], wrappers.get(viaWrapper[1]));
    });
    for (const [name, fn] of wrappers) map.set(`fn:${name}`, fn);
  }
  return map;
}

const stringsIn = (expr) =>
  [...expr.matchAll(/"([^"\n\\]*)"|'([^'\n\\]*)'|`([^`$\\]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]);

/** 部品の使用箇所ごとに { name, index, tag, tagMasked, classExpr } を返す */
function usages(text, map, wrapperNames) {
  const imported = [];
  for (const m of text.matchAll(IMPORT)) {
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if (!orig || (!ATOM_IMPORT_SOURCE.test(m[2]) && !wrapperNames.has(orig))) continue;
      if (map.has(orig)) imported.push([orig, alias ?? orig]);
      if (map.has(`fn:${orig}`)) imported.push([`fn:${orig}`, alias ?? orig]);
    }
  }
  const found = [];
  for (const [name, local] of imported) {
    const isFn = name.startsWith('fn:');
    const re = isFn ? new RegExp(`(?<![\\w.])${local}\\(`, 'g') : new RegExp(`<${local}(?=[\\s>/])`, 'g');
    for (const m of text.matchAll(re)) {
      let tag;
      let tagMasked;
      let classExpr = null;
      if (isFn) {
        const open = m.index + m[0].length - 1;
        tag = text.slice(open, matchClose(text, open) + 1);
        tagMasked = tag;
        const cm = /className\s*:\s*/.exec(tag);
        if (cm) {
          const s = cm.index + cm[0].length;
          let i = s;
          let depth = 0;
          while (i < tag.length) {
            const ch = tag[i];
            if (ch === '"' || ch === "'") i = tag.indexOf(ch, i + 1);
            else if ('({['.includes(ch)) depth += 1;
            else if (')}]'.includes(ch)) {
              if (depth === 0) break;
              depth -= 1;
            } else if (ch === ',' && depth === 0) break;
            i += 1;
          }
          classExpr = tag.slice(s, i);
        }
      } else {
        let i = m.index + m[0].length;
        while (i < text.length && text[i] !== '>') {
          if (text[i] === '{') i = matchClose(text, i) + 1;
          else if (text[i] === '"') i = text.indexOf('"', i + 1) + 1;
          else i += 1;
        }
        tag = text.slice(m.index, i + 1);
        // 属性の中の JSX (action={<Link className=…>}) は部品自身の属性ではないので伏せる
        tagMasked = '';
        let depth = 0;
        for (let j = 0; j < tag.length; j += 1) {
          const ch = tag[j];
          if (ch === '"' && depth === 0) {
            const end = tag.indexOf('"', j + 1);
            tagMasked += tag.slice(j, end + 1);
            j = end;
            continue;
          }
          if (ch === '}') depth -= 1;
          tagMasked += depth > 0 ? ' ' : ch;
          if (ch === '{') depth += 1;
        }
        const cm = /\sclassName=/.exec(tagMasked);
        if (cm) {
          const s = cm.index + cm[0].length;
          classExpr = tag[s] === '{' ? tag.slice(s, matchClose(tag, s) + 1) : tag.slice(s, tag.indexOf('"', s + 1) + 1);
        }
      }
      if (classExpr) found.push({ name, index: m.index, tagMasked, classExpr });
    }
  }
  return found;
}

const propsOf = (tagMasked) => Object.fromEntries([...tagMasked.matchAll(VARIANT_PROP)].map((m) => [m[1], m[2]]));

/**
 * className を部品へそのまま渡す包み (function ChartPanel({ className }) { return <Card className={cn(…, className)} /> })
 * を map に足す。包みの包みも拾うため 2 回回す。
 */
export function addWrappers(map, sources) {
  const wrapperNames = new Set();
  for (let pass = 0; pass < 2; pass += 1) {
    for (const text of sources) {
      for (const use of usages(text, map, wrapperNames)) {
        if (!/(?<![\w."'])className(?![\w"'])/.test(use.classExpr.replace(/className\s*:/g, ''))) continue;
        const owners = [...text.slice(0, use.index).matchAll(/(?:function\s+([A-Z]\w*)\s*[(<]|const\s+([A-Z]\w*)\s*[:=])/g)];
        const last = owners[owners.length - 1];
        const owner = last && (last[1] ?? last[2]);
        if (!owner || map.has(owner)) continue;
        const fixed = propsOf(use.tagMasked);
        const inner = map.get(use.name);
        map.set(owner, (props) => inner({ ...props, ...fixed }));
        wrapperNames.add(owner);
      }
    }
  }
  return wrapperNames;
}

/** 1 ファイルの違反: { lineNumber, component, token } */
export function findLyraDeadCallerClasses(text, map, wrapperNames = new Set()) {
  const constants = [...text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*("[^"\n]*"|'[^'\n]*'|`[^`$\n]*`)/g)];
  const violations = [];
  for (const use of usages(text, map, wrapperNames)) {
    const lyraTokens = map.get(use.name)(propsOf(use.tagMasked)).split(/\s+/).filter(Boolean);
    const extra = constants
      .filter((c) => new RegExp(`(?<![\\w.])${c[1]}(?!\\w)`).test(use.classExpr))
      .map((c) => c[2])
      .join(' ');
    const tokens = new Set(stringsIn(`${use.classExpr} ${extra}`).flatMap((s) => s.split(/\s+/)).filter(Boolean));
    for (const token of tokens) {
      if (!losesToLyra(token, lyraTokens)) continue;
      violations.push({
        lineNumber: text.slice(0, use.index).split('\n').length,
        component: use.name.replace(/^fn:/, ''),
        token,
      });
    }
  }
  return violations;
}
