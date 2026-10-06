import * as THREE from './vendor/build/three.module.js';

function wordmark(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.font='600 132px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TELEDOG',512,96);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

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
 if(brand){const geometry=brand.geometry.clone();geometry.rotateX(Math.PI/2);geometry.computeBoundingBox();const width=geometry.boundingBox.getSize(new THREE.Vector3()).x;geometry.center();geometry.scale(.13/width,.13/width,.13/width);mesh(geometry,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),0,.260,.060,'TELEDOG dog head logo');}
 mesh(new THREE.BoxGeometry(.136,.073,.010),dark,0,.209,.058,'Mini screen bezel');
 const display=mesh(new THREE.PlaneGeometry(.126,.062),new THREE.MeshBasicMaterial({color:0x102b45}),0,.209,.064,'Speaker mini screen');display.userData.speakerScreen=true;
 const text=wordmark();if(text)mesh(new THREE.PlaneGeometry(.12,.0225),new THREE.MeshBasicMaterial({map:text,transparent:true,depthWrite:false}),0,.039,.059,'TELEDOG wordmark');
 mesh(new THREE.SphereGeometry(.002,10,6),cyan,.053,.026,.059,'Power indicator');
 // Reuse the room's original mascot texture, preserving its exact artwork.
 let characterMap;room.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(/TELEDOG transparent cutout/i.test(m.name)&&m.map)characterMap=m.map;}});
 if(characterMap){const decal=mesh(new THREE.PlaneGeometry(.117,.1755),new THREE.MeshBasicMaterial({map:characterMap,alphaTest:.03,side:THREE.DoubleSide}),0,.154,-.057,'TELEDOG rear mascot');decal.rotation.y=Math.PI;}
 const button=mesh(new THREE.CylinderGeometry(.009,.009,.003,16),blue,.039,.283,0,'Power button');
 room.add(speaker);return speaker;
}
