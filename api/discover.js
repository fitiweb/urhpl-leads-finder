import { requireUser, json, readJson } from './_auth.js';

const clean = (s, max=180) => String(s || '').trim().slice(0,max);

// FIXED: Use real identifiable contact from your config.js
const headers = { 
  'User-Agent': 'fitiwebst/1.0 (contact: contact@fitiwebst.com)', 
  'Accept': 'application/json',
  'Referer': 'https://fitiwebst.vercel.app'
};

function splitQuery(q) {
  const m = q.match(/\b(?:in|near|around|at)\s+(.+)$/i);
  const location = m ? m[1].trim().replace(/[.,;]+$/, '') : q;
  let category = m ? q.slice(0, m.index).trim() : q;
  category = category.replace(/\b(companies|company|businesses|business|firms|providers|services|agencies|shops|stores)\b/ig, ' ').replace(/\s+/g,' ').trim();
  return { location: location || q, category: category || q };
}
function emailFromTags(tags={}) { return tags.email || tags['contact:email'] || ''; }
function website(tags={}) { let w=tags.website || tags['contact:website'] || tags.url || ''; if(w && !/^https?:\/\//i.test(w)) w='https://'+w; return w; }

// Fallback when OSM is down - add your main cities here
const FALLBACK_COORDS = {
  "ibadan": { lat: 7.3775, lon: 3.9470, display_name: "Ibadan, Oyo State, Nigeria" },
  "lagos": { lat: 6.5244, lon: 3.3792, display_name: "Lagos, Nigeria" },
  "abuja": { lat: 9.0765, lon: 7.3986, display_name: "Abuja, Nigeria" }
};

function getFallback(location) {
  const lower = location.toLowerCase();
  for (const key in FALLBACK_COORDS) {
    if (lower.includes(key)) return FALLBACK_COORDS[key];
  }
  return null;
}

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Method not allowed'});
  const auth=await requireUser(req); if(auth.error) return json(res,auth.status,{error:auth.error});
  const body=await readJson(req); const query=clean(body.query || 'solar installers in Lagos, Nigeria',180);
  if(query.length<3) return json(res,400,{error:'Enter a business type and a location, for example “solar installers in Lagos, Nigeria”.'});
  try {
    const {location,category}=splitQuery(query);
    
    // FIXED GEOCODING WITH RETRY + FALLBACK
    let geo = null;
    try {
      const geoUrl=new URL('https://nominatim.openstreetmap.org/search');
      geoUrl.searchParams.set('q',location); 
      geoUrl.searchParams.set('format','jsonv2'); 
      geoUrl.searchParams.set('limit','1');
      geoUrl.searchParams.set('email','contact@fitiwebst.com'); // REQUIRED by Nominatim TOS
      geoUrl.searchParams.set('addressdetails','1');
      
      // Add small delay to respect rate limit
      await new Promise(r => setTimeout(r, 1100));
      
      const geoRes=await fetch(geoUrl,{headers,signal:AbortSignal.timeout(12000)});
      if(!geoRes.ok) throw new Error(`Geocoding HTTP ${geoRes.status}`);
      geo=await geoRes.json();
    } catch (geoErr) {
      console.warn("Nominatim failed, trying fallback:", geoErr.message);
      const fallback = getFallback(location);
      if (fallback) {
        geo = [fallback];
      } else {
        throw new Error('Free geocoding service is temporarily unavailable. Try again later. [Fallback not found for "'+location+'"]');
      }
    }

    if(!geo.length) return json(res,200,{count:0,places:[],source:'OpenStreetMap',notice:'No matching location found. Include a city and country.'});
    const lat=Number(geo[0].lat), lon=Number(geo[0].lon), radius=15000;
    const bbox=[lat-0.14,lon-0.14,lat+0.14,lon+0.14].join(',');
    const term=category.toLowerCase();
    let selector='nwr[office](bbox:'+bbox+');nwr[shop](bbox:'+bbox+');nwr[craft](bbox:'+bbox+');nwr[amenity](bbox:'+bbox+');nwr[industrial](bbox:'+bbox+');';
    if(/solar|electric|energy|renewable/.test(term)) selector='nwr[office~"energy|electrical|company"](bbox:'+bbox+');nwr[shop~"electrical|hardware"](bbox:'+bbox+');nwr[craft~"electrician"](bbox:'+bbox+');nwr[man_made="works"](bbox:'+bbox+');';
    if(/real estate|property|estate|realtor/.test(term)) selector='nwr[office~"estate_agent|property_management|real_estate"](bbox:'+bbox+');nwr[shop~"estate_agent"](bbox:'+bbox+');';
    if(/restaurant|food|cafe|hotel|lodging/.test(term)) selector='nwr[amenity~"restaurant|cafe|fast_food|bar|pub"](bbox:'+bbox+');nwr[tourism~"hotel|guest_house|hostel"](bbox:'+bbox+');';
    const overpass='[out:json][timeout:20];('+selector+');out center tags 60;';
    let osmRes;
    for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
      try { osmRes=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(overpass),signal:AbortSignal.timeout(25000)}); if(osmRes.ok) break; } catch {}
    }
    if(!osmRes || !osmRes.ok) throw new Error('The free OpenStreetMap search service is busy. Wait a little and try again.');
    const data=await osmRes.json();
    const seen=new Set();
    const places=(data.elements||[]).map(el=>{
      const t=el.tags||{}; const name=t.name||t['name:en']; if(!name) return null;
      const id='osm:'+el.type+':'+el.id; if(seen.has(id)) return null; seen.add(id);
      const lat0=el.lat ?? el.center?.lat, lon0=el.lon ?? el.center?.lon;
      const addr=[t['addr:housenumber'],t['addr:street'],t['addr:city']||t['addr:town']||t['addr:village'],t['addr:state'],t['addr:country']].filter(Boolean).join(', ');
      const w=website(t); const mail=emailFromTags(t); const phone=t.phone||t['contact:phone']||'';
      return {company_name:name,address:addr||geo[0].display_name||location,website:w,phone,email:mail||null,googleMapsUrl:lat0!=null&&lon0!=null?`https://www.openstreetmap.org/${el.type}/${el.id}`:'',google_place_id:id,source:'OpenStreetMap',city:t['addr:city']||t['addr:town']||'',state:t['addr:state']||'',lead_score:(w?20:35)+(mail?25:0)+(phone?15:0),lead_status:'New',service_fit:'Website development + SEO',notes:'Public OpenStreetMap listing; verify details before outreach.'};
    }).filter(Boolean).slice(0,60);
    return json(res,200,{count:places.length,places,source:'OpenStreetMap',notice:'Free community-maintained map data. Coverage varies by place and industry; not an exhaustive global company directory. OpenStreetMap contributors are the data source.'});
  } catch(e){ return json(res,502,{error:e.message||'Free business discovery service failed. Try again later.'}); }
}
