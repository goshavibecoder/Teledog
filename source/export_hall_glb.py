import json,struct,pathlib,gzip,sys
import numpy as np
from pxr import Usd,UsdGeom,UsdShade,Gf
# Usage: python3 source/export_hall_glb.py approved-room.usdz assets/hall.glb.gz
s=Usd.Stage.Open(sys.argv[1])
cache=UsdGeom.XformCache(0);groups={};mats=[];keys={}
for p in Usd.PrimRange(s.GetPrimAtPath('/Teledog/Hall')):
 if not p.IsA(UsdGeom.Mesh) and not p.IsA(UsdGeom.Cube):continue
 material=UsdShade.MaterialBindingAPI(p).ComputeBoundMaterial()[0]
 key=str(material.GetPath())
 if key not in keys:
  sh=UsdShade.Shader(material.GetSurfaceOutput().GetConnectedSource()[0].GetPrim())
  def val(n,d):
   i=sh.GetInput(n);v=i.Get() if i else None;return d if v is None else v
  color=list(val('diffuseColor',(.5,.5,.5)));opacity=float(val('opacity',1));em=list(val('emissiveColor',(0,0,0)))
  m={'name':p.GetName()+' material','pbrMetallicRoughness':{'baseColorFactor':color+[opacity],'roughnessFactor':float(val('roughness',.5)),'metallicFactor':float(val('metallic',0))},'doubleSided':True}
  if opacity<1:m['alphaMode']='BLEND'
  if max(em)>0:m['emissiveFactor']=[min(1,x) for x in em]
  keys[key]=len(mats);mats.append(m);groups[key]=[[],[],[],0]
 if p.IsA(UsdGeom.Cube):
  size=UsdGeom.Cube(p).GetSizeAttr().Get()/2
  points=np.array([[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],dtype=float)*size
  idx=np.array([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5])
  points=points[idx];idx=np.arange(len(points));normals=np.repeat(np.cross(points.reshape(-1,3,3)[:,1]-points.reshape(-1,3,3)[:,0],points.reshape(-1,3,3)[:,2]-points.reshape(-1,3,3)[:,0]),3,axis=0)
 else:
  mesh=UsdGeom.Mesh(p);points=np.asarray(mesh.GetPointsAttr().Get(),dtype=float);idx=np.asarray(mesh.GetFaceVertexIndicesAttr().Get(),dtype=np.uint32)
  assert np.all(np.asarray(mesh.GetFaceVertexCountsAttr().Get())==3)
  normals=np.asarray(mesh.GetNormalsAttr().Get(),dtype=float)
  if normals.shape!=points.shape:
   normals=np.zeros_like(points);tri=points[idx.reshape(-1,3)];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);np.add.at(normals,idx,np.repeat(fn,3,axis=0))
 matrix=np.array(cache.GetLocalToWorldTransform(p));points=(np.column_stack([points,np.ones(len(points))])@matrix)[:,:3]
 normals=normals@np.linalg.inv(matrix[:3,:3]).T;normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-9)
 g=groups[key];g[0].append(points.astype('<f4'));g[1].append(normals.astype('<f4'));g[2].append(idx.astype('<u4')+g[3]);g[3]+=len(points)
doc={'asset':{'version':'2.0','generator':'TELEDOG hall USD export'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':mats,'bufferViews':[],'accessors':[],'buffers':[]};binary=bytearray()
def acc(a,kind,component):
 data=a.tobytes();offset=len(binary);binary.extend(data);binary.extend(b'\0'*((-len(binary))%4));v=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(data)})
 out={'bufferView':v,'componentType':component,'count':len(a),'type':kind}
 if kind=='VEC3':out.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 i=len(doc['accessors']);doc['accessors'].append(out);return i
for key,g in groups.items():
 pos,norm,idx=map(np.concatenate,g[:3]);mi=len(doc['meshes']);doc['meshes'].append({'primitives':[{'attributes':{'POSITION':acc(pos,'VEC3',5126),'NORMAL':acc(norm,'VEC3',5126)},'indices':acc(idx,'SCALAR',5125),'material':keys[key]}]});doc['nodes'].append({'name':'Hall '+key.split('/')[-1],'mesh':mi});doc['scenes'][0]['nodes'].append(mi)
doc['buffers']=[{'byteLength':len(binary)}];js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
path=pathlib.Path(sys.argv[2]);path.write_bytes(gzip.compress(out,compresslevel=9));print(json.dumps({'meshes':len(groups),'glb_bytes':len(out),'gzip_bytes':path.stat().st_size}))
