# oriovault
storage system 
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>OrioVault: Decentralized File Storage</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
:root{--bg:#eef2f3;--panel:#fff;--ink:#0f1c24;--mute:#5b6b75;--line:#d5dde1;--acc:#0a6b62;--accfg:#fff;--warn:#c2410c;--bad:#b91c1c;--hero:#0c2a2e;
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0d161b;--panel:#14212a;--ink:#e6eef2;--mute:#8fa3ae;--line:#25363f;--acc:#3fc1b0;--accfg:#06201c;--hero:#081a1d}}
:root[data-theme="dark"]{--bg:#0d161b;--panel:#14212a;--ink:#e6eef2;--mute:#8fa3ae;--line:#25363f;--acc:#3fc1b0;--accfg:#06201c;--hero:#081a1d}
*{box-sizing:border-box}html,body{margin:0}html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{background:var(--bg);color:var(--ink);font:16px/1.5 'Space Grotesk',system-ui,sans-serif}
button,input{font:inherit;color:inherit}
.mono,code{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.8rem}
button{cursor:pointer;border:1px solid var(--line);background:var(--panel);padding:.5rem .9rem;border-radius:6px}
button.pri{background:var(--acc);color:var(--accfg);border-color:var(--acc);font-weight:500}
button.danger{color:var(--bad)}button:focus-visible,input:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
input{width:100%;padding:.6rem .75rem;border:1px solid var(--line);border-radius:6px;background:var(--panel)}
label{display:block;font-size:.9rem;color:var(--mute);margin:.9rem 0 .25rem}
.login{min-height:100vh;display:grid;grid-template-columns:1.1fr 1fr}
.hero{background:var(--hero);color:#e6f4f1;padding:3rem;display:flex;flex-direction:column;justify-content:center;gap:2rem}
.hero h1{font-size:clamp(2rem,4vw,3.2rem);line-height:1.05;margin:0;max-width:14ch}
.hero p{max-width:40ch;color:#a9c5c1;margin:0}
.chain{display:flex;flex-direction:column;gap:0}
.blk{border:1px solid #2f5b5a;padding:.6rem .8rem;border-radius:4px;background:#0f3438;max-width:22rem}
.blk small{display:block;color:#7fb3ac}.link{width:1px;height:14px;background:#3fc1b0;margin-left:1.5rem}
.formwrap{display:flex;align-items:center;justify-content:center;padding:2rem}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:1.4rem}
.formwrap .card{width:100%;max-width:24rem}
.tabs2{display:flex;gap:1rem;margin-bottom:.5rem}.tabs2 button{border:0;background:none;padding:.3rem 0;border-radius:0;color:var(--mute)}
.tabs2 button.on{color:var(--ink);border-bottom:2px solid var(--acc)}
.err{color:var(--bad);font-size:.9rem;min-height:1.3em;margin:.6rem 0 0}
header{display:flex;align-items:center;gap:1rem;padding:.8rem 1.2rem;background:var(--panel);border-bottom:1px solid var(--line);flex-wrap:wrap;position:sticky;top:env(safe-area-inset-top,0px);z-index:2}
header b{font-size:1.15rem;margin-right:.5rem}
nav{display:flex;gap:.25rem;flex:1;flex-wrap:wrap}nav button{border:0;background:none}nav button.on{background:var(--bg);font-weight:700}
main{max-width:62rem;margin:0 auto;padding:1.4rem 1.2rem 4rem}
h2{margin:.2rem 0 1rem}
.file{margin-bottom:1rem}.file h3{margin:0;font-size:1.05rem;word-break:break-all}
.meta{color:var(--mute);font-size:.85rem;margin:.2rem 0 .6rem}
.chips{display:flex;flex-wrap:wrap;gap:.35rem;margin:.6rem 0}
.chip{border:1px solid var(--line);border-radius:4px;padding:.1rem .4rem;background:var(--bg)}
.row{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.6rem}
.prev{margin-top:.8rem;border-top:1px dashed var(--line);padding-top:.8rem}.prev img{max-width:100%;max-height:22rem;border-radius:6px}
pre{white-space:pre-wrap;word-break:break-word;margin:0;max-height:16rem;overflow:auto}
.ledger{overflow-x:auto}.b{border-left:3px solid var(--acc);padding:.4rem .8rem;margin:0 0 .6rem;background:var(--panel)}
.b span{word-break:break-all}.ok{color:var(--acc)}.bad{color:var(--bad)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1rem}
.ov{position:fixed;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:1rem;z-index:5}.md{background:var(--panel);padding:1.2rem;border-radius:10px;width:100%;max-width:22rem}
.toast{position:fixed;left:50%;bottom:calc(1rem + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:.6rem 1rem;border-radius:6px;z-index:6;max-width:90vw}
.drop{position:relative;border:2px dashed var(--line);border-radius:8px;padding:1.6rem 1rem;text-align:center;color:var(--mute);background:var(--panel)}
.drop.on{border-color:var(--acc);color:var(--ink)}.drop input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;padding:0;border:0}
textarea{width:100%;padding:.6rem .75rem;border:1px solid var(--line);border-radius:6px;background:var(--panel);font:inherit;color:inherit}
.empty{color:var(--mute);text-align:center;padding:2rem}
@media(max-width:760px){.login{grid-template-columns:1fr}.hero{padding:2rem 1.4rem}}
</style>
</head>
<body>
<div id="app"></div>
<script>
const $=s=>document.querySelector(s),app=$('#app'),TE=new TextEncoder(),mem={};
const ls={get(k,d){let v=null;try{v=localStorage.getItem(k)}catch(e){}return v?JSON.parse(v):(mem[k]??d)},set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const unhex=h=>new Uint8Array(h.match(/../g).map(x=>parseInt(x,16)));
const sha=async d=>hex(await crypto.subtle.digest('SHA-256',typeof d==='string'?TE.encode(d):d));
const sz=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB';
const N=6,CH=262144;
let me=ls.get('session',null),view='vault',mode='in',prev={};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)}
function ask(label,type='password'){return new Promise(r=>{const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="md"><p>${esc(label)}</p><input type="${type}" aria-label="${esc(label)}"><div class="row"><button class="ghost">Cancel</button><button class="pri">OK</button></div></div>`;document.body.append(o);const i=o.querySelector('input');i.focus();const d=v=>{o.remove();r(v)};o.querySelector('.ghost').onclick=()=>d(null);o.querySelector('.pri').onclick=()=>d(i.value);i.onkeydown=e=>{if(e.key==='Enter')d(i.value)}})}
/* chunk store (stands in for IPFS nodes N1..N6) */
const db=new Promise((res,rej)=>{const r=indexedDB.open('oriovault',1);r.onupgradeneeded=()=>r.result.createObjectStore('c');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idb=async(m,fn)=>{const d=await db;return new Promise((res,rej)=>{const t=d.transaction('c',m),q=fn(t.objectStore('c'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})};
/* ledger (hash-chained blocks, stands in for Ganache) */
async function addBlock(type,data){const L=ls.get('ledger',[]),p=L.length?L[L.length-1].hash:'0'.repeat(64),b={i:L.length,t:Date.now(),type,data,prev:p};b.hash=await sha(JSON.stringify([b.i,b.t,b.type,b.data,b.prev]));L.push(b);ls.set('ledger',L)}
async function chainOk(){const L=ls.get('ledger',[]);for(let i=0;i<L.length;i++){const b=L[i];if(b.prev!==(i?L[i-1].hash:'0'.repeat(64)))return i;if(b.hash!==await sha(JSON.stringify([b.i,b.t,b.type,b.data,b.prev])))return i}return -1}
/* auth (PBKDF2 password hashing) */
async function pwh(pw,salt){const m=await crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:100000,hash:'SHA-256'},m,256))}
async function auth(e){e.preventDefault();const f=e.target,u=f.u.value.trim().toLowerCase(),p=f.p.value,er=$('.err'),U=ls.get('users',{});
 if(mode==='up'){if(u.length<3||p.length<6){er.textContent='Use a username of 3+ characters and a password of 6+ characters.';return}
  if(U[u]){er.textContent='That username is taken. Choose another or sign in.';return}
  const salt=hex(crypto.getRandomValues(new Uint8Array(16)));U[u]={salt,hash:await pwh(p,salt)};ls.set('users',U);await addBlock('REGISTER',u)}
 else if(!U[u]||U[u].hash!==await pwh(p,U[u].salt)){er.textContent='Username or password is incorrect.';return}
 me=u;ls.set('session',me);view='vault';render()}
/* file operations */
async function key(pw,salt){const m=await crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
let picked=null;
function pick(f){picked=f||null;const fn=$('#fn');if(fn)fn.textContent=f?`${f.name} (${sz(f.size)})`:'Tap here to choose a file, or drop one';const d=$('#dz');if(d)d.classList.toggle('on',!!f)}
document.addEventListener('change',e=>{if(e.target.id==='f')pick(e.target.files[0])});
document.addEventListener('dragover',e=>{if(e.target.closest&&e.target.closest('#dz'))e.preventDefault()});
document.addEventListener('drop',e=>{if(e.target.closest&&e.target.closest('#dz')){e.preventDefault();pick(e.dataTransfer.files[0])}});
async function upload(e){e.preventDefault();const note=e.target.n.value.trim(),f=picked||e.target.f.files[0]||(note?new File([note],'note-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.txt',{type:'text/plain'}):null),p=e.target.p.value,st=$('#st');
 if(!f){st.textContent='Choose a file or type a note first.';return}if(p.length<6){st.textContent='Passphrase needs 6+ characters.';return}
 if(f.size>20971520){st.textContent='Files up to 20 MB are supported in this demo.';return}
 try{const salt=crypto.getRandomValues(new Uint8Array(16)),k=await key(p,salt),buf=await f.arrayBuffer(),chunks=[];
  for(let n=0;n===0||n*CH<buf.byteLength;n++){st.textContent=`Encrypting and storing chunk ${n+1}…`;
   const iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,buf.slice(n*CH,(n+1)*CH))),o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);
   const cid='Qm'+(await sha(o)).slice(0,44),node='N'+(n%N+1);await idb('readwrite',s=>s.put({node,data:o.buffer},cid));chunks.push({cid,node})}
  const root='Qm'+(await sha(chunks.map(c=>c.cid).join())).slice(0,44),F=ls.get('files',[]);
  F.push({id:root,name:f.name,size:f.size,type:f.type,owner:me,salt:hex(salt),chunks,root,t:Date.now(),shared:[]});ls.set('files',F);
  await addBlock('UPLOAD',{root,by:me,name:f.name});toast('Stored. The root hash is on the ledger.');picked=null;view='vault';render()}
 catch(x){st.textContent='Upload failed: '+x.message}}
const mine=()=>ls.get('files',[]).filter(f=>f.owner===me||f.shared.includes(me));
async function act(a,id){const F=ls.get('files',[]),f=F.find(x=>x.id===id);if(!f)return;
 if(a==='open'){const p=await ask('Passphrase for '+f.name);if(!p)return;
  try{const k=await key(p,unhex(f.salt)),parts=[];for(const c of f.chunks){const r=await idb('readonly',s=>s.get(c.cid));if(!r)throw Error('chunk missing on '+c.node);const d=new Uint8Array(r.data);parts.push(new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:d.slice(0,12)},k,d.slice(12))))}
   const blob=new Blob(parts,{type:f.type});await addBlock('ACCESS',{root:f.root,by:me});
   prev[id]=f.type.startsWith('image/')?{k:'img',v:URL.createObjectURL(blob)}:/text|json|csv/.test(f.type)||/\.(txt|md|csv|json)$/i.test(f.name)?{k:'txt',v:(await blob.text()).slice(0,3000)}:{k:'bin',v:`Decrypted ${sz(blob.size)} successfully. SHA-256 ${await sha(await blob.arrayBuffer())}`};render()}
  catch(x){toast(x.name==='OperationError'?'Wrong passphrase, or a chunk was tampered with.':'Open failed: '+x.message)}}
 if(a==='verify'){let bad=0;for(const c of f.chunks){const r=await idb('readonly',s=>s.get(c.cid));if(!r||'Qm'+(await sha(new Uint8Array(r.data))).slice(0,44)!==c.cid)bad++}
  const ok=!bad&&'Qm'+(await sha(f.chunks.map(c=>c.cid).join())).slice(0,44)===f.root;await addBlock('VERIFY',{root:f.root,ok,by:me});toast(ok?'Verified: every chunk matches its hash.':`Verification failed: ${bad} chunk(s) changed or missing.`)}
 if(a==='share'){if(f.owner!==me)return;const u=(await ask('Share with which username?','text')||'').trim().toLowerCase();if(!u)return;
  if(!ls.get('users',{})[u]){toast('No user named "'+u+'".');return}if(u===me||f.shared.includes(u)){toast('Already has access.');return}
  f.shared.push(u);ls.set('files',F);await addBlock('SHARE',{root:f.root,from:me,to:u});toast(`Shared with ${u}. Tell them the passphrase separately.`);render()}
 if(a==='del'){if(f.owner!==me||!confirm('Delete this file and its chunks?'))return;for(const c of f.chunks)await idb('readwrite',s=>s.delete(c.cid));ls.set('files',F.filter(x=>x.id!==id));await addBlock('DELETE',{root:f.root,by:me});render()}}
/* views */
const V={
vault(){const L=mine();return `<h2>Your vault</h2>`+(L.length?L.map(f=>{const p=prev[f.id];return `<div class="card file"><h3>${esc(f.name)}</h3>
<div class="meta">${sz(f.size)} · ${f.owner===me?'owned by you':'shared by '+esc(f.owner)}${f.shared.length?' · shared with '+f.shared.map(esc).join(', '):''} · ${new Date(f.t).toLocaleString()}</div>
<div class="mono" style="word-break:break-all">root ${f.root}</div>
<div class="chips">${f.chunks.map((c,i)=>`<span class="chip mono" title="${c.cid}">#${i+1} → ${c.node}</span>`).join('')}</div>
<div class="row"><button class="pri" data-a="open" data-id="${f.id}">Decrypt and preview</button><button data-a="verify" data-id="${f.id}">Verify integrity</button>${f.owner===me?`<button data-a="share" data-id="${f.id}">Share</button><button class="danger" data-a="del" data-id="${f.id}">Delete</button>`:''}</div>
${p?`<div class="prev">${p.k==='img'?`<img src="${p.v}" alt="Decrypted preview">`:`<pre class="${p.k==='bin'?'mono':''}">${esc(p.v)}</pre>`}</div>`:''}</div>`}).join(''):`<div class="card empty">Nothing here yet. Upload a file and it will be encrypted, split into chunks and spread across ${N} nodes.</div>`)},
upload(){return `<h2>Upload a file</h2><form class="card" id="up" style="max-width:32rem"><label>File (up to 20 MB)</label><div class="drop" id="dz"><span id="fn">Tap here to choose a file, or drop one</span><input id="f" name="f" type="file" aria-label="Choose a file"></div><label for="n">Or type a text note to store instead</label><textarea id="n" name="n" rows="3" placeholder="Paste or write text here"></textarea><label for="p">Passphrase (you need it to open the file, and it is never stored)</label><input id="p" name="p" type="password" autocomplete="new-password"><div class="row"><button class="pri">Encrypt and store</button></div><p class="err" id="st" role="status"></p></form>
<p class="meta" style="max-width:38rem">Each 256 KB chunk is encrypted with AES-256-GCM, named by the SHA-256 of its ciphertext (like an IPFS content ID), and placed on nodes N1 to N${N} in turn. The root hash is written to the ledger.</p>`},
ledger(){const L=ls.get('ledger',[]);return `<h2>Ledger</h2><div class="row" style="margin:0 0 1rem"><button class="pri" data-a="chain">Check chain integrity</button><span id="cs" role="status"></span></div><div class="ledger">`+L.slice().reverse().map(b=>`<div class="b"><b>#${b.i} ${b.type}</b> <span class="meta">${new Date(b.t).toLocaleString()}</span><div class="mono"><span>${esc(JSON.stringify(b.data))}</span></div><div class="mono meta"><span>prev ${b.prev.slice(0,16)}…</span> <span>hash ${b.hash.slice(0,16)}…</span></div></div>`).join('')+`</div>`},
team(){const T=[['AKASH SINGH','1EP22IS113','Frontend and UI','React screens, wallet connection, upload and verify flows'],['HARSHITH N','1EP22IS110','Backend and integration','REST APIs, JWT login, metadata database, IPFS and chain wiring'],['AKASH SINGH','1EP22IS079','Blockchain and IPFS','Solidity contracts, Truffle and Ganache, IPFS node'],['HARSHITH N','1EP22IS103','Security and testing','AES encryption, file fragmentation, test cases']];
return `<h2>Project team</h2><p class="meta">Decentralized File Storage System on Blockchain (BIS786), guided by TR.GAYATRI, EPCET, 2025-26.</p><div class="grid">`+T.map(t=>`<div class="card"><h3 style="margin:0">${t[0]}</h3><div class="meta mono">${t[1]}</div><b>${t[2]}</b><p class="meta">${t[3]}</p></div>`).join('')+`</div>`}};
function render(){
 if(!me){app.innerHTML=`<div class="login"><section class="hero"><div><h1>Files that no single server owns</h1></div><p>Encrypt in your browser, split into chunks, spread across nodes, and record every action on a tamper-evident ledger.</p><div class="chain" aria-hidden="true"><div class="blk mono">Block 2<small>prev 9f3a…c1 → hash 41be…07</small></div><div class="link"></div><div class="blk mono">Block 1<small>prev 0000…00 → hash 9f3a…c1</small></div></div></section>
<section class="formwrap"><form class="card" id="au"><div class="tabs2"><button type="button" data-m="in" class="${mode==='in'?'on':''}">Sign in</button><button type="button" data-m="up" class="${mode==='up'?'on':''}">Create account</button></div>
<label for="u">Username</label><input id="u" name="u" autocomplete="username"><label for="p">Password</label><input id="p" name="p" type="password" autocomplete="${mode==='in'?'current-password':'new-password'}"><p class="err" role="alert"></p><div class="row"><button class="pri" style="width:100%">${mode==='in'?'Sign in':'Create account'}</button></div><p class="meta">Accounts live in this browser only.</p></form></section></div>`;$('#au').onsubmit=auth;return}
 app.innerHTML=`<header><b>OrioVault</b><nav>${['vault','upload','ledger','team'].map(v=>`<button data-v="${v}" class="${view===v?'on':''}">${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</nav><span class="meta">${esc(me)}</span><button data-a="out">Sign out</button></header><main>${V[view]()}</main>`;
 const u=$('#up');if(u)u.onsubmit=upload}
document.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.m){mode=d.m;render()}else if(d.v){view=d.v;picked=null;render()}else if(d.a==='out'){me=null;ls.set('session',null);render()}
 else if(d.a==='chain'){const r=await chainOk();$('#cs').innerHTML=r<0?'<span class="ok">Chain is intact.</span>':`<span class="bad">Block #${r} does not match its hash.</span>`}
 else if(d.a)act(d.a,d.id)});
render();
</script>
</body>
</html>
