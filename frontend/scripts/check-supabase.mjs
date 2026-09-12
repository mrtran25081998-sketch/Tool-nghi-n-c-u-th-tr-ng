import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local or .env if exists
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim();
    }
    if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = trimmed.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim();
    } else if (!supabaseKey && trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = trimmed.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim();
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Đang kết nối tới Supabase:', supabaseUrl);

async function checkConnection() {
  const { data, error } = await supabase.from('banks').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('❌ Lỗi kết nối hoặc chưa chạy file schema.sql trong SQL Editor:', error.message);
    console.log('👉 Vui lòng dán nội dung file supabase/schema.sql vào SQL Editor trên Supabase Dashboard và nhấn RUN.');
  } else {
    console.log('✅ Kết nối Supabase thành công! Tổng số bản ghi banks hiện tại:', data);
  }
}

checkConnection();
