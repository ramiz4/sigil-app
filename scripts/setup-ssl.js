import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslDir = path.join(__dirname, '../ssl');
const certFile = path.join(sslDir, 'localhost.pem');
const keyFile = path.join(sslDir, 'localhost-key.pem');
const configFile = path.join(sslDir, 'san.cnf');

if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir);
}

// Function to get local IP addresses
function getLocalExternalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

const localIPs = getLocalExternalIPs();
// Ensure 192.168.1.11 is included if not detected, as requested by user
if (!localIPs.includes('192.168.1.11')) {
    localIPs.push('192.168.1.11');
}

console.log(`Detected local IPs: ${localIPs.join(', ')}`);

// Create OpenSSL Configuration for SANs
const sanConfig = `
[req]
default_bits  = 2048
distinguished_name = req_distinguished_name
req_extensions = req_ext
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = localhost

[req_ext]
subjectAltName = @alt_names

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
${localIPs.map((ip, i) => `IP.${i + 1} = ${ip}`).join('\n')}
`;

fs.writeFileSync(configFile, sanConfig);

console.log('Generating SSL certificates with OpenSSL (fallback)...');
try {
    // Generate private key and self-signed cert using the config
    execSync(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyFile}" -out "${certFile}" -config "${configFile}" -extensions v3_req`, {
        stdio: 'inherit'
    });
    console.log('SSL certificates generated successfully in ./ssl/');
    console.log('NOTE: This is a self-signed certificate. You will need to bypass the security warning in your browser (Advanced -> Proceed).');
} catch (e) {
    console.error('Failed to generate certificates:', e.message);
    process.exit(1);
}
