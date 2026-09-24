import supabase from './db-client.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
  try{
    const token=req.headers.authorization?.replace('Bearer ','');const {data:{user}}=token?await supabase.auth.getUser(token):{data:{user:null}};if(!user)return res.status(401).json({error:'Sign in required'});
    if(req.method==='GET'){const {data,error}=await supabase.from('activity').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);if(error)throw error;return res.status(200).json(data)}
    if(req.method==='POST'){const {type,workout_id,steps}=req.body||{};if(!['workout','steps'].includes(type))return res.status(400).json({error:'Invalid activity type'});const {data:profile,error:pErr}=await supabase.from('profiles').select('*').eq('user_id',user.id).single();if(pErr)throw pErr;let xp=0,stepCount=0,workoutId=null;
      if(type==='workout'){const {data:workout,error:wErr}=await supabase.from('workouts').select('*').eq('id',workout_id).single();if(wErr)throw wErr;xp=workout.xp;workoutId=workout.id}else{stepCount=Math.min(10000,Math.max(1,Math.floor(Number(steps)||0)));xp=Math.floor(stepCount/100)}
      const {data,error}=await supabase.from('activity').insert({user_id:user.id,type,workout_id:workoutId,steps:stepCount,xp}).select('*').single();if(error)throw error;
      const today=new Date().toISOString().slice(0,10);const {data:previous}=await supabase.from('activity').select('created_at').eq('user_id',user.id).neq('id',data.id).order('created_at',{ascending:false}).limit(1);const last=previous?.[0]?.created_at?.slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);const streak=last===today?Math.max(1,profile.streak):last===yesterday?profile.streak+1:1;
      const {error:uErr}=await supabase.from('profiles').update({xp:profile.xp+xp,steps:profile.steps+stepCount,streak}).eq('user_id',user.id);if(uErr)throw uErr;return res.status(201).json(data)}
    return res.status(405).json({error:'Method not allowed'});
  }catch(err){console.error('API error:',err);return res.status(500).json({error:err.message})}
}
