import { requireUser, json, readJson } from './_auth.js';
import { resolveMx } from 'node:dns/promises';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 const auth=await requireUser(req);if(auth.error)return json(res,auth.status,{error:auth.error});
 const body=await readJson(req);const email=String(body.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'Enter a valid email address.'});
 const domain=email.split('@')[1];
 try{const records=await resolveMx(domain);const status=records?.length?'domain_has_mail_server':'no_mail_server_found';return json(res,200,{email,status,result:{domain,mxRecords:records.length,method:'DNS MX lookup',mailboxChecked:false},notice:'Free DNS check only. An MX record does not prove this individual mailbox exists or can receive mail.'});}
 catch(e){return json(res,200,{email,status:'mx_lookup_failed_or_no_mx',result:{domain,mailboxChecked:false},notice:'DNS lookup could not confirm mail service. This does not prove the mailbox is invalid.'});}
}
