"""SketchUp Collada(DAE) 스트리밍 파서. 파일 전체를 메모리에 올리지 않는다."""
from dataclasses import dataclass, field
import xml.etree.ElementTree as ET
import numpy as np

NS = '{http://www.collada.org/2005/11/COLLADASchema}'

def _tag(el):
    return el.tag[len(NS):] if el.tag.startswith(NS) else el.tag

@dataclass
class Instance:
    geometry_id: str
    matrix: np.ndarray            # 4x4 월드 행렬(모델 단위)
    bindings: dict                # symbol -> material id
    owner: int | None             # 가장 가까운 instance_* 조상 노드의 고유 번호(없으면 None)

@dataclass
class Scene:
    unit_meter: float
    instances: list
    materials: dict               # material id -> name
    colors: dict                  # material name -> [r,g,b]

@dataclass
class TriangleBlock:
    symbol: str
    indices: np.ndarray           # 정점 인덱스(3개씩), VERTEX offset만 취함

@dataclass
class Geometry:
    id: str
    positions: np.ndarray         # (N,3) 모델 단위
    triangles: list = field(default_factory=list)

def parse_scene(path):
    """visual_scene의 노드 트리와 materials/effects를 한 번의 스트리밍으로 읽는다. geometry는 건너뛴다."""
    unit = 0.0254
    instances, materials, effects, mat_effect = [], {}, {}, {}
    stack = [np.eye(4)]           # 노드별 누적 행렬
    has_matrix = [True]
    owners = [None]               # 노드별 가장 가까운 instance_* 조상 번호
    counter = 0
    in_geom = False
    for ev, el in ET.iterparse(path, events=('start', 'end')):
        tag = _tag(el)
        if ev == 'start':
            if tag == 'geometry':
                in_geom = True
            elif tag == 'node' and not in_geom:
                name = el.get('name', '')
                owner = owners[-1]
                if name.startswith('instance_'):
                    counter += 1
                    owner = counter
                stack.append(stack[-1]); has_matrix.append(False); owners.append(owner)
            continue
        # end events
        if tag == 'geometry':
            in_geom = False; el.clear(); continue
        if in_geom:
            continue
        if tag == 'unit':
            unit = float(el.get('meter', unit))
        elif tag == 'matrix' and len(stack) > 1 and not has_matrix[-1]:
            m = np.array([float(v) for v in el.text.split()]).reshape(4, 4)
            stack[-1] = stack[-2] @ m
            has_matrix[-1] = True
        elif tag == 'instance_geometry':
            bind = {}
            for im in el.iter(NS + 'instance_material'):
                bind[im.get('symbol')] = im.get('target', '').lstrip('#')
            instances.append(Instance(el.get('url', '').lstrip('#'), stack[-1].copy(), bind, owners[-1]))
            el.clear()
        elif tag == 'node':
            stack.pop(); has_matrix.pop(); owners.pop(); el.clear()
        elif tag == 'material':
            ie = el.find(NS + 'instance_effect')
            materials[el.get('id')] = el.get('name', el.get('id'))
            if ie is not None:
                mat_effect[el.get('id')] = ie.get('url', '').lstrip('#')
            el.clear()
        elif tag == 'effect':
            col = None
            diffuse = el.find(f'.//{NS}diffuse/{NS}color')
            if diffuse is not None:
                col = [float(v) for v in diffuse.text.split()[:3]]
            effects[el.get('id')] = col
            el.clear()
        elif tag in ('float_array', 'source', 'library_images'):
            el.clear()
    colors = {}
    for mid, name in materials.items():
        col = effects.get(mat_effect.get(mid))
        colors[name] = col if col else [0.7, 0.7, 0.7]
    return Scene(unit, instances, materials, colors)

def iter_geometries(path):
    """library_geometries의 geometry를 하나씩 내놓는다."""
    for ev, el in ET.iterparse(path, events=('end',)):
        tag = _tag(el)
        if tag == 'geometry':
            yield _parse_geometry(el)
            el.clear()
        elif tag in ('node', 'visual_scene', 'material', 'effect', 'library_images'):
            el.clear()

def _parse_geometry(el):
    mesh = el.find(NS + 'mesh')
    g = Geometry(el.get('id'), np.zeros((0, 3)))
    if mesh is None:
        return g
    arrays = {}
    for src in mesh.findall(NS + 'source'):
        fa = src.find(NS + 'float_array')
        acc = src.find(f'{NS}technique_common/{NS}accessor')
        if fa is None or acc is None:
            continue
        stride = int(acc.get('stride', 3))
        arrays[src.get('id')] = np.array(fa.text.split(), dtype=np.float64).reshape(-1, stride)
    verts = mesh.find(NS + 'vertices')
    pos_id = None
    for inp in verts.findall(NS + 'input') if verts is not None else []:
        if inp.get('semantic') == 'POSITION':
            pos_id = inp.get('source', '').lstrip('#')
    if pos_id in arrays:
        g.positions = arrays[pos_id][:, :3]
    for tri in mesh.findall(NS + 'triangles'):
        inputs = tri.findall(NS + 'input')
        offsets = [int(i.get('offset', 0)) for i in inputs]
        stride = (max(offsets) + 1) if offsets else 1
        voff = next((int(i.get('offset', 0)) for i in inputs if i.get('semantic') == 'VERTEX'), 0)
        p = tri.find(NS + 'p')
        if p is None or not p.text:
            continue
        idx = np.array(p.text.split(), dtype=np.int64)
        g.triangles.append(TriangleBlock(tri.get('material', ''), idx[voff::stride]))
    return g

def transform_points(matrix, pts):
    """(N,3) 점에 4x4 행렬 적용."""
    return pts @ matrix[:3, :3].T + matrix[:3, 3]

def is_chair_material(name):
    n = name.lower()
    return 'chair' in n or 'charir' in n
