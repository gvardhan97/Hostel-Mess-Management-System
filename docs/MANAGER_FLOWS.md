# 👨‍🍳 Mess Manager Flows — Complete Feature Guide

> **Login**: Use the same Sign In page (`/signin`) with your manager email and password.
> **Dashboard**: Redirects to `/manager` after login.
> **Scope**: A manager can only manage data for their **own hostel** (identified by `hostelId`). All APIs enforce this constraint server-side.

---

## 1. Authentication

### 1.1 Login
- **Frontend Page**: `/signin` → `SignIn.jsx`
- **Backend API**: `POST /api/auth/login`
- **Flow**: Same login page as students. Role-based redirect sends managers to `/manager`.

### 1.2 Account Creation
- Manager accounts **cannot** be created via the Sign Up page (it only allows `student` role).
- **Created by**:
  - Running `node seed.js` (seed script creates a default manager)
  - Admin promoting a user via `PUT /api/users/:id/role`
  - Direct API call: `POST /api/auth/register` with `{ "role": "manager", "hostelId": "BH-1" }`

### 1.3 Logout
- **Frontend**: Sidebar → Logout button
- **Backend API**: `POST /api/auth/logout`

### 1.4 Profile
- **Backend API**: `GET /api/profile/me`
- **Frontend Page**: `/me` → `ProfilePage.jsx`

---

## 2. Dashboard (`/manager`)

**Page**: `MessManagerDashboard.jsx`

On load, fetches 3 live statistics:

| Stat | Source API |
|---|---|
| Avg Meal Rating (current month) | `GET /api/feedback/statistics?month=…&year=…` |
| Students with attendance today | `GET /api/attendance/mess/:hostelId/:date` |
| Weekly Menu Cycles (count) | `GET /api/menu/mess/:hostelId?limit=52` |

**Quick Action Cards**:
- 🍴 **Weekly Menu Management** → Navigate to `/manage-menus`
- 📊 **Feedback Analytics** → Navigate to `/feedback-analytics`
- 📋 **Attendance Insights** → Navigate to `/attendance-insights`
- 📄 **Feedback Reports** → Navigate to `/feedback-reports`
- 📷 **Generate QR** → Navigate to `/generate-qr`

---

## 3. Manage Menus (`/manage-menus`)

- **Frontend Page**: `ManageMenus.jsx`
- **Backend APIs**:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/menu` | Create a new weekly menu |
| `PUT` | `/api/menu/:id` | Update an existing menu |
| `PUT` | `/api/menu/:id/publish` | Publish a draft menu |
| `DELETE` | `/api/menu/:id` | Delete a menu |
| `GET` | `/api/menu/mess/:hostelId` | List all menus for the hostel |
| `GET` | `/api/menu/current/:hostelId` | Get current week's published menu (public) |
| `GET` | `/api/menu/previous/:hostelId` | Get previous week's published menu (public) |
| `GET` | `/api/menu/date/:hostelId/:date` | Get menu for a specific date (public) |

### 3.1 Create Weekly Menu
- **Flow**:
  1. Set week start date and end date
  2. `dailyMenus` must contain exactly **7 days** (validated on server)
  3. For each day, add menu items for each of the **3 meals**:
     - **Breakfast** (default timings: 07:30 AM – 09:30 AM)
     - **Lunch** (default timings: 12:30 PM – 02:30 PM)
     - **Dinner** (default timings: 07:30 PM – 09:30 PM)
  4. Each item has: `name` (required), `category` (main_course/side_dish/beverage/dessert/snack), `isVegetarian`, `description`
  5. Optionally add an `announcement` (≤ 500 chars)
  6. Submit — menu is created in `draft` status
  7. Backend validates: `weekEndDate` must be after `weekStartDate`

> **Note**: `eveningSnacks` has been removed. The system is a **3-meal model**: breakfast, lunch, dinner.

### 3.2 Publish Menu
- **Flow**:
  1. View list of draft menus
  2. Click "Publish" on a menu → calls `PUT /api/menu/:id/publish`
  3. Status changes from `draft` → `published`; `publishedAt` timestamp is set automatically
  4. Students can now see it on the Menu page

### 3.3 Update Menu
- **Flow**:
  1. Select an existing menu
  2. Edit daily items, timings, announcement
  3. Save changes — PUT request with updated `dailyMenus` array

### 3.4 Delete Menu
- **Flow**:
  1. Select a menu → Click Delete
  2. Backend removes the document
  3. Managers can only delete menus for **their own hostel**

### 3.5 Menu Archival (Automatic)
- Backend static method `Menu.archiveOldMenus()` automatically archives published menus whose `weekEndDate` is more than 7 days in the past (sets `status: 'archived'`, `isActive: false`)

---

## 4. Generate QR Codes (`/generate-qr`)

- **Frontend Page**: `GenerateQR.jsx`
- **Backend APIs**:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/meal-tokens/generate` | Generate a QR token for a meal |
| `GET` | `/api/meal-tokens/:hostelId/:date` | Get all tokens for a hostel on a date |
| `PUT` | `/api/meal-tokens/:id/deactivate` | Deactivate a token |

