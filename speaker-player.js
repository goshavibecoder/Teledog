import * as THREE from './vendor/build/three.module.js';

export function createSpeakerPlayer(speaker){
 const display=speaker.getObjectByName('Speaker mini screen');
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;
 const context=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 display.material.map=texture;display.material.color.set(0xffffff);display.material.needsUpdate=true;
 const audio=new Audio();audio.preload='metadata';let audioContext,analyser,data,url,title='Choose a song',error='',elapsed=1;
 const panel=document.querySelector('#speaker-player'),file=document.querySelector('#speaker-file'),play=document.querySelector('#speaker-play'),status=document.querySelector('#speaker-track');
 const show=()=>{panel.hidden=false;};
 document.querySelector('#speaker-close').onclick=()=>{panel.hidden=true;};
 document.querySelector('#speaker-select').onclick=()=>file.click();
 function sync(){play.textContent=audio.paused?'Play':'Pause';play.disabled=!url;status.textContent=error||title;}
 function initialiseAudio(){
  if(audioContext)return;
  audioContext=new (window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=128;data=new Uint8Array(analyser.frequencyBinCount);
  const source=audioContext.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioContext.destination);
 }
 play.onclick=async()=>{try{initialiseAudio();await audioContext.resume();if(audio.paused)await audio.play();else audio.pause();error='';}catch(e){error='Unable to play this audio file.';}sync();elapsed=1;};
 file.onchange=()=>{const selected=file.files[0];if(!selected)return;audio.pause();if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(selected);audio.src=url;title=selected.name.replace(/\.[^.]+$/,'');error='';sync();elapsed=1;};
 audio.addEventListener('error',()=>{error='This audio format could not be played.';sync();elapsed=1;});
 for(const event of ['play','pause','ended','loadedmetadata'])audio.addEventListener(event,()=>{sync();elapsed=1;});
 function time(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');}
 function update(dt){
  elapsed+=dt;if(elapsed<.08)return;elapsed=0;
  const active=!audio.paused&&!audio.ended;if(analyser)analyser.getByteFrequencyData(data);
  context.fillStyle='#071727';context.fillRect(0,0,640,320);
  context.fillStyle='#78cfff';context.font='bold 26px Arial';context.fillText(active?'▶ NOW PLAYING':url?'Ⅱ PAUSED':'TELEDOG MUSIC',26,40);
  context.fillStyle='#ffffff';context.font='bold 29px Arial';const name=title.length>31?title.slice(0,30)+'…':title;context.fillText(name,26,84);
  for(let i=0;i<24;i++){const amplitude=active&&data?data[1+i*2]/255:0;const height=5+amplitude*105;context.fillStyle=i<12?'#479fff':'#6bdfff';context.fillRect(27+i*24,218-height,14,height);}
  context.fillStyle='#23435f';context.fillRect(26,248,588,5);context.fillStyle='#72d5ff';const ratio=Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;context.fillRect(26,248,588*ratio,5);
  context.font='24px Arial';context.fillStyle='#bbd9f0';context.fillText(time(audio.currentTime),26,291);context.textAlign='right';context.fillText(time(audio.duration),614,291);context.textAlign='left';texture.needsUpdate=true;
 }
 sync();update(1);return {show,update};
}
