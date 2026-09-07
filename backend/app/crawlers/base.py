import ipaddress
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from urllib.parse import urlparse


@dataclass
class RawItem:
    url: str
    title: str = ""
    text: str = ""
    published_at: str = ""
    source_type: str = "website"
    metadata: dict = field(default_factory=dict)


class SSRFValidationError(ValueError):
    pass


def validate_url_safe(url: str) -> bool:
    """
    SSRF Protection:
    1. Only allows http and https protocols.
    2. Resolves domain and blocks private IP ranges (RFC 1918), loopback, link-local,
       and cloud metadata services (e.g. 169.254.169.254).
    """
    if not url or not isinstance(url, str):
        raise SSRFValidationError("URL cannot be empty")

    parsed = urlparse(url.strip())
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFValidationError(f"Invalid scheme: {parsed.scheme}. Only HTTP/HTTPS are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFValidationError("Invalid hostname in URL")

    # Reject obvious local hostnames
    if hostname.lower() in ("localhost", "0.0.0.0", "127.0.0.1", "::1"):
        raise SSRFValidationError(f"Localhost and loopbacks are not allowed: {hostname}")

    # Resolve IP addresses
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as e:
        raise SSRFValidationError(f"Cannot resolve hostname {hostname}: {e}")

    for addr_info in addr_infos:
        ip_str = addr_info[4][0]
        ip = ipaddress.ip_address(ip_str)

        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise SSRFValidationError(f"Access to private/internal IP {ip_str} is forbidden")

        # Specific check for AWS/GCP/Azure link-local metadata address 169.254.169.254
        if ip_str.startswith("169.254."):
            raise SSRFValidationError(f"Access to metadata address {ip_str} is forbidden")

    return True


class SourceAdapter(ABC):
    @abstractmethod
    async def fetch(self, source_url: str, date_from: date, date_to: date) -> list[RawItem]:
        """Fetch content from given source URL."""
        pass
