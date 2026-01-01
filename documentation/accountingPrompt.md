# Prompt: Implement WEG Accounting Library

## Context

You are implementing a TypeScript accounting library for a German WEG (Wohnungseigentümergemeinschaft) property management application. This library will be used in a Tauri desktop app with a Vue 3 frontend.

### Technical Environment

- **Runtime**: Tauri desktop app (Rust backend, web frontend)
- **Frontend**: Vue 3 + Pinia + Vue Router (but you are NOT building UI components)
- **Database**: SQLite accessed via `@tauri-apps/plugin-sql`
- **Package**: This library lives in `packages/accounting/` within a Turborepo monorepo
- **Package name**: `@weg-manager/accounting`

### Database Context

The library operates on a **per-property SQLite database**. Each WEG property has its own database file containing:

```sql
-- Chart of Accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id TEXT REFERENCES accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Journal Entries (transaction headers)
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_by_id TEXT REFERENCES journal_entries(id),
  reversal_of_id TEXT REFERENCES journal_entries(id),
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Postings (debits and credits)
CREATE TABLE postings (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  amount TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Cost Allocations (WEG-specific)
CREATE TABLE cost_allocations (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
  allocation_type TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Allocation Line Items
CREATE TABLE allocation_items (
  id TEXT PRIMARY KEY,
  allocation_id TEXT NOT NULL REFERENCES cost_allocations(id),
  unit_id TEXT NOT NULL,
  unit_identifier TEXT NOT NULL,
  share_value TEXT,
  usage_value TEXT,
  allocated_amount TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Units (for allocation reference)
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  unit_number TEXT UNIQUE NOT NULL,
  owner_id TEXT,
  ownership_shares INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Requirements

### 1. Core Types (`src/core/types.ts`)

Define TypeScript types and interfaces for:

- **Money**: Wrapper around decimal value with currency code (ISO 4217)
- **AccountType**: Union type `'asset' | 'liability' | 'equity' | 'income' | 'expense'`
- **Account**: Chart of accounts entry
- **JournalEntry**: Transaction header
- **Posting**: Individual debit or credit line
- **PostingType**: Union type `'debit' | 'credit'`
- **CostAllocation**: Allocation header with type identifier
- **AllocationItem**: Individual unit's allocation
- **Unit**: Property unit with ownership shares

Use branded types for IDs to prevent mixing different entity IDs:

```typescript
type AccountId = string & { readonly __brand: 'AccountId' }
type JournalEntryId = string & { readonly __brand: 'JournalEntryId' }
// etc.
```

### 2. Decimal Handling (`src/core/decimal.ts`)

Create a `Money` class wrapping `decimal.js`:

```typescript
class Money {
  private constructor(private value: Decimal, private currency: string)
  
  static of(amount: string | number, currency?: string): Money
  static zero(currency?: string): Money
  static sum(amounts: Money[]): Money
  
  add(other: Money): Money
  subtract(other: Money): Money
  multiply(factor: number | string): Money
  divide(divisor: number | string, roundingMode?: RoundingMode): Money
  abs(): Money
  negate(): Money
  
  isZero(): boolean
  isPositive(): boolean
  isNegative(): boolean
  equals(other: Money): boolean
  greaterThan(other: Money): boolean
  lessThan(other: Money): boolean
  
  toDecimalPlaces(places: number, roundingMode?: RoundingMode): Money
  toString(): string
  toNumber(): number // Use with caution
  toJSON(): { amount: string; currency: string }
}
```

Requirements:
- Immutable (all operations return new instances)
- Currency mismatch throws `CurrencyMismatchError`
- Default currency: `'EUR'`
- Default precision: 2 decimal places for display, higher internally
- Provide rounding modes: `HALF_UP`, `HALF_DOWN`, `ROUND_DOWN`, `ROUND_UP`

### 3. Validation (`src/core/validation.ts`)

Implement validation functions:

```typescript
// Validates that debits equal credits in a journal entry
function validateEntryBalance(postings: NewPosting[]): ValidationResult

