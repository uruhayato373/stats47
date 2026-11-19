#!/usr/bin/env python3
"""SHA-pinned OOXML reader; stdlib only. Job JSON on stdin, result JSON on stdout."""
import sys, json, hashlib, re, zipfile, posixpath
from pathlib import Path
from collections import Counter, defaultdict
from xml.etree import ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

def band_for(year, source):
    if year is None:
        return 'unknown'
    difference = int(source['year']) - year
    if difference < 0 or year < 1:
        raise ValueError('Construction fiscal year outside observation period')
    for band in source['bands']:
        low, high = band['minDifference'], band['maxDifference']
        if low is not None and difference >= low and (high is None or difference <= high):
            return band['key']
    raise ValueError('Unmapped construction year')

def construction_year(raw, reference_year):
    if raw == '不明':
        return None
    if not isinstance(raw, str) or not re.fullmatch(r'[0-9]{4}', raw):
        raise ValueError(f'Unexpected construction fiscal year: {raw!r}')
    year = int(raw)
    if not 1 <= year <= reference_year:
        raise ValueError(f'Construction fiscal year outside observation period: {raw!r}')
    return year

def new_distribution(source):
    return {'publishedCount': 0, 'knownYearCount': 0, 'unknownYearCount': 0,
            'bands': {b['key']: 0 for b in source['bands']}, 'cohorts': Counter(),
            'managerCounts': {s['id']: 0 for s in source['sources']}}

def add(distribution, manager, year, source):
    distribution['publishedCount'] += 1
    distribution['managerCounts'][manager] += 1
    distribution['bands'][band_for(year, source)] += 1
    if year is None:
        distribution['unknownYearCount'] += 1
    else:
        distribution['knownYearCount'] += 1
        distribution['cohorts'][year] += 1

def finish(distribution):
    d = {**distribution, 'bands': [{'key': k, 'count': n} for k, n in distribution['bands'].items()],
         'cohorts': [{'constructionFiscalYear': y, 'count': n} for y, n in sorted(distribution['cohorts'].items())]}
    assert d['publishedCount'] == d['knownYearCount'] + d['unknownYearCount']
    assert d['publishedCount'] == sum(b['count'] for b in d['bands']) == sum(d['managerCounts'].values())
    assert d['knownYearCount'] == sum(c['count'] for c in d['cohorts'])
    return d

def xlsx_rows(path, sheet):
    with zipfile.ZipFile(path) as z:
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        matches = [s for s in workbook.find(NS + 'sheets') if s.attrib['name'] == sheet]
        if len(matches) != 1 or len(workbook.find(NS + 'sheets')) != 1:
            raise ValueError('Unexpected worksheet set')
        relationships = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relationship = next(r for r in relationships if r.attrib['Id'] == matches[0].attrib[REL])
        target = relationship.attrib['Target']
        entry = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl', target))
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            with z.open('xl/sharedStrings.xml') as f:
                for _, elem in ET.iterparse(f, events=('end',)):
                    if elem.tag == NS + 'si':
                        strings.append(''.join(e.text or '' for e in [*elem.findall(NS + 't'), *elem.findall(NS + 'r/' + NS + 't')]))
                        elem.clear()
        with z.open(entry) as f:
            for _, elem in ET.iterparse(f, events=('end',)):
                if elem.tag != NS + 'row':
                    continue
                values = {}
                for cell in elem.findall(NS + 'c'):
                    col = re.sub(r'[0-9]+$', '', cell.attrib['r'])
                    if cell.find(NS + 'f') is not None:
                        raise ValueError('Formula in published source')
                    v = cell.find(NS + 'v')
                    text = '' if v is None else v.text or ''
                    if cell.attrib.get('t') == 's':
                        text = strings[int(text)]
                    elif cell.attrib.get('t') == 'inlineStr':
                        inline = cell.find(NS + 'is')
                        text = ''.join(e.text or '' for e in [*inline.findall(NS + 't'), *inline.findall(NS + 'r/' + NS + 't')]) if inline is not None else ''
                    elif cell.attrib.get('t') == 'e':
                        raise ValueError('Excel error cell')
                    values[col] = text
                yield int(elem.attrib['r']), values
                elem.clear()

