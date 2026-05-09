import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment } from "../api/billAPI.js";

/**
 * PayNow — Razorpay Checkout Integration
 *
 * Flow:
 *   1. Student lands here from PayPendingBills with selectedBills + amount
 *   2. Clicks "Pay ₹X" → creates a Razorpay order on the server
 *   3. Razorpay modal opens → student pays via UPI/Card/Netbanking
 *   4. On success → sends signature to server for HMAC verification
 *   5. Server marks bills as paid only after verification passes
 */

const STATUS = {
  IDLE: "idle",
  CREATING_ORDER: "creating_order",
  CHECKOUT_OPEN: "checkout_open",
  VERIFYING: "verifying",
  SUCCESS: "success",
  FAILED: "failed",
};

export default function PayNow() {
  const location = useLocation();
  const navigate = useNavigate();

  const passedAmount  = location?.state?.amount;
  const selectedBills = location?.state?.selectedBills || [];
  const amountToPay   = parseFloat(passedAmount) || 0;

  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!passedAmount || selectedBills.length === 0) {
      navigate("/pay-pending");
    }
  }, [passedAmount, selectedBills, navigate]);

  const handlePay = async () => {
    setError("");
    setStatus(STATUS.CREATING_ORDER);

    try {
      // ── Step 1: Create Razorpay order on server ──────────────
      const res = await createPaymentOrder(selectedBills);

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to create payment order");
      }

      const { orderId, amount, currency, key } = res.data.data;

      // ── Step 2: Open Razorpay Checkout Modal ─────────────────
      setStatus(STATUS.CHECKOUT_OPEN);

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const options = {
        key,
        amount,
        currency,
        name: "IIITA Mess Portal",
        description: `Mess bill payment — ${selectedBills.length} bill(s)`,
        order_id: orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#1d4ed8",
        },
        handler: async (response) => {
          // ── Step 3: Verify payment on server ───────────────
          setStatus(STATUS.VERIFYING);
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billIds: selectedBills,
            });

            if (verifyRes.data?.success) {
              setStatus(STATUS.SUCCESS);
            } else {
              setStatus(STATUS.FAILED);
              setError("Payment verification failed. Contact the mess office.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            setStatus(STATUS.FAILED);
            setError(
              err.response?.data?.message ||
              "Payment verification failed. Please contact the mess office with your payment details."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setStatus(STATUS.IDLE);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        setStatus(STATUS.FAILED);
        setError(
          response.error?.description ||
          "Payment failed. Please try again."
        );
      });

      rzp.open();

    } catch (err) {
      console.error("Create order error:", err);
      setStatus(STATUS.FAILED);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate payment. Please try again."
      );
    }
  };

  // ── Success Screen ─────────────────────────────────────────────
  if (status === STATUS.SUCCESS) {
    return (
      <PageLayout title="Payment Successful">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Payment Verified!
          </h2>
          <p className="text-neutral-600 mb-6">
            ₹{amountToPay.toFixed(2)} has been paid and your {selectedBills.length} bill(s) have been marked as paid.
          </p>
          <button
            onClick={() => navigate("/bills")}
            className="px-6 py-3 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition"
          >
            View My Bills
          </button>
        </div>
      </PageLayout>
    );
  }

  // ── Main Payment Screen ────────────────────────────────────────
  return (
    <PageLayout
      title="Pay Now"
      subtitle="Complete your payment securely via Razorpay."
    >
      <div className="max-w-md mx-auto">
        {/* Amount Card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 text-center mb-6">
          <p className="text-sm text-neutral-500 mb-1">Amount to Pay</p>
          <h2 className="text-4xl font-bold text-blue-700">
            ₹{amountToPay.toFixed(2)}
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            {selectedBills.length} bill(s) selected
          </p>
        </div>

        {/* Payment Methods Info */}
        <div className="bg-neutral-50 rounded-xl border p-4 mb-6">
          <p className="text-sm font-medium text-neutral-700 mb-2">
            Accepted Payment Methods
          </p>
          <div className="flex gap-3 text-sm text-neutral-600">
            <span className="px-2.5 py-1 bg-white rounded-lg border">💳 UPI</span>
            <span className="px-2.5 py-1 bg-white rounded-lg border">💳 Card</span>
            <span className="px-2.5 py-1 bg-white rounded-lg border">🏦 Netbanking</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={status !== STATUS.IDLE && status !== STATUS.FAILED}
          className={`w-full py-3.5 rounded-xl text-white font-semibold text-base transition ${
            status === STATUS.IDLE || status === STATUS.FAILED
              ? "bg-blue-700 hover:bg-blue-800"
              : "bg-blue-400 cursor-wait"
          }`}
        >
          {status === STATUS.CREATING_ORDER && "Creating order..."}
          {status === STATUS.CHECKOUT_OPEN && "Complete payment in Razorpay..."}
          {status === STATUS.VERIFYING && "Verifying payment..."}
          {(status === STATUS.IDLE || status === STATUS.FAILED) &&
            `Pay ₹${amountToPay.toFixed(2)}`}
        </button>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <span>🔒</span>
          <span>Secured by Razorpay. Your payment details are never stored on our servers.</span>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/pay-pending")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to bill selection
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