// Validates account code format (e.g., "1000", "6200")
function validateAccountCode(code: string): ValidationResult

// Validates a complete journal entry before saving
function validateJournalEntry(entry: NewJournalEntry): ValidationResult

// Result type
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
  code: string
}
```

### 4. Chart of Accounts (`src/core/chart-of-accounts.ts`)

Provide default German WEG chart of accounts (SKR 04 adapted):

```typescript
const DEFAULT_WEG_ACCOUNTS: DefaultAccount[] = [
  // Assets (1000-1999)
  { code: '1000', name: 'Bank', type: 'asset' },
  { code: '1100', name: 'Instandhaltungsrücklage', type: 'asset' },
  { code: '1200', name: 'Forderungen Eigentümer', type: 'asset' },
  
  // Liabilities (2000-2999)
  { code: '2000', name: 'Verbindlichkeiten', type: 'liability' },
  { code: '2100', name: 'Hausgeld-Vorauszahlungen', type: 'liability' },
  
  // Equity (3000-3999)
  { code: '3000', name: 'Eigenkapital', type: 'equity' },
  
  // Income (4000-4999)
  { code: '4000', name: 'Hausgeld-Einnahmen', type: 'income' },
  { code: '4100', name: 'Sonderumlagen', type: 'income' },
  { code: '4200', name: 'Zinserträge', type: 'income' },
  
  // Expenses (6000-6999)
  { code: '6000', name: 'Instandhaltung', type: 'expense' },
  { code: '6100', name: 'Hausmeister', type: 'expense' },
  { code: '6200', name: 'Versicherungen', type: 'expense' },
  { code: '6300', name: 'Grundsteuer', type: 'expense' },
  { code: '6400', name: 'Heizkosten', type: 'expense' },
  { code: '6500', name: 'Wasser/Abwasser', type: 'expense' },
  { code: '6600', name: 'Müllabfuhr', type: 'expense' },
  { code: '6700', name: 'Strom Allgemein', type: 'expense' },
  { code: '6800', name: 'Verwaltungskosten', type: 'expense' },
  { code: '6900', name: 'Sonstige Kosten', type: 'expense' },
]

function initializeChartOfAccounts(repo: IAccountRepository): Promise<void>
```

### 5. Repository Interfaces (`src/repository/interfaces.ts`)

Define repository interfaces for data access:

```typescript
interface IAccountRepository {
  findById(id: AccountId): Promise<Account | null>
  findByCode(code: string): Promise<Account | null>
  findAll(): Promise<Account[]>
  findByType(type: AccountType): Promise<Account[]>
  save(account: NewAccount): Promise<Account>
  update(id: AccountId, updates: Partial<Account>): Promise<Account>
}

interface IJournalRepository {
  findById(id: JournalEntryId): Promise<JournalEntry | null>
  findByDateRange(start: Date, end: Date): Promise<JournalEntry[]>
  findByAccount(accountId: AccountId, options?: QueryOptions): Promise<JournalEntry[]>
  save(entry: NewJournalEntry): Promise<JournalEntry>
  markReversed(id: JournalEntryId, reversedById: JournalEntryId): Promise<void>
}

interface IPostingRepository {
  findByJournalEntry(entryId: JournalEntryId): Promise<Posting[]>
  findByAccount(accountId: AccountId, options?: DateRangeOptions): Promise<Posting[]>
  saveAll(postings: NewPosting[]): Promise<Posting[]>
}

interface IAllocationRepository {
  findByJournalEntry(entryId: JournalEntryId): Promise<CostAllocation | null>
  save(allocation: NewCostAllocation): Promise<CostAllocation>
  saveItems(items: NewAllocationItem[]): Promise<AllocationItem[]>
}

interface IUnitRepository {
  findById(id: UnitId): Promise<Unit | null>
  findAll(): Promise<Unit[]>
  getTotalShares(): Promise<number>
}

// Combined interface for convenience
interface IAccountingRepository {
  accounts: IAccountRepository
  journal: IJournalRepository
  postings: IPostingRepository
  allocations: IAllocationRepository
  units: IUnitRepository
  
