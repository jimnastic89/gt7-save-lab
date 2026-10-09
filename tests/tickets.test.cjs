const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),G=require('../web/core.js');
const dir=path.resolve(__dirname,'../live_snapshots'),file=fs.readdirSync(dir).find(n=>n.endsWith('menu10-claimed-next-not-started.bin'));
const s=G.parse(fs.readFileSync(path.join(dir,file))),entries=G.giftInfo(s).entries,counts={};
for(const e of entries){const stars=G.ticketLabel(e.details).stars;counts[stars]=(counts[stars]||0)+1;}
assert.deepEqual(counts,{1:12,2:7,3:7,4:7,5:8,6:28});
assert.equal(entries.filter(e=>G.ticketLabel(e.details).label==='6-star · prize car only').length,7);
assert.equal(G.ticketDate(212660824448),'2026-11-07T15:14:08.000Z');
assert.equal(G.ticketDate(null),null);assert.equal(G.ticketLabel({ticket_:{rouletteid_:999}}).stars,null);
const m=G.menuInfo(s);assert.equal(m.claimed,9);assert.equal(m.pending,0);assert.equal(m.active,0);
console.log('PASS: 69-ticket census, confirmed car-only key, inferred date conversion, unknown types, post-Book10 marker correction');
