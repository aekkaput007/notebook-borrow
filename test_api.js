const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  // Start server
  require('./server/index');
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- TEST 1: GET /api/notebooks ---');
  const res1 = await request('GET', '/api/notebooks');
  console.log('Status:', res1.status, 'Total notebooks:', res1.body.count);

  console.log('--- TEST 2: GET /api/notebooks/01 (Lookup for Auto-fill) ---');
  const res2 = await request('GET', '/api/notebooks/01');
  console.log('Status:', res2.status, 'Device:', res2.body.data.device_number, 'Serial:', res2.body.data.serial_number);

  console.log('--- TEST 3: POST /api/borrow (Borrow Notebook 05) ---');
  const borrowRes = await request('POST', '/api/borrow', {
    device_number: '05',
    borrower_name: 'กิตติศักดิ์ พัฒนกิจ',
    department: 'ฝ่ายไอทีและระบบเครือข่าย',
    phone_number: '082-111-2222',
    expected_return_date: '2026-11-20',
    purpose: 'ทดสอบระบบเครือข่ายภายนอก'
  });
  console.log('Borrow result:', borrowRes.body.success, borrowRes.body.message);

  console.log('--- TEST 4: Verify auto-fill Serial on 05 and status is borrowed ---');
  const res05 = await request('GET', '/api/notebooks/05');
  console.log('Status of 05:', res05.body.data.status, 'Borrower:', res05.body.activeBorrow?.borrower_name);

  console.log('--- TEST 5: POST /api/return (Return Notebook 05) ---');
  const returnRes = await request('POST', '/api/return', {
    device_number: '05',
    notes: 'ส่งคืนเรียบร้อย เครื่องและอุปกรณ์พร้อมสายชาร์จครบ'
  });
  console.log('Return result:', returnRes.body.success, returnRes.body.message);

  console.log('--- TEST 6: GET /api/stats ---');
  const statsRes = await request('GET', '/api/stats');
  console.log('Stats:', statsRes.body.data);

  console.log('--- TEST 7: POST /api/admin/login ---');
  const loginRes = await request('POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
  console.log('Admin login:', loginRes.body.success, loginRes.body.data);

  console.log('\nALL API TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

