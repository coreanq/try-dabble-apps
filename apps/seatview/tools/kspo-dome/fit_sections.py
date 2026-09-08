"""chairs.json + sections.json → venue.json + work/fit-report.txt
사용: $BPY fit_sections.py work/ sections.json ../../public/venues/kspo-dome/venue.json"""
import json, os, sys
import numpy as np
import frame as fr
from analyze_chairs import clusters_1d, ROW_GAP

def select(pts_sv, mats, center, cfg, tiers):
    h = pts_sv[:, 1]
    t = tiers[cfg['tier']]
    ang = fr.angle_deg(pts_sv, center)
    r = np.hypot(pts_sv[:, 0] - center[0], pts_sv[:, 2] - center[1])
    m = (h >= t['hMin']) & (h < t['hMax']) & (ang >= cfg['angleStart']) & (ang < cfg['angleEnd'])
    if 'rMin' in cfg: m &= r >= cfg['rMin']
    if 'rMax' in cfg: m &= r < cfg['rMax']
    if 'material' in cfg: m &= mats == cfg['material']
    return pts_sv[m], r[m], ang[m]

def template_section(cfg, base):
    """의자가 없는 구역: base(피팅된 구역)의 열 구조를 복사하고 base의 열별 좌석 비율대로 expected를 나눈다.
    열 수로 고르게 나누면 앞뒤 열이 같아져 base의 부채꼴(뒤로 갈수록 넓어짐)이 사라진다.
    내림한 뒤 나머지는 소수부가 큰 열부터(같으면 뒷열부터) 1석씩 준다."""
    rows = base['rows']; exp = int(cfg['expected'])
    spr = base['seatsPerRow']
    prof = list(spr) if isinstance(spr, list) else [spr] * rows
    exact = [v * exp / sum(prof) for v in prof]
    per = [int(v) for v in exact]
    order = sorted(range(rows), key=lambda i: (exact[i] - per[i], i), reverse=True)
    for i in order[:exp - sum(per)]:
        per[i] += 1
    return {**base, 'id': cfg['id'], 'label': cfg['label'], 'seatsPerRow': per if len(set(per)) > 1 else per[0],
            'shape': {**base['shape'], 'angleStart': cfg['angleStart'], 'angleEnd': cfg['angleEnd']}}

def fit_line(values):
    """열 번호에 대한 최소제곱 직선 (기울기, 0열 값).
    열 간격이 일정하면 중앙값 방식과 같고, 구역 안에 가로통로가 있어 한 번 건너뛰면
    (1층 11열 뒤, 2·3층 2층/3층 사이) 오차를 앞뒤 열에 반씩 나눠 최대 오차를 절반으로 줄인다."""
    y = np.asarray(values, dtype=np.float64)
    x = np.arange(y.size)
    slope, intercept = np.linalg.lstsq(np.column_stack([x, np.ones(y.size)]), y, rcond=None)[0]
    return float(slope), float(intercept)

def fit_arc(cfg, pts, center):
    """구역의 의자들로 arc 파라미터를 맞춘다. pts: (N,3) SeatView 좌표."""
    r = np.hypot(pts[:, 0] - center[0], pts[:, 2] - center[1])
    ang = fr.angle_deg(pts, center)
    rows = clusters_1d(r, cfg.get('rowGap', ROW_GAP))
    row_r, row_h, counts, a_lo, a_hi = [], [], [], [], []
    for lo, hi, n in rows:
        m = (r >= lo) & (r <= hi)
        row_r.append(float(r[m].mean())); row_h.append(float(pts[m, 1].mean())); counts.append(int(n))
        pitch = (ang[m].max() - ang[m].min()) / max(n - 1, 1) if n > 1 else 0.0
        a_lo.append(float(ang[m].min() - pitch / 2)); a_hi.append(float(ang[m].max() + pitch / 2))
    n_rows = len(rows)
    row_depth, r0 = fit_line(row_r) if n_rows > 1 else (0.9, row_r[0])
    riser, h0 = fit_line(row_h) if n_rows > 1 else (0.0, row_h[0])
    sec = {
        'id': cfg['id'], 'label': cfg['label'],
        'shape': {'type': 'arc', 'center': [round(center[0], 2), round(center[1], 2)],
                  'radiusStart': round(r0 - row_depth / 2, 2),
                  'angleStart': round(float(np.median(a_lo)), 2), 'angleEnd': round(float(np.median(a_hi)), 2)},
        'rows': n_rows, 'rowDepth': round(row_depth, 3), 'riser': round(max(riser, 0.0), 3),
        'baseHeight': round(h0, 2), 'seatsPerRow': counts,
    }
    if len(set(counts)) == 1:
        sec['seatsPerRow'] = counts[0]
    gen = place_arc(sec)
    rep = error_report(gen, pts)
    rep['count'] = int(sum(counts)); rep['expected'] = cfg.get('expected')
    return sec, rep

def place_arc(sec):
    """seat-engine arcPlacer 규칙: radius = radiusStart + (r+0.5)*rowDepth, angle = start + (s+0.5)/n*span."""
    sh = sec['shape']; cx, cz = sh['center']; span = sh['angleEnd'] - sh['angleStart']
    spr = sec['seatsPerRow']
    out = []
    for ri in range(sec['rows']):
        n = spr if isinstance(spr, int) else spr[ri]
        radius = sh['radiusStart'] + (ri + 0.5) * sec['rowDepth']
        for s in range(n):
            a = np.radians(sh['angleStart'] + (s + 0.5) / n * span)
            out.append([cx + radius * np.sin(a), sec['baseHeight'] + ri * sec['riser'], cz + radius * np.cos(a)])
    return np.array(out)