  // Transaction support
  transaction<T>(fn: () => Promise<T>): Promise<T>
}
```

### 6. SQLite Repository Implementation (`src/repository/sqlite.ts`)

Implement the repository interfaces using Tauri's SQL plugin:

```typescript
import Database from '@tauri-apps/plugin-sql'

function createSqliteRepository(db: Database): IAccountingRepository
```

Requirements:
- Use parameterized queries (prevent SQL injection)
- Map database rows to domain types
- Handle NULL values appropriately
- Generate UUIDs for new records (use `crypto.randomUUID()`)
- Implement transaction support using SQLite's BEGIN/COMMIT/ROLLBACK

### 7. Journal Operations (`src/operations/journal.ts`)

```typescript
interface JournalService {
  // Create a new journal entry with postings
  createEntry(
    entry: NewJournalEntry,
    postings: NewPosting[]
  ): Promise<JournalEntry>
  
  // Create a reversal entry (for corrections - never delete in accounting)
  reverseEntry(
    entryId: JournalEntryId,
    reason: string,
    date?: Date
  ): Promise<JournalEntry>
  
  // Get entry with all postings loaded
  getEntryWithPostings(id: JournalEntryId): Promise<JournalEntryWithPostings | null>
}

function createJournalService(repo: IAccountingRepository): JournalService
```

### 8. Ledger Operations (`src/operations/ledger.ts`)

```typescript
interface LedgerService {
  // Get account balance as of a specific date
  getBalance(accountId: AccountId, asOf?: Date): Promise<Money>
  
  // Get all postings for an account (account ledger)
  getAccountLedger(
    accountId: AccountId,
    options?: DateRangeOptions
  ): Promise<LedgerEntry[]>
  
  // Get running balance for each posting
  getAccountLedgerWithRunningBalance(
    accountId: AccountId,
    options?: DateRangeOptions
  ): Promise<LedgerEntryWithBalance[]>
}

interface LedgerEntry {
  date: Date
  description: string
  reference?: string
  debit?: Money
  credit?: Money
  journalEntryId: JournalEntryId
}

interface LedgerEntryWithBalance extends LedgerEntry {
  balance: Money
}

function createLedgerService(repo: IAccountingRepository): LedgerService
```

Balance calculation rules:
- Assets & Expenses: Debits increase, Credits decrease
- Liabilities, Equity & Income: Credits increase, Debits decrease

### 9. Trial Balance (`src/operations/trial-balance.ts`)

```typescript
interface TrialBalanceService {
  generate(asOf: Date): Promise<TrialBalance>
}

interface TrialBalance {
  asOf: Date
  accounts: TrialBalanceRow[]
  totalDebits: Money
  totalCredits: Money
  isBalanced: boolean
}

interface TrialBalanceRow {
  account: Account
  debitBalance?: Money
  creditBalance?: Money
}

function createTrialBalanceService(repo: IAccountingRepository): TrialBalanceService
```

### 10. Cost Allocation System (`src/operations/allocation/`)

Implement using the Strategy Pattern so new allocation types can be added easily:

```typescript
// Base interface for all allocation strategies
interface AllocationStrategy {
  readonly type: string
  readonly name: string
  
  // Calculate allocation for each unit
  calculate(
    amount: Money,
    units: UnitAllocationInput[],
    options?: AllocationOptions
  ): AllocationResult
  
  // Validate inputs for this strategy
  validate(units: UnitAllocationInput[]): ValidationResult
}

interface UnitAllocationInput {
  unitId: UnitId
  unitIdentifier: string
  ownershipShares: number
  usageValue?: number  // For usage-based allocation
  customAmount?: Money // For specific unit allocation
}

interface AllocationResult {
  totalAmount: Money
  items: AllocationResultItem[]
  remainder: Money  // Rounding remainder
  appliedRemainderTo?: UnitId  // Which unit received the remainder
}

