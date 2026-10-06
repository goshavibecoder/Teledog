from pathlib import Path
import sys
import numpy as np
from pxr import Usd,UsdGeom,UsdShade,UsdLux,UsdUtils,Sdf,Gf,Vt
# Pass the work root containing usdz-work/ and output/.
root=Path(sys.argv[1]);stage=Usd.Stage.CreateNew(str(root/'usdz-work/frog.usdc'));UsdGeom.SetStageUpAxis(stage,UsdGeom.Tokens.y);UsdGeom.SetStageMetersPerUnit(stage,1);model=UsdGeom.Xform.Define(stage,'/FrogClown');stage.SetDefaultPrim(model.GetPrim());model.GetPrim().SetDisplayName('Rainbow frog clown, arms down');stage.SetMetadata('comment','Volumetric sculpt based on the supplied frog clown reference. Standing pose with both arms down, without the unicycle.')
preview=[];preview_names=[]
def mat(name,color,rough=.35):
 m=UsdShade.Material.Define(stage,'/FrogClown/Materials/'+name);s=UsdShade.Shader.Define(stage,str(m.GetPath())+'/Surface');s.CreateIdAttr('UsdPreviewSurface');s.CreateInput('diffuseColor',Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*color));s.CreateInput('roughness',Sdf.ValueTypeNames.Float).Set(rough);m.CreateSurfaceOutput().ConnectToSource(s.ConnectableAPI(),'surface');return m,color
colors={name:mat(name,col,r) for name,col,r in [('Green',(.21,.43,.105),.36),('GreenDark',(.065,.17,.035),.5),('Blue',(.008,.025,.82),.26),('White',(.96,.99,.94),.21),('Black',(.003,.005,.003),.23),('Lip',(.48,.16,.065),.34),('Mouth',(.10,.035,.008),.52),('Nose',(.98,.006,.004),.15),('Bow',(.48,.81,.96),.3),('Dot',(.82,.94,1.),.3),('Red',(1,.01,.03),.43),('Orange',(1,.23,.008),.43),('Yellow',(1,.88,.02),.43),('WigGreen',(.015,.60,.025),.43),('WigBlue',(.035,.17,.99),.43),('Purple',(.50,.035,.52),.43)]}
def mesh(name,p,f,n,col):
 p=np.asarray(p,dtype=np.float32);f=np.asarray(f,dtype=np.int32);n=np.asarray(n,dtype=np.float32);g=UsdGeom.Mesh.Define(stage,'/FrogClown/Geometry/'+name);g.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(p));g.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(f)//3,3,dtype=np.int32)));g.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(f));g.CreateNormalsAttr(Vt.Vec3fArray.FromNumpy(n));g.SetNormalsInterpolation('vertex');g.CreateSubdivisionSchemeAttr('none');g.CreateExtentAttr([Gf.Vec3f(*map(float,p.min(0))),Gf.Vec3f(*map(float,p.max(0)))]);UsdShade.MaterialBindingAPI.Apply(g.GetPrim()).Bind(colors[col][0]);preview.append((p,f.reshape(-1,3),colors[col][1]));preview_names.append(name)
def ell(name,c,r,col,tilt=0):
 p=[];n=[];f=[];nu=48;nv=28;a=np.radians(tilt);rot=np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
 for j in range(nv+1):
  ph=np.pi*j/nv
  for i in range(nu+1):
   th=2*np.pi*i/nu;v=np.array([np.sin(ph)*np.cos(th),np.cos(ph),np.sin(ph)*np.sin(th)]);p.append(rot@(v*np.array(r))+np.array(c));normal=rot@(v/np.array(r));n.append(normal/np.linalg.norm(normal))
 for j in range(nv):
  for i in range(nu):
   a=j*(nu+1)+i;b=a+nu+1
   if j>0:f.extend([a,a+1,b])
   if j<nv-1:f.extend([a+1,b+1,b])
 mesh(name,p,f,n,col)
