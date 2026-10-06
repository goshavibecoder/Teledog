import * as THREE from './vendor/build/three.module.js';

export function createSpeakerNotes(speaker,{random=Math.random,maxNotes=18}={}){
 let root=speaker;while(root.parent)root=root.parent;
 const group=new THREE.Group();group.name='Floating TELEDOG music notes';root.add(group);
 const headGeometry=new THREE.SphereGeometry(.010,12,8),stemGeometry=new THREE.CylinderGeometry(.0018,.0018,.047,8);
 const flag=new THREE.Shape();flag.moveTo(.008,.046);flag.bezierCurveTo(.025,.042,.029,.030,.017,.025);flag.bezierCurveTo(.021,.035,.015,.037,.008,.038);flag.closePath();
 const flagGeometry=new THREE.ExtrudeGeometry(flag,{depth:.004,bevelEnabled:true,bevelSegments:2,bevelSize:.001,bevelThickness:.001,curveSegments:8});flagGeometry.translate(0,0,-.002);
 const beamGeometry=new THREE.BoxGeometry(.027,.006,.004);
 const notes=[];let spawnTime=0;
 const spawnPoint=new THREE.Vector3();
 function addNote(){
  if(notes.length>=maxNotes)return;
  speaker.updateWorldMatrix(true,false);spawnPoint.set((random()-.5)*.09,.30,(random()-.5)*.06);speaker.localToWorld(spawnPoint);group.worldToLocal(spawnPoint);
  const material=new THREE.MeshStandardMaterial({color:random()<.5?0x55caff:0x4685ff,metalness:.3,roughness:.3,emissive:0x1766bf,emissiveIntensity:.7,transparent:true,opacity:1,depthWrite:false});
  const note=new THREE.Group();note.name='Volumetric music note';note.position.copy(spawnPoint);note.rotation.set((random()-.5)*.6,random()*Math.PI*2,(random()-.5)*.5);
  function part(geometry,x,y,z=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.raycast=()=>{};note.add(mesh);return mesh;}
  const head=part(headGeometry,0,0);head.scale.set(1.25,.65,.65);head.rotation.z=.3;part(stemGeometry,.009,.025);
  if(random()<.5)part(flagGeometry,0,0);
  else {const second=part(headGeometry,.027,.006);second.scale.copy(head.scale);second.rotation.z=.3;part(stemGeometry,.036,.031);part(beamGeometry,.0225,.050);}
  group.add(note);
  const angle=random()*Math.PI*2,speed=.055+random()*.11;
  notes.push({object:note,material,age:0,life:1.9+random()*.9,velocity:new THREE.Vector3(Math.cos(angle)*speed,.18+random()*.13,Math.sin(angle)*speed),spin:(random()-.5)*1.7,size:.8+random()*.45});
 }
 function update(dt,playing){
  // Bound elapsed time when returning from a background tab.
  dt=Math.min(Math.max(dt,0),.1);
  for(let i=notes.length-1;i>=0;i--){const n=notes[i];n.age+=dt;if(n.age>=n.life){n.object.removeFromParent();n.material.dispose();notes.splice(i,1);continue;}
   n.object.position.addScaledVector(n.velocity,dt);n.object.rotation.y+=n.spin*dt;n.object.rotation.z+=n.spin*.22*dt;
   const fadeIn=Math.min(1,n.age/.12),fadeOut=Math.min(1,(n.life-n.age)/.55);n.material.opacity=fadeIn*fadeOut;n.object.scale.setScalar(n.size*(.7+.3*fadeIn));
  }
  if(playing){spawnTime-=dt;if(spawnTime<=0){addNote();spawnTime=.22+random()*.15;}}else spawnTime=0;
 }
 return {group,update};
}
