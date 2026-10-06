import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function addHall(room){
 const response=await fetch('./assets/hall.glb.gz?v=hall19');
 if(!response.ok)throw new Error(`Hall asset: ${response.status}`);
 const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const gltf=await new GLTFLoader().parseAsync(buffer,'./assets/');
 const hall=gltf.scene;hall.name='TELEDOG statue gallery';hall.userData.gallery=true;
 hall.traverse(o=>{if(o.isMesh){o.userData.gallery=true;if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}}});
 room.add(hall);
 // The original floor ends at the open right side; bridge it to the doorway.
 const bridge=new THREE.Mesh(new THREE.BoxGeometry(.24,.028,1.46),new THREE.MeshStandardMaterial({color:0x173c50,roughness:.4}));bridge.position.set(1.60,-.014,.23);hall.add(bridge);
 const light=new THREE.PointLight(0xc4eaff,7,7,2);light.position.set(4.2,2.2,0);hall.add(light);
 return hall;
}
