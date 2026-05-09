import React from "react";

/**
 * Card wrapper for dashboard/report sections.
 *
 * Usage:
 *   <SectionCard title="Revenue Overview">
 *     <BarChart ... />
 *   </SectionCard>
 */
export default function SectionCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl shadow-sm p-6 ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
}
