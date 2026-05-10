# 🛡️ Admin Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your admin email and password.
> **Dashboard**: Redirects to `/admin` after login.
> **Scope**: Admin has **full access** across all hostels — no restrictions by `hostelId`.

---

## 1. Authentication

### 1.1 Login
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**: Same login page as everyone. Role-based redirect sends admin to `/admin`.

### 1.2 Account Creation
- Admin accounts are created via:
  - Running `node seed.js` (creates default admin: `admin@mess.com` / `Admin@1234`)
  - Direct API call: `POST /api/auth/register` with `{ "role": "admin" }`
  - Another admin promoting a user via User Roles page

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`

### 1.4 Profile
- **Backend API**: `GET /api/profile/me`
- **Frontend Page**: `/me` → `ProfilePage.jsx`

---

## 2. Dashboard (`/admin`)

**Page**: `HostelAdminDashboard.jsx`

On load, fetches live statistics in parallel:

| Stat | Source API |
|---|---|
| Total Students | `GET /api/bills/students-count` |
| Total Bills | `GET /api/bills/stats-all` |
| Paid Bills | `GET /api/bills/stats-all` |
| Unpaid/Pending Bills | `GET /api/bills/stats-all` (sums `unpaid` + `partially_paid` + `overdue`) |
| Waived Bills | `GET /api/bills/stats-all` |

**Quick Action Cards**:
- 💰 **Generate Mess Bills** → Navigate to `/generate-bills`
- ✅ **Payment Status & Records** → Navigate to `/payment-records`
- 📊 **System Reports & Analytics** → Navigate to `/system-reports`
- 👤 **User Roles & Permissions** → Navigate to `/user-roles`

---

## 3. Generate Bills (`/generate-bills`)

- **Frontend Page**: `GenerateBills.jsx`
- **Backend APIs**:
  - Generate for all students in a hostel: `POST /api/bills/generate-all`
  - Generate for single student: `POST /api/bills/generate`

### 3.1 Generate Bills for All Students
- **Request Body**: `{ hostelId, month, year, mealRates?, fixedCharges? }`
- **Flow**:
  1. Select Hostel ID (e.g. `BH-1`, `GH-2`, etc.)
  2. Select month (1–12) and year
  3. Optionally override default meal rates:
     - Breakfast (default: ₹30)
     - Lunch (default: ₹50)
     - Dinner (default: ₹50)
  4. Optionally set fixed charges (default: ₹0)
  5. Click "Generate Bills"
  6. Backend iterates all active students in that hostel (`role: 'student', isActive: true`)
  7. For each student: calls `Bill.generateFromAttendance(...)` (see §3.3)
  8. Returns: `{ generated: N, errors: M, errorDetails: [...] }`

### 3.2 Generate Bill for Single Student
- **Request Body**: `{ studentId, hostelId, month, year, mealRates?, fixedCharges? }`
- **Flow**: Same as above but for one student only

### 3.3 How Bill Calculation Works (Backend Logic)
The static method `Bill.generateFromAttendance()`:
1. Verifies the student exists in the `User` collection
2. Checks no active bill already exists for that `studentId + month + year` (throws if duplicate)
3. Calculates billing period: `startDate = first day of month`, `endDate = last day of month`
4. Calls `Attendance.getAttendanceSummary(studentId, month, year)` for summary stats
5. For each of the 3 meal types (`breakfast`, `lunch`, `dinner`):
   - Queries all attendance records in the period
   - Counts days where that meal was `isPresent: true`
   - `totalAmount = daysConsumed × rate`
6. Generates a unique `billNumber` using the pattern `{hostelId}-{year}{MM}-{sequence}`
7. Sets `dueDate = today + 15 days`
8. Creates the Bill document — the pre-save middleware automatically:
   - Sets `baseAmount = sum of mealWiseCharges[].totalAmount`
   - Sets `totalAmount = baseAmount + fixedCharges + lateFee + adjustments − discount` (rounded to nearest rupee)
   - Sets `amountDue = max(0, totalAmount − amountPaid)`
   - Determines `paymentStatus`:
     - `totalAmount ≤ 0` → `waived`
     - `amountDue ≤ 0` → `paid`
     - `amountPaid > 0 && amountDue > 0` → `partially_paid`
     - past dueDate with `amountDue > 0` → `overdue`
     - otherwise → `unpaid`

---

## 4. Payment Records (`/payment-records`)

- **Frontend Page**: `PaymentRecords.jsx`
- **Backend APIs**:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/bills/mess/:hostelId` | List bills for a hostel (paginated) |
| `GET` | `/api/bills/:id` | Get a single bill by ID |
| `POST` | `/api/bills/:id/payment` | Record a payment against a bill |
| `PUT` | `/api/bills/:id/discount` | Apply a discount |
| `PUT` | `/api/bills/:id/late-fee` | Apply a late fee |
| `PUT` | `/api/bills/:id/cancel` | Cancel a bill |
| `POST` | `/api/bills/apply-late-fees` | Bulk auto-apply late fees |
| `GET` | `/api/bills/unpaid/:hostelId` | View all unpaid bills |
| `GET` | `/api/bills/overdue/:hostelId` | View all overdue bills |
| `GET` | `/api/bills/summary/:hostelId/:month/:year` | Billing summary |
| `PUT` | `/api/bills/:id` | Update any bill field |

