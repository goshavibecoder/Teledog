import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from '../vendor/build/three.module.js';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='three')return {url:new URL('../vendor/build/three.module.js',import.meta.url).href,shortCircuit:true};return next(specifier,context);}});
const {GLTFLoader}=await import('../vendor/examples/jsm/loaders/GLTFLoader.js');
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
 assert.equal(meshes,50);assert.ok(glass>0);assert.ok(vertices>300000);
 const ray=new THREE.Raycaster(new THREE.Vector3(1.3,1.3,.23),new THREE.Vector3(1,0,0),0,.9);
 assert.equal(ray.intersectObject(g.scene,true).length,0);
 const bounds=new THREE.Box3().setFromObject(g.scene);
 assert.ok(bounds.max.x>6.5&&bounds.max.y>=2.5);
});
