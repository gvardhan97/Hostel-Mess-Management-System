import React, { useState } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { getMessBills } from "../api/billAPI.js";
import { HOSTELS } from "../constants/index.js";

const STATUS_OPTIONS = ["All", "paid", "partially_paid", "unpaid", "overdue", "waived"];

const STATUS_LABELS = {
  All: "All",
  paid: "Paid",
  partially_paid: "Partially Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  waived: "Waived",
};

const STATUS_STYLES = {
  paid:           "bg-green-100 text-green-700",
  partially_paid: "bg-blue-100 text-blue-700",
  unpaid:         "bg-yellow-100 text-yellow-800",
  overdue:        "bg-red-100 text-red-700",
  waived:         "bg-neutral-100 text-neutral-600",
};

export default function PaymentRecords() {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [hostelId, setHostelId] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadBills = async () => {
    if (!hostelId) {
      alert("Please select a Hostel.");
      return;
    }
    try {
      setLoading(true);
      const res = await getMessBills(hostelId, { limit: 500 });
      if (res.data?.success) {
        setBills(res.data.data || []);
      } else {
        setBills([]);
        alert(res.data?.message || "Failed to load bills");
      }
    } catch (err) {
      console.error("Load bills error:", err);
      alert(err.response?.data?.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const filtered = bills
    .filter((b) => {
      if (filter !== "All" && b.paymentStatus !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.studentId?.name || "").toLowerCase().includes(q) ||
        (b.studentId?.registrationNumber || "").toLowerCase().includes(q) ||
        `${b.month}/${b.year}`.includes(q)
      );
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

  // Summary counts
  const summary = bills.reduce((acc, b) => {
    acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageLayout
      title="Payment Status & Records"
      subtitle="View and manage student bills and payment status for each hostel."
    >
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-wrap gap-3 items-center">
        {/* Hostel Dropdown */}
        <select
          value={hostelId}
          onChange={(e) => setHostelId(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white min-w-[180px]"
        >
          <option value="" disabled>Select hostel</option>
          {HOSTELS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <PrimaryButton onClick={loadBills} disabled={loading}>
          {loading ? "Loading..." : "Load Bills"}
        </PrimaryButton>

        {/* Status filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-md text-sm"
        >
          {STATUS_OPTIONS.map((f) => (
            <option key={f} value={f}>{STATUS_LABELS[f]}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="search"
          placeholder="Search student / reg no / month..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-md w-56 text-sm"
        />
      </div>

      {/* Summary badges */}
      {bills.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="px-3 py-1.5 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700">
            Total: {bills.length}
          </div>
          {Object.entries(summary).map(([status, count]) => (
            <div
              key={status}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${STATUS_STYLES[status] || ""}`}
              onClick={() => setFilter(filter === status ? "All" : status)}
            >
              {STATUS_LABELS[status] || status}: {count}
            </div>
          ))}
        </div>
      )}

      {/* Bill List */}
      {loading ? (
        <p className="text-center py-10 text-neutral-500">Loading bills...</p>
      ) : bills.length === 0 ? (
        <p className="text-center text-neutral-400 py-12">
          {hostelId ? "No bills found for this hostel." : "Select a hostel and click Load Bills."}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-neutral-400 py-8">No bills match the current filter.</p>
      ) : (
        <section className="space-y-3">
          {filtered.map((bill) => (
            <div
              key={bill._id}
              className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 flex justify-between items-center"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-base font-semibold">
                    {bill.studentId?.name ?? "Student"}
                  </h3>
                  <span className="text-sm text-neutral-500">
                    {bill.studentId?.registrationNumber ?? ""}
                  </span>
                  <span className="text-sm text-neutral-400">
                    | {bill.month}/{bill.year}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-sm text-neutral-600">
                  <span>Total: <strong>₹{(bill.totalAmount ?? 0).toFixed(2)}</strong></span>
                  <span>Paid: <strong className="text-green-700">₹{(bill.amountPaid ?? 0).toFixed(2)}</strong></span>
                  {bill.amountDue > 0 && (
                    <span>Due: <strong className="text-red-600">₹{(bill.amountDue ?? 0).toFixed(2)}</strong></span>
                  )}
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  STATUS_STYLES[bill.paymentStatus] || "bg-neutral-100 text-neutral-600"
                }`}
              >
                {STATUS_LABELS[bill.paymentStatus] || bill.paymentStatus}
              </span>
            </div>
          ))}
        </section>
      )}
    </PageLayout>
  );
}
