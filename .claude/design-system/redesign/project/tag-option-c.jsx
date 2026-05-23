/* Tag Option C — タイムライン・アーカイブ (Editorial)
   - 時系列で記事を整理 (年月でグルーピング)
   - 編集部のアーカイブ風
   - サイドにタグメタ・関連タグクラウド */

function TagOptionC() {
  // group articles by month
  const grouped = TAG_ARTICLES.reduce((acc, a) => {
    const key = a.date.slice(0, 7); // YYYY-MM
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" }, { label: "タグ一覧" },
          { label: TAG.name, current: true },
        ]} />
      </div>

      <header style={{ padding: "12px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="eyebrow" style={{ color: "var(--primary)" }}>タグ・アーカイブ</div>
          <h1 style={{
            fontSize: 42, fontWeight: 800, margin: "6px 0 8px",
            letterSpacing: "-0.02em",
            display: "inline-flex", alignItems: "baseline", gap: 4,
          }}>
            <span style={{ color: "var(--muted)", fontSize: 26, fontWeight: 600 }}>#</span>
            {TAG.name}
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.65, maxWidth: 720 }}>
            {TAG.description}
          </p>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
            <span>📝 {TAG.articleCount}件の記事</span>
            <span>📅 {Object.keys(grouped).length}ヶ月分</span>
            <span>👁 累計 {TAG.totalReads.toLocaleString()}閲覧</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 24px", display: "grid", gridTemplateColumns: "200px 1fr 240px", gap: 24, alignItems: "flex-start" }}>
        {/* Left: month nav */}
        <aside style={{ position: "sticky", top: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>アーカイブ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Object.keys(grouped).sort().reverse().map((m, i) => (
              <a key={m} href={`#${m}`} style={{
                padding: "6px 10px", borderRadius: 6,
                fontSize: 12, color: i === 0 ? "var(--primary)" : "var(--fg-2)",
                fontWeight: i === 0 ? 700 : 500,
                background: i === 0 ? "var(--primary-50)" : "transparent",
                borderLeft: `2px solid ${i === 0 ? "var(--primary)" : "transparent"}`,
                textDecoration: "none",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>{m.slice(0, 4)}年{m.slice(5, 7)}月</span>
                <span className="muted" style={{ fontSize: 11 }}>{grouped[m].length}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Center: timeline articles */}
        <main style={{ minWidth: 0 }}>
          {Object.keys(grouped).sort().reverse().map(m => (
            <section key={m} id={m} style={{ marginBottom: 28 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                paddingBottom: 8, borderBottom: "2px solid var(--primary)",
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {m.slice(0, 4)}年{m.slice(5, 7)}月
                </h2>
                <span className="muted" style={{ fontSize: 12 }}>{grouped[m].length}件</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {grouped[m].map(a => (
                  <a key={a.slug} href="#" className="card" style={{
                    padding: 0, textDecoration: "none", color: "var(--fg)",
                    display: "grid", gridTemplateColumns: "200px 1fr", overflow: "hidden",
                    minHeight: 130,
                  }}>
                    <div style={{ background: a.thumb }} />
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="pill primary">{a.category}</span>
                        <span className="muted" style={{ fontSize: 11 }}>{a.date}</span>
                        <span className="muted" style={{ fontSize: 11 }}>· {a.readMinutes}分</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
                      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        2024年データで読み解く、47都道府県の人口動態と地方の人口減少を多角的に分析…
                      </p>
                      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {a.tags.filter(t => t !== TAG.name).slice(0, 2).map(t => <Tag key={t}>{t}</Tag>)}
                        </div>
                        <span className="muted" style={{ fontSize: 11 }}>👁 {a.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* Right: meta */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>このタグについて</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
              <div className="between"><span className="muted">記事数</span><span className="mono" style={{ fontWeight: 700 }}>{TAG.articleCount}</span></div>
              <div className="between"><span className="muted">累計閲覧</span><span className="mono" style={{ fontWeight: 700 }}>{TAG.totalReads.toLocaleString()}</span></div>
              <div className="between"><span className="muted">フォロワー</span><span className="mono" style={{ fontWeight: 700 }}>{TAG.followers}</span></div>
              <div className="between"><span className="muted">初回投稿</span><span className="mono" style={{ fontSize: 11 }}>2024-12-08</span></div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
              フォローする
            </button>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">関連タグ</div>
            </div>
            <div style={{ padding: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {TAG.relatedTags.map(t => (
                <a key={t.name} href="#" style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 999,
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  color: "var(--fg-2)", textDecoration: "none",
                }}>#{t.name} <span className="muted" style={{ fontSize: 10 }}>{t.count}</span></a>
              ))}
            </div>
          </div>

          <RelatedRankingsCard items={TAG.relatedRankings} />
        </aside>
      </div>
    </div>
  );
}

window.TagOptionC = TagOptionC;
