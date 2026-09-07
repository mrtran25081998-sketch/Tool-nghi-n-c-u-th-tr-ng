import pytest
from app.crawlers.base import validate_url_safe, SSRFValidationError
from app.classifier import classify_text


def test_ssrf_blocks_private_and_localhost():
    # Localhost and loopback
    with pytest.raises(SSRFValidationError):
        validate_url_safe("http://localhost:8000")

    with pytest.raises(SSRFValidationError):
        validate_url_safe("http://127.0.0.1:3000")

    with pytest.raises(SSRFValidationError):
        validate_url_safe("http://0.0.0.0:80")

    # Invalid schemes
    with pytest.raises(SSRFValidationError):
        validate_url_safe("file:///etc/passwd")

    with pytest.raises(SSRFValidationError):
        validate_url_safe("gopher://127.0.0.1:70")


def test_ssrf_allows_public_https_domains():
    assert validate_url_safe("https://www.google.com") is True
    assert validate_url_safe("https://www.facebook.com") is True


def test_classifier_identifies_digital_banking_features():
    # Onboarding
    res1 = classify_text("Dịch vụ mở tài khoản trực tuyến qua eKYC chỉ trong 3 phút", "Mở tài khoản")
    assert res1.relevant is True
    assert res1.group_name == "A. ONBOARDING"
    assert res1.component_name == "Mở TK online"

    # Credit & Lending
    res2 = classify_text("Phê duyệt cấp hạn mức thấu chi tín dụng doanh nghiệp pre-approved lên tới 20 tỷ", "Cấp hạn mức")
    assert res2.relevant is True
    assert res2.group_name == "D. TÍN DỤNG"
    assert res2.component_name == "Cấp hạn mức"

    # Irrelevant text
    res3 = classify_text("Hôm nay trời nắng đẹp tại trụ sở ngân hàng", "Tin hoạt động nội bộ")
    assert res3.relevant is False
