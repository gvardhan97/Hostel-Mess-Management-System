import React, { useState, useEffect, useRef } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import StatBadge from "../components/StatBadge.jsx";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "../config/api.js";

const COLORS = ["#10B981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];
const MEAL_COLOR = { breakfast: "#f59e0b", lunch: "#3b82f6", dinner: "#8b5cf6" };

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function SystemReports() {
  const containerRef = useRef(null);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(true);

  const [totalStudents, setTotalStudents] = useState(0);
  const [billsSummary, setBillsSummary] = useState({
    totalBills: 0, paidBills: 0, unpaidBills: 0,
    partiallyPaidBills: 0, overdueBills: 0,
    totalAmount: 0, totalCollected: 0, totalDue: 0,
  });
  const [mealRatings, setMealRatings]     = useState([]);
  const [ratingDist,  setRatingDist]      = useState([]);
  const [avgRatings,  setAvgRatings]      = useState(null);

  const BASE    = API_BASE_URL;
  const token   = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [yearStr, monthStr] = month.split("-");
      const selYear  = Number(yearStr);
      const selMonth = Number(monthStr);

      const [studentsRes, billsRes, fbRes] = await Promise.all([
        axios.get(`${BASE}/api/bills/students-count`, headers).catch(() => null),
        axios.get(`${BASE}/api/bills/stats-all/${selMonth}/${selYear}`, headers).catch(() => null),
        axios.get(`${BASE}/api/feedback/statistics?month=${selMonth}&year=${selYear}`, headers).catch(() => null),
      ]);

      // Students
      setTotalStudents(studentsRes?.data?.data?.totalStudents || 0);

      // Bills
      if (billsRes?.data?.success) {
        const d = billsRes.data.data;
        setBillsSummary({
          totalBills:        d.totalBills        || 0,
          paidBills:         d.paidBills         || 0,
          unpaidBills:       d.unpaidBills        || 0,
          partiallyPaidBills:d.partiallyPaidBills || 0,
          overdueBills:      d.overdueBills       || 0,
          totalAmount:       d.totalAmount        || 0,
          totalCollected:    d.totalCollected     || 0,
          totalDue:          d.totalDue           || 0,
        });
      }

      // Feedback
      if (fbRes?.data?.success) {
        const d = fbRes.data.data || {};
        setMealRatings(Array.isArray(d.mealWiseRatings)    ? d.mealWiseRatings    : []);
        setRatingDist( Array.isArray(d.ratingDistribution) ? d.ratingDistribution : []);
        setAvgRatings(d.averageRatings || null);
      }
    } catch (err) {
      console.error("System reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month]); // eslint-disable-line

  // Derived
  const overallAvgRating = avgRatings?.avgOverallRating
    ? Number(avgRatings.avgOverallRating).toFixed(2)
    : "—";
  const totalFeedbacks = avgRatings?.totalFeedbacks || 0;

  const paymentPieData = [
    { name: "Paid",            value: billsSummary.paidBills },
    { name: "Overdue",         value: billsSummary.overdueBills },
    { name: "Partially Paid",  value: billsSummary.partiallyPaidBills },
    { name: "Unpaid",          value: billsSummary.unpaidBills },
  ].filter((p) => p.value > 0);

  const ratingPieData = ratingDist.map((r) => ({
    name: `${r._id} ★`,
    value: r.count,
  }));

  const mealBarData = mealRatings.map((m) => ({
    name: m._id.charAt(0).toUpperCase() + m._id.slice(1),
    rating: Number(m.avgRating.toFixed(2)),
    count: m.count,
    fill: MEAL_COLOR[m._id] || "#6366f1",
  }));

  const categoryData = avgRatings
    ? [
        { name: "Food Quality", value: Number((avgRatings.avgFoodQuality || 0).toFixed(2)) },
        { name: "Taste",        value: Number((avgRatings.avgTaste       || 0).toFixed(2)) },
        { name: "Quantity",     value: Number((avgRatings.avgQuantity    || 0).toFixed(2)) },
        { name: "Hygiene",      value: Number((avgRatings.avgHygiene     || 0).toFixed(2)) },
        { name: "Service",      value: Number((avgRatings.avgService     || 0).toFixed(2)) },
      ]
    : [];

  const handleDownloadPDF = async () => {
    try {
      const el = containerRef.current;
      if (!el) return alert("Report area not found");
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "pt", format: "a4",
      });
      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const imgProps  = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`system-reports-${month}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF");
    }
  };

  if (loading) return <LoadingScreen message="Loading reports..." />;

  return (
    <PageLayout>
      <div ref={containerRef} id="system-reports-root">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Reports &amp; Analytics</h1>
            <p className="text-neutral-600 mt-1">
              Live operational insights — students, billing and feedback for {month}.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border px-3 py-2 rounded-md text-sm"
            />
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              ⬇ Download PDF
            </button>
            <button
              onClick={fetchData}
              className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* ── KPI Row ── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatBadge label="Total Students"    value={totalStudents} />
          <StatBadge label="Bills (Month)"     value={billsSummary.totalBills} />
          <StatBadge label="Paid"              value={billsSummary.paidBills} />
          <StatBadge label="Overdue"           value={billsSummary.overdueBills} />
          <StatBadge label="Avg Rating"        value={overallAvgRating} />
          <StatBadge label="Total Feedbacks"   value={totalFeedbacks} />
        </section>

        {/* ── Revenue Row ── */}
        {(billsSummary.totalAmount > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-sm text-neutral-500 mb-1">Total Billed</p>
              <p className="text-2xl font-bold text-neutral-800">{fmt(billsSummary.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-sm text-neutral-500 mb-1">Collected</p>
              <p className="text-2xl font-bold text-green-600">{fmt(billsSummary.totalCollected)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-sm text-neutral-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-500">{fmt(billsSummary.totalDue)}</p>
            </div>
          </section>
        )}

        {/* ── Charts Row 1: Payments + Meal Ratings ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Pie */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-1">Payment Status Distribution</h3>
            <p className="text-xs text-neutral-500 mb-4">
              <strong>Paid</strong>: fully settled.&nbsp;
              <strong>Partially Paid</strong>: some amount pending.&nbsp;
              <strong>Overdue</strong>: past due date with balance.&nbsp;
              <strong>Unpaid</strong>: not yet started.&nbsp;
              <strong>Waived</strong>: admin-approved exemption (e.g. scholarship, error).
            </p>
            {paymentPieData.length === 0 ? (
              <p className="text-neutral-400 text-sm py-8 text-center">No bill data for {month}.</p>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label>
                      {paymentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Meal Ratings Bar */}
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-1">Avg Rating by Meal Type</h3>
            <p className="text-xs text-neutral-500 mb-4">
              <strong>Meal Distribution</strong>: average student rating (1–5) per meal.
              Higher = better quality/satisfaction. Based on {totalFeedbacks} feedback entries.
            </p>
            {mealBarData.length === 0 ? (
              <p className="text-neutral-400 text-sm py-8 text-center">No feedback data for {month}.</p>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip formatter={(v, n) => [v, n === "rating" ? "Avg Rating" : n]} />
                    <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
                      {mealBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ── Charts Row 2: Category Breakdown + Rating Distribution ── */}
        {avgRatings && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Category breakdown */}
            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-1">Feedback Category Breakdown</h3>
              <p className="text-xs text-neutral-500 mb-4">
                <strong>How avg daily presence is calculated</strong>: each student's attendance
                is tracked per meal via QR scan. Daily presence = days with ≥1 meal scanned ÷ total days.
                These ratings reflect student perception across 5 dimensions.
              </p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rating distribution pie */}
            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-1">Rating Distribution</h3>
              <p className="text-xs text-neutral-500 mb-4">
                How students rated meals this month (1 = very poor → 5 = excellent).
              </p>
              {ratingPieData.length === 0 ? (
                <p className="text-neutral-400 text-sm py-8 text-center">No data.</p>
              ) : (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ratingPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label>
                        {ratingPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend verticalAlign="bottom" />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Meal Ratings Detail Table ── */}
        <section className="bg-white p-5 rounded-xl shadow-sm border mb-8">
          <h3 className="text-lg font-semibold mb-4">Meal Ratings Detail</h3>
          {mealRatings.length === 0 ? (
            <p className="text-neutral-400 text-sm">No feedback data for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-neutral-500">
                    <th className="py-2 pr-4">Meal</th>
                    <th className="py-2 pr-4">Avg Rating</th>
                    <th className="py-2 pr-4">Feedback Count</th>
                    <th className="py-2">Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {mealRatings.map((m) => (
                    <tr key={m._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 capitalize font-medium">{m._id}</td>
                      <td className="py-2 pr-4">{Number(m.avgRating).toFixed(2)}</td>
                      <td className="py-2 pr-4">{m.count || 0}</td>
                      <td className="py-2">{"★".repeat(Math.round(m.avgRating))}{"☆".repeat(5 - Math.round(m.avgRating))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Billing Summary Table ── */}
        <section className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Billing Summary — {month}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-neutral-500">
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Count</th>
                  <th className="py-2">What it means</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: "Paid",           v: billsSummary.paidBills,          desc: "Full amount settled by the student." },
                  { s: "Partially Paid", v: billsSummary.partiallyPaidBills, desc: "Some amount paid; balance still due." },
                  { s: "Overdue",        v: billsSummary.overdueBills,        desc: "Past due date with outstanding balance." },
                  { s: "Unpaid",         v: billsSummary.unpaidBills,         desc: "No payment made yet; within due date." },
                  { s: "Waived",         v: 0,                               desc: "Admin-approved exemption. Applied via Discount = full amount (scholarship, billing error, etc.)." },
                ].map((row) => (
                  <tr key={row.s} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{row.s}</td>
                    <td className="py-2 pr-4">{row.v}</td>
                    <td className="py-2 text-neutral-500">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
