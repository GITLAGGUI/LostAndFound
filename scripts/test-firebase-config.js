const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

// Read environment variables manually
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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('🔧 Testing Firebase Configuration...\n');

// Check if all required environment variables are present
const requiredFields = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let missingFields = [];

console.log('Environment Variables Check:');
requiredFields.forEach(field => {
  const value = envVars[field];
  if (value) {
    console.log(`✅ ${field}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${field}: MISSING`);
    missingFields.push(field);
  }
});

if (missingFields.length > 0) {
  console.log(`\n🚨 MISSING ENVIRONMENT VARIABLES: ${missingFields.join(', ')}`);
  process.exit(1);
}

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('\n✅ Firebase app initialized successfully');
  
  // Initialize Auth
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
  
  console.log('\n🔍 Configuration Details:');
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`App ID: ${firebaseConfig.appId}`);
  
  console.log('\n✅ Firebase configuration is valid!');
  console.log('\n📋 Next Steps:');
  console.log('1. Verify Firebase Console settings:');
  console.log('   - Go to https://console.firebase.google.com/');
  console.log(`   - Select project: ${firebaseConfig.projectId}`);
  console.log('   - Go to Authentication > Settings');
  console.log('   - Enable Email/Password provider');
  console.log('   - Enable Google provider if needed');
  console.log('   - Add authorized domains: localhost, 127.0.0.1');
  console.log('2. Check Supabase table permissions');
  console.log('3. Test sign up flow');
  
} catch (error) {
  console.log('\n❌ Firebase configuration error:');
  console.error(error.message);
  console.log('\n🔧 Possible solutions:');
  console.log('1. Check if API key is correct in .env.local');
  console.log('2. Verify project ID matches Firebase console');
  console.log('3. Ensure all environment variables are set');
  process.exit(1);
}