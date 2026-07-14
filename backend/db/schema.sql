-- WRS Clinic Gateway — SQLite schema (swap to Postgres for multi-clinic federation later)

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  dob TEXT,
  age INTEGER,
  sex TEXT,
  phone TEXT,
  next_of_kin TEXT,
  address TEXT,
  insurance TEXT,
  national_id TEXT,
  blood_group TEXT,
  allergies TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES patients(id),
  doctor TEXT,
  clinic TEXT,
  date TEXT,
  time TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER REFERENCES patients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  chief_complaint TEXT,
  history TEXT,
  examination TEXT,
  diagnosis TEXT,
  plan TEXT,
  prescription TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  batch TEXT,
  expiry TEXT,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 20,
  supplier TEXT,
  cost_price REAL,
  selling_price REAL
);

CREATE TABLE IF NOT EXISTS dispenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id INTEGER REFERENCES consultations(id),
  medicine_id INTEGER REFERENCES medicines(id),
  quantity INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  direction TEXT, -- 'in' | 'out'
  body TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
