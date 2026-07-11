"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { 
  Download, 
  Award, 
  CheckCircle2, 
  User, 
  Briefcase, 
  Mail, 
  FileText, 
  Sparkles, 
  Check, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  XCircle,
  ShieldCheck,
  Activity
} from "lucide-react";

interface QuestionAnswerItem {
  id: number;
  question_text: string;
  answer_text: string;
  round_classification: string;
  score: number;
  feedback: string;
}

interface ReportDetails {
  id: number;
  interview_id: number;
  candidate_name: string;
  candidate_email: string;
  role_title: string;
  score: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  questions_answers: QuestionAnswerItem[];
  resume_consistency_status: string;
  resume_consistency_details: string;
  communication_metrics: {
    wpm: number;
    filler_words_count: number;
    grammar_score: string;
  };
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("id");

  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) {
      setError("No interview ID specified in URL query parameters.");
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/reports/interview/${interviewId}`);
        if (res.success && res.report) {
          setReport(res.report);
        } else {
          setError("Failed to retrieve candidate evaluation report from server.");
        }
      } catch (err: any) {
        setError(err.message || "Evaluation report not found yet. Has the analysis task finished?");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading candidate evaluation metrics...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-accent-rose/10 border border-accent-rose/25 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-accent-rose animate-bounce" />
        <h3 className="font-bold text-slate-100">Report Unavailable</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || "We could not find the assessment logs. Make sure that the transcription and analysis tasks have executed successfully."}
        </p>
      </div>
    );
  }

  const recommendationColors = (rec: string) => {
    switch (rec.toLowerCase()) {
      case "strong hire":
        return "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald";
      case "hire":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "review required":
        return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      default:
        return "bg-accent-rose/10 border-accent-rose/30 text-accent-rose";
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 8.0) return "text-accent-emerald";
    if (scoreValue >= 6.0) return "text-green-400";
    if (scoreValue >= 4.0) return "text-orange-400";
    return "text-accent-rose";
  };

  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://interviewsense-ai.onrender.com/api"}/reports/${report.id}/download`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Profile Section */}
      <div className="bg-card-bg/40 border border-card-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-indigo/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-accent-indigo/15 border border-accent-indigo/35 flex items-center justify-center text-accent-indigo">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">{report.candidate_name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                {report.role_title}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {report.candidate_email}
              </span>
            </div>
          </div>
        </div>

        <a 
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </a>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score and Recommendation */}
        <div className="bg-card-bg/20 border border-card-border rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Score Ring */}
            <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black font-mono ${getScoreColor(report.score)}`}>
                {report.score}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
            </div>
            <Award className="absolute -top-2 -right-2 w-6 h-6 text-accent-indigo animate-pulse" />
          </div>

          <div className="space-y-1.5 w-full">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hiring Recommendation</span>
            <div className={`py-1.5 px-3 rounded-xl border text-xs font-bold text-center ${recommendationColors(report.recommendation)}`}>
              {report.recommendation}
            </div>
          </div>
        </div>

        {/* AI Performance Evaluation summary */}
        <div className="md:col-span-2 bg-card-bg/20 border border-card-border rounded-2xl p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="w-4.5 h-4.5 text-accent-indigo animate-pulse" />
            <span>AI Evaluation Summary</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-card-bg/25 border border-card-border rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-accent-emerald flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>Key Strengths</span>
          </h3>
          <ul className="space-y-3">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-300 leading-relaxed font-medium">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-card-bg/25 border border-card-border rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-accent-rose flex items-center gap-2">
            <XCircle className="w-4.5 h-4.5" />
            <span>Areas of Improvement</span>
          </h3>
          <ul className="space-y-3">
            {report.weaknesses.map((weak, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded-full bg-accent-rose/10 text-accent-rose flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-300 leading-relaxed font-medium">{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resume Consistency & Communication Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume Consistency */}
        <div className="bg-card-bg/25 border border-card-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-accent-indigo" />
              <span>Resume Consistency Check</span>
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
              report.resume_consistency_status?.toLowerCase() === "consistent"
                ? "bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald"
                : report.resume_consistency_status?.toLowerCase() === "gaps found"
                ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}>
              {report.resume_consistency_status || "N/A"}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {report.resume_consistency_details || "No consistency check details recorded."}
          </p>
        </div>

        {/* Communication Metrics */}
        <div className="bg-card-bg/25 border border-card-border rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-accent-indigo animate-pulse" />
            <span>Communication Analysis</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sidebar-bg/40 border border-card-border p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Speaking Speed</span>
              <span className="text-sm font-black font-mono text-slate-200">
                {report.communication_metrics?.wpm || 0} <span className="text-[10px] font-medium text-slate-400 block">WPM</span>
              </span>
            </div>
            <div className="bg-sidebar-bg/40 border border-card-border p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Filler Words</span>
              <span className="text-sm font-black font-mono text-slate-200">
                {report.communication_metrics?.filler_words_count || 0} <span className="text-[10px] font-medium text-slate-400 block">counts</span>
              </span>
            </div>
            <div className="bg-sidebar-bg/40 border border-card-border p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Grammar Score</span>
              <span className="text-sm font-black font-mono text-slate-200 block">
                {report.communication_metrics?.grammar_score || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Breakdown timeline */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-indigo" />
          <span>Question-by-Question Evaluation</span>
        </h3>

        <div className="space-y-4">
          {report.questions_answers.map((qaItem, idx) => (
            <div 
              key={qaItem.id}
              className="bg-card-bg/15 border border-card-border rounded-2xl p-6 space-y-4 hover:border-card-border/80 transition-colors"
            >
              {/* Question card header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-accent-indigo font-mono">Q{idx + 1}</span>
                  <span className="px-2.5 py-0.5 bg-sidebar-bg/60 border border-card-border text-[9px] font-bold text-slate-400 tracking-wider uppercase rounded-full">
                    {qaItem.round_classification}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo rounded-xl">
                  <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
                  <span className="text-xs font-mono font-bold">{qaItem.score}/10</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Question asked</span>
                <p className="text-xs font-semibold text-slate-200">{qaItem.question_text}</p>
              </div>

              {/* Answer Text */}
              {qaItem.answer_text && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Candidate response</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                    "{qaItem.answer_text}"
                  </p>
                </div>
              )}

              {/* Correctness Feedback */}
              <div className="bg-accent-indigo/5 border border-accent-indigo/15 p-4 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-accent-indigo uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 animate-pulse" />
                  <span>AI Correctness Feedback</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {qaItem.feedback}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading report portal...</span>
      </div>
    }>
      <ReportPageContent />
    </Suspense>
  );
}
