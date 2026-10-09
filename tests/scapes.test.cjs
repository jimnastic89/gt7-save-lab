const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),G=require('../web/core.js');
const dir=path.resolve(__dirname,'../live_snapshots');
function load(label){return G.parse(fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(n=>n.endsWith(label+'.bin')))));}
const s=load('book16-scapes-active-restored-save'),original=Buffer.from(s.bytes),edited=G.scapesExperiment(s);
assert.deepEqual(Buffer.from(s.bytes),original);
const changes=G.changes(s,edited);assert.equal(changes.length,1);assert.equal(changes[0].name,'QUEST');assert.equal(changes[0].changed,5);assert.equal(s.bytes.length,edited.bytes.length);
assert.equal(G.questEntries(edited).find(e=>e.id===625).stage,3);
assert.throws(()=>G.scapesExperiment(edited));assert.throws(()=>G.scapesExperiment(load('menu10-started-no-other-actions')));
for(const [before,after,id] of [['menu09-before-tokyo-highway-parade','menu09-completed-before-prize',619],['menu10-silvia-acquired-first-10000cr','menu10-corolla-completed-before-prize',602]]){
 const a=load(before),b=load(after),ea=G.questEntries(a).find(e=>e.id===id),eb=G.questEntries(b).find(e=>e.id===id);
 for(const [off,pre,post] of [[85,0,2],[89,2,3],[107,1,2],[345,1,3]]){assert.equal(G.read(a,'QUEST',ea.offset+off,'u8'),String(pre));assert.equal(G.read(b,'QUEST',eb.offset+off,'u8'),String(post));}
}
const bad=G.parse(s.bytes);G.write(bad,'QUEST',96+4,'u32','BE','7');assert.equal(G.questEntries(bad),null);assert.throws(()=>G.scapesExperiment(bad));
const report={source:'20261008T231532.935365Z-book16-scapes-active-restored-save.bin',status:'Experimental; not applied to console',questId:625,slot:4,changes:changes[0].ranges.map(r=>({payloadOffset:'0x'+r.start.toString(16),before:G.read(s,'QUEST',r.start,'u8'),after:G.read(edited,'QUEST',r.start,'u8')}))};
fs.writeFileSync(path.join(dir,'scapes-experiment-plan.json'),JSON.stringify(report,null,2));
console.log('PASS: five-byte-only edit, source preserved, natural completion evidence, malformed/missing/already-completed rejection');
