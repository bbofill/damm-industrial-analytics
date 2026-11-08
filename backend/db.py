"""Connexió a la base de dades: Turso libSQL al núvol o SQLite local com a fallback."""
import os
import sqlite3
from collections.abc import Mapping
from typing import Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL", "")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")
LOCAL_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "damm_listen_final.db")
if not os.path.exists(LOCAL_DB_PATH):
    LOCAL_DB_PATH = "damm_listen_final.db"


class TursoRow(Mapping):
    """Emula sqlite3.Row permetent accés per nom de columna, per índex i conversió a dict."""

    def __init__(self, columns: List[str], values: List[Any]):
        self._columns = list(columns)
        self._values = list(values)
        self._index_map = {col: i for i, col in enumerate(self._columns)}

    def __getitem__(self, key: Any) -> Any:
        if isinstance(key, int):
            return self._values[key]
        if isinstance(key, str):
            if key in self._index_map:
                return self._values[self._index_map[key]]
            raise KeyError(key)
        raise TypeError(f"L'índex ha de ser un enter o cadena, rebut: {type(key)}")

    def __iter__(self):
        return iter(self._columns)

    def __len__(self) -> int:
        return len(self._columns)

    def get(self, key: Any, default: Optional[Any] = None) -> Any:
        if isinstance(key, str) and key in self._index_map:
            return self._values[self._index_map[key]]
        if isinstance(key, int) and 0 <= key < len(self._values):
            return self._values[key]
        return default

    def keys(self):
        return self._columns


class TursoCursor:
    """Cursor compatible amb l'API de sqlite3 per a consultes amb libSQL."""

    def __init__(self, client):
        self._client = client
        self._result = None
        self._idx = 0
        self.lastrowid = None

    def execute(self, sql: str, params: Any = None):
        if params is None:
            clean_params = []
        elif isinstance(params, (tuple, set)):
            clean_params = list(params)
        elif isinstance(params, list):
            clean_params = params
        else:
            clean_params = [params]

        self._result = self._client.execute(sql, clean_params)
        self._idx = 0
        self.lastrowid = getattr(self._result, "last_insert_rowid", None)
        return self

    def fetchone(self) -> Optional[TursoRow]:
        if not self._result or self._idx >= len(self._result.rows):
            return None
        row = self._result.rows[self._idx]
        self._idx += 1
        return TursoRow(self._result.columns, row)

    def fetchall(self) -> List[TursoRow]:
        if not self._result:
            return []
        rows = [
            TursoRow(self._result.columns, r)
            for r in self._result.rows[self._idx:]
        ]
        self._idx = len(self._result.rows)
        return rows


class TursoConnection:
    """Connexió compatible amb sqlite3 embolcallant el client síncron de Turso."""

    def __init__(self, client):
        self._client = client

    def cursor(self) -> TursoCursor:
        return TursoCursor(self._client)

    def execute(self, sql: str, params: Any = None) -> TursoCursor:
        cur = self.cursor()
        return cur.execute(sql, params)

    def commit(self):
        pass

    def close(self):
        pass


_shared_turso_client = None


def get_db():
    """Retorna una connexió activa a Turso libSQL o a SQLite local."""
    global _shared_turso_client

    # 1. Prioritat: connexió a la base de dades de Turso si existeixen les claus
    if TURSO_URL and TURSO_TOKEN:
        try:
            if _shared_turso_client is None:
                import libsql_client
                _shared_turso_client = libsql_client.create_client_sync(
                    url=TURSO_URL,
                    auth_token=TURSO_TOKEN
                )
            return TursoConnection(_shared_turso_client)
        except Exception as err:
            print(f"⚠️ [db.py] No s'ha pogut connectar a Turso: {err}. S'utilitzarà SQLite local.")

    # 2. Alternativa: SQLite local amb Row factory
    conn = sqlite3.connect(LOCAL_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
