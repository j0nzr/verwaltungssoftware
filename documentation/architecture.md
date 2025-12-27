# Architecture Proposal: WEG Property Management MVP

**Last Updated:** 2025-12-23

---

## Table of Contents

1. [Deployment Model Recommendation](#1-deployment-model-recommendation)
2. [Tech Stack Recommendation](#2-tech-stack-recommendation)
3. [Tauri Architecture: Vue vs. Rust Responsibilities](#3-tauri-architecture-vue-vs-rust-responsibilities)
4. [Data Layer Architecture (Offline-First Sync)](#4-data-layer-architecture-offline-first-sync)
5. [Multi-Tenant (Mandant) Architecture](#5-multi-tenant-mandant-architecture)
6. [Role & Permission Model](#6-role--permission-model)
7. [MVP Data Model](#7-mvp-data-model)
8. [Implementation Roadmap (MVP)](#8-implementation-roadmap-mvp)
9. [FOSS Integration Strategy](#9-foss-integration-strategy)
10. [Key Technical Decisions Summary](#10-key-technical-decisions-summary)
11. [Monorepo Setup & Workflow](#11-monorepo-setup--workflow)
12. [Next Steps](#12-next-steps)

---

## 1. Deployment Model Recommendation

### Primary Recommendation: Tauri Desktop Application + Optional PWA for Mobile

**Architecture:**
- **Desktop-first** application built with Tauri (Rust + Vue/Nuxt frontend)
- **SQLite database** for local-first data storage
- **Native file system access** for ODF templates and document generation
- **Optional PWA** for mobile/web access with limited features (view-only, data entry)

**Why desktop-first:**
- **ODF → PDF conversion**: Requires LibreOffice headless (not available in browser)
- **Template management**: Property managers create/edit ODT templates in LibreOffice, app loads them from file system
- **Offline-first**: All operations work without internet (critical for German data protection)
- **GoBD compliance**: Local data storage with full audit trail
- **Target users**: Property managers work primarily on desktop computers
- **File operations**: Better support for CSV import, document attachments, bulk operations
- **Same codebase**: Nuxt/Vue frontend works identically in Tauri or PWA

**Desktop distribution:**
- Windows: .msi installer
- macOS: .dmg / .app bundle
- Linux: .deb / .AppImage

**Optional PWA deployment:**
- Mobile/tablet access for on-site property inspections
- Remote data viewing and simple data entry
- PDF generation requires desktop app or cloud API
- Shares same Nuxt/Vue codebase with desktop version

**Why Tauri over Electron:**
- Smaller bundle size (~3MB vs ~150MB)
- Better performance (native Rust backend)
- Lower memory footprint
- Better security model
- Native system integration

---

## 2. Tech Stack Recommendation

### Frontend
- **Framework:** Choose based on your preference - all work equally well with local-first:
  - **Vue**: Excellent DX, Vue's reactivity great for local-first, growing ecosystem

- **UI Library:**
  - Vue: PrimeVue

- **Forms:**
  - Vue: VeeValidate or FormKit with Zod

- **State Management:**
  - Vue: Pinia + VueUse (includes useQuery/useMutation)

### Data Layer
- **Local Database (Desktop):** **SQLite** via Tauri's SQL plugin
  - Native performance, proven reliability
  - Full SQL support with complex queries
  - Direct access from Rust backend
  - TypeScript type safety via codegen
  - Built-in migration support

- **Local Database (PWA - Optional):** **Dexie.js** (IndexedDB wrapper)
  - Simpler than RxDB for read-only/limited features
  - Good TypeScript support
  - Reactive queries for Vue integration

- **Sync Engine (When Cloud Sync Needed):** **Electric SQL** or custom solution
  - Electric SQL: PostgreSQL-based, SQLite replication
  - Or: Simple REST API with conflict resolution
  - Desktop-first means sync is lower priority for MVP

### Backend (Optional Cloud Sync)
- **API:** Hono or tRPC (type-safe APIs)
- **Database:** PostgreSQL with row-level security
- **Sync:** Electric SQL server or custom CRDT-based sync
- **Auth:** Clerk or Auth.js (formerly NextAuth)
- **Hosting:** Railway, Fly.io, or Render for simple deployment

### German Compliance & Document Generation
- **Document Templates:** Open Document Format (ODF) - ISO 26300 standard
  - Property managers create/edit templates in LibreOffice Writer
  - Templates stored in file system with placeholder syntax
  - Frontend fills placeholders with calculated data (Vue/TypeScript)
  - ODF is standard format for German public sector

- **PDF Generation:** LibreOffice headless conversion (via Rust backend)
  - Generate editable .odt file first (allows review/corrections)
  - Convert to final .pdf via LibreOffice command-line
  - Store both .odt (source) and .pdf (final) for GoBD compliance
  - Fully offline, no cloud dependency

- **Accounting:** Custom implementation with decimal.js for precise calculations
  - German-specific WEG accounting rules
  - Exact decimal precision (no floating-point errors)
  - All calculations performed in Vue/TypeScript layer

- **GoBD Compliance:**
  - Audit trail in SQLite with modification history
  - Immutable transaction records with tamper detection
  - Export to GoBD-compliant JSON/CSV format
  - Document versioning (template + data + generated output)

### Build & Deploy
- **Monorepo:** Turborepo + pnpm workspaces (recommended for simplicity)
  - Alternative: Nx (if you need more features/generators)
- **Package Manager:** pnpm
- **Desktop Framework:** Tauri (Rust backend + web frontend)
- **Desktop Build Outputs:**
  - Windows: .msi installer
  - macOS: .dmg disk image and .app bundle
  - Linux: .deb package, .AppImage

**Recommendation:** Build as **Tauri desktop app** with **Nuxt 3 + SQLite** for MVP. This enables ODF template management and PDF generation. Optional PWA deployment uses same Nuxt frontend for mobile access.

### Monorepo Structure (Recommended)

```
weg-manager/
├── apps/
│   ├── desktop/                # Tauri desktop app (primary)
│   │   ├── src/                # Nuxt 3 frontend
│   │   └── src-tauri/          # Rust backend
│   ├── web/                    # Optional: PWA for mobile (same Nuxt code)
│   └── api/                    # Optional: Cloud sync API (later)
│
├── packages/
│   ├── types/                  # Shared TypeScript types & interfaces
│   ├── database/               # SQLite schemas, migrations, queries
│   ├── business-logic/         # WEG calculations & allocation rules
│   ├── document-generator/     # ODF template filling logic
│   └── utils/                  # Formatting, validation, helpers
│
├── templates/                  # ODF document templates (.odt files)
│   └── jahresabrechnung.odt
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace config
├── turbo.json                  # Turborepo config
└── tsconfig.json               # Base TypeScript config
```

**Benefits:**
- Share TypeScript types between Vue frontend and Rust backend
- Business logic (calculations) stays in Vue/TypeScript (testable, platform-agnostic)
- Rust backend handles only file I/O and system commands (minimal Rust code)
- Same Nuxt frontend works in Tauri desktop and optional PWA
- Easy to add cloud sync API later without duplicating business logic
- ODF templates versioned with code

---

## 3. Tauri Architecture: Vue vs. Rust Responsibilities

### Overview

Tauri applications have two distinct layers that communicate via Inter-Process Communication (IPC):
- **Frontend (Vue/Nuxt)**: Runs in webview, handles UI and business logic
- **Backend (Rust)**: Runs as native process, handles system operations

### Division of Responsibilities

#### Frontend Layer (Vue/Nuxt) - 80-90% of Code

**Responsibilities:**
- All UI components and user interactions
- Business logic and calculations (Jahresabrechnung, cost allocations)
- Data validation and formatting
- Database operations via Tauri SQL plugin
- ODF template filling (JavaScript/TypeScript)
- State management (Pinia stores)
- Form handling and validation (Zod schemas)
- Routing and navigation

**Why frontend:**
- Business logic benefits from TypeScript's type safety
- Easier to test (Jest, Vitest)
- Calculations use decimal.js (no Rust equivalent needed)
- Can be reused in optional PWA deployment
- Faster development (no Rust compilation)
- Most developers know Vue/TypeScript better than Rust

#### Backend Layer (Rust) - 10-20% of Code

**Responsibilities:**
- File system operations (read/write/browse templates and documents)
- System commands (execute LibreOffice for PDF conversion)
- Native OS integration (file dialogs, system notifications)
- Database connection management (SQLite)
- Window management and system tray
- Performance-critical operations (if needed)

**Why backend:**
- Requires native file system access (not available in browser)
- Needs to execute system commands (LibreOffice CLI)
- Better security for system-level operations
- Access to OS-native APIs
- Required for desktop distribution

### Communication Pattern

**Frontend → Backend (Commands):**
- Frontend calls Rust functions via `invoke()` API
- Rust functions return results asynchronously
- Used for: file operations, PDF conversion, system dialogs

**Backend → Frontend (Events):**
- Rust emits events that frontend listens to
- Used for: progress updates, system notifications
- Frontend updates UI reactively

### Example Workflow: Generate Jahresabrechnung

**Step 1 (Vue):** User clicks "Generate Report"
**Step 2 (Vue):** Query transactions from SQLite via Tauri SQL plugin
**Step 3 (Vue):** Calculate allocations using business-logic package
**Step 4 (Vue):** Fill ODF template with calculated data (JSZip)
**Step 5 (Rust):** Save .odt file to file system via `invoke('save_file')`
**Step 6 (Rust):** Convert .odt to .pdf via `invoke('convert_to_pdf')` → calls LibreOffice
**Step 7 (Rust):** Open PDF in default viewer via `invoke('open_file')`
**Step 8 (Vue):** Update UI to show success

### Key Architectural Decisions

1. **Keep business logic in Vue/TypeScript**
   - Easier to test and maintain
   - Can be reused if you add web version or API
   - No need to rewrite WEG calculations in Rust

2. **Minimize Rust code**
   - Only ~5-10 Rust command functions needed
   - Focus on file I/O and system integration
   - Reduces Rust learning curve

3. **Use Tauri plugins where possible**
   - Tauri SQL plugin for database (no custom Rust needed)
   - Tauri Dialog plugin for file pickers
   - Tauri FS plugin for file operations
   - Reduces custom Rust code further

### Estimated Code Distribution

**Vue/Nuxt Frontend:**
- UI Components: ~40%
- Business Logic: ~30%
- Database Queries: ~15%
- Utilities: ~15%

**Rust Backend:**
- File operations: ~40%
- PDF conversion: ~30%
- System integration: ~20%
- Boilerplate: ~10%

**Total:** ~85% Vue/TypeScript, ~15% Rust

### Developer Experience

**For developers who know Vue:**
- Build entire app as normal Nuxt application
- Add Tauri wrapper when ready
- Write 5-10 simple Rust functions by copying examples
- No deep Rust knowledge required

**Rust learning requirements:**
- Understand basic syntax (1-2 weeks)
- Know how to call system commands
- Understand Result/Option types
- That's it - no advanced Rust needed

---

## 4. Data Layer Architecture: Separate Books per Property

### Core Principle: Each Property = Separate Accounting Books

In professional accounting, **each legal entity maintains separate books**. Since each WEG property is a separate legal entity, the architecture reflects this:

**Desktop Storage:**
```
~/.weg-manager/
├── company.db                   # Company-level data
│   ├── users                    # Property managers
│   ├── properties (metadata)    # List of properties
│   ├── property_access          # Who can access which property
│   └── document_templates       # Shared ODF templates
│
└── properties/
    ├── {property-uuid-1}.db    # Property 1: Complete accounting books
    ├── {property-uuid-2}.db    # Property 2: Complete accounting books
    └── {property-uuid-3}.db    # Property 3: Complete accounting books
```

### Why Separate Databases per Property

**Accounting correctness:**
- Each WEG property is legally separate entity
- Matches traditional accounting practice (separate ledger per entity)
- No risk of mixing transactions between properties
- Clear audit boundaries for GoBD compliance

**Technical benefits:**
- Physical data isolation (file system separation)
- Easier backup/restore per property
- Smaller database files = better performance
- Natural multi-tenancy (property = tenant)
- Simpler queries (no property_id filtering needed)

**GoBD compliance:**
- Each property's books are separate audit unit
- Export single property's data without filtering
- Clear tamper-proof boundaries
- Matches German accounting standards

### Database Connection Management

**Application state:**
```typescript
// Global state
const currentPropertyId = ref<string | null>(null)
const currentPropertyDb = ref<Database | null>(null)
const companyDb = ref<Database>(null)  // Always open

// Property database cache
const propertyDatabases = new Map<string, Database>()

// Switch property context
async function switchToProperty(propertyId: string) {
  if (propertyDatabases.has(propertyId)) {
    currentPropertyDb.value = propertyDatabases.get(propertyId)
  } else {
    const db = await Database.load(`sqlite:properties/${propertyId}.db`)
    await ensureSchema(db)  // Run migrations if needed
    propertyDatabases.set(propertyId, db)
    currentPropertyDb.value = db
  }
  currentPropertyId.value = propertyId
}
```

### Cloud Sync Strategy (Optional)

When cloud sync is needed, each property database syncs to separate PostgreSQL schema:

**PostgreSQL structure:**
```
PostgreSQL Server
├── Shared tables (public schema)
│   ├── companies
│   ├── users
│   └── property_metadata
│
└── Property-specific schemas
    ├── property_{uuid_1}
    │   ├── journal_entries
    │   ├── postings
    │   ├── accounts
    │   └── contacts
    │
    ├── property_{uuid_2}
    │   └── ... (same schema)
    │
    └── property_{uuid_3}
        └── ... (same schema)
```

**Sync mechanics:**
- Each property database syncs independently
- Schema per property maintains separation in cloud
- Conflict resolution per property (isolated)
- Can sync individual properties on-demand

---

## 5. Multi-Tenant (Mandant) Architecture

### Two-Tier Database Structure

**Tenant boundary = Property** (each WEG property is the tenant)

### Tier 1: Company Database (company.db)

Shared data across all properties managed by the company:

```sql
-- Property managers and authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  company_role TEXT NOT NULL,  -- 'company_admin' | 'property_manager'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property metadata (NOT accounting data)
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  weg_number TEXT,              -- Official WEG registration number
  accounting_year_start TEXT,   -- MM-DD format, e.g., "01-01"
  total_units INTEGER NOT NULL,
  db_path TEXT NOT NULL,        -- Path to property's database file
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Property access control
CREATE TABLE property_access (
  user_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  role TEXT NOT NULL,           -- 'viewer' | 'editor' | 'admin'
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Shared document templates
CREATE TABLE document_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'jahresabrechnung', 'letter', etc.
  file_path TEXT NOT NULL,      -- Path to .odt file
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Tier 2: Property Database (properties/{property-id}.db)

**Each property has its own complete accounting database:**

```sql
-- Double-Entry Chart of Accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,    -- e.g., "1000", "4000", "6200"
  name TEXT NOT NULL,            -- e.g., "Bank Account", "Hausgeld Einnahmen"
  type TEXT NOT NULL,            -- 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parent_id TEXT,                -- For account hierarchy
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounts(id)
);

-- Journal Entries (double-entry transactions)
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,                -- Invoice number, receipt ID, etc.
  created_by TEXT NOT NULL,      -- User ID from company.db
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP
);

-- Postings (debits and credits)
CREATE TABLE postings (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  debit TEXT,                    -- Decimal as string, NULL or amount
  credit TEXT,                   -- Decimal as string, NULL or amount
  memo TEXT,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  CHECK ((debit IS NULL AND credit IS NOT NULL) OR
         (debit IS NOT NULL AND credit IS NULL))
);

-- WEG-specific: Cost Allocations
CREATE TABLE cost_allocations (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL,
  allocation_type TEXT NOT NULL, -- 'by_share' | 'by_usage' | 'flat' | 'specific_units'
  units JSONB NOT NULL,          -- [{unitNumber, share, amount}, ...]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- Property owners and tenants
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,            -- 'owner' | 'tenant' | 'service_provider'
  salutation TEXT,               -- 'Herr' | 'Frau' | 'Firma'
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  unit_numbers JSONB,            -- Array of unit numbers they own/occupy
  ownership_shares INTEGER,      -- Miteigentumsanteil (in Tausendstel)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Units in the property
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  unit_number TEXT UNIQUE NOT NULL,
  owner_id TEXT,                 -- Current owner contact ID
  ownership_shares INTEGER NOT NULL, -- Miteigentumsanteil
  floor INTEGER,
  size_sqm REAL,
  notes TEXT,
  FOREIGN KEY (owner_id) REFERENCES contacts(id)
);

-- Jahresabrechnung (annual statements)
CREATE TABLE jahresabrechnungen (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  status TEXT NOT NULL,          -- 'draft' | 'final' | 'published'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary JSONB NOT NULL,        -- {totalIncome, totalExpenses, result, reserves}
  unit_allocations JSONB NOT NULL, -- Full allocation data per unit
  generated_at TIMESTAMP,
  approved_by TEXT,              -- User ID
  approved_at TIMESTAMP,
  odt_file_path TEXT,            -- Path to .odt source
  pdf_file_path TEXT,            -- Path to final .pdf
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GoBD Audit Trail
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,          -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_values JSONB,
  new_values JSONB,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Multi-Tenancy Pattern

```
Desktop Installation
├── company.db
│   ├── users (property managers)
│   ├── properties (metadata only)
│   │   ├── id: prop-1, name: "Musterstraße 10", db_path: "properties/prop-1.db"
│   │   ├── id: prop-2, name: "Hauptstraße 5", db_path: "properties/prop-2.db"
│   │   └── id: prop-3, name: "Parkweg 3", db_path: "properties/prop-3.db"
│   └── property_access (who accesses what)
│
└── properties/
    ├── prop-1.db (Musterstraße 10 - Complete accounting books)
    │   ├── accounts, journal_entries, postings
    │   ├── contacts, units
    │   └── jahresabrechnungen
    │
    ├── prop-2.db (Hauptstraße 5 - Complete accounting books)
    │   └── ... (same schema)
    │
    └── prop-3.db (Parkweg 3 - Complete accounting books)
        └── ... (same schema)
```

### Isolation Strategy

**Physical separation:**
- Each property's accounting data in separate SQLite file
- Impossible to mix transactions between properties
- File-system level isolation

**Access control:**
- Company.db stores which users can access which properties
- Application enforces access before opening property database
- Property databases contain no user authentication data

**Data integrity:**
- No property_id foreign keys needed (this database IS the property)
- Simpler schema, fewer joins
- Natural backup boundary (one file = one property's books)

---

## 6. Role & Permission Model

### Recommended Model

#### Company Roles
1. **Company Admin**
   - Manage company settings (incl. offline permissions)
   - Add/remove users
   - Create/archive properties
   - Full access to all properties

2. **Property Manager**
   - Access only assigned properties
   - Can be granted different roles per property

#### Property Roles
1. **Property Admin**
   - Manage property settings
   - Assign property access to other users
   - Approve Jahresabrechnung
   - Full read/write to accounting and contacts

2. **Property Editor**
   - Import/edit accounting transactions
   - Manage contacts
   - Create draft Jahresabrechnung
   - Cannot publish final version

3. **Property Viewer**
   - Read-only access
   - View reports and contacts
   - Export data

### Permission Matrix

| Action                          | Viewer | Editor | Property Admin | Company Admin |
|---------------------------------|--------|--------|----------------|---------------|
| View transactions               | ✓      | ✓      | ✓              | ✓             |
| Import/edit transactions        | ✗      | ✓      | ✓              | ✓             |
| View contacts                   | ✓      | ✓      | ✓              | ✓             |
| Edit contacts                   | ✗      | ✓      | ✓              | ✓             |
| Generate draft Jahresabrechnung | ✗      | ✓      | ✓              | ✓             |
| Publish final Jahresabrechnung  | ✗      | ✗      | ✓              | ✓             |
| Manage property settings        | ✗      | ✗      | ✓              | ✓             |
| Assign users to property        | ✗      | ✗      | ✓              | ✓             |
| Manage company settings         | ✗      | ✗      | ✗              | ✓             |

### Implementation

```typescript
type CompanyRole = 'company_admin' | 'property_manager';
type PropertyRole = 'viewer' | 'editor' | 'admin';

interface UserPermissions {
  companyId: string;
  companyRole: CompanyRole;
  properties: {
    propertyId: string;
    role: PropertyRole;
  }[];
}

function can(user: UserPermissions, action: string, propertyId: string): boolean {
  // Company admins can do everything
  if (user.companyRole === 'company_admin') return true;

  // Check property-specific permissions
  const propertyAccess = user.properties.find(p => p.propertyId === propertyId);
  if (!propertyAccess) return false;

  return hasPermission(propertyAccess.role, action);
}
```

---

## 7. MVP Data Model

### Core Entities: Two-Tier Structure

**Note:** Entities are split between company.db (shared) and property-specific databases

#### Tier 1: Company Database Entities (company.db)

```typescript
// ============ Users & Authentication ============

interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  companyRole: 'company_admin' | 'property_manager'
  createdAt: Date
}

// ============ Property Metadata ============

interface PropertyMetadata {
  id: string
  name: string
  address: Address
  wegNumber: string              // Official WEG registration
  accountingYearStart: string    // MM-DD format
  totalUnits: number
  dbPath: string                 // Path to property's database file
  createdAt: Date
  updatedAt: Date
}

interface PropertyAccess {
  userId: string
  propertyId: string
  role: 'viewer' | 'editor' | 'admin'
  grantedAt: Date
}

// ============ Shared Templates ============

interface DocumentTemplate {
  id: string
  name: string
  type: 'jahresabrechnung' | 'letter' | 'notice'
  filePath: string              // Path to .odt template file
  createdAt: Date
}
```

#### Tier 2: Property Database Entities (properties/{id}.db)

**No property_id needed - this database IS the property**

```typescript
// ============ Double-Entry Accounting ============

interface Account {
  id: string
  code: string                   // e.g., "1000", "4000", "6200"
  name: string                   // e.g., "Bank Account", "Hausgeld Einnahmen"
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parentId?: string              // For account hierarchy
  isActive: boolean
  createdAt: Date
}

interface JournalEntry {
  id: string
  date: Date
  description: string
  reference?: string             // Invoice number, receipt ID
  createdBy: string              // User ID (from company.db)
  createdAt: Date
  modifiedAt?: Date
}

interface Posting {
  id: string
  journalEntryId: string
  accountId: string
  debit: string | null           // Decimal as string
  credit: string | null          // Decimal as string
  memo?: string

  // Constraint: exactly one of debit or credit must be set
}

// ============ WEG-Specific Allocations ============

interface CostAllocation {
  id: string
  journalEntryId: string
  allocationType: 'by_share' | 'by_usage' | 'flat' | 'specific_units'
  units: {
    unitNumber: string
    ownershipShare?: number      // Miteigentumsanteil (in Tausendstel)
    usageAmount?: number          // e.g., m³ water used
    allocatedAmount: string       // Calculated cost for this unit
  }[]
  createdAt: Date
}

// ============ Property Contacts & Units ============

interface Contact {
  id: string
  type: 'owner' | 'tenant' | 'service_provider'
  salutation?: 'Herr' | 'Frau' | 'Firma'
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  address?: Address
  unitNumbers?: string[]         // Which units they own/occupy
  ownershipShares?: number       // Total Miteigentumsanteil
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Unit {
  id: string
  unitNumber: string
  ownerId?: string               // Contact ID
  ownershipShares: number        // Miteigentumsanteil (in Tausendstel)
  floor?: number
  sizeSqm?: number
  notes?: string
}

// ============ Jahresabrechnung ============

interface Jahresabrechnung {
  id: string
  year: number
  status: 'draft' | 'final' | 'published'
  periodStart: Date
  periodEnd: Date

  // Calculated summary
  summary: {
    totalIncome: string
    totalExpenses: string
    result: string               // Surplus or deficit
    reservesStart: string
    reservesEnd: string
  }

  // Per-unit allocations (calculated from cost_allocations)
  unitAllocations: {
    unitNumber: string
    ownerId: string
    ownerName: string
    ownershipShare: number

    allocatedCosts: {
      accountCode: string
      accountName: string
      amount: string
      allocationType: 'share' | 'usage' | 'flat'
    }[]

    totalAllocated: string
    advancePayments: string      // Hausgeld paid during year
    balance: string              // Credit or debit
  }[]

  // Generated documents
  odtFilePath?: string           // Source .odt file
  pdfFilePath?: string           // Final .pdf
  generatedAt?: Date

  // Approval
  approvedBy?: string            // User ID
  approvedAt?: Date

  createdAt: Date
}

// ============ Audit Trail ============

interface AuditLogEntry {
  id: string
  tableName: string
  recordId: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  userId: string
  timestamp: Date
}

// ============ Supporting Types ============

interface Address {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  state?: string
  country: 'DE'
}
```

### WEG Chart of Accounts (Double-Entry)

**Standard German WEG accounting structure (SKR 04 adapted):**

```typescript
const WEG_CHART_OF_ACCOUNTS = {
  // Assets (1000-1999)
  assets: {
    '1000': { name: 'Bank Account', type: 'asset' },
    '1100': { name: 'Instandhaltungsrückstellung (Reserves)', type: 'asset' },
    '1200': { name: 'Forderungen Eigentümer (Receivables)', type: 'asset' },
    '1800': { name: 'Sonstige Forderungen', type: 'asset' },
  },

  // Liabilities (2000-2999)
  liabilities: {
    '2000': { name: 'Verbindlichkeiten (Payables)', type: 'liability' },
    '2100': { name: 'Hausgeld-Vorauszahlungen', type: 'liability' },
    '2800': { name: 'Sonstige Verbindlichkeiten', type: 'liability' },
  },

  // Equity (3000-3999)
  equity: {
    '3000': { name: 'Eigenkapital WEG', type: 'equity' },
    '3100': { name: 'Jahresüberschuss/Jahresfehlbetrag', type: 'equity' },
  },

  // Income (4000-4999)
  income: {
    '4000': { name: 'Hausgeld Einnahmen', type: 'income' },
    '4100': { name: 'Sonderumlagen', type: 'income' },
    '4200': { name: 'Zinseinnahmen', type: 'income' },
    '4300': { name: 'Rücklagenentnahme', type: 'income' },
    '4900': { name: 'Sonstige Einnahmen', type: 'income' },
  },

  // Expenses (6000-6999)
  expenses: {
    '6000': { name: 'Instandhaltung und Reparaturen', type: 'expense' },
    '6100': { name: 'Hausmeisterkosten', type: 'expense' },
    '6200': { name: 'Versicherungen', type: 'expense' },
    '6300': { name: 'Grundsteuer', type: 'expense' },
    '6400': { name: 'Energie (Strom, Heizung)', type: 'expense' },
    '6500': { name: 'Wasser/Abwasser', type: 'expense' },
    '6600': { name: 'Müllabfuhr', type: 'expense' },
    '6700': { name: 'Verwaltungskosten', type: 'expense' },
    '6800': { name: 'Zuführung Instandhaltungsrückstellung', type: 'expense' },
    '6900': { name: 'Sonstige Kosten', type: 'expense' },
  },
}

// Example journal entry: Recording maintenance expense
// Debit:  6000 (Instandhaltung) €1,000
// Credit: 1000 (Bank Account)   €1,000
```

---

## 8. Implementation Roadmap (MVP)

### Phase 1: Foundation (Week 1-2)
- [ ] Set up monorepo structure (Turborepo + pnpm)
- [ ] Initialize Nuxt 3 app with Tauri wrapper
- [ ] Configure SQLite databases via Tauri SQL plugin
  - [ ] Company database schema (users, properties metadata, templates)
  - [ ] Property database schema template (accounts, journal_entries, postings)
- [ ] Implement database migrations for both tiers
- [ ] Build multi-database connection management (switch between property DBs)
- [ ] Build authentication (users in company.db)
- [ ] Create property selection/switching UI
- [ ] Implement role-based access control
- [ ] Set up shared packages (types, database, business-logic, utils)

### Phase 2: Double-Entry Accounting (Week 2-3)
- [ ] Initialize WEG chart of accounts in new property databases
- [ ] Build journal entry creation UI (debit/credit interface)
- [ ] Implement posting validation (debits = credits)
- [ ] Create transaction import from CSV/Excel
  - [ ] Map CSV columns to chart of accounts
  - [ ] Generate journal entries from imports
- [ ] Build journal entry list/filter/search UI
- [ ] Implement decimal-precise calculations with decimal.js
- [ ] Create trial balance view (verify books balance)
- [ ] Build account ledger views (per-account transaction history)

### Phase 3: Contact Management (Week 3)
- [ ] Implement contact CRUD
- [ ] Build contact list with search/filter
- [ ] Link contacts to units/ownership shares
- [ ] Create simple contact forms

### Phase 4: Jahresabrechnung Generation (Week 4-5)
- [ ] Build calculation engine for cost allocation (in business-logic package)
- [ ] Implement allocation rules (by share, usage, etc.)
- [ ] Create Jahresabrechnung data structure
- [ ] Design ODF template in LibreOffice Writer
- [ ] Implement ODF template filling (JSZip in Vue)
- [ ] Write Rust commands for file operations (save_file, convert_to_pdf, open_file)
- [ ] Integrate LibreOffice headless conversion
- [ ] Generate .odt preview + final .pdf
- [ ] Add approval workflow

### Phase 5: Compliance & Polish (Week 5-6)
- [ ] Implement GoBD audit trail in SQLite
- [ ] Add modification history tracking with triggers
- [ ] Build GoBD export functionality (JSON, CSV with signatures)
- [ ] Create basic reporting (income/expense overview)
- [ ] Add file attachment support for receipts/invoices
- [ ] Implement desktop installer builds (Windows/macOS/Linux)
- [ ] User testing + bug fixes

### Phase 6: Optional Sync (Week 6+)
- [ ] Set up cloud infrastructure (PostgreSQL + sync server)
- [ ] Implement sync protocol (Electric SQL or custom)
- [ ] Test multi-device sync
- [ ] Add conflict resolution UI
- [ ] Deploy to production

### Key Decision Points
- **After Week 2**: Validate local-first architecture with test users
- **After Week 4**: Validate Jahresabrechnung calculation logic with German accountant
- **After Week 5**: Decide if cloud sync is needed for MVP or post-MVP

---

## 9. FOSS Integration Strategy

### Approach: Build Custom Core, Integrate Later

#### MVP (Custom Implementation)
- **Accounting**: Build simple transaction management custom
  - Why: WEG accounting is specialized, existing tools overcomplicated
  - Future: Could integrate Odoo Accounting module if needed

- **CRM**: Build minimal contact management
  - Why: Only need basic contact storage for Jahresabrechnung
  - Future: Could integrate ERPNext CRM or SuiteCRM if relationships get complex

- **PDF Generation**: Use open-source library (@pdfme or pdf-lib)
  - Why: Full control over German document formatting

#### Architecture for Future Integration

```
┌─────────────────────────────────────────────┐
│          Your Application Core              │
│  ┌───────────────────────────────────────┐  │
│  │   Domain Layer (WEG Business Logic)   │  │
│  │   - Jahresabrechnung calculation      │  │
│  │   - Cost allocation rules             │  │
│  │   - GoBD compliance                   │  │
│  └──────────────┬────────────────────────┘  │
│                 │                            │
│  ┌──────────────▼────────────────────────┐  │
│  │   Adapter Layer (Interface)           │  │
│  │   - IAccountingProvider               │  │
│  │   - IContactProvider                  │  │
│  │   - IDocumentGenerator                │  │
│  └──────────────┬────────────────────────┘  │
│                 │                            │
│  ┌──────────────▼────────────────────────┐  │
│  │   Implementation (Swappable)          │  │
│  │   - Custom DB │ Odoo API │ ERPNext    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Benefits:**
- Keep domain logic separate from data source
- Easy to swap data providers later
- Can run standalone or integrate with ERP

---

## 10. Key Technical Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Deployment** | Tauri desktop + optional PWA | ODF → PDF requires desktop; PWA for mobile viewing |
| **Frontend** | Nuxt 3 (Vue recommended) | Great DX, reactive, works in Tauri and PWA |
| **Backend** | Rust (via Tauri) | File I/O, LibreOffice integration, native performance |
| **Code Split** | 85% Vue/TS, 15% Rust | Business logic in Vue; only file ops in Rust |
| **Database Architecture** | Separate SQLite per property | True accounting separation, matches legal structure |
| **Database Tiers** | company.db + properties/{id}.db | Company data shared; property books isolated |
| **Accounting System** | Double-entry bookkeeping | Professional standard, data consistency, GoBD compliance |
| **Sync** | PostgreSQL schemas per property | Maintains separation in cloud (optional) |
| **Documents** | ODF templates + LibreOffice | ISO standard, editable, visual template design |
| **Multi-tenancy** | Property = tenant boundary | Each WEG property is separate entity with own books |
| **Roles** | 2 company + 3 property roles | Sufficient flexibility without complexity |
| **FOSS Strategy** | Build core, integrate later | Fast MVP, future flexibility |
| **Monorepo** | Turborepo + pnpm | Simple setup, fast builds, type-safe packages |

---

## 11. Monorepo Setup & Workflow

### Why Monorepo for This Project

Even for an MVP that starts as just a PWA, a monorepo provides:
- **Shared types** across frontend (and eventually backend)
- **Business logic extraction** (Jahresabrechnung calculations can be tested independently)
- **Database schema reuse** (same schemas for local and cloud databases)
- **Atomic changes** (update type definition + all usage in one commit)
- **Easy backend addition** (when cloud sync is needed, backend uses same types/logic)

### Recommended Structure

```
weg-manager/
├── apps/
│   ├── web/                    # Nuxt 3 PWA
│   ├── desktop/                # Optional: Tauri wrapper
│   └── api/                    # Optional: Backend API
│
├── packages/
│   ├── types/                  # TypeScript interfaces
│   ├── database/               # Dexie/RxDB schemas
│   ├── business-logic/         # WEG calculations
│   ├── pdf-generator/          # Jahresabrechnung PDFs
│   └── utils/                  # Shared utilities
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Tool Choice: Turborepo + pnpm

**Turborepo** provides:
- Intelligent caching (rebuild only changed packages)
- Parallel execution (fast builds)
- Simple configuration (unlike Nx)

**pnpm** provides:
- Workspace support (link local packages)
- Fast installs
- Strict dependency management

### Migration Path

You don't need all packages from day 1:

1. **Week 1**: Single app (everything in `apps/web`)
2. **Week 2**: Extract `packages/types` (share interfaces)
3. **Week 3**: Extract `packages/database` (schemas)
4. **Week 4**: Extract `packages/business-logic` (calculations)
5. **Later**: Add `apps/api` when cloud sync needed

### Key Workflows

**Development:**
```bash
pnpm dev          # Start all apps
pnpm build        # Build everything (with caching)
pnpm type-check   # Check types across all packages
```

**Using shared packages:**
```typescript
// In apps/web
import type { Property } from '@weg-manager/types'
import { calculateJahresabrechnung } from '@weg-manager/business-logic'
```

**Adding new package:**
- Create in `packages/new-package`
- Reference with `@weg-manager/new-package@workspace:*`
- Turborepo handles build order automatically

### Benefits for Your Timeline

- **Week 1-2**: Start simple (just web app)
- **Week 3+**: Extract packages as code stabilizes
- **Future**: Add backend without duplicating logic
- **Always**: Type safety across entire codebase

---

## 12. Next Steps

1. **Validate assumptions**: Review this with a German property manager and/or WEG accountant
2. **Set up project**: Initialize monorepo (Turborepo + pnpm), create Nuxt 3 app with Tauri wrapper
3. **Install dependencies**: LibreOffice (for ODF → PDF conversion), configure Tauri
4. **Build data model**: Implement TypeScript schemas and SQLite database schema
5. **Create ODF template**: Design Jahresabrechnung template in LibreOffice Writer
6. **Start with core features**: Focus on accounting transactions and calculations first
7. **Iterate on document generation**: Get ODF filling and PDF conversion working early

### Questions to Clarify

1. Do you have example Jahresabrechnung documents I can use as templates?
2. What accounting software do property managers currently use (for import compatibility)?
3. Is there an existing CSV/Excel format you need to support for transaction import?
4. Do you need support for multiple accounting years simultaneously, or one at a time?
5. Should the app support multiple companies on one installation (for freelance property managers)?

---

**Document Status:** Living document - will be updated as architecture decisions evolve.
