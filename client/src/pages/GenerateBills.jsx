import React, { useState } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";
import { HOSTELS } from "../constants/index.js";

const MEAL_CONFIG = [
  { key: "breakfast", label: "Breakfast Rate", emoji: "🌅", placeholder: "e.g. 30" },
  { key: "lunch",     label: "Lunch Rate",     emoji: "☀️", placeholder: "e.g. 50" },
  { key: "dinner",    label: "Dinner Rate",    emoji: "🌙", placeholder: "e.g. 40" },
];

export default function GenerateBills() {
  const now = new Date();

  const [formData, setFormData] = useState({
    hostelId: "",
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  });

  const [mealRates, setMealRates] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleRateChange = (meal, value) =>
    setMealRates((prev) => ({ ...prev, [meal]: value }));

  // Estimate: sum of all meal rates × ~26 days (typical working days / month)
  const dailyTotal = MEAL_CONFIG.reduce(
    (sum, m) => sum + (Number(mealRates[m.key]) || 0),
    0
  );
  const estimatedMonthly = dailyTotal * 26;

  const handleGenerate = async () => {
    if (!formData.hostelId) {
      alert("Please select a Hostel.");
      return;
    }
    if (!formData.month) {
      alert("Please select a month.");
      return;
    }

    const parsedRates = {
      breakfast: Number(mealRates.breakfast) || 0,
      lunch:     Number(mealRates.lunch)     || 0,
      dinner:    Number(mealRates.dinner)    || 0,
    };

    if (parsedRates.breakfast <= 0 && parsedRates.lunch <= 0 && parsedRates.dinner <= 0) {
      alert("Please enter at least one meal rate.");
      return;
    }

    const [year, month] = formData.month.split("-").map(Number);

    const payload = {
      hostelId: formData.hostelId,
      month,
      year,
      mealRates: parsedRates,
      fixedCharges: 0,
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/bills/generate-all`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        alert(res.data.message || `✅ Generated ${res.data.data?.generated ?? 0} bills.`);
      } else {
        alert(res.data?.message || "Failed to generate bills.");
      }
    } catch (err) {
      console.error("Generate bills error:", err);
      alert(err.response?.data?.message || "Failed to generate bills. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Generate Mess Bills"
      subtitle="Set meal-wise rates and generate monthly bills for all students in a hostel."
    >
      <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-6 space-y-6 max-w-xl">

        {/* Hostel */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Hostel *
          </label>
          <select
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 bg-white"
            value={formData.hostelId}
            onChange={(e) => handleChange("hostelId", e.target.value)}
          >
            <option value="" disabled>Select hostel</option>
            {HOSTELS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Billing Month *
          </label>
          <input
            type="month"
            className="w-full border border-neutral-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600"
            value={formData.month}
            onChange={(e) => handleChange("month", e.target.value)}
          />
        </div>

        {/* Meal-wise Rates */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Meal Rates (₹ per meal per student) *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {MEAL_CONFIG.map(({ key, label, emoji, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-neutral-500 mb-1">
                  {emoji} {label}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-neutral-300 rounded-lg pl-7 pr-2 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                    placeholder={placeholder}
                    value={mealRates[key]}
                    onChange={(e) => handleRateChange(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Bill = (meals attended × rate per meal). Each student is billed only for meals they actually scanned.
          </p>
        </div>

        {/* Live Preview */}
        {dailyTotal > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">💡 Estimated Bill Preview</p>
            <div className="space-y-1 text-sm text-blue-700">
              {MEAL_CONFIG.map(({ key, label, emoji }) =>
                mealRates[key] > 0 ? (
                  <div key={key} className="flex justify-between">
                    <span>{emoji} {label}</span>
                    <span>₹{mealRates[key]}/meal</span>
                  </div>
                ) : null
              )}
              <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-semibold">
                <span>Daily total (if all meals)</span>
                <span>₹{dailyTotal}</span>
              </div>
              <div className="flex justify-between text-xs text-blue-600">
                <span>Estimated monthly (26 days)</span>
                <span>₹{estimatedMonthly.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Generate Button */}
      <div className="mt-6 flex justify-end max-w-xl">
        <PrimaryButton onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Bills"}
        </PrimaryButton>
      </div>
    </PageLayout>
  );
}
