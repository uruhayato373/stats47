"""市区町村決算カード (総務省) → per-prefecture city JSON 一括取込。
card-21..card-25.html (令和2..6 = 2020..2024) の都道府県別xlsxを取得し、
各団体シートから決算カード値を抽出する。値列: 左ブロック=CO列, 右ブロック=CS列。
出力: apps/web/.../data/cities/<prefCode>.json = { cityName: { years: {year: {...}} } }
"""
import openpyxl, re, json, os, sys, urllib.request, time
from openpyxl.utils import column_index_from_string as ci

YEAR_PAGE = {2020:"card-21",2021:"card-22",2022:"card-23",2023:"card-24",2024:"card-25"}
BASE = "https://www.soumu.go.jp"
TMP = "/tmp/citycards"
OUT = "/home/user/stats47/apps/web/src/features/local-finance-dashboard/data/cities"
os.makedirs(TMP, exist_ok=True); os.makedirs(OUT, exist_ok=True)

PREFS = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]
PCODE = {p:f"{i+1:02d}" for i,p in enumerate(PREFS)}

UA = {"User-Agent":"Mozilla/5.0"}
def http(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()

def norm(s): return re.sub(r"\s+","",str(s)) if s is not None else ""

CO = ci("CO"); CS = ci("CS")
LEFT = {"歳入総額":"revenue","歳出総額":"expenditure","実質収支":"realBalance"}
RIGHT = {"標準財政規模":"standardScale","財政力指数":"fiscalIndex","実質公債費比率":"debtServiceRatio","将来負担比率":"futureBurdenRatio","地方債現在高":"localDebt"}

def parse_sheet(ws):
    out = {}
    fund_row = None
    keiyo = None
    for row in ws.iter_rows():
        for c in row:
            n = norm(c.value)
            if not n: continue
            if n in LEFT and LEFT[n] not in out:
                v = ws.cell(row=c.row, column=CO).value
                if isinstance(v,(int,float)): out[LEFT[n]] = v
            elif n in RIGHT and RIGHT[n] not in out:
                v = ws.cell(row=c.row, column=CS).value
                if isinstance(v,(int,float)): out[RIGHT[n]] = v
            elif n == "積立金現在高" and fund_row is None:
                fund_row = c.row
            elif n == "経常収支比率" and keiyo is None:
                for dr in (0,1):
                    for dc in range(1,9):
                        v = ws.cell(row=c.row+dr, column=c.column+dc).value
                        if isinstance(v,(int,float)) and 40<=v<=150:
                            keiyo = v; break
                    if keiyo is not None: break
    if fund_row is not None:
        for key,dr in (("fundAdjust",0),("fundRedemption",1),("fundOther",2)):
            v = ws.cell(row=fund_row+dr, column=CS).value
            out[key] = v if isinstance(v,(int,float)) else 0
    if keiyo is not None: out["currentBalanceRatio"] = keiyo
    return out

def city_name(sheet):
    return re.sub(r"^\d+","", sheet).strip()

# 結果: prefCode -> cityName -> {years:{}}
result = {}
def scrape_year(year, slug):
    html = http(f"{BASE}/iken/zaisei/{slug}.html").decode("shift_jis","ignore")
    # xlsx リンクを順に。各リンク直前の都道府県名で prefecture を確定。
    cur_pref = None
    files = []  # (prefCode, url)
    for m in re.finditer(r"(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)|href=\"(/main_content/\d+\.xlsx)\"", html):
        if m.group(1):
            cur_pref = m.group(1)
        elif m.group(2) and cur_pref:
            files.append((PCODE[cur_pref], BASE+m.group(2)))
    print(f"[{year}] files: {len(files)}", flush=True)
    for pc, url in files:
        fn = f"{TMP}/{year}-{url.split('/')[-1]}"
        if not os.path.exists(fn):
            for attempt in range(3):
                try:
                    open(fn,"wb").write(http(url)); break
                except Exception as e:
                    time.sleep(2)
            else:
                print("DL FAIL", url, flush=True); continue
        try:
            wb = openpyxl.load_workbook(fn, data_only=True, read_only=False)
        except Exception as e:
            print("OPEN FAIL", fn, e, flush=True); continue
        for sn in wb.sheetnames:
            if sn == "目次": continue
            name = city_name(sn)
            rec = parse_sheet(wb[sn])
            if not rec: continue
            result.setdefault(pc, {}).setdefault(name, {"years":{}})
            result[pc][name]["years"][str(year)] = rec
        wb.close()

for y, slug in YEAR_PAGE.items():
    scrape_year(y, slug)

# 出力 + サマリ
KEYS = list(LEFT.values())+list(RIGHT.values())+["fundAdjust","fundRedemption","fundOther","currentBalanceRatio"]
total_cities = 0; total_records = 0
for pc, cities in result.items():
    for name, d in cities.items():
        for y, rec in d["years"].items():
            for k in KEYS: rec.setdefault(k, 0)
    json.dump(cities, open(f"{OUT}/{pc}.json","w"), ensure_ascii=False, separators=(",",":"))
    total_cities += len(cities)
    total_records += sum(len(d["years"]) for d in cities.values())
print(f"DONE prefs={len(result)} cities={total_cities} records={total_records}", flush=True)
# 検証: 札幌市 令和6
s = result.get("01",{}).get("札幌市",{}).get("years",{}).get("2024",{})
if s:
    oku=lambda k: round(s[k]/100000,1) if k in s else None
    print("札幌市2024 歳入",oku("revenue"),"(PBI12394.5) 実質収支",oku("realBalance"),"(46.1) 地方債",oku("localDebt"),"(11131) 財政力",s.get("fiscalIndex"),"(0.70) 経常",s.get("currentBalanceRatio"),"(98.0) 積立金内訳合計",round((s.get("fundAdjust",0)+s.get("fundRedemption",0)+s.get("fundOther",0))/100000,1),"(1043)", flush=True)
