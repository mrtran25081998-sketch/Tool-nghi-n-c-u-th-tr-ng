const token = process.argv[2] || process.env.GITHUB_TOKEN;

async function checkGitHubRepo() {
  const repoRes = await fetch('https://api.github.com/repos/mrtran25081998-sketch/Tool-nghi-n-c-u-th-tr-ng/git/trees/main?recursive=1', {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'node.js',
    },
  });
  const data = await repoRes.json();
  console.log('Total files in GitHub repo:', data.tree?.length);
}

checkGitHubRepo().catch(console.error);
