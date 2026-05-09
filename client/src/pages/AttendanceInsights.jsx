import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import { getMessMonthlyStats } from "../api/attendanceAPI.js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CalendarDays,
  Utensils,
  Palmtree,
  Download,
} from "lucide-react";

// ── Color palette ──────────────────────────────────────────────
const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
};
const MEAL_COLORS = {
  breakfast: "#f59e0b",
  lunch: "#3b82f6",
  dinner: "#6366f1",
};
const PIE_COLORS = ["#f59e0b", "#3b82f6", "#6366f1"];

// ── Helper: short date label (e.g. "05 Apr") ──────────────────
const shortDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
};

// ── KPI card component ─────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent = "blue" }) {
  const bgMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
    teal: "bg-teal-50 text-teal-600",
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${bgMap[accent] || bgMap.blue}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-neutral-900 mt-0.5">{value}</p>
        {sub && (
          <p className="text-xs text-neutral-400 mt-1 truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 rounded-xl ${className}`}
    />
  );
}

// ── Custom Recharts Tooltip ────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-neutral-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}:</span>
          <span className="font-medium">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {p.name?.toLowerCase().includes("pct") || p.name?.toLowerCase().includes("%") ? "%" : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── CSV Export ──────────────────────────────────────────────────
function exportCSV(daily, monthLabel) {
  const headers = [
    "Date",
    "Day",
    "Total Students",
    "Present",
    "On Leave",
    "Absent",
    "Presence %",
    "Avg Meals/Student",
    "Breakfast",
    "Lunch",
    "Dinner",
  ];
  const rows = daily.map((d) => [
    d.date,
    d.dayOfWeek,
    d.totalStudents,
    d.studentsPresent,
    d.studentsOnLeave,
    d.studentsAbsent,
    d.presentPct,
    d.avgMealsPerStudent,
    d.breakfastCount,
    d.lunchCount,
    d.dinnerCount,
  ]);

  const csv =
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance_${monthLabel}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function AttendanceInsights() {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // month input
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  // Data from backend
  const [daily, setDaily] = useState([]);
  const [weekday, setWeekday] = useState([]);
  const [kpis, setKpis] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hostelId = user?.hostelId;

  // ── Load analytics ────────────────────────────────────────────
  const loadAnalytics = async () => {
    if (!hostelId) {
      setError("Manager's hostelId not found. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [y, m] = month.split("-");
      const { data } = await getMessMonthlyStats(hostelId, m, y);
      const result = data.data;

      // Transform daily dates to short labels for charts
      const chartDaily = (result.daily || []).map((d) => ({
        ...d,
        label: shortDate(d.date),
      }));

      // Transform weekday names to short form for chart
      const shortDayMap = {
        Monday: "Mon",
        Tuesday: "Tue",
        Wednesday: "Wed",
        Thursday: "Thu",
        Friday: "Fri",
        Saturday: "Sat",
        Sunday: "Sun",
      };
      const chartWeekday = (result.weekday || []).map((w) => ({
        ...w,
        day: shortDayMap[w.day] || w.day,
      }));

      setDaily(chartDaily);
      setWeekday(chartWeekday);
      setKpis(result.kpis || null);
    } catch (err) {
      console.error("Attendance analytics load error:", err);
      setError(
        err.response?.data?.message || "Failed to load attendance analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "manager" || user?.role === "admin") {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // ── Derived data for pie chart ────────────────────────────────
  const mealPieData = kpis?.mealTotals
    ? [
        { name: "Breakfast", value: kpis.mealTotals.breakfast },
        { name: "Lunch", value: kpis.mealTotals.lunch },
        { name: "Dinner", value: kpis.mealTotals.dinner },
      ]
    : [];

  const monthLabel = (() => {
    const [y, m] = month.split("-");
    return new Date(y, m - 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  })();

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <PageLayout>
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Attendance Insights
          </h1>
          <p className="text-neutral-500 mt-1">
            Monthly analytics for hostel{" "}
            <span className="font-semibold text-neutral-700">
              {hostelId || "—"}
            </span>
          </p>
        </header>

        {/* ── Controls ────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-neutral-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-neutral-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          {daily.length > 0 && (
            <button
              onClick={() => exportCSV(daily, month)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </section>

        {/* ── Error ───────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────── */}
        {loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          </>
        )}

        {/* ── Content (after load) ────────────────────────────── */}
        {!loading && kpis && (
          <>
            {/* ── KPI Cards ─────────────────────────────────── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <KpiCard
                icon={<Users className="h-5 w-5" />}
                label="Avg Daily Presence"
                value={`${kpis.avgDailyPresencePct}%`}
                sub={`Across ${kpis.daysWithData} days with data`}
                accent="blue"
              />
              <KpiCard
                icon={<Utensils className="h-5 w-5" />}
                label="Avg Meals / Student / Day"
                value={kpis.avgMealsPerStudent}
                sub="Out of 3 possible meals"
                accent="green"
              />
              <KpiCard
                icon={<Palmtree className="h-5 w-5" />}
                label="Total Leave Entries"
                value={kpis.totalLeaveDays}
                sub="Student-days on leave"
                accent="amber"
              />
              <KpiCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Peak Day"
                value={
                  kpis.peakDay
                    ? `${kpis.peakDay.presentPct}%`
                    : "—"
                }
                sub={kpis.peakDay ? shortDate(kpis.peakDay.date) : "No data"}
                accent="teal"
              />
              <KpiCard
                icon={<TrendingDown className="h-5 w-5" />}
                label="Lowest Day"
                value={
                  kpis.lowDay
                    ? `${kpis.lowDay.presentPct}%`
                    : "—"
                }
                sub={kpis.lowDay ? shortDate(kpis.lowDay.date) : "No data"}
                accent="rose"
              />
              <KpiCard
                icon={<Utensils className="h-5 w-5" />}
                label="Most Popular Meal"
                value={
                  kpis.mealTotals
                    ? (() => {
                        const { breakfast, lunch, dinner } = kpis.mealTotals;
                        const max = Math.max(breakfast, lunch, dinner);
                        if (max === 0) return "—";
                        if (max === breakfast) return "🌅 Breakfast";
                        if (max === lunch) return "☀️ Lunch";
                        return "🌙 Dinner";
                      })()
                    : "—"
                }
                sub={
                  kpis.mealTotals
                    ? `B: ${kpis.mealTotals.breakfast} · L: ${kpis.mealTotals.lunch} · D: ${kpis.mealTotals.dinner}`
                    : ""
                }
                accent="indigo"
              />
            </section>

            {/* ── Charts Row 1 ──────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Presence Line Chart */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-800 mb-4">
                  Daily Presence Trend
                </h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={daily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="presentPct"
                        name="Presence %"
                        stroke={COLORS.blue}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: COLORS.blue }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meal-wise Stacked Bar (daily) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-800 mb-4">
                  Meal-wise Attendance (Daily)
                </h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="breakfastCount"
                        name="Breakfast"
                        stackId="meals"
                        fill={MEAL_COLORS.breakfast}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="lunchCount"
                        name="Lunch"
                        stackId="meals"
                        fill={MEAL_COLORS.lunch}
                      />
                      <Bar
                        dataKey="dinnerCount"
                        name="Dinner"
                        stackId="meals"
                        fill={MEAL_COLORS.dinner}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ── Charts Row 2 ──────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Weekday Average Presence */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-800 mb-4">
                  Weekday Average Presence
                </h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekday}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="presentPct"
                        name="Presence %"
                        fill={COLORS.green}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meal Popularity Pie */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-800 mb-4">
                  Meal Distribution ({monthLabel})
                </h3>
                <div style={{ height: 280 }} className="flex items-center justify-center">
                  {mealPieData.every((d) => d.value === 0) ? (
                    <p className="text-neutral-400 text-sm">No meal data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {mealPieData.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={PIE_COLORS[idx]}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            {/* ── Daily Details Table ─────────────────────────── */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
              <h3 className="text-base font-semibold text-neutral-800 mb-4">
                Daily Details
              </h3>
              {daily.length === 0 ? (
                <p className="text-neutral-400 text-sm">
                  No attendance data for {monthLabel}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 border-b border-neutral-200">
                        <th className="py-2.5 pr-4 font-medium">Date</th>
                        <th className="py-2.5 pr-4 font-medium">Day</th>
                        <th className="py-2.5 pr-4 font-medium text-right">Students</th>
                        <th className="py-2.5 pr-4 font-medium text-right">Present</th>
                        <th className="py-2.5 pr-4 font-medium text-right">Leave</th>
                        <th className="py-2.5 pr-4 font-medium text-right">Presence %</th>
                        <th className="py-2.5 pr-4 font-medium text-right">🌅 B</th>
                        <th className="py-2.5 pr-4 font-medium text-right">☀️ L</th>
                        <th className="py-2.5 font-medium text-right">🌙 D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((d) => (
                        <tr
                          key={d.date}
                          className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                        >
                          <td className="py-2.5 pr-4">{d.label}</td>
                          <td className="py-2.5 pr-4 text-neutral-500">
                            {d.dayOfWeek?.slice(0, 3)}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {d.totalStudents}
                          </td>
                          <td className="py-2.5 pr-4 text-right font-medium text-green-600">
                            {d.studentsPresent}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-amber-600">
                            {d.studentsOnLeave}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                                d.presentPct >= 75
                                  ? "bg-green-100 text-green-700"
                                  : d.presentPct >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {d.presentPct}%
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {d.breakfastCount}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            {d.lunchCount}
                          </td>
                          <td className="py-2.5 text-right">
                            {d.dinnerCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Empty state ─────────────────────────────────────── */}
        {!loading && !kpis && !error && (
          <div className="text-center py-20 text-neutral-400">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg">Select a month to view attendance analytics</p>
          </div>
        )}
    </PageLayout>
  );
}
