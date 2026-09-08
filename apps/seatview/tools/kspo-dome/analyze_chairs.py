"""chairs.json 요약: 층(z), 열(반경), 각도 덩어리(통로로 나뉜 구역 후보). 사용: $BPY analyze_chairs.py work/ [--frame]
--frame을 주면 frame.json을 적용해 SeatView 좌표·각도로 보고한다(없으면 모델 좌표, 각도 0° = 모델 +Y)."""
import argparse, json, os
import numpy as np
import frame as fr

TIER_GAP = 1.5      # 이보다 큰 z 간격이면 층이 바뀐다(m)
ROW_GAP = 0.35      # 이보다 큰 반경 간격이면 열이 바뀐다(m)
AISLE_DEG = 1.0     # 이 각도만큼 빈 구간이면 통로

def clusters_1d(values, gap):
    """정렬된 1차원 값들을 gap보다 큰 틈에서 나눈다. 각 덩어리의 (min, max, count) 목록."""
    v = np.sort(values)
    if v.size == 0:
        return []
    cuts = np.where(np.diff(v) > gap)[0] + 1
    out = []
    for part in np.split(v, cuts):
        out.append((float(part[0]), float(part[-1]), int(part.size)))
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('work'); ap.add_argument('--frame', action='store_true')
    ap.add_argument('--materials', default='chair_orange,yellow_chair__1,yellow_chair__3,red_charir')
    a = ap.parse_args()
    mats = [m for m in a.materials.split(',') if m]
    P, allm = fr.load_chairs_with_materials(a.work)
    keep = np.isin(allm, mats); P, allm = P[keep], allm[keep]
    print('materials:', {m: int((allm == m).sum()) for m in mats})
    if a.frame:
        f = fr.load_frame(a.work)
        S = fr.apply_frame(f, P)
        center = [0.0, f['stage_radius_m']]
        x, h, z = S[:, 0], S[:, 1], S[:, 2]
        r = np.hypot(x - center[0], z - center[1]); ang = fr.angle_deg(S, center)
    else:
        c = P[:, :2].mean(0)
        x, z, h = P[:, 0] - c[0], P[:, 1] - c[1], P[:, 2]
        r = np.hypot(x, z); ang = np.degrees(np.arctan2(x, z))
    print(f'{len(P)} chairs; height {h.min():.2f}..{h.max():.2f}; radius {r.min():.1f}..{r.max():.1f}')
    tiers = clusters_1d(h, TIER_GAP)
    for ti, (lo, hi, n) in enumerate(tiers):
        m = (h >= lo) & (h <= hi)
        rows = clusters_1d(r[m], ROW_GAP)
        print(f'\n== tier {ti}: height {lo:.2f}..{hi:.2f}, {n} chairs, {len(rows)} rows, radius {r[m].min():.1f}..{r[m].max():.1f}')
        # 각도 덩어리(통로): 0.25° 격자로 점유 여부를 보고 AISLE_DEG 이상 비면 자른다
        bins = np.zeros(1440, dtype=bool)
        bins[((ang[m] + 180) / 0.25).astype(int) % 1440] = True
        empty_run = 0; starts = []; occupied = False; start = None
        for i in range(1441):
            occ = bins[i % 1440]
            if occ and not occupied:
                occupied = True; start = i
            elif not occ and occupied:
                occupied = False; starts.append((start, i))
        blocks = []
        for s, e in starts:
            a0, a1 = s * 0.25 - 180, e * 0.25 - 180
            if blocks and a0 - blocks[-1][1] < AISLE_DEG:
                blocks[-1][1] = a1
            else:
                blocks.append([a0, a1])
        for bi, (a0, a1) in enumerate(blocks):
            mm = m & (ang >= a0) & (ang < a1)
            rows_b = clusters_1d(r[mm], ROW_GAP)
            by_mat = ','.join(f'{k}={int((allm[mm] == k).sum())}' for k in mats if (allm[mm] == k).any())
            print(f'  block {bi:2d}: angle {a0:7.2f}..{a1:7.2f}  chairs {mm.sum():5d}  rows {len(rows_b):2d}  '
                  f'r {r[mm].min():.1f}..{r[mm].max():.1f}  h {h[mm].min():.2f}..{h[mm].max():.2f}  {by_mat}')
    # SVG 평면도
    W = 1400; scale = W / (r.max() * 2.2)
    def sx(v): return W / 2 + v * scale
    def sy(v): return W / 2 - v * scale
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" style="background:#fff">']
    for ti, (lo, hi, _) in enumerate(tiers):
        m = (h >= lo) & (h <= hi)
        for px, pz in zip(x[m], z[m]):
            parts.append(f'<circle cx="{sx(px):.1f}" cy="{sy(pz):.1f}" r="1.2" fill="{colors[ti % 5]}"/>')
    for d in range(0, 360, 30):
        t = np.radians(d)
        parts.append(f'<line x1="{sx(0)}" y1="{sy(0)}" x2="{sx(np.sin(t)*r.max()*1.05):.1f}" y2="{sy(np.cos(t)*r.max()*1.05):.1f}" stroke="#ccc"/>')
        parts.append(f'<text x="{sx(np.sin(t)*r.max()*1.08):.1f}" y="{sy(np.cos(t)*r.max()*1.08):.1f}" font-size="14" fill="#666">{d if d <= 180 else d - 360}°</text>')
    parts.append('</svg>')
    open(os.path.join(a.work, 'chairs.svg'), 'w').write('\n'.join(parts))
    print('\nwrote chairs.svg (x right, z(or model y) up; tiers coloured)')

if __name__ == '__main__':
    main()
