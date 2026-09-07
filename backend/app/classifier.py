import re
from dataclasses import dataclass


@dataclass
class ClassificationResult:
    relevant: bool
    group_name: str
    component_name: str
    feature_name: str
    summary: str
    confidence: float


KEYWORDS_MAP = [
    {
        "group": "A. ONBOARDING",
        "component": "Mở TK online",
        "keywords": ["mở tài khoản", "đăng ký tài khoản", "ekyc", "mở tk", "onboarding", "mở online"],
    },
    {
        "group": "B. TÀI KHOẢN & THANH TOÁN",
        "component": "Chuyển tiền 24/7 & theo lô",
        "keywords": ["chuyển tiền", "chuyển khoản 24/7", "theo lô", "napas", "lệnh chuyển", "citad"],
    },
    {
        "group": "B. TÀI KHOẢN & THANH TOÁN",
        "component": "Thẻ doanh nghiệp online",
        "keywords": ["thẻ doanh nghiệp", "corporate card", "quản trị thẻ", "phát hành thẻ"],
    },
    {
        "group": "B. TÀI KHOẢN & THANH TOÁN",
        "component": "Thanh toán quốc tế online",
        "keywords": ["thanh toán quốc tế", "chuyển tiền quốc tế", "ngoại tệ", "swift", "cot"],
    },
    {
        "group": "B. TÀI KHOẢN & THANH TOÁN",
        "component": "Nộp thuế / hải quan / hóa đơn",
        "keywords": ["nộp thuế", "hải quan", "hóa đơn", "kho bạc", "thuế điện tử"],
    },
    {
        "group": "C. TIỀN GỬI VÀ ĐẦU TƯ",
        "component": "Tiền gửi CKH online",
        "keywords": ["tiền gửi", "tiết kiệm online", "lãi suất", "chứng chỉ tiền gửi", "sinh lời tự động", "cds"],
    },
    {
        "group": "C. TÀI TRỢ THƯƠNG MẠI",
        "component": "Mua bán ngoại tệ online",
        "keywords": ["tỷ giá", "mua bán ngoại tệ", "khóa tỷ giá", "fx", "lc online", "thư tín dụng"],
    },
    {
        "group": "D. TÍN DỤNG",
        "component": "Cấp hạn mức",
        "keywords": ["hạn mức", "tín dụng online", "pre-approved", "thấu chi", "vay doanh nghiệp"],
    },
    {
        "group": "D. TÍN DỤNG",
        "component": "Giải ngân online",
        "keywords": ["giải ngân online", "giải ngân số", "nhận tiền tự động"],
    },
    {
        "group": "D. TÍN DỤNG",
        "component": "Bảo lãnh online",
        "keywords": ["bảo lãnh", "bảo lãnh điện tử", "egp", "bảo lãnh số"],
    },
    {
        "group": "E. QUẢN TRỊ TÀI CHÍNH",
        "component": "SME Grow",
        "keywords": ["sme grow", "báo cáo tài chính", "quản trị tài chính", "health check", "360 độ"],
    },
]


def classify_text(text: str, title: str = "") -> ClassificationResult:
    combined = f"{title} {text}".lower()

    best_match = None
    max_hits = 0

    for rule in KEYWORDS_MAP:
        hits = 0
        for kw in rule["keywords"]:
            if kw in combined:
                hits += 1
        if hits > max_hits:
            max_hits = hits
            best_match = rule

    if not best_match or max_hits == 0:
        return ClassificationResult(
            relevant=False,
            group_name="B. TÀI KHOẢN & THANH TOÁN",
            component_name="Khác",
            feature_name=title[:50] or "Nội dung chung",
            summary="Nội dung không liên quan trực tiếp đến tính năng số doanh nghiệp.",
            confidence=0.2,
        )

    confidence = min(0.95, 0.60 + (max_hits * 0.12))
    return ClassificationResult(
        relevant=True,
        group_name=best_match["group"],
        component_name=best_match["component"],
        feature_name=title[:60] or best_match["component"],
        summary=f"Phát hiện tính năng liên quan đến {best_match['component']} ({best_match['group']}). Cần đối chiếu với Benchmark Grid.",
        confidence=confidence,
    )
