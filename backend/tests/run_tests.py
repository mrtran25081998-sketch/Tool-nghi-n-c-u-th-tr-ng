import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.crawlers.base import validate_url_safe, SSRFValidationError
from app.classifier import classify_text


class TestSSRFAndCrawler(unittest.TestCase):
    def test_ssrf_blocks_private_and_localhost(self):
        with self.assertRaises(SSRFValidationError):
            validate_url_safe("http://localhost:8000")

        with self.assertRaises(SSRFValidationError):
            validate_url_safe("http://127.0.0.1:3000")

        with self.assertRaises(SSRFValidationError):
            validate_url_safe("http://0.0.0.0:80")

        with self.assertRaises(SSRFValidationError):
            validate_url_safe("file:///etc/passwd")

    def test_ssrf_allows_public_https_domains(self):
        self.assertTrue(validate_url_safe("https://www.google.com"))
        self.assertTrue(validate_url_safe("https://www.facebook.com"))

    def test_classifier_identifies_digital_banking_features(self):
        res1 = classify_text("Dịch vụ mở tài khoản trực tuyến qua eKYC chỉ trong 3 phút", "Mở tài khoản")
        self.assertTrue(res1.relevant)
        self.assertEqual(res1.group_name, "A. ONBOARDING")
        self.assertEqual(res1.component_name, "Mở TK online")

        res2 = classify_text("Phê duyệt cấp hạn mức thấu chi tín dụng doanh nghiệp pre-approved lên tới 20 tỷ", "Cấp hạn mức")
        self.assertTrue(res2.relevant)
        self.assertEqual(res2.group_name, "D. TÍN DỤNG")
        self.assertEqual(res2.component_name, "Cấp hạn mức")

        res3 = classify_text("Hôm nay trời nắng đẹp tại trụ sở ngân hàng", "Tin hoạt động nội bộ")
        self.assertFalse(res3.relevant)


if __name__ == '__main__':
    unittest.main()
