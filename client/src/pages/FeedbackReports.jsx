import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import StatBadge from "../components/StatBadge.jsx";
import { Star, Users, TrendingUp, MessageSquare } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "../config/api.js";

export default function FeedbackAnalytics() {

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ mealWiseRatings: [] });
  const [commentsData, setCommentsData] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  // Get readable month-year name
  const [year, monthNum] = month.split("-").map(Number);
  const monthName = new Date(year, monthNum - 1).toLocaleString("default", { month: "long" });

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const [yearStr, monthStr] = month.split("-");
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        
        const response = await axios.get(
          `${API_BASE_URL}/api/feedback/statistics?month=${m}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalytics(response.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        alert("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [month]);

  // Fetch comments for all meals
  useEffect(() => {
    const fetchAllComments = async () => {
      try {
        setLoadingComments(true);
        const token = localStorage.getItem("token");
        const [yearStr, monthStr] = month.split("-");
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        const start = new Date(year, m - 1, 1).toISOString();
        const end = new Date(year, m, 0).toISOString();

        const mealTypes = ["breakfast", "lunch", "dinner"];
        const results = {};

        await Promise.all(
          mealTypes.map(async (meal) => {
            const res = await axios.get(
              `${API_BASE_URL}/api/feedback/mess?mealType=${meal}&startDate=${start}&endDate=${end}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            results[meal] = res.data.data.filter((f) => f.comments?.trim());
          })
        );

        setCommentsData(results);
      } catch (error) {
        console.error("Error fetching comments:", error);
        alert("Failed to load comments");
      } finally {
        setLoadingComments(false);
      }
    };

    fetchAllComments();
  }, [month]);

  // Derived values
  const overallAverage = analytics.mealWiseRatings.length
    ? (
        analytics.mealWiseRatings.reduce((sum, meal) => sum + meal.avgRating, 0) /
        analytics.mealWiseRatings.length
      ).toFixed(2)
    : "0.00";

  const totalFeedbacks = analytics.mealWiseRatings.reduce((sum, meal) => sum + meal.count, 0);

  const highestRatedMeal = analytics.mealWiseRatings.reduce(
    (highest, current) =>
      !highest || current.avgRating > highest.avgRating ? current : highest,
    null
  );

  const chartData = analytics.mealWiseRatings.map((meal) => ({
    name: meal._id.charAt(0).toUpperCase() + meal._id.slice(1),
    rating: Number(meal.avgRating.toFixed(2)),
    count: meal.count,
  }));

  // PDF Export
  const handleDownloadPDF = async () => {
    try {
      const el = document.getElementById("feedback-analytics-root");
      if (!el) return alert("Analytics area not found");

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
      pdf.save(`feedback-analytics-${month}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF");
    }
  };

  if (loading)
    return <LoadingScreen message="Loading analytics..." />;

  return (
    <PageLayout>
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feedback Reports</h1>
            <p className="text-neutral-600 mt-1">
              Feedback summary for <span className="font-semibold">{monthName} {year}</span>.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border px-3 py-2 rounded-md bg-white shadow-sm"
            />
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Download PDF
            </button>
          </div>
        </header>

        {/* Top Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-10">
          <StatBadge label="Average Rating" value={overallAverage} icon={<Star className="h-5 w-5" />} />
          <StatBadge label="Total Feedback" value={totalFeedbacks} icon={<Users className="h-5 w-5" />} />
          <StatBadge
            label="Top Rated Meal"
            value={highestRatedMeal ? `${highestRatedMeal._id} (${highestRatedMeal.avgRating.toFixed(2)})` : "N/A"}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatBadge
            label="Total Comments"
            value={Object.values(commentsData).flat().length}
            icon={<MessageSquare className="h-5 w-5" />}
          />
        </section>

        {/* Average Rating Chart */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Average Rating per Meal</h2>
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Feedback Volume Chart */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Feedback Count per Meal</h2>
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Meals + Comments */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Meal Feedback Details</h2>
          {loadingComments ? (
            <p className="text-center text-neutral-500">Loading comments...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.mealWiseRatings.map((meal) => (
                <div key={meal._id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-blue-700 capitalize">
                      {meal._id}
                    </h3>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(Math.round(meal.avgRating))].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500" />
                      ))}
                      <span className="text-neutral-700 font-medium ml-2">
                        {meal.avgRating.toFixed(2)} / 5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 mb-4">
                    {meal.count} feedback entries this month
                  </p>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {(commentsData[meal._id] || []).length > 0 ? (
                      commentsData[meal._id].map((feedback, idx) => (
                        <div key={idx} className="border border-neutral-200 rounded-md p-3 bg-neutral-50">
                          <p className="text-sm text-neutral-700">{feedback.comments}</p>
                          <div className="text-xs text-neutral-500 mt-1">
                            {new Date(feedback.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500 italic">No comments yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
    </PageLayout>
  );
}

