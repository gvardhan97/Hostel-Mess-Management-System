import React, { useState, useEffect } from "react";
import PageLayout from "../../components/PageLayout.jsx";
import LoadingScreen from "../../components/LoadingScreen.jsx";
import StudentProfile from "./StudentProfile.jsx";
import ManagerProfile from "./ManagerProfile.jsx";
import AdminProfile from "./AdminProfile.jsx";
import axios from "axios";
import { API_BASE_URL } from "../../config/api.js";

export default function ProfilePage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError("Failed to load profile.");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <LoadingScreen message="Loading your profile..." />;

  if (error) {
    return (
      <PageLayout title="My Profile">
        <div className="text-center py-12 text-red-600">{error}</div>
      </PageLayout>
    );
  }

  const roleLabels = { student: "Student Profile", manager: "Manager Profile", admin: "Admin Profile" };
  const roleSubtitles = {
    student: "Your account details, bill history and meal activity.",
    manager: "Your account details and hostel management overview.",
    admin:   "Your account details and system-wide statistics.",
  };

  return (
    <PageLayout
      title={roleLabels[user.role] || "My Profile"}
      subtitle={roleSubtitles[user.role] || ""}
    >
      {user.role === "student" && <StudentProfile data={data} />}
      {user.role === "manager" && <ManagerProfile data={data} />}
      {user.role === "admin"   && <AdminProfile   data={data} />}
    </PageLayout>
  );
}
