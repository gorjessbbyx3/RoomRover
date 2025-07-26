
// Comprehensive Workflow Test Suite
// Tests membership inquiry, tracking, admin workflows, and system functionality

const API_BASE = 'http://localhost:5000';

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();
    return { 
      success: response.ok, 
      status: response.status, 
      data: result,
      error: !response.ok ? result.error || `HTTP ${response.status}` : null
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 0,
      data: null
    };
  }
}

// Test membership inquiry flow
async function testMembershipInquiry() {
  console.log('🏠 Testing Membership Inquiry Flow...');
  
  const inquiryData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    clubhouse: 'P1',
    plan: 'P1-Basic',
    checkInDate: '2024-02-01',
    checkOutDate: '2024-02-15',
    message: 'Test inquiry for automated testing'
  };
  
  const result = await makeRequest('POST', '/api/inquiries', inquiryData);
  
  if (result.success) {
    console.log('✅ Membership inquiry submitted successfully');
    console.log(`📧 Tracker token: ${result.data.trackerToken}`);
    return result.data;
  } else {
    console.error(`❌ Membership inquiry failed: ${result.error}`);
    return null;
  }
}

// Test tracker flow
async function testTrackerFlow(trackerToken) {
  console.log('\n📋 Testing Tracker Flow...');
  
  if (!trackerToken) {
    console.error('❌ No tracker token provided');
    return false;
  }
  
  const result = await makeRequest('GET', `/api/tracker/${trackerToken}`);
  
  if (result.success) {
    console.log('✅ Tracker access successful');
    console.log(`📊 Status: ${result.data.status}`);
    return true;
  } else {
    console.error(`❌ Tracker access failed: ${result.error}`);
    return false;
  }
}

// Test admin login
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  const loginData = {
    username: 'admin',
    password: 'admin123'
  };
  
  const result = await makeRequest('POST', '/api/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ Admin login successful');
    return result.data.token;
  } else {
    console.error(`❌ Admin login failed: ${result.error}`);
    return null;
  }
}

// Test admin inquiries workflow
async function testAdminInquiriesFlow(token) {
  console.log('\n📨 Testing Admin Inquiries Workflow...');
  
  // Fetch inquiries
  const inquiriesResult = await makeRequest('GET', '/api/inquiries', null, token);
  
  if (inquiriesResult.success) {
    console.log(`✅ Fetched ${inquiriesResult.data.length} inquiries`);
    
    // Test updating inquiry status if inquiries exist
    if (inquiriesResult.data.length > 0) {
      const firstInquiry = inquiriesResult.data[0];
      const updateResult = await makeRequest('PUT', `/api/inquiries/${firstInquiry.id}`, {
        status: 'reviewed'
      }, token);
      
      if (updateResult.success) {
        console.log('✅ Inquiry status updated successfully');
      } else {
        console.error(`❌ Inquiry status update failed: ${updateResult.error}`);
      }
    }
    
    return true;
  } else {
    console.error(`❌ Failed to fetch inquiries: ${inquiriesResult.error}`);
    return false;
  }
}

// Test dashboard stats
async function testDashboardStats(token) {
  console.log('\n📊 Testing Dashboard Stats...');
  
  const result = await makeRequest('GET', '/api/dashboard/stats', null, token);
  
  if (result.success) {
    console.log('✅ Dashboard stats fetched successfully');
    console.log(`📈 Total properties: ${result.data.totalProperties || 0}`);
    console.log(`🏠 Total rooms: ${result.data.totalRooms || 0}`);
    return true;
  } else {
    console.error(`❌ Dashboard stats failed: ${result.error}`);
    return false;
  }
}

// Test system endpoints
async function testSystemEndpoints(token) {
  console.log('\n🔧 Testing System Endpoints...');
  
  const endpoints = [
    '/api/rooms',
    '/api/bookings',
    '/api/payments',
    '/api/inventory',
    '/api/maintenance'
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    const result = await makeRequest('GET', endpoint, null, token);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - OK`);
    } else {
      console.error(`❌ ${endpoint} - Failed: ${result.error}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Workflow Tests');
  console.log('=========================================');
  
  try {
    // Test membership inquiry flow
    const inquiryData = await testMembershipInquiry();
    
    // Test tracker flow
    if (inquiryData) {
      await testTrackerFlow(inquiryData.trackerToken);
    }
    
    // Test admin workflows
    const adminToken = await testAdminLogin();
    if (adminToken) {
      await testAdminInquiriesFlow(adminToken);
      await testDashboardStats(adminToken);
      await testSystemEndpoints(adminToken);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('=========================================');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
}

// Auto-run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  runAllTests,
  testMembershipInquiry,
  testTrackerFlow,
  testAdminLogin,
  testAdminInquiriesFlow,
  testDashboardStats,
  testSystemEndpoints
};
