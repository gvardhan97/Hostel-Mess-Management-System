import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function UserRoles() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const roles = ["student", "manager", "admin"];

  // Backend base URL
  const BASE_URL = API_BASE_URL;

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await axios.get(`${BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setUsers(res.data.data || []);
        } else {
          alert("Failed to load users");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("Server error while fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update user role locally
  const updateRole = (id, newRole) => {
    setUsers((prev) =>
      prev.map((user) => (user._id === id ? { ...user, role: newRole } : user))
    );
  };

  // Save updated roles to backend
  const saveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      for (const user of users) {
        await axios.put(
          `${BASE_URL}/api/users/${user._id}/role`,
          { role: user.role },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert("✅ Roles updated successfully!");
    } catch (err) {
      console.error("Error updating roles:", err);
      alert("Failed to update roles on server");
    }
  };

  if (loading) return <LoadingScreen message="Loading users..." />;

  return (
    <PageLayout title="User Roles & Permissions" subtitle="Assign and modify user access roles across the system.">


        <section className="bg-white border border-neutral-200 shadow-sm rounded-xl p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-neutral-600 text-sm border-b">
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b last:border-none">
                  <td className="py-3 font-medium">{user.name}</td>
                  <td className="py-3 text-neutral-700">{user.email}</td>
                  <td className="py-3">
                    <select
                      className="border border-neutral-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-600"
                      value={user.role}
                      onChange={(e) => updateRole(user._id, e.target.value)}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
            <button
              onClick={saveChanges}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </section>
    </PageLayout>
  );
}
