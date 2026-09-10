"""Additional visible hall upgrades, built in Blender world coordinates."""
import bpy,os,math
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','assets')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);return m
stone=material('Upgrade limestone',(.63,.65,.52));wood=material('Upgrade oak',(.29,.17,.09));roof=material('Upgrade copper',(.12,.36,.34));gold=material('Upgrade gold',(.91,.65,.25))
def box(name,loc,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat);return o
box('Workshop foundation',(1.5,.5,.25),(1.7,2.6,.4),stone)
box('Workshop walls',(1.5,.5,1.15),(1.5,2.4,1.5),stone)
o=box('Workshop sloped roof',(1.45,.5,2),(2,2.8,.18),roof);o.rotation_euler[1]=.20
for y in [-.3,.5,1.3]:box('Workshop window',(2.27,y,1.3),(.04,.45,.5),gold)
box('Workbench',(1.45,-1.25,.65),(1.2,.55,.12),wood)
for x in [1,1.9]:box('Workbench leg',(x,-1.25,.35),(.1,.4,.6),wood)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'hall-level-2.glb'),export_format='GLB',use_selection=True)
level2=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.65,depth=4.6,location=(-2.75,1.2,2.3));o=bpy.context.object;o.name='Beacon tower';o.data.materials.append(stone)
bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.91,radius2=0,depth=1.4,location=(-2.75,1.2,5.15));bpy.context.object.data.materials.append(roof)
box('Beacon window',(-2.75,.535,3.8),(.3,.03,.65),gold)
box('Victory banner pole',(-2.75,1.2,6.3),(.05,.05,1.2),wood)
box('Victory banner',(-2.35,1.2,6.55),(.8,.06,.55),gold)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o not in level2:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'hall-level-3.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'guild-upgrades.blend'))
