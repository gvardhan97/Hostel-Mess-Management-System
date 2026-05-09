import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "./components/RouteGuards.jsx";

// ── Page imports ────────────────────────────────────────────────
import StudentDashboard from "./pages/StudentDashboard.jsx";
import MessManagerDashboard from "./pages/MessManagerDashboard.jsx";
import HostelAdminDashboard from "./pages/HostelAdminDashboard.jsx";
import Feedback from "./pages/Feedback.jsx";
import Menu from "./pages/Menu.jsx";
import ViewBills from "./pages/ViewBills.jsx";
import Attendance from "./pages/Attendance.jsx";
import ManageMenus from "./pages/ManageMenus.jsx";
import FeedbackAnalytics from "./pages/FeedbackAnalytics.jsx";
import PaymentRecords from "./pages/PaymentRecords.jsx";
import GenerateBills from "./pages/GenerateBills.jsx";
import AttendanceInsights from "./pages/AttendanceInsights.jsx";
import PayPendingBills from "./pages/PayPendingBills.jsx";
import PayNow from "./pages/PayNow.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Help from "./pages/Help.jsx";
import FeedbackReports from "./pages/FeedbackReports.jsx";
import SystemReports from "./pages/SystemReports.jsx";
import UserRoles from "./pages/UserRoles.jsx";
import GenerateQR from "./pages/GenerateQR.jsx";
import ScanMeal from "./pages/ScanMeal.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

export default function App() {
  return (
    <Routes>
      {/* ── Root redirect ─────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/signin" />} />

      {/* ── Guest-only routes (redirect to dashboard if logged in) */}
      <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />

      {/* ── Student routes ────────────────────────────────────── */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute role="student"><Feedback /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute role="student"><ViewBills /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute role="student"><Attendance /></ProtectedRoute>} />
      <Route path="/pay-pending" element={<ProtectedRoute role="student"><PayPendingBills /></ProtectedRoute>} />
      <Route path="/pay-now" element={<ProtectedRoute role="student"><PayNow /></ProtectedRoute>} />
      <Route path="/scan-meal" element={<ProtectedRoute role="student"><ScanMeal /></ProtectedRoute>} />

      {/* ── Manager routes ────────────────────────────────────── */}
      <Route path="/manager" element={<ProtectedRoute role="manager"><MessManagerDashboard /></ProtectedRoute>} />
      <Route path="/manage-menus" element={<ProtectedRoute role={["manager", "admin"]}><ManageMenus /></ProtectedRoute>} />
      <Route path="/feedback-analytics" element={<ProtectedRoute role={["manager", "admin"]}><FeedbackAnalytics /></ProtectedRoute>} />
      <Route path="/attendance-insights" element={<ProtectedRoute role={["manager", "admin"]}><AttendanceInsights /></ProtectedRoute>} />
      <Route path="/payment-records" element={<ProtectedRoute role={["manager", "admin"]}><PaymentRecords /></ProtectedRoute>} />
      <Route path="/feedback-reports" element={<ProtectedRoute role={["manager", "admin"]}><FeedbackReports /></ProtectedRoute>} />
      <Route path="/generate-qr" element={<ProtectedRoute role={["manager", "admin"]}><GenerateQR /></ProtectedRoute>} />

      {/* ── Admin routes ──────────────────────────────────────── */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><HostelAdminDashboard /></ProtectedRoute>} />
      <Route path="/generate-bills" element={<ProtectedRoute role="admin"><GenerateBills /></ProtectedRoute>} />
      <Route path="/system-reports" element={<ProtectedRoute role="admin"><SystemReports /></ProtectedRoute>} />
      <Route path="/user-roles" element={<ProtectedRoute role="admin"><UserRoles /></ProtectedRoute>} />

      {/* ── Shared routes (any authenticated user) ────────────── */}
      <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/me"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* ── 404 ───────────────────────────────────────────────── */}
      <Route path="*" element={<h1 className="p-8 text-2xl">404 • Page not found</h1>} />
    </Routes>
  );
}
