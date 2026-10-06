import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/build/three.module.js';
import {createSpeakerPlayer} from '../speaker-player.js';

test('speaker screen follows selected audio, real spectrum, progress and pause',async()=>{
 const previous={document:globalThis.document,Audio:globalThis.Audio,window:globalThis.window};
 const elements=Object.fromEntries(['speaker-player','speaker-file','speaker-play','speaker-track','speaker-close','speaker-select'].map(id=>[id,{hidden:true,files:[],click(){this.clicked=true;}}]));
 const rectangles=[],labels=[];const ctx={fillRect(...a){rectangles.push(a);},fillText(t){labels.push(t);}};let audio;
 class FakeAudio extends EventTarget{constructor(){super();audio=this;this.paused=true;this.ended=false;this.currentTime=30;this.duration=120;}pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}async play(){this.paused=false;this.dispatchEvent(new Event('play'));}}
 class FakeContext{createAnalyser(){return {frequencyBinCount:64,connect(){},getByteFrequencyData(data){data.fill(128);}};}createMediaElementSource(){return {connect(){}};}get destination(){return {};}async resume(){}}
 try{
  globalThis.Audio=FakeAudio;globalThis.window={AudioContext:FakeContext};globalThis.document={createElement(){return {getContext(){return ctx;}};},querySelector(s){return elements[s.slice(1)];}};
  const speaker=new THREE.Group(),display=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial());display.name='Speaker mini screen';speaker.add(display);
  const player=createSpeakerPlayer(speaker);player.show();assert.equal(elements['speaker-player'].hidden,false);assert.equal(elements['speaker-play'].disabled,true);
  const track=new Blob(['audio'],{type:'audio/mpeg'});track.name='Our song.mp3';elements['speaker-file'].files=[track];elements['speaker-file'].onchange();assert.equal(elements['speaker-track'].textContent,'Our song');assert.equal(elements['speaker-play'].disabled,false);
  await elements['speaker-play'].onclick();rectangles.length=0;labels.length=0;player.update(1);assert.ok(labels.includes('▶ NOW PLAYING'));assert.ok(rectangles.some(r=>r[1]===248&&r[2]===147));assert.equal(rectangles.filter(r=>r[2]===14&&r[3]>5).length,24);
  await elements['speaker-play'].onclick();rectangles.length=0;player.update(1);assert.equal(rectangles.filter(r=>r[2]===14&&r[3]===5).length,24);assert.equal(elements['speaker-play'].textContent,'Play');elements['speaker-close'].onclick();assert.equal(elements['speaker-player'].hidden,true);
  URL.revokeObjectURL(audio.src);
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
