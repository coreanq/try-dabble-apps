import os, sys, unittest
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import frame as fr

class FrameTest(unittest.TestCase):
    def test_stage_direction_maps_to_minus_z_and_center_to_plus_z(self):
        # 모델: 아레나 중심 (100, 50), 무대는 중심에서 각도 90°(=+X 방향) 40 m 지점
        chairs = np.array([[100 + 30, 50 + 0, 1.0], [100 - 30, 50, 1.0], [100, 50 + 30, 1.0], [100, 50 - 30, 1.0]])
        f = fr.make_frame(chairs, stage_angle_deg=90, stage_radius_m=40, floor_z=0.0)
        self.assertAlmostEqual(f['center_model'][0], 100); self.assertAlmostEqual(f['center_model'][1], 50)
        sv = fr.apply_frame(f, np.array([[140.0, 50.0, 0.0], [100.0, 50.0, 2.0], [60.0, 50.0, 0.0]]))
        np.testing.assert_allclose(sv[0], [0, 0, 0], atol=1e-9)        # 무대 중앙 → 원점
        np.testing.assert_allclose(sv[1], [0, 2, 40], atol=1e-9)       # 아레나 중심 → (0, 높이2, +40)
        np.testing.assert_allclose(sv[2], [0, 0, 80], atol=1e-9)       # 무대 반대편 → +Z 멀리
        # 무대를 보고 오른쪽(+X_sv)은 모델에서 어느 쪽인지: 각도 90°에서 시계 방향으로 90° 더 간 180°(-Y 방향)
        right = fr.apply_frame(f, np.array([[100.0, 50.0 - 30.0, 0.0]]))[0]
        self.assertGreater(right[0], 0)

    def test_angle_deg_zero_faces_stage(self):
        pts = np.array([[0, 0, 80.0], [10, 0, 40.0], [-10, 0, 40.0]])
        a = fr.angle_deg(pts, [0, 40])
        np.testing.assert_allclose(a, [0, 90, -90], atol=1e-9)

    def test_load_chairs_filters_by_material(self):
        import json, os, tempfile
        d = tempfile.mkdtemp()
        json.dump({'units': 'm', 'frame': 'model', 'chairs': [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
                   'materials': ['chair_orange', 'chair_1', 'red_charir']}, open(os.path.join(d, 'chairs.json'), 'w'))
        self.assertEqual(fr.load_chairs(d).shape, (3, 3))
        self.assertEqual(fr.load_chairs(d, ['chair_orange', 'red_charir'])[:, 0].tolist(), [0.0, 2.0])
        P, m = fr.load_chairs_with_materials(d)
        self.assertEqual(m.tolist(), ['chair_orange', 'chair_1', 'red_charir'])

if __name__ == '__main__':
    unittest.main()
