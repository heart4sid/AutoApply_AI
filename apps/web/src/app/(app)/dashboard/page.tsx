// ============================================================
// AutoApply AI — Dashboard Page
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import {
  Play, Pause, RefreshCw, Upload, AlertCircle, CheckCircle, Clock,
  ArrowUpRight, Sparkles, Target, Zap
} from 'lucide-react';

export default function DashboardPage() {
  const { user, tokens } = useAuthStore();
  const [engineActive, setEngineActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    filling: 0,
    failed: 0,
    avgScore: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/applier/applications');
      const data = response.data;
      if (Array.isArray(data)) {
        setRecentApps(data.slice(0, 4));
        
        // Compute metrics
        const total = response.meta?.total || data.length;
        const submitted = data.filter((a: any) => a.status === 'submitted').length;
        const filling = data.filter((a: any) => a.status === 'filling').length;
        const failed = data.filter((a: any) => a.status === 'failed').length;
        const avgScore = data.length > 0 
          ? Math.round(data.reduce((acc: number, cur: any) => acc + (cur.matchScore || 0), 0) / data.length)
          : 0;

        setStats({ total, submitted, filling, failed, avgScore });
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll updates every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerScan = async () => {
    setLoading(true);
    try {
      // Connect mock naukri connection in case none exists
      // so the scan works cleanly
      await apiClient.post('/aggregators/connect', {
        aggregatorId: 'agg-naukri',
        username: 'demo_user@email.com',
        password: 'demo_password',
        consentGiven: true,
      });

      // Run scanner scan call
      await apiClient.post('/applier/scan', { aggregatorId: 'agg-naukri' });

      fetchDashboardData();
    } catch (e) {
      console.error('Scan trigger error:', e);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-8">
      {/* ── Engine Status Card ── */}
      <div className={`p-6 rounded-lg border transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 ${
        engineActive
          ? 'bg-primary-500/5 border-primary-500/30 shadow-[0_0_20px_rgba(79,107,246,0.05)]'
          : 'bg-neutral-900 border-neutral-800'
      }`}>
        <div className="flex items-center gap-4 text-left w-full">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            engineActive ? 'bg-primary-500/10 text-primary-400' : 'bg-neutral-950 text-neutral-500'
          }`}>
            <Zap className={`h-5 w-5 ${engineActive ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">
              AI Apply Engine is {engineActive ? 'ACTIVE' : 'PAUSED'}
            </span>
            <span className="text-xs text-neutral-400">
              {engineActive
                ? 'Autonomous scanner is matching and applying to listings on Naukri.com.'
                : 'Auto-applying is disabled. Resume queue to continue submitting applications.'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setEngineActive(!engineActive)}
          className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            engineActive
              ? 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-[0_0_15px_rgba(79,107,246,0.3)]'
          }`}
        >
          {engineActive ? (
            <>
              <Pause className="h-3 w-3" /> Pause Engine
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> Resume Engine
            </>
          )}
        </button>
      </div>

      {/* ── KPIs Overview Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Applications', value: stats.total, color: 'text-neutral-100', metric: 'attempts' },
          { label: 'Submitted Apps', value: stats.submitted, color: 'text-green-400', metric: 'successful' },
          { label: 'Avg Match Score', value: `${stats.avgScore}%`, color: 'text-primary-400', metric: 'ATS quality' },
          { label: 'Failed Attempts', value: stats.failed, color: 'text-red-400', metric: 'requires revision' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-1 text-left">
            <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{kpi.label}</span>
            <span className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</span>
            <span className="text-[10px] text-neutral-500 font-medium">{kpi.metric}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Actions + Recent Activity ── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-6 text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Recent Live Activity</h3>
            <Link href="/activity" className="text-xs font-semibold text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {recentApps.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-500">
                No recent submissions. Trigger a search scan below to discover listings.
              </div>
            ) : (
              recentApps.map((app) => (
                <div key={app.id} className="p-4 rounded-md border border-neutral-900 bg-neutral-900/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800">
                      {getStatusIcon(app.status)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">{app.jobTitle}</span>
                      <span className="text-[10px] text-neutral-500 font-medium">{app.company} • {app.aggregatorName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-md">
                      {app.matchScore}% Match
                    </span>
                    <span className="text-[10px] text-neutral-500 capitalize">
                      {app.statusLabel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="p-6 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col gap-6 text-left">
          <h3 className="font-bold text-sm">Actions</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTriggerScan}
              disabled={loading || !engineActive}
              className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(79,107,246,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning Platform listings...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Trigger Auto-Apply Scan
                </>
              )}
            </button>
            <Link
              href="/assets"
              className="w-full py-2.5 px-4 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-neutral-900/40 hover:bg-neutral-900"
            >
              <Upload className="h-4 w-4" /> Upload Resume Variant
            </Link>
          </div>

          <div className="border-t border-neutral-900 pt-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Onboarding tips</span>
            <p className="text-xs text-neutral-400 leading-normal">
              For optimal performance, verify that your connected Naukri credentials are up to date in the <Link href="/aggregators" className="text-primary-400 hover:underline">Aggregators</Link> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
