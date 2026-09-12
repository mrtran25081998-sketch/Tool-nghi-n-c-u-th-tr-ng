import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(process.cwd(), '..');
const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

async function run() {
  console.log('📦 Root Directory:', rootDir);
  console.log('🚀 Đang kết nối và đẩy mã nguồn lên GitHub...');

  const authAttempts = [
    { username: 'x-access-token', password: token },
    { username: 'mrtran25081998-sketch', password: token },
    { username: token, password: 'x-oauth-basic' },
    { username: token, password: '' },
  ];

  for (let i = 0; i < authAttempts.length; i++) {
    const auth = authAttempts[i];
    console.log(`\n⏳ Thử phương thức xác thực [${i + 1}/${authAttempts.length}] (username: ${auth.username})...`);
    try {
      const pushResult = await git.push({
        fs,
        http,
        dir: rootDir,
        remote: 'origin',
        ref: 'main',
        force: true,
        onAuth: () => auth,
      });
      console.log('\n🎉🎉🎉 ĐÃ ĐẨY TOÀN BỘ CODE LÊN GITHUB THÀNH CÔNG! 🎉🎉🎉');
      console.log('Kết quả push:', JSON.stringify(pushResult, null, 2));
      return;
    } catch (err) {
      console.log(`❌ Phương thức [${i + 1}] thất bại: ${err.message}`);
    }
  }

  // Also try with authenticated remote URL
  console.log('\n⏳ Thử phương thức URL nhúng token trực tiếp...');
  try {
    const authedUrl = `https://mrtran25081998-sketch:${token}@github.com/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng.git`;
    await git.addRemote({
      fs,
      dir: rootDir,
      remote: 'origin-auth',
      url: authedUrl,
      force: true,
    });
    const pushResult = await git.push({
      fs,
      http,
      dir: rootDir,
      remote: 'origin-auth',
      ref: 'main',
      force: true,
    });
    console.log('\n🎉🎉🎉 ĐÃ ĐẨY TOÀN BỘ CODE LÊN GITHUB THÀNH CÔNG! 🎉🎉🎉');
    console.log('Kết quả push:', JSON.stringify(pushResult, null, 2));
  } catch (err) {
    console.log(`❌ URL auth thất bại: ${err.message}`);
  }
}

run();
