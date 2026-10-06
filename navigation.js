export const LINKS=Object.freeze({x:'https://x.com/TeledogTON',telegram:'https://t.me/teledogton',dedust:'https://dedust.io/swap/GRAM/EQAm-H72S6NMaO3KEP7jFXPnupsgO0s-mggOKW89l098lL57'});
export function logoLink(name){if(/telegram/i.test(name))return LINKS.telegram;if(/dedust/i.test(name))return LINKS.dedust;if(/x social/i.test(name))return LINKS.x;return null;}
export function movement(yaw,forward,right,dt){const length=Math.max(1,Math.hypot(forward,right));const step=.75*Math.min(dt,.05)/length;return {x:(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*step,z:(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*step};}
const furniture=[{x0:-1.51,x1:-.13,z0:-1.57,z1:-.68},{x0:.13,x1:1.48,z0:-1.31,z1:-.30},{x0:.50,x1:1.49,z0:.57,z1:1.28},{x0:.12,x1:.76,z0:-.32,z1:.28},{x0:-1.48,x1:-1.03,z0:.97,z1:1.48}];
const showcases=[{x0:2.05,x1:3.68,z0:.475,z1:1.50},{x0:3.75,x1:5.10,z0:.475,z1:1.50},{x0:2.35,x1:3.15,z0:-1.50,z1:-.72},{x0:3.68,x1:5.12,z0:-1.50,z1:-.46},{x0:5.20,x1:6.47,z0:-.35,z1:.82}];
export function isWalkable(x,z){
 const r=.09;
 const showroom=x>=-1.48&&x<=1.63&&z>=-1.37&&z<=1.42;
 const doorway=x>=1.37&&x<=1.88&&z>=-.36&&z<=.82;
 const hall=x>=1.87&&x<=6.39&&z>=-1.37&&z<=1.37;
 if(!showroom&&!doorway&&!hall)return false;
 const obstacles=hall?showcases:furniture;
 return !obstacles.some(b=>x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r);
}
export function slideMove(position,delta){let {x,z}=position;if(isWalkable(x+delta.x,z))x+=delta.x;if(isWalkable(x,z+delta.z))z+=delta.z;return {x,z};}
