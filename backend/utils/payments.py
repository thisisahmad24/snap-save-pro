from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PlanKey = Literal["single", "pro"]

COUNTRY_CURRENCY_MAP = {
    "PK": "PKR",
    "IN": "INR",
    "US": "USD",
    "CA": "CAD",
    "GB": "GBP",
    "DE": "EUR",
    "FR": "EUR",
    "ES": "EUR",
    "IT": "EUR",
    "NL": "EUR",
    "AU": "AUD",
    "NZ": "NZD",
    "AE": "AED",
    "SA": "SAR",
    "SG": "SGD",
    "MY": "MYR",
    "BD": "BDT",
    "JP": "JPY",
    "KR": "KRW",
}

REGION_MULTIPLIERS = {
    "asia": 1.0,
    "europe": 1.15,
    "north_america": 1.2,
    "south_america": 1.05,
    "africa": 0.95,
    "middle_east": 1.08,
    "oceania": 1.12,
    "global": 1.0,
}

BASE_PRICES = {
    "PKR": {"single": 100, "pro": 300},
    "INR": {"single": 149, "pro": 399},
    "USD": {"single": 2.99, "pro": 7.99},
    "CAD": {"single": 3.99, "pro": 9.99},
    "GBP": {"single": 2.49, "pro": 6.99},
    "EUR": {"single": 2.99, "pro": 7.49},
    "AUD": {"single": 3.99, "pro": 9.99},
    "NZD": {"single": 3.99, "pro": 9.99},
    "AED": {"single": 9.0, "pro": 24.0},
    "SAR": {"single": 12.0, "pro": 29.0},
    "SGD": {"single": 3.99, "pro": 10.99},
    "MYR": {"single": 12.0, "pro": 29.0},
    "BDT": {"single": 299, "pro": 799},
    "JPY": {"single": 450, "pro": 1200},
    "KRW": {"single": 3900, "pro": 9900},
}

ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW"}


@dataclass(frozen=True)
class Quote:
    plan: str
    currency: str
    amount_major: float
    amount_minor: int
    display_price: str
    country: str
    region: str


def _normalise_country(country: str | None) -> str:
    return (country or "US").strip().upper()[:2] or "US"


def _normalise_region(region: str | None) -> str:
    return (region or "global").strip().lower().replace(" ", "_") or "global"


def _base_amount(currency: str, plan: PlanKey) -> float:
    currency = currency.upper()
    if currency in BASE_PRICES and plan in BASE_PRICES[currency]:
        return BASE_PRICES[currency][plan]
    return BASE_PRICES["USD"][plan]


def _minor_units(currency: str) -> int:
    return 1 if currency.upper() in ZERO_DECIMAL_CURRENCIES else 100


def quote_price(plan: str, country: str | None, region: str | None) -> Quote:
    plan_key: PlanKey = "pro" if plan == "pro" else "single"
    country_code = _normalise_country(country)
    region_key = _normalise_region(region)
    currency = COUNTRY_CURRENCY_MAP.get(country_code, "USD")
    region_multiplier = REGION_MULTIPLIERS.get(region_key, REGION_MULTIPLIERS["global"])

    amount_major = round(_base_amount(currency, plan_key) * region_multiplier, 2)
    if currency.upper() in ZERO_DECIMAL_CURRENCIES:
        amount_major = round(amount_major)

    amount_minor = int(round(amount_major * _minor_units(currency)))
    return Quote(
        plan=plan_key,
        currency=currency.upper(),
        amount_major=amount_major,
        amount_minor=amount_minor,
        display_price=f"{currency.upper()} {amount_major:,.2f}" if currency.upper() not in ZERO_DECIMAL_CURRENCIES else f"{currency.upper()} {int(amount_major):,}",
        country=country_code,
        region=region_key,
    )


def plan_title(plan: str) -> str:
    return "Pro Monthly Subscription" if plan == "pro" else "Single Download Access"
