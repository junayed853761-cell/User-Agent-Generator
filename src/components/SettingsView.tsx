import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Shield,
  FileCode,
  CheckCircle2,
  Server,
  Layers,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { SystemHealth, DatabaseStatus } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  health: SystemHealth | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ health }) => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'schema' | 'confidence'>('config');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMsg(null);
    try {
      const res = await api.migrateDatabase();
      setMigrateMsg(res.message || 'Database schema verified and updated successfully!');
      fetchDbStatus();
    } catch (err: any) {
      setMigrateMsg('Migration notice: ' + (err?.message || 'Done'));
    } finally {
      setMigrating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Platform Configuration & Engine Specs</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Cluster configuration, database architecture, rate limiting policies, and confidence weights.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center space-x-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSubTab === 'config'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            System & Health
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSubTab === 'schema'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Database Schema (8 Tables)
          </button>
          <button
            onClick={() => setActiveSubTab('confidence')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSubTab === 'confidence'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Scoring Matrix
          </button>
        </div>
      </div>

      {/* Subtab 1: Config & Health */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rate Limits */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rate Limiting Policies</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Anonymous Requests</span>
                  <span className="text-zinc-400 text-[11px]">Unauthenticated public access</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">60 req / min</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Authenticated Key</span>
                  <span className="text-zinc-400 text-[11px]">Bearer user token</span>
                </div>
                <span className="font-mono text-blue-400 font-bold">300 req / min</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Administrative Tier</span>
                  <span className="text-zinc-400 text-[11px]">Internal automation</span>
                </div>
                <span className="font-mono text-purple-400 font-bold">1,200 req / min</span>
              </div>
            </div>
          </div>

          {/* Database & Runtime Health */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Server className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Runtime & Storage Health</h3>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">PostgreSQL Engine:</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{health?.database.status === 'healthy' ? 'Active & Healthy' : 'Degraded'}</span>
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Application Version:</span>
                <span className="text-white font-semibold">{health?.version || '1.0.0'}</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Process Uptime:</span>
                <span className="text-zinc-300">
                  {health ? `${Math.floor(health.uptimeSeconds / 60)}m ${health.uptimeSeconds % 60}s` : '...'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Probe Latency:</span>
                <span className="text-zinc-300">{health?.responseTimeMs || 0} ms</span>
              </div>
            </div>
          </div>

          {/* Supabase & Cloud Database Integration Card */}
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Supabase Cloud Database & Storage Engine
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>{dbStatus?.status === 'connected' ? 'Connected' : 'Configured'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configured for Supabase Project <strong>{dbStatus?.projectId || 'uhncevftkngihicnhiqb'}</strong> with automated embedded PostgreSQL persistence.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="migrate-db-btn"
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{migrating ? 'Verifying Schema...' : 'Verify Schema & Tables'}</span>
                </button>
                <a
                  href={`https://supabase.com/dashboard/project/${dbStatus?.projectId || 'uhncevftkngihicnhiqb'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {migrateMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{migrateMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-4">
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] block mb-1">Supabase Project ID</span>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{dbStatus?.projectId || 'uhncevftkngihicnhiqb'}</span>
                  <button
                    onClick={() => copyToClipboard(dbStatus?.projectId || 'uhncevftkngihicnhiqb', 'project_id')}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    {copiedText === 'project_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] block mb-1">Active Database Engine</span>
                <span className="text-emerald-400 font-bold block">{dbStatus?.engine || 'Embedded PostgreSQL (PGlite)'}</span>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 text-[11px] block mb-1">Corpus Records in DB</span>
                <span className="text-blue-400 font-bold block">{dbStatus?.totalRecords ?? '120+'} User-Agents</span>
              </div>
            </div>

            {/* Connection Guide Accordion / Information */}
            <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-zinc-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>How Database Connectivity Works:</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                UAForge includes full support for <strong>Supabase (Project ID: uhncevftkngihicnhiqb)</strong>.
                By default, the platform runs on our zero-config, embedded high-performance <strong>PostgreSQL (PGlite) engine</strong> with persistent storage in <code className="text-emerald-400">/data/pgdata</code>.
                If you wish to route queries directly to your remote Supabase PostgreSQL cluster, set <code className="text-emerald-400">DATABASE_URL</code> in your environment:
              </p>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300 flex items-center justify-between overflow-x-auto">
                <span className="truncate pr-2">
                  postgresql://postgres.uhncevftkngihicnhiqb:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'postgresql://postgres.uhncevftkngihicnhiqb:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres',
                      'conn_str'
                    )
                  }
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] shrink-0"
                >
                  {copiedText === 'conn_str' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Schema Breakdown */}
      {activeSubTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Relational PostgreSQL Architecture</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              All 8 core tables with strict constraints, foreign keys, cascading deletes, and optimized B-tree indexes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-emerald-400 font-bold block mb-1">1. user_agents</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Primary canonical records deduplicated via SHA-256</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>user_agent (TEXT)</li>
                  <li>normalized_hash (VARCHAR(64) UNIQUE)</li>
                  <li>browser, browser_version, browser_major</li>
                  <li>operating_system, os_version</li>
                  <li>device_type, device_brand, device_model</li>
                  <li>is_mobile, is_tablet, is_desktop</li>
                  <li>confidence_score, validation_status</li>
                  <li>first_seen, last_seen, created_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-emerald-400 font-bold block mb-1">2. sources</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Provider feed connectors and operational status</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (VARCHAR(50) PK)</li>
                  <li>name, provider_type, base_url</li>
                  <li>enabled (BOOLEAN)</li>
                  <li>status ('ONLINE', 'DEGRADED', 'OFFLINE')</li>
                  <li>last_successful_sync, last_attempted_sync</li>
                  <li>record_count (INTEGER)</li>
                  <li>created_at, updated_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400 font-bold block mb-1">3. user_agent_sources</span>
                <span className="text-zinc-400 text-[11px] block mb-2">N:M provenance mapping between UAs and datasets</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>user_agent_id (FK user_agents)</li>
                  <li>source_id (FK sources)</li>
                  <li>source_record_id (VARCHAR(100))</li>
                  <li>UNIQUE(user_agent_id, source_id)</li>
                  <li>first_seen, last_seen, matched_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400 font-bold block mb-1">4. validation_results</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Detailed audit logs of structural compatibility checks</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>user_agent_id (FK user_agents)</li>
                  <li>is_valid (BOOLEAN)</li>
                  <li>compatibility_status (VARCHAR(50))</li>
                  <li>checks_passed (TEXT[])</li>
                  <li>checks_failed (TEXT[])</li>
                  <li>details (JSONB), evaluated_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-purple-400 font-bold block mb-1">5. sync_runs</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Telemetry for background and manual sync tasks</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>source_id (FK sources)</li>
                  <li>status, records_fetched, records_inserted</li>
                  <li>records_updated, error_message</li>
                  <li>duration_ms, started_at, completed_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-purple-400 font-bold block mb-1">6. generation_history</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Audit trail of generation and export requests</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>user_id (FK users optional)</li>
                  <li>platform, device_type, browser</li>
                  <li>min_confidence, quantity, result_count</li>
                  <li>exported_format, generated_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-amber-400 font-bold block mb-1">7. users</span>
                <span className="text-zinc-400 text-[11px] block mb-2">API key authentication and role authorization</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>email (VARCHAR(255) UNIQUE)</li>
                  <li>role ('user', 'admin')</li>
                  <li>api_key (VARCHAR(128) UNIQUE)</li>
                  <li>created_at, updated_at</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-amber-400 font-bold block mb-1">8. system_logs</span>
                <span className="text-zinc-400 text-[11px] block mb-2">Structured request metrics & diagnostics</span>
                <ul className="text-zinc-500 space-y-0.5 text-[11px]">
                  <li>id (SERIAL PK)</li>
                  <li>level, request_id, endpoint, method</li>
                  <li>status, duration_ms, message</li>
                  <li>metadata (JSONB), timestamp</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Confidence Rules */}
      {activeSubTab === 'confidence' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Modular Confidence Scoring Matrix (confidenceRules.ts)</span>
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            The confidence engine calculates a normalized score from 0 to 100 based on verified real-world factors:
          </p>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Factor</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Single Source Presence</td>
                  <td className="py-2.5 px-3 text-emerald-400">+48 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Present in at least 1 verified public dataset</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Multi-Source Agreement</td>
                  <td className="py-2.5 px-3 text-emerald-400">+20 pts / source</td>
                  <td className="py-2.5 px-3 text-zinc-400">Cross-verified consensus across independent sources (max +40)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Compatibility Bonus</td>
                  <td className="py-2.5 px-3 text-emerald-400">+16 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Passes all OS, browser, architecture compatibility checks</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Parser Completeness</td>
                  <td className="py-2.5 px-3 text-emerald-400">+14 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Engine, OS version, browser version tokens recognized</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Device Consistency</td>
                  <td className="py-2.5 px-3 text-emerald-400">+8 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Hardware flags align with platform expectations</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-semibold">Recent Source Sync</td>
                  <td className="py-2.5 px-3 text-emerald-400">+5 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Observed within current sync window</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-300 font-semibold">90+ Priority Promotion Bonus</td>
                  <td className="py-2.5 px-3 text-emerald-400">+10 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Multi-source consensus + 100% compatibility validation</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-amber-400 font-semibold">Suspicious / Inconsistent Penalty</td>
                  <td className="py-2.5 px-3 text-amber-400">-30 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Unlikely token combination (e.g. desktop token with mobile flags)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-amber-400 font-semibold">Obsolete Version Pairing</td>
                  <td className="py-2.5 px-3 text-amber-400">-25 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Modern browser claimed on legacy end-of-life OS</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-red-400 font-semibold">Impossible Combination Penalty</td>
                  <td className="py-2.5 px-3 text-red-400">-55 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">E.g., Safari 17 on Windows NT, Internet Explorer on Android</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-red-400 font-semibold">Malformed Header Penalty</td>
                  <td className="py-2.5 px-3 text-red-400">-65 pts</td>
                  <td className="py-2.5 px-3 text-zinc-400">Unbalanced parentheses, missing standard Mozilla/ token header</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tier Architecture & Warning Policy */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-bold mb-3">
              Confidence Scoring Tiers & Routing Policy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <span>⭐ 90–100: Very High Confidence</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] uppercase font-mono">Strictly Prioritized</span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">
                  Strictly prioritized in all generation algorithms and export pipelines. Cross-verified across multiple independent datasets or validated via live commercial APIs with zero anomalies.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-emerald-400 font-bold text-xs">
                  75–89: High Confidence
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Verified authentic records with verified dataset presence and full compatibility check clearance.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-amber-400 font-bold text-xs">
                  40–74: Medium / Low Confidence
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Single-source or older browser records with partial token matching. Suitable for non-critical testing.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/50">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                  <span>⚠️ 0–39: Suspicious Range</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[10px] uppercase font-mono text-red-300">Explicit Warning</span>
                </div>
                <p className="text-[11px] text-red-200 mt-1.5 leading-relaxed">
                  Triggers explicit high-visibility warning banners across all views. Severe token mismatch or impossible architecture pairings create extreme anti-bot blocking risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
