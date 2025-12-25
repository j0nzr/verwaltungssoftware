# Bewegungsdaten
## Grundsätzliches
Bewegungsdaten werden auf Jahresebene betrachtet. Jede Datenbank-Tabelle hier wird in jedem Jahr neu angelegt.

## Aufbau der Dantebanken

### Transaktionen (TRX)
Grundsätzliche Daten einer einzelnen Transaktion. Besteht aus mindestens 2 "Splits". Orientiert an dem Modell von GnuCash: Transactions are transfers of commodities between accounts; if the accounts are for different commodities, then a price is created as the ratio of the quantities in each. Transactions must contain at least two splits, and the credits and debits in the splits must sum to the same amount -- they must balance.

- guid
- post date
- enter date
- description

### Split (SPL)
- guid
- transaktions id
- account id
- beschreibung
- amount
- verteilungsrelevant