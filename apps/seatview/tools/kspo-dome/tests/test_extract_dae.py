import json, os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import dae_common, extract_dae

NS = 'http://www.collada.org/2005/11/COLLADASchema'

def tiny_dae(chair_at_x_inch: float) -> str:
    # 정점 4개짜리 사각형 두 개(삼각형 2개씩). ID_G1은 의자 쿠션(재질 yellow_chair), ID_G2는 벽(재질 wall).
    # 의자 인스턴스는 instance_7 노드 아래에 있고 X로 chair_at_x_inch만큼 옮겨져 있다.
    return f'''<?xml version="1.0"?>
<COLLADA xmlns="{NS}" version="1.4.1">
 <asset><unit meter="0.0254" name="inch"/><up_axis>Z_UP</up_axis></asset>
 <library_visual_scenes><visual_scene id="S">
  <node name="SketchUp">
   <node id="N1" name="group_0"><matrix>1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1</matrix>
    <node id="N2" name="instance_7"><matrix>1 0 0 {chair_at_x_inch} 0 1 0 0 0 0 1 0 0 0 0 1</matrix>
     <node id="N3" name="group_1"><matrix>1 0 0 0 0 1 0 0 0 0 1 10 0 0 0 1</matrix>
      <instance_geometry url="#ID_G1"><bind_material><technique_common>
       <instance_material symbol="Material2" target="#M_CHAIR"/></technique_common></bind_material></instance_geometry>
     </node>
    </node>
    <instance_geometry url="#ID_G2"><bind_material><technique_common>
     <instance_material symbol="Material2" target="#M_WALL"/></technique_common></bind_material></instance_geometry>
   </node>
  </node>
 </visual_scene></library_visual_scenes>
 <library_geometries>
  <geometry id="ID_G1"><mesh>
   <source id="P1"><float_array id="A1" count="12">0 0 0 20 0 0 20 20 0 0 20 0</float_array>
    <technique_common><accessor count="4" source="#A1" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>
   <vertices id="V1"><input semantic="POSITION" source="#P1"/></vertices>
   <triangles count="2" material="Material2"><input offset="0" semantic="VERTEX" source="#V1"/><p>0 1 2 0 2 3</p></triangles>
  </mesh></geometry>
  <geometry id="ID_G2"><mesh>
   <source id="P2"><float_array id="A2" count="12">0 0 0 100 0 0 100 0 100 0 0 100</float_array>
    <technique_common><accessor count="4" source="#A2" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>
   <source id="T2"><float_array id="A3" count="8">0 0 1 0 1 1 0 1</float_array>
    <technique_common><accessor count="4" source="#A3" stride="2"><param name="S" type="float"/><param name="T" type="float"/></accessor></technique_common></source>
   <vertices id="V2"><input semantic="POSITION" source="#P2"/></vertices>
   <triangles count="2" material="Material2"><input offset="0" semantic="VERTEX" source="#V2"/><input offset="1" semantic="TEXCOORD" source="#T2" set="0"/><p>0 0 1 1 2 2 0 0 2 2 3 3</p></triangles>
  </mesh></geometry>
 </library_geometries>
 <library_materials>
  <material id="M_CHAIR" name="yellow_chair__1"><instance_effect url="#E_CHAIR"/></material>
  <material id="M_WALL" name="wall"><instance_effect url="#E_WALL"/></material>
 </library_materials>
 <library_effects>
  <effect id="E_CHAIR"><profile_COMMON><technique sid="COMMON"><lambert><diffuse><color>1 0.8 0 1</color></diffuse></lambert></technique></profile_COMMON></effect>
  <effect id="E_WALL"><profile_COMMON><technique sid="COMMON"><lambert><diffuse><color>0.5 0.5 0.5 1</color></diffuse></lambert></technique></profile_COMMON></effect>
 </library_effects>
</COLLADA>'''

class ExtractTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.dae = os.path.join(self.dir, 't.dae')
        with open(self.dae, 'w') as f: f.write(tiny_dae(100.0))

    def test_scene_collects_instances_with_world_matrix(self):
        scene = dae_common.parse_scene(self.dae)
        self.assertEqual(scene.materials['M_CHAIR'], 'yellow_chair__1')
        self.assertEqual(scene.colors['yellow_chair__1'], [1.0, 0.8, 0.0])
        inst = [i for i in scene.instances if i.geometry_id == 'ID_G1']
        self.assertEqual(len(inst), 1)
        self.assertAlmostEqual(inst[0].matrix[0][3], 100.0)   # X 이동
        self.assertAlmostEqual(inst[0].matrix[2][3], 10.0)    # Z 이동 (group_1)
        self.assertEqual(inst[0].bindings['Material2'], 'M_CHAIR')
        self.assertIsNotNone(inst[0].owner)                    # 가장 가까운 instance_* 조상
        wall = [i for i in scene.instances if i.geometry_id == 'ID_G2'][0]
        self.assertIsNone(wall.owner)

    def test_geometries_use_vertex_offset_only(self):
        geoms = {g.id: g for g in dae_common.iter_geometries(self.dae)}
        self.assertEqual(geoms['ID_G2'].positions.shape, (4, 3))
        self.assertEqual(geoms['ID_G2'].triangles[0].indices.tolist(), [0, 1, 2, 0, 2, 3])
        self.assertEqual(geoms['ID_G2'].triangles[0].symbol, 'Material2')

    def test_extract_writes_chairs_and_obj(self):
        extract_dae.run(self.dae, self.dir)
        chairs = json.load(open(os.path.join(self.dir, 'chairs.json')))
        self.assertEqual(chairs['units'], 'm')
        self.assertEqual(len(chairs['chairs']), 1)
        x, y, z = chairs['chairs'][0]
        self.assertAlmostEqual(x, (100 + 10) * 0.0254, places=4)   # 쿠션 중심 X = 이동 100 + 20/2
        self.assertAlmostEqual(y, 10 * 0.0254, places=4)
        self.assertAlmostEqual(z, 10 * 0.0254, places=4)
        obj = open(os.path.join(self.dir, 'shell.obj')).read()
        self.assertIn('usemtl wall', obj)
        self.assertNotIn('yellow_chair', obj)
        self.assertEqual(obj.count('\nf '), 2)
        self.assertIn('v 2.5400', obj)   # 100 inch → 2.54 m
        mats = json.load(open(os.path.join(self.dir, 'materials.json')))
        self.assertEqual(mats['wall'], [0.5, 0.5, 0.5])

    def test_wide_chair_geometry_is_split_into_seats(self):
        # 폭 3 m(118 inch)짜리 "한 덩어리 의자열"은 0.55 m 간격으로 나뉜다.
        src = tiny_dae(0.0).replace('0 0 0 20 0 0 20 20 0 0 20 0', '0 0 0 118 0 0 118 20 0 0 20 0')
        with open(self.dae, 'w') as f: f.write(src)
        extract_dae.run(self.dae, self.dir)
        chairs = json.load(open(os.path.join(self.dir, 'chairs.json')))['chairs']
        self.assertEqual(len(chairs), round(118 * 0.0254 / 0.55))   # 5
        self.assertTrue(all(abs(c[1] - 10 * 0.0254) < 1e-6 for c in chairs))

if __name__ == '__main__':
    unittest.main()
