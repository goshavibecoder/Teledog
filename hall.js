import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function addHall(room){
 const response=await fetch('./assets/hall.glb.gz?v=hall19');
 if(!response.ok)throw new Error(`Hall asset: ${response.status}`);
 const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const gltf=await new GLTFLoader().parseAsync(buffer,'./assets/');
 const hall=gltf.scene;hall.name='TELEDOG statue gallery';hall.userData.gallery=true;
 hall.traverse(o=>{if(o.isMesh){o.userData.gallery=true;if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallFloor'){o.material.roughness=.48;o.material.metalness=.15;o.material.side=THREE.FrontSide;}if((o.userData.name||o.name).replaceAll('_',' ')==='Hall HallBase'){
  const positions=o.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i)-.24)<1e-6)positions.setY(i,.2415);positions.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 }if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}}});
 room.add(hall);
 // The original floor ends at the open right side; bridge it to the doorway.
 const floor=hall.getObjectByName('Hall_HallFloor');
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(.02,.028,1.46),floor.material.clone());bridge.name='Gallery threshold';bridge.position.set(1.69,-.014,.23);hall.add(bridge);
 const light=new THREE.PointLight(0xc4eaff,7,7,2);light.position.set(4.2,2.2,0);hall.add(light);
 return hall;
}