### 4.1 View All Bills (Paginated)
- **Query params**: `month`, `year`, `paymentStatus`, `studentId`, `page` (default 1), `limit` (default 20)
- **Flow**:
  1. Select a hostel
  2. Optionally filter by month, year, payment status, student ID
  3. Paginated list showing: student name, registrationNumber, month/year, total, paid, due, status

### 4.2 View Bill Details
- **API**: `GET /api/bills/:id`
- Populated fields: `studentId` (name, email, registrationNumber, hostelId), `generatedBy` (name, email), `paymentHistory[].receivedBy` (name, email)
- Shows complete bill: `mealWiseCharges`, rates, amounts, `paymentHistory` array

### 4.3 Record a Payment
- **API**: `POST /api/bills/:id/payment`
- **Body**: `{ amount, paymentMethod, transactionId?, remarks? }`
- **Payment methods**: `cash`, `online`, `upi`, `card`, `bank_transfer`, `other`
- **Flow**:
  1. Open a bill → Click "Add Payment"
  2. Enter amount (must be ≤ `amountDue`)
  3. Backend calls `bill.addPayment(amount, paymentMethod, transactionId, receivedBy, remarks)`
  4. `amountPaid += amount`; pre-save hook recalculates `amountDue` and `paymentStatus`
  5. Entry added to `paymentHistory` array

### 4.4 Apply Discount
- **API**: `PUT /api/bills/:id/discount`
- **Body**: `{ discount, discountReason }` or `{ discountAmount, reason }` (both accepted)
- **Flow**:
  1. Select a bill → Enter discount amount and reason
  2. Discount must be > 0 and ≤ `(baseAmount + fixedCharges + lateFee + adjustments)`
  3. Backend sets `bill.discount` and `bill.discountReason`
  4. Pre-save hook recalculates `totalAmount`; if `totalAmount ≤ 0`, status becomes `waived`

### 4.5 Apply Late Fee
- **API**: `PUT /api/bills/:id/late-fee`
- **Body**: `{ feeAmount, reason }`
- **Flow**:
  1. Select an unpaid/overdue bill → Enter fee amount and reason
  2. Backend calls `bill.applyLateFee(feeAmount, reason)` → sets `bill.lateFee`
  3. Pre-save hook recalculates `totalAmount` and `amountDue`

