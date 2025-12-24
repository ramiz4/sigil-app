import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslDir = path.join(__dirname, '../ssl');
const certFile = path.join(sslDir, 'localhost.pem');
const keyFile = path.join(sslDir, 'localhost-key.pem');

if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

try {
    console.log('Checking for mkcert...');
    execSync('mkcert -version', { stdio: 'ignore' });
} catch (e) {
    console.error('Error: mkcert is not installed. Please install it (e.g. brew install mkcert) and run this script again.');
    process.exit(1);
}

if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.log('Generating SSL certificates...');
    try {
        try {
            execSync('mkcert -install', { stdio: 'inherit' });
        } catch (e) {
            console.warn('Warning: "mkcert -install" failed (maybe sudo issue?). Continuing to generate certs anyway...');
        }

        // Add local IP 192.168.1.11 explicitly as requested
        execSync(`mkcert -key-file "${keyFile}" -cert-file "${certFile}" localhost 127.0.0.1 0.0.0.0 ::1 192.168.1.11`, {
            stdio: 'inherit',
            cwd: sslDir
        });
        console.log('SSL certificates generated successfully in ./ssl/');
    } catch (e) {
        console.error('Failed to generate certificates:', e.message);
        process.exit(1);
    }
} else {
    console.log('SSL certificates already exist.');
}
