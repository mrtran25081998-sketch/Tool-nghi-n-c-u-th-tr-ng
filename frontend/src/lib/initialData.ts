import type { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, SourcePair, CrawlItem } from '../types/index.ts';

export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const INITIAL_BANKS: Bank[] = [
  { id: 'bank-mb', org_id: DEFAULT_ORG_ID, name: 'BIZ MBBank', code: 'MB', is_mb: true, active: true, display_order: 0 },
  { id: 'bank-tcb', org_id: DEFAULT_ORG_ID, name: 'Techcombank Business', code: 'TCB', is_mb: false, active: true, display_order: 1 },
  { id: 'bank-ctg', org_id: DEFAULT_ORG_ID, name: 'VietinBank eFAST', code: 'CTG', is_mb: false, active: true, display_order: 2 },
  { id: 'bank-bidv', org_id: DEFAULT_ORG_ID, name: 'BIDV (BIDV Direct)', code: 'BIDV', is_mb: false, active: true, display_order: 3 },
  { id: 'bank-vpb', org_id: DEFAULT_ORG_ID, name: 'VPBank NEOBiz', code: 'VPB', is_mb: false, active: true, display_order: 4 },
];

export const INITIAL_SOURCE_PAIRS: SourcePair[] = [
  {
    id: 'pair-1',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-tcb',
    bank_name: 'Techcombank',
    facebook_url: 'https://www.facebook.com/techcombank',
    website_url: 'https://www.techcombank.com.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 0,
  },
  {
    id: 'pair-2',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-ctg',
    bank_name: 'VietinBank',
    facebook_url: 'https://www.facebook.com/vietinbank',
    website_url: 'https://www.vietinbank.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 1,
  },
  {
    id: 'pair-3',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vpb',
    bank_name: 'VPBank',
    facebook_url: 'https://www.facebook.com/vpbank',
    website_url: 'https://www.vpbank.com.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 2,
  },
  {
    id: 'pair-4',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-bidv',
    bank_name: 'BIDV',
    facebook_url: 'https://www.facebook.com/bidv',
    website_url: 'https://www.bidv.com.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 3,
  },
  {
    id: 'pair-5',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vcb',
    bank_name: 'Vietcombank',
    facebook_url: 'https://www.facebook.com/vietcombank',
    website_url: 'https://www.vietcombank.com.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 4,
  },
  {
    id: 'pair-6',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-acb',
    bank_name: 'ACB',
    facebook_url: 'https://www.facebook.com/acb',
    website_url: 'https://www.acb.com.vn',
    facebook_verified: true,
    website_verified: true,
    display_order: 5,
  },
];

