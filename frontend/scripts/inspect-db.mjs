import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unhqxpogmwxwjlwwckqt.supabase.co';
const supabaseKey = 'sb_publishable_JRtMNipkhh3xpK3n9Wxokw_CAsWXuGX';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = ['organizations', 'banks', 'source_pairs', 'benchmark_groups', 'benchmark_components', 'benchmark_cells', 'crawl_items'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Bảng [${table}]: Lỗi - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ Bảng [${table}]: Tồn tại, số bản ghi:`, data?.length);
    }
  }
}

inspect();
