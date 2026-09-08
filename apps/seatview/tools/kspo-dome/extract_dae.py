"""DAE → work/chairs.json + work/shell.obj + work/materials.json
사용: $BPY extract_dae.py work/temp_export.dae work/
"""
import json, os, sys, time
from collections import Counter, defaultdict
import numpy as np
import dae_common as dc

SEAT_PITCH = 0.55   # 한 geometry가 이보다 넓으면 여러 좌석으로 나눈다(m)
PART_MATERIALS = {'chair_1'}   # 이 모델에서 팔걸이·레일·브래킷 부품에만 쓰이는 재질(좌석이 아니다)

def run(dae_path, out_dir):
    t0 = time.time()
    scene = dc.parse_scene(dae_path)
    unit = scene.unit_meter
    by_geom = defaultdict(list)
    for inst in scene.instances:
        by_geom[inst.geometry_id].append(inst)
    print(f'scene: {len(scene.instances)} instances, {len(scene.materials)} materials, {time.time()-t0:.1f}s', flush=True)

    # 재질별 OBJ 버퍼
    obj_verts = defaultdict(list)     # name -> list of (N,3) arrays
    obj_faces = defaultdict(list)     # name -> list of (M,3) index arrays (0-based, 버퍼 내 상대)
    obj_count = defaultdict(int)
    # 의자: owner(컴포넌트 인스턴스)별 바운딩박스
    chair_min, chair_max, chair_mat = {}, {}, {}   # chair_mat: owner -> 첫 부품의 재질 이름
    orphan_chairs = []                # owner가 없는 의자 geometry는 자체 bbox 사용: (재질 이름, lo, hi)

    n_geom = 0
    for geom in dc.iter_geometries(dae_path):
        n_geom += 1
        insts = by_geom.get(geom.id)
        if not insts or geom.positions.shape[0] == 0:
            continue
        for inst in insts:
            world = dc.transform_points(inst.matrix, geom.positions) * unit
            for block in geom.triangles:
                mid = inst.bindings.get(block.symbol, '')
                name = scene.materials.get(mid, 'default')
                idx = block.indices
                if idx.size == 0:
                    continue
                if dc.is_chair_material(name):
                    pts = world[np.unique(idx)]
                    lo, hi = pts.min(0), pts.max(0)
                    key = inst.owner
                    if key is None:
                        orphan_chairs.append((name, lo, hi))
                    elif key in chair_min:
                        chair_min[key] = np.minimum(chair_min[key], lo)
                        chair_max[key] = np.maximum(chair_max[key], hi)
                    else:
                        chair_min[key], chair_max[key] = lo, hi
                        chair_mat[key] = name
                else:
                    used = np.unique(idx)
                    remap = np.full(geom.positions.shape[0], -1, dtype=np.int64)
                    remap[used] = np.arange(used.size)
                    obj_verts[name].append(world[used])
                    obj_faces[name].append(remap[idx].reshape(-1, 3) + obj_count[name])
                    obj_count[name] += used.size
        if n_geom % 10000 == 0:
            print(f'  {n_geom} geometries, {time.time()-t0:.1f}s', flush=True)

    mat_boxes = defaultdict(list)   # 재질 이름 -> [(lo, hi), ...] (병합 전, 진단용)
    for key in chair_min:
        mat_boxes[chair_mat[key]].append((chair_min[key], chair_max[key]))
    for name, lo, hi in orphan_chairs:
        mat_boxes[name].append((lo, hi))
    print('chair material breakdown (before merge):', flush=True)
    for name in sorted(mat_boxes):
        blist = mat_boxes[name]
        hext = np.array([max(hi[0] - lo[0], hi[1] - lo[1]) for lo, hi in blist])
        height = np.array([hi[2] - lo[2] for lo, hi in blist])
        print(f'  {name}: {len(blist)} boxes, median horiz extent {np.median(hext):.3f} m, '
              f'median height {np.median(height):.3f} m', flush=True)

    boxes = [(chair_min[k], chair_max[k], chair_mat[k]) for k in chair_min] + \
            [(lo, hi, name) for name, lo, hi in orphan_chairs]
    print(f'chair boxes before merge: {len(boxes)}', flush=True)
    merged_boxes = merge_boxes(boxes)
    print(f'chair boxes after merge: {len(merged_boxes)}', flush=True)

    kept_boxes, dropped = [], 0
    for lo, hi, name in merged_boxes:
        ext = hi - lo
        if max(ext[0], ext[1]) < 0.3:
            dropped += 1
        else:
            kept_boxes.append((lo, hi, name))
    print(f'chair boxes dropped (armrest/bracket, horizontal extent < 0.3m): {dropped}', flush=True)

    seats = []                        # (좌표, 재질 이름) -- 분할된 점은 박스의 재질을 물려받는다
    for lo, hi, name in kept_boxes:
        seats.extend((c, name) for c in split_box(lo, hi))
    seats.sort(key=lambda s: s[0])
    chairs = [c for c, _ in seats]
    chair_materials = [name for _, name in seats]
    with open(os.path.join(out_dir, 'chairs.json'), 'w') as f:
        json.dump({'units': 'm', 'frame': 'model',
                   'chairs': [[round(float(v), 4) for v in c] for c in chairs],
                   'materials': chair_materials}, f)
    print(f'chairs: {len(chairs)} (from {len(kept_boxes)} chair boxes)', flush=True)

    final_counts = Counter(chair_materials)
    print('final chair counts by material:', flush=True)
    for name, n in sorted(final_counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f'  {name}: {n}', flush=True)

    if chairs:
        nn = nearest_neighbor_distances(np.array(chairs))
        edges = (0, 0.2, 0.3, 0.4, 0.45, 0.5, 0.6, 1.0)
        counts = nn_histogram(nn, edges)
        print('nearest-neighbour distance histogram (final chairs):', flush=True)
        bounds = list(edges) + [float('inf')]
        for i, c in enumerate(counts):
            hi_label = bounds[i + 1] if bounds[i + 1] != float('inf') else 'inf'
            print(f'  [{bounds[i]}, {hi_label}): {c}', flush=True)

    with open(os.path.join(out_dir, 'shell.obj'), 'w') as f:
        f.write('# KSPO DOME shell, metres, model frame (Z-up)\n')
        base = 0
        total_faces = 0
        for name in sorted(obj_verts):
            V = np.vstack(obj_verts[name])
            F = np.vstack(obj_faces[name]) + base + 1
            safe = ''.join(ch if ch.isalnum() or ch in '_-' else '_' for ch in name)
            f.write(f'o {safe}\nusemtl {safe}\n')
            np.savetxt(f, V, fmt='v %.4f %.4f %.4f')
            np.savetxt(f, F, fmt='f %d %d %d')
            base += V.shape[0]
            total_faces += F.shape[0]
    print(f'shell.obj: {base} vertices, {total_faces} faces', flush=True)

    safe_colors = {}
    for name, col in scene.colors.items():
        safe = ''.join(ch if ch.isalnum() or ch in '_-' else '_' for ch in name)
        safe_colors[safe] = [round(c, 4) for c in col]
    with open(os.path.join(out_dir, 'materials.json'), 'w') as f:
        json.dump(safe_colors, f, ensure_ascii=False, indent=1)
    print(f'done in {time.time()-t0:.1f}s', flush=True)

