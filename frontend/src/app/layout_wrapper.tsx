"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Menu, X } from "lucide-react";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Desktop Layout */}
      <Sidebar className="hidden md:flex flex-shrink-0" />

      {/* Sidebar - Mobile overlay layout */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <Sidebar className="flex w-64 absolute left-0 top-0 h-full" />
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative overflow-hidden">
        {/* Mobile menu toggle */}
        <div className="md:hidden absolute top-3 left-4 z-30">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-xl bg-card-bg border border-card-border text-slate-200 hover:bg-slate-800"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