### 4.1 Generate Token
- **Flow**:
  1. Select date and meal type (`breakfast`, `lunch`, `dinner`)
  2. POST to `/api/meal-tokens/generate` with `{ date, mealType }`
  3. Backend uses `req.user.hostelId` (from JWT) as the hostel scope
  4. Generates a `crypto.randomUUID()` token string
  5. Sets `expiresAt` based on the meal's end time window (e.g. breakfast → 10:00)
  6. **Idempotent**: if a token already exists for that hostel + date + meal, the existing one is returned
  7. One token document per hostel + date + meal is enforced by a unique index

**Meal token windows**:
| Meal | Valid Until |
|---|---|
| Breakfast | 10:00 (3 hr window from 07:00) |
| Lunch | 15:00 (3 hr window from 12:00) |
| Dinner | 22:00 (3 hr window from 19:00) |

### 4.2 Display QR
- Manager displays the generated QR code (encodes the UUID token string) at the mess counter
- Students scan it via `/scan-meal` → `POST /api/meal-tokens/scan`

### 4.3 View Tokens for a Date
- `GET /api/meal-tokens/:hostelId/:date` — returns all tokens for that hostel/date
- Managers can only view tokens for their **own hostel** (403 otherwise)

### 4.4 Deactivate a Token
- `PUT /api/meal-tokens/:id/deactivate` — sets `isActive: false`
- Any student who tries to scan a deactivated token will get an error

### MealToken Schema Fields
| Field | Type | Notes |
|---|---|---|
| `hostelId` | String | Required |
| `date` | Date | Midnight-normalized |
| `mealType` | String | breakfast / lunch / dinner |
| `token` | String | UUID, unique |
| `createdBy` | ObjectId | ref User (manager/admin) |
| `expiresAt` | Date | Auto-calculated from meal window |
| `isActive` | Boolean | Default true |

---

## 5. Feedback Analytics (`/feedback-analytics`)

