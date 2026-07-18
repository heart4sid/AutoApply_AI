// ============================================================
// AutoApply AI — Aggregator Matrix View
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  Link2, Link2Off, Loader2, ShieldCheck, Check, Info, AlertTriangle
} from 'lucide-react';
import { AGGREGATORS, Aggregator, AggregatorConnection } from '@autoapply/shared';

export default function AggregatorsPage() {
  const { tokens } = useAuthStore();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Connection Modal States
  const [selectedAgg, setSelectedAgg] = useState<Aggregator | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchConnections = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/aggregators/connections', {
        headers: { 'Authorization': `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setConnections(data);
      }
    } catch (e) {
      console.error('Error loading connections:', e);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnectClick = (agg: Aggregator) => {
    setSelectedAgg(agg);
    setUsername('');
    setPassword('');
    setError(null);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgg) return;
    
    setError(null);
    setConnecting(true);

    try {
      const response = await fetch('http://localhost:4000/api/v1/aggregators/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          aggregatorId: selectedAgg.id,
          username,
          password,
          consentGiven: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Validation failed. Check your password.');
      }

      await fetchConnections();
      setSelectedAgg(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connId: string) => {
    if (!confirm('Are you sure you want to disconnect this platform? All background application scans will stop.')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/v1/aggregators/connections/${connId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokens?.accessToken}` },
      });

      if (response.ok) {
        await fetchConnections();
      }
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const indianAggs = AGGREGATORS.filter(a => a.region === 'indian');
  const internationalAggs = AGGREGATORS.filter(a => a.region === 'international');

  const getConnectionStatus = (aggId: string) => {
    const conn = connections.find(c => c.aggregatorId === aggId);
    return conn ? conn : null;
  };

  const renderAggregatorCard = (agg: Aggregator) => {
    const conn = getConnectionStatus(agg.id);
    return (
      <div key={agg.id} className="p-5 rounded-lg border border-neutral-900 bg-neutral-950 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-xs text-neutral-200">{agg.name}</h4>
            {conn ? (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-green-500/10 text-green-400 border border-green-500/20">
                Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-neutral-900 text-neutral-500 border border-neutral-850">
                Disconnected
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 leading-normal">{agg.description}</p>
        </div>

        <div className="flex justify-between items-center border-t border-neutral-900/60 pt-3 mt-1">
          <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Required Tier: {agg.requiredTier}</span>
          {conn ? (
            <button
              onClick={() => handleDisconnect(conn.id)}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => handleConnectClick(agg)}
              className="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
            >
              Connect Platform
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ── Twin Column Matrix Layout ── */}
      <div className="grid lg:grid-cols-2 gap-8 text-left">
        {/* Column 1: Indian Platforms */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <span className="text-lg">🇮🇳</span>
            <h3 className="font-bold text-sm">Domestic Indian Portals</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {indianAggs.map(renderAggregatorCard)}
          </div>
        </div>

        {/* Column 2: International Platforms */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <span className="text-lg">🌍</span>
            <h3 className="font-bold text-sm">International Aggregators</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {internationalAggs.map(renderAggregatorCard)}
          </div>
        </div>
      </div>

      {/* ── Credential Connection Modal ── */}
      {selectedAgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-8 rounded-lg border border-neutral-800 bg-neutral-950 glass flex flex-col gap-6 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-bold text-neutral-100">Connect to {selectedAgg.name}</h3>
              <p className="text-xs text-neutral-400 mt-1">Configure search parameters and automate profile fills</p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-950/50 border border-red-500/30 text-red-400 rounded-md">
                ⚠️ {error}
              </div>
            )}

            {/* Cryptographic Encryption notice */}
            <div className="p-3 bg-primary-500/5 border border-primary-500/20 text-primary-400 rounded-md flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">End-to-End Vault Encryption</span>
                <p className="text-[10px] leading-normal text-neutral-400">
                  Passwords are encrypted in transit using client-initiated TLS, enveloped symmetrically on the backend using AES-256-GCM, and stored locally.
                </p>
              </div>
            </div>

            <form onSubmit={handleConnectSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Username / Email Address</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  placeholder="name@email.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="flex items-start gap-3 py-1">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 accent-primary-500 cursor-pointer"
                />
                <label htmlFor="consent" className="text-[10px] text-neutral-500 leading-normal cursor-pointer select-none">
                  I authorize AutoApply AI to connect using these credentials and submit applications on my behalf.
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-neutral-900 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedAgg(null)}
                  className="px-4 py-2 border border-neutral-850 hover:border-neutral-750 text-neutral-400 hover:text-neutral-200 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-md text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(79,107,246,0.3)]"
                >
                  {connecting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {connecting ? 'Validating...' : 'Securely Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
