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
  - **Nuxt 3 (Vue)**: Excellent DX, Vue's reactivity great for local-first, growing ecosystem
  - **SvelteKit**: Lightest runtime, minimal boilerplate, great for local-first
  - **Next.js (React)**: Largest ecosystem, most developers available, mature tooling

- **UI Library:**
  - Vue: Nuxt UI, PrimeVue, or Headless UI
  - React: shadcn/ui, Radix UI
  - Svelte: shadcn-svelte, Skeleton

- **Forms:**
  - Vue: VeeValidate or FormKit with Zod
  - React: React Hook Form with Zod
  - Svelte: SvelteKit Forms with Zod

- **State Management:**
  - Vue: Pinia + VueUse (includes useQuery/useMutation)
  - React: TanStack Query + Zustand/Jotai
  - Svelte: Svelte stores (built-in)

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

## 4. Data Layer Architecture (Offline-First Sync)

### Sync Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    User's Device                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Application Layer (SvelteKit/React)             │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────▼─────────────────────────────────────┐   │
│  │  Sync Middleware (Conflict Resolution)           │   │
│  │  - Last-write-wins for most data                 │   │
│  │  - Manual resolution for critical conflicts      │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────▼─────────────────────────────────────┐   │
│  │  Local Database (RxDB/SQLite)                    │   │
│  │  - Full schema with all properties               │   │
│  │  - Sync metadata (version vectors, timestamps)   │   │
│  │  - Offline queue for pending changes             │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
└───────────────┼─────────────────────────────────────────┘
                │ HTTPS/WebSocket
                │ (when online + sync enabled)
                │
┌───────────────▼─────────────────────────────────────────┐
│              Cloud Sync Server (Optional)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Sync API (Electric SQL / PowerSync / Custom)    │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────▼─────────────────────────────────────┐   │
│  │  PostgreSQL with Row-Level Security              │   │
│  │  - Company isolation                             │   │
│  │  - Property (Mandant) isolation                  │   │
│  │  - Audit log for GoBD                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Sync Mechanics

1. **Hybrid Logical Clocks (HLC)** for causality tracking
2. **Change log table** for each synced entity
3. **Subscription-based sync**: User subscribes to properties they have access to
4. **Incremental sync**: Only changed records since last sync
5. **Conflict resolution**:
   - Accounting transactions: Last-write-wins with manual review flag
   - Contacts: Merge fields with user notification
   - Jahresabrechnung drafts: Version-based (auto-save all versions)

### Offline Queue
- All writes go to local DB immediately
- Background sync when online
- Optimistic UI updates
- Retry failed syncs with exponential backoff

---

## 5. Multi-Tenant (Mandant) Architecture

### Database Design

```sql
-- Company level (management company)
companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB, -- includes offline_write_enabled flag
  created_at TIMESTAMPTZ
)

-- Property level (Mandant = each WEG property)
properties (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  address JSONB,
  weg_number TEXT, -- Official WEG registration number
  accounting_year_start DATE, -- Can differ per property
  settings JSONB,
  created_at TIMESTAMPTZ
)

-- User access
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  company_id UUID REFERENCES companies(id),
  role company_role, -- ENUM: 'admin', 'manager'
  created_at TIMESTAMPTZ
)

-- Property access (many-to-many)
property_access (
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  role property_role, -- ENUM: 'viewer', 'editor', 'admin'
  PRIMARY KEY (user_id, property_id)
)
```

### Isolation Strategy
- **Company level**: All data belongs to one company (SaaS tenant)
- **Property level**: Each property (Mandant) has separate accounting books
- **Row-Level Security (RLS)**: Enforce access in database queries
- **Local storage**: Filter synced data by user's property access

### Multi-Tenancy Pattern
```
Company A
  ├── Property 1 (Musterstraße 10)
  │   ├── Accounting Book 2024
  │   ├── Contacts (owners, tenants)
  │   └── Jahresabrechnung 2024
  ├── Property 2 (Hauptstraße 5)
  │   └── ...
  └── Users (property managers)
      ├── User 1 (admin) → access to all properties
      └── User 2 (manager) → access to Property 1 only
```

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

### Core Entities

