import * as THREE from 'three';

// Independent colour, linear height and roughness maps, at a consistent metre scale.
// The restrained palette keeps the painted anime scenery readable from a distance.
const cache=new Map();
export function streetSurfaceMaps(kind){
  if(cache.has(kind))return cache.get(kind);
  let seed=1597+[...kind].reduce((n,c)=>n+c.charCodeAt(0),0);
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const canvases=Array.from({length:3},()=>Object.assign(document.createElement('canvas'),{width:512,height:512}));
  const [c,h,r]=canvases.map(v=>v.getContext('2d'));
  const fill=(ctx,v)=>{ctx.fillStyle=v;ctx.fillRect(0,0,512,512);};
  fill(c,'#e8e7e4');fill(h,'#969696');fill(r,kind==='metal'?'#999999':'#ededed');
  if(kind==='paving'||kind==='brick'){
    const w=kind==='paving'?128:128,hh=kind==='paving'?128:48;
    fill(c,'#9c9b96');fill(h,'#525252');
    for(let row=0;row<Math.ceil(512/hh);row++)for(let col=-1;col<4;col++){
      const x=col*w+(row%2)*w/2,y=row*hh,gap=kind==='paving'?1.5:2.5;
      const v=220+Math.floor(rand()*23);
      c.fillStyle=`rgb(${v},${v-1},${v-4})`;c.fillRect(x+gap,y+gap,w-gap*2,hh-gap*2);
      h.fillStyle='#b5b5b5';h.fillRect(x+gap,y+gap,w-gap*2,hh-gap*2);
      h.fillStyle='#c5c5c5';h.fillRect(x+gap+1,y+gap+1,w-gap*2-2,1);
      r.fillStyle=`rgb(${225+row%3*7},${225+row%3*7},${225+row%3*7})`;r.fillRect(x+gap,y+gap,w-gap*2,hh-gap*2);
      // Small edge nicks: never repeat a large crack across the entire pavement.
      for(let i=0;i<3;i++){const px=x+rand()*w,py=y+(i%2?hh-gap:gap);c.fillStyle='rgba(105,104,98,.19)';c.fillRect(px,py,2+rand()*5,1+rand()*2);}
    }
  }
  if(kind==='wood'){
    fill(c,'#e4d8c4');
    for(let i=0;i<180;i++){
      const x=rand()*512;c.strokeStyle=`rgba(97,75,49,${.025+rand()*.12})`;c.lineWidth=.4+rand()*1.3;
      c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+12,160,x-10,350,x+3,512);c.stroke();
      h.strokeStyle='rgba(40,40,40,.10)';h.lineWidth=.7;h.beginPath();h.moveTo(x,0);h.lineTo(x+3,512);h.stroke();
    }
  }
  if(kind==='fabric')for(let i=0;i<512;i+=4){c.fillStyle='rgba(80,80,80,.055)';c.fillRect(i,0,1,512);c.fillRect(0,i,512,1);h.fillStyle='#777';h.fillRect(i,0,1,512);h.fillRect(0,i,512,1);}
  // Broad, low-contrast mottling gives stone/plaster variation without gritty noise.
  if(['asphalt','plaster','paving'].includes(kind))for(let i=0;i<70;i++){
    const x=rand()*512,y=rand()*512,rad=20+rand()*75;
    for(const dx of [-512,0,512])for(const dy of [-512,0,512]){
      const g=c.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,rad);
      g.addColorStop(0,`rgba(90,88,82,${kind==='asphalt'?.038:.020})`);g.addColorStop(1,'rgba(90,88,82,0)');c.fillStyle=g;c.fillRect(x+dx-rad,y+dy-rad,rad*2,rad*2);
    }
  }
  for(let i=0;i<(kind==='asphalt'?36000:18000);i++){
    const x=rand()*512,y=rand()*512,v=rand(),size=kind==='asphalt'?.4+rand()*1.3:.6;
    c.fillStyle=v>.5?'rgba(255,255,255,.12)':'rgba(50,49,46,.10)';c.fillRect(x,y,size,size);
    h.fillStyle=v>.5?'#bebebe':'#777777';h.fillRect(x,y,size,size);
    r.fillStyle=v>.5?'#fafafa':'#bdbdbd';r.fillRect(x,y,size,size);
  }
  const [map,bumpMap,roughnessMap]=canvases.map((canvas,i)=>{const t=new THREE.CanvasTexture(canvas);t.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;});
  const result={map,bumpMap,roughnessMap};cache.set(kind,result);return result;
}

const materials=new Map();
export function streetSurfaceMaterial(kind,color){
  const key=kind+color;
  if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({
    color:new THREE.Color(color).multiplyScalar(kind==='asphalt'?.40:kind==='plaster'?.84:1),...streetSurfaceMaps(kind),vertexColors:true,
    roughness:kind==='metal'?.48:kind==='wood'?.79:kind==='asphalt'?.98:.91,
    metalness:kind==='metal'?.68:0,
    bumpScale:kind==='asphalt'?.007:kind==='brick'?.012:kind==='paving'?.009:kind==='wood'?.004:.003,
    envMapIntensity:kind==='metal'?.65:.25,
  }));
  return materials.get(key);
}
