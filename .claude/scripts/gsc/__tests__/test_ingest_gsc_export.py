import copy
import csv
import importlib.util
from pathlib import Path
import sys
import io
import os
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("ingest", Path(__file__).resolve().parents[1] / "ingest-gsc-export.py")
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)


def fixture():
    reasons = ["見つかりませんでした（404）", "ソフト 404", "サーバーエラー（5xx）", "クロール済み - インデックス未登録", "検出 - インデックス未登録"]
    reports = [{"category": None, "aggregate": {reason: 1 for reason in reasons}, "drilldown": None}]
    reports.extend({"category": ingest.CATEGORY_MAP[reason], "aggregate": None,
                    "drilldown": ["URL,前回のクロール", "https://stats47.jp/example,2026-09-18"]} for reason in reasons)
    return reports


class CoverageContract(unittest.TestCase):
    def test_normalization_preserves_every_quoted_url(self):
        lines = ['URL,前回のクロール', '"https://stats47.jp/example?a=1,2",2026-09-18', 'https://stats47.jp/,']
        text, count = ingest.normalize_drilldown(lines)
        self.assertEqual(count, 2)
        self.assertEqual(list(csv.reader(text.splitlines())), list(csv.reader(lines)))
        with self.assertRaisesRegex(ValueError, 'drilldown row'):
            ingest.normalize_drilldown(['URL,前回のクロール', 'not-a-url,2026-09-18'])

    def test_complete(self):
        ingest.validate_actionable_reports(fixture())

    def test_domain_property_includes_subdomains_and_quoted_csv_urls(self):
        for host in ["stats47.jp", "www.stats47.jp", "storage.stats47.jp"]:
            reports = fixture()
            reports[-1]["drilldown"][1] = f'"https://{host}/example?a=1,2",2026-09-18'
            ingest.validate_actionable_reports(reports)

    def test_overview_cannot_replace_discovered_drilldown(self):
        reports = fixture()
        reports[-1] = copy.deepcopy(reports[0])
        with self.assertRaisesRegex(ValueError, "discovered-not-indexed"):
            ingest.validate_actionable_reports(reports)

    def test_missing_duplicate_wrong_count_and_foreign_site(self):
        for mode in ["missing", "duplicate", "row-count", "foreign", "lookalike", "duplicate-url", "no-totals"]:
            reports = fixture()
            if mode == "missing":
                reports.pop()
            elif mode == "duplicate":
                reports.append(copy.deepcopy(reports[-1]))
            elif mode == "row-count":
                reports[-1]["drilldown"].pop()
            elif mode == "foreign":
                reports[-1]["drilldown"][1] = "https://doboku-note.com/example,2026-09-18"
            elif mode == "lookalike":
                reports[-1]["drilldown"][1] = "https://notstats47.jp/example,2026-09-18"
            elif mode == "duplicate-url":
                reports[0]["aggregate"]["検出 - インデックス未登録"] = 2
                reports[-1]["drilldown"].append(reports[-1]["drilldown"][1])
            else:
                reports.pop(0)
            with self.subTest(mode=mode), self.assertRaises(ValueError):
                ingest.validate_actionable_reports(reports)

    def test_documented_1000_row_export_cap_is_not_missing_data(self):
        reports = fixture()
        reports[0]["aggregate"]["検出 - インデックス未登録"] = 1128
        reports[-1]["drilldown"] = ["URL,前回のクロール"] + [f"https://stats47.jp/example-{i},2026-09-18" for i in range(1000)]
        ingest.validate_actionable_reports(reports)

    def test_overview_chart_yields_latest_indexed_count(self):
        chart = "日付,未登録,登録済み,表示回数\n2026-09-19,21000,5100,900\n2026-09-20,20900,5230,950\n"
        self.assertEqual(ingest.parse_index_status(chart), {"date": "2026-09-20", "indexed": 5230, "not_indexed": 20900})

    def test_category_chart_is_not_mistaken_for_indexed_count(self):
        # 2026-W38 の coverage-trend.csv はカテゴリ別グラフで、登録済み列を持たない
        self.assertIsNone(ingest.parse_index_status("日付,該当ページ\n2026-09-14,785\n"))
        self.assertIsNone(ingest.parse_index_status("日付,未登録,登録済み,表示回数\n"))

    def test_submitted_zip_is_separated_by_name(self):
        self.assertTrue(ingest.is_submitted_zip("/x/インデックス-stats47.jp-Coverage-2026-11-11-概要-送信済みビュー.zip"))
        self.assertFalse(ingest.is_submitted_zip("/x/インデックス-stats47.jp-Coverage-2026-11-11-概要.zip"))

    def test_submitted_record_and_history(self):
        import tempfile, os
        report = {"trend": "日付,未登録,登録済み,表示回数\n2026-11-06,1977,6729,10\n",
                  "aggregate": {"検出 - インデックス未登録": 1134, "ソフト 404": 0, "noindex タグによって除外されました": 578}}
        rec = ingest.build_submitted_record(report, "2026-W45", "2026-11-07")
        self.assertEqual(rec["index_status"]["indexed"], 6729)
        self.assertEqual(rec["totals"]["soft-404"], 0)
        self.assertIsNone(ingest.build_submitted_record({"trend": "日付,該当ページ\n2026-11-06,1\n", "aggregate": {}}, "w", "d"))
        self.assertIsNone(ingest.build_submitted_record(None, "w", "d"))
        path = os.path.join(tempfile.mkdtemp(), "h.csv")
        ingest.update_submitted_history(path, "2026-W44", "2026-10-31", None)
        ingest.update_submitted_history(path, "2026-W45", "2026-11-07", rec)
        # captured の週は後からの未取得で上書きされない
        self.assertFalse(ingest.update_submitted_history(path, "2026-W45", "2026-11-07", None))
        rows = list(csv.DictReader(open(path, encoding="utf-8")))
        self.assertEqual([r["status"] for r in rows], ["missing", "captured"])
        self.assertEqual(rows[0]["indexed"], "")  # 0 で埋めない
        self.assertEqual(rows[1]["indexed"], "6729")
        self.assertEqual(rows[1]["not-indexed"], "1977")
        self.assertEqual(rows[1]["discovered-not-indexed"], "1134")
        self.assertEqual(rows[1]["soft-404"], "0")
        self.assertEqual(rows[1]["robots-blocked"], "")  # 表に無い理由は空欄


