"""Verificació d'accés a les enquestes.

Col·lectius de planta: accés directe universal per a la presentació/demo.
Col·lectius d'oficines: M365 (simulat en aquesta fase).
Emet tokens aleatoris d'un sol ús i de caducitat limitada. El token no
conté ni guarda cap identitat, i es consumeix en enviar la resposta.
"""
import ipaddress
import os
import secrets
import threading
import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

try:
    from backend.db import get_db
except ImportError:
    from db import get_db

router = APIRouter(prefix="/api/verificar", tags=["verificacio"])

TOKEN_TTL_SECONDS = 3600
M365_MODE = os.getenv("M365_MODE", "simulat")
TRUST_PROXY = os.getenv("TRUST_PROXY", "0") == "1"

_lock = threading.Lock()
ACTIVE_ACCESS_TOKENS: Dict[str, Dict[str, Any]] = {}


class TokenPayload(BaseModel):
    """Petició amb el token del codi QR del segment."""
    token_qr: str


def _netejar_expirats(now: float) -> None:
    """Elimina tokens caducats o ja utilitzats. Requereix tenir el lock."""
    esborrar = []
    for token, info in ACTIVE_ACCESS_TOKENS.items():
        if info["expires_at"] < now or info["used"]:
            esborrar.append(token)
    for token in esborrar:
        ACTIVE_ACCESS_TOKENS.pop(token, None)


def _segment_per_qr(qr_token: str) -> Optional[Dict[str, Any]]:
    """Busca un segment pel seu token de QR amb compatibilitat total Turso/SQLite."""
    conn = get_db()
    cursor = conn.cursor()
    fila = None
    try:
        cursor.execute(
            "SELECT id, name, requires_login FROM segments WHERE qr_token = ?",
            (qr_token,),
        )
        fila = cursor.fetchone()
    except Exception:
        try:
            cursor.execute(
                "SELECT id, name FROM segments WHERE qr_token = ?",
                (qr_token,),
            )
            fila = cursor.fetchone()
        except Exception as e:
            print(f"⚠️ Error consultant segments a la base de dades: {e}")
            fila = None
    finally:
        conn.close()

    if fila is None:
        return None

    requires_login = False
    try:
        requires_login = bool(fila.get("requires_login", False))
    except Exception:
        requires_login = False

    return {
        "id": fila["id"],
        "name": fila["name"],
        "requires_login": requires_login,
    }


def _emetre_token(segment_id: int, metode: str) -> str:
    """Crea un token d'accés aleatori d'un sol ús (criptogràficament segur)."""
    token = f"tok_{metode}_{secrets.token_urlsafe(32)}"
    with _lock:
        _netejar_expirats(time.time())
        ACTIVE_ACCESS_TOKENS[token] = {
            "segment_id": int(segment_id),
            "expires_at": time.time() + TOKEN_TTL_SECONDS,
            "used": False,
        }
    return token


def validar_token(token: Optional[str], segment_id: int) -> bool:
    """Comprova un token sense consumir-lo (per carregar les preguntes)."""
    if not token:
        return False
    with _lock:
        info = ACTIVE_ACCESS_TOKENS.get(token)
        if info is None or info["used"] or info["expires_at"] < time.time():
            return False
        return info["segment_id"] == int(segment_id)


def consumir_token(token: Optional[str], segment_id: int) -> bool:
    """Valida i consumeix un token de forma atòmica (un sol ús)."""
    if not token:
        return False
    with _lock:
        info = ACTIVE_ACCESS_TOKENS.get(token)
        if info is None or info["used"] or info["expires_at"] < time.time():
            return False
        if info["segment_id"] != int(segment_id):
            return False
        ACTIVE_ACCESS_TOKENS.pop(token, None)
    return True


@router.get("/metode/{token}")
def obtenir_metode(token: str):
    """Indica quin mètode de verificació requereix el segment del QR."""
    segment = _segment_per_qr(token)
    if segment is None:
        raise HTTPException(status_code=404, detail="Codi QR no trobat")
    metode = "m365" if segment["requires_login"] else "xarxa"
    return {"status": "ok", "segment_name": segment["name"], "metode": metode}


@router.post("/xarxa")
def verificar_xarxa(payload: TokenPayload, request: Request):
    """Emet el token d'accés d'un sol ús sense bloqueig per IP per a la demo."""
    segment = _segment_per_qr(payload.token_qr)
    if segment is None:
        raise HTTPException(status_code=404, detail="Codi QR no trobat")
    if segment["requires_login"]:
        raise HTTPException(status_code=403, detail="Aquest col·lectiu s'ha de verificar amb M365")

    # Emet directament el token criptogràfic d'un sol ús sense bloquejar cap IP
    return {"status": "ok", "access_token": _emetre_token(segment["id"], "xarxa")}


@router.post("/m365")
def verificar_m365(payload: TokenPayload):
    """Verifica l'accés per M365 i emet un token d'un sol ús (sense guardar identitat)."""
    segment = _segment_per_qr(payload.token_qr)
    if segment is None:
        raise HTTPException(status_code=404, detail="Codi QR no trobat")
    if not segment["requires_login"]:
        raise HTTPException(status_code=403, detail="Aquest col·lectiu no requereix M365")
    if M365_MODE != "simulat":
        raise HTTPException(status_code=501, detail="Integració Entra ID encara no implementada")
    return {"status": "ok", "access_token": _emetre_token(segment["id"], "m365")}
