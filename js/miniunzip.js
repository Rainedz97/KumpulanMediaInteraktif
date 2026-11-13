/* BRIAN Learning & Media Studio — © 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat LICENSE. */
/* Pembaca ZIP ringan (tanpa dependensi luar): mendukung entri STORED dan DEFLATE. */
// Implementasi RAW DEFLATE (RFC1951) inflate, ringkas, untuk baca entri ZIP method=8.
function inflateRaw(data){
  let pos=0,bitBuf=0,bitCnt=0;
  const out=[];
  function bits(n){
    while(bitCnt<n){bitBuf|=data[pos++]<<bitCnt;bitCnt+=8;}
    const v=bitBuf&((1<<n)-1);bitBuf>>>=n;bitCnt-=n;return v;
  }
  function buildTree(lens){
    const maxLen=Math.max(0,...lens);
    const blCount=new Array(maxLen+1).fill(0);
    lens.forEach(l=>{if(l>0)blCount[l]++;});
    let code=0;const nextCode=new Array(maxLen+1).fill(0);
    for(let b=1;b<=maxLen;b++){code=(code+blCount[b-1])<<1;nextCode[b]=code;}
    const codes=new Array(lens.length).fill(0);
    for(let n=0;n<lens.length;n++){const l=lens[n];if(l>0){codes[n]=nextCode[l]++;}}
    // map: for decoding, build dict keyed by "len:code"
    const map=new Map();
    for(let n=0;n<lens.length;n++){if(lens[n]>0)map.set(lens[n]+':'+codes[n],n);}
    return {map,maxLen};
  }
  function decodeSym(tree){
    let code=0,len=0;
    while(len<tree.maxLen){
      code=(code<<1)|bits(1);len++;
      const v=tree.map.get(len+':'+code);
      if(v!==undefined)return v;
    }
    throw new Error('simbol Huffman tidak valid');
  }
  const lenBase=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  const lenExtra=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const distBase=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  const distExtra=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  const clOrder=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
  let fixedLit=null,fixedDist=null;
  function getFixed(){
    if(fixedLit)return [fixedLit,fixedDist];
    const l=new Array(288);
    for(let i=0;i<144;i++)l[i]=8; for(let i=144;i<256;i++)l[i]=9;
    for(let i=256;i<280;i++)l[i]=7; for(let i=280;i<288;i++)l[i]=8;
    const d=new Array(30).fill(5);
    fixedLit=buildTree(l);fixedDist=buildTree(d);
    return [fixedLit,fixedDist];
  }
  for(;;){
    const final=bits(1),type=bits(2);
    let litTree,distTree;
    if(type===0){
      bitBuf=0;bitCnt=0;
      const len=data[pos]|(data[pos+1]<<8);pos+=4;
      for(let i=0;i<len;i++)out.push(data[pos++]);
    } else {
      if(type===1){[litTree,distTree]=getFixed();}
      else if(type===2){
        const hlit=bits(5)+257,hdist=bits(5)+1,hclen=bits(4)+4;
        const clLens=new Array(19).fill(0);
        for(let i=0;i<hclen;i++)clLens[clOrder[i]]=bits(3);
        const clTree=buildTree(clLens);
        const lens=[];
        while(lens.length<hlit+hdist){
          const sym=decodeSym(clTree);
          if(sym<16)lens.push(sym);
          else if(sym===16){const r=bits(2)+3,p=lens[lens.length-1];for(let i=0;i<r;i++)lens.push(p);}
          else if(sym===17){const r=bits(3)+3;for(let i=0;i<r;i++)lens.push(0);}
          else{const r=bits(7)+11;for(let i=0;i<r;i++)lens.push(0);}
        }
        litTree=buildTree(lens.slice(0,hlit));distTree=buildTree(lens.slice(hlit));
      } else throw new Error('tipe blok deflate tidak didukung');
      for(;;){
        const sym=decodeSym(litTree);
        if(sym<256)out.push(sym);
        else if(sym===256)break;
        else{
          const li=sym-257,len=lenBase[li]+bits(lenExtra[li]);
          const dsym=decodeSym(distTree),dist=distBase[dsym]+bits(distExtra[dsym]);
          let start=out.length-dist;
          for(let i=0;i<len;i++)out.push(out[start+i]);
        }
      }
    }
    if(final)break;
  }
  return Uint8Array.from(out);
}
/* Parser ZIP ringan: baca entri STORED (0) dan DEFLATE (8) dari End-Of-Central-Directory. */
function readZip(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);
  let eocd=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-22-65557);i--){
    if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}
  }
  if(eocd<0)throw new Error('Bukan file ZIP yang valid (EOCD tidak ditemukan)');
  const total=dv.getUint16(eocd+10,true);
  let cdOff=dv.getUint32(eocd+16,true);
  const files=[];
  for(let i=0;i<total;i++){
    if(dv.getUint32(cdOff,true)!==0x02014b50)throw new Error('Central directory rusak');
    const method=dv.getUint16(cdOff+10,true);
    const compSize=dv.getUint32(cdOff+20,true);
    const nameLen=dv.getUint16(cdOff+28,true);
    const extraLen=dv.getUint16(cdOff+30,true);
    const commentLen=dv.getUint16(cdOff+32,true);
    const lho=dv.getUint32(cdOff+42,true);
    const name=new TextDecoder().decode(u8.subarray(cdOff+46,cdOff+46+nameLen));
    files.push({name,method,compSize,lho});
    cdOff+=46+nameLen+extraLen+commentLen;
  }
  return files.filter(f=>!f.name.endsWith('/')).map(f=>{
    const lnameLen=dv.getUint16(f.lho+26,true),lextraLen=dv.getUint16(f.lho+28,true);
    const dataStart=f.lho+30+lnameLen+lextraLen;
    const raw=u8.subarray(dataStart,dataStart+f.compSize);
    return {name:f.name,method:f.method,raw};
  });
}
window.MiniUnzip={readZip,inflateRaw};
