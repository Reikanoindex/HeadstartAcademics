// Local-only adapter for the built Worker; never deploy this Node server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import worker from '../dist/server/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDirectory=path.join(root,'.local-data');
fs.mkdirSync(dataDirectory,{recursive:true});

// Small filesystem implementation of the R2 calls used by this application.
// Conditional writes are synchronous inside one Node process to avoid lost updates.
class LocalBucket {
  filename(key){return path.join(dataDirectory,createHash('sha256').update(key).digest('hex')+'.json');}
  read(key){const file=this.filename(key);return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;}
  async get(key){const object=this.read(key);if(!object)return null;const bytes=Buffer.from(object.data,'base64');return {etag:object.etag,body:bytes,json:async()=>JSON.parse(bytes.toString('utf8'))};}
  async put(key,value,options={}){const previous=this.read(key);if(options.onlyIf?.etagMatches&&previous?.etag!==options.onlyIf.etagMatches)return null;if(options.onlyIf?.etagDoesNotMatch==='*'&&previous)return null;const etag=randomUUID(),file=this.filename(key),temporary=file+'.tmp';const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(value);fs.writeFileSync(temporary,JSON.stringify({etag,data:bytes.toString('base64')}),{mode:0o600});fs.renameSync(temporary,file);return {etag};}
  async delete(key){const file=this.filename(key);if(fs.existsSync(file))fs.unlinkSync(file);}
}

const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be an integer between 1024 and 65535.');
const env={BUCKET:new LocalBucket(),FIRST_ADMIN_EMAIL:process.env.FIRST_ADMIN_EMAIL||'unconfigured@example.invalid',RESEND_API_KEY:process.env.RESEND_API_KEY||'',EMAIL_FROM:process.env.EMAIL_FROM||''};
const origin=`http://localhost:${port}`;
const server=http.createServer(async(req,res)=>{try{
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>6*1024*1024){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
  const headers=new Headers();
  for(const [name,value]of Object.entries(req.headers)){
    // Production identity headers must come only from the trusted hosting proxy.
    if(name.startsWith('oai-authenticated-')||name==='host')continue;
    if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(', '):value);
  }
  const request=new Request(new URL(req.url,origin),{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const response=await worker.fetch(request,env);
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}catch(error){console.error('Local request failed:',error.message);res.writeHead(500,{'Content-Type':'text/plain'});res.end('Local service unavailable. Check the terminal.');}});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Set PORT to another value in .env.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{console.log(`Headstart Academics: ${origin}`);console.log('Local development only. Data stays in ignored .local-data/.');console.log('Owner verification is supplied by Sites in production; this server does not impersonate an administrator.');});
process.on('SIGINT',()=>server.close());
process.on('SIGTERM',()=>server.close());
