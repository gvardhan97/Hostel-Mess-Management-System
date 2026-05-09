import React from "react";

/**
 * Month picker input with label.
 *
 * Usage:
 *   <MonthPicker value="2026-04" onChange={setMonth} />
 */
export default function MonthPicker({ value, onChange, label = "Select Month", className = "" }) {
  return (
    <div className={className}>
      {label && <label className="text-sm text-neutral-600">{label}</label>}
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
