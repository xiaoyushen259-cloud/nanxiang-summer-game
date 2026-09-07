import * as THREE from 'three';
import {box,cylinder,mesh,group,rod} from './art.js';
import {surfaceBox,surfaceMaterial} from './scenery-detail.js';

// Small amounts of infrastructure and wear, placed in road-local metres before bending.
export function streetWear(root){
  const steel=new THREE.MeshStandardMaterial({color:'#697475',roughness:.64,metalness:.7});
  const seam=new THREE.MeshStandardMaterial({color:'#414747',roughness:1});
  for(const [x,z] of [[1.5,-3],[-1.3,9],[1.15,-10.8],[-.8,-23.4]]){
    const g=group(root,[x,.041,z]);
    cylinder(g,[0,0,0],.39,.39,.010,seam,48,false);
    cylinder(g,[0,.006,0],.355,.355,.011,steel,48,false);
    // Cast-iron tread relief and two recessed lifting slots.
    for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){
      const a=col*.088,b=row*.088;if(a*a+b*b>.092)continue;
      const bar=box(g,[a,.013,b],[.044,.004,.013],steel,false);bar.rotation.y=(row%2?1:-1)*.55;
    }
    for(const a of [-.22,.22])box(g,[a,.013,0],[.045,.003,.019],seam,false);
  }
  for(const [x,z,w,d] of [[-2.2,-3.5,1.05,1.7],[2.25,16,1.2,.85],[-.4,-19,1.45,1.0]]){
    const shape=new THREE.Shape();
    [[-w/2,-d/2],[w*.22,-d*.49],[w*.5,-d*.39],[w*.49,d*.5],[-w*.42,d*.48],[-w*.52,d*.12]].forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();
    const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/2,p.getZ(i)/2);
    const m=surfaceMaterial('asphalt','#7c898f');geo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(p.count*3).fill(1),3));
    const patch=mesh(root,geo,m,[x,.040,z],false);patch.castShadow=false;
  }
  // A narrow drain channel along the curb; keep crosswalks and alley access clear.
  for(const s of [-1,1])for(const [z,d] of [[-13,28],[17,13]]){
    surfaceBox(root,[s*3.88,.036,z],[.12,.004,d],'#788185','asphalt');
  }
  // Sealant repairs are short and irregular, rather than a repeating crack texture.
  for(const [x,z] of [[-2.5,-7],[1.4,18],[-.6,-16]]){
    const pts=[[x,0,z],[x+.18,0,z+.20],[x+.08,0,z+.42],[x+.32,0,z+.61]];
    for(let i=1;i<pts.length;i++)rod(root,[pts[i-1][0],.040,pts[i-1][2]],[pts[i][0],.040,pts[i][2]],.005,seam,4);
  }
}