def make_overview_zip(path, sitemap, with_confirm=True):
    """実物と同じ構造 (4 CSV・ヘッダー・cp437 で化けた cp932 ファイル名) の概要 zip を作る。"""
    head = "理由,ソース,確認,ページ" if with_confirm else "理由,ソース,ページ"

    def row(reason, state, n):
        return f"{reason},ウェブサイト,{state},{n}" if with_confirm else f"{reason},ウェブサイト,{n}"
    files = {
        "重大な問題.csv": "\n".join([head, row("検出 - インデックス未登録", "合格", 1134), row("ソフト 404", "開始前", 0),
                                  row("未知の理由", "失敗", 3)]) + "\n",
        "重大ではない問題.csv": "\n".join([head, row("noindex タグによって除外されました", "開始", 578)]) + "\n",
        "メタデータ.csv": f"プロパティ,値\nサイトマップ,{sitemap}\n",
        "推移.csv": "日付,未登録,登録済み,表示回数\n2026-11-06,1977,6729,10\n",
    }
    with zipfile.ZipFile(path, "w") as z:
        for name, text in files.items():
            info = zipfile.ZipInfo(name.encode("cp932").decode("cp437"))  # unzip が化かす名前を再現
            z.writestr(info, text.encode("utf-8-sig"))


class ValidationAndView(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def zip(self, name, sitemap, **kw):
        p = os.path.join(self.dir, name)
        make_overview_zip(p, sitemap, **kw)
        return p

    def test_validation_per_reason(self):
        r = ingest.process_zip(self.zip("stats47.jp-Coverage-概要.zip", ingest.SITEMAP_ALL_KNOWN))
        self.assertEqual(r["validation"]["検出 - インデックス未登録"], "合格")
        self.assertEqual(r["sitemap"], ingest.SITEMAP_ALL_KNOWN)
        v = ingest.canonical_validation(r["validation"])
        self.assertEqual(v["discovered-not-indexed"], "合格")
        self.assertEqual(v["soft-404"], "開始前")
        self.assertEqual(v["noindex-excluded"], "開始")
        self.assertEqual(v["未知の理由"], "失敗")  # 写像できない理由は生のラベル

    def test_no_confirm_column_gives_empty(self):
        r = ingest.process_zip(self.zip("stats47.jp-Coverage-概要.zip", ingest.SITEMAP_ALL_KNOWN, with_confirm=False))
        self.assertEqual(r["validation"], {})
        rec = ingest.build_submitted_record(r, "w", "d")
        self.assertEqual(rec["validation"], {})

    def test_submitted_by_metadata_without_marker(self):
        zp = self.zip("stats47.jp-Coverage-概要.zip", ingest.SITEMAP_ALL_SUBMITTED)
        self.assertEqual(ingest.classify_view(zp, ingest.process_zip(zp))[0], "submitted")
        zp2 = self.zip("stats47.jp-Coverage-2.zip", ingest.SITEMAP_ALL_KNOWN)
        self.assertEqual(ingest.classify_view(zp2, ingest.process_zip(zp2))[0], "known")
        zp3 = self.zip("stats47.jp-Coverage-概要-送信済みビュー.zip", ingest.SITEMAP_ALL_SUBMITTED)
        self.assertEqual(ingest.classify_view(zp3, ingest.process_zip(zp3))[0], "submitted")

    def test_mismatch_is_missing(self):
        src, out = tempfile.mkdtemp(), tempfile.mkdtemp()
        make_overview_zip(os.path.join(src, "stats47.jp-Coverage-概要-送信済みビュー.zip"), ingest.SITEMAP_ALL_KNOWN)
        self.assertEqual(ingest.classify_view(os.path.join(src, "stats47.jp-Coverage-概要-送信済みビュー.zip"),
                                              ingest.process_zip(os.path.join(src, "stats47.jp-Coverage-概要-送信済みビュー.zip")))[0], "mismatch")
        import subprocess
        hist = os.path.join(out, "h.csv")
        code = (f"import importlib.util,sys;sys.dont_write_bytecode=True;"
                f"s=importlib.util.spec_from_file_location('i',{str(Path(ingest.__file__))!r});m=importlib.util.module_from_spec(s);s.loader.exec_module(m);"
                f"m.DRILLDOWN_DIR={out!r};m.SUBMITTED_HISTORY={hist!r};sys.argv=['x','--src',{src!r},'--week','2026-W46','--date','2026-11-11'];m.main()")
        res = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn("取り違え", res.stderr)
        self.assertFalse(os.path.exists(os.path.join(out, "2026-W46", "submitted-totals.json")))
        self.assertFalse(os.path.exists(os.path.join(out, "2026-W46", "category-totals.json")))
        self.assertEqual(list(csv.DictReader(open(hist, encoding="utf-8")))[0]["status"], "missing")


if __name__ == "__main__":
    unittest.main()
