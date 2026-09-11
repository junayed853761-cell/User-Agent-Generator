import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  SearchCode,
  Database,
  History,
  Settings,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'generate' | 'analyze' | 'sources' | 'history' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  totalRecords?: number;
  isHealthy?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRecords,
  isHealthy = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const tabs: { id: NavTab; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Platform telemetry & corpus metrics',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'generate',
      label: 'Generate',
      description: 'Zero-duplicate real-world user-agents',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'analyze',
      label: 'Analyze',
      description: 'Syntax & compatibility inspection',
      icon: <SearchCode className="w-4 h-4" />,
    },
    {
      id: 'sources',
      label: 'Sources',
      description: 'Dataset sync & provider health',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'History',
      description: 'Past generation batches & audit',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'API, database schema & scoring',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Main Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
          >
            <div className="relative flex items-center justify-center">
              {/* Professional Logo Asset */}
              <img
                src="/logo.svg"
                alt="UAForge Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-transform duration-200 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -inset-0.5 rounded-xl bg-emerald-500/20 blur-sm -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  UAForge
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700/80">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden sm:block tracking-tight">
                User-Agent Intelligence & Generation
              </p>
            </div>
          </div>

          {/* Desktop/PC Navigation Tabs (hidden on small phones) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all min-h-[40px] ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-zinc-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Status Pill (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center space-x-2 text-xs">
              {totalRecords !== undefined && (
                <div className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-mono">
                  <span className="text-zinc-500 mr-1.5">Corpus:</span>
                  <span className="text-emerald-400 font-semibold">{totalRecords}</span>
                </div>
              )}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="font-mono text-[11px] hidden lg:inline">
                  {isHealthy ? 'Live Consensus' : 'Degraded'}
                </span>
              </div>
            </div>

            {/* Mobile Compact Status Dot (Phone only) */}
            <div className="sm:hidden flex items-center space-x-1 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-emerald-400 font-bold">{totalRecords || 666}</span>
            </div>

            {/* Mobile Menu Toggle Button (Phone only, 44px touch target) */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fadeIn shadow-2xl">
            <div className="text-[11px] font-mono uppercase text-zinc-500 px-2 mb-1 flex items-center justify-between">
              <span>Navigation Menu</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Zero-Duplicate Active</span>
              </span>
            </div>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`mobile-nav-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl min-h-[50px] transition text-left ${
                    isActive
                      ? 'bg-zinc-900 text-white border border-emerald-500/40 shadow-sm'
                      : 'text-zinc-300 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isActive ? 'text-emerald-300' : 'text-zinc-200'}`}>
                        {tab.label}
                      </div>
                      <div className="text-xs text-zinc-400 line-clamp-1">{tab.description}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`}
                  />
                </button>
              );
            })}

            {/* Mobile System Corpus Summary in Drawer */}
            <div className="mt-4 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Verified Corpus Pool:</span>
              <span className="font-mono text-emerald-400 font-bold">{totalRecords || 666} Authentic Records</span>
            </div>
          </div>
        )}
      </header>

      {/* Persistent Mobile Bottom Navigation Bar (Ultra-convenient for smartphones) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-lg px-2 py-1 shadow-2xl safe-area-pb"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {tabs.slice(0, 5).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`bottom-nav-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg min-h-[48px] transition-colors ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`p-1 rounded-md transition-transform ${
                    isActive ? 'scale-110 text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