def beats(name_a, ext_a, name_b, ext_b):
    """병합된 박스의 재질로 a가 b보다 적합한가. 좌석 재질은 PART_MATERIALS(팔걸이·레일·
    브래킷)를 항상 이긴다 -- 이 모델에는 쿠션보다 넓은 부품이 있다(장애인석 프레임 0.47 m,
    좌석열 레일 4.5 m). 같은 부류끼리는 수평 크기가 큰 쪽이 이긴다."""
    a_part, b_part = name_a in PART_MATERIALS, name_b in PART_MATERIALS
    if a_part != b_part:
        return b_part
    return ext_a > ext_b

def merge_boxes(boxes, max_xy_dist=0.2, max_z_dist=0.6):
    """의자 바운딩박스들 중 중심의 수평 거리(xy)가 max_xy_dist(m) 이내이고 높이 차(z)가
    max_z_dist(m) 이내인 것들을 하나(합집합)로 합친다. 같은 물리 좌석이 서로 다른 instance_*
    owner(또는 owner 없음)로 나뉘어 별도 박스로 잡히는 경우(등받이가 다른 owner 아래 쿠션
    바로 위에 있는 경우 포함)를 병합한다. 실제 인접 좌석은 중심 수평 간격이 ~0.45 m 이상이라
    오탐하지 않는다.
    입력·출력 모두 (lo, hi, 재질 이름) 삼중항이다. 병합된 박스의 재질은 `beats`가 고른다:
    좌석 재질이 PART_MATERIALS(팔걸이·레일·브래킷)를 항상 이기고, 같은 부류끼리는 수평
    크기가 큰 쪽이 이긴다(쿠션이 브래킷을 이긴다).
    중심 x로 정렬한 뒤 한 번 훑으며, x가 max_xy_dist만큼 뒤처진 클러스터는(정렬 순서상 이후
    어떤 박스와도 다시 가까워질 수 없으므로) 확정 짓고 활성 목록에서 뺀다.
    """
    def center(lo, hi):
        return (lo + hi) / 2.0
    def hext(lo, hi):
        return max(hi[0] - lo[0], hi[1] - lo[1])
    ordered = sorted(boxes, key=lambda b: center(b[0], b[1])[0])
    active = []    # 아직 병합될 수 있는 클러스터: (center, lo, hi, 재질, 그 재질을 준 부품의 수평 크기)
    done = []      # 더 이상 병합 대상이 아닌 확정 클러스터: (lo, hi, 재질)
    for lo, hi, name in ordered:
        clo, chi, cc = lo, hi, center(lo, hi)
        cname, cext = name, hext(lo, hi)
        kept = []
        for ac, alo, ahi, aname, aext in active:
            if cc[0] - ac[0] > max_xy_dist:
                done.append((alo, ahi, aname))
            elif np.linalg.norm(cc[:2] - ac[:2]) <= max_xy_dist and abs(cc[2] - ac[2]) <= max_z_dist:
                if beats(aname, aext, cname, cext):
                    cname, cext = aname, aext
                clo, chi = np.minimum(clo, alo), np.maximum(chi, ahi)
                cc = center(clo, chi)   # 병합된 박스의 중심은 합집합에서 다시 계산
            else:
                kept.append((ac, alo, ahi, aname, aext))
        active = kept
        active.append((cc, clo, chi, cname, cext))
    done.extend((lo, hi, name) for _, lo, hi, name, _ in active)
    return done

