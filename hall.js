import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export function placeGreenFrog(model,hall){
 model.name='Green frog statue';model.rotation.y=Math.PI;model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3());
 const scale=Math.min(1.36/size.x,1.30/size.y,.78/size.z);model.scale.multiplyScalar(scale);model.updateMatrixWorld(true);
 const fitted=new THREE.Box3().setFromObject(model,true),center=fitted.getCenter(new THREE.Vector3());
 model.position.add(new THREE.Vector3(2.86-center.x,.246-fitted.min.y,.99-center.z));
 model.traverse(o=>{o.userData.gallery=true;});hall.add(model);return model;
}
async function loadCompressedModel(url){
 const response=await fetch(url);if(!response.ok)throw new Error(`Gallery asset: ${response.status}`);
 const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 return new GLTFLoader().parseAsync(buffer,'./assets/');
}
async function loadClownHead(){
 const response=await fetch('./assets/clown-head.json?v=hall30');
 if(!response.ok)throw new Error(`Clown head: ${response.status}`);
 return response.json();
}
export function applyClownHead(hall,head){
 // The first 1,392 vertices in the green material group form the head.
 // Keep the hands in that same group intact.
 const mesh=hall.getObjectByName('Hall_Green')||hall.getObjectByName('Hall Green');
 if(!mesh?.isMesh)throw new Error('Clown head mesh is missing');
 for(const [attribute,values] of [['position',head.positions],['normal',head.normals]]){
  const buffer=mesh.geometry.getAttribute(attribute);
  if(values.length!==1392*3||buffer.array.length<values.length)throw new Error('Invalid clown head geometry');
  buffer.array.set(values);buffer.needsUpdate=true;
 }
 mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
}
export function fixClownBrows(hall){
 const face=hall.getObjectByName('Hall_Green')||hall.getObjectByName('Hall Green');
 const positions=face.geometry.getAttribute('position'),normals=face.geometry.getAttribute('normal');
 const ranges=[["LeftUpperLidFold1",17707,540],["LeftUpperLidFold1Cap0",18247,1421],["LeftUpperLidFold1Cap44",19668,1421],["LeftUpperLidFold2",21089,540],["LeftUpperLidFold2Cap0",21629,1421],["LeftUpperLidFold2Cap44",23050,1421],["RightUpperLidFold1",44168,540],["RightUpperLidFold1Cap0",44708,1421],["RightUpperLidFold1Cap44",46129,1421],["RightUpperLidFold2",47550,540],["RightUpperLidFold2Cap0",48090,1421],["RightUpperLidFold2Cap44",49511,1421]];
 for(const [name,start,count] of ranges){
  const fold=name.includes('Fold1')?1:2;
  const center=4.4+(name.startsWith('Left')?-.165:.165)*.75*1.08;
  for(let i=start;i<start+count;i++){
   positions.setX(i,center+(positions.getX(i)-center)*.88);
   positions.setY(i,positions.getY(i)-(fold===1?.019:.038)*.75);
   positions.setZ(i,positions.getZ(i)+(fold===1?.055:.080)*.75);
   const n=new THREE.Vector3(normals.getX(i)/.88,normals.getY(i),normals.getZ(i)).normalize();normals.setXYZ(i,n.x,n.y,n.z);
  }
 }
 face.material.transparent=false;face.material.opacity=1;face.material.depthWrite=true;face.material.needsUpdate=true;
 positions.needsUpdate=true;normals.needsUpdate=true;face.geometry.computeBoundingBox();face.geometry.computeBoundingSphere();
 // Lift only the rainbow wig so both eyebrow arches stay entirely below it.
 for(const mesh of hall.children.slice(37,43)){
  const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+.065*.75);
  p.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
}
export function revealFrogGlass(hall){
 const glass=hall.getObjectByName('Hall_ShowcaseGlass')||hall.getObjectByName('Hall ShowcaseGlass');
 if(!glass?.isMesh)throw new Error('Showcase glass is missing');
 const source=glass.geometry,index=source.getIndex(),position=source.getAttribute('position'),other=[];
 for(let i=0;i<index.count;i+=3){
  const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
  if(!ids.every(v=>position.getX(v)<3.62&&position.getZ(v)>.51))other.push(...ids);
 }
 glass.geometry=source.clone();glass.geometry.setIndex(other);
 // Five explicit panels form a cap over the frog: front, rear, sides and roof.
 const enclosure=new THREE.Group();enclosure.name='Green frog showcase glass';enclosure.userData.gallery=true;
 const width=1.51,height=1.408,depth=.95,center=new THREE.Vector3(2.86,.944,.99);
 const material=new THREE.MeshStandardMaterial({color:0xc4e8f2,transparent:true,opacity:.23,roughness:.055,metalness:.12,envMapIntensity:1.8,depthWrite:false,side:THREE.DoubleSide});
 function panel(name,w,h,x,y,z,rx=0,ry=0){
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);pane.name=name;
  pane.position.set(x,y,z);pane.rotation.set(rx,ry,0);pane.renderOrder=3;pane.userData.gallery=true;enclosure.add(pane);return pane;
 }
 panel('Frog glass front',width,height,center.x,center.y,1.465);
 panel('Frog glass rear',width,height,center.x,center.y,.515);
 panel('Frog glass left',depth,height,2.105,center.y,center.z,0,Math.PI/2);
 panel('Frog glass right',depth,height,3.615,center.y,center.z,0,Math.PI/2);
 panel('Frog glass roof',width,depth,center.x,1.648,center.z,-Math.PI/2);
 hall.add(enclosure);
 const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(width,height,depth)),new THREE.LineBasicMaterial({color:0xe0f5ff,transparent:true,opacity:.65,depthWrite:false}));
 edges.name='Green frog glass edges';edges.position.copy(center);edges.userData.gallery=true;edges.renderOrder=4;hall.add(edges);
 // Narrow reflected strips make the front pane readable against the green toy.
 const reflectionMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
 for(const [x,y,h] of [[2.28,.95,.95],[3.43,1.12,.50]]){
  const reflection=new THREE.Mesh(new THREE.PlaneGeometry(.026,h),reflectionMaterial);
  reflection.name='Frog glass reflection';reflection.position.set(x,y,1.466);reflection.rotation.z=-.12;reflection.renderOrder=4;reflection.userData.gallery=true;hall.add(reflection);
 }
 return enclosure;
}
export async function addHall(room){
 const [gltf,frog,head]=await Promise.all([loadCompressedModel('./assets/hall.glb.gz?v=hall24'),loadCompressedModel('./assets/groyper_green.glb.gz?v=hall23'),loadClownHead()]);
 const hall=gltf.scene;applyClownHead(hall,head);fixClownBrows(hall);hall.name='TELEDOG statue gallery';hall.userData.gallery=true;
 hall.traverse(o=>{if(o.isMesh){o.userData.gallery=true;if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallFloor'){o.material.roughness=.48;o.material.metalness=.15;o.material.side=THREE.FrontSide;}if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallBase'){
  const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i)-.24)<1e-6)positions.setY(i,.2415);positions.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 }if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}}});
 revealFrogGlass(hall);
 placeGreenFrog(frog.scene,hall);
 room.add(hall);
 // The original floor ends at the open right side; bridge it to the doorway.
 const floor=hall.getObjectByName('Hall_HallFloor');
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(.02,.028,1.46),floor.material.clone());bridge.name='Gallery threshold';bridge.position.set(1.69,-.014,.23);hall.add(bridge);
 const light=new THREE.PointLight(0xc4eaff,7,7,2);light.position.set(4.2,2.2,0);hall.add(light);
 return hall;
}
