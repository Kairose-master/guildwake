"""Reproducible, original Guildwake diorama. Run with Blender --background --python."""
import bpy, math, random, os, json
from mathutils import Vector
random.seed(22)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','assets'); os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.8,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
M={
 'grass':mat('Moss meadow',(.19,.34,.25)), 'stone':mat('Slate cliffs',(.19,.25,.29)), 'rock':mat('Pale rock',(.37,.44,.42)),
 'wood':mat('Warm oak',(.28,.15,.085)), 'plaster':mat('Ivory plaster',(.81,.73,.53)), 'roof':mat('Oxide copper roof',(.11,.32,.33)),
 'gold':mat('Guild brass',(.92,.61,.20),.5), 'pine':mat('Forest canopy',(.075,.23,.17)), 'pine2':mat('Fir tips',(.16,.35,.23)),
 'road':mat('Warm sandstone path',(.59,.49,.32)), 'water':mat('River',(.08,.36,.40),.3,.22), 'light':mat('Lantern amber',(1,.52,.12),emission=2),
 'cloth':mat('Guild pennant',(.82,.31,.15)), 'crystal':mat('Moonstone',(.25,.85,.72),.2,.25,1), 'skin':mat('Skin',(.75,.48,.28)),
 'sage':mat('Scout cloak',(.32,.60,.43)), 'rust':mat('Miner cloak',(.77,.31,.18)), 'blue':mat('Warden cloak',(.24,.43,.67)), 'violet':mat('Scholar cloak',(.56,.36,.68)),
}
def finish(obj,name,material):
 obj.name=name;obj.data.materials.append(M[material]);return obj
def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,material)
def cone(name,loc,r1,r2,depth,material,vertices=8):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc);return finish(bpy.context.object,name,material)
def ico(name,loc,scale,material,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,material)
def beam(name,a,b,width,material):
 o=cube(name,(Vector(a)+Vector(b))/2,(width,width,(Vector(b)-Vector(a)).length),material);o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler();return o
# Floating island: geometric layers, broad playable surface.
cone('Island bedrock',(0,0,-1.6),6.1,8.5,3.1,'stone',11)
cone('Island crown',(0,0,-.15),8.4,8.5,.45,'grass',11)
for i in range(28):
 a=random.random()*math.tau;r=random.uniform(6.8,8.0)
 ico('Cliff facet',(math.cos(a)*r,math.sin(a)*r,-.55),(.8,.75,random.uniform(.7,1.4)),'rock')
# Central guild house, facing south (-Y).
cube('Guild foundation',(-1,0,.25),(3.7,3.3,.5),'rock',.1)
cube('Guild hall',(-1,0,1.5),(3.3,2.9,2.2),'plaster',.06)
for x in [-2.65,-1,.65]:cube('Timber frame',(x,-1.48,1.5),(.14,.13,2.3),'wood')
cube('Lintel',(-1,-1.5,2.4),(3.4,.15,.18),'wood')
# Gabled roof using a closed triangular prism.
verts=[(-2.95,-1.8,2.65),(.95,-1.8,2.65),(-1,-1.8,4),(-2.95,1.8,2.65),(.95,1.8,2.65),(-1,1.8,4)]
mesh=bpy.data.meshes.new('Roof');mesh.from_pydata(verts,[],[(0,2,1),(3,4,5),(0,3,5,2),(2,5,4,1),(0,1,4,3)]);mesh.update()
o=bpy.data.objects.new('Guild copper roof',mesh);bpy.context.collection.objects.link(o);finish(o,o.name,'roof')
beam('Roof ridge',(-1,-1.9,4.05),(-1,1.9,4.05),.12,'gold')
cube('Guild door',(-1,-1.54,1.04),(.8,.12,1.65),'wood',.1)
cone('Guild emblem',(-1,-1.64,2.15),.26,.26,.08,'gold',6).rotation_euler[0]=math.pi/2
for x in [-2.1,.1]:
 cube('Window',(x,-1.55,1.6),(.52,.06,.65),'light',.04)
 cube('Window mullion',(x,-1.61,1.6),(.04,.04,.65),'wood')
cube('Chimney',(-2,1,3.6),(.6,.6,1.5),'rock',.05)
for i in range(3):cube('Entrance steps',(-1,-1.85-i*.22,.26-i*.08),(1.5,.5,.18),'rock',.04)
# Roads, stream, bridge.
for a,b in [((-1,-2,0.12),(-1,-4,.12)),((-1,-4,.12),(4,-4,.12)),((-1,-4,.12),(-4,-4,.12)),((-4,-4,.12),(-5,2,.12)),((4,-4,.12),(5,2,.12))]:
 mid=(Vector(a)+Vector(b))/2;delta=Vector(b)-Vector(a);o=cube('Footpath',mid,(.62,delta.length,.055),'road');o.rotation_euler[2]=-math.atan2(delta.x,delta.y)
