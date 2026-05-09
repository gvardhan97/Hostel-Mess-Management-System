import React, { useState, useEffect, useRef } from "react";
import PageLayout from "../components/PageLayout.jsx";
import { scanToken } from "../api/mealTokenAPI.js";
import { getMyAttendance } from "../api/attendanceAPI.js";
import { useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanMeal() {

  const [searchParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, message, data }
  const [todayMeals, setTodayMeals] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-submit if token is in URL (?token=xyz)
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      handleScan(tokenFromUrl);
    }
    loadTodayAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch today's attendance to show which meals are already scanned
  const loadTodayAttendance = async () => {
    try {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      const { data } = await getMyAttendance(start, end);
      const records = data.data || [];

      if (records.length > 0) {
        setTodayMeals(records[0].meals || []);
      }
    } catch (err) {
      console.error("Failed to load today's attendance:", err);
    }
  };

  // Submit a scanned token to the backend
  const handleScan = async (tokenValue) => {
    if (submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const { data } = await scanToken(tokenValue);
      setResult({
        success: true,
        message: data.message,
        data: data.data,
      });
      // Refresh today's status
      await loadTodayAttendance();
      // Stop camera after successful scan
      stopCamera();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to scan QR code";
      setResult({ success: false, message: msg, data: null });
    } finally {
      setSubmitting(false);
    }
  };

  // Start the built-in camera scanner
  const startCamera = async () => {
    setResult(null);
    setCameraActive(true);

    // Small delay to let the DOM render the container
    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode("qr-reader");
        html5QrRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Extract token from URL if the QR encodes a full URL
            let token = decodedText;
            try {
              const url = new URL(decodedText);
              const t = url.searchParams.get("token");
              if (t) token = t;
            } catch {
              // Not a URL, use as-is
            }
            handleScan(token);
          },
          () => {
            // QR code not found in frame — ignore
          }
        );
      } catch (err) {
        console.error("Camera start error:", err);
        setCameraActive(false);
        setResult({
          success: false,
          message: "Could not access camera. Please check permissions or use the gallery option.",
          data: null,
        });
      }
    }, 100);
  };

  // Stop camera
  const stopCamera = () => {
    if (html5QrRef.current) {
      html5QrRef.current
        .stop()
        .then(() => {
          html5QrRef.current.clear();
          html5QrRef.current = null;
        })
        .catch(() => {});
    }
    setCameraActive(false);
  };

  // Handle file/gallery upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setScanning(true);

    try {
      const html5Qr = new Html5Qrcode("qr-file-reader");
      const decodedText = await html5Qr.scanFile(file, true);

      // Extract token from URL
      let token = decodedText;
      try {
        const url = new URL(decodedText);
        const t = url.searchParams.get("token");
        if (t) token = t;
      } catch {
        // Not a URL, use as-is
      }

      await handleScan(token);
      html5Qr.clear();
    } catch (err) {
      console.error("File scan error:", err);
      setResult({
        success: false,
        message: "Could not read QR code from the image. Make sure it's a clear QR code image.",
        data: null,
      });
    } finally {
      setScanning(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Meal status helpers
  const allMeals = ["breakfast", "lunch", "dinner"];
  const getMealIcon = (type) => {
    switch (type) {
      case "breakfast": return "🌅";
      case "lunch": return "☀️";
      case "dinner": return "🌙";
      default: return "🍽️";
    }
  };

  const isMealScanned = (type) => {
    return todayMeals.some((m) => m.mealType === type && m.isPresent);
  };

  return (
    <PageLayout title="Scan Meal QR" subtitle="Scan the QR code displayed in the mess to mark your attendance.">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Scan Meal QR</h1>
          <p className="text-neutral-600 mt-1">
            Scan the QR code displayed in the mess to mark your attendance.
          </p>
        </header>

        {/* Today's Status */}
        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Today's Attendance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {allMeals.map((meal) => {
              const scanned = isMealScanned(meal);
              return (
                <div
                  key={meal}
                  className={`flex flex-col items-center p-3 rounded-xl border ${
                    scanned
                      ? "bg-green-50 border-green-200"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <span className="text-2xl mb-1">{getMealIcon(meal)}</span>
                  <span className="text-sm font-medium capitalize">{meal}</span>
                  {scanned ? (
                    <span className="text-xs text-green-600 font-medium mt-1">
                      ✅ Present
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 mt-1">
                      Not scanned
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Scanner Options */}
        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Camera Scanner Button */}
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-base"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Open Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-base"
              >
                Stop Camera
              </button>
            )}

            {/* Gallery / File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {scanning ? "Scanning..." : "Select from Gallery"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </section>

        {/* Camera View */}
        {cameraActive && (
          <section className="bg-black rounded-xl overflow-hidden mb-6">
            <div id="qr-reader" style={{ width: "100%" }} ref={scannerRef} />
          </section>
        )}

        {/* Hidden container for file scanning */}
        <div id="qr-file-reader" style={{ display: "none" }} />

        {/* Result */}
        {(result || submitting) && (
          <section
            className={`rounded-xl p-6 text-center ${
              submitting
                ? "bg-blue-50 border border-blue-200"
                : result?.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {submitting ? (
              <>
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-lg font-medium text-blue-700">
                  Marking attendance...
                </p>
              </>
            ) : result?.success ? (
              <>
                <div className="text-5xl mb-3">✅</div>
                <p className="text-xl font-bold text-green-700 mb-1">
                  {result.message}
                </p>
                {result.data && (
                  <p className="text-sm text-green-600">
                    {result.data.mealType &&
                      `${result.data.mealType.charAt(0).toUpperCase() + result.data.mealType.slice(1)}`}{" "}
                    • {result.data.date && new Date(result.data.date).toDateString()}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">❌</div>
                <p className="text-lg font-bold text-red-700 mb-1">
                  Scan Failed
                </p>
                <p className="text-sm text-red-600">{result.message}</p>
              </>
            )}
          </section>
        )}
    </PageLayout>
  );
}
