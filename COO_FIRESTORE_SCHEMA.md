# COO Firestore Schema - Operations Dashboard

## Overview
COO Dashboard menggunakan **dual database architecture** seperti CFO:
- **Main Database (Default)**: Real-time operational data (read-only untuk COO)
- **Direksi Database (C-Level)**: COO-specific data (attendance, recruitment requests)

## Data Flow
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Main Database  │────▶│  CTO Sync    │────▶│ Direksi Summary │
│  (orders, etc)  │     │  (periodic)  │     │ (coo_summary)   │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                            │
         │                                            │
         ▼                                            ▼
┌─────────────────┐                         ┌─────────────────┐
│  COO Dashboard  │                         │  COO Attendance │
│  (read-only)    │                         │  (write access) │
└─────────────────┘                         └─────────────────┘
```

## Collections

### 1. coo_attendance (Direksi DB)
Path: `direksi/coo_attendance/{id}`

Absensi untuk C-Level staff (COO, CEO, CFO, etc).

```javascript
{
  id: "CA-20260420-001",
  userId: "director_uid",
  userName: "John Doe",
  userRole: "COO",
  
  // Date
  date: "2026-04-20",  // YYYY-MM-DD
  
  // Status
  status: "PRESENT",   // PRESENT | LATE | ABSENT | ON_LEAVE | WFH
  
  // Timestamps
  checkIn: Timestamp,    // Waktu check-in
  checkOut: Timestamp,   // Waktu check-out (null jika belum)
  
  // Metadata
  notes: "Working from home today",
  location: "Office A",  // GPS atau lokasi manual
  
  // Request fields (untuk cuti/WFH)
  isRequest: false,      // true jika pengajuan izin
  approved: true,        // approval status untuk izin
  approvedBy: "CEO_uid", // siapa yang approve
  
  // System
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

#### Indexes
```javascript
// Composite indexes for coo_attendance
[
  { fields: ["userId", "date", "desc"] },
  { fields: ["date", "desc"] },
  { fields: ["status", "asc"] },
  { fields: ["userId", "status", "date"] },
]
```

---

### 2. coo_recruitment_requests (Direksi DB)
Path: `direksi/coo_recruitment_requests/{id}`

Pengajuan recruitment dari COO ke HR/CEO.

```javascript
{
  id: "CR-20260420-001",
  
  // Requester
  requesterId: "coo_uid",
  requesterName: "John Doe",
  requesterRole: "COO",
  
  // Recruitment Details
  type: "DRIVER",           // DRIVER | MERCHANT | OPERATIONAL_STAFF | TECHNICAL | MARKETING | OTHER
  position: "Senior Driver", // Nama posisi
  department: "Operations",  // Departemen
  quantity: 5,               // Jumlah orang
  
  // Priority & Status
  priority: "HIGH",          // LOW | MEDIUM | HIGH | URGENT
  status: "PENDING",         // PENDING | APPROVED | REJECTED | IN_PROGRESS | COMPLETED
  
  // Details
  reason: "Need more drivers for peak hours",
  requirements: "SIM C, 2 years experience, familiar with Jakarta area",
  
  // Approval
  approvedBy: "ceo_uid",
  approvedAt: Timestamp,
  approvalNotes: "Approved, prioritize experienced candidates",
  
  // Assignment
  assignedTo: "hr_uid",      // HR yang handle
  
  // System
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: Timestamp,    // When recruitment completed
}
```

#### Type Definitions
```typescript
type RecruitmentType = 
  | "DRIVER" 
  | "MERCHANT" 
  | "OPERATIONAL_STAFF" 
  | "TECHNICAL" 
  | "MARKETING" 
  | "OTHER";

type RecruitmentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type RecruitmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";
```

#### Indexes
```javascript
[
  { fields: ["requesterId", "createdAt", "desc"] },
  { fields: ["status", "asc"] },
  { fields: ["priority", "desc"] },
  { fields: ["type", "status"] },
  { fields: ["createdAt", "desc"] },
]
```

---

### 3. coo_operational_summary (Direksi DB)
Path: `direksi/coo_operational_summary/{docId}`

Aggregated summary data yang di-sync oleh CTO/Admin dari main database.

```javascript
{
  // Document ID: "current" atau "YYYY-MM-DD"
  id: "current",
  
  // Sync Info
  lastUpdated: Timestamp,
  syncedBy: "cto_uid",
  syncVersion: 1,
  
  // Merchant Summary
  merchants: {
    total: 150,
    active: 120,
    newThisMonth: 5,
    banned: 2,
    topPerformers: [
      { id: "resto_1", name: "Warung A", ordersToday: 50 },
      // ...
    ],
  },
  
  // Driver Summary
  drivers: {
    total: 80,
    online: 45,
    offline: 30,
    busy: 15,
    banned: 1,
  },
  
  // Order Summary (Today)
  orders: {
    total: 500,
    completed: 400,
    active: 50,
    cancelled: 30,
    pending: 20,
    avgOrderValue: 75000,
    totalRevenue: 30000000,
  },
  
  // Hourly Distribution (last 24h)
  hourlyStats: [
    { hour: 0, orders: 5, revenue: 375000 },
    { hour: 1, orders: 2, revenue: 150000 },
    // ... 24 hours
  ],
  
  // Review Summary
  reviews: {
    total: 1000,
    avgRating: 4.5,
    newToday: 20,
  },
  
  // Alerts/Incidents
  incidents: [
    "⚠️ High order volume: 50 active orders",
    "🚨 Driver shortage detected",
  ],
  
  // Regional Data (if applicable)
  byRegion: {
    "Jakarta": { orders: 300, revenue: 22500000 },
    "Bandung": { orders: 150, revenue: 11250000 },
  },
}
```

---

### 4. orders (Main DB - Read Only)
Path: `default/orders/{orderId}`

Orders dengan tracking fields untuk settlement (shared dengan CFO).

```javascript
{
  id: "order_abc123",
  restaurantId: "resto_xyz",
  driverId: "driver_123",
  customerId: "cust_456",
  
  // Order Details
  status: "COMPLETED",
  total: 150000,
  deliveryFee: 15000,
  itemsTotal: 135000,
  
  // Financial Breakdown
  restoEarnings: 108000,      // 80% of itemsTotal (20% commission)
  driverEarnings: 12750,      // 85% of deliveryFee (15% commission)
  platformCommission: 36150,  // 20% + 15%
  
  // Settlement Tracking (CFO/COO)
  restoCommissionPaid: true,
  restoCommissionPaidAt: Timestamp,
  driverCommissionPaid: false,
  driverCommissionPaidAt: null,
  
  // Timestamps
  createdAt: Timestamp,
  completedAt: Timestamp,
  timestamp: 1713542400000,
}
```

---

### 5. restaurants (Main DB - Read Only)
Path: `default/restaurants/{id}`

```javascript
{
  id: "resto_xyz",
  name: "Warung Makan Sederhana",
  category: "Indonesian",
  
  // Status
  isOpen: true,
  isVerified: true,
  isBanned: false,
  
  // Location
  address: "Jl. Sudirman No. 1",
  coordinates: { lat: -6.2088, lng: 106.8456 },
  
  // Contact
  phone: "08123456789",
  email: "resto@example.com",
  
  // Operational
  openingHours: {
    monday: { open: "08:00", close: "22:00" },
    // ...
  },
  
  // Stats (synced by CTO)
  totalOrders: 1000,
  rating: 4.5,
  totalReviews: 200,
  
  // Settlement fields
  totalUnpaidCommission: 5000000,
  totalPaidCommission: 15000000,
  
  // System
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

### 6. users (Main DB - Read Only)
Path: `default/users/{id}`

Drivers dan users lainnya.

```javascript
{
  id: "driver_123",
  name: "Budi Santoso",
  email: "budi@example.com",
  role: "DRIVER",
  
  // Driver Specific
  phone: "08123456789",
  vehicleType: "MOTORCYCLE",
  licensePlate: "B 1234 CD",
  
  // Status
  isOnline: true,
  isVerified: true,
  isBanned: false,
  
  // Location (real-time)
  currentLocation: {
    lat: -6.2088,
    lng: 106.8456,
    updatedAt: Timestamp,
  },
  
  // Work Status
  currentOrderId: "order_abc",
  isAvailable: false,  // busy with order
  
  // Stats
  totalDeliveries: 500,
  rating: 4.7,
  totalReviews: 150,
  
  // Settlement
  totalUnpaidCommission: 2000000,
  totalPaidCommission: 8000000,
  balance: 500000,  // withdrawable
  
  // System
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
}
```

---

## Security Rules

### Direksi Database (C-Level Only)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // COO Attendance
    match /coo_attendance/{id} {
      allow read: if isCLevel();
      allow create: if isCLevel() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin() || isOwner(userId);
    }
    
    // Recruitment Requests
    match /coo_recruitment_requests/{id} {
      allow read: if isCLevel() || isHR();
      allow create: if isCLevel();
      allow update: if isAdmin() || isHR() || isOwner(requesterId);
      allow delete: if isAdmin();
    }
    
    // Operational Summary
    match /coo_operational_summary/{id} {
      allow read: if isCLevel();
      allow write: if isCTO() || isAdmin();
    }
  }
}
```

---

## Sync Strategy

### Real-time Data (Main DB)
- Orders (live updates)
- Driver locations
- Merchant status
- Active operations

### Periodic Sync (Direksi DB)
CTO/Admin sync ke direksi database:
- Hourly: Order aggregates
- Daily: Merchant/Driver stats
- Weekly: Analytics summaries

### COO Write Operations (Direksi DB)
- Attendance: Real-time write
- Recruitment: Real-time write
- Read-only untuk operational data

---

## UI Components Mapping

| Component | Data Source | Access |
|-----------|-------------|--------|
| COOSummaryCards | coo_operational_summary | Read |
| COOAnalyticsCharts | orders (main) + summary | Read |
| COOAttendancePanel | coo_attendance | Write |
| COORecruitmentPanel | coo_recruitment_requests | Write |
| Merchant/Driver Tables | restaurants/users (main) | Read |

---

## Hooks

1. **useCOOUnifiedDashboard**
   - Subscribe: coo_operational_summary (direksi)
   - Subscribe: orders, restaurants, users (main)
   - Returns: metrics, chartData, summary

2. **useCOOAttendance**
   - Subscribe: coo_attendance (direksi)
   - Write: checkIn, checkOut, requestLeave
   - Returns: records, stats, todayStatus

3. **useCOORecruitment**
   - Subscribe: coo_recruitment_requests (direksi)
   - Write: submitRequest
   - Returns: myRequests, stats

---

## Integration Points

### CFO Integration
- Shared: orders collection (settlement tracking)
- Shared: commission calculations
- CFO melihat data yang sama, tapi fokus ke finance

### CTO Integration
- CTO melakukan sync dari main → direksi
- CTO kontrol akses C-Level
- CTO monitoring system health

### HR Integration
- HR melihat recruitment requests dari COO
- HR update status recruitment
- HR approval workflow

---

## Notes

1. **Read-Only Philosophy**: COO hanya "melihat" operational data, tidak mengubah
2. **Self-Service**: Attendance dan recruitment adalah self-service untuk COO
3. **Real-Time**: Dashboard real-time untuk monitoring
4. **Analytics**: Charts dan trends untuk analisis
5. **Integration**: Terhubung dengan CFO (finance) dan HR (recruitment)
