"""G04-a-11 (elevation 3rd mesh) x mesh1000r6-24/PTN_2020 (census 2020 1km mesh population).

Deterministic and stdlib-only. The join is an exact standard-3rd-mesh-code join, and both
sides are checked to be the same grid cell (polygon bbox == bounds derived from the code).
No population apportionment: a 1km mesh is classified as a whole by its mean elevation
(primary) and, as an upper bound, by its minimum elevation.

  python3 -I low-elevation-population-overlay.py build \
      --g04-dir <dir of G04-a-11_*-jgd_GML.zip> --population-zip <1km_mesh_2024_GEOJSON.zip> \
      --census-values <app/stats/total-population/values.json> --out-root .local/r2
  python3 -I low-elevation-population-overlay.py audit --out-root .local/r2
"""
import argparse, hashlib, io, json, os, pathlib, re, struct, sys, zipfile
from datetime import datetime, timezone

SLUG = 'population-low-elevation'
METRIC_KEY = 'low-elevation-population-ratio-5m'
SCALE = 10000                      # PTN_2020 has at most 4 decimals; sums are exact in these units
THRESHOLDS = (0, 5, 10)            # metres; there is no national 5m/10m standard (see caveats)
PRIMARY_THRESHOLD = 5
BAND_LABELS = ['標高不明', '平均標高0m以下', '0m超5m以下', '5m超10m以下', '10m超']
G04_URL = 'https://nlftp.mlit.go.jp/ksj/gml/data/G04-a/G04-a-11/'
POP_URL = 'https://nlftp.mlit.go.jp/ksj/gml/data/m1kr6/m1kr6-24/1km_mesh_2024_GEOJSON.zip'
MESH_TOLERANCE = 1e-6              # degrees
DATA_VERSION = 'G04-a-11_mesh1000r6-24_2020'
# 公開ページに掲載する原典表示。TS側 LOW_ELEVATION_ATTRIBUTION と一致を audit で検査する
# (G04-a の2文は https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html の「作成方法(原典表示)」の逐語)。
ATTRIBUTION = {
    'G04-a': [
        'この地図は、国土地理院長の承認を得て、同院発行の基盤地図情報を使用したものである。(承認番号 平成25情使、第590号)',
        'この地図は、国土地理院長の承認を得て、同院発行の基盤地図情報を複製したものである。(承認番号 平成25情複、第581号)',
    ],
    'mesh1000r6': '国土交通省国土数値情報「1kmメッシュ別将来推計人口(R6国政局推計)」(CC BY 4.0)の令和2年(2020年)人口を使用し、stats47が標高メッシュと結合・集計した',
}


def sha(b): return hashlib.sha256(b).hexdigest()
def official_key(url):
    """Identifier of the official distribution file (host + path). Not an R2 key: the raw ZIPs are not stored in R2."""
    return url.split('://', 1)[1]
def js_canonical(x):
    """Integral floats -> ints so the bytes equal JS JSON.stringify of the parsed value (0.0 -> 0).
    The Web loader re-serialises with JSON.stringify and compares SHA-256/bytes with the manifest."""
    if isinstance(x, float) and x.is_integer(): return int(x)
    if isinstance(x, dict): return {k: js_canonical(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)): return [js_canonical(v) for v in x]
    return x
def encode(x, pretty=False):
    """pretty=True is the 2-space layout JS JSON.stringify(v, null, 2) produces (item.json); otherwise compact."""
    x = js_canonical(x)
    text = (json.dumps(x, ensure_ascii=False, indent=2, separators=(',', ': '), allow_nan=False) if pretty
            else json.dumps(x, ensure_ascii=False, separators=(',', ':'), allow_nan=False))
    return (text + '\n').encode()
def ensure(ok, message):
    if not ok: raise ValueError(message)
def write(path, value, pretty=False):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(encode(value, pretty))


def mesh_bounds(code):
    """Standard 3rd mesh code (8 digits) -> (west, south, east, north) in degrees."""
    ensure(re.fullmatch(r'\d{4}[0-7]{2}[0-9]{2}', code) is not None, 'mesh code ' + code)
    south = int(code[:2]) * 2 / 3 + int(code[4]) / 12 + int(code[6]) / 120
    west = 100 + int(code[2:4]) + int(code[5]) / 8 + int(code[7]) / 80
    return west, south, west + 1 / 80, south + 1 / 120


