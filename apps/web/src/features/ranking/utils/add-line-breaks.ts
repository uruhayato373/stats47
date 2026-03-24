/** 「。」の後に改行がなければ挿入する（Markdown の段落分割補助） */
export function addLineBreaksAfterPeriod(text: string): string {
  return text.replace(/。(?!\n)/g, "。\n");
}