- **Frontend Page**: `FeedbackAnalytics.jsx`
- **Backend APIs**:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/feedback/consolidated?hostelId=…&month=…&year=…` | Monthly consolidated report |
| `GET` | `/api/feedback/mess?hostelId=…` | Paginated list of all feedbacks |
| `GET` | `/api/feedback/pending?hostelId=…` | All pending feedbacks |
| `GET` | `/api/feedback/statistics?month=…&year=…` | Average ratings + distribution |
| `PUT` | `/api/feedback/:id/respond` | Add manager response |
| `PUT` | `/api/feedback/:id/status` | Update feedback status |

### 5.1 View Consolidated Feedback Report
- **Flow**:
  1. Select month and year
  2. API runs 4 parallel queries via `Promise.all`:
     - `getAverageRatings` → overall + category averages (foodQuality, taste, quantity, hygiene, service)
     - `getMealWiseRatings` → average rating per meal type (breakfast/lunch/dinner)
     - `getRatingDistribution` → count of 1–5 star ratings
     - `getTopIssues` → top 5 low-rated feedbacks sorted by upvotes
  3. Returns full report object with period metadata

### 5.2 View All Feedbacks (Paginated)
- **API**: `GET /api/feedback/mess` (uses manager's hostelId from JWT)
- **Query filters**: `status`, `mealType`, `startDate`, `endDate`, `minRating`, `maxRating`, `page`, `limit`
- Each feedback record includes: student info, date, mealType, overallRating, categoryRatings, comments, tags, priority, status, upvotes

### 5.3 View Pending Feedbacks
- **API**: `GET /api/feedback/pending`
- Returns all feedbacks with `status: 'pending'`, sorted by priority (desc) then date (asc)
- Populated with student name and registrationNumber (if not anonymous)

### 5.4 Respond to Feedback
- **API**: `PUT /api/feedback/:id/respond`
- **Body**: `{ response, actionTaken, status? }`
- **Flow**:
  1. Click on a pending feedback
  2. Write response text (≤ 1000 chars)
  3. Optionally add "action taken" notes
  4. Optionally set new status: `pending` → `reviewed` / `resolved` / `rejected`
  5. Response saved with `respondedBy: managerId` and `responseDate: now`
  6. Model method: `feedback.addManagerResponse(managerId, response, actionTaken)` → sets status to `reviewed`

### 5.5 Update Feedback Status
- **API**: `PUT /api/feedback/:id/status`
- **Body**: `{ status: "resolved" }`
- Status lifecycle: `pending` → `reviewed` → `resolved` / `rejected`
- When status is set to `resolved`: `isResolved = true`, `resolvedAt = now` (auto via pre-save hook)

### 5.6 View Feedback Statistics
- **API**: `GET /api/feedback/statistics?month=…&year=…`
- Returns: average overall rating, per-category averages, meal-wise averages, rating distribution (1–5 star counts)

---

## 6. Attendance Insights (`/attendance-insights`)

- **Frontend Page**: `AttendanceInsights.jsx`
- **Backend APIs**:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/attendance/mess/:hostelId/:date` | Daily mess attendance |
| `GET` | `/api/attendance/mess-monthly/:hostelId/:month/:year` | Monthly analytics (aggregated) |
| `GET` | `/api/attendance/summary/:studentId/:month/:year` | Individual student summary |
| `GET` | `/api/attendance/monthly/:month/:year?studentId=…` | Monthly records for a student |
| `PUT` | `/api/attendance/:id` | Update an attendance record |
| `GET` | `/api/users/count?hostelId=…` | Student count for the hostel |

### 6.1 View Daily Mess Attendance
- **API**: `GET /api/attendance/mess/:hostelId/:date`
- **Flow**:
  1. Select a date
  2. Backend returns all attendance records for the hostel on that date, populated with student name and registrationNumber
  3. Also returns computed statistics:
     - `totalStudents` — number of records
     - `studentsPresent` — not on leave AND at least 1 meal present
     - `studentsOnLeave` — `isOnLeave: true`
     - `studentsAbsent` — totalStudents − present − onLeave

### 6.2 Monthly Analytics
- **API**: `GET /api/attendance/mess-monthly/:hostelId/:month/:year`
- Returns a rich analytics object:
  - `daily[]` — per-day stats: date, dayOfWeek, totalStudents, studentsPresent, studentsOnLeave, studentsAbsent, presentPct, avgMealsPerStudent, breakfastCount, lunchCount, dinnerCount
  - `weekday[]` — weekday averages (Mon–Sun): presentPct, avgMealsPerStudent, breakfastPct, lunchPct, dinnerPct
  - `kpis` — month-level KPIs: avgDailyPresencePct, avgMealsPerStudent, totalLeaveDays, daysWithData, peakDay, lowDay, mealTotals