export const INITIAL_CRAWL_ITEMS: CrawlItem[] = [
  {
    id: 'item-1',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-tcb',
    bank_name: 'Techcombank',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/techcombank',
    detected_at: '2024-03-12',
    title: 'Ra mắt tính năng thanh toán...',
    feature_name: 'Apple Pay trên Techcombank',
    content_hash: 'hash-tcb-1',
    status: 'new',
  },
  {
    id: 'item-2',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-ctg',
    bank_name: 'VietinBank',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/vietinbank',
    detected_at: '2024-03-10',
    title: 'Ưu đãi phí chuyển tiền quốc tế',
    feature_name: 'Chuyển tiền quốc tế',
    content_hash: 'hash-ctg-1',
    status: 'new',
  },
  {
    id: 'item-3',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vpb',
    bank_name: 'VPBank',
    source_type: 'website',
    source_url: 'https://www.vpbank.com.vn',
    detected_at: '2024-03-08',
    title: 'Giải pháp tài trợ chuỗi cung ứng',
    feature_name: 'Cấp hạn mức tín dụng',
    content_hash: 'hash-vpb-1',
    status: 'new',
  },
  {
    id: 'item-4',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-bidv',
    bank_name: 'BIDV',
    source_type: 'website',
    source_url: 'https://www.bidv.com.vn',
    detected_at: '2024-03-05',
    title: 'Dịch vụ nộp thuế doanh nghiệp',
    feature_name: 'Nộp thuế / hóa đơn',
    content_hash: 'hash-bidv-1',
    status: 'new',
  },
  {
    id: 'item-5',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vcb',
    bank_name: 'Vietcombank',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/vietcombank',
    detected_at: '2024-03-03',
    title: 'SME Grow - Đồng hành cùng doanh nghiệp',
    feature_name: 'SME Grow',
    content_hash: 'hash-vcb-1',
    status: 'new',
  },
  {
    id: 'item-6',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-tcb',
    bank_name: 'Techcombank',
    source_type: 'website',
    source_url: 'https://www.techcombank.com.vn',
    detected_at: '2024-03-01',
    title: 'Cập nhật chuyển tiền định kỳ',
    feature_name: 'Scheduled Transfer',
    content_hash: 'hash-tcb-2',
    status: 'new',
  },
  {
    id: 'item-7',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vpb',
    bank_name: 'VPBank',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/vpbank',
    detected_at: '2024-02-26',
    title: 'NEOBiz cập nhật trải nghiệm',
    feature_name: 'Dashboard doanh nghiệp',
    content_hash: 'hash-vpb-2',
    status: 'new',
  },
  {
    id: 'item-8',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-bidv',
    bank_name: 'BIDV',
    source_type: 'website',
    source_url: 'https://www.bidv.com.vn',
    detected_at: '2024-02-22',
    title: 'Nâng cấp sao kê tài khoản',
    feature_name: 'Đối chiếu tài khoản',
    content_hash: 'hash-bidv-2',
    status: 'new',
  },
  {
    id: 'item-9',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-ctg',
    bank_name: 'VietinBank',
    source_type: 'website',
    source_url: 'https://www.vietinbank.vn',
    detected_at: '2024-02-20',
    title: 'eFAST nâng cấp giải ngân',
    feature_name: 'Giải ngân số',
    content_hash: 'hash-ctg-2',
    status: 'new',
  },
  {
    id: 'item-10',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-tcb',
    bank_name: 'Techcombank',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/techcombank',
    detected_at: '2024-02-18',
    title: 'Tính năng quản trị thẻ',
    feature_name: 'Card Management',
    content_hash: 'hash-tcb-3',
    status: 'new',
  },
  {
    id: 'item-11',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-bidv',
    bank_name: 'BIDV',
    source_type: 'facebook',
    source_url: 'https://www.facebook.com/bidv',
    detected_at: '2024-02-14',
    title: 'Ra mắt sản phẩm tiền gửi số',
    feature_name: 'Tiền gửi trực tuyến',
    content_hash: 'hash-bidv-3',
    status: 'new',
  },
  {
    id: 'item-12',
    org_id: DEFAULT_ORG_ID,
    bank_id: 'bank-vpb',
    bank_name: 'VPBank',
    source_type: 'website',
    source_url: 'https://www.vpbank.com.vn',
    detected_at: '2024-02-10',
    title: 'Cải tiến bảo lãnh điện tử',
    feature_name: 'eGuarantee',
    content_hash: 'hash-vpb-3',
    status: 'new',
  },
];

export const INITIAL_GROUPS: BenchmarkGroup[] = [
  { id: 'group-a', org_id: DEFAULT_ORG_ID, name: 'A. ONBOARDING', display_order: 0, active: true, side: 'left' },
  { id: 'group-b', org_id: DEFAULT_ORG_ID, name: 'B. TÀI KHOẢN & THANH TOÁN', display_order: 1, active: true, side: 'left' },
  { id: 'group-c1', org_id: DEFAULT_ORG_ID, name: 'C. TIỀN GỬI VÀ ĐẦU TƯ', display_order: 2, active: true, side: 'left' },
  { id: 'group-c2', org_id: DEFAULT_ORG_ID, name: 'C. TÀI TRỢ THƯƠNG MẠI', display_order: 3, active: true, side: 'right' },
  { id: 'group-d', org_id: DEFAULT_ORG_ID, name: 'D. TÍN DỤNG', display_order: 4, active: true, side: 'right' },
  { id: 'group-e', org_id: DEFAULT_ORG_ID, name: 'E. QUẢN TRỊ TÀI CHÍNH', display_order: 5, active: true, side: 'right' },
];

