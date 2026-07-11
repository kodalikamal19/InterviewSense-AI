"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { 
  Loader2, 
  Calendar, 
  User, 
  Briefcase, 
  Activity, 
  FileText, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  ExternalLink
} from "lucide-react";

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

function HistoryPageContent() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>("/interviews");
        if (res.success && res.interviews) {
          setInterviews(res.interviews);
        } else {
          setError("Failed to fetch interview list from database.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to query interview history records.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "analyzed":
        return "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald";
      case "analyzing":
      case "transcribing":
        return "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan animate-pulse";
      case "transcribed":
        return "bg-accent-indigo/10 border-accent-indigo/30 text-accent-indigo";
      case "recorded":
        return "bg-accent-violet/10 border-accent-violet/30 text-accent-violet";
      default:
        return "bg-slate-800 border-slate-700 text-slate-400";
    }
  };

  const getActionLink = (item: InterviewItem) => {
    switch (item.status.toLowerCase()) {
      case "analyzed":
        return (
          <Link
            href={`/interviews/report?id=${item.id}`}
            className="text-xs font-semibold text-accent-indigo hover:text-accent-indigo/80 bg-accent-indigo/10 hover:bg-accent-indigo/20 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>View Report</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        );
      case "created":
        return (
          <Link
            href={`/interviews/live?id=${item.id}`}
            className="text-xs font-semibold text-accent-rose hover:text-accent-rose/80 bg-accent-rose/10 hover:bg-accent-rose/20 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Start Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        );
      default:
        return (
          <Link
            href={`/interviews/analysis?id=${item.id}`}
            className="text-xs font-semibold text-accent-cyan hover:text-accent-cyan/80 bg-accent-cyan/10 hover:bg-accent-cyan/20 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Track Status</span>
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </Link>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "N/A";
    const dateObj = new Date(isoStr);
    return dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading interview records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-indigo" />
            <span>Interview History</span>
          </h2>
          <p className="text-xs text-slate-500">List of all past candidate sessions and evaluation status logs.</p>
        </div>

        <Link
          href="/interviews/create"
          className="flex items-center justify-center gap-2 bg-accent-indigo hover:bg-accent-indigo/90 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-xs shadow-md shadow-indigo-500/10 group"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Session Setup</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {error && (
        <div className="bg-accent-rose/10 border border-accent-rose/25 text-accent-rose p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Interviews Grid list */}
      {interviews.length === 0 ? (
        <div className="bg-card-bg/20 border border-card-border rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-2">
          <Activity className="w-10 h-10 text-slate-600 animate-pulse" />
          <h3 className="font-bold text-slate-200 mt-2">No Records Found</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            There are no candidate interview sessions registered yet. Start by setting up a new session slot.
          </p>
        </div>
      ) : (
        <div className="bg-card-bg/30 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-sidebar-bg/40">
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6">Target Role</th>
                  <th className="py-4 px-6">Evaluation Score</th>
                  <th className="py-4 px-6">Status State</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {interviews.map((item) => (
                  <tr key={item.id} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                    {/* Candidate */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.candidate.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 ml-5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Job Role */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium">{item.job.role}</span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6">
                      {item.score !== null ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-accent-indigo/10 border border-accent-indigo/15 text-accent-indigo rounded-lg w-max font-mono font-bold">
                          <TrendingUp className="w-3 h-3" />
                          <span>{item.score}/10</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      {getActionLink(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading history portal...</span>
      </div>
    }>
      <HistoryPageContent />
    </Suspense>
  );
}
