"""DAE → work/chairs.json + work/shell.obj + work/materials.json
사용: $BPY extract_dae.py work/temp_export.dae work/
"""
import json, os, sys, time
from collections import defaultdict
import numpy as np
import dae_common as dc

SEAT_PITCH = 0.55   # 한 geometry가 이보다 넓으면 여러 좌석으로 나눈다(m)

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
    chair_min, chair_max = {}, {}
    orphan_chairs = []                # owner가 없는 의자 geometry는 자체 bbox 사용

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
                        orphan_chairs.append((lo, hi))
                    elif key in chair_min:
                        chair_min[key] = np.minimum(chair_min[key], lo)
                        chair_max[key] = np.maximum(chair_max[key], hi)
                    else:
                        chair_min[key], chair_max[key] = lo, hi
                else:
                    used = np.unique(idx)
                    remap = np.full(geom.positions.shape[0], -1, dtype=np.int64)
                    remap[used] = np.arange(used.size)
                    obj_verts[name].append(world[used])
                    obj_faces[name].append(remap[idx].reshape(-1, 3) + obj_count[name])
                    obj_count[name] += used.size
        if n_geom % 10000 == 0:
            print(f'  {n_geom} geometries, {time.time()-t0:.1f}s', flush=True)

    chairs = []
    boxes = list(zip(chair_min.values(), chair_max.values())) + orphan_chairs
    for lo, hi in boxes:
        chairs.extend(split_box(lo, hi))
    chairs.sort()
    with open(os.path.join(out_dir, 'chairs.json'), 'w') as f:
        json.dump({'units': 'm', 'frame': 'model', 'chairs': [[round(float(v), 4) for v in c] for c in chairs]}, f)
    print(f'chairs: {len(chairs)} (from {len(boxes)} chair boxes)', flush=True)

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
