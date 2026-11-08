import os
import libsql_client
from dotenv import load_dotenv

# Carrega les variables del .env
load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

def importar_dades_mock():
    print("🔌 Connectant a Turso...")
    client = libsql_client.create_client_sync(url=TURSO_URL, auth_token=TURSO_TOKEN)

    print("🛠️ Preparant les taules per al nou format de Marketing...")
    # Creem la taula d'opcions utilitzant IDs numèrics
    client.execute("""
        CREATE TABLE IF NOT EXISTS question_options (
            id INTEGER PRIMARY KEY,
            question_id INTEGER,
            label TEXT
        );
    """)

    print("🧹 Netejant dades antigues...")
    client.execute("DELETE FROM insight_response_links;")
    client.execute("DELETE FROM ai_insights;")
    client.execute("DELETE FROM responses;")
    client.execute("DELETE FROM question_options;")
    client.execute("DELETE FROM questions;")
    client.execute("DELETE FROM surveys;")
    client.execute("DELETE FROM users;")
    client.execute("DELETE FROM segments;")

    print("📦 Inserint nous Segments (Canals/Audiències)...")
    client.execute("INSERT INTO segments (id, name, qr_token, requires_login) VALUES (1, 'Clients registrats', 'qr-estiu', 0);")
    client.execute("INSERT INTO segments (id, name, qr_token, requires_login) VALUES (2, 'Panell de consumidors', 'qr-brand', 0);")
    client.execute("INSERT INTO segments (id, name, qr_token, requires_login) VALUES (3, 'Assistents a festivals', 'qr-festival', 0);")
    client.execute("INSERT INTO segments (id, name, qr_token, requires_login) VALUES (4, 'Membres Damm Club', 'qr-club', 1);")

    # Estructura del mock sense els strings als IDs de les preguntes
    enquestes = [
        {
            "id": "srv-001", "title": "Satisfacció del producte - Estiu 2026", "segment_id": 1, "is_active": 1,
            "questions": [
                {"text": "Com valoraries la qualitat general del producte?", "type": "rating", "options": []},
                {"text": "Quin és el teu canal de compra preferit?", "type": "single", "options": ["Supermercats", "Bars i restaurants", "Botiga en línia", "Festes i esdeveniments"]},
                {"text": "Quins atributs t'han agradat més?", "type": "multiple", "options": ["Sabor", "Aromatització", "Disseny de l'envàs", "Preu", "Sostenibilitat"]},
                {"text": "Quines millores suggeriries pel producte?", "type": "text", "options": []},
            ]
        },
        {
            "id": "srv-002", "title": "Brand Perception - Damm vs Competidors", "segment_id": 2, "is_active": 1,
            "questions": [
                {"text": "Com valoraries la imatge de marca de Damm?", "type": "rating", "options": []},
                {"text": "Quina marca associques més amb qualitat?", "type": "single", "options": ["Damm", "Estrella Galicia", "Mahou", "Heineken", "Cap específica"]},
                {"text": "Quins valors associques amb Damm?", "type": "multiple", "options": ["Tradició", "Innovació", "Mediterrània", "Qualitat", "Sostenibilitat", "Esport"]},
            ]
        },
        {
            "id": "srv-003", "title": "Experiència en festivals - Primavera 2026", "segment_id": 3, "is_active": 0, 
            "questions": [
                {"text": "Com valoraries l'experiència general al festival?", "type": "rating", "options": []},
                {"text": "Com vas conèixer la presència de Damm al festival?", "type": "single", "options": ["Estands propis", "Publicitat dins el recinte", "Xarxes socials", "Boca-orella"]},
                {"text": "T'ha agradat algun producte específic?", "type": "multiple", "options": ["Estrella Damm", "Voll-Damm", "Damm Lemon", "Inedit", "Companya"]},
            ]
        }
    ]

    print("📊 Inserint Enquestes, Preguntes i Opcions a Turso...")
    
    # Comptadors per assegurar que els IDs siguin números enters correlatius
    q_id_counter = 1
    opt_id_counter = 1

    for enquesta in enquestes:
        # Inserir Enquesta
        client.execute(
            "INSERT INTO surveys (id, title, target_segment_id, is_active) VALUES (?, ?, ?, ?);",
            [enquesta["id"], enquesta["title"], enquesta["segment_id"], enquesta["is_active"]]
        )
        
        # Inserir Preguntes
        for p in enquesta["questions"]:
            client.execute(
                "INSERT INTO questions (id, survey_id, question_text, question_type) VALUES (?, ?, ?, ?);",
                [q_id_counter, enquesta["id"], p["text"], p["type"]]
            )
            
            # Inserir Opcions de la pregunta si en té
            for opcio in p["options"]:
                client.execute(
                    "INSERT INTO question_options (id, question_id, label) VALUES (?, ?, ?);",
                    [opt_id_counter, q_id_counter, opcio]
                )
                opt_id_counter += 1
                
            q_id_counter += 1

    print("✅ Base de dades inicialitzada i poblada amb èxit!")
    print("👉 Prova Estiu 2026: http://localhost:5173/?token=qr-estiu")
    print("👉 Prova Brand Perception: http://localhost:5173/?token=qr-brand")

if __name__ == "__main__":
    importar_dades_mock()