def band_of(elev):
    """0 unknown / 1 mean<=0 / 2 (0,5] / 3 (5,10] / 4 >10 -- on the mesh mean elevation."""
    if elev is None: return 0
    mean = elev[0]
    if mean <= 0: return 1
    if mean <= 5: return 2
    if mean <= 10: return 3
    return 4


def summarize(rows):
    """rows: (meshId, shicode, popScaled, elev|None). Returns the exact integer summary."""
    bands = [[0, 0] for _ in BAND_LABELS]          # [meshCount, popScaled]
    mean_le = {t: [0, 0] for t in THRESHOLDS}
    min_le = {t: [0, 0] for t in THRESHOLDS}
    total = 0
    for _, _, pop, elev in rows:
        total += pop
        b = band_of(elev)
        bands[b][0] += 1; bands[b][1] += pop
        if elev is None: continue
        mean, _mx, mn = elev
        for t in THRESHOLDS:
            if mean <= t: mean_le[t][0] += 1; mean_le[t][1] += pop
            if mn <= t: min_le[t][0] += 1; min_le[t][1] += pop
    return {'meshCount': len(rows), 'populationScaled': total, 'bands': bands, 'meanLe': mean_le, 'minLe': min_le}


def share(num, den):
    return round(num / den * 100, 4) if den else None


def read_dbf(b):
    nrec, hlen, rlen = struct.unpack('<xxxxIHH', b[:12])
    fields, pos = [], 32
    while b[pos] != 0x0D:
        fields.append((b[pos:pos + 11].split(b'\0')[0].decode('ascii'), b[pos + 16])); pos += 32
    rows = []
    for i in range(nrec):
        r = b[hlen + i * rlen:hlen + (i + 1) * rlen]
        ensure(r[0:1] == b' ', 'deleted dbf record')
        o, d = 1, {}
        for n, l in fields:
            d[n] = r[o:o + l].decode('ascii').strip(); o += l
        rows.append(d)
    return rows


def read_shp_bboxes(b):
    """Polygon record bboxes in file order (shape type 5)."""
    ensure(struct.unpack('>i', b[:4])[0] == 9994 and struct.unpack('<i', b[32:36])[0] == 5, 'shp header')
    out, pos = [], 100
    while pos < len(b):
        clen = struct.unpack('>i', b[pos + 4:pos + 8])[0] * 2
        ensure(struct.unpack('<i', b[pos + 8:pos + 12])[0] == 5, 'shp record type')
        out.append(struct.unpack('<4d', b[pos + 12:pos + 44])); pos += 8 + clen
    return out


def load_elevation(g04_dir):
    """Official G04-a-11 zips -> {mesh: (mean,max,min)|None}, input provenance list."""
    elev, inputs = {}, []
    for fn in sorted(os.listdir(g04_dir)):
        if not fn.endswith('.zip'): continue
        p = g04_dir / fn
        raw = p.read_bytes()
        z = zipfile.ZipFile(io.BytesIO(raw))
        dbf = read_dbf(z.read([n for n in z.namelist() if n.endswith('.dbf')][0]))
        shp = read_shp_bboxes(z.read([n for n in z.namelist() if n.endswith('.shp')][0]))
        ensure(len(dbf) == len(shp), 'dbf/shp record count ' + fn)
        mismatch = 0
        for r, bb in zip(dbf, shp):
            m = r['G04a_001']
            ensure(m not in elev, 'duplicate elevation mesh ' + m)
            w, s, e, n = mesh_bounds(m)
            if max(abs(bb[0] - w), abs(bb[1] - s), abs(bb[2] - e), abs(bb[3] - n)) > MESH_TOLERANCE: mismatch += 1
            vals = [None if r[k] in ('unknown', '') else float(r[k]) for k in ('G04a_002', 'G04a_003', 'G04a_004')]
            if any(v is None for v in vals): elev[m] = None
            else:
                ensure(vals[2] <= vals[0] <= vals[1], 'min<=mean<=max ' + m)
                elev[m] = tuple(vals)
        inputs.append({'layerId': 'ksj-g04a-elevation-mesh-3rd', 'datasetId': 'G04-a', 'version': '11',
                       'key': official_key(G04_URL + fn), 'url': G04_URL + fn, 'sha256': sha(raw), 'bytes': len(raw), 'records': len(dbf),
                       'geometryMismatch': mismatch,
                       'retrievedAt': datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                       'geometry': 'mesh', 'role': 'calculation-input', 'usedInCalculation': True})
    return elev, inputs


