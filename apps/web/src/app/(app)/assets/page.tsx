// ============================================================
// AutoApply AI — Asset Management Page
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import {
  Upload, FileText, Trash2, Award, Calendar, ExternalLink,
  ChevronRight, Sparkles, Check, Loader2
} from 'lucide-react';

export default function AssetsPage() {
  const { tokens } = useAuthStore();
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any | null>(null);
  const [resumeDetails, setResumeDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const data = await apiClient.get('/assets/resumes');
      if (Array.isArray(data)) {
        setResumes(data);
        if (data.length > 0 && !selectedResume) {
          handleSelectResume(data[0]);
        }
      }
    } catch (e) {
      console.error('Error loading resumes:', e);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleSelectResume = async (resume: any) => {
    setSelectedResume(resume);
    setLoadingDetails(true);
    setResumeDetails(null);

    try {
      const data = await apiClient.get(`/assets/resumes/${resume.id}`);
      setResumeDetails(data.profile);
    } catch (e) {
      console.error('Error loading resume profile:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('name', fileList[0].name.replace(/\.[^/.]+$/, ""));
    formData.append('isPrimary', resumes.length === 0 ? 'true' : 'false');

    try {
      const data = await apiClient.upload('/assets/resumes/upload', formData);
      await fetchResumes();
      handleSelectResume(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume variant?')) return;

    try {
      await apiClient.delete(`/assets/resumes/${id}`);
      if (selectedResume?.id === id) {
        setSelectedResume(null);
        setResumeDetails(null);
      }
      await fetchResumes();
    } catch (err) {
      console.error('Delete variant error:', err);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* ── Left side: Upload and variant cards ── */}
      <div className="flex flex-col gap-6 lg:col-span-1 text-left">
        {/* Upload card */}
        <div className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-4">
          <h3 className="font-bold text-sm">Upload New Resume</h3>
          {error && <span className="text-xs text-red-400">⚠️ {error}</span>}
          
          <label className="border border-dashed border-neutral-850 hover:border-primary-500/50 p-6 rounded-md bg-neutral-900/30 cursor-pointer flex flex-col items-center gap-2 text-center transition-all duration-300">
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            {uploading ? (
              <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-neutral-500" />
            )}
            <span className="text-xs font-semibold text-neutral-300">
              {uploading ? 'Parsing profile details...' : 'Click to upload resume'}
            </span>
            <span className="text-[10px] text-neutral-600">PDF, DOCX, TXT • Max 10MB</span>
          </label>
        </div>

        {/* Variants List */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Resume Variants ({resumes.length})</span>
          {resumes.length === 0 ? (
            <div className="text-center py-8 border border-neutral-900 rounded-lg text-xs text-neutral-600 bg-neutral-950/20">
              No resumes uploaded yet.
            </div>
          ) : (
            resumes.map((resume) => {
              const isSelected = selectedResume?.id === resume.id;
              return (
                <div
                  key={resume.id}
                  onClick={() => handleSelectResume(resume)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 flex justify-between items-center ${
                    isSelected
                      ? 'border-primary-500/40 bg-primary-500/5 shadow-[0_0_15px_rgba(79,107,246,0.05)]'
                      : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-neutral-900 border border-neutral-850">
                      <FileText className="h-4 w-4 text-primary-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200 truncate max-w-[150px]">
                        {resume.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        v{resume.version} • {Math.round(resume.fileSize / 1024)} KB
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md">
                      {resume.atsScore} ATS
                    </span>
                    <button
                      onClick={(e) => handleDeleteResume(resume.id, e)}
                      className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right side: Parsed profile display ── */}
      <div className="lg:col-span-2 text-left">
        {selectedResume ? (
          <div className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <div className="flex flex-col">
                <h3 className="font-bold text-sm">{selectedResume.name} Details</h3>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Parsed at: {new Date(selectedResume.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  ATS Score: {selectedResume.atsScore}/100
                </span>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-20 flex flex-col items-center justify-center text-xs text-neutral-500 gap-3">
                <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
                Loading parsed details...
              </div>
            ) : resumeDetails ? (
              <div className="flex flex-col gap-6">
                {/* Summary */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Executive Summary</span>
                  <p className="text-xs text-neutral-300 bg-neutral-900/30 p-4 rounded-md border border-neutral-900 leading-relaxed">
                    {resumeDetails.summary}
                  </p>
                </div>

                {/* Skills */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Extracted Skill tags ({resumeDetails.skills?.length || 0})</span>
                  <div className="flex flex-wrap gap-2">
                    {resumeDetails.skills?.map((skill: any, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 font-medium">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Work Experience</span>
                  <div className="flex flex-col gap-4">
                    {resumeDetails.workExperience?.map((work: any) => (
                      <div key={work.id} className="p-4 rounded-md border border-neutral-900 bg-neutral-900/10 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-neutral-200">{work.title}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">{work.company} • {work.location}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-semibold">
                            {work.startDate} → {work.current ? 'Present' : work.endDate}
                          </span>
                        </div>
                        <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                          {work.bullets?.map((bullet: string, idx: number) => (
                            <li key={idx} className="text-[11px] text-neutral-400 leading-normal">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-neutral-500">
                No parsed profile metadata found for this variant.
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 border border-dashed border-neutral-850 rounded-lg text-center text-xs text-neutral-500 bg-neutral-950/10 flex flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-neutral-600" />
            <span>Select or upload a resume variant to review its parameters.</span>
          </div>
        )}
      </div>
    </div>
  );
}
