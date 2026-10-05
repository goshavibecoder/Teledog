import json,struct,pathlib,numpy as np
from scipy.spatial import ConvexHull
root=pathlib.Path(__file__).resolve().parents[1]
p=root/'assets/room.glb'
raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);binary=bytearray(raw[28+n:])
node=next(x for x in doc['nodes'] if x.get('name','').endswith('Continuous hoodie') and x.get('name','').startswith('Seated'))
prim=doc['meshes'][node['mesh']]['primitives'][0]
def read(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];k={'VEC3':3,'SCALAR':1}[a['type']]
 return np.frombuffer(binary,dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']],count=a['count']*k,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,k).copy()
vertices=read(prim['attributes']['POSITION']);faces=read(prim['indices']).reshape(-1,3)
plane=vertices[:,0].min();cap=np.all(np.abs(vertices[faces][:,:,0]-plane)<1e-4,axis=1)
hull=ConvexHull(vertices[faces[cap]].reshape(-1,3)[:,1:]);eq=hull.equations
center=vertices[faces[cap]].reshape(-1,3)[:,1:].mean(0)
def distance(yz):return np.min(-(eq[:,:2]@yz+eq[:,2])/np.linalg.norm(eq[:,:2],axis=1))
scale=max(distance(center),1e-6)
points=vertices.tolist();new_faces=faces[~cap].tolist()
def refine(a,b,c,depth):
 if depth:
  ab=(a+b)/2;bc=(b+c)/2;ca=(c+a)/2
  for tri in [(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)]:refine(*tri,depth-1)
 else:
  ids=[]
  for v in (a,b,c):
   q=v.copy()
   ids.append(len(points));points.append(q.tolist())
  new_faces.append(ids)
for tri in vertices[faces[cap]]:refine(*tri,2)
v=np.array(points,dtype='<f4');f=np.array(new_faces,dtype='<u4')
# A smooth Poisson surface with zero displacement at every actual cut boundary.
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
start=len(vertices);patch=v[start:];uv,inverse=np.unique(np.round(patch[:,1:],6),axis=0,return_inverse=True)
patch_faces=inverse[(f[len(faces[~cap]):]-start)]
edge_counts={};rows=[];cols=[];values=[];rhs=np.zeros(len(uv))
for tri in patch_faces:
 xyz=uv[tri];area=abs(np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]))/2
 if area<1e-14:continue
 rhs[tri]+=area/3
 for a,b,c in [(0,1,2),(1,2,0),(2,0,1)]:
  i,k=int(tri[a]),int(tri[b]);edge=tuple(sorted((i,k)));edge_counts[edge]=edge_counts.get(edge,0)+1
  w=np.dot(xyz[a]-xyz[c],xyz[b]-xyz[c])/(4*area)
  rows.extend([i,k,i,k]);cols.extend([i,k,k,i]);values.extend([w,w,-w,-w])
boundary=np.unique([x for edge,count in edge_counts.items() if count==1 for x in edge]);free=np.setdiff1d(np.arange(len(uv)),boundary)
L=coo_matrix((values,(rows,cols)),shape=(len(uv),len(uv))).tocsr();height=np.zeros(len(uv));height[free]=spsolve(L[free][:,free],rhs[free]);height=np.maximum(height,0);height*=.19/max(height.max(),1e-12)
v[start:,0]-=height[inverse]
assert np.isfinite(v).all()
# Smooth the rounded patch, including its seam with the original hoodie.
keys=np.round(v,5);_,groups=np.unique(keys,axis=0,return_inverse=True);normals=np.zeros((groups.max()+1,3))
fn=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
for i in range(3):np.add.at(normals,groups[f[:,i]],fn)
normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12);normals=normals[groups].astype('<f4')
def append(data,kind,ctype,target):
 while len(binary)%4:binary.append(0)
 off=len(binary);blob=data.tobytes();binary.extend(blob);vi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(blob),'target':target})
 a={'bufferView':vi,'componentType':ctype,'count':len(data),'type':kind}
 if kind=='VEC3':a.update(min=data.min(0).tolist(),max=data.max(0).tolist())
 ai=len(doc['accessors']);doc['accessors'].append(a);return ai
prim['attributes']['POSITION']=append(v,'VEC3',5126,34962);prim['attributes']['NORMAL']=append(normals,'VEC3',5126,34962);prim['indices']=append(f.reshape(-1,1),'SCALAR',5125,34963)
doc['buffers'][0]['byteLength']=len(binary)
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\0'*((-len(binary))%4)
result=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
(root/'assets/room-rounded.glb').write_bytes(result)
for i,start in enumerate(range(0,len(result),9000000),1):(root/f'assets/room.glb.part{i}').write_bytes(result[start:start+9000000])
assert len(result)<=18000000
assert len(doc['animations'])==2
print('Rounded',int(cap.sum()),'cap faces. Model bytes:',len(result),'maximum restored depth:',round(.19*.32,4))
# Exact geometry preview of the changed torso.
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
fig=plt.figure(figsize=(12,6))
for ix,(vv,ff,title) in enumerate([(vertices,faces,'Before'),(v,f,'Rounded left side')],1):
 ax=fig.add_subplot(1,2,ix,projection='3d');xyz=vv[:,[0,2,1]];xyz[:,1]*=-1
 tris=xyz[ff];ns=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0]);ns/=np.maximum(np.linalg.norm(ns,axis=1,keepdims=True),1e-8)
 light=np.array([-.6,-.6,1]);light/=np.linalg.norm(light);shade=.35+.65*np.maximum(0,ns@light)
 colors=np.array([.10,.48,.72])[None,:]*shade[:,None]
 ax.add_collection3d(Poly3DCollection(tris,facecolors=colors,edgecolors='none'));ax.set_xlim(-.8,.8);ax.set_ylim(-.6,.6);ax.set_zlim(1.1,2.9);ax.view_init(elev=15,azim=-135);ax.set_box_aspect((1.6,1.2,1.8));ax.set_title(title);ax.set_axis_off()
plt.tight_layout();plt.savefig(root/'torso-comparison.png',dpi=140)
