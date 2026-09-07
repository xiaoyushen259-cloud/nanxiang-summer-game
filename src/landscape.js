// Logical coordinates stay flat for collision and quest logic. The rendered town
// follows a gentle S-bend and a low hill, avoiding a rigid straight corridor.
export const curveX=z=>1.0*Math.sin((z-7)/14);
export const curveY=z=>-.00035*(z-10)*(z-10);
export const curveYaw=z=>Math.atan((1.0/14)*Math.cos((z-7)/14));
export const groundHeight=(x,z)=>z<-28?.185:Math.abs(x)>4?.145:.042;
export function landscapePoint(v){v.x+=curveX(v.z);v.y+=curveY(v.z);return v}
export function landscapeGeometry(g){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const z=p.getZ(i);p.setX(i,p.getX(i)+curveX(z));p.setY(i,p.getY(i)+curveY(z));if(n){const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i)-(1.0/14)*Math.cos((z-7)/14)*nx+.0007*(z-10)*ny;const len=Math.hypot(nx,ny,nz);n.setXYZ(i,nx/len,ny/len,nz/len)}}p.needsUpdate=true;if(n)n.needsUpdate=true;g.computeBoundingSphere();return g}
