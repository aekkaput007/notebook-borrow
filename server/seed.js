const { initDB, all, run, get } = require('./db');

async function seed() {
  await initDB();
  console.log('Database initialized. Seeding data...');

  // 1. Seed Admin
  const admin = get('SELECT * FROM admin_users WHERE username = ?', ['admin']);
  if (!admin) {
    run(
      'INSERT INTO admin_users (username, password, full_name) VALUES (?, ?, ?)',
      ['admin', 'admin123', 'ผู้ดูแลระบบไอที']
    );
    console.log('Seeded default admin: admin / admin123');
  }

  // 2. Seed Notebooks (01 to 99)
  const existingCount = get('SELECT COUNT(*) as count FROM notebooks');
  if (!existingCount || existingCount.count === 0) {
    console.log('Seeding notebooks 01 to 99...');
    const brands = [
      'Dell Latitude 3420',
      'Lenovo ThinkPad L14',
      'HP ProBook 440 G8',
      'Acer TravelMate P2',
      'ASUS ExpertBook B1'
    ];

    for (let i = 1; i <= 99; i++) {
      const devNum = String(i).padStart(2, '0');
      const brand = brands[(i - 1) % brands.length];
      const prefix = brand.split(' ')[0].toUpperCase();
      const serial = `SN-${prefix}-${String(1000 + i * 7)}-${devNum}`;
      
      run(
        'INSERT INTO notebooks (device_number, serial_number, brand_model, status, notes) VALUES (?, ?, ?, ?, ?)',
        [devNum, serial, brand, 'available', `โน้ตบุ๊กประจำสำนักงาน หมายเลข ${devNum}`]
      );
    }
    console.log('Successfully seeded 99 notebooks!');

    // 3. Seed some initial borrow records for demonstration
    // Notebook 01: currently borrowed
    run('UPDATE notebooks SET status = ? WHERE device_number = ?', ['borrowed', '01']);
    run(
      `INSERT INTO borrow_records 
      (notebook_id, device_number, serial_number, borrower_name, department, phone_number, borrow_date, expected_return_date, status, purpose, notes)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-2 days'), date('now', '+3 days'), 'borrowed', 'นำไปอบรมสัมมนา', 'เครื่องสภาพปกติ')`,
      [1, '01', 'SN-DELL-1007-01', 'สมชาย ใจดี', 'ฝ่ายบุคคล (HR)', '081-234-5678']
    );

    // Notebook 02: OVERDUE demo! (Borrow date was 5 days ago, expected return was yesterday)
    run('UPDATE notebooks SET status = ? WHERE device_number = ?', ['borrowed', '02']);
    run(
      `INSERT INTO borrow_records 
      (notebook_id, device_number, serial_number, borrower_name, department, phone_number, borrow_date, expected_return_date, status, purpose, notes)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-5 days'), date('now', '-1 days'), 'borrowed', 'จัดทำเอกสารงบประมาณ', 'เครื่องสภาพปกติ (เตือนเกินกำหนด)')`,
      [2, '02', 'SN-LENOVO-1014-02', 'สุดา มงคลสุข', 'ฝ่ายการเงินและบัญชี', '089-876-5432']
    );

    // Notebook 03: Returned record (Completed)
    run(
      `INSERT INTO borrow_records 
      (notebook_id, device_number, serial_number, borrower_name, department, phone_number, borrow_date, expected_return_date, actual_return_date, status, purpose, notes)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-7 days'), date('now', '-4 days'), datetime('now', '-4 days'), 'returned', 'นำเสนองานลูกค้า', 'ส่งคืนเรียบร้อย ตรวจสอบอุปกรณ์ครบ')`,
      [3, '03', 'SN-HP-1021-03', 'วิโรจน์ แสนสุข', 'ฝ่ายการตลาด', '085-555-1234']
    );

    // Notebook 04: Maintenance demo
    run('UPDATE notebooks SET status = ? WHERE device_number = ?', ['maintenance', '04']);

    console.log('Seeded demo borrow/return records!');
  } else {
    console.log(`Notebooks already exist (${existingCount.count} records). Skipping seed.`);
  }

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;

