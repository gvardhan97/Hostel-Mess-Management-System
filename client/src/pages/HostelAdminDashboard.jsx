import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import Card from "../components/Card.jsx";
import StatBadge from "../components/StatBadge.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import OutlineButton from "../components/OutlineButton.jsx";
import { useNavigate } from "react-router-dom";
import { getTotalStudentCount, getAllBillsStats } from "../api/billAPI.js";

import { 
  ReceiptIndianRupee, 
  CheckCircle, 
  BarChart3, 
  Users, 
  UserCog 
} from "lucide-react";

export default function HostelAdminDashboard() {

  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch total students
        const studentsRes = await getTotalStudentCount();
        const totalStudents = studentsRes.data?.data?.totalStudents || 0;

        // Fetch all bills stats
        const billsRes = await getAllBillsStats();
        const billsData = billsRes.data?.data || {};

        setStats({
          totalStudents,
          totalBills: billsData.totalBills || 0,
          paidBills: billsData.paidBills || 0,
          unpaidBills: (billsData.unpaidBills || 0) + (billsData.partiallyPaidBills || 0) + (billsData.overdueBills || 0),
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      }
    };
    loadStats();
  }, []);

  return (
    <PageLayout
      title="Hostel Administrator Dashboard"
      subtitle="Manage hostel billing, payments, system reports, and user access."
    >

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatBadge 
            label="Total Students" 
            value={stats.totalStudents} 
            icon={<Users className="h-5 w-5" />} 
          />
          <StatBadge 
            label="Total Bills" 
            value={stats.totalBills} 
            icon={<ReceiptIndianRupee className="h-5 w-5" />} 
          />
          <StatBadge 
            label="Paid Bills" 
            value={stats.paidBills} 
            icon={<CheckCircle className="h-5 w-5" />} 
          />
          <StatBadge 
            label="Unpaid/Pending" 
            value={stats.unpaidBills} 
            icon={<ReceiptIndianRupee className="h-5 w-5" />} 
          />
        </section>

        {/* Main Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Bills */}
          <Card
            icon={<ReceiptIndianRupee />}
            title="Generate Mess Bills"
            description="Create and distribute monthly bills for all students."
            actions={<PrimaryButton onClick={() => navigate("/generate-bills")}>Generate Bills</PrimaryButton>}
          />

          {/* Track Payments */}
          <Card
            icon={<CheckCircle />}
            title="Payment Status & Records"
            description="Monitor student payment completion and maintain records."
            actions={<PrimaryButton onClick={() => navigate("/payment-records")}>View Payments</PrimaryButton>}
          />

          {/* Reports */}
          <Card
            icon={<BarChart3 />}
            title="System Reports & Analytics"
            description="Access overall system insights and performance analytics."
            actions={<PrimaryButton onClick={() => navigate("/system-reports")}>View Reports</PrimaryButton>}    
          />

          {/* Manage Roles & Permissions */}
          <Card
            icon={<UserCog />}
            title="User Roles & Permissions"
            description="Assign and modify user access roles across the system."
            actions={<PrimaryButton onClick={() => navigate("/user-roles")}>Manage Roles</PrimaryButton>}
          />
        </section>

    </PageLayout>
  );
}
