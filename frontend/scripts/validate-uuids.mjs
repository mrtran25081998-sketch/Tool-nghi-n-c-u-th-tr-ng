import * as fs from 'fs';
import * as path from 'path';

function checkSQLFile(relPath) {
  const filePath = path.resolve(process.cwd(), '..', relPath);
  const content = fs.readFileSync(filePath, 'utf8');
  const uuidRegex = /'[0-9a-fA-F-]+'/g;
  const matches = content.match(uuidRegex) || [];
  let errors = 0;
  const strictUUIDRegex = /^'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'$/;

  matches.forEach((m) => {
    if (/^'[0-5][0-9a-fA-F-]*'$/.test(m)) {
      if (!strictUUIDRegex.test(m)) {
        console.error(`❌ Invalid UUID in ${relPath}: ${m} (length without quotes: ${m.length - 2})`);
        errors++;
      }
    }
  });

  if (errors === 0) {
    console.log(`✅ All UUIDs in ${relPath} are 100% valid!`);
  }
}

checkSQLFile('supabase/all_in_one.sql');
checkSQLFile('supabase/seed.sql');
