# Stammdaten Dokumentation
## Unternehmensweite Stammdaten
### Unternehmensdaten (UNT)
- Name (NAME)
- Zusatz (ZUSA)
- Adresszeile 1 (ADR1)
- Adresszeile 2 (ADR2)
- PLZ (POLZ)
- Ort (STADT)
- Steuernummer (STRN)
- Umsatzsteuer-ID (USID)
- Direktor-Titel (DIRT)
- Direktor-Name (DIRN)

### Mandanten (MDT)
- ID
- Name (NAME)
- Zusatz (ZUSA)
- Adresszeile 1 (ADR1)
- Adresszeile 2 (ADR2)
- PLZ (POLZ)
- Ort (STADT)
- Verwaltungsart (VART)
- Wirtschaftsjahr Beginn (WJRA)
- Wirtschaftsjahr Ende (WJRE)

### Peronen (PER)
- Typ natürlich/juristisch? (TYPE)
- Anrede (ANRD)
- Briefanrede (BANR)
- Name (NAME)
- Zusatz (ZUSA)
- Adresszeile 1 (ADR1)
- Adresszeile 2 (ADR2)
- PLZ (POLZ)
- Ort (STADT)

## Stammdaten auf Mandantenebene
### Gebäudedaten (GEB)

### Wohnungsdaten (WHG)
- Einheitnummer (EHNR)
- Miteigentumsanteile (MTEA)
- Kontakteigentümer (bei mehreren, nullable) (KTEG)

### Eigentümer (EIG)
- ID
- PERSON (Foreignkey)

### LOOKUP EIG - WHG
Lookup Table, die jeweils eine Wohnung und einen Eigentümer paart um die Many-To-Many-Relationship abzubilden
- EIG ID
- WHG ID

### Jahresabrechnungen (JAB)
- ID
- Wirtschaftsjahr (WJHR)
- Erstellungsdatum (EDAT)
- Status (STAT)

### Verteilungsschlüssel (VTS)
- Name
- Gesamtmenge

### Lookup VTS - WHG
Teilt jeder Wohnung ihren Anteil in einem VTS zu
- WHG IG
- VTS ID
- Anteil

#### Konten (KNT)
Konten sind als Stammdaten auf Mandantenebene geplant, nicht auf Jahresebene. Somit solle eine Konsistenz in der Darstellung entlang der Leitlinien der GoB eingehalten werden

- id
- name
- typ (Aktiv, Passiv, Aufwand, Ertrag)
- ukonto (Um Strukturen aufzubauen -> foreign key nullable)
- umlagefähig (wenn gewünscht, nur für Aufwand)

## Stammdaten auf Mandaten und Jahresebene
### Wirtschaftsplan Line Items (WLI)
- konto
- betrag
- Verteilungsschlüssel

#### Temporäre Daten (ABR)
Temporäre Daten werden berechnet und einmalig zur generierung der Jahresabrechnung verwendet. Temporäre Daten werden immer mit einem _ gekennzeichnet. Zum schnelleren Querying sollten die Daten in Literals und Arrays aufgeteilt werden.
- Einnahmen Ausgaben Rechnung
    - Kostentragung gme. Einzelabrechnung (EGKT)
    - beschlossene Vorschüsse zur Kostentragung gem. Einzelwirtschaftplan (EGVS)
    - Abrechnungsspitze (ABSP)
    - Beschreibung ABSP (Über/Unterdeckung) (BEAS)
    - Summe Geldkontobestände Jahresanfang: (SGKA)
    - Summe Geldkontobestände Jahresende: (SGKE)
    - Summe Einnahmen: (SEIN)
    - Summe Verteilungsrelevante Einnahmen (SVRE)
    - Summe Einnahmen Wirtschaftsplan (SEWP)
    - Summe Ausgaben: (SAUS)
    - Summe Ausgaben Verteilungsrelevant: (SAVR)
    - Summe Ausgaben Wirtschaftsplan: (SAWP)
    - Summe Ausgaben Umlagefähig Verteilungsrelevant: (SAUV) 
    - Summe Ausgaben Umlagefähig Wirtschaftsplan: (SAUW)
    - Summe Ausgaben Nicht Umlagefähig Verteilungsrelevant: (SANV) 
    - Summe Ausgaben Nicht Umlagefähig Wirtschaftsplan: (SANW)
    - Summe Ausgaben Umlagefähig: (SAUM)
    - Summe Ausgaben nicht Umlagefähig: (SANU)
    - Summe Verteilungsrelevante Beträge: SVRB
    - Summe Wirtschaftsplan Beträge: SWPB
- Einzelabrechnung
    - Summe Einnahmen Einzelabrechnung (SEEA)
    - Summe Ausgaben, Umlagefähig Einzelabrechnung (SAUE)
    - Summe Ausgaben, Nicht Umlagefähig Einzelabrechnung (SANE)
    - Abrechnungssumme Kostentragung, Gesamt (ASKG)
    - Abrechnungssumme Kostentragung, Einzel (ASKE)
    - beschlossene Vorschüsse, Gesamt (BVSG)
    - beschlossene Vorschüsse, Einzel (BVSE)
    - Abrechnungsspitze, Gesamt (ABSG)
    - Abrechnungsspitze, Einzel (ABSE)

- Arrays:
    - Bilanzdaten (B___)
        - Geldkonten (BGK_)
            - Name (BGKN)
            - Anfangsbestand (BGKA)
            - Endbestand (BGKE)
    - Einnahmen-Ausgaben (EA)
        - Einnahmen (EAE_)
            - Name (EAEN)
            - Gesamtkontobestände (EAEG)
            - Verteilungsrelevante Beträge (EAEV)
            - Wirtschafsplan (EAEW)
        - Ausgaben (EAA_)
            - Name (EAAN)
            - Gesamtkontobestände (EAAG)
            - Verteilungsrelevante Beträge (EAAV)
            - Wirtschafsplan (EAAW)
        - Ausgaben, umlagefähig (alternative; EAU_)
            - Name (EAUN)
            - Gesamtkontobestände (EAUG)
            - Verteilungsrelevante Beträge (EAUV)
            - Wirtschafsplan (EAUW)
        - Ausgaben, nicht umlagefähig (alternative; EAN_)
            - Name (EANN)
            - Gesamtkontobestände (EANG)
            - Verteilungsrelevante Beträge (EANV)
            - Wirtschafsplan (EANW)
    - Einzelabrechnung (EN)
        - Einnahmen (ENE_)
            - Name (ENEN)
            - Verteilungsrelevante Beträge (ENEV)
            - Verteilungsschlüssel (ENES)
            - Gesamt VTS (ENEG)
            - Anteil der Einheit (ENEA)
            - Betrag der Einheit (ENEB)
        - Ausgaben, umlagefähig (ENU_)
            - Name (ENUN)
            - Verteilungsrelevante Beträge (ENUV)
            - Verteilungsschlüssel (ENUS)
            - Gesamt VTS (ENUG)
            - Anteil der Einheit (ENUA)
            - Betrag der Einheit (ENUB)
        - Ausgaben, nicht umlagefähig (ENN_)
            - Name (ENNN)
            - Verteilungsrelevante Beträge (ENNV)
            - Verteilungsschlüssel (ENNS)
            - Gesamt VTS (ENNG)
            - Anteil der Einheit (ENNA)
            - Betrag der Einheit (ENNB)