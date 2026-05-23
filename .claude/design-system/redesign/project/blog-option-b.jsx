/* Blog Option B — TOC + デュアル・サイドバー
   左に目次 + 共有 / 著者情報 / 進捗バー
   中央に記事本文
   右に関連ランキング・関連記事・書籍・広告
   長文記事の回遊性を最大化 */

function BlogOptionB() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" },
          { label: "人口・世帯" }, { label: ARTICLE.title, current: true },
        ]} />
      </div>

      <div style={{
        padding: "16px 24px",
        display: "grid",
        gridTemplateColumns: "220px 1fr 280px",
        gap: 20,
        alignItems: "flex-start",
      }}>
        {/* ★ Left rail: TOC + author + share */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Reading progress */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>読書の進捗</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>34%</span>
            </div>
            <div className="reading-progress"><div style={{ width: "34%" }} /></div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>残り約4分 · 全{ARTICLE.readingMinutes}分</div>
          </div>

          {/* TOC */}
          <div className="card">
            <div style={{
              padding: "10px 12px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {React.cloneElement(Icons.Table, { className: "icon icon-sm" })}
              <div className="h3">目次</div>
            </div>
            <nav className="toc" style={{ padding: 6 }}>
              {ARTICLE.toc.map((t, i) => (
                <a key={t.id} href={t.anchor} className={(i === 2 ? "active " : "") + "depth-" + t.depth}>
                  {t.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Author */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="author-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>編</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{ARTICLE.author}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>監修: {ARTICLE.reviewedBy}</div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              人口統計を中心に47都道府県のデータを発信。データの一次出典確認を徹底しています。
            </div>
          </div>

          {/* Sticky share */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="div-label" style={{ fontSize: 10 }}>この記事を</div>
            <button className="btn" style={{ justifyContent: "center" }}>
              {React.cloneElement(Icons.Share, { className: "icon" })} 共有する
            </button>
            <button className="btn" style={{ justifyContent: "center" }}>
              {React.cloneElement(Icons.Bookmark, { className: "icon" })} あとで読む
            </button>
            <button className="btn" style={{ justifyContent: "center" }}>
              {React.cloneElement(Icons.Mail, { className: "icon" })} メルマガ登録
            </button>
          </div>
        </aside>

        {/* Center article */}
        <main>
          <article className="card" style={{ padding: "32px 36px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              <span className="pill primary">{ARTICLE.category}</span>
              {ARTICLE.tags.map((t) => <Tag key={t}>{t}</Tag>)}
            </div>

            <h1 style={{
              fontSize: 30, lineHeight: 1.4, fontWeight: 800,
              letterSpacing: "-0.01em", margin: "0 0 12px",
            }}>{ARTICLE.title}</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.7 }}>
              {ARTICLE.subtitle}
            </p>
            <MetaRow>
              <MetaItem icon={Icons.Calendar}>公開 {ARTICLE.publishedAt}</MetaItem>
              <MetaItem icon={Icons.Trend}>更新 {ARTICLE.updatedAt}</MetaItem>
            </MetaRow>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "20px 0 8px" }} />

            <ArticleBody />

            {/* Inline ranking CTA inside article body */}
            <div className="rk-cta" style={{ margin: "12px 0 24px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "var(--primary)", color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {React.cloneElement(Icons.Trend, { className: "icon icon-lg" })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>都道府県別「総人口」ランキングを見る</div>
                <div className="muted" style={{ fontSize: 11.5 }}>47都道府県を地図・表で比較 · CSVダウンロード可</div>
              </div>
              <a href="#" className="btn btn-primary btn-sm">ランキングへ →</a>
            </div>
          </article>
        </main>

        {/* Right sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
          <RelatedRankingsCard items={ARTICLE.relatedRankings} />

          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="h3">関連書籍</div>
                <span className="pill">PR</span>
              </div>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {ARTICLE.books.map((b, i) => <BookCard key={i} book={b} compact />)}
            </div>
          </div>

          <RelatedArticlesCompact articles={ARTICLE.related} />

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>
    </div>
  );
}

window.BlogOptionB = BlogOptionB;
