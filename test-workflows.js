
const fs = require('fs');

// Test configuration
const baseUrl = 'http://localhost:5000';
const testData = {
  membershipInquiry: {
    name: 'John Test User',
    contact: '1234567890',
    email: 'john.test@example.com',
    referralSource: 'Test Referral',
    clubhouse: 'p1',
    preferredPlan: 'monthly',
    message: 'This is a test inquiry'
  },
  adminLogin: {
    username: 'admin',
    password: 'admin123'
  }
};

// Helper function to make HTTP requests
async function makeRequest(method, path, data = null, token = null) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { success: response.ok, status: response.status, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test functions
async function testMembershipInquiry() {
  console.log('\n🧪 Testing Membership Inquiry Flow...');
  
  // Submit membership inquiry
  console.log('1. Submitting membership inquiry...');
  const inquiryResult = await makeRequest('POST', '/api/inquiries', testData.membershipInquiry);
  
  if (!inquiryResult.success) {
    console.error('❌ Failed to submit inquiry:', inquiryResult.error || inquiryResult.data);
    return null;
  }
  
  console.log('✅ Inquiry submitted successfully');
  console.log(`   Tracking Token: ${inquiryResult.data.trackerToken}`);
  console.log(`   Inquiry ID: ${inquiryResult.data.id}`);
  
  return inquiryResult.data;
}

async function testTrackerFlow(trackerToken) {
  console.log('\n🔍 Testing Tracker Flow...');
  
  if (!trackerToken) {
    console.error('❌ No tracker token provided');
    return false;
  }
  
  // Test tracker endpoint
  console.log('1. Testing tracker endpoint...');
  const trackerResult = await makeRequest('GET', `/api/inquiries/track/${trackerToken}`);
  
  if (!trackerResult.success) {
    console.error('❌ Failed to fetch tracker data:', trackerResult.error || trackerResult.data);
    return false;
  }
  
  console.log('✅ Tracker endpoint working');
  console.log(`   Status: ${trackerResult.data.status}`);
  console.log(`   Inquiry ID: ${trackerResult.data.id}`);
  
  return true;
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  const loginResult = await makeRequest('POST', '/api/auth/login', testData.adminLogin);
  
  if (!loginResult.success) {
    console.error('❌ Admin login failed:', loginResult.error || loginResult.data);
    return null;
  }
  
  console.log('✅ Admin login successful');
  console.log(`   User: ${loginResult.data.user.name} (${loginResult.data.user.role})`);
  
  return loginResult.data.token;
}

async function testAdminInquiriesFlow(token) {
  console.log('\n📋 Testing Admin Inquiries Flow...');
  
  if (!token) {
    console.error('❌ No admin token provided');
    return false;
  }
  
  // Get all inquiries
  console.log('1. Fetching all inquiries...');
  const inquiriesResult = await makeRequest('GET', '/api/inquiries', null, token);
  
  if (!inquiriesResult.success) {
    console.error('❌ Failed to fetch inquiries:', inquiriesResult.error || inquiriesResult.data);
    return false;
  }
  
  console.log('✅ Inquiries fetched successfully');
  console.log(`   Total inquiries: ${inquiriesResult.data.length}`);
  
  // Test updating inquiry status
  if (inquiriesResult.data.length > 0) {
    const firstInquiry = inquiriesResult.data[0];
    console.log('2. Testing inquiry status update...');
    
    const updateResult = await makeRequest('PUT', `/api/inquiries/${firstInquiry.id}`, 
      { status: 'payment_confirmed' }, token);
    
    if (!updateResult.success) {
      console.error('❌ Failed to update inquiry:', updateResult.error || updateResult.data);
      return false;
    }
    
    console.log('✅ Inquiry status updated successfully');
  }
  
  return true;
}

async function testDashboardStats(token) {
  console.log('\n📊 Testing Dashboard Stats...');
  
  if (!token) {
    console.error('❌ No admin token provided');
    return false;
  }
  
  const statsResult = await makeRequest('GET', '/api/dashboard/stats', null, token);
  
  if (!statsResult.success) {
    console.error('❌ Failed to fetch dashboard stats:', statsResult.error || statsResult.data);
    return false;
  }
  
  console.log('✅ Dashboard stats fetched successfully');
  console.log(`   Available Rooms: ${statsResult.data.availableRooms}`);
  console.log(`   Active Bookings: ${statsResult.data.activeBookings}`);
  console.log(`   Pending Tasks: ${statsResult.data.pendingTasks}`);
  console.log(`   Today Revenue: $${statsResult.data.todayRevenue}`);
  
  return true;
}

async function testSystemEndpoints(token) {
  console.log('\n🏠 Testing System Endpoints...');
  
  const endpoints = [
    { name: 'Properties', path: '/api/properties' },
    { name: 'Rooms', path: '/api/rooms' },
    { name: 'Users', path: '/api/users' },
    { name: 'Bookings', path: '/api/bookings' },
    { name: 'Cleaning Tasks', path: '/api/cleaning-tasks' },
    { name: 'Inventory', path: '/api/inventory' },
    { name: 'Maintenance', path: '/api/maintenance' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest('GET', endpoint.path, null, token);
    if (result.success) {
      console.log(`✅ ${endpoint.name}: OK (${Array.isArray(result.data) ? result.data.length : 'N/A'} items)`);
    } else {
      console.log(`❌ ${endpoint.name}: Failed - ${result.error || result.data?.error}`);
    }
  }
  
  return true;
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

// Check if we're running as a script
if (require.main === module) {
  // Add a delay to ensure server is running
  setTimeout(() => {
    runAllTests();
  }, 3000);
}

module.exports = { runAllTests, testMembershipInquiry, testTrackerFlow, testAdminLogin };