interface AllocationResultItem {
  unitId: UnitId
  unitIdentifier: string
  shareValue?: number
  usageValue?: number
  allocatedAmount: Money
}
```

#### Built-in Allocation Strategies

**ByShareAllocation** (`by_share`):
- Distributes costs proportionally to ownership shares (Miteigentumsanteil)
- Each unit's share = (unit_shares / total_shares) × total_amount
- Handle rounding remainder by assigning to largest shareholder

**ByUsageAllocation** (`by_usage`):
- Distributes costs proportionally to usage values (e.g., water consumption in m³)
- Requires `usageValue` on each unit
- Each unit's share = (unit_usage / total_usage) × total_amount

**FlatAllocation** (`flat`):
- Distributes costs equally among all units
- Each unit's share = total_amount / number_of_units

**SpecificUnitsAllocation** (`specific_units`):
- Assigns specific amounts to specific units
- Requires `customAmount` on each unit
- Validates that sum of custom amounts equals total

#### Allocation Service

```typescript
interface AllocationService {
  // Register a new allocation strategy
  registerStrategy(strategy: AllocationStrategy): void
  
  // Get available strategies
  getAvailableStrategies(): AllocationStrategy[]
  
  // Calculate allocation using specified strategy
  calculate(
    strategyType: string,
    amount: Money,
    units: UnitAllocationInput[],
    options?: AllocationOptions
  ): AllocationResult
  
  // Create and save allocation with journal entry
  createAllocationEntry(
    strategyType: string,
    amount: Money,
    units: UnitAllocationInput[],
    expenseAccountId: AccountId,
    description: string,
    date: Date,
    createdBy: string
  ): Promise<JournalEntry>
}

function createAllocationService(repo: IAccountingRepository): AllocationService
```

### 11. Error Types (`src/core/errors.ts`)

Define custom error classes:

```typescript
class AccountingError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AccountingError'
  }
}

class ValidationError extends AccountingError {
  constructor(message: string, public errors: ValidationError[]) {
    super(message, 'VALIDATION_ERROR')
  }
}

class BalanceError extends AccountingError {
  constructor(debits: Money, credits: Money) {
    super(
      `Entry does not balance: debits=${debits}, credits=${credits}`,
      'BALANCE_ERROR'
    )
  }
}

class CurrencyMismatchError extends AccountingError {
  constructor(expected: string, actual: string) {
    super(
      `Currency mismatch: expected ${expected}, got ${actual}`,
      'CURRENCY_MISMATCH'
    )
  }
}

class EntityNotFoundError extends AccountingError {
  constructor(entityType: string, id: string) {
    super(`${entityType} not found: ${id}`, 'NOT_FOUND')
  }
}

class AllocationError extends AccountingError {
  constructor(message: string) {
    super(message, 'ALLOCATION_ERROR')
  }
}
```

### 12. Public API (`src/index.ts`)

Export a clean public API:

```typescript
// Types
export type {
  Money,
  Account,
  AccountType,
  AccountId,
  JournalEntry,
  JournalEntryId,
  Posting,
  PostingType,
  CostAllocation,
  AllocationItem,
  Unit,
  UnitId,
  // ... etc
}

// Core
export { Money } from './core/decimal'
export { DEFAULT_WEG_ACCOUNTS, initializeChartOfAccounts } from './core/chart-of-accounts'
export { validateJournalEntry, validateEntryBalance } from './core/validation'

// Repository
export type { IAccountingRepository, IAccountRepository, IJournalRepository /* ... */ }
export { createSqliteRepository } from './repository/sqlite'

// Services
export { createJournalService } from './operations/journal'
export { createLedgerService } from './operations/ledger'
export { createTrialBalanceService } from './operations/trial-balance'
export { createAllocationService } from './operations/allocation'

// Allocation strategies (for custom registration)
export { AllocationStrategy } from './operations/allocation/strategy'
export { ByShareAllocation } from './operations/allocation/by-share'
export { ByUsageAllocation } from './operations/allocation/by-usage'
export { FlatAllocation } from './operations/allocation/flat'
export { SpecificUnitsAllocation } from './operations/allocation/specific-units'

