import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://unhqxpogmwxwjlwwckqt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function countAll() {
  const tables = ['banks', 'benchmark_groups', 'benchmark_components', 'benchmark_cells', 'crawl_items', 'crawl_jobs', 'source_pairs'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}:`, error ? `error: ${error.message}` : count);
  }
}

countAll();
