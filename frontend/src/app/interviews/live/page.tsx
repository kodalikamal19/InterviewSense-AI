"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { 
  Mic, 
  MicOff, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Clock,
  Briefcase,
  User,
  Activity,
  ArrowRight
} from "lucide-react";

function LiveRecordingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get("id");
  
  // Details
  const [candidateName, setCandidateName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Recording State
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "uploading" | "uploaded">("idle");
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Refs for audio capturing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load details on mount
  useEffect(() => {
    if (!interviewId) {
      setErrorMessage("No interview ID specified in URL query parameters.");
      setIsLoadingDetails(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoadingDetails(true);
        const res = await api.get<any>(`/interviews/${interviewId}`);
        if (res.success && res.interview) {
          setCandidateName(res.interview.candidate.name);
          setJobRole(res.interview.job.role);
          
          // If already recorded, we can adjust visual state
          if (res.interview.status !== "created") {
            setRecordingState("uploaded");
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load interview slot details.");
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [interviewId]);

  // Clean up timers/streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Start recording handler
  const startRecording = async () => {
    setErrorMessage("");
    audioChunksRef.current = [];
    
    try {
      // 1. Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 2. Setup MediaRecorder
      // Attempt using audio/webm which is supported by most browsers
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/ogg" }; // Fallback
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Build audio file blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAudio(audioBlob);
      };

      // 3. Start recording
      recorder.start(1000); // Trigger dataavailable every 1s
      setRecordingState("recording");
      setDuration(0);

      // 4. Start timer incrementer
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      logger.error("Microphone access failed", err);
      setErrorMessage("Could not access microphone. Please ensure microphone permissions are granted.");
      setRecordingState("idle");
    }
  };

  // Stop recording handler
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState("uploading");
    }
  };

  // Upload audio Blob helper
  const uploadAudio = async (audioBlob: Blob) => {
    if (!interviewId) return;
    
    const formData = new FormData();
    // Convert WebM blob to an uploadable File structure
    const audioFile = new File([audioBlob], "interview_audio.webm", {
      type: "audio/webm",
      lastModified: Date.now()
    });
    formData.append("file", audioFile);

    try {
      const res = await api.post<any>(`/interviews/${interviewId}/upload-audio`, formData);
      if (res.success) {
        setRecordingState("uploaded");
      } else {
        setErrorMessage("Audio file was uploaded but server failed to update session state.");
        setRecordingState("idle");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload audio payload to backend server.");
      setRecordingState("idle");
    }
  };

  // Triggers transcription background worker and routes to analysis screen
  const triggerTranscriptionAndProceed = async () => {
    if (!interviewId) return;
    setIsTranscribing(true);
    setErrorMessage("");
    try {
      const res = await api.post<any>(`/interviews/${interviewId}/transcribe`, {});
      if (res.success) {
        // Redirect to Screen 6: Analysis Page (Module 11)
        router.push(`/interviews/analysis?id=${interviewId}`);
      } else {
        setErrorMessage("Failed to trigger audio speech transcription task.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error scheduling transcription.");
    } finally {
      setIsTranscribing(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading interview details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Session Title Card */}
      <div className="bg-card-bg/50 border border-card-border p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-indigo animate-pulse" />
            <span>Live Session</span>
          </h3>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <User className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-400">Candidate:</span>
              <span className="text-slate-200">{candidateName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-400">Target Role:</span>
              <span className="text-slate-200">{jobRole}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sidebar-bg/60 border border-card-border rounded-xl">
          <Clock className="w-4 h-4 text-accent-indigo" />
          <span className="text-xs font-mono font-bold text-slate-300">ID: {interviewId}</span>
        </div>
      </div>

      {/* Main recording box interface */}
      <div className="bg-card-bg/30 border border-card-border rounded-3xl p-10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        {/* Pulsing Visual Wave Background */}
        {recordingState === "recording" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-40 h-40 bg-accent-indigo/30 rounded-full animate-ping" />
            <div className="absolute w-56 h-56 bg-accent-indigo/20 rounded-full animate-pulse" />
          </div>
        )}

        {/* State Visual icons */}
        <div className="relative">
          {recordingState === "idle" && (
            <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-lg">
              <MicOff className="w-10 h-10" />
            </div>
          )}
          
          {recordingState === "recording" && (
            <button 
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-accent-rose hover:bg-accent-rose/90 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 cursor-pointer animate-pulse relative z-10 group"
              title="Stop Recording"
            >
              <Square className="w-10 h-10 group-hover:scale-95 transition-transform" />
            </button>
          )}

          {recordingState === "uploading" && (
            <div className="w-24 h-24 rounded-full bg-accent-indigo/10 border border-accent-indigo/25 flex items-center justify-center text-accent-indigo shadow-lg">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}

          {recordingState === "uploaded" && (
            <div className="w-24 h-24 rounded-full bg-accent-emerald/10 border border-accent-emerald/25 flex items-center justify-center text-accent-emerald shadow-lg shadow-emerald-500/5">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>
          )}
        </div>

        {/* Description & Timer details */}
        <div className="text-center space-y-2 relative z-10">
          {recordingState === "idle" && (
            <>
              <div className="text-sm font-semibold text-slate-200">Start candidate audio recording</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ready to record mic inputs. Please ensure you are in a quiet environment.
              </p>
            </>
          )}

          {recordingState === "recording" && (
            <>
              <div className="flex items-center justify-center gap-2 text-accent-rose font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-accent-rose animate-ping" />
                <span>RECORDING LIVE</span>
              </div>
              <div className="text-3xl font-mono font-bold text-slate-100 mt-2">{formatTime(duration)}</div>
            </>
          )}

          {recordingState === "uploading" && (
            <>
              <div className="text-sm font-semibold text-slate-200">Processing audio package</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Assembling and uploading WebM stream chunks to PostgreSQL file system...
              </p>
            </>
          )}

          {recordingState === "uploaded" && (
            <>
              <div className="text-sm font-bold text-accent-emerald">Audio saved successfully!</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                File uploaded to backend storage. Ready to run speech transcription.
              </p>
            </>
          )}
        </div>

        {/* Controls block */}
        <div className="w-full max-w-xs pt-4 relative z-10">
          {recordingState === "idle" && (
            <button
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 bg-accent-indigo hover:bg-accent-indigo/90 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10"
            >
              <Mic className="w-4.5 h-4.5" />
              <span>Start Session Recording</span>
            </button>
          )}

          {recordingState === "recording" && (
            <button
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-700/60 font-semibold py-3 px-5 rounded-xl text-sm transition-all"
            >
              <Square className="w-4 h-4 text-accent-rose" />
              <span>Stop & Save Recording</span>
            </button>
          )}

          {recordingState === "uploaded" && (
            <button
              onClick={triggerTranscriptionAndProceed}
              disabled={isTranscribing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-accent-indigo to-accent-violet hover:from-accent-indigo/90 hover:to-accent-violet/90 text-white font-semibold py-3.5 px-5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 border border-white/5 group"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Scheduling Whisper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Transcription</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error alert message */}
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
    console.error(`[Recording] ${msg}:`, err);
  }
};

export default function LiveInterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading recording view...</span>
      </div>
    }>
      <LiveRecordingContent />
    </Suspense>
  );
}
