import * as THREE from 'three';
const cache=new Map();
export function shopGraphic(kind){
  if(cache.has(kind))return cache.get(kind);
  const canvas=Object.assign(document.createElement('canvas'),{width:1024,height:kind==='fascia'?192:768}),c=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  c.fillStyle=kind==='offer'?'#edbc48':kind==='menu'?'#eee1c4':kind==='fascia'?'#a4543d':'#254c50';c.fillRect(0,0,W,H);
  const text=(s,x,y,size,color='#243a40',font='Microsoft YaHei')=>{c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.fillText(s,x,y);};
  if(kind==='offer'){
    c.fillStyle='#c04e34';c.beginPath();c.moveTo(700,0);c.lineTo(W,0);c.lineTo(W,H);c.lineTo(400,H);c.fill();
    text('青木鲜选',45,80,43);text('冰凉一夏',42,205,113);
    text('CITRUS SODA / FRESH DAILY',48,259,26);
    c.fillStyle='#f7edd4';c.beginPath();c.arc(738,420,180,0,7);c.fill();c.fillStyle='#cf9c34';c.beginPath();c.arc(738,420,151,0,7);c.fill();
    c.strokeStyle='#f7edd4';c.lineWidth=9;for(let i=0;i<8;i++){c.beginPath();c.moveTo(738,420);c.lineTo(738+Math.cos(i*.785)*151,420+Math.sin(i*.785)*151);c.stroke();}
    text('第二瓶',48,428,53);text('半价',43,555,110);text('07:00—23:00',50,705,43,'#f7edd4');
  }else if(kind==='menu'){
    c.fillStyle='#a54230';c.fillRect(0,0,32,H);text('小满 · 手作面',68,103,72);text('TODAY’S KITCHEN / 11:00—21:00',70,151,27);
    for(const [i,[s,p]] of [['葱油拌面','12'],['清汤牛肉面','18'],['番茄鸡蛋面','15']].entries()){
      const y=275+i*166;text(s,73,y,56);text(p,820,y,75,'#a54230');
      c.strokeStyle='#b7a98d';c.lineWidth=2;c.beginPath();c.moveTo(75,y+32);c.lineTo(940,y+32);c.stroke();
    }text('慢慢熬汤，好好吃饭。',76,728,34,'#746b56');
  }else if(kind==='fascia'){
    text('手 作 汤 面',65,129,104,'#f4dfb5');text('每日熬汤',742,77,41,'#f4dfb5');text('SINCE 1986',742,137,29,'#f4dfb5');
  }else{
    text('DAILY',50,115,90,'#e9d9b6');text('青 木 鲜 选',48,215,64,'#e9d9b6');
    c.fillStyle='#dba344';c.fillRect(48,270,928,10);
    for(const [i,s]of ['冷饮 / 茶饮','饭团 / 轻食','日用品 / 零食'].entries())text(s,55,370+i*125,57,'#e9d9b6');
    text('AOKI • YOUR CORNER STORE',52,735,31,'#e9d9b6');
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  // The fascia is assigned to a glTF mesh; its UV convention differs from native planes.
  if(kind==='fascia')t.flipY=false;
  cache.set(kind,t);return t;
}
