import {formatNumber} from './model.js';
export function makeChart(points,metric='max') {
  const usable=points.filter(p=>Number.isFinite(p[metric]));
  if(!usable.length)return '<div class="empty-chart">No completed weighted sets yet for this metric.</div>';
  const width=660,height=270,pad={l:44,r:16,t:25,b:44};
  const vals=usable.map(p=>p[metric]);const min=Math.min(...vals),max=Math.max(...vals);const low=Math.max(0,Math.floor((min-(max-min||max*.1||1)*.25)/5)*5);const high=Math.ceil((max+(max-min||max*.1||1)*.2)/5)*5||5;
  const x=i=>pad.l+(usable.length===1?.5:i/(usable.length-1))*(width-pad.l-pad.r);const y=v=>pad.t+(1-(v-low)/(high-low))*(height-pad.t-pad.b);
  const ticks=Array.from({length:5},(_,i)=>low+(high-low)*i/4);
  const grid=ticks.map(v=>`<line x1="${pad.l}" y1="${y(v)}" x2="${width-pad.r}" y2="${y(v)}" stroke="#e3e6e8"/><text x="${pad.l-9}" y="${y(v)+4}" text-anchor="end" class="chart-axis">${formatNumber(v)}</text>`).join('');
  const path=usable.map((p,i)=>`${i?'L':'M'} ${x(i).toFixed(2)} ${y(p[metric]).toFixed(2)}`).join(' ');
  const dots=usable.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p[metric])}" r="6" fill="#486579" stroke="white" stroke-width="2" class="chart-point" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.date}: ${formatNumber(p[metric])}"/>`).join('');
  const dates=[0,Math.floor((usable.length-1)/2),usable.length-1].filter((n,i,a)=>a.indexOf(n)===i).map(i=>`<text x="${x(i)}" y="${height-13}" text-anchor="middle" class="chart-axis">${shortDate(usable[i].date)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Exercise progress chart">${grid}<path d="${path}" fill="none" stroke="#486579" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${dates}</svg>`;
}
export function shortDate(iso) {return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short'});}
export function since(range,now=new Date()) {if(range==='all')return null;const d=new Date(now);const months={month:1,quarter:3,year:12}[range]||12;d.setMonth(d.getMonth()-months);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
