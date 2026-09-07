import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(process.cwd(), '..');
const token = process.argv[2] || process.env.GITHUB_TOKEN;

async function commitAndPush() {
  console.log('📦 Root Directory:', rootDir);

  const readmePath = path.join(rootDir, 'README.md');
  let content = fs.readFileSync(readmePath, 'utf8');
  content = content.replace(/<!-- trigger: .* -->/, '') + `\n<!-- trigger: ${new Date().toISOString()} -->\n`;
  fs.writeFileSync(readmePath, content, 'utf8');

  await git.add({ fs, dir: rootDir, filepath: 'README.md' });

  const sha = await git.commit({
    fs,
    dir: rootDir,
    message: 'ci: trigger vercel redeploy',
    author: {
      name: 'mrtran25081998-sketch',
      email: 'tranngocgioi.work@gmail.com',
    },
  });
  console.log('✅ Created commit:', sha);

  const pushResult = await git.push({
    fs,
    http,
    dir: rootDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token, password: '' }),
  });
  console.log('🚀 Pushed successfully to GitHub!', pushResult);
}

commitAndPush().catch(console.error);
