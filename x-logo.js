import * as THREE from 'three';
export function addXLogo(room){
 const group=new THREE.Group();group.name='X social logo';
 group.position.set(-1.55,1.95,.53);group.rotation.y=Math.PI/2;
 const disk=new THREE.Mesh(new THREE.CircleGeometry(.18,48),new THREE.MeshStandardMaterial({color:0x080b10,roughness:.65}));group.add(disk);
 const shape=new THREE.Shape();
 const outline=[[18.901,1.153],[22.581,1.153],[14.541,10.343],[24,22.846],[16.594,22.846],[10.794,15.262],[4.154,22.846],[.474,22.846],[9.074,13.011],[0,1.154],[7.594,1.154],[12.837,8.086]];
 outline.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo']((x-12)*.0105,(12-y)*.0105));shape.closePath();
 const hole=new THREE.Path();[[17.886,20.644],[19.925,20.644],[6.486,3.24],[4.298,3.24]].forEach(([x,y],i)=>hole[i?'lineTo':'moveTo']((x-12)*.0105,(12-y)*.0105));hole.closePath();shape.holes.push(hole);
 const mark=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0xffffff}));mark.position.z=.002;group.add(mark);
 room.add(group);return group;
}
