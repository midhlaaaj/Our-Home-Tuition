import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  console.log('--- Profiles Table Full Scan ---')
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    
  if (error) {
    console.log(`❌ Error: ${error.message}`)
  } else {
    console.log(`✅ Profiles Found: ${data.length}`)
    data.forEach(p => console.log(`   - ID: ${p.id}, Email: ${p.email}, Role: ${p.role}`))
  }
}

diagnostic()
