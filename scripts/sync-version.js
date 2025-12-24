import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 1. Read the new version from package.json
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const newVersion = pkg.version;

// 2. Update src-tauri/tauri.conf.json
const tauriConfigPath = join(root, 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));

console.log(`Syncing version ${newVersion} to tauri.conf.json...`);
tauriConfig.version = newVersion;

writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n', 'utf8');

console.log('Version synced successfully.');
