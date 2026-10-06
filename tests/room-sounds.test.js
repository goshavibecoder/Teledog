import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSounds} from '../room-sounds.js';

function audioFixture(){
 const sources=[];let buffers=0;
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){},disconnect(){}});
 const context={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain(){return {...node(),gain:param()};},createBuffer(ch,length){buffers++;return {getChannelData(){return new Float32Array(length);}};},createBiquadFilter(){return {...node(),frequency:param(),Q:param()};},createBufferSource(){const source={...node(),start(){sources.push(this);},stop(){}};return source;},createOscillator(){const source={...node(),frequency:param(),start(){sources.push(this);},stop(){}};return source;}};
 return {context,sources,get buffers(){return buffers;}};
}
test('only pickup and return sounds remain; there is no walking sound',()=>{
 const fixture=audioFixture();let factories=0;const sounds=createRoomSounds({contextFactory:()=>{factories++;return fixture.context;},random:()=>.5});
 sounds.play('pickup','Toy');assert.equal(fixture.sources.length,0);sounds.unlock();sounds.unlock();assert.equal(factories,1);assert.equal(fixture.buffers,1);
 sounds.play('step');assert.equal(fixture.sources.length,0);assert.equal(sounds.update,undefined);
 sounds.play('pickup','Toy');sounds.play('putback','Keyboard');assert.equal(fixture.sources.length,4);assert.equal(fixture.buffers,1);
});
test('unsupported or suspended audio never breaks interaction',()=>{
 const sounds=createRoomSounds({contextFactory:()=>{throw Error('Audio unavailable');}});assert.doesNotThrow(()=>{sounds.unlock();sounds.play('pickup');});
 const fixture=audioFixture();fixture.context.state='suspended';fixture.context.resume=()=>Promise.resolve();const suspended=createRoomSounds({contextFactory:()=>fixture.context});suspended.unlock();suspended.play('step');assert.equal(fixture.sources.length,0);
});
