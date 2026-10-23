import { requireUser, json, readJson } from './_auth.js';
const validDomain = d => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d) && !d.includes('..') && d.length <= 253 && !/(^|\.)(localhost|local|internal|test)$/i.test(d) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(d);
const emailRe = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;
function extract(html){
 const found=new Set();
 for(const m of html.matchAll(/mailto:([^\s"'?<>]+)/ig)){const e=decodeURIComponent(m[1].replace(/&amp;/g,'&')).split('?')[0].toLowerCase();if(emailRe.test(e)){emailRe.lastIndex=0;found.add(e);}}
 emailRe.lastIndex=0; for(const m of html.matchAll(emailRe)){const e=m[0].toLowerCase();emailRe.lastIndex=0;if(!/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i.test(e)&&!e.endsWith('@example.com'))found.add(e);}
 return [...found];
}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 const auth=await requireUser(req);if(auth.error)return json(res,auth.status,{error:auth.error});
 const body=await readJson(req);let domain=String(body.domain||'').trim().replace(/^https?:\/\//i,'').split('/')[0].toLowerCase();
 if(!validDomain(domain))return json(res,400,{error:'Enter a valid company domain, e.g. example.com.'});
 const urls=[`https://${domain}/`,`https://${domain}/contact`,`https://${domain}/contact-us`,`https://${domain}/about`,`https://www.${domain}/`];
 const emails=new Set();let pagesChecked=0;let mainTitle='';
 for(const url of urls){
  try{const r=await fetch(url,{headers:{'User-Agent':'URHPLGlobalLeadFinder/4.0 (public contact page lookup)','Accept':'text/html'},redirect:'manual',signal:AbortSignal.timeout(6500)});if(!r.ok)continue;const ct=r.headers.get('content-type')||'';if(!ct.includes('text/html'))continue;const html=(await r.text()).slice(0,700000);pagesChecked++;if(!mainTitle){const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);mainTitle=title?title[1].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,120):'';}extract(html).forEach(e=>{if(e.split('@')[1]?.toLowerCase()===domain||e.split('@')[1]?.toLowerCase().endsWith('.'+domain))emails.add(e);});
  }catch{}
 }
 const list=[...emails].slice(0,100).map(value=>({value,type:/^(info|hello|contact|sales|support|office|admin|enquiries|enquiry)@/i.test(value)?'generic':'unknown',confidence:null,first_name:'',last_name:'',position:'',verification:'not verified',sources:[`https://${domain}/`]}));
 return json(res,200,{domain,organization:mainTitle,emails:list,pagesChecked,notice:'Free public website scan only. Results depend on what the company publishes and allows access to; no guessed addresses, paid enrichment API, or mailbox verification is used.'});
}
