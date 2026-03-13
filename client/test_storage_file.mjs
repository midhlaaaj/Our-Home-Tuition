import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function diagnostic() {
  console.log('--- Storage File Exist Check ---')
  const path = 'partners/3iagzgi30bw_1771669867108.jpg'
  const { data, error } = await supabase.storage.from('uploads').list('partners')
  
  if (error) {
    console.log(`❌ Error listing files: ${error.message}`)
  } else {
    console.log(`✅ Files in uploads/partners: ${data.length}`)
    data.forEach(f => console.log(`   - ${f.name}`))
    
    const exists = data.find(f => f.name === '3iagzgi30bw_1771669867108.jpg')
    if (exists) {
      console.log('🎉 File EXISTS in storage!')
    } else {
      console.log('❌ File DOES NOT EXIST in storage!')
    }
  }
}

diagnostic()
