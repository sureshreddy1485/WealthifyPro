(async () => {
  try {
    let res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'test2', password: 'test', name: 'Test', securityKey: '1234', deviceId: '123' })
    });
    let data = await res.json();
    console.log("Signup:", res.status, data);
    
    if (!res.ok && !data.message.includes('already exists')) {
      return;
    }
    
    res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'test2', password: 'test', securityKey: '1234', deviceId: '123' })
    });
    const loginData = await res.json();
    console.log("Login Status:", res.status, loginData);
    if (!res.ok) return;
    
    const token = loginData.accessToken;
    
    const devRes = await fetch('http://localhost:3000/api/users/devices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Devices Status:", devRes.status, await devRes.json());
    
    const syncRes = await fetch('http://localhost:3000/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { test: 1 } })
    });
    console.log("Sync Status:", syncRes.status, await syncRes.json());
    
    // Test profile upload limit
    const largeStr = 'data:image/jpeg;base64,' + 'A'.repeat(5 * 1024 * 1024);
    const profRes = await fetch('http://localhost:3000/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test2', profilePictureUrl: largeStr })
    });
    console.log("Profile Status:", profRes.status, await profRes.json().catch(e => "parse error"));
    
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
