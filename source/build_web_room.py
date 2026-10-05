import bpy,bmesh,math,pathlib
from mathutils import Vector
base=pathlib.Path('/workspace/scratch/b6e757d1988b');out=base/'teledog-website/assets'
bpy.ops.wm.open_mainfile(filepath=str(base/'room-logos/output/TELEDOG_Room.blend'))
s=bpy.context.scene;s.frame_set(1);root=bpy.data.objects['TELEDOG room turntable']
hoodie=next(o for o in s.objects if o.name.startswith('Seated') and 'Continuous hoodie' in o.name)
blue=hoodie.data.materials[0];white=next(o.data.materials[0] for o in s.objects if o.name.startswith('Seated') and 'white head' in o.name)
# Remove the pocket arm on the viewer's left and replace it with a raised waving sleeve.
bm=bmesh.new();bm.from_mesh(hoodie.data);plane=hoodie.matrix_world.inverted()@Vector((.49,.85,1));normal=hoodie.matrix_world.to_3x3().transposed()@Vector((1,0,0));bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=plane,plane_no=normal,clear_inner=True,clear_outer=False);bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0);bm.to_mesh(hoodie.data);bm.free()
bpy.ops.object.empty_add(location=(.50,.845,1.00));arm=bpy.context.object;arm.name='Teledog greeting arm';arm.parent=root
pivot=arm.location.copy()
def sphere(name,center,scale,material):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=Vector(center)-pivot);o=bpy.context.object;o.name=name;o.parent=arm;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 return o
def capsule(name,a,b,r,material):
 a,b=Vector(a),Vector(b);o=sphere(name,(a+b)/2,(r,r,(b-a).length/2+r),material);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
capsule('Raised blue upper sleeve',(.50,.855,1.00),(.32,.79,.99),.065,blue)
sphere('Raised sleeve elbow',(.32,.79,.99),(.072,.070,.075),blue)
capsule('Raised blue forearm',(.32,.79,1.00),(.30,.775,1.20),.059,blue)
sphere('Blue glove cuff',(.30,.775,1.23),(.060,.047,.037),blue)
sphere('White greeting palm',(.30,.767,1.31),(.067,.038,.078),white)
for i,x in enumerate([.249,.283,.317,.351]):
 capsule('White waving finger '+str(i),(x,.764,1.34),(x,.764,1.405+[0,.018,.012,-.008][i]),.016,white)
capsule('White waving thumb',(.350,.76,1.29),(.386,.753,1.33),.021,white)
s.render.fps=30;s.frame_start=1;s.frame_end=241
for frame in range(1,242,3):
 t=(frame-1)/30;phase=t%8;envelope=math.sin(math.pi*min(phase/3.6,1))**2 if phase<3.6 else 0
 arm.rotation_euler=(0,.26*math.sin(t*math.pi*4)*envelope,0);arm.keyframe_insert(data_path='rotation_euler',frame=frame)
if arm.animation_data and arm.animation_data.action:
 arm.animation_data.action.name='Teledog friendly greeting'
 for fc in arm.animation_data.action.fcurves:
  for k in fc.keyframe_points:k.interpolation='LINEAR'
s.frame_set(1)
# Reduce dense curved meshes for phones, while preserving logos and all named objects.
count=0
for o in list(root.children_recursive):
 if o.type=='MESH' and len(o.data.polygons)>1200:
  o.data=o.data.copy();m=o.modifiers.new('Mobile mesh reduction','DECIMATE');m.ratio=.48 if o.name.startswith('Seated') else .32
  bpy.context.view_layer.objects.active=o
  try:bpy.ops.object.modifier_apply(modifier=m.name);count+=1
  except RuntimeError:pass
windows=[]
for m in bpy.data.materials:
 if m.name.startswith(('PC clear tempered glass','Clear display window')):
  nt=m.node_tree;output=nt.nodes.get('Material Output');old=output.inputs['Surface'].links[0].from_socket if output.inputs['Surface'].links else None;windows.append((nt,output,old));nt.links.new(nt.nodes.get('Principled BSDF').outputs[0],output.inputs['Surface'])
bpy.ops.object.select_all(action='DESELECT')
for o in [root]+list(root.children_recursive):
 if o.type in {'MESH','EMPTY'}:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'room.glb'),export_format='GLB',use_selection=True,export_animations=True,export_cameras=False,export_lights=False)
for nt,output,old in windows:
 if old:nt.links.new(old,output.inputs['Surface'])
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(out/'Room_Waving_Source.blend'))
s.cycles.samples=20;s.render.resolution_x=1000;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.filepath=str(out/'room-poster.png');bpy.ops.render.render(write_still=True)
print('WAVING ROOM COMPLETE',count)
