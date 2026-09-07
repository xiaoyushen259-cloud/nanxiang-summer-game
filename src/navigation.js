import {insideCorner} from './corner-block.js';

// Match the clothed body's width, rather than just the old foot-sized footprint.
export const bodyRadius=.32;
export function isBlocked(x,z,colliders,actors=[]){
  if((x<-5.46||x>5.46)&&z>-27&&!insideCorner(x,z))return true;
  if(actors.some(n=>Math.hypot(x-n.logical.x,z-n.logical.z)<.56))return true;
  return colliders.some(c=>x>c.minX-bodyRadius&&x<c.maxX+bodyRadius&&z>c.minZ-bodyRadius&&z<c.maxZ+bodyRadius);
}
