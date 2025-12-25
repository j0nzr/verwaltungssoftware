# Die Jahresabrechnung
## Gesetzliche Ansprüche
### § 28 Wirtschaftsplan, Jahresabrechnung, Vermögensbericht
1. Die Wohnungseigentümer beschließen über die Vorschüsse zur Kostentragung und zu den nach § 19 Absatz 2 Nummer 4 oder durch Beschluss vorgesehenen Rücklagen. Zu diesem Zweck hat der Verwalter jeweils für ein Kalenderjahr einen Wirtschaftsplan aufzustellen, der darüber hinaus die voraussichtlichen Einnahmen und Ausgaben enthält.
2. Nach Ablauf des Kalenderjahres beschließen die Wohnungseigentümer über die Einforderung von Nachschüssen oder die Anpassung der beschlossenen Vorschüsse. Zu diesem Zweck hat der Verwalter eine **Abrechnung über den Wirtschaftsplan** (Jahresabrechnung) aufzustellen, die darüber hinaus die **Einnahmen und Ausgaben** enthält.
3. Die Wohnungseigentümer können beschließen, wann Forderungen fällig werden und wie sie zu erfüllen sind.
4. Der Verwalter hat nach Ablauf eines Kalenderjahres einen **Vermögensbericht** zu erstellen, der den Stand der in Absatz 1 Satz 1 bezeichneten _Rücklagen_ und eine Aufstellung des _wesentlichen Gemeinschaftsvermögens_ enthält. Der Vermögensbericht ist jedem Wohnungseigentümer zur Verfügung zu stellen.

## Typische Bestandteile

**Dokumentenheader**: 
- Wohnungseigentümergemeinschaft
- Adresse
- Kalenderjahr 01.01.YYYY – 31.12.YYYY
- Einheit NR

### Deckblatt
- Anschrift
- Datum
- Betreff
- Inhalt
- Ergebnis der Abrechnung
    - Kostentragung gem. Einzelabrechnung
    - ./. beschlossene Vorschüsse zur Kostentragung gem. Einzelwirtschaftsplan 
    - Abrechnungsspitze (Überdeckung / Unterdeckung)
- Nachrichtlich & nicht Beschlussrelevant:
    - Forderungen (Rückstände) zum 31.12.XXXX
    - Verbindlichkeiten (Überzahlungen) zum 31.12.XXXX
    - Gesamt
    - Saldo nach Verrechnung mit Abrechnungsspitze

### Gesamtabrechnung
- Geldkonten Anfangsbestand
    - Auflisten der einzelnen Konten
    - Gesamtkontenbestand
- Einnahmen
    - Gesamtkontobestände
    - Verteilungsrelevante Beträge
    - Wirtschaftsplan
- Ausgaben
    - Gesamtkontobestände
    - Verteilungsrelevante Beträge
    - Wirtschaftsplan
    - Aufteilung
        - Umlagefähige Beträge
        - Nicht umlagefähige Beträge
- Gesamtkontobestand
- Geldkonten Endbestand

### Einzelabrechnung
- Ganze Tabelle aufgeteilt nach:
    - Verteilungrelevante Beträge
    - Verteilungsschlüssel 
    - Gesamt Verteilungsschlüssel
    - Anteil der Einheit
    - Betrag der Einheit
- Einnahmen (Nur Verteilungsrelevante Beträge)
- Ausgaben, umlagefähige Beträge
- Ausgaben, nicht umlagefähige Beträge
### Vermögensbericht
- Stand der Rücklagen
- Aufstellung über das wesentliche Gemeinschaftsvermögen
    - Geldkontobestände
    - Forderungen
        - Forderungen ggü. Einheiten gesamt
        - Forderungen ggü. Dritten gesamt
        - Forderungen ggü. Versorgern gesamt
    - Verbindlichkeiten
        - Verbindlichkeiten ggü. Einheiten gesamt
        - Verbindlichkeiten ggü. Dritten gesamt
        - Verbindlichkeiten ggü. Versorgern gesamt
    - Bewegliches Vermögen
    - Immobilieneigentum

### Haushaltsnahe Dienstleistungen
- Einheit
- Eigentümer
- Abrechnungszeitraum
- Tabelle
    - Verteilungrelevante
    - Beträge Verteilungsschlüssel 
    - GesamtVTS
    - Anteil der Einheit
    - Betrag der Einheit

## Buchhalterische Gedanken
### AKTIVA
- Anlagevermögen (wenn existent parallel zur normalen Buchhaltung)
- Umlaufvermögen
    - Bankkonten
    - Forderungen
    - Personenkonten

### PASSIVA
- Eigenkapital
    - Verfügbare Geldmittel der Kostentragung
    - Verfügbare Geldmittel der Rücklagen
    - Eingeforderte Geldmittel
- Fremdkapital
    - kurzfr. Verbindlichkeiten
    - langfr. Verbindlichkeiten
    - Personenkonten

### Buchen von Vorschüssen
- Fällig: Forderungen gg. Max Mustermann // Eingeforderte Geldmittel
- Zahlung: Eingeforderte Geldmittel // Erhaltene Vorschüsse
- Zahlung: Bankkonto // Forderungen gg. Max Mustermann
    - Verknüpfung über (interne) Belegnummer (z.B. W-Plan oder Umlageaufforderung)


## Technische Gedanken
### Aufbau der Datenbank auf Jahresabrechnungseben

Datenbanken auf Jahresabrechnungsebene sind temporär?
- Notwendige Folgen:
    - Jede Buchungsänderung im Wirtschaftsjahr muss erkannt und verhindert werden oder der Jahresabschluss muss sofort auf verändert gestellt werden.

- Alternative:
    - Es besteht eine Datenbank-Tabelle mit den Werten, welche alle Werte für eine Jahresabrechnung einmal anlegt und dann speichert. 
    - Konsistenz wäre damit gesichert aber speicher wird aufgegeben.
    - Könnte aber besser für die aufbewahrung von Dokumenten sein.

### Status der Abrechnung
- Jede Abrechnung bekommt einen Status (Entwurf, Final, beschlossen)
- Ist die Abrechnung beschlossen, muss ein ganzes Jahr abgeschlossen werden!

### Aufbau der Abrechnung
- Der Aufbau sollte flexibel sein. Jeder Bestandteil Aus- und Abwählbar
    - Jeder Bestandteil ist seine eigene ODT-Datei