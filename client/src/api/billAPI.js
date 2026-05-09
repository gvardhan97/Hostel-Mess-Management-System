import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const API = `${API_BASE_URL}/api/bills`;

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Get current student's bills with optional query params: { year, page, limit, paymentStatus }
export const getMyBills = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/my-bills${qs ? `?${qs}` : ""}`;
  return axios.get(url, authHeaders());
};
export const markBillsAsPaid = async (billIds, transactionId = "") => {
  return axios.put(`${API}/mark-paid`, { billIds, transactionId }, authHeaders());
};
// Get total count of students in database

export const getTotalStudentCount = async () => {
  const token = localStorage.getItem("token");
  return axios.get(
    `${API_BASE_URL}/api/bills/students-count`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Get all bills stats (not filtered by mess) - all bills in database 
export const getAllBillsStats = async () => {
  const token = localStorage.getItem("token");
  return axios.get(
    `${API_BASE_URL}/api/bills/stats-all`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};





// Admin: generate bills for all students (used by GenerateBills page)
export const generateAllBills = async (payload) => {
  return axios.post(`${API}/generate-all`, payload, authHeaders());
};

// Admin/Manager: Get bills for a mess (server: GET /api/bills/mess/:hostelId)
export const getMessBills = async (hostelId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/mess/${hostelId}${qs ? `?${qs}` : ""}`;
  return axios.get(url, authHeaders());
};

// Get billing stats for admin dashboard
export const getBillingStats = async (hostelId) => {
  if (!hostelId) {
    throw new Error('hostelId is required for getting billing stats');
  }
  
  // Get current month and year
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth returns 0-11
  const year = today.getFullYear();
  
  return axios.get(`${API}/summary/${hostelId}/${month}/${year}`, authHeaders());

};

// ── Razorpay Payment ─────────────────────────────────────────────

const PAYMENTS_API = `${API_BASE_URL}/api/payments`;

// Create a Razorpay order for selected bill IDs
export const createPaymentOrder = async (billIds) => {
  return axios.post(`${PAYMENTS_API}/create-order`, { billIds }, authHeaders());
};

// Verify Razorpay payment after checkout completes
export const verifyPayment = async (data) => {
  return axios.post(`${PAYMENTS_API}/verify`, data, authHeaders());
};
