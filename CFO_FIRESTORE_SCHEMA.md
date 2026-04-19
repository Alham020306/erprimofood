# CFO Firestore Schema - DUAL DATABASE ARCHITECTURE

## Overview
CFO menggunakan **dua database** yang terintegrasi:

### **1. Default Database (Main Operations)**
Koleksi real-time dari operasional:
```
operational_ledger/{id}     ← Cash transactions (real data)
orders/{id}                 ← Order data
restaurants/{id}            ← Merchant data
users/{id}                  ← Driver/user data
```

### **2. Direksi Database (C-Level Planning)**
Koleksi planning & summary:
```
cfo_daily_financial_summary/{date}  ← Daily aggregated data
cfo_cash_transactions/{id}          ← Manual CFO entries
cfo_sheets/{id}                     ← Spreadsheets
cfo_fund_requests/{id}              ← Fund approvals
cfo_recruitment_requests/{id}     ← HR requests
```

---

## 1. cfo_daily_financial_summary (Daily Sync)
Path: `direksi/cfo_daily_financial_summary/{date}`

```javascript
{
  // Document ID: YYYY-MM-DD (e.g., "2026-04-19")
  date: "2026-04-19",
  timestamp: 1713542400000,
  
  // Revenue
  grossRevenue: 150000000,        // Total order value (COMPLETED)
  netRevenue: 135000000,        // After refunds/cancellations
  platformCommission: 15000000,  // 10% dari gross
  
  // Income Statement Components
  operatingRevenue: {
    orderRevenue: 135000000,
    commissionIncome: 15000000,
    otherIncome: 500000,
    total: 150500000
  },
  
  costOfRevenue: {
    driverIncentives: 25000000,
    restaurantPromotions: 15000000,
    paymentGatewayFees: 5000000,
    total: 45000000
  },
  
  grossProfit: 105500000,  // operatingRevenue.total - costOfRevenue.total
  
  operatingExpenses: {
    marketing: 10000000,
    salaries: 35000000,
    technology: 8000000,
    office: 5000000,
    other: 3000000,
    total: 61000000
  },
  
  operatingIncome: 44500000,  // grossProfit - operatingExpenses.total
  
  otherIncomeExpenses: {
    interestIncome: 500000,
    interestExpense: -2000000,
    total: -1500000
  },
  
  netIncomeBeforeTax: 43000000,
  tax: 8600000,  // 20%
  netIncome: 34400000,  // Final bottom line
  
  // Entity Balances
  partnerBalances: {
    totalRestaurantBalance: 85000000,
    totalDriverBalance: 45000000,
    totalUnpaidCommission: 25000000,
    atRiskBalance: 5000000
  },
  
  // Key Metrics
  metrics: {
    orderCount: 1250,
    completedOrders: 1180,
    cancelledOrders: 70,
    averageOrderValue: 120000,
    activeMerchants: 145,
    activeDrivers: 89,
    newCustomers: 45,
    repeatCustomers: 320
  },
  
  // Alerts & Flags
  alerts: [
    "Revenue turun 5% dari hari sebelumnya",
    "3 merchant dengan balance > 10jt belum settlement"
  ],
  
  // Status
  status: "CLOSED",  // OPEN, CLOSED, PENDING_REVIEW
  syncedAt: 1713542400000,
  syncedBy: "system",
  
  // Daily trends (for 7-day chart)
  trends: [
    { date: "2026-04-13", grossRevenue: 140000000, netRevenue: 126000000, netIncome: 32000000 },
    { date: "2026-04-14", grossRevenue: 145000000, netRevenue: 130500000, netIncome: 33500000 },
    // ... 7 days
  ]
}
```

## 2. cfo_monthly_reports
Path: `direksi/cfo_monthly_reports/{YYYY-MM}`

