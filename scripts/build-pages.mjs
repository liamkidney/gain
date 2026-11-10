import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const channel=process.env.CHANNEL==='dev'?'dev':'prod';
const base=process.env.BASE_PATH||`/gain/${channel==='dev'?'dev/':''}`;
const out=path.resolve(process.env.OUTPUT||`dist/${channel}`);
const source=path.resolve(process.env.SOURCE||'app');
let revision=process.env.REVISION;
if(!revision)try{revision=execFileSync('git',['rev-parse','--short=8','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{revision='local';}
if(!/^\/[a-z0-9/-]+\/$/.test(base))throw Error('BASE_PATH must be a safe absolute directory path.');
function cp(s,d){fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(s,d);}
function walk(s,d){for(const ent of fs.readdirSync(s,{withFileTypes:true})){if(ent.isDirectory())walk(path.join(s,ent.name),path.join(d,ent.name));else cp(path.join(s,ent.name),path.join(d,ent.name));}}
fs.rmSync(out,{recursive:true,force:true});walk(source,out);
const color=channel==='dev'?'#2457ad':'#b53347';
const name=channel==='dev'?'Gain Dev':'Gain';
const html=fs.readFileSync(path.join(out,'index.html'),'utf8')
  .replaceAll('__THEME_COLOR__','#ffffff').replaceAll('__APP_NAME__',name)
  .replaceAll('__REVISION__',revision).replaceAll('__CHANNEL__',channel).replaceAll('__BASE_PATH__',base);
fs.writeFileSync(path.join(out,'index.html'),html);
const sw=fs.readFileSync(path.join(out,'sw.js'),'utf8').replaceAll('__REVISION__',revision).replaceAll('__CHANNEL__',channel).replaceAll('__BASE_PATH__',base);
fs.writeFileSync(path.join(out,'sw.js'),sw);
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name,short_name:name,id:base,scope:'./',start_url:'./',display:'standalone',background_color:'#ffffff',theme_color:'#ffffff',icons:[{src:'./icon-192.png',sizes:'192x192',type:'image/png'},{src:'./icon-512.png',sizes:'512x512',type:'image/png'}]},null,2));
const iconSrc=fs.readFileSync(path.join(source,'assets','icon.svg'),'utf8');
fs.writeFileSync(path.join(out,'favicon.svg'),iconSrc.replaceAll('#ACCENT#',color));
for(const [input,output] of [['32','favicon-32.png'],['180','apple-touch-icon.png'],['192','icon-192.png'],['512','icon-512.png']]) cp(path.join(source,'assets',`icon-${channel}-${input}.png`),path.join(out,output));
fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({channel,revision,base,generatedAt:new Date().toISOString()},null,2));
for(const f of ['index.html','sw.js','favicon.svg','favicon-32.png','apple-touch-icon.png','icon-192.png','icon-512.png','manifest.webmanifest','src/app.js','style.css']){if(!fs.existsSync(path.join(out,f)))throw Error(`Missing output ${f}`);}
console.log(`${channel} ${revision} => ${out} (${base})`);