def load_population(zip_path):
    """National GeoJSON zip -> {prefCode: [(mesh, shicode, popScaled)]}, input provenance."""
    raw_outer = zip_path.read_bytes()
    outer = zipfile.ZipFile(io.BytesIO(raw_outer))
    prefs, members = {}, []
    for p in range(1, 48):
        pc = '%02d' % p
        name = '1km_mesh_2024_GEOJSON/1km_mesh_2024_%s_GEOJSON.zip' % pc
        inner_raw = outer.read(name)
        inner = zipfile.ZipFile(io.BytesIO(inner_raw))
        gname = [n for n in inner.namelist() if n.endswith('.geojson')][0]
        gbytes = inner.read(gname)
        rows, seen, mismatch = [], set(), 0
        for f in json.loads(gbytes)['features']:
            pr = f['properties']
            ring = f['geometry']['coordinates'][0]
            xs, ys = [c[0] for c in ring], [c[1] for c in ring]
            w, s, e, n = mesh_bounds(pr['MESH_ID'])
            if max(abs(min(xs) - w), abs(min(ys) - s), abs(max(xs) - e), abs(max(ys) - n)) > MESH_TOLERANCE: mismatch += 1
            ensure(pr['SHICODE'][:2] == pc, 'municipality outside file prefecture')
            ensure(pr['PTN_2020'] is not None, 'PTN_2020 null')
            scaled = round(pr['PTN_2020'] * SCALE)
            ensure(abs(pr['PTN_2020'] * SCALE - scaled) < 1e-3, 'PTN_2020 precision')
            key = (pr['SHICODE'], pr['MESH_ID'])
            ensure(key not in seen, 'duplicate prefecture+municipality+mesh')
            seen.add(key)
            rows.append((pr['MESH_ID'], pr['SHICODE'], scaled))
        prefs[pc] = rows
        members.append({'pref': pc, 'member': name, 'bytes': len(inner_raw), 'sha256': sha(inner_raw),
                        'geojson': gname, 'geojsonBytes': len(gbytes), 'geojsonSha256': sha(gbytes),
                        'records': len(rows), 'geometryMismatch': mismatch})
    meta = {'layerId': 'ipss-population-mesh-1km', 'datasetId': 'mesh1000r6', 'version': '24', 'key': official_key(POP_URL), 'url': POP_URL,
            'sha256': sha(raw_outer), 'bytes': len(raw_outer),
            'retrievedAt': datetime.fromtimestamp(zip_path.stat().st_mtime, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'geometry': 'mesh', 'role': 'calculation-input', 'usedInCalculation': True, 'members': members}
    return prefs, meta


def census_reference(path):
    d = json.loads(path.read_text())
    ref = {r['areaCode'][:2]: int(r['value']) for r in d['rows'] if r['yearCode'] == '2020'}
    ref_names = {r['areaCode'][:2]: r['areaName'] for r in d['rows'] if r['yearCode'] == '2020'}
    ensure(len(ref) == 47, 'census reference 47 prefectures')
    return ref, ref_names


def pref_entry(summary, census):
    pop = summary['populationScaled'] / SCALE
    rounded = round(pop)
    cons = {'meshPopulation': pop, 'meshPopulationRounded': rounded, 'censusPopulation2020': census,
            'difference': round(pop - census, 4), 'bandSumMatches': sum(b[1] for b in summary['bands']) == summary['populationScaled'],
            'bandMeshSumMatches': sum(b[0] for b in summary['bands']) == summary['meshCount'],
            'matchesCensus': rounded == census}
    ensure(cons['bandSumMatches'] and cons['bandMeshSumMatches'], 'band conservation')
    ensure(cons['matchesCensus'] and abs(cons['difference']) < 0.05, 'census conservation')
    return cons


def threshold_rows(summary):
    total = summary['populationScaled']
    out = []
    for t in THRESHOLDS:
        mc, mp = summary['meanLe'][t]
        nc, np_ = summary['minLe'][t]
        out.append({'thresholdM': t,
                    'meanBased': {'meshCount': mc, 'population': round(mp / SCALE, 4), 'sharePercent': share(mp, total)},
                    'minBased': {'meshCount': nc, 'population': round(np_ / SCALE, 4), 'sharePercent': share(np_, total)}})
    return out


def build(args):
    out_root = pathlib.Path(args.out_root)
    generated_at = args.generated_at or datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    elev, g_inputs = load_elevation(pathlib.Path(args.g04_dir))
    prefs, pop_meta = load_population(pathlib.Path(args.population_zip))
    census, names = census_reference(pathlib.Path(args.census_values))
    ensure(sum(g['geometryMismatch'] for g in g_inputs) == 0, 'elevation mesh geometry != mesh code')
    ensure(sum(m['geometryMismatch'] for m in pop_meta['members']) == 0, 'population mesh geometry != mesh code')

    base = out_root / 'app' / 'geo' / SLUG
    outputs, item_rows, unmatched_total, all_mesh = [], [], 0, 0
    nat = {'population': 0, 'meanLe': {t: 0 for t in THRESHOLDS}, 'unknown': 0}
    for pc in sorted(prefs):
        rows = []
        for mesh, shi, pop in prefs[pc]:
            ensure(mesh in elev, 'population mesh missing in G04-a ' + mesh)
            rows.append((mesh, shi, pop, elev[mesh]))
        rows.sort(key=lambda r: (r[1], r[0]))
        summary = summarize(rows)
        cons = pref_entry(summary, census[pc])
        area_code = pc + '000'
        detail = {'schemaVersion': 1, 'slug': SLUG, 'generatedAt': generated_at, 'areaCode': area_code, 'areaName': names[pc],
                  'meshMethod': 'mesh-code-join',
                  'columns': ['meshId', 'municipalityCode', 'population2020', 'meanElevationM', 'maxElevationM', 'minElevationM'],
                  'meshes': [[m, s, p / SCALE] + (list(e) if e else [None, None, None]) for m, s, p, e in rows],
                  'summary': {'meshCount': summary['meshCount'], 'population2020': summary['populationScaled'] / SCALE,
                              'bands': [{'label': BAND_LABELS[i], 'meshCount': b[0], 'population': b[1] / SCALE,
                                         'sharePercent': share(b[1], summary['populationScaled'])} for i, b in enumerate(summary['bands'])],
                              'thresholds': threshold_rows(summary), 'conservation': cons}}
        dpath = base / 'pref' / (pc + '.json')
        write(dpath, detail)
        data = dpath.read_bytes()
        outputs.append({'key': 'app/geo/%s/pref/%s.json' % (SLUG, pc), 'sha256': sha(data), 'bytes': len(data),
                        'recordCount': len(rows), 'areaCode': area_code})
        all_mesh += len(rows)
        unknown = summary['bands'][0]
        nat['population'] += summary['populationScaled']; nat['unknown'] += unknown[1]
        for t in THRESHOLDS: nat['meanLe'][t] += summary['meanLe'][t][1]
        thr = threshold_rows(summary)
        item_rows.append({'areaCode': area_code, 'areaName': names[pc], 'values': {
            'lowElevationShareMean5m': thr[1]['meanBased']['sharePercent'],
            'lowElevationShareMean0m': thr[0]['meanBased']['sharePercent'],
            'lowElevationShareMean10m': thr[2]['meanBased']['sharePercent'],
            'lowElevationShareMin0m': thr[0]['minBased']['sharePercent'],
            'lowElevationShareMin5m': thr[1]['minBased']['sharePercent'],
            'lowElevationShareMin10m': thr[2]['minBased']['sharePercent'],
            'population2020': summary['populationScaled'] / SCALE,
            'lowElevationPopulationMean5m': thr[1]['meanBased']['population'],
            'elevationUnknownPopulation': unknown[1] / SCALE}})
    ensure(round(nat['population'] / SCALE) == sum(census.values()), 'national conservation')
    # 値の降順・同値は同順位。表示順であり優劣ではない。
    primary_of = lambda r: r['values']['lowElevationShareMean5m']
    for r in item_rows:
        r['rank'] = 1 + sum(1 for o in item_rows if primary_of(o) > primary_of(r))
    ordered = sorted(item_rows, key=lambda r: (-primary_of(r), r['areaCode']))
    shares = sorted(primary_of(r) for r in item_rows)
    median = shares[len(shares) // 2] if len(shares) % 2 else (shares[len(shares) // 2 - 1] + shares[len(shares) // 2]) / 2

    metrics = [
        ('lowElevationShareMean5m', '平均標高5m以下の地域の人口割合', '%', 'percent1', '平均標高が5m以下の1kmメッシュに住む2020年人口の、都道府県人口に対する比率'),
        ('lowElevationShareMean0m', '平均標高0m以下の地域の人口割合', '%', 'percent1', '平均標高が0m以下の1kmメッシュに住む2020年人口の比率'),
        ('lowElevationShareMean10m', '平均標高10m以下の地域の人口割合', '%', 'percent1', '平均標高が10m以下の1kmメッシュに住む2020年人口の比率'),
        ('lowElevationShareMin5m', '最低標高5m以下を含む地域の人口割合', '%', 'percent1', 'メッシュ内に標高5m以下の土地を含む1kmメッシュの人口の比率(上限側の見積り)'),
        ('population2020', '2020年人口', '人', 'integer', '1kmメッシュ人口の県内合計(国勢調査2020の都道府県人口と一致を検算)'),
        ('lowElevationPopulationMean5m', '平均標高5m以下の地域の人口', '人', 'integer', '平均標高が5m以下の1kmメッシュに住む2020年人口'),
    ]
    item = {'schemaVersion': 1, 'slug': SLUG, 'generatedAt': generated_at, 'dataVersion': DATA_VERSION,
            'geography': 'prefecture', 'title': '標高の低い土地に、どれだけの人が住んでいるか',
            'question': '標高・傾斜度3次メッシュと1kmメッシュ人口(2020年)を重ねると、標高の低い土地に住む人口の割合は県でどう違うか',
            'primaryMetricKey': 'lowElevationShareMean5m',
            'metrics': [{'key': k, 'label': l, 'unit': u, 'format': f, 'description': d} for k, l, u, f, d in metrics],
            # 配信表は主指標の高い順(同順位は県コード順)。表の見出し「高い順」と一致させる。
            'rows': sorted(item_rows, key=lambda r: (r['rank'], r['areaCode'])),
            'summary': {'observationCount': 47, 'medianValue': median,
                        'topAreaCodes': [r['areaCode'] for r in ordered[:3]],
                        'bottomAreaCodes': [r['areaCode'] for r in sorted(item_rows, key=lambda r: (primary_of(r), r['areaCode']))[:3]],
                        'nationalPopulation2020': nat['population'] / SCALE,
                        'nationalShareMean': {str(t): share(nat['meanLe'][t], nat['population']) for t in THRESHOLDS},
                        'elevationUnknownPopulation': nat['unknown'] / SCALE},
            'method': ['標高・傾斜度3次メッシュ(2011年度版)の3次メッシュコードと、1kmメッシュ人口(2020年)の3次メッシュコードを完全一致で結合した',
                       '1kmメッシュ全体を平均標高で0m以下/5m以下/10m以下に分類し、メッシュ内の人口分布は仮定せず按分もしない',
                       '最低標高で分類した値は「メッシュ内に低地を含む」上限側の見積りとして別に保存した',
                       '県別に合計し、合計人口が国勢調査2020の都道府県人口と一致することを検算した'],
            'sources': [
                {'name': '国土交通省『国土数値情報 標高・傾斜度3次メッシュデータ』', 'url': 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html',
                 'datasetId': 'G04-a', 'version': '11', 'license': '商用可(国土数値情報の利用規約・原典表示あり)'},
                {'name': '国土交通省『国土数値情報 1kmメッシュ別将来推計人口(R6国政局推計)』', 'url': 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html',
                 'datasetId': 'mesh1000r6', 'version': '24', 'license': 'CC BY 4.0'}],
            'caveats': [
                '標高は2009年5月時点の基盤地図情報10mメッシュ由来で、東日本大震災による地盤沈下や、その後の盛土・堤防工事は反映されない',
                '標高メッシュは約1km単位の平均・最高・最低。海抜の低い狭い土地の厳密な判定には粗く、都道府県間の相対比較に限る',
                '平均標高が低いことは浸水・高潮・津波の発生を意味しない。堤防・排水設備・実際のハザード想定は含まない',
                '0m以下の分類は国土交通省のゼロメートル地帯(朔望平均満潮位以下)と同じ定義ではない。標高の基準面と満潮位が異なる',
                '5mと10mに全国共通の公的な基準は確認できない。複数のしきい値を並べ、単一の安全・危険の境界として読まない',
                '県境をまたぐメッシュは県ごとの人口行にメッシュ全体の標高を当てている',
                '標高は国土数値情報(原典は国土地理院の基盤地図情報 数値標高モデル)、人口は国勢調査2020を基準にした1kmメッシュ人口で、基準時点が異なる'],
            'dataQuality': {'expectedAreas': 47, 'actualAreas': 47, 'missingAreaCodes': [],
                            'inputCounts': {'elevationMeshes': len(elev), 'elevationZipFiles': len(g_inputs),
                                            'populationMeshes': all_mesh, 'populationMeshesWithoutElevationRow': 0,
                                            'elevationUnknownMeshesAmongPopulated': sum(1 for p in prefs.values() for m, _s, _p in p if elev[m] is None)},
                            'coverageNote': '国勢調査2020の人口が正のメッシュ(1kmメッシュ人口データに行のあるメッシュ)をすべて標高メッシュと照合した。標高不明のメッシュ人口は低地にも非低地にも入れず別枠で保存した'}}
    write(base / 'item.json', item, pretty=True)
    idata = (base / 'item.json').read_bytes()

    stages = [
        {'id': 'population-mesh', 'label': '1kmメッシュ人口(2020年)', 'kind': 'source', 'role': 'calculation-input',
         'inputIds': ['ipss-population-mesh-1km'], 'operation': '都道府県別GeoJSONからMESH_ID・SHICODE・PTN_2020を読み、メッシュ境界が3次メッシュコードと一致することを検査',
         'outputKeyPattern': 'app/geo/%s/pref/{NN}.json#meshes' % SLUG, 'outputs': outputs},
        {'id': 'elevation-mesh', 'label': '標高・傾斜度3次メッシュ(平均・最高・最低標高)', 'kind': 'source', 'role': 'calculation-input',
         'inputIds': ['ksj-g04a-elevation-mesh-3rd'], 'operation': '176の一次メッシュZIPからDBFの標高3列を読み、シェープ境界が3次メッシュコードと一致することを検査',
         'outputKeyPattern': 'app/geo/%s/pref/{NN}.json#meshes' % SLUG, 'outputs': outputs},
        {'id': 'mesh-code-join', 'label': '3次メッシュコードの完全一致結合', 'kind': 'spatial-operation', 'role': 'derived',
         'inputIds': ['population-mesh', 'elevation-mesh'], 'operation': '同じ格子セルの人口と標高を結合し、平均標高で0・5・10m以下に排他的に分類(最低標高基準は別列)',
         'outputKeyPattern': 'app/geo/%s/pref/{NN}.json#summary' % SLUG, 'outputs': outputs},
        {'id': 'prefecture-aggregate', 'label': '県別集計', 'kind': 'aggregate', 'role': 'aggregate',
         'inputIds': ['mesh-code-join'], 'operation': '県別の分類人口を合計し国勢調査2020の都道府県人口と照合',
         'outputKeyPattern': 'app/geo/%s/item.json' % SLUG, 'outputs': [{'key': 'app/geo/%s/item.json' % SLUG, 'sha256': sha(idata), 'bytes': len(idata), 'recordCount': 47}]}]
    quality = {'expectedAreas': 47, 'detailAreas': 47, 'conservationChecks': 47,
               'sourceRecords': all_mesh + len(elev), 'derivedRecords': all_mesh, 'populatedMeshes': all_mesh,
               'maxDetailBytes': max(o['bytes'] for o in outputs),
               'nationalConservation': {'meshPopulation': nat['population'] / SCALE, 'censusPopulation2020': sum(census.values())}}
    builder_path = pathlib.Path(__file__)
    manifest = {'schemaVersion': 1, 'slug': SLUG, 'generatedAt': generated_at, 'builder': 'packages/gis/src/geo-analysis/low-elevation-population-overlay.py',
                # この分析の定義 = 生成スクリプト本体。変更後に再生成しないと audit が不一致で止める
                'definitionSha256': sha(builder_path.read_bytes()),
                'thresholdsM': list(THRESHOLDS), 'primaryThresholdM': PRIMARY_THRESHOLD,
                'inputs': g_inputs + [pop_meta], 'contextLayers': [],
                'censusReference': {'metricKey': 'total-population', 'yearCode': '2020', 'source': '国勢調査2020(社会・人口統計体系 A1101)', 'populationByArea': {k + '000': v for k, v in sorted(census.items())}},
                'stages': stages, 'aggregate': {'key': 'app/geo/%s/item.json' % SLUG, 'sha256': sha(idata), 'bytes': len(idata), 'recordCount': 47},
                'quality': quality,
                'attribution': ATTRIBUTION}
    write(base / 'manifest.json', manifest)

    # ranking values (population share of the primary threshold, mean basis)
    rows = []
    for r in item_rows:
        rows.append({'areaCode': r['areaCode'], 'areaName': r['areaName'], 'yearCode': '2020', 'yearName': '2020',
                     'value': round(r['values']['lowElevationShareMean5m'], 2), 'unit': '%'})
    # 他の values.json と同じく値の降順・同値は同順位で rank を振る
    for row in rows:
        row['rank'] = 1 + sum(1 for other in rows if other['value'] > row['value'])
    values = {'metricKey': METRIC_KEY, 'entityKind': 'prefecture', 'rows': rows,
              'meta': {'rowCount': 47, 'yearRange': ['2020', '2020'], 'areaCount': 47, 'generatedAt': generated_at}}
    write(out_root / 'app' / 'stats' / METRIC_KEY / 'values.json', values)
    print(json.dumps({'meshes': all_mesh, 'nationalShareMean': item['summary']['nationalShareMean'], 'maxDetailBytes': quality['maxDetailBytes']}, ensure_ascii=False))


def audit(args):
    """Re-reads the written artifacts only (no download) and re-verifies SHAs and conservation."""
    out_root = pathlib.Path(args.out_root)
    base = out_root / 'app' / 'geo' / SLUG
    m = json.loads((base / 'manifest.json').read_text())
    census = m['censusReference']['populationByArea']
    errs, total = [], 0
    outs = {o['areaCode']: o for o in m['stages'][0]['outputs']}
    ensure(len(outs) == 47, '47 detail outputs')
    for ac, o in sorted(outs.items()):
        raw = (out_root / o['key']).read_bytes()
        if sha(raw) != o['sha256'] or len(raw) != o['bytes']: errs.append('sha/bytes ' + o['key'])
        d = json.loads(raw)
        rows = [((r[0], r[1]), round(r[2] * SCALE), None if r[3] is None else (r[3], r[4], r[5])) for r in d['meshes']]
        if len(rows) != o['recordCount'] or len({k for k, _, _ in rows}) != len(rows): errs.append('records ' + ac)
        s = summarize([(k[0], k[1], p, e) for k, p, e in rows])
        if abs(s['populationScaled'] / SCALE - census[ac]) >= 0.05 or round(s['populationScaled'] / SCALE) != census[ac]: errs.append('census ' + ac)
        if sum(b[1] for b in s['bands']) != s['populationScaled']: errs.append('bands ' + ac)
        if d['summary']['thresholds'] != threshold_rows(s): errs.append('threshold ' + ac)
        total += s['populationScaled']
    if round(total / SCALE) != sum(census.values()): errs.append('national')
    ia = (base / 'item.json').read_bytes()
    if sha(ia) != m['aggregate']['sha256']: errs.append('item sha')
    item = json.loads(ia)
    if m.get('definitionSha256') != sha(pathlib.Path(__file__).read_bytes()): errs.append('definitionSha256 != builder source (regenerate)')
    if m.get('attribution') != ATTRIBUTION: errs.append('attribution')
    if [r['rank'] for r in item['rows']] != sorted(r['rank'] for r in item['rows']): errs.append('rows not in rank order')
    for r in item['rows']:
        p5 = r['values']['lowElevationShareMean5m']
        if r['rank'] != 1 + sum(1 for o in item['rows'] if o['values']['lowElevationShareMean5m'] > p5): errs.append('rank ' + r['areaCode'])
    if len({k for k in (i['key'] for i in m['inputs'])}) != len(m['inputs']): errs.append('input keys not unique')
    v = json.loads((out_root / 'app' / 'stats' / METRIC_KEY / 'values.json').read_text())
    iv = {r['areaCode']: round(r['values']['lowElevationShareMean5m'], 2) for r in item['rows']}
    if {r['areaCode']: r['value'] for r in v['rows']} != iv or len(iv) != 47: errs.append('values != item')
    print(json.dumps({'ok': not errs, 'errors': errs, 'nationalPopulation': total / SCALE}, ensure_ascii=False))
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build')
    b.add_argument('--g04-dir', required=True); b.add_argument('--population-zip', required=True)
    b.add_argument('--census-values', required=True); b.add_argument('--out-root', required=True)
    b.add_argument('--generated-at')
    a = sub.add_parser('audit'); a.add_argument('--out-root', required=True)
    args = ap.parse_args()
    {'build': build, 'audit': audit}[args.cmd](args)
