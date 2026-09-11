import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  Power,
  Layers,
  AlertCircle,
  Calendar,
  Zap,
} from 'lucide-react';
import { SourceItem, SyncRunItem, SchedulerStatus } from '../types';
import { api } from '../services/api';

interface SourcesViewProps {
  sources: SourceItem[];
  syncRuns: SyncRunItem[];
  onRefresh: () => void;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  syncRuns,
  onRefresh,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [isLoadingScheduler, setIsLoadingScheduler] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSchedulerStatus = async () => {
    try {
      setIsLoadingScheduler(true);
      const status = await api.getSchedulerStatus();
      setScheduler(status);
    } catch {
      // ignore
    } finally {
      setIsLoadingScheduler(false);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async (sourceId: string) => {
    setSyncingId(sourceId);
    setNotification(null);
    try {
      const res = await api.triggerSync(sourceId);
      setNotification({
        type: 'success',
        message: res.message || `Successfully triggered sync for ${sourceId}`,
      });
      await fetchSchedulerStatus();
      onRefresh();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || `Sync failed for ${sourceId}`,
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleTriggerDailyWorker = async () => {
    setSyncingId('daily-worker');
    setNotification(null);
    try {
      const res = await api.triggerDailySync();
      setNotification({
        type: 'success',
        message: res.message || 'Successfully executed daily automated synchronization cycle across all datasets!',
      });
      await fetchSchedulerStatus();
      onRefresh();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Daily synchronization worker cycle failed',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggle = async (sourceId: string, currentEnabled: boolean) => {
    setTogglingId(sourceId);
    setNotification(null);
    try {
      await api.toggleSource(sourceId, !currentEnabled);
      setNotification({
        type: 'success',
        message: `Provider ${sourceId} ${!currentEnabled ? 'enabled' : 'disabled'}`,
      });
      onRefresh();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || `Failed to toggle provider ${sourceId}`,
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Dataset Sources & Connectors</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Automated multi-repository ingest pipelines including Microlink HQ, Intoli real-world browser feeds, and WhatIsMyBrowser verification.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            id="sources-sync-worker-btn"
            onClick={handleTriggerDailyWorker}
            disabled={syncingId !== null}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm disabled:opacity-50 min-h-[44px]"
          >
            <Zap className={`w-4 h-4 ${syncingId === 'daily-worker' ? 'animate-pulse' : ''}`} />
            <span>Run Daily Sync Worker</span>
          </button>

          <button
            id="sources-sync-all-btn"
            onClick={() => handleManualSync('all')}
            disabled={syncingId !== null}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs sm:text-sm font-medium border border-zinc-700 transition disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${syncingId === 'all' ? 'animate-spin' : ''}`} />
            <span>Sync All</span>
          </button>
        </div>
      </div>

      {/* Automated Daily Background Worker Status Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Automated Daily Source Synchronization Worker
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {scheduler?.cadence || 'DAILY (Every 24 Hours)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Continuously pulls and populates the database from the official Microlink HQ repository, Intoli compressed real-world pools, and verified datasets.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
              <div className="text-zinc-500 flex items-center space-x-1 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Run</span>
              </div>
              <div className="text-zinc-200 font-medium">
                {scheduler?.lastRunAt ? new Date(scheduler.lastRunAt).toLocaleTimeString() : 'On Startup'}
              </div>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
              <div className="text-zinc-500 flex items-center space-x-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next Scheduled</span>
              </div>
              <div className="text-emerald-400 font-medium">
                {scheduler?.nextRunAt ? new Date(scheduler.nextRunAt).toLocaleTimeString() : 'In 24 hours'}
              </div>
            </div>

            <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 col-span-2 sm:col-span-1">
              <div className="text-zinc-500 flex items-center space-x-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completed Runs</span>
              </div>
              <div className="text-white font-bold">
                {scheduler?.totalRuns || 1} Cycles
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => {
          const isSyncing = syncingId === src.id;
          const isToggling = togglingId === src.id;

          return (
            <div
              key={src.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{src.name}</h3>
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-medium ${
                          src.status === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : src.status === 'DEGRADED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {src.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">ID: {src.id}</span>
                  </div>

                  {/* Toggle Enable/Disable switch */}
                  <button
                    onClick={() => handleToggle(src.id, src.enabled)}
                    disabled={isToggling}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition border ${
                      src.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{src.enabled ? 'ENABLED' : 'DISABLED'}</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 mt-2.5">{src.description}</p>

                {src.requiresApiKey && !src.isConfigured && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>API key not set in environment. Provider disabled gracefully.</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-zinc-500">Indexed Records:</span>
                  <span className="font-mono font-bold text-white">{src.recordCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-zinc-500">Last Successful Sync:</span>
                  <span className="font-mono text-zinc-300">
                    {src.lastSuccessfulSync
                      ? new Date(src.lastSuccessfulSync).toLocaleString()
                      : 'Never synchronized'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]" title={src.baseUrl}>
                    {src.baseUrl}
                  </span>
                  <button
                    id={`sync-btn-${src.id}`}
                    onClick={() => handleManualSync(src.id)}
                    disabled={isSyncing || !src.enabled}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Execution History */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span>Detailed Sync Execution Logs</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Source ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Fetched</th>
                <th className="py-2.5 px-3">New</th>
                <th className="py-2.5 px-3">Updated</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {syncRuns.map((run) => (
                <tr key={run.id} className="hover:bg-zinc-900/40">
                  <td className="py-2.5 px-3 text-zinc-500">#{run.id}</td>
                  <td className="py-2.5 px-3 text-white font-semibold uppercase">{run.source_id}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        run.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : run.status === 'DEGRADED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">{run.records_fetched}</td>
                  <td className="py-2.5 px-3 text-emerald-400">+{run.records_inserted}</td>
                  <td className="py-2.5 px-3 text-blue-400">{run.records_updated}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{run.duration_ms}ms</td>
                  <td className="py-2.5 px-3 text-zinc-500">
                    {new Date(run.started_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
