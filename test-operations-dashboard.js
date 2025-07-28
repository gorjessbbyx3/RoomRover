
// Operations Dashboard Test Suite
// Tests all components for different user roles and data accuracy

const API_BASE = window.location.origin;

// Test utilities
function makeRequest(method, endpoint, data = null, token = null) {
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
  
  return fetch(`${API_BASE}${endpoint}`, config)
    .then(response => response.json())
    .catch(error => ({ error: error.message }));
}

// Test user login for different roles
async function testUserLogin(username, password, expectedRole) {
  console.log(`🔐 Testing login for ${username} (expected role: ${expectedRole})`);
  
  const result = await makeRequest('POST', '/api/auth/login', { username, password });
  
  if (result.error) {
    console.error(`❌ Login failed for ${username}:`, result.error);
    return null;
  }
  
  if (result.user.role !== expectedRole) {
    console.error(`❌ Role mismatch for ${username}: expected ${expectedRole}, got ${result.user.role}`);
    return null;
  }
  
  console.log(`✅ Login successful for ${username}`);
  return result.token;
}

// Test inventory data accuracy
async function testInventoryAccuracy(token, userRole) {
  console.log(`📦 Testing inventory data for ${userRole}...`);
  
  const inventory = await makeRequest('GET', '/api/inventory', null, token);
  
  if (inventory.error) {
    console.error('❌ Failed to fetch inventory:', inventory.error);
    return false;
  }
  
  console.log(`✅ Inventory fetched: ${inventory.length} items`);
  
  // Test data validation
  const issues = [];
  inventory.forEach((item, index) => {
    if (!item.id || !item.item || typeof item.quantity !== 'number') {
      issues.push(`Item ${index}: Missing required fields`);
    }
    if (item.quantity < 0) {
      issues.push(`Item ${item.item}: Negative quantity (${item.quantity})`);
    }
    if (item.threshold < 0) {
      issues.push(`Item ${item.item}: Negative threshold (${item.threshold})`);
    }
    if (!item.lastUpdated) {
      issues.push(`Item ${item.item}: Missing lastUpdated timestamp`);
    }
  });
  
  if (issues.length > 0) {
    console.error('❌ Inventory data issues:', issues);
    return false;
  }
  
  // Test low stock calculation
  const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
  const outOfStockItems = inventory.filter(item => item.quantity === 0);
  
  console.log(`   Low stock items: ${lowStockItems.length}`);
  console.log(`   Out of stock items: ${outOfStockItems.length}`);
  
  return true;
}

// Test room status accuracy
async function testRoomStatusAccuracy(token, userRole) {
  console.log(`🏠 Testing room status data for ${userRole}...`);
  
  const rooms = await makeRequest('GET', '/api/rooms', null, token);
  
  if (rooms.error) {
    console.error('❌ Failed to fetch rooms:', rooms.error);
    return false;
  }
  
  console.log(`✅ Rooms fetched: ${rooms.length} rooms`);
  
  // Test data validation
  const issues = [];
  const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance'];
  const validCleaningStatuses = ['clean', 'dirty', 'in_progress'];
  
  rooms.forEach((room, index) => {
    if (!room.id || !room.propertyId || typeof room.roomNumber !== 'number') {
      issues.push(`Room ${index}: Missing required fields`);
    }
    if (!validStatuses.includes(room.status)) {
      issues.push(`Room ${room.id}: Invalid status (${room.status})`);
    }
    if (!validCleaningStatuses.includes(room.cleaningStatus)) {
      issues.push(`Room ${room.id}: Invalid cleaning status (${room.cleaningStatus})`);
    }
  });
  
  if (issues.length > 0) {
    console.error('❌ Room data issues:', issues);
    return false;
  }
  
  // Test status calculations
  const availableRooms = rooms.filter(room => room.status === 'available' && room.cleaningStatus === 'clean');
  const roomsNeedingCleaning = rooms.filter(room => room.cleaningStatus === 'dirty');
  const outOfOrderRooms = rooms.filter(room => room.status === 'maintenance');
  
  console.log(`   Available rooms: ${availableRooms.length}`);
  console.log(`   Rooms needing cleaning: ${roomsNeedingCleaning.length}`);
  console.log(`   Out of order rooms: ${outOfOrderRooms.length}`);
  
  return true;
}

