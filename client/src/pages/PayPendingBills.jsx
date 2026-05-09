import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import { getMyBills } from "../api/billAPI.js";
import { useNavigate } from "react-router-dom";

export default function PayPendingBills() {

  const [pendingBills, setPendingBills] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMyBills({ paymentStatus: "unpaid", limit: 200 });
        if (res.data?.success) {
          // backend returns all bills; filter pending statuses
          const all = res.data.data || [];
          const pending = all.filter((b) =>
            ["unpaid", "partially_paid", "overdue"].includes(b.paymentStatus)
          );
          setPendingBills(pending);
        } else {
          setPendingBills([]);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load pending bills");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalAmount = pendingBills
    .filter((b) => selected.includes(b._id))
    .reduce((sum, b) => sum + (Math.round(b.totalAmount) || 0), 0);

  if (loading) return <LoadingScreen message="Loading pending bills..." />;

  return (
    <PageLayout title="Pay Pending Bills" subtitle="Select the pending bills you want to pay and proceed.">

        {pendingBills.length === 0 ? (
          <p className="text-center text-green-600 font-medium">
            ✅ All bills are paid! No pending payments.
          </p>
        ) : (
          <>
            <section className="space-y-4">
              {pendingBills.map((bill) => (
                <div
                  key={bill._id}
                  className={`flex items-center justify-between p-5 rounded-xl border shadow-sm cursor-pointer transition ${
                    selected.includes(bill._id)
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white"
                  }`}
                  onClick={() => toggleSelect(bill._id)}
                >
                  <div>
                    <h3 className="font-semibold text-lg">
                      {bill.month}/{bill.year}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      Amount: ₹{Math.round(bill.totalAmount)?.toFixed?.(2) ?? Math.round(bill.totalAmount)}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected.includes(bill._id)}
                    onChange={() => toggleSelect(bill._id)}
                    className="h-5 w-5 accent-blue-600 cursor-pointer"
                  />
                </div>
              ))}
            </section>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-lg font-semibold">
                Total:{" "}
                <span className="text-blue-700">
                  {totalAmount > 0 ? `₹${totalAmount.toFixed(2)}` : "₹0"}
                </span>
              </div>

              <button
                disabled={selected.length === 0}     
                onClick={() =>  navigate("/pay-now", {state: { amount: totalAmount.toFixed(2), selectedBills: selected },  })}
                className={`px-6 py-3 rounded-lg text-white text-sm font-medium transition ${
                  selected.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                Pay Now
              </button>
            </div>
          </>
        )}
    </PageLayout>
  );
}
