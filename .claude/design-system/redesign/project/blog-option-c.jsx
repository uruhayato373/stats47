/* Blog Option C — マガジン・スタイル (Editorial)
   フルブリードのヒーロー (featured image + メタ情報 overlay)
   本文に drop cap / ランキング CTA を散らす
   末尾に「もっと読む」3カラムグリッド */

function BlogOptionC() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      {/* Hero — full bleed */}
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" },
          { label: "人口・世帯" }, { label: ARTICLE.title, current: true },
        ]} />
      </div>

      <header style={{ padding: "20px 32px 0", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <span className="pill primary">{ARTICLE.category}</span>
          {ARTICLE.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
        <h1 style={{
          fontSize: 42, lineHeight: 1.3, fontWeight: 800,
          letterSpacing: "-0.015em", margin: "0 0 14px",
          maxWidth: 880,
        }}>{ARTICLE.title}</h1>
        <p style={{
          fontSize: 17, color: "var(--fg-2)",
          lineHeight: 1.7, margin: "0 0 18px",
          maxWidth: 820,
        }}>{ARTICLE.subtitle}</p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <MetaRow>
            <span className="author-pill">
              <span className="author-avatar">編</span>
              <span style={{ fontWeight: 500, color: "var(--fg-2)" }}>{ARTICLE.author}</span>
            </span>
            <MetaItem icon={Icons.Calendar}>{ARTICLE.publishedAt}</MetaItem>
            <MetaItem icon={Icons.Trend}>読了 約{ARTICLE.readingMinutes}分</MetaItem>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>監修: {ARTICLE.reviewedBy}</span>
          </MetaRow>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm">𝕏 でシェア</button>
            <button className="btn btn-sm">LINE</button>
          </div>
        </div>
      </header>

      {/* Hero image */}
      <div style={{ padding: "24px 32px 0", maxWidth: 1080, margin: "0 auto" }}>
        <div className="hero-img" style={{ height: 320, position: "relative" }}>
          <div style={{
            position: "absolute", left: 24, bottom: 20, color: "#fff",
            fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85,
          }}>Figure / 2024年・都道府県別総人口</div>
          {/* mini overlay chart */}
          <svg viewBox="0 0 600 240" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            {[
              [80, 1401, "東京"], [130, 924, "神奈川"], [180, 878, "大阪"], [230, 749, "愛知"], [280, 733, "埼玉"], [330, 628, "千葉"], [380, 540, "兵庫"], [430, 518, "北海道"], [480, 512, "福岡"],
            ].map(([x, v, n], i) => (
              <g key={i}>
                <rect x={x - 12} y={240 - v / 7} width={24} height={v / 7} fill="rgba(255,255,255,0.85)" rx="2" />
                <text x={x} y={240 - v / 7 - 6} textAnchor="middle" fontSize="9" fill="#fff" opacity="0.9">{n}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Two-column: article + right sidebar */}
      <div style={{
        padding: "32px 32px 24px", maxWidth: 1240, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 280px", gap: 36, alignItems: "flex-start",
      }}>
        <main>
          <div className="dropcap">
            <ArticleBody />
          </div>

          {/* Inline ranking CTA after body */}
          <div style={{
            margin: "12px 0 28px",
            padding: 20,
            border: "1px solid var(--border)",
            borderRadius: 14,
            background: "linear-gradient(135deg, #0b1220, #1e293b)",
            color: "#fff",
            display: "flex", alignItems: "center", gap: 18,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: "rgba(255,255,255,0.1)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.2)",
              flexShrink: 0,
            }}>
              {React.cloneElement(Icons.Trend, { className: "icon icon-lg", style: { width: 28, height: 28 } })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>もっと深掘り</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>記事中のデータをインタラクティブに比較</div>
              <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 4 }}>47都道府県の総人口を地図と表で · CSV ダウンロード対応</div>
            </div>
            <a href="#" className="btn" style={{
              background: "#fff", color: "#0b1220",
              fontWeight: 700, padding: "10px 18px",
            }}>ランキングを開く →</a>
          </div>

          {/* Author bio block */}
          <div style={{
            border: "1px solid var(--border)", borderRadius: 12,
            padding: 20, display: "flex", gap: 16,
            background: "var(--bg-subtle)",
          }}>
            <div className="author-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>編</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>この記事の執筆者</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{ARTICLE.author}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.65 }}>
                人口・世帯を中心に47都道府県のデータを発信。一次出典の確認と独自の可視化を徹底しています。監修：{ARTICLE.reviewedBy}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <a href="#" className="btn btn-sm">プロフィール</a>
                <a href="#" className="btn btn-sm">この著者の記事</a>
              </div>
            </div>
          </div>

          {/* "もっと読む" magazine grid */}
          <div style={{ marginTop: 32 }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">この記事を読んだ人はこちらも</div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>すべて見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {ARTICLE.related.slice(0, 3).map((a, i) => (
                <a key={a.slug} href="#" style={{
                  textDecoration: "none", color: "var(--fg)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{
                    height: 140, borderRadius: 10,
                    background: [
                      "linear-gradient(135deg, #fef3c7, #f59e0b)",
                      "linear-gradient(135deg, #dbeafe, #1d4ed8)",
                      "linear-gradient(135deg, #fce7f3, #ec4899)",
                    ][i],
                    position: "relative", overflow: "hidden",
                  }}>
                    <span style={{
                      position: "absolute", top: 10, left: 10,
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      background: "rgba(255,255,255,0.9)", borderRadius: 999,
                    }}>{a.tags[0]}</span>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700, lineHeight: 1.4,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.date}</div>
                </a>
              ))}
            </div>
          </div>
        </main>

        {/* Lean right sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
          <div className="card">
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
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

          <RelatedRankingsCard items={ARTICLE.relatedRankings} />

          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="h3">読者の推薦書籍</div>
                <span className="pill">PR</span>
              </div>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {ARTICLE.books.slice(0, 2).map((b, i) => <BookCard key={i} book={b} compact />)}
            </div>
          </div>

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>
        </aside>
      </div>
    </div>
  );
}

window.BlogOptionC = BlogOptionC;
