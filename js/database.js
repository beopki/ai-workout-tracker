(function(){
  let supa,user;
  const LOCAL_KEY='aiwt_draft_online';

  async function init(){
    supa=window.supabase.createClient(
      APP_CONFIG.SUPABASE_URL,
      APP_CONFIG.SUPABASE_PUBLISHABLE_KEY,
      {auth:{persistSession:true,autoRefreshToken:true}}
    );
    let {data:{session},error}=await supa.auth.getSession();
    if(error) throw error;
    if(!session){
      const r=await supa.auth.signInAnonymously();
      if(r.error) throw r.error;
      session=r.data.session;
    }
    user=session.user;
    return user;
  }

  function saveLocal(d){localStorage.setItem(LOCAL_KEY,JSON.stringify(d))}
  function loadLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'null')}catch(e){return null}}
  function clearLocal(){localStorage.removeItem(LOCAL_KEY)}

  async function getOrCreateDraft(day){
    const date=new Date().toISOString().slice(0,10);
    let r=await supa.from('workout_sessions')
      .select('*,workout_entries(*)')
      .eq('user_id',user.id).eq('workout_day',day).eq('workout_date',date)
      .maybeSingle();
    if(r.error) throw r.error;

    if(!r.data){
      r=await supa.from('workout_sessions').insert({
        user_id:user.id,workout_day:day,workout_date:date,status:'draft'
      }).select().single();
      if(r.error) throw r.error;

      const entries=WORKOUT_CATALOG[day].map((name,i)=>({
        session_id:r.data.id,user_id:user.id,exercise_key:getExerciseKey(day, i),
        exercise_name:name,is_completed:false
      }));
      const e=await supa.from('workout_entries').insert(entries).select();
      if(e.error) throw e.error;
      r.data.workout_entries=e.data;
    }

    const draft=normalize(r.data);
    saveLocal(draft);
    return draft;
  }

  function normalize(row){
    const entries={};
    (row.workout_entries||[]).forEach(e=>{
      entries[e.exercise_key]={
        id:e.id,key:e.exercise_key,name:e.exercise_name,
        weight:e.weight_kg??'',done:e.is_completed
      };
    });
    return {
      id:row.id,day:row.workout_day,date:row.workout_date,
      duration:row.duration_minutes,memo:row.memo||'',
      status:row.status,entries
    };
  }

  async function saveDraft(draft){
    saveLocal(draft);
    let r=await supa.from('workout_sessions').update({
      duration_minutes:Number(draft.duration||0),memo:draft.memo||'',
      updated_at:new Date().toISOString()
    }).eq('id',draft.id).eq('user_id',user.id);
    if(r.error) throw r.error;

    const rows=Object.values(draft.entries).map(e=>({
      session_id:draft.id,user_id:user.id,exercise_key:e.key,
      exercise_name:e.name,weight_kg:e.weight===''?null:Number(e.weight),
      is_completed:!!e.done,updated_at:new Date().toISOString()
    }));
    r=await supa.from('workout_entries').upsert(rows,{onConflict:'session_id,exercise_key'});
    if(r.error) throw r.error;
  }

  async function complete(draft){
    await saveDraft(draft);
    const r=await supa.from('workout_sessions').update({
      status:'completed',completed_at:new Date().toISOString()
    }).eq('id',draft.id).eq('user_id',user.id).select('*,workout_entries(*)').single();
    if(r.error) throw r.error;
    clearLocal();
    return normalize(r.data);
  }

  async function previousWeights(day,date){
    const keys=WORKOUT_CATALOG[day].map((_,i)=>getExerciseKey(day, i));
    const r=await supa.from('workout_entries')
      .select('exercise_key,weight_kg,created_at,workout_sessions!inner(workout_date,status)')
      .eq('user_id',user.id).in('exercise_key',keys).eq('is_completed',true)
      .eq('workout_sessions.status','completed')
      .lt('workout_sessions.workout_date',date)
      .order('created_at',{ascending:false});
    if(r.error) throw r.error;
    const out={};
    for(const x of r.data||[]){
      if(out[x.exercise_key]===undefined && x.weight_kg!==null) out[x.exercise_key]=Number(x.weight_kg);
    }
    return out;
  }
async function linkEmail(email){
  if(!user){
    throw new Error('사용자 세션이 없습니다.');
  }

  const cleanEmail = String(email || '').trim();

  if(!cleanEmail){
    throw new Error('이메일 주소를 입력해 주세요.');
  }

  const { data, error } = await supa.auth.updateUser({
    email: cleanEmail
  });

  if(error){
    throw error;
  }

  return data;
}
async function saveBodyRecord(record){
  if(!user){
    throw new Error('사용자 세션이 없습니다.');
  }

  const payload={
    user_id:user.id,
    measured_date:record.measured_date,
    weight_kg:Number(record.weight_kg),
    skeletal_muscle_kg:
      record.skeletal_muscle_kg === '' ||
      record.skeletal_muscle_kg == null
        ? null
        : Number(record.skeletal_muscle_kg),
    body_fat_percent:
      record.body_fat_percent === '' ||
      record.body_fat_percent == null
        ? null
        : Number(record.body_fat_percent),
    body_fat_mass_kg:
      record.body_fat_mass_kg === '' ||
      record.body_fat_mass_kg == null
        ? null
        : Number(record.body_fat_mass_kg),
    bmi:
      record.bmi === '' || record.bmi == null
        ? null
        : Number(record.bmi),
    waist_hip_ratio:
      record.waist_hip_ratio === '' ||
      record.waist_hip_ratio == null
        ? null
        : Number(record.waist_hip_ratio),
    visceral_fat_level:
      record.visceral_fat_level === '' ||
      record.visceral_fat_level == null
        ? null
        : Number(record.visceral_fat_level),
    memo:String(record.memo || '').trim() || null,
    updated_at:new Date().toISOString()
  };

  const r=await supa
    .from('body_composition_records')
    .upsert(payload,{
      onConflict:'user_id,measured_date'
    })
    .select()
    .single();

  if(r.error) throw r.error;

  return r.data;
}

async function loadBodyRecords(){
  if(!user){
    throw new Error('사용자 세션이 없습니다.');
  }

  const r=await supa
    .from('body_composition_records')
    .select('*')
    .eq('user_id',user.id)
    .order('measured_date',{ascending:false});

  if(r.error) throw r.error;

  return r.data || [];
}

async function deleteBodyRecord(id){
  if(!user){
    throw new Error('사용자 세션이 없습니다.');
  }

  const r=await supa
    .from('body_composition_records')
    .delete()
    .eq('id',id)
    .eq('user_id',user.id);

  if(r.error) throw r.error;
}
window.DB={
  init,
  getOrCreateDraft,
  saveDraft,
  complete,
  previousWeights,
  loadLocal,
  linkEmail
};
})();
