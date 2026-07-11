"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Target,
  ListTodo,
  Briefcase
} from "lucide-react";

interface ParsedCandidateData {
  id: number;
  name: string;
  email: string | null;
  resume_id: number;
  parsed_data: {
    skills: string[];
    experience: {
      summary: string;
      projects: string[];
      certifications: string[];
    };
    education: string;
  };
}

interface ParsedJobData {
  id: number;
  role: string;
  jd_path: string;
  parsed_data: {
    required_skills: string[];
    preferred_skills: string[];
    experience: string;
    responsibilities: string[];
  };
}

export default function CreateInterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Shared State
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1 States (Candidate & Resume)
  const [candidateName, setCandidateName] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<ParsedCandidateData | null>(null);
  
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Step 2 States (Job Description)
  const [jobRole, setJobRole] = useState("");
  const [selectedJdFile, setSelectedJdFile] = useState<File | null>(null);
  const [jdDragActive, setJdDragActive] = useState(false);
  const [isJdUploading, setIsJdUploading] = useState(false);
  const [parsedJob, setParsedJob] = useState<ParsedJobData | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  
  const jdInputRef = useRef<HTMLInputElement>(null);

  // Helper for document dragging
  const handleDrag = (e: React.DragEvent, type: "resume" | "jd") => {
    e.preventDefault();
    e.stopPropagation();
    const isActive = e.type === "dragenter" || e.type === "dragover";
    if (type === "resume") setResumeDragActive(isActive);
    else setJdDragActive(isActive);
  };

  const handleDrop = (e: React.DragEvent, type: "resume" | "jd") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "resume") {
      setResumeDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetResume(e.dataTransfer.files[0]);
    } else {
      setJdDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetJd(e.dataTransfer.files[0]);
    }
  };

  // Step 1 Resume Upload validation
  const validateAndSetResume = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf" && ext !== ".docx") {
      setErrorMessage("Only PDF and DOCX resume formats are supported.");
      setSelectedResumeFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Resume file exceeds the maximum 10MB limit.");
      setSelectedResumeFile(null);
      return;
    }
    setErrorMessage("");
    setSelectedResumeFile(file);
    if (!candidateName) {
      const cleanName = file.name.replace(/_|-|resume|cv/gi, " ").replace(/\.[^/.]+$/, "").trim();
      setCandidateName(cleanName.replace(/\b\w/g, c => c.toUpperCase()));
    }
  };

  // Step 2 JD Upload validation
  const validateAndSetJd = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf" && ext !== ".docx") {
      setErrorMessage("Only PDF and DOCX job description formats are supported.");
      setSelectedJdFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("JD file exceeds the maximum 10MB limit.");
      setSelectedJdFile(null);
      return;
    }
    setErrorMessage("");
    setSelectedJdFile(file);
    if (!jobRole) {
      const cleanRole = file.name.replace(/_|-|jd|job|desc/gi, " ").replace(/\.[^/.]+$/, "").trim();
      setJobRole(cleanRole.replace(/\b\w/g, c => c.toUpperCase()));
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeFile || !candidateName.trim()) {
      setErrorMessage("Please complete all inputs before submitting.");
      return;
    }
    setIsResumeUploading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("name", candidateName);
    formData.append("file", selectedResumeFile);
    try {
      const res = await api.post<any>("/candidates/upload-resume", formData);
      if (res.success && res.candidate) {
        setParsedCandidate(res.candidate);
      } else {
        setErrorMessage("Failed to read parsed candidate details.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse resume.");
    } finally {
      setIsResumeUploading(false);
    }
  };

  const handleJdUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJdFile || !jobRole.trim()) {
      setErrorMessage("Please complete all inputs before submitting.");
      return;
    }
    setIsJdUploading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("role", jobRole);
    formData.append("file", selectedJdFile);
    try {
      const res = await api.post<any>("/jobs/upload-jd", formData);
      if (res.success && res.job) {
        setParsedJob(res.job);
      } else {
        setErrorMessage("Failed to read parsed job details.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse job description.");
    } finally {
      setIsJdUploading(false);
    }
  };

  // Connects candidate & job, redirecting to recording page
  const handleLinkAndProceed = async () => {
    if (!parsedCandidate || !parsedJob) return;
    setIsLinking(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("candidate_id", parsedCandidate.id.toString());
    formData.append("job_id", parsedJob.id.toString());
    try {
      const res = await api.post<any>("/interviews/create", formData);
      if (res.success && res.interview) {
        // Route to Screen 5: Live Recording, passing interview ID
        router.push(`/interviews/live?id=${res.interview.id}`);
      } else {
        setErrorMessage("Failed to create interview session mapping.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error linking candidate and job descriptions.");
    } finally {
      setIsLinking(false);
    }
  };

  const resetResumeStep = () => {
    setSelectedResumeFile(null);
    setParsedCandidate(null);
    setCandidateName("");
    setErrorMessage("");
  };

  const resetJdStep = () => {
    setSelectedJdFile(null);
    setParsedJob(null);
    setJobRole("");
    setErrorMessage("");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Step Indicator Panel */}
      <div className="flex items-center justify-between border-b border-card-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Setup Interview Session</h2>
          <p className="text-xs text-slate-500">Configure candidate credentials and job profile settings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 1 ? "bg-accent-indigo text-white shadow-md shadow-indigo-500/20" : "bg-accent-emerald text-white"
            }`}>
              1
            </div>
            <span className={`text-xs font-semibold ${step === 1 ? "text-slate-200" : "text-slate-500"}`}>Candidate details</span>
          </div>
          <div className="w-10 h-[2px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 2 ? "bg-accent-indigo text-white shadow-md shadow-indigo-500/20" : "bg-slate-800 text-slate-500"
            }`}>
              2
            </div>
            <span className={`text-xs font-semibold ${step === 2 ? "text-slate-200" : "text-slate-500"}`}>Job specification</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        /* STEP 1 UI (Candidate details and Resume Upload) */
        <div className="space-y-6">
          {!parsedCandidate ? (
            <form onSubmit={handleResumeUpload} className="space-y-6">
              <div className="bg-card-bg/50 border border-card-border p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-indigo" />
                  <span>Candidate Identity details</span>
                </h3>
                
                <div className="space-y-1.5">
                  <label htmlFor="candidate-name" className="text-xs font-semibold text-slate-400">Candidate Name</label>
                  <input
                    id="candidate-name"
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter Candidate's full name"
                    className="w-full bg-sidebar-bg border border-card-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent-indigo transition-colors"
                    required
                  />
                </div>
              </div>

              <div
                onDragEnter={(e) => handleDrag(e, "resume")}
                onDragOver={(e) => handleDrag(e, "resume")}
                onDragLeave={(e) => handleDrag(e, "resume")}
                onDrop={(e) => handleDrop(e, "resume")}
                onClick={() => resumeInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                  resumeDragActive
                    ? "border-accent-indigo bg-accent-indigo/5"
                    : selectedResumeFile
                    ? "border-accent-emerald bg-accent-emerald/5"
                    : "border-card-border bg-card-bg/30 hover:border-slate-700 hover:bg-card-bg/40"
                }`}
              >
                <input
                  ref={resumeInputRef}
                  type="file"
                  onChange={(e) => { if (e.target.files?.[0]) validateAndSetResume(e.target.files[0]); }}
                  accept=".pdf,.docx"
                  className="hidden"
                />

                {selectedResumeFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-accent-emerald/10 border border-accent-emerald/20 p-4 rounded-full text-accent-emerald">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-200 max-w-md truncate">{selectedResumeFile.name}</div>
                      <div className="text-xs text-slate-500">{(selectedResumeFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 rounded-full text-[10px] font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready to Upload & Parse</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-accent-indigo/10 border border-accent-indigo/20 p-4 rounded-full text-accent-indigo">
                      <UploadCloud className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-200">Drag & drop candidate resume here</div>
                      <div className="text-xs text-slate-500 mt-1">Supports PDF and Word (.docx) formats up to 10MB</div>
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold bg-accent-indigo/15 border border-accent-indigo/20 text-accent-indigo hover:bg-accent-indigo/25 px-4 py-2 rounded-xl transition-all"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium">{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {selectedResumeFile && (
                  <button
                    type="button"
                    onClick={resetResumeStep}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-4 py-3 rounded-xl transition-all"
                  >
                    Clear Selection
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isResumeUploading || !selectedResumeFile || !candidateName.trim()}
                  className={`flex items-center gap-2 font-semibold text-white px-6 py-3 rounded-xl shadow-lg transition-all text-sm ${
                    isResumeUploading || !selectedResumeFile || !candidateName.trim()
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-accent-indigo hover:bg-accent-indigo/90 shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
                  }`}
                >
                  {isResumeUploading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Extracting Text & Structuring...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Parse CV</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <div className="text-xs font-bold leading-tight">Parsing complete!</div>
                    <div className="text-[11px] text-slate-400">Candidate record successfully created in database.</div>
                  </div>
                </div>
                <button
                  onClick={resetResumeStep}
                  className="p-1.5 rounded-lg bg-accent-emerald/10 hover:bg-accent-emerald/20 border border-accent-emerald/20 text-accent-emerald transition-colors"
                  title="Upload another resume"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-bg/50 border border-card-border p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Candidate Profile</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Name</span>
                      <div className="text-sm font-semibold text-slate-200">{parsedCandidate.name}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Email</span>
                      <div className="text-sm font-semibold text-slate-200 truncate">{parsedCandidate.email || "No email parsed"}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Education</span>
                      <div className="text-xs text-slate-300 leading-normal">{parsedCandidate.parsed_data.education}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-card-bg/50 border border-card-border p-5 rounded-2xl space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Extracted Technical Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedCandidate.parsed_data.skills.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 text-[11px] font-semibold bg-accent-indigo/10 border border-accent-indigo/25 text-accent-indigo rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Professional Experience Summary</h4>
                    <p className="text-xs text-slate-300 leading-normal bg-sidebar-bg/60 p-3 rounded-xl border border-card-border">
                      {parsedCandidate.parsed_data.experience.summary}
                    </p>
                  </div>

                  {parsedCandidate.parsed_data.experience.projects && parsedCandidate.parsed_data.experience.projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Extracted Projects</h4>
                      <div className="space-y-2">
                        {parsedCandidate.parsed_data.experience.projects.map((proj, idx) => (
                          <div 
                            key={idx}
                            className="text-xs text-slate-300 bg-sidebar-bg/30 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5"
                          >
                            <FileText className="w-4 h-4 text-accent-indigo mt-0.5 flex-shrink-0" />
                            <span>{proj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-card-border pt-5">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Candidate Saved (ID: {parsedCandidate.id})</span>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-accent-indigo hover:bg-accent-indigo/90 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md group"
                >
                  <span>Proceed to Job Specification</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STEP 2 UI (Job details and JD document upload) */
        <div className="space-y-6">
          {!parsedJob ? (
            <form onSubmit={handleJdUpload} className="space-y-6">
              <div className="bg-card-bg/50 border border-card-border p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-accent-indigo" />
                  <span>Job Specification details</span>
                </h3>
                
                <div className="space-y-1.5">
                  <label htmlFor="job-role" className="text-xs font-semibold text-slate-400">Target Role / Title</label>
                  <input
                    id="job-role"
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-sidebar-bg border border-card-border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent-indigo transition-colors"
                    required
                  />
                </div>
              </div>

              <div
                onDragEnter={(e) => handleDrag(e, "jd")}
                onDragOver={(e) => handleDrag(e, "jd")}
                onDragLeave={(e) => handleDrag(e, "jd")}
                onDrop={(e) => handleDrop(e, "jd")}
                onClick={() => jdInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                  jdDragActive
                    ? "border-accent-indigo bg-accent-indigo/5"
                    : selectedJdFile
                    ? "border-accent-emerald bg-accent-emerald/5"
                    : "border-card-border bg-card-bg/30 hover:border-slate-700 hover:bg-card-bg/40"
                }`}
              >
                <input
                  ref={jdInputRef}
                  type="file"
                  onChange={(e) => { if (e.target.files?.[0]) validateAndSetJd(e.target.files[0]); }}
                  accept=".pdf,.docx"
                  className="hidden"
                />

                {selectedJdFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-accent-emerald/10 border border-accent-emerald/20 p-4 rounded-full text-accent-emerald">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-200 max-w-md truncate">{selectedJdFile.name}</div>
                      <div className="text-xs text-slate-500">{(selectedJdFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 rounded-full text-[10px] font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready to Upload & Parse</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-accent-indigo/10 border border-accent-indigo/20 p-4 rounded-full text-accent-indigo">
                      <UploadCloud className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-200">Drag & drop Target Job Description here</div>
                      <div className="text-xs text-slate-500 mt-1">Supports PDF and Word (.docx) formats up to 10MB</div>
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold bg-accent-indigo/15 border border-accent-indigo/20 text-accent-indigo hover:bg-accent-indigo/25 px-4 py-2 rounded-xl transition-all"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium">{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-card-border pt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>
                <div className="flex gap-3">
                  {selectedJdFile && (
                    <button
                      type="button"
                      onClick={resetJdStep}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-4 py-3 rounded-xl transition-all"
                    >
                      Clear Selection
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isJdUploading || !selectedJdFile || !jobRole.trim()}
                    className={`flex items-center gap-2 font-semibold text-white px-6 py-3 rounded-xl shadow-lg transition-all text-sm ${
                      isJdUploading || !selectedJdFile || !jobRole.trim()
                        ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-accent-indigo hover:bg-accent-indigo/90 shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
                    }`}
                  >
                    {isJdUploading ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Structuring Job Specs...</span>
                      </>
                    ) : (
                      <>
                        <span>Upload & Parse JD</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Structured JD Details Panel */
            <div className="space-y-6">
              <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <div className="text-xs font-bold leading-tight">Job Specs parsed!</div>
                    <div className="text-[11px] text-slate-400">Job specification parameters successfully created in database.</div>
                  </div>
                </div>
                <button
                  onClick={resetJdStep}
                  className="p-1.5 rounded-lg bg-accent-emerald/10 hover:bg-accent-emerald/20 border border-accent-emerald/20 text-accent-emerald transition-colors"
                  title="Upload another JD"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Requirement Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-bg/50 border border-card-border p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Job Profile Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Role / Title</span>
                      <div className="text-sm font-semibold text-slate-200">{parsedJob.role}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Experience Requirement</span>
                      <div className="text-sm font-semibold text-slate-200">{parsedJob.parsed_data.experience}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-card-bg/50 border border-card-border p-5 rounded-2xl space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Skills Requirements</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-accent-indigo font-bold uppercase tracking-wider block mb-1">Required Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedJob.parsed_data.required_skills.map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-1 text-[11px] font-semibold bg-accent-indigo/10 border border-accent-indigo/25 text-accent-indigo rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      {parsedJob.parsed_data.preferred_skills.length > 0 && (
                        <div>
                          <span className="text-[9px] text-accent-cyan font-bold uppercase tracking-wider block mb-1">Preferred Skills</span>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedJob.parsed_data.preferred_skills.map((skill, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-1 text-[11px] font-semibold bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Main Responsibilities</h4>
                    <div className="space-y-2">
                      {parsedJob.parsed_data.responsibilities.map((resp, idx) => (
                        <div 
                          key={idx}
                          className="text-xs text-slate-300 bg-sidebar-bg/30 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5"
                        >
                          <ListTodo className="w-4 h-4 text-accent-indigo mt-0.5 flex-shrink-0" />
                          <span>{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linking triggering block */}
              {errorMessage && (
                <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium">{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-card-border pt-5">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>
                <button
                  onClick={handleLinkAndProceed}
                  disabled={isLinking}
                  className="flex items-center gap-2 bg-gradient-to-tr from-accent-indigo to-accent-violet hover:from-accent-indigo/90 hover:to-accent-violet/90 text-white font-semibold px-6 py-3 rounded-xl text-xs transition-all shadow-md group border border-white/5"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Interview Slot...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Confirm Details & Link Interview</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
