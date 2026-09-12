import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unhqxpogmwxwjlwwckqt.supabase.co';
const supabaseKey = 'sb_publishable_JRtMNipkhh3xpK3n9Wxokw_CAsWXuGX';
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(supabaseUrl, supabaseKey);

export const CANONICAL_BANKS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    org_id: DEFAULT_ORG_ID,
    name: 'MB Bank',
    code: 'MB',
    is_mb: true,
    active: true,
    display_order: 0,
    website_url: 'https://www.mbbank.com.vn/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/VietnamMBBank',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    org_id: DEFAULT_ORG_ID,
    name: 'Techcombank',
    code: 'TCB',
    is_mb: false,
    active: true,
    display_order: 1,
    website_url: 'https://techcombank.com/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/Techcombank',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    org_id: DEFAULT_ORG_ID,
    name: 'VietinBank',
    code: 'CTG',
    is_mb: false,
    active: true,
    display_order: 2,
    website_url: 'https://vietinbank.vn/vi/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/VietinBank',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    org_id: DEFAULT_ORG_ID,
    name: 'BIDV',
    code: 'BIDV',
    is_mb: false,
    active: true,
    display_order: 3,
    website_url: 'https://www.bidv.com.vn/vi/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/BIDVbankvietnam',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    org_id: DEFAULT_ORG_ID,
    name: 'VPBank',
    code: 'VPB',
    is_mb: false,
    active: true,
    display_order: 4,
    website_url: 'https://www.vpbank.com.vn/doanh-nghiep',
    facebook_url: 'https://www.facebook.com/VPBankOfficial',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    org_id: DEFAULT_ORG_ID,
    name: 'ACB',
    code: 'ACB',
    is_mb: false,
    active: true,
    display_order: 5,
    website_url: 'https://acb.com.vn/doanh-nghiep',
    facebook_url: 'https://www.facebook.com/NganHangACB',
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    org_id: DEFAULT_ORG_ID,
    name: 'Sacombank',
    code: 'STB',
    is_mb: false,
    active: true,
    display_order: 6,
    website_url: 'https://www.sacombank.com.vn/doanh-nghiep.html',
    facebook_url: 'https://www.facebook.com/SacombankOfficial',
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    org_id: DEFAULT_ORG_ID,
    name: 'SHB',
    code: 'SHB',
    is_mb: false,
    active: true,
    display_order: 7,
    website_url: 'https://www.shb.com.vn/khach-hang-doanh-nghiep/',
    facebook_url: 'https://www.facebook.com/fanpageshb',
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    org_id: DEFAULT_ORG_ID,
    name: 'HDBank',
    code: 'HDB',
    is_mb: false,
    active: true,
    display_order: 8,
    website_url: 'https://hdbank.com.vn/vi/corporate',
    facebook_url: 'https://www.facebook.com/hdbankfanpage',
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    org_id: DEFAULT_ORG_ID,
    name: 'TPBank',
    code: 'TPB',
    is_mb: false,
    active: true,
    display_order: 9,
    website_url: 'https://tpb.vn/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/TPBank',
  },
  {
    id: '10000000-0000-0000-0000-000000000011',
    org_id: DEFAULT_ORG_ID,
    name: 'VIB',
    code: 'VIB',
    is_mb: false,
    active: true,
    display_order: 10,
    website_url: 'https://www.vib.com.vn/vn/khach-hang-doanh-nghiep',
    facebook_url: 'https://www.facebook.com/VIB.NganHangQuocTe',
  },
  {
    id: '10000000-0000-0000-0000-000000000012',
    org_id: DEFAULT_ORG_ID,
    name: 'MSB',
    code: 'MSB',
    is_mb: false,
    active: true,
    display_order: 11,
    website_url: 'https://www.msb.com.vn/vi/doanh-nghiep',
    facebook_url: 'https://www.facebook.com/MSBNganhangHangHai',
  },
  {
    id: '10000000-0000-0000-0000-000000000013',
    org_id: DEFAULT_ORG_ID,
    name: 'OCB',
    code: 'OCB',
    is_mb: false,
    active: true,
    display_order: 12,
    website_url: 'https://ocb.com.vn/vi/doanh-nghiep',
    facebook_url: 'https://www.facebook.com/phuongdongbank',
  },
  {
    id: '10000000-0000-0000-0000-000000000014',
    org_id: DEFAULT_ORG_ID,
    name: 'SeABank',
    code: 'SSB',
    is_mb: false,
    active: true,
    display_order: 13,
    website_url: 'https://www.seabank.com.vn/doanh-nghiep.2',
    facebook_url: 'https://www.facebook.com/NganhangSeABank',
  },
  {
    id: '10000000-0000-0000-0000-000000000015',
    org_id: DEFAULT_ORG_ID,
    name: 'Agribank',
    code: 'AGR',
    is_mb: false,
    active: true,
    display_order: 14,
    website_url: 'https://www.agribank.com.vn/vn/doanh-nghiep',
    facebook_url: 'https://www.facebook.com/AgribankVN',
  },
  {
    id: '10000000-0000-0000-0000-000000000016',
    org_id: DEFAULT_ORG_ID,
    name: 'Vietcombank',
    code: 'VCB',
    is_mb: false,
    active: true,
    display_order: 15,
    website_url: 'https://www.vietcombank.com.vn/vi-VN/KH-DN',
    facebook_url: 'https://www.facebook.com/vietcombank',
  },
];

async function runMigration() {
  console.log('🚀 Bắt đầu migrate 16 ngân hàng và nguồn trong Supabase...');

  for (const b of CANONICAL_BANKS) {
    // 1. Upsert Bank
    const bankPayload = {
      id: b.id,
      org_id: b.org_id,
      name: b.name,
      code: b.code,
      is_mb: b.is_mb,
      active: b.active,
      display_order: b.display_order,
      updated_at: new Date().toISOString(),
    };

    const { error: bankErr } = await supabase.from('banks').upsert(bankPayload);
    if (bankErr) {
      console.error(`❌ Lỗi upsert ngân hàng ${b.name} (${b.code}):`, bankErr.message);
    } else {
      console.log(`✅ Đã upsert ngân hàng: ${b.name} (${b.id})`);
    }

    // 2. Upsert Source Pair
    const pairId = '20000000-0000-0000-0000-' + b.id.slice(-12);
    const pairPayload = {
      id: pairId,
      org_id: b.org_id,
      bank_id: b.id,
      website_url: b.website_url,
      facebook_url: b.facebook_url,
      website_verified: true,
      facebook_verified: false, // Explicitly false since FACEBOOK_ACCESS_TOKEN is required
      display_order: b.display_order,
      updated_at: new Date().toISOString(),
    };

    const { error: pairErr } = await supabase.from('source_pairs').upsert(pairPayload);
    if (pairErr) {
      console.error(`❌ Lỗi upsert source pair cho ${b.name}:`, pairErr.message);
    } else {
      console.log(`✅ Đã upsert source pair cho ${b.name} (bank_id: ${b.id})`);
    }
  }

  // 3. Verify total count in Supabase
  const { data: allBanks } = await supabase.from('banks').select('id, name, code');
  const { data: allPairs } = await supabase.from('source_pairs').select('id, bank_id, website_url');
  console.log(`\n🎉 Hoàn thành migration!`);
  console.log(`- Tổng ngân hàng trong Supabase: ${allBanks?.length}`);
  console.log(`- Tổng cấu hình nguồn trong Supabase: ${allPairs?.length}`);
}

runMigration().catch(console.error);
