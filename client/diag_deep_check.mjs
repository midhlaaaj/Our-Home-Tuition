import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  console.log('--- Deep Auth & Profile Check ---')
  
  // 1. Check all profiles again
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*')
  if (pError) console.log(`❌ Profile Error: ${pError.message}`)
  else {
    console.log(`✅ Profiles in DB: ${profiles.length}`)
    profiles.forEach(p => console.log(`   - ${p.email} [${p.role}] (ID: ${p.id})`))
  }

  // 2. Check Robert Wilson in mentors table
  const { data: mentors, error: mError } = await supabase
    .from('mentors')
    .select('*')
    .ilike('name', '%Robert%')

  if (mError) console.log(`❌ Mentor Error: ${mError.message}`)
  else {
    console.log(`✅ Mentors matching 'Robert': ${mentors.length}`)
    mentors.forEach(m => console.log(`   - ${m.name} [${m.email}] (AuthID: ${m.auth_user_id})`))
  }
}

diagnostic()
