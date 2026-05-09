import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function Menu() {

  const [weeklyMenu, setWeeklyMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPrevious, setIsPrevious] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const hostelId = storedUser?.hostelId;

  
  const formatMenu = (menuData) => {
    const formatted = {};
    menuData.dailyMenus.forEach((dayMenu) => {
      formatted[dayMenu.day] = {
        breakfast:
          dayMenu.meals.breakfast?.items[0]?.name || "Not available",
        lunch: dayMenu.meals.lunch?.items[0]?.name || "Not available",
        dinner: dayMenu.meals.dinner?.items[0]?.name || "Not available",
      };
    });
    return formatted;
  };

  //  Fetch current week menu
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);

        // Try current week menu
        const currentRes = await axios.get(
          `${API_BASE_URL}/api/menu/current/${hostelId}`
        );

        if (currentRes.data && currentRes.data.data) {
          const menu = currentRes.data.data;
          setWeeklyMenu(formatMenu(menu));
          setMessage("✅ Current week's menu is published.");
          setIsPrevious(false);
        } else {
          throw new Error("No current week menu found");
        }
      } catch (error) {
        console.warn("Current week menu not found, fetching previous...");

        // If current not found, load previous week menu
        try {
          const prevRes = await axios.get(
            `${API_BASE_URL}/api/menu/previous/${hostelId}`
          );
          const prevMenu = prevRes.data.data;
          setWeeklyMenu(formatMenu(prevMenu));
          setIsPrevious(true);
          setMessage(
            "⚠️ Current week menu is not published yet — showing previous week's menu."
          );
        } catch (prevError) {
          console.error("No previous menu found either:", prevError.message);
          setMessage("❌ No menu available currently.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (hostelId) fetchMenu();
  }, [hostelId]);

  // ⏳ Loading state
  if (loading) return <LoadingScreen message="Loading menu..." />;

  return (
    <PageLayout title="Weekly Mess Menu">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Weekly Mess Menu
          </h1>
          <p
            className={`mt-2 text-sm ${
              isPrevious
                ? "text-yellow-600"
                : message.includes("❌")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {message}
          </p>
        </header>

        {/* Menu display */}
        {Object.keys(weeklyMenu).length === 0 ? (
          <div className="text-neutral-500 mt-8">
            No menu data available to display.
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(weeklyMenu).map(([day, meals]) => (
              <div
                key={day}
                className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5"
              >
                <h2 className="text-xl font-semibold mb-3 text-blue-700">
                  {day}
                </h2>

                <p>
                  <span className="font-medium text-neutral-700">
                    Breakfast:
                  </span>{" "}
                  {meals.breakfast}
                </p>
                <p>
                  <span className="font-medium text-neutral-700">Lunch:</span>{" "}
                  {meals.lunch}
                </p>
                <p>
                  <span className="font-medium text-neutral-700">Dinner:</span>{" "}
                  {meals.dinner}
                </p>
              </div>
            ))}
          </section>
        )}
    </PageLayout>
  );
}


