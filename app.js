import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {logoLink,movement,slideMove} from './navigation.js';
const $=s=>document.querySelector(s),host=$('#scene'),enter=$('#enter'),progress=$('#progress'),status=$('#load-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){status.textContent='3D недоступен. Попробуй открыть сайт в Safari или Chrome.';enter.textContent='Обновить страницу';enter.disabled=false;enter.onclick=()=>location.reload();throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#081829');scene.fog=new THREE.Fog('#081829',14,30);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.035,40);camera.position.set(4.5,3.4,6.0);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.20,.98,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2.3;controls.maxDistance=9;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=false;controls.update();
const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xc7eaff,0x28415a,2));const sun=new THREE.DirectionalLight(0xffffff,3.0);sun.position.set(2,5,4);scene.add(sun);const fill=new THREE.DirectionalLight(0x86cfff,1.2);fill.position.set(-3,2,-1);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x081829,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.091;scene.add(ground);
let room,mixer,walk=false,entered=false,yaw=0,pitch=0,waveActions=[],pendingPointer=null,stickVector={forward:0,right:0},moveButton=null;
const clock=new THREE.Clock(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),keys=new Set();
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
loadRoom(g=>{
 room=g.scene;scene.add(room);mixer=new THREE.AnimationMixer(room);
 for(const clip of g.animations){const action=mixer.clipAction(clip);if(/greeting|greet|arm/i.test(clip.name))waveActions.push(action);if(!reduced)action.play();}
 room.traverse(o=>{if(o.isMesh){o.frustumCulled=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.name.startsWith('Hologram')){m.transparent=true;m.depthWrite=false;}if(/glass|display window/i.test(m.name)){m.transparent=true;m.depthWrite=false;}}}});
 entered=true;document.body.classList.add('entered');overview();
 window.teledog={room,mixer,camera,controls,setWalk,logoLink};
},e=>{if(e.total){progress.textContent=Math.min(99,Math.round(e.loaded/e.total*100))+'%';}},e=>{console.error('Room loading failed',e);status.textContent='Комната не загрузилась. Проверь соединение и попробуй ещё раз.';enter.textContent='Повторить загрузку';enter.disabled=false;enter.onclick=()=>location.reload();});
function overview(){walk=false;controls.enabled=true;camera.position.set(4.5,3.4,6.0);controls.target.set(-.2,.98,0);controls.update();$('#joystick').hidden=true;$('#move-buttons').hidden=true;$('#overview').classList.add('active');$('#walk').classList.remove('active');$('#mode-label').textContent='3D SHOWROOM';keys.clear();stickVector={forward:0,right:0};}
function setWalk(){walk=true;controls.enabled=false;camera.position.set(-.72,1.30,1.03);const target=new THREE.Vector3(.64,1.18,-.87).sub(camera.position);yaw=Math.atan2(-target.x,-target.z);pitch=Math.atan2(target.y,Math.hypot(target.x,target.z));camera.rotation.set(pitch,yaw,0,'YXZ');$('#joystick').hidden=false;$('#move-buttons').hidden=false;$('#overview').classList.remove('active');$('#walk').classList.add('active');$('#mode-label').textContent='WALK AROUND';toast('Осматривайся пальцем. Двигайся джойстиком или WASD.');}
enter.onclick=()=>{if(!room)return;entered=true;document.body.classList.add('entered');$('#toolbar').hidden=false;overview();if(reduced)waveActions.forEach(a=>a.reset().setLoop(THREE.LoopOnce,1).play());toast('Добро пожаловать! Нажми на логотипы на стене.');};
$('#overview').onclick=overview;$('#walk').onclick=setWalk;$('#wave').onclick=()=>{waveActions.forEach(a=>{a.setLoop(reduced?THREE.LoopOnce:THREE.LoopRepeat,reduced?1:Infinity);a.reset().play();});toast('Привет от Teledog 👋');};
$('#help-toggle').onclick=()=>{const help=$('#instructions');help.hidden=!help.hidden;$('#help-toggle').setAttribute('aria-expanded',String(!help.hidden));};
function linkAt(x,y){if(!room)return null;pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObject(room,true);for(const hit of hits){let o=hit.object;const mat=o.material;if(mat&&!Array.isArray(mat)&&mat.transparent&&mat.opacity<.3)continue;while(o){const link=logoLink(o.name);if(link)return link;o=o.parent;}return null;}return null;}
renderer.domElement.addEventListener('pointerdown',e=>{pendingPointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(walk)renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(pendingPointer&&pendingPointer.id===e.pointerId){const p=pendingPointer;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>7)p.moved=true;if(walk){yaw-=(e.clientX-p.lastX)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-p.lastY)*.004,-1.12,1.12);camera.rotation.set(pitch,yaw,0,'YXZ');}p.lastX=e.clientX;p.lastY=e.clientY;}else if(e.pointerType==='mouse'){renderer.domElement.style.cursor=linkAt(e.clientX,e.clientY)?'pointer':walk?'grab':'default';}});
renderer.domElement.addEventListener('pointerup',e=>{if(pendingPointer&&pendingPointer.id===e.pointerId&&!pendingPointer.moved){const url=linkAt(e.clientX,e.clientY);if(url)window.open(url,'_blank','noopener,noreferrer');}pendingPointer=null;});renderer.domElement.addEventListener('pointercancel',()=>pendingPointer=null);
const joy=$('#joystick'),stick=$('#stick');let joyId=null;
function updateStick(e){const b=joy.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,length=Math.max(1,Math.hypot(dx,dy)/35),x=dx/length,y=dy/length;stick.style.transform=`translate(${x}px,${y}px)`;stickVector={forward:-y/35,right:x/35};}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);updateStick(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)updateStick(e);});function resetStick(){joyId=null;stickVector={forward:0,right:0};stick.style.transform='';}joy.addEventListener('pointerup',resetStick);joy.addEventListener('pointercancel',resetStick);
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{moveButton=b.dataset.move;b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',()=>moveButton=null);b.addEventListener('pointercancel',()=>moveButton=null);}
window.addEventListener('keydown',e=>{if(walk&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='Escape')overview();});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();resetStick();moveButton=null;pendingPointer=null;});document.addEventListener('visibilitychange',()=>clock.getDelta());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;if(mixer)mixer.update(dt);if(walk){const forward=stickVector.forward+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(moveButton==='forward'?1:0)-(moveButton==='back'?1:0),right=stickVector.right+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+(moveButton==='right'?1:0)-(moveButton==='left'?1:0);const p=slideMove(camera.position,movement(yaw,forward,right,dt));camera.position.x=p.x;camera.position.z=p.z;}else controls.update();renderer.render(scene,camera);});
