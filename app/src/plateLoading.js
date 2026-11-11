/**
 * Symmetric loading for a standard 20 kg Olympic bar.
 * Counts are PER SLEEVE, not totals for the whole bar.
 * Plate colours in the drawing are schematic; actual gym colours vary.
 */
export const DEFAULT_BAR_KG=20;
export const STANDARD_PLATE_KG=Object.freeze([25,20,15,10,5,2.5,1.25]);
const PALETTE=Object.freeze({
  25:{fill:'#D85757',text:'#FFFFFF'},
  20:{fill:'#457EC0',text:'#FFFFFF'},
  15:{fill:'#E9C453',text:'#252A2A'},
  10:{fill:'#4E996E',text:'#FFFFFF'},
  5:{fill:'#E6E9E5',text:'#252A2A'},
  2.5:{fill:'#929CA3',text:'#171A1A'},
  1.25:{fill:'#C8AA88',text:'#171A1A'}
});
const LABEL=n=>Number(n).toLocaleString('en-GB',{maximumFractionDigits:3});
const grams=n=>Math.round(n*1000);

export function calculatePlateLoading(totalKg,barKg=DEFAULT_BAR_KG,denominations=STANDARD_PLATE_KG){
  if(totalKg===null||totalKg===undefined||totalKg==='')return {status:'empty',barKg};
  const total=Number(totalKg);
  if(!Number.isFinite(total)||total<0)return {status:'invalid',barKg};
  if(!Number.isFinite(barKg)||barKg<=0)return {status:'invalid',barKg};
  const preciseGrams=total*1000;
  if(Math.abs(preciseGrams-Math.round(preciseGrams))>1e-6)return {status:'unavailable',totalKg:total,barKg};
  const target=grams(total),bar=grams(barKg);
  if(target<bar)return {status:'below-bar',totalKg:total,barKg};
  const perSideGrams=(target-bar)/2;
  const weights=[...denominations].filter(n=>Number.isFinite(n)&&n>0)
    .sort((a,b)=>b-a);
  let remaining=perSideGrams;
  const plates=[];
  for(const kg of weights){
    const size=grams(kg);
    const count=Math.floor((remaining+1e-8)/size);
    if(count>0){
      const palette=PALETTE[kg]||{fill:'#929CA3',text:'#171A1A'};
      plates.push({kg,count,...palette});
      remaining-=count*size;
    }
  }
  if(Math.abs(remaining)>1e-6)return {status:'unavailable',totalKg:total,barKg,perSideKg:perSideGrams/1000};
  return {status:'ok',totalKg:total,barKg,perSideKg:perSideGrams/1000,plates};
}

function drawingHeight(kg){
  if(kg>=20)return 104;
  if(kg>=15)return 99;
  if(kg>=10)return 90;
  if(kg>=5)return 76;
  if(kg>=2.5)return 53;
  return 45;
}
function drawingWidth(kg){
  if(kg>=20)return 22;
  if(kg>=10)return 19;
  if(kg>=5)return 16;
  return 13;
}

/** Simple side elevation: centre/shaft at left, collar, then plates on one sleeve. */
export function renderPlateDiagram(result){
  if(result?.status!=='ok')return '';
  const expanded=result.plates.flatMap(p=>Array.from({length:p.count},()=>p));
  const length=expanded.reduce((sum,p)=>sum+drawingWidth(p.kg)+2,0);
  const factor=Math.min(1,254/Math.max(length,1));
  let x=88;
  const shapes=expanded.map(p=>{
    const width=drawingWidth(p.kg)*factor;
    const height=drawingHeight(p.kg);
    const y=(148-height)/2;
    const label=width>=15?'<text x="'+(x+width/2).toFixed(1)+'" y="78" fill="'+p.text+'" text-anchor="middle" font-size="10" font-weight="700">'+LABEL(p.kg)+'</text>':'';
    const shape='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+width.toFixed(1)+'" height="'+height+'" rx="3" fill="'+p.fill+'" stroke="#161a1b" stroke-width="1.6"/>'+
      '<rect x="'+(x+1.7).toFixed(1)+'" y="'+(y+4).toFixed(1)+'" width="'+Math.max(0,width*.17).toFixed(1)+'" height="'+(height-8)+'" rx="1" fill="#ffffff" opacity=".20"/>'+label;
    x+=width+2*factor;
    return shape;
  }).join('');
  const sequence=result.plates.map(p=>LABEL(p.kg)+' kg × '+p.count).join(', ')||'no plates';
  return '<svg viewBox="0 0 370 148" width="100%" role="img" aria-label="One end of a '+LABEL(result.barKg)+' kilogram bar: '+sequence+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="gain-sleeve" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#E0E5E6"/><stop offset=".45" stop-color="#919DA2"/><stop offset="1" stop-color="#66747A"/></linearGradient></defs>'+
    '<rect x="3" y="69" width="77" height="10" rx="4" fill="url(#gain-sleeve)"/>'+
    '<rect x="71" y="63" width="286" height="22" rx="5" fill="url(#gain-sleeve)"/>'+
    '<rect x="72" y="48" width="13" height="52" rx="4" fill="#B1BBC0" stroke="#69767C" stroke-width="2"/>'+
    '<rect x="351" y="62" width="7" height="24" rx="3" fill="#87959D"/>'+
    shapes+'</svg>';
}
export function renderPlateLoading(result){
  const assumptions='<p class="gain-plate-assumptions">Assumes a 20 kg bar and 25, 20, 15, 10, 5, 2.5 and 1.25 kg plates.</p>';
  if(result.status==='empty')return '<p class="gain-plate-message">Enter a total weight first.</p>'+assumptions;
  if(result.status==='invalid')return '<p class="gain-plate-message">Enter a valid weight.</p>'+assumptions;
  if(result.status==='below-bar')return '<p class="gain-plate-message">'+LABEL(result.totalKg)+' kg is lighter than the 20 kg bar.</p>'+assumptions;
  if(result.status==='unavailable')return '<p class="gain-plate-message">This exact weight cannot be loaded symmetrically with these plate sizes.</p>'+assumptions;
  const list=result.plates.map(p=>'<span class="gain-plate-chip"><span class="gain-plate-dot" style="background:'+p.fill+'"></span>'+LABEL(p.kg)+' kg <strong>× '+p.count+'</strong></span>').join('');
  return '<div class="gain-plate-total"><strong>'+LABEL(result.totalKg)+' kg total</strong><span>'+LABEL(result.barKg)+' kg bar · '+LABEL(result.perSideKg)+' kg per side</span></div>'+
    '<div class="gain-plate-illustration">'+renderPlateDiagram(result)+'</div>'+
    '<p class="gain-plate-sleeve">One end of the bar · plates load from the collar outward</p>'+
    '<div class="gain-plate-list">'+(list||'<span class="gain-plate-empty">No plates needed</span>')+'</div>'+
    '<p class="gain-plate-mirror">Repeat this arrangement on the other side.</p>'+
    '<p class="gain-plate-assumptions">Plate colours are illustrative; check the plates available at your gym.</p>';
}
