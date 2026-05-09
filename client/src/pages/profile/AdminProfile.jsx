import React from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, CheckCircle, Users, User, Mail } from "lucide-react";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-none">
    <Icon className="h-4 w-4 text-neutral-400 shrink-0" />
    <span className="text-sm text-neutral-500 w-36 shrink-0">{label}</span>
    <span className="text-sm font-medium text-neutral-800">{value || "—"}</span>
  </div>
);

const StatCard = ({ label, value, color = "blue" }) => {
  const colors = {
    blue:  "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red:   "bg-red-50 text-red-700 border-red-100",
    purple:"bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
    </div>
  );
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AdminProfile({ data }) {
  const navigate = useNavigate();
  const { user, systemStats } = data;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  const currentMonthLabel = systemStats
    ? `${MONTH_NAMES[systemStats.currentMonth - 1]} ${systemStats.currentYear}`
    : "";

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700 shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">{user.name}</h2>
            <p className="text-sm text-neutral-500">System Administrator</p>
            <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {user.isActive ? "● Active" : "● Deactivated"}
            </span>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
            Admin
          </span>
        </div>

        <div className="mt-2">
          <InfoRow icon={Mail} label="Email"        value={user.email} />
          <InfoRow icon={User} label="Member since" value={memberSince} />
        </div>
      </div>

      {/* System Stats — Users */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
          User Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Students" value={systemStats?.totalStudents || 0} color="blue" />
          <StatCard label="Total Managers" value={systemStats?.totalManagers || 0} color="purple" />
        </div>
      </div>

      {/* System Stats — Billing this month */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
          Billing — {currentMonthLabel}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Bills"  value={systemStats?.totalBills  || 0} color="blue" />
          <StatCard label="Paid"         value={systemStats?.paidBills   || 0} color="green" />
          <StatCard label="Unpaid"       value={systemStats?.unpaidBills || 0} color={systemStats?.unpaidBills > 0 ? "red" : "green"} />
          <StatCard label="Revenue"      value={`₹${Math.round(systemStats?.totalRevenue || 0)}`} color="green" />
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/generate-bills")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 transition">
            <FileSpreadsheet className="h-4 w-4" /> Generate Bills
          </button>
          <button onClick={() => navigate("/payment-records")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 text-sm font-medium hover:bg-neutral-50 transition">
            <CheckCircle className="h-4 w-4" /> Payment Records
          </button>
          <button onClick={() => navigate("/user-roles")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 text-sm font-medium hover:bg-neutral-50 transition">
            <Users className="h-4 w-4" /> Manage Roles
          </button>
        </div>
      </div>
    </div>
  );
}
