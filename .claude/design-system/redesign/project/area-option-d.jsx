/* Area+Category Option D — ストーリー型 + ふるさと納税ネイティブ収益
   - 暗色ヒーロー(都道府県アイデンティティ + KPI 4枚)
   - カテゴリナビ (横長カード)
   - KPI 詳細セクション
   - チャートグリッド
   - ★ ふるさと納税アフィリエイト (上位特産品ピックアップ)
   - 関連エリア + メルマガ + AdSense */

function AreaOptionD() {
  const [norm, setNorm] = React.useState("total");

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "都道府県一覧" },
          { label: AREA.name }, { label: "人口・世帯", current: true },
        ]} />
      </div>

      {/* ★ HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
          color: "#fff", padding: 28,
          display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 28, alignItems: "center",
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative" }}>
            <JapanHighlight highlightCode={AREA.code} color="#60a5fa" />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, fontWeight: 600 }}>
              {AREA.region}地方 · 47都道府県
            </div>
            <h1 style={{ margin: "6px 0 0", fontSize: 42, fontWeight: 800, letterSpacing: "-0.01em" }}>{AREA.name}</h1>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.15)", borderRadius: 999, fontWeight: 600 }}>👑 人口1位</span>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>面積 2,194 km²</span>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 999 }}>{AREA.cities.length}市区町村</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                {React.cloneElement(Icons.External, { className: "icon" })} 他県と比較
              </button>
              <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                {React.cloneElement(Icons.Download, { className: "icon" })} 全データCSV
              </button>
            </div>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "総人口",   v: "1,401", u: "万人", rank: "全国1位" },
              { label: "人口密度", v: "6,398", u: "人/km²", rank: "全国1位" },
              { label: "高齢化率", v: "23.5", u: "%", rank: "全国47位" },
              { label: "世帯数",   v: "754", u: "万", rank: "全国1位" },
            ].map((k, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                <div style={{ fontSize: 10.5, opacity: 0.65, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k.label}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                  {k.v}<span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500, marginLeft: 3 }}>{k.u}</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{k.rank}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category navigation row */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>1. {AREA.name}のデータをカテゴリで見る</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6 }}>
          {AREA_CATEGORIES.map((c) => (
            <button key={c.key} style={{
              cursor: "pointer", font: "inherit",
              padding: "10px 6px", borderRadius: 8,
              border: `1.5px solid ${c.active ? c.color : "var(--border)"}`,
              background: c.active ? c.color : "#fff",
              color: c.active ? "#fff" : "var(--fg-2)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              textAlign: "center", fontSize: 11.5, fontWeight: c.active ? 700 : 500,
            }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ lineHeight: 1.2 }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">2. 人口・世帯のKPI</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="seg">
              {[["total", "総数"], ["per_pop", "人口あたり"], ["per_area", "面積あたり"]].map(([k, lbl]) => (
                <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm">
              {React.cloneElement(Icons.Download, { className: "icon icon-sm" })} CSV
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {AREA_KPIS.map((k, i) => <AreaKpiCard key={i} k={k} size="lg" />)}
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>3. チャートで見る</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["年齢階層別人口", "人口推移(2000-2024)", "世帯構成", "全国順位の推移"].map((t, i) => (
            <div key={i} className="card">
              <div className="card-header" style={{ padding: "10px 14px" }}>
                <div className="h3">{t}</div>
              </div>
              <div style={{ height: 200, background: "var(--bg-subtle)", margin: 12, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)" }}>
                [Chart: {t}]
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ★ Furusato Nozei native section */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{
          borderRadius: 14, overflow: "hidden",
          background: "linear-gradient(135deg, #fef3c7, #ffffff)",
          border: "1px solid #fde68a",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 24 }}>🎁</div>
              <div>
                <div className="h2" style={{ color: "#92400e" }}>{AREA.name}のふるさと納税</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>4. このページを離れる前に — 寄附で特産品をもらえます</div>
              </div>
              <span className="pill" style={{ background: "#92400e", color: "#fff", marginLeft: 8 }}>PR</span>
            </div>
            <a href="#" className="btn btn-primary" style={{ background: "#b45309", borderColor: "#b45309" }}>
              すべての返礼品を見る →
            </a>
          </div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { title: "東京湾アナゴ お刺身用 500g", price: "¥10,000", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)", source: "ふるさとチョイス" },
              { title: "大田区 老舗もんじゃ焼きセット 5人前", price: "¥15,000", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)", source: "さとふる" },
              { title: "東京銘菓 詰合せ 16個入", price: "¥8,000", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)", source: "楽天ふるさと納税" },
              { title: "八丈島 くさや プレミアム3種", price: "¥12,000", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)", source: "ふるなび" },
            ].map((g, i) => (
              <a key={i} href="#" style={{
                display: "flex", flexDirection: "column", gap: 8, padding: 10,
                background: "#fff", borderRadius: 10, border: "1px solid var(--border)",
                textDecoration: "none", color: "var(--fg)",
              }}>
                <div style={{ height: 100, borderRadius: 8, background: g.thumb }} />
                <div>
                  <span style={{ fontSize: 9, padding: "1px 5px", background: "var(--bg-muted)", color: "var(--muted)", borderRadius: 3, fontWeight: 600 }}>PR · {g.source}</span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{g.title}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#b45309", marginTop: 4 }}>寄附 {g.price}〜</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Compare CTA */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>5. 他県と比較する</div>
        <div className="card" style={{ padding: 16, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(Icons.External, { className: "icon icon-lg" })}
          </div>
          <div style={{ flex: 1 }}>
            <div className="h3" style={{ color: "var(--primary)" }}>{AREA.name}と隣接する都道府県を比較</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>同じカテゴリ・指標で並べて違いを見る</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {AREA.neighbors.map(n => (
              <a key={n.code} href="#" className="btn btn-sm">vs {n.name}</a>
            ))}
            <a href="#" className="btn btn-primary btn-sm">比較ツール →</a>
          </div>
        </div>
      </div>

      {/* AdSense */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </div>

      {/* Newsletter */}
      <div style={{ padding: "20px 24px 24px" }}>
        <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", background: "linear-gradient(135deg, #f0fdfa, #fff)", borderColor: "#a7f3d0" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
          </div>
          <div style={{ flex: 1 }}>
            <div className="h3" style={{ color: "var(--accent)" }}>{AREA.name}のデータ更新通知</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{AREA.name}の人口・経済・産業データが更新されたら、メールでお知らせ</div>
          </div>
          <input placeholder="you@example.com" style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, font: "inherit", fontSize: 13, width: 220 }} />
          <button className="btn btn-primary">登録</button>
        </div>
      </div>
    </div>
  );
}

window.AreaOptionD = AreaOptionD;
