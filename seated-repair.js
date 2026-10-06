import * as THREE from './vendor/build/three.module.js';

const sourceName=o=>o.userData.name||o.name.replaceAll('_',' ');
export function repairSeatedDog(room){
 let hoodie;room.traverse(o=>{if(o.isMesh&&/^Seated .*Continuous hoodie$/.test(sourceName(o)))hoodie=o;});
 if(!hoodie)return null;
 // Keep the original hood/collar and the resting sleeve on the other side.
 // The original cut torso and orphaned left sleeve are replaced together.
 const original=hoodie.geometry,index=original.index,position=original.getAttribute('position'),keep=[];
 const count=index?index.count:position.count;
 for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
  if(ids.every(j=>position.getY(j)>=2.40)||ids.every(j=>position.getX(j)>=.42))keep.push(...ids);
 }
 const retained=original.clone();retained.setIndex(keep);retained.computeBoundingBox();retained.computeBoundingSphere();hoodie.geometry=retained;
 const material=Array.isArray(hoodie.material)?hoodie.material[0]:hoodie.material;
 const profiles=[[1.30,.40,.255],[1.40,.455,.285],[1.64,.47,.315],[1.94,.46,.325],[2.18,.445,.32],[2.36,.40,.29],[2.50,.30,.24],[2.58,.22,.19]];
 const curve=new THREE.CatmullRomCurve3(profiles.map(([y,x,z])=>new THREE.Vector3(x,y,z)),false,'centripetal');
 const vertices=[],indices=[],rings=36,segments=48;
 for(let row=0;row<=rings;row++){const p=curve.getPoint(row/rings);for(let col=0;col<=segments;col++){const angle=col/segments*Math.PI*2;vertices.push(Math.cos(angle)*p.x,p.y,-.035+Math.sin(angle)*p.z);}}
 for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){const a=row*(segments+1)+col,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const body=new THREE.Mesh(geometry,material);body.name='Repaired round hoodie torso';hoodie.add(body);
 function softPart(name,center,scale){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),material);mesh.name=name;mesh.position.fromArray(center);mesh.scale.fromArray(scale);hoodie.add(mesh);return mesh;}
 softPart('Hoodie front kangaroo pocket',[0,1.62,.24],[.345,.23,.14]);
 softPart('Rounded resting shoulder',[.43,2.32,.015],[.235,.31,.28]);
 softPart('Resting right hoodie hand',[.43,1.69,.23],[.195,.20,.19]);
 const shoulder=softPart('Continuous left shoulder',[-.40,2.47,.045],[.24,.235,.265]);
 return {hoodie,body,shoulder};
}
