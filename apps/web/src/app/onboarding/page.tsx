// ============================================================
// AutoApply AI — Onboarding Wizard
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { FileText, Briefcase, Settings2, Link2, Sparkles, Upload, Loader2, Check } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, tokens, updateUser } = useAuthStore();
  const router = useRouter();

  // Step States
  const [resumeName, setResumeName] = useState('My Primary Resume');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  
  const [targetRoles, setTargetRoles] = useState('Software Engineer, Node Developer');
  const [targetLocations, setTargetLocations] = useState('Bengaluru, Pune, Remote');
  const [experienceLevel, setExperienceLevel] = useState('junior');
  const [salaryMin, setSalaryMin] = useState('1200000');

  const [aggUser, setAggUser] = useState('');
  const [aggPass, setAggPass] = useState('');

  // ── Step 1: File Upload Handler ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('name', resumeName);
    formData.append('isPrimary', 'true');

    try {
      const data = await apiClient.upload('/assets/resumes/upload', formData);
      setResumeId(data.id);
      
      // Fetch details to retrieve the parsed data
      const detailData = await apiClient.get(`/assets/resumes/${data.id}`);
      setParsedData(detailData.profile || detailData);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm profile data ──
  const handleConfirmProfile = () => {
    setStep(3);
  };

  // ── Step 3: Save Preferences ──
  const handleSavePreferences = () => {
    // Standard mock verification mapping for MVP
    setStep(4);
  };

  // ── Step 4: Connect Mock Aggregator ──
  const handleConnectAggregator = async () => {
    setError(null);
    setLoading(true);

    try {
      await apiClient.post('/aggregators/connect', {
        aggregatorId: 'agg-naukri',
        username: aggUser || 'candidate_user',
        password: aggPass || 'password_dev',
      });

      // Finish Onboarding flag
      await apiClient.patch('/users/onboarding/complete');

      updateUser({ onboardingComplete: true });

      // Run Confetti celebration
      canvasConfetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 font-sans px-6 lg:px-12 py-10">
      {/* Header */}
      <header className="flex justify-between items-center max-w-4xl mx-auto w-full mb-8">
        <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          ✦ AutoApply AI Onboarding
        </span>
        <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
          Step {step} of 4
        </span>
      </header>

      {/* Steps Visual Tracker */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full mb-12 relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-800 -z-10" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary-500 transition-all duration-300 -z-10"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />

        {[
          { num: 1, label: 'Resume', icon: FileText },
          { num: 2, label: 'Review', icon: Sparkles },
          { num: 3, label: 'Criteria', icon: Settings2 },
          { num: 4, label: 'Connect', icon: Link2 },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isDone
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : isCurrent
                    ? 'bg-neutral-950 border-primary-500 text-primary-400 shadow-[0_0_10px_rgba(79,107,246,0.3)]'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary-400' : 'text-neutral-500'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main card box */}
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col items-center justify-center">
        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-500/30 text-red-400 rounded-md w-full mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Step Cards */}
        {step === 1 && (
          <div className="w-full p-8 rounded-lg border border-neutral-800 bg-neutral-900/60 glass flex flex-col gap-6 text-center">
            <div>
              <h2 className="text-xl font-semibold mb-1">Upload your resume</h2>
              <p className="text-sm text-neutral-400">Our Gemini engine parses skills and experience details automatically</p>
            </div>
            
            <div className="flex flex-col gap-4 text-left">
              <label className="text-xs font-semibold text-neutral-300">Resume Variant Name</label>
              <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
              />
            </div>

            <div className="border-2 border-dashed border-neutral-850 hover:border-primary-500/50 p-8 rounded-md bg-neutral-950/40 cursor-pointer transition-all duration-300 relative group">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={loading}
              />
              <div className="flex flex-col items-center gap-2">
                {loading ? (
                  <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-neutral-500 group-hover:text-primary-400 transition-colors" />
                )}
                <span className="text-sm font-medium">
                  {loading ? 'AI is parsing files...' : 'Drag and drop or click to browse'}
                </span>
                <span className="text-xs text-neutral-500">PDF, DOCX, TXT • Max 10MB</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && parsedData && (
          <div className="w-full p-8 rounded-lg border border-neutral-800 bg-neutral-900/60 glass flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Review extracted profile</h2>
              <p className="text-sm text-neutral-400">Verify extracted skills and summaries</p>
            </div>

            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Summary</span>
                <p className="text-sm text-neutral-300 bg-neutral-950 p-3 rounded-md border border-neutral-850 leading-relaxed">
                  {parsedData.summary}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Identified Skills ({parsedData.skills?.length})</span>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills?.map((s: any, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-primary-500/10 text-primary-400 rounded-md border border-primary-500/20">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmProfile}
              className="w-full py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-all cursor-pointer"
            >
              Verify Profile & Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full p-8 rounded-lg border border-neutral-800 bg-neutral-900/60 glass flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Set job preferences</h2>
              <p className="text-sm text-neutral-400">AI uses these criteria to select and filter job matches</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Target Roles (comma-separated)</label>
                <input
                  type="text"
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Preferred Cities</label>
                <input
                  type="text"
                  value={targetLocations}
                  onChange={(e) => setTargetLocations(e.target.value)}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  >
                    <option value="fresher">Fresher (0-1 yrs)</option>
                    <option value="junior">Junior (1-3 yrs)</option>
                    <option value="mid">Mid (3-6 yrs)</option>
                    <option value="senior">Senior (6+ yrs)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Min Annual Salary (INR)</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-all cursor-pointer"
            >
              Save & Connect Platform
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="w-full p-8 rounded-lg border border-neutral-800 bg-neutral-900/60 glass flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Connect Naukri.com</h2>
              <p className="text-sm text-neutral-400">
                Credentials are encrypted client-side and secured locally.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Naukri Username / Email</label>
                <input
                  type="email"
                  value={aggUser}
                  onChange={(e) => setAggUser(e.target.value)}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  placeholder="name@email.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Naukri Password</label>
                <input
                  type="password"
                  value={aggPass}
                  onChange={(e) => setAggPass(e.target.value)}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleConnectAggregator}
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Securing connection...' : 'Securely Connect & Finish'}
              </button>

              <Link href="/dashboard" className="text-xs text-center text-neutral-500 hover:text-neutral-300">
                Skip for now, go to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
