/* Tag Option A — 整理改善 (低リスク)
   - h1: text-lg → 32px
   - タグ統計バナー (記事数・閲覧数・関連タグ数)
   - 記事カードを強化: サムネ + 日付 + カテゴリ + タグ + 閲覧数
   - 右サイドバーに「関連タグ」「関連ランキング」 */

function TagOptionA() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" }, { label: "タグ一覧" },
          { label: TAG.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "12px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span className="pill primary">タグ</span>
        </div>
        <h1 className="h1" style={{ fontSize: 32 }}>
          # {TAG.name}
        </h1>
        <p style={{ margin: "6px 0 12px", fontSize: 14, color: "var(--muted)", maxWidth: 720, lineHeight: 1.65 }}>
          {TAG.description}
        </p>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
          <span>📝 <strong style={{ color: "var(--fg)" }}>{TAG.articleCount}</strong>件の記事</span>
          <span>👁 累計 <strong style={{ color: "var(--fg)" }}>{TAG.totalReads.toLocaleString()}</strong>閲覧</span>
          <span>🔖 関連タグ {TAG.relatedTags.length}</span>
        </div>
      </header>

      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0 }}>
          {/* Toolbar */}
          <div className="between" style={{ marginBottom: 14 }}>
            <div className="h2" style={{ fontSize: 18 }}>「{TAG.name}」の記事 <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{TAG.articleCount}件</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>新着順</option>
                <option>人気順</option>
                <option>古い順</option>
              </select>
              <button className="btn btn-sm">
                {React.cloneElement(Icons.Mail, { className: "icon icon-sm" })}
                このタグをフォロー
              </button>
            </div>
          </div>

          {/* Article grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {TAG_ARTICLES.map(a => (
              <a key={a.slug} href="#" className="card" style={{
                padding: 0, textDecoration: "none", color: "var(--fg)",
                display: "flex", flexDirection: "column", overflow: "hidden",
                transition: "all .15s",
              }}>
                <div style={{ aspectRatio: "1200/630", background: a.thumb, position: "relative" }}>
                  <span className="pill primary" style={{
                    position: "absolute", top: 8, left: 8,
                    background: "rgba(255,255,255,0.95)",
                  }}>{a.category}</span>
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, lineHeight: 1.45,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 41,
                  }}>{a.title}</div>
                  <div style={{ marginTop: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {a.tags.filter(t => t !== TAG.name).slice(0, 2).map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                    <span>{a.date} · {a.readMinutes}分</span>
                    <span>👁 {a.views.toLocaleString()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="btn">残り {TAG.articleCount - TAG_ARTICLES.length}件を表示</button>
          </div>
        </main>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div className="h3">関連タグ</div>
            </div>
            <div style={{ padding: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TAG.relatedTags.map(t => (
                <a key={t.name} href="#" style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 999,
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  fontSize: 12, color: "var(--fg-2)", textDecoration: "none",
                }}>
                  #{t.name}
                  <span className="muted" style={{ fontSize: 10 }}>{t.count}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {React.cloneElement(Icons.Trend, { className: "icon", style: { color: "var(--primary)" } })}
                <div className="h3">関連ランキング</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {TAG.relatedRankings.map(r => (
                  <a key={r.key} href="#"><span>{r.title}</span><span className="meta">{r.unit}</span></a>
                ))}
              </div>
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

window.TagOptionA = TagOptionA;
