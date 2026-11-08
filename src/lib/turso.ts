import { createClient } from '@libsql/client/web';

const url = import.meta.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

export const turso = createClient({
  url: url || '',
  authToken: authToken || '',
});

// Funció per assegurar que les 7 taules i els mocks de Carlos existeixen a Turso
export async function initTursoDatabase() {
  try {
    // 1. Crear taules
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        qr_token TEXT UNIQUE, 
        requires_login BOOLEAN DEFAULT FALSE
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        email TEXT UNIQUE, 
        segment_id INTEGER, 
        role TEXT DEFAULT 'employee',
        FOREIGN KEY (segment_id) REFERENCES segments(id)
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY, 
        title TEXT NOT NULL, 
        target_segment_id INTEGER, 
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (target_segment_id) REFERENCES segments(id)
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        survey_id TEXT, 
        question_text TEXT NOT NULL, 
        question_type TEXT NOT NULL,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        question_id INTEGER, 
        segment_id INTEGER, 
        answer_value TEXT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions(id), 
        FOREIGN KEY (segment_id) REFERENCES segments(id)
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        survey_id TEXT, 
        segment_id INTEGER, 
        identified_sentiment TEXT, 
        key_finding TEXT, 
        proposed_action TEXT,
        FOREIGN KEY (survey_id) REFERENCES surveys(id),
        FOREIGN KEY (segment_id) REFERENCES segments(id)
      );
    `);

    await turso.execute(`
      CREATE TABLE IF NOT EXISTS insight_response_links (
        insight_id INTEGER, 
        response_id INTEGER,
        PRIMARY KEY (insight_id, response_id),
        FOREIGN KEY (insight_id) REFERENCES ai_insights(id),
        FOREIGN KEY (response_id) REFERENCES responses(id)
      );
    `);

    console.log('✅ Base de dades a Turso sincronitzada amb èxit.');
  } catch (error) {
    console.error('Error inicialitzant Turso:', error);
  }
}