```javascript
{
  month: "2026-04",
  year: 2026,
  
  // Aggregated from daily summaries
  incomeStatement: { /* same structure as daily, but monthly totals */ },
  
  balanceSheet: {
    assets: {
      currentAssets: {
        cash: 250000000,
        receivables: 150000000,  // dari merchant/driver
        prepaidExpenses: 25000000,
        total: 425000000
      },
      fixedAssets: {
        equipment: 50000000,
        software: 30000000,
        total: 80000000
      },
      totalAssets: 505000000
    },
    
    liabilities: {
      currentLiabilities: {
        payables: 120000000,  // hutang ke merchant/driver
        accruedExpenses: 40000000,
        total: 160000000
      },
      longTermLiabilities: {
        loans: 0,
        total: 0
      },
      totalLiabilities: 160000000
    },
    
    equity: {
      retainedEarnings: 345000000,
      currentMonthEarnings: 0,  // akan diupdate
      totalEquity: 345000000
    },
    
    totalLiabilitiesAndEquity: 505000000  // Must equal totalAssets
  },
  
  // Cash Flow Statement
  cashFlow: {
    operating: 85000000,
    investing: -20000000,
    financing: 0,
    netChange: 65000000,
    beginningCash: 185000000,
    endingCash: 250000000
  },
  
  // Ratios
  ratios: {
    grossMargin: 70.1,  // %
    operatingMargin: 29.6,
    netMargin: 22.9,
    currentRatio: 2.66,
    debtToEquity: 0.46
  }
}
```

## 3. cfo_fund_requests (Approval System Integration)
Path: `direksi/cfo_fund_requests/{requestId}`

```javascript
{
  requestId: "FR-20260419-001",
  requestDate: 1713542400000,
  requestedBy: {
    uid: "coo-user-id",
    name: "John Doe",
    role: "COO",
    department: "Operations"
  },
  
  purpose: "Marketing Campaign Q2",
  description: "Budget untuk campaign marketing bulan April",
  
  amount: 25000000,
  currency: "IDR",
  
  category: "MARKETING",
  urgency: "HIGH",  // LOW, MEDIUM, HIGH, CRITICAL
  
  // Approval workflow
  status: "PENDING",  // PENDING, APPROVED, REJECTED, CANCELLED
  approvals: [
    {
      level: 1,
      role: "CFO",
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
      notes: null
    },
    {
      level: 2,
      role: "CEO",
      status: "PENDING",
      condition: "IF_AMOUNT_OVER_50M"  // Only if > 50M
    }
  ],
  
  // Linked to operational_ledger after approval
  ledgerEntryId: null,  // filled when processed
  
  createdAt: 1713542400000,
  updatedAt: 1713542400000
}
```

## 4. cfo_recruitment_requests (To HR)
Path: `direksi/cfo_recruitment_requests/{requestId}`

```javascript
{
  requestId: "RR-20260419-001",
  requestDate: 1713542400000,
  
  requestedBy: {
    uid: "cfo-user-id",
    name: "Jane Smith",
    role: "CFO",
    department: "Finance"
  },
  
  // Position details
  position: "Financial Analyst",
  department: "Finance",
  level: "STAFF",  // STAFF, MANAGER, DIRECTOR
  employmentType: "FULLTIME",  // FULLTIME, CONTRACT, INTERN
  
  // Requirements
  requirements: {
    skills: ["Excel", "Financial Modeling", "SQL"],
    experience: "2-3 years",
    education: "S1 Accounting/Finance",
    budget: 8000000  // monthly salary budget
  },
  
  justification: "Need additional analyst untuk handle increased reporting",
  replacementFor: null,  // or employee ID if replacement
  
  // Timeline
  neededBy: 1716144000000,  // when needed
  priority: "HIGH",
  
  // Status
  status: "PENDING_HR",  // PENDING_HR, IN_REVIEW, APPROVED, REJECTED, FILLED
  hrNotes: "",
  
  // HR Response
  hrResponse: {
    approved: null,
    approvedBy: null,
    approvedAt: null,
    notes: "",
    candidateSelected: null,
    startedAt: null
  },
  
  createdAt: 1713542400000,
  updatedAt: 1713542400000
}
```

## 5. cfo_cash_transactions (Cash In/Out)
Path: `direksi/cfo_cash_transactions/{transactionId}`

