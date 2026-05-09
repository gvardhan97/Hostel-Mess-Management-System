import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";
import loginImg from "../assets/login-illustration.jpg";
import MyLogo from "../assets/logo.png";

export default function SignIn() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
    remember: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          identifier: form.identifier,
          password: form.password,
        },
        { withCredentials: true }
      );

      console.log("Response:", response.data);

      if (response.status === 200) {
        alert("Login successful!");
        const { user, token } = response.data.data;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        // Redirect based on role
        if (user.role === "student") navigate("/student");
        else if (user.role === "manager") navigate("/manager");
        else if (user.role === "admin") navigate("/admin");
        else navigate("/");
      } else {
        alert(response.data.message || "Login failed!");
      }
    } catch (error) {
      console.error("Login Error:", error);
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
        <div className="p-8 sm:p-12">
          {/* Brand */}
          <div className="mb-10 flex items-center gap-3">
            <img src={MyLogo} alt="IIITA Mess" className="h-8 w-8 object-contain" />
            <span className="text-lg font-semibold tracking-tight text-neutral-800">IIITA Mess </span>
          </div>


          <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-neutral-600 mt-2">
            Please sign in to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="identifier" className="text-sm text-neutral-700">
                Email or Roll Number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={form.identifier}
                onChange={handleChange}
                placeholder="you@iiita.ac.in or IEC2022047"
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm text-neutral-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                />
                Remember me
              </label>
              <Link
                to="#"
                className="text-sm text-blue-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 transition"
            >
              Sign In
            </button>
          </form>

          <p className="text-sm text-neutral-600 mt-6">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-700 font-medium hover:underline cursor-pointer"
            >
              Sign Up
            </span>
          </p>
        </div>

        {/* Right: Illustration panel */}
        <div className="hidden lg:block relative">
          <img
            src={loginImg}
            alt="Login"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
        </div>
      </div>
    </div>
  );
}
