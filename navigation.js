export const LINKS=Object.freeze({telegram:'https://t.me/teledogton',dedust:'https://dedust.io/swap/GRAM/EQAm-H72S6NMaO3KEP7jFXPnupsgO0s-mggOKW89l098lL57'});
export function logoLink(name){if(/telegram/i.test(name))return LINKS.telegram;if(/dedust/i.test(name))return LINKS.dedust;return null;}
export function movement(yaw,forward,right,dt){const length=Math.max(1,Math.hypot(forward,right));const step=.75*Math.min(dt,.05)/length;return {x:(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*step,z:(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*step};}
const furniture=[{x0:-1.51,x1:-.13,z0:-1.57,z1:-.68},{x0:.13,x1:1.48,z0:-1.31,z1:-.30},{x0:.50,x1:1.49,z0:.57,z1:1.28},{x0:.12,x1:.76,z0:-.32,z1:.28},{x0:-1.48,x1:-1.03,z0:.97,z1:1.48}];
export function isWalkable(x,z){const r=.09;if(x< -1.48||x>1.46||z< -1.37||z>1.42)return false;return !furniture.some(b=>x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r);}
export function slideMove(position,delta){let {x,z}=position;if(isWalkable(x+delta.x,z))x+=delta.x;if(isWalkable(x,z+delta.z))z+=delta.z;return {x,z};}
