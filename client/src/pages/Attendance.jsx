import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import {
  getMyAttendance,
  registerLeave,
  cancelLeave,
  
} from "../api/attendanceAPI.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

export default function Attendance() {

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // action states
  // const [markingYesterday, setMarkingYesterday] = useState(false); // removed
  const [cancellingId, setCancellingId] = useState(null);

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date(),
    endDate: new Date(),
    leaveReason: "other",
    leaveDescription: "",
  });

  // helper: normalize date to start of day
  const normalize = (d) => {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
  };

  //  Fetch attendance history from backend
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const { data } = await getMyAttendance(start, end);
      setAttendanceHistory(data.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  //  Handle leave form submission
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.leaveReason,
        description: leaveForm.leaveDescription,
      };
      await registerLeave(payload);
      alert("Leave registered successfully!");
      setShowModal(false);
      await fetchAttendance();
    } catch (error) {
      console.error("Error registering leave:", error);
      alert(error.response?.data?.message || "Failed to register leave");
    }
  };

  //  Cancel leave action
  const handleCancelLeave = async (attendanceId) => {
    if (!confirm("Are you sure you want to cancel this leave?")) return;
    try {
      setCancellingId(attendanceId);
      await cancelLeave(attendanceId);
      alert("Leave cancelled successfully.");
      await fetchAttendance();
    } catch (error) {
      console.error("Cancel leave error:", error);
      alert(error.response?.data?.message || "Failed to cancel leave");
    } finally {
      setCancellingId(null);
    }
  };

  // Get today's meals from attendance history
  const getTodayMeals = () => {
    const today = normalize(new Date());
    const todayRecord = attendanceHistory.find((e) => {
      return normalize(e.date).getTime() === today.getTime();
    });
    return todayRecord?.meals || [];
  };

  const todayMeals = getTodayMeals();
  const allMeals = ["breakfast", "lunch", "dinner"];
  const getMealIcon = (type) => {
    switch (type) {
      case "breakfast": return "🌅";
      case "lunch": return "☀️";
      case "dinner": return "🌙";
      default: return "🍽️";
    }
  };
  const isMealScanned = (type) => todayMeals.some((m) => m.mealType === type && m.isPresent);

  if (loading) return <LoadingScreen message="Loading attendance..." />;

  return (
    <PageLayout
      title="Attendance"
      subtitle="Scan the mess QR code to mark your attendance, or apply for leave."
    >

        {/* Today's Meal Status */}
        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Today's Meals
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
                    <span className="text-xs text-green-600 font-medium mt-1">✅ Present</span>
                  ) : (
                    <span className="text-xs text-neutral-400 mt-1">Not scanned</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick actions */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/scan-meal")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Scan QR
            </button>
            <PrimaryButton onClick={() => setShowModal(true)}>Apply for Leave</PrimaryButton>
          </div>
        </div>

        {/* Attendance History */}
        <section className="space-y-3">
          {attendanceHistory.length === 0 ? (
            <p className="text-center text-gray-500">No attendance records found.</p>
          ) : (
            attendanceHistory.map((entry, index) => (
              <div
                key={index}
                className="bg-white border border-neutral-200 shadow-sm rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <span className="text-neutral-800 font-medium block">
                    {new Date(entry.date).toDateString()}
                  </span>
                  {entry.isOnLeave && (
                    <small className="text-gray-500 text-sm block">
                      Reason: {entry.leaveReason?.replace("_", " ")}
                    </small>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      entry.isOnLeave
                        ? "bg-yellow-100 text-yellow-800"
                        : entry.totalMealsPresent > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {entry.isOnLeave ? "On Leave" : entry.totalMealsPresent > 0 ? "Present" : "Absent"}
                  </span>

                  {/* Cancel leave button for leave entries */}
                  {entry.isOnLeave && (
                    <button
                      onClick={() => handleCancelLeave(entry._id)}
                      className="px-3 py-1 rounded-md border text-sm text-red-600 hover:bg-red-50"
                      disabled={cancellingId === entry._id}
                    >
                      {cancellingId === entry._id ? "Cancelling..." : "Cancel Leave"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

      {/* Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Apply for Leave</h2>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                <DatePicker
                  selected={leaveForm.startDate}
                  onChange={(date) => setLeaveForm({ ...leaveForm, startDate: date })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  dateFormat="dd MMM yyyy"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                <DatePicker
                  selected={leaveForm.endDate}
                  onChange={(date) => setLeaveForm({ ...leaveForm, endDate: date })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  dateFormat="dd MMM yyyy"
                />
              </div>

              {/* Reason (enum values from schema) */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Leave Reason</label>
                <select
                  value={leaveForm.leaveReason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveReason: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="home_visit">Home Visit</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                <textarea
                  placeholder="Describe reason (optional)..."
                  value={leaveForm.leaveDescription}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveDescription: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

