import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unhqxpogmwxwjlwwckqt.supabase.co';
const supabaseKey = 'sb_publishable_JRtMNipkhh3xpK3n9Wxokw_CAsWXuGX';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
  const tables = ['banks', 'benchmark_groups', 'benchmark_components', 'benchmark_cells', 'source_pairs', 'crawl_items'];
  console.log('📊 THỐNG KÊ DỮ LIỆU TRÊN SUPABASE CLOUD:');
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${table}: Lỗi ${error.message}`);
    } else {
      console.log(`✅ Bảng [${table}]: ${count} bản ghi`);
    }
  }
}

checkCounts();
