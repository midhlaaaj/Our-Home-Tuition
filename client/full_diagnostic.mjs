import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://abzwpidnymxfilrkcewh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiendwaWRueW14ZmlscmtjZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODEwNjIsImV4cCI6MjA4ODk1NzA2Mn0.w2D3FU-9ZdX2Sf8ECt9nHQ9aTh8J46FHRybUv5WODFY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runFullDiagnostic() {
  console.log('🚀 --- STARTING FULL SYSTEM DIAGNOSTIC --- 🚀\n')

  // 1. Table Verification
  console.log('📊 [1/5] Checking Database Tables...')
  const tables = ['profiles', 'mentors', 'bookings', 'mentor_reviews', 'partners', 'subjects', 'topics']
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`   ❌ Table '${table}': ERROR (${error.message})`)
    } else {
      console.log(`   ✅ Table '${table}': ONLINE (${count} records)`)
    }
  }

  // 2. Auth & Profiles
  console.log('\n👤 [2/5] Checking Auth & Profiles...')
  const { data: adminProfiles, error: aError } = await supabase.from('profiles').select('*').eq('role', 'admin')
  if (aError) console.log(`   ❌ Profile Scan Error: ${aError.message}`)
  else console.log(`   ✅ Admin Profiles Found: ${adminProfiles.length}`)

  const { data: mentorProfiles, error: mError } = await supabase.from('profiles').select('*').eq('role', 'mentor')
  if (mError) console.log(`   ❌ Mentor Profile Scan Error: ${mError.message}`)
  else console.log(`   ✅ Mentor Profiles Found: ${mentorProfiles.length}`)

  // 3. Storage Buckets
  console.log('\n📁 [3/5] Checking Storage Buckets...')
  const bucketsToCheck = ['uploads', 'prebuilt-avatars', 'resumes', 'intro-videos', 'avatars']
  const { data: buckets, error: bError } = await supabase.storage.listBuckets()
  
  if (bError) {
    console.log(`   ❌ Storage Error: ${bError.message}`)
  } else {
    bucketsToCheck.forEach(bName => {
      const found = buckets.find(b => b.name === bName)
      if (found) {
        console.log(`   ✅ Bucket '${bName}': EXISTS (${found.public ? 'Public' : 'Private'})`)
      } else {
        console.log(`   ⚠️ Bucket '${bName}': MISSING!`)
      }
    })
  }

  // 4. RPC/Function Verification (Testing by calling with dummy data/id)
  console.log('\n⚙️ [4/5] Verifying RPC Functions...')
  const { data: rpcTest, error: rError } = await supabase.rpc('create_mentor_account', {
    mentor_email: 'test@invalid.com',
    mentor_password: 'test',
    mentor_id: '00000000-0000-0000-0000-000000000000'
  })
  
  // We expect an error (Unauthorized or ID not found), but the error type tells us if function exists
  if (rError && rError.message.includes('not exist')) {
    console.log('   ❌ RPC create_mentor_account: NOT FOUND')
  } else {
    console.log('   ✅ RPC create_mentor_account: ONLINE')
  }

  // 5. Data Integrity Check (Mentors without auth_user_id)
  console.log('\n🔍 [5/5] Checking Data Integrity...')
  const { data: mentorsNoAuth } = await supabase.from('mentors').select('name').is('auth_user_id', null)
  if (mentorsNoAuth && mentorsNoAuth.length > 0) {
    console.log(`   ⚠️ Warning: ${mentorsNoAuth.length} mentors have no portal access linked.`)
    mentorsNoAuth.forEach(m => console.log(`      - ${m.name}`))
  } else {
    console.log('   ✅ All mentor profiles are correctly linked with portal access.')
  }

  console.log('\n✨ --- DIAGNOSTIC COMPLETE --- ✨')
}

runFullDiagnostic()
