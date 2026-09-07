import * as THREE from 'three';
import {foliageDepth} from './foliage-motion.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {landscapeGeometry} from './landscape.js';
export const palette={ink:'#2b343f',wall:'#ded5c5',cream:'#f2ead9',peach:'#d6a995',mint:'#849897',green:'#3d7064',dark:'#405e62',red:'#b35443',gold:'#c4a477',road:'#91a2a2',sky:'#afced8'};
const grad=new THREE.DataTexture(new Uint8Array([125,148,170,192,211,226,239,249]),8,1,THREE.RedFormat);grad.needsUpdate=true;grad.minFilter=grad.magFilter=THREE.LinearFilter;
const cache=new Map();
export function material(color,options={}){const key=JSON.stringify([color,options]);if(!cache.has(key))cache.set(key,new THREE.MeshToonMaterial({color,gradientMap:grad,...options}));return cache.get(key)}
export const lineMaterial=new THREE.LineBasicMaterial({color:palette.ink,transparent:true,opacity:.28});
export function mesh(parent,geo,color,pos=[0,0,0],outline=true){const m=new THREE.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(outline){const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,32),lineMaterial);m.add(e)}return m}
export function box(p,pos,size,color,outline=true){return mesh(p,new THREE.BoxGeometry(...size,Math.max(1,Math.ceil(size[0]/1.5)),1,Math.max(1,Math.ceil(size[2]/1.5))),color,pos,outline)}
export function sphere(p,pos,size,color,detail=1){const m=mesh(p,new THREE.IcosahedronGeometry(1,detail),color,pos,false);m.scale.set(...size);m.receiveShadow=false;return m}
export function cylinder(p,pos,r1,r2,h,color,n=10,outline=true){return mesh(p,new THREE.CylinderGeometry(r1,r2,h,n),color,pos,outline)}
export function rod(p,a,b,r,color,n=7){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);const m=cylinder(p,va.clone().add(vb).multiplyScalar(.5).toArray(),r,r,d.length(),color,n,false);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
export function wire(p,points,color=palette.ink,r=.012){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return mesh(p,new THREE.TubeGeometry(curve,28,r,4,false),color,[0,0,0],false)}
export function group(p,pos=[0,0,0],yaw=0){const g=new THREE.Group();g.position.set(...pos);g.rotation.y=yaw;p.add(g);return g}
export function textTexture(text,{bg='#dedec2',fg='#3c5649',width=512,height=256,vertical=false,small='',border=true}={}){
 const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=fg;ctx.strokeStyle=fg;
 if(border){ctx.lineWidth=3;ctx.strokeRect(10,10,width-20,height-20);ctx.lineWidth=1;ctx.strokeRect(16,16,width-32,height-32)}
 ctx.textAlign='center';ctx.textBaseline='middle';
 if(vertical){ctx.font=`bold ${Math.min(width*.67,height/(text.length+1))}px 'KaiTi','Microsoft YaHei',serif`;[...text].forEach((ch,i)=>ctx.fillText(ch,width/2,height*(i+.7)/(text.length+.35)))}
 else{ctx.font=`bold ${Math.min(height*.49,width/(text.length+.7))}px 'KaiTi','Microsoft YaHei',serif`;ctx.fillText(text,width/2,height*(small?.43:.5));if(small){ctx.font=`${height*.105}px monospace`;ctx.fillText(small,width/2,height*.79)}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export function sign(p,text,pos,size,opts={}){box(p,pos,[size[0]+.06,size[1]+.06,.09],opts.frame||palette.ink);return mesh(p,new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({map:textTexture(text,opts),side:THREE.DoubleSide}),[pos[0],pos[1],pos[2]+.049],false)}
// Bake static scenery into material batches: dense little details without thousands of draw calls.
export function batchStatic(root){root.updateMatrixWorld(true);const buckets=new Map();const lines=[];root.traverse(o=>{if(o.isMesh){const key=o.material.uuid+'-'+o.receiveShadow+'-'+o.castShadow;let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a)&&!(a==='color'&&o.material.vertexColors))g.deleteAttribute(a);if(o.material.vertexColors&&!g.attributes.color)g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!buckets.has(key))buckets.set(key,{mat:o.material,receive:o.receiveShadow,cast:o.castShadow,geos:[]});buckets.get(key).geos.push(g)}else if(o.isLineSegments){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);lines.push(g)}});const out=new THREE.Group();for(const {mat,receive,cast,geos} of buckets.values()){const merged=mergeGeometries(geos);if(merged){const m=new THREE.Mesh(landscapeGeometry(merged),mat);m.castShadow=cast;m.receiveShadow=receive;if(mat.userData.foliage)m.customDepthMaterial=foliageDepth(mat);out.add(m)}geos.forEach(g=>g.dispose())}if(lines.length){out.add(new THREE.LineSegments(landscapeGeometry(mergeGeometries(lines)),lineMaterial));lines.forEach(g=>g.dispose())}return out}
