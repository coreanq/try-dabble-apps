"""모델 좌표(m, Z-up) → SeatView 좌표(m, Y-up, 무대 원점, 관중석 +Z).
사용: $BPY frame.py work/ --stage-angle A --stage-radius R [--floor-z F]
모델 각도 규약: theta = atan2(x - cx, y - cy) (deg), 0° = 모델 +Y.
"""
import argparse, json, os
import numpy as np

def make_frame(chairs_model, stage_angle_deg, stage_radius_m, floor_z=0.0):
    c = np.asarray(chairs_model)[:, :2].mean(0)
    return {'center_model': [float(c[0]), float(c[1])], 'stage_angle_deg': float(stage_angle_deg),
            'stage_radius_m': float(stage_radius_m), 'floor_z': float(floor_z)}

def _rot(frame):
    """모델 XY를 회전해 무대 방향이 +Y가 되게 하는 2x2 행렬."""
    a = np.radians(frame['stage_angle_deg'])
    # theta' = theta - A. theta = atan2(x, y)이므로 (x,y)를 -A만큼 회전: x' = x cosA - y sinA, y' = x sinA + y cosA
    return np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])

def apply_frame(frame, pts_model):
    P = np.asarray(pts_model, dtype=np.float64)
    c = np.array(frame['center_model'])
    xy = (P[:, :2] - c) @ _rot(frame).T            # 무대 방향 = +Y
    xy[:, 1] -= frame['stage_radius_m']            # 무대 중앙 → 원점
    z = P[:, 2] - frame['floor_z']
    # Blender/모델(Z-up, 무대 방향 +Y) → SeatView(Y-up, 관중석 +Z): x_sv = x, y_sv = z, z_sv = -y
    return np.column_stack([xy[:, 0], z, -xy[:, 1]])

def angle_deg(pts_sv, center_sv):
    P = np.asarray(pts_sv)
    return np.degrees(np.arctan2(P[:, 0] - center_sv[0], P[:, 2] - center_sv[1]))

def load_frame(work_dir):
    return json.load(open(os.path.join(work_dir, 'frame.json')))

def load_chairs_with_materials(work_dir):
    """(N,3) 모델 좌표와 (N,) 재질 이름. chairs.json의 materials는 chairs와 같은 길이의 병렬 목록이다."""
    d = json.load(open(os.path.join(work_dir, 'chairs.json')))
    return np.array(d['chairs'], dtype=np.float64), np.array(d['materials'])

def load_chairs(work_dir, materials=None):
    """materials(이름 목록)를 주면 그 재질의 의자만 돌려준다. 좌석이 아닌 팔걸이(chair_1)를 빼는 데 쓴다."""
    P, mats = load_chairs_with_materials(work_dir)
    if materials:
        P = P[np.isin(mats, list(materials))]
    return P

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('work'); ap.add_argument('--stage-angle', type=float, required=True)
    ap.add_argument('--stage-radius', type=float, required=True); ap.add_argument('--floor-z', type=float, default=0.0)
    ap.add_argument('--materials', default='chair_orange,yellow_chair__1,yellow_chair__3,red_charir',
                    help='좌석으로 볼 재질 이름(쉼표 구분). frame.json에 저장되어 뒤 단계가 같은 값을 쓴다')
    a = ap.parse_args()
    mats = [m for m in a.materials.split(',') if m]
    f = make_frame(load_chairs(a.work, mats), a.stage_angle, a.stage_radius, a.floor_z)
    f['materials'] = mats
    json.dump(f, open(os.path.join(a.work, 'frame.json'), 'w'), indent=1)
    sv = apply_frame(f, load_chairs(a.work, mats))
    print('frame.json written', f)
    print('seatview bbox min', sv.min(0).round(2), 'max', sv.max(0).round(2))
