"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Mic, 
  FileText, 
  History, 
  HelpCircle,
  BrainCircuit
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Create Interview", href: "/interviews/create", icon: PlusCircle },
    { name: "Live Recording", href: "/interviews/live", icon: Mic },
    { name: "Evaluation Reports", href: "/reports", icon: FileText },
    { name: "Past Interviews", href: "/interviews", icon: History },
  ];

  return (
    <aside className={`w-64 bg-sidebar-bg border-r border-sidebar-border h-screen flex flex-col justify-between p-4 z-30 transition-transform ${className}`}>
      <div>
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="bg-accent-indigo/15 p-2 rounded-xl border border-accent-indigo/30 glow-accent">
            <BrainCircuit className="w-6 h-6 text-accent-indigo" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-gradient-primary">
              InterviewSense
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
              AI Intelligence
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if active: exact match or starts with if not root
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-accent-indigo/10 border-l-2 border-accent-indigo text-slate-100 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border-l-2 border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-accent-indigo" : "text-slate-400 group-hover:text-slate-100"
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Support */}
      <div className="border-t border-slate-800/60 pt-4">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Documentation & Help</span>
        </Link>
        <div className="mt-3 px-3 text-[10px] text-slate-600">
          v1.0.0 (Beta Prototype)
        </div>
      </div>
    </aside>
  );
}