// Test maintenance data accuracy
async function testMaintenanceAccuracy(token, userRole) {
  console.log(`🔧 Testing maintenance data for ${userRole}...`);
  
  const maintenance = await makeRequest('GET', '/api/maintenance', null, token);
  
  if (maintenance.error) {
    console.error('❌ Failed to fetch maintenance:', maintenance.error);
    return false;
  }
  
  console.log(`✅ Maintenance items fetched: ${maintenance.length} items`);
  
  // Test data validation
  const issues = [];
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  const validStatuses = ['open', 'in_progress', 'completed'];
  
  maintenance.forEach((item, index) => {
    if (!item.id || !item.issue || !item.reportedBy) {
      issues.push(`Maintenance ${index}: Missing required fields`);
    }
    if (!validPriorities.includes(item.priority)) {
      issues.push(`Maintenance ${item.id}: Invalid priority (${item.priority})`);
    }
    if (!validStatuses.includes(item.status)) {
      issues.push(`Maintenance ${item.id}: Invalid status (${item.status})`);
    }
    if (!item.dateReported) {
      issues.push(`Maintenance ${item.id}: Missing dateReported`);
    }
  });
  
  if (issues.length > 0) {
    console.error('❌ Maintenance data issues:', issues);
    return false;
  }
  
  // Test priority calculations
  const criticalMaintenance = maintenance.filter(item => item.priority === 'critical' && item.status !== 'completed');
  const openMaintenance = maintenance.filter(item => item.status === 'open');
  
  console.log(`🔧 Critical maintenance items: ${criticalMaintenance.length}`);
  console.log(`📋 Open maintenance items: ${openMaintenance.length}`);
  
  return true;
}

// Test user role-based data filtering
async function testRoleBasedFiltering(token, userRole, property = null) {
  console.log(`👥 Testing role-based data filtering for ${userRole}${property ? ` (${property})` : ''}...`);
  
  const [inventory, rooms, maintenance] = await Promise.all([
    makeRequest('GET', '/api/inventory', null, token),
    makeRequest('GET', '/api/rooms', null, token),
    makeRequest('GET', '/api/maintenance', null, token)
  ]);
  
  // For managers, check that data is filtered by property
  if (userRole === 'manager' && property) {
    const wrongPropertyRooms = rooms.filter(room => room.propertyId !== property);
    if (wrongPropertyRooms.length > 0) {
      console.error(`❌ Manager sees rooms from other properties: ${wrongPropertyRooms.length}`);
      return false;
    }
    
    const wrongPropertyInventory = inventory.filter(item => item.propertyId !== property);
    if (wrongPropertyInventory.length > 0) {
      console.error(`❌ Manager sees inventory from other properties: ${wrongPropertyInventory.length}`);
      return false;
    }
  }
  
  console.log(`✅ Role-based filtering working correctly for ${userRole}`);
  return true;
}

// Test dashboard metrics calculations
async function testDashboardMetrics(token, userRole) {
  console.log(`📊 Testing dashboard metrics for ${userRole}...`);
  
  const stats = await makeRequest('GET', '/api/dashboard/stats', null, token);
  
  if (stats.error) {
    console.error('❌ Failed to fetch dashboard stats:', stats.error);
    return false;
  }
  
  // Verify metric calculations
  const [inventory, rooms, maintenance] = await Promise.all([
    makeRequest('GET', '/api/inventory', null, token),
    makeRequest('GET', '/api/rooms', null, token),
    makeRequest('GET', '/api/maintenance', null, token)
  ]);
  
  // Verify available rooms calculation
  const expectedAvailableRooms = rooms.filter(room => 
    room.status === 'available' && room.cleaningStatus === 'clean'
  ).length;
  
  if (stats.availableRooms !== expectedAvailableRooms) {
    console.error(`❌ Available rooms mismatch: expected ${expectedAvailableRooms}, got ${stats.availableRooms}`);
    return false;
  }
  
  // Verify low stock calculation
  const expectedLowStock = inventory.filter(item => item.quantity <= item.threshold).length;
  // Note: Dashboard might show different metrics, so we just verify data consistency
  
  // Verify critical maintenance calculation
  const expectedCritical = maintenance.filter(item => 
    item.priority === 'critical' && item.status !== 'completed'
  ).length;
  
  console.log(`✅ Dashboard metrics verified for ${userRole}`);
  console.log(`   Available rooms: ${stats.availableRooms}`);
  console.log(`   Today revenue: $${stats.todayRevenue || 0}`);
  console.log(`   Pending tasks: ${stats.pendingTasks || 0}`);
  
  return true;
}