export const INITIAL_COMPONENTS: BenchmarkComponent[] = [
  // A. ONBOARDING
  { id: 'comp-1', org_id: DEFAULT_ORG_ID, group_id: 'group-a', name: 'Mở TK online', display_order: 0, active: true },
  // B. TÀI KHOẢN & THANH TOÁN
  { id: 'comp-2', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Homepage', display_order: 1, active: true },
  { id: 'comp-3', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Sao kê/sổ phụ', display_order: 2, active: true },
  { id: 'comp-4', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Chuyển tiền 24/7 & theo lô', display_order: 3, active: true },
  { id: 'comp-5', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Nộp thuế / hải quan / hóa đơn', display_order: 4, active: true },
  { id: 'comp-6', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Thẻ doanh nghiệp online', display_order: 5, active: true },
  { id: 'comp-7', org_id: DEFAULT_ORG_ID, group_id: 'group-b', name: 'Thanh toán quốc tế online', display_order: 6, active: true },
  // C. TIỀN GỬI VÀ ĐẦU TƯ
  { id: 'comp-8', org_id: DEFAULT_ORG_ID, group_id: 'group-c1', name: 'Tiền gửi CKH online', display_order: 7, active: true },
  { id: 'comp-9', org_id: DEFAULT_ORG_ID, group_id: 'group-c1', name: 'Sinh lời tự động', display_order: 8, active: true },
  { id: 'comp-10', org_id: DEFAULT_ORG_ID, group_id: 'group-c1', name: 'CDs', display_order: 9, active: true },
  { id: 'comp-11', org_id: DEFAULT_ORG_ID, group_id: 'group-c1', name: 'Sản phẩm đầu tư khác', display_order: 10, active: true },
  // C. TÀI TRỢ THƯƠNG MẠI
  { id: 'comp-12', org_id: DEFAULT_ORG_ID, group_id: 'group-c2', name: 'Mua bán ngoại tệ online', display_order: 11, active: true },
  { id: 'comp-13', org_id: DEFAULT_ORG_ID, group_id: 'group-c2', name: 'L/C online', display_order: 12, active: true },
  // D. TÍN DỤNG
  { id: 'comp-14', org_id: DEFAULT_ORG_ID, group_id: 'group-d', name: 'Cấp hạn mức', display_order: 13, active: true },
  { id: 'comp-15', org_id: DEFAULT_ORG_ID, group_id: 'group-d', name: 'Ký kết văn kiện tín dụng', display_order: 14, active: true },
  { id: 'comp-16', org_id: DEFAULT_ORG_ID, group_id: 'group-d', name: 'Giải ngân online', display_order: 15, active: true },
  { id: 'comp-17', org_id: DEFAULT_ORG_ID, group_id: 'group-d', name: 'Bảo lãnh online', display_order: 16, active: true },
  // E. QUẢN TRỊ TÀI CHÍNH
  { id: 'comp-18', org_id: DEFAULT_ORG_ID, group_id: 'group-e', name: '360 Độ doanh nghiệp', display_order: 17, active: true },
  { id: 'comp-19', org_id: DEFAULT_ORG_ID, group_id: 'group-e', name: 'SME Grow', display_order: 18, active: true },
];

export const INITIAL_CELLS: BenchmarkCell[] = [
  // 1. Mở TK online
  { id: 'c-1-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-1', bank_id: 'bank-mb', score: 3, description: 'Có — ~3 phút, chọn TK số đẹp\nMở tài khoản xong có thể giao dịch được ngay.\nHồ sơ mở tài khoản thiếu có thể bổ sung online' },
  { id: 'c-1-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-1', bank_id: 'bank-tcb', score: 1, description: 'Có — ~10 phút, chọn số TK đẹp.\nMở tài khoản online cần xác minh tại quầy trước khi giao dịch\nHồ sơ thiếu cần bổ sung tại quầy' },
  { id: 'c-1-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-1', bank_id: 'bank-ctg', score: 1, description: 'Có.\nMở tài khoản online cần xác minh tại quầy trước khi giao dịch\nHồ sơ thiếu cần bổ sung tại quầy' },
  { id: 'c-1-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-1', bank_id: 'bank-bidv', score: 1, description: 'Có\nMở tài khoản online cần xác minh tại quầy trước khi giao dịch\nHồ sơ thiếu cần bổ sung tại quầy' },
  { id: 'c-1-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-1', bank_id: 'bank-vpb', score: 1, description: 'Có - ~5 phút\nMở tài khoản online cần xác minh tại quầy trước khi giao dịch\nHồ sơ thiếu cần bổ sung tại quầy' },

  // 2. Homepage
  { id: 'c-2-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-2', bank_id: 'bank-mb', score: 2, description: 'Có — có số dư (bao gồm VNĐ + ngoại tệ)\nCó dòng tiền\nCó danh sách giao dịch gần đây của Maker và Checker' },
  { id: 'c-2-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-2', bank_id: 'bank-tcb', score: 2, description: 'Có — dashboard có:\n- số dư (bao gồm VNĐ + ngoại tệ)\n- Tổng tiền gửi\n- Tổng khoản vay\n- có dòng tiền' },
  { id: 'c-2-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-2', bank_id: 'bank-ctg', score: 2, description: 'Có số dư, biểu đồ thu-chi theo tháng\nnhư các ví điện tử' },
  { id: 'c-2-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-2', bank_id: 'bank-bidv', score: 2, description: 'Có — dashboard có:\n- số dư (bao gồm VNĐ + ngoại tệ)\n- Tổng tiền gửi\n- Tổng khoản vay\n- Dòng tiền vào - ra, SK giao dịch' },
  { id: 'c-2-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-2', bank_id: 'bank-vpb', score: 2, description: 'Có số dư, tiền gửi, khoản vay, sao kê GD gần nhất\nChưa có biểu đồ thu chi, dòng tiền' },

  // 3. Sao kê/sổ phụ
  { id: 'c-3-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-3', bank_id: 'bank-mb', score: 2, description: 'Có' },
  { id: 'c-3-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-3', bank_id: 'bank-tcb', score: 2, description: 'Có' },
  { id: 'c-3-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-3', bank_id: 'bank-ctg', score: 2, description: 'Có' },
  { id: 'c-3-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-3', bank_id: 'bank-bidv', score: 3, description: 'Có, thêm các tính năng\n- Sao kê/sổ phụ\n- Xác nhận số dư từ ngân hàng\n- Đối chiếu tài khoản' },
  { id: 'c-3-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-3', bank_id: 'bank-vpb', score: 2, description: 'Có' },

  // 4. Chuyển tiền 24/7 & theo lô
  { id: 'c-4-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-4', bank_id: 'bank-mb', score: 2, description: 'Có — chuyển tiền nhanh 24/7, theo lô, mã citad\nChuyển ngoại tệ trong nước\nChuyển lương VND\nChưa có chuyển lương ngoại tệ\nChưa có đặt lệnh giao dịch trong tương lai\nChưa có tra soát online' },
  { id: 'c-4-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-4', bank_id: 'bank-tcb', score: 3, description: 'Có — chuyển tiền nhanh 24/7 và theo lô,\ncó tính năng đặt lịch chuyển tiền, có tính năng yêu cầu tra soát chuyển tiền,\ncó đặt lệnh giao dịch trong tương lai' },
  { id: 'c-4-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-4', bank_id: 'bank-ctg', score: 2, description: 'Có — qua TK 24/7 (new), tối đa 5000 GD/file, số tiền tối đa 1 GD đi ngoài hệ thống trên file 500trđ' },
  { id: 'c-4-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-4', bank_id: 'bank-bidv', score: 3, description: 'Có — chuyển tiền nhanh 24/7 và theo lô,\ncó tính năng đặt lịch chuyển tiền, có tính năng yêu cầu tra soát chuyển tiền,\ncó đặt lệnh giao dịch trong tương lai' },
  { id: 'c-4-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-4', bank_id: 'bank-vpb', score: 3, description: 'Có chuyển tiền 24/7/lương/lô (giới hạn 10,000 giao dịch/file chuyển tiền theo lô)\nCó tính năng chuyển tiền định kỳ' },

  // 5. Nộp thuế / hải quan / hóa đơn
  { id: 'c-5-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-5', bank_id: 'bank-mb', score: 2, description: 'Có' },
  { id: 'c-5-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-5', bank_id: 'bank-tcb', score: 2, description: 'Có' },
  { id: 'c-5-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-5', bank_id: 'bank-ctg', score: 2, description: 'Có' },
  { id: 'c-5-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-5', bank_id: 'bank-bidv', score: 2, description: 'Có' },
  { id: 'c-5-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-5', bank_id: 'bank-vpb', score: 2, description: 'Có' },

  // 6. Thẻ doanh nghiệp online
  { id: 'c-6-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-6', bank_id: 'bank-mb', score: 2, description: 'Có phát hành thẻ\nCó quản trị thẻ online\nChưa có thanh toán thẻ' },
  { id: 'c-6-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-6', bank_id: 'bank-tcb', score: 3, description: 'Có phát hành thẻ\nCó quản trị thẻ online\nCó thanh toán thẻ' },
  { id: 'c-6-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-6', bank_id: 'bank-ctg', score: 1, description: 'Chưa có phát hành thẻ\nCó quản trị thẻ online' },
  { id: 'c-6-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-6', bank_id: 'bank-bidv', score: 1, description: 'Chưa có phát hành thẻ\nCó quản trị thẻ online\nCó thanh toán thẻ' },
  { id: 'c-6-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-6', bank_id: 'bank-vpb', score: 0, description: 'Không có' },

  // 7. Thanh toán quốc tế online
  { id: 'c-7-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-7', bank_id: 'bank-mb', score: 2, description: 'Có — chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online\nChưa cho phép thanh toán nhiều đối tác cùng lúc' },
  { id: 'c-7-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-7', bank_id: 'bank-tcb', score: 3, description: 'Có — CTQT online, không giới hạn COT\nCho phép CTQT nhiều đối tác cùng lúc\nBổ sung chứng từ không qua cấp duyệt' },
  { id: 'c-7-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-7', bank_id: 'bank-ctg', score: 2, description: 'Có — chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online\nChưa cho phép thanh toán nhiều đối tác cùng lúc' },
  { id: 'c-7-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-7', bank_id: 'bank-bidv', score: 3, description: 'Chuyển tiền quốc tế online, truy vấn, tra soát\nBổ sung chứng từ online\nCho phép CTQT nhiều đối tác cùng lúc' },
  { id: 'c-7-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-7', bank_id: 'bank-vpb', score: 2, description: 'Chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online' },

  // 8. Tiền gửi CKH online
  { id: 'c-8-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-8', bank_id: 'bank-mb', score: 2, description: 'Có' },
  { id: 'c-8-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-8', bank_id: 'bank-tcb', score: 2, description: 'Có' },
  { id: 'c-8-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-8', bank_id: 'bank-ctg', score: 2, description: 'Có' },
  { id: 'c-8-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-8', bank_id: 'bank-bidv', score: 2, description: 'Có' },
  { id: 'c-8-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-8', bank_id: 'bank-vpb', score: 2, description: 'Có' },

  // 9. Sinh lời tự động
  { id: 'c-9-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-9', bank_id: 'bank-mb', score: 0, description: 'Chưa có' },
  { id: 'c-9-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-9', bank_id: 'bank-tcb', score: 3, description: 'Có' },
  { id: 'c-9-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-9', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-9-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-9', bank_id: 'bank-bidv', score: 3, description: 'Có' },
  { id: 'c-9-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-9', bank_id: 'bank-vpb', score: 0, description: 'Chưa có' },

  // 10. CDs
  { id: 'c-10-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-10', bank_id: 'bank-mb', score: 2, description: 'Có' },
  { id: 'c-10-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-10', bank_id: 'bank-tcb', score: 2, description: 'Có' },
  { id: 'c-10-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-10', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-10-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-10', bank_id: 'bank-bidv', score: 2, description: 'Có' },
  { id: 'c-10-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-10', bank_id: 'bank-vpb', score: 0, description: 'Chưa có' },

  // 11. Sản phẩm đầu tư khác
  { id: 'c-11-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-11', bank_id: 'bank-mb', score: 0, description: 'Chưa có' },
  { id: 'c-11-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-11', bank_id: 'bank-tcb', score: 2, description: 'Có' },
  { id: 'c-11-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-11', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-11-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-11', bank_id: 'bank-bidv', score: 0, description: 'Chưa có' },
  { id: 'c-11-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-11', bank_id: 'bank-vpb', score: 0, description: 'Chưa có' },

  // 12. Mua bán ngoại tệ online
  { id: 'c-12-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-12', bank_id: 'bank-mb', score: 3, description: 'Có khóa tỷ giá cố định\nCó mbeechat tỷ giá ngay trên BIZ' },
  { id: 'c-12-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-12', bank_id: 'bank-tcb', score: 2, description: 'Có khóa tỷ giá cố định\nKhông có mbeechat realtime' },
  { id: 'c-12-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-12', bank_id: 'bank-ctg', score: 3, description: 'Có module bảng giá giao dịch để KH theo dõi biến động tỷ giá\nKhông có mbeechat realtime' },
  { id: 'c-12-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-12', bank_id: 'bank-bidv', score: 2, description: 'Có khóa tỷ giá cố định\nKhông có mbeechat realtime' },
  { id: 'c-12-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-12', bank_id: 'bank-vpb', score: 2, description: 'Có khóa tỷ giá cố định\nKhông có mbeechat realtime' },

  // 13. L/C online
  { id: 'c-13-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-13', bank_id: 'bank-mb', score: 3, description: 'Có tư vấn, phát hành, thanh toán LC online' },
  { id: 'c-13-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-13', bank_id: 'bank-tcb', score: 1, description: 'Có phát hành LC trong khoảng 1 giờ, chưa có tư vấn, thanh toán LC' },
  { id: 'c-13-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-13', bank_id: 'bank-ctg', score: 1, description: 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC' },
  { id: 'c-13-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-13', bank_id: 'bank-bidv', score: 1, description: 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC' },
  { id: 'c-13-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-13', bank_id: 'bank-vpb', score: 1, description: 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC' },

  // 14. Cấp hạn mức
  { id: 'c-14-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-14', bank_id: 'bank-mb', score: 3, description: '1. Có đề nghị cấp hạn mức/điều chỉnh hạn mức online.\n2. Có cấp tín dụng theo quy trình preapproved trọn luồng kênh số.\n3. Có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức' },
  { id: 'c-14-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-14', bank_id: 'bank-tcb', score: 2, description: '1. Có đề nghị cấp hạn mức online\n2. Có hạn mức pre-approved tới 20 tỷ\n3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức' },
  { id: 'c-14-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-14', bank_id: 'bank-ctg', score: 2, description: '1. Có cấp hạn mức online\n2. Không có luồng pre tín chấp online\n3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức' },
  { id: 'c-14-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-14', bank_id: 'bank-bidv', score: 0, description: '1. Không có cấp hạn mức online\n2. Không có luồng Preapproved online\n3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức' },
  { id: 'c-14-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-14', bank_id: 'bank-vpb', score: 2, description: '1. Có cấp hạn mức online\n2. Không có luồng pre tín chấp online\n3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức' },

  // 15. Ký kết văn kiện tín dụng
  { id: 'c-15-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-15', bank_id: 'bank-mb', score: 3, description: 'Có ký số các loại văn kiện tín dụng với doanh nghiệp (trừ văn kiện thế chấp cần công chứng) với tất cả các phương án' },
  { id: 'c-15-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-15', bank_id: 'bank-tcb', score: 0, description: 'Chưa có' },
  { id: 'c-15-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-15', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-15-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-15', bank_id: 'bank-bidv', score: 0, description: 'Chưa có' },
  { id: 'c-15-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-15', bank_id: 'bank-vpb', score: 1, description: 'Có ký số văn kiện tín dụng doanh nghiệp tuy nhiên chỉ ký được với HĐTD của sản phẩm thấu chi tín chấp' },

  // 16. Giải ngân online
  { id: 'c-16-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-16', bank_id: 'bank-mb', score: 3, description: '1. Có giải ngân online\n2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.' },
  { id: 'c-16-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-16', bank_id: 'bank-tcb', score: 3, description: '1. Có giải ngân online\n2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.' },
  { id: 'c-16-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-16', bank_id: 'bank-ctg', score: 2, description: '1. Có giải ngân online\n2. Không có giải ngân tự động' },
  { id: 'c-16-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-16', bank_id: 'bank-bidv', score: 2, description: '1. Có giải ngân online\n2. Không có giải ngân tự động' },
  { id: 'c-16-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-16', bank_id: 'bank-vpb', score: 3, description: '1. Có giải ngân online\n2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.' },

  // 17. Bảo lãnh online
  { id: 'c-17-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-17', bank_id: 'bank-mb', score: 2, description: '1. Có bảo lãnh online\n2. Có bảo lãnh tích hợp eGP' },
  { id: 'c-17-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-17', bank_id: 'bank-tcb', score: 2, description: 'Có phát hành bảo lãnh online trong 1–2 giờ\nCó bảo lãnh tích hợp eGP' },
  { id: 'c-17-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-17', bank_id: 'bank-ctg', score: 2, description: 'Có bảo lãnh online\nCó bảo lãnh tích hợp eGP' },
  { id: 'c-17-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-17', bank_id: 'bank-bidv', score: 2, description: 'Có bảo lãnh online\nCó bảo lãnh tích hợp eGP' },
  { id: 'c-17-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-17', bank_id: 'bank-vpb', score: 2, description: 'Có bảo lãnh online\nCó bảo lãnh tích hợp eGP' },

  // 18. 360 Độ doanh nghiệp
  { id: 'c-18-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-18', bank_id: 'bank-mb', score: 2, description: 'Giai đoạn 1: Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch\nGiai đoạn 2 (dự kiến): Upload, lưu trữ hồ sơ tài chính/pháp lý, thay đổi thông tin DN, quản trị khóa/mở user BIZ' },
  { id: 'c-18-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-18', bank_id: 'bank-tcb', score: 2, description: 'Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch' },
  { id: 'c-18-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-18', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-18-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-18', bank_id: 'bank-bidv', score: 2, description: 'Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch' },
  { id: 'c-18-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-18', bank_id: 'bank-vpb', score: 0, description: 'Chưa có' },

  // 19. SME Grow
  { id: 'c-19-mb', org_id: DEFAULT_ORG_ID, component_id: 'comp-19', bank_id: 'bank-mb', score: 3, description: 'SME Grow & phân tích thị trường\nHealth check BCTC' },
  { id: 'c-19-tcb', org_id: DEFAULT_ORG_ID, component_id: 'comp-19', bank_id: 'bank-tcb', score: 0, description: 'Chưa có' },
  { id: 'c-19-ctg', org_id: DEFAULT_ORG_ID, component_id: 'comp-19', bank_id: 'bank-ctg', score: 0, description: 'Chưa có' },
  { id: 'c-19-bidv', org_id: DEFAULT_ORG_ID, component_id: 'comp-19', bank_id: 'bank-bidv', score: 0, description: 'Chưa có' },
  { id: 'c-19-vpb', org_id: DEFAULT_ORG_ID, component_id: 'comp-19', bank_id: 'bank-vpb', score: 0, description: 'Chưa có' },
];
