# 🎓 Student Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your student email and password.
> **Dashboard**: Redirects to `/student` after login.
> **Scope**: A student can only view and manage **their own data**, scoped by their `hostelId`.

---

## 1. Authentication

### 1.1 Register (Sign Up)
- **Frontend Page**: `/signup` → `SignUp.jsx`
- **Backend API**: `POST /api/auth/register`
- **Flow**:
  1. Student fills in: Name, Email, Password, Registration Number, Hostel ID, Contact Number
  2. Role is hardcoded to `student` on the frontend
  3. Backend validates inputs (email format, password ≥ 6 chars, contact 10 digits)
  4. Password is hashed via bcrypt before saving
  5. JWT token is generated and returned
  6. Redirect to Sign In page

> **Note**: `messId` is no longer a field. Students are scoped by `hostelId` only (e.g. `BH-1`, `BH-2`, …, `GH-3`).

### 1.2 Login (Sign In)
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**:
  1. Enter email and password
  2. Backend verifies credentials
  3. Returns `{ data: { user, token } }`
  4. Token + user stored in `localStorage`
  5. Redirects to `/student` dashboard

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`
- **Flow**:
  1. Calls logout API (clears server-side cookie)
  2. Removes `user` and `token` from localStorage
  3. Redirects to `/signin`

### 1.4 Get Current User
- **Backend API**: `GET /api/auth/me`
- Returns the logged-in user's profile from JWT.

---

## 2. Dashboard (`/student`)

**Page**: `StudentDashboard.jsx`

On load, fetches 3 live statistics:

| Stat | Source API |
|---|---|
| Meals this month | `GET /api/attendance/monthly/:month/:year` |
| Avg rating given | `GET /api/feedback/my-feedback?startDate=…&endDate=…` |
| Pending bill amount | `GET /api/bills/my-bills` |

**Quick Action Cards**:
- 📋 **Menu** → Navigate to `/menu`
- ⭐ **Feedback** → Navigate to `/feedback`
- 📊 **Attendance** → Navigate to `/attendance`
- 💰 **Bills & Payments** → View Bills (`/bills`) or Pay Now (`/pay-pending`)
- 📷 **Scan Meal** → Navigate to `/scan-meal`

---

## 3. View Menu (`/menu`)

- **Frontend Page**: `Menu.jsx`
- **Backend APIs**:
  - Current week's menu: `GET /api/menu/current/:hostelId` (public, no auth required)
  - Previous week's menu: `GET /api/menu/previous/:hostelId` (public)
  - Menu by date: `GET /api/menu/date/:hostelId/:date` (public)
  - All menus for mess: `GET /api/menu/mess/:hostelId` (protected)
- **Flow**:
  1. Reads user's `hostelId` from localStorage
  2. Fetches current week's published menu
  3. Displays daily menu breakdown — **3 meals**: breakfast, lunch, dinner
  4. Each meal shows: items list (name, category, isVegetarian), timings
  5. Student can also browse by date

> **Important**: The system uses a **3-meal model** (`breakfast`, `lunch`, `dinner`). Evening Snacks was removed.

---

## 4. Feedback (`/feedback`)

- **Frontend Page**: `Feedback.jsx`
- **Backend API**: `POST /api/feedback`
- **Eligibility check**: `GET /api/feedback/eligible-meals`

### 4.1 Submit Feedback
- **Flow**:
  1. Call `GET /api/feedback/eligible-meals` — returns only meals the student actually attended (via QR scan) within a 24-hour feedback window
  2. Select meal from eligible list (date + mealType pre-filled)
  3. Give overall rating (1–5 stars)
  4. Give category ratings: `foodQuality`, `taste`, `quantity`, `hygiene`, `service` (all required, 1–5)
  5. Optionally add: comments (≤1000 chars), suggestions (≤500 chars), tags, menu items referenced
  6. Option to submit anonymously
  7. Backend checks: no duplicate feedback for same student + date + mealType
  8. Feedback saved with status `pending`; priority auto-set by rating:
     - ≤2 stars → `critical`, 3 → `high`, 4 → `medium`, 5 → `low`

### 4.2 Additional Capabilities
| Action | API |
|---|---|
| View my past feedback (paginated) | `GET /api/feedback/my-feedback?page=&limit=&startDate=&endDate=` |
| Update own pending feedback | `PUT /api/feedback/:id` |
| Delete own pending feedback | `DELETE /api/feedback/:id` |
| Upvote others' feedback | `PUT /api/feedback/:id/upvote` |
| Remove upvote | `DELETE /api/feedback/:id/upvote` |

---

## 5. Attendance (`/attendance`)

- **Frontend Page**: `Attendance.jsx`
- **Backend APIs**:
  - View history by date range: `GET /api/attendance/my-attendance?startDate=…&endDate=…`
  - Monthly attendance + summary: `GET /api/attendance/monthly/:month/:year`
  - Register leave: `POST /api/attendance/leave`
  - Cancel leave: `PUT /api/attendance/cancel-leave/:id`

> **Important**: Manual attendance marking (`POST /api/attendance`) has been **removed**. Students mark attendance by **scanning QR codes** at the mess (see Section 6 below).

### 5.1 View Attendance History
- **Flow**:
  1. Select date range
  2. API returns attendance records with meals array and leave status
  3. Shows per-day breakdown: meals present/absent, on-leave status

### 5.2 Monthly Attendance Summary
- **API**: `GET /api/attendance/monthly/:month/:year`
- Returns `{ attendance: [...], summary: { totalDays, presentDays, absentDays, totalMealsPresent, totalMealsAbsent, attendancePercentage } }`

### 5.3 Register Leave
- **API**: `POST /api/attendance/leave`
- **Body**: `{ startDate, endDate, reason, description }`
- **Reasons**: `vacation`, `sick_leave`, `home_visit`, `emergency`, `other`
- **Flow**:
  1. Select start date and end date (must be today or future)
  2. Choose reason; optionally add description
  3. Backend validates: no past dates, no overlap with existing leaves
  4. Creates one attendance record per day in the range with `isOnLeave: true`

### 5.4 Cancel Leave
- **API**: `PUT /api/attendance/cancel-leave/:id`
- **Flow**:
  1. View upcoming leaves in history
  2. Click cancel on a leave record
  3. Backend checks: student owns it, date is in the future
  4. Deletes the attendance record entirely

---

## 6. Scan Meal QR (`/scan-meal`)

- **Frontend Page**: `ScanMeal.jsx`
- **Backend API**: `POST /api/meal-tokens/scan`
- **Flow**:
  1. Student opens `/scan-meal`
  2. Camera activates to scan the QR code displayed by the manager at the mess counter
  3. Frontend sends `{ token: "<uuid>" }` to the scan endpoint
  4. Backend validates:
     - Token exists in the `MealToken` collection
     - Token is still `isActive: true`
     - Token has not expired (within meal time window)
     - Student's `hostelId` matches the token's `hostelId` (cross-hostel protection)
     - Student has not already scanned for this meal today
     - Student is not on leave for this date
  5. On success: attendance record is created/updated, meal marked `isPresent: true`, `markedBy: 'student'`
  6. Response includes meal type, date, and confirmation message

**Meal time windows** (server local time):
| Meal | Window |
|---|---|
| Breakfast | 07:00 – 10:00 |
| Lunch | 12:00 – 15:00 |
| Dinner | 19:00 – 22:00 |

---

## 7. View Bills (`/bills`)

- **Frontend Page**: `ViewBills.jsx`
- **Backend API**: `GET /api/bills/my-bills`
- **Query params**: `year`, `paymentStatus`, `page` (default 1), `limit` (default 10)
- **Flow**:
  1. Fetches all active, non-cancelled bills for the logged-in student (paginated)
  2. Displays: month/year, total amount, amount paid, amount due, payment status, due date
  3. Status can be: `unpaid`, `partially_paid`, `paid`, `overdue`, `waived`

---

## 8. Pay Pending Bills (`/pay-pending`)

- **Frontend Page**: `PayPendingBills.jsx`
- **Backend API**: `GET /api/bills/my-bills` (filtered for unpaid/overdue)
- **Flow**:
  1. Shows all bills with status `unpaid`, `partially_paid`, or `overdue`
  2. Student selects bills to pay
  3. Navigates to `/pay-now` with selected bill IDs

---

## 9. Pay Now (`/pay-now`)

- **Frontend Page**: `PayNow.jsx`
- **Backend APIs**:
  - Create Razorpay order: `POST /api/payments/create-order`
  - Verify Razorpay payment: `POST /api/payments/verify`
  - Fallback (self-declaration): `PUT /api/bills/mark-paid`

### 9.1 Razorpay Online Payment (Primary)
- **Flow**:
  1. Frontend sends `{ billIds: [...] }` to `POST /api/payments/create-order`
  2. Backend creates a Razorpay order (amount in paise) and returns `{ orderId, amount, currency, key, bills }`
  3. Razorpay checkout modal opens in the browser
  4. After payment, frontend sends `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, billIds }` to `POST /api/payments/verify`
  5. Backend verifies HMAC-SHA256 signature server-side
  6. On success: bills marked `paid`, payment added to `paymentHistory` with `paymentMethod: 'upi'` and Razorpay `transactionId`

### 9.2 Self-Declaration (UPI fallback)
- **API**: `PUT /api/bills/mark-paid`
- **Body**: `{ billIds: [...], transactionId: "UTR..." }`
- **Flow**:
  1. Student confirms UPI payment manually
  2. Backend marks bills as `paid`, pushes payment entry to `paymentHistory`

---

## 10. Profile (`/me`)

- **Frontend Page**: `ProfilePage.jsx` (in `pages/profile/`)
- **Backend API**: `GET /api/profile/me`
- Shows the student's full profile: name, email, registrationNumber, hostelId, contactNumber, role, isActive

---

## 11. Help (`/help`)

- **Frontend Page**: `Help.jsx`
- Static page with FAQs and contact information
- No backend API calls

---

## Sidebar Navigation (Student)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/student` | 🏠 Home |
| Menu | `/menu` | 🍴 Utensils |
| Feedback | `/feedback` | ⭐ Star |
| Attendance | `/attendance` | 📋 ClipboardList |
| Scan Meal | `/scan-meal` | 📷 QrCode |
| Bills & Payments | `/bills` | 💰 ReceiptIndianRupee |
| Help | `/help` | ❓ HelpCircle |
| Profile | `/me` | 👤 User |
| Logout | (action) | 🚪 LogOut |

