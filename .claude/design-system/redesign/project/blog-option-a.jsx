/* Blog Option A — エディトリアル・整理改善
   現行: H1が text-lg (極小) + 雑然としたサイドバー + 広告ラベルが薄い
   改善: H1 を本来の大きさへ、メタ情報を読みやすく整理、サイドバーを意味でグルーピング */

function BlogOptionA() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 32px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" },
          { label: "人口・世帯" }, { label: ARTICLE.title, current: true },
        ]} />
      </div>

      <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "flex-start" }}>
        <main>
          <article className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "32px 40px 24px" }}>
              {/* Article header */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <span className="pill primary">{ARTICLE.category}</span>
                {ARTICLE.tags.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}
              </div>

              <h1 style={{
                fontSize: 32, lineHeight: 1.35, fontWeight: 800,
                letterSpacing: "-0.01em", margin: "0 0 10px",
                color: "var(--fg)",
              }}>{ARTICLE.title}</h1>
              <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.7 }}>
                {ARTICLE.subtitle}
              </p>

              {/* Meta strip */}
              <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center",
                justifyContent: "space-between", gap: 12,
                paddingTop: 12, borderTop: "1px solid var(--border)",
              }}>
                <MetaRow>
                  <span className="author-pill">
                    <span className="author-avatar">編</span>
                    <span style={{ fontWeight: 500, color: "var(--fg-2)" }}>{ARTICLE.author}</span>
                  </span>
                  <MetaItem icon={Icons.Calendar}>{ARTICLE.publishedAt}</MetaItem>
                  <MetaItem icon={Icons.Trend}>読了 約{ARTICLE.readingMinutes}分</MetaItem>
                </MetaRow>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm">
                    {React.cloneElement(Icons.Share, { className: "icon icon-sm" })} 共有
                  </button>
                  <button className="btn btn-sm">
                    {React.cloneElement(Icons.Bookmark, { className: "icon icon-sm" })} 保存
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 40px 40px" }}>
              <ArticleBody />

              <div style={{
                marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
              }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  この記事が役に立ったらシェアしてください
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn">𝕏 でシェア</button>
                  <button className="btn">LINE</button>
                  <button className="btn">URLをコピー</button>
                </div>
              </div>
            </div>
          </article>

          {/* Inline affiliate banner */}
          <div style={{ marginTop: 20 }}>
            <div className="div-label">この記事のテーマで読む</div>
            <div style={{
              marginTop: 10,
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
            }}>
              {ARTICLE.books.map((b, i) => <BookCard key={i} book={b} />)}
            </div>
          </div>

          {/* Related articles full */}
          <div style={{ marginTop: 28 }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">関連記事</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>すべて見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {ARTICLE.related.slice(0, 3).map((a) => (
                <a key={a.slug} href="#" className="card" style={{
                  display: "block", padding: 14,
                  textDecoration: "none", color: "var(--fg)",
                }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 600, lineHeight: 1.45,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    marginBottom: 8, minHeight: 38,
                  }}>{a.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.date}</span>
                    {a.tags.slice(0, 1).map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar — grouped with clear section labels */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
          {/* Related rankings — emphasized since this is stats47 */}
          <RelatedRankingsCard items={ARTICLE.relatedRankings} />

          {/* Related articles */}
          <RelatedArticlesCompact articles={ARTICLE.related} />

          {/* Books — labeled, contained */}
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="h3">この記事に関する書籍</div>
                <span className="pill">PR</span>
              </div>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {ARTICLE.books.slice(0, 2).map((b, i) => <BookCard key={i} book={b} compact />)}
            </div>
          </div>

          {/* Ad — labeled clearly with white border separation */}
          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>
    </div>
  );
}

window.BlogOptionA = BlogOptionA;
