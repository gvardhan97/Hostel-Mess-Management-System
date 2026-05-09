import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";
import { HOSTELS } from "../constants/index.js";
import loginImg from "../assets/login-illustration.jpg";
import MyLogo from "../assets/logo.png";

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // must match backend expectation (lowercase)
    registrationNumber: "",
    hostelId: "",
    contactNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ✅ Make POST request to backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        form,
        { withCredentials: true } // include credentials if cookies are used
      );

      console.log("Registration Response:", response.data);

      if (response.data.success) {
        alert("✅ Account created successfully!");
        navigate("/signin");
      } else {
        alert(response.data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      alert(
        error.response?.data?.message ||
        "Could not connect to server. Please try again later."
      );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="p-8 sm:p-12 overflow-y-auto">
          <div className="mb-10 flex items-center gap-3">
            <img
              src={MyLogo}
              alt="IIITA Mess"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-semibold tracking-tight text-neutral-800">
              IIITA Mess
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">Create Account</h1>
          <p className="text-neutral-600 mt-2">
            Please fill in the details to sign up.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-sm text-neutral-700">Full Name</label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-neutral-700">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="you@college.edu"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-neutral-700">Password</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm text-neutral-700">Select Role</label>
              <div className="flex items-center gap-4 mt-2 text-sm">
                {[
                  { label: "Student", value: "student" },
                ].map((r) => (
                  <label key={r.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={handleChange}
                      className="text-blue-600 focus:ring-blue-600"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="text-sm text-neutral-700">
                Registration Number
              </label>
              <input
                name="registrationNumber"
                type="text"
                required
                value={form.registrationNumber}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="IIITA2025-0001"
              />
            </div>

            {/* Hostel */}
            <div>
              <label className="text-sm text-neutral-700">Hostel</label>
              <select
                name="hostelId"
                required
                value={form.hostelId}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="" disabled>Select your hostel</option>
                {HOSTELS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>


            {/* Contact Number */}
            <div>
              <label className="text-sm text-neutral-700">Contact Number</label>
              <input
                name="contactNumber"
                type="tel"
                required
                value={form.contactNumber}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="9876543210"
              />
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition"
            >
              Sign Up
            </button>
          </form>

          <p className="text-sm text-neutral-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-blue-700 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Right: Illustration */}
        <div className="hidden lg:block relative">
          <img
            src={loginImg}
            alt="Sign Up Illustration"
            className="absolute inset-0 w-full h-full object-cover rounded-r-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-indigo-600/15 to-purple-600/15 rounded-r-2xl"></div>
        </div>
      </div>
    </div>
  );
}