cube('River',(3.05,.3,.13),(.85,10,.055),'water')
for y in [-3.6,-3.9,-4.2,-4.5]:cube('Bridge plank',(3.05,y,.24),(1.65,.24,.15),'wood',.025)
for y in [-3.45,-4.65]:beam('Bridge railing',(2.3,y,.75),(3.8,y,.75),.07,'wood')
# Pines deliberately leave roads and hall readable.
def tree(x,y,s):
 cone('Pine trunk',(x,y,.6*s),.13*s,.11*s,1.2*s,'wood',6)
 for k in range(3):cone('Pine crown',(x,y,(1.1+k*.48)*s),(.8-k*.17)*s,0,1.3*s,'pine' if k<2 else 'pine2',7)
for x,y in [(-6,-2),(-6,0),(-6,2),(-4,3),(-3,4),(-5,4),(0,4),(1,5),(4,4),(5,3),(6,0),(6,-2),(-3,-5),(-4,-5),(1,-6)]:tree(x,y,random.uniform(.8,1.25))
# Mine entrance, crystals and ruined watchtower: recognizable destinations.
cube('Mine arch top',(-5,1.8,1.5),(2,.65,.5),'rock',.13)
for x in [-5.7,-4.3]:cube('Mine post',(x,1.8,.7),(.48,.65,1.4),'rock',.1)
cube('Mine shadow',(-5,2.05,.7),(1.1,.08,1.3),'stone')
for x,y in [(-4.1,1.3),(-5.7,1),(-4.3,2.4)]:cone('Moonstone seam',(x,y,.36),.17,0,.7,'crystal',5)
cone('Watchtower base',(5,1.8,.35),1.05,1.05,.6,'rock',8)
cone('Watchtower',(5,1.8,1.35),.75,.72,1.6,'plaster',8)
for i in range(6):
 a=i*math.tau/6;cube('Tower merlon',(5+math.cos(a)*.65,1.8+math.sin(a)*.65,2.35),(.35,.35,.55),'rock',.035)
# Camp at the forest edge.
for x in [-4.9,-3.5]:beam('Tent frame',(x,-4.3,.15),(x,-3.3,1.2),.07,'wood')
mesh=bpy.data.meshes.new('Tent canvas');mesh.from_pydata([(-4.9,-4.3,.16),(-3.5,-4.3,.16),(-4.2,-3.3,1.2),(-4.9,-2.8,.16),(-3.5,-2.8,.16)],[],[(0,1,2),(0,2,3),(1,4,2),(3,2,4)]);mesh.update();o=bpy.data.objects.new('Forest tent',mesh);bpy.context.collection.objects.link(o);finish(o,o.name,'cloth')
# Courtyard details and lanterns.
for x,y in [(-2.8,-2.1),(.9,-2.1),(4.4,-3.8)]:
 cone('Lantern post',(x,y,.7),.05,.05,1.4,'wood',6);cube('Lantern',(x,y,1.5),(.2,.2,.3),'light',.025)
for x,y in [(1,1),(1.4,1),(-3,0)]:cone('Barrel',(x,y,.4),.28,.25,.7,'wood',10)
beam('Banner pole',(.9,-.6,0),(.9,-.6,3.8),.07,'wood')
cube('Guild banner',(1.25,-.6,3.2),(.65,.055,.9),'cloth')
for i in range(40):
 x,y=random.uniform(-6.5,6.5),random.uniform(-5.8,5.8)
 if abs(x+1)<3 and abs(y)<3:continue
 ico('Meadow stone',(x,y,.14),(.15,.12,.14),'rock')
# Export environment (lights/camera separately for beauty render).
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'guild-island.glb'),export_format='GLB',use_selection=True,export_yup=True)
# Build reusable rig-free stylized pawns with named groups for game movement.
world_objects=list(bpy.context.scene.objects)
for obj in world_objects:obj.hide_set(True)
for idx,color in enumerate(['sage','rust','blue','violet']):
 before=set(bpy.data.objects)
 cone('Body',(0,0,.43),.23,.16,.55,color,7)
 ico('Head',(0,0,.85),(.16,.16,.18),'skin',2)
 cone('Hood',(0,.035,.93),.19,.05,.23,color,7)
 for x in [-.09,.09]:cube('Boot',(x,-.02,.09),(.12,.2,.18),'wood',.02)
 beam('Staff',(.28,0,.05),(.28,0,.93),.045,'wood')
 bpy.ops.object.select_all(action='DESELECT')
 parts=set(bpy.data.objects)-before
 for obj in parts:obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,f'agent-{idx}.glb'),export_format='GLB',use_selection=True,export_yup=True)
 for obj in parts:bpy.data.objects.remove(obj,do_unlink=True)
for obj in world_objects:obj.hide_set(False)
# Save editable source and a faithful fallback render.
bpy.ops.object.light_add(type='AREA',location=(-5,-8,14));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=9
bpy.ops.object.light_add(type='AREA',location=(8,4,10));bpy.context.object.data.energy=1100;bpy.context.object.data.color=(.46,.75,1);bpy.context.object.data.size=8
bpy.ops.object.camera_add(location=(13,-19,15));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=22;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.13,.18,.23);scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'guild-island.blend'))
scene.render.filepath=os.path.join(OUT,'guild-island.png');bpy.ops.render.render(write_still=True)
print('GUILDWAKE_ASSETS_READY')
