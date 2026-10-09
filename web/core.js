(function (root) {
  'use strict';
  const LIMIT = 16 * 1024 * 1024;
  function parse(input) {
    const bytes = new Uint8Array(input instanceof Uint8Array ? input : new Uint8Array(input));
    if (!bytes.length || bytes.length > LIMIT) throw new Error('Save must be between 1 byte and 16 MiB. Load gt7save.bin, not download0.dat.');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const records = [], byName = new Map();
    let offset = 0;
    while (offset < bytes.length) {
      if (bytes.length - offset < 56 || records.length >= 512) throw new Error('Truncated or unsupported record header.');
      const size = view.getUint32(offset + 12, true);
      if (size > bytes.length - offset - 56) throw new Error('Record extends past end of file.');
      const rawName = bytes.slice(offset + 24, offset + 56), end = rawName.indexOf(0);
      if (end < 1 || rawName.slice(end).some(x => x !== 0)) throw new Error('Invalid record name padding.');
      const name = String.fromCharCode(...rawName.slice(0, end));
      if (!/^[A-Z0-9_]+$/.test(name) || byName.has(name)) throw new Error('Invalid or duplicate record: ' + name);
      const record = {name, size, header: offset, start: offset + 56,
        index: view.getBigUint64(offset, true).toString(), flag: view.getUint32(offset + 8, true),
        pointer: '0x' + view.getBigUint64(offset + 16, true).toString(16)};
      records.push(record); byName.set(name, record); offset += 56 + size;
    }
    if (!byName.has('GARAGE') || !byName.has('PROGRESS')) throw new Error('Required GT7 records are missing.');
    return {bytes, records, byName};
  }
  const specs = {u8:[1,'getUint8','setUint8'],u16:[2,'getUint16','setUint16'],u32:[4,'getUint32','setUint32'],u64:[8,'getBigUint64','setBigUint64'],
    i16:[2,'getInt16','setInt16'],i32:[4,'getInt32','setInt32'],i64:[8,'getBigInt64','setBigInt64'],f32:[4,'getFloat32','setFloat32'],f64:[8,'getFloat64','setFloat64']};
  function offsetValue(text) {
    if (!/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(String(text).trim())) throw new Error('Offset must be decimal or hexadecimal (0x…).');
    const value=Number(String(text).trim()); if (!Number.isSafeInteger(value) || value<0) throw new Error('Invalid offset.'); return value;
  }
  function bounds(record, offset, size) {
    if (!record || !Number.isInteger(offset) || offset<0 || offset+size>record.size) throw new Error('Value falls outside the selected record payload.');
  }
  function read(save, name, offset, type, endian='BE') {
    const spec=specs[type];if(!spec)throw new Error('Unknown value type.');
    const record=save.byName.get(name);bounds(record,offset,spec[0]);
    const view=new DataView(save.bytes.buffer,save.bytes.byteOffset,save.bytes.byteLength);
    return view[spec[1]](record.start+offset,endian==='LE').toString();
  }
  function write(save,name,offset,type,endian,value) {
    const record=save.byName.get(name);
    if(type==='hex'){
      const text=value.replace(/\s/g,'');if(!/^(?:[0-9a-f]{2})+$/i.test(text)||text.length>128)throw new Error('Enter 1–64 complete hexadecimal bytes.');
      const bytes=Uint8Array.from(text.match(/../g),x=>parseInt(x,16));bounds(record,offset,bytes.length);save.bytes.set(bytes,record.start+offset);return;
    }
    const spec=specs[type];if(!spec)throw new Error('Unknown value type.');bounds(record,offset,spec[0]);
    const view=new DataView(save.bytes.buffer,save.bytes.byteOffset,save.bytes.byteLength);
    if(type[0]==='f'){
      if(!String(value).trim())throw new Error('Enter a number.');const number=Number(value);
      if(!Number.isFinite(number)||(type==='f32'&&!Number.isFinite(Math.fround(number))))throw new Error('Finite in-range number required.');
      view[spec[2]](record.start+offset,number,endian==='LE');return;
    }
    if(!/^-?[0-9]+$/.test(String(value).trim()))throw new Error('Enter a whole decimal number.');
    const integer=BigInt(value),bits=BigInt(spec[0]*8),signed=type[0]==='i';
    const min=signed?-(1n<<(bits-1n)):0n,max=signed?(1n<<(bits-1n))-1n:(1n<<bits)-1n;
    if(integer<min||integer>max)throw new Error(`Value must be ${min} to ${max}.`);
    view[spec[2]](record.start+offset,spec[0]===8?integer:Number(integer),endian==='LE');
  }
  function changes(oldSave,newSave) {
    const out=[];
    for(const name of new Set([...oldSave.byName.keys(),...newSave.byName.keys()])){
      const a=oldSave.byName.get(name),b=newSave.byName.get(name);let changed=0;const ranges=[];
      for(let i=0;i<Math.max(a?.size||0,b?.size||0);i++){
        const av=a&&i<a.size?oldSave.bytes[a.start+i]:undefined,bv=b&&i<b.size?newSave.bytes[b.start+i]:undefined;
        if(av!==bv){changed++;const last=ranges[ranges.length-1];if(last&&last.end===i)last.end++;else ranges.push({start:i,end:i+1});}
      }
      if(changed||!a||!b)out.push({name,changed,oldSize:a?.size??null,newSize:b?.size??null,ranges});
    }
    return out;
  }
  function giftInfo(save){
    const record=save.byName.get('GIFTIV');if(!record||record.size<66)return null;
    const view=new DataView(save.bytes.buffer,save.bytes.byteOffset,save.bytes.byteLength),count=view.getUint16(record.start+64,false);
    if(record.size!==66+450*count)return null;
    for(let i=0;i<count;i++){
      if(view.getUint16(record.start+66+2*i,false)!==i)return null;
      const start=record.start+66+2*count+448*i;
      if(String.fromCharCode(...save.bytes.slice(start,start+4))!=='GFIT')return null;
    }
    const entries=[];
    for(let i=0;i<count;i++){
      const offset=66+2*count+448*i,absolute=record.start+offset;
      const jsonLength=view.getUint32(absolute+59,false);
      let details=null,raw='';
      if(jsonLength<=448-63){
        raw=new TextDecoder().decode(save.bytes.slice(absolute+63,absolute+63+jsonLength));
        try{details=JSON.parse(raw.replace(/("itemId_"\s*:\s*)(-?\d+)/g,'$1"$2"'));}catch{}
      }
      entries.push({index:i,offset,id:view.getBigUint64(absolute+47,false).toString(),details,raw});
    }
    return {count,entrySize:448,entries};
  }
  function removeGifts(save,indices){
    const info=giftInfo(save);if(!info)throw new Error('Unsupported gift layout; removal disabled.');
    const removed=new Set(indices);if(!removed.size)throw new Error('Select at least one gift.');
    for(const i of removed)if(!Number.isInteger(i)||i<0||i>=info.count)throw new Error('Invalid gift index.');
    const r=save.byName.get('GIFTIV'),keep=info.entries.filter(e=>!removed.has(e.index)),count=keep.length;
    const payload=new Uint8Array(66+450*count);payload.set(save.bytes.slice(r.start,r.start+66));
    const view=new DataView(payload.buffer);view.setUint16(64,count,false);
    keep.forEach((entry,i)=>{view.setUint16(66+2*i,i,false);payload.set(save.bytes.slice(r.start+entry.offset,r.start+entry.offset+448),66+2*count+448*i);});
    const result=new Uint8Array(save.bytes.length-r.size+payload.length);
    result.set(save.bytes.slice(0,r.start));result.set(payload,r.start);result.set(save.bytes.slice(r.start+r.size),r.start+payload.length);
    new DataView(result.buffer).setUint32(r.header+12,payload.length,true);
    const parsed=parse(result);if(!giftInfo(parsed))throw new Error('Rebuilt gift inventory failed validation.');return parsed;
  }
  const known = [
    {label:'Collector level',name:'PROGRESS',offset:0x15a,type:'u8',endian:'BE',confidence:'Correlated',note:'5 → 6 coincided with the Corolla reward and a tuning-tier unlock. Dashboard confirmation and field width remain pending.'},
    {label:'Selected car reference',name:'GARAGE',offset:0x30,type:'u16',endian:'BE',confidence:'Correlated',note:'Fit → Mini → Fit: 0 → 3 → 0. Possible garage reference.'},
    {label:'Selected car identifier',name:'GARAGE',offset:0x34,type:'u16',endian:'BE',confidence:'Correlated',note:'Fit → Mini → Fit: 3370 → 3356 → 3370. Not a verified model ID.'},
    {label:'Daily distance (metres)',name:'GMSTATS',offset:0x9a,type:'u64',endian:'BE',confidence:'Correlated',note:'81,141 → 81,575 after B2; matches 81.1 → 81.5 km. Needs another controlled run.'}
  ];
  function eventInfo(save){
    const r=save.byName.get('EVTRECIV');if(!r||r.size<66)return null;
    const dv=new DataView(save.bytes.buffer,save.bytes.byteOffset,save.bytes.byteLength),count=dv.getUint16(r.start+64,false);
    if(r.size!==66+98*count)return null;const entries=[];
    for(let i=0;i<count;i++){
      if(dv.getUint16(r.start+66+i*2,false)!==i)return null;
      const offset=66+2*count+96*i,absolute=r.start+offset;
      if(dv.getUint32(absolute,false)!==0xf921ba8e)return null;
      entries.push({index:i,offset,id:dv.getBigUint64(absolute+47,false).toString(),time:dv.getBigUint64(absolute+63,false).toString()});
    }return entries;
  }
  function questEntries(save){
    const r=save.byName.get('QUEST');if(!r||r.size<96)return null;
    const segment=Number(read(save,'QUEST',12,'u16'));
    if(![96,112].includes(segment)||segment+260+64*368!==r.size)return null;
    const entries=[];
    if(Number(read(save,'QUEST',segment,'u32'))!==64)return null;
    for(let i=0;i<64;i++){
      if(Number(read(save,'QUEST',segment+4+4*i,'u32'))!==i)return null;
      const offset=segment+260+368*i;
      if(read(save,'QUEST',offset,'u32')!==String(0x71757064)||Number(read(save,'QUEST',offset+12,'u16'))!==368)return null;
      const slot=Number(read(save,'QUEST',offset+46,'u32'));
      if(slot===0xffffffff)continue;
      if(slot!==i)return null;
      entries.push({slot,offset,id:Number(read(save,'QUEST',offset+50,'u32')),stage: Number(read(save,'QUEST',offset+345,'u8')),objectiveBits:Number(read(save,'QUEST',offset+350,'u8'))});
    }return entries;
  }
  function scapesExperiment(save){
    const entries=questEntries(save),target=entries?.filter(e=>e.id===625);
    if(!target||target.length!==1)throw new Error('Exactly one supported quest 625 is required.');
    const archive=save.byName.get('QSTARCIV');
    if(!archive||archive.size<50)throw new Error('Quest archive is unavailable.');
    const count=Number(read(save,'QSTARCIV',48,'u16'));
    if(archive.size!==50+66*count)throw new Error('Unsupported quest archive layout.');
    for(let i=0;i<count;i++){
      if(Number(read(save,'QSTARCIV',50+2*i,'u16'))!==i)throw new Error('Invalid quest archive index.');
      if(Number(read(save,'QSTARCIV',50+2*count+64*i+47,'u32'))===625)throw new Error('Quest 625 is already archived; experiment disabled.');
    }
    const e=target[0],expected=[[85,0,2],[89,2,3],[107,1,2],[345,1,3],[350,0,1]];
    if(Number(read(save,'QUEST',e.offset+62,'u32'))!==625001||Number(read(save,'QUEST',e.offset+80,'u32'))!==625002||Number(read(save,'QUEST',e.offset+98,'u32'))!==625003)throw new Error('Scapes objective identifiers differ from the captured layout.');
    for(const [off,before] of expected)if(Number(read(save,'QUEST',e.offset+off,'u8'))!==before)throw new Error('Quest 625 is not in the expected untouched in-progress state.');
    const out=parse(save.bytes);
    for(const [off,,after] of expected)write(out,'QUEST',e.offset+off,'u8','BE',String(after));
    return out;
  }
  function menuInfo(save){
    try{
      const claimed=Number(read(save,'PROGRESS',0x151,'u8')),active=Number(read(save,'PROGRESS',0x135,'u8')),pending=Number(read(save,'PROGRESS',0x138,'u8'));
      if(active>1||pending>1||active&&pending)return null;
      const q=save.byName.get('QUEST');if(!q||q.size<96)return null;
      const segment=Number(read(save,'QUEST',12,'u16')),count=Number(read(save,'QUEST',0x52,'u32'));
      if(![96,112].includes(segment)||count>1||segment>q.size)return null;
      const id=count?Number(read(save,'QUEST',0x56,'u32')):null;
      const mapped={619:{number:9,title:'Championship: Tokyo Highway Parade'},602:{number:10,title:'Collection: Japanese FR Sports Cars'}}[id]||null;
      const state=pending?'Completed — prize unclaimed':active?'In progress':'No active book indicated';
      return {claimed,active,pending,id,mapped,state};
    }catch{return null;}
  }
  function ticketLabel(details){
    if(!details)return {stars:null,label:'Unknown ticket',confidence:'Unknown'};
    if(details.msgkey_==='DELITEM_9007199254770994')return {stars:6,label:'6-star · prize car only',confidence:'User confirmed'};
    const id=details.ticket_?.rouletteid_;
    const stars=({1:1,2:2,3:3,4:4,5:5,6:6,10:5,11:6,12:6,13:6})[id]??null;
    return {stars,label:stars?`${stars}-star${stars===6?' · subtype unverified':''}`:'Unknown ticket',confidence:'Inferred from 69-ticket census'};
  }
  function ticketDate(raw){
    if(!Number.isSafeInteger(raw)||raw<=0)return null;
    const ms=(raw-210866760000)*1000;
    if(!Number.isSafeInteger(ms)||Math.abs(ms)>8640000000000000)return null;
    return new Date(ms).toISOString();
  }
  const api={parse,read,write,changes,giftInfo,removeGifts,eventInfo,menuInfo,questEntries,scapesExperiment,ticketLabel,ticketDate,known,offsetValue,specs};
  root.GT7=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
