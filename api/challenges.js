import supabase from './db-client.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
  try{
    if(req.method==='GET'){const {data,error}=await supabase.from('challenges').select('*').order('id');if(error)throw error;return res.status(200).json(data)}
    const token=req.headers.authorization?.replace('Bearer ','');const {data:{user}}=token?await supabase.auth.getUser(token):{data:{user:null}};if(!user)return res.status(401).json({error:'Sign in required'});
    const {data:profile}=await supabase.from('profiles').select('role').eq('user_id',user.id).maybeSingle();if(profile?.role!=='admin')return res.status(403).json({error:'Admin access required'});
    if(req.method==='POST'){const {title,description,target,xp,icon}=req.body||{};if(!String(title||'').trim()||!Number(target))return res.status(400).json({error:'Title and target are required'});const {data,error}=await supabase.from('challenges').insert({title:String(title).trim(),description:description||'',target:Number(target),xp:Number(xp)||100,icon:icon||'zap'}).select('*').single();if(error)throw error;return res.status(201).json(data)}
    if(req.method==='DELETE'){const {error}=await supabase.from('challenges').delete().eq('id',req.body?.id);if(error)throw error;return res.status(200).json({ok:true})}
    return res.status(405).json({error:'Method not allowed'});
  }catch(err){console.error('API error:',err);return res.status(500).json({error:err.message})}
}
