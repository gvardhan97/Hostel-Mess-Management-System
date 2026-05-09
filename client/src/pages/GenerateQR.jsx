import React, { useState, useEffect, useRef } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { generateToken, getTokensForDate } from "../api/mealTokenAPI.js";
import QRCode from "qrcode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MEAL_OPTIONS = [
  { value: "breakfast", label: "Breakfast", icon: "🌅", window: "7:00 AM – 10:00 AM" },
  { value: "lunch", label: "Lunch", icon: "☀️", window: "12:00 PM – 3:00 PM" },
  { value: "dinner", label: "Dinner", icon: "🌙", window: "7:00 PM – 10:00 PM" },
];

export default function GenerateQR() {

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [existingTokens, setExistingTokens] = useState([]);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hostelId = user?.hostelId;

  // Build the frontend scan URL from the token
  const buildScanUrl = (token) => {
    const origin = window.location.origin;
    return `${origin}/scan-meal?token=${token}`;
  };

  // Load existing tokens for selected date
  const loadExistingTokens = async () => {
    if (!hostelId) return;
    try {
      const dateStr = selectedDate.toISOString();
      const { data } = await getTokensForDate(hostelId, dateStr);
      setExistingTokens(data.data || []);
    } catch (err) {
      console.error("Failed to load tokens:", err);
    }
  };

  useEffect(() => {
    loadExistingTokens();
    // Reset QR when date changes
    setQrDataUrl(null);
    setTokenInfo(null);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Generate QR for the chosen meal + date
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQrDataUrl(null);
    setTokenInfo(null);

    try {
      const dateStr = selectedDate.toISOString();
      const { data } = await generateToken(dateStr, selectedMeal);
      const token = data.data;
      setTokenInfo(token);

      // Generate QR code image
      const scanUrl = buildScanUrl(token.token);
      const dataUrl = await QRCode.toDataURL(scanUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);

      // Refresh existing tokens list
      await loadExistingTokens();
    } catch (err) {
      console.error("Generate error:", err);
      setError(err.response?.data?.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  // Download QR as PNG
  const handleDownload = () => {
    if (!qrDataUrl || !tokenInfo) return;

    const dateStr = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `${tokenInfo.mealType}_${dateStr}.png`;

    const link = document.createElement("a");
    link.download = filename;
    link.href = qrDataUrl;
    link.click();
  };

  const getMealMeta = (type) => MEAL_OPTIONS.find((m) => m.value === type) || {};

  // Check if a token already exists for the selected meal
  const existsForSelectedMeal = existingTokens.find(
    (t) => t.mealType === selectedMeal
  );

  return (
    <PageLayout title="Generate Meal QR" subtitle="Create a unique QR code for a meal. Print or display it in the mess for students to scan.">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Generate Meal QR</h1>
          <p className="text-neutral-600 mt-1">
            Create a unique QR code for a meal. Print or display it in the mess
            for students to scan.
          </p>
        </header>

        {/* Controls */}
        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Select Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                dateFormat="dd MMM yyyy"
              />
            </div>

            {/* Meal Selector */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Meal Type
              </label>
              <select
                value={selectedMeal}
                onChange={(e) => {
                  setSelectedMeal(e.target.value);
                  setQrDataUrl(null);
                  setTokenInfo(null);
                  setError("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
              >
                {MEAL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.icon} {m.label} ({m.window})
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <div>
              <PrimaryButton onClick={handleGenerate} disabled={loading}>
                {loading
                  ? "Generating..."
                  : existsForSelectedMeal
                  ? "Show Existing QR"
                  : "Generate QR Code"}
              </PrimaryButton>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>
          )}
        </section>

        {/* Generated QR Display */}
        {qrDataUrl && tokenInfo && (
          <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-8 flex flex-col items-center">
            {/* Meal header */}
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">
                {getMealMeta(tokenInfo.mealType).icon}
              </span>
              <h2 className="text-2xl font-bold capitalize">
                {tokenInfo.mealType}
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                {selectedDate.toDateString()} •{" "}
                {getMealMeta(tokenInfo.mealType).window}
              </p>
              <p className="text-neutral-400 text-xs mt-1">
                Hostel: {tokenInfo.hostelId}
              </p>
            </div>

            {/* QR Image */}
            <div className="bg-white border-2 border-dashed border-neutral-300 rounded-2xl p-6 mb-6">
              <img
                src={qrDataUrl}
                alt={`QR Code for ${tokenInfo.mealType}`}
                className="w-64 h-64 mx-auto"
                ref={canvasRef}
              />
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3 mb-6">
              {tokenInfo.isActive ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ● Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  ● Deactivated
                </span>
              )}
              <span className="text-xs text-neutral-400">
                Expires:{" "}
                {new Date(tokenInfo.expiresAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download QR ({tokenInfo.mealType}_{selectedDate.toISOString().split("T")[0]}.png)
            </button>
          </section>
        )}

        {/* Existing tokens for this date */}
        {existingTokens.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-3">
              Tokens Generated for {selectedDate.toDateString()}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {existingTokens.map((t) => {
                const meta = getMealMeta(t.mealType);
                const isExpired = new Date() > new Date(t.expiresAt);
                return (
                  <div
                    key={t._id}
                    className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3"
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{t.mealType}</p>
                      <p className="text-xs text-neutral-500">{meta.window}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        !t.isActive
                          ? "bg-red-100 text-red-700"
                          : isExpired
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {!t.isActive ? "Inactive" : isExpired ? "Expired" : "Active"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
    </PageLayout>
  );
}
