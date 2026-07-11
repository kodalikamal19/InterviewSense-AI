"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { 
  Loader2, 
  FileText, 
  Download, 
  User, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  ExternalLink,
  Award,
  ChevronRight
} from "lucide-react";

interface ReportItem {
  id: number;
  interview_id: number;
  candidate_name: string;
  role_title: string;
  score: number | null;
  recommendation: string;
  created_at: string;
}

function ReportsPageContent() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>("/reports");
        if (res.success && res.reports) {
          setReports(res.reports);
        } else {
          setError("Failed to fetch reports list from database.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to query interview evaluation reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return "bg-slate-800 text-slate-500 border-slate-700";
    if (score >= 8.0) return "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald";
    if (score >= 6.0) return "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan";
    return "bg-accent-rose/10 border-accent-rose/20 text-accent-rose";
  };

  const getRecommendationBadgeColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes("strong")) {
      return "bg-accent-emerald/15 border-accent-emerald/30 text-accent-emerald font-extrabold";
    }
    if (rec.includes("no hire") || rec.includes("reject")) {
      return "bg-accent-rose/10 border-accent-rose/35 text-accent-rose";
    }
    return "bg-accent-indigo/10 border-accent-indigo/35 text-accent-indigo";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading evaluation reports...</span>
      </div>
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-indigo" />
          <span>Evaluation Reports</span>
        </h2>
        <p className="text-xs text-slate-500">View and download generated AI candidate feedback sheets and matching metrics.</p>
      </div>

      {error && (
        <div className="bg-accent-rose/10 border border-accent-rose/25 text-accent-rose p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Reports List */}
      {reports.length === 0 ? (
        <div className="bg-card-bg/20 border border-card-border rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-2">
          <Award className="w-10 h-10 text-slate-600 animate-pulse" />
          <h3 className="font-bold text-slate-200 mt-2">No Reports Available</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            There are no fully evaluated interview reports yet. Go to <Link href="/interviews" className="text-accent-indigo font-bold hover:underline">Past Interviews</Link> to start or track pending evaluations.
          </p>
        </div>
      ) : (
        <div className="bg-card-bg/30 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-sidebar-bg/40">
                  <th className="py-4 px-6">Candidate Name</th>
                  <th className="py-4 px-6">Applied Role</th>
                  <th className="py-4 px-6">Overall Score</th>
                  <th className="py-4 px-6">AI Recommendation</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                    {/* Candidate Name & Date */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{report.candidate_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 ml-5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </td>

                    {/* Applied Role */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium">{report.role_title}</span>
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="py-4 px-6">
                      {report.score !== null ? (
                        <div className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg w-max font-mono font-bold ${getScoreBadgeColor(report.score)}`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{report.score.toFixed(1)}/10</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">--</span>
                      )}
                    </td>

                    {/* AI Recommendation */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getRecommendationBadgeColor(report.recommendation)}`}>
                        {report.recommendation}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/interviews/report?id=${report.interview_id}`}
                          className="text-xs font-semibold text-accent-indigo hover:text-accent-indigo/80 bg-accent-indigo/10 hover:bg-accent-indigo/20 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>View Report</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        
                        <a
                          href={`${apiBaseUrl}/reports/${report.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-lg transition-all"
                          title="Download PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
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

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading reports portal...</span>
      </div>
    }>
      <ReportsPageContent />
    </Suspense>
  );
}