```javascript
{
  transactionId: "CT-20260419-001",
  date: "2026-04-19",
  timestamp: 1713542400000,
  
  type: "IN",  // IN, OUT
  category: "INVESTMENT",  // OPERATIONAL, INVESTMENT, FINANCING
  
  amount: 50000000,
  currency: "IDR",
  
  description: "Penerimaan investasi putaran A",
  reference: "BANK-TRX-123456",
  
  // Related entity
  relatedTo: {
    type: "INVESTOR",  // MERCHANT, DRIVER, INVESTOR, VENDOR, etc
    id: "investor-id",
    name: "VC Fund Name"
  },
  
  // For OUT transactions
  expenseDetails: {
    receiptUrl: "gs://bucket/receipt.jpg",
    approvedBy: "ceo-user-id",
    budgetCategory: "CAPITAL_EXPENDITURE"
  },
  
  // Status
  status: "COMPLETED",  // PENDING, COMPLETED, CANCELLED
  
  // Sync to operational_ledger
  syncedToLedger: true,
  ledgerEntryId: "ledger-doc-id",
  
  createdBy: "cfo-user-id",
  createdAt: 1713542400000
}
```

## 6. cfo_budgets (Budget Management)
Path: `direksi/cfo_budgets/{budgetId}`

```javascript
{
  budgetId: "BG-2026-Q2",
  name: "Q2 2026 Operational Budget",
  period: {
    start: "2026-04-01",
    end: "2026-06-30",
    year: 2026,
    quarter: 2
  },
  
  allocations: [
    {
      category: "MARKETING",
      allocated: 100000000,
      spent: 35000000,
      remaining: 65000000,
      owner: "cmo-user-id"
    },
    {
      category: "SALARIES",
      allocated: 300000000,
      spent: 100000000,
      remaining: 200000000,
      owner: "hr-user-id"
    },
    {
      category: "TECHNOLOGY",
      allocated: 50000000,
      spent: 15000000,
      remaining: 35000000,
      owner: "cto-user-id"
    },
    {
      category: "OPERATIONS",
      allocated: 80000000,
      spent: 40000000,
      remaining: 40000000,
      owner: "coo-user-id"
    }
  ],
  
  totalAllocated: 530000000,
  totalSpent: 190000000,
  totalRemaining: 340000000,
  
  status: "ACTIVE",  // DRAFT, ACTIVE, CLOSED
  createdAt: 1713542400000
}
```

## Summary Sheet untuk Firestore

| Collection | Document ID Pattern | Fields Utama |
|------------|---------------------|--------------|
| `cfo_daily_financial_summary` | `YYYY-MM-DD` | grossRevenue, netRevenue, netIncome, operatingExpenses, partnerBalances, metrics, trends |
| `cfo_monthly_reports` | `YYYY-MM` | incomeStatement, balanceSheet, cashFlow, ratios |
| `cfo_fund_requests` | Auto-ID | requester, amount, purpose, status, approvals |
| `cfo_recruitment_requests` | Auto-ID | position, department, requirements, status |
| `cfo_cash_transactions` | `CT-{date}-{seq}` | type, amount, category, description, status |
| `cfo_budgets` | `BG-{year}-{Q}` | period, allocations, owners |

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "cfo_daily_financial_summary",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "cfo_fund_requests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "requestDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "cfo_cash_transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 7. operational_ledger (Default Database - Real Transactions)
Path: `default/operational_ledger/{id}`

**Collection ini ADA DI DEFAULT DATABASE** (bukan direksi)

```javascript
{
  // Example dari data real yang sudah ada di database
  id: "auto-generated",
  amount: 10000000,              // int64 - nominal transaksi
  category: "Operasional",      // string - kategori
  date: "2026-04-09",           // string - YYYY-MM-DD
  description: "",              // string - deskripsi (optional)
  title: "Uang Operasional",    // string - judul transaksi
  processedBy: "CFO Office",    // string - siapa yang memproses
  timestamp: 1775751602475,     // int64 - Unix timestamp
  type: "IN"                    // string - "IN" atau "OUT"
}
```

