import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../vendor/build/three.module.js';
import {registerItems,HandInteraction} from '../interactions.js';

// Use the actual GLB hierarchy, transforms and mesh bounds, without a GPU.
function fixture(){
 const bytes=fs.readFileSync(new URL('../assets/room.glb',import.meta.url));
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const nodes=doc.nodes.map(n=>{
  const o=new THREE.Group();o.name=THREE.PropertyBinding.sanitizeNodeName(n.name||'');o.userData.name=n.name||'';
  if(n.mesh!==undefined)for(const primitive of doc.meshes[n.mesh].primitives){
   const a=doc.accessors[primitive.attributes.POSITION];const min=new THREE.Vector3(...a.min),max=new THREE.Vector3(...a.max),size=max.clone().sub(min),center=max.clone().add(min).multiplyScalar(.5);
   const geo=new THREE.BoxGeometry(size.x,size.y,size.z);geo.translate(center.x,center.y,center.z);
   o.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x125b88})));
  }
  if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);if(n.matrix)o.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));
  return o;
 });
 doc.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));
 const room=new THREE.Group();doc.scenes[doc.scene||0].nodes.forEach(i=>room.add(nodes[i]));
 const scene=new THREE.Scene();scene.add(room);const camera=new THREE.PerspectiveCamera(55,1,.035,40);camera.position.set(-.72,1.3,1.03);scene.add(camera);scene.updateMatrixWorld(true);
 return {scene,room,camera,items:registerItems(room)};
}
test('loader-sanitized room names register keyboard, complete monitor and toys',()=>{
 const {items}=fixture();assert.ok(items.length>=17);
 assert.equal(items.filter(i=>i.userData.pickup.label==='Монитор').length,1);
 assert.equal(items.find(i=>i.userData.pickup.label==='Монитор').children.length,4);
 assert.ok(items.some(i=>i.userData.name==='Compact keyboard'));assert.ok(items.some(i=>i.userData.name?.startsWith('Shelf Teledog')));
 assert.ok(!items.some(i=>/Large seated|greeting|hologram/i.test(i.name)));
});
test('every item fits in hands, follows the camera, and returns without transform or material changes',()=>{
 const {scene,camera,items}=fixture();const interaction=new HandInteraction(scene,camera);
 for(const item of items){
  scene.updateMatrixWorld(true);const before=item.matrixWorld.clone(),parent=item.parent,original=[];item.traverse(o=>{if(o.isMesh)original.push([o,o.material,o.renderOrder]);});
  assert.equal(interaction.take(item),true);scene.updateMatrixWorld(true);
  const bound=new THREE.Box3().setFromObject(item);assert.ok(Math.max(...bound.getSize(new THREE.Vector3()).toArray())<=.441);
  const local=camera.worldToLocal(bound.getCenter(new THREE.Vector3()));assert.ok(local.distanceTo(interaction.rig.position)<1e-5);
  camera.position.x+=.1;scene.updateMatrixWorld(true);const next=camera.worldToLocal(new THREE.Box3().setFromObject(item).getCenter(new THREE.Vector3()));assert.ok(next.distanceTo(interaction.rig.position)<1e-5);
  interaction.release();scene.updateMatrixWorld(true);assert.ok(item.parent===parent);
  item.matrixWorld.elements.forEach((x,i)=>assert.ok(Math.abs(x-before.elements[i])<1e-5));
  for(const [o,m,order] of original){assert.ok(o.material===m);assert.equal(o.renderOrder,order);}assert.equal(interaction.rig.visible,false);
 }
});
test('a wall blocks pickup, transparent glass does not, and distant objects cannot be taken',()=>{
 const {scene,camera,items}=fixture();const h=new HandInteraction(scene,camera),item=items[0],mesh=item.children[0];
 const wall=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
 assert.equal(h.itemAt([{object:wall,distance:1},{object:mesh,distance:2}]),null);
 wall.material.transparent=true;wall.material.opacity=.2;assert.equal(h.itemAt([{object:wall,distance:1},{object:mesh,distance:2}]),item);
 assert.equal(h.itemAt([{object:mesh,distance:3}]),null);
 const parent=items[0].parent;h.take(items[0]);h.take(items[1]);assert.ok(items[0].parent===parent);h.release();
});
