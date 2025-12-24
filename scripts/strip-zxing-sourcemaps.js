import fs from 'fs';
import path from 'path';

const targetDir = path.resolve(process.cwd(), 'node_modules/@zxing/browser');

function stripSourceMaps(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`Directory not found: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            stripSourceMaps(fullPath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('sourceMappingURL=')) {
                content = content.replace(/\/\/# sourceMappingURL=.*/g, '');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

console.log('Cleaning up @zxing/browser sourcemaps in', targetDir);
stripSourceMaps(targetDir);
console.log('Done.');
