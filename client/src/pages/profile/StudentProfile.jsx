import React from "react";
import { useNavigate } from "react-router-dom";
import { ReceiptIndianRupee, ClipboardList, User, Building2, Phone, Mail, Hash } from "lucide-react";

const STATUS_STYLES = {
  paid:           "bg-green-100 text-green-700",
  partially_paid: "bg-blue-100 text-blue-700",
  unpaid:         "bg-yellow-100 text-yellow-800",
  overdue:        "bg-red-100 text-red-700",
  waived:         "bg-neutral-100 text-neutral-500",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-none">
    <Icon className="h-4 w-4 text-neutral-400 shrink-0" />
    <span className="text-sm text-neutral-500 w-36 shrink-0">{label}</span>
    <span className="text-sm font-medium text-neutral-800">{value || "—"}</span>
  </div>
);

const StatCard = ({ label, value, sub, color = "blue" }) => {
  const colors = {
    blue:   "bg-blue-50 text-blue-700 border-blue-100",
    green:  "bg-green-50 text-green-700 border-green-100",
    red:    "bg-red-50 text-red-700 border-red-100",
    amber:  "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
};

export default function StudentProfile({ data }) {
  const navigate = useNavigate();
  const { user, billStats, recentBills, attendanceThisMonth } = data;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700 shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">{user.name}</h2>
            <p className="text-sm text-neutral-500">{user.registrationNumber || "No roll number"}</p>
            <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {user.isActive ? "● Active" : "● Deactivated"}
            </span>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold capitalize">
            Student
          </span>
        </div>

        <div className="mt-2">
          <InfoRow icon={Mail}     label="Email"       value={user.email} />
          <InfoRow icon={Hash}     label="Roll Number" value={user.registrationNumber} />
          <InfoRow icon={Building2} label="Hostel"     value={user.hostelId} />
          <InfoRow icon={Phone}    label="Contact"     value={user.contactNumber} />
          <InfoRow icon={User}     label="Member since" value={memberSince} />
        </div>
      </div>

      {/* Bill Stats */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
          Bill Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Bills"    value={billStats.total}  color="blue" />
          <StatCard label="Paid"           value={billStats.paid}   color="green" />
          <StatCard label="Pending"        value={billStats.unpaid} color="amber" />
          <StatCard label="Amount Due"     value={`₹${Math.round(billStats.totalDue)}`} color="red" />
        </div>
      </div>

      {/* Attendance This Month */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
          Meals This Month
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Breakfast" value={attendanceThisMonth.breakfast} color="amber" />
          <StatCard label="Lunch"     value={attendanceThisMonth.lunch}     color="blue" />
          <StatCard label="Dinner"    value={attendanceThisMonth.dinner}    color="blue" />
          <StatCard label="Total Meals" value={attendanceThisMonth.total}   color="green" />
        </div>
      </div>

      {/* Recent Bills */}
      {recentBills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
            Recent Bills
          </h3>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm divide-y divide-neutral-100">
            {recentBills.map((bill) => (
              <div key={bill._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{MONTH_NAMES[bill.month - 1]} {bill.year}</p>
                  <p className="text-xs text-neutral-500">₹{bill.totalAmount}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[bill.paymentStatus] || ""}`}>
                  {bill.paymentStatus?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/bills")}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            View all bills →
          </button>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/pay-pending")}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition">
          <ReceiptIndianRupee className="h-4 w-4" /> Pay Pending Bills
        </button>
        <button onClick={() => navigate("/attendance")}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 text-sm font-medium hover:bg-neutral-50 transition">
          <ClipboardList className="h-4 w-4" /> View Attendance
        </button>
      </div>
    </div>
  );
}
