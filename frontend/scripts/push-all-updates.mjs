import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(process.cwd(), '..');
const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (file === '.git' || file === 'node_modules' || file === '.next' || file === '__pycache__' || file === '.venv' || file === '.env' || file === '.env.local') {
      return;
    }
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'));
    }
  });

  return arrayOfFiles;
}

async function commitAndPushAll() {
  console.log('📦 Root Directory:', rootDir);

  const allFiles = getAllFiles(rootDir);
  console.log(`Adding ${allFiles.length} files to git...`);

  for (const filepath of allFiles) {
    await git.add({ fs, dir: rootDir, filepath });
  }

  // Commit
  const sha = await git.commit({
    fs,
    dir: rootDir,
    message: 'fix(vercel): add root package-lock.json, vercel.json configs and outputFileTracingRoot',
    author: {
      name: 'mrtran25081998-sketch',
      email: 'tranngocgioi.work@gmail.com',
    },
  });
  console.log('✅ Created commit:', sha);

  // Push
  const pushResult = await git.push({
    fs,
    http,
    dir: rootDir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token, password: '' }),
  });
  console.log('🚀 Pushed successfully to GitHub!', pushResult);
}

commitAndPushAll().catch(console.error);
