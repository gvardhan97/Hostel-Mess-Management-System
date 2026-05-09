import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout.jsx";
import PrimaryButton from "../components/PrimaryButton.jsx";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

export default function ManageMenus() {

  const [loading, setLoading] = useState(false);
  const [weeklyMenu, setWeeklyMenu] = useState({});
  const [menus, setMenus] = useState([]);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const hostelId = storedUser?.hostelId;

  //   backend menu into form
  const formatMenu = (menuData) => {
    const formatted = {};
    menuData.dailyMenus.forEach((dayMenu) => {
      formatted[dayMenu.day] = {
        breakfast: dayMenu.meals.breakfast?.items[0]?.name || "",
        lunch: dayMenu.meals.lunch?.items[0]?.name || "",
        dinner: dayMenu.meals.dinner?.items[0]?.name || "",
      };
    });
    return formatted;
  };

  //  Fetch menus and load current/previous
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/menu/mess/${hostelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMenus(res.data.data);

        const today = new Date();
        const current = res.data.data.find(
          (m) =>
            new Date(m.weekStartDate) <= today &&
            new Date(m.weekEndDate) >= today
        );

        if (current) {
          setCurrentMenu(current);
          if (current.status === "published") {
            setIsPublished(true);
          } else {
            setWeeklyMenu(formatMenu(current));
          }
        } else {
          fetchPreviousMenu();
        }
      } catch (error) {
        console.error("Error fetching menus:", error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchPreviousMenu = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/menu/previous/${hostelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWeeklyMenu(formatMenu(response.data.data));
      } catch {
        setWeeklyMenu({
          Monday: { breakfast: "", lunch: "", dinner: "" },
          Tuesday: { breakfast: "", lunch: "", dinner: "" },
          Wednesday: { breakfast: "", lunch: "", dinner: "" },
          Thursday: { breakfast: "", lunch: "", dinner: "" },
          Friday: { breakfast: "", lunch: "", dinner: "" },
          Saturday: { breakfast: "", lunch: "", dinner: "" },
          Sunday: { breakfast: "", lunch: "", dinner: "" },
        });
      }
    };

    if (hostelId) fetchMenus();
  }, [hostelId, refresh]);

  // 🧾 Update form
  const handleChange = (day, meal, value) => {
    setWeeklyMenu({
      ...weeklyMenu,
      [day]: { ...weeklyMenu[day], [meal]: value },
    });
  };

  //  Save or update menu
  const handleSave = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const weekNumber = Math.ceil(
        ((today - new Date(today.getFullYear(), 0, 1)) / 86400000 +
          new Date(today.getFullYear(), 0, 1).getDay() +
          1) /
          7
      );

      const dailyMenus = Object.entries(weeklyMenu).map(([day, meals], i) => ({
        day,
        date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
        meals: {
          breakfast: { items: [{ name: meals.breakfast || "N/A" }] },
          lunch: { items: [{ name: meals.lunch || "N/A" }] },
          dinner: { items: [{ name: meals.dinner || "N/A" }] },
        },
      }));

      const payload = {
        hostelId,
        weekStartDate: start,
        weekEndDate: end,
        weekNumber,
        year: today.getFullYear(),
        dailyMenus,
        announcement: "Weekly menu updated by manager",
      };

      if (currentMenu && currentMenu.status === "draft") {
        await axios.put(
          `${API_BASE_URL}/api/menu/${currentMenu._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("✅ Weekly menu updated!");
      } else {
        await axios.post(`${API_BASE_URL}/api/menu`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("✅ New menu created!");
      }
      setRefresh(!refresh);
    } catch (error) {
      alert(
        `❌ Failed: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Publish menu
  const handlePublish = async (menuId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/menu/${menuId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Menu published successfully!");
      setRefresh(!refresh);
    } catch (error) {
      alert(
        `❌ Publish failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (loading && Object.keys(weeklyMenu).length === 0)
    return (
      <div className="h-screen flex items-center justify-center text-xl font-medium">
        Loading menus...
      </div>
    );

  return (
    <PageLayout title="Weekly Menu Management">

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Weekly Menu Management
          </h1>
          {isPublished ? (
            <p className="text-green-600 font-medium mt-1">
              ✅ Current week menu is published — editing disabled.
            </p>
          ) : (
            <p className="text-neutral-600 mt-1">
              {currentMenu
                ? "Editing draft menu for this week."
                : "No current menu found — using previous week as base."}
            </p>
          )}
        </header>

        {/* 🧾 Menu Form */}
        <section className="space-y-6">
          {Object.entries(weeklyMenu).map(([day, meals]) => (
            <div
              key={day}
              className="bg-white border border-neutral-200 shadow-sm rounded-xl p-5"
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-700">{day}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["breakfast", "lunch", "dinner"].map((mealType) => (
                  <div key={mealType}>
                    <label className="text-sm text-neutral-600 capitalize">
                      {mealType}
                    </label>
                    <input
                      type="text"
                      className="w-full border border-neutral-300 rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${mealType}`}
                      value={meals[mealType]}
                      onChange={(e) =>
                        handleChange(day, mealType, e.target.value)
                      }
                      disabled={isPublished}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="mt-8 flex justify-end">
          <PrimaryButton
            onClick={handleSave}
            disabled={loading || isPublished}
          >
            {isPublished
              ? "Published (Locked)"
              : loading
              ? "Saving..."
              : "Save Menu"}
          </PrimaryButton>
        </div>

        {/*  All Menus List */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">All Menus</h2>
          {menus.length === 0 ? (
            <p className="text-neutral-500">No menus found yet.</p>
          ) : (
            <div className="space-y-4">
              {menus.map((menu) => {
                const start = new Date(menu.weekStartDate).toLocaleDateString();
                const end = new Date(menu.weekEndDate).toLocaleDateString();
                const isCurrent =
                  new Date(menu.weekStartDate) <= new Date() &&
                  new Date(menu.weekEndDate) >= new Date();

                return (
                  <div
                    key={menu._id}
                    className="p-5 bg-white border border-neutral-200 rounded-lg shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">
                        Week {menu.weekNumber} ({start} → {end})
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            menu.status === "published"
                              ? "text-green-600"
                              : menu.status === "draft"
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}
                        >
                          {menu.status}
                        </span>
                      </p>
                    </div>

                    {menu.status === "draft" && isCurrent ? (
                      <button
                        onClick={() => handlePublish(menu._id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm cursor-not-allowed"
                      >
                        {menu.status === "published"
                          ? "Published"
                          : "Old Menu"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
    </PageLayout>
  );
}


