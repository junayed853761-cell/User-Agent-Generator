import React from 'react';
import {
  Database,
  ShieldCheck,
  Smartphone,
  Laptop,
  Radio,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { DashboardStats, SourceItem, SyncRunItem } from '../types';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  stats: DashboardStats | null;
  sources: SourceItem[];
  recentSyncRuns: SyncRunItem[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  sources,
  recentSyncRuns,
  loading,
  onRefresh,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner with Professional Logo Emblem */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-start space-x-3.5">
          <img
            src="/logo.svg"
            alt="UAForge Emblem"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_0_14px_rgba(16,185,129,0.35)] shrink-0 hidden xs:block"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Platform Telemetry & Corpus</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              UAForge aggregates, normalizes, and validates authentic real-world User-Agent datasets with multi-source consensus, zero-duplicate delivery, and cross-platform compatibility scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <button
            id="dashboard-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-medium border border-zinc-700 transition disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            id="dashboard-quick-generate-btn"
            onClick={() => onNavigate('generate')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm min-h-[44px]"
          >
            <Flame className="w-4 h-4" />
            <span>Generate Now</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Records</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">
              {stats ? stats.totalRecords.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-zinc-500 ml-2">verified UAs</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Deduplicated via cryptographic SHA-256
          </div>
        </div>

        {/* High Confidence */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">High Confidence (≥75)</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">
              {stats ? stats.highConfidenceRecords.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-emerald-400 ml-2">
              {stats && stats.totalRecords > 0
                ? `${Math.round((stats.highConfidenceRecords / stats.totalRecords) * 100)}%`
                : '100%'}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Multi-source verified & fully compatible
          </div>
        </div>

        {/* Mobile & Tablet */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Mobile & Tablet</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">
              {stats ? (stats.androidRecords + stats.iosRecords).toLocaleString() : '...'}
            </span>
            <span className="text-xs text-zinc-500 ml-2">
              ({stats ? stats.androidRecords : 0} Android / {stats ? stats.iosRecords : 0} iOS)
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Modern Pixel, Galaxy, Xiaomi, iPhone
          </div>
        </div>

        {/* Desktop Stations */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Desktop Stations</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">
              {stats ? stats.desktopRecords.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-zinc-500 ml-2">Win / Mac / Linux</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Chrome, Edge, Firefox, Safari desktop builds
          </div>
        </div>
      </div>

      {/* Two Column Section: Active Sources & Recent Synchronizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sources Overview */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Configured Data Sources</h2>
            </div>
            <button
              onClick={() => onNavigate('sources')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>Manage Sources</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">{source.name}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-medium ${
                        source.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : source.status === 'DEGRADED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {source.status}
                    </span>
                    {!source.enabled && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{source.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-white">
                    {source.recordCount} <span className="text-xs text-zinc-500">records</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center justify-end space-x-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {source.lastSuccessfulSync
                        ? new Date(source.lastSuccessfulSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Initialized'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sync Runs / Activity */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Recent Sync Executions</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Auto 24h Scheduler</span>
          </div>

          <div className="space-y-3">
            {recentSyncRuns.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-lg">
                No recent background sync executions recorded yet.
              </div>
            ) : (
              recentSyncRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    {run.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-white uppercase tracking-wider">{run.source_id}</span>
                      <span className="text-zinc-500 ml-2">
                        {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <span className="font-mono text-zinc-300">
                      +{run.records_inserted} new / {run.records_updated} updated
                    </span>
                    <span className="font-mono text-zinc-500">{run.duration_ms}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>External provider down? UAForge retains last verified cache.</span>
            <button
              onClick={() => onNavigate('analyze')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Test an existing UA &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
