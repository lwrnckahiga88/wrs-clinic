import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

// Every runtime package follows the same contract:
//   connect() / initialize() / read() / write() / sync() / health() / shutdown()
// This loader just discovers what's installed and reports it to the app —
// actual behavior for each package lives in its own routes/*.js file, wired
// up manually in server.js for this MVP. A future version can dynamic-import
// api.js from each package folder instead.
export function loadInstalledPackages() {
  if (!fs.existsSync(PACKAGES_DIR)) return [];

  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(PACKAGES_DIR, entry.name);
      const runtimePath = path.join(dir, 'runtime.yaml');
      if (!fs.existsSync(runtimePath)) return null;

      const runtime = yaml.load(fs.readFileSync(runtimePath, 'utf8'));
      return {
        name: runtime.name,
        version: runtime.version,
        category: runtime.category,
        description: runtime.description,
        permissions: runtime.permissions || [],
        events: runtime.events || [],
        api: runtime.api || [],
        status: 'installed'
      };
    })
    .filter(Boolean);
}
