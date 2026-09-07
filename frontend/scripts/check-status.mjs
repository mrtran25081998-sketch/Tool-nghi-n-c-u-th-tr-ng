const token = process.argv[2] || process.env.GITHUB_TOKEN;

async function checkCommitStatus() {
  const res = await fetch('https://api.github.com/repos/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng/commits/5ccdce5560a31a8a4300bb5de4081343d2272e87/check-runs', {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'node.js',
    },
  });
  const data = await res.json();
  console.log('Check runs:', JSON.stringify(data, null, 2));

  const statusRes = await fetch('https://api.github.com/repos/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng/commits/5ccdce5560a31a8a4300bb5de4081343d2272e87/statuses', {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'node.js',
    },
  });
  const statusData = await statusRes.json();
  console.log('Statuses:', JSON.stringify(statusData, null, 2));
}

checkCommitStatus().catch(console.error);
