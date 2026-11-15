const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB, all, get, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB before handling requests
initDB().then(() => {
  console.log('Database connected successfully.');
}).catch(err => {
  console.error('Database initialization error:', err);
});

// Helper to determine if a record is overdue
function enrichRecord(rec) {
  if (!rec) return rec;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = rec.status === 'borrowed' && rec.expected_return_date && rec.expected_return_date < today;
  return {
    ...rec,
    is_overdue: Boolean(isOverdue),
    display_status: isOverdue ? 'overdue' : rec.status
  };
}

// ==========================================
// 1. Notebooks Endpoints
// ==========================================

// Get all notebooks with optional search and filter
app.get('/api/notebooks', (req, res) => {
  try {
    const { status, q } = req.query;
    let query = 'SELECT * FROM notebooks WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (q) {
      query += ' AND (device_number LIKE ? OR serial_number LIKE ? OR brand_model LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY CAST(device_number AS INTEGER) ASC, device_number ASC';
    const notebooks = all(query, params);
    res.json({ success: true, count: notebooks.length, data: notebooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lookup notebook by device number or serial number (Used for auto-fill in borrow form)
app.get('/api/notebooks/:identifier', (req, res) => {
  try {
    const rawId = req.params.identifier.trim();
    // Normalize e.g. "1" -> "01"
    const padded = rawId.length === 1 ? `0${rawId}` : rawId;

    let notebook = get(
      'SELECT * FROM notebooks WHERE device_number = ? OR serial_number = ?',
      [padded, rawId]
    );

    if (!notebook) {
      // Also try rawId if padded didn't match
      notebook = get(
        'SELECT * FROM notebooks WHERE device_number = ?',
        [rawId]
      );
    }

    if (!notebook) {
      return res.status(404).json({ success: false, message: `ไม่พบข้อมูลโน้ตบุ๊ก: ${rawId}` });
    }

    // If currently borrowed, also return the current borrower info
    let activeBorrow = null;
    if (notebook.status === 'borrowed') {
      activeBorrow = get(
        'SELECT * FROM borrow_records WHERE notebook_id = ? AND status = "borrowed" ORDER BY id DESC LIMIT 1',
        [notebook.id]
      );
      if (activeBorrow) {
        activeBorrow = enrichRecord(activeBorrow);
      }
    }

    res.json({ success: true, data: notebook, activeBorrow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new notebook
app.post('/api/notebooks', (req, res) => {
  try {
    const { device_number, serial_number, brand_model, notes } = req.body;
    if (!device_number || !serial_number) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกหมายเลขเครื่องและหมายเลขประจำเครื่อง (Serial Number)' });
    }

    const padded = String(device_number).padStart(2, '0');

    // Check duplicate
    const existing = get('SELECT id FROM notebooks WHERE device_number = ? OR serial_number = ?', [padded, serial_number]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'หมายเลขเครื่องหรือ Serial Number นี้มีอยู่ในระบบแล้ว' });
    }

    const result = run(
      'INSERT INTO notebooks (device_number, serial_number, brand_model, status, notes) VALUES (?, ?, ?, "available", ?)',
      [padded, serial_number.trim(), brand_model || 'Dell Latitude', notes || '']
    );

    const created = get('SELECT * FROM notebooks WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, message: 'เพิ่มโน้ตบุ๊กเรียบร้อยแล้ว', data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update notebook
app.put('/api/notebooks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { device_number, serial_number, brand_model, status, notes } = req.body;

    const existing = get('SELECT * FROM notebooks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลโน้ตบุ๊ก' });
    }

    const padded = device_number ? String(device_number).padStart(2, '0') : existing.device_number;

    run(
      `UPDATE notebooks SET 
        device_number = ?, 
        serial_number = ?, 
        brand_model = ?, 
        status = ?, 
        notes = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?`,
      [padded, serial_number || existing.serial_number, brand_model || existing.brand_model, status || existing.status, notes || existing.notes, id]
    );

    const updated = get('SELECT * FROM notebooks WHERE id = ?', [id]);
    res.json({ success: true, message: 'แก้ไขข้อมูลสำเร็จ', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notebook
app.delete('/api/notebooks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = get('SELECT * FROM notebooks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลโน้ตบุ๊ก' });
    }

    if (existing.status === 'borrowed') {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบโน้ตบุ๊กที่กำลังถูกยืมอยู่ได้' });
    }

    run('DELETE FROM notebooks WHERE id = ?', [id]);
    res.json({ success: true, message: `ลบโน้ตบุ๊กหมายเลข ${existing.device_number} เรียบร้อยแล้ว` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. Borrow & Return Operations
// ==========================================

// Borrow a notebook
app.post('/api/borrow', (req, res) => {
  try {
    const { device_number, borrower_name, department, phone_number, expected_return_date, purpose, notes } = req.body;

    if (!device_number || !borrower_name || !department || !phone_number || !expected_return_date) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน: หมายเลขเครื่อง, ชื่อผู้ยืม, แผนก/หน่วยงาน, เบอร์โทร และกำหนดวันคืน'
      });
    }

    const padded = String(device_number).padStart(2, '0');
    const notebook = get('SELECT * FROM notebooks WHERE device_number = ?', [padded]);

    if (!notebook) {
      return res.status(404).json({ success: false, message: `ไม่พบโน้ตบุ๊กหมายเลข ${padded}` });
    }

    if (notebook.status === 'borrowed') {
      return res.status(400).json({ success: false, message: `โน้ตบุ๊กหมายเลข ${padded} กำลังถูกยืมอยู่ในขณะนี้` });
    }

    if (notebook.status === 'maintenance') {
      return res.status(400).json({ success: false, message: `โน้ตบุ๊กหมายเลข ${padded} อยู่ระหว่างส่งซ่อม/ชำรุด ไม่พร้อมให้ยืม` });
    }

    // 1. Insert record
    const result = run(
      `INSERT INTO borrow_records 
      (notebook_id, device_number, serial_number, borrower_name, department, phone_number, expected_return_date, purpose, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrowed')`,
      [
        notebook.id,
        notebook.device_number,
        notebook.serial_number,
        borrower_name.trim(),
        department.trim(),
        phone_number.trim(),
        expected_return_date,
        purpose || '',
        notes || ''
      ]
    );

    // 2. Update notebook status
    run(
      'UPDATE notebooks SET status = "borrowed", updated_at = datetime("now", "localtime") WHERE id = ?',
      [notebook.id]
    );

    const record = get('SELECT * FROM borrow_records WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({
      success: true,
      message: `บันทึกการยืมโน้ตบุ๊กหมายเลข ${notebook.device_number} เรียบร้อยแล้ว`,
      data: enrichRecord(record)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Return a notebook
app.post('/api/return', (req, res) => {
  try {
    const { device_number, record_id, notes } = req.body;

    let record = null;
    if (record_id) {
      record = get('SELECT * FROM borrow_records WHERE id = ? AND status = "borrowed"', [record_id]);
    } else if (device_number) {
      const padded = String(device_number).padStart(2, '0');
      record = get('SELECT * FROM borrow_records WHERE device_number = ? AND status = "borrowed" ORDER BY id DESC LIMIT 1', [padded]);
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการยืมที่ยังไม่ได้คืนสำหรับเครื่องนี้' });
    }

    // 1. Update borrow record
    const returnNotes = notes ? (record.notes ? `${record.notes} | บันทึกการคืน: ${notes}` : `บันทึกการคืน: ${notes}`) : record.notes;
    run(
      `UPDATE borrow_records SET 
        actual_return_date = datetime('now', 'localtime'),
        status = 'returned',
        notes = ?
      WHERE id = ?`,
      [returnNotes, record.id]
    );

    // 2. Update notebook status back to 'available'
    run(
      'UPDATE notebooks SET status = "available", updated_at = datetime("now", "localtime") WHERE id = ?',
      [record.notebook_id]
    );

    const updatedRecord = get('SELECT * FROM borrow_records WHERE id = ?', [record.id]);
    res.json({
      success: true,
      message: `รับคืนโน้ตบุ๊กหมายเลข ${record.device_number} (${record.serial_number}) เรียบร้อยแล้ว`,
      data: enrichRecord(updatedRecord)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. History & Search Endpoints
// ==========================================

// Get borrow records with flexible search & filtering
app.get('/api/records', (req, res) => {
  try {
    const { q, status, department, startDate, endDate, limit = 100, offset = 0 } = req.query;
    let query = 'SELECT * FROM borrow_records WHERE 1=1';
    const params = [];

    if (q) {
      query += ` AND (
        borrower_name LIKE ? OR 
        department LIKE ? OR 
        phone_number LIKE ? OR 
        device_number LIKE ? OR 
        serial_number LIKE ? OR
        purpose LIKE ?
      )`;
      const term = `%${q}%`;
      params.push(term, term, term, term, term, term);
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    if (startDate) {
      query += ' AND date(borrow_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date(borrow_date) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const records = all(query, params).map(enrichRecord);

    // Filter by display_status if requested (e.g. 'overdue', 'borrowed', 'returned')
    let filtered = records;
    if (status && status !== 'all') {
      filtered = records.filter(r => r.display_status === status || (status === 'borrowed' && r.status === 'borrowed'));
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get overdue alerts
app.get('/api/overdue', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdueRecords = all(
      'SELECT * FROM borrow_records WHERE status = "borrowed" AND expected_return_date < ? ORDER BY expected_return_date ASC',
      [today]
    ).map(enrichRecord);

    res.json({ success: true, count: overdueRecords.length, data: overdueRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. Statistics & Analytics Dashboard
// ==========================================

app.get('/api/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Counts
    const totalNotebooks = get('SELECT COUNT(*) as count FROM notebooks').count;
    const availableNotebooks = get('SELECT COUNT(*) as count FROM notebooks WHERE status = "available"').count;
    const borrowedNotebooks = get('SELECT COUNT(*) as count FROM notebooks WHERE status = "borrowed"').count;
    const maintenanceNotebooks = get('SELECT COUNT(*) as count FROM notebooks WHERE status = "maintenance"').count;
    const totalBorrows = get('SELECT COUNT(*) as count FROM borrow_records').count;
    
    // Overdue count
    const overdueCount = get(
      'SELECT COUNT(*) as count FROM borrow_records WHERE status = "borrowed" AND expected_return_date < ?',
      [today]
    ).count;

    // Department stats
    const deptStats = all(`
      SELECT department, COUNT(*) as count 
      FROM borrow_records 
      GROUP BY department 
      ORDER BY count DESC 
      LIMIT 6
    `);

    // Top borrowed notebooks
    const topNotebooks = all(`
      SELECT device_number, serial_number, COUNT(*) as count 
      FROM borrow_records 
      GROUP BY device_number 
      ORDER BY count DESC 
      LIMIT 6
    `);

    // Recent 5 transactions
    const recentActivity = all('SELECT * FROM borrow_records ORDER BY id DESC LIMIT 5').map(enrichRecord);

    res.json({
      success: true,
      data: {
        totalNotebooks,
        availableNotebooks,
        borrowedNotebooks,
        maintenanceNotebooks,
        totalBorrows,
        overdueCount,
        deptStats,
        topNotebooks,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. Admin Authentication
// ==========================================

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Password' });
    }

    const admin = get('SELECT id, username, full_name FROM admin_users WHERE username = ? AND password = ?', [username.trim(), password]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. Serve Frontend Static in Production
// ==========================================
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Notebook Borrow System Server running at http://localhost:${PORT}`);
});

