import supabase from './db-client.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
  try{
    if(req.method==='GET'){const {data,error}=await supabase.from('profiles').select('id,user_id,display_name,campus_id,xp,steps,streak,role').order('xp',{ascending:false});if(error)throw error;return res.status(200).json(data)}
    const token=req.headers.authorization?.replace('Bearer ','');const {data:{user}}=token?await supabase.auth.getUser(token):{data:{user:null}};if(!user)return res.status(401).json({error:'Sign in required'});
    if(req.method==='POST'){const display_name=String(req.body?.display_name||'').trim();const campus_id=Number(req.body?.campus_id);if(!display_name||!campus_id)return res.status(400).json({error:'Name and campus are required'});const {data:existing}=await supabase.from('profiles').select('id').eq('user_id',user.id).maybeSingle();if(existing)return res.status(400).json({error:'Profile already exists'});const {data,error}=await supabase.from('profiles').insert({user_id:user.id,display_name,campus_id,xp:0,steps:0,streak:0,role:'student'}).select('*').single();if(error)throw error;return res.status(201).json(data)}
    if(req.method==='PUT'){const updates={};if(req.body?.display_name!==undefined){const name=String(req.body.display_name).trim();if(!name)return res.status(400).json({error:'Name is required'});updates.display_name=name}if(req.body?.campus_id!==undefined)updates.campus_id=Number(req.body.campus_id);const {data,error}=await supabase.from('profiles').update(updates).eq('user_id',user.id).select('*').single();if(error)throw error;return res.status(200).json(data)}
    return res.status(405).json({error:'Method not allowed'});
  }catch(err){console.error('API error:',err);return res.status(500).json({error:err.message})}
}
