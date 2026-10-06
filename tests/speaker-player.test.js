import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/build/three.module.js';
import {createSpeakerPlayer,speakerActionAt} from '../speaker-player.js';

test('direct screen taps map to playback, track, volume and pickup controls',()=>{
 const tap=(x,y)=>speakerActionAt({x:x/640,y:1-y/320});
 assert.equal(tap(100,100),'toggle');assert.equal(tap(100,210),'previous');assert.equal(tap(320,210),'toggle');assert.equal(tap(550,210),'next');assert.equal(tap(80,280),'quieter');assert.equal(tap(240,280),'louder');assert.equal(tap(500,280),'pickup');
});
test('direct speaker controls play both songs, pause, change volume and pick up without a menu',async()=>{
 const previous={document:globalThis.document,Audio:globalThis.Audio,window:globalThis.window};
 const rectangles=[],labels=[];const ctx={fillRect(...a){rectangles.push(a);},fillText(t){labels.push(t);}};let audio,gain;
 class FakeAudio extends EventTarget{constructor(){super();audio=this;this.paused=true;this.ended=false;this.currentTime=30;this.duration=120;}pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}async play(){this.paused=false;this.dispatchEvent(new Event('play'));}}
 class FakeContext{createAnalyser(){return {frequencyBinCount:64,connect(){},getByteFrequencyData(data){data.fill(128);}};}createGain(){return gain={gain:{value:1},connect(){}};}createMediaElementSource(){return {connect(){}};}get destination(){return {};}async resume(){}}
 try{
  globalThis.Audio=FakeAudio;globalThis.window={AudioContext:FakeContext};globalThis.document={createElement(){return {getContext(){return ctx;}};}};
  const speaker=new THREE.Group(),display=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial());display.name='Speaker mini screen';speaker.add(display);
  let picked=false;const player=createSpeakerPlayer(speaker,{onPickup:()=>picked=true});
  assert.equal(audio.src,'./assets/own-live-internet.mp3');assert.equal(audio.paused,true);
  await player.act('toggle');rectangles.length=0;labels.length=0;player.update(1);assert.equal(audio.paused,false);assert.ok(rectangles.some(r=>r[1]===148&&r[2]===147));assert.equal(rectangles.filter(r=>r[2]===14&&r[3]>4).length,24);
  await player.act('toggle');rectangles.length=0;player.update(1);assert.equal(audio.paused,true);assert.equal(rectangles.filter(r=>r[2]===14&&r[3]===4).length,24);
  await player.act('next');assert.equal(audio.src,'./assets/faithful-vpns.mp3');assert.equal(audio.paused,false);await player.act('previous');assert.equal(audio.src,'./assets/own-live-internet.mp3');await player.act('previous');assert.equal(audio.src,'./assets/faithful-vpns.mp3');
  await player.act('louder');assert.equal(gain.gain.value,.8);for(let i=0;i<12;i++)await player.act('quieter');assert.equal(gain.gain.value,0);for(let i=0;i<12;i++)await player.act('louder');assert.equal(gain.gain.value,1);
  await player.act('pickup');assert.equal(picked,true);
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
