import supabase from './db-client.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
  try{
    if(req.method==='GET'){const campus_id=Number(req.query?.campus_id);if(!campus_id)return res.status(400).json({error:'Campus required'});const {data,error}=await supabase.from('messages').select('*').eq('campus_id',campus_id).order('created_at',{ascending:false}).limit(80);if(error)throw error;return res.status(200).json(data.reverse())}
    const token=req.headers.authorization?.replace('Bearer ','');const {data:{user}}=token?await supabase.auth.getUser(token):{data:{user:null}};if(!user)return res.status(401).json({error:'Sign in required'});
    const {data:profile,error:pErr}=await supabase.from('profiles').select('*').eq('user_id',user.id).single();if(pErr)throw pErr;
    if(req.method==='POST'){const body=String(req.body?.body||'').trim();if(!body||body.length>500)return res.status(400).json({error:'Message must be 1–500 characters'});const {data,error}=await supabase.from('messages').insert({user_id:user.id,campus_id:profile.campus_id,display_name:profile.display_name,body}).select('*').single();if(error)throw error;return res.status(201).json(data)}
    if(req.method==='DELETE'){const {error}=await supabase.from('messages').delete().eq('id',req.body?.id).eq('user_id',user.id);if(error)throw error;return res.status(200).json({ok:true})}
    return res.status(405).json({error:'Method not allowed'});
  }catch(err){console.error('API error:',err);return res.status(500).json({error:err.message})}
}
