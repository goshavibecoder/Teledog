import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/build/three.module.js';
import {CHARACTERS,registerGalleryStories,galleryCharacterAt,createStorySheet,GalleryStories} from '../gallery-stories.js';
import {HandInteraction} from '../interactions.js';

test('FAST mesh groups and the replacement frog resolve to the correct character',()=>{
 const hall=new THREE.Group();for(let i=0;i<43;i++)hall.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()));
 const frog=new THREE.Group();frog.name='Green frog statue';const body=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());frog.add(body);hall.add(frog);registerGalleryStories(hall);
 assert.equal(galleryCharacterAt([{object:hall.children[20],distance:2}]),CHARACTERS.fast);
 assert.equal(galleryCharacterAt([{object:hall.children[26],distance:2}]),CHARACTERS.fast);
 assert.equal(galleryCharacterAt([{object:body,distance:2}]),CHARACTERS.groyper);
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial({transparent:true,opacity:.23}));
 assert.equal(galleryCharacterAt([{object:glass,distance:1},{object:hall.children[20],distance:2}]),CHARACTERS.fast);
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial());
 assert.equal(galleryCharacterAt([{object:wall,distance:1},{object:hall.children[20],distance:2}]),null);
 hall.visible=false;assert.equal(galleryCharacterAt([{object:hall.children[20],distance:2}]),null);
 hall.visible=true;assert.equal(galleryCharacterAt([{object:hall.children[20],distance:4}]),null);
});
function fakeCanvas(){
 const lines=[],images=[];const context={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(text,x,y){lines.push({text,x,y});},drawImage(...args){images.push(args);},measureText(text){return {width:text.length*22};}};
 return {getContext:()=>context,lines,images};
}
test('the physical FAST page preserves every word, includes the image and fits portrait and landscape screens',async()=>{
 const canvas=fakeCanvas();const paper=await createStorySheet(CHARACTERS.fast,{canvasFactory:()=>canvas,imageLoader:async()=>({width:1440,height:1440})});
 assert.equal(paper.userData.storyText,CHARACTERS.fast.paragraphs.join(' '));assert.equal(canvas.images.length,1);
 const body=canvas.lines.filter(line=>line.y>=895&&line.y<1840);assert.equal(body.map(line=>line.text).join(' '),CHARACTERS.fast.paragraphs.join(' '));assert.ok(body.every(line=>line.y<1800));
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,.56,.035,40);scene.add(camera);const storage=new THREE.Group();storage.visible=false;scene.add(storage);storage.add(paper);
 const hands=new HandInteraction(scene,camera);
 for(const aspect of [.56,1.8]){
  camera.aspect=aspect;assert.equal(hands.take(paper),true);scene.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(paper).getSize(new THREE.Vector3()),viewHeight=2*.64*Math.tan(THREE.MathUtils.degToRad(55/2));
  assert.ok(size.x<=viewHeight*aspect*.901);assert.ok(size.y<=viewHeight*.821);
  hands.release();assert.equal(paper.parent,storage);assert.equal(hands.rig.visible,false);
 }
});
test('an interrupted or superseded sheet load cannot put an unwanted page in the hands',async()=>{
 const scene=new THREE.Scene(),taken=[];let resolve;
 const stories=new GalleryStories(scene,{take:p=>{taken.push(p);return true;}},{sheetFactory:()=>new Promise(r=>resolve=r)});
 const opening=stories.open(CHARACTERS.fast);stories.cancel();const paper=new THREE.Group();resolve(paper);assert.equal(await opening,false);assert.equal(taken.length,0);
 assert.equal(await stories.open(CHARACTERS.fast),true);assert.deepEqual(taken,[paper]);
});
