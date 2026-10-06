import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../vendor/build/three.module.js';
import {repairSeatedDog} from '../seated-repair.js';

test('rebuilt seated torso removes the orphan sleeve and overlaps the waving sleeve for the entire animation',()=>{
 const raw=fs.readFileSync(new URL('../assets/room.glb',import.meta.url)),jsonLength=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+jsonLength)),binary=raw.subarray(28+jsonLength);
 function floats(i){const a=doc.accessors[i],v=doc.bufferViews[a.bufferView],width={VEC3:3,VEC4:4,SCALAR:1}[a.type];return new Float32Array(binary.buffer,binary.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*width).slice();}
 function object(name){const node=doc.nodes.find(n=>n.name===name);const primitive=doc.meshes[node.mesh]?.primitives[0];let o;
  if(primitive){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(floats(primitive.attributes.POSITION),3));const a=doc.accessors[primitive.indices],v=doc.bufferViews[a.bufferView],ctor=a.componentType===5125?Uint32Array:Uint16Array;geometry.setIndex(new THREE.BufferAttribute(new ctor(binary.buffer,binary.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count).slice(),1));o=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());}else o=new THREE.Group();
  o.name=THREE.PropertyBinding.sanitizeNodeName(name);o.userData.name=name;if(node.translation)o.position.fromArray(node.translation);if(node.scale)o.scale.fromArray(node.scale);if(node.rotation)o.quaternion.fromArray(node.rotation);return o;
 }
 const room=new THREE.Group(),seated=object('Large seated Teledog'),hoodie=object('Seated Counter mascot Display 1-1 Continuous hoodie'),arm=object('Teledog greeting arm'),sleeve=object('Raised blue upper sleeve');room.add(seated,arm);seated.add(hoodie);arm.add(sleeve);
 const repaired=repairSeatedDog(room);assert.ok(repaired);const p=hoodie.geometry.attributes.position,indices=hoodie.geometry.index.array;for(let i=0;i<indices.length;i+=3){const ids=Array.from(indices.slice(i,i+3));assert.ok(ids.every(j=>p.getY(j)>=2.4)||ids.every(j=>p.getX(j)>=.42));}
 const clip=doc.animations[0],sampler=clip.samplers[clip.channels[0].sampler],times=floats(sampler.input),track=new THREE.QuaternionKeyframeTrack(arm.uuid+'.quaternion',times,floats(sampler.output)),mixer=new THREE.AnimationMixer(room);mixer.clipAction(new THREE.AnimationClip('wave',-1,[track])).play();
 const v=new THREE.Vector3(),shoulder=repaired.shoulder;for(let frame=0;frame<81;frame++){mixer.setTime(times[times.length-1]*frame/80);room.updateMatrixWorld(true);let covered=0;const vertices=sleeve.geometry.attributes.position;for(let i=0;i<vertices.count;i++){v.fromBufferAttribute(vertices,i).applyMatrix4(sleeve.matrixWorld);shoulder.worldToLocal(v);if(v.length()<1)covered++;}assert.ok(covered>=6,'Sleeve must overlap shoulder throughout wave: '+frame);}
 assert.ok(repaired.body.geometry.attributes.position.count>1000);
});
