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
 const urls=Array.isArray(url)?url:[url];
 const responses=await Promise.all(urls.map(part=>fetch(part)));
 for(const response of responses)if(!response.ok)throw new Error(`Gallery asset: ${response.status}`);
 const body=responses.length===1?responses[0].body:new Blob(await Promise.all(responses.map(response=>response.arrayBuffer()))).stream();
 const buffer=await new Response(body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 return new GLTFLoader().parseAsync(buffer,'./assets/');
}
export function replaceClown(hall,model){
 // The baked hall export groups the original clown into material nodes 27–42.
 for(const mesh of hall.children.slice(27,43))mesh.visible=false;
 model.name='Reference clown statue';model.userData.gallery=true;
 model.traverse(o=>{o.userData.gallery=true;});hall.add(model);return model;
}
export function revealFrogGlass(hall){
 const glass=hall.getObjectByName('Hall_ShowcaseGlass')||hall.getObjectByName('Hall ShowcaseGlass');
 if(!glass?.isMesh)throw new Error('Showcase glass is missing');
 const source=glass.geometry,index=source.getIndex(),position=source.getAttribute('position');
 const frog=[],other=[];
 for(let i=0;i<index.count;i+=3){
  const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
  const belongs=ids.every(v=>position.getX(v)<3.62&&position.getZ(v)>.51);
  (belongs?frog:other).push(...ids);
 }
 if(!frog.length)throw new Error('Green frog glass panels are missing');
 const panels=source.clone();panels.setIndex(frog);panels.computeBoundingBox();panels.computeBoundingSphere();
 glass.geometry=source.clone();glass.geometry.setIndex(other);glass.geometry.computeBoundingBox();glass.geometry.computeBoundingSphere();
 const material=glass.material.clone();material.opacity=.14;material.transparent=true;
 material.depthWrite=false;material.side=THREE.FrontSide;material.roughness=.08;
 const enclosure=new THREE.Mesh(panels,material);enclosure.name='Green frog showcase glass';enclosure.renderOrder=2;enclosure.userData.gallery=true;hall.add(enclosure);
 const size=panels.boundingBox.getSize(new THREE.Vector3()),center=panels.boundingBox.getCenter(new THREE.Vector3());
 const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x,size.y,size.z)),new THREE.LineBasicMaterial({color:0xb7e4f2,transparent:true,opacity:.28,depthWrite:false}));
 edges.name='Green frog glass edges';edges.position.copy(center);edges.userData.gallery=true;edges.renderOrder=3;hall.add(edges);
 return enclosure;
}
export async function addHall(room){
 const [gltf,frog,clown]=await Promise.all([loadCompressedModel('./assets/hall.glb.gz?v=hall24'),loadCompressedModel('./assets/groyper_green.glb.gz?v=hall23'),loadCompressedModel(Array.from({length:7},(_,i)=>`./assets/clown.glb.gz.part${i+1}?v=hall28`))]);
 const hall=gltf.scene;replaceClown(hall,clown.scene);hall.name='TELEDOG statue gallery';hall.userData.gallery=true;
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
