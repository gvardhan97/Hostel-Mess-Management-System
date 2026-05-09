import React from "react";
import { Inbox } from "lucide-react";

/**
 * Empty state placeholder shown when there is no data.
 *
 * Usage: <EmptyState title="No bills found" subtitle="Bills will appear here once generated." />
 */
export default function EmptyState({ title = "No data found", subtitle, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-neutral-300 mb-4" />
      <h3 className="text-lg font-semibold text-neutral-700">{title}</h3>
      {subtitle && <p className="text-sm text-neutral-500 mt-1 max-w-md">{subtitle}</p>}
    </div>
  );
}
