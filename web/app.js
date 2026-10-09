'use strict';
const $=id=>document.getElementById(id), G=GT7;
let original=null,working=null,baseline=null,source='',consoleSource=false,selected='PROGRESS',page=0,token='',busy=false;
let watches=[];try{watches=JSON.parse(localStorage.getItem('gt7-watches')||'[]');if(!Array.isArray(watches))watches=[];}catch{watches=[];}
let carNames={'3370':"Fit Hybrid '14",'3356':"Mini-Cooper 'S' '65"};try{Object.assign(carNames,JSON.parse(localStorage.getItem('gt7-car-names')||'{}'));}catch{}
let giftSelection=new Set();
const hex=(n,width=2)=>n.toString(16).toUpperCase().padStart(width,'0');
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function button(text,action){const e=node('button',text,'small');e.addEventListener('click',action);return e;}
function clone(save){return G.parse(save.bytes.slice());}
function dirty(){return original&&working?G.changes(original,working):[];}
function guardDiscard(){return !dirty().length||window.confirm('Discard the staged edits and load another snapshot?');}
function download(bytes,name,type='application/octet-stream'){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function timestamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
async function request(path,options={}){
  const result=await fetch(path,{...options,headers:{'X-Editor-Token':token,...options.headers},cache:'no-store'});
  if(!result.ok){const text=await result.text();try{throw new Error(JSON.parse(text).error||text);}catch(e){if(e instanceof SyntaxError)throw new Error(text);throw e;}}return result;
}
async function run(action){if(busy)return;busy=true;document.body.classList.add('busy');controls();try{await action();}catch(e){message(e.message,true);}finally{busy=false;document.body.classList.remove('busy');controls();}}
async function connect(){const info=await(await fetch('/api/info',{cache:'no-store'})).json();token=info.token;$('connection').textContent=`${info.platform} · ${info.title} · v${info.version}`;if(info.blocked)throw new Error('Mount cleanup previously failed. Reboot the console before launching GT7.');return info;}
function setSave(bytes,label,isConsole){const parsed=G.parse(bytes);original=parsed;working=clone(parsed);source=label;consoleSource=isConsole;giftSelection.clear();if(!baseline){baseline=clone(parsed);$('baselineStatus').textContent='Baseline: first loaded snapshot';}if(!working.byName.has(selected))selected=working.records[0].name;page=0;$('closed').checked=false;render();}
function controls(){const loaded=!!working,d=loaded?dirty():[];
  for(const id of ['export','baseline','stage','addWatch'])$(id).disabled=!loaded||busy;
  $('loadConsole').disabled=busy||!token;$('discard').disabled=!d.length||busy;
  $('apply').disabled=!d.length||busy||!consoleSource||!$('closed').checked;
  for(const id of ['openFile','baselineFile'])$(id).disabled=busy;
  for(const id of ['stageCredits','saveCarName'])$(id).disabled=!loaded||busy;
  const gifts=working?G.giftInfo(working):null;
  for(const id of ['selectLatestGifts','selectDuplicateGifts','exportGifts'])$(id).disabled=!gifts||!gifts.count||busy;
  $('removeGifts').disabled=!gifts||!giftSelection.size||busy;
  $('removeGifts').textContent=`Stage removal of selected gifts (${giftSelection.size})`;
  $('installShortcut').disabled=true;
  $('stopPayload').disabled=busy||!token;
  let eligible=false;try{if(working){G.scapesExperiment(working);eligible=true;}}catch{}
  $('stageScapes').disabled=busy||!eligible||d.length>0;
  $('scapesEligibility').textContent=eligible?'Quest 625 matches the captured pre-completion layout. Mapping to Book 16 is inferred; this is not yet game-validated.':'The required untouched quest 625 state is not present, or the test is already staged.';
}
function renderConfirmed(){if(!working){$('creditsDisplay').textContent='—';return;}
  const credits=G.read(working,'PROGRESS',0x152,'u32','BE');$('creditsDisplay').textContent=Number(credits).toLocaleString()+' Cr.';$('creditsInput').value=credits;
  const id=G.read(working,'GARAGE',0x34,'u16','BE'),reference=G.read(working,'GARAGE',0x30,'u16','BE');
  $('currentCar').textContent=carNames[id]||'Unnamed car';$('currentCarIds').textContent=`ID ${id} · reference ${reference}`;$('carName').value=carNames[id]||'';
}
function readSafe(save,w){try{return G.read(save,w.name,w.offset,w.type,w.endian);}catch{return 'out of range';}}
function renderMenu(){const el=$('menuSummary');el.replaceChildren();const info=working?G.menuInfo(working):null;
  const scapes=working?G.questEntries(working)?.find(e=>e.id===625):null;
  if(scapes){el.append(node('div','Book 16 · Take a Photo of Your Car in Scapes (inferred quest mapping)','eyebrow'),node('div',scapes.stage===1?'In progress':scapes.stage===3?'Completion state staged / awaiting game validation':`Unclassified quest stage ${scapes.stage}`,'menu-state'),node('p',`Nested quest 625 · slot ${scapes.slot} · stage ${scapes.stage} · objective value ${scapes.objectiveBits}`,'menu-metadata'),node('p','Derived from the nested quest entry. Earlier PROGRESS flag interpretations do not apply universally.','muted'));return;}
  if(!info){el.append(node('p',working?'Unsupported progression layout. Use the record explorer; no book state inferred.':'Load a save to inspect menu-book progress.','muted'));return;}
  const grid=node('div',undefined,'menu-grid'),count=node('div'),state=node('div');
  count.append(node('div','Progress marker · meaning unresolved','eyebrow'),node('div',String(info.claimed),'menu-count'),node('small','PROGRESS +0x151. Stayed at 9 after Book 10 hand-in; this is not a reliable completed-book count.'));
  state.append(node('div',info.mapped?`Menu Book No. ${info.mapped.number} · ${info.mapped.title}`:info.id!==null?`Unmapped quest ${info.id}`:'No mapped active quest','eyebrow'),node('div',info.state,'menu-state'),node('div',`Quest ID: ${info.id??'none'} · active flag: ${info.active} · completion flag: ${info.pending}`,'menu-metadata'));
  if(info.id===602)state.append(node('p',"Objectives: Silvia Q’s (S13) ’88 · Eunos Roadster (NA) ’89 · Corolla Levin 1600GT APEX (AE86) ’83",'muted'),node('small','Individual acquired flags are not yet decoded reliably.'));
  if(baseline){const old=G.menuInfo(baseline);if(old)state.append(node('small',`Baseline marker: ${old.claimed} · ${old.state}`));}
  grid.append(count,state);el.append(grid);
}
function renderCards(){const el=$('cards');el.replaceChildren();const fields=[...G.known];const b2=working?G.eventInfo(working)?.find(e=>e.id==='1000017'):null;if(b2)fields.push({label:'B2 best time (ms)',name:'EVTRECIV',offset:b2.offset+63,type:'u64',endian:'BE',confidence:'Correlated',note:'Event 1000017: 17,968 after B2 bronze. Located by event ID, not a fixed file offset.'});for(const field of fields){
  const card=node('div',undefined,'card');card.append(node('div',field.confidence,'tag'),node('h3',field.label),node('div',working?readSafe(working,field):'—','value'),node('p',field.note,'muted'));
  const edit=button('Inspect field',()=>chooseField(field));edit.disabled=!working;card.append(edit);el.append(card);
}}
function chooseField(w){selected=w.name;$('offset').value='0x'+hex(w.offset);$('type').value=w.type;$('endian').value=w.endian;page=Math.floor(w.offset/256);render();readEditor();}
function renderRecords(){const el=$('records');el.replaceChildren();if(!working)return;const comparison=baseline?G.changes(baseline,working):[],map=new Map(comparison.map(x=>[x.name,x]));
  $('recordCount').textContent=working.records.length;
  for(const r of working.records){if(!r.name.includes($('recordFilter').value.toUpperCase())||($('changedOnly').checked&&!map.has(r.name)))continue;
    const b=node('button',undefined,'record'+(selected===r.name?' active':''));b.append(node('span',r.name),node('span',map.has(r.name)?'Δ '+map.get(r.name).changed:r.size.toLocaleString(),map.has(r.name)?'changed':''));b.onclick=()=>{selected=r.name;page=0;$('offset').value='0x0';render();readEditor();};el.append(b);
  }
}
function renderHex(){const table=$('hex');table.replaceChildren();if(!working)return;const r=working.byName.get(selected),old=baseline?.byName.get(selected),orig=original.byName.get(selected);
  page=Math.min(page,Math.max(0,Math.ceil(r.size/256)-1));const start=page*256,end=Math.min(r.size,start+256);
  $('recordTitle').textContent=r.name;$('recordMeta').textContent=`${r.size.toLocaleString()} payload bytes · file offset 0x${hex(r.start)} · offsets below are payload-relative`;
  const diff=baseline?G.changes(baseline,working).find(x=>x.name===selected):null;$('diffCount').textContent=diff?`${diff.changed} changed bytes`:'Unchanged payload';
  $('headerInfo').textContent=JSON.stringify({headerOffset:'0x'+hex(r.header),index:r.index,flag:r.flag,pointerLike:r.pointer,payloadLength:r.size},null,2);
  $('page').textContent=r.size?`0x${hex(start)}–0x${hex(end-1)} of ${r.size.toLocaleString()} bytes`:'Empty record';
  $('previous').disabled=page===0;$('next').disabled=end>=r.size;$('nextDiff').disabled=!diff;
  const head=node('tr');head.append(node('th','Offset'));for(let i=0;i<16;i++)head.append(node('th',hex(i)));head.append(node('th','ASCII'));table.append(head);
  let chosen=-1;try{chosen=G.offsetValue($('offset').value);}catch{}
  for(let row=start;row<end;row+=16){const tr=node('tr');tr.append(node('th',hex(row,6)));let ascii='';for(let col=0;col<16;col++){
    const off=row+col,td=node('td');if(off<end){const byte=working.bytes[r.start+off];td.textContent=hex(byte);td.className='byte';
      if(baseline&&(!old||off>=old.size||baseline.bytes[old.start+off]!==byte))td.classList.add('diff');
      if(original.bytes[orig.start+off]!==byte)td.classList.add('staged');if(off===chosen)td.classList.add('selected');
      td.tabIndex=0;td.setAttribute('aria-label',`Offset 0x${hex(off)}, byte ${hex(byte)}`);const click=()=>{$('offset').value='0x'+hex(off);readEditor();renderHex();};td.onclick=click;td.onkeydown=e=>{if(e.key==='Enter')click();};ascii+=byte>=32&&byte<127?String.fromCharCode(byte):'.';
    }tr.append(td);
  }tr.append(node('td',ascii,'ascii'));table.append(tr);}
}
function readEditor(){if(!working)return;try{const offset=G.offsetValue($('offset').value),type=$('type').value,endian=$('endian').value;
  if(type==='hex'){const r=working.byName.get(selected);if(offset>=r.size)throw new Error('Offset is outside payload.');$('value').value=hex(working.bytes[r.start+offset]);$('interpreted').textContent='Enter space-separated bytes; edits cannot change record length.';}
  else{const value=G.read(working,selected,offset,type,endian);$('value').value=value;let old='—';try{old=G.read(baseline,selected,offset,type,endian);}catch{}$('interpreted').textContent=`Current: ${value} · Baseline: ${old} · ${type} ${endian}`;}
}catch(e){$('interpreted').textContent=e.message;$('value').value='';}}
function renderWatches(){const el=$('watches');el.replaceChildren();if(!watches.length)el.append(node('p','No custom watches yet. Select an offset, choose its type, and give it a name.','muted'));
  watches.forEach((w,i)=>{const row=node('div',undefined,'row'),label=node('div');label.append(node('strong',w.label),node('div',`${w.name} +0x${hex(w.offset)} · ${w.type} ${w.endian}`,'muted'),node('code',working?`${readSafe(working,w)} ← baseline ${baseline?readSafe(baseline,w):'—'}`:'—'));const actions=node('div',undefined,'flex');actions.append(button('View',()=>{if(working?.byName.has(w.name))chooseField(w);}),button('Remove',()=>{watches.splice(i,1);persistWatches();renderWatches();}));row.append(label,actions);el.append(row);});}
function persistWatches(){try{localStorage.setItem('gt7-watches',JSON.stringify(watches));}catch{message('Browser storage unavailable. Export your watch definitions to keep them.');}}
function renderComparison(){const el=$('comparison');el.replaceChildren();if(!working||!baseline)return;const list=G.changes(baseline,working);
  if(!list.length)el.append(node('p','No payload differences from baseline.','muted'));
  for(const c of list){const row=node('div',undefined,'row');row.append(node('code',`${c.name}: ${c.changed} differing bytes · ${c.oldSize??'absent'} → ${c.newSize??'absent'} bytes`),button('View',()=>{if(!working.byName.has(c.name))return;selected=c.name;page=Math.floor((c.ranges[0]?.start||0)/256);$('offset').value='0x'+hex(c.ranges[0]?.start||0);render();readEditor();}));el.append(row);}}
function renderStaged(){const el=$('staged');el.replaceChildren();const list=dirty();if(!list.length){el.textContent='No edits staged.';return;}
  let shown=0;for(const c of list){const a=original.byName.get(c.name),b=working.byName.get(c.name);if(c.name==='GIFTIV'&&c.oldSize!==c.newSize){el.append(node('p',`GIFTIV: ${G.giftInfo(original)?.count} → ${G.giftInfo(working)?.count} entries. ${c.oldSize-c.newSize} bytes removed; retained entries are unchanged.`));continue;}for(const range of c.ranges){if(shown++>=100)continue;const end=Math.min(range.end,range.start+24),before=Array.from(original.bytes.slice(a.start+range.start,a.start+end),x=>hex(x)).join(' '),after=Array.from(working.bytes.slice(b.start+range.start,b.start+end),x=>hex(x)).join(' ');const row=node('div',undefined,'row');row.append(node('code',`${c.name} +0x${hex(range.start)} (${range.end-range.start} byte${range.end-range.start===1?'':'s'}): ${before} → ${after}${end<range.end?' …':''}`));el.append(row);}}
  if(shown>100)el.append(node('p',`${shown-100} more ranges; download the working copy for inspection.`));}
function displayTicketDate(raw){const iso=G.ticketDate(raw);if(!iso)return 'Unknown';return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZoneName:'short'}).format(new Date(iso));}
function renderGifts(){const el=$('gifts');el.replaceChildren();const info=working?G.giftInfo(working):null;$('giftCount').textContent=info?`(${info.count})`:'';if(!info){el.append(node('p','Load a supported save to inspect gift entries.','muted'));return;}
  const counts={};for(const e of info.entries){const star=G.ticketLabel(e.details).stars??'Unknown';counts[star]=(counts[star]||0)+1;}el.append(node('p',Object.entries(counts).map(([star,n])=>`${star}-star: ${n}`).join(' · '),'muted'));
  for(const entry of info.entries){const row=node('div',undefined,'row'),label=node('label',undefined,'inline'),check=node('input');check.type='checkbox';check.checked=giftSelection.has(entry.index);check.setAttribute('aria-label',`Select gift ${entry.index}`);check.onchange=()=>{if(check.checked)giftSelection.add(entry.index);else giftSelection.delete(entry.index);controls();};
    const d=entry.details,description=node('div'),kind=G.ticketLabel(d);description.append(node('strong',`#${entry.index} · ${kind.label} · quantity ${d?.count_??'?'}`),node('div',`${kind.confidence} · Roulette ID ${d?.ticket_?.rouletteid_??'?'}`,'muted'),node('div',`Item ${entry.id}`,'muted'),node('div',`Created: ${displayTicketDate(d?.createTime_)}`),node('div',`Expires: ${displayTicketDate(d?.expireTime_)}`),node('code',`Raw createTime_: ${d?.createTime_??'?'} · expireTime_: ${d?.expireTime_??'?'}`),node('div',`Message key: ${d?.msgkey_??'?'}`,'muted'));label.append(check,description);
    const details=node('details'),summary=node('summary','JSON & byte offset');details.append(summary,node('code',`GIFTIV +0x${hex(entry.offset)}`),node('pre',entry.raw||'JSON unsupported'));row.append(label,details);el.append(row);}
}
function render(){ $('source').textContent=working?`${source} · ${working.bytes.length.toLocaleString()} bytes · ${consoleSource?'console snapshot':'local inspection; console writing disabled'}`:'No save loaded';renderConfirmed();renderCards();renderRecords();renderHex();renderWatches();renderComparison();renderStaged();renderGifts();renderMenu();controls();}
$('loadConsole').onclick=()=>run(async()=>{if(!guardDiscard())return;await connect();message('Reading a stable save snapshot… Keep GT7 closed for offline image access.');const bytes=new Uint8Array(await(await request('/api/save')).arrayBuffer());setSave(bytes,'Console · '+new Date().toLocaleTimeString(),true);readEditor();message('Snapshot loaded. Change values in the game, let it save, then read again to compare against your baseline.');});
$('openFile').onchange=e=>run(async()=>{const f=e.target.files[0];if(f&&guardDiscard()){if(f.size>16*1024*1024)throw new Error('Open the extracted gt7save.bin, not the 10 GB download image.');setSave(new Uint8Array(await f.arrayBuffer()),f.name,false);readEditor();message('Local save loaded for inspection and export.');}e.target.value='';});
$('baselineFile').onchange=e=>run(async()=>{const f=e.target.files[0];if(f){if(f.size>16*1024*1024)throw new Error('Baseline must be an extracted save.');baseline=G.parse(await f.arrayBuffer());$('baselineStatus').textContent='Baseline: '+f.name;render();readEditor();}e.target.value='';});
$('baseline').onclick=()=>{baseline=clone(working);$('baselineStatus').textContent='Baseline: '+source+(dirty().length?' (staged working copy)':'');render();};
$('export').onclick=()=>download(working.bytes,`gt7save-${timestamp()}.bin`);
$('recordFilter').oninput=renderRecords;$('changedOnly').onchange=renderRecords;
$('previous').onclick=()=>{if(page>0)page--;renderHex();};$('next').onclick=()=>{page++;renderHex();};
$('nextDiff').onclick=()=>{const c=G.changes(baseline,working).find(x=>x.name===selected);if(c){const next=c.ranges.find(r=>r.start>=(page+1)*256)||c.ranges[0];page=Math.floor(next.start/256);$('offset').value='0x'+hex(next.start);renderHex();readEditor();}};
for(const id of ['offset','type','endian'])$(id).onchange=()=>{readEditor();if(id==='offset'){try{const off=G.offsetValue($('offset').value);page=Math.floor(off/256);}catch{}}renderHex();};
$('stage').onclick=()=>{try{const offset=G.offsetValue($('offset').value);if(selected==='GIFTIV')throw new Error('Use the gift inventory removal controls. Direct gift-byte editing is disabled.');G.write(working,selected,offset,$('type').value,$('endian').value,$('value').value);render();message('Edit staged in this browser only. Review it below before applying.');}catch(e){message(e.message,true);}};
$('addWatch').onclick=()=>{try{const type=$('type').value;if(type==='hex')throw new Error('Choose a numeric interpretation for a watch.');const offset=G.offsetValue($('offset').value);G.read(working,selected,offset,type,$('endian').value);const label=$('watchLabel').value.trim();if(!label)throw new Error('Give this watch a name.');watches.push({label,name:selected,offset,type,endian:$('endian').value});persistWatches();renderWatches();$('watchLabel').value='';}catch(e){message(e.message,true);}};
$('exportWatches').onclick=()=>download(JSON.stringify(watches,null,2),'gt7-watch-definitions.json','application/json');
$('discard').onclick=()=>{working=clone(original);giftSelection.clear();render();readEditor();message('Staged edits discarded.');};$('closed').onchange=controls;
$('apply').onclick=()=>run(async()=>{if(!consoleSource||!$('closed').checked||!dirty().length)throw new Error('Load a console snapshot, stage an edit, and close GT7 first.');
  message('Verifying snapshot, backing up, and applying edits. Keep GT7 closed…');const body=new Uint8Array(12+original.bytes.length+working.bytes.length);body.set([71,55,80,50]);const dv=new DataView(body.buffer);dv.setUint32(4,original.bytes.length,true);dv.setUint32(8,working.bytes.length,true);body.set(original.bytes,12);body.set(working.bytes,12+original.bytes.length);
  const result=await(await request('/api/apply-v2',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body})).json();original=clone(working);$('closed').checked=false;render();message(`Save written and editor mount released. Backup: ${result.backup}\nLaunch GT7 offline to test whether it accepts the edited values.`);
});
$('stageCredits').onclick=()=>{try{G.write(working,'PROGRESS',0x152,'u32','BE',$('creditsInput').value);render();message('Credit balance staged. Review and apply below with GT7 fully closed.');}catch(e){message(e.message,true);}};
$('saveCarName').onclick=()=>{const name=$('carName').value.trim();if(!name){message('Enter a name for this car.',true);return;}const id=G.read(working,'GARAGE',0x34,'u16','BE');carNames[id]=name;try{localStorage.setItem('gt7-car-names',JSON.stringify(carNames));}catch{message('Name is saved for this session only. Export labels to keep it.',true);}renderConfirmed();};
$('exportLabels').onclick=()=>download(JSON.stringify({version:1,carNames,watches},null,2),'gt7-labels-and-watches.json','application/json');
$('importLabels').onchange=e=>run(async()=>{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024)throw new Error('Label file too large.');const data=JSON.parse(await f.text());if(data.version!==1||!data.carNames||!Array.isArray(data.watches))throw new Error('Unsupported label file.');const labels={};for(const [id,name] of Object.entries(data.carNames)){if(!/^\d{1,5}$/.test(id)||Number(id)>65535||typeof name!=='string'||name.length>100)throw new Error('Invalid car label.');labels[id]=name;}for(const w of data.watches){if(typeof w.label!=='string'||typeof w.name!=='string'||!Number.isSafeInteger(w.offset)||w.offset<0||!G.specs[w.type]||!['BE','LE'].includes(w.endian))throw new Error('Invalid watch.');}Object.assign(carNames,labels);watches=data.watches;localStorage.setItem('gt7-car-names',JSON.stringify(carNames));persistWatches();render();e.target.value='';message('Labels and watches imported.');});
$('selectLatestGifts').onclick=()=>{const info=G.giftInfo(working);const times=info.entries.map(e=>e.details?.createTime_).filter(Number.isFinite);if(!times.length)return;const latest=Math.max(...times);giftSelection=new Set(info.entries.filter(e=>e.details?.createTime_===latest).map(e=>e.index));renderGifts();controls();};
$('selectDuplicateGifts').onclick=()=>{const info=G.giftInfo(working),seen=new Set();giftSelection.clear();for(const e of info.entries){const d=e.details;if(!d?.ticket_||d.ticket_.rouletteid_<0)continue;const key=JSON.stringify([d.ticket_.rouletteid_,d.msgkey_,d.count_,d.car_,d.parts_,d.tuner_]);if(seen.has(key))giftSelection.add(e.index);else seen.add(key);}renderGifts();controls();message('Repeated ticket types selected for review. These have distinct IDs/seeds and are not byte-identical duplicates.');};
$('clearGiftSelection').onclick=()=>{giftSelection.clear();renderGifts();controls();};
$('removeGifts').onclick=()=>{try{const count=giftSelection.size;working=G.removeGifts(working,[...giftSelection]);giftSelection.clear();render();message(`${count} gift removals staged. Retained entries and allocation counters stay unchanged. Test one removal before bulk cleanup.`);}catch(e){message(e.message,true);}};
$('exportGifts').onclick=()=>download(JSON.stringify(G.giftInfo(working),null,2),'gt7-gifts.json','application/json');
$('installShortcut').onclick=()=>run(async()=>{const result=await(await request('/api/install-shortcut',{method:'POST',body:''})).json();$('shortcutStatus').textContent=result.message;message(result.message);});
$('stopPayload').onclick=()=>run(async()=>{if(dirty().length&&!window.confirm('Stop the payload with unapplied edits? They will not be written.'))return;const result=await(await request('/api/stop',{method:'POST',body:''})).json();token='';$('connection').textContent='Payload stopped';message(result.message);});
$('stageScapes').onclick=()=>{try{if(dirty().length)throw new Error('Discard or finish other edits before this experiment.');working=G.scapesExperiment(working);render();message('Experimental Scapes state staged: five QUEST bytes only. Review below. Game acceptance and reward behaviour are not yet validated.');}catch(e){message(e.message,true);}};

render();run(async()=>{await connect();message('Connected. Read the console save, or open an extracted gt7save.bin to explore locally.');});
