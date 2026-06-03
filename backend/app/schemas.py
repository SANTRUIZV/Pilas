"""Esquemas de respuesta (Pydantic)."""
from __future__ import annotations

from pydantic import BaseModel


class Health(BaseModel):
    status: str
    model_loaded: bool
    model_source: str
    zones: int


class RiskOut(BaseModel):
    zone_id: str
    zone_name: str
    hour: int
    risk: int
    level: str
    label: str
    source: str  # "model" | "analytic"


class HourRisk(BaseModel):
    hour: int
    risk: int


class Service(BaseModel):
    name: str
    distance_km: float


class CrimeShare(BaseModel):
    id: str
    label: str
    share: float
    trend: int


class ZoneOut(BaseModel):
    id: str
    name: str
    comuna: str
    pop: str
    lat: float
    lon: float
    tags: list[str]
    base_risk: int
    risk: int
    level: str
    label: str


class ZoneDetailOut(ZoneOut):
    source: str
    hourly: list[HourRisk]
    nearest_cai: Service
    nearest_hospital: Service
    top_crimes: list[CrimeShare]
    recommendations: list[str]
