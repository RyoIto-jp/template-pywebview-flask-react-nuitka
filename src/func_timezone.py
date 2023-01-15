from __future__ import annotations
from datetime import datetime, timezone, timedelta


def get_ststime() -> tuple[str, str]:
    """作成・有効日時をISOで生成

    Returns:
        Tuple[str, str]: ISO形式に変換した現在時刻, 有効期限(+10hr)を返却
    """
    dt_now: datetime = datetime.now(tz=timezone.utc)
    dt_exp: datetime = dt_now + timedelta(hours=10)

    created: str = dt_now.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    expires: str = dt_exp.isoformat(timespec='milliseconds').replace('+00:00', 'Z')

    return created, expires


def CheckExpirationDate(expires_str: str) -> bool:
    """Cookieの期限を確認

    Args:
        expires_str (str): ISO形式のDatetime

    Returns:
        bool: Falseで期限切れ
    """
    expires: datetime = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
    dt_now: datetime = datetime.now(tz=timezone.utc)
    return dt_now < expires


def _CheckExpirationDate(expires_str: str) -> bool:
    """有効期限を確認

    Args:
        expires_str (str): 対象日時(ISO形式)

    Returns:
        bool: Falseだと期限切れ
    """
    expires: datetime = datetime.fromisoformat(expires_str.replace('Z', '+00:00'))
    dt_now: datetime = datetime.now(tz=timezone.utc)
    return dt_now < expires


_, expires = get_ststime()
test_call: bool = _CheckExpirationDate(expires)

print('-----')

# print(s.replace('Z', '+00:00'))
# # 2018-12-31T05:00:30.001000+00:00

# dt_utc = datetime.fromisoformat(s.replace('Z', '+00:00'))
