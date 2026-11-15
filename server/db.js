const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '..', 'notebook_system.db');

let db = null;

async function initDB() {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS notebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_number TEXT UNIQUE NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      brand_model TEXT DEFAULT 'Dell Latitude',
      status TEXT DEFAULT 'available', -- 'available', 'borrowed', 'maintenance'
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notebook_id INTEGER NOT NULL,
      device_number TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      department TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      borrow_date TEXT DEFAULT (datetime('now', 'localtime')),
      expected_return_date TEXT NOT NULL,
      actual_return_date TEXT DEFAULT NULL,
      status TEXT DEFAULT 'borrowed', -- 'borrowed', 'returned', 'overdue'
      purpose TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      FOREIGN KEY (notebook_id) REFERENCES notebooks (id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT DEFAULT 'Administrator'
    );
  `);

  saveDB();
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function all(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDB();
  const res = db.exec('SELECT last_insert_rowid() AS id');
  const id = res && res[0] && res[0].values && res[0].values[0] ? res[0].values[0][0] : null;
  return { lastInsertRowid: id };
}

module.exports = {
  initDB,
  saveDB,
  all,
  get,
  run
};

