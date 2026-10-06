export function createRoomSounds({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(),random=Math.random}={}){
 let context,master,noiseBuffer,distance=0,moving=false,left=true;
 function unlock(){
  try{
   if(!context){context=contextFactory();master=context.createGain();master.gain.value=.35;master.connect(context.destination);
    noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.25),context.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=random()*2-1;
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch(e){/* Audio support must never prevent room navigation. */}
 }
 function noise(frequency,amount,duration){
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),now=context.currentTime;
  source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.75;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(amount,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter);filter.connect(gain);gain.connect(master);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+duration+.01);
 }
 function thump(frequency,amount,duration){
  const source=context.createOscillator(),gain=context.createGain(),now=context.currentTime;source.type='sine';source.frequency.setValueAtTime(frequency,now);source.frequency.exponentialRampToValueAtTime(frequency*.55,now+duration);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(amount,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(gain);gain.connect(master);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(now);source.stop(now+duration+.01);
 }
 function play(kind,label){
  if(!context||context.state!=='running')return;
  if(kind==='step'){noise(340+random()*170,.17,.13);thump(left?105:94,.21,.095);left=!left;}
  else if(kind==='pickup'){noise(label==='Toy'?620:1250,.13,.085);thump(label==='Toy'?180:260,.10,.055);}
  else if(kind==='putback'){noise(label==='Toy'?450:850,.12,.08);thump(125,.14,.075);}
 }
 function update(travelled){
  if(!Number.isFinite(travelled)||travelled<.0001){moving=false;distance=0;return;}
  if(!moving){play('step');moving=true;distance=0;}
  distance+=Math.min(travelled,.5);
  while(distance>=.38){play('step');distance-=.38;}
 }
 return {unlock,play,update};
}