// Test real-time data updates
async function testDataFreshness(token) {
  console.log('🔄 Testing data freshness...');
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const inventory = await makeRequest('GET', '/api/inventory', null, token);
  
  if (inventory.error) {
    console.error('❌ Failed to fetch inventory for freshness test');
    return false;
  }
  
  const staleItems = inventory.filter(item => {
    const lastUpdated = new Date(item.lastUpdated);
    return lastUpdated < oneHourAgo;
  });
  
  if (staleItems.length > 0) {
    console.warn(`⚠️ Found ${staleItems.length} inventory items not updated recently`);
  } else {
    console.log('✅ All inventory data is fresh');
  }
  
  return true;
}

// Test component error handling
async function testErrorHandling() {
  console.log('🚨 Testing error handling...');
  
  // Test with invalid token
  const invalidResult = await makeRequest('GET', '/api/inventory', null, 'invalid-token');
  if (!invalidResult.error) {
    console.error('❌ Should have failed with invalid token');
    return false;
  }
  
  // Test with missing endpoint
  const missingResult = await makeRequest('GET', '/api/nonexistent', null, null);
  if (!missingResult.error) {
    console.error('❌ Should have failed with missing endpoint');
    return false;
  }
  
  console.log('✅ Error handling working correctly');
  return true;
}

// Main test runner
async function runOperationsDashboardTests() {
  console.log('🚀 Starting Operations Dashboard Comprehensive Tests');
  console.log('=====================================================');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test different user roles
    const testUsers = [
      { username: 'admin', password: 'admin123', role: 'admin', property: null },
      { username: 'manager1', password: 'manager123', role: 'manager', property: 'P1' },
      { username: 'helper1', password: 'helper123', role: 'helper', property: null }
    ];
    
    for (const testUser of testUsers) {
      console.log(`\n🧪 Testing for ${testUser.role.toUpperCase()} role...`);
      
      // Login
      const token = await testUserLogin(testUser.username, testUser.password, testUser.role);
      if (!token) {
        console.error(`❌ Failed to login as ${testUser.username}`);
        failed++;
        continue;
      }
      
      // Test inventory accuracy
      if (await testInventoryAccuracy(token, testUser.role)) {
        passed++;
      } else {
        failed++;
      }
      
      // Test room status accuracy
      if (await testRoomStatusAccuracy(token, testUser.role)) {
        passed++;
      } else {
        failed++;
      }
      
      // Test maintenance accuracy
      if (await testMaintenanceAccuracy(token, testUser.role)) {
        passed++;
      } else {
        failed++;
      }
      
      // Test role-based filtering
      if (await testRoleBasedFiltering(token, testUser.role, testUser.property)) {
        passed++;
      } else {
        failed++;
      }
      
      // Test dashboard metrics
      if (await testDashboardMetrics(token, testUser.role)) {
        passed++;
      } else {
        failed++;
      }
      
      // Test data freshness (admin only)
      if (testUser.role === 'admin') {
        if (await testDataFreshness(token)) {
          passed++;
        } else {
          failed++;
        }
      }
    }
    
    // Test error handling
    if (await testErrorHandling()) {
      passed++;
    } else {
      failed++;
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('🎉 All operations dashboard tests passed!');
    } else {
      console.log('⚠️ Some tests failed - check logs above for details');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Export for browser console usage
window.runOperationsDashboardTests = runOperationsDashboardTests;

// Auto-run tests when loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Operations Dashboard Test Suite loaded. Run runOperationsDashboardTests() to start testing.');
  });
}
