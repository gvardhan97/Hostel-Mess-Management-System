import React from "react";

/**
 * Full-page loading screen with a simple spinner.
 *
 * Usage: <LoadingScreen message="Loading bills..." />
 */
export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg font-medium text-neutral-600">{message}</p>
    </div>
  );
}
