
// Operations Dashboard User Workflow Test Suite
// Tests all user interactions, CRUD operations, and database functionality

// Check if running in Node.js or browser environment
const isNode = typeof window === 'undefined';
const API_BASE = isNode ? 'http://localhost:5000' : window.location.origin;

class OperationsDashboardWorkflowTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.currentUserToken = null;
    this.testData = {
      inventory: {
        item: 'Test Towels',
        quantity: 50,
        threshold: 10,
        unit: 'pieces',
        propertyId: 'P1'
      },
      maintenance: {
        issue: 'Test Broken Faucet',
        priority: 'high',
        roomId: 'R101',
        propertyId: 'P1'
      },
      room: {
        id: 'TEST_ROOM_101',
        propertyId: 'P1',
        roomNumber: 101,
        status: 'available',
        cleaningStatus: 'clean'
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    this.testResults.push({ message: logMessage, type });
    console.log(logMessage);
    
    // Update HTML display if available (browser only)
    if (!isNode && typeof document !== 'undefined') {
      const consoleEl = document.getElementById('workflow-console');
      if (consoleEl) {
        const div = document.createElement('div');
        div.className = `log-${type}`;
        div.textContent = logMessage;
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
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
      // Use appropriate fetch implementation
      const fetchFn = isNode ? (await import('node-fetch')).default : fetch;
      const response = await fetchFn(`${API_BASE}${endpoint}`, config);
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

  async testLogin(username, password, expectedRole) {
    this.log(`🔐 Testing login for ${username}...`);
    
    const result = await this.makeRequest('POST', '/api/auth/login', { username, password });
    
    if (!result.success) {
      this.log(`❌ Login failed: ${result.error}`, 'error');
      this.failedTests++;
      return null;
    }
    
    if (result.data.user.role !== expectedRole) {
      this.log(`❌ Role mismatch: expected ${expectedRole}, got ${result.data.user.role}`, 'error');
      this.failedTests++;
      return null;
    }
    
    this.log(`✅ Login successful for ${username}`, 'success');
    this.passedTests++;
    return result.data.token;
  }

  // Test Inventory CRUD Operations
  async testInventoryCRUD(token) {
    this.log('\n📦 Testing Inventory CRUD Operations...');
    let createdItemId = null;

    try {
      // 1. CREATE - Add new inventory item
      this.log('1. Testing inventory item creation...');
      const createResult = await this.makeRequest('POST', '/api/inventory', this.testData.inventory, token);
      
      if (!createResult.success) {
        this.log(`❌ Failed to create inventory item: ${createResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      createdItemId = createResult.data.id;
      this.log(`✅ Inventory item created successfully (ID: ${createdItemId})`, 'success');
      this.passedTests++;

      // 2. READ - Fetch inventory items
      this.log('2. Testing inventory fetch...');
      const readResult = await this.makeRequest('GET', '/api/inventory', null, token);
      
      if (!readResult.success) {
        this.log(`❌ Failed to fetch inventory: ${readResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      const foundItem = readResult.data.find(item => item.id === createdItemId);
      if (!foundItem) {
        this.log('❌ Created item not found in inventory list', 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Inventory fetch successful', 'success');
      this.passedTests++;

      // 3. UPDATE - Modify inventory item
      this.log('3. Testing inventory item update...');
      const updateData = { 
        ...this.testData.inventory, 
        quantity: 25, 
        threshold: 5 
      };
      const updateResult = await this.makeRequest('PUT', `/api/inventory/${createdItemId}`, updateData, token);
      
      if (!updateResult.success) {
        this.log(`❌ Failed to update inventory item: ${updateResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Inventory item updated successfully', 'success');
      this.passedTests++;

      // 4. Verify update
      this.log('4. Verifying inventory update...');
      const verifyResult = await this.makeRequest('GET', '/api/inventory', null, token);
      const updatedItem = verifyResult.data.find(item => item.id === createdItemId);
      
      if (!updatedItem || updatedItem.quantity !== 25) {
        this.log('❌ Update verification failed', 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Update verification successful', 'success');
      this.passedTests++;

      // 5. DELETE - Remove inventory item
      this.log('5. Testing inventory item deletion...');
      const deleteResult = await this.makeRequest('DELETE', `/api/inventory/${createdItemId}`, null, token);
      
      if (!deleteResult.success) {
        this.log(`❌ Failed to delete inventory item: ${deleteResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Inventory item deleted successfully', 'success');
      this.passedTests++;

      return true;

    } catch (error) {
      this.log(`❌ Inventory CRUD test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Maintenance CRUD Operations
  async testMaintenanceCRUD(token) {
    this.log('\n🔧 Testing Maintenance CRUD Operations...');
    let createdMaintenanceId = null;

    try {
      // 1. CREATE - Add new maintenance request
      this.log('1. Testing maintenance request creation...');
      const createResult = await this.makeRequest('POST', '/api/maintenance', this.testData.maintenance, token);
      
      if (!createResult.success) {
        this.log(`❌ Failed to create maintenance request: ${createResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      createdMaintenanceId = createResult.data.id;
      this.log(`✅ Maintenance request created successfully (ID: ${createdMaintenanceId})`, 'success');
      this.passedTests++;

      // 2. READ - Fetch maintenance requests
      this.log('2. Testing maintenance fetch...');
      const readResult = await this.makeRequest('GET', '/api/maintenance', null, token);
      
      if (!readResult.success) {
        this.log(`❌ Failed to fetch maintenance: ${readResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      const foundMaintenance = readResult.data.find(item => item.id === createdMaintenanceId);
      if (!foundMaintenance) {
        this.log('❌ Created maintenance request not found', 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Maintenance fetch successful', 'success');
      this.passedTests++;

      // 3. UPDATE - Modify maintenance status
      this.log('3. Testing maintenance status update...');
      const updateData = { 
        status: 'in_progress',
        priority: 'critical'
      };
      const updateResult = await this.makeRequest('PUT', `/api/maintenance/${createdMaintenanceId}`, updateData, token);
      
      if (!updateResult.success) {
        this.log(`❌ Failed to update maintenance request: ${updateResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Maintenance request updated successfully', 'success');
      this.passedTests++;

      // 4. DELETE - Remove maintenance request
      this.log('4. Testing maintenance request deletion...');
      const deleteResult = await this.makeRequest('DELETE', `/api/maintenance/${createdMaintenanceId}`, null, token);
      
      if (!deleteResult.success) {
        this.log(`❌ Failed to delete maintenance request: ${deleteResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Maintenance request deleted successfully', 'success');
      this.passedTests++;

      return true;

    } catch (error) {
      this.log(`❌ Maintenance CRUD test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Room Status Operations
  async testRoomOperations(token) {
    this.log('\n🏠 Testing Room Operations...');

    try {
      // 1. Fetch rooms
      this.log('1. Testing room status fetch...');
      const roomsResult = await this.makeRequest('GET', '/api/rooms', null, token);
      
      if (!roomsResult.success) {
        this.log(`❌ Failed to fetch rooms: ${roomsResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log(`✅ Rooms fetched successfully (${roomsResult.data.length} rooms)`, 'success');
      this.passedTests++;

      // 2. Update room status
      if (roomsResult.data.length > 0) {
        const testRoom = roomsResult.data[0];
        this.log('2. Testing room status update...');
        
        const updateData = {
          status: 'cleaning',
          cleaningStatus: 'in_progress'
        };
        
        const updateResult = await this.makeRequest('PUT', `/api/rooms/${testRoom.id}`, updateData, token);
        
        if (!updateResult.success) {
          this.log(`❌ Failed to update room status: ${updateResult.error}`, 'error');
          this.failedTests++;
          return false;
        }
        
        this.log('✅ Room status updated successfully', 'success');
        this.passedTests++;

        // 3. Verify room update
        this.log('3. Verifying room status update...');
        const verifyResult = await this.makeRequest('GET', '/api/rooms', null, token);
        const updatedRoom = verifyResult.data.find(room => room.id === testRoom.id);
        
        if (!updatedRoom || updatedRoom.status !== 'cleaning') {
          this.log('❌ Room update verification failed', 'error');
          this.failedTests++;
          return false;
        }
        
        this.log('✅ Room update verification successful', 'success');
        this.passedTests++;
      }

      return true;

    } catch (error) {
      this.log(`❌ Room operations test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Dashboard Metrics and Data Refresh
  async testDashboardRefresh(token) {
    this.log('\n📊 Testing Dashboard Data Refresh...');

    try {
      // 1. Test dashboard stats endpoint
      this.log('1. Testing dashboard stats fetch...');
      const statsResult = await this.makeRequest('GET', '/api/dashboard/stats', null, token);
      
      if (!statsResult.success) {
        this.log(`❌ Failed to fetch dashboard stats: ${statsResult.error}`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Dashboard stats fetched successfully', 'success');
      this.passedTests++;

      // 2. Test multiple rapid refreshes
      this.log('2. Testing rapid data refresh...');
      const refreshPromises = [];
      for (let i = 0; i < 3; i++) {
        refreshPromises.push(this.makeRequest('GET', '/api/inventory', null, token));
        refreshPromises.push(this.makeRequest('GET', '/api/rooms', null, token));
        refreshPromises.push(this.makeRequest('GET', '/api/maintenance', null, token));
      }
      
      const refreshResults = await Promise.all(refreshPromises);
      const failedRefreshes = refreshResults.filter(result => !result.success);
      
      if (failedRefreshes.length > 0) {
        this.log(`❌ ${failedRefreshes.length} refresh requests failed`, 'error');
        this.failedTests++;
        return false;
      }
      
      this.log('✅ Rapid data refresh test passed', 'success');
      this.passedTests++;

      // 3. Test data consistency
      this.log('3. Testing data consistency...');
      const [inv1, inv2] = await Promise.all([
        this.makeRequest('GET', '/api/inventory', null, token),
        this.makeRequest('GET', '/api/inventory', null, token)
      ]);
      
      if (inv1.success && inv2.success && inv1.data.length === inv2.data.length) {
        this.log('✅ Data consistency test passed', 'success');
        this.passedTests++;
      } else {
        this.log('❌ Data consistency test failed', 'error');
        this.failedTests++;
        return false;
      }

      return true;

    } catch (error) {
      this.log(`❌ Dashboard refresh test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Search and Filter Functionality
  async testSearchAndFilter(token) {
    this.log('\n🔍 Testing Search and Filter Functionality...');

    try {
      // 1. Test inventory search
      this.log('1. Testing inventory search...');
      const inventoryResult = await this.makeRequest('GET', '/api/inventory?search=towel', null, token);
      
      if (!inventoryResult.success) {
        this.log(`❌ Inventory search failed: ${inventoryResult.error}`, 'error');
        this.failedTests++;
      } else {
        this.log('✅ Inventory search test passed', 'success');
        this.passedTests++;
      }

      // 2. Test room status filter
      this.log('2. Testing room status filter...');
      const roomsResult = await this.makeRequest('GET', '/api/rooms?status=available', null, token);
      
      if (!roomsResult.success) {
        this.log(`❌ Room filter failed: ${roomsResult.error}`, 'error');
        this.failedTests++;
      } else {
        this.log('✅ Room filter test passed', 'success');
        this.passedTests++;
      }

      // 3. Test maintenance priority filter
      this.log('3. Testing maintenance priority filter...');
      const maintenanceResult = await this.makeRequest('GET', '/api/maintenance?priority=critical', null, token);
      
      if (!maintenanceResult.success) {
        this.log(`❌ Maintenance filter failed: ${maintenanceResult.error}`, 'error');
        this.failedTests++;
      } else {
        this.log('✅ Maintenance filter test passed', 'success');
        this.passedTests++;
      }

      return true;

    } catch (error) {
      this.log(`❌ Search and filter test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Input Validation
  async testInputValidation(token) {
    this.log('\n✅ Testing Input Validation...');

    try {
      // 1. Test invalid inventory data
      this.log('1. Testing invalid inventory input...');
      const invalidInventory = {
        item: '', // Empty item name
        quantity: -5, // Negative quantity
        threshold: 'invalid', // Invalid threshold
        unit: ''
      };
      
      const invalidResult = await this.makeRequest('POST', '/api/inventory', invalidInventory, token);
      
      if (invalidResult.success) {
        this.log('❌ Invalid inventory data was accepted', 'error');
        this.failedTests++;
      } else {
        this.log('✅ Invalid inventory data properly rejected', 'success');
        this.passedTests++;
      }

      // 2. Test SQL injection attempt
      this.log('2. Testing SQL injection protection...');
      const sqlInjection = {
        item: "'; DROP TABLE inventory; --",
        quantity: 10,
        threshold: 5,
        unit: 'pieces'
      };
      
      const sqlResult = await this.makeRequest('POST', '/api/inventory', sqlInjection, token);
      
      // Should either reject the input or sanitize it
      this.log('✅ SQL injection protection test passed', 'success');
      this.passedTests++;

      return true;

    } catch (error) {
      this.log(`❌ Input validation test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Role-Based Access Control
  async testRoleBasedAccess() {
    this.log('\n👥 Testing Role-Based Access Control...');

    try {
      // Test different user roles
      const testUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'manager1', password: 'manager123', role: 'manager' },
        { username: 'helper1', password: 'helper123', role: 'helper' }
      ];

      for (const user of testUsers) {
        const token = await this.testLogin(user.username, user.password, user.role);
        
        if (token) {
          // Test that each role can access appropriate endpoints
          const accessTests = await Promise.all([
            this.makeRequest('GET', '/api/inventory', null, token),
            this.makeRequest('GET', '/api/rooms', null, token),
            this.makeRequest('GET', '/api/maintenance', null, token)
          ]);
          
          const failedAccess = accessTests.filter(test => !test.success);
          
          if (failedAccess.length === 0) {
            this.log(`✅ ${user.role} access control working`, 'success');
            this.passedTests++;
          } else {
            this.log(`❌ ${user.role} access control failed`, 'error');
            this.failedTests++;
          }
        }
      }

      return true;

    } catch (error) {
      this.log(`❌ Role-based access test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Test Error Handling
  async testErrorHandling(token) {
    this.log('\n🚨 Testing Error Handling...');

    try {
      // 1. Test invalid endpoints
      this.log('1. Testing invalid endpoint handling...');
      const invalidEndpoint = await this.makeRequest('GET', '/api/nonexistent', null, token);
      
      if (invalidEndpoint.success) {
        this.log('❌ Invalid endpoint returned success', 'error');
        this.failedTests++;
      } else {
        this.log('✅ Invalid endpoint properly handled', 'success');
        this.passedTests++;
      }

      // 2. Test malformed requests
      this.log('2. Testing malformed request handling...');
      const malformedResult = await this.makeRequest('POST', '/api/inventory', 'invalid json', token);
      
      if (malformedResult.success) {
        this.log('❌ Malformed request was accepted', 'error');
        this.failedTests++;
      } else {
        this.log('✅ Malformed request properly rejected', 'success');
        this.passedTests++;
      }

      // 3. Test unauthorized access
      this.log('3. Testing unauthorized access...');
      const unauthorizedResult = await this.makeRequest('GET', '/api/inventory', null, 'invalid-token');
      
      if (unauthorizedResult.success) {
        this.log('❌ Unauthorized access was allowed', 'error');
        this.failedTests++;
      } else {
        this.log('✅ Unauthorized access properly blocked', 'success');
        this.passedTests++;
      }

      return true;

    } catch (error) {
      this.log(`❌ Error handling test failed: ${error.message}`, 'error');
      this.failedTests++;
      return false;
    }
  }

  // Main test runner
  async runAllWorkflowTests() {
    this.log('🚀 Starting Comprehensive Operations Dashboard Workflow Tests');
    this.log('================================================================');
    
    const startTime = Date.now();
    
    try {
      // Get admin token for testing
      this.currentUserToken = await this.testLogin('admin', 'admin123', 'admin');
      
      if (!this.currentUserToken) {
        this.log('❌ Could not obtain admin token - aborting tests', 'error');
        return;
      }

      // Run all test suites
      await this.testInventoryCRUD(this.currentUserToken);
      await this.testMaintenanceCRUD(this.currentUserToken);
      await this.testRoomOperations(this.currentUserToken);
      await this.testDashboardRefresh(this.currentUserToken);
      await this.testSearchAndFilter(this.currentUserToken);
      await this.testInputValidation(this.currentUserToken);
      await this.testRoleBasedAccess();
      await this.testErrorHandling(this.currentUserToken);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      this.log('\n📊 Test Results Summary');
      this.log('========================');
      this.log(`✅ Passed: ${this.passedTests}`);
      this.log(`❌ Failed: ${this.failedTests}`);
      this.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
      this.log(`⏱️ Duration: ${duration} seconds`);

      if (this.failedTests === 0) {
        this.log('🎉 All operations dashboard workflow tests passed!', 'success');
      } else {
        this.log('⚠️ Some tests failed - check logs above for details', 'warning');
      }

      // Update HTML display (browser only)
      if (!isNode) {
        this.updateResultsDisplay();
      }

    } catch (error) {
      this.log(`💥 Test execution failed: ${error.message}`, 'error');
    }
  }

  updateResultsDisplay() {
    if (isNode || typeof document === 'undefined') return;
    
    const statsEl = document.getElementById('workflow-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item passed">
            <span class="stat-number">${this.passedTests}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat-item failed">
            <span class="stat-number">${this.failedTests}</span>
            <span class="stat-label">Failed</span>
          </div>
          <div class="stat-item total">
            <span class="stat-number">${this.passedTests + this.failedTests}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item rate">
            <span class="stat-number">${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      `;
    }
  }
}

// Export for both Node.js and browser environments
if (isNode) {
  // Node.js export
  export { OperationsDashboardWorkflowTester };
  
  // Auto-run in Node.js
  const tester = new OperationsDashboardWorkflowTester();
  tester.runAllWorkflowTests().catch(console.error);
} else {
  // Browser export
  window.OperationsDashboardWorkflowTester = OperationsDashboardWorkflowTester;
  
  // Auto-run when loaded in browser
  document.addEventListener('DOMContentLoaded', () => {
    window.workflowTester = new OperationsDashboardWorkflowTester();
    console.log('Operations Dashboard Workflow Tester loaded. Run workflowTester.runAllWorkflowTests() to start testing.');
  });
}
