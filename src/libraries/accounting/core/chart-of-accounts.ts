import type { DefaultAccount } from './types';

/**
 * Default German WEG (Wohnungseigentümergemeinschaft) Chart of Accounts
 * Based on SKR 04 adapted for property management
 */
export const DEFAULT_WEG_ACCOUNTS: DefaultAccount[] = [
  // Assets (1000-1999)
  { code: '1000', name: 'Bank', type: 'asset' },
  { code: '1100', name: 'Instandhaltungsrücklage', type: 'asset' },
  { code: '1200', name: 'Forderungen Eigentümer', type: 'asset' },
  { code: '1210', name: 'Forderungen Hausgeld', type: 'asset' },
  { code: '1220', name: 'Forderungen Sonderumlagen', type: 'asset' },
  { code: '1300', name: 'Sonstige Forderungen', type: 'asset' },
  { code: '1400', name: 'Kasse', type: 'asset' },
  { code: '1500', name: 'Rechnungsabgrenzungsposten', type: 'asset' },

  // Liabilities (2000-2999)
  { code: '2000', name: 'Verbindlichkeiten', type: 'liability' },
  { code: '2100', name: 'Hausgeld-Vorauszahlungen', type: 'liability' },
  { code: '2110', name: 'Erhaltene Vorauszahlungen Hausgeld', type: 'liability' },
  { code: '2200', name: 'Erhaltene Sonderumlagen', type: 'liability' },
  { code: '2300', name: 'Verbindlichkeiten aus Lieferungen', type: 'liability' },
  { code: '2400', name: 'Rückstellungen', type: 'liability' },
  { code: '2500', name: 'Darlehen', type: 'liability' },

  // Equity (3000-3999)
  { code: '3000', name: 'Eigenkapital', type: 'equity' },
  { code: '3100', name: 'Rücklagen', type: 'equity' },
  { code: '3200', name: 'Jahresüberschuss/Jahresfehlbetrag', type: 'equity' },
  { code: '3300', name: 'Vortrag Vorjahr', type: 'equity' },

  // Income (4000-4999)
  { code: '4000', name: 'Hausgeld-Einnahmen', type: 'income' },
  { code: '4010', name: 'Hausgeld laufendes Jahr', type: 'income' },
  { code: '4020', name: 'Hausgeld Nachzahlungen', type: 'income' },
  { code: '4100', name: 'Sonderumlagen', type: 'income' },
  { code: '4110', name: 'Sonderumlage Instandhaltung', type: 'income' },
  { code: '4120', name: 'Sonderumlage Modernisierung', type: 'income' },
  { code: '4200', name: 'Zinserträge', type: 'income' },
  { code: '4300', name: 'Mieteinnahmen', type: 'income' },
  { code: '4310', name: 'Mieten Gemeinschaftseigentum', type: 'income' },
  { code: '4400', name: 'Betriebskostenerstattungen', type: 'income' },
  { code: '4500', name: 'Versicherungserstattungen', type: 'income' },
  { code: '4900', name: 'Sonstige Einnahmen', type: 'income' },

  // Expenses (6000-6999)
  { code: '6000', name: 'Instandhaltung und Instandsetzung', type: 'expense' },
  { code: '6010', name: 'Reparaturen Gebäude', type: 'expense' },
  { code: '6020', name: 'Reparaturen Heizung', type: 'expense' },
  { code: '6030', name: 'Reparaturen Aufzug', type: 'expense' },
  { code: '6040', name: 'Reparaturen Außenanlagen', type: 'expense' },
  { code: '6050', name: 'Wartung und Inspektion', type: 'expense' },

  { code: '6100', name: 'Hausmeister', type: 'expense' },
  { code: '6110', name: 'Hausmeisterlohn', type: 'expense' },
  { code: '6120', name: 'Hausmeistermaterial', type: 'expense' },

  { code: '6200', name: 'Versicherungen', type: 'expense' },
  { code: '6210', name: 'Gebäudeversicherung', type: 'expense' },
  { code: '6220', name: 'Haftpflichtversicherung', type: 'expense' },
  { code: '6230', name: 'Elementarversicherung', type: 'expense' },

  { code: '6300', name: 'Grundsteuer', type: 'expense' },

  { code: '6400', name: 'Heizkosten', type: 'expense' },
  { code: '6410', name: 'Brennstoffe', type: 'expense' },
  { code: '6420', name: 'Heizwartung', type: 'expense' },
  { code: '6430', name: 'Schornsteinfeger', type: 'expense' },

  { code: '6500', name: 'Wasser und Abwasser', type: 'expense' },
  { code: '6510', name: 'Wasserversorgung', type: 'expense' },
  { code: '6520', name: 'Abwassergebühren', type: 'expense' },

  { code: '6600', name: 'Müllabfuhr', type: 'expense' },

  { code: '6700', name: 'Strom Allgemeinstrom', type: 'expense' },
  { code: '6710', name: 'Strom Treppenhaus', type: 'expense' },
  { code: '6720', name: 'Strom Außenbeleuchtung', type: 'expense' },
  { code: '6730', name: 'Strom Aufzug', type: 'expense' },

  { code: '6800', name: 'Verwaltungskosten', type: 'expense' },
  { code: '6810', name: 'Verwaltergebühr', type: 'expense' },
  { code: '6820', name: 'Kontoführungsgebühren', type: 'expense' },
  { code: '6830', name: 'Wirtschaftsprüfung', type: 'expense' },
  { code: '6840', name: 'Rechts- und Beratungskosten', type: 'expense' },

  { code: '6900', name: 'Sonstige Kosten', type: 'expense' },
  { code: '6910', name: 'Gartenpflege', type: 'expense' },
  { code: '6920', name: 'Winterdienst', type: 'expense' },
  { code: '6930', name: 'Reinigung', type: 'expense' },
  { code: '6940', name: 'Ungezieferbekämpfung', type: 'expense' },
  { code: '6950', name: 'Prüfungen (TÜV, etc.)', type: 'expense' },
  { code: '6960', name: 'Porto und Kommunikation', type: 'expense' },
  { code: '6970', name: 'Büromaterial', type: 'expense' },
  { code: '6980', name: 'Gemeinschaftsraum', type: 'expense' },
  { code: '6990', name: 'Sonstige Betriebskosten', type: 'expense' },
];

/**
 * Get accounts by type
 */
export function getAccountsByType(type: string): DefaultAccount[] {
  return DEFAULT_WEG_ACCOUNTS.filter(account => account.type === type);
}

/**
 * Find account by code
 */
export function findAccountByCode(code: string): DefaultAccount | undefined {
  return DEFAULT_WEG_ACCOUNTS.find(account => account.code === code);
}

/**
 * Get all asset accounts
 */
export function getAssetAccounts(): DefaultAccount[] {
  return getAccountsByType('asset');
}

/**
 * Get all liability accounts
 */
export function getLiabilityAccounts(): DefaultAccount[] {
  return getAccountsByType('liability');
}

/**
 * Get all equity accounts
 */
export function getEquityAccounts(): DefaultAccount[] {
  return getAccountsByType('equity');
}

/**
 * Get all income accounts
 */
export function getIncomeAccounts(): DefaultAccount[] {
  return getAccountsByType('income');
}

/**
 * Get all expense accounts
 */
export function getExpenseAccounts(): DefaultAccount[] {
  return getAccountsByType('expense');
}
