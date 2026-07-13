"""Configuración compartida de pytest.

El código fuente Python vive en `backend/` (paquetes `app` y `ml`); se agrega
al path para poder importarlo desde los tests sin instalar el proyecto.
"""
import sys
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_DIR / "backend"))
