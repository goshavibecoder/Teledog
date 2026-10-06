import * as THREE from './vendor/build/three.module.js';

// The exported decals contain thousands of nearly coplanar triangles. Rebuild
// one flat, alpha-cutout quad using the original texture's affine UV mapping.
export function flattenDecal(geometry){
 const position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 if(!position||!uv)return geometry;
 geometry.computeBoundingBox();
 const spans=geometry.boundingBox.getSize(new THREE.Vector3()).toArray();
 const axes=[0,1,2].sort((a,b)=>spans[b]-spans[a]),a=axes[0],b=axes[1],normal=axes[2];
 const sums=Array(9).fill(0),u=[0,0,0],v=[0,0,0];let plane=0;
 for(let i=0;i<position.count;i++){
  const p=[position.getX(i),position.getY(i),position.getZ(i)],row=[p[a],p[b],1];plane+=p[normal];
  for(let j=0;j<3;j++){u[j]+=row[j]*uv.getX(i);v[j]+=row[j]*uv.getY(i);for(let k=0;k<3;k++)sums[j*3+k]+=row[j]*row[k];}
 }
 const matrix=new THREE.Matrix3().set(...sums);
 if(Math.abs(matrix.determinant())<1e-15)return geometry;
 matrix.invert();const U=new THREE.Vector3(...u).applyMatrix3(matrix),V=new THREE.Vector3(...v).applyMatrix3(matrix);
 const determinant=U.x*V.y-U.y*V.x;if(Math.abs(determinant)<1e-12)return geometry;
 const vertices=[];const texcoords=[0,0,1,0,1,1,0,1];
 for(let i=0;i<8;i+=2){const s=texcoords[i]-U.z,t=texcoords[i+1]-V.z,p=[0,0,0];p[a]=(s*V.y-U.y*t)/determinant;p[b]=(U.x*t-s*V.x)/determinant;p[normal]=plane/position.count;vertices.push(...p);}
 const quad=new THREE.BufferGeometry();quad.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));quad.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));quad.setIndex([0,1,2,0,2,3]);quad.computeVertexNormals();quad.computeBoundingSphere();return quad;
}

export function fixRoomVisuals(room){
 const meshes=[];room.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const flattened=new Map();
 for(const mesh of meshes){
  mesh.frustumCulled=true;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  for(const material of materials){
   if(/TELEDOG transparent cutout/i.test(material.name)){
    if(!flattened.has(mesh.geometry))flattened.set(mesh.geometry,flattenDecal(mesh.geometry));
    mesh.geometry=flattened.get(mesh.geometry);
    material.transparent=false;material.alphaTest=.03;material.depthWrite=true;material.side=THREE.DoubleSide;
    material.polygonOffset=true;material.polygonOffsetFactor=-2;material.polygonOffsetUnits=-2;
   }else if(material.name.startsWith('Hologram')){
    material.transparent=true;material.depthTest=true;material.depthWrite=false;material.side=THREE.FrontSide;mesh.renderOrder=2;
    // A shared depth silhouette prevents the white/cyan head and rear surfaces
    // from painting over the eyes, nose, clothes and other front-facing parts.
    const depth=new THREE.Mesh(mesh.geometry,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:THREE.FrontSide}));
    depth.name='Hologram depth silhouette';depth.renderOrder=1;mesh.add(depth);
   }else if(/glass|display window/i.test(material.name)){
    material.transparent=true;material.depthWrite=false;material.side=THREE.FrontSide;mesh.renderOrder=3;
   }
   material.needsUpdate=true;
  }
 }
}
