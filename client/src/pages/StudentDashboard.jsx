import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import Card from "../components/Card.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import OutlineButton from "../components/OutlineButton.jsx";
import StatBadge from "../components/StatBadge.jsx";
import { Utensils, Star, ClipboardList, ReceiptIndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getMyBills } from "../api/billAPI.js";
import { API_BASE_URL } from "../config/api.js";


export default function StudentDashboard(){

  const navigate = useNavigate();

  // ✅ Live stats
  const [stats, setStats] = useState({
    mealsThisMonth: 0,
    avgRatingGiven: "0.00",
    pendingBill: "₹0",
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const BASE = API_BASE_URL;
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        const headers = { headers: { Authorization: `Bearer ${token}` } };

        // 1) Attendance monthly summary (student)
        const attP = axios.get(`${BASE}/api/attendance/monthly/${month}/${year}`, headers)
          .then(r => r.data)
          .catch(() => null);

        // 2) Feedbacks by student for month -> compute avg rating
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
        const fbP = axios.get(`${BASE}/api/feedback/my-feedback?startDate=${startDate}&endDate=${endDate}`, headers)
          .then(r => r.data)
          .catch(() => null);

        // 3) Bills -> pending amount
        const billsP = getMyBills({ limit: 200 }).then(r => r.data).catch(() => null);

        const [attRes, fbRes, billsRes] = await Promise.all([attP, fbP, billsP]);

        const newStats = { ...stats };

        // attendance summary -> totalMealsPresent or sum fallback
        if (attRes?.success) {
          const summary = attRes.summary || {};
          const meals = summary.totalMealsPresent ?? 0;
          newStats.mealsThisMonth = meals;
        } else if (attRes?.data && Array.isArray(attRes.data)) {
          const meals = attRes.data.reduce((s, r) => s + (r.totalMealsPresent || 0), 0);
          newStats.mealsThisMonth = meals;
        }

        // feedback avg
        if (fbRes?.success) {
          const items = fbRes.data || [];
          if (items.length > 0) {
            const avg = items.reduce((s, it) => s + (it.overallRating || 0), 0) / items.length;
            newStats.avgRatingGiven = Number(avg || 0).toFixed(2);
          } else {
            newStats.avgRatingGiven = "0.00";
          }
        }

        // pending bills
        if (billsRes?.success) {
          const all = billsRes.data || [];
          const pending = all.filter(b => ["unpaid", "partially_paid", "overdue"].includes(b.paymentStatus));
          const totalPending = pending.reduce((s, b) => s + (b.amountDue ?? b.totalAmount ?? 0), 0);
          newStats.pendingBill = `₹${Math.ceil(Number(totalPending || 0)).toFixed(2)}`;
        }

        setStats(newStats);
      } catch (err) {
        console.error("Failed to load student stats:", err);
      }
    };

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageLayout>
        {/* Greeting */}
        <section className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
              <p className="text-neutral-600 mt-1">
                Manage your meals, feedback, attendance, and payments — all in one place.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <OutlineButton onClick={() => navigate("/help")}>Help</OutlineButton>
              <PrimaryButton onClick={() => navigate("/menu")}>Open Menu</PrimaryButton>
             
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatBadge label="Meals this month" value={stats.mealsThisMonth} icon={<Utensils className='h-5 w-5'/>} />
          <StatBadge label="Avg rating given" value={stats.avgRatingGiven} icon={<Star className='h-5 w-5'/>} />
          <StatBadge label="Pending bill" value={stats.pendingBill} icon={<ReceiptIndianRupee className='h-5 w-5'/>} />
        </section>

        {/* Core Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card
            icon={<Utensils />}
            title="Menu"
            description="View weekly meals"
            actions={<PrimaryButton onClick={() => navigate("/menu")}>Open Menu</PrimaryButton>}
          />
          <Card
            icon={<Star />}
            title="Feedback"
            description="Rate and comment meals"
            actions={<PrimaryButton onClick={() => navigate("/feedback")}>Give Feedback</PrimaryButton>}

          />
          <Card
            icon={<ClipboardList />}
            title="Attendance"
            description="Mark absence and view history"
            actions={<PrimaryButton onClick={() => navigate("/attendance")}>Attendance</PrimaryButton>}
          />
          <Card
            icon={<ReceiptIndianRupee />}
            title="Bills & Payments"
            description="Check dues and pay securely via UPI, card, or netbanking."
            actions={
              <div className="flex gap-3">
                <OutlineButton onClick={() => navigate("/bills")}>View Bills</OutlineButton>
                <PrimaryButton onClick={() => navigate("/pay-pending")}>Pay Now</PrimaryButton>
              </div>
            }
          />
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} IIITA Mess. All rights reserved.
        </footer>
    </PageLayout>
  );
}
