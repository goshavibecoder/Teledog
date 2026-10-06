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
 const response=await fetch('./assets/clown-head.json?v=hall25');
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
export async function addHall(room){
 const [gltf,frog,head]=await Promise.all([loadCompressedModel('./assets/hall.glb.gz?v=hall24'),loadCompressedModel('./assets/groyper_green.glb.gz?v=hall23'),loadClownHead()]);
 const hall=gltf.scene;applyClownHead(hall,head);hall.name='TELEDOG statue gallery';hall.userData.gallery=true;
 hall.traverse(o=>{if(o.isMesh){o.userData.gallery=true;if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallFloor'){o.material.roughness=.48;o.material.metalness=.15;o.material.side=THREE.FrontSide;}if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallBase'){
  const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i)-.24)<1e-6)positions.setY(i,.2415);positions.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 }if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}}});
 placeGreenFrog(frog.scene,hall);
 room.add(hall);
 // The original floor ends at the open right side; bridge it to the doorway.
 const floor=hall.getObjectByName('Hall_HallFloor');
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(.02,.028,1.46),floor.material.clone());bridge.name='Gallery threshold';bridge.position.set(1.69,-.014,.23);hall.add(bridge);
 const light=new THREE.PointLight(0xc4eaff,7,7,2);light.position.set(4.2,2.2,0);hall.add(light);
 return hall;
}
