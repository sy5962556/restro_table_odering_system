const API_BASE = 'http://localhost:5000/api';

async function runTenantIsolationTests() {
  console.log('🧪 Starting Multi-Tenant Isolation & Security Tests...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  try {
    // Test 1: Super Admin Login & Access
    console.log('1️⃣ Testing Super Admin Platform Access...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@platform.com', password: 'Admin@123' })
    });
    const adminData = await adminLoginRes.json();
    if (!adminData.success) {
      console.log('DEBUG adminData error:', adminData);
    }
    const superAdminToken = adminData.token;
    assert(adminData.success === true, 'Super Admin logged in successfully');
    assert(adminData.user.role === 'superadmin', 'Role verified as superadmin');

    // Fetch platform stats
    const platformStatsRes = await fetch(`${API_BASE}/platform/dashboard`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const platformStats = await platformStatsRes.json();
    assert(platformStats.success === true, 'Super Admin fetched platform dashboard');
    assert(platformStats.stats.totalRestaurants >= 2, 'Super Admin sees multiple restaurants in platform stats');

    // Test 2: Restaurant A Owner Login & Scoped Menu Fetch
    console.log('\n2️⃣ Testing Restaurant A (Royal Spice) Tenant Isolation...');
    const restALoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@restaurant.com', password: 'Admin@123' })
    });
    const restAData = await restALoginRes.json();
    const restAToken = restAData.token;
    const restAId = restAData.user.restaurant._id || restAData.user.restaurant;
    assert(restAData.success === true, 'Restaurant A Owner logged in');

    const restAMenuRes = await fetch(`${API_BASE}/menu/${restAId}`, {
      headers: { Authorization: `Bearer ${restAToken}` }
    });
    const restAMenu = await restAMenuRes.json();
    assert(restAMenu.success === true, 'Restaurant A menu loaded successfully');
    const hasOnlyRestA = restAMenu.items && restAMenu.items.length > 0 && restAMenu.items.every(i => (i.restaurant?._id || i.restaurant).toString() === restAId.toString());
    assert(hasOnlyRestA, 'Restaurant A menu query returned ONLY Restaurant A items');

    // Test 3: Restaurant B Owner Login & Scoped Menu Fetch
    console.log('\n3️⃣ Testing Restaurant B (Urban Cafe) Tenant Isolation...');
    const restBLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ownerB@restaurant.com', password: 'Owner@123' })
    });
    const restBData = await restBLoginRes.json();
    const restBToken = restBData.token;
    const restBId = restBData.user.restaurant._id || restBData.user.restaurant;
    assert(restBData.success === true, 'Restaurant B Owner logged in');

    const restBMenuRes = await fetch(`${API_BASE}/menu/${restBId}`, {
      headers: { Authorization: `Bearer ${restBToken}` }
    });
    const restBMenu = await restBMenuRes.json();
    assert(restBMenu.success === true, 'Restaurant B menu loaded successfully');
    const hasOnlyRestB = restBMenu.items && restBMenu.items.length > 0 && restBMenu.items.every(i => (i.restaurant?._id || i.restaurant).toString() === restBId.toString());
    assert(hasOnlyRestB, 'Restaurant B menu query returned ONLY Restaurant B items');

    // Test 4: Cross-Tenant Security Boundary Enforcement
    console.log('\n4️⃣ Testing Cross-Tenant Security Boundary Enforcement...');
    // Attempt to access Super Admin API with Restaurant A Token
    const unauthorizedRes = await fetch(`${API_BASE}/platform/dashboard`, {
      headers: { Authorization: `Bearer ${restAToken}` }
    });
    assert(unauthorizedRes.status === 403, 'Platform Super Admin endpoint blocked Restaurant A owner with 403 Forbidden');

    // Test 5: Pending Restaurant Account Status Enforcement
    console.log('\n5️⃣ Testing Account Status Enforcement (PENDING Restaurant C)...');
    const pendingRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ownerC@restaurant.com', password: 'Owner@123' })
    });
    const pendingData = await pendingRes.json();
    assert(pendingRes.status === 403 || (pendingData.user && pendingData.user.restaurant?.status === 'PENDING'), 'Pending restaurant status verified');

    console.log('\n----------------------------------------------------');
    console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('----------------------------------------------------\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
  }
}

runTenantIsolationTests();
