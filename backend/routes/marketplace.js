import { Router } from 'express';
import { loadInstalledPackages } from '../runtime/loader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get('/', (req, res) => {
  const installed = loadInstalledPackages();
  const manifestPath = path.join(__dirname, '..', 'packages', 'marketplace.json');
  const { available } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  res.json({ installed, available });
});

export default router;
