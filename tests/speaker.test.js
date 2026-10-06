import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/build/three.module.js';
import {addSpeaker} from '../speaker.js';
import {registerItems,HandInteraction} from '../interactions.js';

test('branded speaker sits fully on the desk and can be picked up and returned',()=>{
 const scene=new THREE.Scene(),room=new THREE.Group(),camera=new THREE.PerspectiveCamera();scene.add(room,camera);
 const mascot=new THREE.Texture();const original=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({map:mascot}));original.material.name='TELEDOG transparent cutout';room.add(original);
 const brand=new THREE.Mesh(new THREE.BoxGeometry(4, .01, 1),new THREE.MeshBasicMaterial());brand.name='Approved white fa';room.add(brand);
 const speaker=addSpeaker(room);scene.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(speaker);assert.ok(bounds.min.y>=.9299);assert.ok(bounds.min.x>.595&&bounds.max.x<1.565);assert.ok(bounds.min.z>.64&&bounds.max.z<1.24);
 // The speaker stays in front of the PC and to the left of the keyboard.
 assert.ok(bounds.min.z>1.0416);assert.ok(bounds.max.x<1.165);
 assert.equal(speaker.getObjectByName('TELEDOG rear mascot').material.map,mascot);assert.ok(speaker.getObjectByName('TELEDOG dog head logo'));
 const items=registerItems(room);assert.ok(items.includes(speaker));assert.equal(speaker.userData.pickup.label,'Speaker');
 const before=speaker.matrixWorld.clone();const hands=new HandInteraction(scene,camera);assert.equal(hands.take(speaker),true);scene.updateMatrixWorld(true);
 assert.ok(Math.max(...new THREE.Box3().setFromObject(speaker).getSize(new THREE.Vector3()).toArray())<=.331);
 hands.release();scene.updateMatrixWorld(true);assert.equal(speaker.parent,room);speaker.matrixWorld.elements.forEach((v,i)=>assert.ok(Math.abs(v-before.elements[i])<1e-6));
});

test('all six raised physical controls can be hit independently from above',()=>{
 const room=new THREE.Group();const speaker=addSpeaker(room);room.updateMatrixWorld(true);
 const buttons=speaker.children.filter(o=>o.userData.speakerAction);assert.equal(buttons.length,6);
 assert.deepEqual(new Set(buttons.map(o=>o.userData.speakerAction)),new Set(['power','previous','next','quieter','toggle','louder']));
 for(const button of buttons){const center=button.getWorldPosition(new THREE.Vector3());const ray=new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,.1,0)),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(speaker,true)[0];assert.ok(hit);let control=hit.object;while(control&&!control.userData.speakerAction)control=control.parent;assert.equal(control,button);assert.ok(hit.point.y>speaker.position.y+.281);}
});
