import React, { useState, useRef } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { getMessBills } from "../api/billAPI.js";
import { HOSTELS } from "../constants/index.js";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

// ── Constants ────────────────────────────────────────────────────
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
  waived:         "bg-neutral-100 text-neutral-500",
};

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ── Discount / Waiver Modal ──────────────────────────────────────
function DiscountModal({ bill, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState("");
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Use a ref so handleSubmit always reads the latest value synchronously
  const amountRef = useRef("");
  const reasonRef = useRef("");

  const updateAmount = (val) => { setAmount(val); amountRef.current = val; };
  const updateReason = (val) => { setReason(val); reasonRef.current = val; };

  const handleWaiveFull = () => {
    const fullAmt = String(bill.totalAmount);
    const fullReason = "Full waiver – admin approved";
    updateAmount(fullAmt);
    updateReason(fullReason);
  };

  const handleSubmit = async () => {
    const disc = Number(amountRef.current || amount);
    const rsn  = (reasonRef.current || reason).trim();

    if (!disc || disc <= 0) return setError("Enter a valid discount amount.");
    if (disc > bill.totalAmount + 0.01)
      return setError(`Discount (${fmt(disc)}) cannot exceed bill total (${fmt(bill.totalAmount)}).`);
    if (!rsn) return setError("Please enter a reason.");

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/bills/${bill._id}/discount`,
        { discount: disc, discountReason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        onSuccess(`Discount of ${fmt(disc)} applied to ${bill.studentId?.name}'s bill.`);
      } else {
        setError(res.data?.message || "Failed to apply discount.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply discount.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">💸 Apply Discount / Waiver</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">
            ✕
          </button>
        </div>

        {/* Student info */}
        <div className="bg-neutral-50 border rounded-xl p-4 mb-5 text-sm">
          <p className="font-semibold text-base text-neutral-800">{bill.studentId?.name}</p>
          <p className="text-neutral-500 mt-0.5">
            {bill.studentId?.registrationNumber} · {bill.month}/{bill.year}
          </p>
          <div className="flex gap-4 mt-3 flex-wrap text-sm">
            <span>Total: <strong>{fmt(bill.totalAmount)}</strong></span>
            <span>Paid: <strong className="text-green-600">{fmt(bill.amountPaid)}</strong></span>
            <span>Due: <strong className="text-red-500">{fmt(bill.amountDue)}</strong></span>
          </div>
        </div>

        {/* One-click full waiver */}
        <button
          type="button"
          onClick={handleWaiveFull}
          className="w-full mb-5 py-2.5 rounded-xl border-2 border-dashed border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
        >
          ⚡ Waive Full Bill ({fmt(bill.totalAmount)})
        </button>

        {/* Amount input */}
        <label className="block text-sm font-medium text-neutral-700 mb-1">Discount Amount (₹)</label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
          <input
            type="number"
            min="0"
            max={bill.totalAmount}
            value={amount}
            onChange={(e) => updateAmount(e.target.value)}
            placeholder={`Max ${fmt(bill.totalAmount)}`}
            className="w-full border rounded-xl pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Reason chips */}
        <label className="block text-sm font-medium text-neutral-700 mb-2">Reason *</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {["Scholarship / merit", "Medical leave", "Billing error", "Mess closure", "Other"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => updateReason(r)}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                reason === r
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={reason}
          onChange={(e) => updateReason(e.target.value)}
          placeholder="Or type a custom reason..."
          className="w-full border rounded-xl px-3 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {loading ? "Applying..." : "Apply Discount"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function PaymentRecords() {
  const [loading,  setLoading]  = useState(false);
  const [bills,    setBills]    = useState([]);
  const [hostelId, setHostelId] = useState("");
  const [filter,   setFilter]   = useState("All");
  const [search,   setSearch]   = useState("");
  const [discountBill, setDiscountBill] = useState(null);
  const [toast,        setToast]        = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadBills = async () => {
    if (!hostelId) return alert("Please select a hostel.");
    try {
      setLoading(true);
      const res = await getMessBills(hostelId, { limit: 500 });
      setBills(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load bills.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountSuccess = (msg) => {
    setDiscountBill(null);
    showToast(msg);
    loadBills();
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
    .sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);

  const summary = bills.reduce((acc, b) => {
    acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  const totalCollected = bills
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + (b.totalAmount || 0), 0);

  const totalOutstanding = bills
    .filter((b) => ["unpaid", "overdue", "partially_paid"].includes(b.paymentStatus))
    .reduce((s, b) => s + (b.amountDue || 0), 0);

  return (
    <PageLayout
      title="Payment Status & Records"
      subtitle="View, filter and manage student bills. Apply discounts or full waivers per student."
    >
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✅ {toast}
        </div>
      )}

      {/* Modal */}
      {discountBill && (
        <DiscountModal
          bill={discountBill}
          onClose={() => setDiscountBill(null)}
          onSuccess={handleDiscountSuccess}
        />
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={hostelId}
          onChange={(e) => setHostelId(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[180px]"
        >
          <option value="" disabled>Select hostel</option>
          {HOSTELS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <PrimaryButton onClick={loadBills} disabled={loading}>
          {loading ? "Loading..." : "Load Bills"}
        </PrimaryButton>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-lg text-sm"
        >
          {STATUS_OPTIONS.map((f) => (
            <option key={f} value={f}>{STATUS_LABELS[f]}</option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Search name / reg no / month..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg w-56 text-sm"
        />
      </div>

      {/* KPI row */}
      {bills.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Total Bills</p>
              <p className="text-2xl font-bold">{bills.length}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Collected</p>
              <p className="text-2xl font-bold text-green-600">{fmt(totalCollected)}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-500">{fmt(totalOutstanding)}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Waived</p>
              <p className="text-2xl font-bold text-neutral-400">{summary["waived"] || 0}</p>
            </div>
          </div>

          {/* Status filter badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {Object.entries(summary).map(([status, count]) => (
              <div
                key={status}
                onClick={() => setFilter(filter === status ? "All" : status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer select-none transition
                  ${filter === status ? "ring-2 ring-offset-1 ring-blue-500" : ""}
                  ${STATUS_STYLES[status] || "bg-neutral-100 text-neutral-600"}`}
              >
                {STATUS_LABELS[status] || status}: {count}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bill list */}
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
              className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5 flex flex-wrap justify-between items-center gap-4"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="text-base font-semibold">{bill.studentId?.name ?? "Student"}</h3>
                  <span className="text-sm text-neutral-400">{bill.studentId?.registrationNumber ?? ""}</span>
                  <span className="text-sm text-neutral-300">| {bill.month}/{bill.year}</span>
                </div>
                <div className="flex gap-4 mt-1.5 text-sm text-neutral-600 flex-wrap">
                  <span>Total: <strong>{fmt(bill.totalAmount)}</strong></span>
                  <span>Paid: <strong className="text-green-700">{fmt(bill.amountPaid)}</strong></span>
                  {bill.amountDue > 0 && (
                    <span>Due: <strong className="text-red-600">{fmt(bill.amountDue)}</strong></span>
                  )}
                  {bill.discount > 0 && (
                    <span className="text-purple-600">
                      Discount: <strong>{fmt(bill.discount)}</strong>
                      {bill.discountReason && (
                        <span className="text-neutral-400 font-normal"> ({bill.discountReason})</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[bill.paymentStatus] || "bg-neutral-100 text-neutral-600"}`}>
                  {STATUS_LABELS[bill.paymentStatus] || bill.paymentStatus}
                </span>

                {!["paid", "waived"].includes(bill.paymentStatus) && (
                  <button
                    onClick={() => setDiscountBill(bill)}
                    className="px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 text-xs font-semibold hover:bg-purple-50 transition"
                  >
                    💸 Discount / Waive
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </PageLayout>
  );
}
