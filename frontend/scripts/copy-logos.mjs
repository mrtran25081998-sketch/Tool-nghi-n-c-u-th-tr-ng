import * as fs from 'fs';
import * as path from 'path';

const sourceDark = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\61136ebf-9de2-4d5c-9f1f-05c956fe796e\\.user_uploaded\\media_1788798584406.png';
const sourceLight = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\61136ebf-9de2-4d5c-9f1f-05c956fe796e\\.user_uploaded\\media_1788798584429.png';

const targetDir = path.resolve(process.cwd(), 'public', 'images');
fs.mkdirSync(targetDir, { recursive: true });

fs.copyFileSync(sourceDark, path.join(targetDir, 'mb-logo-dark.png'));
fs.copyFileSync(sourceLight, path.join(targetDir, 'mb-logo-light.png'));

console.log('✅ Copied logos to public/images/:');
console.log('- mb-logo-dark.png (size:', fs.statSync(path.join(targetDir, 'mb-logo-dark.png')).size, 'bytes)');
console.log('- mb-logo-light.png (size:', fs.statSync(path.join(targetDir, 'mb-logo-light.png')).size, 'bytes)');
