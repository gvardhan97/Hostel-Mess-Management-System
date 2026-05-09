import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import Card from "../components/Card.jsx";
import StatBadge from "../components/StatBadge.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import OutlineButton from "../components/OutlineButton.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

import { 
  Utensils, 
  BarChart2, 
  ClipboardList, 
  FilePieChart,
  QrCode 
} from "lucide-react";

export default function MessManagerDashboard() {

  const navigate = useNavigate();

    const [stats, setStats] = useState({
      avgMealRating: "0.00",
      absenceRequests: 0,
      weeklyMenuCycles: 0,
    });

    useEffect(() => {
      const loadStats = async () => {
        try {
          const BASE = API_BASE_URL;
          const token = localStorage.getItem("token");
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const hostelId = user?.hostelId;
          if (!hostelId || !token) return;
  
          const today = new Date();
          const month = today.getMonth() + 1;
          const year = today.getFullYear();
  
          // Feedback average rating for current month
          const fbPromise = axios.get(
            `${BASE}/api/feedback/statistics?month=${month}&year=${year}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          // Mess attendance for today -> absence (students on leave)
          const attPromise = axios.get(
            `${BASE}/api/attendance/mess/${encodeURIComponent(hostelId)}/${today.toISOString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          // Menus for mess -> count cycles
          const menuPromise = axios.get(
            `${BASE}/api/menu/mess/${encodeURIComponent(hostelId)}?limit=52`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          const [fbRes, attRes, menuRes] = await Promise.allSettled([fbPromise, attPromise, menuPromise]);
  
          const newStats = { ...stats };
  
          if (fbRes.status === "fulfilled" && fbRes.value.data?.success) {
            const avg = fbRes.value.data.data?.averageRatings?.avgOverallRating ?? 0;
            newStats.avgMealRating = Number(avg).toFixed(2);
          }
  
          if (attRes.status === "fulfilled" && attRes.value.data?.success) {
            const studentsOnLeave = attRes.value.data?.statistics?.studentsOnLeave ?? 0;
            newStats.absenceRequests = studentsOnLeave;
          }
  
          if (menuRes.status === "fulfilled" && menuRes.value.data?.success) {
            // menuRes.value.data.count or data array
            const cycles = menuRes.value.data?.count ?? (Array.isArray(menuRes.value.data?.data) ? menuRes.value.data.data.length : 0);
            newStats.weeklyMenuCycles = cycles;
          }
  
          setStats(newStats);
        } catch (err) {
          console.error("Failed to load manager stats:", err);
        }
      };
  
      loadStats();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


  return (
    <PageLayout
      title="Mess Manager Dashboard"
      subtitle="Manage weekly menus, view analytics, and monitor student engagement."
    >

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatBadge
            label="Avg Meal Rating"
            value={stats.avgMealRating}
            icon={<BarChart2 className="h-5 w-5" />}
          />
          <StatBadge
            label="Absence Requests"
            value={stats.absenceRequests}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatBadge
            label="Weekly Menu Cycles"
            value={stats.weeklyMenuCycles}
            icon={<Utensils className="h-5 w-5" />}
          />
        </section>

        {/* Main Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Menu Management */}
          <Card
            icon={<Utensils />}
            title="Weekly Menu Management"
            description="Post or update weekly menu plans for students."
            actions={<PrimaryButton onClick={() => navigate("/manage-menus")}>Manage Menus</PrimaryButton>
            }
            
          />

          {/* Feedback & Analytics */}
          <Card
            icon={<BarChart2 />}
            title="Feedback Analytics"
            description="View consolidated feedback and meal-wise ratings."
            actions={<PrimaryButton onClick={() => navigate("/feedback-analytics")}>View Analytics</PrimaryButton>
            }
          />

          {/* Attendance Tracking */}
          <Card
            icon={<ClipboardList />}
            title="Attendance Insights"
            description="Track student attendance trends and patterns."
            actions={<PrimaryButton onClick={() => navigate("/attendance-insights")}>View Attendance</PrimaryButton>}
            
          />

          {/* Reports */}
          <Card
            icon={<FilePieChart />}
            title="Feedback Reports"
            description="Download monthly or weekly feedback reports."
            actions={<OutlineButton onClick={() => navigate("/feedback-reports")}>Generate Report</OutlineButton>}
          />

          {/* QR Code Generation */}
          <Card
            icon={<QrCode />}
            title="Generate Meal QR"
            description="Create and display unique QR codes for each meal session."
            actions={<PrimaryButton onClick={() => navigate("/generate-qr")}>Generate QR</PrimaryButton>}
          />
        </section>
    </PageLayout>
  );
}
