import * as THREE from './vendor/build/three.module.js';

export function addSpeaker(room){
 const speaker=new THREE.Group();speaker.name='TELEDOG speaker';speaker.position.set(1.065,.930,1.145);speaker.rotation.y=-.25;
 const navy=new THREE.MeshStandardMaterial({color:0x09204b,roughness:.48,metalness:.18});
 const dark=new THREE.MeshStandardMaterial({color:0x080e19,roughness:.88});
 const blue=new THREE.MeshStandardMaterial({color:0x236dea,metalness:.35,roughness:.36});
 const cyan=new THREE.MeshStandardMaterial({color:0x4caeff,emissive:0x147de0,emissiveIntensity:.7,roughness:.4});
 const white=new THREE.MeshBasicMaterial({color:0xffffff});
 function mesh(geometry,material,x,y,z,name){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;speaker.add(m);return m;}
 const shape=new THREE.Shape(),w=.15,h=.27,r=.018;
 shape.moveTo(-w/2+r,0);shape.lineTo(w/2-r,0);shape.quadraticCurveTo(w/2,0,w/2,r);shape.lineTo(w/2,h-r);shape.quadraticCurveTo(w/2,h,w/2-r,h);shape.lineTo(-w/2+r,h);shape.quadraticCurveTo(-w/2,h,-w/2,h-r);shape.lineTo(-w/2,r);shape.quadraticCurveTo(-w/2,0,-w/2+r,0);
 const body=new THREE.ExtrudeGeometry(shape,{depth:.105,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.003,bevelThickness:.003,curveSegments:8});body.translate(0,.008,-.0525);mesh(body,navy,0,0,0,'Rounded speaker cabinet');
 for(const x of [-.047,.047])for(const z of [-.034,.034])mesh(new THREE.CylinderGeometry(.012,.014,.008,12),dark,x,.004,z,'Rubber foot');
 for(const [radius,y] of [[.049,.117]]){
  mesh(new THREE.CircleGeometry(radius,48),dark,0,y,.058,'Recessed driver');
  mesh(new THREE.TorusGeometry(radius,.0028,8,48),blue,0,y,.060,'Driver surround');
  const cone=mesh(new THREE.SphereGeometry(radius*.72,24,12),dark,0,y,.059,'Convex driver cone');cone.scale.z=.17;
  mesh(new THREE.TorusGeometry(radius*.76,.001,6,48),cyan,0,y,.066,'Blue driver light');
 }
 // Small physical perforations make the grille read as a 3D mesh from close up.
 const dotGeometry=new THREE.SphereGeometry(.00085,5,4);const points=[];
 for(let y=-.044;y<=.044;y+=.006)for(let x=-.044;x<=.044;x+=.006)if(x*x+y*y<.044*.044)points.push([x,.117+y,.071]);
 const grille=new THREE.InstancedMesh(dotGeometry,blue,points.length);grille.name='Perforated speaker grille';const matrix=new THREE.Matrix4();points.forEach((p,i)=>{matrix.makeTranslation(...p);grille.setMatrixAt(i,matrix);});grille.instanceMatrix.needsUpdate=true;speaker.add(grille);
 // Copy the original white brand mark from the retail packaging.
 let brand;room.traverse(o=>{if(!brand&&o.isMesh&&/Approved white fa/.test(o.userData.name||o.name.replaceAll('_',' ')))brand=o;});
 if(brand){const geometry=brand.geometry.clone();geometry.rotateX(Math.PI/2);geometry.computeBoundingBox();const width=geometry.boundingBox.getSize(new THREE.Vector3()).x;geometry.center();geometry.scale(.13/width,.13/width,.13/width);mesh(geometry,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),0,.037,.060,'TELEDOG dog head logo');}
 mesh(new THREE.BoxGeometry(.136,.087,.010),dark,0,.222,.058,'Mini screen bezel');
 const display=mesh(new THREE.PlaneGeometry(.126,.078),new THREE.MeshBasicMaterial({color:0x102b45}),0,.222,.064,'Speaker mini screen');display.userData.speakerScreen=true;

 mesh(new THREE.SphereGeometry(.002,10,6),cyan,.053,.026,.059,'Power indicator');
 // Reuse the room's original mascot texture, preserving its exact artwork.
 let characterMap;room.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(/TELEDOG transparent cutout/i.test(m.name)&&m.map)characterMap=m.map;}});
 if(characterMap){const decal=mesh(new THREE.PlaneGeometry(.117,.1755),new THREE.MeshBasicMaterial({map:characterMap,alphaTest:.03,side:THREE.DoubleSide}),0,.154,-.057,'TELEDOG rear mascot');decal.rotation.y=Math.PI;}
 // Raised rubber controls with solid 3D symbols on the top panel.
 const rubber=new THREE.MeshStandardMaterial({color:0x172635,roughness:.95});
 const controls=[['power',-.043,-.023],['previous',0,-.023],['next',.043,-.023],['quieter',-.043,.023],['toggle',0,.023],['louder',.043,.023]];
 for(const [action,x,z] of controls){
  const button=new THREE.Group();button.name='Speaker '+action+' button';button.position.set(x,.283,z);button.userData.speakerAction=action;speaker.add(button);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.014,.015,.006,24),rubber);button.add(cap);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.015,.0012,6,24),blue);rim.rotation.x=-Math.PI/2;rim.position.y=-.002;button.add(rim);
  function bar(x,z,w,d){const mark=new THREE.Mesh(new THREE.BoxGeometry(w,.0007,d),white);mark.position.set(x,.0037,z);button.add(mark);}
  function triangle(cx,reverse=false){const shape=new THREE.Shape();const sign=reverse?-1:1;shape.moveTo(cx-sign*.003,-.005);shape.lineTo(cx+sign*.004,0);shape.lineTo(cx-sign*.003,.005);shape.closePath();const mark=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.0006,bevelEnabled:false}),white);mark.rotation.x=-Math.PI/2;mark.position.y=.0032;button.add(mark);}
  if(action==='power'){const arc=new THREE.Mesh(new THREE.TorusGeometry(.006,.0008,6,28,Math.PI*1.6),white);arc.rotation.set(-Math.PI/2,0,Math.PI*.7);arc.position.y=.0037;button.add(arc);bar(0,-.004,.0014,.008);}
  else if(action==='toggle'){triangle(-.003);bar(.004,-.001,.0013,.008);bar(.007,-.001,.0013,.008);}
  else if(action==='previous'||action==='next'){triangle(0,action==='previous');bar(action==='previous'?-.006:.006,0,.0013,.010);}
  else {bar(0,0,.012,.0018);if(action==='louder')bar(0,0,.0018,.012);}
 }
 room.add(speaker);return speaker;
}
