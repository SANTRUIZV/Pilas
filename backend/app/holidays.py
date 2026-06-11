"""Festivos oficiales de Colombia (Ley 51 de 1983, «Ley Emiliani»).

Calculados sin dependencias externas:
  - Fijos: 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic.
  - Emiliani (se trasladan al lunes siguiente si no caen lunes):
    6 ene, 19 mar, 29 jun, 15 ago, 12 oct, 1 nov, 11 nov.
  - Móviles según Pascua: Jueves y Viernes Santo; Ascensión, Corpus Christi y
    Sagrado Corazón (los tres ya trasladados a lunes: Pascua +43, +64 y +71).

Compartido entre la ingesta (`ml/ingest.py`), el entrenamiento (`ml/train.py`)
y la inferencia (`app/model.py`).
"""
from __future__ import annotations

from datetime import date, timedelta
from functools import lru_cache

_FIXED = [(1, 1), (5, 1), (7, 20), (8, 7), (12, 8), (12, 25)]
_EMILIANI = [(1, 6), (3, 19), (6, 29), (8, 15), (10, 12), (11, 1), (11, 11)]


def _easter(year: int) -> date:
    """Domingo de Pascua (algoritmo gregoriano anónimo)."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month, day = divmod(h + l - 7 * m + 114, 31)
    return date(year, month, day + 1)


def _next_monday(d: date) -> date:
    return d if d.weekday() == 0 else d + timedelta(days=7 - d.weekday())


@lru_cache(maxsize=64)
def holidays(year: int) -> frozenset[date]:
    """Conjunto de festivos del año dado."""
    days = {date(year, m, d) for m, d in _FIXED}
    days |= {_next_monday(date(year, m, d)) for m, d in _EMILIANI}
    easter = _easter(year)
    days |= {easter - timedelta(days=3), easter - timedelta(days=2)}  # Jue/Vie Santo
    days |= {easter + timedelta(days=n) for n in (43, 64, 71)}        # Ascensión, Corpus, S. Corazón
    return frozenset(days)


def is_holiday(d: date) -> bool:
    return d in holidays(d.year)
