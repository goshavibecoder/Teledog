import sys
from pxr import Usd,UsdGeom,Gf
# Usage: python3 source/replace_clown_usd.py room.usdz frog.usdc gallery.usdc
s=Usd.Stage.Open(sys.argv[1])
path='/Teledog/Hall/FrogStatue'
s.RemovePrim(path)
frog=UsdGeom.Xform.Define(s,path)
frog.GetPrim().GetReferences().AddReference(sys.argv[2],'/FrogClown')
frog.AddTranslateOp().Set(Gf.Vec3d(4.40,.2461,-1.02))
frog.AddScaleOp().Set(Gf.Vec3f(.75,.75,.75))
s.GetPrimAtPath(path+'/Lighting').SetActive(False)
b=UsdGeom.BBoxCache(0,['default']).ComputeWorldBound(frog.GetPrim()).ComputeAlignedRange()
assert b.GetMin()[0]>3.75 and b.GetMax()[0]<5.05
assert b.GetMin()[2]>-1.46 and b.GetMax()[2]<-.52
assert b.GetMin()[1]>.24 and b.GetMax()[1]<1.86
assert s.GetRootLayer().Export(sys.argv[3])
print('Rounded clown fits the original showcase:',b)
