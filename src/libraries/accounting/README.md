# WEG Accounting Library

A TypeScript accounting library for German WEG (Wohnungseigentümergemeinschaft) property management applications, designed for use with Tauri desktop apps.

## Features

- **Double-entry bookkeeping** with automatic balance validation
- **Precise decimal arithmetic** using decimal.js (no floating-point errors)
- **German chart of accounts** (SKR 04 adapted for WEG)
- **Cost allocation strategies** (by ownership share, usage, flat, specific amounts)
- **Journal entries and postings** with reversal support
- **Account ledgers** with running balances
- **Trial balance** generation
- **SQLite repository** with transaction support

## Installation

The library is already included in your project at `src/libraries/accounting/`. It uses the existing `decimal.js` dependency.

## Quick Start

```typescript
import Database from '@tauri-apps/plugin-sql';
import {
  createAccountingServices,
  initializeChartOfAccounts,
  Money,
  createAccountId,
} from './libraries/accounting';

// 1. Initialize the database connection
const db = await Database.load('sqlite:property.db');

// 2. Create all services at once
const services = createAccountingServices(db);

// 3. Initialize the default chart of accounts (first time only)
await initializeChartOfAccounts(services.repository);

// 4. Use the services
const bankAccount = await services.repository.accounts.findByCode('1000');
const expenseAccount = await services.repository.accounts.findByCode('6000');

// Create a journal entry
const entry = await services.journal.createEntry(
  {
    date: new Date(),
    description: 'Repair invoice payment',
    reference: 'INV-2024-001',
    createdBy: 'user-123',
  },
  [
    {
      accountId: expenseAccount!.id,
      amount: Money.of('1500.00').toString(),
      type: 'debit',
    },
    {
      accountId: bankAccount!.id,
      amount: Money.of('1500.00').toString(),
      type: 'credit',
    },
  ]
);
```

## Core Concepts

### Money Class

Always use the `Money` class for financial calculations to ensure precision:

```typescript
import { Money } from './libraries/accounting';

// Create money instances
const amount1 = Money.of('100.50'); // From string
const amount2 = Money.of(75.25); // From number
const zero = Money.zero(); // Zero amount

// Arithmetic operations (immutable)
const sum = amount1.add(amount2); // 175.75
const difference = amount1.subtract(amount2); // 25.25
const product = amount1.multiply(2); // 201.00
const quotient = amount1.divide(2); // 50.25

// Comparisons
amount1.greaterThan(amount2); // true
amount1.equals(Money.of('100.50')); // true
amount1.isPositive(); // true

// Formatting
amount1.toString(); // "100.50"
amount1.format(); // "100.50 EUR"
amount1.toJSON(); // { amount: "100.50", currency: "EUR" }
```

### Journal Entries

Create double-entry journal entries:

```typescript
// Simple expense entry
await services.journal.createEntry(
  {
    date: new Date('2024-01-15'),
    description: 'Insurance payment',
    createdBy: 'admin',
  },
  [
    { accountId: insuranceExpenseId, amount: '2400.00', type: 'debit' },
    { accountId: bankAccountId, amount: '2400.00', type: 'credit' },
  ]
);

// Reverse an entry (for corrections)
await services.journal.reverseEntry(
  entryId,
  'Incorrect amount entered',
  new Date(),
  'admin'
);
```

### Account Ledger

View all transactions for an account:

```typescript
// Get ledger with running balance
const ledger = await services.ledger.getAccountLedgerWithRunningBalance(
  accountId,
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  }
);

// Get current balance
const balance = await services.ledger.getBalance(accountId);
console.log(balance.format()); // "15,432.50 EUR"
```

### Cost Allocation

Allocate costs to units using different strategies:

```typescript
// Get all units
const units = await services.repository.units.findAll();

// Prepare unit inputs
const unitInputs = units.map(unit => ({
  unitId: unit.id,
  unitIdentifier: unit.unitNumber,
  ownershipShares: unit.ownershipShares,
}));

// Allocate by ownership shares
await services.allocation.createAllocationEntry(
  'by_share', // Strategy type
  Money.of('10000.00'), // Total amount
  unitInputs,
  expenseAccountId, // Where the cost is recorded
  receivableAccountId, // Where unit charges are recorded
  'Annual maintenance allocation',
  new Date(),
  'admin'
);

// Available strategies:
// - 'by_share': Proportional to ownership shares (Miteigentumsanteil)
// - 'by_usage': Proportional to usage values (e.g., water consumption)
// - 'flat': Equal distribution to all units
// - 'specific_units': Assign specific amounts to specific units
```

### Trial Balance

Generate a trial balance report:

```typescript
const trialBalance = await services.trialBalance.generate(new Date());

console.log(`As of: ${trialBalance.asOf}`);
console.log(`Total Debits: ${trialBalance.totalDebits.format()}`);
console.log(`Total Credits: ${trialBalance.totalCredits.format()}`);
console.log(`Balanced: ${trialBalance.isBalanced}`);

for (const row of trialBalance.accounts) {
  console.log(
    `${row.account.code} ${row.account.name}`,
    row.debitBalance?.format() || row.creditBalance?.format()
  );
}
```

## Default Chart of Accounts

The library includes a comprehensive German WEG chart of accounts based on SKR 04:

### Assets (1000-1999)
- 1000: Bank
- 1100: Instandhaltungsrücklage (Maintenance reserve)
- 1200: Forderungen Eigentümer (Owner receivables)

