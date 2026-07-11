"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { 
  Server, 
  Wifi, 
  WifiOff, 
  User, 
  Bell 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Determine page title based on path
  const getPageTitle = () => {
    if (pathname === "/") return "Recruiter Dashboard";
    if (pathname.startsWith("/interviews/create")) return "Configure New Interview";
    if (pathname.startsWith("/interviews/live")) return "Live Interview Session";
    if (pathname.startsWith("/interviews/report")) return "Evaluation Report Details";
    if (pathname.startsWith("/interviews/analysis")) return "Interview Analysis";
    if (pathname === "/interviews") return "Past Sessions & Logs";
    if (pathname.startsWith("/reports")) return "Evaluation Analytics Reports";
    return "InterviewSense AI";
  };

  useEffect(() => {
    let active = true;

    const verifyBackendHealth = async () => {
      if (!active) return;
      const res = await api.checkHealth();
      if (active) {
        setBackendStatus(res.status === "connected" ? "connected" : "disconnected");
      }
    };

    // Run initial health check
    verifyBackendHealth();

    // Check health every 10 seconds to keep updated
    const interval = setInterval(verifyBackendHealth, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <header className="h-16 border-b border-card-border bg-sidebar-bg/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Title */}
      <div>
        <h2 className="font-bold text-lg text-slate-100 tracking-wide">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* API Health Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          backendStatus === "connected"
            ? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
            : backendStatus === "disconnected"
            ? "bg-accent-rose/10 border-accent-rose/20 text-accent-rose"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}>
          <Server className="w-3.5 h-3.5 animate-pulse" />
          <span className="capitalize">{backendStatus === "connecting" ? "Checking Engine..." : `API: ${backendStatus}`}</span>
          {backendStatus === "connected" ? (
            <Wifi className="w-3 h-3 text-accent-emerald" />
          ) : backendStatus === "disconnected" ? (
            <WifiOff className="w-3 h-3 text-accent-rose" />
          ) : null}
        </div>

        {/* Notifications Mock */}
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>

        {/* User Account Mock */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
          <div className="bg-gradient-to-tr from-accent-indigo to-accent-violet p-1.5 rounded-xl border border-white/10 shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">Admin Recruiter</div>
            <div className="text-[9px] text-slate-500 font-medium">InterviewSense AI</div>
          </div>
        </div>
      </div>
    </header>
  );
}