def tube(name,path,r,col):
 path=np.array(path);pts=[];norm=[];faces=[];sides=12
 for i,c in enumerate(path):
  tangent=path[min(i+1,len(path)-1)]-path[max(0,i-1)];tangent/=np.linalg.norm(tangent);ref=np.array([0.,0.,1.])
  if abs(tangent@ref)>.95:ref=np.array([0.,1.,0.])
  u=np.cross(tangent,ref);u/=np.linalg.norm(u);v=np.cross(tangent,u)
  for j in range(sides):
   a=2*np.pi*j/sides;n=np.cos(a)*u+np.sin(a)*v;pts.append(c+r*n);norm.append(n)
 for i in range(len(path)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;cc=a+sides;d=b+sides;faces.extend([a,b,cc,b,d,cc])
 mesh(name,pts,faces,norm,col)
 for i in [0,len(path)-1]:ell(name+'Cap'+str(i),path[i],(r,r,r),col)
# General pillow sculpt: a rounded, genuinely volumetric version of a silhouette.
from scipy.interpolate import CubicSpline
def pillow(name,outline,center,z,depth,col):
 outline=np.array(outline);outline=np.vstack([outline,outline[0]]);curve=CubicSpline(np.arange(len(outline)),outline,bc_type='periodic');edge=curve(np.linspace(0,len(outline)-1,49)[:-1]);center=np.array(center);nu=len(edge);nv=28;p=[];f=[]
 # Ensure counterclockwise outline for outward front normals.
 area=np.sum(edge[:,0]*np.roll(edge[:,1],-1)-edge[:,1]*np.roll(edge[:,0],-1))
 if area<0:edge=edge[::-1]
 for j in range(nv+1):
  ph=np.pi*j/nv
  for e in edge:
   xy=center+np.sin(ph)*(e-center);p.append((xy[0],xy[1],z+depth*np.cos(ph)))
 for j in range(nv):
  for i in range(nu):
   a=j*nu+i;b=j*nu+(i+1)%nu;c=a+nu;d=b+nu
   if j>0:f.extend([a,c,b])
   if j<nv-1:f.extend([b,c,d])
 p=np.array(p);tri=np.array(f).reshape(-1,3);n=np.zeros_like(p)
 for face in tri:
  normal=np.cross(p[face[1]]-p[face[0]],p[face[2]]-p[face[0]])
  for v in face:n[v]+=normal
 n/=np.maximum(1e-9,np.linalg.norm(n,axis=1,keepdims=True));mesh(name,p,f,n,col)
# Single broad pear-shaped suit and cheek-heavy head, without detached cheek balls.
pillow('SuitTorso',[(-.275,1.08),(-.355,.98),(-.405,.76),(-.38,.58),(-.25,.445),(0,.42),(.25,.445),(.38,.58),(.405,.76),(.355,.98),(.275,1.08)],(0,.78),0,.350,'Blue')
pillow('Head',[(-.33,1.075),(-.425,1.14),(-.43,1.29),(-.37,1.47),(-.24,1.565),(0,1.58),(.24,1.565),(.37,1.47),(.40,1.29),(.34,1.08),(0,1.06)],(0,1.30),.025,.325,'Green')
for side in [-1,1]:
 tag='Left' if side<0 else 'Right'
 # Shaped solid pant legs with soft knees, broad ankles and chunky shoes.
 outline=[(side*(.10+x),y) for x,y in [(0,.50),(.12,.49),(.135,.35),(.11,.24),(.10,.09),(.005,.09),(-.013,.24),(-.005,.36)]]
 pillow(tag+'PantLeg',outline,(side*.16,.28),-.002,.095,'Blue')
 ell(tag+'AnkleCuff',(side*.16,.105,.007),(.083,.042,.090),'Blue')
 ell(tag+'Shoe',(side*.178,.062,.100),(.128,.068,.176),'Blue')
 ell(tag+'Sole',(side*.178,.022,.100),(.130,.022,.177),'Blue')
 path=[(side*(.315+.130*np.sin(t*np.pi/2)),1.02-.47*t,.012+.015*t) for t in np.linspace(0,1,40)]
 tube(tag+'Sleeve',path,.070,'Blue')
 ell(tag+'Cuff',(side*.445,.563,.026),(.072,.026,.066),'Blue')
 ell(tag+'Palm',(side*.450,.512,.036),(.067,.078,.058),'Green',side*7)
 for finger in range(3):
  x=side*(.420+.029*finger);length=.102-.015*abs(finger-1)
  tube(tag+'Finger'+str(finger),[(x,.486,.043),(x+side*.008,.449,.061),(x+side*.014,.486-length,.080)],.020,'Green')
 tube(tag+'Thumb',[(side*.413,.542,.053),(side*.382,.513,.077),(side*.384,.484,.086)],.022,'Green')
 # Almond eye whites with sculpted eyelids and multiple folds.
 ex=side*.165;ey=1.441
 outline=[(ex-.147,ey+.005),(ex-.096,ey+.064),(ex-.010,ey+.081),(ex+.091,ey+.060),(ex+.146,ey+.004),(ex+.095,ey-.039),(ex-.013,ey-.049),(ex-.098,ey-.036)]
 pillow(tag+'EyeWhite',outline,(ex,ey),.281,.046,'White')
 ell(tag+'Pupil',(ex+side*.011,ey+.006,.321),(.060,.064,.018),'Black')
 for i,(dx,dy,rx) in enumerate([(-.015,.033,.011),(.022,.026,.015),(-.003,.009,.006)]):ell(tag+'Catchlight'+str(i),(ex+dx,ey+dy,.340),(rx,rx,.004),'White')
 for fold,offset in enumerate([0,.035,.066]):
  path=[(ex+t,ey+offset+.073*np.sqrt(max(0,1-(t/.147)**2)),.293-.025*fold) for t in np.linspace(-.147,.147,45)]
  tube(tag+'UpperLidFold'+str(fold),path,.013 if fold==0 else .011,'Green')
 tube(tag+'LowerLid',[(ex+t,ey-.045*np.sqrt(max(0,1-(t/.147)**2)),.288) for t in np.linspace(-.147,.147,45)],.010,'Green')
 for i in range(2):tube(tag+'CheekCrease'+str(i),[(side*(.30+.04*t),1.387-.020*i-.009*t,.230+.008*t) for t in np.linspace(0,1,12)],.006,'GreenDark')
# Full lower lip, upper lip and a recessed smile gap below the round clown nose.
for name,offset,radius,col in [('LowerLip',-.017,.031,'Lip'),('UpperLip',.025,.024,'Lip'),('Smile',.004,.008,'Mouth')]:
 tube(name,[(x,1.216+offset+.065*(x/.245)**2,.295-.040*(x/.245)**2) for x in np.linspace(-.245,.245,61)],radius,col)
ell('RedClownNose',(0,1.332,.338),(.088,.088,.085),'Nose')
# Move the face with the fuller head, keeping the eyes and lips above the skin.
face_parts=['EyeWhite','Pupil','Catchlight','UpperLidFold','LowerLid','CheekCrease','LowerLip','UpperLip','Smile','RedClownNose']
for i,name in enumerate(preview_names):
 if any(part in name for part in face_parts):
  p,f,c=preview[i];p[:,2]+=.047
  g=UsdGeom.Mesh.Get(stage,'/FrogClown/Geometry/'+name);g.GetPointsAttr().Set(Vt.Vec3fArray.FromNumpy(p));g.GetExtentAttr().Set([Gf.Vec3f(*map(float,p.min(0))),Gf.Vec3f(*map(float,p.max(0)))])
# Wedge-shaped, padded bow wings, rather than oval blobs.
for side in [-1,1]:
 tag='Left' if side<0 else 'Right'
 outline=[(side*x,y) for x,y in [(.028,1.060),(.055,1.098),(.145,1.140),(.163,1.098),(.164,1.000),(.143,.991),(.058,1.021)]]
 pillow('Bow'+tag,outline,(side*.105,1.062),.268,.052,'Bow')
 for i,(x,y) in enumerate([(.085,1.092),(.132,1.104),(.137,1.040),(.091,1.026)]):ell('BowDot'+tag+str(i),(side*x,y,.315),(.009,.009,.004),'Dot')
 for i,yy in enumerate([1.047,1.074]):tube('BowFold'+tag+str(i),[(side*(.033+.035*t),1.06+(yy-1.06)*t,.315) for t in np.linspace(0,1,10)],.004,'Bow')
ell('BowKnot',(0,1.060,.297),(.036,.040,.034),'Bow')
ell('BowKnotDot',(-.009,1.063,.332),(.008,.008,.003),'Dot')
# Rounded rainbow bands, facing forward and running over the crown toward the back.
for band,(x,col) in enumerate(zip([-.355,-.255,-.135,.008,.154,.295],['Red','Orange','Yellow','WigGreen','WigBlue','Purple'])):
 crown=1.62+.105*np.sqrt(max(0,1-(x/.39)**2));width=.104 if band not in [0,5] else .084
 # Front scallops overlap into six continuous coloured strips.
 for curl in range(3):
  y=crown-.063*curl;z=.083+.047*curl
  ell('HairBand'+str(band)+'Front'+str(curl),(x,y,z),(width,.108,.104),col,(-1)**curl*11)
  ell('HairBand'+str(band)+'Rear'+str(curl),(x,y,.05-z),(width,.108,.104),col,(-1)**curl*11)
 if band in [0,5]:
  for curl in range(2):
   ell('HairTemple'+str(band)+str(curl),(x*1.08,1.53-.083*curl,.107),(.077,.089,.096),col)
   ell('HairTempleRear'+str(band)+str(curl),(x*1.08,1.53-.083*curl,-.057),(.077,.089,.096),col)
# Rear hair mirrors the front across the head centre; the lower rear head stays green.
UsdLux.DomeLight.Define(stage,'/FrogClown/Lighting/Ambient').CreateIntensityAttr(300)
light=UsdLux.DistantLight.Define(stage,'/FrogClown/Lighting/Key');light.CreateIntensityAttr(1500);light.CreateAngleAttr(20);UsdGeom.Xformable(light).AddRotateXYZOp().Set(Gf.Vec3f(-25,-35,0))
stage.GetRootLayer().Save();out=root/'output/Frog_Clown_Arms_Down.usdz';assert UsdUtils.CreateNewUsdzPackage(Sdf.AssetPath(str(root/'usdz-work/frog.usdc')),str(out))
np.savez(root/'usdz-work/frog_preview.npz',**{f'{k}{i}':v for i,(p,f,c) in enumerate(preview) for k,v in [('p',p),('f',f),('c',np.array(c))]})
print(str(out),out.stat().st_size,'bytes',len(preview),'mesh parts')
