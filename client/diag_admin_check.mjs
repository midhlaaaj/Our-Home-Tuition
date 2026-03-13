import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  const adminEmail = 'ourhometuition.web@gmail.com'
  console.log(`--- Admin Diagnostic for ${adminEmail} ---`)
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', adminEmail)
    .single()
    
  if (error) {
    console.log(`❌ Admin Profile Error: ${error.message}`)
  } else {
    console.log(`✅ Admin Profile found: Role=${profile.role}`)
  }
}

diagnostic()
