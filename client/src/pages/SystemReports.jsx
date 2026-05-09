import React, { useState, useEffect, useRef } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import StatBadge from "../components/StatBadge.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "../config/api.js";

export default function SystemReports() {

  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);

  // month selector (YYYY-MM) default current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  // KPIs
  const [totalStudents, setTotalStudents] = useState(0);
  const [billsSummary, setBillsSummary] = useState({
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
    partiallyPaidBills: 0,
    overdueBills: 0,
  });

  // Feedback / ratings for selected month
  const [mealRatings, setMealRatings] = useState([]); // [{ _id: 'breakfast', avgRating, count }]

  const BASE = API_BASE_URL;
  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const COLORS = ["#10B981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

  const fetchData = async () => {
    try {
      setLoading(true);

      // parse selected month
      const [yearStr, monthStr] = month.split("-");
      const selYear = Number(yearStr);
      const selMonth = Number(monthStr);

      // 1) total students (overall)
      const studentsP = axios
        .get(`${BASE}/api/bills/students-count`, headers)
        .catch(() => null);

      // 2) bills stats for selected month (monthly breakdown)
      // endpoint used elsewhere in app: /api/bills/stats-all/:month/:year or /api/bills/stats-all
      const billsMonthP = axios
        .get(`${BASE}/api/bills/stats-all/${selMonth}/${selYear}`, headers)
        .catch(() => null);

      // 3) feedback statistics for selected month (meal-wise ratings)
      const feedbackP = axios
        .get(`${BASE}/api/feedback/statistics?month=${selMonth}&year=${selYear}`, headers)
        .catch(() => null);

      const [studentsRes, billsRes, fbRes] = await Promise.all([studentsP, billsMonthP, feedbackP]);

      if (studentsRes && studentsRes.data?.success) {
        setTotalStudents(studentsRes.data.data?.totalStudents || 0);
      } else {
        setTotalStudents(0);
      }

      if (billsRes && billsRes.data?.success) {
        // billsRes.data.data expected: { totalBills, paidBills, unpaidBills, partiallyPaidBills, overdueBills, ... }
        const d = billsRes.data.data;
        setBillsSummary({
          totalBills: d.totalBills || 0,
          paidBills: d.paidBills || 0,
          unpaidBills: d.unpaidBills || 0,
          partiallyPaidBills: d.partiallyPaidBills || 0,
          overdueBills: d.overdueBills || 0,
        });
      } else {
        setBillsSummary({
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0,
          partiallyPaidBills: 0,
          overdueBills: 0,
        });
      }

      if (fbRes && fbRes.data?.success) {
        const data = fbRes.data.data || {};
        setMealRatings(Array.isArray(data.mealWiseRatings) ? data.mealWiseRatings : []);
      } else {
        setMealRatings([]);
      }
    } catch (err) {
      console.error("System reports load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const overallAvgRating = mealRatings.length
    ? (mealRatings.reduce((s, m) => s + (m.avgRating || 0), 0) / mealRatings.length).toFixed(2)
    : "0.00";

  const totalFeedbacks = mealRatings.reduce((s, m) => s + (m.count || 0), 0);

  const pieData = [
    { name: "Paid", value: billsSummary.paidBills || 0 },
    { name: "Unpaid", value: billsSummary.unpaidBills || 0 },
    { name: "Partially Paid", value: billsSummary.partiallyPaidBills || 0 },
    { name: "Overdue", value: billsSummary.overdueBills || 0 },
  ].filter((p) => p.value >= 0);

  const handleDownloadPDF = async () => {
    try {
      const el = containerRef.current;
      if (!el) return alert("Report area not found");
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
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
        <header className="mb-6 flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Reports & Analytics</h1>
            <p className="text-neutral-600 mt-1">Live operational insights: students, billing and feedback for selected month.</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border px-3 py-2 rounded-md"
            />
            <button onClick={handleDownloadPDF} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm">
              Download PDF
            </button>
            <button onClick={fetchData} className="px-3 py-2 rounded-md border text-sm">
              Refresh
            </button>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBadge label="Total Students" value={totalStudents} />
          <StatBadge label="Bills (Month)" value={billsSummary.totalBills || 0} />
          <StatBadge label="Paid (Month)" value={billsSummary.paidBills || 0} />
          <StatBadge label="Pending/Overdue" value={(billsSummary.unpaidBills || 0) + (billsSummary.partiallyPaidBills || 0) + (billsSummary.overdueBills || 0)} />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">Meal-wise Average Ratings ({month})</h3>
            {mealRatings.length === 0 ? (
              <p className="text-neutral-500">No feedback data for this month.</p>
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealRatings.map(m => ({ name: m._id.charAt(0).toUpperCase() + m._id.slice(1), rating: Number(m.avgRating.toFixed(2)), count: m.count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="rating" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 text-sm text-neutral-600">
              <div>Overall Avg Rating: <strong>{overallAvgRating}</strong></div>
              <div>Total Feedbacks: <strong>{totalFeedbacks}</strong></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">Payment Status Distribution ({month})</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} label>
                    {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-neutral-600">
              <div>Total Bills This Month: <strong>{billsSummary.totalBills || 0}</strong></div>
              <div>Collected: <strong>{billsSummary.paidBills || 0}</strong></div>
              <div>Pending/Overdue: <strong>{(billsSummary.unpaidBills || 0) + (billsSummary.partiallyPaidBills || 0) + (billsSummary.overdueBills || 0)}</strong></div>
            </div>
          </div>
        </section>

        {/* Meal ratings table */}
        <section className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Meal Ratings Detail</h3>
          {mealRatings.length === 0 ? (
            <p className="text-neutral-500">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Meal</th>
                    <th className="py-2">Avg Rating</th>
                    <th className="py-2">Feedback Count</th>
                  </tr>
                </thead>
                <tbody>
                  {mealRatings.map((m) => (
                    <tr key={m._id} className="border-b">
                      <td className="py-2 capitalize">{m._id}</td>
                      <td className="py-2">{Number(m.avgRating).toFixed(2)}</td>
                      <td className="py-2">{m.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