### Relasi dengan CFO Collections:
```
┌─────────────────────────────────────────────────────────────┐
│                    DEFAULT DATABASE                         │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │ operational_ledger│   │ orders                      │  │
│  │ (Real cash flow)  │   │ (Real revenue)              │  │
│  └────────┬─────────┘    └──────────────┬───────────────┘  │
└───────────┼─────────────────────────────┼─────────────────┘
            │                             │
            │  Real-time Sync (CTO/System)│
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DIREKSI DATABASE                         │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │ cfo_daily_financial_│  │ cfo_cash_transactions       │ │
│  │    _summary          │  │ (Manual CFO entries)        │ │
│  │  (Aggregated daily) │  └────────────┬────────────────┘ │
│  └──────────────────────┘               │                  │
│                                         │ Optional sync  │
│                                         ▼                │
│                              to operational_ledger       │
└────────────────────────────────────────────────────────────┘
```

---

## Dual Database Architecture Explanation

### **Default Database (operational_ledger)**
- **Tujuan**: Real-time transactions dari operasional
- **Data**: Cash in/out yang benar-benar terjadi di lapangan
- **Akses**: Semua roles (COO, CFO, CTO, etc.) bisa read
- **Contoh data**: 
  - Order completion → Cash in
  - Driver payment → Cash out
  - Restaurant settlement → Cash out

### **Direksi Database (cfo_cash_transactions)**
- **Tujuan**: Manual entry & planning oleh CFO
- **Data**: Transaksi yang dicatat manual oleh CFO untuk:
  - Adjustments
  - Forecast/planning
  - Corrections
- **Akses**: Hanya C-Level (CFO, CEO, etc.)
- **Contoh data**:
  - Manual adjustment
  - Budget allocation
  - Investment planning

### **Unified View (useCFOUnifiedCashFlow)**
Hook `useCFOUnifiedCashFlow` menggabungkan data dari **kedua database**:

```typescript
const { 
  transactions,        // Combined: manual + operational
  manualTransactions,  // Only from direksi
  operationalLedger,   // Only from default
  sourceBreakdown      // Stats: { manual, operational }
} = useCFOUnifiedCashFlow(date);
```

**UI menampilkan**:
- Badge "Operational" (blue) untuk data dari default database
- Badge "Manual" (purple) untuk data dari direksi database
- Breakdown jumlah per source di summary cards

---

## Summary Collections (All in Direksi Database)

| Collection | Document ID Pattern | Fields Utama |
|------------|---------------------|--------------|
| `cfo_daily_financial_summary` | `YYYY-MM-DD` | grossRevenue, netRevenue, netIncome, operatingExpenses, partnerBalances, metrics, trends |
| `cfo_monthly_reports` | `YYYY-MM` | incomeStatement, balanceSheet, cashFlow, ratios |
| `cfo_fund_requests` | Auto-ID | requester, amount, purpose, status, approvals |
| `cfo_recruitment_requests` | Auto-ID | position, department, requirements, status |
| `cfo_cash_transactions` | `CT-{date}-{seq}` | type, amount, category, description, status |
| `cfo_budgets` | `BG-{year}-{Q}` | period, allocations, owners |
| `cfo_sheets` | Auto-ID | name, category, headers, rows |

## Default Database Collections (Referenced by CFO)

| Collection | Purpose | CFO Access |
|------------|---------|------------|
| `operational_ledger` | Real cash transactions | Read-only (via hook) |
| `orders` | Order data for revenue | Read-only (via hook) |
| `restaurants` | Merchant info | Read-only |
| `users` | Driver/customer data | Read-only |

---

## Settlement Management (CFOSettlementsPageV2)

Sistem settlement untuk mengelola komisi yang belum dibayar ke restaurant dan driver.

### Commission Configuration
```typescript
const COMMISSION_RATES = {
  RESTAURANT: 0.20,  // 20% dari restaurant earnings
  DRIVER: 0.15,      // 15% dari driver earnings
};
```

