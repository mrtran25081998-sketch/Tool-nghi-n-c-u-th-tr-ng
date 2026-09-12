import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(process.cwd(), '..');

// Helper to check if file is ignored
function shouldIgnore(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const ignorePatterns = [
    'node_modules',
    '.next',
    '.git',
    '__pycache__',
    '.env',
    '.env.local',
    '.tempmediaStorage',
    '.system_generated',
    'venv',
    '.pytest_cache',
    'dist',
    'build',
    '.vscode',
  ];
  return ignorePatterns.some((p) => normalized.startsWith(p) || normalized.includes(`/${p}/`) || normalized.endsWith(`/${p}`));
}

// Recursively find all files in rootDir
function getAllFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (shouldIgnore(relPath)) continue;

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else {
      files.push(relPath.replace(/\\/g, '/'));
    }
  }
  return files;
}

async function run() {
  console.log('📦 Root Directory:', rootDir);

  // 1. Initialize git repo if needed
  try {
    await git.init({ fs, dir: rootDir, defaultBranch: 'main' });
    console.log('✅ Initialized Git repository at root');
  } catch (err) {
    console.log('ℹ️ Git repo exists or already initialized:', err.message);
  }

  // 2. Add all files
  const files = getAllFiles(rootDir);
  console.log(`📁 Adding ${files.length} files to Git index...`);

  for (const file of files) {
    try {
      await git.add({ fs, dir: rootDir, filepath: file });
    } catch (e) {
      // ignore
    }
  }
  console.log('✅ Added all files to staging');

  // 3. Commit
  try {
    const sha = await git.commit({
      fs,
      dir: rootDir,
      author: {
        name: 'mrtran25081998-sketch',
        email: 'tran@example.com',
      },
      message: 'feat: initial commit - MB Competitive Product Intelligence Tool (Frontend Next.js, Backend Crawler Worker, Supabase Schema & Seeds)',
    });
    console.log('✅ Committed successfully with SHA:', sha);
  } catch (err) {
    console.log('ℹ️ Commit status:', err.message);
  }

  // 4. Check remote
  const remoteUrl = 'https://github.com/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng.git';
  try {
    await git.addRemote({
      fs,
      dir: rootDir,
      remote: 'origin',
      url: remoteUrl,
      force: true,
    });
    console.log('✅ Configured remote origin:', remoteUrl);
  } catch (e) {
    // ignore
  }

  // 5. Check if token or password provided
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.argv[2];
  if (token) {
    console.log('🚀 Đang đẩy code lên GitHub...');
    try {
      const pushResult = await git.push({
        fs,
        http,
        dir: rootDir,
        remote: 'origin',
        ref: 'main',
        force: true,
        onAuth: () => ({ username: token }),
      });
      console.log('🎉 Đã đẩy code lên GitHub thành công!', pushResult);
    } catch (pushErr) {
      console.error('❌ Push error:', pushErr.message);
    }
  } else {
    console.log('ℹ️ Local repository đã được khởi tạo và commit đầy đủ. Cần Personal Access Token để push lên GitHub.');
  }
}

run();
