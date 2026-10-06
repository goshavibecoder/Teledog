import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import * as THREE from '../vendor/build/three.module.js';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='three')return {url:new URL('../vendor/build/three.module.js',import.meta.url).href,shortCircuit:true};if(specifier.startsWith('three/addons/'))return {url:new URL('../vendor/examples/jsm/'+specifier.slice(13),import.meta.url).href,shortCircuit:true};return next(specifier,context);}});
const {GLTFLoader}=await import('../vendor/examples/jsm/loaders/GLTFLoader.js');
const {addHall,placeGreenFrog}=await import('../hall.js');
import {isWalkable,slideMove} from '../navigation.js';

test('continuous doorway route enters the gallery and returns without crossing showcases',()=>{
 let p={x:1,z:.43};
 for(let i=0;i<38;i++)p=slideMove(p,{x:.025,z:0});
 for(let i=0;i<43;i++)p=slideMove(p,{x:0,z:-.01});
 for(let i=0;i<120;i++)p=slideMove(p,{x:.025,z:0});
 assert.ok(p.x>4.9);
 for(let i=0;i<120;i++)p=slideMove(p,{x:-.025,z:0});
 for(let i=0;i<43;i++)p=slideMove(p,{x:0,z:.01});
 for(let i=0;i<38;i++)p=slideMove(p,{x:-.025,z:0});
 assert.ok(Math.abs(p.x-1)<1e-6);
 assert.equal(isWalkable(1.72,-.8),false);
 assert.equal(isWalkable(1.72,1.2),false);
 for(const [x,z] of [[2.8,1],[4.4,1],[2.75,-1.1],[4.4,-1],[5.86,.23]])assert.equal(isWalkable(x,z),false);
 assert.equal(isWalkable(6.6,0),false);
});

test('published gallery parses as real geometry with glass and an unobstructed doorway',async()=>{
 const raw=gunzipSync(fs.readFileSync(new URL('../assets/hall.glb.gz',import.meta.url)));
 const g=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
 g.scene.updateMatrixWorld(true);
 let meshes=0,glass=0,vertices=0;
 g.scene.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;if(o.material.transparent)glass++;const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));});
 assert.equal(meshes,43);assert.ok(glass>0);assert.ok(vertices>200000);
 const ray=new THREE.Raycaster(new THREE.Vector3(1.3,1.3,.23),new THREE.Vector3(1,0,0),0,.9);
 assert.equal(ray.intersectObject(g.scene,true).length,0);
 const bounds=new THREE.Box3().setFromObject(g.scene);
 assert.ok(bounds.max.x>6.5&&bounds.max.y>=2.5);
});

test('gallery threshold fills only the gap and the floor uses stable opaque shading',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>new Response(url.includes('clown-head')?fs.readFileSync(new URL('../assets/clown-head.json',import.meta.url)):url.includes('groyper_green')?texturelessFrog():fs.readFileSync(new URL('../assets/hall.glb.gz',import.meta.url)));
 try{
  const room=new THREE.Group();const hall=await addHall(room);room.updateMatrixWorld(true);
  const clown=hall.getObjectByName('Hall_Green');const head=JSON.parse(fs.readFileSync(new URL('../assets/clown-head.json',import.meta.url)));
  assert.deepEqual(Array.from(clown.geometry.getAttribute('position').array.slice(0,1392*3)),Array.from(new Float32Array(head.positions)));
  const bridge=hall.getObjectByName('Gallery threshold');const box=new THREE.Box3().setFromObject(bridge);
  assert.ok(box.min.x>=1.68-1e-7&&box.max.x<=1.70+1e-7);
  const pedestalTop=hall.getObjectByName('Hall_HallBase');
  const pedestalRay=new THREE.Raycaster(new THREE.Vector3(2.08,.25,1),new THREE.Vector3(0,-1,0),0,.03);
  const topHits=pedestalRay.intersectObject(pedestalTop);assert.ok(topHits.length>0);assert.ok(Math.abs(topHits[0].point.y-.2415)<1e-6);
  const floor=hall.getObjectByName('Hall_HallFloor');assert.equal(floor.material.side,THREE.FrontSide);assert.ok(floor.material.roughness>=.45);assert.equal(floor.material.transparent,false);
  const ray=new THREE.Raycaster(new THREE.Vector3(2,.1,0),new THREE.Vector3(0,-1,0),0,.2);
  const hits=ray.intersectObject(floor);assert.equal(hits.length,1);assert.ok(Math.abs(hits[0].point.y)<1e-6);
 }finally{globalThis.fetch=originalFetch;}
});

// Remove image decoding only: retain the supplied vertices, rig and bind pose.
function texturelessFrog(){
 const bytes=gunzipSync(fs.readFileSync(new URL('../assets/groyper_green.glb.gz',import.meta.url)));const len=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+len)),bin=bytes.subarray(28+len);
 doc.materials=doc.materials.map(m=>({name:m.name,doubleSided:m.doubleSided,pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:1}}));delete doc.images;delete doc.textures;delete doc.samplers;
 let js=Buffer.from(JSON.stringify(doc));js=Buffer.concat([js,Buffer.alloc((4-js.length%4)%4,32)]);const out=Buffer.alloc(28+js.length+bin.length);out.writeUInt32LE(0x46546c67);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(js.length,12);out.writeUInt32LE(0x4e4f534a,16);js.copy(out,20);out.writeUInt32LE(bin.length,20+js.length);out.writeUInt32LE(0x004e4942,24+js.length);bin.copy(out,28+js.length);return gzipSync(out);
}
test('uploaded frog fits entirely inside its glass case and stands on the pedestal',async()=>{
 const bytes=gunzipSync(texturelessFrog());const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const hall=new THREE.Group();const frog=placeGreenFrog(g.scene,hall);hall.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(frog,true);
 assert.ok(b.min.x>2.11&&b.max.x<3.61);assert.ok(b.min.z>.52&&b.max.z<1.46);assert.ok(Math.abs(b.min.y-.246)<1e-5&&b.max.y<1.64);
 assert.ok(frog.getObjectByName('GroyperBody').isSkinnedMesh);assert.equal(hall.children.filter(o=>o.name==='Green frog statue').length,1);
 console.log('Fitted frog bounds:',b.min.toArray(),b.max.toArray());
});
