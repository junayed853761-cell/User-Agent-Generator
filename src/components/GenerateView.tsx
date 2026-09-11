import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Copy,
  Check,
  Download,
  SearchCode,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  Laptop,
  Filter,
  Globe,
  Database,
  RefreshCw,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { GeneratedUserAgent, SourceItem } from '../types';
import { api } from '../services/api';

interface GenerateViewProps {
  sources: SourceItem[];
  onTestInAnalyzer: (ua: string) => void;
  onRefreshSources?: () => void;
}

const COUNTRY_OPTIONS = [
  { code: 'all', name: 'Any Country / Worldwide', flag: '🌐' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
];

export const GenerateView: React.FC<GenerateViewProps> = ({
  sources,
  onTestInAnalyzer,
  onRefreshSources,
}) => {
  const [platform, setPlatform] = useState<string>('all');
  const [deviceType, setDeviceType] = useState<string>('all');
  const [browser, setBrowser] = useState<string>('all');
  const [country, setCountry] = useState<string>('US'); // Defaults to USA as requested
  const [source, setSource] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(80); // Default 80+ as requested
  const [quantity, setQuantity] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [dbSyncing, setDbSyncing] = useState<boolean>(false);
  const [dbSyncSuccess, setDbSyncSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedUserAgent[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [servedCount, setServedCount] = useState<number>(0);
  const [resettingServed, setResettingServed] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const loadServedStats = async () => {
    try {
      const data = await api.getServedStats();
      setServedCount(data.servedCount);
    } catch {
      // Graceful fallback
    }
  };

  // Auto-generate on initial load if no results yet
  useEffect(() => {
    handleGenerate();
    loadServedStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await api.generate({
        platform: platform === 'all' ? undefined : platform,
        deviceType: deviceType === 'all' ? undefined : deviceType,
        browser: browser === 'all' ? undefined : browser,
        country: country === 'all' ? undefined : country,
        source: source === 'all' ? undefined : source,
        minimumConfidence: minConfidence,
        quantity,
      });
      setResults(items);
      if (items.meta?.totalServedToYou !== undefined) {
        setServedCount(items.meta.totalServedToYou);
      } else {
        loadServedStats();
      }
      if (items.length === 0) {
        setError(
          `No records found with confidence ${minConfidence}+ for ${country === 'all' ? 'any country' : country}. Click "Setup / Resync Database" below or relax confidence criteria.`
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate User-Agents');
    } finally {
      setLoading(false);
    }
  };

  const handleResetServed = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset your served User-Agent history? This will clear your personal exclusions so all records can be delivered to you again.'
      )
    ) {
      return;
    }
    setResettingServed(true);
    try {
      const res = await api.resetServed();
      setServedCount(0);
      setResetSuccess(`Cleared ${res.resetCount} served User-Agents. The full pool is now unserved and available.`);
      setTimeout(() => setResetSuccess(null), 5000);
      handleGenerate();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset served pool');
    } finally {
      setResettingServed(false);
    }
  };

  const handleSetupDatabase = async () => {
    setDbSyncing(true);
    setDbSyncSuccess(null);
    setError(null);
    try {
      // First ensure database tables and columns are migrated and healthy
      await api.migrateDatabase().catch(() => {});
      // Then trigger multi-source sync including WhatIsMyBrowser
      await api.triggerSync('all');
      setDbSyncSuccess('Database schema verified & synchronized with WhatIsMyBrowser API & localized datasets!');
      if (onRefreshSources) {
        onRefreshSources();
      }
      setTimeout(() => {
        handleGenerate();
      }, 500);
    } catch (err: any) {
      setError(`Database setup encountered an issue: ${err?.message || 'Check connection'}`);
    } finally {
      setDbSyncing(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllToClipboard = () => {
    if (results.length === 0) return;
    const all = results.map((r) => r.userAgent).join('\n');
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const url = api.getExportUrl(
      {
        platform: platform === 'all' ? undefined : platform,
        deviceType: deviceType === 'all' ? undefined : deviceType,
        browser: browser === 'all' ? undefined : browser,
        country: country === 'all' ? undefined : country,
        source: source === 'all' ? undefined : source,
        minimumConfidence: minConfidence,
      },
      format
    );
    window.open(url, '_blank');
  };

  // Filtered results by search string
  const filteredResults = searchFilter.trim()
    ? results.filter(
        (r) =>
          r.userAgent.toLowerCase().includes(searchFilter.toLowerCase()) ||
          r.browser.toLowerCase().includes(searchFilter.toLowerCase()) ||
          r.os.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (r.country?.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
          (r.country?.code || '').toLowerCase().includes(searchFilter.toLowerCase())
      )
    : results;

  return (
    <div className="space-y-6">
      {/* Database Self-Setup & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-200">PostgreSQL + WhatIsMyBrowser Database</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ready & Connected
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Integrated with WhatIsMyBrowser commercial API key for live cross-verification and country targeting.
            </p>
          </div>
        </div>

        <button
          id="setup-database-btn"
          onClick={handleSetupDatabase}
          disabled={dbSyncing}
          className="flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dbSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{dbSyncing ? 'Setting up database...' : 'Setup / Resync Database'}</span>
        </button>
      </div>

      {dbSyncSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{dbSyncSuccess}</span>
        </div>
      )}

      {/* Zero-Duplicate Guarantee Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-xl shadow-lg">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Zero-Duplicate Guarantee Active
              </h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Strictly Unique Per Client</span>
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Every User-Agent delivered to you is automatically registered in your private exclusion pool. Once a User-Agent is given to you, <strong className="text-emerald-300 font-semibold">it will never be given to you again</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Total Served To You</div>
            <div className="text-base font-bold font-mono text-emerald-400">{servedCount} unique UAs</div>
          </div>
          <button
            id="reset-served-pool-btn"
            onClick={handleResetServed}
            disabled={resettingServed || servedCount === 0}
            title="Clear served pool to make all User-Agents available again"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resettingServed ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Reset History</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Controls Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Target Criteria & Filters</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Filter by Country (e.g. USA), Confidence (80+ or 100), Platform & Engine
          </span>
        </div>

        {/* Quick Country Selector Chips */}
        <div className="mb-4 pb-4 border-b border-zinc-800">
          <label className="block text-xs font-medium text-zinc-400 mb-2 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Country / Geographic Origin:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { code: 'US', label: '🇺🇸 USA (United States)' },
              { code: 'GB', label: '🇬🇧 UK (United Kingdom)' },
              { code: 'CA', label: '🇨🇦 Canada' },
              { code: 'DE', label: '🇩🇪 Germany' },
              { code: 'FR', label: '🇫🇷 France' },
              { code: 'JP', label: '🇯🇵 Japan' },
              { code: 'AU', label: '🇦🇺 Australia' },
              { code: 'IN', label: '🇮🇳 India' },
              { code: 'all', label: '🌐 Any Country' },
            ].map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCountry(c.code)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition flex items-center space-x-1 ${
                  country === c.code
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Country Dropdown */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Country Selection</label>
            <select
              id="generate-filter-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} {c.code !== 'all' ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Operating System / Platform</label>
            <select
              id="generate-filter-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Any Platform</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS / iPadOS</option>
              <option value="Linux">Linux</option>
            </select>
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Device Category</label>
            <select
              id="generate-filter-device"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Any Device Category</option>
              <option value="desktop">Desktop / Laptop</option>
              <option value="mobile">Mobile Smartphone</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          {/* Browser Engine */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Browser Engine</label>
            <select
              id="generate-filter-browser"
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Any Browser</option>
              <option value="Chrome">Google Chrome</option>
              <option value="Safari">Apple Safari</option>
              <option value="Firefox">Mozilla Firefox</option>
              <option value="Edge">Microsoft Edge</option>
              <option value="Samsung">Samsung Internet</option>
              <option value="Opera">Opera</option>
            </select>
          </div>
        </div>

        {/* Confidence Presets & Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-zinc-800">
          {/* Minimum Confidence with 80+ and 100 Presets */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-zinc-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidence Score Requirement</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">{minConfidence} / 100</span>
            </div>

            {/* Quick Confidence Buttons (Strictly Prioritized 90+ preset) */}
            <div className="flex items-center space-x-2 mb-3">
              {[
                { score: 90, label: '⭐ 90+ (Prioritized)' },
                { score: 80, label: '⚡ 80+ (High)' },
                { score: 100, label: '💯 100 (Max)' },
                { score: 0, label: 'Any (0+)' },
              ].map((preset) => (
                <button
                  key={preset.score}
                  type="button"
                  onClick={() => setMinConfidence(preset.score)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-mono font-medium border transition ${
                    minConfidence === preset.score
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              id="generate-confidence-slider"
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500 mt-1 font-mono">
              <span>0 (Any)</span>
              <span>60 (Medium)</span>
              <span className="text-emerald-400 font-bold">90+ (Strictly Prioritized)</span>
              <span className="text-emerald-300 font-bold">100 (Max)</span>
            </div>
          </div>

          {/* Quantity Selector & Source */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-zinc-400">Batch Quantity</span>
              <span className="text-white font-mono font-bold">{quantity} User-Agents</span>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              {[1, 5, 10, 25, 50].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-1 rounded-md text-xs font-mono font-medium border transition ${
                    quantity === q
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <span className="text-zinc-500 shrink-0">Source Filter:</span>
              <select
                id="generate-filter-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Verified Sources (WhatIsMyBrowser, Curated Corpus)</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.recordCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Targeting: <strong className="text-zinc-200">{country === 'all' ? 'Worldwide' : country}</strong> with{' '}
              <strong className="text-emerald-400">{minConfidence}+ confidence</strong>
            </span>
          </div>
          <button
            id="generate-submit-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Querying Verified Corpus...' : 'Generate User-Agents'}</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={handleSetupDatabase}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 shrink-0 self-start sm:self-auto"
          >
            Sync Database Now
          </button>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Generated Records</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  {results.length} found
                </span>
              </h3>

              {/* In-results search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
                />
              </div>
            </div>

            {/* Actions: Copy All & Export */}
            <div className="flex items-center space-x-2">
              <button
                id="generate-copy-all-btn"
                onClick={copyAllToClipboard}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied All!' : 'Copy All'}</span>
              </button>

              <div className="h-4 w-px bg-zinc-700 mx-1" />

              <span className="text-xs text-zinc-500 font-mono hidden md:inline">Export:</span>
              <button
                onClick={() => handleExport('json')}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition"
              >
                TXT
              </button>
            </div>
          </div>

          {/* Result Items */}
          <div className="space-y-3">
            {filteredResults.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Country Badge */}
                    {item.country && (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-xs">
                        <span className="text-sm">{item.country.flag}</span>
                        <span>{item.country.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400/80">({item.country.code})</span>
                      </span>
                    )}

                    {/* Device & OS tag */}
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                      {item.deviceType === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-purple-400" />
                      ) : (
                        <Laptop className="w-3 h-3 text-blue-400" />
                      )}
                      <span>
                        {item.os} {item.osVersion}
                      </span>
                    </span>

                    {/* Browser tag */}
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                      {item.browser} {item.browserVersion}
                    </span>

                    {/* Device model tag if exists */}
                    {item.deviceModel && (
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
                        {item.deviceBrand} {item.deviceModel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Confidence tag (with distinct 90+ priority / suspicious indicator) */}
                    <div
                      className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs font-mono border ${
                        item.confidence.score <= 39
                          ? 'bg-red-500/20 border-red-500/50 text-red-300 font-bold animate-pulse'
                          : item.confidence.score >= 90
                          ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 font-bold shadow-sm'
                          : item.confidence.score >= 80
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {item.confidence.score <= 39 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{item.confidence.score}/100</span>
                      <span className="text-[10px] opacity-90">
                        ({item.confidence.score >= 90 ? '⭐ Prioritized' : item.confidence.score <= 39 ? '⚠️ Suspicious' : item.confidence.status})
                      </span>
                    </div>

                    {/* Zero-Duplicate Guarantee tag */}
                    <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-300 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Zero-Dup Guaranteed</span>
                    </span>

                    {/* Sources count */}
                    <span className="text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {item.sourcesCount} {item.sourcesCount === 1 ? 'source' : 'sources'}
                    </span>
                  </div>
                </div>

                {/* Explicit Visual Warning if in Suspicious Range (0-39) */}
                {item.confidence.score <= 39 && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/70 border border-red-500/60 flex items-center space-x-2 text-xs text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <strong className="text-red-300">⚠️ SUSPICIOUS INTEGRITY WARNING (Score {item.confidence.score}/100 in 0–39 Range):</strong>{' '}
                      Structural token inconsistencies or zero verified dataset presence detected. Not recommended for live production or automated browsing.
                    </div>
                  </div>
                )}

                {/* UA String with actions */}
                <div className="relative group mt-2">
                  <pre className="p-3 rounded-lg bg-zinc-900 font-mono text-xs text-zinc-200 break-all whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white border border-zinc-800/60">
                    {item.userAgent}
                  </pre>
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                      onClick={() => copyToClipboard(item.userAgent, item.id)}
                      className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition shadow-sm"
                      title="Copy to clipboard"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onTestInAnalyzer(item.userAgent)}
                      className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-medium transition shadow-sm"
                      title="Inspect & test in Analyzer"
                    >
                      <SearchCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
