import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/build/three.module.js';
import {createSpeakerNotes} from '../speaker-notes.js';

test('volumetric notes launch above the speaker, rise and spread, then expire after pause',()=>{
 const scene=new THREE.Scene(),speaker=new THREE.Group();speaker.position.set(1,.9,1);scene.add(speaker);
 let seed=4;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const effect=createSpeakerNotes(speaker,{random,maxNotes:12});effect.update(.05,false);assert.equal(effect.group.children.length,0);
 effect.update(.05,true);const first=effect.group.children[0],origin=first.position.clone();assert.ok(origin.y>=1.199);for(const part of first.children){part.geometry.computeBoundingBox();assert.ok(part.geometry.boundingBox.getSize(new THREE.Vector3()).z>.003);}
 for(let i=0;i<18;i++)effect.update(.05,true);assert.ok(first.position.y>origin.y+.1);assert.ok(Math.hypot(first.position.x-origin.x,first.position.z-origin.z)>.02);
 const notes=effect.group.children;assert.ok(notes.length>1);assert.ok(new Set(notes.map(n=>n.children.length)).size>1);assert.ok(notes.length<=12);
 const ray=new THREE.Raycaster(new THREE.Vector3(1,2,1),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObject(effect.group,true).length,0);
 for(let i=0;i<65;i++)effect.update(.05,false);assert.equal(effect.group.children.length,0);
 // Held speaker moves with the camera; new notes originate at its current world position.
 const camera=new THREE.PerspectiveCamera();scene.add(camera);camera.position.set(-2,1.3,0);camera.add(speaker);speaker.position.set(0,-.2,-.6);effect.update(.05,true);scene.updateMatrixWorld(true);
 const expected=speaker.localToWorld(new THREE.Vector3(0,.3,0));const actual=effect.group.children[0].position;assert.ok(actual.distanceTo(expected)<.06);
});
