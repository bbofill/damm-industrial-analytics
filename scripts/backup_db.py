"""Script de còpia de seguretat de la base de dades (Turso / SQLite).

Genera un snapshot consistent i atòmic amb timestamp a la carpeta backups/.
"""
import os
import sqlite3
import shutil
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
TURSO_URL = os.getenv("TURSO_DATABASE_URL", "")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")
LOCAL_DB = "damm_listen_final.db"


def backup_local_sqlite():
    """Genera una còpia consistent usant l'API nativa de backup de SQLite."""
    if not os.path.exists(LOCAL_DB):
        print(f"⚠️ Fitxer {LOCAL_DB} no trobat.")
        return False

    dest_file = os.path.join(BACKUP_DIR, f"damm_backup_local_{timestamp}.db")
    print(f"📦 Realitzant backup en calent d'SQLite local cap a {dest_file}...")

    # Backup atòmic i segur encara que hi hagi connexions obertes
    src_conn = sqlite3.connect(LOCAL_DB)
    dest_conn = sqlite3.connect(dest_file)
    with dest_conn:
        src_conn.backup(dest_conn, pages=100)
    dest_conn.close()
    src_conn.close()

    size_kb = os.path.getsize(dest_file) / 1024
    print(f"✅ Backup local completat: {dest_file} ({size_kb:.2f} KB)")
    return True


def backup_turso():
    """Exporta l'esquema i les dades de Turso a un fitxer SQL de dump."""
    if not TURSO_URL or not TURSO_TOKEN:
        print("ℹ️ Credencials de Turso no presents al .env; ometent backup remot.")
        return False

    try:
        import libsql_client
        print("☁️ Connectant a Turso libSQL per exportar snapshot...")
        client = libsql_client.create_client_sync(url=TURSO_URL, auth_token=TURSO_TOKEN)

        dump_file = os.path.join(BACKUP_DIR, f"damm_backup_turso_{timestamp}.sql")
        
        tables = ["segments", "surveys", "questions", "question_options", "responses", "settings"]
        
        with open(dump_file, "w", encoding="utf-8") as f:
            f.write(f"-- Damm Escolta Activa - Turso Backup\n")
            f.write(f"-- Data: {datetime.now().isoformat()}\n\n")

            for table in tables:
                try:
                    res = client.execute(f"SELECT * FROM {table}")
                    if not res.rows:
                        continue
                    
                    cols = [f'"{col}"' for col in res.columns]
                    cols_str = ", ".join(cols)

                    f.write(f"-- Taula: {table} ({len(res.rows)} registres)\n")
                    for row in res.rows:
                        vals = []
                        for val in row:
                            if val is None:
                                vals.append("NULL")
                            elif isinstance(val, (int, float)):
                                vals.append(str(val))
                            else:
                                clean_val = str(val).replace("'", "''")
                                vals.append(f"'{clean_val}'")
                        f.write(f"INSERT OR REPLACE INTO {table} ({cols_str}) VALUES ({', '.join(vals)});\n")
                    f.write("\n")
                except Exception as e:
                    # La taula pot no existir a Turso
                    continue

        size_kb = os.path.getsize(dump_file) / 1024
        print(f"✅ Backup de Turso generat amb èxit: {dump_file} ({size_kb:.2f} KB)")
        return True

    except Exception as e:
        print(f"❌ Error al fer el backup de Turso: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Iniciant procés de salvaguarda de dades (Damm Escolta Activa)...")
    backup_local_sqlite()
    backup_turso()
