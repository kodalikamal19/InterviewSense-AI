"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { 
  Loader2, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Languages, 
  MessageSquareQuote,
  Target
} from "lucide-react";

type InterviewStatus = "created" | "recorded" | "transcribing" | "transcribed" | "analyzing" | "analyzed";

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get("id");

  // Candidate metadata
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [status, setStatus] = useState<InterviewStatus>("created");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Auto trigger safety check
  const [hasTriggeredAnalysis, setHasTriggeredAnalysis] = useState(false);

  useEffect(() => {
    if (!interviewId) {
      setErrorMessage("No interview ID specified in URL query parameters.");
      setLoadingDetails(false);
      return;
    }

    const pollStatus = async () => {
      try {
        const res = await api.get<any>(`/interviews/${interviewId}`);
        if (res.success && res.interview) {
          const currentStatus = res.interview.status as InterviewStatus;
          setStatus(currentStatus);
          setCandidateName(res.interview.candidate.name);
          setJobRole(res.interview.job.role);
          setLoadingDetails(false);

          // Auto-trigger AI analysis once speech-to-text finishes
          if (currentStatus === "transcribed" && !hasTriggeredAnalysis) {
            setHasTriggeredAnalysis(true);
            triggerAnalysis();
          }

          // Auto-redirect once evaluation report completes
          if (currentStatus === "analyzed") {
            router.push(`/interviews/report?id=${interviewId}`);
          }
        }
      } catch (err: any) {
        logger.error("Polling status error", err);
        setErrorMessage(err.message || "Failed to poll interview session state.");
        setLoadingDetails(false);
      }
    };

    const triggerAnalysis = async () => {
      try {
        setStatus("analyzing");
        await api.post<any>(`/interviews/${interviewId}/analyze`, {});
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to auto-trigger AI analysis session.");
        setHasTriggeredAnalysis(false); // Reset to retry
      }
    };

    // Initial check
    pollStatus();

    // Set polling ticker every 3 seconds
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [interviewId, hasTriggeredAnalysis, router]);

  // Determine active step index based on status strings
  const getActiveStep = () => {
    switch (status) {
      case "created":
      case "recorded":
      case "transcribing":
        return 0; // Speech-to-Text & Diarization
      case "transcribed":
        return 2; // QA Extraction complete, loading analysis
      case "analyzing":
        return 3; // AI analysis running
      case "analyzed":
        return 4; // Complete
      default:
        return 0;
    }
  };

  const activeStepIndex = getActiveStep();

  const stepsList = [
    {
      title: "Audio Speech-to-Text",
      desc: "Whisper transcribes vocal speech streams into raw dialogue transcripts.",
      icon: Languages,
      index: 0,
      activeStatus: ["created", "recorded", "transcribing"],
      doneStatus: ["transcribed", "analyzing", "analyzed"]
    },
    {
      title: "Speaker Diarization",
      desc: "Pyannote segments timelines and labels speaker turns.",
      icon: Cpu,
      index: 1,
      activeStatus: ["transcribing"],
      doneStatus: ["transcribed", "analyzing", "analyzed"]
    },
    {
      title: "Question-Answer Isolation",
      desc: "Isolates Interviewer questions, candidate answers, and grades responses.",
      icon: MessageSquareQuote,
      index: 2,
      activeStatus: ["transcribed"],
      doneStatus: ["analyzing", "analyzed"]
    },
    {
      title: "AI Report Evaluation",
      desc: "GPT assesses candidate profile strengths and weaknesses.",
      icon: Target,
      index: 3,
      activeStatus: ["analyzing"],
      doneStatus: ["analyzed"]
    }
  ];

  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Initializing analysis environment...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Session Card Info */}
      <div className="bg-card-bg/50 border border-card-border p-6 rounded-2xl flex flex-col items-center text-center gap-2">
        <Activity className="w-8 h-8 text-accent-indigo animate-pulse" />
        <h3 className="text-lg font-bold text-slate-100 mt-1">Analyzing Candidate Session</h3>
        <p className="text-xs text-slate-400">
          Candidate: <span className="font-semibold text-slate-200">{candidateName}</span> &bull; 
          Role: <span className="font-semibold text-slate-200">{jobRole}</span>
        </p>
      </div>

      {/* Main loading card with progress steps */}
      <div className="bg-card-bg/30 border border-card-border rounded-3xl p-8 space-y-6 relative overflow-hidden">
        {/* Glow indicator */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-indigo/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-5">
          {stepsList.map((stepItem, idx) => {
            const isCompleted = stepItem.doneStatus.includes(status) && status !== "transcribing";
            const isActive = stepItem.activeStatus.includes(status) || (status === "transcribing" && stepItem.index <= 1);
            const isPending = !isCompleted && !isActive;

            return (
              <div 
                key={idx}
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  isActive 
                    ? "bg-accent-indigo/5 border-accent-indigo/20 shadow-md shadow-indigo-500/5 scale-[1.01]" 
                    : isCompleted 
                    ? "bg-sidebar-bg/30 border-card-border/40" 
                    : "bg-sidebar-bg/10 border-card-border/20 opacity-50"
                }`}
              >
                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isCompleted 
                    ? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
                    : isActive 
                    ? "bg-accent-indigo/15 border-accent-indigo/35 text-accent-indigo animate-pulse" 
                    : "bg-slate-900 border-slate-800 text-slate-600"
                }`}>
                  {isActive && !isCompleted ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <stepItem.icon className="w-5 h-5" />
                  )}
                </div>

                {/* Text details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      isActive ? "text-slate-100" : isCompleted ? "text-slate-300" : "text-slate-500"
                    }`}>
                      {stepItem.title}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-accent-indigo/15 border border-accent-indigo/25 text-accent-indigo rounded-full text-[9px] font-bold tracking-wider uppercase animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{stepItem.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Loading Banner */}
        <div className="flex items-center justify-center gap-2 bg-sidebar-bg/60 border border-card-border py-4 px-6 rounded-2xl text-xs text-slate-400">
          <Sparkles className="w-4.5 h-4.5 text-accent-indigo animate-pulse" />
          <span>Please do not close this browser tab. Running evaluation pipeline...</span>
        </div>
      </div>

      {/* Error alert container */}
      {errorMessage && (
        <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

const logger = {
  error: (msg: string, err: any) => {
    console.error(`[Analysis] ${msg}:`, err);
  }
};

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading analysis portal...</span>
      </div>
    }>
      <AnalysisPageContent />
    </Suspense>
  );
}
