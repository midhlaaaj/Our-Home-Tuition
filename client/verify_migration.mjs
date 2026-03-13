import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function verifyMigration() {
  console.log('--- Final Migration Verification ---')
  
  const tables = ['profiles', 'mentors', 'bookings', 'mentor_reviews', 'sliders', 'brands']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table ${table}: Error ${error.code} - ${error.message}`)
    } else {
      console.log(`✅ Table ${table}: ${count} records found`)
    }
  }

  // Check specific Admin ID
  const testId = 'd8f5b447-7069-498e-a8a2-a2df1c339ab5'
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', testId)
    .single()

  if (pError) {
    console.log(`❌ Admin Profile Check (${testId}): ${pError.message}`)
  } else {
    console.log(`✅ Admin Profile Check: Found ${profile.full_name} (${profile.role})`)
  }
}

verifyMigration()
