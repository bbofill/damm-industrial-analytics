import uuid
from typing import List
from ai_service import AIService

class SegmentCollectiu:
    def __init__(self, nom: str):
        self.id = id(self)
        self.nom = nom
        # Cada segment té el seu propi QR per garantir anonimat a les respostes
        self.token_qr = str(uuid.uuid4())[:8] 

class RespostaAnonima:
    def __init__(self, text: str, token_qr_origen: str):
        self.text = text
        self.token_qr_origen = token_qr_origen
        # NO guardem cap dada que identifiqui l'usuari (Privacitat)

class Campanya:
    def __init__(self, titol: str, segment_desti: SegmentCollectiu):
        self.id = str(uuid.uuid4())
        self.titol = titol
        self.segment_desti = segment_desti
        self.preguntes_generades: List[str] = []
        self.respostes_recollides: List[RespostaAnonima] = []

    def rebre_resposta(self, comentari: str, token_qr: str):
        # Valida que el QR sigui l'esperat abans de guardar
        if token_qr == self.segment_desti.token_qr:
            nova_resposta = RespostaAnonima(comentari, token_qr)
            self.respostes_recollides.append(nova_resposta)
            print(f"Nova resposta desada (Anònima) des de l'enllaç QR: {token_qr}")

    def generar_insights(self) -> dict:
        textos = [r.text for r in self.respostes_recollides]
        if not textos:
            return {"error": "Sense dades suficients."}
        
        # La campanya demana a la IA que analitzi el bloc sencer de respostes
        return AIService.analitzar_comentaris(textos)

class UsuariRRHH:
    def __init__(self, nom: str):
        self.nom = nom

    def crear_campanya_ia(self, objectiu: str, segment: SegmentCollectiu) -> Campanya:
        print(f"\n [{self.nom} - RRHH] Crea una microconsulta per a: {segment.nom}")
        campanya = Campanya(titol=objectiu, segment_desti=segment)
        
        # Passem l'objectiu a la IA i desem les preguntes a la campanya
        campanya.preguntes_generades = AIService.generar_preguntes(objectiu, segment.nom)
        return campanya