### 4.6 Auto-Apply Late Fees (Bulk)
- **API**: `POST /api/bills/apply-late-fees`
- **Body**: `{ lateFeeAmount? }` (default: ₹50)
- **Flow**:
  1. Click "Apply Late Fees to All Overdue"
  2. Backend finds all bills where:
     - `dueDate < today`
     - `paymentStatus in ['unpaid', 'partially_paid', 'overdue']`
     - `isActive: true`, `isCancelled: false`
     - `lateFee: 0` (not already applied)
  3. For each: calculates `daysOverdue`, applies fee via `bill.applyLateFee()`
  4. Returns `{ billsUpdated: N }`

### 4.7 Cancel a Bill
- **API**: `PUT /api/bills/:id/cancel`
- **Body**: `{ reason }`
- **Flow**:
  1. Select a bill → Click Cancel → Enter reason
  2. Backend calls `bill.cancelBill(userId, reason)`:
     - `isCancelled = true`, `isActive = false`
     - `cancelledAt = now`, `cancelledBy = userId`, `cancellationReason = reason`
  3. Bill no longer appears in normal queries

### 4.8 View Unpaid Bills
- **API**: `GET /api/bills/unpaid/:hostelId`
- Returns bills with `paymentStatus in ['unpaid', 'partially_paid', 'overdue']`, sorted by `dueDate asc`

### 4.9 View Overdue Bills
- **API**: `GET /api/bills/overdue/:hostelId`
- Returns bills past their `dueDate` with outstanding `amountDue`

### 4.10 Billing Summary
- **API**: `GET /api/bills/summary/:hostelId/:month/:year`
- Returns aggregated stats via `Bill.getBillingSummary()`:
  `{ totalBills, totalAmount, totalCollected, totalDue, paidBills, unpaidBills, overdueBills }`

### 4.11 Update Bill (Raw)
- **API**: `PUT /api/bills/:id`
- Allows updating any bill field; triggers validators and pre-save middleware

---

## 5. System Reports (`/system-reports`)

- **Frontend Page**: `SystemReports.jsx`
- **Backend APIs**:
  - System report: `GET /api/reports/system`
  - Student count: `GET /api/bills/students-count`
  - Bill stats: `GET /api/bills/stats-all` or `GET /api/bills/stats-all/:month/:year`

### 5.1 System-Wide Report
- **API**: `GET /api/reports/system`
- **Flow**:
  1. Loads automatically on dashboard
  2. Runs 4 queries in **parallel** via `Promise.all`:
     - `User.countDocuments({ role: 'student' })` → **Total Students**
     - `Feedback.aggregate(...)` → **Avg Meal Rating** (current month)
     - `Bill.aggregate({ paymentStatus: 'paid' })` → **Monthly Revenue** (sum of `totalAmount` of paid bills)
     - `Attendance.aggregate(...)` → **Attendance Rate** (presentDays / totalDays × 100)
  3. Returns `{ totalStudents, avgMealRating, monthlyRevenue, attendanceRate }`

### 5.2 Bills Statistics
- **API**: `GET /api/bills/stats-all` or `GET /api/bills/stats-all/:month/:year`
- Returns aggregated breakdown:
  `{ totalBills, paidBills, unpaidBills, partiallyPaidBills, overdueBills, waivedBills, totalAmount, totalCollected, totalDue }`
- Defaults to all-time if no `month`/`year` provided

### 5.3 Student Count
- **API**: `GET /api/bills/students-count`
- Returns `{ totalStudents: N }` — count of active students (`isActive: true`)

---

## 6. User Roles & Permissions (`/user-roles`)

- **Frontend Page**: `UserRoles.jsx`
- **Backend APIs**:
  - Get all users: `GET /api/users`
  - Update role: `PUT /api/users/:id/role`
  - Get student count: `GET /api/users/count?hostelId=…`

### 6.1 View All Users
- **API**: `GET /api/users` (Admin only)
- **Flow**:
  1. Fetches all registered users
  2. Displays: name, email, current role, hostelId, registrationNumber, isActive
  3. Can search/filter users

