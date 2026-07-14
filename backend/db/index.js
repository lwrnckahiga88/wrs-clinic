import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.WRS_DB_PATH || path.join(__dirname, 'wrs_clinic.sqlite');

export const db = new Database(DB_PATH);

export function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  const { count } = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  if (count === 0 && fs.existsSync(path.join(__dirname, 'seed.sql'))) {
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    db.exec(seed);
  }
}
