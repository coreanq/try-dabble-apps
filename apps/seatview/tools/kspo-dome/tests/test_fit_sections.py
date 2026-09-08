import os, sys, unittest
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fit_sections as fs

def synth_arc(center, radius0, row_depth, riser, base_h, a0, a1, seats_per_row):
    """seat-engine arcPlacer와 같은 규칙으로 의자 점을 만든다."""
    pts = []
    span = a1 - a0
    for r, n in enumerate(seats_per_row):
        radius = radius0 + (r + 0.5) * row_depth
        for s in range(n):
            a = np.radians(a0 + (s + 0.5) / n * span)
            pts.append([center[0] + radius * np.sin(a), base_h + r * riser, center[1] + radius * np.cos(a)])
    return np.array(pts)

class FitTest(unittest.TestCase):
    def test_recovers_arc_parameters(self):
        center = [0.0, 40.0]
        pts = synth_arc(center, 30.0, 0.9, 0.4, 1.5, -20.0, 10.0, [20, 21, 22, 23])
        cfg = {'id': '5', 'label': '1층 5구역', 'tier': 0, 'angleStart': -25, 'angleEnd': 15, 'expected': 86}
        sec, rep = fs.fit_arc(cfg, pts, center)
        self.assertEqual(sec['rows'], 4)
        self.assertEqual(sec['seatsPerRow'], [20, 21, 22, 23])
        self.assertAlmostEqual(sec['rowDepth'], 0.9, places=2)
        self.assertAlmostEqual(sec['riser'], 0.4, places=2)
        self.assertAlmostEqual(sec['baseHeight'], 1.5, places=2)
        self.assertAlmostEqual(sec['shape']['radiusStart'], 30.0, places=1)
        self.assertAlmostEqual(sec['shape']['angleStart'], -20.0, places=1)
        self.assertAlmostEqual(sec['shape']['angleEnd'], 10.0, places=1)
        self.assertLess(rep['meanErr'], 0.05)
        self.assertLess(rep['maxErr'], 0.1)
        self.assertEqual(rep['count'], 86)

    def test_place_arc_matches_engine_rule(self):
        sec = {'id': 'x', 'shape': {'type': 'arc', 'center': [0, 40], 'radiusStart': 30, 'angleStart': 0, 'angleEnd': 90},
               'rows': 1, 'rowDepth': 1.0, 'riser': 0.0, 'baseHeight': 2.0, 'seatsPerRow': [2]}
        P = fs.place_arc(sec)
        np.testing.assert_allclose(P[0], [30.5 * np.sin(np.radians(22.5)), 2.0, 40 + 30.5 * np.cos(np.radians(22.5))], atol=1e-9)

    def test_template_section_copies_rows_and_splits_expected(self):
        base = {'id': '4', 'label': '1층 4구역', 'shape': {'type': 'arc', 'center': [0, 40], 'radiusStart': 30.0, 'angleStart': -60.0, 'angleEnd': -50.0},
                'rows': 4, 'rowDepth': 0.9, 'riser': 0.4, 'baseHeight': 1.5, 'seatsPerRow': [20, 21, 22, 23]}
        sec = fs.template_section({'id': '5', 'label': '1층 5구역', 'angleStart': -49.0, 'angleEnd': -39.0, 'expected': 90}, base)
        self.assertEqual(sec['id'], '5')
        self.assertEqual(sec['rows'], 4)
        self.assertEqual(sec['seatsPerRow'], [21, 22, 23, 24])       # base 비율 × 90/86, 나머지는 소수부 큰 열부터
        self.assertEqual(sec['shape']['angleStart'], -49.0)
        self.assertEqual(sec['shape']['radiusStart'], 30.0)
        self.assertEqual(base['shape']['angleStart'], -60.0)          # 원본은 그대로

    def test_explicit_rows_are_front_to_back_and_left_to_right(self):
        pts = np.array([[1.0, 5.0, 60.0], [-1.0, 5.0, 60.0], [0.0, 5.4, 61.0]])   # 앞열 2석(각도 순), 뒷열 1석
        sec = fs.explicit_section({'id': 'BOX-1', 'label': 'Box객석 1'}, pts, [0.0, 40.0])
        self.assertEqual([(s['row'], s['seat']) for s in sec['seats']], [('1', 1), ('1', 2), ('2', 1)])
        self.assertEqual(sec['seats'][0]['position'][0], -1.0)   # 왼쪽(-X)이 1번

if __name__ == '__main__':
    unittest.main()
