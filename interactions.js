import * as THREE from './vendor/build/three.module.js';

const sourceName=o=>o.userData.name||o.name.replaceAll('_',' ');

export function registerItems(room){
 const items=[];
 const add=(object,label)=>{object.userData.pickup={label};items.push(object);};
 const objects=[];room.traverse(o=>objects.push(o));
 for(const o of objects){
  const name=sourceName(o);
  if(name==='TELEDOG speaker')add(o,'Speaker');
  else if(name==='Compact keyboard')add(o,'Keyboard');
  else if(/^Shelf Teledog \d+ .*Character turntable/.test(name))add(o,'Toy');
  else if(/^Packaged shelf toy \d+ .*Character turntab/.test(name))add(o,'Toy');
  else if(name==='Counter mascot Display 1-1 Character turntable')add(o,'Toy');
 }
 const monitorParts=objects.filter(o=>/^Desktop monitor (foot|frame|stem)$/.test(sourceName(o))||sourceName(o)==='TELEDOG chart computer screen');
 if(monitorParts.length){
  const monitor=new THREE.Group();monitor.name='Interactive monitor';room.add(monitor);room.updateMatrixWorld(true);
  monitorParts.forEach(o=>monitor.attach(o));add(monitor,'Monitor');
 }
 return items;
}

export class HandInteraction{
 constructor(scene,camera,onChange=()=>{}){
  this.scene=scene;this.camera=camera;this.onChange=onChange;this.held=null;
  this.rig=new THREE.Group();this.rig.name='First person hands';this.rig.position.set(0,-.19,-.64);this.rig.visible=false;camera.add(this.rig);
  const glove=new THREE.MeshStandardMaterial({color:0xf4f6ff,roughness:.85,depthTest:true});
  const sleeve=new THREE.MeshStandardMaterial({color:0x125b88,roughness:.8,depthTest:true});
  this.hands=[];
  for(const side of [-1,1]){
   const hand=new THREE.Group();hand.position.set(side*.14,-.12,.02);hand.rotation.z=-side*.30;
   const palm=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),glove);palm.scale.set(.05,.055,.045);palm.renderOrder=1003;hand.add(palm);
   const arm=new THREE.Mesh(new THREE.CylinderGeometry(.039,.047,.20,16),sleeve);arm.position.set(0,-.13,.065);arm.rotation.x=-.55;arm.renderOrder=1002;hand.add(arm);
   const thumb=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),glove);thumb.scale.set(.025,.038,.028);thumb.position.set(-side*.034,.02,-.02);thumb.renderOrder=1003;hand.add(thumb);
   hand.traverse(o=>{if(o.isMesh)o.layers.set(1);});this.rig.add(hand);this.hands.push(hand);
  }
 }
 itemAt(hits,maxDistance=2.6){
  for(const hit of hits){
   if(hit.distance>maxDistance)return null;
   const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
   if(materials.every(m=>m?.transparent&&m.opacity<.4))continue;
   let o=hit.object;while(o){if(o.userData.pickup)return o;o=o.parent;}
   return null;
  }
  return null;
 }
 take(item){
  if(!item?.userData.pickup)return false;
  this.release();this.scene.updateMatrixWorld(true);
  const saved={item,parent:item.parent,position:item.position.clone(),quaternion:item.quaternion.clone(),scale:item.scale.clone(),materials:[],hidden:[]};
  const box=new THREE.Box3().setFromObject(item);const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const front=new THREE.Vector3(0,0,1);
  if(item.userData.pickup.label==='Toy'){
   let head=null;const eyes=[];item.traverse(o=>{const name=sourceName(o);
    if(/white head/i.test(name))head=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    if(/left eye|right eye/i.test(name))eyes.push(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));
   });
   if(head&&eyes.length){front.copy(eyes.reduce((sum,v)=>sum.add(v),new THREE.Vector3()).divideScalar(eyes.length).sub(head));front.y=0;front.normalize();}
  }
  const holder=new THREE.Group();this.scene.add(holder);holder.attach(item);this.rig.add(holder);
  if(item.userData.pickup.label==='Toy')holder.rotation.y=-Math.atan2(front.x,front.z);
  const max=Math.max(size.x,size.y,size.z,.001),factor=Math.min(1,(item.userData.pickup.label==='Monitor'?.44:.33)/max);
  holder.scale.setScalar(factor);holder.position.copy(center).multiplyScalar(-factor).applyQuaternion(holder.quaternion);
  this.scene.updateMatrixWorld(true);
  const alignedCenter=this.rig.worldToLocal(new THREE.Box3().setFromObject(item).getCenter(new THREE.Vector3()));holder.position.sub(alignedCenter);
  const width=size.x*factor;this.hands.forEach((h,i)=>h.position.x=(i===0?-1:1)*Math.max(.10,width*.40));
  item.traverse(o=>{if(!o.isMesh)return;saved.materials.push({o,material:o.material,order:o.renderOrder,layers:o.layers.mask});
   const clone=m=>{const c=m.clone();c.depthTest=true;return c;};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);o.renderOrder=1001;o.layers.set(1);
  });
  if(item.userData.pickup.label==='Monitor')this.scene.traverse(o=>{if(sourceName(o)==='Monitor connected cable'){saved.hidden.push({o,visible:o.visible});o.visible=false;}});
  saved.holder=holder;this.held=saved;this.rig.visible=true;this.onChange(item.userData.pickup.label);return true;
 }
 release(){
  if(!this.held)return;
  const h=this.held;h.parent.add(h.item);h.item.position.copy(h.position);h.item.quaternion.copy(h.quaternion);h.item.scale.copy(h.scale);
  for(const {o,material,order,layers} of h.materials){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();o.material=material;o.renderOrder=order;o.layers.mask=layers;}
  h.hidden.forEach(({o,visible})=>o.visible=visible);h.holder.removeFromParent();this.held=null;this.rig.visible=false;this.onChange(null);
 }
 render(renderer){
  if(!this.held)return;
  const background=this.scene.background,mask=this.camera.layers.mask,autoClear=renderer.autoClear;
  try{
   this.scene.background=null;this.camera.layers.set(1);renderer.autoClear=false;
   renderer.clearDepth();renderer.render(this.scene,this.camera);
  }finally{this.scene.background=background;this.camera.layers.mask=mask;renderer.autoClear=autoClear;}
 }
 update(dt,moving){
  this.phase=(this.phase||0)+dt*(moving?8:2);const bob=moving?.008:.002;
  this.rig.position.y=-.19+Math.sin(this.phase)*bob;
 }
}
