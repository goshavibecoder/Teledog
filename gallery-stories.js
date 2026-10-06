import * as THREE from './vendor/build/three.module.js';

export const CHARACTERS=Object.freeze({
 fast:{id:'fast',name:'FAST',image:'./assets/fast-character.png',paragraphs:[
  'From Telegram’s earliest posts on X, the “Gotta go fast” mascot symbolized one mission: building the fastest communication ecosystem in crypto.',
  'As TON evolved, FAST became more than a character; it became the face of Telegram culture itself creating unmatched energy, memes, and loyalty.',
  'What started as a simple Sonic-inspired figure transformed into the legendary Telegram mascot representing speed, community, and innovation.',
  'Fastest meme on the fastest chain — powered by TON.'
 ]},
 groyper:{id:'groyper',name:'GROYPER',paragraphs:[]},
 clown:{id:'clown',name:'Rainbow Clown',paragraphs:[]},
 teledog:{id:'teledog',name:'TELEDOG',paragraphs:[]},
 collectible:{id:'collectible',name:'Collectible',paragraphs:[]}
});
export function registerGalleryStories(hall){
 const nodes=hall.children.slice(0,43);
 for(const [start,end,id] of [[4,9,'teledog'],[10,19,'collectible'],[20,27,'fast'],[27,43,'clown']]){
  for(const node of nodes.slice(start,end))node.userData.galleryCharacter=CHARACTERS[id];
 }
 const frog=hall.getObjectByName('Green frog statue');if(frog)frog.userData.galleryCharacter=CHARACTERS.groyper;
}
export function galleryCharacterAt(hits,maxDistance=3.5){
 for(const hit of hits){
  let visible=true;for(let o=hit.object;o;o=o.parent)if(!o.visible)visible=false;
  if(!visible)continue;
  if(hit.distance>maxDistance)return null;
  // Glass, reflections and decorative lines must never select a character.
  // Resolve the first solid sculpture behind them, or nothing when it misses.
  if(!hit.object.isMesh||/glass|showcase roof/i.test(hit.object.name))continue;
  const mats=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
  if(mats.every(m=>m?.transparent&&m.opacity<.4))continue;
  for(let o=hit.object;o;o=o.parent)if(o.userData.galleryCharacter)return o.userData.galleryCharacter;
  return null;
 }
 return null;
}
export function wrapText(ctx,text,maxWidth){
 const lines=[];let line='';
 for(const word of text.split(/\s+/)){
  const next=line?line+' '+word:word;
  if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;
 }
 if(line)lines.push(line);return lines;
}
function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Character picture could not load'));img.src=url;});}
export async function createStorySheet(record,{canvasFactory=()=>document.createElement('canvas'),imageLoader=loadImage}={}){
 const canvas=canvasFactory();canvas.width=1400;canvas.height=1980;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#e0d9c8';ctx.lineWidth=3;ctx.strokeRect(32,32,1336,1916);
 ctx.textAlign='center';ctx.fillStyle='#7b766b';ctx.font='28px Arial';ctx.fillText('TELEDOG  /  HALL OF FAME',700,83);
 ctx.fillStyle='#171b31';ctx.font='bold 104px Arial';ctx.fillText(record.name,700,205);
 let y=320;
 if(record.image){
  const img=await imageLoader(record.image);const scale=Math.min(550/img.width,550/img.height),w=img.width*scale,h=img.height*scale;
  ctx.drawImage(img,(1400-w)/2,265+(550-h)/2,w,h);y=895;
 }
 ctx.textAlign='left';ctx.fillStyle='#242733';ctx.font='44px Arial';
 for(const paragraph of record.paragraphs){
  for(const line of wrapText(ctx,paragraph,1170)){ctx.fillText(line,115,y);y+=61;}
  y+=27;
 }
 ctx.strokeStyle='#d8d1c2';ctx.beginPath();ctx.moveTo(115,1840);ctx.lineTo(1285,1840);ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#7b766b';ctx.font='26px Arial';ctx.fillText('TELEDOG AND FRIEND’S',700,1900);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const paper=new THREE.Group();paper.name=record.name+' information sheet';paper.userData.pickup={label:'Paper'};
 paper.userData.storyId=record.id;paper.userData.storyText=record.paragraphs.join(' ');paper.userData.storyImage=record.image||null;
 const stock=new THREE.Mesh(new THREE.BoxGeometry(.42,.594,.0016),new THREE.MeshBasicMaterial({color:0xfffdf5}));paper.add(stock);
 const print=new THREE.Mesh(new THREE.PlaneGeometry(.42,.594),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));print.position.z=.00085;paper.add(print);
 return paper;
}
export class GalleryStories{
 constructor(scene,hands,{onError=()=>{},sheetFactory=createStorySheet}={}){
  this.hands=hands;this.onError=onError;this.sheetFactory=sheetFactory;this.cache=new Map();this.request=0;
  this.storage=new THREE.Group();this.storage.name='Gallery sheet storage';this.storage.visible=false;scene.add(this.storage);
 }
 async open(record){
  const request=++this.request;
  try{
   if(!this.cache.has(record.id))this.cache.set(record.id,this.sheetFactory(record).then(paper=>{this.storage.add(paper);return paper;}));
   const paper=await this.cache.get(record.id);if(request!==this.request)return false;
   return this.hands.take(paper);
  }catch(e){this.cache.delete(record.id);if(request===this.request)this.onError(e);return false;}
 }
 cancel(){this.request++;}
}
