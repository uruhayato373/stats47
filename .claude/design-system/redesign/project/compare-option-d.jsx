/* Compare Option D — Editorial Story + ネイティブ収益
   - ヒーロー + AI要約「ストーリー」
   - 主要差分3枚カード(各指標の「物語」)
   - チャート + 比較表
   - ★ふるさと納税: 両地域の特産品
   - 比較結果の共有CTA + メルマガ */

function CompareOptionD() {
  const [A, B] = COMPARE_REGIONS;
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "比較ツール" }, { label: COMPARE_CATEGORY.name, current: true }]} />
      </div>

      {/* HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden", color: "#fff", padding: 28,
          background: `linear-gradient(135deg, ${A.color} 0%, ${A.color} 35%, #0f172a 50%, ${B.color} 65%, ${B.color} 100%)`,
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
          <div style={{ position: "relative" }}>
            <div className="eyebrow" style={{ opacity: 0.7 }}>地域間比較 · {COMPARE_CATEGORY.name}</div>
            <h1 style={{ fontSize: 44, fontWeight: 800, margin: "8px 0 12px", letterSpacing: "-0.02em" }}>
              {A.name} vs {B.name}
            </h1>
            <p style={{ fontSize: 14.5, opacity: 0.85, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
              人口・世帯の12指標で<strong>{A.name}は4指標</strong>、<strong>{B.name}は2指標</strong>でリード。
              特に外国人人口で {A.name} が +133% と圧倒的、高齢化率では {A.name} が -17.8% と若い構成。
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                {React.cloneElement(Icons.Download, { className: "icon" })} CSV
              </button>
              <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                {React.cloneElement(Icons.Share, { className: "icon" })} 共有
              </button>
              <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                {React.cloneElement(Icons.External, { className: "icon" })} 比較画像でシェア
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Region selector */}
      <div style={{ padding: "16px 24px 0" }}>
        <div className="card" style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 60px 1fr 200px", gap: 12, alignItems: "center" }}>
          <RegionPicker side="A" region={A} />
          <div style={{ textAlign: "center", fontWeight: 800, color: "var(--muted)" }}>VS</div>
          <RegionPicker side="B" region={B} />
          <select className="select" style={{ padding: "8px 10px" }}>
            <option>カテゴリ: {COMPARE_CATEGORY.name}</option>
          </select>
        </div>
      </div>

      {/* "3 key insights" cards */}
      <div style={{ padding: "20px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>1. この比較で見えた3つのこと</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { headline: "東京の人口密度は大阪の1.4倍", value: "+38.8%", body: "人口密度 6,398 vs 4,609 人/km²。都心への集中度が際立つ。", color: A.color },
            { headline: "大阪の高齢化はより進行", value: "+21.7%", body: "高齢化率 23.5% vs 28.6%。大阪のほうが5.1ポイント高い。", color: B.color },
            { headline: "東京の外国人人口は2倍超", value: "+133%", body: "63万人 vs 27万人。グローバル都市としての差が明確。", color: A.color },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: 16, borderTop: `3px solid ${c.color}` }}>
              <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.45, marginTop: 6 }}>{c.headline}</div>
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.65, marginTop: 6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI head-to-head */}
      <div style={{ padding: "24px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>2. 主要指標の比較</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COMPARE_KPIS.slice(0, 4).map((k, i) => <KpiH2H key={i} k={k} A={A} B={B} />)}
        </div>
      </div>

      {/* ★ Native: Furusato from both regions */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{
          borderRadius: 14, overflow: "hidden",
          background: "linear-gradient(135deg, #fef3c7, #fff)",
          border: "1px solid #fde68a",
        }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <div>
                <div className="h2" style={{ color: "#92400e", fontSize: 18 }}>両地域のふるさと納税で応援</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{A.name}・{B.name}の人気返礼品</div>
              </div>
              <span className="pill" style={{ background: "#92400e", color: "#fff", marginLeft: 6 }}>PR</span>
            </div>
            <a href="#" className="btn btn-sm">すべて見る →</a>
          </div>
          <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { region: A.name, title: "東京駅銘菓 詰合せ 16個入", price: "¥3,240", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
              { region: A.name, title: "東京湾アナゴ お刺身用 500g", price: "¥10,000", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
              { region: B.name, title: "551蓬莱 豚まん 10個セット", price: "¥3,500", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
              { region: B.name, title: "泉州タオル ギフト 5枚組", price: "¥8,000", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
            ].map((g, i) => (
              <a key={i} href="#" style={{
                display: "flex", flexDirection: "column", gap: 8, padding: 10,
                background: "#fff", borderRadius: 10, border: "1px solid var(--border)",
                textDecoration: "none", color: "var(--fg)",
              }}>
                <div style={{ height: 90, borderRadius: 8, background: g.thumb }} />
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600 }}>{g.region}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginTop: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{g.title}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#b45309", marginTop: 4 }}>{g.price}〜</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ padding: "24px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>3. チャートで詳しく</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["年齢階層別人口", "人口推移", "世帯構成", "出生・死亡推移"].map((t, i) => (
            <ChartCard key={i} title={t} A={A} B={B} />
          ))}
        </div>
      </div>

      {/* AdSense + newsletter */}
      <div style={{ padding: "24px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={100} label="" />
      </div>
      <div style={{ padding: "20px 24px 24px" }}>
        <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(Icons.Mail, { className: "icon icon-lg" })}
          </div>
          <div style={{ flex: 1 }}>
            <div className="h3" style={{ color: "var(--primary)" }}>{A.name} と {B.name} の更新を受け取る</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>両地域のデータが更新されたらメールでお知らせ</div>
          </div>
          <input placeholder="you@example.com" style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, font: "inherit", fontSize: 13, width: 220 }} />
          <button className="btn btn-primary">登録</button>
        </div>
      </div>
    </div>
  );
}

window.CompareOptionD = CompareOptionD;
