require('dotenv').config({path:require('path').join(__dirname,'../../.env')});
const express=require('express'),cors=require('cors'),fs=require('fs'),path=require('path'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),multer=require('multer');
let ipfs;
const {ethers}=require('ethers');
const {v4:uuid}=require('uuid');
const app=express(); app.use(cors()); app.use(express.json({limit:'2mb'}));
const DB=path.join(__dirname,'../data.json');
const readDB=()=>fs.existsSync(DB)?JSON.parse(fs.readFileSync(DB,'utf8')):{users:[],files:[],events:[]};
const writeDB=d=>fs.writeFileSync(DB,JSON.stringify(d,null,2));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024}});

async function initIPFS(){
  const {create}=await import('ipfs-http-client');
  ipfs=create({url:process.env.IPFS_API||'http://127.0.0.1:5001/api/v0'});
}
initIPFS().catch(err=>console.error('Failed to init IPFS client:', err.message));

let provider,contract,signer;
function initChain(){
  if(!process.env.CONTRACT_ADDRESS)return;
  provider=new ethers.JsonRpcProvider(process.env.RPC_URL||'http://127.0.0.1:8545');
  const abi=['function registerFile(string,string,string,uint256) returns (uint256)','function deleteFile(uint256)','function getOwnerFiles(address) view returns (uint256[])'];
  signer=process.env.BLOCKCHAIN_PRIVATE_KEY?new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY,provider):null; contract=new ethers.Contract(process.env.CONTRACT_ADDRESS,abi,signer||provider);
}
initChain();
const auth=(req,res,next)=>{try{req.user=jwt.verify((req.headers.authorization||'').replace('Bearer ',''),process.env.JWT_SECRET||'dev-secret');next()}catch{return res.status(401).json({error:'Unauthorized'})}};
app.get('/api/health',async(req,res)=>{let ipfsOk=false;try{if(ipfs){const v=await ipfs.version();ipfsOk=!!v}}catch{}res.json({ok:true,ipfs:ipfsOk,blockchain:!!contract})});
app.post('/api/auth/register',async(req,res)=>{const {username,password}=req.body||{};if(!username||!password||username.length<3||password.length<6)return res.status(400).json({error:'Username 3+ and password 6+'});let d=readDB();if(d.users.some(x=>x.username===username.toLowerCase()))return res.status(409).json({error:'Username already exists'});d.users.push({id:uuid(),username:username.toLowerCase(),password:await bcrypt.hash(password,12),createdAt:Date.now()});writeDB(d);res.json({message:'Account created'});});
app.post('/api/auth/login',async(req,res)=>{const {username,password}=req.body||{},d=readDB(),u=d.users.find(x=>x.username===String(username||'').toLowerCase());if(!u||!(await bcrypt.compare(password||'',u.password)))return res.status(401).json({error:'Invalid credentials'});res.json({token:jwt.sign({id:u.id,username:u.username},process.env.JWT_SECRET||'dev-secret',{expiresIn:'8h'}),username:u.username});});
app.post('/api/ipfs/add',auth,upload.single('file'),async(req,res)=>{if(!req.file)return res.status(400).json({error:'file required'});try{const r=await ipfs.add(req.file.buffer,{pin:true});res.json({cid:r.cid.toString(),size:r.size||req.file.size});}catch(e){res.status(503).json({error:'IPFS unavailable',detail:e.message})}});
app.post('/api/ipfs/add-json',auth,async(req,res)=>{try{const r=await ipfs.add(JSON.stringify(req.body),{pin:true});res.json({cid:r.cid.toString()})}catch(e){res.status(503).json({error:'IPFS unavailable',detail:e.message})}});
app.get('/api/ipfs/:cid',async(req,res)=>{try{const chunks=[];for await(const c of ipfs.cat(req.params.cid))chunks.push(c);res.send(Buffer.concat(chunks))}catch(e){res.status(404).json({error:'CID not found'})}});
app.post('/api/files',auth,async(req,res)=>{const {rootCid,name,mimeType,size,metadataCid,txHash}=req.body||{};if(!rootCid||!name)return res.status(400).json({error:'rootCid and name required'});let d=readDB();let chainTx=txHash||null;if(signer){try{const tx=await contract.registerFile(rootCid,name,mimeType||'application/octet-stream',Number(size||0));chainTx=tx.hash;await tx.wait()}catch(e){return res.status(502).json({error:'Blockchain transaction failed',detail:e.message})}}const f={id:uuid(),owner:req.user.username,rootCid,name,mimeType:mimeType||'application/octet-stream',size:Number(size||0),metadataCid:metadataCid||null,txHash:chainTx,createdAt:Date.now(),sharedWith:[]};d.files.push(f);d.events.push({type:'UPLOAD',fileId:f.id,by:req.user.username,txHash:f.txHash,at:Date.now()});writeDB(d);res.json(f)});
app.get('/api/files',auth,(req,res)=>{const d=readDB();res.json(d.files.filter(f=>f.owner===req.user.username||f.sharedWith.includes(req.user.username)))});
app.post('/api/files/:id/share',auth,(req,res)=>{const d=readDB(),f=d.files.find(x=>x.id===req.params.id);if(!f||f.owner!==req.user.username)return res.status(404).json({error:'File not found'});const u=String(req.body.username||'').toLowerCase();if(!d.users.some(x=>x.username===u))return res.status(404).json({error:'User not found'});if(!f.sharedWith.includes(u))f.sharedWith.push(u);d.events.push({type:'SHARE',fileId:f.id,from:req.user.username,to:u,at:Date.now()});writeDB(d);res.json(f)});
app.get('/api/events',auth,(req,res)=>res.json(readDB().events.slice(-100).reverse()));
app.delete('/api/files/:id',auth,async(req,res)=>{const d=readDB(),f=d.files.find(x=>x.id===req.params.id);if(!f||f.owner!==req.user.username)return res.status(404).json({error:'File not found'});f.deleted=true;d.events.push({type:'DELETE',fileId:f.id,by:req.user.username,at:Date.now()});writeDB(d);res.json({ok:true})});
app.listen(process.env.PORT||4000,()=>console.log(`OrioVault backend running on http://localhost:${process.env.PORT||4000}`));
