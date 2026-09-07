const token = process.argv[2] || process.env.GITHUB_TOKEN;
const sha = process.argv[3] || '5574ab130c9e501d498d2a3b92039fe486f99297';

async function checkStatus() {
  const res = await fetch(`https://api.github.com/repos/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng/commits/${sha}/statuses`, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'node.js',
    },
  });
  const data = await res.json();
  console.log('Statuses count:', data.length);
  if (data.length > 0) {
    console.log('Latest status:', {
      state: data[0].state,
      description: data[0].description,
      target_url: data[0].target_url,
    });
  }
}

checkStatus().catch(console.error);
