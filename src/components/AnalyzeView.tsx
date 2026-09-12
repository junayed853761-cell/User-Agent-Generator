import React, { useState, useMemo } from 'react';
import {
  SearchCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
  Database,
  Smartphone,
  Laptop,
  HelpCircle,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { AnalysisResult } from '../types';
import { api } from '../services/api';

interface AnalyzeViewProps {
  initialUa?: string;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({ initialUa = '' }) => {
  const [userAgentInput, setUserAgentInput] = useState<string>(
    initialUa || 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro Build/AP2A.240905.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36'
  );
  
  // Advanced context inputs
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [secChUa, setSecChUa] = useState('');
  const [secChUaMobile, setSecChUaMobile] = useState('');
  const [secChUaPlatform, setSecChUaPlatform] = useState('');
  const [gpuRenderer, setGpuRenderer] = useState('');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleAnalyze = async (uaToAnalyze?: string) => {
    const text = uaToAnalyze || userAgentInput;
    if (!text.trim()) {
      setError('Please provide a User-Agent string to analyze.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const context = showAdvanced ? {
        clientHints: {
          secChUa: secChUa || undefined,
          secChUaMobile: secChUaMobile || undefined,
          secChUaPlatform: secChUaPlatform || undefined,
        },
        hardware: {
          gpuRenderer: gpuRenderer || undefined,
        }
      } : undefined;
      const data = await api.analyze(text.trim(), context);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze User-Agent');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteCurrentBrowser = async () => {
    if (typeof navigator !== 'undefined') {
      setUserAgentInput(navigator.userAgent);
      
      // Attempt to grab client hints if available
      const navAny = navigator as any;
      if (navAny.userAgentData) {
        setShowAdvanced(true);
        const brands = navAny.userAgentData.brands?.map((b: any) => `"${b.brand}";v="${b.version}"`).join(', ');
        if (brands) setSecChUa(brands);
        setSecChUaMobile(navAny.userAgentData.mobile ? '?1' : '?0');
        setSecChUaPlatform(`"${navAny.userAgentData.platform}"`);
      }

      // Attempt to grab GPU
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          if (ext) {
            const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
            if (renderer) setGpuRenderer(renderer);
          }
        }
      } catch (e) {}

      handleAnalyze(navigator.userAgent);
    }
  };

  const copyUa = () => {
    navigator.clipboard.writeText(userAgentInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sparklineData = useMemo(() => {
    if (!result) return [];
    
    const target = result.confidence.score;
    const data = [{ name: 'Initial Request', score: target > 50 ? 40 : 80 }];
    let currentScore = data[0].score;
    
    const checksCount = result.compatibility.checksPassed.length;
    const sourcesCount = result.sources.filter(s => s.matched).length;
    const isSuspicious = target <= 39;
    
    const totalSteps = checksCount + sourcesCount + (isSuspicious ? result.compatibility.checksFailed.length : 0) + 1;
    const diff = target - currentScore;
    const step = diff / (totalSteps || 1);
    
    result.compatibility.checksPassed.forEach((check) => {
        currentScore += step;
        data.push({ name: `Pass: ${check.slice(0, 15)}...`, score: Math.round(currentScore) });
    });
    
    if (isSuspicious) {
      result.compatibility.checksFailed.forEach((check) => {
          currentScore += step;
          data.push({ name: `Fail: ${check.slice(0, 15)}...`, score: Math.round(currentScore) });
      });
    }
    
    result.sources.filter(s => s.matched).forEach((source) => {
        currentScore += step;
        data.push({ name: `Match: ${source.sourceName}`, score: Math.round(currentScore) });
    });
    
    data.push({ name: 'Final Validation', score: target });
    
    return data;
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Input Box Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <label className="text-base font-bold text-white flex items-center space-x-2">
            <SearchCode className="w-5 h-5 text-emerald-400" />
            <span>Analyze User-Agent String</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="analyze-paste-current-btn"
              onClick={handlePasteCurrentBrowser}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 transition min-h-[36px]"
            >
              Use My Browser's UA
            </button>
            <button
              type="button"
              onClick={copyUa}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-medium px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 transition flex items-center space-x-1 min-h-[36px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <textarea
          id="analyze-input-ua"
          rows={3}
          value={userAgentInput}
          onChange={(e) => setUserAgentInput(e.target.value)}
          placeholder="Paste or enter any raw User-Agent string to inspect (e.g. Mozilla/5.0...)"
          className="w-full p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-zinc-200 border border-zinc-700 focus:outline-none focus:border-emerald-500 transition resize-y"
        />

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Advanced Context' : 'Show Advanced Context (Client Hints / GPU)'}</span>
          </button>
          <button
            id="analyze-submit-btn"
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
          >
            <SearchCode className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating Tokens...' : 'Inspect & Analyze'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">sec-ch-ua</label>
              <input 
                type="text" 
                value={secChUa} 
                onChange={(e) => setSecChUa(e.target.value)} 
                placeholder='"Chromium";v="130", "Google Chrome";v="130"' 
                className="w-full p-2 rounded bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 focus:outline-none focus:border-zinc-600" 
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">sec-ch-ua-mobile</label>
              <input 
                type="text" 
                value={secChUaMobile} 
                onChange={(e) => setSecChUaMobile(e.target.value)} 
                placeholder="?0 or ?1" 
                className="w-full p-2 rounded bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 focus:outline-none focus:border-zinc-600" 
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">sec-ch-ua-platform</label>
              <input 
                type="text" 
                value={secChUaPlatform} 
                onChange={(e) => setSecChUaPlatform(e.target.value)} 
                placeholder='"Windows" or "Android"' 
                className="w-full p-2 rounded bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 focus:outline-none focus:border-zinc-600" 
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">WebGL Renderer (GPU)</label>
              <input 
                type="text" 
                value={gpuRenderer} 
                onChange={(e) => setGpuRenderer(e.target.value)} 
                placeholder='e.g., ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)' 
                className="w-full p-2 rounded bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 focus:outline-none focus:border-zinc-600" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          {error}
        </div>
      )}

      {/* Analysis Results View */}
      {result && (
        <div className="space-y-6">
          {/* Live 100% Authentic Verification Banner */}
          {result.whatIsMyBrowserOfficial?.verified && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      100% Authentic Verification Confirmed
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                      WhatIsMyBrowser API Verified
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    {result.whatIsMyBrowserOfficial.message}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-emerald-400 block">
                  Official Parser: {result.whatIsMyBrowserOfficial.softwareName} on {result.whatIsMyBrowserOfficial.operatingSystemName}
                </span>
                <span className="text-[10px] text-zinc-400">
                  Hardware: {result.whatIsMyBrowserOfficial.hardwareType || result.device.type}
                </span>
              </div>
            </div>
          )}

          {/* Explicit Visual Warning for Suspicious Range (0-39) */}
          {result.confidence.score <= 39 && (
            <div
              id="analyze-suspicious-warning"
              className="p-4 rounded-xl bg-red-950/70 border-2 border-red-500/80 shadow-lg shadow-red-950/50 flex items-start space-x-3.5"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                    CRITICAL WARNING: Suspicious User-Agent (Score: {result.confidence.score}/100)
                  </span>
                  <span className="text-xs font-semibold text-red-400">Falls into Suspicious Range (0–39)</span>
                </div>
                <p className="text-xs text-red-200 mt-2 leading-relaxed">
                  This User-Agent exhibits severe compatibility anomalies, invalid token distributions, or zero verified public dataset appearances.
                  Deploying this header in production or automated browsing creates an <strong>extremely high risk</strong> of anti-bot fingerprinting,
                  immediate CAPTCHA challenges, or request rejections.
                </p>
                <div className="mt-2.5 flex items-center space-x-2 text-[11px] text-red-300/90 font-mono">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Recommendation: Regenerate or select a cross-verified 90+ confidence record instead.</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Score & Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Confidence Gauge */}
            <div
              className={`border rounded-xl p-5 md:col-span-1 ${
                result.confidence.score <= 39
                  ? 'bg-red-950/20 border-red-500/40'
                  : result.confidence.score >= 90
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-medium tracking-wider text-zinc-400">Confidence Rating</span>
                {result.confidence.score <= 39 ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex items-baseline space-x-2">
                <span
                  className={`text-4xl font-bold font-mono ${
                    result.confidence.score <= 39
                      ? 'text-red-400'
                      : result.confidence.score >= 90
                      ? 'text-emerald-300'
                      : 'text-white'
                  }`}
                >
                  {result.confidence.score}
                </span>
                <span className="text-xs text-zinc-500 font-mono">/ 100</span>

                {result.confidence.score >= 90 && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold ml-auto">
                    ⭐ Strictly Prioritized
                  </span>
                )}
                {result.confidence.score <= 39 && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold ml-auto">
                    ⚠️ Suspicious (0–39)
                  </span>
                )}
              </div>
              <div
                className={`mt-2 text-sm font-semibold ${
                  result.confidence.score <= 39
                    ? 'text-red-400'
                    : result.confidence.score >= 90
                    ? 'text-emerald-300'
                    : 'text-emerald-400'
                }`}
              >
                {result.confidence.status}
              </div>

              {/* Sparkline Chart */}
              <div className="mt-4 h-16 w-full opacity-80 hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', color: '#a1a1aa' }}
                      itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                      labelStyle={{ color: '#e4e4e7', marginBottom: '2px', fontWeight: 'bold' }}
                      cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={result.confidence.score <= 39 ? '#ef4444' : result.confidence.score >= 90 ? '#34d399' : '#10b981'} 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 4, fill: '#18181b', stroke: result.confidence.score <= 39 ? '#ef4444' : '#34d399', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 text-[11px] text-zinc-400">
                {result.confidence.score <= 39 ? (
                  <span className="text-red-400 font-semibold">⚠️ Flagged: Severe anomalies detected</span>
                ) : result.isKnownInDatabase ? (
                  '✓ Indexed in UAForge verified database'
                ) : (
                  'ℹ Evaluated ad-hoc; not currently in local corpus'
                )}
              </div>
            </div>

            {/* Compatibility Badge */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 md:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-medium tracking-wider text-zinc-400">Compatibility Matrix</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>

              <div className="flex items-center space-x-2 mt-1">
                {result.compatibility.isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <div className="text-base font-bold text-white">
                    {result.compatibility.status}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {result.compatibility.isValid ? 'Platform & tokens consistent' : 'Structural anomaly detected'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {result.compatibility.checksPassed.map((check, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-emerald-300 border border-emerald-500/20"
                  >
                    ✓ {check}
                  </span>
                ))}
              </div>
            </div>

            {/* Hardware & OS Class */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 md:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-medium tracking-wider text-zinc-400">Hardware Profile</span>
                {result.device.isMobile ? (
                  <Smartphone className="w-4 h-4 text-purple-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-blue-400" />
                )}
              </div>

              <div className="text-base font-bold text-white capitalize">
                {result.device.type} ({result.os.name})
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {result.device.brand ? `${result.device.brand} ${result.device.model}` : 'Generic hardware platform'}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Browser</span>
                  <span className="font-semibold text-white">{result.browser.name}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Version</span>
                  <span className="font-semibold text-white font-mono">{result.browser.version || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Hardware Integrity Module */}
            {result.hardwareIntegrity && result.hardwareIntegrity.isEvaluated && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 md:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-medium tracking-wider text-zinc-400">Hardware Integrity</span>
                    {result.hardwareIntegrity.isValid ? (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold ml-2">VERIFIED</span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold ml-2">MISMATCH DETECTED</span>
                    )}
                  </div>
                  <Layers className="w-4 h-4 text-emerald-400" />
                </div>
                
                <div className="mt-2 text-sm text-zinc-300">
                  <p className="mb-3 text-xs text-zinc-400">
                    Cross-referencing injected Advanced Context (Client-Hints / WebGL Renderer GPU) against strict platform whitelist definitions.
                  </p>
                  
                  {/* Scorecard addition */}
                  {result.hardwareIntegrity.clientHintConsistency && (
                    <div className="mt-4 mb-4 p-3 bg-zinc-950/80 rounded border border-zinc-800">
                      <h4 className="text-[11px] uppercase font-bold text-zinc-500 mb-2">Client-Hint Consistency Scorecard</h4>
                      <div className="flex flex-col space-y-2">
                        {result.hardwareIntegrity.clientHintConsistency.missingHighEntropyValues.length > 0 ? (
                          <div className="flex items-start space-x-2">
                            <span className="text-red-400 font-bold">✕</span>
                            <span className="text-xs text-zinc-400">
                              Missing Critical Entropy: <span className="text-red-300 font-mono">{result.hardwareIntegrity.clientHintConsistency.missingHighEntropyValues.join(', ')}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-xs text-zinc-400">All required high-entropy hints present.</span>
                          </div>
                        )}
                        
                        {result.hardwareIntegrity.clientHintConsistency.isFlaggedAsFake ? (
                          <div className="flex items-start space-x-2">
                            <span className="text-red-400 font-bold">✕</span>
                            <span className="text-xs text-red-300 font-mono">Profile Flagged: INCONSISTENT / FAKE. Hints contradict User-Agent structural claims.</span>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-xs text-zinc-400">Client-Hints perfectly align with User-Agent declarations.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {result.hardwareIntegrity.warnings.length > 0 ? (
                    <ul className="space-y-2 mt-2 border-l-2 border-red-500/50 pl-3">
                      {result.hardwareIntegrity.warnings.map((w, i) => (
                        <li key={i} className="text-red-300 text-xs font-mono">⚠️ {w}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center space-x-2 mt-2 border-l-2 border-emerald-500/50 pl-3">
                      <span className="text-emerald-300 text-xs font-mono">✓ GPU Renderer & Client-Hints mathematically match exact User-Agent profile whitelist.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Token Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tokens & Identification */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-300">
                Detailed Token Breakdown
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Browser Name</span>
                  <span className="text-white font-medium">{result.browser.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Browser Version</span>
                  <span className="text-white font-medium">{result.browser.version || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Operating System</span>
                  <span className="text-white font-medium">{result.os.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">OS Version</span>
                  <span className="text-white font-medium">{result.os.version || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Device Category</span>
                  <span className="text-white font-medium capitalize">{result.device.type}</span>
                </div>
                {result.country && (
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Detected Country Origin</span>
                    <span className="text-emerald-400 font-medium">
                      {result.country.flag} {result.country.name} ({result.country.code})
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-400">Hardware Architecture</span>
                  <span className="text-white font-medium">
                    {result.device.isMobile ? 'Mobile Smartphone' : result.device.isTablet ? 'Tablet' : 'Desktop Station'}
                  </span>
                </div>
              </div>
            </div>

            {/* Source Consensus Badges */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-300">
                Cross-Source Dataset Consensus
              </h3>
              <div className="space-y-3">
                {result.sources.map((src) => (
                  <div
                    key={src.sourceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Database className="w-4 h-4 text-zinc-400" />
                      <div>
                        <span className="font-semibold text-white">{src.sourceName}</span>
                        {src.note && <p className="text-[11px] text-zinc-500">{src.note}</p>}
                      </div>
                    </div>
                    <div>
                      {src.matched ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium font-mono">
                          MATCH CONFIRMED
                        </span>
                      ) : src.status === 'OFFLINE' ? (
                        <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500 font-mono">
                          UNAVAILABLE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                          NOT PRESENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reasons & Warnings Breakdown */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-zinc-300">
              Confidence Engine Telemetry & Reasoning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validation Affirmations</span>
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {result.confidence.reasons.map((r, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Diagnostic Warnings & Cautions</span>
                </span>
                {result.confidence.warnings.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No anomalies or suspicious tokens flagged.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {result.confidence.warnings.map((w, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
