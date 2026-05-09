import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import StatBadge from "../components/StatBadge.jsx";
import { Star, Users, TrendingUp, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function FeedbackAnalytics() {

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    mealWiseRatings: [],
  });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const today = new Date();
        
        const response = await axios.get(
          `${API_BASE_URL}/api/feedback/statistics?month=${today.getMonth() + 1}&year=${today.getFullYear()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
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
  }, []);

  // Fetch comments for selected meal
  const fetchMealComments = async (mealType) => {
    try {
      setLoadingComments(true);
      const token = localStorage.getItem("token");
      const today = new Date();
      const response = await axios.get(
        `${API_BASE_URL}/api/feedback/mess?mealType=${mealType}&startDate=${new Date(today.getFullYear(), today.getMonth(), 1).toISOString()}&endDate=${new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setComments(response.data.data.filter(f => f.comments?.trim()));
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // Calculate stats
  const overallAverage = analytics.mealWiseRatings.length 
    ? (analytics.mealWiseRatings.reduce((sum, meal) => sum + meal.avgRating, 0) / analytics.mealWiseRatings.length).toFixed(2)
    : "0.00";

  const totalFeedbacks = analytics.mealWiseRatings.reduce((sum, meal) => sum + meal.count, 0);

  const highestRatedMeal = analytics.mealWiseRatings.reduce(
    (highest, current) => 
      !highest || current.avgRating > highest.avgRating ? current : highest, 
    null
  );

  const chartData = analytics.mealWiseRatings.map(meal => ({
    name: meal._id.charAt(0).toUpperCase() + meal._id.slice(1),
    rating: Number(meal.avgRating.toFixed(2))
  }));

  // Comments Modal
  const CommentsModal = ({ meal, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold capitalize">
            {meal} Comments
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {loadingComments ? (
            <p className="text-center py-4">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-neutral-500 py-4">No comments found for this meal.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((feedback, idx) => (
                <div key={idx} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[...Array(feedback.overallRating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span className="text-sm text-neutral-500">
                      {new Date(feedback.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-neutral-700">{feedback.comments}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingScreen message="Loading analytics..." />;

  return (
    <PageLayout
      title="Feedback Analytics"
      subtitle="View consolidated feedback trends and meal-wise ratings."
    >

        {/* Top Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatBadge 
            label="Average Rating" 
            value={overallAverage} 
            icon={<Star className="h-5 w-5" />} 
          />
          <StatBadge 
            label="Total Feedback" 
            value={totalFeedbacks} 
            icon={<Users className="h-5 w-5" />} 
          />
          <StatBadge 
            label="Top Rated Meal" 
            value={highestRatedMeal ? `${highestRatedMeal._id} (${highestRatedMeal.avgRating.toFixed(2)})` : "N/A"} 
            icon={<TrendingUp className="h-5 w-5" />} 
          />
        </section>

        {/* Meal Wise Ratings */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Meal-wise Ratings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {analytics.mealWiseRatings.map((meal) => (
              <div 
                key={meal._id} 
                className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => {
                  setSelectedMeal(meal._id);
                  fetchMealComments(meal._id);
                }}
              >
                <h3 className="text-lg font-medium text-blue-700 capitalize">
                  {meal._id}
                </h3>
                <p className="mt-2 text-neutral-700 flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 
                  {meal.avgRating.toFixed(2)} / 5
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {meal.count} ratings
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Rating Chart */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="rating" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Comments Modal */}
        {selectedMeal && (
          <CommentsModal 
            meal={selectedMeal} 
            onClose={() => {
              setSelectedMeal(null);
              setComments([]);
            }} 
          />
        )}
    </PageLayout>
  );
}



