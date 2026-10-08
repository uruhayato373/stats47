"""Run: python3 -I packages/gis/src/geo-analysis/low-elevation-population-overlay.test.py"""
import importlib.util, pathlib, unittest

spec = importlib.util.spec_from_file_location('overlay', pathlib.Path(__file__).with_name('low-elevation-population-overlay.py'))
o = importlib.util.module_from_spec(spec); spec.loader.exec_module(o)

S = o.SCALE
# (meshId, municipality, populationScaled, (mean,max,min)|None)
ROWS = [
    ('1', '13101', 100 * S, (-0.4, 2.0, -1.0)),     # mean <= 0
    ('2', '13101', 200 * S, (0.0, 3.0, 0.0)),       # boundary: 0 is included in <=0
    ('3', '13101', 300 * S, (5.0, 9.0, 1.0)),       # boundary: 5 is included in <=5
    ('4', '13101', 400 * S, (5.1, 9.0, 4.9)),       # mean above 5 but min below 5
    ('5', '13101', 500 * S, (10.0, 12.0, 8.0)),     # boundary: 10 is included in <=10
    ('6', '13101', 600 * S, (30.0, 80.0, 10.1)),
    ('7', '13101', 7 * S, None),                    # unknown elevation: never counted as low
]


class LowElevationTest(unittest.TestCase):
    def test_mesh_bounds_known_cell(self):
        w, s, e, n = o.mesh_bounds('53394611')   # Tokyo station area
        self.assertAlmostEqual(w, 139.7625, places=6); self.assertAlmostEqual(s, 35.675, places=6)
        self.assertAlmostEqual(e - w, 1 / 80); self.assertAlmostEqual(n - s, 1 / 120)

    def test_bands_are_exclusive_and_conserve_population(self):
        s = o.summarize(ROWS)
        self.assertEqual([b[0] for b in s['bands']], [1, 2, 1, 2, 1])
        self.assertEqual(sum(b[1] for b in s['bands']), s['populationScaled'])
        self.assertEqual(s['populationScaled'], 2107 * S)

    def test_threshold_boundaries_are_inclusive_and_cumulative(self):
        s = o.summarize(ROWS)
        self.assertEqual(s['meanLe'][0][1], 300 * S)
        self.assertEqual(s['meanLe'][5][1], 600 * S)
        self.assertEqual(s['meanLe'][10][1], 1500 * S)
        self.assertLessEqual(s['meanLe'][0][1], s['meanLe'][5][1]); self.assertLessEqual(s['meanLe'][5][1], s['meanLe'][10][1])

    def test_min_basis_is_an_upper_bound_of_mean_basis(self):
        s = o.summarize(ROWS)
        for t in o.THRESHOLDS: self.assertGreaterEqual(s['minLe'][t][1], s['meanLe'][t][1])
        self.assertEqual(s['minLe'][5][1], 1000 * S)   # includes mesh 4 (min 4.9)

    def test_unknown_elevation_stays_out_of_every_low_class(self):
        s = o.summarize(ROWS)
        self.assertEqual(s['bands'][0], [1, 7 * S])
        self.assertTrue(all(7 * S not in (s['meanLe'][t][1], s['minLe'][t][1]) for t in o.THRESHOLDS))

    def test_share_math(self):
        self.assertEqual(o.share(600 * S, 2107 * S), round(600 / 2107 * 100, 4))
        self.assertIsNone(o.share(0, 0))

    def test_census_conservation_rejects_a_dropped_mesh(self):
        s = o.summarize(ROWS)
        o.pref_entry(s, 2107)                            # matches
        with self.assertRaises(ValueError): o.pref_entry(o.summarize(ROWS[:-2]), 2107)   # a mesh went missing
        with self.assertRaises(ValueError): o.pref_entry(s, 2108)

    def test_band_conservation_mutation_is_caught(self):
        s = o.summarize(ROWS)
        s['bands'][2][1] += 1                            # corrupt one band
        with self.assertRaises(ValueError): o.pref_entry(s, 2107)

    def test_encoding_matches_js_json_stringify(self):
        # The Web loader compares SHA-256 of JSON.stringify(parsed): 0.0 must be written as 0.
        self.assertEqual(o.encode({'a': 0.0, 'b': [1.5, 2.0, -0.0], 'c': True, 'd': '標高', 'e': None}),
                         '{"a":0,"b":[1.5,2,0],"c":true,"d":"標高","e":null}\n'.encode())
        self.assertEqual(o.encode({'a': [1.0], 'b': {}, 'c': []}, pretty=True),
                         '{\n  "a": [\n    1\n  ],\n  "b": {},\n  "c": []\n}\n'.encode())

    def test_dbf_reader_rejects_deleted_records(self):
        import struct
        head = struct.pack('<BBBBIHH20x', 3, 0, 0, 0, 1, 32 + 32 + 1, 1 + 4)
        field = b'G04a_001' + b'\0' * 3 + b'C' + b'\0' * 4 + bytes([4]) + b'\0' * 15
        ok = head + field + b'\x0d' + b' 1234'
        self.assertEqual(o.read_dbf(ok), [{'G04a_001': '1234'}])
        with self.assertRaises(ValueError): o.read_dbf(head + field + b'\x0d' + b'*1234')


if __name__ == '__main__':
    unittest.main()
