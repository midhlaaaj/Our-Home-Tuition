import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  const email = 'robert@ourhometuition.com'
  console.log(`--- Auth Diagnostic for ${email} ---`)
  
  // Note: Anon key cannot list auth.users directly, but we can check the public.profiles table
  // which should have been populated by our RPC.
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
    
  if (pError) {
    console.log(`❌ Profile Error: ${pError.message}`)
  } else {
    console.log(`✅ Profile Found: ID=${profile.id}, Role=${profile.role}`)
  }

  const { data: mentor, error: mError } = await supabase
    .from('mentors')
    .select('*')
    .eq('email', email)
    .single()

  if (mError) {
     console.log(`❌ Mentor Table Error: ${mError.message}`)
  } else {
     console.log(`✅ Mentor Link: Name=${mentor.name}, auth_user_id=${mentor.auth_user_id}`)
  }
}

diagnostic()
