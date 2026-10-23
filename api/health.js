import { json } from './_auth.js';
export default function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 return json(res,200,{ok:true,service:'URHPL Global Lead Finder Pro — Free integrations',discovery:'OpenStreetMap + Nominatim public services',domainLookup:'Public company website contact pages',emailCheck:'DNS MX lookup only',supabaseConfigured:Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY),paidApiKeysRequired:false,notice:'Public services have fair-use limits; Supabase and hosting free-tier quotas may apply.'});
}
