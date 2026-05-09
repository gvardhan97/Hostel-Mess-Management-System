import React, { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

/**
 * PageLayout — standard page shell with Navbar + Sidebar.
 *
 * Usage:
 *   <PageLayout title="Dashboard">
 *     <section>...your content...</section>
 *   </PageLayout>
 *
 * Props:
 *   - title (string, optional): rendered as h1 page heading
 *   - subtitle (string, optional): rendered below title
 *   - headerRight (ReactNode, optional): content aligned right in the header
 *   - children: page content
 *   - className (string, optional): extra classes for the main content area
 */
export default function PageLayout({ title, subtitle, headerRight, children, className = "" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-neutral-50">
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={`container-narrow py-10 px-4 ${className}`}>
        {/* Optional header */}
        {(title || headerRight) && (
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
              {subtitle && <p className="text-neutral-600 mt-1">{subtitle}</p>}
            </div>
            {headerRight && <div className="ml-auto flex items-center gap-3">{headerRight}</div>}
          </header>
        )}

        {children}
      </main>
    </div>
  );
}
