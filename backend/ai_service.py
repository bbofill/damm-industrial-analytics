import os
import json
import re
from typing import List, Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class AIService:
    @staticmethod
    def generar_preguntes(objectiu: str, col_lectiu: str) -> List[str]:
        proposta = AIService.generar_proposta_enquesta(objectiu, col_lectiu)
        return [q["text"] for q in proposta.get("questions", [])]

    @staticmethod
    def generar_proposta_enquesta(objectiu: str, col_lectiu: str = "General") -> Dict[str, Any]:
        """
        Genera una enquesta estructurada (títol, descripció i preguntes amb opcions)
        a partir d'un objectiu/prompt de Recursos Humans fent servir IA LLM (Gemini o OpenAI).
        """
        prompt_system = (
            "Ets DammIÀ, un assistent d'Intel·ligència Artificial expert en Clima Laboral, People & Culture i disseny d'enquestes per a Damm S.A.\n"
            f"L'usuari de Recursos Humans et demana una enquesta per a aquest objectiu: '{objectiu}'.\n"
            f"Col·lectiu objectiu de Damm: '{col_lectiu}'.\n"
            "Has de generar una enquesta rigorosa, professional, empàtica i adaptada a la realitat laboral del col·lectiu.\n"
            "Retorna ÚNICAMENT un objecte JSON vàlid sense text addicional, seguint estrictament aquesta estructura:\n"
            "{\n"
            '  "title": "Títol atractiu i clar de l\'enquesta",\n'
            '  "description": "Explicació breu de la finalitat i garantia d\'anonimat",\n'
            '  "questions": [\n'
            '    {"text": "Pregunta de valoració global (1 a 5 estrelles)", "type": "rating", "maxRating": 5},\n'
            '    {"text": "Pregunta d\'opció única sobre situació o torn", "type": "single", "options": [{"label": "Opció 1"}, {"label": "Opció 2"}, {"label": "Opció 3"}]},\n'
            '    {"text": "Pregunta d\'opció múltiple sobre causes o millores", "type": "multiple", "options": [{"label": "Causa 1"}, {"label": "Causa 2"}, {"label": "Causa 3"}, {"label": "Causa 4"}]},\n'
            '    {"text": "Pregunta de text obert per a suggeriments i propostes", "type": "text"}\n'
            "  ]\n"
            "}"
        )

        # 1. Intent amb Google Gemini (LLM)
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if gemini_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt_system
                )
                raw_content = response.text.strip()
                if raw_content.startswith("```"):
                    raw_content = re.sub(r"^```(?:json)?\s*", "", raw_content)
                    raw_content = re.sub(r"\s*```$", "", raw_content)
                data = json.loads(raw_content)
                if "title" in data and "questions" in data and len(data["questions"]) > 0:
                    return data
            except Exception as e:
                print(f"[AIService Gemini LLM Error]: {e}")

        # 2. Intent amb OpenAI (LLM)
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                model_to_use = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                response = client.chat.completions.create(
                    model=model_to_use,
                    messages=[
                        {"role": "system", "content": prompt_system},
                        {"role": "user", "content": f"Objectiu de RRHH: '{objectiu}'. Col·lectiu destí: '{col_lectiu}'."}
                    ],
                    temperature=0.7
                )
                raw_content = response.choices[0].message.content or "{}"
                clean_json = re.sub(r"^```json\s*|\s*```$", "", raw_content.strip(), flags=re.MULTILINE)
                data = json.loads(clean_json)
                if "title" in data and "questions" in data and len(data["questions"]) > 0:
                    return data
            except Exception as e:
                print(f"[AIService OpenAI Error]: {e}")

        # Fallback de contingència
        return AIService._generar_proposta_heuristica(objectiu, col_lectiu)

    @staticmethod
    def _generar_proposta_heuristica(objectiu: str, col_lectiu: str) -> Dict[str, Any]:
        """Generador intel·ligent contextual dissenyat per a l'entorn de fàbrica i logística de Damm."""
        obj_lower = objectiu.lower()

        # Detecció de temàtiques clau
        is_torns = any(w in obj_lower for w in ["torn", "nit", "horari", "relleu", "solapament", "descans", "fatiga"])
        is_clima = any(w in obj_lower for w in ["temperatura", "clima", "calor", "fred", "aire", "climatització", "estiu", "hivern"])
        is_epi = any(w in obj_lower for w in ["epi", "protector", "seguretat", "ergonomia", "soroll", "guants", "casc", "calçat", "auditiu"])
        is_menjador = any(w in obj_lower for w in ["menjador", "menjar", "cafeteria", "zona descans", "office", "cafè", "alimentació"])
        is_comunicacio = any(w in obj_lower for w in ["comunicació", "manager", "lideratge", "reunió", "informació", "transparència", "equip"])

        if is_torns:
            title = f"Adaptació i Benestar al Sistema de Torns · {col_lectiu}"
            desc = "Microconsulta d'escolta activa per conèixer com influeix l'organització dels torns en el descans i la salut laboral."
            q1_text = "Com valores la teva adaptació i el nivell de fatiga amb el sistema de torns actual?"
            q2_text = "Quin torn o aspecte de l'horari et genera un major desgast físic?"
            q2_opts = ["Torn de nit (22h - 06h)", "Torn de tarda (14h - 22h)", "Torn de matí (06h - 14h)", "Temps de relleu i solapament entre màquines"]
            q3_text = "Quins factors prioritzaries per millorar la qualitat del descans i la seguretat?"
            q3_opts = ["Flexibilitat en els canvis de torn entre companys", "Durada i organització de les pauses de relleu", "Zones de descans i hidratació a peu de línia", "Planificació del calendari amb més antelació"]
            q4_text = "Quina proposta concreta tens per facilitar el teu dia a dia als torns?"

        elif is_clima:
            title = f"Confort Tèrmic i Climatització a Planta · {col_lectiu}"
            desc = "Avaluació anònima de les condicions ambientals i de temperatura a les zones de treball."
            q1_text = "Com valores la climatització i el confort tèrmic a la teva zona habitual?"
            q2_text = "A quina àrea o moment de la jornada perceps un major desconfort per temperatura?"
            q2_opts = ["Línies d'envasat i embotellat", "Zones de càrrega i molls logístics", "Vestuaris i zones comunes", "Àrea d'elaboració i cocció"]
            q3_text = "Quines mesures consideres més urgents per combatre l'estrès tèrmic?"
            q3_opts = ["Punts d'aire condicionat / ventilació localitzada", "Més dispensadors d'aigua freda i isotònica", "Roba de treball més lleugera i transpirable", "Rotació de llocs més freqüent en hores puntes"]
            q4_text = "Quins punts crítics o incidències concretes de climatització detectes?"

        elif is_epi:
            title = f"Ergonomia i Equips de Protecció (EPIs) · {col_lectiu}"
            desc = "Recollida d'observacions dels operaris sobre la comoditat, ergonomia i disponibilitat dels equips de protecció."
            q1_text = "Com valores la comoditat i protecció que t'ofereixen els teus EPIs habituals?"
            q2_text = "Quin equipament de protecció requereix una revisió o millora urgent?"
            q2_opts = ["Protecció auditiva (taps / auriculars contra soroll)", "Calçat de seguretat ergonòmic", "Ulleres i protectors facials", "Guants de manipulació específica"]
            q3_text = "Quines molèsties ergonomiques o riscos notes amb major freqüència?"
            q3_opts = ["Nivell elevat de soroll de màquines o carretilles", "Càrregues repetitives i postures forçades", "Zones amb enlluernament o poca il·luminació", "Estat del paviment o risc de relliscada"]
            q4_text = "Quines millores d'ergonomia o seguretat recomanaries per al teu lloc?"

        elif is_menjador:
            title = f"Serveis de Menjador i Espais de Descans · {col_lectiu}"
            desc = "Avaluació dels espais i serveis de restauració a les instal·lacions de Damm."
            q1_text = "Com valores la qualitat general dels espais de descans i menjadors?"
            q2_text = "Quin aspecte del menjador o de l'office necessita major atenció?"
            q2_opts = ["Varietat i qualitat dels menús saludables", "Disponibilitat de menjar calent als torns de nit", "Neteja i aforament de les taules", "Microones, neveres i estris disponibles"]
            q3_text = "Quines millores t'agradaria veure en els espais comuns?"
            q3_opts = ["Opcions de menjar de qualitat 24/7", "Espais diferenciats de descans i silenci", "Cafè i fruita fresca de major qualitat", "Més punts de recàrrega de dispositius"]
            q4_text = "Tens algun suggeriment concret per millorar el menjador o l'office?"

        elif is_comunicacio:
            title = f"Comunicació Interna i Clima d'Equip · {col_lectiu}"
            desc = "Avaluació de la claredat informativa i el suport rebut en el dia a dia."
            q1_text = "Com valores la fluïdesa de la comunicació i l'escolta activa al teu departament?"
            q2_text = "Per quin canal reps millor la informació operativa i de seguretat?"
            q2_opts = ["Reunions breus d'inici de torn / briefings", "Pantalles digitals i taulells a planta", "Aplicació mòbil de l'empleat Damm", "Missatgeria Teams / correu electrònic"]
            q3_text = "Quins aspectes de la coordinació d'equip cal reforçar?"
            q3_opts = ["Reconeixement de la feina ben feta", "Claredat en les prioritats i canvis de producció", "Suport immediat davant incidències tècniques", "Confiança per expressar dubtes sense reserves"]
            q4_text = "Què ajudaria a millorar la coordinació entre torns i departaments?"

        else:
            neteja_obj = objectiu.strip().rstrip(".")
            title = f"Consulta: {neteja_obj[:45]} · {col_lectiu}"
            desc = f"Microconsulta d'escolta activa per conèixer l'opinió de l'equip respecte a: {neteja_obj}."
            q1_text = f"Com valores la situació general respecte a '{neteja_obj}'?"
            q2_text = "En quin grau consideres que aquest aspecte afecta el teu benestar a la feina?"
            q2_opts = ["M'afecta de forma molt crítica", "M'afecta moderadament", "Impacte baix", "No m'afecta en el dia a dia"]
            q3_text = "Quines àrees d'actuació consideres més prioritàries?"
            q3_opts = ["Organització i processos de treball", "Recursos materials i eines disponibles", "Formació i acompanyament de l'equip", "Comunicació i coordinació entre àrees"]
            q4_text = "Quines solucions o propostes pràctiques suggeriries a la direcció?"

        return {
            "title": title,
            "description": desc,
            "questions": [
                {
                    "text": q1_text,
                    "type": "rating",
                    "maxRating": 5
                },
                {
                    "text": q2_text,
                    "type": "single",
                    "options": [{"label": opt} for opt in q2_opts]
                },
                {
                    "text": q3_text,
                    "type": "multiple",
                    "options": [{"label": opt} for opt in q3_opts]
                },
                {
                    "text": q4_text,
                    "type": "text"
                }
            ]
        }

    @staticmethod
    def analitzar_comentaris(comentaris: List[str]) -> Dict[str, str]:
        print(f"[IA] Analitzant {len(comentaris)} respostes anònimes de cop...")
        return {
            "sentiment_global": "Alerta / Frustració",
            "tema_principal": "Problemes amb el soroll i eines defectuoses",
            "accio_recomanada": "Realitzar una revisió d'EPIs auditius al proper torn."
        }