def nearest_neighbor_distances(points, cell=0.5):
    """각 점에서 가장 가까운 다른 점까지의 3D 거리(그리드 버킷 방식의 근사치, 진단용)."""
    keys = np.floor(points / cell).astype(np.int64)
    grid = defaultdict(list)
    for i, k in enumerate(map(tuple, keys)):
        grid[k].append(i)
    dists = np.full(len(points), np.inf)
    for i, (kx, ky, kz) in enumerate(keys):
        best = np.inf
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    for j in grid.get((kx + dx, ky + dy, kz + dz), ()):
                        if j == i:
                            continue
                        d = float(np.linalg.norm(points[i] - points[j]))
                        if d < best:
                            best = d
        dists[i] = best
    return dists

def nn_histogram(dists, edges):
    """dists를 edges(오름차순)로 정의된 구간([e0,e1),[e1,e2),...,[e_last,inf))에 나눠 센다."""
    bounds = np.array(list(edges) + [np.inf])
    idx = np.clip(np.searchsorted(bounds, dists, side='right') - 1, 0, len(bounds) - 2)
    return np.bincount(idx, minlength=len(bounds) - 1).tolist()

def split_box(lo, hi):
    """바운딩박스 하나를 좌석 중심 목록으로. 수평 최장변이 SEAT_PITCH보다 길면 등간격으로 나눈다."""
    center = (lo + hi) / 2
    ext = hi - lo
    axis = 0 if ext[0] >= ext[1] else 1
    n = max(1, round(float(ext[axis]) / SEAT_PITCH))
    if n == 1:
        return [center.tolist()]
    out = []
    for i in range(n):
        c = center.copy()
        c[axis] = lo[axis] + (i + 0.5) * ext[axis] / n
        out.append(c.tolist())
    return out

if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2])