---

## Data Model Reference (Student-Relevant Fields)

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Unique, lowercase |
| `role` | String | `student` |
| `registrationNumber` | String | Unique (sparse) |
| `hostelId` | String | Enum: `BH-1…BH-5`, `GH-1…GH-3` |
| `contactNumber` | String | 10-digit |
| `isActive` | Boolean | Default true |

### Attendance
| Field | Type | Notes |
|---|---|---|
| `studentId` | ObjectId | ref User |
| `hostelId` | String | |
| `date` | Date | One record per day per student |
| `meals` | Array | `[{ mealType, isPresent, markedAt, markedBy }]` |
| `isOnLeave` | Boolean | |
| `leaveReason` | String | enum: vacation, sick_leave, home_visit, emergency, other |
| `totalMealsPresent` | Number | Auto-calculated (0–3) |
| `totalMealsAbsent` | Number | Auto-calculated (0–3) |

### Bill (Student-visible fields)
| Field | Type | Notes |
|---|---|---|
| `billNumber` | String | Unique |
| `month` | Number | 1–12 |
| `year` | Number | |
| `totalAmount` | Number | Rounded to nearest rupee |
| `amountPaid` | Number | |
| `amountDue` | Number | totalAmount − amountPaid |
| `paymentStatus` | String | unpaid / partially_paid / paid / overdue / waived |
| `dueDate` | Date | 15 days after bill generation |
| `mealWiseCharges` | Array | `[{ mealType, rate, daysConsumed, totalAmount }]` |
| `paymentHistory` | Array | `[{ amount, paymentDate, paymentMethod, transactionId, … }]` |
