/* Theme Option D — ストーリー型ダッシュボード + ネイティブ収益
   - 1) ヒーロー: テーマ説明 + 主要KPI 4枚 (テーマを"物語る"数字)
   - 2) 指標選択 (compact)
   - 3) 地図 + 都道府県カード (詳細)
   - 4) ネイティブ・アフィリエイト (テーマ別書籍)
   - 5) 関連記事 + メルマガ CTA
   - 6) CSV ダウンロード セクション (Data Pack 訴求)
   - 7) AdSense  */

function ThemeOptionD() {
  const [selectedIndicator, setSelectedIndicator] = React.useState("aging-rate");
  const [normalization, setNormalization] = React.useState("total");
  const [year, setYear] = React.useState("2024");

  const ind = INDICATORS.find(i => i.key === selectedIndicator) || INDICATORS[0];

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "テーマ一覧" }, { label: THEME.title, current: true },
        ]} />
      </div>

      {/* ★ HERO */}
      <div style={{ padding: "14px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 80% 20%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", background: "rgba(255,255,255,0.18)", borderRadius: 999, letterSpacing: "0.04em", textTransform: "uppercase" }}>テーマ</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{THEME.category}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: "-0.01em" }}>{THEME.title}</h1>
              <p style={{ margin: "10px 0 18px", fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, maxWidth: 580 }}>
                {THEME.description}
              </p>
              <div style={{ display: "flex", gap: 14, fontSize: 11.5, opacity: 0.8 }}>
                <span>📊 {THEME.totalIndicators}指標</span>
                <span>📅 6年分の時系列</span>
                <span>🌐 出典: {THEME.source}</span>
                <span>🔄 更新: {THEME.lastUpdated}</span>
              </div>
            </div>
            {/* Hero KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "全国 高齢化率", v: "29.8", u: "%", note: "+0.6 vs 2019" },
                { label: "出生率トップ", v: "沖縄", u: "9.7‰", note: "全国平均 6.8‰" },
                { label: "減少率トップ", v: "秋田", u: "▲14.5%", note: "2010→2024" },
                { label: "人口集中", v: "25.9", u: "%", note: "上位3都府県" },
              ].map((k, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 10.5, opacity: 0.65, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{k.label}</div>
                  <div className="mono" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                    {k.v} <span style={{ fontSize: 12, opacity: 0.65, fontWeight: 500 }}>{k.u}</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{k.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Indicator picker */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>1. 指標を選ぶ</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {INDICATORS.slice(0, 12).map((i) => (
            <IndicatorCard key={i.key} ind={i} active={i.key === selectedIndicator} onClick={() => setSelectedIndicator(i.key)} />
          ))}
        </div>
      </div>

      {/* Map section */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>2. 地図と順位で見る</div>
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, background: ind.color, borderRadius: 4 }} />
              <div className="h2">{ind.title}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="seg">
                {[
                  ["total", "総数", Icons.Sigma],
                  ["per_pop", "人口あたり", Icons.Users],
                  ["per_area", "面積あたり", Icons.Area],
                ].map(([k, lbl, ic]) => (
                  <button key={k} className={"item" + (normalization === k ? " active" : "")} onClick={() => setNormalization(k)}>
                    {React.cloneElement(ic, { className: "icon icon-sm" })}{lbl}
                  </button>
                ))}
              </div>
              <div className="select" style={{ padding: "5px 10px" }}>
                <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={e => setYear(e.target.value)}>
                  {YEARS.map(y => <option key={y}>{y}年</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-sm">
                {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} CSV
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--border)" }}>
            <div className="jp-map" style={{ padding: 14, borderRight: "1px solid var(--border)" }}>
              <JapanMap height={440} theme={ind.color === "#dc2626" || ind.color === "#b45309" ? "amber" : "blue"} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <div className="h3">順位 (上位10)</div>
                <span className="muted" style={{ fontSize: 11 }}>{ind.unit}</span>
              </div>
              <div style={{ padding: 8, overflow: "auto", maxHeight: 400 }}>
                <PrefMini />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ★ Native affiliate: books for this theme */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="eyebrow">3. テーマを深掘りする</span>
            <span className="pill">PR</span>
          </div>
          <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>もっと見る ›</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
            { title: "地方消滅 ─ 東京一極集中が招く人口急減", author: "増田寛也 編著", price: "¥902", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
            { title: "未来の年表 ─ 人口減少日本でこれから起きること", author: "河合雅司", price: "¥880", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
            { title: "縮減ニッポンの再構築", author: "山下祐介", price: "¥1,540", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
          ].map((b, i) => <BookCard key={i} book={b} />)}
        </div>
      </div>

      {/* CSV Data Pack section */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>4. データを使う</div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          <div className="card" style={{
            padding: 18, display: "flex", gap: 14, alignItems: "center",
            background: "linear-gradient(135deg, var(--primary-50), #fff)",
            borderColor: "var(--primary-100)",
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { width: 24, height: 24 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)" }}>{THEME.title} データパック</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {THEME.totalIndicators}指標 × 6年分 × 47都道府県 · 約12KB
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm">CSV (zip)</button>
                <button className="btn btn-sm">JSON</button>
                <button className="btn btn-sm">Excel</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg", style: { width: 24, height: 24 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3">テーマ更新通知を受け取る</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {THEME.title}の指標が更新されたら、メールでお知らせ。
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <input type="email" placeholder="you@example.com" style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12 }} />
                <button className="btn btn-primary btn-sm">登録</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AdSense in feed */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </div>

      {/* Related articles */}
      <div style={{ padding: "20px 24px 24px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>5. このテーマに関する記事</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { title: "東京一極集中はなぜ進むのか — 人口・経済・産業の3視点", date: "2025-03-15", tag: "東京都" },
            { title: "秋田県の人口減少率はなぜ全国最大なのか", date: "2025-02-20", tag: "秋田県" },
            { title: "高齢化率1位の秋田 — 数字が示す医療・介護の課題", date: "2025-01-30", tag: "高齢化" },
          ].map((a, i) => (
            <a key={i} href="#" className="card" style={{ padding: 14, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                height: 100, borderRadius: 8,
                background: ["linear-gradient(135deg, #dbeafe, #1d4ed8)", "linear-gradient(135deg, #fde68a, #f59e0b)", "linear-gradient(135deg, #fbcfe8, #ec4899)"][i],
              }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ display: "flex", gap: 6, marginTop: "auto", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{a.date}</span>
                <Tag>{a.tag}</Tag>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ThemeOptionD = ThemeOptionD;