// Errors
export {
  AccountingError,
  ValidationError,
  BalanceError,
  CurrencyMismatchError,
  EntityNotFoundError,
  AllocationError,
}

// Factory function for easy setup
export function createAccountingServices(db: Database): {
  repository: IAccountingRepository
  journal: JournalService
  ledger: LedgerService
  trialBalance: TrialBalanceService
  allocation: AllocationService
}
```

---

## Usage Example (for reference)

This shows how the library would be used in a Pinia store:

```typescript
// stores/accounting.ts
import { defineStore } from 'pinia'
import Database from '@tauri-apps/plugin-sql'
import {
  createAccountingServices,
  Money,
  type JournalEntry,
  type Account,
} from '@weg-manager/accounting'

export const useAccountingStore = defineStore('accounting', () => {
  const db = ref<Database | null>(null)
  const services = ref<ReturnType<typeof createAccountingServices> | null>(null)
  
  async function initialize(propertyDbPath: string) {
    db.value = await Database.load(`sqlite:${propertyDbPath}`)
    services.value = createAccountingServices(db.value)
  }
  
  async function createExpenseEntry(
    date: Date,
    description: string,
    amount: string,
    expenseAccountCode: string
  ) {
    const money = Money.of(amount)
    const expenseAccount = await services.value!.repository.accounts.findByCode(expenseAccountCode)
    const bankAccount = await services.value!.repository.accounts.findByCode('1000')
    
    return services.value!.journal.createEntry(
      { date, description, createdBy: 'current-user-id' },
      [
        { accountId: expenseAccount!.id, amount: money, type: 'debit' },
        { accountId: bankAccount!.id, amount: money, type: 'credit' },
      ]
    )
  }
  
  async function allocateExpenseByShares(
    amount: string,
    expenseAccountId: string,
    description: string
  ) {
    const units = await services.value!.repository.units.findAll()
    
    return services.value!.allocation.createAllocationEntry(
      'by_share',
      Money.of(amount),
      units.map(u => ({
        unitId: u.id,
        unitIdentifier: u.unitNumber,
        ownershipShares: u.ownershipShares,
      })),
      expenseAccountId,
      description,
      new Date(),
      'current-user-id'
    )
  }
  
  return { initialize, createExpenseEntry, allocateExpenseByShares }
})
```

---

## Implementation Guidelines

1. **Start with core types and Money class** - everything else depends on these
2. **Write unit tests for Money class** - decimal precision is critical
3. **Implement repository interfaces** - then SQLite implementation
4. **Build services incrementally** - journal → ledger → trial balance → allocation
5. **Each allocation strategy is a separate file** - easy to add new ones later
6. **No UI code** - this is a pure logic library
7. **All async operations return Promises** - for Tauri SQL compatibility
8. **Use dependency injection** - services receive repositories, not database directly

## File Structure

```
packages/accounting/
├── src/
│   ├── core/
│   │   ├── types.ts
│   │   ├── decimal.ts
│   │   ├── validation.ts
│   │   ├── chart-of-accounts.ts
│   │   └── errors.ts
│   │
│   ├── operations/
│   │   ├── journal.ts
│   │   ├── ledger.ts
│   │   ├── trial-balance.ts
│   │   └── allocation/
│   │       ├── index.ts
│   │       ├── strategy.ts
│   │       ├── service.ts
│   │       ├── by-share.ts
│   │       ├── by-usage.ts
│   │       ├── flat.ts
│   │       └── specific-units.ts
│   │
│   ├── repository/
│   │   ├── interfaces.ts
│   │   └── sqlite.ts
│   │
│   └── index.ts
│
├── tests/
│   ├── decimal.test.ts
│   ├── validation.test.ts
│   ├── journal.test.ts
│   ├── ledger.test.ts
│   └── allocation.test.ts
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Dependencies

```json
{
  "dependencies": {
    "decimal.js": "^10.4.3"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0"
  }
}
```