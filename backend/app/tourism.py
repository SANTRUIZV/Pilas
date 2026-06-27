"""Datos turísticos para la app ciudadana: clima de Cali y vuelos de/hacia el
aeropuerto Alfonso Bonilla Aragón (IATA CLO · ICAO SKCL, Palmaseca).

Fuentes externas, ambas gratuitas y sin API key:
- Clima:  Open-Meteo            (https://open-meteo.com)
- Vuelos: OpenSky Network       (https://opensky-network.org)

Diseño "a prueba de demo": cada consulta tiene timeout corto, cachea su último
resultado bueno y, si la fuente falla o está vacía, cae a datos de muestra
realistas (igual que el resto del proyecto). Así la pestaña de turismo nunca
queda en blanco durante una presentación en vivo.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

# ── Constantes de Cali / CLO ─────────────────────────────────────────────────
CALI_LAT, CALI_LON = 3.4516, -76.5320
AIRPORT_ICAO = "SKCL"
AIRPORT_IATA = "CLO"
AIRPORT_NAME = "Alfonso Bonilla Aragón"
TZ = "America/Bogota"

_UA = "PilasApp/0.1 (+https://pilas-ten.vercel.app)"
_HTTP_TIMEOUT = 6  # s

# Caché simple en memoria: key → (epoch, payload).
_cache: dict[str, tuple[float, dict | list]] = {}


def _cached(key: str, ttl: float):
    hit = _cache.get(key)
    if hit and (time.time() - hit[0]) < ttl:
        return hit[1]
    return None


def _store(key: str, value):
    _cache[key] = (time.time(), value)
    return value


def _get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


# ── Clima (Open-Meteo) ───────────────────────────────────────────────────────
# Códigos WMO → etiqueta + emoji (bilingüe: el frontend elige es/en).
_WMO = {
    0: ("Despejado", "Clear", "☀️"),
    1: ("Mayormente despejado", "Mostly clear", "🌤️"),
    2: ("Parcialmente nublado", "Partly cloudy", "⛅"),
    3: ("Nublado", "Overcast", "☁️"),
    45: ("Niebla", "Fog", "🌫️"), 48: ("Niebla", "Fog", "🌫️"),
    51: ("Llovizna ligera", "Light drizzle", "🌦️"),
    53: ("Llovizna", "Drizzle", "🌦️"),
    55: ("Llovizna intensa", "Dense drizzle", "🌦️"),
    61: ("Lluvia ligera", "Light rain", "🌧️"),
    63: ("Lluvia", "Rain", "🌧️"),
    65: ("Lluvia fuerte", "Heavy rain", "🌧️"),
    80: ("Chubascos", "Showers", "🌦️"),
    81: ("Chubascos", "Showers", "🌦️"),
    82: ("Chubascos fuertes", "Violent showers", "⛈️"),
    95: ("Tormenta", "Thunderstorm", "⛈️"),
    96: ("Tormenta con granizo", "Thunderstorm w/ hail", "⛈️"),
    99: ("Tormenta con granizo", "Thunderstorm w/ hail", "⛈️"),
}


def _wmo(code: int):
    es, en, emoji = _WMO.get(int(code), ("—", "—", "🌡️"))
    return {"code": int(code), "es": es, "en": en, "emoji": emoji}


def weather_payload() -> dict:
    """Clima actual + pronóstico 3 días para Cali. Cachea 10 min."""
    cached = _cached("weather", ttl=600)
    if cached is not None:
        return cached

    params = urllib.parse.urlencode({
        "latitude": CALI_LAT, "longitude": CALI_LON,
        "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
        "timezone": TZ, "forecast_days": 7,
    })
    try:
        d = _get_json(f"https://api.open-meteo.com/v1/forecast?{params}")
        cur = d["current"]
        daily = d["daily"]
        out = {
            "source": "live",
            "city": "Cali",
            "updated": cur.get("time"),
            "current": {
                "temp": round(cur["temperature_2m"]),
                "feels": round(cur["apparent_temperature"]),
                "humidity": cur["relative_humidity_2m"],
                "wind": round(cur["wind_speed_10m"]),
                "cond": _wmo(cur["weather_code"]),
            },
            "forecast": [
                {
                    "date": daily["time"][i],
                    "max": round(daily["temperature_2m_max"][i]),
                    "min": round(daily["temperature_2m_min"][i]),
                    "rain": daily["precipitation_probability_max"][i],
                    "cond": _wmo(daily["weather_code"][i]),
                }
                for i in range(len(daily["time"]))
            ],
        }
        return _store("weather", out)
    except Exception:
        return _weather_demo()


def _weather_demo() -> dict:
    # Cali ronda los 24–30 °C casi todo el año; clima de muestra coherente.
    return {
        "source": "demo", "city": "Cali", "updated": None,
        "current": {"temp": 27, "feels": 29, "humidity": 64, "wind": 11, "cond": _wmo(2)},
        "forecast": [
            {"date": "—", "max": 30, "min": 19, "rain": 40, "cond": _wmo(80)},
            {"date": "—", "max": 31, "min": 20, "rain": 20, "cond": _wmo(2)},
            {"date": "—", "max": 29, "min": 19, "rain": 60, "cond": _wmo(63)},
            {"date": "—", "max": 30, "min": 20, "rain": 50, "cond": _wmo(80)},
            {"date": "—", "max": 31, "min": 19, "rain": 30, "cond": _wmo(1)},
            {"date": "—", "max": 28, "min": 19, "rain": 70, "cond": _wmo(63)},
            {"date": "—", "max": 29, "min": 20, "rain": 45, "cond": _wmo(2)},
        ],
    }


# ── Vuelos (OpenSky Network) ─────────────────────────────────────────────────
# Mapeo ICAO de aeropuerto → ciudad legible para los orígenes/destinos más
# comunes de CLO. Si falta, se muestra el código crudo.
_AIRPORTS = {
    "SKBO": "Bogotá", "SKRG": "Medellín", "SKCG": "Cartagena",
    "SKBQ": "Barranquilla", "SKSM": "Santa Marta", "SKSP": "San Andrés",
    "SKPE": "Pereira", "SKAR": "Armenia", "SKMZ": "Manizales",
    "SKCL": "Cali", "SKPS": "Pasto", "SKIP": "Ipiales", "SKNV": "Neiva",
    "SKBU": "Buenaventura", "SKVP": "Valledupar", "SKCC": "Cúcuta",
    "MPTO": "Ciudad de Panamá", "KMIA": "Miami", "KFLL": "Fort Lauderdale",
    "SPJC": "Lima", "LEMD": "Madrid", "MMMX": "Ciudad de México",
    "SEGU": "Guayaquil", "SKLT": "Leticia", "SKMR": "Montería",
}


def _airport_name(icao: str | None) -> str:
    if not icao:
        return "—"
    return _AIRPORTS.get(icao.upper(), icao.upper())


# OAuth2 (client credentials). OpenSky dejó de permitir acceso anónimo a los
# endpoints de llegadas/salidas: hay que registrar un cliente API gratuito y
# pasar OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET por entorno. Sin credenciales,
# los vuelos caen al fallback demo.
_OPENSKY_TOKEN_URL = (
    "https://auth.opensky-network.org/auth/realms/opensky-network/"
    "protocol/openid-connect/token"
)
def _load_credentials() -> tuple[str, str]:
    """Credenciales de OpenSky: primero variables de entorno (producción/Render),
    si no, un `credentials.json` en la raíz del repo (el que descarga OpenSky al
    crear el cliente API). El archivo está gitignored para no versionar el secreto.
    """
    cid = os.environ.get("OPENSKY_CLIENT_ID", "").strip()
    secret = os.environ.get("OPENSKY_CLIENT_SECRET", "").strip()
    if cid and secret:
        return cid, secret
    # backend/app/tourism.py → raíz del repo está dos niveles arriba de backend/.
    for path in (
        os.path.join(os.path.dirname(__file__), "..", "..", "credentials.json"),
        os.path.join(os.path.dirname(__file__), "..", "credentials.json"),
    ):
        try:
            with open(os.path.abspath(path), encoding="utf-8") as fh:
                d = json.load(fh)
            return d.get("clientId", "").strip(), d.get("clientSecret", "").strip()
        except (OSError, ValueError):
            continue
    return "", ""


_CLIENT_ID, _CLIENT_SECRET = _load_credentials()

# Token en caché: (access_token, epoch_de_expiración).
_token: tuple[str, float] | None = None


def _opensky_token() -> str | None:
    """Devuelve un access_token válido (lo renueva 60 s antes de expirar)."""
    global _token
    if not (_CLIENT_ID and _CLIENT_SECRET):
        return None
    if _token and time.time() < _token[1]:
        return _token[0]
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": _CLIENT_ID,
        "client_secret": _CLIENT_SECRET,
    }).encode()
    req = urllib.request.Request(
        _OPENSKY_TOKEN_URL, data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": _UA},
    )
    with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as r:
        d = json.loads(r.read().decode("utf-8"))
    expires = time.time() + max(60, d.get("expires_in", 1800) - 60)
    _token = (d["access_token"], expires)
    return _token[0]


def _opensky(kind: str, hours_back: int):
    """kind = 'arrival' | 'departure'. Ventana de las últimas `hours_back` horas."""
    token = _opensky_token()
    if not token:
        raise RuntimeError("OpenSky sin credenciales (OPENSKY_CLIENT_ID/SECRET)")
    now = int(time.time())
    # OpenSky limita la consulta a 2 particiones (días UTC); >24 h puede abarcar 3.
    begin = now - min(hours_back, 23) * 3600
    params = urllib.parse.urlencode({"airport": AIRPORT_ICAO, "begin": begin, "end": now})
    url = f"https://opensky-network.org/api/flights/{kind}?{params}"
    req = urllib.request.Request(
        url, headers={"User-Agent": _UA, "Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # 404 = sin vuelos en la ventana (OpenSky no devuelve lista vacía). Para
        # CLO esto es lo habitual: su red de receptores no cubre el aeropuerto.
        if e.code == 404:
            return []
        raise


def _fmt_flight(f: dict, kind: str) -> dict:
    callsign = (f.get("callsign") or "").strip() or "—"
    if kind == "arrival":
        other = f.get("estDepartureAirport")
        when = f.get("lastSeen")          # aterrizaje (aprox)
    else:
        other = f.get("estArrivalAirport")
        when = f.get("firstSeen")         # despegue (aprox)
    dt = datetime.fromtimestamp(when, tz=timezone.utc).astimezone() if when else None
    return {
        "flight": callsign,
        "airline": callsign[:3] if callsign != "—" else "—",
        "icao24": f.get("icao24"),
        "city": _airport_name(other),
        "airport": (other or "").upper() or "—",
        "time": dt.strftime("%H:%M") if dt else "—",
        "ts": when,
    }


def flights_payload(hours_back: int = 18) -> dict:
    """Llegadas y salidas recientes de CLO. Cachea 5 min."""
    cached = _cached(f"flights:{hours_back}", ttl=300)
    if cached is not None:
        return cached

    try:
        arr_raw = _opensky("arrival", hours_back) or []
        dep_raw = _opensky("departure", hours_back) or []
        arrivals = sorted(
            (_fmt_flight(f, "arrival") for f in arr_raw),
            key=lambda x: x["ts"] or 0, reverse=True,
        )[:12]
        departures = sorted(
            (_fmt_flight(f, "departure") for f in dep_raw),
            key=lambda x: x["ts"] or 0, reverse=True,
        )[:12]
        if not arrivals and not departures:
            return _flights_demo()
        out = {
            "source": "live",
            "airport": {"iata": AIRPORT_IATA, "icao": AIRPORT_ICAO, "name": AIRPORT_NAME},
            "arrivals": arrivals, "departures": departures,
        }
        return _store(f"flights:{hours_back}", out)
    except Exception:
        return _flights_demo()


def _demo_list(rows, kind):
    out = []
    for flight, city, icao, hhmm in rows:
        out.append({
            "flight": flight, "airline": flight[:2], "icao24": None,
            "city": city, "airport": icao, "time": hhmm, "ts": None,
        })
    return out


def _flights_demo() -> dict:
    arrivals = _demo_list([
        ("AV9211", "Bogotá", "SKBO", "14:05"),
        ("LA4421", "Medellín", "SKRG", "13:40"),
        ("CM216", "Ciudad de Panamá", "MPTO", "13:10"),
        ("P51234", "Cartagena", "SKCG", "12:55"),
        ("AV8400", "Miami", "KMIA", "12:20"),
        ("9R310", "San Andrés", "SKSP", "11:48"),
    ], "arrival")
    departures = _demo_list([
        ("AV9212", "Bogotá", "SKBO", "14:50"),
        ("LA4422", "Medellín", "SKRG", "14:25"),
        ("CM217", "Ciudad de Panamá", "MPTO", "14:00"),
        ("P59001", "Barranquilla", "SKBQ", "13:35"),
        ("AV8401", "Miami", "KMIA", "13:05"),
        ("9R311", "Pereira", "SKPE", "12:30"),
    ], "departure")
    return {
        "source": "demo",
        "airport": {"iata": AIRPORT_IATA, "icao": AIRPORT_ICAO, "name": AIRPORT_NAME},
        "arrivals": arrivals, "departures": departures,
    }
