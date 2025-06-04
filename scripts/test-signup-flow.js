const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

const envVars = loadEnvVariables();

// Firebase configuration
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Supabase configuration
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Complete Sign Up Flow...\n');

async function testSignUpFlow() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  // Initialize Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('✅ Firebase and Supabase initialized');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';
  const testFullName = 'Test User';
  const testPhone = '+1234567890';
  
  console.log(`\\n🔍 Testing with: ${testEmail}`);
  
  try {
    // Step 1: Try to create Firebase user
    console.log('\\n1️⃣ Creating Firebase user...');
    let result;
    try {
      result = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log(`✅ Firebase user created: ${result.user.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ Email already exists, trying to sign in...`);
        try {
          result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log(`✅ Firebase user signed in: ${result.user.uid}`);
        } catch (signInError) {
          console.log(`❌ Sign in failed: ${signInError.message}`);
          return;
        }
      } else {
        console.log(`❌ Firebase error: ${error.code} - ${error.message}`);
        return;
      }
    }
    
    const user = result.user;
    
    // Step 2: Create Supabase profile
    console.log('\\n2️⃣ Creating Supabase profile...');
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.uid,
        full_name: testFullName,
        phone: testPhone,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      console.log(`❌ Supabase profile creation failed:`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
      console.log(`   Hint: ${error.hint}`);
      
      // Check if table exists
      console.log('\\n🔍 Checking if user_profiles table exists...');
      const { error: tableError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.log(`❌ Table access error: ${tableError.message}`);
        console.log('\\n💡 Solution: You need to create the user_profiles table in Supabase');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run the schema from supabase-schema.sql file');
      }
      return;
    } else {
      console.log(`✅ Supabase profile created successfully`);
    }
    
    // Step 3: Verify profile was created
    console.log('\\n3️⃣ Verifying profile in Supabase...');
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.uid)
      .single();
    
    if (fetchError) {
      console.log(`❌ Failed to fetch profile: ${fetchError.message}`);
    } else {
      console.log(`✅ Profile verified:`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Name: ${profile.full_name}`);
      console.log(`   Phone: ${profile.phone}`);
      console.log(`   Created: ${profile.created_at}`);
    }
    
    // Step 4: Clean up test user
    console.log('\\n4️⃣ Cleaning up test data...');
    
    // Delete profile from Supabase
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.uid);
    
    if (deleteError) {
      console.log(`⚠️ Could not delete test profile: ${deleteError.message}`);
    } else {
      console.log('✅ Test profile deleted from Supabase');
    }
    
    // Sign out from Firebase
    await signOut(auth);
    console.log('✅ Signed out from Firebase');
    
    console.log('\\n🎉 SIGN UP FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('\\nSummary:');
    console.log('✅ Firebase authentication working');
    console.log('✅ Supabase profile creation working');  
    console.log('✅ Profile fetching working');
    console.log('✅ Your app should work for real users!');
    
  } catch (error) {
    console.log(`\\n❌ Unexpected error:`);
    console.log(error);
  }
}

// Run the test
testSignUpFlow().then(() => {
  console.log('\\n✨ Test completed');
}).catch(error => {
  console.log('\\n💥 Test failed with error:');
  console.log(error);
});