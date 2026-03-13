import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  console.log('--- Storage Diagnostic ---')
  
  const { data: buckets, error: bError } = await supabase
    .storage
    .listBuckets()
  
  if (bError) {
    console.log(`❌ Storage Error: ${bError.message}`)
  } else {
    console.log(`✅ Buckets Found: ${buckets.length}`)
    buckets.forEach(b => console.log(`   - ID: ${b.id}, Public: ${b.public}`))
    
    const uploadsBucket = buckets.find(b => b.id === 'uploads')
    if (!uploadsBucket) {
      console.log('⚠️  CRITICAL: "uploads" bucket IS MISSING!')
    }
  }
}

diagnostic()