def error_report(gen, pts):
    if gen.shape[0] == 0 or pts.shape[0] == 0:
        return {'meanErr': float('nan'), 'maxErr': float('nan')}
    d = np.sqrt(((gen[:, None, :] - pts[None, :, :]) ** 2).sum(-1)).min(1)
    return {'meanErr': float(d.mean()), 'maxErr': float(d.max())}

def explicit_section(cfg, pts, center):
    """Box·장애인석: 열은 반경으로(앞→뒤), 열 안은 각도 순(왼쪽→오른쪽)."""
    r = np.hypot(pts[:, 0] - center[0], pts[:, 2] - center[1])
    ang = fr.angle_deg(pts, center)
    seats = []
    for ri, (lo, hi, _) in enumerate(clusters_1d(r, cfg.get('rowGap', ROW_GAP))):
        idx = np.where((r >= lo) & (r <= hi))[0]
        idx = idx[np.argsort(ang[idx])]
        for si, i in enumerate(idx):
            seats.append({'row': str(ri + 1), 'seat': si + 1, 'position': [round(float(v), 2) for v in pts[i]]})
    return {'id': cfg['id'], 'label': cfg['label'], 'shape': {'type': 'explicit'}, 'seats': seats}

def floor_section(cfg):
    x0, x1 = cfg['x']; z0, z1 = cfg['z']
    return {'id': cfg['id'], 'label': cfg['label'],
            'shape': {'type': 'polygon', 'points': [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]},
            'rows': int(round((z1 - z0) / 1.0)), 'rowDepth': 1.0, 'riser': 0, 'baseHeight': 0,
            'seatsPerRow': int(round((x1 - x0) / 0.5))}

def run(work, sections_path, out_path):
    cfg = json.load(open(sections_path))
    f = fr.load_frame(work)
    P, mats = fr.load_chairs_with_materials(work)
    keep = np.isin(mats, cfg['seatMaterials'])
    pts, mats = fr.apply_frame(f, P[keep]), mats[keep]
    center = [0.0, f['stage_radius_m']]
    sections, lines = [], []
    fitted = {}
    lines.append(f'{"section":10} {"count":>6} {"expect":>6} {"diff%":>6} {"meanErr":>8} {"maxErr":>7}  rows')
    bad = 0
    for c in cfg['arcs']:
        if 'like' in c:
            sec = template_section(c, fitted[c['like']])
            sections.append(sec); fitted[sec['id']] = sec
            lines.append(f'{c["id"]:10} {c["expected"]:6d} {c["expected"]:6d} {0.0:6.1f} {"template":>8} {c["like"]:>7}  {sec["rows"]}')
            continue
        sel, _, _ = select(pts, mats, center, c, cfg['tiers'])
        if sel.shape[0] == 0:
            lines.append(f'{c["id"]:10} NO CHAIRS'); bad += 1; continue
        sec, rep = fit_arc(c, sel, center)
        sections.append(sec); fitted[sec['id']] = sec
        exp = rep['expected'] or rep['count']
        diff = (rep['count'] - exp) / exp * 100
        flag = '' if abs(diff) <= 5 and rep['meanErr'] <= 0.3 and rep['maxErr'] <= 1.0 else '  <-- CHECK'
        if flag: bad += 1
        lines.append(f'{c["id"]:10} {rep["count"]:6d} {exp:6d} {diff:6.1f} {rep["meanErr"]:8.3f} {rep["maxErr"]:7.3f}  {sec["rows"]}{flag}')
    for c in cfg['explicit']:
        sel, _, _ = select(pts, mats, center, c, cfg['tiers'])
        sec = explicit_section(c, sel, center)
        sections.append(sec)
        exp = c.get('expected', len(sec['seats']))
        flag = '' if abs(len(sec['seats']) - exp) <= max(1, exp * 0.05) else '  <-- CHECK'
        if flag: bad += 1
        lines.append(f'{c["id"]:10} {len(sec["seats"]):6d} {exp:6d} {"":6} {"explicit":>8}{flag}')
    for c in cfg.get('floor', []):
        sections.append(floor_section(c))
    total = 0
    for s in sections:
        if 'seats' in s: total += len(s['seats'])
        else: total += sum(s['seatsPerRow']) if isinstance(s['seatsPerRow'], list) else s['seatsPerRow'] * s['rows']
    venue = {
        'id': cfg['id'], 'name': cfg['name'], 'units': 'm',
        'stage': {'center': [0, 0, 0], 'size': cfg['stage']['size'], 'facing': [0, 0, 1]},
        'sections': sections, 'obstacles': [],
        'shell': {'glb': f'/venues/{cfg["id"]}/shell.glb'},
        'credit': cfg['credit'],
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    json.dump(venue, open(out_path, 'w'), ensure_ascii=False, indent=1)
    lines.append(f'\nTOTAL seats {total}; sections {len(sections)}; flagged {bad}')
    lines += cfg.get('notes', [])
    report = '\n'.join(lines)
    open(os.path.join(work, 'fit-report.txt'), 'w').write(report)
    print(report)

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[3])
