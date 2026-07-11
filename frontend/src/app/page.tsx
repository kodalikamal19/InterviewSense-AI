"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { 
  Users, 
  FileCheck, 
  Activity, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  FolderOpen
} from "lucide-react";

interface StatsData {
  candidates: number;
  jobs: number;
  interviews: number;
  avg_score: number;
}

interface InterviewItem {
  id: number;
  status: string;
  created_at: string;
  candidate: {
    id: number;
    name: string;
    email: string;
  };
  job: {
    id: number;
    role: string;
  };
  score: number | null;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<StatsData>({ candidates: 0, jobs: 0, interviews: 0, avg_score: 0.0 });
  const [recentInterviews, setRecentInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch stats
        const statsRes = await api.get<any>("/interviews/stats");
        if (statsRes.success && statsRes.stats) {
          setStats(statsRes.stats);
        }

        // 2. Fetch interviews list
        const listRes = await api.get<any>("/interviews");
        if (listRes.success && listRes.interviews) {
          // Slice the top 3 interviews
          setRecentInterviews(listRes.interviews.slice(0, 3));
        }
      } catch (err: any) {
        console.error("Dashboard error", err);
        setError("Unable to retrieve dashboard stats. Database connection might be offline.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const metrics = [
    { title: "Total Interviews", value: stats.interviews.toString(), icon: Users, color: "text-accent-indigo", bg: "bg-accent-indigo/10", border: "border-accent-indigo/20" },
    { title: "Registered Candidates", value: stats.candidates.toString(), icon: FileCheck, color: "text-accent-emerald", bg: "bg-accent-emerald/10", border: "border-accent-emerald/20" },
    { title: "Average Score", value: stats.avg_score > 0 ? `${stats.avg_score}/10` : "--", icon: TrendingUp, color: "text-accent-cyan", bg: "bg-accent-cyan/10", border: "border-accent-cyan/20" },
    { title: "Active JD Targets", value: stats.jobs.toString(), icon: FolderOpen, color: "text-accent-rose", bg: "bg-accent-rose/10", border: "border-accent-rose/20" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "analyzed":
        return "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20";
      case "analyzing":
      case "transcribing":
        return "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20 animate-pulse";
      case "transcribed":
        return "bg-accent-indigo/10 text-accent-indigo border-accent-indigo/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getActionText = (status: string) => {
    switch (status.toLowerCase()) {
      case "analyzed":
        return "View Report";
      case "created":
        return "Start Session";
      default:
        return "Track Status";
    }
  };

  const getActionLink = (item: InterviewItem) => {
    switch (item.status.toLowerCase()) {
      case "analyzed":
        return `/interviews/report?id=${item.id}`;
      case "created":
        return `/interviews/live?id=${item.id}`;
      default:
        return `/interviews/analysis?id=${item.id}`;
    }
  };

  const getActionColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "analyzed":
        return "text-accent-indigo hover:text-accent-indigo/80 bg-accent-indigo/10 hover:bg-accent-indigo/20";
      case "created":
        return "text-accent-rose hover:text-accent-rose/80 bg-accent-rose/10 hover:bg-accent-rose/20";
      default:
        return "text-accent-cyan hover:text-accent-cyan/80 bg-accent-cyan/10 hover:bg-accent-cyan/20";
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "N/A";
    const dateObj = new Date(isoStr);
    return dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading recruiter dashboard metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Hero Panel */}
      <div className="relative rounded-2xl overflow-hidden border border-card-border bg-gradient-to-r from-card-bg to-sidebar-bg/60 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-indigo/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-accent-violet/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assessment Assistant Active</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Assess Candidate Potential, Honestly.
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              InterviewSense AI uses speech intelligence to transcribe sessions, isolate responses, map answers to resume claims, and score technical alignments. 
              <span className="font-semibold text-slate-300"> The final hiring decision remains 100% yours.</span>
            </p>
          </div>
          
          <Link
            href="/interviews/create"
            className="flex items-center justify-center gap-2 bg-accent-indigo hover:bg-accent-indigo/90 text-white font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all text-sm group"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Setup New Session</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-accent-rose/10 border border-accent-rose/25 text-accent-rose p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.title} 
              className={`rounded-2xl border ${metric.border} bg-card-bg/60 p-5 flex items-center justify-between transition-all hover:translate-y-[-2px]`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.title}</span>
                <div className="text-3xl font-bold text-slate-100">{metric.value}</div>
              </div>
              <div className={`p-3 rounded-xl ${metric.bg} border ${metric.border.replace('20', '10')}`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Panels - Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews List */}
        <div className="lg:col-span-2 rounded-2xl border border-card-border bg-card-bg/50 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-200">Recent Interview Sessions</h3>
              <p className="text-xs text-slate-500">Track and review evaluated candidates</p>
            </div>
            <Link 
              href="/interviews" 
              className="text-xs font-semibold text-accent-indigo hover:text-accent-indigo/80 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500 gap-1">
                <span>No active sessions found.</span>
                <Link href="/interviews/create" className="text-accent-indigo font-bold hover:underline">
                  Create a candidate slot now.
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Target Role</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentInterviews.map((session) => (
                    <tr key={session.id} className="text-slate-300 group hover:bg-slate-800/10">
                      <td className="py-3.5">
                        <div className="font-medium text-slate-200">{session.candidate.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span>{formatDate(session.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3.5">{session.job.role}</td>
                      <td className="py-3.5 text-center font-mono font-bold text-slate-100">
                        {session.score !== null ? `${session.score}/10` : "--"}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={getActionLink(session)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${getActionColor(session.status)}`}
                        >
                          {getActionText(session.status)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info Panel: Assessment Process */}
        <div className="rounded-2xl border border-card-border bg-card-bg/50 backdrop-blur-md p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-200">How It Works</h3>
            <p className="text-xs text-slate-500">Overview of the prototype evaluation pipeline</p>
          </div>

          <div className="space-y-4">
            {[
              { step: "01", title: "Upload Files", desc: "Attach resume documents and candidate details alongside target JDs." },
              { step: "02", title: "Record Session", desc: "Conduct the interview directly inside the browser using clean microphone inputs." },
              { step: "03", title: "Transcribe & Isolate", desc: "Whisper transcribes the audio, and PyAnnote isolates candidate and interviewer speakers." },
              { step: "04", title: "Generate Report", desc: "Retrieve match scores, communication speed, skill logs, and PDF feedback cards." }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center font-bold text-xs text-accent-indigo">
                  {step.step}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-xs text-slate-300 leading-tight">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
