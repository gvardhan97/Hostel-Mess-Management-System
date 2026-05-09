/**
 * seedDemo.js — Rich demo data for screenshots & presentation
 *
 * Creates:
 *   • 1 Admin
 *   • 3 Managers  (BH-1, BH-2, GH-1)
 *   • 10 Students (spread across 3 hostels)
 *   • 60 days of realistic attendance (Mar–Apr 2026)
 *   • 3 months of bills with a mix of paid / overdue / unpaid
 *   • 90+ feedback entries with varied ratings & comments
 *
 * Usage:  node seedDemo.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// ── Models ──────────────────────────────────────────────────────
import User       from './models/User.js';
import Attendance from './models/Attendance.js';
import Bill       from './models/Bill.js';
import Feedback   from './models/Feedback.js';

// ── Constants ───────────────────────────────────────────────────
const MEAL_RATES = { breakfast: 30, lunch: 50, dinner: 50 };
const FIXED_CHARGES = 0;

// ── Helpers ─────────────────────────────────────────────────────
const hashPwd = async (pwd) => bcrypt.hash(pwd, 10);

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function dateOfMonth(year, month, day) {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Seed ────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // ── 1. Clear existing demo data ──────────────────────────────
  await Promise.all([
    User.deleteMany({ email: /@demo\.iiita\.ac\.in$/ }),
    User.deleteMany({ email: /@mess\.com$/ }),       // old seed emails
  ]);
  // Clear attendance, bills, feedback for demo users after we create them
  console.log('🗑️   Cleared old demo users');

  // ── 2. Create Admin ──────────────────────────────────────────
  const admin = await User.create({
    name: 'Dr. Suresh Kumar',
    email: 'admin@demo.iiita.ac.in',
    password: await hashPwd('Admin@1234'),
    role: 'admin',
    contactNumber: '9876500001',
  });
  console.log('👑  Admin created');

  // ── 3. Create Managers ───────────────────────────────────────
  const managerData = [
    { name: 'Rajesh Sharma',  email: 'manager.bh1@demo.iiita.ac.in', hostelId: 'BH-1', contact: '9876500011' },
    { name: 'Priya Verma',    email: 'manager.bh2@demo.iiita.ac.in', hostelId: 'BH-2', contact: '9876500012' },
    { name: 'Amit Singh',     email: 'manager.gh1@demo.iiita.ac.in', hostelId: 'GH-1', contact: '9876500013' },
  ];

  const managers = await Promise.all(
    managerData.map((m) =>
      User.create({
        name: m.name,
        email: m.email,
        password: hashPwd('Manager@1234'),
        role: 'manager',
        hostelId: m.hostelId,
        contactNumber: m.contact,
      })
    )
  );
  console.log('🏢  3 Managers created');

  // ── 4. Create Students ───────────────────────────────────────
  const studentData = [
    // BH-1 students
    { name: 'Rahul Sharma',    regNo: 'IEC2022001', hostel: 'BH-1', email: 'rahul@demo.iiita.ac.in',   contact: '9876511001' },
    { name: 'Aditya Gupta',    regNo: 'IEC2022002', hostel: 'BH-1', email: 'aditya@demo.iiita.ac.in',  contact: '9876511002' },
    { name: 'Karan Mehta',     regNo: 'IIT2022003', hostel: 'BH-1', email: 'karan@demo.iiita.ac.in',   contact: '9876511003' },
    { name: 'Vikram Tiwari',   regNo: 'IEC2023004', hostel: 'BH-1', email: 'vikram@demo.iiita.ac.in',  contact: '9876511004' },
    // BH-2 students
    { name: 'Sneha Patel',     regNo: 'IEC2022005', hostel: 'BH-2', email: 'sneha@demo.iiita.ac.in',   contact: '9876511005' },
    { name: 'Mohit Dubey',     regNo: 'IIT2023006', hostel: 'BH-2', email: 'mohit@demo.iiita.ac.in',   contact: '9876511006' },
    { name: 'Prateek Joshi',   regNo: 'IEC2023007', hostel: 'BH-2', email: 'prateek@demo.iiita.ac.in', contact: '9876511007' },
    // GH-1 students
    { name: 'Neha Singh',      regNo: 'IEC2022008', hostel: 'GH-1', email: 'neha@demo.iiita.ac.in',    contact: '9876511008' },
    { name: 'Riya Agarwal',    regNo: 'IEC2023009', hostel: 'GH-1', email: 'riya@demo.iiita.ac.in',    contact: '9876511009' },
    { name: 'Shruti Mishra',   regNo: 'IIT2022010', hostel: 'GH-1', email: 'shruti@demo.iiita.ac.in',  contact: '9876511010' },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      User.create({
        name: s.name,
        email: s.email,
        password: hashPwd('Student@1234'),
        role: 'student',
        hostelId: s.hostel,
        registrationNumber: s.regNo,
        contactNumber: s.contact,
      })
    )
  );
  console.log('🎓  10 Students created');

  // ── 5. Clear previous attendance / bills / feedback for these users ──
  const studentIds = students.map((s) => s._id);
  await Promise.all([
    Attendance.deleteMany({ studentId: { $in: studentIds } }),
    Bill.deleteMany({ studentId: { $in: studentIds } }),
    Feedback.deleteMany({ studentId: { $in: studentIds } }),
  ]);

  // ── 6. Attendance — last 60 days ─────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const attendanceDocs = [];

  // per-student absence probability (some students more regular than others)
  const absentProb = [0.05, 0.10, 0.08, 0.15, 0.06, 0.12, 0.20, 0.07, 0.09, 0.18];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const prob = absentProb[i];

    for (let d = 59; d >= 0; d--) {
      const date = daysAgo(d);
      const isLeave = Math.random() < prob;

      if (isLeave) {
        attendanceDocs.push({
          studentId: s._id,
          hostelId: s.hostelId,
          date,
          isOnLeave: true,
          leaveReason: pick(['vacation', 'sick_leave', 'home_visit', 'emergency', 'other']),
          totalMealsPresent: 0,
          totalMealsAbsent: 3,
          meals: [],
          status: 'confirmed',
        });
      } else {
        // Random meal-wise attendance
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        const meals = mealTypes.map((mt) => ({
          mealType: mt,
          isPresent: Math.random() > (mt === 'breakfast' ? 0.20 : 0.08), // breakfast skipped more
          markedAt: new Date(date.getTime() + (mt === 'breakfast' ? 8 : mt === 'lunch' ? 13 : 20) * 3600000),
          markedBy: 'student',
        }));
        const present = meals.filter((m) => m.isPresent).length;
        attendanceDocs.push({
          studentId: s._id,
          hostelId: s.hostelId,
          date,
          isOnLeave: false,
          meals,
          totalMealsPresent: present,
          totalMealsAbsent: 3 - present,
          status: 'confirmed',
        });
      }
    }
  }

  // Bulk insert attendance using insertMany (bypasses pre-save, so set dayOfWeek manually)
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  attendanceDocs.forEach((a) => { a.dayOfWeek = DAYS[new Date(a.date).getDay()]; });

  await Attendance.insertMany(attendanceDocs, { ordered: false });
  console.log(`📅  ${attendanceDocs.length} attendance records created`);

  // ── 7. Bills — March, April, May 2026 ────────────────────────
  const billMonths = [
    { month: 3, year: 2026, status: 'paid' },
    { month: 4, year: 2026, status: 'mixed' },
    { month: 5, year: 2026, status: 'unpaid' },
  ];

  let billCount = 0;
  for (const s of students) {
    const mgr = managers.find((m) => m.hostelId === s.hostelId) || managers[0];

    for (const bm of billMonths) {
      const { month, year, status } = bm;

      // Count meals from attendance
      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(year, month, 0, 23, 59, 59);
      const totalDays = daysInMonth(year, month);

      const attRecords = await Attendance.find({
        studentId: s._id,
        date: { $gte: startDate, $lte: endDate },
      });

      let bfDays = 0, lunchDays = 0, dinnerDays = 0, presentDays = 0;
      attRecords.forEach((r) => {
        if (r.isOnLeave) return;
        const bfMeal    = r.meals.find((m) => m.mealType === 'breakfast' && m.isPresent);
        const lunchMeal = r.meals.find((m) => m.mealType === 'lunch'     && m.isPresent);
        const dinMeal   = r.meals.find((m) => m.mealType === 'dinner'    && m.isPresent);
        if (bfMeal)    bfDays++;
        if (lunchMeal) lunchDays++;
        if (dinMeal)   dinnerDays++;
        if (r.totalMealsPresent > 0) presentDays++;
      });

      const mealWiseCharges = [
        { mealType: 'breakfast', rate: 30, daysConsumed: bfDays,    totalAmount: bfDays    * 30 },
        { mealType: 'lunch',     rate: 50, daysConsumed: lunchDays,  totalAmount: lunchDays * 50 },
        { mealType: 'dinner',    rate: 50, daysConsumed: dinnerDays, totalAmount: dinnerDays * 50 },
      ];

      const baseAmount = mealWiseCharges.reduce((s, m) => s + m.totalAmount, 0);
      const totalAmount = baseAmount + FIXED_CHARGES;

      const dueDate = new Date(year, month, 15); // 15th of next month

      // Determine payment
      let amountPaid = 0;
      let paymentHistory = [];
      let paymentStatus = 'unpaid';
      let paidDate;

      if (status === 'paid') {
        amountPaid = totalAmount;
        paymentStatus = 'paid';
        paidDate = new Date(year, month - 1, rand(18, 28));
        paymentHistory = [{
          amount: totalAmount,
          paymentDate: paidDate,
          paymentMethod: pick(['online', 'upi', 'card']),
          transactionId: `TXN${Date.now()}${rand(1000,9999)}`,
          paymentStatus: 'success',
          remarks: 'Monthly mess bill payment',
          receivedBy: mgr._id,
        }];
      } else if (status === 'mixed') {
        // Half students paid, half overdue
        if (students.indexOf(s) % 2 === 0) {
          amountPaid = totalAmount;
          paymentStatus = 'paid';
          paidDate = new Date(year, month, rand(1, 14));
          paymentHistory = [{
            amount: totalAmount,
            paymentDate: paidDate,
            paymentMethod: pick(['online', 'upi']),
            transactionId: `TXN${Date.now()}${rand(1000,9999)}`,
            paymentStatus: 'success',
            receivedBy: mgr._id,
          }];
        } else {
          paymentStatus = dueDate < today ? 'overdue' : 'unpaid';
          // Partial payment for some
          if (Math.random() > 0.5) {
            amountPaid = Math.floor(totalAmount * 0.4);
            paymentStatus = 'partially_paid';
            paymentHistory = [{
              amount: amountPaid,
              paymentDate: new Date(year, month, rand(2,8)),
              paymentMethod: 'online',
              transactionId: `TXN${Date.now()}${rand(1000,9999)}`,
              paymentStatus: 'success',
              receivedBy: mgr._id,
            }];
          }
        }
      } else {
        // May — all unpaid (current month)
        paymentStatus = 'unpaid';
      }

      const amountDue = Math.max(0, totalAmount - amountPaid);

      const billNumber = await Bill.generateBillNumber(s.hostelId, month, year);

      try {
        await Bill.create({
          billNumber,
          studentId: s._id,
          hostelId: s.hostelId,
          month,
          year,
          billingPeriod: { startDate, endDate },
          totalDaysInMonth: totalDays,
          daysPresent: presentDays,
          daysAbsent: totalDays - presentDays,
          totalMealsConsumed: bfDays + lunchDays + dinnerDays,
          mealWiseCharges,
          baseAmount,
          fixedCharges: FIXED_CHARGES,
          totalAmount,
          amountPaid,
          amountDue,
          paymentStatus,
          paymentHistory,
          dueDate,
          paidDate,
          generatedBy: mgr._id,
          isActive: true,
          isCancelled: false,
        });
        billCount++;
      } catch (err) {
        // Skip duplicates
      }
    }
  }
  console.log(`💰  ${billCount} bills created`);

  // ── 8. Feedback — 90+ entries ─────────────────────────────────
  const feedbackComments = {
    5: [
      'Excellent food today! Dal makhani was outstanding.',
      'Very fresh vegetables and perfectly cooked rice. Keep it up!',
      'Best breakfast this week. Poha was hot and tasty.',
      'Dinner was superb. The paneer dish was very well made.',
      'Great variety and good portion sizes. Very satisfied.',
    ],
    4: [
      'Good food overall. Could improve the dal a bit.',
      'Lunch was nice. Would appreciate more variety in sabzi.',
      'Breakfast was decent. Bread could be fresher.',
      'Dinner was good but served a little late today.',
      'Satisfied with the meal. Hygiene was maintained well.',
    ],
    3: [
      'Average food today. Taste could be improved.',
      'Rice was slightly overcooked. Hope it improves.',
      'Quantity is okay but quality needs work.',
      'Okay meal but vegetables were not cooked properly.',
      'Service was slow today. Had to wait 15 minutes.',
    ],
    2: [
      'Dal was too watery and rice was undercooked.',
      'Sabzi had very little vegetables. Disappointed.',
      'Breakfast was cold. Please serve hot food.',
      'Not satisfied with today\'s dinner. Needs improvement.',
      'Food quality was poor. Hope management takes note.',
    ],
    1: [
      'Food was completely tasteless today. Very disappointed.',
      'Chapatis were raw and dal was not cooked properly.',
      'This is unacceptable quality. Please improve immediately.',
      'Found a bug in the food! Hygiene issue needs urgent attention.',
      'Worst meal this month. Hoping for better tomorrow.',
    ],
  };

  const suggestions = [
    'Please add more variety on weekends.',
    'South Indian items on Sundays would be great.',
    'Add fresh salad to lunch every day.',
    'Dessert once a week would be wonderful.',
    'Please maintain consistent food quality.',
    'More green vegetables would be healthier.',
    'Breakfast timing should start at 7 AM.',
    null, null, null, // some entries without suggestions
  ];

  const feedbackDocs = [];
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const tags = ['food_quality', 'portion_size', 'temperature', 'late_service', 'cleanliness', 'variety'];

  for (const s of students) {
    // ~3 feedback per student per week over 4 weeks = ~12 total per student
    for (let week = 0; week < 4; week++) {
      for (let j = 0; j < rand(2, 4); j++) {
        const daysBack = rand(week * 7, (week + 1) * 7 - 1);
        const date = daysAgo(daysBack);
        const mealType = pick(mealTypes);
        // Students who are happier get higher ratings
        const baseRating = students.indexOf(s) < 4 ? rand(3, 5) : rand(2, 5);
        const rating = Math.min(5, Math.max(1, baseRating));
        const variance = (v) => Math.min(5, Math.max(1, v + rand(-1, 1)));

        feedbackDocs.push({
          studentId: s._id,
          hostelId: s.hostelId,
          date,
          mealType,
          overallRating: rating,
          categoryRatings: {
            foodQuality: variance(rating),
            taste:       variance(rating),
            quantity:    variance(rating),
            hygiene:     variance(rating),
            service:     variance(rating),
          },
          comments:    pick(feedbackComments[rating]),
          suggestions: pick(suggestions),
          isAnonymous: Math.random() < 0.15,
          status:      pick(['pending', 'pending', 'reviewed', 'resolved']),
          priority:    rating <= 2 ? 'critical' : rating === 3 ? 'high' : rating === 4 ? 'medium' : 'low',
          tags:        [pick(tags), pick(tags)].filter((v, i, a) => a.indexOf(v) === i),
          upvotes:     rand(0, 12),
          isResolved:  false,
        });
      }
    }
  }

  await Feedback.insertMany(feedbackDocs, { ordered: false });
  console.log(`💬  ${feedbackDocs.length} feedback entries created`);

  // ── 9. Summary ───────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('🎉  Demo seed complete!');
  console.log('════════════════════════════════════════');
  console.log('\n🔑  Login credentials:\n');
  console.log('  ADMIN');
  console.log('    Email   : admin@demo.iiita.ac.in');
  console.log('    Password: Admin@1234\n');
  console.log('  MANAGERS (BH-1 / BH-2 / GH-1)');
  console.log('    Email   : manager.bh1@demo.iiita.ac.in');
  console.log('    Email   : manager.bh2@demo.iiita.ac.in');
  console.log('    Email   : manager.gh1@demo.iiita.ac.in');
  console.log('    Password: Manager@1234\n');
  console.log('  STUDENTS (10 total across 3 hostels)');
  console.log('    Emails  : rahul@demo.iiita.ac.in  (IEC2022001)');
  console.log('              aditya@demo.iiita.ac.in (IEC2022002)');
  console.log('              karan@demo.iiita.ac.in  (IIT2022003)');
  console.log('              sneha@demo.iiita.ac.in  (IEC2022005)');
  console.log('              ... and 6 more');
  console.log('    Password: Student@1234');
  console.log('\n════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
