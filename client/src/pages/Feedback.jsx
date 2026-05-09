import React, { useState } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import OutlineButton from "../components/OutlineButton.jsx";
import { Star } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function Feedback() {


  const meals = ["Breakfast", "Lunch", "Dinner"];

  const [feedbackData, setFeedbackData] = useState({
    Breakfast: { rating: 0, comment: "" },
    Lunch: { rating: 0, comment: "" },
    Dinner: { rating: 0, comment: "" },
  });

  const [submitting, setSubmitting] = useState(false); // <-- added

  const handleRating = (meal, rating) => {
    setFeedbackData({
      ...feedbackData,
      [meal]: { ...feedbackData[meal], rating },
    });
  };

  const handleComment = (meal, comment) => {
    setFeedbackData({
      ...feedbackData,
      [meal]: { ...feedbackData[meal], comment },
    });
  };

  // ✅ Submit feedback to backend
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please sign in to submit feedback.");
      return;
    }

    // prepare payloads for meals where user entered something
    const payloads = meals
      .map((meal) => {
        const rating = feedbackData[meal].rating;
        const comment = feedbackData[meal].comment?.trim();
        if (!rating && !comment) return null;

        // server expects lowercase meal types and detailed categoryRatings.
        const overall = rating || 3; // fallback to 3 if only comment provided
        return {
          date: new Date().toISOString(),
          mealType: meal.toLowerCase(), // breakfast/lunch/dinner
          overallRating: overall,
          categoryRatings: {
            foodQuality: overall,
            taste: overall,
            quantity: overall,
            hygiene: overall,
            service: overall,
          },
          comments: comment || "",
          suggestions: "",
          menuItems: [],
          images: [],
          isAnonymous: false,
          tags: [],
        };
      })
      .filter(Boolean);

    if (payloads.length === 0) {
      alert("Please give a rating or write a comment for at least one meal.");
      return;
    }

    setSubmitting(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const results = [];
      for (const p of payloads) {
        const res = await axios.post(`${API_BASE_URL}/api/feedback`, p, {
          headers,
          withCredentials: true,
        });
        results.push(res.data);
      }
      console.log("Submitted Feedback:", feedbackData);
      alert(`✅ Submitted ${results.length} feedback item(s) successfully.`);
      // reset form
      setFeedbackData({
        Breakfast: { rating: 0, comment: "" },
        Lunch: { rating: 0, comment: "" },
        Dinner: { rating: 0, comment: "" },
      });
    } catch (err) {
      console.error("Feedback submit error:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.errors?.map((e) => e.msg).join("\n") ||
          "Failed to submit feedback. Check console for details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Give Feedback"
      subtitle="Rate and share your experience for each meal today."
    >

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <div
              key={meal}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5"
            >
              <h2 className="text-xl font-semibold mb-3">{meal}</h2>

              {/* Rating */}
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer transition ${
                      feedbackData[meal].rating >= star
                        ? "text-blue-600 fill-blue-600"
                        : "text-neutral-400"
                    }`}
                    onClick={() => handleRating(meal, star)}
                  />
                ))}
              </div>

              {/* Comment */}
              <textarea
                className="w-full rounded-lg border border-neutral-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder={`Any comments for ${meal}?`}
                value={feedbackData[meal].comment}
                onChange={(e) => handleComment(meal, e.target.value)}
              />
            </div>
          ))}
        </section>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <PrimaryButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </PrimaryButton>
        </div>
    </PageLayout>
  );
}
