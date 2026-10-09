const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),G=require('../web/core.js');
const dir=path.resolve(__dirname,'../live_snapshots');
const load=label=>G.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(n=>n.endsWith(label+'.bin')))));
const cases=[['menu09-completed-before-prize',8,0,1,619],['menu09-prize-claimed-book10-not-started',9,0,0,null],['menu10-started-no-other-actions',9,1,0,602],['menu10-objectives-viewed-mazda-acquired',9,1,0,602],['menu10-silvia-acquired-first-10000cr',9,1,0,602],['menu10-corolla-completed-before-prize',9,0,1,602]];
for(const [label,claimed,active,pending,id] of cases){const s=load(label),m=G.menuInfo(s);assert.ok(m,label);assert.deepEqual([m.claimed,m.active,m.pending,m.id],[claimed,active,pending,id],label);}
const s=load('menu10-corolla-completed-before-prize');assert.equal(G.menuInfo(s).mapped.number,10);
const removed=G.removeGifts(s,[0,68]);assert.equal(G.giftInfo(removed).count,67);assert.deepEqual(G.menuInfo(removed),G.menuInfo(s));assert.equal(G.read(removed,'PROGRESS',0x152,'u32'),'63250');
G.write(s,'QUEST',0x56,'u32','BE','123456');assert.equal(G.menuInfo(s).mapped,null);
G.write(s,'PROGRESS',0x135,'u8','BE','1');assert.equal(G.menuInfo(s),null);
console.log('PASS: six observed menu transitions, unknown IDs, contradictory flags, progression preserved through gift removal');