```typescript
// ============ Company & Properties ============

interface Company {
  id: string;
  name: string;
  settings: {
    offlineWriteEnabled: boolean;
    defaultAccountingYearStart: string; // MM-DD format
    currency: 'EUR';
  };
  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

interface Property {
  id: string;
  companyId: string;
  name: string;
  wegNumber: string; // Official registration
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    state: string;
  };
  accountingYearStart: string; // MM-DD, overrides company default
  totalUnits: number; // Total Wohnungseinheiten
  settings: {
    defaultCurrency: 'EUR';
    taxRate: number; // VAT if applicable
  };
  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

// ============ Contacts (CRM) ============

interface Contact {
  id: string;
  propertyId: string;
  type: 'owner' | 'tenant' | 'service_provider' | 'other';

  // Personal/Company Info
  salutation?: 'Herr' | 'Frau' | 'Firma';
  firstName?: string;
  lastName?: string;
  companyName?: string;

  // Contact Details
  email?: string;
  phone?: string;
  mobile?: string;

  // Address (can differ from property)
  address?: Address;

  // WEG-specific
  unitNumbers?: string[]; // Which units they own/inhabit
  ownershipShares?: number; // Miteigentumsanteil (in Tausendstel)

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

// ============ Accounting ============

interface AccountingPeriod {
  id: string;
  propertyId: string;
  year: number; // e.g., 2024
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

interface AccountingTransaction {
  id: string;
  propertyId: string;
  periodId: string;

  // Transaction details
  transactionDate: Date;
  valueDate?: Date;
  amount: string; // Use string for decimal precision (GoBD requirement)
  currency: 'EUR';
  type: 'income' | 'expense';

  // Categorization (simplified chart of accounts)
  accountCode: string; // e.g., "4000" for Hausgeld
  accountName: string; // e.g., "Hausgeld Einnahmen"
  category: TransactionCategory;

  // Details
  description: string;
  reference?: string; // Invoice/receipt number
  counterparty?: string; // Who paid/was paid
  paymentMethod?: 'bank_transfer' | 'cash' | 'direct_debit' | 'other';

  // Cost allocation (for Umlageschlüssel)
  allocationType: 'all_units' | 'by_share' | 'by_usage' | 'specific_units';
  allocatedUnits?: string[]; // If specific units

  // Attachments
  attachments?: {
    id: string;
    filename: string;
    fileUrl: string; // Local file path or cloud URL
    mimeType: string;
  }[];

  // Audit trail (GoBD)
  importedAt?: Date;
  importSource?: string;
  modifiedBy?: string;
  modificationHistory?: ModificationEntry[];

  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

type TransactionCategory =
  | 'hausgeld' // Monthly owner contributions
  | 'maintenance_repair'
  | 'utilities' // Nebenkosten
  | 'insurance'
  | 'property_tax'
  | 'management_fees'
  | 'reserves' // Instandhaltungsrückstellung
  | 'other';

// ============ Jahresabrechnung ============

interface Jahresabrechnung {
  id: string;
  propertyId: string;
  periodId: string;

  year: number;
  status: 'draft' | 'final' | 'published';

  // Summary data (calculated)
  summary: {
    totalIncome: string;
    totalExpenses: string;
    result: string; // Surplus or deficit
    reservesStart: string;
    reservesEnd: string;
  };

  // Per-unit breakdown
  unitAllocations: {
    unitNumber: string;
    ownerId: string; // Contact ID
    ownerName: string;
    ownershipShare: number; // Miteigentumsanteil

    allocatedCosts: {
      category: TransactionCategory;
      amount: string;
      basis: 'share' | 'usage' | 'flat';
    }[];

    totalAllocated: string;
    advancePayments: string; // Vorauszahlungen
    balance: string; // Credit or debit
  }[];

  // Generated documents
  pdfUrl?: string;
  generatedAt?: Date;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  _syncMetadata: SyncMetadata;
}

// ============ Supporting Types ============

interface SyncMetadata {
  version: number; // Vector clock or version number
  lastSyncedAt?: Date;
  isDeleted: boolean;
  deviceId: string; // Which device made the change
  userId: string;
}

interface ModificationEntry {
  timestamp: Date;
  userId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  state?: string;
  country: 'DE';
}
```

### Simplified Chart of Accounts (German WEG)

```typescript
const WEG_ACCOUNT_PLAN = {
  income: {
    '4000': 'Hausgeld Einnahmen',
    '4100': 'Sonderumlagen',
    '4200': 'Zinseinnahmen',
    '4900': 'Sonstige Einnahmen',
  },
  expenses: {
    '6000': 'Instandhaltung und Reparaturen',
    '6100': 'Hausmeisterkosten',
    '6200': 'Versicherungen',
    '6300': 'Grundsteuer',
    '6400': 'Energie (Strom, Heizung)',
    '6500': 'Wasser/Abwasser',
    '6600': 'Müllabfuhr',
    '6700': 'Verwaltungskosten',
    '6800': 'Zuführung Instandhaltungsrückstellung',
    '6900': 'Sonstige Kosten',
  },
};
```

---

## 8. Implementation Roadmap (MVP)

### Phase 1: Foundation (Week 1-2)
- [ ] Set up monorepo structure (Turborepo + pnpm)
- [ ] Initialize Nuxt 3 app with Tauri wrapper
- [ ] Configure SQLite database via Tauri SQL plugin
- [ ] Implement database schema and migrations
- [ ] Build authentication (local accounts stored in SQLite)
- [ ] Create company + property management UI
- [ ] Implement role-based access control
- [ ] Set up shared packages (types, utils)

### Phase 2: Core Accounting (Week 2-3)
- [ ] Build transaction import (CSV/Excel)
- [ ] Create transaction list/filter/search UI
- [ ] Implement transaction CRUD with validation
- [ ] Add basic cost categorization
- [ ] Build decimal-precise calculation utilities
- [ ] Create accounting period management

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
│                 │                           │
│  ┌──────────────▼────────────────────────┐  │
│  │   Adapter Layer (Interface)           │  │
│  │   - IAccountingProvider               │  │
│  │   - IContactProvider                  │  │
│  │   - IDocumentGenerator                │  │
│  └──────────────┬────────────────────────┘  │
│                 │                           │
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
| **Local DB** | SQLite (via Tauri plugin) | Native performance, full SQL, proven reliability |
| **Sync** | Electric SQL (when needed) | SQLite replication, optional for MVP |
| **Documents** | ODF templates + LibreOffice | ISO standard, editable, visual template design |
| **Multi-tenancy** | Company → Property hierarchy | Matches business model, clear isolation |
| **Roles** | 2 company + 3 property roles | Sufficient flexibility without complexity |
| **Accounting** | Custom with decimal.js | GoBD precision, WEG-specific rules |
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
