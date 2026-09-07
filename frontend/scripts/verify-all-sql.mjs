import * as fs from 'fs';
import * as path from 'path';

function verifySQLIntegrity(relPath) {
  const filePath = path.resolve(process.cwd(), '..', relPath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract component IDs
  const compIdRegex = /\('([0-9a-fA-F-]+)',\s*'00000000-0000-0000-0000-000000000001',\s*'30000000-[0-9a-fA-F-]+'/g;
  const declaredCompIds = new Set();
  let match;
  while ((match = compIdRegex.exec(content)) !== null) {
    declaredCompIds.add(match[1]);
  }
  console.log(`Declared components count: ${declaredCompIds.size}`);

  // Extract cells
  const cellRegex = /\('00000000-0000-0000-0000-000000000001',\s*'([0-9a-fA-F-]+)',\s*'([0-9a-fA-F-]+)',\s*([0-3]|null),\s*'/g;
  let cellCount = 0;
  let missingComp = 0;
  while ((match = cellRegex.exec(content)) !== null) {
    cellCount++;
    const compId = match[1];
    if (!declaredCompIds.has(compId)) {
      console.error(`❌ Cell references non-existent component: ${compId}`);
      missingComp++;
    }
  }
  console.log(`Cells count: ${cellCount}, Missing component refs: ${missingComp}`);
}

verifySQLIntegrity('supabase/all_in_one.sql');
