from models import UsuariRRHH, SegmentCollectiu

def run_demostracio():
    # 1. Preparació de l'entorn
    admin_hr = UsuariRRHH(nom="Laura (People & Culture)")
    fabrica_prat = SegmentCollectiu(nom="Fàbrica El Prat - Torn Nit")

    # 2. RRHH defineix l'objectiu i la IA crea l'enquesta
    # Correspon als passos 1, 2 i 3 del flux
    campanya_torns = admin_hr.crear_campanya_ia(
        objectiu="Impacte del nou sistema de torns a la salut", 
        segment=fabrica_prat
    )
    
    print("\nQR Generat per imprimir a fàbrica:")
    print(f"    damm-listen.com/consulta?token={fabrica_prat.token_qr}\n")

    # 3. Participació (Simulem treballadors escannejant el QR amb el mòbil)
    # Correspon als passos 4 i 5 del flux (Totalment anònim)
    print("📱 Operaris responent via mòbil...")
    campanya_torns.rebre_resposta("Hi ha massa soroll de carretilles a la Zona B.", fabrica_prat.token_qr)
    campanya_torns.rebre_resposta("Necessitem més protectors auditius.", fabrica_prat.token_qr)
    campanya_torns.rebre_resposta("El solapament dels torns no deixa temps per netejar màquines.", fabrica_prat.token_qr)

    # 4. Anàlisi i Visualització de Recomanacions (Dashboard per a RRHH)
    # Correspon als passos 6, 7 i 8 del flux
    print("\n --- DASHBOARD FINAL PER A RRHH ---")
    insights = campanya_torns.generar_insights()
    print(f"Sentiments: {insights['sentiment_global']}")
    print(f"Tema Clau:  {insights['tema_principal']}")
    print(f"💡 Acció Suggerida: {insights['accio_recomanada']}")

if __name__ == "__main__":
    run_demostracio()
