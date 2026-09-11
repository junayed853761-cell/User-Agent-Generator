import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GenerateView } from './components/GenerateView';
import { AnalyzeView } from './components/AnalyzeView';
import { SourcesView } from './components/SourcesView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import {
  DashboardStats,
  SourceItem,
  SyncRunItem,
  GenerationHistoryItem,
  SystemHealth,
} from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [recentSyncRuns, setRecentSyncRuns] = useState<SyncRunItem[]>([]);
  const [historyItems, setHistoryItems] = useState<GenerationHistoryItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Cross-tab interaction states
  const [analyzerUa, setAnalyzerUa] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, sourcesData, syncRunsData, historyData, healthData] = await Promise.allSettled([
        api.getStats(),
        api.getSources(),
        api.getSyncRuns(),
        api.getHistory(),
        api.getHealth(),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value.stats);
        if (statsData.value.recentSyncRuns) {
          setRecentSyncRuns(statsData.value.recentSyncRuns);
        }
      }
      if (sourcesData.status === 'fulfilled') {
        setSources(sourcesData.value);
      }
      if (syncRunsData.status === 'fulfilled') {
        setRecentSyncRuns(syncRunsData.value);
      }
      if (historyData.status === 'fulfilled') {
        setHistoryItems(historyData.value);
      }
      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
    } catch (err) {
      console.error('Error loading UAForge data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate to Analyzer with a specific UA pre-filled
  const handleTestInAnalyzer = (ua: string) => {
    setAnalyzerUa(ua);
    setActiveTab('analyze');
  };

  // Navigate to Generate with historical params
  const handleReGenerate = (_item: GenerationHistoryItem) => {
    setActiveTab('generate');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecords={stats?.totalRecords}
        isHealthy={health ? health.status === 'healthy' : true}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            sources={sources}
            recentSyncRuns={recentSyncRuns}
            loading={loading}
            onRefresh={loadData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateView
            sources={sources}
            onTestInAnalyzer={handleTestInAnalyzer}
            onRefreshSources={loadData}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeView initialUa={analyzerUa} />
        )}

        {activeTab === 'sources' && (
          <SourcesView
            sources={sources}
            syncRuns={recentSyncRuns}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyItems={historyItems}
            loading={loading}
            onRefresh={loadData}
            onReGenerate={handleReGenerate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView health={health} />
        )}
      </main>

      {/* Global Footer (Adjusted padding for mobile bottom bar) */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 pb-24 md:pb-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5 text-center sm:text-left">
            <img
              src="/logo.svg"
              alt="UAForge Logo"
              className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              referrerPolicy="no-referrer"
            />
            <span>
              <strong className="font-semibold text-zinc-300">UAForge</strong> &mdash; Production User-Agent Intelligence, Validation & Generation Engine
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-400">
            <span>Zero-Duplicate Architecture</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Zero Synthetic Fabrication</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Real-World Public Consensus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
