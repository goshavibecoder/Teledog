import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {logoLink,movement,slideMove} from './navigation.js?v=hall23';
import {addHall} from './hall.js?v=hall31';
import {addXLogo} from './x-logo.js';
import {repairSeatedDog} from './seated-repair.js?v=repair16';
import {createRoomSounds} from './room-sounds.js?v=repair16';
import {addSpeaker} from './speaker.js?v=repair16';
import {createSpeakerPlayer} from './speaker-player.js?v=repair16';
import {fixRoomVisuals} from './visual-fixes.js?v=repair16';
import {registerItems,HandInteraction} from './interactions.js?v=stories32';
import {registerGalleryStories,galleryCharacterAt,GalleryStories} from './gallery-stories.js?v=stories39';
const $=s=>document.querySelector(s),host=$('#scene'),enter=$('#enter'),progress=$('#progress'),status=$('#load-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){showError('3D is unavailable. Open the site in Safari or Chrome.');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#081829');scene.fog=new THREE.Fog('#081829',14,30);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.035,40);camera.position.set(4.5,3.4,6.0);
scene.add(camera);
const sounds=createRoomSounds();let lastHeldLabel=null;
window.addEventListener('pointerdown',()=>sounds.unlock(),{capture:true});window.addEventListener('keydown',()=>sounds.unlock(),{capture:true});
const hands=new HandInteraction(scene,camera,label=>{sounds.play(label?'pickup':'putback',label||lastHeldLabel);lastHeldLabel=label;$('#put-back').hidden=!label;$('#put-back').textContent=label==='Paper'?'Put away':'Put back';$('#put-back').setAttribute('aria-label',label?'Put '+label+' back':'Put back');});
const stories=new GalleryStories(scene,hands,{onError:()=>toast('The character sheet could not load. Tap the character to try again.')});
function showError(message){$('#loading-dot').hidden=true;$('#error-panel').hidden=false;$('#error-text').textContent=message;$('#retry').onclick=()=>location.reload();}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.20,.98,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2.3;controls.maxDistance=9;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=false;controls.update();
const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xc7eaff,0x28415a,2));const sun=new THREE.DirectionalLight(0xffffff,3.0);sun.position.set(2,5,4);scene.add(sun);const fill=new THREE.DirectionalLight(0x86cfff,1.2);fill.position.set(-3,2,-1);scene.add(fill);scene.traverse(o=>{if(o.isLight)o.layers.enable(1);});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x081829,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.091;scene.add(ground);
let speakerPlayer;
let room,mixer,walk=false,entered=false,yaw=0,pitch=0,waveActions=[],pendingPointer=null,stickVector={forward:0,right:0},moveButton=null;
const clock=new THREE.Clock(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),keys=new Set();
raycaster.layers.enable(1);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3300);}
function loadRoom(onLoad,onProgress,onError){
 let loaded=0;
 Promise.all(['./assets/room.glb.part1','./assets/room.glb.part2'].map(async url=>{
  const response=await fetch(url);if(!response.ok)throw new Error(`Room asset: ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());loaded+=bytes.length;onProgress({loaded,total:15099676});return bytes;
 })).then(parts=>{
  const bytes=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  new GLTFLoader().parse(bytes.buffer,'./assets/',onLoad,onError);
 }).catch(onError);
}
loadRoom(async g=>{
 room=g.scene;scene.add(room);repairSeatedDog(room);addXLogo(room);const speaker=addSpeaker(room);speakerPlayer=createSpeakerPlayer(speaker,{onPickup:()=>{if(!walk)setWalk();hands.take(speaker);}});mixer=new THREE.AnimationMixer(room);
 for(const clip of g.animations){const action=mixer.clipAction(clip);if(/greeting|greet|arm/i.test(clip.name))waveActions.push(action);if(!reduced)action.play();}
 fixRoomVisuals(room);
 registerItems(room);
 try{const gallery=await addHall(room);registerGalleryStories(gallery);gallery.visible=walk;}catch(e){console.error('Gallery loading failed',e);toast('The gallery could not load. Reload to try again.');}
 entered=true;document.body.classList.add('entered');overview();$('#mode-switch').disabled=false;$('#loading-dot').hidden=true;
 window.teledog={room,mixer,camera,controls,setWalk,logoLink,hands};
},e=>{if(e.total){progress.textContent=Math.min(99,Math.round(e.loaded/e.total*100))+'%';}},e=>{console.error('Room loading failed',e);showError('The room could not load. Please try again.');});
function overview(){stories.cancel();if(room)room.children.filter(o=>o.userData.gallery).forEach(o=>o.visible=false);hands.release();walk=false;camera.fov=38;camera.updateProjectionMatrix();$('#mode-switch').textContent='First person';$('#mode-switch').setAttribute('aria-pressed','false');$('#crosshair').hidden=true;controls.enabled=true;camera.position.set(4.5,3.4,6.0);controls.target.set(-.2,.98,0);controls.update();$('#joystick').hidden=true;$('#move-buttons').hidden=true;$('#overview').classList.add('active');$('#walk').classList.remove('active');$('#mode-label').textContent='3D SHOWROOM';keys.clear();stickVector={forward:0,right:0};}
function setWalk(){if(!room)return;room.children.filter(o=>o.userData.gallery).forEach(o=>o.visible=true);walk=true;camera.fov=55;camera.updateProjectionMatrix();$('#mode-switch').textContent='Overview';$('#mode-switch').setAttribute('aria-pressed','true');$('#crosshair').hidden=false;controls.enabled=false;camera.position.set(-.72,1.30,1.03);const target=new THREE.Vector3(.64,1.18,-.87).sub(camera.position);yaw=Math.atan2(-target.x,-target.z);pitch=Math.atan2(target.y,Math.hypot(target.x,target.z));camera.rotation.set(pitch,yaw,0,'YXZ');$('#joystick').hidden=false;$('#move-buttons').hidden=false;$('#overview').classList.remove('active');$('#walk').classList.add('active');$('#mode-label').textContent='WALK AROUND';}
enter.onclick=()=>{if(!room)return;entered=true;document.body.classList.add('entered');$('#toolbar').hidden=false;overview();if(reduced)waveActions.forEach(a=>a.reset().setLoop(THREE.LoopOnce,1).play());toast('Welcome! Tap the logos on the wall.');};
$('#overview').onclick=overview;$('#walk').onclick=setWalk;$('#wave').onclick=()=>{waveActions.forEach(a=>{a.setLoop(reduced?THREE.LoopOnce:THREE.LoopRepeat,reduced?1:Infinity);a.reset().play();});toast('Hello from Teledog 👋');};
$('#help-toggle').onclick=()=>{const help=$('#instructions');help.hidden=!help.hidden;$('#help-toggle').setAttribute('aria-expanded',String(!help.hidden));};
$('#mode-switch').onclick=()=>walk?overview():setWalk();
$('#put-back').onclick=()=>{stories.cancel();hands.release();};
function targetAt(x,y){
 if(!room)return null;pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
 const roomHits=raycaster.intersectObject(room,true);
 if(walk){const character=galleryCharacterAt(roomHits);if(character)return {character};}
 const heldHits=hands.held?raycaster.intersectObject(hands.rig,true):[];
 const hits=heldHits.length?heldHits:roomHits;
 for(const hit of hits){
  const mats=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
  if(mats.every(m=>m?.transparent&&m.opacity<.4))continue;
  let o=hit.object;while(o){if(o.userData.speakerAction)return {speakerAction:o.userData.speakerAction,button:o};if(o.name==='TELEDOG speaker')return {speakerAction:'pickup'};const url=logoLink(o.name);if(url)return {url};o=o.parent;}
  break;
 }
 const item=walk?hands.itemAt(hits):null;return item?{item}:null;
}
renderer.domElement.addEventListener('pointerdown',e=>{pendingPointer={target:walk?targetAt(e.clientX,e.clientY):null,id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(walk)renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(pendingPointer&&pendingPointer.id===e.pointerId){const p=pendingPointer;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>14)p.moved=true;if(walk){yaw-=(e.clientX-p.lastX)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-p.lastY)*.004,-1.12,1.12);camera.rotation.set(pitch,yaw,0,'YXZ');}p.lastX=e.clientX;p.lastY=e.clientY;}else if(e.pointerType==='mouse'){renderer.domElement.style.cursor=targetAt(e.clientX,e.clientY)?'pointer':walk?'grab':'default';}});
renderer.domElement.addEventListener('pointerup',e=>{if(pendingPointer&&pendingPointer.id===e.pointerId&&!pendingPointer.moved){const target=pendingPointer.target||targetAt(e.clientX,e.clientY);if(target?.speakerAction)speakerPlayer.act(target.speakerAction,target.button);else if(target?.url)window.open(target.url,'_blank','noopener,noreferrer');else if(target?.character)stories.open(target.character);else if(target?.item)hands.take(target.item);}pendingPointer=null;});renderer.domElement.addEventListener('pointercancel',()=>pendingPointer=null);
const joy=$('#joystick'),stick=$('#stick');let joyId=null;
function updateStick(e){const b=joy.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,length=Math.max(1,Math.hypot(dx,dy)/35),x=dx/length,y=dy/length;stick.style.transform=`translate(${x}px,${y}px)`;stickVector={forward:-y/35,right:x/35};}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);updateStick(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)updateStick(e);});function resetStick(){joyId=null;stickVector={forward:0,right:0};stick.style.transform='';}joy.addEventListener('pointerup',resetStick);joy.addEventListener('pointercancel',resetStick);
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{moveButton=b.dataset.move;b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',()=>moveButton=null);b.addEventListener('pointercancel',()=>moveButton=null);}
window.addEventListener('keydown',e=>{if(walk&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyE'&&walk){if(hands.held)hands.release();else {const t=targetAt(innerWidth/2,innerHeight/2);if(t?.character)stories.open(t.character);else if(t?.item)hands.take(t.item);}}if(e.code==='Escape')overview();});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();resetStick();moveButton=null;pendingPointer=null;});document.addEventListener('visibilitychange',()=>clock.getDelta());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(hands.held?.item.userData.pickup.label==='Paper')hands.take(hands.held.item);});
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;if(mixer)mixer.update(dt);if(speakerPlayer)speakerPlayer.update(dt);if(walk){const forward=stickVector.forward+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(moveButton==='forward'?1:0)-(moveButton==='back'?1:0),right=stickVector.right+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+(moveButton==='right'?1:0)-(moveButton==='left'?1:0);const p=slideMove(camera.position,movement(yaw,forward,right,dt));const travelled=Math.hypot(p.x-camera.position.x,p.z-camera.position.z);camera.position.x=p.x;camera.position.z=p.z;hands.update(dt,travelled>.0001);}else controls.update();renderer.render(scene,camera);hands.render(renderer);});