### 6.2 Change User Role
- **API**: `PUT /api/users/:id/role`
- **Body**: `{ role: "manager" }` (must be `student`, `manager`, or `admin`)
- **Flow**:
  1. Find a user in the list
  2. Select new role from dropdown
  3. Click "Update"
  4. Backend validates role enum and updates the user document
  5. **Use case**: Promote a student to manager, or assign admin privileges

---

## Sidebar Navigation (Admin)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/admin` | 🏠 Home |
| Generate Bills | `/generate-bills` | 📋 FileSpreadsheet |
| Payment Records | `/payment-records` | ✅ CheckCircle |
| System Reports | `/system-reports` | 📊 BarChart3 |
| Manage Roles | `/user-roles` | 👤 Users |
| Profile | `/me` | 👤 User |
| Logout | (action) | 🚪 LogOut |

---

## Admin-Only Backend APIs

| API | Purpose |
|---|---|
| `POST /api/bills/generate` | Generate bill for a single student |
| `POST /api/bills/generate-all` | Generate bills for all students in a hostel |
| `PUT /api/bills/:id/discount` | Apply discount to a bill |
| `PUT /api/bills/:id/late-fee` | Apply late fee |
| `PUT /api/bills/:id/cancel` | Cancel a bill |
| `POST /api/bills/apply-late-fees` | Bulk auto-apply late fees |
| `PUT /api/bills/:id` | Update any bill field |
| `GET /api/bills/stats-all` | Get all bills statistics (with optional month/year filter) |
| `GET /api/bills/stats-all/:month/:year` | Get bills statistics for a specific month |
| `GET /api/bills/students-count` | Get total active student count |
| `DELETE /api/attendance/:id` | Delete any attendance record |
| `GET /api/reports/system` | System-wide report (revenue, ratings, attendance) |
| `GET /api/users` | List all users |
| `PUT /api/users/:id/role` | Change a user's role |

---

## Admin vs Manager vs Student — Permissions Matrix

| Feature | Admin | Manager | Student |
|---|---|---|---|
| View any hostel's data | ✅ | ❌ Own hostel only | ❌ Own data only |
| Create/edit/delete menus | ✅ | ✅ Own hostel | ❌ |
| Generate QR tokens | ✅ | ✅ Own hostel | ❌ |
| Scan QR to mark attendance | ❌ | ❌ | ✅ |
| View feedback analytics | ✅ | ✅ Own hostel | ❌ |
| Respond to feedback | ✅ | ✅ Own hostel | ❌ |
| View attendance insights | ✅ | ✅ Own hostel | ❌ Own data only |
| Update student attendance | ✅ | ✅ Own hostel | ❌ |
| Delete attendance records | ✅ | ❌ | ❌ |
| Generate bills | ✅ | ❌ | ❌ |
| View all hostel bills | ✅ | ✅ Own hostel (read-only) | Own bills only |
| Add payment to bill | ✅ | ✅ Own hostel | Via payment gateway |
| Apply discounts/late fees | ✅ | ❌ | ❌ |
| Cancel bills | ✅ | ❌ | ❌ |
| View system reports | ✅ | ❌ | ❌ |
| Manage user roles | ✅ | ❌ | ❌ |
| Submit feedback | ❌ | ❌ | ✅ |
| Register leave | ❌ | ❌ | ✅ |
| Pay bills (Razorpay / UPI) | ❌ | ❌ | ✅ |
| View own profile | ✅ | ✅ | ✅ |

---

## Data Model Reference (Admin-Relevant)