### 6.3 View Student Attendance Summary
- **API**: `GET /api/attendance/summary/:studentId/:month/:year`
- Returns: `{ student: { name, registrationNumber, hostelId }, summary: { totalDays, presentDays, absentDays, totalMealsPresent, totalMealsAbsent, attendancePercentage } }`

### 6.4 Update Student Attendance
- **API**: `PUT /api/attendance/:id`
- **Flow**:
  1. Manager selects an attendance record by ID
  2. Can update: `meals`, `isOnLeave`, `leaveReason`, `remarks`, etc.
  3. Only allowed for records belonging to students in **their own hostel**
  4. `totalMealsPresent` / `totalMealsAbsent` recalculated by pre-save middleware

---

## 7. Feedback Reports (`/feedback-reports`)

- **Frontend Page**: `FeedbackReports.jsx`
- **Backend APIs**: Same as Feedback Analytics
- **Flow**:
  1. Select report type (weekly/monthly)
  2. Select date range
  3. Generates downloadable feedback report
  4. Uses `html2canvas` + `jspdf` for PDF generation (client-side)

---

## Sidebar Navigation (Manager)

| Menu Item | Route | Icon |
|---|---|---|
| Dashboard | `/manager` | 🏠 Home |
| Manage Menus | `/manage-menus` | 🍴 Utensils |
| Generate QR | `/generate-qr` | 📷 QrCode |
| Feedback Analytics | `/feedback-analytics` | 📊 BarChart3 |
| Attendance Insights | `/attendance-insights` | 📋 ClipboardList |
| Feedback Reports | `/feedback-reports` | 📄 FileText |
| Profile | `/me` | 👤 User |
| Logout | (action) | 🚪 LogOut |

---

## Authorization Constraints

| Action | Constraint |
|---|---|
| View / respond to feedback | Only for their own hostel |
| Create / edit / delete menus | Only for their own hostel |
| View / update attendance | Only for their own hostel |
| Generate / view / deactivate QR tokens | Only for their own hostel |
| View mess bills | ✅ Allowed (read-only) |
| Add payment to a bill | ✅ Allowed for their own hostel |
| Generate bills / apply discounts | ❌ Admin only |
| View system-wide stats | ❌ Admin only |
| Manage users / roles | ❌ Admin only |

---

## Data Model Reference (Manager-Relevant)

### MealToken
| Field | Type | Notes |
|---|---|---|
| `hostelId` | String | Required |
| `date` | Date | Midnight-normalized |
| `mealType` | String | breakfast / lunch / dinner |
| `token` | String | UUID, unique |
| `createdBy` | ObjectId | ref User |
| `expiresAt` | Date | End of meal time window |
| `isActive` | Boolean | Set false to deactivate |

### Menu (Weekly)
| Field | Type | Notes |
|---|---|---|
| `hostelId` | String | Required |
| `weekStartDate` | Date | |
| `weekEndDate` | Date | Must be after start |
| `weekNumber` | Number | ISO week number |
| `year` | Number | |
| `dailyMenus` | Array | Exactly 7 DailyMenuSchema items |
| `status` | String | draft / published / archived |
| `announcement` | String | ≤ 500 chars |
| `publishedAt` | Date | Auto-set on publish |
| `isActive` | Boolean | false when archived |

### Feedback
| Field | Type | Notes |
|---|---|---|
| `studentId` | ObjectId | ref User |
| `hostelId` | String | |
| `date` | Date | |
| `mealType` | String | breakfast / lunch / dinner |
| `overallRating` | Number | 1–5 |
| `categoryRatings` | Object | foodQuality, taste, quantity, hygiene, service (all 1–5) |
| `comments` | String | ≤ 1000 chars |
| `suggestions` | String | ≤ 500 chars |
| `tags` | Array | food_quality, portion_size, temperature, … |
| `isAnonymous` | Boolean | |
| `status` | String | pending / reviewed / resolved / rejected |
| `managerResponse` | Object | respondedBy, response, responseDate, actionTaken |
| `priority` | String | Auto-set: low / medium / high / critical |
| `upvotes` | Number | |
| `upvotedBy` | Array | ObjectIds |
