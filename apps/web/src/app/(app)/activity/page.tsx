// ============================================================
// AutoApply AI — Activity Feed Page
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';
import {
  Activity, CheckCircle, AlertCircle, Clock, RefreshCw, X,
  Search, ShieldAlert, FileText, Calendar, ArrowRight, Info
} from 'lucide-react';

export default function ActivityPage() {
  const { tokens } = useAuthStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // ── Fetch Applications ──
  const fetchApplications = async () => {
    try {
      const response = await apiClient.get('/applier/applications');
      const data = response.data;
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (e) {
      console.error('Error loading applications:', e);
    }
  };

  // ── Socket.IO Connection ──
  useEffect(() => {
    fetchApplications();

    if (!tokens?.accessToken) return;

    // Connect to WebSocket gateway
    const socket: Socket = io('http://localhost:4000', {
      auth: {
        token: tokens.accessToken,
      },
    });

    socket.on('connect', () => {
      console.log('[WS] Connected to dashboard gateway');
    });

    const handleUpdate = (payload: any) => {
      setApplications(prev => {
        const idx = prev.findIndex(a => a.id === payload.id);
        if (idx === -1) {
          return [payload, ...prev];
        }
        const updated = [...prev];
        updated[idx] = payload;
        return updated;
      });

      // Update selected modal details if open
      setSelectedApp((prev: any) => {
        if (prev?.id === payload.id) {
          return payload;
        }
        return prev;
      });
    };

    socket.on('application:progress', handleUpdate);
    socket.on('application:submitted', handleUpdate);
    socket.on('application:failed', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [tokens]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'filling':
        return <Loader2 className="h-4 w-4 text-primary-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-500" />;
    }
  };

  const Loader2 = ({ className }: { className?: string }) => (
    <RefreshCw className={`animate-spin ${className}`} />
  );

  // Filter application rows
  const filteredApps = applications.filter((app) => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch =
      app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.aggregatorName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full w-full gap-8 relative overflow-hidden">
      {/* ── Main Activity Feed list ── */}
      <div className="flex-1 flex flex-col gap-6 text-left">
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tab selectors */}
          <div className="flex gap-2 border-b border-neutral-900 w-full md:w-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'queued', label: 'Queued' },
              { id: 'filling', label: 'Filling' },
              { id: 'submitted', label: 'Submitted' },
              { id: 'failed', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                  filter === tab.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search company or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-900 focus:border-primary-500 outline-none rounded-md text-xs text-neutral-200 transition-all"
            />
          </div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-2">
          {filteredApps.length === 0 ? (
            <div className="text-center py-12 border border-neutral-900 rounded-lg text-xs text-neutral-600 bg-neutral-950/20">
              No matching activity events found.
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  selectedApp?.id === app.id
                    ? 'border-primary-500/40 bg-primary-500/5 shadow-[0_0_15px_rgba(79,107,246,0.05)]'
                    : 'border-neutral-900 bg-neutral-950 hover:border-neutral-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-neutral-900 border border-neutral-850">
                    {getStatusIcon(app.status)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-200">{app.jobTitle}</span>
                    <span className="text-[10px] text-neutral-500 font-medium">{app.company} • {app.aggregatorName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  {/* Progress filler indicator */}
                  {app.status === 'filling' && app.progress && (
                    <div className="flex flex-col items-end gap-1 w-24">
                      <span className="text-[9px] text-primary-400 font-semibold truncate max-w-[90px]">{app.progress.stepLabel}</span>
                      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${app.progress.percentage}%` }} />
                      </div>
                    </div>
                  )}

                  <span className="text-xs font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-md">
                    {app.matchScore}% Match
                  </span>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-neutral-300 capitalize">{app.statusLabel}</span>
                    <span className="text-[9px] text-neutral-500">
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleTimeString() : new Date(app.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Slide-over Side Panel: Outcome details ── */}
      {selectedApp && (
        <div className="w-96 border-l border-neutral-900 bg-neutral-950 p-6 flex flex-col gap-6 text-left shrink-0 animate-in slide-in-from-right duration-250">
          <div className="flex justify-between items-start border-b border-neutral-900 pb-4">
            <div className="flex flex-col">
              <h3 className="font-bold text-sm">Application Details</h3>
              <span className="text-[10px] text-neutral-500 truncate max-w-[200px]">ID: {selectedApp.id}</span>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              className="p-1 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] pr-1">
            {/* Meta */}
            <div className="flex flex-col gap-3 p-4 rounded-md bg-neutral-900/30 border border-neutral-900">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Status</span>
                <span className="text-xs font-semibold text-neutral-200 capitalize">{selectedApp.statusLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Match Score</span>
                <span className="text-xs font-bold text-primary-400">{selectedApp.matchScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Resume Variant</span>
                <span className="text-xs font-semibold text-neutral-200 truncate max-w-[150px]">{selectedApp.resumeVariantName}</span>
              </div>
            </div>

            {/* Failure Reason */}
            {selectedApp.status === 'failed' && (
              <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-md flex items-start gap-3">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Crashed or Blocked Outcome</span>
                  <p className="text-xs leading-relaxed text-neutral-300">
                    {selectedApp.failureReason}
                  </p>
                </div>
              </div>
            )}

            {/* Match score breakdown */}
            {selectedApp.matchBreakdown && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Match Assessment Logs</span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Keyword matching coverage', val: selectedApp.matchBreakdown.keyword },
                    { label: 'Semantic role alignment', val: selectedApp.matchBreakdown.semantic },
                    { label: 'Structural parameters compliance', val: selectedApp.matchBreakdown.structural },
                  ].map((log, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-medium text-neutral-400">
                        <span>{log.label}</span>
                        <span>{log.val}%</span>
                      </div>
                      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${log.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Details preview */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Job Parameters</span>
              <div className="p-4 rounded-md border border-neutral-900 bg-neutral-900/10 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-neutral-400 font-bold">{selectedApp.jobTitle}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>{selectedApp.company}</span>
                  <span>{selectedApp.location || 'Remote'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