### Bill (Full Schema)
| Field | Type | Notes |
|---|---|---|
| `billNumber` | String | Unique, format: `{hostelId}-{year}{MM}-{seq}` |
| `studentId` | ObjectId | ref User |
| `hostelId` | String | |
| `month` | Number | 1–12 |
| `year` | Number | ≥ 2020 |
| `billingPeriod` | Object | `{ startDate, endDate }` |
| `totalDaysInMonth` | Number | 28–31 |
| `daysPresent` | Number | |
| `daysAbsent` | Number | |
| `totalMealsConsumed` | Number | |
| `mealWiseCharges` | Array | `[{ mealType, rate, daysConsumed, totalAmount }]` |
| `baseAmount` | Number | Auto-calculated |
| `fixedCharges` | Number | Default 0 |
| `discount` | Number | Default 0 |
| `discountReason` | String | |
| `lateFee` | Number | Default 0 |
| `adjustments` | Number | Default 0 |
| `adjustmentReason` | String | |
| `totalAmount` | Number | Auto-calculated, rounded |
| `amountPaid` | Number | Default 0 |
| `amountDue` | Number | Auto-calculated |
| `paymentStatus` | String | unpaid / partially_paid / paid / overdue / waived |
| `paymentHistory` | Array | `[{ amount, paymentDate, paymentMethod, transactionId, paymentStatus, remarks, receivedBy }]` |
| `dueDate` | Date | Set at generation (today + 15 days) |
| `paidDate` | Date | Auto-set when fully paid |
| `generatedBy` | ObjectId | ref User (admin) |
| `isCancelled` | Boolean | Default false |
| `cancelledAt` | Date | |
| `cancelledBy` | ObjectId | ref User |
| `cancellationReason` | String | |
| `isActive` | Boolean | Default true; set false on cancel |

### Bill Model — Key Methods
| Method | Type | Signature | Purpose |
|---|---|---|---|
| `addPayment` | instance | `(amount, paymentMethod, transactionId, receivedBy, remarks)` | Append to paymentHistory, increment amountPaid |
| `applyLateFee` | instance | `(feeAmount, reason)` | Set lateFee field |
| `applyDiscount` | instance | `(discountAmount, reason)` | Set discount + discountReason |
| `cancelBill` | instance | `(userId, reason)` | Mark cancelled |
| `generateBillNumber` | static | `(hostelId, month, year)` | Generate unique bill number |
| `generateFromAttendance` | static | `(studentId, hostelId, month, year, mealRates, fixedCharges, generatedBy)` | Full bill generation from attendance data |
| `getUnpaidBills` | static | `(hostelId)` | Fetch unpaid/overdue bills for hostel |
| `getOverdueBills` | static | `(hostelId)` | Fetch past-due bills |
| `getBillingSummary` | static | `(hostelId, month, year)` | Aggregated summary |
| `applyLateFees` | static | `(lateFeeAmount?)` | Bulk apply late fees to overdue bills |

### User Schema
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Unique, lowercase |
| `password` | String | Bcrypt hashed, not returned in queries (select: false) |
| `role` | String | student / manager / admin |
| `registrationNumber` | String | Unique (sparse, students only) |
| `hostelId` | String | Required for student/manager; enum: `BH-1…BH-5`, `GH-1…GH-3` |
| `contactNumber` | String | 10-digit |
| `isActive` | Boolean | Default true |

### Constants (server/constants/index.js)
| Constant | Values |
|---|---|
| `HOSTELS` | `['BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'GH-1', 'GH-2', 'GH-3']` |
| `MEAL_TYPES` | `['breakfast', 'lunch', 'dinner']` |
| `ROLES` | `['student', 'manager', 'admin']` |
| `DEFAULT_MEAL_RATES` | `{ breakfast: 30, lunch: 50, dinner: 50 }` |
| `DEFAULT_FIXED_CHARGES` | `0` |
| `BILL_STATUSES` | `['unpaid', 'partially_paid', 'paid', 'overdue', 'waived']` |
| `PAYMENT_METHODS` | `['cash', 'online', 'upi', 'card', 'bank_transfer', 'other']` |
| `LEAVE_REASONS` | `['vacation', 'sick_leave', 'home_visit', 'emergency', 'other']` |
| `FEEDBACK_STATUSES` | `['pending', 'reviewed', 'resolved', 'rejected']` |
| `MEAL_WINDOWS` | `{ breakfast: {start:7, end:10}, lunch: {start:12, end:15}, dinner: {start:19, end:22} }` |
