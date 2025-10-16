import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Frontmatter {
  title: string;
  created: string;
  updated: string;
  tags: string[];
}

function extractTitle(content: string, filename: string): string {
  // H1見出しから抽出
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];
  
  // ファイル名から生成
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

function generateTags(filePath: string): string[] {
  const tags: string[] = [];
  const relativePath = path.relative('docs', filePath);
  const parts = relativePath.split(path.sep);
  
  // ディレクトリベースのタグ
  if (parts[0].startsWith('00_')) tags.push('project-overview');
  if (parts[0].startsWith('01_')) tags.push('development-guide');
  if (parts[0].startsWith('02_domain')) {
    tags.push(`domain/${parts[1]}`);
    if (parts[2]) tags.push(parts[2]); // specifications, implementation等
  }
  if (parts[0].startsWith('03_')) tags.push('features');
  if (parts[0].startsWith('04_')) tags.push('content-planning');
  if (parts[0].startsWith('05_')) tags.push('resources');
  if (parts[0].startsWith('99_')) tags.push('inbox', 'draft');
  
  return tags;
}

function getFileDate(filePath: string, type: 'created' | 'updated'): string {
  try {
    if (type === 'created') {
      // Gitのファイル作成日を取得
      const date = execSync(
        `git log --diff-filter=A --follow --format=%aI -- "${filePath}" | tail -1`,
        { encoding: 'utf-8' }
      ).trim();
      return date ? date.split('T')[0] : '2024-10-14';
    } else {
      // Gitの最終更新日を取得
      const date = execSync(
        `git log -1 --format=%aI -- "${filePath}"`,
        { encoding: 'utf-8' }
      ).trim();
      return date ? date.split('T')[0] : '2024-10-14';
    }
  } catch {
    return '2024-10-14';
  }
}

function hasFrontmatter(content: string): boolean {
  return content.trim().startsWith('---');
}

function addFrontmatter(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 既にフロントマターがある場合はスキップ
  if (hasFrontmatter(content)) {
    console.log(`⏭️  Skipped (already has frontmatter): ${filePath}`);
    return;
  }
  
  const filename = path.basename(filePath);
  const title = extractTitle(content, filename);
  const created = getFileDate(filePath, 'created');
  const updated = getFileDate(filePath, 'updated');
  const tags = generateTags(filePath);
  
  const frontmatter = `---
title: ${title}
created: ${created}
updated: ${updated}
tags:
${tags.map(tag => `  - ${tag}`).join('\n')}
---

`;
  
  const newContent = frontmatter + content;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Added frontmatter: ${filePath}`);
}

// メイン処理
function main() {
  const docsDir = path.join(process.cwd(), 'docs');
  const mdFiles = execSync(`find "${docsDir}" -name "*.md" -type f`, {
    encoding: 'utf-8'
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  console.log(`Found ${mdFiles.length} Markdown files\n`);
  
  mdFiles.forEach(addFrontmatter);
  
  console.log(`\n✨ Completed! Processed ${mdFiles.length} files.`);
}

main();
