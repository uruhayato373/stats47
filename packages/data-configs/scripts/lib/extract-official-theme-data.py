"""Pinned official PDF/XLSX extraction. Input/spec on stdin, observations on stdout.

Dependencies: pdfplumber, openpyxl. Documents and extracted observations stay outside git.
Column/page/year/unit selections are supplied by the TS provenance SSOT.
"""
import json
import re
import sys
import unicodedata


def compact(value):
    text = unicodedata.normalize("NFKC", str(value))
    # CJK radicals used by this PDF font are not all folded by NFKC.
    text = text.translate(str.maketrans({"⻑": "長", "⻘": "青", "⿅": "鹿"}))
    return re.sub(r"\s+", "", text)


def extract_pdf(path, spec, prefectures):
    import pdfplumber
    with pdfplumber.open(path) as pdf:
        page = pdf.pages[spec["page"] - 1]
        words = page.extract_words()
        rows = []
        evidence = []
        for column in spec["columns"]:
            left = column["nameX"][0]
            right = column["valueX"][1]
            headings = "".join(compact(w["text"]) for w in words
                               if left <= w["x0"] < right and w["top"] < 100)
            if compact(column["heading"]) not in headings:
                raise ValueError("PDF year heading does not match column")
            names = [w for w in words if column["nameX"][0] <= w["x0"] < column["nameX"][1]
                     and spec["rowTop"][0] <= w["top"] <= spec["rowTop"][1]
                     and compact(w["text"]) in prefectures]
            numbers = [w for w in words if column["valueX"][0] <= w["x0"] < column["valueX"][1]
                       and spec["rowTop"][0] <= w["top"] <= spec["rowTop"][1]
                       and re.fullmatch(r"\d{2}\.\d{2}", w["text"])]
            if len(names) != 47 or len(numbers) != 47:
                raise ValueError(f"PDF column {column['year']} requires 47 names/means, got {len(names)}/{len(numbers)}")
            used = set()
            ordered_values = []
            for name in sorted(names, key=lambda w: w["top"]):
                matches = [(i, w) for i, w in enumerate(numbers)
                           if abs(w["top"] - name["top"]) <= spec["rowTolerance"]]
                if len(matches) != 1 or matches[0][0] in used:
                    raise ValueError("PDF row does not have exactly one unused mean")
                index, number = matches[0]
                used.add(index)
                value = float(number["text"])
                if not 65 <= value <= 85:
                    raise ValueError("PDF health expectancy outside reviewed range")
                pref = prefectures[compact(name["text"])]
                rows.append(dict(areaCode=pref["prefCode"], areaName=pref["prefName"],
                                 yearCode=str(column["year"]), yearName=f"{column['year']}年",
                                 value=value, unit=spec["unit"]))
                ordered_values.append(value)
            if ordered_values != sorted(ordered_values, reverse=True):
                raise ValueError("PDF means do not follow chart's descending order")
            evidence.append(dict(year=column["year"], pdfPage=spec["page"],
                                 nameCount=len(names), meanCount=len(numbers),
                                 heading=column["heading"], allRowsMatched=True))
        return dict(rows=rows, evidence=evidence)


def extract_xlsx(path, spec, prefectures):
    import openpyxl
    book = openpyxl.load_workbook(path, data_only=True, read_only=True)
    sheet = book[spec["sheet"]]
    for cell, expected in spec["headers"].items():
        if compact(sheet[cell].value) != compact(expected):
            raise ValueError(f"XLSX heading changed at {cell}")
    rows = []
    for number in range(spec["rows"][0], spec["rows"][1] + 1):
        pref = prefectures[compact(sheet[f"{spec['nameColumn']}{number}"].value)]
        ordinal = int(re.sub(r"\D", "", compact(sheet[f"{spec['codeColumn']}{number}"].value)))
        if ordinal != int(pref["prefCode"][:2]):
            raise ValueError("XLSX prefecture name/code mismatch")
        value = sheet[f"{spec['valueColumn']}{number}"].value
        if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
            raise ValueError("XLSX total output is not a positive number")
        rows.append(dict(areaCode=pref["prefCode"], areaName=pref["prefName"],
                         yearCode=str(spec["year"]), yearName=f"{spec['year']}年",
                         value=value, unit=spec["sourceUnit"]))
    if compact(sheet[spec["totalLabelCell"]].value) != "合計":
        raise ValueError("XLSX total row changed")
    total = sheet[spec["totalValueCell"]].value
    difference = abs(sum(row["value"] for row in rows) - total)
    # Each prefecture and the total are rounded to the nearest source unit.
    if difference > (len(rows) + 1) / 2:
        raise ValueError("XLSX prefecture sum does not match published total within rounding")
    return dict(rows=rows, evidence=dict(sheet=spec["sheet"], rowCount=len(rows),
                sourceUnit=spec["sourceUnit"], totalDifference=difference,
                totalRoundingTolerance=(len(rows) + 1) / 2, headersMatched=True))


def main():
    request = json.load(sys.stdin)
    prefectures = {}
    for pref in request["prefectures"]:
        name = compact(pref["prefName"])
        prefectures[name] = pref
        if name != "北海道":
            prefectures[name[:-1]] = pref
    result = {}
    for job in request["jobs"]:
        extractor = extract_pdf if job["spec"]["kind"] == "healthy-life-pdf" else extract_xlsx
        result[job["key"]] = extractor(job["path"], job["spec"], prefectures)
    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
