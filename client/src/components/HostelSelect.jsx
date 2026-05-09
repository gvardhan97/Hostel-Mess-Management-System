import React from "react";
import { HOSTELS } from "../constants/index.js";

/**
 * Hostel dropdown selector.
 *
 * Usage:
 *   <HostelSelect value={hostelId} onChange={setHostelId} />
 *   <HostelSelect value={hostelId} onChange={setHostelId} label="Hostel *" />
 */
export default function HostelSelect({ value, onChange, label = "Hostel", required = false, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="text-sm text-neutral-600">{label}</label>}
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-300 p-3 text-sm focus:ring-2 focus:ring-blue-600 bg-white"
      >
        <option value="" disabled>Select hostel</option>
        {HOSTELS.map((h) => (
          <option key={h.value} value={h.value}>{h.label}</option>
        ))}
      </select>
    </div>
  );
}
