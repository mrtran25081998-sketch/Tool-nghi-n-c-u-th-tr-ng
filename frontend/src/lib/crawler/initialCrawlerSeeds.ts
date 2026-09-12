import { CrawlSource, SourceDiscoveredUrl } from '@/types';

export interface BankSeedData {
  bank_name: string;
  bank_code: string;
  is_mb: boolean;
  facebook_url: string;
  facebook_status: 'VERIFIED' | 'MANUAL_VERIFY' | 'FAILED';
  facebook_priority: number;
  website_seed_url: string;
  website_status: 'VERIFIED' | 'MANUAL_VERIFY' | 'FAILED';
  platform_name: string;
  initial_discovered_urls: {
    url: string;
    page_title: string;
    classification:
      | 'BUSINESS_HUB'
      | 'PRODUCT_HUB'
      | 'PRODUCT_DETAIL'
      | 'DIGITAL_BANKING'
      | 'NEWS'
      | 'PROMOTION'
      | 'PROGRAM'
      | 'GUIDE'
      | 'LOGIN'
      | 'IRRELEVANT';
    relevance_score: number;
    reason: string;
    status: 'TRACKING' | 'REVIEW' | 'IGNORE';
  }[];
}

export const INITIAL_BANK_SEEDS: BankSeedData[] = [
  {
    bank_name: 'Techcombank Business',
    bank_code: 'TCB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/Techcombank',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho',
    website_status: 'VERIFIED',
    platform_name: 'Techcombank Business',
    initial_discovered_urls: [
      {
        url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho',
        page_title: 'Techcombank Doanh Nghiệp Nhỏ & SME Hub',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.98,
        reason: 'Root Business Hub chứa thông tin tài khoản, tín dụng và thanh toán doanh nghiệp',
        status: 'TRACKING',
      },
      {
        url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho/ngan-hang-so/techcombank-business',
        page_title: 'Nền tảng Ngân hàng số Techcombank Business',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Sản phẩm ngân hàng số chủ lực Techcombank Business',
        status: 'TRACKING',
      },
      {
        url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/uu-dai-doanh-nghiep',
        page_title: 'Ưu đãi & Khuyến mại SME Techcombank',
        classification: 'PROMOTION',
        relevance_score: 0.92,
        reason: 'Trang thông tin chương trình ưu đãi phí và hoàn tiền doanh nghiệp',
        status: 'TRACKING',
      },
      {
        url: 'https://techcombank.com/tuyen-dung',
        page_title: 'Cơ hội nghề nghiệp Techcombank',
        classification: 'IRRELEVANT',
        relevance_score: 0.05,
        reason: 'Trang tuyển dụng nhân sự, không thuộc phạm vi sản phẩm kinh doanh',
        status: 'IGNORE',
      },
    ],
  },
  {
    bank_name: 'VietinBank eFAST',
    bank_code: 'CTG',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/VietinBank.vn',
    facebook_status: 'MANUAL_VERIFY',
    facebook_priority: 1,
    website_seed_url: 'https://www.vietinbank.vn/doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'VietinBank eFAST',
    initial_discovered_urls: [
      {
        url: 'https://www.vietinbank.vn/doanh-nghiep',
        page_title: 'Khách hàng Doanh nghiệp - VietinBank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.97,
        reason: 'Cổng thông tin giải pháp doanh nghiệp và tài chính toàn diện',
        status: 'TRACKING',
      },
      {
        url: 'https://www.vietinbank.vn/cong-cu-tien-ich/eFAST/dang-ky-efast',
        page_title: 'Đăng ký & Trải nghiệm Ngân hàng số VietinBank eFAST',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Nền tảng eFAST cho khách hàng doanh nghiệp SME & Corporate',
        status: 'TRACKING',
      },
      {
        url: 'https://efast.vietinbank.vn/',
        page_title: 'Cổng đăng nhập VietinBank eFAST Portal',
        classification: 'LOGIN',
        relevance_score: 0.65,
        reason: 'Login portal có thể chứa thông báo nâng cấp và tính năng mới công khai',
        status: 'REVIEW',
      },
    ],
  },
  {
    bank_name: 'VPBank NEOBiz',
    bank_code: 'VPB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/vpbank.sme',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://www.vpbank.com.vn/doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'VPBank NEOBiz',
    initial_discovered_urls: [
      {
        url: 'https://www.vpbank.com.vn/doanh-nghiep',
        page_title: 'Giải pháp Tài chính Doanh nghiệp VPBank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.96,
        reason: 'Hub doanh nghiệp vừa và nhỏ SME, quản trị dòng tiền',
        status: 'TRACKING',
      },
      {
        url: 'https://www.vpbank.com.vn/neobiz',
        page_title: 'Ứng dụng Ngân hàng số Doanh nghiệp VPBank NEOBiz',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Nền tảng NEOBiz thế hệ mới',
        status: 'TRACKING',
      },
      {
        url: 'https://www.vpbank.com.vn/doanh-nghiep/tin-tuc-su-kien',
        page_title: 'Tin tức & Khuyến mại Doanh nghiệp VPBank',
        classification: 'NEWS',
        relevance_score: 0.88,
        reason: 'Bản tin ra mắt tính năng và gói giải pháp số',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'BIDV (BIDV Direct)',
    bank_code: 'BIDV',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/BIDVbankvietnam',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://bidv.com.vn/vn/doanh-nghiep/',
    website_status: 'VERIFIED',
    platform_name: 'BIDV Direct',
    initial_discovered_urls: [
      {
        url: 'https://bidv.com.vn/vn/doanh-nghiep/',
        page_title: 'Khách hàng Doanh nghiệp BIDV',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.96,
        reason: 'Hub doanh nghiệp lớn và SME BIDV',
        status: 'TRACKING',
      },
      {
        url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/',
        page_title: 'Hệ sinh thái Ngân hàng số Doanh nghiệp BIDV',
        classification: 'DIGITAL_BANKING',
        relevance_score: 0.97,
        reason: 'Digital Hub ngân hàng số chuyên sâu',
        status: 'TRACKING',
      },
      {
        url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct/',
        page_title: 'Nền tảng BIDV Direct Doanh Nghiệp',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Sản phẩm nền tảng BIDV Direct',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'Vietcombank',
    bank_code: 'VCB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/ilovevcb',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://www.vietcombank.com.vn/vi-VN/To-chuc/SMEs',
    website_status: 'VERIFIED',
    platform_name: 'VCB DigiBiz',
    initial_discovered_urls: [
      {
        url: 'https://www.vietcombank.com.vn/vi-VN/To-chuc/SMEs',
        page_title: 'Khách hàng Tổ chức SME - Vietcombank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.96,
        reason: 'Cổng giải pháp SME Vietcombank',
        status: 'TRACKING',
      },
      {
        url: 'https://vietcombank.com.vn/vi-VN/To-chuc/SMEs/Gi%E1%BA%A3i-ph%C3%A1p/KHTC-SME---Ngan-hang-so/KHTC---VCB-DigiBiz',
        page_title: 'Dịch vụ Ngân hàng số VCB DigiBiz',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Nền tảng ngân hàng số VCB DigiBiz dành cho SME',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'ACB ONE BIZ',
    bank_code: 'ACB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/NganHangACB/',
    facebook_status: 'MANUAL_VERIFY',
    facebook_priority: 1,
    website_seed_url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan',
    website_status: 'VERIFIED',
    platform_name: 'ACB ONE BIZ',
    initial_discovered_urls: [
      {
        url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan',
        page_title: 'Giải pháp Thanh toán Doanh nghiệp ACB',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.95,
        reason: 'Hub giải pháp thanh toán và tài chính doanh nghiệp ACB',
        status: 'TRACKING',
      },
      {
        url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz',
        page_title: 'Ngân hàng số ACB ONE BIZ',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Nền tảng ACB ONE BIZ cho doanh nghiệp vừa và nhỏ',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'TPBank Biz',
    bank_code: 'TPB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/TPBank',
    facebook_status: 'MANUAL_VERIFY',
    facebook_priority: 1,
    website_seed_url: 'https://tpb.vn/doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'TPBank Biz',
    initial_discovered_urls: [
      {
        url: 'https://tpb.vn/doanh-nghiep',
        page_title: 'Khách hàng Doanh nghiệp TPBank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.95,
        reason: 'Hub dịch vụ số và sản phẩm doanh nghiệp TPBank',
        status: 'TRACKING',
      },
      {
        url: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz',
        page_title: 'Ngân hàng điện tử TPBank Biz (eBank Biz)',
        classification: 'PRODUCT_DETAIL',
        relevance_score: 0.99,
        reason: 'Nền tảng TPBank Biz chuyên biệt cho doanh nghiệp',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'BIZ MBBank',
    bank_code: 'MB',
    is_mb: true,
    facebook_url: 'https://www.facebook.com/VietnamMBBank',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://business.mbbank.com.vn',
    website_status: 'VERIFIED',
    platform_name: 'BIZ MBBank',
    initial_discovered_urls: [
      {
        url: 'https://business.mbbank.com.vn',
        page_title: 'Khách hàng Doanh nghiệp MB - Nền tảng BIZ MBBank',
        classification: 'BUSINESS_HUB',
        relevance_score: 1.0,
        reason: 'Cổng thông tin BIZ MBBank nội bộ đối chiếu',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'Agribank',
    bank_code: 'AGR',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/agribankvietnam',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://www.agribank.com.vn/vn/khach-hang-doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'Agribank Corporate E-Banking',
    initial_discovered_urls: [
      {
        url: 'https://www.agribank.com.vn/vn/khach-hang-doanh-nghiep',
        page_title: 'Khách hàng Doanh nghiệp - Agribank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.96,
        reason: 'Hub sản phẩm và dịch vụ ngân hàng số Agribank dành cho doanh nghiệp',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'SHB',
    bank_code: 'SHB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/SHBOfficial',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://www.shb.com.vn/khach-hang-doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'SHB Corporate Online',
    initial_discovered_urls: [
      {
        url: 'https://www.shb.com.vn/khach-hang-doanh-nghiep',
        page_title: 'Khách hàng Doanh nghiệp - SHB',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.95,
        reason: 'Cổng giải pháp tài chính và ngân hàng điện tử doanh nghiệp SHB',
        status: 'TRACKING',
      },
    ],
  },
  {
    bank_name: 'Sacombank',
    bank_code: 'STB',
    is_mb: false,
    facebook_url: 'https://www.facebook.com/SacombankOfficial',
    facebook_status: 'VERIFIED',
    facebook_priority: 1,
    website_seed_url: 'https://www.sacombank.com.vn/doanh-nghiep',
    website_status: 'VERIFIED',
    platform_name: 'Sacombank eBanking Doanh Nghiệp',
    initial_discovered_urls: [
      {
        url: 'https://www.sacombank.com.vn/doanh-nghiep',
        page_title: 'Khách hàng Doanh nghiệp - Sacombank',
        classification: 'BUSINESS_HUB',
        relevance_score: 0.96,
        reason: 'Hub ngân hàng số và giải pháp thanh toán doanh nghiệp Sacombank',
        status: 'TRACKING',
      },
    ],
  },
];
