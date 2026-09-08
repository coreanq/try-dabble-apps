"""Blender 헤드리스: work/shell.obj → Draco glb.
사용: $BLENDER -b --python build_shell.py -- work/ ../../public/venues/kspo-dome/shell.glb [--max-tris 300000]"""
import argparse, json, math, os, sys
import bpy

def args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(); ap.add_argument('work'); ap.add_argument('out')
    ap.add_argument('--max-tris', type=int, default=300000)
    return ap.parse_args(argv)

def main():
    a = args()
    work = os.path.abspath(a.work); out = os.path.abspath(a.out)
    frame = json.load(open(os.path.join(work, 'frame.json')))
    colors = json.load(open(os.path.join(work, 'materials.json')))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.obj_import(filepath=os.path.join(work, 'shell.obj'), forward_axis='Y', up_axis='Z')
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    print('imported', len(objs), 'objects', flush=True)

    # 모델 좌표 → Blender 작업 좌표: (xy - center) 회전(-A) → y -= R → z -= floor
    A = math.radians(frame['stage_angle_deg']); cx, cy = frame['center_model']
    cosA, sinA = math.cos(A), math.sin(A)
    import numpy as np
    for o in objs:
        me = o.data
        co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        x, y = co[:, 0] - cx, co[:, 1] - cy
        co[:, 0] = x * cosA - y * sinA
        co[:, 1] = (x * sinA + y * cosA) - frame['stage_radius_m']
        co[:, 2] -= frame['floor_z']
        me.vertices.foreach_set('co', co.ravel()); me.update()
        # frame.apply_frame과 같은 회전. SeatView의 +Z(관중석)는 여기서 -Y다. glTF 내보내기가 Y-up으로 바꿔 준다.

    # 재질 색
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if m is None: continue
            m.use_nodes = True
            bsdf = m.node_tree.nodes.get('Principled BSDF')
            col = colors.get(m.name, [0.7, 0.7, 0.7])
            if bsdf: bsdf.inputs['Base Color'].default_value = (col[0], col[1], col[2], 1.0)
            m.use_backface_culling = False

    # 정점 병합 + 감축
    total = sum(len(o.data.polygons) for o in objs)
    ratio = min(1.0, a.max_tris / max(total, 1))
    print('tris before', total, 'ratio', round(ratio, 3), flush=True)
    for o in objs:
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.remove_doubles(threshold=0.01); bpy.ops.object.mode_set(mode='OBJECT')
        if ratio < 1.0 and len(o.data.polygons) > 200:
            mod = o.modifiers.new('dec', 'DECIMATE'); mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
        o.select_set(False)
    after = sum(len(o.data.polygons) for o in objs)
    print('tris after', after, flush=True)

    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_materials='EXPORT', export_normals=True,
                              export_texcoords=False, export_vertex_color='NONE',
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                              export_draco_position_quantization=14)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB', flush=True)

main()
