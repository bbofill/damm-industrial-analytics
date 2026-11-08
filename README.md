# Damm · Escolta Activa

Plataforma d'enquestes internes per escoltar les veus dels operaris de Damm (Fàbrica El Prat, Logística ZAL i Oficines Centrals). Recull respostes per segment, analitza el sentiment i genera insights amb IA, mantenint la traçabilitat fins a cada resposta original.

## Funcionalitats

- Enquestes per segment, accessibles amb codi QR o amb inici de sessió.
- Preguntes de valoració (escala 1–5) i preguntes de text obert.
- Panell per a RRHH i managers amb KPIs, gràfics i llistat d'insights.
- Insights generats amb un LLM, cadascun enllaçat a les respostes que l'han originat.
- Alertes de biaix, per exemple baixa participació en un torn.

## Stack tecnològic

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, lucide-react
- **Backend:** Python, FastAPI, Pydantic, SDK d'OpenAI
- **Base de dades:** Turso (libSQL / SQLite al núvol)

## Estructura del projecte
.
├── src/ # Aplicació React (components, pàgines)
├── importar_dades.py # Script de dades de demostració per a Turso
├── db.json # Dades mock per al desenvolupament del frontend
├── vite.config.ts # Configuració de Vite i proxy de /api
├── tailwind.config.js # Paleta de colors Damm i animacions
└── requirements.txt # Dependències del backend Python


## Requisits

Es troben al fitxer requirements.txt

## Notes de desenvolupament

- Les peticions a `/api` es redirigeixen mitjançant el proxy de Vite. El `target` actual és `http://localhost:5173`, que és el port del frontend. Hauria de ser el port del servidor FastAPI.
- Les dades de `db.json` serveixen per desenvolupar la UI sense backend.

## Privacitat

Les respostes són anònimes a nivell individual. Els resultats es mostren agregats. 
