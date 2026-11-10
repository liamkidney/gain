import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'dist/dev');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const port=Number(process.env.PORT)||4173;
http.createServer((req,res)=>{const request=new URL(req.url,'http://localhost');const p=path.resolve(root,'.'+decodeURIComponent(request.pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return;}let file=p;if(fs.existsSync(p)&&fs.statSync(p).isDirectory())file=path.join(p,'index.html');fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(data);});}).listen(port,()=>console.log(`Gain running at http://localhost:${port}`));
