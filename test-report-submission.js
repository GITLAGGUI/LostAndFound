const https = require('https');
const http = require('http');

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment configuration...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/lost-items',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Environment Check Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('Environment Check Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.log('Raw environment check response:', data);
          resolve({ error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Environment Check Error:', err.message);
      reject(err);
    });

    req.end();
  });
}

async function testReportSubmission() {
  console.log('🧪 Testing Report Lost functionality...');
  
  // First check if we can even reach the API
  try {
    await checkEnvironmentVariables();
  } catch (error) {
    console.error('Could not reach API:', error.message);
    return;
  }
  
  // Test data for a lost item report with minimal required fields
  const testData = {
    user_id: 'test-user-id-12345',
    title: 'Test Lost Wallet',
    description: 'A test wallet for checking database insertion functionality.',
    category: 'item',
    subcategory: 'Bags/Wallets',
    location: 'Test Location - Central Park',
    date: '2025-01-06',
    contactInfo: 'test@example.com'
  };

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/lost-items',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📤 Sending test report...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const req = http.request(options, (res) => {
      console.log(`\n📥 Response Status: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📄 Response Body:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('\n✅ SUCCESS: Lost item report created successfully!');
            console.log('📋 Item ID:', response.item?.id);
            console.log('🎉 You can now check your Supabase dashboard for the new entry!');
          } else {
            console.log('\n❌ FAILED:', response.error);
            if (response.details) {
              console.log('🔍 Error Details:', response.details);
            }
            
            // Provide suggestions based on the error
            if (response.error.includes('authentication') || response.error.includes('user')) {
              console.log('\n💡 SUGGESTION: The error might be related to user authentication.');
              console.log('   This is normal in testing - the API expects a real authenticated user.');
            } else if (response.error.includes('fetch') || response.error.includes('connect')) {
              console.log('\n💡 SUGGESTION: Check your Supabase configuration in .env file');
              console.log('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly.');
            }
          }
          
          resolve(response);
        } catch (e) {
          console.log('\n📄 Raw response:', data);
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      console.error('\n❌ Request Error:', err.message);
      console.log('💡 Make sure your development server is running on localhost:3000');
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting Report Lost API Test\n');
  console.log('This test will:');
  console.log('1. Check if the API is accessible');
  console.log('2. Submit a test lost item report');
  console.log('3. Verify if it gets inserted into Supabase\n');
  
  try {
    await testReportSubmission();
    console.log('\n🏁 Test completed!');
    console.log('\n📊 Next steps:');
    console.log('1. Check your Supabase dashboard (https://supabase.com/dashboard)');
    console.log('2. Go to your project > Table Editor > lost_items');
    console.log('3. Look for the test entry with title "Test Lost Wallet"');
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure your development server is running (npm run dev)');
    console.log('2. Check your .env file has correct Supabase credentials');
    console.log('3. Verify your Supabase project is active and accessible');
  }
  
  process.exit(0);
}

main();