### Order Fields for Settlement Tracking

**Path**: `default/orders/{orderId}`

```javascript
{
  // Order identification
  id: "order_abc123",
  restaurantId: "resto_xyz",
  driverId: "driver_123",
  status: "COMPLETED",
  
  // Financial data
  total: 150000,
  deliveryFee: 15000,
  
  // Settlement tracking fields
  restoCommissionPaid: false,        // Boolean: sudah dibayar?
  restoCommissionPaidAt: null,       // Timestamp pembayaran
  driverCommissionPaid: false,       // Boolean: sudah dibayar?
  driverCommissionPaidAt: null,      // Timestamp pembayaran
  
  // Earnings calculation (optional, can be calculated)
  restoEarnings: 120000,             // 80% dari item total
  driverEarnings: 12750,             // 85% dari delivery fee
  
  // Timestamps
  timestamp: 1713542400000,
  createdAt: Timestamp,
  completedAt: Timestamp,
}
```

### Restaurant/Driver Fields for Settlement

**Path**: `default/restaurants/{id}` atau `default/users/{driverId}`

```javascript
{
  // Basic info
  id: "resto_xyz",
  name: "Warung Makan Sederhana",
  
  // Settlement tracking (optional summary fields)
  totalUnpaidCommission: 5000000,     // Total belum dibayar
  totalPaidCommission: 15000000,    // Total sudah dibayar
  isBanned: false,                   // Status banned jika nunggak
  
  // Timestamps
  lastSettlementAt: Timestamp,
}
```

### Settlement Calculation Logic

**Restaurant Commission**:
```typescript
const itemsTotal = order.total - order.deliveryFee;
const restoEarnings = order.restoEarnings || itemsTotal * 0.8;  // 80% untuk resto
const commission = itemsTotal - restoEarnings;                   // 20% untuk platform
```

**Driver Commission**:
```typescript
const driverEarnings = order.driverEarnings || order.deliveryFee * 0.85;  // 85% untuk driver
const commission = order.deliveryFee - driverEarnings;                    // 15% untuk platform
```

### Settlement Flow

1. **Order Completed** → Sistem menghitung komisi otomatis
2. **CFO Review** → Lihat daftar komisi yang belum dibayar
3. **Tombol Bayar** → Tandai semua order entity sebagai lunas
4. **Batch Update** → Update field `restoCommissionPaid` / `driverCommissionPaid`

### Settlement Entity Summary (Frontend)

```typescript
interface EntitySummary {
  entityId: string;
  entityName: string;
  totalUnpaid: number;        // Total komisi belum dibayar
  totalPaid: number;          // Total komisi sudah dibayar
  unpaidCount: number;        // Jumlah order belum dibayar
  paidCount: number;          // Jumlah order sudah dibayar
  oldestUnpaidDate?: number;  // Timestamp order tertua yang belum bayar
  isBanned: boolean;
  orders: Order[];            // List order untuk detail view
}
```

### Settlement Summary (Global)

```typescript
interface SettlementSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalCommission: number;
  restaurantUnpaid: number;
  restaurantPaid: number;
  driverUnpaid: number;
  driverPaid: number;
}
```

### UI Components

1. **SettlementSummaryCardsV2**: 3 cards (Belum Dibayar, Terbayar, Total)
2. **SettlementsTableV2**: Tabel dengan kolom Belum Bayar/Terbayar/Status/Aksi
3. **SettlementDetailModal**: Detail order per entity
4. **SettlementConfirmModal**: Konfirmasi sebelum tandai lunas

### Export Format (JSON)

```json
{
  "exportedAt": "2026-04-20T12:00:00Z",
  "exportedBy": "CFO Director",
  "summary": {
    "totalUnpaid": 15000000,
    "totalPaid": 45000000,
    "totalCommission": 60000000
  },
  "commissionRates": {
    "RESTAURANT": 0.20,
    "DRIVER": 0.15
  },
  "restaurants": [...],
  "drivers": [...]
}
```
