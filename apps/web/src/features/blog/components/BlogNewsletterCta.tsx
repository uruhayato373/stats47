import { Mail } from "lucide-react";

export function BlogNewsletterCta() {
  return (
    <section className="rounded-none border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Mail size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary">新着ランキング &amp; 記事を毎週お届け</p>
          <p className="text-xs text-muted-foreground mt-1">
            47都道府県のデータが更新されたら、まずメールで。いつでも解除可能。
          </p>
        </div>
        <a
          href="https://stats47.jp/about"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          詳細を見る
        </a>
      </div>
    </section>
  );
}
