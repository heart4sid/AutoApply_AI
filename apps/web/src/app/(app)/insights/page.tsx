// ============================================================
// AutoApply AI — AI Insights Center Page
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Brain, Award, Sparkles, TrendingUp, AlertCircle, BookOpen,
  ArrowRight, CheckCircle2, ChevronRight, Loader2, Info
} from 'lucide-react';

export default function InsightsPage() {
  const { tokens } = useAuthStore();
  const [gaps, setGaps] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const gapResp = await fetch('http://localhost:4000/api/v1/insights/skill-gap', {
        headers: { 'Authorization': `Bearer ${tokens?.accessToken}` },
      });
      const gapData = await gapResp.json();
      if (Array.isArray(gapData)) setGaps(gapData);

      const sugResp = await fetch('http://localhost:4000/api/v1/insights/suggestions', {
        headers: { 'Authorization': `Bearer ${tokens?.accessToken}` },
      });
      const sugData = await sugResp.json();
      if (Array.isArray(sugData)) setSuggestions(sugData);
    } catch (e) {
      console.error('Error fetching insights:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'medium':
        return 'bg-primary-500/10 text-primary-400 border border-primary-500/20';
      default:
        return 'bg-neutral-900 text-neutral-400 border border-neutral-800';
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* ── Left columns: Gaps and suggest revisions ── */}
      <div className="lg:col-span-2 flex flex-col gap-6 text-left">
        {/* Suggest revisions list */}
        <div className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
            <Sparkles className="h-5 w-5 text-primary-400" />
            <h3 className="font-bold text-sm">Suggested Resume Revisions</h3>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500">
              No profile recommendations found. Upload a resume variant to begin analysis.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {suggestions.map((sug) => (
                <div key={sug.id} className="p-5 rounded-md border border-neutral-900 bg-neutral-900/10 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-neutral-200">{sug.title}</span>
                      <span className="text-[11px] text-neutral-400 leading-normal">{sug.description}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-primary-500/10 text-primary-400 border border-primary-500/20">
                      {sug.impact} impact
                    </span>
                  </div>

                  {sug.currentText && sug.suggestedText && (
                    <div className="grid sm:grid-cols-2 gap-4 text-xs mt-1">
                      <div className="flex flex-col gap-1.5 p-3 rounded bg-neutral-950 border border-neutral-900">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Current Text</span>
                        <p className="text-neutral-400 leading-relaxed italic">&ldquo;{sug.currentText}&rdquo;</p>
                      </div>
                      <div className="flex flex-col gap-1.5 p-3 rounded bg-primary-500/5 border border-primary-500/20">
                        <span className="text-[9px] font-bold text-primary-400 uppercase">Suggested Revision</span>
                        <p className="text-neutral-200 leading-relaxed font-semibold">&ldquo;{sug.suggestedText}&rdquo;</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-semibold border-t border-neutral-900/60 pt-3">
                    <Info className="h-3 w-3 text-primary-400" />
                    <span>Reason: {sug.dataReason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right column: Skill gaps and targets ── */}
      <div className="flex flex-col gap-6 text-left">
        {/* Gap list */}
        <div className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
            <Brain className="h-5 w-5 text-primary-400" />
            <h3 className="font-bold text-sm">Market Skill-Gap Metrics</h3>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
            </div>
          ) : gaps.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500">
              No skill gaps calculated.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {gaps.map((gap, idx) => (
                <div key={idx} className="p-4 rounded-md border border-neutral-900 bg-neutral-900/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-200">{gap.skill}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${getSeverityColor(gap.severity)}`}>
                      {gap.severity} gap
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Market Demand Frequency</span>
                      <span>{gap.demandPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500" style={{ width: `${gap.demandPercentage}%` }} />
                    </div>
                  </div>

                  {gap.learningResource && (
                    <div className="mt-1 p-2.5 rounded bg-neutral-950 border border-neutral-900 flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Recommended Course</span>
                        <span className="text-[10px] text-neutral-300 font-semibold truncate max-w-[150px]">
                          {gap.learningResource.title}
                        </span>
                      </div>
                      <a
                        href={gap.learningResource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