def run(job):
    source = job['source']
    names = {p['prefName']: p['prefCode'] for p in job['prefectures']}
    if len(names) != 47:
        raise ValueError('Expected 47 official prefectures')
    areas = {code: new_distribution(source) for code in names.values()}
    national = new_distribution(source)
    duplicate_tuples = defaultdict(list)
    proof_files = []
    matrix = hashlib.sha256()
    for receipt in source['sources']:
        path = Path(job['sourceDir']) / receipt['file']
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != receipt['sha256'] or len(raw) != receipt['bytes']:
            raise ValueError('Source SHA/size mismatch: ' + receipt['id'])
        count, unknown = 0, 0
        name_missing_locators = []
        source_areas, conditions = Counter(), Counter()
        expected_row = 1
        for row_number, cells in xlsx_rows(path, receipt['sheet']):
            if row_number != expected_row:
                raise ValueError('Unexpected missing/duplicate worksheet row')
            expected_row += 1
            if row_number == 2:
                if re.sub(r'\s+', '', cells.get('D', '')) != '架設年度（西暦）':
                    raise ValueError('Construction fiscal year header mismatch')
                continue
            if row_number == 3:
                if cells.get('H') != '都道府県名' or cells.get('G') != '管理者名' or cells.get('J') != '判定区分':
                    raise ValueError('Prefecture/manager/condition header mismatch')
                continue
            if row_number < 4:
                continue
            if not (cells.get('A') or cells.get('B')) or not cells.get('G') or cells.get('J') not in ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ']:
                raise ValueError(f'Invalid published bridge row {receipt["id"]}:{row_number}')
            if cells.get('H') not in names:
                raise ValueError(f'Unexpected location prefecture {cells.get("H")!r}')
            if not cells.get('A'):
                name_missing_locators.append(row_number)
            code = names[cells['H']]
            year = construction_year(cells.get('D'), int(source['year']))
            count += 1
            unknown += year is None
            source_areas[code] += 1
            conditions[cells['J']] += 1
            add(areas[code], receipt['id'], year, source)
            add(national, receipt['id'], year, source)
            # Equality diagnostic includes every published content field A:J, including furigana.
            identity = tuple(cells.get(c, '') for c in 'ABCDEFGHIJ')
            duplicate_tuples[identity].append([receipt['id'], row_number])
            matrix.update((json.dumps([receipt['id'], row_number, code, year, cells['J']], ensure_ascii=False, separators=(',', ':')) + '\n').encode())
        if count != receipt['expectedRows']:
            raise ValueError('Published row count mismatch: ' + receipt['id'])
        proof_files.append({**receipt, 'rows': count, 'unknownYearCount': unknown, 'dataRows1Based': [4, count + 3], 'prefectureCounts': dict(sorted(source_areas.items())), 'conditions': dict(conditions), 'nameMissingButFuriganaPresentRows': name_missing_locators})
    if national['publishedCount'] != source['expectedPublishedCount'] or national['unknownYearCount'] != source['expectedUnknownYearCount']:
        raise ValueError('Published national totals mismatch')
    if any(a['publishedCount'] == 0 for a in areas.values()):
        raise ValueError('Missing prefecture observations')
    duplicate_groups = [locators for locators in duplicate_tuples.values() if len(locators) > 1]
    snapshot = {'schemaVersion': 1, 'profileKey': source['profileKey'], 'generatedAt': job['generatedAt'],
                'year': source['year'], 'asOf': source['asOf'], 'unit': source['unit'],
                'definition': source['definition'],
                'sources': [{k: s[k] for k in ['id', 'url', 'sha256']} for s in source['sources']],
                'national': finish(national),
                'areas': [{'areaCode': p['prefCode'], 'areaName': p['prefName'], **finish(areas[p['prefCode']])} for p in sorted(job['prefectures'], key=lambda p: p['prefCode'])]}
    proof = {'status': 'PASS', 'rawRows': national['publishedCount'], 'rejects': 0, 'files': proof_files,
             'matrixSha256': matrix.hexdigest(), 'matrixColumns': ['sourceId', 'row1Based', 'areaCode', 'constructionFiscalYearOrNull', 'condition'],
             'identicalPublishedFieldGroups': len(duplicate_groups), 'identicalPublishedFieldExtraRows': sum(len(g) - 1 for g in duplicate_groups),
             'duplicatePolicy': source['definition']['duplicatePolicy'], 'duplicateIdentityColumns': 'A:J (all content, includes furigana)', 'duplicateLocators': duplicate_groups,
             'publishedCount': national['publishedCount'], 'knownYearCount': national['knownYearCount'], 'unknownYearCount': national['unknownYearCount'],
             'prefectures': len(areas), 'reportPrintedPage111CountMatch': national['publishedCount'] == source['report']['annualPublishedCount'],
             'allManagedBridgeCountNotDenominator': source['report']['allManagedBridgeCount']}
    return {'snapshot': snapshot, 'proof': proof}

if __name__ == '__main__':
    json.dump(run(json.load(sys.stdin)), sys.stdout, ensure_ascii=False, separators=(',', ':'))
    sys.stdout.write('\n')