### Liabilities (2000-2999)
- 2000: Verbindlichkeiten (Liabilities)
- 2100: Hausgeld-Vorauszahlungen (Advance payments)

### Equity (3000-3999)
- 3000: Eigenkapital (Equity)
- 3100: Rücklagen (Reserves)

### Income (4000-4999)
- 4000: Hausgeld-Einnahmen (Maintenance fee income)
- 4100: Sonderumlagen (Special assessments)
- 4200: Zinserträge (Interest income)

### Expenses (6000-6999)
- 6000: Instandhaltung (Maintenance)
- 6100: Hausmeister (Caretaker)
- 6200: Versicherungen (Insurance)
- 6300: Grundsteuer (Property tax)
- 6400: Heizkosten (Heating)
- 6500: Wasser/Abwasser (Water/Sewage)
- 6600: Müllabfuhr (Waste disposal)
- 6700: Strom Allgemein (Electricity)
- 6800: Verwaltungskosten (Administration)
- 6900: Sonstige Kosten (Other costs)

## Architecture

### Core Components

- **[types.ts](core/types.ts)**: All TypeScript types and interfaces
- **[decimal.ts](core/decimal.ts)**: Money class for precise calculations
- **[errors.ts](core/errors.ts)**: Custom error classes
- **[validation.ts](core/validation.ts)**: Entry validation functions
- **[chart-of-accounts.ts](core/chart-of-accounts.ts)**: Default account definitions

### Repository Layer

- **[interfaces.ts](repository/interfaces.ts)**: Repository interface definitions
- **[sqlite.ts](repository/sqlite.ts)**: SQLite implementation using Tauri SQL plugin

### Operations/Services

- **[journal.ts](operations/journal.ts)**: Journal entry operations
- **[ledger.ts](operations/ledger.ts)**: Account ledger and balance calculations
- **[trial-balance.ts](operations/trial-balance.ts)**: Trial balance generation
- **[allocation/](operations/allocation/)**: Cost allocation system with multiple strategies

## Custom Allocation Strategies

You can create custom allocation strategies:

```typescript
import { AllocationStrategy, Money } from './libraries/accounting';

class MyCustomAllocation implements AllocationStrategy {
  readonly type = 'my_custom';
  readonly name = 'My Custom Allocation';
  readonly description = 'Custom allocation logic';

  validate(units) {
    // Validate inputs
    return { valid: true, errors: [] };
  }

  calculate(amount, units, options) {
    // Implement your allocation logic
    // Return AllocationResult
  }
}

// Register the strategy
services.allocation.registerStrategy(new MyCustomAllocation());

// Use it
await services.allocation.createAllocationEntry(
  'my_custom',
  amount,
  units,
  // ... other params
);
```

## Error Handling

The library provides specific error types:

```typescript
import {
  ValidationError,
  BalanceError,
  CurrencyMismatchError,
  EntityNotFoundError,
  AllocationError,
} from './libraries/accounting';

try {
  await services.journal.createEntry(entry, postings);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.errors);
  } else if (error instanceof BalanceError) {
    console.error('Entry does not balance:', error.message);
  }
}
```

## Best Practices

1. **Always use Money class** - Never use plain numbers for currency
2. **Validate before saving** - The library validates automatically, but you can pre-validate
3. **Use transactions** - For operations that involve multiple database writes
4. **Never delete entries** - Use reversals instead (accounting best practice)
5. **Check balances** - Regularly verify that trial balance is balanced
6. **Store amounts as strings** - In database and when passing to functions

## Example: Complete Workflow

```typescript
import Database from '@tauri-apps/plugin-sql';
import {
  createAccountingServices,
  initializeChartOfAccounts,
  Money,
} from './libraries/accounting';

// Setup
const db = await Database.load('sqlite:property.db');
const services = createAccountingServices(db);
await initializeChartOfAccounts(services.repository);

// Get accounts
const bank = await services.repository.accounts.findByCode('1000');
const heating = await services.repository.accounts.findByCode('6400');
const receivables = await services.repository.accounts.findByCode('1200');

// 1. Record heating bill payment
const heatingBill = Money.of('5000.00');
await services.journal.createEntry(
  {
    date: new Date('2024-01-15'),
    description: 'Heating bill Q4 2023',
    reference: 'HEAT-2023-Q4',
    createdBy: 'admin',
  },
  [
    { accountId: heating.id, amount: heatingBill.toString(), type: 'debit' },
    { accountId: bank.id, amount: heatingBill.toString(), type: 'credit' },
  ]
);

// 2. Allocate heating costs to units
const units = await services.repository.units.findAll();
await services.allocation.createAllocationEntry(
  'by_share',
  heatingBill,
  units.map(u => ({
    unitId: u.id,
    unitIdentifier: u.unitNumber,
    ownershipShares: u.ownershipShares,
  })),
  heating.id,
  receivables.id,
  'Heating allocation Q4 2023',
  new Date('2024-01-15'),
  'admin'
);

// 3. Check balances
const bankBalance = await services.ledger.getBalance(bank.id);
const receivablesBalance = await services.ledger.getBalance(receivables.id);

console.log('Bank balance:', bankBalance.format());
console.log('Receivables balance:', receivablesBalance.format());

// 4. Generate trial balance
const tb = await services.trialBalance.generate(new Date());
console.log('Trial balance is balanced:', tb.isBalanced);
```

## License

Part of the Verwaltungssoftware project.
