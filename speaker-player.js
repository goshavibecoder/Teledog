import * as THREE from './vendor/build/three.module.js';

export const SPEAKER_TRACKS=[
 {title:'Свой Живой Интернет',url:'./assets/own-live-internet.mp3'},
 {title:'Эх ВПНы Верные',url:'./assets/faithful-vpns.mp3'}
];

export function createSpeakerPlayer(speaker,{onPickup=()=>{}}={}){
 const display=speaker.getObjectByName('Speaker mini screen');
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;
 const context=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 display.material.map=texture;display.material.color.set(0xffffff);display.material.needsUpdate=true;
 const audio=new Audio();audio.preload='metadata';let audioContext,analyser,data,index=0,error='',elapsed=1;
 audio.src=SPEAKER_TRACKS[index].url;
 function initialiseAudio(){
  if(audioContext)return;
  audioContext=new (window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=128;data=new Uint8Array(analyser.frequencyBinCount);
  const source=audioContext.createMediaElementSource(audio);source.connect(analyser);
  gain=audioContext.createGain();gain.gain.value=volume;analyser.connect(gain);gain.connect(audioContext.destination);
 }
 // A GainNode works on iPad, where media-element volume can be fixed by Safari.
 let gain,volume=.7,powered=true;audio.volume=1;const presses=new Map();
 async function start(){try{initialiseAudio();const resume=audioContext.resume(),playback=audio.play();await Promise.all([resume,playback]);error='';}catch(e){error='Tap Play to retry';}elapsed=1;}
 async function select(offset){audio.pause();index=(index+offset+SPEAKER_TRACKS.length)%SPEAKER_TRACKS.length;audio.src=SPEAKER_TRACKS[index].url;error='';elapsed=1;await start();}
 async function act(action,button){
  if(button){const previous=presses.get(button);const restY=previous?.restY??button.position.y;button.position.y=restY-.002;presses.set(button,{restY,remaining:.16});}
  if(action==='power'){powered=!powered;if(!powered)audio.pause();elapsed=1;return;}
  if(!powered&&action!=='pickup')return;
  if(action==='pickup'){onPickup();return;}
  if(action==='next'||action==='previous'){await select(action==='next'?1:-1);return;}
  if(action==='louder'||action==='quieter'){volume=Math.max(0,Math.min(1,Math.round((volume+(action==='louder'?.1:-.1))*10)/10));if(gain)gain.gain.value=volume;elapsed=1;return;}
  if(audio.paused)await start();else {audio.pause();elapsed=1;}
 }
 audio.addEventListener('error',()=>{error='Audio unavailable';elapsed=1;});
 for(const event of ['play','pause','loadedmetadata'])audio.addEventListener(event,()=>{elapsed=1;});
 audio.addEventListener('ended',()=>{if(powered)select(1);});
 function time(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');}
 function update(dt){
  for(const [button,press] of presses){press.remaining-=dt;if(press.remaining<=0){button.position.y=press.restY;presses.delete(button);}}
  elapsed+=dt;if(elapsed<.08)return;elapsed=0;
  const active=!audio.paused&&!audio.ended;if(analyser)analyser.getByteFrequencyData(data);
  context.fillStyle=powered?'#071727':'#02060a';context.fillRect(0,0,640,320);
  if(!powered){texture.needsUpdate=true;return;}
  context.fillStyle='#78cfff';context.font='bold 22px Arial';context.fillText(error||'TELEDOG MUSIC',20,27);
  context.fillStyle='#ffffff';context.font='bold 28px Arial';context.fillText(SPEAKER_TRACKS[index].title,20,62);
  for(let i=0;i<24;i++){const amplitude=active&&data?data[1+i*2]/255:0,height=4+amplitude*57;context.fillStyle='#6bdfff';context.fillRect(27+i*24,134-height,14,height);}
  context.fillStyle='#23435f';context.fillRect(26,148,588,4);context.fillStyle='#72d5ff';const ratio=Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;context.fillRect(26,148,588*ratio,4);
  context.font='20px Arial';context.fillStyle='#bbd9f0';context.fillText(time(audio.currentTime)+' / '+time(audio.duration),26,176);
  context.font='24px Arial';context.fillStyle='#78cfff';context.fillText((active?'PLAYING':'PAUSED')+' · VOL '+Math.round(volume*100)+'%',26,260);
  texture.needsUpdate=true;
 }
 update(1);return {act,update};
}
